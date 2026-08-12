"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Mail, Phone, Ticket, ArrowRight, CircleCheckBig, CircleX } from "lucide-react";
import { type EntryRecord, type Entry } from "@/lib/mock-data";
import { niceDate, intl } from "@/lib/format";
import { LocalTime } from "@/components/local-time";
import { Label } from "@/components/sticker";
import { Copy, useCopy } from "@/components/copy";

export function LookupClient() {
  const t = useCopy();
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [value, setValue] = useState("");
  const [record, setRecord] = useState<EntryRecord | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const doLookup = async (m: "email" | "phone", val: string) => {
    if (!val.trim()) return;
    setSearched(true);
    setLoading(true);
    setRecord(null);
    try {
      const q = m === "email" ? `email=${encodeURIComponent(val.trim())}` : `phone=${encodeURIComponent(val.trim())}`;
      const j = await fetch(`/api/lookup?${q}`).then((r) => r.json());
      setRecord(j?.ok && j.data?.found ? (j.data.record as EntryRecord) : null);
    } catch {
      setRecord(null);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doLookup(mode, value);
  };


  return (
    <div className="bg-paper-3 text-ink">
      <section className="relative border-b border-ink/10 overflow-hidden grain">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center relative border-b border-rule-soft pb-14">
          <p className="section-eyebrow section-eyebrow-rule"><Copy k="lookup.eyebrow" /></p>
          <h1 className="mt-4 hero-headline">
            <Copy k="lookup.h.pre" /> <span className="accent-serif"><Copy k="lookup.h.accent" /></span> <Copy k="lookup.h.post" />
          </h1>
          <p className="mt-6 text-ink-2 text-lg max-w-xl mx-auto font-serif">
            <Copy k="lookup.intro" />
          </p>

          <form onSubmit={onSubmit} className="mt-10 mx-auto max-w-xl">
            <div className="inline-flex bg-paper border border-ink/10 mb-5 text-sm font-condensed uppercase tracking-[0.22em] rounded-full overflow-hidden">
              <button
                type="button"
                aria-pressed={mode === "email"}
                onClick={() => setMode("email")}
                className={`px-5 py-2 inline-flex items-center gap-2 ${
                  mode === "email" ? "bg-ink text-paper-3" : "text-ink"
                }`}
              >
                <Mail size={12} /> <Copy k="lookup.tab.email" />
              </button>
              <button
                type="button"
                aria-pressed={mode === "phone"}
                onClick={() => setMode("phone")}
                className={`px-5 py-2 inline-flex items-center gap-2 border-l border-ink/10 ${
                  mode === "phone" ? "bg-ink text-paper-3" : "text-ink"
                }`}
              >
                <Phone size={12} /> <Copy k="lookup.tab.phone" />
              </button>
            </div>
            <label className="flex h-14 w-full items-center border border-ink/10 bg-paper-3 pl-5 pr-2 rounded-lg">
              <Search size={18} className="text-ink-3" />
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                type={mode === "email" ? "email" : "tel"}
                placeholder={mode === "email" ? t("lookup.ph.email") : t("lookup.ph.phone")}
                className="ml-3 w-full bg-transparent text-base text-ink placeholder:text-ink-3 outline-none"
                aria-label={mode === "email" ? "Email" : "Phone"}
                required
              />
              <button
                type="submit"
                className="h-11 bg-accent text-paper-3 border border-accent font-condensed uppercase tracking-[0.22em] text-[11px] px-5 hover:bg-ink hover:border-ink/10 rounded-full"
              >
                <Copy k="lookup.find" />
              </button>
            </label>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-12">
        {!searched && (
          <div className="border border-ink/10 bg-paper-3 p-10 text-center rounded-xl">
            <Ticket className="mx-auto text-ink-2" size={28} />
            <p className="mt-3 text-ink-2 font-serif">
              <Copy k="lookup.empty" />
            </p>
          </div>
        )}

        {searched && !loading && !record && (
          <div className="border border-ink/10 bg-paper-3 p-12 text-center rounded-xl">
            <p className="font-display font-bold text-2xl text-ink"><Copy k="lookup.noneTitle" /></p>
            <p className="mt-3 text-ink-2 font-serif">
              <Copy k="lookup.noneBody" />
            </p>
          </div>
        )}

        {record && (
          <div className="space-y-12">
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="border border-ink/10 bg-brass p-6 flex items-center justify-between gap-4 flex-wrap rounded-xl"
            >
              <div>
                <p className="section-eyebrow"><Copy k="lookup.welcome" /></p>
                <p className="mt-1 font-display font-bold text-2xl text-ink">{record.fullName}</p>
                <p className="dateline">{record.email} · {formatPhone(record.phone)}</p>
              </div>
              <div className="flex items-center gap-6 text-[14px]">
                <Stat label={t("lookup.stat.active")} v={record.active.length} />
                <Stat label={t("lookup.stat.past")} v={record.past.length} />
                <Stat label={t("lookup.stat.tickets")} v={[...record.active, ...record.past].reduce((s, e) => s + e.ticketCount, 0)} />
              </div>
            </motion.div>

            <div>
              <div className="flex items-end justify-between gap-3 flex-wrap border-b border-rule-soft pb-6">
                <h2 className="font-display font-bold text-3xl text-ink"><Copy k="lookup.active.h" /></h2>
                <Label tone="charity" variant="outline"><Copy k="lookup.active.badge" /></Label>
              </div>
              <p className="mt-3 dateline"><Copy k="lookup.active.note" /></p>
              {record.active.length === 0 ? (
                <p className="mt-6 text-ink-2 font-serif"><Copy k="lookup.active.none" /></p>
              ) : (
                <ul className="mt-6 grid border border-ink/10 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-ink/10 rounded-xl overflow-hidden">
                  {record.active.map((e) => (
                    <li key={e.id} className="bg-paper-3">
                      <ActiveCard entry={e} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <div className="border-b border-rule-soft pb-6">
                <h2 className="font-display font-bold text-3xl text-ink"><Copy k="lookup.past.h" /></h2>
              </div>
              <div className="mt-6 overflow-x-auto border border-ink/10 bg-paper-3 rounded-xl">
                <table className="w-full text-left text-[15px]">
                  <thead className="bg-ink text-paper-3 font-condensed uppercase tracking-[0.22em] text-[11px]">
                    <tr>
                      <th className="px-5 py-3"><Copy k="lookup.th.cycle" /></th>
                      <th className="px-5 py-3"><Copy k="lookup.th.vehicle" /></th>
                      <th className="px-5 py-3 text-right"><Copy k="lookup.th.tickets" /></th>
                      <th className="px-5 py-3"><Copy k="lookup.th.drawn" /></th>
                      <th className="px-5 py-3"><Copy k="lookup.th.outcome" /></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule-soft">
                    {record.past.map((e) => (
                      <tr key={e.id}>
                        <td className="px-5 py-4 font-condensed text-base text-ink">№{String(e.drawCycle).padStart(2, "0")}</td>
                        <td className="px-5 py-4 text-ink-2 font-serif">
                          {e.vehicle}
                          {e.ticketNumbers && <span className="block dateline mt-0.5 numeral">{e.ticketNumbers}</span>}
                        </td>
                        <td className="px-5 py-4 text-right numeral font-condensed">{intl(e.ticketCount)}</td>
                        <td className="px-5 py-4 text-ink-2 dateline">{niceDate(e.drawDateISO)}</td>
                        <td className="px-5 py-4">
                          <OutcomeBadge status={e.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border border-ink/10 bg-paper-2 p-6 flex items-center justify-between gap-4 flex-wrap rounded-xl">
              <div>
                <p className="font-display font-bold text-xl text-ink"><Copy k="lookup.cta.title" /></p>
                <p className="dateline"><Copy k="lookup.cta.sub" /></p>
              </div>
              <Link
                href="/tickets"
                className="inline-flex h-11 items-center gap-2 bg-accent text-paper-3 border border-accent px-5 font-condensed uppercase tracking-[0.22em] text-[11px] hover:bg-ink hover:border-ink/10 rounded-full"
              >
                <Copy k="winners.cta.button" /> <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function ActiveCard({ entry }: { entry: Entry }) {
  return (
    <article className="relative">
      <div
        className="aspect-[2/1] border-b border-ink/10"
        style={{ background: "linear-gradient(135deg, #0e0e0e, #221814 70%, #422617)" }}
      />
      <div className="p-5">
        <div className="flex items-center justify-between">
          <p className="section-eyebrow"><Copy k="winners.cardCycle" />{String(entry.drawCycle).padStart(2, "0")}</p>
          <Label tone="accent" variant="outline" size="sm"><Copy k="lookup.card.active" /></Label>
        </div>
        <p className="mt-1 font-display font-bold text-xl text-ink">{entry.vehicle}</p>
        {entry.ticketNumbers && (
          <div className="mt-4 rounded-lg border border-ink/10 bg-paper-2 px-3 py-2">
            <p className="dateline"><Copy k="lookup.card.ticketNo" /></p>
            <p className="mt-0.5 font-condensed numeral font-semibold text-lg text-ink tracking-wide break-all">{entry.ticketNumbers}</p>
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-4 text-[14px]">
          <div>
            <p className="dateline"><Copy k="lookup.card.tickets" /></p>
            <p className="font-condensed numeral font-semibold text-4xl text-ink leading-[0.9]">{entry.ticketCount}</p>
          </div>
          <div>
            <p className="dateline"><Copy k="lookup.card.draw" /></p>
            <p className="text-ink mt-1 font-serif"><LocalTime iso={entry.drawDateISO} kind="datetime" /></p>
          </div>
        </div>
      </div>
    </article>
  );
}

function OutcomeBadge({ status }: { status: Entry["status"] }) {
  if (status === "won")
    return (
      <span className="inline-flex items-center gap-1 bg-charity-soft text-charity border border-charity px-2.5 py-1 font-condensed uppercase tracking-[0.22em] text-[10px] rounded-full">
        <CircleCheckBig size={12} /> <Copy k="lookup.outcome.won" />
      </span>
    );
  if (status === "did-not-win")
    return (
      <span className="inline-flex items-center gap-1 bg-paper-2 text-ink-2 border border-rule-soft px-2.5 py-1 font-condensed uppercase tracking-[0.22em] text-[10px] rounded-full">
        <CircleX size={12} /> <Copy k="lookup.outcome.missed" />
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 bg-accent-soft text-accent border border-accent px-2.5 py-1 font-condensed uppercase tracking-[0.22em] text-[10px] rounded-full">
      <Copy k="lookup.outcome.active" />
    </span>
  );
}

function Stat({ label, v }: { label: string; v: number }) {
  return (
    <div className="text-right">
      <p className="font-condensed numeral font-semibold text-2xl text-ink leading-none">{intl(v)}</p>
      <p className="font-condensed uppercase tracking-[0.22em] text-[10px] text-ink-2">{label}</p>
    </div>
  );
}

function formatPhone(digits: string) {
  if (digits.length !== 10) return digits;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
