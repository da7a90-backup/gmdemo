import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Gate the admin UI + admin API behind HTTP Basic Auth when ADMIN_PASSWORD is set.
// The browser attaches the credentials to every same-origin request after one prompt, so
// this protects both the /admin pages AND their /api/admin fetches with no login-page code.
// Unset ADMIN_PASSWORD → open (local dev). Webhooks (/api/webhooks/*) and crons
// (/api/cron/*, guarded by CRON_SECRET) are intentionally NOT matched.
export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };

export function middleware(req: NextRequest) {
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return NextResponse.next(); // no password configured → open

  const user = process.env.ADMIN_USER || "admin";
  const hdr = req.headers.get("authorization") || "";
  if (hdr.startsWith("Basic ")) {
    try {
      const decoded = atob(hdr.slice(6));
      const i = decoded.indexOf(":");
      const u = decoded.slice(0, i);
      const p = decoded.slice(i + 1);
      if (u === user && p === pass) return NextResponse.next();
    } catch {
      /* malformed header → fall through to 401 */
    }
  }
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Generous Motors admin", charset="UTF-8"' },
  });
}
