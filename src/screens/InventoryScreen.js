import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const INVENTORY_KEY = 'bar_inventory_v3';
const GLASSES_PER_BOTTLE = 5; // 75cl / 15cl

// unit: 'cl' per cl, 'l' per liter, 'st' per bottle/piece
// isBottle: true = can toggle between flaska and glas mode
const DEFAULT_ITEMS = [
  // Sprit
  { id: 's1', name: 'Gin',             category: 'Sprit',    price: 3.1,  unit: 'cl',  isBottle: false, glassMode: false, qty: '' },
  { id: 's2', name: 'Vodka',           category: 'Sprit',    price: 3.7,  unit: 'cl',  isBottle: false, glassMode: false, qty: '' },
  { id: 's3', name: 'Galliano',        category: 'Sprit',    price: 3.0,  unit: 'cl',  isBottle: false, glassMode: false, qty: '' },
  { id: 's4', name: 'Brugal',          category: 'Sprit',    price: 4.1,  unit: 'cl',  isBottle: false, glassMode: false, qty: '' },
  { id: 's5', name: "Bailey's",        category: 'Sprit',    price: 2.4,  unit: 'cl',  isBottle: false, glassMode: false, qty: '' },
  { id: 's6', name: 'Dry Curaçao',     category: 'Sprit',    price: 4.8,  unit: 'cl',  isBottle: false, glassMode: false, qty: '' },
  { id: 's7', name: "Maker's Mark",    category: 'Sprit',    price: 4.7,  unit: 'cl',  isBottle: false, glassMode: false, qty: '' },
  { id: 's8', name: 'Jim Beam',        category: 'Sprit',    price: 3.7,  unit: 'cl',  isBottle: false, glassMode: false, qty: '' },
  { id: 's9', name: 'Coast and Copper',category: 'Sprit',    price: 4.9,  unit: 'cl',  isBottle: false, glassMode: false, qty: '' },
  // Öl fat
  { id: 'b1', name: 'Suntrip',         category: 'Öl fat',   price: 72,   unit: 'l',   isBottle: false, glassMode: false, qty: '' },
  { id: 'b2', name: 'Pina Colada',     category: 'Öl fat',   price: 100,  unit: 'l',   isBottle: false, glassMode: false, qty: '' },
  { id: 'b3', name: 'Sleepy Pale Ale', category: 'Öl fat',   price: 65,   unit: 'l',   isBottle: false, glassMode: false, qty: '' },
  { id: 'b4', name: 'Mariestad',       category: 'Öl fat',   price: 60,   unit: 'l',   isBottle: false, glassMode: false, qty: '' },
  { id: 'b5', name: 'Heineken',        category: 'Öl fat',   price: 55,   unit: 'l',   isBottle: false, glassMode: false, qty: '' },
  // Öl flaska
  { id: 'b6', name: 'Mellerud (mellanöl)',   category: 'Öl flaska', price: 20, unit: 'st', isBottle: false, glassMode: false, qty: '' },
  { id: 'b7', name: 'Mellerud (alkoholfri)', category: 'Öl flaska', price: 12, unit: 'st', isBottle: false, glassMode: false, qty: '' },
  { id: 'b8', name: 'Suntrip bruk', category: 'Öl flaska', price: 12, unit: 'st', isBottle: false, glassMode: false, qty: '' },
  { id: 'b9', name: 'Ship full of Ipa', category: 'Öl flaska', price: 12, unit: 'st', isBottle: false, glassMode: false, qty: '' },
  { id: 'b10', name: 'Briska cider', category: 'Öl flaska', price: 12, unit: 'st', isBottle: false, glassMode: false, qty: '' },
  // Vin (pris per flaska, kan räknas per glas)
  { id: 'v1', name: 'Husrött',        category: 'Vin',      price: 0,    unit: 'st',  isBottle: true,  glassMode: false, qty: '' },
  { id: 'v2', name: 'Malbec',        category: 'Vin',      price: 0,    unit: 'st',  isBottle: true,  glassMode: false, qty: '' },
  { id: 'v3', name: 'Pinot Noir',      category: 'Vin',      price: 0,    unit: 'st',  isBottle: true,  glassMode: false, qty: '' },
  { id: 'v4', name: 'Husvit',      category: 'Vin',      price: 0,    unit: 'st',  isBottle: true,  glassMode: false, qty: '' },
  { id: 'v5', name: 'Riesling',            category: 'Vin',      price: 0,    unit: 'st',  isBottle: true,  glassMode: false, qty: '' },
  { id: 'v5', name: 'Chablis',            category: 'Vin',      price: 0,    unit: 'st',  isBottle: true,  glassMode: false, qty: '' },
  { id: 'v5', name: 'Côtes du Rhône',            category: 'Vin',      price: 0,    unit: 'st',  isBottle: true,  glassMode: false, qty: '' },
  { id: 'v5', name: 'Langhe Nebbiolo',            category: 'Vin',      price: 0,    unit: 'st',  isBottle: true,  glassMode: false, qty: '' },
  { id: 'v5', name: 'Gaia Cab',            category: 'Vin',      price: 0,    unit: 'st',  isBottle: true,  glassMode: false, qty: '' },
  { id: 'v5', name: 'Whispering Angel',            category: 'Vin',      price: 0,    unit: 'st',  isBottle: true,  glassMode: false, qty: '' },
  { id: 'v5', name: 'Galoupet Provence',            category: 'Vin',      price: 0,    unit: 'st',  isBottle: true,  glassMode: false, qty: '' },
  { id: 'v5', name: 'Santiago',            category: 'Vin',      price: 0,    unit: 'st',  isBottle: true,  glassMode: false, qty: '' },
  { id: 'v5', name: 'Kuentz-Bas Alsace',            category: 'Vin',      price: 0,    unit: 'st',  isBottle: true,  glassMode: false, qty: '' },
  { id: 'v5', name: 'Sancerre',            category: 'Vin',      price: 0,    unit: 'st',  isBottle: true,  glassMode: false, qty: '' },
  // Skumpa (pris per flaska, kan räknas per glas)
  { id: 'k1', name: 'Moet Chandon',       category: 'Skumpa',   price: 350,    unit: 'st',  isBottle: true,  glassMode: false, qty: '' },
  { id: 'k2', name: 'Ruinart',        category: 'Skumpa',   price: 441,    unit: 'st',  isBottle: true,  glassMode: false, qty: '' },
  { id: 'k2', name: 'Mont-Ferrant cava',        category: 'Skumpa',   price: 70,    unit: 'st',  isBottle: true,  glassMode: false, qty: '' },
  { id: 'k2', name: 'Crémant Brut',        category: 'Skumpa',   price: 120,    unit: 'st',  isBottle: true,  glassMode: false, qty: '' },

];

