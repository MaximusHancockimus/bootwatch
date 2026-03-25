export type RiskLevel = 'high' | 'moderate' | 'low' | 'unknown';

export type SignageQuality = 'well-marked' | 'moderate' | 'sneaky' | 'unknown';

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
  bootingCompany: string | null;
  /** Kept for DB sync / generator; not shown in the app UI. */
  signageQuality: SignageQuality;
  riskLevel: RiskLevel;
  notes: string | null;
  /** Mon–Thu-style visitor window when sourced from sign data */
  visitorWeekdayHours?: VisitorHourRange | null;
  /** Friday window; `null` = surveyed as not listed */
  visitorFridayHours?: VisitorHourRange | null;
}
