import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createRound, answerRound, nextQuestion } from "../../shared/practice-quiz.cjs";
import { catalog } from "../data/initialData";
import { colors, serif, ui } from "../theme";
const topics = { grapes: "DRUVOR", flavors: "SMAKER", origin: "URSPRUNG" };
const formatTime = (ms) => `${(ms / 1000).toFixed(1).replace(".", ",")} s`;
export default function QuizScreen() {
  const [round, setRound] = useState(null);
  const [selected, setSelected] = useState(null);
  const [clock, setClock] = useState(Date.now());
  const [error, setError] = useState("");
  const current = useRef(null), scroll = useRef(null);
  const busy = false;
  function applyRound(value) {
    current.current = value;
    setRound(value);
    setSelected(null);
    setClock(Date.now());
    scroll.current?.scrollTo({ y: 0, animated: false });
  }
  useEffect(() => {
    if (round?.status !== "question") return;
    const interval = setInterval(() => setClock(Date.now()), 200);
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active") setClock(Date.now());
    });
    return () => { clearInterval(interval); listener.remove(); };
  }, [round?.status, round?.question.id]);
  const seconds = round?.deadline ? Math.max(0, Math.ceil((round.deadline - clock) / 1000)) : 20;
  function action(kind, body) {
    const active = current.current;
    if (!active || active.question.id !== body.questionId) return;
    applyRound(kind === "answer"
      ? answerRound(active, body.optionId, Date.now())
      : nextQuestion(active, Date.now()));
  }
  useEffect(() => {
    if (round?.status === "question" && seconds === 0)
      action("answer", { questionId: round.question.id, optionId: null });
  }, [seconds, round?.status, round?.question.id]);
  function start() {
    try { setError(""); applyRound(createRound(catalog)); }
    catch (failure) { setError(failure.message); }
  }
  function newRound() { setError(""); applyRound(null); }
  const feedback = round?.feedback, completed = round?.status === "complete";
  return (
    <SafeAreaView style={ui.screen} edges={["top"]}>

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
          {!round ? (
            <>
              <View style={s.welcomeIcon}>
                <Ionicons name="flash-outline" size={48} color={colors.gold} />
              </View>
              <Text style={[s.title, { fontSize: 38 }]}>
                Vad kan du om{"\n"}vårt sortiment?
              </Text>
              <Text style={[ui.body, { marginTop: 12 }]}>
                Öva på egen hand. Läs på i dryckesbiblioteket och
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
                  ["checkmark-circle-outline", "Se ditt resultat direkt – inget sparas"],
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
                disabled={busy}
                style={[ui.button, busy && s.disabled]}
                onPress={start}
              >
                <Ionicons name="play" size={17} color="#fff" />
                <Text style={ui.buttonText}>
                  {busy ? "Förbereder quizet…" : "Starta 10 snabba"}
                </Text>
              </Pressable>
              <Text style={s.note}>
                Resultatet visas bara för dig och sparas inte.{"\n"}Tid
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
              <View style={s.panel}>
                <Text style={ui.body}>Resultatet sparas inte. Öva gärna en gång till!</Text>
                <Pressable accessibilityRole="button" onPress={newRound} style={[ui.button, { marginTop: 18 }]}>
                  <Text style={ui.buttonText}>Spela igen</Text>
                </Pressable>
              </View>
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
          {!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
        </ScrollView>

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
