-- Run in Supabase SQL Editor.
-- Adds display-name validation: charset, banned/reserved words, case-insensitive
-- uniqueness, Unicode normalization, and merges the existing 2/week change limit
-- into a single combined guard trigger. Also replaces the email-prefix signup
-- fallback with a neutral "User#####" handle so we don't leak personal info.

-- 1. Banned / reserved name patterns table
-- Editable from the Supabase dashboard so moderation doesn't require a deploy.
create table if not exists public.banned_display_name_patterns (
  id bigserial primary key,
  pattern text not null,
  kind text not null check (kind in ('exact', 'substring', 'regex')),
  reason text not null check (reason in ('reserved', 'impersonation', 'profanity', 'hate', 'harassment', 'other')),
  created_at timestamptz not null default now()
);

alter table public.banned_display_name_patterns enable row level security;

drop policy if exists "banned_patterns public read" on public.banned_display_name_patterns;
create policy "banned_patterns public read"
  on public.banned_display_name_patterns for select using (true);

-- Seed a starter list. Add/remove rows from the dashboard as needed.
insert into public.banned_display_name_patterns (pattern, kind, reason) values
  -- Reserved / app branding
  ('bootwatch', 'substring', 'reserved'),
  ('boot watch', 'substring', 'reserved'),
  ('admin', 'exact', 'reserved'),
  ('administrator', 'exact', 'reserved'),
  ('moderator', 'exact', 'reserved'),
  ('mod', 'exact', 'reserved'),
  ('staff', 'exact', 'reserved'),
  ('support', 'exact', 'reserved'),
  ('official', 'substring', 'reserved'),
  ('verified', 'substring', 'reserved'),
  ('system', 'exact', 'reserved'),
  ('null', 'exact', 'reserved'),
  -- Impersonation of enforcement / booting companies
  ('rexburg pd', 'substring', 'impersonation'),
  ('rexburgpd', 'substring', 'impersonation'),
  ('rexburg police', 'substring', 'impersonation'),
  ('rc booting', 'substring', 'impersonation'),
  ('rcbooting', 'substring', 'impersonation'),
  ('guardian booting', 'substring', 'impersonation'),
  ('ba recovery', 'substring', 'impersonation'),
  ('byui police', 'substring', 'impersonation'),
  -- Starter profanity (add more from the dashboard as needed)
  ('fuck', 'substring', 'profanity'),
  ('shit', 'substring', 'profanity'),
  ('cunt', 'substring', 'profanity'),
  ('bitch', 'substring', 'profanity'),
  ('asshole', 'substring', 'profanity'),
  ('dick', 'substring', 'profanity'),
  ('penis', 'substring', 'profanity'),
  ('pussy', 'substring', 'profanity'),
  -- Hate / harassment
  ('nigger', 'substring', 'hate'),
  ('nigga', 'substring', 'hate'),
  ('faggot', 'substring', 'hate'),
  ('retard', 'substring', 'hate'),
  ('nazi', 'substring', 'hate'),
  ('rape', 'substring', 'harassment'),
  ('kys', 'exact', 'harassment')
on conflict do nothing;

-- 2. Unicode-safe normalizer: strips invisibles, collapses whitespace, trims.
create or replace function public.normalize_display_name(raw text)
returns text
language plpgsql
immutable
as $$
declare
  s text := raw;
