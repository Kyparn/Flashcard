import { Ionicons } from "@expo/vector-icons";
import { loadItems, persistItems } from "../utils/deviceStorage";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
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
import { colors, serif, ui } from "../theme";

const number = (value) =>
  Math.max(0, parseFloat(String(value).replace(",", ".")) || 0);
function confirmAction(title, message, action) {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n${message}`)) action();
  } else
    Alert.alert(title, message, [
      { text: "Avbryt", style: "cancel" },
      { text: "Bekräfta", style: "destructive", onPress: action },
    ]);
}
const DEFAULT_GLASSES_PER_BOTTLE = 5;
const GLASS_CATEGORIES = new Set(["Vin", "Skumpa"]);
const FORM_CATEGORIES = [
  "Sprit",
  "Öl fat",
  "Öl flaska",
  "Cider",
  "Gas",
  "Vin",
  "Skumpa",
];

const CAT_COLORS = {
  Sprit: "#E74C3C",
  "Öl fat": "#F39C12",
  "Öl flaska": "#E67E22",
  Cider: "#254D3E",
  Gas: "#70796F",
  Vin: "#9B59B6",
  "Vitt vin": "#D4AC0D",
  "Rött vin": "#922B21",
  Rosévin: "#E91E63",
  Dessertvin: "#8E44AD",
  Skumpa: "#3498DB",
};

const UNIT_LABEL = { cl: "cl", l: "liter", st: "st" };

function isGlassItem(item) {
  return item.glassMode === true || GLASS_CATEGORIES.has(item.category);
}

function getGlassesPerBottle(item) {
  if (!isGlassItem(item)) return 1;
  if (Number(item.glassesPerBottle) > 0) return Number(item.glassesPerBottle);
  return item.category === "Skumpa" ? 6 : DEFAULT_GLASSES_PER_BOTTLE;
}

function displayCategory(item) {
  if (item.category === "Vin" && item.subcategory) return item.subcategory;
  return item.category;
}

function itemCost(item) {
  const qty = number(item.qty);
  if (isGlassItem(item)) {
    return qty * (item.price / getGlassesPerBottle(item));
  }
  return qty * item.price;
}

export default function InventoryScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [selectedCat, setSelectedCat] = useState("Alla");
  const [search, setSearch] = useState("");
  const [onlyCounted, setOnlyCounted] = useState(false);
  const [error, setError] = useState("");
  const itemsRef = useRef([]);
  const writes = useRef(Promise.resolve());
  const pending = useRef(0);
  const failed = useRef(false);
  const fetching = useRef(false);
  const [syncing, setSyncing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [priceDraft, setPriceDraft] = useState("");
  const [editingPrice, setEditingPrice] = useState(null); // id of item being price-edited
  const [form, setForm] = useState({
    name: "",
    category: "Vin",
    price: "",
    unit: "st",
    isBottle: true,
  });

  async function refresh() {
    if (pending.current || fetching.current) return;
    fetching.current = true;
    setSyncing(true);
    try {
      const loaded = await loadItems();
      itemsRef.current = loaded;
      setItems(loaded);
      failed.current = false;
      setError("");
    } catch (failure) {
      setError(failure.message);
    } finally {
      fetching.current = false;
      setSyncing(false);
    }
  }
  useEffect(() => {
    refresh();
    return navigation.addListener("focus", () => {
      if (!failed.current) refresh();
    });
  }, [navigation]);

  async function commit(updated) {
    if (fetching.current || failed.current) return false;
    const previous = itemsRef.current;
    itemsRef.current = updated;
    setItems(updated);
    pending.current++;
    setSyncing(true);
    const task = writes.current.catch(() => {}).then(async () => {
      if (failed.current) throw new Error("Ändringarna är inte sparade. Hämta senaste versionen innan du fortsätter.");
      try {
        return await persistItems(updated, previous);
      } catch (failure) {
        failed.current = true;
        throw failure;
      }
    });
    writes.current = task;
    try {
      const saved = await task;
      // Keep newer local keystrokes until the last queued save has completed.
      if (pending.current === 1) {
        itemsRef.current = saved;
        setItems(saved);
      }
      setError("");
      return true;
    } catch (failure) {
      setError(`${failure.message} Ändringar som inte sparats finns kvar på skärmen. Hämta senaste för att återgå till enhetens sparade uppgifter.`);
      return false;
    } finally {
      pending.current--;
      if (!pending.current) setSyncing(false);
    }
  }
  function update(id, patch) {
    return commit(
      itemsRef.current.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    );
  }
  function resetAll() {
    confirmAction("Rensa räkning", "Nollställa alla antal på den här enheten?", () =>
      commit(itemsRef.current.map((i) => ({ ...i, qty: "" }))),
    );
  }

  async function addItem() {
    if (!form.name.trim()) {
      setError("Fyll i ett namn.");
      return;
    }
    if (!form.isBottle && !form.price) {
      setError("Fyll i ett pris.");
      return;
    }
    const glassItem = GLASS_CATEGORIES.has(form.category);
    const newItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      name: form.name.trim(),
      category: form.category,
      price: number(form.price),
      unit: glassItem ? "st" : form.unit,
      isBottle: glassItem,
      glassMode: glassItem,
      glassesPerBottle: glassItem
        ? form.category === "Skumpa"
          ? 6
          : DEFAULT_GLASSES_PER_BOTTLE
        : undefined,
      inventoryUnit: glassItem ? "glas" : form.unit,
      sourcePrice: number(form.price),
      sourceUnit: glassItem ? "flaska" : form.unit,
      priceStatus: form.price ? "confirmed" : "missing",
      qty: "",
    };
    const updated = [...itemsRef.current, newItem];
    if (!(await commit(updated))) return;
    setForm({
      name: "",
      category: "Vin",
      price: "",
      unit: "st",
      isBottle: true,
    });
    setShowForm(false);
  }

  function deleteItem(id) {
    confirmAction(
      "Ta bort vara",
      "Vill du ta bort varan från inventeringen på den här enheten?",
      () => commit(itemsRef.current.filter((i) => i.id !== id)),
    );
  }

  const categories = Array.from(new Set(items.map(displayCategory)));
  const filtered = items.filter(
    (i) =>
      (selectedCat === "Alla" || displayCategory(i) === selectedCat) &&
      i.name
        .toLocaleLowerCase("sv")
        .includes(search.trim().toLocaleLowerCase("sv")) &&
      (!onlyCounted || number(i.qty) > 0),
  );
  const total = items.reduce((sum, i) => sum + itemCost(i), 0);
  const filteredTotal = filtered.reduce((sum, i) => sum + itemCost(i), 0);
  const hasAnyQty = items.some((i) => number(i.qty) > 0);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1, width: "100%", maxWidth: 1040, alignSelf: "center" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[ui.eyebrow, { marginBottom: 7 }]}>
              ORDNING BAKOM BAREN
            </Text>
            <Text style={styles.title}>Inventering</Text>
            <Text style={styles.subtitle}>
              {syncing ? "Sparar…" : "Inventeringen sparas bara på den här enheten."}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Hämta senaste inventeringen"
              disabled={syncing || !!editingPrice}
              onPress={() => failed.current
                ? confirmAction("Hämta senaste", "Ersätta osparade ändringar på skärmen med enhetens sparade inventering?", refresh)
                : refresh()}
              style={styles.summaryBtn}
            >
              <Ionicons name="refresh-outline" size={22} color={colors.primary} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Visa svinnrapport"
              onPress={() => setShowSummary(true)}
              style={styles.summaryBtn}
            >
              <Ionicons
                name="bar-chart-outline"
                size={22}
                color={colors.primary}
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                showForm ? "Stäng formulär" : "Lägg till vara"
              }
              onPress={() => setShowForm(!showForm)}
              style={styles.addBtn}
            >
              <Ionicons
                name={showForm ? "close" : "add"}
                size={22}
                color="#fff"
              />
            </Pressable>
          </View>
        </View>

        {/* Total banner */}
        <View style={styles.totalBanner}>
          <View>
            <Text style={styles.totalLabel}>
              {search || onlyCounted
                ? "VISAT URVAL"
                : selectedCat === "Alla"
                  ? "TOTALT REGISTRERAT"
                  : selectedCat.toUpperCase()}
            </Text>
            <Text style={styles.totalAmount}>
              {filteredTotal.toFixed(2)} kr
            </Text>
          </View>
          <View style={styles.totalSub}>
            <Text style={styles.totalSubLabel}>Alla kategorier</Text>
            <Text style={styles.totalSubAmount}>{total.toFixed(2)} kr</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 24, paddingTop: 18 }}>
          <View style={ui.search}>
            <Ionicons name="search-outline" size={20} color={colors.muted} />
            <TextInput
              accessibilityLabel="Sök vara"
              placeholder="Sök en vara…"
              placeholderTextColor={colors.muted}
              style={ui.searchInput}
              value={search}
              onChangeText={setSearch}
            />
            {!!search && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Rensa sökning"
                onPress={() => setSearch("")}
                hitSlop={10}
              >
                <Ionicons name="close-circle" size={20} color={colors.muted} />
              </Pressable>
            )}
          </View>
        </View>
        {/* Category tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
        >
          {["Alla", ...categories].map((cat) => (
            <Pressable
              accessibilityRole="button"
              key={cat}
              style={[styles.tab, selectedCat === cat && styles.tabActive]}
              onPress={() => setSelectedCat(cat)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedCat === cat && styles.tabTextActive,
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.listTools}>
          <Text style={ui.eyebrow}>{filtered.length} VAROR</Text>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: onlyCounted }}
            onPress={() => setOnlyCounted((v) => !v)}
            style={ui.row}
          >
            <Ionicons
              name={onlyCounted ? "checkbox" : "square-outline"}
              size={19}
              color={colors.primary}
            />
            <Text style={ui.body}>Bara räknade</Text>
          </Pressable>
          {hasAnyQty && (
            <Pressable
              accessibilityRole="button"
              onPress={resetAll}
              style={{ paddingVertical: 12 }}
            >
              <Text style={{ color: colors.danger, fontSize: 12 }}>
                Nollställ
              </Text>
            </Pressable>
          )}
        </View>
        {!!error && (
          <Text
            accessibilityRole="alert"
            style={[ui.error, { paddingHorizontal: 24 }]}
          >
            {error}
          </Text>
        )}
        {/* Add form */}
        <Modal
          visible={showForm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowForm(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalBackdrop}
          >
            <View style={styles.modalCard}>
              <ScrollView keyboardShouldPersistTaps="handled">
                <View
                  style={[
                    ui.row,
                    { justifyContent: "space-between", marginBottom: 20 },
                  ]}
                >
                  <Text style={styles.modalTitle}>Ny vara</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Stäng"
                    style={ui.iconButton}
                    onPress={() => setShowForm(false)}
                  >
                    <Ionicons name="close" size={20} color={colors.ink} />
                  </Pressable>
                </View>
                {!!error && <Text style={ui.error}>{error}</Text>}
                <TextInput
                  style={styles.input}
                  placeholder="Namn (t.ex. Barolo 2019)"
                  value={form.name}
                  onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                  autoFocus
                />

                {/* Category picker */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 10 }}
                >
                  {FORM_CATEGORIES.map((cat) => {
                    const isGlassCat = GLASS_CATEGORIES.has(cat);
                    return (
                      <Pressable
                        accessibilityRole="button"
                        key={cat}
                        style={[
                          styles.catChip,
                          {
                            backgroundColor:
                              form.category === cat
                                ? colors.primary
                                : colors.soft,
                          },
                        ]}
                        onPress={() =>
                          setForm((f) => ({
                            ...f,
                            category: cat,
                            unit: isGlassCat ? "st" : f.unit,
                            isBottle: isGlassCat,
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.catChipText,
                            {
                              color:
                                form.category === cat ? "#fff" : colors.ink,
                            },
                          ]}
                        >
                          {cat}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* Price + unit (hidden for wine/skumpa if isBottle — price set inline) */}
                <View style={styles.formRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    placeholder={
                      form.isBottle ? "Pris per flaska (kr)" : "Pris"
                    }
                    value={form.price}
                    onChangeText={(v) => setForm((f) => ({ ...f, price: v }))}
                    keyboardType="decimal-pad"
                  />
                  {!form.isBottle && (
                    <View style={styles.unitPicker}>
                      {["cl", "l", "st"].map((u) => (
                        <Pressable
                          key={u}
                          style={[
                            styles.unitBtn,
                            form.unit === u && styles.unitBtnActive,
                          ]}
                          onPress={() => setForm((f) => ({ ...f, unit: u }))}
                        >
                          <Text
                            style={[
                              styles.unitBtnText,
                              form.unit === u && styles.unitBtnTextActive,
                            ]}
                          >
                            {u}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                  {form.isBottle && (
                    <View
                      style={[
                        styles.unitBtn,
                        styles.unitBtnActive,
                        { marginLeft: 8 },
                      ]}
                    >
                      <Text style={styles.unitBtnTextActive}>kr/flaska</Text>
                    </View>
                  )}
                </View>

                <Pressable
                  accessibilityRole="button"
                  style={[styles.saveBtn, { marginTop: 12 }]}
                  onPress={addItem}
                >
                  <Text style={styles.saveBtnText}>Lägg till</Text>
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Items list */}
        <FlatList
          data={filtered}
          ListEmptyComponent={
            <Text
              style={{ color: colors.muted, textAlign: "center", padding: 30 }}
            >
              Inga varor att visa. Prova en annan sökning eller kategori.
            </Text>
          }
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const qty = number(item.qty);
            const cost = itemCost(item);
            const color = CAT_COLORS[displayCategory(item)] || "#70796F";
            const pricePerGlass =
              item.price > 0
                ? (item.price / getGlassesPerBottle(item)).toFixed(2)
                : null;
            const isEditingPrice = editingPrice === item.id;

            return (
              <Pressable onLongPress={() => deleteItem(item.id)}>
                <View style={[styles.row, qty > 0 && styles.rowActive]}>
                  <View style={[styles.colorBar, { backgroundColor: color }]} />

                  <View style={styles.rowLeft}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Text style={[styles.itemName, { flex: 1 }]}>
                        {item.name}
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Ta bort ${item.name}`}
                        onPress={() => deleteItem(item.id)}
                        style={{ padding: 8 }}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color={colors.muted}
                        />
                      </Pressable>
                    </View>

                    {/* Price display / edit for bottle items */}
                    {item.isBottle ? (
                      isEditingPrice ? (
                        <View style={styles.priceEditRow}>
                          <TextInput
                            style={styles.priceInput}
                            value={priceDraft}
                            onChangeText={setPriceDraft}
                            keyboardType="decimal-pad"
                            accessibilityLabel={`Pris per flaska för ${item.name}`}
                            placeholder="Pris/flaska"
                            autoFocus
                            onBlur={() => {
                              update(item.id, { price: number(priceDraft) });
                              setEditingPrice(null);
                            }}
                          />
                          <Text style={styles.priceInputUnit}>kr/flaska</Text>
                        </View>
                      ) : (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => {
                            setPriceDraft(
                              item.price > 0 ? String(item.price) : "",
                            );
                            setEditingPrice(item.id);
                          }}
                        >
                          <Text style={styles.itemPrice}>
                            {item.price > 0
                              ? `${item.price} kr/flaska  •  ${pricePerGlass} kr/glas`
                              : "✏️ Tryck för att sätta pris"}
                          </Text>
                        </Pressable>
                      )
                    ) : (
                      <Text style={styles.itemPrice}>
                        {item.price} kr/{UNIT_LABEL[item.unit]}
                      </Text>
                    )}
                  </View>

                  <View style={styles.rowRight}>
                    <View style={styles.qtyWrapper}>
                      <TextInput
                        style={styles.qtyInput}
                        accessibilityLabel={`Antal ${item.name}`}
                        value={item.qty || ""}
                        onChangeText={(v) => update(item.id, { qty: v })}
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor="#BDC3C7"
                        selectTextOnFocus
                      />
                      <Text style={styles.qtyUnit}>
                        {isGlassItem(item) ? "glas" : UNIT_LABEL[item.unit]}
                      </Text>
                    </View>

                    {qty > 0 ? (
                      <Text style={[styles.costText, { color }]}>
                        {cost.toFixed(2)} kr
                      </Text>
                    ) : (
                      <Text style={styles.costPlaceholder}>— kr</Text>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
        {/* Svinnrapport modal */}
        <Modal
          visible={showSummary}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSummary(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowSummary(false)}
          >
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <ScrollView>
                <Text style={styles.modalTitle}>Svinnrapport</Text>
                <Text style={styles.modalSubtitle}>Kostnad per kategori</Text>

                {categories.map((cat) => {
                  const catTotal = items
                    .filter((i) => displayCategory(i) === cat)
                    .reduce((sum, i) => sum + itemCost(i), 0);
                  const color = CAT_COLORS[cat] || "#70796F";
                  return (
                    <View key={cat} style={styles.summaryRow}>
                      <View
                        style={[styles.summaryDot, { backgroundColor: color }]}
                      />
                      <Text style={styles.summaryCat}>{cat}</Text>
                      <Text
                        style={[styles.summaryAmt, catTotal > 0 && { color }]}
                      >
                        {catTotal.toFixed(2)} kr
                      </Text>
                    </View>
                  );
                })}

                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text
                    style={[
                      styles.summaryCat,
                      { fontWeight: "800", color: "#203B32" },
                    ]}
                  >
                    TOTALT SVINN
                  </Text>
                  <Text
                    style={[
                      styles.summaryAmt,
                      { fontWeight: "800", color: "#254D3E", fontSize: 18 },
                    ]}
                  >
                    {total.toFixed(2)} kr
                  </Text>
                </View>

                <Pressable
                  style={styles.modalClose}
                  onPress={() => setShowSummary(false)}
                >
                  <Text style={styles.modalCloseText}>Stäng</Text>
                </Pressable>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F5F0" },

  header: {
    backgroundColor: colors.background,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: { color: colors.ink, fontSize: 32, fontFamily: serif },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 5 },
  headerActions: { flexDirection: "row", gap: 8 },
  resetBtn: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    padding: 10,
  },
  summaryBtn: {
    backgroundColor: colors.soft,
    borderRadius: 12,
    padding: 10,
  },
  addBtn: { backgroundColor: "#254D3E", borderRadius: 12, padding: 10 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 580,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#203B32",
    marginBottom: 4,
  },
  modalSubtitle: { fontSize: 13, color: "#70796F", marginBottom: 20 },
  summaryRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  summaryDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  summaryCat: { flex: 1, fontSize: 15, fontWeight: "600", color: "#203B32" },
  summaryAmt: { fontSize: 15, fontWeight: "700", color: "#BDC3C7" },
  summaryDivider: { height: 1, backgroundColor: "#E2E5DC", marginVertical: 14 },
  modalClose: {
    marginTop: 20,
    backgroundColor: "#203B32",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  modalCloseText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  listTools: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 8,
    flexWrap: "wrap",
  },
  totalBanner: {
    marginHorizontal: 24,
    borderRadius: 20,
    backgroundColor: "#254D3E",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  totalLabel: {
    color: "#CFD9CC",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  totalAmount: {
    color: "#F2EDDF",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 2,
  },
  totalSub: { alignItems: "flex-end" },
  totalSubLabel: { color: "#CFD9CC", fontSize: 11 },
  totalSubAmount: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    fontWeight: "700",
  },
  tabScroll: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    height: 56,
    minHeight: 56,
    maxHeight: 56,
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E5DC",
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 6,
    backgroundColor: "#F6F5F0",
  },
  tabActive: { backgroundColor: "#203B32" },
  tabText: { fontWeight: "600", color: "#70796F", fontSize: 14 },
  tabTextActive: { color: "#fff" },

  form: {
    margin: 14,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  input: {
    minWidth: 0,
    borderWidth: 1,
    borderColor: "#E2E5DC",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 10,
    backgroundColor: "#F6F5F0",
  },
  formRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  unitPicker: { flexDirection: "row", gap: 6 },
  unitBtn: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#E2E5DC",
  },
  unitBtnActive: { backgroundColor: "#203B32" },
  unitBtnText: { fontWeight: "700", color: "#70796F", fontSize: 13 },
  unitBtnTextActive: { color: "#fff", fontWeight: "700", fontSize: 13 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 6,
  },
  catChipText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  saveBtn: {
    backgroundColor: "#254D3E",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  list: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 40 },
  row: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    overflow: "hidden",
    elevation: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0,
    shadowRadius: 3,
  },
  rowActive: { elevation: 3, shadowOpacity: 0.12 },
  colorBar: { width: 3, opacity: 0.65 },
  rowLeft: { flex: 1, padding: 14 },
  itemName: { fontSize: 15, fontWeight: "700", color: "#203B32" },
  itemPrice: { fontSize: 12, color: "#70796F", marginTop: 3 },
  priceEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  priceInput: {
    width: 90,
    borderWidth: 1.5,
    borderColor: "#3498DB",
    borderRadius: 8,
    padding: 6,
    fontSize: 14,
    fontWeight: "700",
    color: "#203B32",
    backgroundColor: "#EBF5FB",
  },
  priceInputUnit: { fontSize: 12, color: "#70796F" },

  rowRight: {
    padding: 12,
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: 110,
  },
  qtyWrapper: { flexDirection: "row", alignItems: "center", gap: 4 },
  qtyInput: {
    width: 60,
    borderWidth: 1.5,
    borderColor: "#E2E5DC",
    borderRadius: 10,
    padding: 8,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#203B32",
    backgroundColor: "#F6F5F0",
  },
  qtyUnit: { fontSize: 12, color: "#70796F", fontWeight: "600" },
  costText: { fontSize: 15, fontWeight: "800", marginTop: 6 },
  costPlaceholder: { fontSize: 14, color: "#BDC3C7", marginTop: 6 },
});
