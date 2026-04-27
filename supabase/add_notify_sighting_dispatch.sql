-- One row per sighting the first time notify-sighting runs (webhook and/or app invoke).
-- Prevents duplicate push when both fire. Run once in Supabase SQL Editor.
create table if not exists public.notify_sighting_dispatch (
  sighting_id uuid primary key references public.sightings (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.notify_sighting_dispatch is
  'Dedup for notify-sighting: first caller inserts; second gets unique violation and skips.';
