import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
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
import inventoryProducts from "../data/inventering-produkter.json";

const INVENTORY_KEY = "bar_inventory_v5";
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

// unit: 'cl' per cl, 'l' per liter, 'st' per flaska/styck.
const DEFAULT_ITEMS = inventoryProducts;

const CAT_COLORS = {
  Sprit: "#E74C3C",
  "Öl fat": "#F39C12",
  "Öl flaska": "#E67E22",
  Cider: "#27AE60",
  Gas: "#7F8C8D",
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

function itemKey(item) {
  return `${item.category}::${item.name.trim().toLocaleLowerCase("sv")}`;
}

const DEFAULT_ID_BY_KEY = new Map(
  DEFAULT_ITEMS.map((item) => [itemKey(item), item.id]),
);

function normalizeItem(item) {
  const glassItem = isGlassItem(item);
  return {
    ...item,
    id: DEFAULT_ID_BY_KEY.get(itemKey(item)) || item.id,
    ...(glassItem
      ? {
          unit: "st",
          isBottle: true,
          glassMode: true,
          glassesPerBottle: getGlassesPerBottle(item),
          inventoryUnit: "glas",
        }
      : {}),
  };
}

async function loadItems() {
  const json = await AsyncStorage.getItem(INVENTORY_KEY);
  if (!json) return DEFAULT_ITEMS;
  const saved = JSON.parse(json);
  if (!Array.isArray(saved)) return DEFAULT_ITEMS;

  // Reparera äldre dublett-id:n, tvinga vin/skumpa till glas och lägg till nya varor.
  const normalizedSaved = saved.map(normalizeItem);
  const savedKeys = new Set(normalizedSaved.map(itemKey));
  const merged = [
    ...normalizedSaved,
    ...DEFAULT_ITEMS.filter((item) => !savedKeys.has(itemKey(item))),
  ];

  await persistItems(merged);
  return merged;
}

async function persistItems(items) {
  await AsyncStorage.setItem(INVENTORY_KEY, JSON.stringify(items));
}

function itemCost(item) {
  const qty = parseFloat(item.qty) || 0;
  if (isGlassItem(item)) {
    return qty * (item.price / getGlassesPerBottle(item));
  }
  return qty * item.price;
}

export default function InventoryScreen() {
  const [items, setItems] = useState([]);
  const [selectedCat, setSelectedCat] = useState("Sprit");
  const [showForm, setShowForm] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null); // id of item being price-edited
  const [form, setForm] = useState({
    name: "",
    category: "Vin",
    price: "",
    unit: "st",
    isBottle: true,
  });

  useEffect(() => {
    loadItems().then(setItems);
  }, []);

  async function update(id, patch) {
    const updated = items.map((i) => (i.id === id ? { ...i, ...patch } : i));
    setItems(updated);
    await persistItems(updated);
  }

  async function resetAll() {
    Alert.alert("Rensa räkning", "Nollställa alla antal?", [
      { text: "Avbryt", style: "cancel" },
      {
        text: "Nollställ",
        onPress: async () => {
          const updated = items.map((i) => ({ ...i, qty: "" }));
          setItems(updated);
          await persistItems(updated);
        },
      },
    ]);
  }

  async function addItem() {
    if (!form.name.trim()) {
      Alert.alert("Fyll i ett namn");
      return;
    }
    if (!form.isBottle && !form.price) {
      Alert.alert("Fyll i ett pris");
      return;
    }
    const glassItem = GLASS_CATEGORIES.has(form.category);
    const newItem = {
      id: Date.now().toString(),
      name: form.name.trim(),
      category: form.category,
      price: parseFloat(form.price) || 0,
      unit: glassItem ? "st" : form.unit,
      isBottle: glassItem,
      glassMode: glassItem,
      glassesPerBottle: glassItem
        ? form.category === "Skumpa"
          ? 6
          : DEFAULT_GLASSES_PER_BOTTLE
        : undefined,
      inventoryUnit: glassItem ? "glas" : form.unit,
      sourcePrice: parseFloat(form.price) || 0,
      sourceUnit: glassItem ? "flaska" : form.unit,
      priceStatus: form.price ? "confirmed" : "missing",
      qty: "",
    };
    const updated = [...items, newItem];
    setItems(updated);
    await persistItems(updated);
    setForm({
      name: "",
      category: "Vin",
      price: "",
      unit: "st",
      isBottle: true,
    });
    setShowForm(false);
  }

  async function deleteItem(id) {
    Alert.alert("Ta bort vara", "Är du säker?", [
      { text: "Avbryt", style: "cancel" },
      {
        text: "Ta bort",
        style: "destructive",
        onPress: async () => {
          const updated = items.filter((i) => i.id !== id);
          setItems(updated);
          await persistItems(updated);
        },
      },
    ]);
  }

  const categories = Array.from(new Set(items.map(displayCategory)));
  const filtered = items.filter((i) => displayCategory(i) === selectedCat);
  const total = items.reduce((sum, i) => sum + itemCost(i), 0);
  const filteredTotal = filtered.reduce((sum, i) => sum + itemCost(i), 0);
  const hasAnyQty = items.some((i) => parseFloat(i.qty) > 0);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Bar-inventering</Text>
            <Text style={styles.subtitle}>
              Fyll i antal — totalen räknas ut automatiskt
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setShowSummary(true)}
              style={styles.summaryBtn}
            >
              <Ionicons name="bar-chart-outline" size={22} color="#fff" />
            </Pressable>
            <Pressable
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
            <Text style={styles.totalLabel}>{selectedCat.toUpperCase()}</Text>
            <Text style={styles.totalAmount}>
              {filteredTotal.toFixed(2)} kr
            </Text>
          </View>
          <View style={styles.totalSub}>
            <Text style={styles.totalSubLabel}>Alla kategorier</Text>
            <Text style={styles.totalSubAmount}>{total.toFixed(2)} kr</Text>
          </View>
        </View>

        {/* Category tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
        >
          {categories.map((cat) => (
            <Pressable
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

        {/* Add form */}
        {showForm && (
          <View style={styles.form}>
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
                    key={cat}
                    style={[
                      styles.catChip,
                      {
                        backgroundColor:
                          CAT_COLORS[cat] +
                          (form.category === cat ? "FF" : "55"),
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
                    <Text style={styles.catChipText}>{cat}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Price + unit (hidden for wine/skumpa if isBottle — price set inline) */}
            <View style={styles.formRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder={form.isBottle ? "Pris per flaska (kr)" : "Pris"}
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
              style={[styles.saveBtn, { marginTop: 12 }]}
              onPress={addItem}
            >
              <Text style={styles.saveBtnText}>Lägg till</Text>
            </Pressable>
          </View>
        )}

        {/* Items list */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const qty = parseFloat(item.qty) || 0;
            const cost = itemCost(item);
            const color = CAT_COLORS[displayCategory(item)] || "#95A5A6";
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
                    <Text style={styles.itemName}>{item.name}</Text>

                    {/* Price display / edit for bottle items */}
                    {item.isBottle ? (
                      isEditingPrice ? (
                        <View style={styles.priceEditRow}>
                          <TextInput
                            style={styles.priceInput}
                            value={item.price > 0 ? String(item.price) : ""}
                            onChangeText={(v) =>
                              update(item.id, { price: parseFloat(v) || 0 })
                            }
                            keyboardType="decimal-pad"
                            placeholder="Pris/flaska"
                            autoFocus
                            onBlur={() => setEditingPrice(null)}
                          />
                          <Text style={styles.priceInputUnit}>kr/flaska</Text>
                        </View>
                      ) : (
                        <Pressable onPress={() => setEditingPrice(item.id)}>
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
                        value={item.qty}
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
              <Text style={styles.modalTitle}>Svinnrapport</Text>
              <Text style={styles.modalSubtitle}>Kostnad per kategori</Text>

              {categories.map((cat) => {
                const catTotal = items
                  .filter((i) => displayCategory(i) === cat)
                  .reduce((sum, i) => sum + itemCost(i), 0);
                const color = CAT_COLORS[cat] || "#95A5A6";
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
                    { fontWeight: "800", color: "#2C3E50" },
                  ]}
                >
                  TOTALT SVINN
                </Text>
                <Text
                  style={[
                    styles.summaryAmt,
                    { fontWeight: "800", color: "#27AE60", fontSize: 18 },
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
            </Pressable>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6FA" },

  header: {
    backgroundColor: "#0F1923",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: { color: "#fff", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 2 },
  headerActions: { flexDirection: "row", gap: 8 },
  resetBtn: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    padding: 10,
  },
  summaryBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 10,
  },
  addBtn: { backgroundColor: "#27AE60", borderRadius: 12, padding: 10 },

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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F1923",
    marginBottom: 4,
  },
  modalSubtitle: { fontSize: 13, color: "#95A5A6", marginBottom: 20 },
  summaryRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  summaryDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  summaryCat: { flex: 1, fontSize: 15, fontWeight: "600", color: "#2C3E50" },
  summaryAmt: { fontSize: 15, fontWeight: "700", color: "#BDC3C7" },
  summaryDivider: { height: 1, backgroundColor: "#ECF0F1", marginVertical: 14 },
  modalClose: {
    marginTop: 20,
    backgroundColor: "#0F1923",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  modalCloseText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  totalBanner: {
    backgroundColor: "#1A252F",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  totalLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  totalAmount: {
    color: "#27AE60",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 2,
  },
  totalSub: { alignItems: "flex-end" },
  totalSubLabel: { color: "rgba(255,255,255,0.4)", fontSize: 11 },
  totalSubAmount: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    fontWeight: "700",
  },
  tabScroll: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: 56,
    minHeight: 56,
    maxHeight: 56,
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ECF0F1",
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 6,
    backgroundColor: "#F5F6FA",
  },
  tabActive: { backgroundColor: "#0F1923" },
  tabText: { fontWeight: "600", color: "#7F8C8D", fontSize: 14 },
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
    borderWidth: 1,
    borderColor: "#ECF0F1",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 10,
    backgroundColor: "#F9F9F9",
  },
  formRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  unitPicker: { flexDirection: "row", gap: 6 },
  unitBtn: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#ECF0F1",
  },
  unitBtnActive: { backgroundColor: "#0F1923" },
  unitBtnText: { fontWeight: "700", color: "#7F8C8D", fontSize: 13 },
  unitBtnTextActive: { color: "#fff", fontWeight: "700", fontSize: 13 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 6,
  },
  catChipText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  saveBtn: {
    backgroundColor: "#27AE60",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  list: { padding: 14, paddingBottom: 40 },
  row: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 8,
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
  },
  rowActive: { elevation: 3, shadowOpacity: 0.12 },
  colorBar: { width: 5 },
  rowLeft: { flex: 1, padding: 14 },
  itemName: { fontSize: 15, fontWeight: "700", color: "#2C3E50" },
  itemPrice: { fontSize: 12, color: "#95A5A6", marginTop: 3 },
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
    color: "#2C3E50",
    backgroundColor: "#EBF5FB",
  },
  priceInputUnit: { fontSize: 12, color: "#7F8C8D" },

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
    borderColor: "#ECF0F1",
    borderRadius: 10,
    padding: 8,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#2C3E50",
    backgroundColor: "#F9F9F9",
  },
  qtyUnit: { fontSize: 12, color: "#95A5A6", fontWeight: "600" },
  costText: { fontSize: 15, fontWeight: "800", marginTop: 6 },
  costPlaceholder: { fontSize: 14, color: "#BDC3C7", marginTop: 6 },
});
