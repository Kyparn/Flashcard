import { Video, ResizeMode } from "expo-av";
import { useRef } from "react";
import { Pressable, StyleSheet, View, Text } from "react-native";

export default function IntroScreen({ onDone }) {
  const videoRef = useRef(null);

  return (
    <Pressable style={styles.container} onPress={onDone}>
      <Text>Hugo</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  video: { flex: 1 },
});
