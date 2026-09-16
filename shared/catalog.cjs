function describeDrink(drink, catalog) {
  const grapeNames = new Map(catalog.grapes.map((g) => [g.id, g.name]));
  const flavorNames = new Map(catalog.flavors.map((f) => [f.id, f.name]));
  const grapes = drink.grapes.map(
    (link) =>
      `${grapeNames.get(link.grapeId)}${link.note ? ` ${link.note}` : ""}`,
  );
  const flavors = drink.flavorIds.map((id) => flavorNames.get(id));
  return [
    drink.description,
    grapes.length ? `Druvor: ${grapes.join(", ")}.` : "",
    flavors.length ? `Smak: ${flavors.join(", ")}.` : "",
    drink.prices.glass ? `Glas: ${drink.prices.glass} kr` : "",
    drink.prices.bottle ? `Flaska: ${drink.prices.bottle} kr` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}
function catalogCards(catalog) {
  return catalog.drinks.map((drink) => ({
    id: drink.id,
    categoryId: drink.categoryId,
    question: drink.name,
    answer: describeDrink(drink, catalog),
    drinkId: drink.id,
  }));
}
function fingerprint(text) {
  let hash = 2166136261;
  for (const char of text)
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash >>> 0).toString(16);
}
module.exports = { describeDrink, catalogCards, fingerprint };
