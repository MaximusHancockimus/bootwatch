-- Run this in Supabase SQL Editor to add the report_type column
alter table public.sightings
  add column report_type text default 'spotter' check (report_type in ('spotter', 'booted'));
