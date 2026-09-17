import AsyncStorage from "@react-native-async-storage/async-storage";
import inventory from "../data/inventering-produkter.json";
import * as localCards from "./storage";

// Card edits and inventory stay on this device. Quiz results are never stored.
export const loadCategories = localCards.loadCategories;
export const loadCards = localCards.loadCards;
export async function saveCards(next) {
  await localCards.saveCards(next);
  return next;
}
const INVENTORY_KEY = "team_j_device_inventory";
export async function loadItems() {
  const saved = await AsyncStorage.getItem(INVENTORY_KEY);
  return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(inventory));
}
export async function persistItems(next) {
  await AsyncStorage.setItem(INVENTORY_KEY, JSON.stringify(next));
  return next;
}
