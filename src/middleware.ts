import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Gate the admin UI + admin API behind HTTP Basic Auth when ADMIN_PASSWORD is set.
// The browser attaches the credentials to every same-origin request after one prompt, so
// this protects both the /admin pages AND their /api/admin fetches with no login-page code.
// Unset ADMIN_PASSWORD → open (local dev). Webhooks (/api/webhooks/*) and crons
// (/api/cron/*, guarded by CRON_SECRET) are not matched.
export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };

// A few admin GET endpoints double as the storefront's public data source (the live cycle
// /prize/countdown, lifetime stats, partners, winners). Those GETs stay open; everything
// else under /api/admin — all writes, and sensitive reads (subscribers, campaigns, email
// templates, webhooks, upload) — plus every /admin page requires auth. Block-by-default.
const PUBLIC_ADMIN_GETS = ["/api/admin/stats", "/api/admin/cycle", "/api/admin/partners", "/api/admin/winners"];

export function middleware(req: NextRequest) {
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return NextResponse.next(); // no password configured → open

  const { pathname } = req.nextUrl;
  if (req.method === "GET" && PUBLIC_ADMIN_GETS.includes(pathname)) return NextResponse.next();

  const user = process.env.ADMIN_USER || "admin";
  const hdr = req.headers.get("authorization") || "";
  if (hdr.startsWith("Basic ")) {
    try {
      const decoded = atob(hdr.slice(6));
      const i = decoded.indexOf(":");
      if (decoded.slice(0, i) === user && decoded.slice(i + 1) === pass) return NextResponse.next();
    } catch {
      /* malformed header → fall through to 401 */
    }
  }
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Generous Motors admin", charset="UTF-8"' },
  });
}
