export const AVATAR_COLORS = [
  '#1A73E8', // blue (default)
  '#DC2626', // red
  '#16A34A', // green
  '#F59E0B', // amber
  '#7C3AED', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#6366F1', // indigo
  '#14B8A6', // teal
] as const;

export type AvatarColor = typeof AVATAR_COLORS[number];

export const DEFAULT_AVATAR_COLOR = AVATAR_COLORS[0];
