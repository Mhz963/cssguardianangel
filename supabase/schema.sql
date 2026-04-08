-- Run this in Supabase SQL editor.

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_sticky_notes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notes jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_blogs (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  owner_key text not null default '',
  author_name text not null default 'Guardian User',
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  content text not null default '',
  categories jsonb not null default '[]'::jsonb,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;
alter table public.user_sticky_notes enable row level security;
alter table public.user_blogs enable row level security;

drop policy if exists "user_profiles_select_own" on public.user_profiles;
drop policy if exists "user_profiles_insert_own" on public.user_profiles;
drop policy if exists "user_profiles_update_own" on public.user_profiles;
drop policy if exists "user_profiles_delete_own" on public.user_profiles;

create policy "user_profiles_select_own"
on public.user_profiles
for select
to authenticated
using (auth.uid() = user_id);

create policy "user_profiles_insert_own"
on public.user_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "user_profiles_update_own"
on public.user_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "user_profiles_delete_own"
on public.user_profiles
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_sticky_notes_select_own" on public.user_sticky_notes;
drop policy if exists "user_sticky_notes_insert_own" on public.user_sticky_notes;
drop policy if exists "user_sticky_notes_update_own" on public.user_sticky_notes;
drop policy if exists "user_sticky_notes_delete_own" on public.user_sticky_notes;

create policy "user_sticky_notes_select_own"
on public.user_sticky_notes
for select
to authenticated
using (auth.uid() = user_id);

create policy "user_sticky_notes_insert_own"
on public.user_sticky_notes
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "user_sticky_notes_update_own"
on public.user_sticky_notes
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "user_sticky_notes_delete_own"
on public.user_sticky_notes
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_blogs_public_read" on public.user_blogs;
drop policy if exists "user_blogs_insert_own" on public.user_blogs;
drop policy if exists "user_blogs_update_own" on public.user_blogs;
drop policy if exists "user_blogs_delete_own" on public.user_blogs;

create policy "user_blogs_public_read"
on public.user_blogs
for select
to anon, authenticated
using (true);

create policy "user_blogs_insert_own"
on public.user_blogs
for insert
to authenticated
with check (auth.uid() = owner_user_id);

create policy "user_blogs_update_own"
on public.user_blogs
for update
to authenticated
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

create policy "user_blogs_delete_own"
on public.user_blogs
for delete
to authenticated
using (auth.uid() = owner_user_id);

create table if not exists public.blog_reactions (
  blog_slug text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (blog_slug, user_id)
);

create table if not exists public.blog_comments (
  id uuid primary key default gen_random_uuid(),
  blog_slug text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null default 'Guardian User',
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.blog_reactions enable row level security;
alter table public.blog_comments enable row level security;

drop policy if exists "blog_reactions_public_read" on public.blog_reactions;
drop policy if exists "blog_reactions_insert_own" on public.blog_reactions;
drop policy if exists "blog_reactions_update_own" on public.blog_reactions;
drop policy if exists "blog_reactions_delete_own" on public.blog_reactions;

create policy "blog_reactions_public_read"
on public.blog_reactions
for select
to anon, authenticated
using (true);

create policy "blog_reactions_insert_own"
on public.blog_reactions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "blog_reactions_update_own"
on public.blog_reactions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "blog_reactions_delete_own"
on public.blog_reactions
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "blog_comments_public_read" on public.blog_comments;
drop policy if exists "blog_comments_insert_own" on public.blog_comments;
drop policy if exists "blog_comments_update_own" on public.blog_comments;
drop policy if exists "blog_comments_delete_own" on public.blog_comments;

create policy "blog_comments_public_read"
on public.blog_comments
for select
to anon, authenticated
using (true);

create policy "blog_comments_insert_own"
on public.blog_comments
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "blog_comments_update_own"
on public.blog_comments
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "blog_comments_delete_own"
on public.blog_comments
for delete
to authenticated
using (auth.uid() = user_id);
