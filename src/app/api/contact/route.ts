// POST /api/contact — store a contact-form submission (real; no longer a fake success).
import { ok, fail, readJson, isEmail } from "@/lib/server/http";
import { pool } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = await readJson<{ name?: string; email?: string; message?: string }>(req);
  if (!isEmail(b?.email) || !b?.message?.trim()) return fail("A valid email and a message are required.");
  try {
    await pool.query(
      `insert into contact_messages (name, email, message) values ($1, $2, $3)`,
      [(b.name ?? "").trim().slice(0, 200), b.email!.trim().toLowerCase(), b.message.trim().slice(0, 5000)],
    );
    return ok({ received: true });
  } catch (e) {
    return fail(String((e as Error)?.message ?? e), 500);
  }
}
