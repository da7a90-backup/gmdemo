// Server-side email template store + renderer. Admin edits live in Postgres
// (email_templates); code renders {{variables}} and hands the result to Klaviyo as
// event properties. Falls back to the code defaults when a row hasn't been saved.
import { pool } from "./db";
import { klaviyoEvent } from "./providers/klaviyo";
import { EMAIL_TEMPLATES, emailTemplateDef, type EmailTemplateDef } from "@/lib/email-templates-data";

export type Vars = Record<string, string | number>;

/** Replace {{ var }} tokens with values; unknown tokens are left intact so typos show. */
export function fillVars(s: string, vars: Vars): string {
  return s.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

/** The current subject/body for a template — admin override, else code default. */
export async function getTemplate(key: string): Promise<{ subject: string; body: string } | null> {
  const row = (await pool.query(`select subject, body from email_templates where key = $1`, [key])).rows[0] as
    | { subject: string | null; body: string | null }
    | undefined;
  if (row) return { subject: row.subject ?? "", body: row.body ?? "" };
  const d = emailTemplateDef(key);
  return d ? { subject: d.subject, body: d.body } : null;
}

/** Render a template to a final subject + HTML body. */
export async function renderTemplate(key: string, vars: Vars): Promise<{ subject: string; body_html: string } | null> {
  const t = await getTemplate(key);
  if (!t) return null;
  return { subject: fillVars(t.subject, vars), body_html: fillVars(t.body, vars) };
}

/**
 * Render the admin template and emit the Klaviyo event carrying the rendered
 * `subject` + `body_html` (plus the raw vars). The Klaviyo flow just outputs
 * {{ event.subject }} / {{ event.body_html | safe }}. Never throws.
 */
export async function emitEmailEvent(
  metric: string,
  templateKey: string,
  email: string,
  vars: Vars,
  uniqueId?: string,
) {
  const rendered = await renderTemplate(templateKey, vars).catch(() => null);
  const properties: Record<string, unknown> = { ...vars };
  if (rendered) {
    properties.subject = rendered.subject;
    properties.body_html = rendered.body_html;
  }
  return klaviyoEvent(metric, email, properties, uniqueId);
}

export type AdminTemplate = EmailTemplateDef & { edited: boolean };

/** All templates (code defs merged with any saved admin overrides) for the desk. */
export async function listTemplates(): Promise<AdminTemplate[]> {
  const rows = (await pool.query(`select key, subject, body from email_templates`)).rows as {
    key: string; subject: string | null; body: string | null;
  }[];
  const saved = new Map(rows.map((r) => [r.key, r]));
  return EMAIL_TEMPLATES.map((d) => {
    const r = saved.get(d.key);
    return { ...d, subject: r?.subject ?? d.subject, body: r?.body ?? d.body, edited: !!r };
  });
}

export async function upsertTemplate(key: string, subject: string, body: string): Promise<void> {
  if (!emailTemplateDef(key)) throw new Error(`unknown template: ${key}`);
  await pool.query(
    `insert into email_templates (key, subject, body) values ($1, $2, $3)
     on conflict (key) do update set subject = excluded.subject, body = excluded.body, updated_at = now()`,
    [key, subject ?? "", body ?? ""],
  );
}

/** Seed the code defaults into the table (idempotent; overrides are preserved). */
export async function seedEmailTemplates(): Promise<void> {
  for (const d of EMAIL_TEMPLATES) {
    await pool
      .query(`insert into email_templates (key, subject, body) values ($1, $2, $3) on conflict (key) do nothing`, [d.key, d.subject, d.body])
      .catch(() => {});
  }
}
