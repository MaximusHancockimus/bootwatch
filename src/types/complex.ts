export type RiskLevel = 'high' | 'moderate' | 'low' | 'unknown';

export type SignageQuality = 'well-marked' | 'moderate' | 'sneaky' | 'unknown';

export interface Complex {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  visitorTimeLimitMinutes: number | null;
  bootingCompany: string | null;
  signageQuality: SignageQuality;
  riskLevel: RiskLevel;
  notes: string | null;
}
