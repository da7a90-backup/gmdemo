// Client helpers for starting a REAL Shopify checkout (Storefront Cart API via
// /api/cart), with attribution carried as cart attributes for Track E. Callers
// fall back to the simulated /checkout when this returns false (deployed demo
// without Shopify, or membership selling-plans which aren't wired yet).

/** Pull utm_* params off the current URL for attribution. */
export function utmAttrs(params: URLSearchParams | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!params) return out;
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const v = params.get(k)?.trim();
    if (v) out[k] = v;
  }
  return out;
}

/**
 * Create a Shopify cart for `entries` tickets and redirect to the hosted checkout.
 * Returns true if it redirected; false if the caller should fall back to /checkout.
 */
export async function startTicketCheckout(opts: {
  entries: number;
  multiplier: number;
  attribution: Record<string, string>;
}): Promise<boolean> {
  return postCart({ entries: opts.entries, quantity: 1, multiplier: opts.multiplier, attribution: opts.attribution });
}

/**
 * Create a real Shopify SUBSCRIPTION cart for a membership tier and redirect to the
 * hosted checkout. Returns true if it redirected; false → caller falls back to /checkout.
 */
export async function startMembershipCheckout(tier: string, attribution: Record<string, string>): Promise<boolean> {
  return postCart({ tier, attribution });
}

async function postCart(payload: Record<string, unknown>): Promise<boolean> {
  try {
    const r = await fetch("/api/cart", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const j = await r.json();
    if (j?.ok && j.data?.checkoutUrl) {
      window.location.href = j.data.checkoutUrl as string;
      return true;
    }
  } catch {
    /* fall through */
  }
  return false;
}
