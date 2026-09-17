const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { setTimeout: delay } = require("node:timers/promises");
const catalog = require("../src/data/catalog.json");
const { makeQuestions } = require("./quiz-bank.cjs");
const { initialLibrary, changeLibrary } = require("./library.cjs");
const QUESTION_MS = 20000;
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
function assert(condition, message, status = 400) {
  if (!condition) throw new ApiError(status, message);
}
async function createStore(file) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  let state;
  try {
    state = JSON.parse(await fs.readFile(file, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    state = { version: 1, rounds: {} };
  }
  if (state.version !== 1 || !state.rounds)
    throw new Error("Unsupported quiz database.");
  let queue = Promise.resolve();
  return {
    read: () => state,
    transact(action) {
      const job = queue
        .catch(() => {})
        .then(async () => {
          const next = structuredClone(state);
          const result = action(next);
          const serialized = JSON.stringify(next);
          if (serialized === JSON.stringify(state)) return result;
          const temporary = `${file}.${randomUUID()}.tmp`;
          try {
            await fs.writeFile(temporary, serialized, "utf8");
            // Windows virus scanners can briefly hold a just-written file open.
            // Keep the original intact while retrying the atomic replacement.
            for (let attempt = 0; ; attempt++) {
              try {
                await fs.rename(temporary, file);
                break;
              } catch (error) {
                if (
                  attempt >= 5 ||
                  !["EPERM", "EBUSY", "EACCES"].includes(error.code)
                )
                  throw error;
                await delay(40 * (attempt + 1));
              }
            }
          } catch (error) {
            await fs.rm(temporary, { force: true }).catch(() => {});
            throw error;
          }
          state = next;
          return result;
        });
      queue = job;
      return job;
    },
  };
}
function summarize(round) {
  return {
    id: round.id,
    name: round.name || null,
    score: round.answers.filter((a) => a.correct).length,
    total: round.questions.length,
    elapsedMs: round.answers.reduce((sum, a) => sum + a.elapsedMs, 0),
    completedAt: round.completedAt || null,
    publishedAt: round.publishedAt || null,
  };
}
function publicRound(round, now) {
  const q = round.questions[round.index];
  const { correctOptionId, explanation, ...question } = q;
  const feedback = round.answers.find((a) => a.questionId === q.id);
  return {
    id: round.id,
    status: round.status,
    index: round.index,
    total: round.questions.length,
    serverNow: now,
    deadline:
      round.status === "question"
        ? round.questionStartedAt + QUESTION_MS
        : null,
    question,
    feedback: feedback ? { ...feedback, correctOptionId, explanation } : null,
    result: round.status === "complete" ? summarize(round) : null,
  };
}
function leaderboard(state) {
  const players = new Map();
  for (const round of Object.values(state.rounds)) {
    if (!round.publishedAt) continue;
    const result = summarize(round),
      key = round.name.normalize("NFKC").toLocaleLowerCase("sv");
    const entry = players.get(key);
    if (!entry) {
      players.set(key, { ...result, attempts: 1 });
      continue;
    }
    const attempts = entry.attempts + 1;
    const better =
      result.score > entry.score ||
      (result.score === entry.score && result.elapsedMs < entry.elapsedMs);
    players.set(key, better ? { ...result, attempts } : { ...entry, attempts });
  }
  return [...players.values()]
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.elapsedMs - b.elapsedMs ||
        a.publishedAt - b.publishedAt,
    )
    .map((r, index) => ({ ...r, rank: index + 1 }));
}
async function readBody(req, limit = 8192) {
  let size = 0,
    parts = [];
  for await (const part of req) {
    size += part.length;
    if (size > limit) throw new ApiError(413, "För mycket data.");
    parts.push(part);
  }
  try {
    const body = JSON.parse(Buffer.concat(parts).toString("utf8") || "{}");
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new Error("Expected object");
    return body;
  } catch {
    throw new ApiError(400, "Ogiltig JSON.");
  }
}
function json(res, status, value) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(value));
}
function allowOrigin(req, res, allowed) {
  const origin = req.headers.origin;
  if (!origin) return;
  let incoming, host;
  try {
    incoming = new URL(origin);
    host = new URL(`http://${req.headers.host}`).hostname;
  } catch {
    throw new ApiError(403, "Otillåtet ursprung.");
  }
  const loopback = (h) => ["localhost", "127.0.0.1", "[::1]"].includes(h);
  const localMatch =
    incoming.hostname === host ||
    (loopback(incoming.hostname) && loopback(host));
  assert(
    (["http:", "https:"].includes(incoming.protocol) && localMatch) ||
      allowed.includes(origin),
    "Otillåtet ursprung.",
    403,
  );
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
async function createQuizServer({
  dataFile = path.join(
    process.env.DATA_DIR || path.join(__dirname, "data"),
    "quiz.json",
  ),
  now = Date.now,
  questionFactory = () => makeQuestions(catalog),
  allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .filter(Boolean),
  webRoot = path.resolve(__dirname, "../dist"),
} = {}) {
  const store = await createStore(dataFile);
  await store.transact((state) => {
    if (!state.library) state.library = initialLibrary();
  });
  const server = http.createServer(async (req, res) => {
    try {
      allowOrigin(req, res, allowedOrigins);
      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }
      const url = new URL(req.url, "http://local");
      if (url.pathname === "/api/categories") {
        assert(req.method === "GET", "Metoden stöds inte.", 405);
        json(res, 200, { items: catalog.categories });
        return;
      }
      const collection = url.pathname.match(/^\/api\/(cards|inventory)$/);
      if (collection) {
        const kind = collection[1];
        if (req.method === "GET") {
          json(res, 200, { items: store.read().library[kind] });
          return;
        }
        assert(req.method === "POST", "Metoden stöds inte.", 405);
        const body = await readBody(req, 2 * 1024 * 1024);
        const result = await store.transact((state) => changeLibrary(state, kind, body));
        json(res, 200, result);
        return;
      }
      if (req.method === "GET" && url.pathname === "/api/health") {
        json(res, 200, { ok: true, questionSeconds: QUESTION_MS / 1000 });
        return;
      }
      if (req.method === "GET" && url.pathname === "/api/catalog") {
        json(res, 200, catalog);
        return;
      }
      if (req.method === "GET" && url.pathname === "/api/leaderboard") {
        json(res, 200, {
          entries: leaderboard(store.read()),
          serverNow: now(),
        });
        return;
      }
      if (req.method === "POST" && url.pathname === "/api/rounds") {
        const body = await readBody(req);
        assert(
          typeof body.requestId === "string" &&
            /^[a-zA-Z0-9-]{16,100}$/.test(body.requestId),
          "En giltig startnyckel krävs.",
        );
        const response = await store.transact((state) => {
          const existing = Object.values(state.rounds).find(
            (r) => r.requestId === body.requestId,
          );
          if (existing) return publicRound(existing, now());
          const stamp = now(),
            id = randomUUID();
          const round = {
            id,
            requestId: body.requestId,
            questions: questionFactory(),
            answers: [],
            index: 0,
            status: "question",
            questionStartedAt: stamp,
            startedAt: stamp,
          };
          state.rounds[id] = round;
          return publicRound(round, stamp);
        });
        json(res, 201, response);
        return;
      }
      const match = url.pathname.match(
        /^\/api\/rounds\/([a-f0-9-]{36})(?:\/(answer|next|publish))?$/,
      );
      if (match) {
        const [, id, action] = match;
        if (req.method === "GET" && !action) {
          const round = store.read().rounds[id];
          assert(round, "Quizomgången finns inte längre.", 404);
          json(res, 200, publicRound(round, now()));
          return;
        }
        assert(req.method === "POST" && action, "Metoden stöds inte.", 405);
        const body = await readBody(req);
        const response = await store.transact((state) => {
          const round = state.rounds[id];
          assert(round, "Quizomgången finns inte längre.", 404);
          const stamp = now(),
            q = round.questions[round.index];
          if (action === "answer") {
            const prior = round.answers.find(
              (a) => a.questionId === body.questionId,
            );
            if (prior) return publicRound(round, stamp);
            assert(
              round.status === "question" && q.id === body.questionId,
              "Frågan är inte aktiv.",
              409,
            );
            const elapsed = Math.max(0, stamp - round.questionStartedAt),
              timedOut = elapsed >= QUESTION_MS;
            assert(
              body.optionId == null ||
                q.options.some((o) => o.id === body.optionId),
              "Svarsalternativet finns inte.",
            );
            assert(
              timedOut || typeof body.optionId === "string",
              "Välj ett svar innan du fortsätter.",
            );
            round.answers.push({
              questionId: q.id,
              optionId: timedOut ? null : body.optionId,
              correct: !timedOut && body.optionId === q.correctOptionId,
              timedOut,
              elapsedMs: Math.min(elapsed, QUESTION_MS),
            });
            round.status = "feedback";
          } else if (action === "next") {
            // A retried next request must not skip a question or restart its clock.
            if (
              round.status === "complete" ||
              (round.answers.some((a) => a.questionId === body.questionId) &&
                q.id !== body.questionId)
            )
              return publicRound(round, stamp);
            assert(
              round.status === "feedback" && body.questionId === q.id,
              "Svara på frågan först.",
              409,
            );
            if (round.index === round.questions.length - 1) {
              round.status = "complete";
              round.completedAt = stamp;
            } else {
              round.index++;
              round.status = "question";
              round.questionStartedAt = stamp;
            }
          } else if (action === "publish") {
            assert(
              round.status === "complete",
              "Slutför quizet innan du sparar resultatet.",
              409,
            );
            if (round.publishedAt) return publicRound(round, stamp);
            const name =
              typeof body.name === "string"
                ? body.name.trim().replace(/\s+/g, " ")
                : "";
            assert(
              name.length >= 2 &&
                name.length <= 40 &&
                !/[\x00-\x1f<>]/.test(name),
              "Skriv ett namn med 2–40 tecken.",
            );
            round.name = name;
            round.publishedAt = stamp;
          }
          return publicRound(round, stamp);
        });
        json(res, 200, response);
        return;
      }
      if (url.pathname.startsWith("/api/"))
        throw new ApiError(404, "Sidan finns inte.");
      if (req.method !== "GET" && req.method !== "HEAD")
        throw new ApiError(405, "Metoden stöds inte.");
      const relative = decodeURIComponent(url.pathname).replace(/^\/+/, ""),
        target = path.resolve(webRoot, relative || "index.html");
      assert(
        target === webRoot || target.startsWith(webRoot + path.sep),
        "Ogiltig sökväg.",
        403,
      );
      let content,
        file = target;
      try {
        content = await fs.readFile(file);
      } catch (error) {
        if (!["ENOENT", "EISDIR"].includes(error.code)) throw error;
        file = path.join(webRoot, "index.html");
        try {
          content = await fs.readFile(file);
        } catch {
          throw new ApiError(
            404,
            "Webbversionen är inte byggd. Kör npm run build:web eller öppna Expo.",
          );
        }
      }
      const types = {
        ".html": "text/html; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
        ".json": "application/json",
        ".css": "text/css",
        ".ttf": "font/ttf",
        ".png": "image/png",
        ".ico": "image/x-icon",
      };
      res.writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control":
          path.extname(file) === ".html" ? "no-cache" : "public, max-age=3600",
      });
      res.end(req.method === "HEAD" ? undefined : content);
    } catch (error) {
      if (res.headersSent) {
        res.end();
        return;
      }
      if (!error.status) console.error(error);
      json(res, error.status || 500, {
        error: error.status
          ? error.message
          : "Kunde inte spara eller läsa data. Försök igen.",
      });
    }
  });
  return server;
}
if (require.main === module) {
  createQuizServer()
    .then((server) => {
      const port = Number(process.env.PORT) || 3001,
        host = process.env.HOST || "127.0.0.1";
      server.listen(port, host, () =>
        console.log(`Quiz server: http://${host}:${port}`),
      );
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
module.exports = { createQuizServer, QUESTION_MS };
