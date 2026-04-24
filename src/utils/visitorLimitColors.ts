/**
 * Map pin colors from visitor time limit (tighter limits → warmer colors).
 * Unknown signage (`signageKnown === false`) uses neutral slate.
 * Known unlimited (`null` / `0` minutes, signage known) stays green (lowest time pressure).
 */
export function getVisitorLimitMarkerColor(
  visitorTimeLimitMinutes: number | null,
  signageKnown: boolean | undefined = true,
): string {
  if (signageKnown === false) return '#94A3B8';
  if (visitorTimeLimitMinutes == null || visitorTimeLimitMinutes <= 0) return '#6BC98A';
  if (visitorTimeLimitMinutes >= 120) return '#8FA825';
  if (visitorTimeLimitMinutes >= 60) return '#D4A017';
  if (visitorTimeLimitMinutes > 30) return '#E07A2F';
  return '#C62828';
}

/** Compact legend rows for the complexes map mode. */
export const VISITOR_LIMIT_LEGEND: { label: string; color: string }[] = [
  { label: 'Unknown (? min) — no signage', color: getVisitorLimitMarkerColor(null, false) },
  { label: 'No limit (∞ min) — on sign', color: getVisitorLimitMarkerColor(null, true) },
  { label: '2+ hours', color: getVisitorLimitMarkerColor(120) },
  { label: '~1 hour', color: getVisitorLimitMarkerColor(60) },
  { label: '31–59 min', color: getVisitorLimitMarkerColor(45) },
  { label: '≤30 min', color: getVisitorLimitMarkerColor(30) },
];
