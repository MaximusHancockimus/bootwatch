/** Minimum sightings in the window before showing data-driven peak times (avoids noisy stats). */
export const MIN_REPORTS_FOR_PEAK_PATTERN = 10;

/** `hour` is 0–23 in America/Boise (from RPC). */
export function formatHour12Wall(hour: number): string {
  const h = Math.floor(hour);
  if (h === 0) return '12am';
  if (h === 12) return '12pm';
  if (h < 12) return `${h}am`;
  return `${h - 12}pm`;
}

/** Top 1–2 hours by report volume → "Most reports were around 3pm and 12am." */
export function formatPeakPatternSentence(topHours: number[]): string | null {
  if (!topHours.length) return null;
  const parts = topHours.map(formatHour12Wall);
  if (parts.length === 1) return `Most reports were around ${parts[0]}.`;
  return `Most reports were around ${parts[0]} and ${parts[1]}.`;
}
