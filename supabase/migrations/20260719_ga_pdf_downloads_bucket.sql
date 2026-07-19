-- Public bucket for app-WebView PDF downloads (Guardian Study Planner reports).
-- Generated PDFs are uploaded here briefly so the mobile app WebView can download
-- them through a real https URL (blob:/data: URLs never trigger the WebView save).
-- Run in the Supabase SQL editor.

insert into storage.buckets (id, name, public)
values ('ga-pdf-downloads', 'ga-pdf-downloads', true)
on conflict (id) do nothing;

drop policy if exists "ga_pdf_downloads_insert" on storage.objects;
create policy "ga_pdf_downloads_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'ga-pdf-downloads');

drop policy if exists "ga_pdf_downloads_read" on storage.objects;
create policy "ga_pdf_downloads_read"
on storage.objects
for select
to public
using (bucket_id = 'ga-pdf-downloads');
