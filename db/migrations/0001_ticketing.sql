-- 0001 — ticketing core (see docs/build/data-model.md §2)
create extension if not exists citext;

create table users (
  id         bigint generated always as identity primary key,
  email      citext unique,
  phone      text unique,
  created_at timestamptz not null default now()
);

create table cycles (
  id         bigint generated always as identity primary key,
  code       text unique not null,
  status     text not null default 'open'
               check (status in ('draft','open','closed','drawn','archived')),
  created_at timestamptz not null default now()
);

-- Per-cycle ORDER counter (bumped once per order). Sequence variant is preferred
-- in production (docs §0.5); this row backs the `safe` allocator.
create table cycle_counters (
  cycle_id      bigint primary key references cycles(id),
  last_order_no integer not null default 0
);

create table orders (
  id               bigint generated always as identity primary key,
  shopify_order_id bigint unique not null,
  order_token      text not null,
  user_id          bigint not null references users(id),
  cycle_id         bigint not null references cycles(id),
  promo_multiplier integer not null default 1,
  created_at       timestamptz not null default now(),
  unique (cycle_id, order_token)
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
  unique (shopify_line_id),
  unique (order_id, seq_start)
);
create index entry_blocks_cycle_live_idx on entry_blocks (cycle_id) where not voided;

create table processed_webhooks (
  webhook_id   text primary key,
  topic        text not null,
  processed_at timestamptz not null default now()
);
