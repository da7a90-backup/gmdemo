// GET /api/lookup?email=... | ?phone=... — PUBLIC "find my tickets" lookup. Returns the
// real minted entries for that email/phone (no login). Only exposes ticket counts + cycle
// info tied to the identifier the person already typed. See customer-tickets.ts.
import { ok, fail, isEmail, normalizePhone } from "@/lib/server/http";
import { pool } from "@/lib/server/db";
import { listCustomerEntries } from "@/lib/server/customer-tickets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = { id: string; drawCycle: number; vehicle: string; ticketCount: number; drawDateISO: string; status: "won" | "did-not-win" | "active" };

export async function GET(req: Request) {
  const u = new URL(req.url);
  const emailRaw = u.searchParams.get("email");
  const phoneRaw = u.searchParams.get("phone");
  const email = emailRaw && isEmail(emailRaw) ? emailRaw.trim().toLowerCase() : null;
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
  if (!email && !phone) return fail("Enter a valid email or US phone number.");

  try {
    const entries = await listCustomerEntries({ email, phone });
    const map = (e: { cycle: string; orderToken: string; vehicle: string; tickets: number; drawDateISO: string }, active: boolean): Row => ({
      id: `${e.cycle}-${e.orderToken}`,
      drawCycle: Number(e.cycle) || 0,
      vehicle: e.vehicle,
      ticketCount: e.tickets,
      drawDateISO: e.drawDateISO,
      status: active ? "active" : "did-not-win",
    });
    const active = entries.active.map((e) => map(e, true));
    const past = entries.past.map((e) => map(e, false));
    if (!active.length && !past.length) return ok({ found: false });

    // Display name + contact from the buyer's most recent order / user row.
    const info = (
      await pool
        .query(
          `select coalesce(max(o.full_name), '') as name, coalesce(max(u.email), '') as email, coalesce(max(u.phone), '') as phone
           from users u left join orders o on o.email = u.email
           where ($1::citext is not null and u.email = $1) or ($2::text is not null and u.phone = $2)`,
          [email, phone],
        )
        .catch(() => null)
    )?.rows?.[0] as { name?: string; email?: string; phone?: string } | undefined;

    const phoneDigits = (info?.phone || phone || "").replace(/\D/g, "").replace(/^1/, "");
    return ok({
      found: true,
      record: {
        fullName: info?.name || (email ? email.split("@")[0] : "Ticket holder"),
        email: info?.email || email || "",
        phone: phoneDigits,
        active,
        past,
      },
    });
  } catch (e) {
    return fail(String((e as Error)?.message ?? e), 500);
  }
}
