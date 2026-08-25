"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, LogOut, Ticket, Sparkles } from "lucide-react";
import { getUser, signOut } from "@/lib/session";
import { entryDB, type Entry as MockEntry } from "@/lib/mock-data";
import { usePrizeCycle } from "@/lib/cycle-store";
import { generateTicketIDs } from "@/lib/ticket-gen";
import { getPromoConfig, PROMOS_EVENT } from "@/lib/promotions";
import { niceDate, niceWeekday, intl } from "@/lib/format";
import { Countdown } from "@/components/countdown";
import { Label } from "@/components/sticker";
import { Copy, useCopy } from "@/components/copy";

// Normalized view entry — real (from /api/account/tickets) or demo (mock entryDB).
type AcctEntry = { id: string; vehicle: string; cycle: number; drawDateISO: string; ticketCount: number; ticketPrefix?: string; status?: "won" | "did-not-win" | "active" };
type View = { email: string; active: AcctEntry[]; past: AcctEntry[]; real: boolean };
type RealEntry = { orderToken: string; ticketPrefix: string; vehicle: string; cycle: string; tickets: number; drawDateISO: string };
const fromReal = (e: RealEntry): AcctEntry => ({ id: e.orderToken || e.ticketPrefix, vehicle: e.vehicle || "This cycle", cycle: Number(e.cycle) || 0, drawDateISO: e.drawDateISO, ticketCount: e.tickets, ticketPrefix: e.ticketPrefix });
const fromMock = (e: MockEntry): AcctEntry => ({ id: e.id, vehicle: e.vehicle, cycle: e.drawCycle, drawDateISO: e.drawDateISO, ticketCount: e.ticketCount, status: e.status });

