// Branded HTML wrapper applied to every transactional email at send time, so all
// templates get the Generous Motors header (logo on an ink bar), a teal accent, and
// a footer — while the admin keeps editing just the inner body content.
const LOGO_URL = process.env.EMAIL_LOGO_URL || "https://www.generousmotors.org/email/gm-logo.png";
const SITE_URL = process.env.PUBLIC_BASE_URL || "https://www.generousmotors.org";

const esc = (s: string) => s.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]!);

/** Wrap rendered template HTML in the brand shell (table layout for email clients). */
export function renderBrandedEmail(opts: { subject?: string; bodyHtml: string; footerNote?: string }): string {
  const footer = opts.footerNote ?? "You received this because you have an entry or account with Generous Motors.";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="color-scheme" content="light only"/><meta name="supported-color-schemes" content="light"/><title>${esc(opts.subject ?? "Generous Motors")}</title></head>
<body style="margin:0;padding:0;background:#e6dcc0;-webkit-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e6dcc0;">
    <tr><td align="center" style="padding:28px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e0d9c6;">
        <tr><td align="center" style="background:#16110f;padding:22px 24px;">
          <img src="${LOGO_URL}" alt="Generous Motors" width="220" height="130" style="display:block;width:220px;max-width:70%;height:auto;border:0;outline:none;text-decoration:none;" />
        </td></tr>
        <tr><td style="padding:32px 32px 8px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.6;color:#16110f;">
          ${opts.bodyHtml}
        </td></tr>
        <tr><td style="padding:4px 32px 0;"><div style="height:3px;background:#00d1bd;border-radius:2px;"></div></td></tr>
        <tr><td style="padding:18px 32px 30px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#7a6f5c;">
          <p style="margin:0 0 6px;"><strong style="color:#3d352c;">Generous Motors</strong> — a US 501(c)(3) car raffle.</p>
          <p style="margin:0 0 6px;">Every ticket is printed and pulled on a live stream; 10% of every cycle funds the cause.</p>
          <p style="margin:0;"><a href="${SITE_URL}" style="color:#00a89a;text-decoration:none;">generousmotors.org</a> · ${esc(footer)}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
