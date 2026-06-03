-- =============================================================================
-- ⚠️  ALREADY EXECUTED — DO NOT RUN AGAIN ⚠️
-- =============================================================================
--
-- Executed against production Supabase on: 2026-05-01 (App Store launch day)
-- Purpose at the time: Wipe all sightings before public launch so v1.0 users
-- started with an empty community feed.
--
-- This file is kept in `supabase/_archive/` for historical record only.
-- It is NOT a migration. It is NOT pending. It must NEVER be re-run.
--
-- Re-running this would permanently delete every sighting in production
-- (the live community feed, map pins, and heat layer data).
--
-- The destructive SQL below has been commented out and replaced with a
-- hard abort. If anyone (human or AI) pastes this script into the Supabase
-- SQL Editor and clicks Run, PostgreSQL will raise an exception and refuse
-- to execute anything.
--
-- If you genuinely need to clear sightings again in the future, do NOT modify
-- this file — write a NEW, intentionally-named migration that documents WHY.
-- =============================================================================

do $$
begin
  raise exception E'\n\n'
    '================================================================\n'
    'REFUSING TO RUN: clear_feed_pre_launch.sql\n'
    '================================================================\n'
    'This script was already executed on 2026-05-01 before the v1.0\n'
    'App Store launch. Running it again would wipe the LIVE community\n'
    'feed in production.\n\n'
    'If you intend to clear sightings, write a new, intentional\n'
    'migration in supabase/ — do not modify or re-run this archived\n'
    'file.\n'
    '================================================================';
end $$;

-- -----------------------------------------------------------------------------
-- Historical record of what this script ORIGINALLY did on 2026-05-01.
-- These statements are COMMENTED OUT and exist only for the record.
-- DO NOT UNCOMMENT.
-- -----------------------------------------------------------------------------
--
-- begin;
--   delete from public.sightings;
-- commit;
--
-- Verification (also commented out):
-- select count(*) from public.sightings;
--
-- Note from the original file:
--   Storage bucket `sighting-photos` was emptied separately via the
--   Supabase Dashboard (Storage → sighting-photos → select all → Delete),
--   since storage.objects DELETE is blocked at the SQL level by the
--   protect_delete policy.
