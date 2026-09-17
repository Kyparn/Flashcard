const { isDeepStrictEqual } = require("node:util");
const catalog = require("../src/data/catalog.json");
const inventory = require("../src/data/inventering-produkter.json");
const { catalogCards } = require("../shared/catalog.cjs");

function check(condition, message, status = 400) {
  if (!condition) throw Object.assign(new Error(message), { status });
}
function initialLibrary() {
  return { cards: catalogCards(catalog), inventory: structuredClone(inventory) };
}
function validateItem(kind, item) {
  check(item && typeof item === "object" && !Array.isArray(item), "Ogiltig post.");
  check(typeof item.id === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(item.id), "Ogiltigt ID.");
  const text = (value, max) => typeof value === "string" && value.trim().length > 0 && value.length <= max;
  if (kind === "cards") {
    check(text(item.question, 300) && text(item.answer, 20000), "Kortet behöver namn och information (högst 300 respektive 20 000 tecken).");
    check(catalog.categories.some((c) => c.id === item.categoryId), "Kategorin finns inte.");
  } else {
    check(text(item.name, 300), "Varan behöver ett namn på högst 300 tecken.");
    check(["Sprit", "Öl fat", "Öl flaska", "Cider", "Gas", "Vin", "Skumpa"].includes(item.category), "Ogiltig varukategori.");
    check(["cl", "l", "st"].includes(item.unit), "Ogiltig enhet.");
    if (item.subcategory !== undefined)
      check(text(item.subcategory, 100), "Ogiltig underkategori.");
    for (const flag of ["isBottle", "glassMode"])
      if (item[flag] !== undefined) check(typeof item[flag] === "boolean", "Ogiltig flaskinställning.");
    check(typeof item.price === "number" && Number.isFinite(item.price) && item.price >= 0 && item.price <= 10000000, "Priset måste vara ett positivt tal eller noll.");
    check(typeof item.qty === "string" && item.qty.length <= 20 && /^\d*(?:[.,]\d*)?$/.test(item.qty), "Ange ett giltigt antal, till exempel 2 eller 2,5.");
    if (item.glassesPerBottle !== undefined)
      check(typeof item.glassesPerBottle === "number" && Number.isFinite(item.glassesPerBottle) && item.glassesPerBottle > 0 && item.glassesPerBottle <= 1000, "Ogiltigt antal glas per flaska.");
    if (item.glassMode || ["Vin", "Skumpa"].includes(item.category))
      check(item.unit === "st" && item.isBottle === true, "Vin och skumpa måste anges som flaskor med antal i glas.");
  }
  check(JSON.stringify(item).length <= 30000, "Posten innehåller för mycket data.");
}

// Compare each touched record with the client's snapshot. Unrelated edits merge;
// a conflicting batch is rejected atomically by the store transaction.
function changeLibrary(state, kind, body) {
  check(body && Array.isArray(body.changes) && body.changes.length <= 2000, "Ogiltiga ändringar.");
  const items = new Map(state.library[kind].map((item) => [item.id, item]));
  const seen = new Set();
  for (const change of body.changes) {
    check(change && typeof change.id === "string" && !seen.has(change.id), "Ogiltigt eller dubblerat ID.");
    seen.add(change.id);
    check(change.before === null || (change.before && change.before.id === change.id), "Tidigare version saknas.");
    check(change.after === null || (change.after && change.after.id === change.id), "Ny version saknas.");
    if (change.after !== null) validateItem(kind, change.after);
    const current = items.get(change.id) || null;
    if (isDeepStrictEqual(current, change.after)) continue; // Safe retry after a lost response.
    check(isDeepStrictEqual(current, change.before), "Någon annan har ändrat samma post. Hämta senaste versionen och gör ändringen igen.", 409);
    if (change.after === null) items.delete(change.id);
    else items.set(change.id, change.after);
  }
  check(items.size <= 10000, "Biblioteket är fullt.");
  state.library[kind] = [...items.values()];
  return { items: state.library[kind] };
}
module.exports = { initialLibrary, changeLibrary };
