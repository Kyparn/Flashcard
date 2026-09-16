import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiRequest, formatTime, getServerUrl } from "../utils/quizApi";
import { colors, serif, ui } from "../theme";
export default function LeaderboardScreen({ navigation }) {
  const [entries, setEntries] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const url = await getServerUrl();
      const data = await apiRequest(url, "/leaderboard");
      setEntries(data.entries);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
    return navigation.addListener("focus", load);
  }, [navigation, load]);
  return (
    <SafeAreaView style={ui.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={[ui.content, { maxWidth: 820 }]}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={colors.primary}
          />
        }
      >
        <View style={s.header}>
          <View>
            <Text style={ui.eyebrow}>LITE VÄNSKAPLIG TÄVLING</Text>
            <Text style={ui.title}>Teamets topplista</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Uppdatera topplistan"
            onPress={load}
            style={ui.iconButton}
          >
            <Ionicons name="refresh-outline" size={22} color={colors.primary} />
          </Pressable>
        </View>
        <Text style={[ui.body, { marginTop: 14 }]}>
          Ditt bästa resultat räknas. Flest rätt först, snabbast svarstid vid
          lika antal rätt. Alla spelar 10 frågor med 20 sekunder per fråga.
        </Text>
        {!!error && (
          <View style={s.empty}>
            <Text style={ui.error}>{error}</Text>
            <Pressable
              accessibilityRole="button"
              style={ui.button}
              onPress={load}
            >
              <Text style={ui.buttonText}>Försök igen</Text>
            </Pressable>
            <Text style={[ui.body, { marginTop: 14 }]}>
              Du kan ändra serveradress under inställningar i Quiz.
            </Text>
          </View>
        )}
        {!error && entries.length > 0 && (
          <>
            <View style={s.champion}>
              <Ionicons name="trophy-outline" size={45} color={colors.gold} />
              <Text style={s.championLabel}>LEDER JUST NU</Text>
              <Text style={s.championName}>{entries[0].name}</Text>
              <Text style={s.championScore}>
                {entries[0].score} av 10 rätt ·{" "}
                {formatTime(entries[0].elapsedMs)}
              </Text>
            </View>
            <View style={s.labels}>
              <Text style={ui.eyebrow}>PERSONAL</Text>
              <Text style={ui.eyebrow}>BÄSTA RUNDA</Text>
            </View>
            {entries.map((entry) => (
              <View key={entry.id} style={s.row}>
                <Text style={s.rank}>
                  {String(entry.rank).padStart(2, "0")}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{entry.name}</Text>
                  <Text style={s.small}>
                    {entry.attempts}{" "}
                    {entry.attempts === 1 ? "sparad runda" : "sparade rundor"}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={s.points}>{entry.score} / 10</Text>
                  <Text style={s.small}>{formatTime(entry.elapsedMs)}</Text>
                </View>
              </View>
            ))}
          </>
        )}
        {!loading && !error && entries.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="podium-outline" size={54} color={colors.primary} />
            <Text style={s.emptyTitle}>Första platsen är ledig.</Text>
            <Text style={[ui.body, { textAlign: "center", marginBottom: 24 }]}>
              Spela quizet och skriv ditt namn efteråt för att bli först på
              listan.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate("Quiz")}
              style={ui.button}
            >
              <Text style={ui.buttonText}>Spela 10 snabba</Text>
            </Pressable>
          </View>
        )}
        {loading && entries.length === 0 && (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  champion: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    alignItems: "center",
    padding: 30,
    marginVertical: 26,
  },
  championLabel: {
    color: colors.gold,
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 16,
  },
  championName: {
    fontFamily: serif,
    fontSize: 35,
    color: "#fff",
    marginTop: 12,
    textAlign: "center",
  },
  championScore: { color: "#DAE2D6", fontSize: 15, marginTop: 10 },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  rank: { fontSize: 19, fontWeight: "600", color: colors.muted },
  name: { color: colors.ink, fontSize: 17, fontWeight: "600" },
  small: { color: colors.muted, fontSize: 12, marginTop: 5 },
  points: { color: colors.primary, fontSize: 18, fontWeight: "700" },
  empty: { paddingVertical: 46, alignItems: "center" },
  emptyTitle: {
    fontFamily: serif,
    fontSize: 29,
    color: colors.ink,
    marginVertical: 20,
  },
});
