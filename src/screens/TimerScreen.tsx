import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { complexes, CUSTOM_TIMER_ID, getComplexById } from '../data/complexes';
import { useParkingTimer, TimerPhase } from '../hooks/useParkingTimer';
import RiskBadge from '../components/RiskBadge';
import { fontSize, spacing, borderRadius, fonts } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { showTimerMascot } from '../config/features';
import ScreenGradientBackdrop from '../components/ScreenGradientBackdrop';
import { formatVisitorLimitMinutes } from '../utils/parkingDisplay';

const TIMER_ON_WATCH_IMAGE = require('../../assets/timer-on-watch.png');

/** Web: shadow follows non-transparent pixels (no “card” box). */
const mascotWebDropShadow = {
  filter: 'drop-shadow(0 12px 14px rgba(0, 0, 0, 0.22)) drop-shadow(0 4px 6px rgba(0, 0, 0, 0.12))',
} as const;

/** iOS: light shadow on the image only (wrapper has no elevation). */
const mascotIosShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.18,
  shadowRadius: 12,
};

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export default function TimerScreen() {
  const { colors } = useTheme();
  const route = useRoute<any>();
  const timer = useParkingTimer();

  const PHASE_COLORS: Record<TimerPhase, string> = {
    idle: colors.primary,
    running: colors.safe,
    warning: colors.warning,
    critical: colors.danger,
    expired: colors.danger,
  };

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customMinutes, setCustomMinutes] = useState('');
  const [showSelector, setShowSelector] = useState(false);

  // Handle "Park Here" navigation from MapScreen
  useEffect(() => {
    const complexId = route.params?.complexId;
    if (complexId && !timer.isRunning) {
      setSelectedId(complexId);
      setShowSelector(false);
    }
  }, [route.params?.complexId, timer.isRunning]);

  const selectedComplex = useMemo(
    () => (selectedId && selectedId !== CUSTOM_TIMER_ID ? getComplexById(selectedId) : null),
    [selectedId],
  );

  const durationMinutes = useMemo(() => {
    if (selectedId === CUSTOM_TIMER_ID) {
      const parsed = parseInt(customMinutes, 10);
      return isNaN(parsed) || parsed <= 0 ? 0 : parsed;
    }
    return selectedComplex?.visitorTimeLimitMinutes ?? 0;
  }, [selectedId, selectedComplex, customMinutes]);

  const canStart = durationMinutes > 0 && !timer.isRunning;

  const handleStart = useCallback(() => {
    if (canStart) {
      if (Platform.OS !== 'web') {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      const complexId = selectedId !== CUSTOM_TIMER_ID ? selectedId ?? undefined : undefined;
      timer.start(durationMinutes, complexId);
    }
  }, [canStart, durationMinutes, selectedId, timer]);

  const phaseColor = PHASE_COLORS[timer.phase];

  const styles = createStyles(colors);
  const tickAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const shouldPulse =
      timer.isRunning && (timer.phase === 'running' || timer.phase === 'warning' || timer.phase === 'critical');
    if (!shouldPulse) {
      tickAnim.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(tickAnim, { toValue: 1.02, duration: 900, useNativeDriver: true }),
        Animated.timing(tickAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [timer.isRunning, timer.phase, tickAnim]);

  // ─── Active Timer View ───
  if (timer.isRunning || timer.phase === 'expired') {
    return (
      <ScreenGradientBackdrop>
      <View style={styles.container}>
        <View style={styles.timerActive}>
          {selectedComplex && (
            <View style={styles.activeComplexInfo}>
              <Text style={styles.activeComplexName}>{selectedComplex.name}</Text>
              <RiskBadge level={selectedComplex.riskLevel} />
            </View>
          )}
          {selectedId === CUSTOM_TIMER_ID && (
            <Text style={styles.activeComplexName}>Custom Timer</Text>
          )}

          <Animated.Text
            style={[styles.countdown, { color: phaseColor, transform: [{ scale: tickAnim }] }]}
          >
            {formatTime(timer.remainingSeconds)}
          </Animated.Text>

          <Text style={[styles.phaseLabel, { color: phaseColor }]}>
            {timer.phase === 'running' && "You're good \u2014 timer running"}
            {timer.phase === 'warning' && "Heads up \u2014 under 10 minutes"}
            {timer.phase === 'critical' && "Move now \u2014 under 5 minutes!"}
            {timer.phase === 'expired' && "Time is up \u2014 move your car!"}
          </Text>

          {showTimerMascot && timer.phase !== 'expired' && (
            <View style={styles.timerMascotWrap}>
              <View style={styles.mascotGroundShadow} pointerEvents="none" />
              <Image
                source={TIMER_ON_WATCH_IMAGE}
                style={[
                  styles.timerMascot,
                  Platform.OS === 'web' ? (mascotWebDropShadow as object) : null,
                  Platform.OS === 'ios' ? mascotIosShadow : null,
                ]}
                resizeMode="contain"
                accessibilityLabel="BootWatch scout on watch"
              />
            </View>
          )}

          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: phaseColor,
                  width: timer.totalSeconds > 0
                    ? `${(timer.remainingSeconds / timer.totalSeconds) * 100}%`
                    : '0%',
                },
              ]}
            />
          </View>

          <Pressable style={styles.cancelButton} onPress={timer.cancel}>
            <Ionicons name="stop-circle-outline" size={22} color={colors.danger} />
            <Text style={styles.cancelButtonText}>
              {timer.phase === 'expired' ? 'Dismiss' : "I'm Leaving"}
            </Text>
          </Pressable>
        </View>

        {timer.permissionStatus !== 'granted' && (
          <View style={styles.permissionBanner}>
            <Ionicons name="notifications-off-outline" size={18} color={colors.warning} />
            <Text style={styles.permissionText}>
              Notifications disabled — you won't get alerts when time is low or booter is reported in area.
            </Text>
          </View>
        )}
      </View>
      </ScreenGradientBackdrop>
    );
  }

  // ─── Setup View ───
  return (
    <ScreenGradientBackdrop>
    <ScrollView style={styles.container} contentContainerStyle={styles.setupContent}>
      <Text style={styles.heading}>Start a Parking Timer</Text>
      <Text style={styles.subheading}>Select where you're parked</Text>

      {/* Selected complex preview */}
      {selectedComplex && !showSelector && (
        <Pressable style={styles.selectedCard} onPress={() => setShowSelector(true)}>
          <View style={styles.selectedCardHeader}>
            <Text style={styles.selectedCardName}>{selectedComplex.name}</Text>
            <RiskBadge level={selectedComplex.riskLevel} />
          </View>
          <Text style={styles.selectedCardDetail}>
            {formatVisitorLimitMinutes(selectedComplex.visitorTimeLimitMinutes)} limit ·{' '}
            {selectedComplex.bootingCompany ?? 'No boot company'}
          </Text>
          <Text style={styles.changeText}>Tap to change</Text>
        </Pressable>
      )}

      {/* Custom timer preview */}
      {selectedId === CUSTOM_TIMER_ID && !showSelector && (
        <View style={styles.customTimerCard}>
          <Text style={styles.selectedCardName}>Custom Timer</Text>
          <View style={styles.customInputRow}>
            <TextInput
              style={styles.customInput}
              value={customMinutes}
              onChangeText={setCustomMinutes}
              placeholder="30"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              maxLength={3}
            />
            <Text style={styles.customInputLabel}>minutes</Text>
          </View>
          <Pressable onPress={() => setShowSelector(true)}>
            <Text style={styles.changeText}>Select a complex instead</Text>
          </Pressable>
        </View>
      )}

      {/* Complex selector */}
      {(showSelector || !selectedId) && (
        <View style={styles.selectorList}>
          <Pressable
            style={[styles.selectorItem, selectedId === CUSTOM_TIMER_ID && styles.selectorItemActive]}
            onPress={() => { setSelectedId(CUSTOM_TIMER_ID); setShowSelector(false); }}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary} />
            <Text style={styles.selectorItemText}>Custom Timer</Text>
          </Pressable>

          {complexes.map((c) => (
            <Pressable
              key={c.id}
              style={[styles.selectorItem, selectedId === c.id && styles.selectorItemActive]}
              onPress={() => { setSelectedId(c.id); setShowSelector(false); }}
            >
              <View style={[styles.riskDot, { backgroundColor: colors[c.riskLevel === 'high' ? 'danger' : c.riskLevel === 'moderate' ? 'warning' : 'safe'] }]} />
              <View style={styles.selectorItemContent}>
                <Text style={styles.selectorItemText}>{c.name}</Text>
                <Text style={styles.selectorItemMeta}>{c.visitorTimeLimitMinutes ?? '?'} min</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* Duration summary + Start button */}
      {selectedId && !showSelector && (
        <View style={styles.startSection}>
          <Text style={styles.durationSummary}>
            Timer: {durationMinutes > 0 ? formatVisitorLimitMinutes(durationMinutes) : 'Enter a duration'}
          </Text>
          <Pressable
            style={[styles.startButton, !canStart && styles.startButtonDisabled]}
            onPress={handleStart}
            disabled={!canStart}
          >
            <Ionicons name="timer" size={22} color={colors.textInverse} />
            <Text style={styles.startButtonText}>Start Timer</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
    </ScreenGradientBackdrop>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  setupContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  heading: {
    fontSize: fontSize.xxl,
    fontFamily: fonts.displayBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subheading: {
    fontSize: fontSize.md,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },

  // Selected complex card
  selectedCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  selectedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  selectedCardName: {
    fontSize: fontSize.lg,
    fontFamily: fonts.display,
    color: colors.text,
  },
  selectedCardDetail: {
    fontSize: fontSize.sm,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  changeText: {
    fontSize: fontSize.sm,
    fontFamily: fonts.bodyMedium,
    color: colors.primary,
  },

  // Custom timer card
  customTimerCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  customInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.xl,
    fontFamily: fonts.displayBold,
    color: colors.text,
    width: 80,
    textAlign: 'center',
  },
  customInputLabel: {
    fontSize: fontSize.md,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },

  // Selector list
  selectorList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  selectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  selectorItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.infoTint,
  },
  selectorItemContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorItemText: {
    fontSize: fontSize.md,
    fontFamily: fonts.bodyMedium,
    color: colors.text,
  },
  selectorItemMeta: {
    fontSize: fontSize.sm,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  riskDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Start section
  startSection: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  durationSummary: {
    fontSize: fontSize.md,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  startButtonDisabled: {
    opacity: 0.4,
  },
  startButtonText: {
    color: colors.textInverse,
    fontSize: fontSize.lg,
    fontFamily: fonts.display,
  },

  // Active timer
  timerActive: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  activeComplexInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  activeComplexName: {
    fontSize: fontSize.lg,
    fontFamily: fonts.display,
    color: colors.text,
  },
  timerMascotWrap: {
    width: '100%',
    maxWidth: 300,
    height: 200,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  /** Soft “contact shadow” under the character — not a box around the art. */
  mascotGroundShadow: {
    position: 'absolute',
    bottom: 6,
    width: '36%',
    maxWidth: 105,
    height: 18,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    transform: [{ scaleX: 1.05 }],
  },
  timerMascot: {
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  countdown: {
    fontSize: fontSize.display,
    fontFamily: fonts.displayBold,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  phaseLabel: {
    fontSize: fontSize.md,
    fontFamily: fonts.bodyMedium,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
  progressBarTrack: {
    width: '80%',
    height: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  cancelButtonText: {
    color: colors.danger,
    fontSize: fontSize.lg,
    fontFamily: fonts.bodyMedium,
  },

  // Permission banner
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    padding: spacing.md,
    margin: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  permissionText: {
    fontSize: fontSize.sm,
    fontFamily: fonts.body,
    color: colors.text,
    flex: 1,
  },
});
}
