"use client";
import { useEffect, useState } from "react";
import { Save, Check, Loader2, AlertTriangle } from "lucide-react";
import { EMAIL_TEMPLATES, type EmailTemplateDef } from "@/lib/email-templates-data";
import { Label } from "@/components/sticker";

type T = EmailTemplateDef & { edited?: boolean };

// Mirror of the server fillVars for a live preview.
const fill = (s: string, vars: Record<string, string>) =>
  s.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (m, k) => (k in vars ? vars[k] : m));

export default function AdminEmailsPage() {
  const [templates, setTemplates] = useState<T[] | null>(null);

  useEffect(() => {
    fetch("/api/admin/email-templates")
      .then((r) => r.json())
      .then((j) => setTemplates(j?.ok ? (j.data as T[]) : (EMAIL_TEMPLATES as T[])))
      .catch(() => setTemplates(EMAIL_TEMPLATES as T[]));
  }, []);

  if (!templates) return null;

  return (
    <main>
      <div>
        <h1 className="hero-headline" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05 }}>
          Email <span className="accent-serif">templates.</span>
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] text-ink-2 font-serif">
          You own the subject and HTML here. When the event fires, we render these with the real values and hand Klaviyo
          the finished email — its flow just outputs <code className="numeral">{"{{ event.subject }}"}</code> and{" "}
          <code className="numeral">{"{{ event.body_html | safe }}"}</code>. No design work in Klaviyo.
        </p>
      </div>

      <div className="mt-8 grid gap-8">
        {templates.map((t) => (
          <TemplateEditor key={t.key} tpl={t} />
        ))}
      </div>
    </main>
  );
}

function TemplateEditor({ tpl }: { tpl: T }) {
  const [subject, setSubject] = useState(tpl.subject);
  const [body, setBody] = useState(tpl.body);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  const example = Object.fromEntries(tpl.variables.map((v) => [v.name, v.example]));
  const input = "mt-1.5 w-full border border-ink/10 bg-paper-3 rounded-lg px-3 text-[15px] text-ink outline-none focus:border-accent";

  const save = async () => {
    setSaving(true);
    setErr("");
    try {
      const r = await fetch("/api/admin/email-templates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: tpl.key, subject, body }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setErr(String((e as Error)?.message ?? e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="border border-ink/10 bg-paper-4 rounded-2xl shadow-soft overflow-hidden">
      <div className="px-5 py-3 bg-paper-3 border-b border-ink/10 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display font-bold text-ink">{tpl.name}</p>
          <p className="dateline on-paper mt-0.5">{tpl.description}</p>
        </div>
        <Label tone="ink" variant="outline" size="sm">metric · {tpl.metric}</Label>
      </div>

      <div className="p-5 grid gap-4 lg:grid-cols-2">
        {/* editor */}
        <div className="grid gap-4">
          <div>
            <span className="dateline on-paper">Variables (click to insert)</span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tpl.variables.map((v) => (
                <button
                  key={v.name}
                  type="button"
                  onClick={() => setBody((b) => `${b}{{${v.name}}}`)}
                  className="numeral text-[12px] border border-ink/10 bg-paper-3 px-2 py-0.5 rounded-md hover:bg-ink hover:text-paper transition-colors"
                  title={`example: ${v.example}`}
                >
                  {`{{${v.name}}}`}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="dateline on-paper">Subject</span>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className={`${input} h-11`} />
          </label>
          <label className="block">
            <span className="dateline on-paper">Body (HTML)</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} className={`${input} py-2.5 leading-relaxed font-mono text-[13px]`} />
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-accent-bright text-ink border border-ink/10 px-5 py-2.5 rounded-full font-condensed uppercase tracking-[0.22em] text-[11px] font-bold hover:bg-accent hover:text-paper-3 transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <Check size={13} /> : <Save size={13} />}
              {saving ? "Saving…" : saved ? "Saved" : "Save template"}
            </button>
            {err && (
              <span className="inline-flex items-center gap-1.5 dateline text-brass-deep">
                <AlertTriangle size={13} /> {err}
              </span>
            )}
          </div>
        </div>

        {/* preview */}
        <div>
          <span className="dateline on-paper">Preview (with example values)</span>
          <div className="mt-2 border border-ink/10 bg-paper rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-ink/10 bg-paper-3">
              <p className="dateline on-paper">Subject</p>
              <p className="font-display font-bold text-ink leading-tight">{fill(subject, example)}</p>
            </div>
            <div className="p-4 text-[14px] text-ink leading-relaxed [&_h1]:text-2xl [&_h1]:font-bold [&_p]:mt-2" dangerouslySetInnerHTML={{ __html: fill(body, example) }} />
          </div>
        </div>
      </div>
    </section>
  );
}
