-- 0008 — membership + Shopify subscription tracking (Track C.7 / D.2).
-- Members auto-enter every cycle; `is_member` gates the member multiplier and is
-- flipped by the subscription-contracts webhook. `shopify_customer_gid` links our
-- user to the Shopify customer so renewals/cancels can find the right row.
alter table users add column if not exists shopify_customer_gid text;
alter table users add column if not exists is_member boolean not null default false;
create unique index if not exists users_shopify_customer_gid_key
  on users (shopify_customer_gid) where shopify_customer_gid is not null;

-- One row per Shopify subscription contract (selling-plan membership).
create table if not exists subscription_contracts (
  id                   bigint generated always as identity primary key,
  shopify_contract_gid text unique not null,
  user_id              bigint references users(id),
  shopify_customer_gid text,
  status               text not null default 'active'
                         check (status in ('active','paused','cancelled','expired','failed')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
