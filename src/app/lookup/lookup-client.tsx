"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Mail, Phone, Ticket, ArrowRight, CircleCheckBig, CircleX } from "lucide-react";
import { entryDB, type EntryRecord, type Entry } from "@/lib/mock-data";
import { niceDate, niceDateTime, intl } from "@/lib/format";
import { Label } from "@/components/sticker";

export function LookupClient() {
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [value, setValue] = useState("");
  const [record, setRecord] = useState<EntryRecord | null>(null);
  const [searched, setSearched] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    if (mode === "email") {
      const r = entryDB.find((x) => x.email.toLowerCase() === value.trim().toLowerCase());
      setRecord(r ?? null);
    } else {
      const digits = value.replace(/\D/g, "");
      const r = entryDB.find((x) => x.phone === digits);
      setRecord(r ?? null);
    }
  };

  const onDemo = () => {
    setMode("email");
    setValue("demo@generousmotors.org");
  };

  return (
    <div className="bg-paper-3 text-ink">
      <section className="relative border-b border-ink overflow-hidden grain">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center relative border-b border-rule-soft pb-14">
          <p className="section-eyebrow section-eyebrow-rule">My entries · ticket lookup</p>
          <h1 className="mt-4 hero-headline">
            Find <span className="accent-serif">your</span> tickets.
          </h1>
          <p className="mt-6 text-ink-2 text-lg max-w-xl mx-auto font-serif">
            Enter the email or phone you used at checkout. We&apos;ll pull your active entries and every past cycle you joined.
          </p>

          <form onSubmit={onSubmit} className="mt-10 mx-auto max-w-xl">
            <div className="inline-flex bg-paper border border-ink mb-5 text-sm font-condensed uppercase tracking-[0.22em]">
              <button
                type="button"
                aria-pressed={mode === "email"}
                onClick={() => setMode("email")}
                className={`px-5 py-2 inline-flex items-center gap-2 ${
                  mode === "email" ? "bg-ink text-paper-3" : "text-ink"
                }`}
              >
                <Mail size={12} /> Email
              </button>
              <button
                type="button"
                aria-pressed={mode === "phone"}
                onClick={() => setMode("phone")}
                className={`px-5 py-2 inline-flex items-center gap-2 border-l border-ink ${
                  mode === "phone" ? "bg-ink text-paper-3" : "text-ink"
                }`}
              >
                <Phone size={12} /> Phone
              </button>
            </div>
            <label className="flex h-14 w-full items-center border border-ink bg-paper-3 pl-5 pr-2">
              <Search size={18} className="text-ink-3" />
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                type={mode === "email" ? "email" : "tel"}
                placeholder={mode === "email" ? "you@example.com" : "(555) 010-1234"}
                className="ml-3 w-full bg-transparent text-base text-ink placeholder:text-ink-3 outline-none"
                aria-label={mode === "email" ? "Email" : "Phone"}
                required
              />
              <button
                type="submit"
                className="h-11 bg-accent text-paper-3 border border-accent font-condensed uppercase tracking-[0.22em] text-[11px] px-5 hover:bg-ink hover:border-ink"
              >
                Find
              </button>
            </label>
            <button
              type="button"
              onClick={onDemo}
              className="mt-4 font-serif italic text-base text-ink-3 hover:text-accent underline underline-offset-4"
            >
              try the demo account
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-12">
        {!searched && (
          <div className="border border-ink bg-paper-3 p-10 text-center">
            <Ticket className="mx-auto text-ink-2" size={28} />
            <p className="mt-3 text-ink-2 font-serif">
              Search above to see your entries. The demo account has 2 active draws + 3 past cycles.
            </p>
          </div>
        )}

        {searched && !record && (
          <div className="border border-ink bg-paper-3 p-12 text-center">
            <p className="font-display font-bold text-2xl text-ink">No tickets found.</p>
            <p className="mt-3 text-ink-2 font-serif">
              Double-check the spelling. If you used a different email or phone, try that one.
            </p>
            <button
              onClick={onDemo}
              className="mt-6 inline-flex items-center gap-2 border border-ink bg-paper-2 px-5 py-2.5 font-condensed uppercase tracking-[0.22em] text-[11px] text-ink hover:bg-ink hover:text-paper-3"
            >
              Try the demo account
            </button>
          </div>
        )}

        {record && (
          <div className="space-y-12">
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="border border-ink bg-brass p-6 flex items-center justify-between gap-4 flex-wrap"
            >
              <div>
                <p className="section-eyebrow">Welcome back</p>
                <p className="mt-1 font-display font-bold text-2xl text-ink">{record.fullName}</p>
                <p className="dateline">{record.email} · {formatPhone(record.phone)}</p>
              </div>
              <div className="flex items-center gap-6 text-[14px]">
                <Stat label="Active" v={record.active.length} />
                <Stat label="Past" v={record.past.length} />
                <Stat label="Tickets" v={[...record.active, ...record.past].reduce((s, e) => s + e.ticketCount, 0)} />
              </div>
            </motion.div>

            <div>
              <div className="flex items-end justify-between gap-3 flex-wrap border-b border-rule-soft pb-6">
                <h2 className="font-display font-bold text-3xl text-ink">Active in current draws</h2>
                <Label tone="charity" variant="outline">In the drum on draw day</Label>
              </div>
              <p className="mt-3 dateline">Your tickets are printed and loaded into the drum on draw day.</p>
              {record.active.length === 0 ? (
                <p className="mt-6 text-ink-2 font-serif">No active entries.</p>
              ) : (
                <ul className="mt-6 grid border border-ink md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-ink">
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
                <h2 className="font-display font-bold text-3xl text-ink">Past entries</h2>
              </div>
              <div className="mt-6 overflow-x-auto border border-ink bg-paper-3">
                <table className="w-full text-left text-[15px]">
                  <thead className="bg-ink text-paper-3 font-condensed uppercase tracking-[0.22em] text-[11px]">
                    <tr>
                      <th className="px-5 py-3">Cycle</th>
                      <th className="px-5 py-3">Vehicle</th>
                      <th className="px-5 py-3 text-right">Tickets</th>
                      <th className="px-5 py-3">Drawn</th>
                      <th className="px-5 py-3">Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule-soft">
                    {record.past.map((e) => (
                      <tr key={e.id}>
                        <td className="px-5 py-4 font-condensed text-base text-ink">№{String(e.drawCycle).padStart(2, "0")}</td>
                        <td className="px-5 py-4 text-ink-2 font-serif">{e.vehicle}</td>
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

            <div className="border border-ink bg-paper-2 p-6 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-display font-bold text-xl text-ink">Want to enter the next cycle?</p>
                <p className="dateline">Cycle 13 just opened — 1969 Mustang Fastback</p>
              </div>
              <Link
                href="/tickets"
                className="inline-flex h-11 items-center gap-2 bg-accent text-paper-3 border border-accent px-5 font-condensed uppercase tracking-[0.22em] text-[11px] hover:bg-ink hover:border-ink"
              >
                Buy tickets <ArrowRight size={14} />
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
        className="aspect-[2/1] border-b border-ink"
        style={{ background: "linear-gradient(135deg, #0e0e0e, #221814 70%, #422617)" }}
      />
      <div className="p-5">
        <div className="flex items-center justify-between">
          <p className="section-eyebrow">Cycle №{String(entry.drawCycle).padStart(2, "0")}</p>
          <Label tone="accent" variant="outline" size="sm">Active</Label>
        </div>
        <p className="mt-1 font-display font-bold text-xl text-ink">{entry.vehicle}</p>
        <div className="mt-5 grid grid-cols-2 gap-4 text-[14px]">
          <div>
            <p className="dateline">Tickets</p>
            <p className="font-condensed numeral font-semibold text-4xl text-ink leading-[0.9]">{entry.ticketCount}</p>
          </div>
          <div>
            <p className="dateline">Draw</p>
            <p className="text-ink mt-1 font-serif">{niceDateTime(entry.drawDateISO)}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

function OutcomeBadge({ status }: { status: Entry["status"] }) {
  if (status === "won")
    return (
      <span className="inline-flex items-center gap-1 bg-charity-soft text-charity border border-charity px-2.5 py-1 font-condensed uppercase tracking-[0.22em] text-[10px]">
        <CircleCheckBig size={12} /> Won
      </span>
    );
  if (status === "did-not-win")
    return (
      <span className="inline-flex items-center gap-1 bg-paper-2 text-ink-2 border border-rule-soft px-2.5 py-1 font-condensed uppercase tracking-[0.22em] text-[10px]">
        <CircleX size={12} /> Missed
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 bg-accent-soft text-accent border border-accent px-2.5 py-1 font-condensed uppercase tracking-[0.22em] text-[10px]">
      Active
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
