"use client";
import { useEffect, useState } from "react";
import { Mail, Trash2, Plus } from "lucide-react";
import {
  getEmailSubscribers, addEmailSubscriber, removeEmailSubscriber,
  SUBSCRIBERS_EVENT, type EmailSubscriber,
} from "@/lib/subscribers";
import { niceDate } from "@/lib/format";
import { Label } from "@/components/sticker";

export default function AdminNewsletterPage() {
  const [list, setList] = useState<EmailSubscriber[] | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const load = () => setList(getEmailSubscribers());
    load();
    window.addEventListener(SUBSCRIBERS_EVENT, load);
    return () => window.removeEventListener(SUBSCRIBERS_EVENT, load);
  }, []);

  if (!list) return null;

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    addEmailSubscriber(email, "Admin");
    setEmail("");
  };

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="hero-headline" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05 }}>
            Newsletter <span className="accent-serif">list.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] text-ink-2 font-serif">
            Everyone on the mailing list — the footer signup feeds this live. Email subscribers ride the 2X tier.
          </p>
        </div>
        <Label tone="brass" variant="solid">{list.length} subscribers</Label>
      </div>

      <form onSubmit={onAdd} className="mt-6 flex items-center gap-2 max-w-md">
        <span className="flex flex-1 items-center border border-ink/10 bg-paper-4 px-3 rounded-full">
          <Mail size={15} className="text-ink-3 shrink-0" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            aria-label="Email address"
            className="ml-2 w-full h-11 bg-transparent text-[15px] text-ink placeholder:text-ink-3 outline-none"
          />
        </span>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 bg-accent-bright text-ink border border-ink/10 px-4 py-2.5 rounded-full font-condensed uppercase tracking-[0.18em] text-[11px] font-bold hover:bg-accent hover:text-paper-3 transition-colors shrink-0"
        >
          <Plus size={13} /> Add
        </button>
      </form>

      <ul className="mt-5 border border-ink/10 bg-paper-4 rounded-xl overflow-hidden divide-y divide-ink/10">
        {list.map((s) => (
          <li key={s.id} className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-ink">{s.email}</p>
              <p className="dateline on-paper mt-0.5">Joined {niceDate(s.joinedISO)} · via {s.source}</p>
            </div>
            <button
              type="button"
              onClick={() => removeEmailSubscriber(s.id)}
              aria-label={`Remove ${s.email}`}
              className="inline-flex items-center gap-1.5 border border-ink/10 bg-paper-3 px-3 py-1.5 rounded-full dateline on-paper hover:bg-ink hover:text-paper transition-colors"
            >
              <Trash2 size={12} /> Remove
            </button>
          </li>
        ))}
        {list.length === 0 && (
          <li className="px-5 py-8 text-center text-ink-3 font-serif italic">No newsletter subscribers yet.</li>
        )}
      </ul>
    </main>
  );
}
