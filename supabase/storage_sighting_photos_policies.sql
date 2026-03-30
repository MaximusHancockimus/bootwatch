-- Storage RLS for bucket `sighting-photos` (create bucket in Dashboard if needed:
-- Storage → New bucket → name: sighting-photos → Public bucket ON if you use getPublicUrl).
--
-- App uploads to: {auth.uid()}/{timestamp}.{ext}

-- Remove permissive policies if you added them during prototyping (adjust names if different).

drop policy if exists "Authenticated upload sighting photos in own folder" on storage.objects;
drop policy if exists "Authenticated update own sighting photos" on storage.objects;
drop policy if exists "Authenticated delete own sighting photos" on storage.objects;
drop policy if exists "Public read sighting photos" on storage.objects;

create policy "Authenticated upload sighting photos in own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'sighting-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Authenticated update own sighting photos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'sighting-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'sighting-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Authenticated delete own sighting photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'sighting-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read (required for getPublicUrl URLs in the feed)
create policy "Public read sighting photos"
  on storage.objects for select
  using (bucket_id = 'sighting-photos');
