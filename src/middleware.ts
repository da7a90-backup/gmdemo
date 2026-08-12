import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminToken, ADMIN_COOKIE } from "@/lib/server/admin-session";

// Gate /admin + /api/admin behind a cookie session (set at /admin/login) when ADMIN_PASSWORD
// is configured. Unset → open (local dev). A valid `gm_admin` cookie is required for every
// /admin page and /api/admin write; missing → redirect to the login page (pages) or 401 (API).
export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };

// A few admin GETs double as the storefront's public data source — kept open.
const PUBLIC_ADMIN_GETS = ["/api/admin/stats", "/api/admin/cycle", "/api/admin/partners", "/api/admin/winners"];
// The login flow itself must be reachable without a session.
const OPEN_PATHS = ["/admin/login", "/api/admin/login", "/api/admin/logout"];

export async function middleware(req: NextRequest) {
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return NextResponse.next(); // no password configured → open

  const { pathname } = req.nextUrl;
  if (OPEN_PATHS.includes(pathname)) return NextResponse.next();
  if (req.method === "GET" && PUBLIC_ADMIN_GETS.includes(pathname)) return NextResponse.next();

  if (await verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}
