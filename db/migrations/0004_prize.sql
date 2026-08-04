-- 0004 — the prize (vehicle) on the cycle, editable from admin. jsonb for the
-- gallery + spec structures; scalar columns for the headline fields.
alter table cycles add column if not exists vehicle_year         integer;
alter table cycles add column if not exists vehicle_make         text;
alter table cycles add column if not exists vehicle_model        text;
alter table cycles add column if not exists vehicle_trim         text;
alter table cycles add column if not exists value_usd            integer;
alter table cycles add column if not exists price_per_ticket_usd integer;
alter table cycles add column if not exists tickets_sold         integer not null default 0;
alter table cycles add column if not exists images               jsonb not null default '[]'::jsonb;
alter table cycles add column if not exists headline_specs       jsonb not null default '[]'::jsonb;
alter table cycles add column if not exists spec_groups          jsonb not null default '[]'::jsonb;
