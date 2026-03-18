import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Complex } from '../types/complex';
import RiskBadge from './RiskBadge';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../theme';

interface Props {
  complex: Complex | null;
  visible: boolean;
  onClose: () => void;
  onParkHere: (complex: Complex) => void;
  lastSightingAt?: Date | null;
  isSaved?: boolean;
  onToggleSave?: (complex: Complex) => void;
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

export default function ComplexDetailSheet({ complex, visible, onClose, onParkHere, lastSightingAt, isSaved, onToggleSave }: Props) {
  if (!complex) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.name}>{complex.name}</Text>
            <RiskBadge level={complex.riskLevel} />
          </View>

          <Text style={styles.address}>{complex.address}</Text>

          {/* Last sighting banner */}
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

          <View style={styles.infoGrid}>
            <InfoRow
              icon="time-outline"
              label="Visitor Limit"
              value={complex.visitorTimeLimitMinutes ? `${complex.visitorTimeLimitMinutes} min` : 'Unknown'}
            />
            <InfoRow
              icon="car-outline"
              label="Boot Company"
              value={complex.bootingCompany ?? 'None reported'}
            />
            <InfoRow
              icon="information-circle-outline"
              label="Signage"
              value={complex.signageQuality.charAt(0).toUpperCase() + complex.signageQuality.slice(1)}
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
                color={isSaved ? colors.primary : colors.textSecondary}
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
              {isSaved && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              )}
            </Pressable>
          )}

          <Pressable
            style={styles.parkButton}
            onPress={() => onParkHere(complex)}
          >
            <Ionicons name="timer-outline" size={20} color={colors.textInverse} />
            <Text style={styles.parkButtonText}>Park Here</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={colors.textSecondary} />
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  address: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  sightingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  sightingBannerActive: {
    backgroundColor: colors.dangerLight,
  },
  sightingBannerNone: {
    backgroundColor: colors.safeLight,
  },
  sightingText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  infoGrid: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  notes: {
    fontSize: fontSize.sm,
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
    borderColor: colors.primary,
    backgroundColor: '#EFF6FF',
  },
  followTextContainer: {
    flex: 1,
  },
  followLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  followLabelActive: {
    color: colors.primary,
  },
  followDescription: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  parkButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  parkButtonText: {
    color: colors.textInverse,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
});
