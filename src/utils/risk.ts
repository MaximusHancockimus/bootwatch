import { RiskLevel } from '../types/complex';
import { colors as defaultColors, AppColors } from '../theme';

export const RISK_CONFIG: Record<RiskLevel, { color: string; label: string; bgColor: string }> = {
  high: { color: defaultColors.danger, label: 'High Risk', bgColor: defaultColors.dangerLight },
  moderate: { color: defaultColors.warning, label: 'Moderate', bgColor: defaultColors.warningLight },
  low: { color: defaultColors.safe, label: 'Low Risk', bgColor: defaultColors.safeLight },
  unknown: { color: defaultColors.neutral, label: 'Unknown', bgColor: defaultColors.neutralLight },
};

export function getRiskConfig(colors: AppColors): typeof RISK_CONFIG {
  return {
    high: { color: colors.danger, label: 'High Risk', bgColor: colors.dangerLight },
    moderate: { color: colors.warning, label: 'Moderate', bgColor: colors.warningLight },
    low: { color: colors.safe, label: 'Low Risk', bgColor: colors.safeLight },
    unknown: { color: colors.neutral, label: 'Unknown', bgColor: colors.neutralLight },
  };
}
