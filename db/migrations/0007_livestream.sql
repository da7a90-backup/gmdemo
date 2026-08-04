-- 0007 — livestream links for the cycle (admin-editable, shown on /live + home).
alter table cycles add column if not exists livestream_facebook text;
alter table cycles add column if not exists livestream_youtube  text;
