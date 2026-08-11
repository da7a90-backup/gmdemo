"use client";
import { useRef, useState } from "react";
import { UploadCloud, X, Loader2 } from "lucide-react";

export async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || "upload failed");
  return j.data.url as string;
}

/** Single image: shows a preview when set, else an upload button. Uploads to
 * Shopify Files and returns the CDN url via onChange. */
export function ImageUpload({ value, onChange }: { value?: string; onChange: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true); setErr(null);
    try { onChange(await uploadFile(file)); } catch (e) { setErr(String((e as Error).message)); } finally { setBusy(false); }
  };

  return (
    <div className="mt-1.5">
      {value ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-24 w-24 object-cover rounded-lg border border-ink/10" />
          <button type="button" onClick={() => onChange("")} aria-label="Remove image"
            className="absolute -top-2 -right-2 h-6 w-6 inline-flex items-center justify-center rounded-full bg-ink text-paper border border-paper">
            <X size={13} />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()} disabled={busy}
          className="inline-flex items-center gap-2 h-24 w-full max-w-xs justify-center border border-dashed border-ink/25 bg-paper-3 rounded-lg text-ink-2 hover:border-accent hover:text-ink transition-colors disabled:opacity-50">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
          <span className="dateline on-paper">{busy ? "Uploading to Shopify…" : "Upload image"}</span>
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={(e) => pick(e.target.files?.[0] ?? undefined)} />
      {err && <p className="mt-1 text-[12px] text-red-600 font-condensed">⚠ {err}</p>}
    </div>
  );
}

/** Multiple images (e.g. the prize gallery): a row of thumbnails + an add tile. */
export function GalleryUpload({ value, onChange }: { value: string[]; onChange: (urls: string[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true); setErr(null);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) urls.push(await uploadFile(f));
      onChange([...value, ...urls]);
    } catch (e) { setErr(String((e as Error).message)); } finally { setBusy(false); }
  };

  return (
    <div className="mt-1.5">
      <div className="flex flex-wrap gap-3">
        {value.map((url, i) => (
          <div key={url + i} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-20 w-28 object-cover rounded-lg border border-ink/10" />
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove"
              className="absolute -top-2 -right-2 h-6 w-6 inline-flex items-center justify-center rounded-full bg-ink text-paper border border-paper">
              <X size={12} />
            </button>
            {i === 0 && <span className="absolute bottom-1 left-1 dateline bg-ink/80 text-paper px-1.5 rounded">primary</span>}
          </div>
        ))}
        <button type="button" onClick={() => ref.current?.click()} disabled={busy}
          className="h-20 w-28 inline-flex flex-col items-center justify-center gap-1 border border-dashed border-ink/25 bg-paper-3 rounded-lg text-ink-2 hover:border-accent hover:text-ink transition-colors disabled:opacity-50">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />}
          <span className="dateline on-paper">{busy ? "Uploading…" : "Add"}</span>
        </button>
      </div>
      <input ref={ref} type="file" accept="image/*" multiple className="hidden"
        onChange={(e) => pick(e.target.files)} />
      {err && <p className="mt-1 text-[12px] text-red-600 font-condensed">⚠ {err}</p>}
    </div>
  );
}
