import { catalog, initialCards } from "../data/initialData";
const drinksById = new Map(catalog.drinks.map((drink) => [drink.id, drink]));
const defaultCards = new Map(initialCards.map((card) => [card.id, card]));
const grapesById = new Map(catalog.grapes.map((grape) => [grape.id, grape]));
const flavorsById = new Map(
  catalog.flavors.map((flavor) => [flavor.id, flavor]),
);
export function drinkName(card) {
  return card.question;
}
export function drinkDetails(card) {
  const drink = drinksById.get(card.id);
  if (!drink || defaultCards.get(card.id)?.answer !== card.answer) return null;
  return {
    ...drink,
    grapeLabels: drink.grapes.map(
      (link) =>
        `${grapesById.get(link.grapeId).name}${link.note ? ` ${link.note}` : ""}`,
    ),
    flavorLabels: drink.flavorIds.map((id) => flavorsById.get(id).name),
  };
}
