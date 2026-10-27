"use client";
import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Trash2, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { adminGet, adminSend } from "@/lib/admin-api";
import { CampaignDesk } from "@/components/campaign-desk";
import { niceDate } from "@/lib/format";
import { Label } from "@/components/sticker";

type SmsSub = { id: string; phone: string; status: string; source: string; created_at: string };
type Page = { rows: SmsSub[]; total: number; page: number; pageSize: number };

const FILTERS = [
  { key: "all", label: "All" },
  { key: "subscribed", label: "Confirmed" },
  { key: "pending", label: "Pending" },
  { key: "unsubscribed", label: "Opted out" },
] as const;

const PAGE_SIZE = 50;

export default function AdminSmsPage() {
  const [data, setData] = useState<Page | null>(null);
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [showSubs, setShowSubs] = useState(false);
  const [subscribedTotal, setSubscribedTotal] = useState<number | null>(null);

  const q = (p: number, s: string) =>
    `/api/admin/subscribers?type=sms&page=${p}&pageSize=${PAGE_SIZE}${s !== "all" ? `&status=${s}` : ""}`;

  const load = useCallback(() => {
    adminGet<Page>(q(page, status)).then(setData).catch(() => setData({ rows: [], total: 0, page: 1, pageSize: PAGE_SIZE }));
  }, [page, status]);
  useEffect(() => { load(); }, [load]);
  // Campaign recipients = confirmed/sendable count, independent of the view filter.
  useEffect(() => {
    adminGet<Page>("/api/admin/subscribers?type=sms&status=subscribed&pageSize=1").then((d) => setSubscribedTotal(d.total)).catch(() => {});
  }, []);

  const setFilter = (s: string) => { setStatus(s); setPage(1); };
  const exportUrl = (format: "plain" | "postscript") =>
    `/api/admin/subscribers/export?type=sms&format=${format}${status !== "all" ? `&status=${status}` : ""}`;

  if (!data) return null;
  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  const btn = "inline-flex items-center gap-1.5 border border-ink/10 bg-paper-3 px-3 py-1.5 rounded-full dateline on-paper hover:bg-ink hover:text-paper transition-colors disabled:opacity-40";

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="hero-headline" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05 }}>
            SMS <span className="accent-serif">blasts.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] text-ink-2 font-serif">
            Write and send text campaigns to the VIP list. Attach a promotion and the blast carries the
            3X trigger link; delivery and clicks are tracked per send.
          </p>
        </div>
        <Label tone="brass" variant="solid">{(subscribedTotal ?? 0).toLocaleString()} confirmed</Label>
      </div>

      <CampaignDesk channel="sms" recipients={subscribedTotal ?? 0} />

      <div className="mt-8">
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => setShowSubs((v) => !v)}
            className="inline-flex items-center gap-2 section-eyebrow on-paper section-eyebrow-rule"
            aria-expanded={showSubs}
          >
            Subscriber list <ChevronDown size={13} className={`transition-transform ${showSubs ? "rotate-180" : ""}`} />
          </button>
          <a href={exportUrl("plain")} className={btn}><Download size={11} /> Export CSV</a>
          <a href={exportUrl("postscript")} title="Phone + Opt-in Status + consent timestamp, for Postscript's Subscriber List Upload (excludes opt-outs)" className={btn}>
            <Download size={11} /> Postscript opt-in CSV
          </a>
        </div>

        {showSubs && (
          <div className="mt-4">
            {/* Status filter + pager */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex flex-wrap gap-1.5">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className={`px-3 py-1.5 rounded-full dateline on-paper border transition-colors ${
                      status === f.key ? "bg-ink text-paper border-ink" : "bg-paper-3 border-ink/10 hover:bg-ink/5"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 dateline on-paper">
                <span>{data.total.toLocaleString()} total · page {data.page} of {totalPages.toLocaleString()}</span>
                <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={data.page <= 1} className={btn} aria-label="Previous page"><ChevronLeft size={13} /></button>
                <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={data.page >= totalPages} className={btn} aria-label="Next page"><ChevronRight size={13} /></button>
              </div>
            </div>

            <ul className="mt-3 border border-ink/10 bg-paper-4 rounded-xl overflow-hidden divide-y divide-ink/10">
              {data.rows.map((s) => (
                <li key={s.id} className="px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="numeral font-semibold text-ink text-[14px]">{s.phone}</p>
                    <p className="dateline on-paper mt-0.5">Joined {niceDate(s.created_at)} · via {s.source} · {s.status}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => adminSend(`/api/admin/subscribers?type=sms&id=${s.id}`, "DELETE").then(load)}
                    aria-label={`Remove ${s.phone}`}
                    className={btn}
                  >
                    <Trash2 size={11} /> Opt out
                  </button>
                </li>
              ))}
              {data.rows.length === 0 && (
                <li className="px-5 py-6 text-center text-ink-3 font-serif italic">No subscribers match this filter.</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
