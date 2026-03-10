import { StyleSheet, Text, View } from 'react-native';
import { RiskLevel } from '../types/complex';
import { RISK_CONFIG } from '../utils/risk';
import { borderRadius, fontSize, fontWeight, spacing } from '../theme';

interface Props {
  level: RiskLevel;
}

export default function RiskBadge({ level }: Props) {
  const config = RISK_CONFIG[level];
  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});
