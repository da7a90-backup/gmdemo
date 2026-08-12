-- 0015 — buyer phone on the order (captured from the Shopify order, like full_name).
-- Bugfix: the A3 ticket sheet showed the holder's phone from the single per-user
-- users.phone. That's wrong on two counts: (1) a buyer's orders can each carry a
-- different checkout phone, and (2) the phone usually arrives on the order's
-- BILLING ADDRESS, which the webhook never read — so most holders printed blank.
-- Phone now lives per-order, mirroring orders.full_name.
alter table orders add column if not exists phone text;
