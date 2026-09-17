import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { loadCards, loadCategories, saveCards } from "../utils/deviceStorage";
import { colors, serif, ui } from "../theme";
export default function ManageScreen({ navigation, route }) {
  const [categories, setCategories] = useState([]);
  const [cards, setCards] = useState([]);
  const [selectedCat, setSelectedCat] = useState(
    route.params?.categoryId || null,
  );
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  async function reload() {
    setLoading(true);
    setError("");
    return Promise.all([loadCategories(), loadCards()])
      .then(([cats, cds]) => {
        setCategories(cats);
        setCards(cds);
        setSelectedCat((id) =>
          cats.some((c) => c.id === id) ? id : cats[0]?.id,
        );
      })
      .catch(() =>
        setError("Kunde inte läsa korten. Gå tillbaka och försök igen."),
      )
      .finally(() => setLoading(false));
  }
  useEffect(() => {
    reload();
  }, []);
  async function save() {
    if (!draft.question.trim() || !draft.answer.trim()) {
      setError("Fyll i både namn och information.");
      return;
    }
    if (saving) return;
    setSaving(true);
    setError("");
    const card = {
      ...draft,
      id: draft.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      question: draft.question.trim(),
      answer: draft.answer.trim(),
    };
    const updated = draft.id
      ? cards.map((c) => (c.id === card.id ? card : c))
      : [...cards, card];
    try {
      setCards(await saveCards(updated, cards));
      setDraft(null);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving(false);
    }
  }
  async function remove() {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const updated = cards.filter((c) => c.id !== deleting.id);
      setCards(await saveCards(updated, cards));
      setDeleting(null);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving(false);
    }
  }
  const filtered = cards.filter(
    (c) =>
      c.categoryId === selectedCat &&
      `${c.question} ${c.answer}`
        .toLocaleLowerCase("sv")
        .includes(search.trim().toLocaleLowerCase("sv")),
  );
  return (
    <SafeAreaView style={ui.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={ui.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tillbaka"
            style={ui.iconButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color={colors.ink} />
          </Pressable>
          <Text style={s.headerLabel}>GEMENSAMMA KORT</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Hämta senaste korten"
            disabled={loading || saving}
            style={ui.iconButton}
            onPress={reload}
          >
            <Ionicons name="refresh-outline" size={20} color={colors.primary} />
          </Pressable>
          <Pressable
            disabled={!selectedCat}
            accessibilityRole="button"
            style={ui.button}
            onPress={() => {
              setError("");
              setDraft({ categoryId: selectedCat, question: "", answer: "" });
            }}
          >
            <Ionicons name="add" size={19} color="#fff" />
            <Text style={ui.buttonText}>Nytt kort</Text>
          </Pressable>
        </View>
        <Text style={ui.title}>Plats för mer kunskap.</Text>
        <Text style={[ui.body, { marginTop: 9, marginBottom: 24 }]}>
          Ändringar sparas för hela teamet. Tävlingsquizet använder det
          gemensamma dryckesregistret.
        </Text>
        <View style={ui.search}>
          <Ionicons name="search-outline" size={20} color={colors.muted} />
          <TextInput
            style={ui.searchInput}
            accessibilityLabel="Sök bland kort"
            placeholder="Sök dryck eller information…"
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginVertical: 20 }}
          contentContainerStyle={{ paddingRight: 24 }}
        >
          {categories.map((cat) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: cat.id === selectedCat }}
              key={cat.id}
              onPress={() => setSelectedCat(cat.id)}
              style={[ui.chip, cat.id === selectedCat && ui.chipActive]}
            >
              <Text
                style={[
                  ui.chipText,
                  cat.id === selectedCat && { color: "#fff" },
                ]}
              >
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        {loading && <ActivityIndicator color={colors.primary} />}
        {!draft && !deleting && !!error && (
          <Text style={ui.error}>{error}</Text>
        )}
        <Text style={[ui.eyebrow, { marginBottom: 14 }]}>
          {filtered.length} KORT
        </Text>
        {filtered.map((card) => (
          <View key={card.id} style={s.card}>
            <View style={{ flex: 1 }}>
              <Text style={s.question}>{card.question}</Text>
              <Text numberOfLines={3} style={s.answer}>
                {card.answer}
              </Text>
            </View>
            <View style={{ gap: 8 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Redigera ${card.question}`}
                style={ui.iconButton}
                onPress={() => {
                  setError("");
                  setDraft({ ...card });
                }}
              >
                <Ionicons
                  name="create-outline"
                  size={19}
                  color={colors.primary}
                />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Ta bort ${card.question}`}
                style={ui.iconButton}
                onPress={() => {
                  setError("");
                  setDeleting(card);
                }}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={colors.danger}
                />
              </Pressable>
            </View>
          </View>
        ))}
        {!loading && !filtered.length && (
          <Text style={[ui.body, { textAlign: "center", paddingVertical: 32 }]}>
            {search
              ? "Inga kort matchar din sökning."
              : "Inga kort här ännu. Lägg till ditt första kort."}
          </Text>
        )}
      </ScrollView>
      <Modal
        visible={!!draft || !!deleting}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!saving) {
            setDraft(null);
            setDeleting(null);
            setError("");
          }
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={s.backdrop}
        >
          <View style={s.modal}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 24 }}
            >
              <View
                style={[
                  ui.row,
                  { justifyContent: "space-between", marginBottom: 20 },
                ]}
              >
                <Text style={s.modalTitle}>
                  {deleting
                    ? "Ta bort kort?"
                    : draft?.id
                      ? "Redigera kort"
                      : "Nytt kort"}
                </Text>
                <Pressable
                  disabled={saving}
                  accessibilityRole="button"
                  accessibilityLabel="Stäng"
                  style={ui.iconButton}
                  onPress={() => {
                    setDraft(null);
                    setDeleting(null);
                    setError("");
                  }}
                >
                  <Ionicons name="close" size={20} color={colors.ink} />
                </Pressable>
              </View>
              {draft && (
                <>
                  <Text style={s.label}>KATEGORI</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 20 }}
                  >
                    {categories.map((cat) => (
                      <Pressable
                        key={cat.id}
                        onPress={() =>
                          setDraft((d) => ({ ...d, categoryId: cat.id }))
                        }
                        style={[
                          ui.chip,
                          draft.categoryId === cat.id && ui.chipActive,
                        ]}
                      >
                        <Text
                          style={[
                            ui.chipText,
                            draft.categoryId === cat.id && { color: "#fff" },
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                  <Text style={s.label}>DRYCKENS NAMN</Text>
                  <TextInput
                    accessibilityLabel="Dryckens namn"
                    style={ui.input}
                    value={draft.question}
                    onChangeText={(question) =>
                      setDraft((d) => ({ ...d, question }))
                    }
                    placeholder="Dryckens namn"
                    multiline
                  />
                  <Text style={[s.label, { marginTop: 20 }]}>INFORMATION</Text>
                  <TextInput
                    accessibilityLabel="Dryckens information"
                    style={[
                      ui.input,
                      { minHeight: 130, textAlignVertical: "top" },
                    ]}
                    value={draft.answer}
                    onChangeText={(answer) =>
                      setDraft((d) => ({ ...d, answer }))
                    }
                    placeholder="Ursprung, druvor, smak och servering…"
                    multiline
                  />
                </>
              )}
              {deleting && (
                <Text style={ui.body}>
                  ”{deleting.question}” tas bort från hela teamets kortbibliotek.
                </Text>
              )}
              {!!error && (
                <Text accessibilityRole="alert" style={ui.error}>
                  {error}
                </Text>
              )}
              <View style={[ui.row, { marginTop: 24 }]}>
                <Pressable
                  disabled={saving}
                  style={[ui.button, { flex: 1, backgroundColor: colors.soft }]}
                  onPress={() => {
                    setDraft(null);
                    setDeleting(null);
                    setError("");
                  }}
                >
                  <Text style={[ui.buttonText, { color: colors.primary }]}>
                    Avbryt
                  </Text>
                </Pressable>
                <Pressable
                  disabled={saving}
                  style={[
                    ui.button,
                    { flex: 1 },
                    deleting && { backgroundColor: colors.danger },
                  ]}
                  onPress={deleting ? remove : save}
                >
                  <Text style={ui.buttonText}>
                    {saving ? "Sparar…" : deleting ? "Ta bort" : "Spara kort"}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  headerLabel: { flex: 1, color: colors.muted, fontSize: 10, letterSpacing: 1 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 12,
  },
  question: {
    fontFamily: serif,
    fontSize: 21,
    color: colors.ink,
    marginBottom: 9,
  },
  answer: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(20,37,30,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  modal: {
    width: "100%",
    maxWidth: 620,
    maxHeight: "90%",
    backgroundColor: "#fff",
    borderRadius: 24,
    overflow: "hidden",
  },
  modalTitle: { fontFamily: serif, fontSize: 27, color: colors.ink },
  label: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "700",
    color: colors.muted,
    marginBottom: 10,
  },
});
