-- Allow voucher-based free premium access (no Stripe).
-- Run in Supabase SQL editor if user_payments already exists.

alter table public.user_payments drop constraint if exists user_payments_status_check;

alter table public.user_payments add constraint user_payments_status_check check (
  status in ('pending', 'active', 'past_due', 'canceled', 'incomplete', 'unpaid', 'voucher')
);
