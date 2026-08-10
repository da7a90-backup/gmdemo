-- 0009 — admin-managed email templates. The GM admin owns the subject + HTML body
-- (with {{variables}}); code renders them and injects the result into the Klaviyo
-- event (as `subject` + `body_html`), so the Klaviyo flow is a thin pass-through
-- ({{ event.subject }} / {{ event.body_html|safe }}). Falls back to code defaults.
create table if not exists email_templates (
  key        text primary key,
  channel    text not null default 'email' check (channel in ('email','sms')),
  subject    text,
  body       text not null default '',
  updated_at timestamptz not null default now()
);
