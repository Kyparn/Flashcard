import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { loadCards, loadCategories } from "../utils/storage";
import { catalog } from "../data/initialData";
import { colors, serif, ui } from "../theme";
const accents = [
  "#A18442",
  "#B6787E",
  "#8B9460",
  "#8F5152",
  "#9583A1",
  "#B38946",
  "#528C7D",
  "#9A7157",
];
export default function HomeScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [cards, setCards] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { width } = useWindowDimensions();
  const loadData = useCallback(async () => {
    try {
      const [cats, cds] = await Promise.all([loadCategories(), loadCards()]);
      setCategories(cats);
      setCards(cds);
      setError("");
    } catch {
      setError("Kunde inte läsa dina kort. Tryck för att försöka igen.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    loadData();
    return navigation.addListener("focus", loadData);
  }, [navigation, loadData]);
  const visible = categories.filter((cat) =>
    cat.name
      .toLocaleLowerCase("sv")
      .includes(search.trim().toLocaleLowerCase("sv")),
  );
  return (
    <SafeAreaView style={ui.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={ui.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.brandRow}>
          <View style={ui.row}>
            <View style={s.logo}>
              <Text style={s.logoText}>J.</Text>
            </View>
            <View>
              <Text style={s.brand}>RESTAURANG J</Text>
              <Text style={s.brandSub}>Kunskap bakom varje servering</Text>
            </View>
          </View>
          <View style={s.teamBadge}>
            <View style={s.dot} />
            <Text style={s.teamText}>TEAM J</Text>
          </View>
        </View>
        <View style={s.heading}>
          <Text style={ui.eyebrow}>DIN KUNSKAP. DIN TAKT.</Text>
          <Text style={ui.title}>
            Lite mer kunskap.{"\n"}Ännu bättre service.
          </Text>
          <Text style={[ui.body, { marginTop: 10 }]}>
            Lär känna sortimentet, ett kort i taget.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Öppna quizet 10 snabba"
          disabled={loading || !cards.length}
          onPress={() => navigation.navigate("Quiz")}
          style={({ pressed }) => [s.hero, pressed && ui.pressed]}
        >
          <View style={s.heroContent}>
            <View style={s.heroBadge}>
              <Ionicons name="flash-outline" size={13} color={colors.gold} />
              <Text style={s.heroEyebrow}>VAD KAN DU OM SORTIMENTET?</Text>
            </View>
            <Text style={s.heroTitle}>Redo för nästa servering?</Text>
            <Text style={s.heroBody}>
              10 frågor. 20 sekunder per fråga. Utmana teamet.
            </Text>
            <View style={s.heroCta}>
              <Text style={s.heroCtaText}>Spela 10 snabba</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.ink} />
            </View>
          </View>
          {width > 430 && (
            <View style={s.heroArt}>
              <MaterialCommunityIcons
                name="glass-wine"
                size={98}
                color={colors.gold}
              />
              <View style={s.artLine} />
              <Text style={s.artText}>SMAK FÖR KUNSKAP</Text>
            </View>
          )}
        </Pressable>
        <View style={s.stats}>
          {[
            [cards.length, "informationskort", "layers-outline"],
            [catalog.grapes.length, "druvor", "leaf-outline"],
            [categories.length, "kategorier", "grid-outline"],
          ].map(([value, label, icon]) => (
            <View key={label} style={s.stat}>
              <Ionicons name={icon} size={19} color={colors.muted} />
              <Text style={s.statValue}>{value}</Text>
              <Text style={s.statLabel}>{label}</Text>
            </View>
          ))}
        </View>
        <View style={s.sectionRow}>
          <View>
            <Text style={s.sectionTitle}>Utforska sortimentet</Text>
            <Text style={[ui.body, { marginTop: 3 }]}>
              Vad vill du lära dig idag?
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate("Manage")}
            style={s.manage}
          >
            <Ionicons name="create-outline" size={17} color={colors.primary} />
            <Text style={s.manageText}>Hantera kort</Text>
          </Pressable>
        </View>
        <View style={ui.search}>
          <Ionicons name="search-outline" size={19} color={colors.muted} />
          <TextInput
            accessibilityLabel="Sök kategori"
            style={ui.searchInput}
            placeholder="Sök en kategori…"
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={setSearch}
          />
          {search !== "" && (
            <Pressable
              accessibilityLabel="Rensa sökning"
              accessibilityRole="button"
              onPress={() => setSearch("")}
              hitSlop={10}
            >
              <Ionicons name="close-circle" size={19} color={colors.muted} />
            </Pressable>
          )}
        </View>
        {loading && (
          <ActivityIndicator color={colors.primary} style={{ padding: 30 }} />
        )}
        {error !== "" && (
          <Pressable onPress={loadData}>
            <Text style={ui.error}>{error}</Text>
          </Pressable>
        )}
        <View style={s.grid}>
          {visible.map((cat) => {
            const catCards = cards.filter((c) => c.categoryId === cat.id);
            const accent = accents[categories.indexOf(cat) % accents.length];
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${cat.name}, ${catCards.length} informationskort`}
                key={cat.id}
                onPress={() => navigation.navigate("Study", { category: cat })}
                style={({ pressed }) => [
                  s.category,
                  { width: width >= 800 ? "23.5%" : "48%" },
                  pressed && ui.pressed,
                ]}
              >
                <View style={s.cardTop}>
                  <View
                    style={[s.categoryIcon, { backgroundColor: accent + "16" }]}
                  >
                    <MaterialCommunityIcons
                      name={cat.icon || "cards-outline"}
                      size={30}
                      color={accent}
                    />
                  </View>
                  <Ionicons
                    name="arrow-forward"
                    size={17}
                    color={colors.muted}
                  />
                </View>
                <Text style={s.categoryTitle}>{cat.name}</Text>
                <Text style={s.categoryCount}>{catCards.length} kort</Text>
                <Text style={s.cardFoot}>Öppna informationskort</Text>
              </Pressable>
            );
          })}
        </View>
        {!loading && visible.length === 0 && (
          <Text style={[ui.body, { paddingVertical: 28, textAlign: "center" }]}>
            Ingen kategori matchar din sökning.
          </Text>
        )}
        <View style={s.footer}>
          <Ionicons name="leaf-outline" size={15} color={colors.muted} />
          <Text style={s.footerText}>Små steg. Mer kunskap. Varje dag.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: { color: "#fff", fontFamily: serif, fontSize: 30 },
  brand: {
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: "800",
    color: colors.ink,
  },
  brandSub: { fontSize: 10, color: colors.muted, marginTop: 5 },
  teamBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#709875" },
  teamText: {
    fontSize: 9,
    letterSpacing: 1,
    color: colors.muted,
    fontWeight: "700",
  },
  heading: { marginVertical: 28 },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: 22,
    padding: 25,
    flexDirection: "row",
    overflow: "hidden",
  },
  heroContent: { flex: 1 },
  heroBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroEyebrow: {
    color: colors.gold,
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: "700",
    flexShrink: 1,
  },
  heroTitle: { fontFamily: serif, color: "#fff", fontSize: 27, marginTop: 16 },
  heroBody: { color: "#CFD9CC", fontSize: 13, lineHeight: 21, marginTop: 8 },
  heroCta: {
    backgroundColor: "#F2EDDF",
    borderRadius: 11,
    padding: 14,
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    alignSelf: "flex-start",
  },
  heroCtaText: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  heroArt: {
    width: 180,
    justifyContent: "center",
    alignItems: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#456652",
    marginLeft: 20,
  },
  artLine: {
    height: 1,
    width: 90,
    backgroundColor: colors.gold,
    marginVertical: 12,
  },
  artText: { color: colors.gold, fontSize: 8, letterSpacing: 2 },
  stats: {
    flexDirection: "row",
    marginTop: 22,
    marginBottom: 32,
    paddingVertical: 19,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  stat: { flex: 1, alignItems: "center", gap: 5 },
  statValue: { fontSize: 25, fontWeight: "600", color: colors.ink },
  statLabel: { fontSize: 10, color: colors.muted },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
    flexWrap: "wrap",
  },
  sectionTitle: { fontSize: 23, fontFamily: serif, color: colors.ink },
  manage: { flexDirection: "row", gap: 6, alignItems: "center", minHeight: 44 },
  manageText: { fontSize: 12, fontWeight: "600", color: colors.primary },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
    marginTop: 18,
  },
  category: {
    padding: 18,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryIcon: {
    width: 49,
    height: 49,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryTitle: {
    color: colors.ink,
    fontSize: 21,
    fontFamily: serif,
    marginTop: 18,
  },
  categoryCount: { fontSize: 12, color: colors.muted, marginTop: 5 },
  track: {
    height: 3,
    backgroundColor: colors.soft,
    borderRadius: 4,
    marginTop: 20,
    overflow: "hidden",
  },
  fill: { height: "100%" },
  cardFoot: { fontSize: 10, color: colors.muted, marginTop: 9 },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    paddingTop: 27,
  },
  footerText: { fontSize: 11, color: colors.muted },
});
