-- 0016 — free-ticket claims. Email signup on the teaser grants one free entry,
-- gated behind a confirm-to-claim link (double opt-in) so only real, reachable
-- addresses get a ticket. The claim page also collects the holder's name + phone
-- (printed on the barrel ticket). One CLAIMED free ticket per email.
create table if not exists free_ticket_claims (
  id               bigint generated always as identity primary key,
  email            citext not null,
  token_hash       text not null unique,          -- sha256 of the emailed token
  status           text not null default 'pending'
                     check (status in ('pending','claimed')),
  full_name        text,
  phone            text,
  cycle_id         bigint references cycles(id),
  shopify_order_id bigint,
  ticket_numbers   text,
  created_at       timestamptz not null default now(),
  claimed_at       timestamptz,
  expires_at       timestamptz not null
);

-- At most one CLAIMED free ticket per email (pending tokens may repeat).
create unique index if not exists free_ticket_one_per_email
  on free_ticket_claims (email) where status = 'claimed';
