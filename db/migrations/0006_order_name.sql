-- 0006 — buyer name on the order (populated from the Shopify order in Sprint 2).
-- The A3 ticket sheet shows the holder name; falls back to email until names exist.
alter table orders add column if not exists full_name text;
