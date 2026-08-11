-- Self-hosted passwordless login: one-time codes for email/phone OTP.
create table if not exists login_codes (
  id         bigserial primary key,
  identifier text not null,                         -- normalized email or E.164 phone
  channel    text not null check (channel in ('email','sms')),
  code_hash  text not null,                         -- HMAC(code) — never store plaintext
  expires_at timestamptz not null,
  attempts   int not null default 0,
  consumed   boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists login_codes_ident_idx on login_codes (identifier, channel, created_at desc);
