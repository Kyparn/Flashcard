const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const babel = require("@babel/core");
function storageFixture(legacy = {}) {
  const values = new Map();
  const initialCards = [
    { id: "seed", categoryId: "one", question: "Original", answer: "Answer" },
  ];
  const storage = {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => values.set(key, value),
    removeItem: async (key) => values.delete(key),
    multiSet: async (entries) =>
      entries.forEach(([key, value]) => values.set(key, value)),
    multiRemove: async (keys) => keys.forEach((key) => values.delete(key)),
  };
  const code = babel.transformSync(
    fs.readFileSync("src/utils/storage.js", "utf8"),
    {
      configFile: false,
      babelrc: false,
      plugins: ["@babel/plugin-transform-modules-commonjs"],
    },
  ).code;
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require: (name) => {
      if (name.includes("async-storage")) return storage;
      if (name.includes("legacyCard")) return legacy;
      if (name.includes("catalog.cjs")) return require("../shared/catalog.cjs");
      return { initialCards, initialCategories: [{ id: "one" }] };
    },
  });
  return { api: exports, initialCards, values };
}
test("legacy information migrates by fingerprint while personal edits survive", async () => {
  const { fingerprint } = require("../shared/catalog.cjs");
  const { api, values } = storageFixture({
    seed: { question: "Old question?", answerHash: fingerprint("Old answer") },
  });
  values.set(
    "flashcard_cards",
    JSON.stringify([
      { id: "seed", question: "Old question?", answer: "Old answer" },
    ]),
  );
  assert.equal((await api.loadCards())[0].question, "Original");
  values.set(
    "flashcard_cards",
    JSON.stringify([
      { id: "seed", question: "Old question?", answer: "Personal changes" },
    ]),
  );
  assert.equal((await api.loadCards())[0].answer, "Personal changes");
});
test("deleted default cards stay deleted while new default cards are added", async () => {
  const { api, initialCards } = storageFixture();
  await api.loadCards();
  await api.saveCards([]);
  assert.equal((await api.loadCards()).length, 0);
  initialCards.push({
    id: "new",
    categoryId: "one",
    question: "New",
    answer: "Answer",
  });
  const loaded = await api.loadCards();
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].id, "new");
});
test("edits and custom cards survive loading", async () => {
  const { api } = storageFixture();
  await api.saveCards([
    { id: "seed", question: "Edited", answer: "Edited answer" },
    { id: "custom", question: "Custom" },
  ]);
  const loaded = await api.loadCards();
  assert.equal(loaded.length, 2);
  assert.equal(loaded[0].question, "Edited");
  assert.equal(loaded[1].id, "custom");
});
test("progress retains both known and review answers after reloading", async () => {
  const { api } = storageFixture();
  await api.updateCardProgress("seed", true);
  await api.updateCardProgress("seed", false);
  await api.updateCardProgress("seed", true);
  const progress = await api.loadProgress();
  assert.equal(progress.seed.correct, 2);
  assert.equal(progress.seed.incorrect, 1);
});
