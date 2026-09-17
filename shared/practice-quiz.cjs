const { makeQuestions } = require("./quiz-bank.cjs");
const QUESTION_MS = 20000;
function createRound(catalog, now = Date.now()) {
  const questions = makeQuestions(catalog);
  return {
    questions, question: questions[0], index: 0, total: questions.length,
    answers: [], status: "question", startedAt: now, deadline: now + QUESTION_MS,
    feedback: null,
  };
}
function answerRound(round, optionId, now = Date.now()) {
  if (round.status !== "question") return round;
  const timedOut = now >= round.deadline;
  if (!timedOut && !round.question.options.some((o) => o.id === optionId)) return round;
  const feedback = {
    optionId: timedOut ? null : optionId,
    correct: !timedOut && optionId === round.question.correctOptionId,
    correctOptionId: round.question.correctOptionId,
    explanation: round.question.explanation,
    elapsedMs: Math.min(QUESTION_MS, Math.max(0, now - round.startedAt)),
    timedOut,
  };
  return { ...round, status: "feedback", feedback, answers: [...round.answers, feedback] };
}
function nextQuestion(round, now = Date.now()) {
  if (round.status !== "feedback") return round;
  if (round.index === round.total - 1) {
    return { ...round, status: "complete", result: {
      score: round.answers.filter((a) => a.correct).length,
      elapsedMs: round.answers.reduce((sum, a) => sum + a.elapsedMs, 0),
    } };
  }
  const index = round.index + 1;
  return { ...round, index, question: round.questions[index], status: "question",
    feedback: null, startedAt: now, deadline: now + QUESTION_MS };
}
module.exports = { createRound, answerRound, nextQuestion, QUESTION_MS };
