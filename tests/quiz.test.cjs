const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { createQuizServer } = require("../server/index.cjs");
const { makeQuestions, flavorFamily } = require("../server/quiz-bank.cjs");
const catalog = require("../src/data/catalog.json");
const { describeDrink, catalogCards } = require("../shared/catalog.cjs");

test("catalog has unique IDs, valid relations and usable information for all cards", () => {
  for (const collection of ["categories", "drinks", "grapes", "flavors"])
    assert.equal(
      new Set(catalog[collection].map((x) => x.id)).size,
      catalog[collection].length,
    );
  const categories = new Set(catalog.categories.map((c) => c.id)),
    grapes = new Set(catalog.grapes.map((g) => g.id)),
    flavors = new Set(catalog.flavors.map((f) => f.id));
  assert.equal(catalog.drinks.length, 96);
  for (const drink of catalog.drinks) {
    assert.ok(categories.has(drink.categoryId));
    assert.ok(drink.name);
    assert.ok(drink.description);
    for (const grape of drink.grapes) assert.ok(grapes.has(grape.grapeId));
    for (const flavor of drink.flavorIds) assert.ok(flavors.has(flavor));
    assert.ok(!describeDrink(drink, catalog).includes("undefined"));
  }
  assert.equal(catalogCards(catalog).length, 96);
  assert.ok(
    catalog.drinks
      .find((d) => d.id === "c4")
      .grapes.some((g) => g.grapeId === "grape-chardonnay"),
  );
});

test("quiz makes 10 unique drinks with four grape, three taste and three origin questions", () => {
  for (let n = 0; n < 50; n++) {
    const questions = makeQuestions(catalog);
    assert.equal(questions.length, 10);
    assert.equal(new Set(questions.map((q) => q.drinkId)).size, 10);
    assert.equal(questions.filter((q) => q.topic === "grapes").length, 4);
    assert.equal(questions.filter((q) => q.topic === "flavors").length, 3);
    assert.equal(questions.filter((q) => q.topic === "origin").length, 3);
    for (const q of questions) {
      const drink = catalog.drinks.find((d) => d.id === q.drinkId);
      assert.equal(q.options.length, 4);
      assert.equal(new Set(q.options.map((o) => o.id)).size, 4);
      assert.ok(q.options.some((o) => o.id === q.correctOptionId));
      if (q.topic === "grapes")
        assert.equal(
          q.options.filter((o) => drink.grapes.some((g) => g.grapeId === o.id))
            .length,
          1,
        );
      if (q.topic === "flavors") {
        assert.equal(
          q.options.filter((o) => drink.flavorIds.includes(o.id)).length,
          1,
        );
        const families = new Set(
          drink.flavorIds.map((id) =>
            flavorFamily(catalog.flavors.find((f) => f.id === id).name),
          ),
        );
        for (const o of q.options.filter((o) => o.id !== q.correctOptionId))
          assert.ok(!families.has(flavorFamily(o.label)));
      }
    }
  }
});

