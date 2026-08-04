-- 0002 — email + SMS subscribers (Track B). Mirrors the demo's subscribers.ts.
-- Provider is source-of-truth for consent/deliverability; this table is the app's
-- queryable mirror. status stays 'pending' until the provider confirms.

create table email_subscribers (
  id          bigint generated always as identity primary key,
  email       citext unique not null,
  status      text not null default 'pending'
                check (status in ('pending','subscribed','unsubscribed','bounced')),
  source      text,                              -- Footer | Popup | Checkout
  klaviyo_id  text,
  user_id     bigint references users(id),
  consent_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table sms_subscribers (
  id            bigint generated always as identity primary key,
  phone         text unique not null,            -- E.164
  status        text not null default 'pending'
                  check (status in ('pending','subscribed','unsubscribed')),
  source        text,
  postscript_id text,
  user_id       bigint references users(id),
  consent_at    timestamptz,                     -- TCPA proof of opt-in
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
