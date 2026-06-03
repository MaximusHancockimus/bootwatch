/** Minimum sightings in the window before showing the confident peak-times line. */
export const MIN_REPORTS_FOR_PEAK_PATTERN = 10;

/** Lower bar: at 3+ reports we show a softer "early signal" version so a pattern surfaces before the confident threshold. */
export const MIN_REPORTS_FOR_EARLY_SIGNAL = 3;

export type PeakPatternConfidence = 'confident' | 'early' | 'none';

/** Maps a sighting count to a display tier. Used by detail sheets to choose copy and styling. */
export function classifyPeakPatternConfidence(total: number): PeakPatternConfidence {
  if (total >= MIN_REPORTS_FOR_PEAK_PATTERN) return 'confident';
  if (total >= MIN_REPORTS_FOR_EARLY_SIGNAL) return 'early';
  return 'none';
}

/** `hour` is 0–23 in America/Boise (from RPC). */
export function formatHour12Wall(hour: number): string {
  const h = Math.floor(hour);
  if (h === 0) return '12am';
  if (h === 12) return '12pm';
  if (h < 12) return `${h}am`;
  return `${h - 12}pm`;
}

/**
 * Top 1–2 hours by report volume rendered as a sentence.
 * - confident → "Most reports were around 3pm and 12am."
 * - early     → "Early signal: reports clustering around 3pm and 12am."
 */
export function formatPeakPatternSentence(
  topHours: number[],
  confidence: PeakPatternConfidence = 'confident',
): string | null {
  if (!topHours.length) return null;
  const parts = topHours.map(formatHour12Wall);
  const prefix =
    confidence === 'early' ? 'Early signal: reports clustering around' : 'Most reports were around';
  if (parts.length === 1) return `${prefix} ${parts[0]}.`;
  return `${prefix} ${parts[0]} and ${parts[1]}.`;
}
