-- Contact form submissions.
create table if not exists contact_messages (
  id         bigserial primary key,
  name       text not null default '',
  email      text not null default '',
  message    text not null default '',
  created_at timestamptz not null default now()
);
