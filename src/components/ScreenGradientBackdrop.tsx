import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

/**
 * Subtle vertical gradient behind screen content (theme background → surface → surfaceMuted).
 */
export default function ScreenGradientBackdrop({ children }: { children: ReactNode }) {
  const { colors } = useTheme();

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.background, colors.surface, colors.surfaceMuted]}
        locations={[0, 0.42, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.foreground}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  foreground: {
    flex: 1,
  },
});
