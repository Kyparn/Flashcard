import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { loadCards } from "../utils/storage";
import { drinkName, drinkDetails } from "../utils/drinks";
import { colors, serif, ui } from "../theme";

export default function StudyScreen({ route, navigation }) {
  const { category } = route.params;
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const scroll = useRef(null);
  useEffect(() => {
    let active = true;
    loadCards()
      .then((all) => {
        if (active) setCards(all.filter((c) => c.categoryId === category.id));
      })
      .catch(() => {
        if (active)
          setError("Kunde inte läsa dryckerna. Gå tillbaka och försök igen.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [category.id]);
  const filtered = cards.filter((c) =>
    `${drinkName(c)} ${c.answer}`
      .toLocaleLowerCase("sv")
      .includes(search.trim().toLocaleLowerCase("sv")),
  );
  const card = filtered[index];
  const details = card ? drinkDetails(card) : null;
  function go(next) {
    setIndex(next);
    scroll.current?.scrollTo({ y: 0, animated: false });
  }
  return (
    <SafeAreaView style={ui.screen} edges={["top"]}>
      <ScrollView
        ref={scroll}
        contentContainerStyle={[ui.content, { maxWidth: 760 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tillbaka till kategorier"
            style={ui.iconButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color={colors.ink} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={ui.eyebrow}>DRYCKESBIBLIOTEK</Text>
            <Text style={s.category}>{category.name}</Text>
          </View>
          <Text style={ui.body}>
            {filtered.length ? `${index + 1} / ${filtered.length}` : ""}
          </Text>
        </View>
        <View style={[ui.search, { marginVertical: 22 }]}>
          <Ionicons name="search-outline" size={19} color={colors.muted} />
          <TextInput
            accessibilityLabel="Sök dryck i kategorin"
            style={ui.searchInput}
            placeholder="Sök dryck eller information…"
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={(value) => {
              setSearch(value);
              setIndex(0);
            }}
          />
        </View>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : card ? (
          <>
            <View style={s.card}>
              <View
                style={[
                  ui.row,
                  { justifyContent: "space-between", marginBottom: 26 },
                ]}
              >
                <Text style={ui.eyebrow}>
                  {category.name.toLocaleUpperCase("sv")}
                </Text>
                <MaterialCommunityIcons
                  name={category.icon || "glass-wine"}
                  size={35}
                  color={colors.primary}
                />
              </View>
              <Text style={s.name}>{drinkName(card)}</Text>
              <View style={s.rule} />
              <Text style={s.info}>
                {details ? details.description : card.answer}
              </Text>
              {details && (
                <>
                  {details.grapeLabels.length > 0 && (
                    <>
                      <Text
                        style={[
                          ui.eyebrow,
                          { marginTop: 26, marginBottom: 12 },
                        ]}
                      >
                        DRUVOR
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          flexWrap: "wrap",
                          gap: 8,
                        }}
                      >
                        {details.grapeLabels.map((label) => (
                          <View key={label} style={s.tag}>
                            <Text style={s.tagText}>{label}</Text>
                          </View>
                        ))}
                      </View>
                    </>
                  )}
                  {details.flavorLabels.length > 0 && (
                    <>
                      <Text
                        style={[
                          ui.eyebrow,
                          { marginTop: 26, marginBottom: 12 },
                        ]}
                      >
                        SMAKPROFIL
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          flexWrap: "wrap",
                          gap: 8,
                        }}
                      >
                        {details.flavorLabels.map((label) => (
                          <View
                            key={label}
                            style={[s.tag, { backgroundColor: "#F5EFE2" }]}
                          >
                            <Text style={s.tagText}>{label}</Text>
                          </View>
                        ))}
                      </View>
                    </>
                  )}
                  {(details.prices.glass || details.prices.bottle) && (
                    <View
                      style={{
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                        paddingTop: 20,
                        marginTop: 26,
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 20,
                      }}
                    >
                      {details.prices.glass && (
                        <Text style={ui.body}>
                          Glas · {details.prices.glass} kr
                        </Text>
                      )}
                      {details.prices.bottle && (
                        <Text style={ui.body}>
                          Flaska · {details.prices.bottle} kr
                        </Text>
                      )}
                    </View>
                  )}
                </>
              )}
            </View>
            <View style={s.pager}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Föregående dryck"
                disabled={index === 0}
                onPress={() => go(index - 1)}
                style={[ui.button, s.secondary, index === 0 && s.disabled]}
              >
                <Ionicons name="arrow-back" size={18} color={colors.primary} />
                <Text style={[ui.buttonText, { color: colors.primary }]}>
                  Föregående
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={index === filtered.length - 1}
                onPress={() => go(index + 1)}
                style={[
                  ui.button,
                  { flex: 1 },
                  index === filtered.length - 1 && s.disabled,
                ]}
              >
                <Text style={ui.buttonText}>Nästa dryck</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </Pressable>
            </View>
            <Text style={[ui.eyebrow, { marginTop: 28, marginBottom: 14 }]}>
              ALLA I {category.name.toLocaleUpperCase("sv")}
            </Text>
            {filtered.map((item, i) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: i === index }}
                key={item.id}
                onPress={() => go(i)}
                style={[
                  s.listItem,
                  i === index && {
                    backgroundColor: colors.soft,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Text style={s.number}>{String(i + 1).padStart(2, "0")}</Text>
                <Text style={s.listName}>{drinkName(item)}</Text>
                <Ionicons
                  name={i === index ? "checkmark-circle" : "chevron-forward"}
                  size={18}
                  color={colors.primary}
                />
              </Pressable>
            ))}
          </>
        ) : (
          <Text style={ui.body}>
            {error ||
              (search
                ? "Ingen dryck matchar din sökning."
                : "Inga drycker i den här kategorin ännu.")}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.soft,
  },
  tagText: { color: colors.ink, fontSize: 13 },
  header: { flexDirection: "row", alignItems: "center", gap: 14 },
  category: {
    fontFamily: serif,
    fontSize: 24,
    color: colors.ink,
    marginTop: 4,
  },
  card: {
    padding: 26,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    minHeight: 300,
  },
  name: { fontFamily: serif, fontSize: 30, lineHeight: 39, color: colors.ink },
  rule: {
    width: 44,
    height: 3,
    backgroundColor: colors.gold,
    marginVertical: 22,
  },
  info: { fontSize: 17, lineHeight: 29, color: colors.ink },
  pager: { flexDirection: "row", gap: 12, marginTop: 20 },
  secondary: { flex: 1, backgroundColor: colors.soft, paddingHorizontal: 12 },
  disabled: { opacity: 0.35 },
  listItem: {
    padding: 17,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 9,
  },
  number: { color: colors.muted, fontSize: 12 },
  listName: { flex: 1, color: colors.ink, fontSize: 14, lineHeight: 21 },
});
