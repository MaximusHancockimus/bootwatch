import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useSavedComplexes() {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setSavedIds([]); setLoading(false); return; }

    supabase
      .from('profiles')
      .select('saved_complexes')
      .eq('id', user.id)
      .single()
      .then(({ data, error: dbError }) => {
        if (dbError) { setError('Failed to load saved complexes'); }
        setSavedIds(data?.saved_complexes ?? []);
        setLoading(false);
      });
  }, [user]);

  const toggle = useCallback(async (complexId: string) => {
    if (!user) return;
    const isSaved = savedIds.includes(complexId);
    const next = isSaved
      ? savedIds.filter((id) => id !== complexId)
      : [...savedIds, complexId];

    setSavedIds(next);
    await supabase
      .from('profiles')
      .update({ saved_complexes: next })
      .eq('id', user.id);
  }, [user, savedIds]);

  const isSaved = useCallback(
    (complexId: string) => savedIds.includes(complexId),
    [savedIds],
  );

  return { savedIds, loading, toggle, isSaved };
}
