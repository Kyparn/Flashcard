import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, serif, ui } from "../theme";
export default function FlipCard({ question, answer, revealed, onReveal }) {
  return (
    <View style={s.card}>
      <View style={s.top}>
        <View style={s.badge}>
          <Ionicons
            name={revealed ? "checkmark-circle-outline" : "help-circle-outline"}
            size={15}
            color={colors.primary}
          />
          <Text style={s.label}>
            {revealed ? "SVARET" : "FUNDERA EN STUND"}
          </Text>
        </View>
        <Ionicons name="wine-outline" size={25} color={colors.muted} />
      </View>
      <Text style={s.question}>{question}</Text>
      {revealed ? (
        <View style={s.answer}>
          <Text style={s.answerText}>{answer}</Text>
        </View>
      ) : (
        <View style={s.prompt}>
          <View style={s.rule} />
          <Text style={ui.body}>Vad vet du om den här drycken?</Text>
        </View>
      )}
      {!revealed && (
        <Pressable
          accessibilityRole="button"
          onPress={onReveal}
          style={[ui.button, { marginTop: 30 }]}
        >
          <Ionicons name="eye-outline" size={18} color="#fff" />
          <Text style={ui.buttonText}>Visa svaret</Text>
        </Pressable>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 26,
    minHeight: 330,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 38,
  },
  badge: {
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: 20,
    padding: 10,
  },
  label: {
    fontSize: 9,
    letterSpacing: 1,
    color: colors.primary,
    fontWeight: "700",
  },
  question: {
    fontFamily: serif,
    fontSize: 29,
    lineHeight: 39,
    color: colors.ink,
  },
  prompt: { marginTop: 22 },
  rule: {
    backgroundColor: colors.gold,
    width: 40,
    height: 2,
    marginBottom: 18,
  },
  answer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 22,
    marginTop: 24,
  },
  answerText: { color: colors.ink, fontSize: 16, lineHeight: 28 },
});