export default function AccountPage() {
  const cp = useCopy();
  const router = useRouter();
  const activeDraw = usePrizeCycle();
  const v = activeDraw.vehicle;
  const [view, setView] = useState<View | null>(null);
  const [memberMult, setMemberMult] = useState(4);

  useEffect(() => {
    let alive = true;
    const loadPromos = () => { const m = getPromoConfig().find((t) => t.id === "member"); if (m) setMemberMult(m.multiplier); };
    loadPromos();
    window.addEventListener(PROMOS_EVENT, loadPromos);

    (async () => {
      // Prefer the real Shopify session + minted tickets; fall back to the demo.
      const me = await fetch("/api/auth/me").then((r) => r.json()).catch(() => null);
      if (me?.data?.signedIn) {
        const t = await fetch("/api/account/tickets").then((r) => r.json()).catch(() => null);
        const d = t?.data as { active?: RealEntry[]; past?: RealEntry[] } | undefined;
        if (alive && d) {
          setView({ email: me.data.email ?? me.data.phone ?? "", active: (d.active ?? []).map(fromReal), past: (d.past ?? []).map(fromReal), real: true });
          return;
        }
      }
      const u = getUser();
      if (!u) { if (alive) router.replace("/beta/account/login"); return; }
      const rec = entryDB[0];
      if (alive) setView({ email: u.email, active: rec.active.map(fromMock), past: rec.past.map(fromMock), real: false });
    })();

    return () => { alive = false; window.removeEventListener(PROMOS_EVENT, loadPromos); };
  }, [router]);

  if (!view) return null;

  return (
    <main className="bg-paper text-ink relative overflow-hidden grain">
      <div className="mx-auto max-w-[1100px] px-5 py-12">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Label tone="brass" variant="solid"><Copy k="acc.memberBadgePre" /> {memberMult}<Copy k="acc.memberBadgeSuffix" /></Label>
              <Label tone="ink" variant="outline"><Copy k="winners.cardCycle" />{String(activeDraw.cycle).padStart(2, "0")}</Label>
            </div>
            <h1 className="mt-4 hero-headline" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05 }}>
              <Copy k="acc.h.pre" /> <span className="accent-serif"><Copy k="acc.h.accent" /></span>
            </h1>
            <p className="mt-2 dateline on-paper">{view.email}</p>
          </div>
          <button
            type="button"
            onClick={() => { if (view.real) { window.location.href = "/api/auth/logout"; } else { signOut(); router.push("/beta"); } }}
            className="inline-flex items-center gap-2 border border-ink/10 bg-paper-3 px-4 py-2 rounded-full font-condensed uppercase tracking-[0.22em] text-[11px] text-ink hover:bg-ink hover:text-paper transition-colors"
          >
            <LogOut size={13} /> <Copy k="acc.signOut" />
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
                <p className="section-eyebrow on-paper"><Copy k="acc.currentGiveaway" /></p>
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
                <Copy k="acc.memberExclusive" />
              </p>
            </div>
            <p className="mt-3 font-display font-bold text-3xl leading-tight">
              {cp("acc.exclusive.title").replace("{mult}", String(memberMult))}<br />{cp("acc.exclusive.sub")}
            </p>
            <p className="mt-2 text-[14px] text-paper/70">
              <Copy k="acc.exclusive.body" />
            </p>
            <Link
              href="/account/tickets"
              className="mt-auto pt-5 inline-flex"
            >
              <span className="inline-flex h-12 items-center gap-2 bg-brass text-ink px-6 rounded-full font-condensed uppercase tracking-[0.22em] text-[12px] font-bold hover:bg-paper transition-colors">
                {cp("acc.exclusive.cta").replace("{mult}", String(memberMult))} <ArrowRight size={14} />
              </span>
            </Link>
          </div>
        </div>

        {/* Active entries */}
        <div className="mt-10">
          <p className="section-eyebrow on-paper section-eyebrow-rule"><Copy k="acc.active.eyebrow" /></p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {view.active.map((e) => {
              // Real entries carry the minted batch prefix; the demo generates ids.
              const demoIds = e.ticketPrefix ? null : generateTicketIDs({ drawCycle: e.cycle, contact: { email: view.email }, count: e.ticketCount });
              return (
                <div key={e.id} className="border border-ink/10 bg-paper-4 rounded-xl p-5 shadow-soft">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-display font-bold text-lg text-ink leading-tight">{e.vehicle}</p>
                    <Label tone="charity" variant="solid" size="sm"><Copy k="acc.active.badge" /></Label>
                  </div>
                  <p className="mt-1 dateline on-paper">
                    <Copy k="winners.cardCycle" />{String(e.cycle).padStart(2, "0")} · <Copy k="winners.drawnPrefix" /> {niceDate(e.drawDateISO)}
                  </p>
                  <p className="mt-3 font-condensed uppercase tracking-[0.22em] text-[11px] text-ink-2">
                    <Ticket size={12} className="inline mr-1.5 -mt-0.5" />
                    <span className="numeral text-base text-ink">{intl(e.ticketCount)}</span> <Copy k="acc.ticketsInDrum" />
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {demoIds ? (
                      <>
                        {demoIds.slice(0, 3).map((tid) => (
                          <span key={tid.full} className="numeral text-[11px] border border-ink/10 bg-paper-3 px-2 py-0.5 rounded-md">{tid.full}</span>
                        ))}
                        {demoIds.length > 3 && <span className="dateline on-paper self-center">+{demoIds.length - 3} <Copy k="acc.more" /></span>}
                      </>
                    ) : (
                      <span className="numeral text-[11px] border border-ink/10 bg-paper-3 px-2 py-0.5 rounded-md">{e.ticketPrefix}</span>
                    )}
                  </div>
                </div>
              );
            })}
            {view.active.length === 0 && <p className="text-ink-2 font-serif"><Copy k="lookup.active.none" /></p>}
          </div>
        </div>

        {/* Past entries */}
        <div className="mt-10">
          <p className="section-eyebrow on-paper section-eyebrow-rule"><Copy k="acc.past.eyebrow" /></p>
          <ul className="mt-4 border border-ink/10 bg-paper-4 rounded-xl overflow-hidden divide-y divide-ink/10">
            {view.past.map((e) => (
              <li key={e.id} className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display font-bold text-ink leading-tight">{e.vehicle}</p>
                  <p className="dateline on-paper mt-0.5">
                    <Copy k="winners.cardCycle" />{String(e.cycle).padStart(2, "0")} · {niceDate(e.drawDateISO)} · {e.ticketCount} <Copy k="acc.past.ticketsSuffix" />
                  </p>
                </div>
                <Label tone={e.status === "won" ? "brass" : "ink"} variant="outline" size="sm">
                  {e.status === "won" ? <Copy k="acc.past.won" /> : e.status === "did-not-win" ? <Copy k="acc.past.lost" /> : "—"}
                </Label>
              </li>
            ))}
            {view.past.length === 0 && <li className="px-5 py-6 text-center text-ink-3 font-serif italic">No past cycles yet.</li>}
          </ul>
        </div>
      </div>
    </main>
  );
}
