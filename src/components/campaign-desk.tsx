"use client";
import { useEffect, useMemo, useState } from "react";
import { Send, Trash2, FileDown, Link2, Users } from "lucide-react";
import {
  getCampaigns, saveCampaign, sendCampaign, deleteCampaign,
  CAMPAIGNS_EVENT, type Campaign,
} from "@/lib/campaigns";
import { getPromoConfig, isPromoLive } from "@/lib/promotions";
import { Label } from "@/components/sticker";

/**
 * Shared compose + history desk for the newsletter (email) and SMS blasts.
 * Composing attaches a promo tier; sending stamps mock delivery stats.
 */
export function CampaignDesk({
  channel,
  recipients,
}: {
  channel: "email" | "sms";
  recipients: number;
}) {
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [promoCode, setPromoCode] = useState("");

  useEffect(() => {
    const load = () => setCampaigns(getCampaigns(channel));
    load();
    window.addEventListener(CAMPAIGNS_EVENT, load);
    return () => window.removeEventListener(CAMPAIGNS_EVENT, load);
  }, [channel]);

  const promoOptions = useMemo(
    () => getPromoConfig().filter((t) => t.code && isPromoLive(t)),
    [],
  );

  if (!campaigns) return null;

  const isEmail = channel === "email";
  const smsSegments = Math.max(1, Math.ceil(body.length / 160));
  const promoLink = promoCode ? `/tickets?promo=${promoCode}` : null;

  const reset = () => { setSubject(""); setBody(""); setPromoCode(""); };

  const onSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || (isEmail && !subject.trim())) return;
    saveCampaign({ channel, subject: isEmail ? subject : undefined, body, promoCode: promoCode || undefined });
    reset();
  };

  const onSendNow = () => {
    if (!body.trim() || (isEmail && !subject.trim())) return;
    const c = saveCampaign({ channel, subject: isEmail ? subject : undefined, body, promoCode: promoCode || undefined });
    sendCampaign(c.id, recipients);
    reset();
  };

  const input = "mt-1.5 w-full border border-ink/10 bg-paper-3 rounded-lg px-3 text-[15px] text-ink outline-none focus:border-accent";

  return (
    <>
      {/* Compose */}
      <div className="mt-7 border border-ink/10 bg-paper-4 rounded-2xl shadow-soft overflow-hidden">
        <div className="px-5 py-3 bg-paper-3 border-b border-ink/10 flex flex-wrap items-center justify-between gap-3">
          <p className="font-display font-bold text-ink">
            {isEmail ? "Compose this week's issue" : "Compose a text blast"}
          </p>
          <span className="inline-flex items-center gap-1.5 dateline on-paper">
            <Users size={12} /> goes to {recipients.toLocaleString("en-US")} subscriber{recipients === 1 ? "" : "s"}
          </span>
        </div>
        <form onSubmit={onSaveDraft} className="p-5 grid gap-4">
          {isEmail && (
            <label className="block">
              <span className="dateline on-paper">Subject line</span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Cycle 12 closes Sunday — your 2X is waiting"
                className={`${input} h-11`}
              />
            </label>
          )}
          <label className="block">
            <span className="flex items-center justify-between">
              <span className="dateline on-paper">{isEmail ? "Body" : "Message"}</span>
              {!isEmail && (
                <span className="dateline on-paper">
                  {body.length} chars · {smsSegments} segment{smsSegments === 1 ? "" : "s"}
                </span>
              )}
            </span>
            <textarea
              rows={isEmail ? 5 : 3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={isEmail
                ? "Winner spotlight, this week's numbers, and the bonus-entry link…"
                : "GM: 3X entries on the Z06 thru Sunday. Tap to claim. Reply STOP to opt out"}
              className={`${input} py-2.5 leading-relaxed`}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="dateline on-paper">Attach promotion (adds the trigger link)</span>
              <select value={promoCode} onChange={(e) => setPromoCode(e.target.value)} className={`${input} h-11`}>
                <option value="">No promotion</option>
                {promoOptions.map((t) => (
                  <option key={t.id} value={t.code}>
                    {t.label} — {t.multiplier}X ({t.code})
                  </option>
                ))}
              </select>
            </label>
            {promoLink && (
              <div className="self-end">
                <span className="dateline on-paper">Trigger link in the send</span>
                <p className="mt-1.5 inline-flex items-center gap-1.5 border border-brass bg-brass-soft rounded-lg px-3 h-11 numeral text-[13px] text-ink w-full">
                  <Link2 size={13} className="shrink-0" /> {promoLink}
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onSendNow}
              className="inline-flex items-center gap-2 bg-ink text-brass px-5 py-2.5 rounded-full font-condensed uppercase tracking-[0.22em] text-[11px] font-bold hover:bg-accent hover:text-paper-3 transition-colors"
            >
              <Send size={13} /> Send now
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 border border-ink/10 bg-paper-3 px-5 py-2.5 rounded-full font-condensed uppercase tracking-[0.22em] text-[11px] text-ink hover:bg-ink hover:text-paper transition-colors"
            >
              <FileDown size={13} /> Save draft
            </button>
          </div>
        </form>
      </div>

      {/* History */}
      <div className="mt-8">
        <p className="section-eyebrow on-paper section-eyebrow-rule">
          {isEmail ? "Issue history" : "Blast history"}
        </p>
        <ul className="mt-3 border border-ink/10 bg-paper-4 rounded-xl overflow-hidden divide-y divide-ink/10">
          {campaigns.map((c) => (
            <li key={c.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Label tone={c.status === "sent" ? "charity" : "brass"} variant="solid" size="sm">
                      {c.status}
                    </Label>
                    {c.promoCode && <Label tone="ink" variant="outline" size="sm">{c.promoCode}</Label>}
                  </div>
                  <p className="mt-2 font-display font-bold text-ink leading-tight">
                    {isEmail ? c.subject : c.body.slice(0, 80) + (c.body.length > 80 ? "…" : "")}
                  </p>
                  {isEmail && <p className="mt-1 text-[13px] text-ink-2 line-clamp-1">{c.body}</p>}
                  <p className="mt-1.5 dateline on-paper">
                    {c.status === "sent" && c.sentISO
                      ? <>Sent {new Date(c.sentISO).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · {c.recipients?.toLocaleString("en-US")} recipients</>
                      : <>Draft · created {new Date(c.createdISO).toLocaleString("en-US", { month: "short", day: "numeric" })}</>}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  {c.status === "sent" ? (
                    <div className="flex gap-5 text-right">
                      <MiniStat label={isEmail ? "Opens" : "Delivered"} value={c.opens ?? 0} of={c.recipients ?? 0} />
                      <MiniStat label="Clicks" value={c.clicks ?? 0} of={c.recipients ?? 0} />
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => sendCampaign(c.id, recipients)}
                        className="inline-flex items-center gap-1.5 bg-ink text-brass px-4 py-1.5 rounded-full font-condensed uppercase tracking-[0.18em] text-[10px] font-bold hover:bg-accent hover:text-paper-3 transition-colors"
                      >
                        <Send size={11} /> Send
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCampaign(c.id)}
                        aria-label="Delete draft"
                        className="inline-flex items-center gap-1.5 border border-ink/10 bg-paper-3 px-3 py-1.5 rounded-full dateline on-paper hover:bg-ink hover:text-paper transition-colors"
                      >
                        <Trash2 size={11} /> Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
          {campaigns.length === 0 && (
            <li className="px-5 py-8 text-center text-ink-3 font-serif italic">Nothing sent yet.</li>
          )}
        </ul>
      </div>
    </>
  );
}

function MiniStat({ label, value, of }: { label: string; value: number; of: number }) {
  return (
    <div>
      <p className="font-condensed numeral font-bold text-lg text-ink leading-none">
        {of > 0 ? `${Math.round((value / of) * 100)}%` : "—"}
      </p>
      <p className="dateline on-paper mt-0.5">{label} · {value.toLocaleString("en-US")}</p>
    </div>
  );
}
