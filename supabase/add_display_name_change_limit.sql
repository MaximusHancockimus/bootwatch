-- Run in Supabase SQL Editor.
-- Adds a rolling-window history of display-name changes on each profile,
-- and a trigger that enforces at most 2 changes per 7 days.

alter table public.profiles
  add column if not exists display_name_change_history timestamptz[] not null default '{}';

comment on column public.profiles.display_name_change_history is
  'Timestamps of display_name changes made after signup. Enforced by enforce_display_name_change_limit() to allow at most 2 changes per rolling 7-day window.';

create or replace function public.enforce_display_name_change_limit()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  recent_count int;
  kept timestamptz[];
begin
  -- No-op if display_name is unchanged.
  if new.display_name is not distinct from old.display_name then
    return new;
  end if;

  -- Don't count the initial population of display_name (NULL -> value),
  -- e.g. legacy profiles being backfilled by the client.
  if old.display_name is null then
    return new;
  end if;

  -- Start from the existing history, but keep only the last 30 days (enough
  -- for the 7-day enforcement window plus a small audit buffer).
  select coalesce(array_agg(t order by t desc), '{}'::timestamptz[])
    into kept
  from unnest(coalesce(old.display_name_change_history, '{}'::timestamptz[])) as t
  where t > now() - interval '30 days';

  -- Count changes in the last 7 days.
  select coalesce(count(*), 0)
    into recent_count
  from unnest(kept) as t
  where t > now() - interval '7 days';

  if recent_count >= 2 then
    raise exception 'display_name_change_limit_reached'
      using
        errcode = 'P0001',
        hint = 'You can only change your display name 2 times per week.';
  end if;

  -- Append the new change timestamp; the client cannot override this field.
  new.display_name_change_history := kept || now();
  return new;
end;
$$;

drop trigger if exists enforce_display_name_change_limit on public.profiles;
create trigger enforce_display_name_change_limit
  before update of display_name on public.profiles
  for each row execute function public.enforce_display_name_change_limit();
