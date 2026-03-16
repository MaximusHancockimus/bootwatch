-- BootWatch Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- 1. Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  saved_complexes text[] default '{}',
  push_token text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Complexes table
create table public.complexes (
  id text primary key,
  name text not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  visitor_time_limit_minutes integer,
  booting_company text,
  signage_quality text default 'unknown' check (signage_quality in ('well-marked', 'moderate', 'sneaky', 'unknown')),
  risk_level text default 'unknown' check (risk_level in ('high', 'moderate', 'low', 'unknown')),
  notes text,
  created_at timestamptz default now()
);

-- 3. Sightings table (boot truck reports)
create table public.sightings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete set null,
  complex_id text references public.complexes(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  photo_url text,
  created_at timestamptz default now()
);

-- Indexes for common queries
create index sightings_complex_id_idx on public.sightings(complex_id);
create index sightings_created_at_idx on public.sightings(created_at desc);

-- 4. Row Level Security

-- Profiles: users can read all, update only their own
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Complexes: everyone can read, only admins insert/update (we'll seed via SQL)
alter table public.complexes enable row level security;

create policy "Complexes are viewable by everyone"
  on public.complexes for select using (true);

-- Sightings: everyone can read, authenticated users can insert
alter table public.sightings enable row level security;

create policy "Sightings are viewable by everyone"
  on public.sightings for select using (true);

create policy "Authenticated users can insert sightings"
  on public.sightings for insert with check (auth.role() = 'authenticated');

-- 5. Enable Realtime on sightings
alter publication supabase_realtime add table public.sightings;

-- 6. Seed complex data
insert into public.complexes (id, name, address, latitude, longitude, visitor_time_limit_minutes, booting_company, signage_quality, risk_level, notes) values
  ('the-cove', 'The Cove', '398 S 2nd W, Rexburg, ID', 43.8225, -111.7915, 30, 'University Parking Enforcement', 'sneaky', 'high', 'Very aggressive enforcement, especially evenings and weekends.'),
  ('nauvoo-house', 'Nauvoo House', '321 S 3rd W, Rexburg, ID', 43.8218, -111.7928, 30, 'University Parking Enforcement', 'moderate', 'high', 'Frequent booting reports. Signage exists but is easy to miss.'),
  ('alpine-chalet', 'Alpine Chalet', '460 S 2nd W, Rexburg, ID', 43.8215, -111.7912, 60, 'University Parking Enforcement', 'well-marked', 'moderate', 'Longer time limit but still actively patrolled.'),
  ('university-view', 'University View', '280 S 1st W, Rexburg, ID', 43.8235, -111.7895, 30, 'University Parking Enforcement', 'sneaky', 'high', 'One of the most booted complexes in Rexburg.'),
  ('brookside', 'Brookside Village', '415 S 3rd W, Rexburg, ID', 43.8210, -111.7930, 45, 'Idaho Booting LLC', 'moderate', 'moderate', 'Moderate enforcement. Signs posted at lot entrances.'),
  ('mesa-falls', 'Mesa Falls', '520 S 2nd E, Rexburg, ID', 43.8200, -111.7870, 30, 'Idaho Booting LLC', 'sneaky', 'high', 'Small lot with limited visitor spots. Boots happen fast.'),
  ('hemming-village', 'Hemming Village', '316 Main St, Rexburg, ID', 43.8260, -111.7885, 120, null, 'well-marked', 'low', 'Downtown area with more relaxed parking enforcement.'),
  ('carriage-house', 'Carriage House', '230 S 2nd W, Rexburg, ID', 43.8240, -111.7910, 30, 'University Parking Enforcement', 'moderate', 'high', 'Close to campus, heavily patrolled.'),
  ('northpoint', 'Northpoint', '130 N 1st E, Rexburg, ID', 43.8280, -111.7880, 60, 'Idaho Booting LLC', 'well-marked', 'moderate', 'Clear signage. Enforcement is moderate.'),
  ('the-lodge', 'The Lodge', '485 S 1st E, Rexburg, ID', 43.8205, -111.7878, 30, 'University Parking Enforcement', 'sneaky', 'high', 'Tight parking lot. Boot trucks come through frequently.'),
  ('sunrise-village', 'Sunrise Village', '575 S 2nd W, Rexburg, ID', 43.8190, -111.7918, 45, 'Idaho Booting LLC', 'moderate', 'moderate', 'Somewhat removed from campus. Less frequent patrols.'),
  ('centennial', 'Centennial Apartments', '350 N 2nd E, Rexburg, ID', 43.8295, -111.7865, 90, null, 'well-marked', 'low', 'Generous time limits. Rarely see boot trucks here.');
