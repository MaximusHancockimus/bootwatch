-- Hour-of-day sighting pattern for a complex (Rexburg = America/Boise).
-- Run in Supabase SQL Editor after sightings exist.
-- App calls: rpc('complex_sighting_hour_stats', { p_complex_id, p_days: 90 })

create or replace function public.complex_sighting_hour_stats(
  p_complex_id text,
  p_days int default 90
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with bounds as (
    select greatest(coalesce(p_days, 90), 1) as days
  ),
  filtered as (
    select
      extract(hour from (s.created_at at time zone 'America/Boise'))::int as hr
    from public.sightings s, bounds b
    where s.complex_id = p_complex_id
      and s.created_at >= now() - (b.days || ' days')::interval
  ),
  counts as (
    select hr, count(*)::int as cnt
    from filtered
    group by hr
  ),
  total as (
    select coalesce((select sum(cnt) from counts), 0)::int as n
  ),
  ranked as (
    select hr, row_number() over (order by cnt desc, hr asc) as rk
    from counts
  ),
  tops as (
    select hr, rk from ranked where rk <= 2
  )
  select jsonb_build_object(
    'total', (select n from total),
    'top_hours', coalesce(
      (select jsonb_agg(t.hr order by t.rk) from tops t),
      '[]'::jsonb
    )
  );
$$;

comment on function public.complex_sighting_hour_stats(text, int) is
  'Returns { total, top_hours: int[] } for sightings at complex_id in last p_days; hours are America/Boise wall clock.';

grant execute on function public.complex_sighting_hour_stats(text, int) to anon, authenticated;
