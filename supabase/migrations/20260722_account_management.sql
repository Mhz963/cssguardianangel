-- Account management: billing portal lookups and cascade cleanup support.

create index if not exists user_payments_stripe_customer_idx
on public.user_payments (stripe_customer_id)
where stripe_customer_id is not null;

comment on table public.user_payments is
  'Subscription and billing state. Rows cascade-delete when auth.users is removed via account deletion.';
