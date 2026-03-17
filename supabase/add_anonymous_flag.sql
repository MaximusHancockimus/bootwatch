-- Run this in Supabase SQL Editor
alter table public.sightings
  add column is_anonymous boolean default false;
