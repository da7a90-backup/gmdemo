"use client";
import { useState } from "react";
import { Lock, Loader2, ArrowRight } from "lucide-react";
import { Label } from "@/components/sticker";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const j = await r.json();
      if (!j.ok) { setError(j.error || "Login failed."); return; }
      const next = new URLSearchParams(window.location.search).get("next");
      // Full navigation so the new cookie is sent and the middleware re-runs.
      window.location.href = next && next.startsWith("/") ? next : "/admin";
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  const input = "mt-1.5 w-full h-12 border border-ink/15 bg-paper-3 rounded-lg px-3 text-[15px] text-ink outline-none focus:border-accent";

  return (
    <div className="min-h-screen bg-paper text-ink grain flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <Label tone="ink" variant="solid">Admin</Label>
          <h1 className="mt-4 hero-headline" style={{ fontSize: "clamp(1.75rem,5vw,2.5rem)" }}>Sign in</h1>
        </div>
        <form onSubmit={submit} className="mt-8 border border-ink/10 bg-paper-4 rounded-2xl shadow-soft p-6">
          <label className="block">
            <span className="dateline on-paper">Username</span>
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus className={input} />
          </label>
          <label className="block mt-4">
            <span className="dateline on-paper">Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className={input} />
          </label>
          {error && <p className="mt-3 dateline text-brass-deep">⚠ {error}</p>}
          <button type="submit" disabled={busy}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-ink text-brass h-12 rounded-full font-condensed uppercase tracking-[0.22em] text-[11px] font-bold hover:bg-accent hover:text-paper transition-colors disabled:opacity-60">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />} Sign in <ArrowRight size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
