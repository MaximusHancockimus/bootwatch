-- Run in Supabase SQL Editor. Default ON for existing and new users.
alter table public.profiles
  add column if not exists nearby_sighting_alerts boolean not null default true;

comment on column public.profiles.nearby_sighting_alerts is
  'When true, user receives Expo push for booter sightings near followed or parked complexes (notify-sighting edge function).';
