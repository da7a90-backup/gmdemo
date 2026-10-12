// Tiny CSV helpers for admin exports. Client-safe (downloadCsv uses browser APIs).

/** Build an RFC-4180 CSV string from rows + column defs (quotes/commas/newlines escaped). */
export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: keyof T; label: string }[],
): string {
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => esc(c.label)).join(",");
  const body = rows.map((r) => columns.map((c) => esc(r[c.key])).join(",")).join("\r\n");
  return rows.length ? `${header}\r\n${body}` : header;
}

/** Trigger a browser download of CSV content as a file. No-op outside the browser. */
export function downloadCsv(filename: string, content: string): void {
  if (typeof document === "undefined") return;
  const blob = new Blob(["﻿", content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
