-- 0017 — prize-preference survey from the teaser ("tell us which car you'd want to
-- win"). One (latest) choice per email; stored alongside the free-ticket signup.
create table if not exists prize_votes (
  id         bigint generated always as identity primary key,
  email      citext not null unique,
  prize      text not null,
  source     text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
