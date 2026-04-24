export type RiskLevel = 'high' | 'moderate' | 'low' | 'unknown';

/** 24h strings from data (e.g. "10:00"); display via parkingDisplay helpers. */
export interface VisitorHourRange {
  start: string;
  end: string;
}

export interface Complex {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  visitorTimeLimitMinutes: number | null;
  /**
   * When `false`, visitor duration is unknown (no signage / not on file) — show `? min`.
   * When `true` or omitted, `visitorTimeLimitMinutes` is trusted: `null` or `0` means surveyed
   * unlimited — show `∞ min`; positive values show the usual minute/hour phrase.
   */
  visitorLimitSignageKnown?: boolean;
  bootingCompany: string | null;
  riskLevel: RiskLevel;
  notes: string | null;
  /** Mon–Thu-style visitor window when sourced from sign data */
  visitorWeekdayHours?: VisitorHourRange | null;
  /** Friday window; `null` = surveyed as not listed */
  visitorFridayHours?: VisitorHourRange | null;
  /** Shown in detail sheet when DB stats are below threshold (optional demo / local knowledge). */
  peakActivityHint?: string | null;
}
