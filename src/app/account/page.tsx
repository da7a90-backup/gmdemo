"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, LogOut, Ticket, Sparkles } from "lucide-react";
import { getUser, signOut, type SessionUser, SESSION_EVENT } from "@/lib/session";
import { entryDB } from "@/lib/mock-data";
import { usePrizeCycle } from "@/lib/cycle-store";
import { generateTicketIDs } from "@/lib/ticket-gen";
import { getPromoConfig, PROMOS_EVENT } from "@/lib/promotions";
import { niceDate, niceWeekday, intl } from "@/lib/format";
import { Countdown } from "@/components/countdown";
import { Label } from "@/components/sticker";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const [memberMult, setMemberMult] = useState(4);

  useEffect(() => {
    const load = () => {
      const u = getUser();
      if (!u) {
        router.replace("/account/login");
        return;
      }
      setUser(u);
      setReady(true);
    };
    const loadPromos = () => {
      const member = getPromoConfig().find((t) => t.id === "member");
      if (member) setMemberMult(member.multiplier);
    };
    load();
    loadPromos();
    window.addEventListener(SESSION_EVENT, load);
    window.addEventListener(PROMOS_EVENT, loadPromos);
    return () => {
      window.removeEventListener(SESSION_EVENT, load);
      window.removeEventListener(PROMOS_EVENT, loadPromos);
    };
  }, [router]);

  if (!ready || !user) return null;

  // Demo: every signed-in account sees the demo entry record.
  const record = entryDB[0];
  const activeDraw = usePrizeCycle();
  const v = activeDraw.vehicle;

  return (
    <main className="bg-paper text-ink relative overflow-hidden grain">
      <div className="mx-auto max-w-[1100px] px-5 py-12">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Label tone="brass" variant="solid">Member · {memberMult}X entries</Label>
              <Label tone="ink" variant="outline">Cycle №{String(activeDraw.cycle).padStart(2, "0")}</Label>
            </div>
            <h1 className="mt-4 hero-headline" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05 }}>
              Your <span className="accent-serif">garage.</span>
            </h1>
            <p className="mt-2 dateline on-paper">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => { signOut(); router.push("/"); }}
            className="inline-flex items-center gap-2 border border-ink/10 bg-paper-3 px-4 py-2 rounded-full font-condensed uppercase tracking-[0.22em] text-[11px] text-ink hover:bg-ink hover:text-paper transition-colors"
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>

        {/* Current giveaway + member offer */}
        <div className="mt-8 grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7 border border-ink/10 bg-paper-4 rounded-2xl overflow-hidden shadow-soft">
            <div
              className="relative aspect-[21/9]"
              style={{
                backgroundImage: `linear-gradient(to bottom, rgba(22,17,15,0.1) 0%, rgba(22,17,15,0.6) 100%), url(${v.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <span className="absolute bottom-3 left-4 font-display font-bold text-paper text-xl drop-shadow">
                {v.year} {v.make} {v.model}
              </span>
            </div>
            <div className="p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="section-eyebrow on-paper">Current giveaway · drawn live</p>
                <p className="mt-1 font-condensed uppercase tracking-[0.06em] text-[14px] text-ink">
                  {niceWeekday(activeDraw.drawDateISO)}
                </p>
              </div>
              <Countdown targetISO={activeDraw.drawDateISO} />
            </div>
          </div>

          <div className="lg:col-span-5 border border-brass bg-ink text-paper rounded-2xl p-6 shadow-soft flex flex-col">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-brass" />
              <p className="font-condensed uppercase tracking-[0.22em] text-[11px] font-bold text-brass">
                Member exclusive
              </p>
            </div>
            <p className="mt-3 font-display font-bold text-3xl leading-tight">
              {memberMult}X entries<br />on every ticket.
            </p>
            <p className="mt-2 text-[14px] text-paper/70">
              Applied automatically while you&apos;re signed in — no code needed. The best deal on the platform.
            </p>
            <Link
              href="/account/tickets"
              className="mt-auto pt-5 inline-flex"
            >
              <span className="inline-flex h-12 items-center gap-2 bg-brass text-ink px-6 rounded-full font-condensed uppercase tracking-[0.22em] text-[12px] font-bold hover:bg-paper transition-colors">
                Buy with {memberMult}X <ArrowRight size={14} />
              </span>
            </Link>
          </div>
        </div>

        {/* Active entries */}
        <div className="mt-10">
          <p className="section-eyebrow on-paper section-eyebrow-rule">Check my entries · active</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {record.active.map((e) => {
              const ids = generateTicketIDs({
                drawCycle: e.drawCycle,
                contact: { email: user.email },
                count: e.ticketCount,
              });
              return (
                <div key={e.id} className="border border-ink/10 bg-paper-4 rounded-xl p-5 shadow-soft">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-display font-bold text-lg text-ink leading-tight">{e.vehicle}</p>
                    <Label tone="charity" variant="solid" size="sm">Active</Label>
                  </div>
                  <p className="mt-1 dateline on-paper">
                    Cycle №{String(e.drawCycle).padStart(2, "0")} · drawn {niceDate(e.drawDateISO)}
                  </p>
                  <p className="mt-3 font-condensed uppercase tracking-[0.22em] text-[11px] text-ink-2">
                    <Ticket size={12} className="inline mr-1.5 -mt-0.5" />
                    <span className="numeral text-base text-ink">{intl(e.ticketCount)}</span> tickets in the drum
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {ids.slice(0, 3).map((t) => (
                      <span key={t.full} className="numeral text-[11px] border border-ink/10 bg-paper-3 px-2 py-0.5 rounded-md">
                        {t.full}
                      </span>
                    ))}
                    {ids.length > 3 && (
                      <span className="dateline on-paper self-center">+{ids.length - 3} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Past entries */}
        <div className="mt-10">
          <p className="section-eyebrow on-paper section-eyebrow-rule">Past cycles</p>
          <ul className="mt-4 border border-ink/10 bg-paper-4 rounded-xl overflow-hidden divide-y divide-ink/10">
            {record.past.map((e) => (
              <li key={e.id} className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display font-bold text-ink leading-tight">{e.vehicle}</p>
                  <p className="dateline on-paper mt-0.5">
                    Cycle №{String(e.drawCycle).padStart(2, "0")} · {niceDate(e.drawDateISO)} · {e.ticketCount} tickets
                  </p>
                </div>
                <Label tone={e.status === "won" ? "brass" : "ink"} variant="outline" size="sm">
                  {e.status === "won" ? "Won" : "Didn't win"}
                </Label>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
