export const lightColors = {
  primary: '#1A73E8',
  primaryDark: '#1557B0',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  safe: '#16A34A',
  safeLight: '#DCFCE7',
  neutral: '#6B7280',
  neutralLight: '#F3F4F6',
  background: '#FFFFFF',
  surface: '#F9FAFB',
  text: '#111827',
  textSecondary: '#6B7280',
  textInverse: '#FFFFFF',
  border: '#E5E7EB',
  tabBarBackground: '#FFFFFF',
  tabBarActive: '#1A73E8',
  tabBarInactive: '#9CA3AF',
  infoTint: '#EFF6FF',
} as const;

export const darkColors: typeof lightColors = {
  primary: '#5B9CF6',
  primaryDark: '#3B82F6',
  danger: '#EF4444',
  dangerLight: '#451A1A',
  warning: '#FBBF24',
  warningLight: '#422006',
  safe: '#34D399',
  safeLight: '#064E3B',
  neutral: '#9CA3AF',
  neutralLight: '#374151',
  background: '#111827',
  surface: '#1F2937',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textInverse: '#111827',
  border: '#374151',
  tabBarBackground: '#1F2937',
  tabBarActive: '#5B9CF6',
  tabBarInactive: '#6B7280',
  infoTint: '#1E3A5F',
};

export type AppColors = typeof lightColors;

// Keep static export for backward compat during migration; prefer useTheme()
export const colors = lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 24,
  xxl: 32,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 9999,
} as const;