test("server enforces deadlines, required answers, idempotency, names and persistent leaderboard", async (t) => {
  await fs.mkdir(".expo/test-data", { recursive: true });
  const directory = await fs.mkdtemp(path.resolve(".expo/test-data/quiz-"));
  const dataFile = path.join(directory, "quiz.json");
  let clock = 100000;
  const factory = () =>
    Array.from({ length: 10 }, (_, i) => ({
      id: `q-${i}`,
      drinkId: `d-${i}`,
      drinkName: `Drink ${i}`,
      topic: "grapes",
      category: "Wine",
      prompt: "Choose",
      options: [
        { id: "yes", label: "Correct" },
        { id: "no", label: "Wrong" },
        { id: "other", label: "Other" },
        { id: "last", label: "Last" },
      ],
      correctOptionId: "yes",
      explanation: "Correct explanation",
    }));
  let server = await createQuizServer({
    dataFile,
    now: () => clock,
    questionFactory: factory,
  });
  const listen = () =>
    new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  await listen();
  let base = `http://127.0.0.1:${server.address().port}`;
  t.after(() => new Promise((resolve) => server.close(resolve)));
  async function call(route, body) {
    const r = await fetch(base + "/api" + route, {
      method: body === undefined ? "GET" : "POST",
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: r.status, data: await r.json() };
  }
  const start = await call("/rounds", { requestId: "test-start-00000001" });
  assert.equal(start.status, 201);
  let round = start.data;
  assert.equal(round.status, "question");
  assert.equal(round.question.correctOptionId, undefined);
  assert.equal(round.question.explanation, undefined);
  const id = round.id;
  assert.equal(
    (await call("/rounds", { requestId: "test-start-00000001" })).data.id,
    id,
  );
  assert.equal(
    (await call(`/rounds/${id}/publish`, { name: "Test" })).status,
    409,
  );
  assert.equal(
    (await call(`/rounds/${id}/answer`, { questionId: "q-0", optionId: null }))
      .status,
    400,
  );
  assert.equal(
    (
      await call(`/rounds/${id}/answer`, {
        questionId: "q-0",
        optionId: "invented",
      })
    ).status,
    400,
  );
  clock += 20001;
  const expired = await call(`/rounds/${id}/answer`, {
    questionId: "q-0",
    optionId: "yes",
    score: 999,
  });
  assert.equal(expired.data.feedback.correct, false);
  assert.equal(expired.data.feedback.timedOut, true);
  assert.equal(expired.data.feedback.elapsedMs, 20000);
  await call(`/rounds/${id}/next`, { questionId: "q-0" });
  const repeated = await call(`/rounds/${id}/next`, { questionId: "q-0" });
  assert.equal(repeated.data.index, 1);
  for (let i = 1; i < 10; i++) {
    clock += 500;
    const submitted = await Promise.all([
      call(`/rounds/${id}/answer`, { questionId: `q-${i}`, optionId: "yes" }),
      call(`/rounds/${id}/answer`, { questionId: `q-${i}`, optionId: "yes" }),
    ]);
    assert.ok(submitted.every((r) => r.status === 200));
    round = (await call(`/rounds/${id}/next`, { questionId: `q-${i}` })).data;
  }
  assert.equal(round.status, "complete");
  assert.equal(round.result.score, 9);
  assert.equal(round.result.elapsedMs, 24500);
  assert.equal((await call("/leaderboard")).data.entries.length, 0);
  assert.equal(
    (await call(`/rounds/${id}/publish`, { name: " " })).status,
    400,
  );
  assert.equal(
    (await call(`/rounds/${id}/publish`, { name: "  Simon  " })).status,
    200,
  );
  await call(`/rounds/${id}/publish`, { name: "Changed name" });
  let entries = (await call("/leaderboard")).data.entries;
  assert.equal(entries.length, 1);
  assert.equal(entries[0].name, "Simon");
  assert.equal(entries[0].attempts, 1);
  await new Promise((resolve) => server.close(resolve));
  server = await createQuizServer({
    dataFile,
    now: () => clock,
    questionFactory: factory,
  });
  await listen();
  base = `http://127.0.0.1:${server.address().port}`;
  entries = (await call("/leaderboard")).data.entries;
  assert.equal(entries[0].score, 9);
  assert.equal((await call(`/rounds/${id}`)).data.result.name, "Simon");
  async function finishAnother(requestId, name, correctCount, answerMs) {
    const started = await call("/rounds", { requestId });
    const roundId = started.data.id;
    for (let i = 0; i < 10; i++) {
      clock += answerMs;
      assert.equal(
        (
          await call(`/rounds/${roundId}/answer`, {
            questionId: `q-${i}`,
            optionId: i < correctCount ? "yes" : "no",
          })
        ).status,
        200,
      );
      await call(`/rounds/${roundId}/next`, { questionId: `q-${i}` });
    }
    await call(`/rounds/${roundId}/publish`, { name });
  }
  await finishAnother("test-start-00000002", "simon", 8, 100);
  entries = (await call("/leaderboard")).data.entries;
  assert.equal(entries.length, 1);
  assert.equal(entries[0].score, 9);
  assert.equal(entries[0].attempts, 2);
  await finishAnother("test-start-00000003", "Alex", 9, 400);
  entries = (await call("/leaderboard")).data.entries;
  assert.equal(entries[0].name, "Alex");
  assert.equal(entries[0].rank, 1);
  assert.equal(entries[1].name, "Simon");
  const blocked = await fetch(base + "/api/leaderboard", {
    headers: { Origin: "https://unrelated.example" },
  });
  assert.equal(blocked.status, 403);
});
