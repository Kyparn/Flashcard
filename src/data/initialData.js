import catalog from "./catalog.json";
import { catalogCards } from "../../shared/catalog.cjs";
import { syncCardsWithInventory } from "./inventorySync";

// Stable drink, grape and flavor IDs live in catalog.json.
// question/answer are compatibility fields for previously saved personal cards.
export const initialCategories = catalog.categories;
export const initialCards = syncCardsWithInventory(catalogCards(catalog));
export { catalog };
