import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ACTIVE_ROUND_KEY,
  NAME_KEY,
  apiRequest,
  formatTime,
  getServerUrl,
  setServerUrl,
} from "../utils/quizApi";
import { colors, serif, ui } from "../theme";
const topics = { grapes: "DRUVOR", flavors: "SMAKER", origin: "URSPRUNG" };
export default function QuizScreen({ navigation }) {
  const [server, setServer] = useState("");
  const [serverDraft, setServerDraft] = useState("");
  const [settings, setSettings] = useState(false);
  const [round, setRound] = useState(null);
  const [selected, setSelected] = useState(null);
  const [deadline, setDeadline] = useState(null);
  const [clock, setClock] = useState(Date.now());
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false),
    autoSubmitted = useRef(false),
    startKey = useRef(null),
    scroll = useRef(null);
  function applyRound(data) {
    setRound(data);
    setSelected(null);
    setDeadline(
      data.deadline ? Date.now() + data.deadline - data.serverNow : null,
    );
    setClock(Date.now());
    autoSubmitted.current = false;
    scroll.current?.scrollTo({ y: 0, animated: false });
  }
  async function initialize() {
    setLoading(true);
    setError("");
    try {
      const [url, saved, savedName] = await Promise.all([
        getServerUrl(),
        AsyncStorage.getItem(ACTIVE_ROUND_KEY),
        AsyncStorage.getItem(NAME_KEY),
      ]);
      setServer(url);
      setServerDraft(url);
      setName(savedName || "");
      setSettings(!url);
      if (saved) {
        const active = JSON.parse(saved);
        if (active.url === url) {
          startKey.current = active.requestId;
          let data;
          try {
            data = active.id
              ? await apiRequest(url, `/rounds/${active.id}`)
              : await apiRequest(url, "/rounds", {
                  method: "POST",
                  body: { requestId: active.requestId },
                });
          } catch (e) {
            if (e.status === 404) {
              await AsyncStorage.removeItem(ACTIVE_ROUND_KEY);
              startKey.current = null;
              setError(
                "Din tidigare runda finns inte längre. Du kan starta en ny.",
              );
              return;
            }
            throw e;
          }
          await AsyncStorage.setItem(
            ACTIVE_ROUND_KEY,
            JSON.stringify({ ...active, id: data.id }),
          );
          applyRound(data);
        }
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    initialize();
  }, []);
  useEffect(() => {
    if (round?.status !== "question") return;
    const interval = setInterval(() => setClock(Date.now()), 200);
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active") setClock(Date.now());
    });
    return () => {
      clearInterval(interval);
      listener.remove();
    };
  }, [round?.status, round?.question.id]);
  const seconds = deadline
    ? Math.max(0, Math.ceil((deadline - clock) / 1000))
    : 20;
  async function action(kind, body) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const data = await apiRequest(server, `/rounds/${round.id}/${kind}`, {
        method: "POST",
        body,
      });
      applyRound(data);
      if (kind === "publish")
        await AsyncStorage.setItem(NAME_KEY, data.result.name);
    } catch (e) {
      setError(e.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    if (
      round?.status === "question" &&
      seconds === 0 &&
      !autoSubmitted.current &&
      !busy &&
      !error
    ) {
      autoSubmitted.current = true;
      action("answer", { questionId: round.question.id, optionId: null });
    }
  }, [seconds, round?.status, busy, error]);
  async function start() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const key =
        startKey.current ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
      startKey.current = key;
      await AsyncStorage.setItem(
        ACTIVE_ROUND_KEY,
        JSON.stringify({ url: server, requestId: key }),
      );
      const data = await apiRequest(server, "/rounds", {
        method: "POST",
        body: { requestId: key },
      });
      await AsyncStorage.setItem(
        ACTIVE_ROUND_KEY,
        JSON.stringify({ url: server, requestId: key, id: data.id }),
      );
      applyRound(data);
    } catch (e) {
      setError(e.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function connect() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const health = await apiRequest(
        serverDraft.trim().replace(/\/$/, ""),
        "/health",
      );
      if (!health.ok) throw new Error("Servern är inte redo.");
      const url = await setServerUrl(serverDraft);
      if (url !== server) {
        await AsyncStorage.removeItem(ACTIVE_ROUND_KEY);
        startKey.current = null;
        setRound(null);
      }
      setServer(url);
      setSettings(false);
    } catch (e) {
      setError(e.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function newRound() {
    try {
      await AsyncStorage.removeItem(ACTIVE_ROUND_KEY);
      startKey.current = null;
      setRound(null);
      setError("");
    } catch {
      setError("Kunde inte förbereda en ny runda. Försök igen.");
    }
  }
  const feedback = round?.feedback,
    completed = round?.status === "complete";
  return (
    <SafeAreaView style={ui.screen} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scroll}
          contentContainerStyle={[ui.content, { maxWidth: 760, flexGrow: 1 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.header}>
            <View>
              <Text style={ui.eyebrow}>TEAM J · QUIZ</Text>
              <Text style={s.headerTitle}>10 snabba</Text>
            </View>
            {!round && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Anslutning till quizserver"
                style={ui.iconButton}
                onPress={() => setSettings((v) => !v)}
              >
                <Ionicons
                  name="settings-outline"
                  size={20}
                  color={colors.primary}
                />
              </Pressable>
            )}
            {round && !completed && (
              <View
                style={[
                  s.timer,
                  seconds <= 5 &&
                    round.status === "question" && {
                      backgroundColor: "#F7E7DF",
                    },
                ]}
              >
                <Ionicons
                  name="timer-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text accessibilityLiveRegion="none" style={s.timerText}>
                  {round.status === "feedback" ? "Paus" : `${seconds} s`}
                </Text>
              </View>
            )}
          </View>
          {loading ? (
            <ActivityIndicator
              style={{ marginTop: 60 }}
              color={colors.primary}
            />
          ) : settings ? (
            <View style={s.panel}>
              <Text style={s.title}>Anslut till quizet</Text>
              <Text style={ui.body}>
                Ange serveradressen som teamet använder. På lokalt nätverk
                behöver mobilen och servern vara anslutna till samma wifi.
              </Text>
              <TextInput
                accessibilityLabel="Quizserverns adress"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                style={[ui.input, { marginVertical: 18 }]}
                placeholder="http://192.168.1.20:3001"
                value={serverDraft}
                onChangeText={setServerDraft}
              />
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                style={ui.button}
                onPress={connect}
              >
                <Text style={ui.buttonText}>
                  {busy ? "Ansluter…" : "Anslut"}
                </Text>
              </Pressable>
            </View>
          ) : !round ? (
            <>
              <View style={s.welcomeIcon}>
                <Ionicons name="flash-outline" size={48} color={colors.gold} />
              </View>
              <Text style={[s.title, { fontSize: 38 }]}>
                Vad kan du om{"\n"}vårt sortiment?
              </Text>
              <Text style={[ui.body, { marginTop: 12 }]}>
                Utmana dig själv och kollegorna. Läs på i dryckesbiblioteket och
                sätt sedan kunskapen på prov.
              </Text>
              <View style={s.panel}>
                {[
                  ["wine-outline", "4 druvor · 3 smaker · 3 ursprung"],
                  ["timer-outline", "20 sekunder per fråga"],
                  [
                    "checkbox-outline",
                    "Ett rätt alternativ – markera och bekräfta",
                  ],
                  ["person-outline", "Skriv ditt namn när du är klar"],
                ].map(([icon, label]) => (
                  <View style={[ui.row, { marginVertical: 9 }]} key={label}>
                    <Ionicons name={icon} size={21} color={colors.primary} />
                    <Text style={[ui.body, { flex: 1, color: colors.ink }]}>
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
              <Pressable
                accessibilityRole="button"
                disabled={busy || !server}
                style={[ui.button, (busy || !server) && s.disabled]}
                onPress={start}
              >
                <Ionicons name="play" size={17} color="#fff" />
                <Text style={ui.buttonText}>
                  {busy ? "Förbereder quizet…" : "Starta 10 snabba"}
                </Text>
              </Pressable>
              <Text style={s.note}>
                Flest rätt vinner. Vid lika resultat avgör svarstiden.{"\n"}Tid
                mellan frågorna räknas inte.
              </Text>
            </>
          ) : completed ? (
            <>
              <View style={s.welcomeIcon}>
                <Ionicons name="trophy-outline" size={46} color={colors.gold} />
              </View>
              <Text style={s.title}>Snyggt, du är i mål!</Text>
              <View style={s.resultRow}>
                <View>
                  <Text style={s.score}>
                    {round.result.score}
                    <Text style={{ fontSize: 22, color: colors.muted }}>
                      {" "}
                      / 10
                    </Text>
                  </Text>
                  <Text style={ui.body}>rätta svar</Text>
                </View>
                <View>
                  <Text style={s.duration}>
                    {formatTime(round.result.elapsedMs)}
                  </Text>
                  <Text style={ui.body}>sammanlagd svarstid</Text>
                </View>
              </View>
              {round.result.publishedAt ? (
                <View style={s.panel}>
                  <View style={ui.row}>
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={colors.primary}
                    />
                    <Text style={[ui.body, { flex: 1, color: colors.ink }]}>
                      Sparat för {round.result.name}!
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => navigation.navigate("Topplista")}
                    style={[ui.button, { marginTop: 20 }]}
                  >
                    <Text style={ui.buttonText}>Se teamets topplista</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={newRound}
                    style={[
                      ui.button,
                      { marginTop: 12, backgroundColor: colors.soft },
                    ]}
                  >
                    <Text style={[ui.buttonText, { color: colors.primary }]}>
                      Spela igen
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View style={s.panel}>
                  <Text style={s.subheading}>Vem ska få äran?</Text>
                  <Text style={ui.body}>
                    Skriv ditt namn för att spara resultatet och tävla med
                    teamet. Använd samma namn varje gång.
                  </Text>
                  <TextInput
                    accessibilityLabel="Ditt namn"
                    style={[ui.input, { marginVertical: 18 }]}
                    placeholder="Ditt namn"
                    value={name}
                    onChangeText={setName}
                    maxLength={40}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                  <Pressable
                    accessibilityRole="button"
                    disabled={busy || name.trim().length < 2}
                    style={[
                      ui.button,
                      (busy || name.trim().length < 2) && s.disabled,
                    ]}
                    onPress={() => action("publish", { name })}
                  >
                    <Text style={ui.buttonText}>
                      {busy ? "Sparar…" : "Spara på topplistan"}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    disabled={busy}
                    onPress={newRound}
                    style={{ padding: 16, alignItems: "center" }}
                  >
                    <Text style={ui.body}>Börja om utan att spara</Text>
                  </Pressable>
                </View>
              )}
            </>
          ) : (
            <>
              <View style={s.progressHeader}>
                <Text style={ui.eyebrow}>
                  FRÅGA {round.index + 1} AV {round.total}
                </Text>
                <Text style={ui.eyebrow}>{topics[round.question.topic]}</Text>
              </View>
              <View style={s.track}>
                <View
                  style={[
                    s.fill,
                    { width: `${((round.index + 1) / round.total) * 100}%` },
                  ]}
                />
              </View>
              <View style={s.panel}>
                <Text style={ui.eyebrow}>{round.question.category}</Text>
                <Text style={[s.title, { fontSize: 27, marginTop: 12 }]}>
                  {round.question.drinkName}
                </Text>
                <Text style={s.prompt}>{round.question.prompt}</Text>
                {round.question.options.map((option) => {
                  const checked =
                    selected === option.id ||
                    (feedback && feedback.optionId === option.id);
                  const correct = feedback?.correctOptionId === option.id;
                  return (
                    <Pressable
                      accessibilityRole="checkbox"
                      aria-checked={!!checked}
                      accessibilityState={{
                        checked: !!checked,
                        disabled:
                          round.status !== "question" || busy || seconds === 0,
                      }}
                      key={option.id}
                      disabled={
                        round.status !== "question" || busy || seconds === 0
                      }
                      onPress={() => setSelected(option.id)}
                      style={[
                        s.option,
                        checked && s.selected,
                        correct && {
                          backgroundColor: colors.soft,
                          borderColor: colors.primary,
                        },
                      ]}
                    >
                      <Ionicons
                        name={checked ? "checkbox" : "square-outline"}
                        size={22}
                        color={colors.primary}
                      />
                      <Text style={s.optionText}>{option.label}</Text>
                      {correct && (
                        <Ionicons
                          name="checkmark-circle"
                          size={21}
                          color={colors.primary}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </View>
              {round.status === "feedback" ? (
                <>
                  <View
                    style={[
                      s.feedback,
                      feedback.correct
                        ? { backgroundColor: colors.soft }
                        : { backgroundColor: "#F7EDE5" },
                    ]}
                  >
                    <Text style={s.subheading}>
                      {feedback.timedOut
                        ? "Tiden tog slut"
                        : feedback.correct
                          ? "Helt rätt!"
                          : "Inte riktigt den här gången"}
                    </Text>
                    <Text style={ui.body}>{feedback.explanation}</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    disabled={busy}
                    style={ui.button}
                    onPress={() =>
                      action("next", { questionId: round.question.id })
                    }
                  >
                    <Text style={ui.buttonText}>
                      {busy
                        ? "Laddar…"
                        : round.index === round.total - 1
                          ? "Se mitt resultat"
                          : "Nästa fråga"}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </Pressable>
                </>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  disabled={busy || (!selected && seconds > 0)}
                  style={[
                    ui.button,
                    (busy || (!selected && seconds > 0)) && s.disabled,
                  ]}
                  onPress={() =>
                    action("answer", {
                      questionId: round.question.id,
                      optionId: seconds === 0 ? null : selected,
                    })
                  }
                >
                  <Text style={ui.buttonText}>
                    {busy
                      ? "Kontrollerar…"
                      : seconds === 0
                        ? "Fortsätt efter tidsgränsen"
                        : "Bekräfta svar"}
                  </Text>
                </Pressable>
              )}
              <Text style={s.note}>
                {round.status === "question"
                  ? "Markera ett alternativ. Svaret räknas först när du bekräftar."
                  : "Ta en stund att läsa förklaringen. Nästa timer startar när du går vidare."}
              </Text>
            </>
          )}
          {!!error && (
            <View style={s.error}>
              <Text accessibilityRole="alert" style={ui.error}>
                {error}
              </Text>
              {!settings && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setSettings(true)}
                  style={[
                    ui.button,
                    { marginBottom: 12, backgroundColor: colors.soft },
                  ]}
                >
                  <Text style={[ui.buttonText, { color: colors.primary }]}>
                    Kontrollera anslutningen
                  </Text>
                </Pressable>
              )}
              {!round && !settings && (
                <Pressable
                  accessibilityRole="button"
                  onPress={initialize}
                  style={ui.button}
                >
                  <Text style={ui.buttonText}>Försök återansluta</Text>
                </Pressable>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  headerTitle: {
    fontFamily: serif,
    fontSize: 30,
    color: colors.ink,
    marginTop: 6,
  },
  title: { fontFamily: serif, fontSize: 32, color: colors.ink, lineHeight: 40 },
  subheading: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.ink,
    marginBottom: 8,
  },
  welcomeIcon: {
    width: 90,
    height: 90,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  panel: {
    padding: 22,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
    marginVertical: 22,
  },
  note: {
    fontSize: 12,
    lineHeight: 20,
    color: colors.muted,
    textAlign: "center",
    marginVertical: 18,
  },
  disabled: { opacity: 0.4 },
  timer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.soft,
  },
  timerText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 18,
    fontVariant: ["tabular-nums"],
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  track: {
    height: 4,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginTop: 12,
  },
  fill: { height: "100%", backgroundColor: colors.primary, borderRadius: 3 },
  prompt: {
    fontSize: 16,
    lineHeight: 25,
    fontWeight: "600",
    color: colors.ink,
    marginTop: 20,
    marginBottom: 18,
  },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
    minHeight: 58,
  },
  selected: { borderColor: colors.primary, backgroundColor: colors.soft },
  optionText: { flex: 1, color: colors.ink, fontSize: 15, lineHeight: 23 },
  feedback: { borderRadius: 18, padding: 20, marginBottom: 22 },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginTop: 28,
  },
  score: { fontSize: 56, fontWeight: "700", color: colors.primary },
  duration: { fontSize: 26, color: colors.ink, fontWeight: "600" },
  error: { marginTop: 12 },
});
