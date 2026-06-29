"use client";
import { usePathname } from "next/navigation";
import { TopAnnounce } from "@/components/marquee";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

/**
 * Wraps the page in the brand chrome (top marquee, header, footer)
 * EXCEPT on /checkout, which is the simulated Shopify checkout
 * — that page should feel like a redirect off-site, with its own minimal chrome.
 */
export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCheckout = pathname?.startsWith("/checkout");

  if (isCheckout) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <TopAnnounce />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
