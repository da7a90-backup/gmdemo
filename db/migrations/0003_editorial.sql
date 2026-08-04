-- 0003 — admin-managed editorial content (Supabase-owned; full CRUD control).
-- Media files live in Shopify Files (CDN); these rows store the structured data
-- plus the media URLs. Mirrors the demo's winners/blog/cycle/partners stores.

create table partners (
  id         bigint generated always as identity primary key,
  name       text not null,
  kind       text not null check (kind in ('charity','sponsor')),
  logo_url   text,
  url        text,
  blurb      text,
  sort       integer not null default 0,
  created_at timestamptz not null default now()
);

create table winners (
  id           bigint generated always as identity primary key,
  first_name   text not null,
  last_initial text,
  city         text,
  state        text,
  vehicle      text not null,
  draw_cycle   integer,
  charity      text,
  quote        text,
  draw_date    timestamptz,
  photo_url    text,          -- Shopify Files CDN url
  video_url    text,
  created_at   timestamptz not null default now()
);

create table articles (
  id              bigint generated always as identity primary key,
  slug            text unique not null,
  title           text not null,
  author          text,
  tag             text,
  excerpt         text,
  body            text,
  format          text not null default 'markdown' check (format in ('markdown','html')),
  published       boolean not null default false,
  published_at    timestamptz,
  seo_title       text,
  seo_description text,
  og_image        text,        -- Shopify Files CDN url
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Extend the existing ticketing `cycles` table with the admin-set content fields
-- (was cycle-store.ts). Raffle sequence + cycle content now share one row.
alter table cycles add column if not exists vehicle_label      text;
alter table cycles add column if not exists draw_date          timestamptz;
alter table cycles add column if not exists charity_partner_id bigint;  -- soft ref → partners.id
alter table cycles add column if not exists charity_blurb      text;
