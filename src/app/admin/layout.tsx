"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Megaphone, PenLine, Trophy, Printer, MessageSquareText, Mail, MailPlus, ChartNoAxesColumn, Newspaper, RefreshCw, ListChecks, Gauge, ExternalLink, LogOut } from "lucide-react";
import { Label } from "@/components/sticker";

const SECTIONS = [
  { href: "/admin/promotions", label: "Promotions", icon: Megaphone },
  { href: "/admin/attribution", label: "Attribution", icon: ChartNoAxesColumn },
  { href: "/admin/content", label: "Content", icon: PenLine },
  { href: "/admin/content-lists", label: "Pages & lists", icon: ListChecks },
  { href: "/admin/emails", label: "Email templates", icon: MailPlus },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/cycles", label: "Cycle & partners", icon: RefreshCw },
  { href: "/admin/winners", label: "Winners", icon: Trophy },
  { href: "/admin/stats", label: "Lifetime stats", icon: Gauge },
  { href: "/admin/tickets", label: "Print tickets", icon: Printer },
  { href: "/admin/sms", label: "SMS list", icon: MessageSquareText },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The login page renders on its own, without the admin chrome.
  if (pathname === "/admin/login") return <>{children}</>;

  return (
    <div className="bg-paper text-ink relative overflow-hidden grain min-h-screen">
      <div className="mx-auto max-w-[1300px] px-5 py-10 grid gap-8 lg:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <aside>
          <div className="flex items-center gap-2 lg:flex-col lg:items-start">
            <Label tone="ink" variant="solid">Admin</Label>
            <Label tone="brass" variant="outline" size="sm">Live — saves to Shopify</Label>
          </div>
          <nav aria-label="Admin" className="mt-5 flex lg:flex-col gap-1.5 overflow-x-auto scrollbar-thin pb-2 lg:pb-0">
            {SECTIONS.map((s) => {
              const active = pathname?.startsWith(s.href);
              const Icon = s.icon;
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full font-condensed uppercase tracking-[0.18em] text-[11px] font-semibold whitespace-nowrap border transition-colors ${
                    active
                      ? "bg-ink text-brass border-ink"
                      : "bg-paper-4 text-ink border-ink/10 hover:bg-ink hover:text-paper"
                  }`}
                >
                  <Icon size={14} /> {s.label}
                </Link>
              );
            })}
            <a
              href="/"
              className="mt-2 inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full font-condensed uppercase tracking-[0.18em] text-[11px] font-semibold whitespace-nowrap border border-ink/10 bg-paper-4 text-ink hover:bg-ink hover:text-paper transition-colors"
            >
              <ExternalLink size={14} /> View site
            </a>
            <a
              href="/api/admin/logout"
              className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full font-condensed uppercase tracking-[0.18em] text-[11px] font-semibold whitespace-nowrap border border-ink/10 bg-paper-4 text-ink hover:bg-accent hover:text-paper hover:border-accent transition-colors"
            >
              <LogOut size={14} /> Log out
            </a>
          </nav>
        </aside>

        {/* Section content */}
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
