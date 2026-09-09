// GET  /api/unsubscribe?e=<email>&t=<token>  — link in every marketing email
// POST /api/unsubscribe?e=<email>&t=<token>  — RFC 8058 one-click (List-Unsubscribe-Post)
// Verifies the HMAC token and flips the subscriber to 'unsubscribed'. For member
// recipients with no newsletter row, upserts one so future sends skip them.
import { pool } from "@/lib/server/db";
import { verifyUnsub } from "@/lib/server/unsubscribe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function unsubscribe(req: Request): Promise<Response> {
  const p = new URL(req.url).searchParams;
  const email = (p.get("e") || "").trim().toLowerCase();
  const token = p.get("t") || "";
  const okToken = email && verifyUnsub(email, token);

  if (okToken) {
    await pool
      .query(
        `insert into email_subscribers (email, status, source) values ($1, 'unsubscribed', 'Unsubscribe')
         on conflict (email) do update set status = 'unsubscribed', updated_at = now()`,
        [email],
      )
      .catch(() => {});
  }

  const html = okToken
    ? `<h1>You're unsubscribed.</h1><p>${email} won't receive marketing email from Generous Motors anymore. Transactional messages (ticket receipts, sign-in codes) still send.</p>`
    : `<h1>Link expired</h1><p>That unsubscribe link isn't valid. Contact support@generousmotors.org and we'll remove you.</p>`;

  return new Response(
    `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">` +
      `<div style="font-family:Arial,sans-serif;max-width:36rem;margin:12vh auto;padding:0 5vw;color:#16110f;text-align:center">${html}</div>`,
    { status: okToken ? 200 : 400, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

export const GET = unsubscribe;
export const POST = unsubscribe;
