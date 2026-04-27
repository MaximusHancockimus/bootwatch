-- After visitor time runs out, keep the row with over_limit = true so notify-sighting
-- still includes the user until they confirm "I've left" (row deleted from app).
-- Run in Supabase SQL Editor after create_active_timers.sql.

alter table public.active_timers
  add column if not exists over_limit boolean not null default false;

alter table public.active_timers
  add column if not exists visitor_limit_ends_at timestamptz;

-- Backfill: same as current expires_at for existing rows
update public.active_timers
  set visitor_limit_ends_at = coalesce(visitor_limit_ends_at, expires_at)
  where visitor_limit_ends_at is null;

-- Rows that already past expiry are effectively "over limit" for Eligibility
update public.active_timers
  set over_limit = true, visitor_limit_ends_at = coalesce(visitor_limit_ends_at, expires_at)
  where expires_at < now() and not over_limit;

comment on column public.active_timers.over_limit is
  'True after the visitor period ended; user still gets nearby sighting alerts until the row is deleted (I have left / cancel).';
comment on column public.active_timers.visitor_limit_ends_at is
  'End of the posted visitor period (when the timer hit zero); kept for display/sync.';
