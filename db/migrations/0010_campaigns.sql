-- 0010 — marketing campaigns (newsletter / SMS blasts) composed in the GM admin.
-- Email campaigns are sent as REAL Klaviyo campaigns (create template → create
-- campaign → assign template → send job); the klaviyo_campaign_id is stored back.
-- (SMS sends are still gated on Postscript API plan access.)
create table if not exists campaigns (
  id                  bigint generated always as identity primary key,
  channel             text not null check (channel in ('email','sms')),
  subject             text,
  body                text not null,
  promo_code          text,
  status              text not null default 'draft' check (status in ('draft','sent','failed')),
  klaviyo_campaign_id text,
  recipients          integer,
  error               text,
  created_at          timestamptz not null default now(),
  sent_at             timestamptz
);
