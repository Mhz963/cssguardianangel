-- Lock down the app-WebView PDF hand-off bucket (replaces 20260719_ga_pdf_downloads_bucket.sql policies).
-- Before: public bucket, any signed-in user could upload any file anywhere, files never expired.
-- After:  private bucket, PDFs only (max 10 MB), each user can only touch their own "<user id>/" folder,
--         downloads use short-lived signed URLs, and the app removes a user's previous file on each upload.
-- Run in the Supabase SQL editor.

update storage.buckets
set public = false,
    file_size_limit = 10485760,
    allowed_mime_types = array['application/pdf']
where id = 'ga-pdf-downloads';

drop policy if exists "ga_pdf_downloads_insert" on storage.objects;
drop policy if exists "ga_pdf_downloads_read" on storage.objects;
drop policy if exists "ga_pdf_downloads_insert_own" on storage.objects;
drop policy if exists "ga_pdf_downloads_read_own" on storage.objects;
drop policy if exists "ga_pdf_downloads_delete_own" on storage.objects;

create policy "ga_pdf_downloads_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'ga-pdf-downloads'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "ga_pdf_downloads_read_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'ga-pdf-downloads'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "ga_pdf_downloads_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'ga-pdf-downloads'
  and split_part(name, '/', 1) = auth.uid()::text
);

-- Old files uploaded under the previous public layout ("<timestamp>-<random>/<file>.pdf")
-- can be removed from the Storage dashboard (ga-pdf-downloads bucket); they are no longer readable.