begin
  if s is null then return null; end if;

  -- NFKC if available (PG 13+). Fold compatibility chars (e.g. full-width Latin).
  begin
    s := normalize(s, nfkc);
  exception when others then
    null;
  end;

  -- Strip zero-width, bidi override, soft hyphen, BOM, etc.
  s := regexp_replace(
    s,
    E'[\u00AD\u200B-\u200F\u202A-\u202E\u2060-\u2064\u206A-\u206F\uFEFF]',
    '',
    'g'
  );

  -- Strip control chars (tab/newline/etc. shouldn't appear in names).
  -- Range starts at U+0001 because Postgres text can't contain U+0000
  -- and rejects \u0000 in E-string literals.
  s := regexp_replace(s, E'[\u0001-\u001F\u007F]', '', 'g');

  -- Collapse internal whitespace runs to a single space, then trim.
  s := regexp_replace(s, '\s+', ' ', 'g');
  s := btrim(s);

  return s;
end;
$$;

-- 3. Validator: normalizes + enforces charset/length + banned-word check.
-- Returns the normalized form on success; raises P0001 with a machine-readable
-- code on the first failure.
create or replace function public.validate_display_name(raw text)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  s text;
  lower_s text;
  bad record;
begin
  s := public.normalize_display_name(raw);

  if s is null or length(s) < 2 then
    raise exception 'display_name_too_short' using errcode = 'P0001';
  end if;
  if length(s) > 30 then
    raise exception 'display_name_too_long' using errcode = 'P0001';
  end if;

  -- Allowed: ASCII letters, digits, space, apostrophe, period, hyphen, underscore.
  if s !~ E'^[A-Za-z0-9 ''._\\-]+$' then
    raise exception 'display_name_invalid_characters' using errcode = 'P0001';
  end if;

  lower_s := lower(s);

  for bad in
    select pattern, kind, reason
    from public.banned_display_name_patterns
  loop
    if (bad.kind = 'exact'     and lower_s = lower(bad.pattern))
    or (bad.kind = 'substring' and position(lower(bad.pattern) in lower_s) > 0)
    or (bad.kind = 'regex'     and lower_s ~* bad.pattern)
    then
      if bad.reason in ('reserved', 'impersonation') then
        raise exception 'display_name_reserved' using errcode = 'P0001';
      else
        raise exception 'display_name_banned' using errcode = 'P0001';
      end if;
    end if;
  end loop;

  return s;
end;
$$;

-- 4. Combined BEFORE INSERT/UPDATE guard on profiles:
--    * normalizes + validates the new name (raises on bad content),
--    * on UPDATE, enforces the 2-per-rolling-7-day change limit.
create or replace function public.profiles_display_name_guard()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  recent_count int;
  kept timestamptz[];
begin
  if new.display_name is null then
    return new;
  end if;

  new.display_name := public.validate_display_name(new.display_name);

  if tg_op = 'INSERT' then
    return new;
  end if;

  if new.display_name is not distinct from old.display_name then
    return new;
  end if;

  -- Don't count the initial population of display_name (NULL -> value).
  if old.display_name is null then
    return new;
  end if;

  select coalesce(array_agg(t order by t desc), '{}'::timestamptz[])
    into kept
  from unnest(coalesce(old.display_name_change_history, '{}'::timestamptz[])) as t
  where t > now() - interval '30 days';

  select coalesce(count(*), 0)
    into recent_count
  from unnest(kept) as t
  where t > now() - interval '7 days';

  if recent_count >= 2 then
    raise exception 'display_name_change_limit_reached'
      using errcode = 'P0001',
            hint = 'You can only change your display name 2 times per week.';
  end if;

  new.display_name_change_history := kept || now();
  return new;
end;
$$;

-- Replace the prior (limit-only) trigger with the combined guard.
drop trigger if exists enforce_display_name_change_limit on public.profiles;
drop trigger if exists profiles_display_name_guard on public.profiles;
create trigger profiles_display_name_guard
  before insert or update of display_name on public.profiles
  for each row execute function public.profiles_display_name_guard();

-- 5. Blank out existing case-insensitive duplicates (keep the oldest row per
-- name). The affected users will be asked to pick a new name next time they
-- open Profile.
with ranked as (
  select
    id,
    row_number() over (
      partition by lower(display_name)
      order by created_at nulls last, id
    ) as rn
  from public.profiles
  where display_name is not null
)
update public.profiles p
set display_name = null
from ranked
where ranked.id = p.id
  and ranked.rn > 1;

-- 6. Case-insensitive uniqueness. Only applies when display_name is non-null
-- so blanked rows don't collide with each other.
drop index if exists profiles_display_name_ci_unique;
create unique index profiles_display_name_ci_unique
  on public.profiles (lower(display_name))
  where display_name is not null;

-- 7. Replace handle_new_user so the signup fallback is a neutral handle
-- ("User#####") instead of the email prefix.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate text;
  attempts int := 0;
begin
  candidate := coalesce(
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name'
  );

  -- Run the candidate through validation; if it's bad, fall back to a handle.
  if candidate is not null then
    begin
      candidate := public.validate_display_name(candidate);
    exception when others then
      candidate := null;
    end;
  end if;

  if candidate is null then
    candidate := 'User' || lpad((floor(random() * 100000))::int::text, 5, '0');
  end if;

  -- Best-effort uniqueness: retry a few times with wider random if taken.
  while attempts < 5
    and exists(select 1 from public.profiles where lower(display_name) = lower(candidate))
  loop
    candidate := 'User' || lpad((floor(random() * 10000000))::int::text, 7, '0');
    attempts := attempts + 1;
  end loop;

  -- If we still somehow collided, let the row go in with NULL and make the
  -- client force a rename rather than failing the signup.
  if exists(select 1 from public.profiles where lower(display_name) = lower(candidate)) then
    insert into public.profiles (id, display_name) values (new.id, null);
  else
    insert into public.profiles (id, display_name) values (new.id, candidate);
  end if;

  return new;
end;
$$;
