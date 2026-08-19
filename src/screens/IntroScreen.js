import { Video, ResizeMode } from 'expo-av';
import { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

export default function IntroScreen({ onDone }) {
  const videoRef = useRef(null);

  return (
    <Pressable style={styles.container} onPress={onDone}>
      <Video
        ref={videoRef}
        source={require('../../assets/cocktail.mp4')}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay
        isLooping={false}
        onPlaybackStatusUpdate={(status) => {
          if (status.didJustFinish) onDone();
        }}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  video: { flex: 1 },
});
