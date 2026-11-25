-- Guardian English Lab: one progress row per user (scores, solved items, vocabulary review schedule).
-- The browser reads and writes its own row directly under RLS; no Vercel function is involved.
-- Run in the Supabase SQL editor. Until it is run, the Lab keeps progress on the device only.

create table if not exists public.english_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.english_progress enable row level security;

drop policy if exists "english_progress_select_own" on public.english_progress;
drop policy if exists "english_progress_insert_own" on public.english_progress;
drop policy if exists "english_progress_update_own" on public.english_progress;
drop policy if exists "english_progress_delete_own" on public.english_progress;

create policy "english_progress_select_own"
on public.english_progress for select to authenticated
using (auth.uid() = user_id);

create policy "english_progress_insert_own"
on public.english_progress for insert to authenticated
with check (auth.uid() = user_id);

create policy "english_progress_update_own"
on public.english_progress for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "english_progress_delete_own"
on public.english_progress for delete to authenticated
using (auth.uid() = user_id);
