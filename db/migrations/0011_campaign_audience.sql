-- Campaign audience: which list an email campaign targets.
-- 'newsletter' = the newsletter list (default), 'members' = active members only.
alter table campaigns add column if not exists audience text not null default 'newsletter';
