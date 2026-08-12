// GET  /api/admin/attribution — REAL attribution: per-channel visits (visits table) +
//      purchases & revenue (real orders). No more localStorage / buy-click fakery.
// DELETE — clear the visit log (does NOT touch real orders).
import { ok, fail, requireAdmin, errMsg } from "@/lib/server/http";
import { pool } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = { channel: string; visits: number; purchases: number; revenue: number };

export async function GET(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  try {
    const visits = (await pool.query(`select coalesce(nullif(channel,''),'Organic') as channel, count(*)::int n from visits group by 1`)).rows as { channel: string; n: number }[];
    const orders = (await pool.query(`select coalesce(nullif(channel,''),'Organic') as channel, count(*)::int n, coalesce(sum(revenue_usd),0)::float rev from orders group by 1`)).rows as { channel: string; n: number; rev: number }[];

    const map = new Map<string, Row>();
    for (const v of visits) map.set(v.channel, { channel: v.channel, visits: v.n, purchases: 0, revenue: 0 });
    for (const o of orders) {
      const r = map.get(o.channel) ?? { channel: o.channel, visits: 0, purchases: 0, revenue: 0 };
      r.purchases = o.n;
      r.revenue = o.rev;
      map.set(o.channel, r);
    }
    const rows = [...map.values()].sort((a, b) => b.purchases - a.purchases || b.visits - a.visits);
    const totals = rows.reduce((t, r) => ({ visits: t.visits + r.visits, purchases: t.purchases + r.purchases, revenue: t.revenue + r.revenue }), { visits: 0, purchases: 0, revenue: 0 });

    // Recent real orders for the activity feed.
    const recent = (await pool.query(
      `select o.order_token, coalesce(nullif(o.channel,''),'Organic') as channel, coalesce(o.revenue_usd,0)::float rev, o.created_at
       from orders o order by o.id desc limit 25`,
    )).rows;

    return ok({ rows, totals, recent });
  } catch (e) {
    return fail(errMsg(e), 500);
  }
}

export async function DELETE(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  try { await pool.query(`truncate visits`); return ok({ cleared: true }); } catch (e) { return fail(errMsg(e), 500); }
}
