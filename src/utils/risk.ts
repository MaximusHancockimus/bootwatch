import { RiskLevel } from '../types/complex';
import { colors } from '../theme';

export const RISK_CONFIG: Record<RiskLevel, { color: string; label: string; bgColor: string }> = {
  high: { color: colors.danger, label: 'High Risk', bgColor: colors.dangerLight },
  moderate: { color: colors.warning, label: 'Moderate', bgColor: colors.warningLight },
  low: { color: colors.safe, label: 'Low Risk', bgColor: colors.safeLight },
  unknown: { color: colors.neutral, label: 'Unknown', bgColor: colors.neutralLight },
};
