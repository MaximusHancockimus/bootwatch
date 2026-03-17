import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Sighting } from '../types/sighting';
import { complexes } from '../data/complexes';
import { DEFAULT_AVATAR_COLOR } from '../utils/avatarColors';

const complexMap = new Map(complexes.map((c) => [c.id, c.name]));

interface ProfileInfo { display_name: string; avatar_color: string }

async function fetchProfiles(userIds: string[]): Promise<Map<string, ProfileInfo>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_color')
    .in('id', unique);

  const map = new Map<string, ProfileInfo>();
  data?.forEach((p) => {
    map.set(p.id, {
      display_name: p.display_name ?? 'Anonymous',
      avatar_color: p.avatar_color ?? DEFAULT_AVATAR_COLOR,
    });
  });
  return map;
}

function enrichSighting(row: any, profileMap: Map<string, ProfileInfo>): Sighting {
  const anonymous = row.is_anonymous ?? false;
  const profile = (!anonymous && row.user_id) ? profileMap.get(row.user_id) : undefined;
  return {
    ...row,
    is_anonymous: anonymous,
    complex_name: complexMap.get(row.complex_id) ?? 'Unknown',
    display_name: anonymous ? 'Anonymous' : (profile?.display_name ?? 'Anonymous'),
    avatar_color: anonymous ? '#6B7280' : (profile?.avatar_color ?? DEFAULT_AVATAR_COLOR),
  };
}

export function useSightings() {
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSightings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('sightings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      const profileMap = await fetchProfiles(data.map((r) => r.user_id));
      setSightings(data.map((row) => enrichSighting(row, profileMap)));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSightings();

    const channel = supabase
      .channel('sightings-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sightings' }, async (payload) => {
        const profileMap = await fetchProfiles([payload.new.user_id]);
        const newSighting = enrichSighting(payload.new, profileMap);
        setSightings((prev) => [newSighting, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchSightings]);

  function getLatestSighting(complexId: string): Sighting | undefined {
    return sightings.find((s) => s.complex_id === complexId);
  }

  return { sightings, loading, refresh: fetchSightings, getLatestSighting };
}
