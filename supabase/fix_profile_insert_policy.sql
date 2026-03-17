-- Run this in Supabase SQL Editor
-- Allows authenticated users to insert their own profile row (for cases where the trigger didn't fire)
create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);
