import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { loadCards, loadCategories, saveCards } from '../utils/storage';

export default function ManageScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [cards, setCards] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    async function load() {
      const [cats, cds] = await Promise.all([loadCategories(), loadCards()]);
      setCategories(cats);
      setCards(cds);
      if (cats.length) setSelectedCat(cats[0]);
    }
    load();
  }, []);

  async function addCard() {
    if (!question.trim() || !answer.trim()) {
      Alert.alert('Fyll i både fråga och svar');
      return;
    }
    const newCard = {
      id: Date.now().toString(),
      categoryId: selectedCat.id,
      question: question.trim(),
      answer: answer.trim(),
    };
    const updated = [...cards, newCard];
    await saveCards(updated);
    setCards(updated);
    setQuestion('');
    setAnswer('');
    setShowForm(false);
  }

  async function deleteCard(id) {
    Alert.alert('Ta bort kort', 'Är du säker?', [
      { text: 'Avbryt', style: 'cancel' },
      {
        text: 'Ta bort',
        style: 'destructive',
        onPress: async () => {
          const updated = cards.filter((c) => c.id !== id);
          await saveCards(updated);
          setCards(updated);
        },
      },
    ]);
  }

  const filteredCards = cards.filter((c) => c.categoryId === selectedCat?.id);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Tillbaka</Text>
        </Pressable>
        <Text style={styles.title}>Hantera kort</Text>
        <Pressable onPress={() => setShowForm(true)}>
          <Text style={styles.addText}>+ Ny</Text>
        </Pressable>
      </View>

      {/* Category tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {categories.map((cat) => (
          <Pressable
            key={cat.id}
            style={[styles.tab, selectedCat?.id === cat.id && { borderBottomColor: cat.color, borderBottomWidth: 3 }]}
            onPress={() => setSelectedCat(cat)}
          >
            <Text style={styles.tabText}>{cat.emoji} {cat.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {showForm && (
        <View style={[styles.form, { borderLeftColor: selectedCat?.color }]}>
          <TextInput
            style={styles.input}
            placeholder="Fråga..."
            value={question}
            onChangeText={setQuestion}
            multiline
          />
          <TextInput
            style={styles.input}
            placeholder="Svar..."
            value={answer}
            onChangeText={setAnswer}
            multiline
          />
          <View style={styles.formButtons}>
            <Pressable style={styles.cancelBtn} onPress={() => setShowForm(false)}>
              <Text style={styles.cancelBtnText}>Avbryt</Text>
            </Pressable>
            <Pressable style={[styles.saveBtn, { backgroundColor: selectedCat?.color }]} onPress={addCard}>
              <Text style={styles.saveBtnText}>Spara</Text>
            </Pressable>
          </View>
        </View>
      )}

      <FlatList
        data={filteredCards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Inga kort ännu. Tryck + Ny för att lägga till.</Text>}
        renderItem={({ item }) => (
          <View style={[styles.cardItem, { borderLeftColor: selectedCat?.color }]}>
            <View style={styles.cardItemContent}>
              <Text style={styles.cardQ}>{item.question}</Text>
              <Text style={styles.cardA}>{item.answer}</Text>
            </View>
            <Pressable onPress={() => deleteCard(item.id)} style={styles.deleteBtn}>
              <Text style={styles.deleteText}>🗑</Text>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  backText: { fontSize: 16, color: '#2C3E50', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700', color: '#2C3E50' },
  addText: { fontSize: 16, color: '#3498DB', fontWeight: '700' },
  tabs: { paddingHorizontal: 12, maxHeight: 50, marginBottom: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 10, marginRight: 4 },
  tabText: { fontSize: 15, fontWeight: '600', color: '#2C3E50' },
  form: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ECF0F1',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    fontSize: 15,
    minHeight: 48,
    backgroundColor: '#F9F9F9',
  },
  formButtons: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#ECF0F1',
    alignItems: 'center',
  },
  cancelBtnText: { fontWeight: '600', color: '#7F8C8D' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { fontWeight: '700', color: '#fff' },
  list: { padding: 16 },
  empty: { textAlign: 'center', color: '#95A5A6', marginTop: 40, fontSize: 15 },
  cardItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardItemContent: { flex: 1 },
  cardQ: { fontWeight: '700', color: '#2C3E50', fontSize: 15, marginBottom: 4 },
  cardA: { color: '#7F8C8D', fontSize: 14, lineHeight: 20 },
  deleteBtn: { padding: 8 },
  deleteText: { fontSize: 20 },
});
