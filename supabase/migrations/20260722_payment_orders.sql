-- Payment orders ledger for admin revenue/order reporting.

create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  stripe_invoice_id text unique,
  stripe_payment_intent_id text,
  stripe_subscription_id text,
  stripe_customer_id text,
  amount_pkr integer not null default 0 check (amount_pkr >= 0),
  order_type text not null default 'subscription' check (
    order_type in ('checkout', 'renewal', 'subscription', 'one_time', 'voucher')
  ),
  status text not null default 'paid' check (
    status in ('paid', 'refunded', 'failed', 'pending')
  ),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_orders_user_id_idx on public.payment_orders (user_id);
create index if not exists payment_orders_paid_at_idx on public.payment_orders (paid_at desc);
create index if not exists payment_orders_subscription_idx on public.payment_orders (stripe_subscription_id);

alter table public.payment_orders enable row level security;

-- No public/authenticated client policies: service role only (admin API + webhooks).
drop policy if exists "payment_orders_no_client_access" on public.payment_orders;
