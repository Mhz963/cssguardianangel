-- Monthly premium subscription for Guardian Study Planner.
-- First month: PKR 1,000 (PKR 500 subscription + PKR 500 activation fee)
-- From month 2 onward: PKR 500/month
-- Run in Supabase SQL editor after deploying Stripe integration.

create table if not exists public.user_payments (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_session_id text,
  stripe_subscription_id text,
  first_month_amount_pkr integer not null default 1000,
  monthly_amount_pkr integer not null default 500,
  status text not null default 'pending' check (
    status in ('pending', 'active', 'past_due', 'canceled', 'incomplete', 'unpaid')
  ),
  current_period_end timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_payments_status_idx on public.user_payments (status);
create index if not exists user_payments_subscription_idx on public.user_payments (stripe_subscription_id);

alter table public.user_payments enable row level security;

drop policy if exists "user_payments_select_own" on public.user_payments;

create policy "user_payments_select_own"
on public.user_payments
for select
to authenticated
using (auth.uid() = user_id);
