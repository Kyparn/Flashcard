import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
const URL_KEY = "team_j_quiz_server";
export const ACTIVE_ROUND_KEY = "team_j_active_quiz";
export const NAME_KEY = "team_j_quiz_name";
export function defaultServerUrl() {
  if (process.env.EXPO_PUBLIC_API_URL)
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "");
  if (Platform.OS === "web")
    return __DEV__
      ? `${window.location.protocol}//${window.location.hostname}:3001`
      : window.location.origin;
  return "";
}
export async function getServerUrl() {
  return (await AsyncStorage.getItem(URL_KEY)) || defaultServerUrl();
}
export async function setServerUrl(value) {
  const input = value.trim().replace(/\/$/, "");
  let url;
  try {
    url = new URL(input);
  } catch {
    throw new Error(
      "Ange en fullständig adress, till exempel http://192.168.1.20:3001.",
    );
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  )
    throw new Error(
      "Ange serverns http- eller https-adress utan extra sökväg.",
    );
  await AsyncStorage.setItem(URL_KEY, input);
  return input;
}
export async function apiRequest(base, path, { method = "GET", body } = {}) {
  if (!base) throw new Error("Ange serveradressen under kugghjulet på Quiz-fliken först.");
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${base}/api${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error(
        "Sidan kan inte hämta innehållet eftersom serverdelen saknas eller inte svarar på den här adressen. Kontrollera anslutningen under kugghjulet på Quiz-fliken.",
      );
    }
    if (!response.ok) {
      const error = new Error(data.error || "Något gick fel. Försök igen.");
      error.status = response.status;
      throw error;
    }
    return data;
  } catch (error) {
    if (error.name === "AbortError" || error instanceof TypeError)
      throw new Error(
        "Kan inte nå servern. Kontrollera anslutningen och serveradressen under kugghjulet på Quiz-fliken.",
      );
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
export function formatTime(ms) {
  return `${(ms / 1000).toFixed(1).replace(".", ",")} s`;
}
