"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Save, Loader2 } from "lucide-react";
import { adminGet, adminSend } from "@/lib/admin-api";
import { Label } from "@/components/sticker";

type Field = { key: string; label: string; type: "text" | "textarea" | "number" };
type Schema = { title: string; blurb: string; itemName: string; fields: Field[] };
type Row = Record<string, string>;

const KINDS = [
  { kind: "faq", label: "FAQ" },
  { kind: "rules", label: "Rules" },
  { kind: "legal", label: "Legal docs" },
  { kind: "about", label: "About steps" },
] as const;
type Kind = (typeof KINDS)[number]["kind"];

export default function ContentListsPage() {
  const [kind, setKind] = useState<Kind>("faq");
  const [schema, setSchema] = useState<Schema | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback((k: Kind) => {
    setLoading(true);
    setMsg(null);
    adminGet<{ schema: Schema; rows: Row[] }>(`/api/admin/content-lists?kind=${k}`)
      .then((d) => { setSchema(d.schema); setRows(d.rows); setDirty(false); })
      .catch((e) => setMsg(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(kind); }, [kind, load]);

  const emptyRow = (): Row => Object.fromEntries((schema?.fields ?? []).map((f) => [f.key, ""]));
  const setField = (i: number, key: string, v: string) => {
    setRows((r) => r.map((row, j) => (j === i ? { ...row, [key]: v } : row)));
    setDirty(true);
  };
  const addRow = () => { setRows((r) => [...r, emptyRow()]); setDirty(true); };
  const removeRow = (i: number) => { setRows((r) => r.filter((_, j) => j !== i)); setDirty(true); };
  const move = (i: number, d: -1 | 1) =>
    setRows((r) => {
      const j = i + d;
      if (j < 0 || j >= r.length) return r;
      const c = [...r];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const d = await adminSend<{ rows: Row[] }>(`/api/admin/content-lists?kind=${kind}`, "PUT", { rows });
      setRows(d.rows);
      setDirty(false);
      setMsg("Saved to Shopify.");
    } catch (e) {
      setMsg("Save failed: " + String((e as Error)?.message ?? e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="hero-headline" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05 }}>
            Pages &amp; <span className="accent-serif">lists.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] text-ink-2 font-serif">
            Edit the repeatable content that used to live in the Shopify admin — FAQ, Official Rules, legal
            pages, the “how it works” steps, and the loyalty ladder. Changes publish straight to the live site.
          </p>
        </div>
        {schema && <Label tone="brass" variant="solid">{rows.length} {schema.itemName}{rows.length === 1 ? "" : "s"}</Label>}
      </div>

      {/* Kind tabs */}
      <div className="mt-6 flex flex-wrap gap-1.5" role="tablist" aria-label="Content list">
        {KINDS.map((k) => (
          <button
            key={k.kind}
            role="tab"
            aria-selected={kind === k.kind}
            onClick={() => {
              if (dirty && !confirm("Discard unsaved changes?")) return;
              setKind(k.kind);
            }}
            className={`px-4 py-2 rounded-full font-condensed uppercase tracking-[0.18em] text-[11px] font-semibold border transition-colors ${
              kind === k.kind ? "bg-ink text-brass border-ink" : "bg-paper-4 text-ink border-ink/10 hover:bg-ink hover:text-paper"
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>

      {loading || !schema ? (
        <p className="mt-10 dateline on-paper inline-flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading…</p>
      ) : (
        <>
          <p className="mt-6 dateline on-paper">{schema.blurb}</p>

          <div className="mt-4 space-y-4">
            {rows.map((row, i) => (
              <div key={i} className="border border-ink/10 bg-paper-4 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="section-eyebrow on-paper">{schema.itemName} №{String(i + 1).padStart(2, "0")}</p>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"
                      className="p-1.5 rounded-full border border-ink/10 bg-paper-3 disabled:opacity-30 hover:bg-ink hover:text-paper transition-colors"><ArrowUp size={13} /></button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="Move down"
                      className="p-1.5 rounded-full border border-ink/10 bg-paper-3 disabled:opacity-30 hover:bg-ink hover:text-paper transition-colors"><ArrowDown size={13} /></button>
                    <button type="button" onClick={() => removeRow(i)} aria-label="Remove"
                      className="p-1.5 rounded-full border border-ink/10 bg-paper-3 hover:bg-accent hover:text-paper hover:border-accent transition-colors"><Trash2 size={13} /></button>
                  </div>
                </div>
                <div className="space-y-3">
                  {schema.fields.map((f) => (
                    <label key={f.key} className="block">
                      <span className="dateline on-paper">{f.label}</span>
                      {f.type === "textarea" ? (
                        <textarea
                          value={row[f.key] ?? ""}
                          onChange={(e) => setField(i, f.key, e.target.value)}
                          rows={f.key === "answer" || f.key === "body" ? 4 : 2}
                          className="mt-1 w-full rounded-lg border border-ink/15 bg-paper-3 px-3 py-2 text-[14px] text-ink focus:border-ink outline-none"
                        />
                      ) : (
                        <input
                          type={f.type === "number" ? "number" : "text"}
                          value={row[f.key] ?? ""}
                          onChange={(e) => setField(i, f.key, e.target.value)}
                          className="mt-1 w-full rounded-lg border border-ink/15 bg-paper-3 px-3 py-2 text-[14px] text-ink focus:border-ink outline-none"
                        />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            {rows.length === 0 && <p className="dateline on-paper italic">No items yet — add one below.</p>}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={addRow}
              className="inline-flex items-center gap-2 border border-ink/10 bg-paper-4 px-4 py-2.5 rounded-full font-condensed uppercase tracking-[0.18em] text-[11px] text-ink hover:bg-ink hover:text-paper transition-colors">
              <Plus size={14} /> Add {schema.itemName}
            </button>
            <button type="button" onClick={save} disabled={saving || !dirty}
              className="inline-flex items-center gap-2 bg-ink text-brass px-5 py-2.5 rounded-full font-condensed uppercase tracking-[0.18em] text-[11px] font-semibold border border-ink disabled:opacity-40 hover:bg-accent hover:text-paper hover:border-accent transition-colors">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {saving ? "Saving…" : "Save changes"}
            </button>
            {dirty && !saving && <span className="dateline on-paper italic">Unsaved changes</span>}
            {msg && <span className="dateline on-paper">{msg}</span>}
          </div>
        </>
      )}
    </main>
  );
}
