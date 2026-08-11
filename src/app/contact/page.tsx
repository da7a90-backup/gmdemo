"use client";
import { useState } from "react";
import { Mail, Send, CheckCircle2 } from "lucide-react";
import { Label } from "@/components/sticker";
import { Copy, useCopy } from "@/components/copy";

export default function ContactPage() {
  const t = useCopy();
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const input = "mt-1.5 w-full border border-ink/10 bg-paper-4 rounded-lg px-3 text-[15px] text-ink outline-none focus:border-accent";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      const j = await r.json();
      if (!j.ok) { setError(j.error || "Couldn't send — please try again."); return; }
      setDone(true);
    } catch { setError("Network error — please try again."); }
    finally { setBusy(false); }
  };

  return (
    <main className="bg-paper text-ink relative overflow-hidden grain">
      <div className="mx-auto max-w-xl px-5 py-16">
        <Label tone="ink" variant="outline"><Copy k="contact.badge" /></Label>
        <h1 className="mt-4 hero-headline" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05 }}>
          <Copy k="contact.h.lead" /> <span className="accent-serif"><Copy k="contact.h.accent" /></span>
        </h1>
        <p className="mt-3 text-[15px] text-ink-2 font-serif">
          <Copy k="contact.intro" />
        </p>

        {!done ? (
          <form
            onSubmit={submit}
            className="mt-7 border border-ink/10 bg-paper-3 rounded-2xl shadow-soft p-6 grid gap-4"
          >
            <label className="block"><span className="dateline on-paper"><Copy k="contact.label.name" /></span>
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={t("contact.ph.name")} className={`${input} h-12`} /></label>
            <label className="block"><span className="dateline on-paper"><Copy k="contact.label.email" /></span>
              <input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder={t("contact.ph.email")} className={`${input} h-12`} /></label>
            <label className="block"><span className="dateline on-paper"><Copy k="contact.label.message" /></span>
              <textarea required rows={5} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder={t("contact.ph.message")} className={`${input} py-3 leading-relaxed`} /></label>
            {error && <p className="dateline text-brass-deep">⚠ {error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 h-12 rounded-full bg-accent-bright text-ink border border-ink/10 font-condensed uppercase tracking-[0.22em] text-[13px] font-bold hover:bg-accent hover:text-paper-3 transition-colors disabled:opacity-60"
            >
              <Copy k="contact.send" /> <Send size={15} />
            </button>
            <p className="dateline on-paper text-center">
              <Mail size={11} className="inline mr-1 -mt-0.5" />
              <Copy k="contact.direct" />
            </p>
          </form>
        ) : (
          <div className="mt-7 border border-accent-bright/50 bg-paper-3 rounded-2xl shadow-soft p-8 text-center">
            <CheckCircle2 size={32} className="mx-auto text-charity" />
            <h2 className="mt-4 font-display font-bold text-2xl text-ink"><Copy k="contact.success.title" /></h2>
            <p className="mt-2 text-ink-2 font-serif">
              {t("contact.success.body").replace("{email}", form.email)}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
