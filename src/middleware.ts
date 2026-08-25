import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminToken, ADMIN_COOKIE } from "@/lib/server/admin-session";

// Runs on every request except Next internals and static files (anything with a
// dot). Two jobs:
//   1. Soft-launch gate: the public site lives under /beta/* — "/" shows the
//      coming-soon teaser, /beta[/x] serves the real site, and bare paths funnel
//      into /beta so nothing dangles at the root.
//   2. Admin gate: /admin + /api/admin behind the cookie session (unchanged).
export const config = { matcher: ["/((?!_next|.*\\..*).*)"] };

// A few admin GETs double as the storefront's public data source — kept open.
const PUBLIC_ADMIN_GETS = ["/api/admin/stats", "/api/admin/cycle", "/api/admin/partners", "/api/admin/winners"];
// The login flow itself must be reachable without a session.
const OPEN_PATHS = ["/admin/login", "/api/admin/login", "/api/admin/logout"];

async function adminGate(req: NextRequest): Promise<NextResponse> {
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

/** Serve the real site under /beta by internally stripping the prefix; mark it noindex. */
function betaRewrite(req: NextRequest, targetPath: string): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = targetPath;
  const res = NextResponse.rewrite(url);
  res.headers.set("x-robots-tag", "noindex");
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin + its API keep their own gate, untouched by the /beta prefix.
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) return adminGate(req);
  // Every other API route is called with its bare path by the app — leave it alone.
  if (pathname.startsWith("/api/")) return NextResponse.next();

  // /beta and /beta/* → render the real site (homepage lives at /home).
  if (pathname === "/beta" || pathname === "/beta/") return betaRewrite(req, "/home");
  if (pathname.startsWith("/beta/")) return betaRewrite(req, pathname.slice(5) || "/");

  // "/" is the teaser (app/page.tsx).
  if (pathname === "/") return NextResponse.next();

  // The internal homepage target must not be reachable bare.
  if (pathname === "/home") {
    const url = req.nextUrl.clone();
    url.pathname = "/beta";
    return NextResponse.redirect(url);
  }

  // Any other bare user path → its canonical /beta/<path> (funnels stray links in).
  const url = req.nextUrl.clone();
  url.pathname = "/beta" + pathname;
  return NextResponse.redirect(url);
}
