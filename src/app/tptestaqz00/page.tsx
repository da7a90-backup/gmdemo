"use client";
import { Fragment, useEffect, useState } from "react";

export const dynamic = "force-dynamic";

type Mode = "safe" | "seq" | "naive";
type OrderRow = {
  id: number;
  shopify_order_id: number;
  order_token: string;
  email: string;
  cycle_code: string;
  promo_multiplier: number;
  entries: number;
  seq_start: number | null;
  seq_end: number | null;
  created_at: string;
};
type Audit = {
  summary: { totalOrders: number; totalTickets: number; distinctTickets: number; duplicateTokens: number; noDuplicates: boolean };
  orders: OrderRow[];
};
type BatchResult = {
  orderId: number; email: string; requested: number; gotEntries: number;
  ok: boolean; attempt?: number; status?: string; ticket_prefix?: string; error?: string;
};
type Batch = {
  count: number; mode: Mode; min: number; max: number; multiplier: number;
  expectedTotal: number; ms: number; failures: number; missing: number; results: BatchResult[];
};

const C = {
  page: { maxWidth: 1100, margin: "0 auto", padding: "28px 20px 80px", fontFamily: "ui-sans-serif, system-ui, sans-serif", color: "#18181b" } as React.CSSProperties,
  card: { border: "1px solid #e4e4e7", borderRadius: 12, padding: 18, background: "#fff", marginTop: 16 } as React.CSSProperties,
  h1: { fontSize: 24, fontWeight: 800, letterSpacing: "-0.01em" } as React.CSSProperties,
  label: { display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#71717a", marginBottom: 4 } as React.CSSProperties,
  input: { width: "100%", height: 38, border: "1px solid #d4d4d8", borderRadius: 8, padding: "0 10px", fontSize: 15 } as React.CSSProperties,
  btn: (bg: string) => ({ height: 40, padding: "0 18px", borderRadius: 999, border: "none", background: bg, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" } as React.CSSProperties),
  chip: (on: boolean) => ({ padding: "6px 12px", borderRadius: 999, border: on ? "2px solid #4f46e5" : "1px solid #d4d4d8", background: on ? "#eef2ff" : "#fff", color: on ? "#4f46e5" : "#3f3f46", fontWeight: 700, fontSize: 13, cursor: "pointer" } as React.CSSProperties),
  th: { textAlign: "left", padding: "8px 10px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#71717a", borderBottom: "1px solid #e4e4e7" } as React.CSSProperties,
  td: { padding: "8px 10px", fontSize: 13, borderBottom: "1px solid #f4f4f5", fontVariantNumeric: "tabular-nums" } as React.CSSProperties,
  mono: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" } as React.CSSProperties,
};

function Stat({ label, value, good }: { label: string; value: string | number; good?: boolean }) {
  return (
    <div style={{ minWidth: 120 }}>
      <div style={{ fontSize: 26, fontWeight: 800, color: good === undefined ? "#18181b" : good ? "#15803d" : "#b91c1c", fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#71717a", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function ticketNumbers(o: OrderRow, cap = 2000): string[] {
  if (o.seq_start == null || o.seq_end == null) return [];
  const out: string[] = [];
  const cyc = String(o.cycle_code).padStart(2, "0");
  for (let s = o.seq_start; s <= o.seq_end && out.length < cap; s++) {
    out.push(`GM${cyc}-${o.order_token}-${String(s).padStart(4, "0")}`);
  }
  return out;
}

export default function TestBench() {
  const [count, setCount] = useState(5);
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(10);
  const [multiplier, setMultiplier] = useState(1);
  const [mode, setMode] = useState<Mode>("seq");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [audit, setAudit] = useState<Audit | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  async function loadAudit() {
    try {
      const r = await fetch("/api/tptest/audit");
      const j = await r.json();
      if (j.ok) setAudit(j.audit);
      else setErr(j.error);
    } catch (e) { setErr(String(e)); }
  }
  useEffect(() => { loadAudit(); }, []);

  async function run() {
    setBusy("Running batch…"); setErr(null);
    try {
      const r = await fetch("/api/tptest/run", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ count, min, max, multiplier, mode }),
      });
      const j = await r.json();
      if (!j.ok) { setErr(j.error); return; }
      setBatch(j.batch); setAudit(j.audit);
    } catch (e) { setErr(String(e)); } finally { setBusy(null); }
  }

  async function reset() {
    setBusy("Resetting database…"); setErr(null); setBatch(null);
    try {
      const r = await fetch("/api/tptest/reset", { method: "POST" });
      const j = await r.json();
      if (!j.ok) { setErr(j.error); return; }
      setAudit(j.audit); setExpanded(new Set());
    } catch (e) { setErr(String(e)); } finally { setBusy(null); }
  }

  const toggle = (id: number) => setExpanded((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div style={C.page}>
      <div style={C.h1}>Ticket generation — test bench</div>
      <p style={{ color: "#52525b", fontSize: 14, marginTop: 6 }}>
        Fires concurrent mock <span style={C.mono}>orders/paid</span> webhooks at the generate endpoint against your Supabase DB.
        Confirms no duplicate ticket numbers, no missing tickets after payment, and idempotency. Local only (needs <span style={C.mono}>DIRECT_URL</span>).
      </p>

      {/* CONTROLS */}
      <div style={C.card}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 14 }}>
          <div>
            <label style={C.label}>Orders (1–200)</label>
            <input style={C.input} type="number" min={1} max={200} value={count} onChange={(e) => setCount(Math.max(1, Math.min(200, +e.target.value || 1)))} />
          </div>
          <div>
            <label style={C.label}>Entries/order — min</label>
            <input style={C.input} type="number" min={1} max={9999} value={min} onChange={(e) => setMin(Math.max(1, +e.target.value || 1))} />
          </div>
          <div>
            <label style={C.label}>Entries/order — max</label>
            <input style={C.input} type="number" min={1} max={9999} value={max} onChange={(e) => setMax(Math.max(1, +e.target.value || 1))} />
          </div>
          <div>
            <label style={C.label}>Multiplier</label>
            <input style={C.input} type="number" min={1} max={10} value={multiplier} onChange={(e) => setMultiplier(Math.max(1, +e.target.value || 1))} />
          </div>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ ...C.label, marginBottom: 0, marginRight: 4 }}>Presets</span>
          {[1, 2, 3, 4, 5, 50, 200].map((n) => (
            <button key={n} style={C.chip(false)} onClick={() => setCount(n)}>{n}</button>
          ))}
          <span style={{ width: 1, height: 22, background: "#e4e4e7", margin: "0 4px" }} />
          <span style={{ ...C.label, marginBottom: 0, marginRight: 4 }}>Mode</span>
          {(["seq", "safe", "naive"] as Mode[]).map((m) => (
            <button key={m} style={C.chip(mode === m)} onClick={() => setMode(m)} title={m === "seq" ? "lock-free sequence (recommended)" : m === "safe" ? "atomic counter row" : "SELECT MAX()+1 — demonstrates failure"}>
              {m}{m === "seq" ? " ★" : ""}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "center" }}>
          <button style={C.btn(busy ? "#a1a1aa" : "#4f46e5")} disabled={!!busy} onClick={run}>
            {busy === "Running batch…" ? "Running…" : `Run ${count} order${count > 1 ? "s" : ""} @ ${min}${min === max ? "" : "–" + max} entries`}
          </button>
          <button style={C.btn(busy ? "#a1a1aa" : "#0891b2")} disabled={!!busy} onClick={loadAudit}>Refresh view</button>
          <button style={C.btn(busy ? "#a1a1aa" : "#be123c")} disabled={!!busy} onClick={reset}>Reset DB</button>
          {busy && <span style={{ color: "#71717a", fontSize: 13 }}>{busy}</span>}
        </div>
        {err && <div style={{ marginTop: 12, color: "#b91c1c", fontSize: 13, ...C.mono }}>⚠ {err}</div>}
      </div>

      {/* BATCH RESULT */}
      {batch && (
        <div style={C.card}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>
            Last run — {batch.count} orders · {batch.mode} mode
          </div>
          <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
            <Stat label="orders" value={batch.count} />
            <Stat label="entries requested" value={batch.expectedTotal} />
            <Stat label="duration" value={`${batch.ms} ms`} />
            <Stat label="throughput" value={`${(batch.count / (batch.ms / 1000)).toFixed(1)}/s`} />
            <Stat label="rejected after pay" value={batch.failures} good={batch.failures === 0} />
            <Stat label="missing/short" value={batch.missing} good={batch.missing === 0} />
          </div>
          <div style={{ overflowX: "auto", marginTop: 14 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={C.th}>Order id</th><th style={C.th}>Email</th><th style={C.th}>Requested</th>
                <th style={C.th}>Got</th><th style={C.th}>Status</th><th style={C.th}>Attempt</th><th style={C.th}>Prefix</th>
              </tr></thead>
              <tbody>
                {batch.results.slice(0, 250).map((r) => (
                  <tr key={r.orderId}>
                    <td style={{ ...C.td, ...C.mono }}>{r.orderId}</td>
                    <td style={C.td}>{r.email}</td>
                    <td style={C.td}>{r.requested}</td>
                    <td style={{ ...C.td, color: r.requested === r.gotEntries ? "#15803d" : "#b91c1c" }}>{r.gotEntries}</td>
                    <td style={{ ...C.td, color: r.ok ? "#15803d" : "#b91c1c", fontWeight: 700 }}>{r.ok ? r.status : "FAILED"}</td>
                    <td style={C.td}>{r.attempt ?? "—"}</td>
                    <td style={{ ...C.td, ...C.mono }}>{r.ticket_prefix ?? (r.error ? r.error.slice(0, 40) : "—")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DB AUDIT */}
      {audit && (
        <div style={C.card}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>Database — full state (all cycles/orders)</div>
          <div style={{ display: "flex", gap: 28, flexWrap: "wrap", marginBottom: 8 }}>
            <Stat label="orders" value={audit.summary.totalOrders} />
            <Stat label="tickets" value={audit.summary.totalTickets} />
            <Stat label="distinct tickets" value={audit.summary.distinctTickets} />
            <Stat label="duplicate numbers" value={audit.summary.totalTickets - audit.summary.distinctTickets} good={audit.summary.noDuplicates} />
            <Stat label="duplicate tokens" value={audit.summary.duplicateTokens} good={audit.summary.duplicateTokens === 0} />
            <Stat label="integrity" value={audit.summary.noDuplicates && audit.summary.duplicateTokens === 0 ? "OK ✓" : "BAD ✗"} good={audit.summary.noDuplicates && audit.summary.duplicateTokens === 0} />
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={C.th}></th><th style={C.th}>Order token</th><th style={C.th}>Email</th>
                <th style={C.th}>Entries</th><th style={C.th}>×</th><th style={C.th}>Ticket range</th><th style={C.th}>Shopify id</th><th style={C.th}>Time</th>
              </tr></thead>
              <tbody>
                {audit.orders.map((o) => {
                  const nums = ticketNumbers(o);
                  const first = nums[0], last = nums[nums.length - 1];
                  const isOpen = expanded.has(o.id);
                  return (
                    <Fragment key={o.id}>
                      <tr>
                        <td style={{ ...C.td, cursor: nums.length ? "pointer" : "default", color: "#4f46e5", fontWeight: 700 }} onClick={() => nums.length && toggle(o.id)}>{nums.length ? (isOpen ? "▾" : "▸") : ""}</td>
                        <td style={{ ...C.td, ...C.mono, fontWeight: 700 }}>{o.order_token}</td>
                        <td style={C.td}>{o.email}</td>
                        <td style={C.td}>{o.entries}</td>
                        <td style={C.td}>{o.promo_multiplier}</td>
                        <td style={{ ...C.td, ...C.mono }}>{first ? `${first} … ${last}` : "—"}</td>
                        <td style={{ ...C.td, ...C.mono, color: "#71717a" }}>{o.shopify_order_id}</td>
                        <td style={{ ...C.td, color: "#71717a" }}>{o.created_at}</td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td></td>
                          <td colSpan={7} style={{ padding: "6px 10px 14px" }}>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {nums.map((n) => (
                                <span key={n} style={{ ...C.mono, fontSize: 12, background: "#f4f4f5", border: "1px solid #e4e4e7", borderRadius: 6, padding: "2px 6px" }}>{n}</span>
                              ))}
                              {o.seq_end != null && o.seq_start != null && o.seq_end - o.seq_start + 1 > nums.length && (
                                <span style={{ fontSize: 12, color: "#71717a" }}>…and {o.seq_end - o.seq_start + 1 - nums.length} more (capped)</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                {audit.orders.length === 0 && (
                  <tr><td colSpan={8} style={{ ...C.td, textAlign: "center", color: "#a1a1aa", padding: 24 }}>No orders yet — run a batch above.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
