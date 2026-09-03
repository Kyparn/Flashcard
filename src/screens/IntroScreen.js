import { Video, ResizeMode } from "expo-av";
import { useRef } from "react";
import { Pressable, StyleSheet, View, Text } from "react-native";

export default function IntroScreen({ onDone }) {
  const videoRef = useRef(null);

  return (
    <Pressable style={styles.container} onPress={onDone}>
      <View>
        <Text style={styles.text}>Hugo</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  video: { flex: 1 },
  text: { color: white },
});
