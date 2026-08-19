import AsyncStorage from '@react-native-async-storage/async-storage';
import { initialCategories, initialCards } from '../data/initialData';

const DATA_VERSION = 'v10_icon_fix';
const VERSION_KEY = 'flashcard_data_version';
const CATEGORIES_KEY = 'flashcard_categories';
const CARDS_KEY = 'flashcard_cards';
const PROGRESS_KEY = 'flashcard_progress';

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
    const saved = JSON.parse(json);
    const savedIds = new Set(saved.map((c) => c.id));
    const merged = [...saved, ...initialCards.filter((c) => !savedIds.has(c.id))];
    await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(merged));
    return merged;
  }
  await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(initialCards));
  return initialCards;
}

export async function saveCards(cards) {
  await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(cards));
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
