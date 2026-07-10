"use client";
import { useEffect, useMemo, useState } from "react";
import { Save, RotateCcw, Check } from "lucide-react";
import { CONTENT_FIELDS, getContent, saveContent, resetContent, contentDefault } from "@/lib/content";
import { Label } from "@/components/sticker";

export default function AdminContentPage() {
  const [values, setValues] = useState<Record<string, string> | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setValues(getContent());
  }, []);

  const pages = useMemo(() => {
    const byPage = new Map<string, Map<string, typeof CONTENT_FIELDS>>();
    for (const f of CONTENT_FIELDS) {
      const groups = byPage.get(f.page) ?? new Map<string, typeof CONTENT_FIELDS>();
      groups.set(f.group, [...(groups.get(f.group) ?? []), f]);
      byPage.set(f.page, groups);
    }
    return [...byPage.entries()].map(([page, groups]) => [page, [...groups.entries()]] as const);
  }, []);

  if (!values) return null;

  const edited = CONTENT_FIELDS.filter((f) => values[f.key] !== f.def).length;

  const onSave = () => {
    saveContent(values);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const onReset = () => {
    resetContent();
    setValues(getContent());
    setSaved(false);
  };

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="hero-headline" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05 }}>
            Content <span className="accent-serif">desk.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] text-ink-2 font-serif">
            Edit the site&apos;s copy without a deploy. Changes go live on the public pages the moment you save
            {edited > 0 && <> — <strong className="text-ink">{edited} field{edited === 1 ? "" : "s"} currently overridden</strong></>}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 border border-ink/10 bg-paper-3 px-4 py-2.5 rounded-full font-condensed uppercase tracking-[0.22em] text-[11px] text-ink hover:bg-ink hover:text-paper transition-colors"
          >
            <RotateCcw size={13} /> Reset all
          </button>
          <button
            type="button"
            onClick={onSave}
            className="inline-flex items-center gap-2 bg-accent-bright text-ink border border-ink/10 px-5 py-2.5 rounded-full font-condensed uppercase tracking-[0.22em] text-[11px] font-bold hover:bg-accent hover:text-paper-3 transition-colors"
          >
            {saved ? <Check size={13} /> : <Save size={13} />}
            {saved ? "Published" : "Publish changes"}
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-10">
        {pages.map(([page, groups]) => (
          <section key={page}>
            <div className="flex items-center justify-between border-b-2 border-ink pb-3">
              <h2 className="font-display font-bold text-2xl text-ink">{page}</h2>
              <Label tone="ink" variant="solid" size="sm">
                {groups.reduce((n, [, f]) => n + f.length, 0)} fields
              </Label>
            </div>
            <div className="mt-4 grid gap-5">
              {groups.map(([group, fields]) => (
          <section key={group} className="border border-ink/10 bg-paper-4 rounded-2xl shadow-soft overflow-hidden">
            <div className="px-5 py-3 bg-paper-3 border-b border-ink/10 flex items-center justify-between">
              <p className="font-display font-bold text-ink">{group}</p>
              <Label tone="ink" variant="outline" size="sm">{fields.length} fields</Label>
            </div>
            <div className="p-5 grid gap-4 sm:grid-cols-2">
              {fields.map((f) => {
                const dirty = values[f.key] !== f.def;
                return (
                  <label key={f.key} className={`block ${f.long ? "sm:col-span-2" : ""}`}>
                    <span className="flex items-center justify-between">
                      <span className="dateline on-paper">{f.label}</span>
                      {dirty && (
                        <button
                          type="button"
                          onClick={() => setValues((v) => ({ ...v!, [f.key]: contentDefault(f.key) }))}
                          className="dateline text-brass-deep underline underline-offset-2"
                        >
                          revert
                        </button>
                      )}
                    </span>
                    {f.long ? (
                      <textarea
                        value={values[f.key] ?? ""}
                        rows={3}
                        onChange={(e) => setValues((v) => ({ ...v!, [f.key]: e.target.value }))}
                        className={`mt-1.5 w-full border bg-paper-3 rounded-lg px-3 py-2.5 text-[15px] text-ink outline-none focus:border-accent leading-relaxed ${dirty ? "border-brass" : "border-ink/10"}`}
                      />
                    ) : (
                      <input
                        type="text"
                        value={values[f.key] ?? ""}
                        onChange={(e) => setValues((v) => ({ ...v!, [f.key]: e.target.value }))}
                        className={`mt-1.5 w-full h-11 border bg-paper-3 rounded-lg px-3 text-[15px] text-ink outline-none focus:border-accent ${dirty ? "border-brass" : "border-ink/10"}`}
                      />
                    )}
                  </label>
                );
              })}
            </div>
          </section>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-6 dateline on-paper">
        Production build: these fields live in a headless CMS or Shopify metafields — same keys, same pickup.
      </p>
    </main>
  );
}
