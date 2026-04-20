/**
 * Map pin colors from visitor time limit (tighter limits → warmer colors).
 * `null` = no single posted minute limit (unlimited / unclear on signage).
 */
export function getVisitorLimitMarkerColor(visitorTimeLimitMinutes: number | null): string {
  if (visitorTimeLimitMinutes == null) return '#6BC98A';
  if (visitorTimeLimitMinutes >= 120) return '#8FA825';
  if (visitorTimeLimitMinutes >= 60) return '#D4A017';
  if (visitorTimeLimitMinutes > 30) return '#E07A2F';
  return '#C62828';
}

/** Compact legend rows for the complexes map mode. */
export const VISITOR_LIMIT_LEGEND: { label: string; color: string }[] = [
  { label: 'No time limit (lowest risk)', color: getVisitorLimitMarkerColor(null) },
  { label: '2+ hours', color: getVisitorLimitMarkerColor(120) },
  { label: '~1 hour', color: getVisitorLimitMarkerColor(60) },
  { label: '31–59 min', color: getVisitorLimitMarkerColor(45) },
  { label: '≤30 min', color: getVisitorLimitMarkerColor(30) },
];
