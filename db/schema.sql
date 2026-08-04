-- Ticketing stress-test schema (subset of docs/build/data-model.md §2).
-- Focused on what the generate endpoint needs to prove: no duplicate ticket
-- numbers, no missing tickets after payment, idempotent under concurrency.

create extension if not exists citext;

create table users (
  id         bigint generated always as identity primary key,
  email      citext unique,
  created_at timestamptz not null default now()
);

create table cycles (
  id         bigint generated always as identity primary key,
  code       text unique not null,          -- '12' → the GM12 prefix
  status     text not null default 'open'
               check (status in ('draft','open','closed','drawn','archived')),
  created_at timestamptz not null default now()
);

-- The per-cycle ORDER counter. One row per cycle, bumped ONCE PER ORDER.
create table cycle_counters (
  cycle_id      bigint primary key references cycles(id),
  last_order_no integer not null default 0
);

create table orders (
  id               bigint generated always as identity primary key,
  shopify_order_id bigint unique not null,        -- idempotency anchor
  order_token      text not null,                 -- '0001' — middle part
  user_id          bigint not null references users(id),
  cycle_id         bigint not null references cycles(id),
  promo_multiplier integer not null default 1,
  created_at       timestamptz not null default now(),
  unique (cycle_id, order_token)                  -- THE collision backstop
);

create table entry_blocks (
  id                bigint generated always as identity primary key,
  cycle_id          bigint not null references cycles(id),
  order_id          bigint not null references orders(id),
  shopify_line_id   bigint not null,
  user_id           bigint not null references users(id),
  purchased_tickets integer not null,
  multiplier        integer not null default 1,
  seq_start         integer not null,
  seq_end           integer not null,
  ticket_count      integer generated always as (seq_end - seq_start + 1) stored,
  voided            boolean not null default false,
  created_at        timestamptz not null default now(),
  unique (shopify_line_id),                       -- idempotency: a line mints once
  unique (order_id, seq_start)
);
create index on entry_blocks (cycle_id) where not voided;

create table processed_webhooks (
  webhook_id   text primary key,                  -- X-Shopify-Webhook-Id
  topic        text not null,
  processed_at timestamptz not null default now()
);
