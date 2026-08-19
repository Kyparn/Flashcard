import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadCards, loadCategories, loadProgress } from '../utils/storage';

export default function HomeScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [cards, setCards] = useState([]);
  const [progress, setProgress] = useState({});

  const loadData = useCallback(async () => {
    const [cats, cds, prog] = await Promise.all([
      loadCategories(),
      loadCards(),
      loadProgress(),
    ]);
    setCategories(cats);
    setCards(cds);
    setProgress(prog);
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  function getCategoryStats(categoryId) {
    const catCards = cards.filter((c) => c.categoryId === categoryId);
    const total = catCards.length;
    const attempted = catCards.filter((c) => progress[c.id]).length;
    const correct = catCards.reduce((sum, c) => sum + (progress[c.id]?.correct || 0), 0);
    return { total, attempted, correct };
  }

  const totalCards = cards.length;
  const totalCorrect = Object.values(progress).reduce((sum, p) => sum + (p.correct || 0), 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
 
          <Text style={styles.title}>Välkommen Restaurang J</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalCards}</Text>
            <Text style={styles.statLabel}>Kort</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalCorrect}</Text>
            <Text style={styles.statLabel}>Rätt</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{categories.length}</Text>
            <Text style={styles.statLabel}>Kategorier</Text>
          </View>
        </View>
      </View>

      {/* Category cards */}
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.sectionLabel}>Kategorier</Text>}
        ListFooterComponent={
          <Pressable style={styles.manageBtn} onPress={() => navigation.navigate('Manage')}>
            <Text style={styles.manageBtnText}>✏️  Hantera kort</Text>
          </Pressable>
        }
        renderItem={({ item }) => {
          const { total, attempted, correct } = getCategoryStats(item.id);
          const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
          const started = attempted > 0;

          return (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: item.color },
                pressed && styles.cardPressed,
              ]}
              onPress={() => navigation.navigate('Study', { category: item })}
            >
              <View style={styles.cardTop}>
                {item.icon
                  ? <MaterialCommunityIcons name={item.icon} size={38} color="rgba(255,255,255,0.9)" />
                  : <Text style={styles.cardEmoji}>{item.emoji}</Text>
                }
                <View style={styles.cardBadge}>
                  <Text style={styles.cardBadgeText}>{total} kort</Text>
                </View>
              </View>

              <Text style={styles.cardName}>{item.name}</Text>

              <View style={styles.cardBottom}>
                <View style={styles.cardTrack}>
                  <View style={[styles.cardFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.cardPct}>
                  {started ? `${pct}%` : 'Starta'}
                </Text>
              </View>
            </Pressable>
          );
        }}
        numColumns={2}
        columnWrapperStyle={styles.row}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1923' },

  header: {
    backgroundColor: '#0F1923',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  greeting: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '500', marginBottom: 4 },
  title: {
    color: '#fff', fontSize: 20, fontWeight: '600',
    padding:10, marginBottom: 16, textAlign: "center"
  },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    paddingVertical: 12,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statNumber: { color: '#fff', fontSize: 20, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },

  list: { padding: 16, paddingBottom: 8, backgroundColor: '#F5F6FA', borderTopLeftRadius: 28, borderTopRightRadius: 28, flexGrow: 1 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#95A5A6', letterSpacing: 1, marginBottom: 14 },
  row: { gap: 12, marginBottom: 12 },

  card: {
    flex: 1,
    borderRadius: 22,
    padding: 18,
    minHeight: 160,
    justifyContent: 'space-between',
  },
  cardPressed: { opacity: 0.88, transform: [{ scale: 0.97 }] },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardEmoji: { fontSize: 36 },
  cardBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cardBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cardName: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 12 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  cardTrack: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  cardFill: { height: '100%', backgroundColor: '#fff', borderRadius: 10 },
  cardPct: { color: '#fff', fontSize: 13, fontWeight: '700', minWidth: 36, textAlign: 'right' },

  manageBtn: {
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: '#1A252F',
    borderRadius: 16,
    padding: 17,
    alignItems: 'center',
  },
  manageBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
