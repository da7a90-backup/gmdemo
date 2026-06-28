import { Suspense } from "react";
import { CheckoutClient } from "./checkout-client";

export const metadata = { title: "Checkout — Generous Motors" };

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-5 py-20 text-ink-muted">Loading checkout…</div>}>
      <CheckoutClient />
    </Suspense>
  );
}
