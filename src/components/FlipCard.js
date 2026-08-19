import React, { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

const FlipCard =({ question, answer, color }) => {
  const [flipped, setFlipped] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const frontRotate = anim.interpolate({ inputRange: [0, 180], outputRange: ['0deg', '180deg'] });
  const backRotate = anim.interpolate({ inputRange: [0, 180], outputRange: ['180deg', '360deg'] });

  function flip() {
    Animated.spring(anim, {
      toValue: flipped ? 0 : 180,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setFlipped(!flipped);
  }

  return (
    <Pressable onPress={flip} style={styles.container}>
      {/* Front */}
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: color, transform: [{ perspective: 1000 }, { rotateY: frontRotate }] },
        ]}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>FRÅGA</Text>
        </View>
        <Text style={styles.text}>{question}</Text>
        <Text style={styles.hint}>Tryck för att se svaret  ↻</Text>
      </Animated.View>

      {/* Back */}
      <Animated.View
        style={[
          styles.card,
          styles.cardBack,
          { transform: [{ perspective: 1000 }, { rotateY: backRotate }] },
        ]}
      >
        <View style={[styles.badge, styles.badgeBack]}>
          <Text style={styles.badgeText}>SVAR</Text>
        </View>
        <Text style={[styles.text, styles.textBack]}>{answer}</Text>
        <Text style={[styles.hint, { color: 'rgba(255,255,255,0.35)' }]}>Tryck för att se frågan  ↻</Text>
        <View style={[styles.accentBar, { backgroundColor: color }]} />
      </Animated.View>
    </Pressable>
  );
}

export default FlipCard

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 300,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 24,
    paddingHorizontal: 30,
    paddingVertical: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backfaceVisibility: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  cardBack: {
    backgroundColor: '#1A252F',
  },
  badge: {
    position: 'absolute',
    top: 18,
    left: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeBack: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  text: {
    color: '#fff',
    fontSize: 21,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 32,
  },
  textBack: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 28,
    color: '#ECF0F1',
  },
  hint: {
    position: 'absolute',
    bottom: 18,
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
  },
  accentBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 5,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
});
