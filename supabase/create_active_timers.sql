-- Run this in Supabase SQL Editor
-- Stores active parking timers so the notification edge function
-- can alert users who are currently parked at a complex

create table public.active_timers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  complex_id text references public.complexes(id) on delete cascade not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

create index active_timers_complex_id_idx on public.active_timers(complex_id);
create index active_timers_expires_at_idx on public.active_timers(expires_at);

-- Only one active timer per user
create unique index active_timers_user_id_idx on public.active_timers(user_id);

-- RLS: users can manage their own timers, edge function reads all via service role
alter table public.active_timers enable row level security;

create policy "Users can read their own timer"
  on public.active_timers for select using (auth.uid() = user_id);

create policy "Users can insert their own timer"
  on public.active_timers for insert with check (auth.uid() = user_id);

create policy "Users can delete their own timer"
  on public.active_timers for delete using (auth.uid() = user_id);

create policy "Users can update their own timer"
  on public.active_timers for update using (auth.uid() = user_id);
