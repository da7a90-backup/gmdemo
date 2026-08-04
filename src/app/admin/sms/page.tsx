"use client";
import { useEffect, useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { adminGet, adminSend } from "@/lib/admin-api";
import { CampaignDesk } from "@/components/campaign-desk";
import { niceDate } from "@/lib/format";
import { Label } from "@/components/sticker";

type SmsSub = { id: string; phone: string; status: string; source: string; created_at: string };

export default function AdminSmsPage() {
  const [subs, setSubs] = useState<SmsSub[] | null>(null);
  const [showSubs, setShowSubs] = useState(false);

  const load = () => adminGet<SmsSub[]>("/api/admin/subscribers?type=sms").then(setSubs).catch(() => setSubs([]));
  useEffect(() => { load(); }, []);

  if (!subs) return null;

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
        <Label tone="brass" variant="solid">{subs.length} subscribers</Label>
      </div>

      <CampaignDesk channel="sms" recipients={subs.length} />

      {/* Subscriber list — secondary, fed by the popup */}
      <div className="mt-8">
        <button
          type="button"
          onClick={() => setShowSubs((v) => !v)}
          className="inline-flex items-center gap-2 section-eyebrow on-paper section-eyebrow-rule"
          aria-expanded={showSubs}
        >
          Subscriber list <ChevronDown size={13} className={`transition-transform ${showSubs ? "rotate-180" : ""}`} />
        </button>
        {showSubs && (
          <ul className="mt-3 border border-ink/10 bg-paper-4 rounded-xl overflow-hidden divide-y divide-ink/10">
            {subs.map((s) => (
              <li key={s.id} className="px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="numeral font-semibold text-ink text-[14px]">{s.phone}</p>
                  <p className="dateline on-paper mt-0.5">Joined {niceDate(s.created_at)} · via {s.source} · {s.status}</p>
                </div>
                <button
                  type="button"
                  onClick={() => adminSend(`/api/admin/subscribers?type=sms&id=${s.id}`, "DELETE").then(load)}
                  aria-label={`Remove ${s.phone}`}
                  className="inline-flex items-center gap-1.5 border border-ink/10 bg-paper-3 px-3 py-1.5 rounded-full dateline on-paper hover:bg-ink hover:text-paper transition-colors"
                >
                  <Trash2 size={11} /> Opt out
                </button>
              </li>
            ))}
            {subs.length === 0 && (
              <li className="px-5 py-6 text-center text-ink-3 font-serif italic">No subscribers yet — the SMS popup feeds this list.</li>
            )}
          </ul>
        )}
      </div>
    </main>
  );
}