const CAT_COLORS = {
  'Sprit':     '#E74C3C',
  'Öl fat':    '#F39C12',
  'Öl flaska': '#E67E22',
  'Vin':       '#9B59B6',
  'Skumpa':    '#3498DB',
};

const UNIT_LABEL = { cl: 'cl', l: 'liter', st: 'st' };

async function loadItems() {
  const json = await AsyncStorage.getItem(INVENTORY_KEY);
  if (!json) return DEFAULT_ITEMS;
  const saved = JSON.parse(json);
  // Merge: keep saved, add any new defaults not yet in saved
  const savedIds = new Set(saved.map((i) => i.id));
  return [...saved, ...DEFAULT_ITEMS.filter((i) => !savedIds.has(i.id))];
}

async function persistItems(items) {
  await AsyncStorage.setItem(INVENTORY_KEY, JSON.stringify(items));
}

function itemCost(item) {
  const qty = parseFloat(item.qty) || 0;
  if (item.isBottle && item.glassMode) {
    return qty * (item.price / GLASSES_PER_BOTTLE);
  }
  return qty * item.price;
}

export default function InventoryScreen() {
  const [items, setItems] = useState([]);
  const [selectedCat, setSelectedCat] = useState('Sprit');
  const [showForm, setShowForm] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null); // id of item being price-edited
  const [form, setForm] = useState({ name: '', category: 'Vin', price: '', unit: 'st', isBottle: true });

  useEffect(() => { loadItems().then(setItems); }, []);

  async function update(id, patch) {
    const updated = items.map((i) => (i.id === id ? { ...i, ...patch } : i));
    setItems(updated);
    await persistItems(updated);
  }

  async function resetAll() {
    Alert.alert('Rensa räkning', 'Nollställa alla antal?', [
      { text: 'Avbryt', style: 'cancel' },
      {
        text: 'Nollställ',
        onPress: async () => {
          const updated = items.map((i) => ({ ...i, qty: '' }));
          setItems(updated);
          await persistItems(updated);
        },
      },
    ]);
  }

  async function addItem() {
    if (!form.name.trim()) { Alert.alert('Fyll i ett namn'); return; }
    if (!form.isBottle && !form.price) { Alert.alert('Fyll i ett pris'); return; }
    const newItem = {
      id: Date.now().toString(),
      name: form.name.trim(),
      category: form.category,
      price: parseFloat(form.price) || 0,
      unit: form.unit,
      isBottle: form.isBottle,
      glassMode: false,
      qty: '',
    };
    const updated = [...items, newItem];
    setItems(updated);
    await persistItems(updated);
    setForm({ name: '', category: 'Vin', price: '', unit: 'st', isBottle: true });
    setShowForm(false);
  }

  async function deleteItem(id) {
    Alert.alert('Ta bort vara', 'Är du säker?', [
      { text: 'Avbryt', style: 'cancel' },
      {
        text: 'Ta bort', style: 'destructive',
        onPress: async () => {
          const updated = items.filter((i) => i.id !== id);
          setItems(updated);
          await persistItems(updated);
        },
      },
    ]);
  }

  const categories = Array.from(new Set(items.map((i) => i.category)));
  const filtered = items.filter((i) => i.category === selectedCat);
  const total = items.reduce((sum, i) => sum + itemCost(i), 0);
  const filteredTotal = filtered.reduce((sum, i) => sum + itemCost(i), 0);
  const hasAnyQty = items.some((i) => parseFloat(i.qty) > 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Bar-inventering</Text>
            <Text style={styles.subtitle}>Fyll i antal — totalen räknas ut automatiskt</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable onPress={() => setShowSummary(true)} style={styles.summaryBtn}>
              <Ionicons name="bar-chart-outline" size={22} color="#fff" />
            </Pressable>
            <Pressable onPress={() => setShowForm(!showForm)} style={styles.addBtn}>
              <Ionicons name={showForm ? 'close' : 'add'} size={22} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* Total banner */}
        <View style={styles.totalBanner}>
          <View>
            <Text style={styles.totalLabel}>{selectedCat.toUpperCase()}</Text>
            <Text style={styles.totalAmount}>{filteredTotal.toFixed(2)} kr</Text>
          </View>
          <View style={styles.totalSub}>
            <Text style={styles.totalSubLabel}>Alla kategorier</Text>
            <Text style={styles.totalSubAmount}>{total.toFixed(2)} kr</Text>
          </View>
        </View>

        {/* Category tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          {categories.map((cat) => (
            <Pressable
              key={cat}
              style={[styles.tab, selectedCat === cat && styles.tabActive]}
              onPress={() => setSelectedCat(cat)}
            >
              <Text style={[styles.tabText, selectedCat === cat && styles.tabTextActive]}>{cat}</Text>
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {Object.keys(CAT_COLORS).map((cat) => {
                const isBottleCat = cat === 'Vin' || cat === 'Skumpa';
                return (
                  <Pressable
                    key={cat}
                    style={[styles.catChip, { backgroundColor: CAT_COLORS[cat] + (form.category === cat ? 'FF' : '55') }]}
                    onPress={() => setForm((f) => ({ ...f, category: cat, unit: isBottleCat ? 'st' : f.unit, isBottle: isBottleCat }))}
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
                placeholder={form.isBottle ? 'Pris per flaska (kr)' : 'Pris'}
                value={form.price}
                onChangeText={(v) => setForm((f) => ({ ...f, price: v }))}
                keyboardType="decimal-pad"
              />
              {!form.isBottle && (
                <View style={styles.unitPicker}>
                  {['cl', 'l', 'st'].map((u) => (
                    <Pressable
                      key={u}
                      style={[styles.unitBtn, form.unit === u && styles.unitBtnActive]}
                      onPress={() => setForm((f) => ({ ...f, unit: u }))}
                    >
                      <Text style={[styles.unitBtnText, form.unit === u && styles.unitBtnTextActive]}>{u}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
              {form.isBottle && (
                <View style={[styles.unitBtn, styles.unitBtnActive, { marginLeft: 8 }]}>
                  <Text style={styles.unitBtnTextActive}>kr/flaska</Text>
                </View>
              )}
            </View>

            <Pressable style={[styles.saveBtn, { marginTop: 12 }]} onPress={addItem}>
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
            const color = CAT_COLORS[item.category] || '#95A5A6';
            const pricePerGlass = item.price > 0 ? (item.price / GLASSES_PER_BOTTLE).toFixed(2) : null;
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
                            value={item.price > 0 ? String(item.price) : ''}
                            onChangeText={(v) => update(item.id, { price: parseFloat(v) || 0 })}
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
                              : '✏️ Tryck för att sätta pris'}
                          </Text>
                        </Pressable>
                      )
                    ) : (
                      <Text style={styles.itemPrice}>{item.price} kr/{UNIT_LABEL[item.unit]}</Text>
                    )}
                  </View>

                  <View style={styles.rowRight}>
                    {/* Flaska/Glas toggle for bottle items */}
                    {item.isBottle && (
                      <View style={styles.toggleRow}>
                        <Pressable
                          style={[styles.toggleBtn, !item.glassMode && { backgroundColor: color }]}
                          onPress={() => update(item.id, { glassMode: false })}
                        >
                          <Text style={[styles.toggleText, !item.glassMode && styles.toggleTextActive]}>
                            🍾
                          </Text>
                        </Pressable>
                        <Pressable
                          style={[styles.toggleBtn, item.glassMode && { backgroundColor: color }]}
                          onPress={() => update(item.id, { glassMode: true })}
                        >
                          <Text style={[styles.toggleText, item.glassMode && styles.toggleTextActive]}>
                            🥂
                          </Text>
                        </Pressable>
                      </View>
                    )}

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
                        {item.isBottle ? (item.glassMode ? 'glas' : 'fl.') : UNIT_LABEL[item.unit]}
                      </Text>
                    </View>

                    {qty > 0 ? (
                      <Text style={[styles.costText, { color }]}>{cost.toFixed(2)} kr</Text>
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
        <Modal visible={showSummary} transparent animationType="fade" onRequestClose={() => setShowSummary(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowSummary(false)}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text style={styles.modalTitle}>Svinnrapport</Text>
              <Text style={styles.modalSubtitle}>Kostnad per kategori</Text>

              {categories.map((cat) => {
                const catTotal = items
                  .filter((i) => i.category === cat)
                  .reduce((sum, i) => sum + itemCost(i), 0);
                const color = CAT_COLORS[cat] || '#95A5A6';
                return (
                  <View key={cat} style={styles.summaryRow}>
                    <View style={[styles.summaryDot, { backgroundColor: color }]} />
                    <Text style={styles.summaryCat}>{cat}</Text>
                    <Text style={[styles.summaryAmt, catTotal > 0 && { color }]}>
                      {catTotal.toFixed(2)} kr
                    </Text>
                  </View>
                );
              })}

              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryCat, { fontWeight: '800', color: '#2C3E50' }]}>TOTALT SVINN</Text>
                <Text style={[styles.summaryAmt, { fontWeight: '800', color: '#27AE60', fontSize: 18 }]}>
                  {total.toFixed(2)} kr
                </Text>
              </View>

              <Pressable style={styles.modalClose} onPress={() => setShowSummary(false)}>
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
  container: { flex: 1, backgroundColor: '#F5F6FA' },

  header: {
    backgroundColor: '#0F1923',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: { color: '#fff', fontSize: 24, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  resetBtn: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 10 },
  summaryBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 10 },
  addBtn: { backgroundColor: '#27AE60', borderRadius: 12, padding: 10 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#0F1923', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#95A5A6', marginBottom: 20 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  summaryDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  summaryCat: { flex: 1, fontSize: 15, fontWeight: '600', color: '#2C3E50' },
  summaryAmt: { fontSize: 15, fontWeight: '700', color: '#BDC3C7' },
  summaryDivider: { height: 1, backgroundColor: '#ECF0F1', marginVertical: 14 },
  modalClose: {
    marginTop: 20,
    backgroundColor: '#0F1923',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  modalCloseText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  totalBanner: {
    backgroundColor: '#1A252F',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  totalLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  totalAmount: { color: '#27AE60', fontSize: 28, fontWeight: '800', marginTop: 2 },
  totalSub: { alignItems: 'flex-end' },
  totalSubLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  totalSubAmount: { color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: '700' },

  tabScroll: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxHeight: 56,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  tab: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, marginRight: 6, backgroundColor: '#F5F6FA' },
  tabActive: { backgroundColor: '#0F1923' },
  tabText: { fontWeight: '600', color: '#7F8C8D', fontSize: 14 },
  tabTextActive: { color: '#fff' },

  form: {
    margin: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ECF0F1',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 10,
    backgroundColor: '#F9F9F9',
  },
  formRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unitPicker: { flexDirection: 'row', gap: 6 },
  unitBtn: { paddingHorizontal: 10, paddingVertical: 10, borderRadius: 10, backgroundColor: '#ECF0F1' },
  unitBtnActive: { backgroundColor: '#0F1923' },
  unitBtnText: { fontWeight: '700', color: '#7F8C8D', fontSize: 13 },
  unitBtnTextActive: { color: '#fff', fontWeight: '700', fontSize: 13 },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginRight: 6 },
  catChipText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  saveBtn: { backgroundColor: '#27AE60', borderRadius: 12, padding: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  list: { padding: 14, paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 8,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
  },
  rowActive: { elevation: 3, shadowOpacity: 0.12 },
  colorBar: { width: 5 },
  rowLeft: { flex: 1, padding: 14 },
  itemName: { fontSize: 15, fontWeight: '700', color: '#2C3E50' },
  itemPrice: { fontSize: 12, color: '#95A5A6', marginTop: 3 },
  priceEditRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  priceInput: {
    width: 90,
    borderWidth: 1.5,
    borderColor: '#3498DB',
    borderRadius: 8,
    padding: 6,
    fontSize: 14,
    fontWeight: '700',
    color: '#2C3E50',
    backgroundColor: '#EBF5FB',
  },
  priceInputUnit: { fontSize: 12, color: '#7F8C8D' },

  rowRight: { padding: 12, alignItems: 'flex-end', justifyContent: 'center', minWidth: 110 },
  toggleRow: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#ECF0F1',
  },
  toggleText: { fontSize: 14 },
  toggleTextActive: {},

  qtyWrapper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qtyInput: {
    width: 60,
    borderWidth: 1.5,
    borderColor: '#ECF0F1',
    borderRadius: 10,
    padding: 8,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    backgroundColor: '#F9F9F9',
  },
  qtyUnit: { fontSize: 12, color: '#95A5A6', fontWeight: '600' },
  costText: { fontSize: 15, fontWeight: '800', marginTop: 6 },
  costPlaceholder: { fontSize: 14, color: '#BDC3C7', marginTop: 6 },
});
