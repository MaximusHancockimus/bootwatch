import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface SightingHourStats {
  total: number;
  topHours: number[];
}

type RpcPayload = { total: number; top_hours: number[] };

function parseRpc(data: unknown): SightingHourStats | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as RpcPayload;
  const total = typeof o.total === 'number' ? o.total : 0;
  const raw = o.top_hours;
  const topHours = Array.isArray(raw) ? raw.map((h) => Number(h)).filter((h) => h >= 0 && h <= 23) : [];
  return { total, topHours };
}

/** Fetches hourly sighting stats when the sheet is open; used for “typical report times”. */
export function useComplexSightingPatterns(complexId: string | null, visible: boolean) {
  const [stats, setStats] = useState<SightingHourStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!complexId || !visible) {
      setStats(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void supabase
      .rpc('complex_sighting_hour_stats', { p_complex_id: complexId, p_days: 90 })
      .then(({ data, error }) => {
        if (cancelled) return;
        setLoading(false);
        if (error) {
          setStats(null);
          return;
        }
        setStats(parseRpc(data));
      });

    return () => {
      cancelled = true;
    };
  }, [complexId, visible]);

  return { stats, loading };
}
