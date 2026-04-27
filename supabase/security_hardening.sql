-- Security hardening (run in Supabase SQL Editor on existing projects).
-- Order matters. Afterward:
-- 1) Edge Function secrets: set NOTIFY_SIGHTING_WEBHOOK_SECRET (same value you send as header).
-- 2) Database Webhook → notify-sighting: add header
--    x-bootwatch-webhook-secret: <your secret>
-- 3) Redeploy notify-sighting (verify_jwt disabled for webhooks — Dashboard → Edge Functions → settings).

-- ─── 1. Push tokens (not world-readable via profiles) ───────────────────────
create table if not exists public.push_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  token text not null,
  updated_at timestamptz not null default now()
);

alter table public.push_tokens enable row level security;

drop policy if exists "Users read own push token" on public.push_tokens;
drop policy if exists "Users insert own push token" on public.push_tokens;
drop policy if exists "Users update own push token" on public.push_tokens;
drop policy if exists "Users delete own push token" on public.push_tokens;

create policy "Users read own push token"
  on public.push_tokens for select using (auth.uid() = user_id);

create policy "Users insert own push token"
  on public.push_tokens for insert with check (auth.uid() = user_id);

create policy "Users update own push token"
  on public.push_tokens for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users delete own push token"
  on public.push_tokens for delete using (auth.uid() = user_id);

-- Older prototypes stored Expo tokens on profiles.push_token; current schema uses
-- push_tokens only. Skip data copy if that column was never added.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'push_token'
  ) then
    insert into public.push_tokens (user_id, token, updated_at)
    select id, push_token, coalesce(updated_at, now())
    from public.profiles
    where push_token is not null and trim(push_token) <> ''
    on conflict (user_id) do update set
      token = excluded.token,
      updated_at = excluded.updated_at;
  end if;
end $$;

alter table public.profiles drop column if exists push_token;

-- ─── 2. Sightings: insert only as self + clamp created_at ───────────────────
drop policy if exists "Authenticated users can insert sightings" on public.sightings;
drop policy if exists "Authenticated users insert own sightings" on public.sightings;

create policy "Authenticated users insert own sightings"
  on public.sightings for insert
  with check (auth.role() = 'authenticated' and user_id = auth.uid());

create or replace function public.sightings_before_insert()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  n timestamptz := now();
begin
  new.user_id := auth.uid();
  if new.created_at is null then
    new.created_at := n;
  elsif new.created_at > n + interval '5 minutes' then
    new.created_at := n;
  elsif new.created_at < n - interval '6 hours' then
    new.created_at := n;
  end if;
  return new;
end;
$$;

drop trigger if exists sightings_before_insert on public.sightings;
create trigger sightings_before_insert
  before insert on public.sightings
  for each row execute function public.sightings_before_insert();

-- ─── 3. Stats RPC: authenticated only (skip if RPC not created yet) ──────────
do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'complex_sighting_hour_stats'
  ) then
    execute 'revoke execute on function public.complex_sighting_hour_stats(text, int) from anon';
    execute 'grant execute on function public.complex_sighting_hour_stats(text, int) to authenticated';
  end if;
end $$;
