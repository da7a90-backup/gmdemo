// Server-side email template store + renderer. Admin edits live in Postgres
// (email_templates); code renders {{variables}} and hands the result to SendGrid,
// our transactional email provider. Falls back to the code defaults when a row
// hasn't been saved.
import { pool } from "./db";
import { sendEmail } from "./providers/sendgrid";
import { renderBrandedEmail } from "./email-layout";
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
 * Render the admin template (subject + HTML) and deliver it via SendGrid. `metric`
 * becomes the SendGrid category (e.g. "Tickets Minted") for analytics, and any
 * `uniqueId` rides along as a custom arg for search/idempotency. Never throws —
 * returns { ok:false } if the template is missing or the send fails.
 */
export async function emitEmailEvent(
  metric: string,
  templateKey: string,
  email: string,
  vars: Vars,
  uniqueId?: string,
) {
  const rendered = await renderTemplate(templateKey, vars).catch(() => null);
  if (!rendered) {
    console.error(`[email] no template for "${templateKey}" — not sending to ${email}`);
    return { ok: false as const, error: `no template: ${templateKey}` };
  }
  return sendEmail({
    to: email,
    subject: rendered.subject,
    html: renderBrandedEmail({ subject: rendered.subject, bodyHtml: rendered.body_html }),
    category: metric,
    ...(uniqueId ? { customArgs: { unique_id: uniqueId } } : {}),
  });
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
