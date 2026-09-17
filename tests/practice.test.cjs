const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createRound, answerRound, nextQuestion } = require("../shared/practice-quiz.cjs");
const catalog = require("../src/data/catalog.json");

test("practice completes ten questions locally, without names or publication", () => {
  let now = 1000, round = createRound(catalog, now);
  assert.equal(nextQuestion(round), round);
  assert.equal(answerRound(round, null, now), round);
  for (let i = 0; i < 10; i++) {
    assert.equal(round.index, i);
    now += 1000;
    round = answerRound(round, round.question.correctOptionId, now);
    assert.equal(round.feedback.correct, true);
    assert.ok(round.feedback.explanation);
    assert.equal(answerRound(round, 'again', now), round);
    now += 30000; // Reading explanations never counts against the next question.
    round = nextQuestion(round, now);
  }
  assert.equal(round.status, 'complete');
  assert.deepEqual(round.result, { score: 10, elapsedMs: 10000 });
  assert.equal(createRound(catalog, now).answers.length, 0);
});
test("practice counts a late answer as timeout, including after a backgrounded phone", () => {
  const round = createRound(catalog, 1000);
  const timed = answerRound(round, round.question.correctOptionId, 61000);
  assert.equal(timed.feedback.correct, false);
  assert.equal(timed.feedback.timedOut, true);
  assert.equal(timed.feedback.elapsedMs, 20000);
  assert.equal(timed.feedback.optionId, null);
  const next = nextQuestion(timed, 90000);
  assert.equal(next.deadline, 110000);
});
