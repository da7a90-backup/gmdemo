// Streaming CSV export of SMS subscribers. Streams in 5k-row chunks so a 100k+ list
// never buffers past the response limit. format=plain | postscript; optional status filter.
import { query } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = ["subscribed", "pending", "unsubscribed"];
const esc = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const format = sp.get("format") === "postscript" ? "postscript" : "plain";
  const status = STATUSES.includes(sp.get("status") || "") ? sp.get("status")! : null;

  const conds: string[] = [];
  if (status) conds.push(`status = '${status}'`);
  if (format === "postscript") conds.push(`status <> 'unsubscribed'`); // never upload an opt-out as "Opted In"
  const where = conds.length ? `where ${conds.join(" and ")}` : "";

  const header = format === "postscript"
    ? "Phone,Opt-in Status,SMS Consent Timestamp\r\n"
    : "Phone,Status,Source,Joined\r\n";
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(enc.encode("﻿" + header)); // BOM so Excel reads UTF-8
      let offset = 0;
      const LIM = 5000;
      for (;;) {
        const rows = (await query(
          `select phone, status, source, created_at, consent_at from sms_subscribers ${where}
           order by created_at desc limit ${LIM} offset ${offset}`,
        )).rows as { phone: string; status: string; source: string | null; created_at: string; consent_at: string | null }[];
        if (!rows.length) break;
        const body = rows.map((r) =>
          format === "postscript"
            ? [esc(r.phone), "Opted In", esc(r.consent_at ?? r.created_at)].join(",")
            : [esc(r.phone), esc(r.status), esc(r.source), esc(r.created_at)].join(","),
        ).join("\r\n") + "\r\n";
        controller.enqueue(enc.encode(body));
        offset += rows.length;
        if (rows.length < LIM) break;
      }
      controller.close();
    },
  });

  const name = format === "postscript" ? "postscript-optin" : "sms-subscribers";
  return new Response(stream, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${name}-${status ?? "all"}.csv"`,
    },
  });
}
