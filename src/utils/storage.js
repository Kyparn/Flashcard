import AsyncStorage from "@react-native-async-storage/async-storage";
import { initialCategories, initialCards } from "../data/initialData";
import legacyCards from "../data/legacyCardFingerprints.json";
import { fingerprint } from "../../shared/catalog.cjs";

const DATA_VERSION = "v10_icon_fix";
const VERSION_KEY = "flashcard_data_version";
const CATEGORIES_KEY = "flashcard_categories";
const CARDS_KEY = "flashcard_cards";
const PROGRESS_KEY = "flashcard_progress";
const DELETED_CARDS_KEY = "flashcard_deleted_cards";

// Wipe and reseed if data version doesn't match (e.g. after removing food category)
export async function migrateIfNeeded() {
  const version = await AsyncStorage.getItem(VERSION_KEY);
  if (version !== DATA_VERSION) {
    await AsyncStorage.multiRemove([CATEGORIES_KEY, CARDS_KEY]);
    await AsyncStorage.setItem(VERSION_KEY, DATA_VERSION);
  }
}

export async function loadCategories() {
  const json = await AsyncStorage.getItem(CATEGORIES_KEY);
  if (json) return JSON.parse(json);
  await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(initialCategories));
  return initialCategories;
}

export async function saveCategories(categories) {
  await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

export async function loadCards() {
  const json = await AsyncStorage.getItem(CARDS_KEY);
  if (json) {
    const defaults = new Map(initialCards.map((card) => [card.id, card]));
    // Convert untouched old question cards, retaining personal edits and IDs.
    const saved = JSON.parse(json).map((card) => {
      const legacy = legacyCards[card.id];
      return legacy &&
        card.question === legacy.question &&
        fingerprint(card.answer) === legacy.answerHash
        ? { ...card, ...defaults.get(card.id) }
        : card;
    });
    const deleted = new Set(
      JSON.parse((await AsyncStorage.getItem(DELETED_CARDS_KEY)) || "[]"),
    );
    const savedIds = new Set(saved.map((c) => c.id));
    const merged = [
      ...saved,
      ...initialCards.filter((c) => !savedIds.has(c.id) && !deleted.has(c.id)),
    ];
    await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(merged));
    return merged;
  }
  await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(initialCards));
  return initialCards;
}

export async function saveCards(cards) {
  const ids = new Set(cards.map((c) => c.id));
  const deleted = initialCards.filter((c) => !ids.has(c.id)).map((c) => c.id);
  await AsyncStorage.multiSet([
    [CARDS_KEY, JSON.stringify(cards)],
    [DELETED_CARDS_KEY, JSON.stringify(deleted)],
  ]);
}

export async function loadProgress() {
  const json = await AsyncStorage.getItem(PROGRESS_KEY);
  return json ? JSON.parse(json) : {};
}

export async function saveProgress(progress) {
  await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export async function clearProgress() {
  await AsyncStorage.removeItem(PROGRESS_KEY);
}

export async function updateCardProgress(cardId, correct) {
  const progress = await loadProgress();
  const current = progress[cardId] || { correct: 0, incorrect: 0 };
  progress[cardId] = {
    correct: current.correct + (correct ? 1 : 0),
    incorrect: current.incorrect + (correct ? 0 : 1),
  };
  await saveProgress(progress);
  return progress;
}
