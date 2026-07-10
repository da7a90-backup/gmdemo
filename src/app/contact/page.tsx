"use client";
import { useState } from "react";
import { Mail, Send, CheckCircle2 } from "lucide-react";
import { Label } from "@/components/sticker";

export default function ContactPage() {
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const input = "mt-1.5 w-full border border-ink/10 bg-paper-4 rounded-lg px-3 text-[15px] text-ink outline-none focus:border-accent";

  return (
    <main className="bg-paper text-ink relative overflow-hidden grain">
      <div className="mx-auto max-w-xl px-5 py-16">
        <Label tone="ink" variant="outline">We answer fast</Label>
        <h1 className="mt-4 hero-headline" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05 }}>
          Say <span className="accent-serif">hello.</span>
        </h1>
        <p className="mt-3 text-[15px] text-ink-2 font-serif">
          Questions about a draw, your entries, sponsoring a giveaway, or press — one form, typical
          response under 12 hours.
        </p>

        {!done ? (
          <form
            onSubmit={(e) => { e.preventDefault(); setDone(true); }}
            className="mt-7 border border-ink/10 bg-paper-3 rounded-2xl shadow-soft p-6 grid gap-4"
          >
            <label className="block"><span className="dateline on-paper">Name</span>
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Your name" className={`${input} h-12`} /></label>
            <label className="block"><span className="dateline on-paper">Email</span>
              <input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com" className={`${input} h-12`} /></label>
            <label className="block"><span className="dateline on-paper">Message</span>
              <textarea required rows={5} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="How can we help?" className={`${input} py-3 leading-relaxed`} /></label>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 h-12 rounded-full bg-accent-bright text-ink border border-ink/10 font-condensed uppercase tracking-[0.22em] text-[13px] font-bold hover:bg-accent hover:text-paper-3 transition-colors"
            >
              Send it <Send size={15} />
            </button>
            <p className="dateline on-paper text-center">
              <Mail size={11} className="inline mr-1 -mt-0.5" />
              Or write directly: support@generousmotors.org
            </p>
          </form>
        ) : (
          <div className="mt-7 border border-accent-bright/50 bg-paper-3 rounded-2xl shadow-soft p-8 text-center">
            <CheckCircle2 size={32} className="mx-auto text-charity" />
            <h2 className="mt-4 font-display font-bold text-2xl text-ink">Message sent.</h2>
            <p className="mt-2 text-ink-2 font-serif">
              A confirmation is on its way to <strong className="text-ink">{form.email}</strong> — we&apos;ll
              reply within 12 hours.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
