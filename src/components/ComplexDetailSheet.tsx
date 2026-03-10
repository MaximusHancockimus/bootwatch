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
}

export default function ComplexDetailSheet({ complex, visible, onClose, onParkHere }: Props) {
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
