"use client";
import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

/**
 * Wraps the page in the brand chrome (header, footer) EXCEPT on:
 *  - /checkout — the simulated Shopify checkout, its own minimal chrome
 *  - /admin — the admin desk has its own layout (sidebar); the public header/footer
 *    on top just double-stacked chrome and broke the mobile layout.
 */
export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const path = pathname ?? "/";
  // The public site renders under /beta/* — strip the prefix before deciding chrome.
  const rel = path === "/beta" ? "/" : path.startsWith("/beta/") ? path.slice(5) : path;
  // "/" is the coming-soon teaser; checkout + admin carry their own chrome.
  const bare = path === "/" || rel.startsWith("/checkout") || path.startsWith("/admin");

  if (bare) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
