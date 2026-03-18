import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface HeatEntry {
  complexId: string;
  count: number;
  lastSeen: string | null;
}

export type HeatLevel = 'high' | 'moderate' | 'low' | 'none';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const HIGH_THRESHOLD = 8;
const MODERATE_THRESHOLD = 3;

export function getHeatLevel(count: number): HeatLevel {
  if (count >= HIGH_THRESHOLD) return 'high';
  if (count >= MODERATE_THRESHOLD) return 'moderate';
  if (count >= 1) return 'low';
  return 'none';
}

export const HEAT_COLORS: Record<HeatLevel, string> = {
  high: '#DC2626',
  moderate: '#F59E0B',
  low: '#16A34A',
  none: '#9CA3AF',
};

export const HEAT_LABELS: Record<HeatLevel, string> = {
  high: 'High activity',
  moderate: 'Moderate activity',
  low: 'Low activity',
  none: 'No recent reports',
};

export function useHeatData() {
  const [heatMap, setHeatMap] = useState<Map<string, HeatEntry>>(new Map());
  const [loading, setLoading] = useState(true);

  const fetch30DaySightings = useCallback(async () => {
    setLoading(true);
    const since = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();

    const { data } = await supabase
      .from('sightings')
      .select('complex_id, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false });

    const map = new Map<string, HeatEntry>();

    if (data) {
      for (const row of data) {
        const existing = map.get(row.complex_id);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(row.complex_id, {
            complexId: row.complex_id,
            count: 1,
            lastSeen: row.created_at,
          });
        }
      }
    }

    setHeatMap(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch30DaySightings();
  }, [fetch30DaySightings]);

  function getEntry(complexId: string): HeatEntry {
    return heatMap.get(complexId) ?? { complexId, count: 0, lastSeen: null };
  }

  return { heatMap, loading, refresh: fetch30DaySightings, getEntry };
}
