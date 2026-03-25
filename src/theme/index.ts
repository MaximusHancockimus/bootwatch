export type AppColors = {
  primary: string;
  primaryDark: string;
  accent: string;
  accentSoft: string;
  danger: string;
  dangerLight: string;
  warning: string;
  warningLight: string;
  safe: string;
  safeLight: string;
  neutral: string;
  neutralLight: string;
  background: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textSecondary: string;
  textInverse: string;
  border: string;
  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;
  infoTint: string;
};

export const lightColors: AppColors = {
  primary: '#0F766E',
  primaryDark: '#115E59',
  /** Brand “watch” highlight — tabs, timer accents, feed energy */
  accent: '#D97706',
  accentSoft: '#FFFBEB',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  /** Same as heat map “low” (HEAT_COLORS.low) — map pins + badges stay consistent */
  safe: '#16A34A',
  safeLight: '#DCFCE7',
  neutral: '#64748B',
  neutralLight: '#F1F5F9',
  background: '#FAFAF8',
  surface: '#F1F0ED',
  surfaceMuted: '#E7E5E1',
  text: '#0F172A',
  textSecondary: '#64748B',
  textInverse: '#FFFFFF',
  border: '#E2E8F0',
  tabBarBackground: 'rgba(255,255,255,0.92)',
  tabBarActive: '#D97706',
  tabBarInactive: '#94A3B8',
  infoTint: '#F0FDFA',
};

export const darkColors: AppColors = {
  primary: '#2DD4BF',
  primaryDark: '#14B8A6',
  accent: '#FBBF24',
  accentSoft: '#422006',
  danger: '#F87171',
  dangerLight: '#450A0A',
  warning: '#FBBF24',
  warningLight: '#422006',
  safe: '#16A34A',
  safeLight: '#14532D',
  neutral: '#94A3B8',
  neutralLight: '#334155',
  background: '#0C1014',
  surface: '#151B22',
  surfaceMuted: '#1C242D',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textInverse: '#0F172A',
  border: '#2D3748',
  tabBarBackground: 'rgba(15, 23, 42, 0.88)',
  tabBarActive: '#FBBF24',
  tabBarInactive: '#64748B',
  infoTint: '#134E4A',
};

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
  /** Hero timer digits */
  display: 56,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

/** Tighter on chrome, rounder on content */
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  full: 9999,
} as const;

export { fonts } from './fonts';
export { shadowCard, shadowFloat, shadowSoft } from './shadows';
