-- Real attribution: server-side visit log + per-order channel/revenue.
create table if not exists visits (
  id         bigserial primary key,
  channel    text not null default 'Organic',
  source     text not null default 'organic',
  page       text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists visits_created_idx on visits (created_at desc);

alter table orders add column if not exists channel     text;
alter table orders add column if not exists revenue_usd numeric(12,2);
