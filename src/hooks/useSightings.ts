import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Sighting } from '../types/sighting';
import { complexes } from '../data/complexes';
import { DEFAULT_AVATAR_COLOR } from '../utils/avatarColors';

const complexMap = new Map(complexes.map((c) => [c.id, c.name]));

interface ProfileInfo { display_name: string; avatar_color: string; avatar_url: string | null }

async function fetchProfiles(userIds: string[]): Promise<Map<string, ProfileInfo>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_color, avatar_url')
    .in('id', unique);

  const map = new Map<string, ProfileInfo>();
  data?.forEach((p) => {
    map.set(p.id, {
      display_name: p.display_name ?? 'Anonymous',
      avatar_color: p.avatar_color ?? DEFAULT_AVATAR_COLOR,
      avatar_url: p.avatar_url ?? null,
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
    avatar_url: anonymous ? null : (profile?.avatar_url ?? null),
  };
}

export function useSightings() {
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSightings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('sightings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (dbError) throw dbError;

      if (data) {
        const profileMap = await fetchProfiles(data.map((r) => r.user_id));
        setSightings(data.map((row) => enrichSighting(row, profileMap)));
      }
    } catch (e) {
      console.error('[useSightings] fetch failed:', e);
      const message = e instanceof Error ? e.message : JSON.stringify(e);
      setError(message || 'Failed to load sightings');
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
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'sightings' }, (payload) => {
        const deletedId = (payload.old as { id?: string })?.id;
        if (deletedId) {
          setSightings((prev) => prev.filter((s) => s.id !== deletedId));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchSightings]);

  function getLatestSighting(complexId: string): Sighting | undefined {
    return sightings.find((s) => s.complex_id === complexId);
  }

  // Best-effort photo cleanup. The DB delete is the source of truth — if storage
  // removal fails, we still consider the sighting deleted (orphan photos are
  // cheap and Supabase has lifecycle policies for cleanup).
  async function removePhotoIfOwned(photoUrl: string | null) {
    if (!photoUrl) return;
    // Public URLs look like .../storage/v1/object/public/sighting-photos/<userId>/<file>
    const marker = '/sighting-photos/';
    const idx = photoUrl.indexOf(marker);
    if (idx === -1) return;
    const path = photoUrl.slice(idx + marker.length);
    if (!path) return;
    await supabase.storage.from('sighting-photos').remove([path]);
  }

  const deleteSighting = useCallback(async (id: string): Promise<{ error: string | null }> => {
    const target = sightings.find((s) => s.id === id);
    // Optimistically remove from UI; restore if the server rejects.
    setSightings((prev) => prev.filter((s) => s.id !== id));

    const { error: dbError } = await supabase.from('sightings').delete().eq('id', id);

    if (dbError) {
      console.error('[useSightings] delete failed:', dbError);
      if (target) setSightings((prev) => [target, ...prev].sort((a, b) => b.created_at.localeCompare(a.created_at)));
      return { error: dbError.message };
    }

    if (target?.photo_url) {
      void removePhotoIfOwned(target.photo_url);
    }

    return { error: null };
  }, [sightings]);

  return { sightings, loading, error, refresh: fetchSightings, getLatestSighting, deleteSighting };
}
