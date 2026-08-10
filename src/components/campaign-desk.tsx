"use client";
import { useCallback, useEffect, useState } from "react";
import { Send, Trash2, FileDown, Link2, Users, Loader2, AlertTriangle } from "lucide-react";
import { getPromoConfig, isPromoLive } from "@/lib/promotions";
import { Label } from "@/components/sticker";

type Campaign = {
  id: number; channel: "email" | "sms"; subject: string | null; body: string;
  promoCode: string | null; status: "draft" | "sent" | "failed";
  recipients: number | null; error: string | null; createdISO: string; sentISO: string | null;
};

/** Compose + send real campaigns. Email sends go out as Klaviyo campaigns; SMS is
 * gated on Postscript API access. Promo variables are injected server-side. */
export function CampaignDesk({ channel, recipients }: { channel: "email" | "sms"; recipients: number }) {
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isEmail = channel === "email";

  const load = useCallback(() => {
    fetch(`/api/admin/campaigns?channel=${channel}`)
      .then((r) => r.json())
      .then((j) => setCampaigns(j?.ok ? (j.data as Campaign[]) : []))
      .catch(() => setCampaigns([]));
  }, [channel]);

  useEffect(() => { load(); }, [load]);

  const promoOptions = getPromoConfig().filter((t) => t.code && isPromoLive(t));
  if (!campaigns) return null;

  const smsSegments = Math.max(1, Math.ceil(body.length / 160));
  const promoLink = promoCode ? `/tickets?promo=${promoCode}` : null;
  const reset = () => { setSubject(""); setBody(""); setPromoCode(""); };

  const post = async (payload: Record<string, unknown>) => {
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/admin/campaigns", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "failed");
      if (j.data?.status === "failed") setError(j.data.error || "send failed");
      load();
      return j.data as Campaign;
    } catch (e) { setError(String((e as Error)?.message ?? e)); }
    finally { setBusy(false); }
  };

  const onSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || (isEmail && !subject.trim())) return;
    const c = await post({ channel, subject: isEmail ? subject : undefined, body, promoCode: promoCode || undefined, send: false });
    if (c) reset();
  };
  const onSendNow = async () => {
    if (!body.trim() || (isEmail && !subject.trim())) return;
    const c = await post({ channel, subject: isEmail ? subject : undefined, body, promoCode: promoCode || undefined, send: true });
    if (c && c.status === "sent") reset();
  };
  const del = async (id: number) => {
    await fetch(`/api/admin/campaigns?id=${id}`, { method: "DELETE" }).catch(() => {});
    load();
  };

  const input = "mt-1.5 w-full border border-ink/10 bg-paper-3 rounded-lg px-3 text-[15px] text-ink outline-none focus:border-accent";

  return (
    <>
      <div className="mt-7 border border-ink/10 bg-paper-4 rounded-2xl shadow-soft overflow-hidden">
        <div className="px-5 py-3 bg-paper-3 border-b border-ink/10 flex flex-wrap items-center justify-between gap-3">
          <p className="font-display font-bold text-ink">{isEmail ? "Compose an email campaign" : "Compose a text blast"}</p>
          <span className="inline-flex items-center gap-1.5 dateline on-paper">
            <Users size={12} /> goes to {recipients.toLocaleString("en-US")} subscriber{recipients === 1 ? "" : "s"}
          </span>
        </div>
        <form onSubmit={onSaveDraft} className="p-5 grid gap-4">
          {isEmail && (
            <label className="block">
              <span className="dateline on-paper">Subject line</span>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Cycle 12 closes Sunday — your 2X is waiting" className={`${input} h-11`} />
            </label>
          )}
          <label className="block">
            <span className="flex items-center justify-between">
              <span className="dateline on-paper">{isEmail ? "Body (HTML)" : "Message"}</span>
              {!isEmail && <span className="dateline on-paper">{body.length} chars · {smsSegments} segment{smsSegments === 1 ? "" : "s"}</span>}
            </span>
            <textarea rows={isEmail ? 6 : 3} value={body} onChange={(e) => setBody(e.target.value)}
              placeholder={isEmail ? "<h1>This week…</h1> Use {{promo_link}} to drop the attached promo's link." : "GM: 3X entries thru Sunday. Tap to claim. Reply STOP to opt out"}
              className={`${input} py-2.5 leading-relaxed ${isEmail ? "font-mono text-[13px]" : ""}`} />
            {isEmail && promoCode && (
              <span className="mt-1.5 block dateline on-paper">Variables: <code className="numeral">{"{{promo_link}} {{promo_code}} {{promo_multiplier}} {{promo_message}}"}</code></span>
            )}
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="dateline on-paper">Attach promotion</span>
              <select value={promoCode} onChange={(e) => setPromoCode(e.target.value)} className={`${input} h-11`}>
                <option value="">No promotion</option>
                {promoOptions.map((t) => (<option key={t.id} value={t.code}>{t.label} — {t.multiplier}X ({t.code})</option>))}
              </select>
            </label>
            {promoLink && (
              <div className="self-end">
                <span className="dateline on-paper">Trigger link (injected)</span>
                <p className="mt-1.5 inline-flex items-center gap-1.5 border border-brass bg-brass-soft rounded-lg px-3 h-11 numeral text-[13px] text-ink w-full"><Link2 size={13} className="shrink-0" /> {promoLink}</p>
              </div>
            )}
          </div>
          {error && <p className="inline-flex items-center gap-1.5 dateline text-brass-deep"><AlertTriangle size={13} /> {error}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onSendNow} disabled={busy} className="inline-flex items-center gap-2 bg-ink text-brass px-5 py-2.5 rounded-full font-condensed uppercase tracking-[0.22em] text-[11px] font-bold hover:bg-accent hover:text-paper-3 transition-colors disabled:opacity-60">
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Send now
            </button>
            <button type="submit" disabled={busy} className="inline-flex items-center gap-2 border border-ink/10 bg-paper-3 px-5 py-2.5 rounded-full font-condensed uppercase tracking-[0.22em] text-[11px] text-ink hover:bg-ink hover:text-paper transition-colors disabled:opacity-60">
              <FileDown size={13} /> Save draft
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8">
        <p className="section-eyebrow on-paper section-eyebrow-rule">{isEmail ? "Campaign history" : "Blast history"}</p>
        <ul className="mt-3 border border-ink/10 bg-paper-4 rounded-xl overflow-hidden divide-y divide-ink/10">
          {campaigns.map((c) => (
            <li key={c.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Label tone={c.status === "sent" ? "charity" : c.status === "failed" ? "brass" : "ink"} variant={c.status === "draft" ? "outline" : "solid"} size="sm">{c.status}</Label>
                    {c.promoCode && <Label tone="ink" variant="outline" size="sm">{c.promoCode}</Label>}
                  </div>
                  <p className="mt-2 font-display font-bold text-ink leading-tight">{isEmail ? c.subject : c.body.slice(0, 80) + (c.body.length > 80 ? "…" : "")}</p>
                  <p className="mt-1.5 dateline on-paper">
                    {c.status === "sent" && c.sentISO
                      ? <>Sent {new Date(c.sentISO).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · {c.recipients?.toLocaleString("en-US")} recipients</>
                      : c.status === "failed"
                        ? <span className="text-brass-deep">Failed · {c.error}</span>
                        : <>Draft · created {new Date(c.createdISO).toLocaleString("en-US", { month: "short", day: "numeric" })}</>}
                  </p>
                </div>
                {c.status !== "sent" && (
                  <div className="flex items-center gap-4 shrink-0">
                    <button type="button" onClick={() => post({ id: c.id, send: true })} disabled={busy} className="inline-flex items-center gap-1.5 bg-ink text-brass px-4 py-1.5 rounded-full font-condensed uppercase tracking-[0.18em] text-[10px] font-bold hover:bg-accent hover:text-paper-3 transition-colors disabled:opacity-60">
                      <Send size={11} /> Send
                    </button>
                    <button type="button" onClick={() => del(c.id)} aria-label="Delete" className="inline-flex items-center gap-1.5 border border-ink/10 bg-paper-3 px-3 py-1.5 rounded-full dateline on-paper hover:bg-ink hover:text-paper transition-colors">
                      <Trash2 size={11} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
          {campaigns.length === 0 && <li className="px-5 py-8 text-center text-ink-3 font-serif italic">Nothing yet.</li>}
        </ul>
      </div>
    </>
  );
}
