import { Suspense } from "react";
import { ThankYouClient } from "./thank-you-client";

export const metadata = { title: "You're in! — Generous Motors" };

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-5 py-20 text-ink-muted">Loading…</div>}>
      <ThankYouClient />
    </Suspense>
  );
}
