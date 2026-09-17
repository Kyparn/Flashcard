const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { createQuizServer } = require("../server/index.cjs");

async function fixture(t) {
  const root = path.resolve(".expo/test-data");
  await fs.mkdir(root, { recursive: true });
  const directory = await fs.mkdtemp(path.join(root, "library-"));
  const dataFile = path.join(directory, "quiz.json");
  // Exercise migration of an existing quiz database, including preserved data.
  await fs.writeFile(dataFile, JSON.stringify({ version: 1, rounds: {}, marker: "preserved" }));
  let server;
  let base;
  async function start() {
    server = await createQuizServer({ dataFile });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    base = `http://127.0.0.1:${server.address().port}/api`;
  }
  async function stop() {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
  t.after(async () => {
    if (server.listening) await stop();
    assert.ok(path.resolve(directory).startsWith(root + path.sep));
    await fs.rm(directory, { recursive: true, force: true });
  });
  await start();
  async function request(route, body) {
    const response = await fetch(base + route, body === undefined ? {} : {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    return { status: response.status, data: await response.json() };
  }
  return { request, restart: async () => { await stop(); await start(); }, dataFile };
}
const change = (before, after) => ({ id: (before || after).id, before, after });

test("shared cards support creation, edits, deletion, safe retries and survive restart", async (t) => {
  const { request, restart, dataFile } = await fixture(t);
  const categories = (await request("/categories")).data.items;
  const initial = (await request("/cards")).data.items;
  assert.equal(initial.length, 96);
  const card = { id: "team-card", categoryId: categories[0].id, question: "Teamets kort", answer: "Gemensam information" };
  const addition = { changes: [change(null, card)] };
  assert.equal((await request("/cards", addition)).status, 200);
  assert.equal((await request("/cards", addition)).data.items.length, 97);
  const edited = { ...card, answer: "Uppdaterad information" };
  assert.equal((await request("/cards", { changes: [change(card, edited)] })).status, 200);
  await restart();
  assert.deepEqual((await request("/cards")).data.items.find((c) => c.id === card.id), edited);
  const deletion = { changes: [change(edited, null)] };
  assert.equal((await request("/cards", deletion)).data.items.length, 96);
  assert.equal((await request("/cards", deletion)).status, 200);
  // Deleting a seeded card must not cause reseeding after a restart.
  await request("/cards", { changes: [change(initial[0], null)] });
  await restart();
  assert.equal((await request("/cards")).data.items.length, 95);
  assert.equal(JSON.parse(await fs.readFile(dataFile, "utf8")).marker, "preserved");
});

test("two users can change different inventory rows but stale changes to the same row fail atomically", async (t) => {
  const { request, restart } = await fixture(t);
  const [a, b, c] = (await request("/inventory")).data.items;
  const updatedA = { ...a, qty: "2,5" }, updatedB = { ...b, price: b.price + 10 };
  const results = await Promise.all([
    request("/inventory", { changes: [change(a, updatedA)] }),
    request("/inventory", { changes: [change(b, updatedB)] }),
  ]);
  assert.ok(results.every((r) => r.status === 200));
  const conflict = await request("/inventory", { changes: [change(c, { ...c, qty: "8" }), change(a, { ...a, qty: "9" })] });
  assert.equal(conflict.status, 409);
  await restart();
  const saved = (await request("/inventory")).data.items;
  assert.deepEqual(saved.find((i) => i.id === a.id), updatedA);
  assert.deepEqual(saved.find((i) => i.id === b.id), updatedB);
  assert.deepEqual(saved.find((i) => i.id === c.id), c);
  // Lost-response retry and a new custom item use the same mutation contract.
  assert.equal((await request("/inventory", { changes: [change(a, updatedA)] })).status, 200);
  const added = { id: "new-item", name: "Testvara", category: "Sprit", unit: "cl", price: 3, qty: "" };
  assert.equal((await request("/inventory", { changes: [change(null, added)] })).status, 200);
  assert.equal((await request("/inventory", { changes: [change(added, null)] })).status, 200);
});

test("server rejects invalid shared data without changing saved records", async (t) => {
  const { request } = await fixture(t);
  const card = (await request("/cards")).data.items[0];
  const item = (await request("/inventory")).data.items[0];
  for (const after of [{ ...card, categoryId: "missing" }, { ...card, answer: "" }, { ...card, question: "x".repeat(301) }])
    assert.equal((await request("/cards", { changes: [change(card, after)] })).status, 400);
  for (const after of [{ ...item, price: -1 }, { ...item, qty: "-2" }, { ...item, glassesPerBottle: 0 }, { ...item, category: "unknown" }, { ...item, subcategory: {} }, { ...item, isBottle: "false" }])
    assert.equal((await request("/inventory", { changes: [change(item, after)] })).status, 400);
  for (const body of [null, [], {}, { changes: [null] }, { changes: [{ id: card.id, after: null }] }])
    assert.equal((await request("/cards", body)).status, 400);
  assert.equal((await request("/cards", { changes: [change(card, card), change(card, card)] })).status, 400);
  assert.deepEqual((await request("/cards")).data.items[0], card);
  assert.deepEqual((await request("/inventory")).data.items[0], item);
});
