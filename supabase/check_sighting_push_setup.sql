-- Run in Supabase SQL Editor. Replace :your_user_id with the parked user's auth.users id
-- and/or spot your row in the results.

-- 1) Timer row the edge function needs (your phone, NorthPoint example)
--    complex_id must match app IDs (e.g. northpoint-apartments) and you need either
--    expires_at > now or over_limit = true (after you ran add_active_timers_over_limit.sql)
select * from public.active_timers order by expires_at desc nulls last limit 20;

-- 2) Expo push token for the recipient
select user_id, left(token, 24) as token_prefix, updated_at
from public.push_tokens
order by updated_at desc
limit 20;

-- 3) Complex in DB (FKs require this) — if missing, run sync_complexes_from_app.sql
select id, name, latitude, longitude
from public.complexes
where id in ('northpoint-apartments', 'cove-360');

-- 4) Most recent sighting (after a test report) — use its id in a manual function test
select id, user_id, complex_id, created_at
from public.sightings
order by created_at desc
limit 5;
