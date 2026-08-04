-- 0005 — site settings (key/value jsonb). Holds lifetime stats so nothing is
-- hardcoded in the frontend.
create table site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
