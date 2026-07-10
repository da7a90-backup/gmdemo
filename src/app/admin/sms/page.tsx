"use client";
import { useEffect, useState } from "react";
import { MessageSquareText, Trash2, Plus } from "lucide-react";
import {
  getSmsSubscribers, addSmsSubscriber, removeSmsSubscriber,
  SUBSCRIBERS_EVENT, type SmsSubscriber,
} from "@/lib/subscribers";
import { niceDate } from "@/lib/format";
import { Label } from "@/components/sticker";

export default function AdminSmsPage() {
  const [list, setList] = useState<SmsSubscriber[] | null>(null);
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const load = () => setList(getSmsSubscribers());
    load();
    window.addEventListener(SUBSCRIBERS_EVENT, load);
    return () => window.removeEventListener(SUBSCRIBERS_EVENT, load);
  }, []);

  if (!list) return null;

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, "").length < 10) return;
    addSmsSubscriber(phone, "Admin");
    setPhone("");
  };

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="hero-headline" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05 }}>
            SMS <span className="accent-serif">list.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] text-ink-2 font-serif">
            Everyone opted into text alerts — the popup feeds this list live. SMS subscribers ride the 3X tier.
          </p>
        </div>
        <Label tone="brass" variant="solid">{list.length} subscribers</Label>
      </div>

      <form onSubmit={onAdd} className="mt-6 flex items-center gap-2 max-w-md">
        <span className="flex flex-1 items-center border border-ink/10 bg-paper-4 px-3 rounded-full">
          <MessageSquareText size={15} className="text-ink-3 shrink-0" />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            aria-label="Phone number"
            className="ml-2 w-full h-11 bg-transparent text-[15px] text-ink placeholder:text-ink-3 outline-none numeral"
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
              <p className="numeral font-semibold text-ink">{s.phone}</p>
              <p className="dateline on-paper mt-0.5">Joined {niceDate(s.joinedISO)} · via {s.source}</p>
            </div>
            <button
              type="button"
              onClick={() => removeSmsSubscriber(s.id)}
              aria-label={`Remove ${s.phone}`}
              className="inline-flex items-center gap-1.5 border border-ink/10 bg-paper-3 px-3 py-1.5 rounded-full dateline on-paper hover:bg-ink hover:text-paper transition-colors"
            >
              <Trash2 size={12} /> Remove
            </button>
          </li>
        ))}
        {list.length === 0 && (
          <li className="px-5 py-8 text-center text-ink-3 font-serif italic">No SMS subscribers yet.</li>
        )}
      </ul>
    </main>
  );
}
