-- Allow authenticated users to delete their own sightings.
-- Without this policy, RLS silently rejects all delete attempts on the sightings table.
-- App Store Guideline 5.1.1(v) and general privacy expectations require that users
-- can remove content they've posted.

drop policy if exists "Authenticated users delete own sightings" on public.sightings;

create policy "Authenticated users delete own sightings"
  on public.sightings for delete
  to authenticated
  using (user_id = auth.uid());
