-- Guardian Portfolio: public profiles + work samples.
-- Run this in the Supabase SQL editor (SQL → New query → Run).

create table if not exists public.user_portfolios (
  user_id uuid primary key references auth.users(id) on delete cascade,
  slug text not null unique,
  display_name text not null default '',
  headline text not null default '',
  offer text not null default '',
  bio text not null default '',
  city text not null default '',
  rate_text text not null default '',
  skills jsonb not null default '[]'::jsonb,
  links jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_portfolios_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table if not exists public.user_portfolio_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  description text not null default '',
  item_type text not null default 'document',
  file_path text,
  file_name text,
  file_mime text,
  file_size bigint,
  external_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists user_portfolios_slug_idx on public.user_portfolios (slug);
create index if not exists user_portfolios_public_idx on public.user_portfolios (is_public);
create index if not exists user_portfolio_items_user_idx on public.user_portfolio_items (user_id, sort_order, created_at);

alter table public.user_portfolios enable row level security;
alter table public.user_portfolio_items enable row level security;

drop policy if exists "user_portfolios_select_visible" on public.user_portfolios;
drop policy if exists "user_portfolios_insert_own" on public.user_portfolios;
drop policy if exists "user_portfolios_update_own" on public.user_portfolios;
drop policy if exists "user_portfolios_delete_own" on public.user_portfolios;

create policy "user_portfolios_select_visible"
on public.user_portfolios
for select
to anon, authenticated
using (is_public = true or auth.uid() = user_id);

create policy "user_portfolios_insert_own"
on public.user_portfolios
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "user_portfolios_update_own"
on public.user_portfolios
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "user_portfolios_delete_own"
on public.user_portfolios
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_portfolio_items_select_visible" on public.user_portfolio_items;
drop policy if exists "user_portfolio_items_insert_own" on public.user_portfolio_items;
drop policy if exists "user_portfolio_items_update_own" on public.user_portfolio_items;
drop policy if exists "user_portfolio_items_delete_own" on public.user_portfolio_items;

create policy "user_portfolio_items_select_visible"
on public.user_portfolio_items
for select
to anon, authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.user_portfolios p
    where p.user_id = user_portfolio_items.user_id
      and p.is_public = true
  )
);

create policy "user_portfolio_items_insert_own"
on public.user_portfolio_items
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "user_portfolio_items_update_own"
on public.user_portfolio_items
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "user_portfolio_items_delete_own"
on public.user_portfolio_items
for delete
to authenticated
using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('ga-portfolio', 'ga-portfolio', true)
on conflict (id) do nothing;

drop policy if exists "ga_portfolio_insert_own" on storage.objects;
drop policy if exists "ga_portfolio_update_own" on storage.objects;
drop policy if exists "ga_portfolio_delete_own" on storage.objects;
drop policy if exists "ga_portfolio_read_public" on storage.objects;

create policy "ga_portfolio_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'ga-portfolio'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "ga_portfolio_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'ga-portfolio'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'ga-portfolio'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "ga_portfolio_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'ga-portfolio'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "ga_portfolio_read_public"
on storage.objects
for select
to public
using (bucket_id = 'ga-portfolio');
