// Runs on phones and in Node; quiz randomness is not a security boundary.
function shuffle(values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
const TASTE_IDS = new Set(
  [
    "citrus",
    "apple",
    "paron",
    "persika",
    "aprikos",
    "honung",
    "vanilj",
    "smor",
    "notter",
    "korsbar",
    "plommon",
    "choklad",
    "svarta-vinbar",
    "hallon",
    "jordgubbe",
    "mineral",
    "orter",
    "peppar",
    "lakrits",
    "tobak",
    "ceder",
    "mango",
    "melon",
    "petroleum",
    "flinta",
    "kaffe",
  ].map((id) => "flavor-" + id),
);
function flavorFamily(name) {
  if (/citr|citron|lime|grape|apelsin/.test(name)) return "citrus";
  if (/bär|bärig|hallon|jordgubb|smultron|cassis/.test(name)) return "berries";
  if (/äpp/.test(name)) return "apple";
  if (/persik|aprik|nektarin/.test(name)) return "stone-fruit";
  if (/mineral|krit|kalk|flint/.test(name)) return "mineral";
  if (/ek|vanil|ceder|tobak/.test(name)) return "oak";
  if (/nöt|mandel/.test(name)) return "nuts";
  if (/örter|örtig/.test(name)) return "herbs";
  return name;
}
function buildBank(catalog) {
  const bank = [];
  const categories = new Map(catalog.categories.map((c) => [c.id, c.name]));
  const flavorById = new Map(catalog.flavors.map((f) => [f.id, f]));
  const countries = [
    ...new Set(catalog.drinks.map((d) => d.country).filter(Boolean)),
  ].map((name) => ({ id: name, label: name }));
  for (const drink of catalog.drinks) {
    const add = (topic, stem, correct, candidates, explanation) => {
      if (candidates.length < 3) return;
      bank.push({
        id: `${topic}:${drink.id}`,
        drinkId: drink.id,
        drinkName: drink.name,
        category: categories.get(drink.categoryId),
        topic,
        prompt: stem,
        options: shuffle([correct, ...shuffle(candidates).slice(0, 3)]),
        correctOptionId: correct.id,
        explanation,
      });
    };
    if (drink.grapes.length) {
      const ids = new Set(drink.grapes.map((g) => g.grapeId));
      const linked = catalog.grapes.filter((g) => ids.has(g.id));
      const hasMuscatLabel = linked.some((g) => /muscat|moscato/i.test(g.name));
      const grape = shuffle(linked)[0];
      add(
        "grapes",
        "Vilken av dessa druvor ingår i vinet?",
        { id: grape.id, label: grape.name },
        catalog.grapes
          .filter(
            (g) =>
              !ids.has(g.id) &&
              !(hasMuscatLabel && /muscat|moscato/i.test(g.name)),
          )
          .map((g) => ({ id: g.id, label: g.name })),
        `Druvor enligt dryckeskortet: ${linked.map((g) => g.name).join(", ")}.`,
      );
    }
    const flavors = drink.flavorIds
      .map((id) => flavorById.get(id))
      .filter(Boolean);
    const eligible = flavors.filter((f) => TASTE_IDS.has(f.id));
    if (eligible.length) {
      const flavor = shuffle(eligible)[0];
      const families = new Set(flavors.map((f) => flavorFamily(f.name)));
      const alternatives = catalog.flavors
        .filter(
          (f) => TASTE_IDS.has(f.id) && !families.has(flavorFamily(f.name)),
        )
        .map((f) => ({ id: f.id, label: f.name }));
      add(
        "flavors",
        "Vilken smakton nämns i vårt dryckeskort?",
        { id: flavor.id, label: flavor.name },
        alternatives,
        `Smaktoner enligt dryckeskortet: ${flavors.map((f) => f.name).join(", ")}.`,
      );
    }
    if (drink.country) {
      add(
        "origin",
        "Från vilket land kommer drycken?",
        { id: drink.country, label: drink.country },
        countries.filter((c) => c.id !== drink.country),
        `${drink.name} kommer från ${drink.country}.`,
      );
    }
  }
  return bank;
}
function makeQuestions(catalog) {
  const bank = buildBank(catalog);
  const chosen = [],
    used = new Set();
  for (const [topic, count] of [
    ["grapes", 4],
    ["flavors", 3],
    ["origin", 3],
  ]) {
    for (const q of shuffle(bank.filter((q) => q.topic === topic))) {
      if (used.has(q.drinkId)) continue;
      chosen.push(q);
      used.add(q.drinkId);
      if (chosen.filter((q) => q.topic === topic).length === count) break;
    }
  }
  if (chosen.length !== 10)
    throw new Error(
      "Quizet behöver minst tio olika drycker med tillräcklig information.",
    );
  return shuffle(chosen);
}
module.exports = { buildBank, makeQuestions, flavorFamily };
