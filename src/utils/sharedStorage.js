import { apiRequest, getServerUrl } from "./quizApi";

async function load(kind) {
  return (await apiRequest(await getServerUrl(), `/${kind}`)).items;
}
async function save(kind, next, previous) {
  const before = new Map(previous.map((item) => [item.id, item]));
  const after = new Map(next.map((item) => [item.id, item]));
  const changes = [...new Set([...before.keys(), ...after.keys()])]
    .map((id) => ({ id, before: before.get(id) || null, after: after.get(id) || null }))
    .filter((change) => JSON.stringify(change.before) !== JSON.stringify(change.after));
  return (await apiRequest(await getServerUrl(), `/${kind}`, {
    method: "POST",
    body: { changes },
  })).items;
}
export const loadCategories = () => load("categories");
export const loadCards = () => load("cards");
export const saveCards = (next, previous) => save("cards", next, previous);
export const loadItems = () => load("inventory");
export const persistItems = (next, previous) => save("inventory", next, previous);
