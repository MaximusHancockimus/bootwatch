-- Dev/demo: fake sightings for NorthPoint so "Typical report times" shows data-driven peaks.
-- Requires: public.complexes row id = northpoint-apartments (run sync_complexes_from_app.sql first).
-- Requires: function complex_sighting_hour_stats (see complex_sighting_hour_stats.sql).
--
-- Peak hours are skewed toward 3pm and midnight (America/Boise), matching MIN_REPORTS_FOR_PEAK_PATTERN (10+).
--
-- If a Database Webhook calls notify-sighting on INSERT, temporarily disable it or expect extra pushes.
--
-- Idempotent: deletes prior seed rows by fixed ids, then inserts.

begin;

alter table public.sightings disable trigger sightings_before_insert;

delete from public.sightings
where id in (
  'a1000000-0000-4000-8000-000000000001'::uuid,
  'a1000000-0000-4000-8000-000000000002'::uuid,
  'a1000000-0000-4000-8000-000000000003'::uuid,
  'a1000000-0000-4000-8000-000000000004'::uuid,
  'a1000000-0000-4000-8000-000000000005'::uuid,
  'a1000000-0000-4000-8000-000000000006'::uuid,
  'a1000000-0000-4000-8000-000000000007'::uuid,
  'a1000000-0000-4000-8000-000000000008'::uuid,
  'a1000000-0000-4000-8000-000000000009'::uuid,
  'a1000000-0000-4000-8000-00000000000a'::uuid,
  'a1000000-0000-4000-8000-00000000000b'::uuid,
  'a1000000-0000-4000-8000-00000000000c'::uuid
);

insert into public.sightings (id, user_id, complex_id, latitude, longitude, created_at)
values
  -- Seven reports ~3pm (hour 15) — top bucket
  ('a1000000-0000-4000-8000-000000000001'::uuid, null, 'northpoint-apartments', 43.82278915092779, -111.78627151633873,
    ((current_date - 62)::timestamp + interval '15 hours 8 minutes') at time zone 'America/Boise'),
  ('a1000000-0000-4000-8000-000000000002'::uuid, null, 'northpoint-apartments', 43.82278915092779, -111.78627151633873,
    ((current_date - 55)::timestamp + interval '15 hours 12 minutes') at time zone 'America/Boise'),
  ('a1000000-0000-4000-8000-000000000003'::uuid, null, 'northpoint-apartments', 43.82278915092779, -111.78627151633873,
    ((current_date - 48)::timestamp + interval '15 hours 5 minutes') at time zone 'America/Boise'),
  ('a1000000-0000-4000-8000-000000000004'::uuid, null, 'northpoint-apartments', 43.82278915092779, -111.78627151633873,
    ((current_date - 41)::timestamp + interval '15 hours 20 minutes') at time zone 'America/Boise'),
  ('a1000000-0000-4000-8000-000000000005'::uuid, null, 'northpoint-apartments', 43.82278915092779, -111.78627151633873,
    ((current_date - 34)::timestamp + interval '15 hours 2 minutes') at time zone 'America/Boise'),
  ('a1000000-0000-4000-8000-000000000006'::uuid, null, 'northpoint-apartments', 43.82278915092779, -111.78627151633873,
    ((current_date - 27)::timestamp + interval '15 hours 45 minutes') at time zone 'America/Boise'),
  ('a1000000-0000-4000-8000-000000000007'::uuid, null, 'northpoint-apartments', 43.82278915092779, -111.78627151633873,
    ((current_date - 20)::timestamp + interval '15 hours 30 minutes') at time zone 'America/Boise'),
  -- Five reports ~midnight (hour 0) — second bucket
  ('a1000000-0000-4000-8000-000000000008'::uuid, null, 'northpoint-apartments', 43.82278915092779, -111.78627151633873,
    ((current_date - 58)::timestamp + interval '10 minutes') at time zone 'America/Boise'),
  ('a1000000-0000-4000-8000-000000000009'::uuid, null, 'northpoint-apartments', 43.82278915092779, -111.78627151633873,
    ((current_date - 44)::timestamp + interval '0 hours 22 minutes') at time zone 'America/Boise'),
  ('a1000000-0000-4000-8000-00000000000a'::uuid, null, 'northpoint-apartments', 43.82278915092779, -111.78627151633873,
    ((current_date - 31)::timestamp + interval '0 hours 5 minutes') at time zone 'America/Boise'),
  ('a1000000-0000-4000-8000-00000000000b'::uuid, null, 'northpoint-apartments', 43.82278915092779, -111.78627151633873,
    ((current_date - 17)::timestamp + interval '0 hours 40 minutes') at time zone 'America/Boise'),
  ('a1000000-0000-4000-8000-00000000000c'::uuid, null, 'northpoint-apartments', 43.82278915092779, -111.78627151633873,
    ((current_date - 9)::timestamp + interval '0 hours 15 minutes') at time zone 'America/Boise');

alter table public.sightings enable trigger sightings_before_insert;

commit;

-- Sanity check (should show total 12, top_hours [15, 0] or similar):
-- select public.complex_sighting_hour_stats('northpoint-apartments', 90);
