import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Complex } from '../types/complex';
import RiskBadge from './RiskBadge';
import { fontSize, spacing, borderRadius, shadowFloat } from '../theme';
import { fonts } from '../theme/fonts';
import { useTheme } from '../context/ThemeContext';
import { formatParkingHoursSummary, formatVisitorLimitMinutes } from '../utils/parkingDisplay';

interface Props {
  complex: Complex | null;
  visible: boolean;
  onClose: () => void;
  onParkHere: (complex: Complex) => void;
  lastSightingAt?: Date | null;
  isSaved?: boolean;
  onToggleSave?: (complex: Complex) => void;
  sightingCount?: number;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ComplexDetailSheet({
  complex,
  visible,
  onClose,
  onParkHere,
  lastSightingAt,
  isSaved,
  onToggleSave,
  sightingCount,
}: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  if (!complex) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View style={styles.sheet}>
          <View style={styles.accentStrip} />
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.name} numberOfLines={2}>
              {complex.name}
            </Text>
            <RiskBadge level={complex.riskLevel} />
          </View>

          <Text style={styles.address}>{complex.address}</Text>

          <View style={[styles.sightingBanner, lastSightingAt ? styles.sightingBannerActive : styles.sightingBannerNone]}>
            <Ionicons
              name={lastSightingAt ? 'warning' : 'checkmark-circle-outline'}
              size={18}
              color={lastSightingAt ? colors.danger : colors.safe}
            />
            <Text style={[styles.sightingText, { color: lastSightingAt ? colors.danger : colors.safe }]}>
              {lastSightingAt
                ? `Booter last reported ${formatTimeAgo(lastSightingAt)}`
                : 'No recent booter reports'}
            </Text>
          </View>

          {sightingCount != null && sightingCount > 0 && (
            <View style={styles.statRow}>
              <Ionicons name="stats-chart" size={16} color={colors.accent} />
              <Text style={styles.statText}>
                {sightingCount} {sightingCount === 1 ? 'report' : 'reports'} in the last 30 days
              </Text>
            </View>
          )}

          <View style={styles.infoGrid}>
            <InfoRow
              icon="time-outline"
              label="Visitor limit"
              value={formatVisitorLimitMinutes(complex.visitorTimeLimitMinutes)}
              styles={styles}
              colors={colors}
            />
            <InfoRow
              icon="car-outline"
              label="Boot company"
              value={complex.bootingCompany ?? 'None reported'}
              styles={styles}
              colors={colors}
            />
            <InfoRow
              icon="calendar-outline"
              label="Parking hours"
              value={formatParkingHoursSummary(complex)}
              styles={styles}
              colors={colors}
            />
          </View>

          {complex.notes && <Text style={styles.notes}>{complex.notes}</Text>}

          {onToggleSave && (
            <Pressable
              style={[styles.followRow, isSaved && styles.followRowActive]}
              onPress={() => onToggleSave(complex)}
            >
              <Ionicons
                name={isSaved ? 'notifications' : 'notifications-outline'}
                size={20}
                color={isSaved ? colors.accent : colors.textSecondary}
              />
              <View style={styles.followTextContainer}>
                <Text style={[styles.followLabel, isSaved && styles.followLabelActive]}>
                  {isSaved ? 'Following' : 'Follow this complex'}
                </Text>
                <Text style={styles.followDescription}>
                  {isSaved
                    ? 'You will be notified when a booter is spotted here'
                    : 'Get push alerts when a boot truck is reported here'}
                </Text>
              </View>
              {isSaved && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
            </Pressable>
          )}

          <Pressable style={styles.parkButton} onPress={() => onParkHere(complex)}>
            <Ionicons name="timer-outline" size={20} color={colors.textInverse} />
            <Text style={styles.parkButtonText}>Park here</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function InfoRow({
  icon,
  label,
  value,
  multiline,
  styles,
  colors,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  multiline?: boolean;
  styles: Record<string, object>;
  colors: import('../theme').AppColors;
}) {
  return (
    <View style={styles.infoCard}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <View style={styles.infoCardText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, multiline && styles.infoValueMultiline]}>{value}</Text>
      </View>
    </View>
  );
}

function createStyles(colors: import('../theme').AppColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(15, 23, 42, 0.45)',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      paddingTop: spacing.xs,
      maxHeight: '88%',
      overflow: 'hidden',
      ...shadowFloat,
    },
    accentStrip: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      backgroundColor: colors.accent,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
    },
    handle: {
      width: 44,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: spacing.md,
      marginTop: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    name: {
      flex: 1,
      fontSize: fontSize.xl,
      fontFamily: fonts.displayBold,
      color: colors.text,
    },
    address: {
      fontSize: fontSize.sm,
      fontFamily: fonts.body,
      color: colors.textSecondary,
      marginBottom: spacing.md,
    },
    sightingBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
      marginBottom: spacing.md,
      borderWidth: 1,
    },
    sightingBannerActive: {
      backgroundColor: colors.dangerLight,
      borderColor: colors.danger,
    },
    sightingBannerNone: {
      backgroundColor: colors.safeLight,
      borderColor: colors.safe,
    },
    sightingText: {
      fontSize: fontSize.sm,
      fontFamily: fonts.bodyMedium,
      flex: 1,
    },
    statRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    statText: {
      fontSize: fontSize.sm,
      fontFamily: fonts.body,
      color: colors.textSecondary,
    },
    infoGrid: {
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    infoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoCardText: {
      flex: 1,
    },
    infoLabel: {
      fontSize: fontSize.xs,
      fontFamily: fonts.body,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 2,
    },
    infoValue: {
      fontSize: fontSize.md,
      fontFamily: fonts.bodyMedium,
      color: colors.text,
    },
    infoValueMultiline: {
      lineHeight: 22,
    },
    notes: {
      fontSize: fontSize.sm,
      fontFamily: fonts.body,
      color: colors.textSecondary,
      fontStyle: 'italic',
      marginBottom: spacing.lg,
      lineHeight: 20,
    },
    followRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      marginBottom: spacing.sm,
    },
    followRowActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    followTextContainer: {
      flex: 1,
    },
    followLabel: {
      fontSize: fontSize.sm,
      fontFamily: fonts.bodyMedium,
      color: colors.text,
    },
    followLabelActive: {
      color: colors.accent,
    },
    followDescription: {
      fontSize: fontSize.xs,
      fontFamily: fonts.body,
      color: colors.textSecondary,
      marginTop: 2,
    },
    parkButton: {
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md + 2,
      borderRadius: borderRadius.md,
      gap: spacing.sm,
    },
    parkButtonText: {
      color: colors.textInverse,
      fontSize: fontSize.lg,
      fontFamily: fonts.display,
    },
  });
}
