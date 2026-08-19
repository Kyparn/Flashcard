import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FlipCard from '../components/FlipCard';
import { loadCards } from '../utils/storage';

export default function StudyScreen({ route, navigation }) {
  const { category } = route.params;
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    loadCards().then((all) => {
      const filtered = all.filter((c) => c.categoryId === category.id);
      setCards(filtered.sort(() => Math.random() - 0.5));
    });
  }, [category.id]);

  function nextCard() {
    if (index + 1 >= cards.length) {
      setFinished(true);
    } else {
      setIndex(index + 1);
    }
  }

  function restart() {
    setIndex(0);
    setScore({ correct: 0, incorrect: 0 });
    setFinished(false);
    setCards((c) => [...c].sort(() => Math.random() - 0.5));
  }

  if (!cards.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyText}>Inga kort i den här kategorin ännu.</Text>
          <Pressable onPress={() => navigation.navigate('Manage')} style={[styles.actionBtn, { backgroundColor: category.color }]}>
            <Text style={styles.actionBtnText}>Lägg till kort</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (finished) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: category.color }]}>
        <View style={styles.resultContainer}>
          <Text style={styles.resultEmoji}>🎉</Text>
          <Text style={styles.resultTitle}>Alla kort klara!</Text>
          <Text style={styles.resultScore}>{cards.length} kort genomgångna</Text>

          <Pressable style={styles.resultBtn} onPress={restart}>
            <Text style={[styles.resultBtnText, { color: category.color }]}>↺  Kör igen</Text>
          </Pressable>

          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.resultBack}>← Tillbaka</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const card = cards[index];
  const progressPct = ((index) / cards.length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← {category.name}</Text>
        </Pressable>
        <Text style={styles.progressText}>{index + 1} / {cards.length}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: category.color }]} />
      </View>

      {/* Card */}
      <View style={styles.cardWrapper}>
        <FlipCard
          key={card.id}
          question={card.question}
          answer={card.answer}
          color={category.color}
        />
      </View>

      {/* Next button */}
      <View style={styles.buttons}>
        <Pressable
          style={({ pressed }) => [styles.btn, styles.nextBtn, pressed && styles.btnPressed]}
          onPress={nextCard}
        >
          <Text style={styles.btnText}>Nästa  →</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backText: { fontSize: 16, color: '#2C3E50', fontWeight: '600' },
  progressText: { fontSize: 15, color: '#95A5A6', fontWeight: '600' },
  progressTrack: {
    height: 5,
    backgroundColor: '#ECF0F1',
    marginHorizontal: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 10, minWidth: 4 },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  scoreChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  correctChip: { backgroundColor: '#EAFAF1' },
  wrongChip: { backgroundColor: '#FDEDEC' },
  scoreChipText: { fontWeight: '700', fontSize: 15 },
  cardWrapper: { flex: 1, paddingHorizontal: 20, justifyContent: 'center' },
  buttons: { flexDirection: 'row', padding: 20, gap: 14 },
  btn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  btnPressed: { opacity: 0.8, transform: [{ scale: 0.97 }] },
  nextBtn: { backgroundColor: '#27AE60' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#7F8C8D', textAlign: 'center', marginBottom: 24 },
  actionBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  resultContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  resultEmoji: { fontSize: 64, marginBottom: 8 },
  resultTitle: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 24 },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  resultPct: { fontSize: 56, fontWeight: '800', color: '#2C3E50' },
  resultScore: { fontSize: 16, color: '#95A5A6', marginBottom: 16 },
  resultTrack: {
    height: 8,
    backgroundColor: '#ECF0F1',
    borderRadius: 10,
    overflow: 'hidden',
    width: '100%',
  },
  resultFill: { height: '100%', borderRadius: 10 },
  resultBtn: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 40,
    marginBottom: 16,
  },
  resultBtnText: { fontWeight: '800', fontSize: 17 },
  resultBack: { color: 'rgba(255,255,255,0.7)', fontWeight: '600', fontSize: 15 },
});
