export type ReportType = 'spotter' | 'booted';

export interface Sighting {
  id: string;
  user_id: string | null;
  complex_id: string;
  latitude: number;
  longitude: number;
  photo_url: string | null;
  report_type: ReportType;
  is_anonymous: boolean;
  created_at: string;
  complex_name?: string;
  display_name?: string;
  avatar_color?: string;
}
