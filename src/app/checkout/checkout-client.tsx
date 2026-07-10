"use client";
import { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { activeDraw, ticketTiers, membershipTiers } from "@/lib/mock-data";
import { usdc } from "@/lib/format";

/**
 * Simulated Shopify Checkout (2.0 layout).
 *
 * Visual reference: a live Shopify-hosted checkout
 * (baddworldwide.org/checkouts/cn/...) — same scheme1/scheme2 cream tints,
 * same two-column grid, same mobile disclosure bar, same section structure,
 * system font stack, "Powered by Shopify" footer.
 *
 * Brand chrome (top marquee + site header + site footer + email popup) is
 * suppressed by <SiteShell> for /checkout so the page feels like a Shopify-
 * hosted redirect even though it's still inside the Next app.
 */

const C = {
  scheme1: "#F6F4F4",          // form area background
  scheme2: "#EBE5E5",          // order summary background
  border: "#D8D4D4",
  borderSoft: "#E8E2E2",
  ink: "#000000",
  inkSubdued: "rgba(0,0,0,0.56)",
  inkSubdued200: "rgba(0,0,0,0.1)",
  field: "#FFFFFF",
  primary: "#C8362A",          // GM brand red for CTAs
  primaryHover: "#9C1D10",
  accent: "#1773B0",           // Shopify blue (radios + checked states)
  inputFocus: "#1773B0",
};

const MOCK = {
  email: "demo@generousmotors.org",
  firstName: "Demo",
  lastName: "Player",
  address1: "120 Cedar Ave",
  address2: "Apt 4B",
  city: "Brooklyn",
  state: "NY",
  zip: "11215",
  country: "United States",
  phone: "(555) 010-1234",
  cardName: "Demo Player",
  cardNumber: "4242 4242 4242 4242",
  cardExp: "12/29",
  cardCvc: "123",
};

export function CheckoutClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const tierId = sp.get("tier") ?? "t-10";
  const qtyParam = Number(sp.get("qty") ?? "0");
  const type = (sp.get("type") ?? "once") as "once" | "monthly";

  const item = useMemo(() => {
    if (type === "monthly") {
      const m = membershipTiers.find((x) => x.id === tierId) ?? membershipTiers[1];
      return {
        name: `${m.name} Membership`,
        sub: `${m.monthlyEntries} entries / cycle`,
        priceUSD: m.monthlyUSD,
        recurring: true,
        entries: m.monthlyEntries,
        tierId: m.id,
        kind: "membership" as const,
      };
    }
    if (qtyParam > 0) {
      return {
        name: `Giveaway Ticket`,
        sub: `Quantity: ${qtyParam}`,
        priceUSD: qtyParam * 10,
        recurring: false,
        entries: qtyParam,
        tierId: "t-custom",
        kind: "ticket" as const,
      };
    }
    const t = ticketTiers.find((x) => x.id === tierId) ?? ticketTiers[2];
    return {
      name: `Giveaway Ticket`,
      sub: `Quantity: ${t.entries}`,
      priceUSD: t.priceUSD,
      recurring: false,
      entries: t.entries,
      tierId: t.id,
      kind: "ticket" as const,
    };
  }, [tierId, qtyParam, type]);

  // Checkout upsell — one clean upgrade offer (next bundle up), pre-payment.
  const upgrade = useMemo(() => {
    if (item.kind !== "ticket") return null;
    const idx = ticketTiers.findIndex((t) => t.id === item.tierId);
    if (idx < 0 || idx >= ticketTiers.length - 1) return null;
    return ticketTiers[idx + 1];
  }, [item]);

  const onUpgrade = () => {
    if (!upgrade) return;
    const next = new URLSearchParams(sp.toString());
    next.set("tier", upgrade.id);
    next.set("type", "once");
    router.replace(`/checkout?${next.toString()}`);
  };

  const charityCut = +(item.priceUSD * 0.10).toFixed(2);
  const subtotal = item.priceUSD;
  const shipping = 0;
  const taxes = 0;
  const total = subtotal + shipping + taxes;

  const [submitting, setSubmitting] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const onPay = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const draftId = `order-${Date.now()}`;
    const payload = {
      orderId: draftId,
      kind: item.kind,
      name: item.name,
      entries: item.entries,
      drawCycle: activeDraw.cycle,
      drawSlug: activeDraw.slug,
      vehicleLabel: `${activeDraw.vehicle.year} ${activeDraw.vehicle.make} ${activeDraw.vehicle.model}`,
      charityName: activeDraw.charity.name,
      charityCut,
      total,
      buyer: {
        firstName: MOCK.firstName,
        lastName: MOCK.lastName,
        email: MOCK.email,
        phone: MOCK.phone.replace(/\D/g, ""),
        city: MOCK.city,
        state: MOCK.state,
      },
      placedAtISO: new Date().toISOString(),
    };
    try { sessionStorage.setItem("gm:lastOrder", JSON.stringify(payload)); } catch {}
    setTimeout(() => router.push(`/thank-you?order=${draftId}`), 1000);
  };

  const FONT_STACK = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`;

  // ===== Order summary (used inline on desktop, inside disclosure on mobile) =====
  const Summary = () => (
    <div className="space-y-5 text-[14px]" style={{ color: C.ink }}>
      <ul className="space-y-4">
        <li className="flex items-start gap-3">
          <div className="relative shrink-0">
            <div
              className="h-16 w-16 bg-white"
              style={{
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                backgroundImage: `url(${activeDraw.vehicle.images[0]})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
              aria-hidden
            />
            <span
              className="absolute -top-2 -right-2 inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full text-white text-[12px] font-medium px-1.5"
              style={{ background: "rgba(0,0,0,0.56)" }}
              aria-label={`Quantity ${item.entries}`}
            >
              {item.entries}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ color: C.ink }}>{item.name}</p>
            <p className="mt-0.5 text-[13px]" style={{ color: C.inkSubdued }}>
              {item.sub}
            </p>
          </div>
          <p className="tabular-nums" style={{ color: C.ink }}>
            {usdc(item.priceUSD)}
            {item.recurring && <span style={{ color: C.inkSubdued }}>/mo</span>}
          </p>
        </li>
      </ul>

      {/* Discount code */}
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <input
          type="text"
          placeholder="Discount code"
          className="h-11 px-3 text-[16px] bg-white outline-none focus:ring-2 focus:ring-[#1773b0]/30"
          style={{ border: `1px solid ${C.border}`, borderRadius: 8, color: C.ink }}
        />
        <button
          type="button"
          className="px-5 h-11 text-[14px] font-medium"
          style={{
            background: C.borderSoft,
            color: C.inkSubdued,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
          }}
        >
          Apply
        </button>
      </div>

      <div className="border-t pt-4 space-y-2.5" style={{ borderColor: C.border }}>
        <Row k="Subtotal" v={usdc(subtotal)} />
        <Row k="Shipping" v={shipping === 0 ? "FREE" : usdc(shipping)} muted />
        <Row k="Estimated taxes" v={usdc(taxes)} muted />
      </div>

      <div className="border-t pt-4 flex items-end justify-between" style={{ borderColor: C.border }}>
        <span className="font-semibold text-[16px]">Total</span>
        <span className="flex items-baseline gap-1">
          <span className="text-[12px]" style={{ color: C.inkSubdued }}>USD</span>
          <span className="text-[22px] font-semibold tabular-nums">{usdc(total)}</span>
          {item.recurring && <span className="text-[12px]" style={{ color: C.inkSubdued }}>/mo</span>}
        </span>
      </div>

      <p className="text-[12px]" style={{ color: C.inkSubdued }}>
        Includes <strong style={{ color: C.ink }}>{usdc(charityCut)}</strong> contribution to {activeDraw.charity.name}.
      </p>
    </div>
  );

  return (
    <div
      className="min-h-screen"
      style={{ background: C.scheme1, color: C.ink, fontFamily: FONT_STACK }}
    >
      {/* Header — merchant logo only, left-aligned */}
      <header style={{ background: C.scheme1, borderBottom: `1px solid ${C.border}` }}>
        <div className="mx-auto max-w-[1060px] px-5 lg:px-10 py-4 lg:py-5">
          <a href="/" aria-label="Generous Motors" className="inline-flex items-center">
            <Logo height={32} markColor="#00D1BD" letterColor={C.ink} />
          </a>
        </div>
      </header>

      {/* Mobile disclosure bar */}
      <button
        type="button"
        aria-controls="disclosure_details"
        aria-expanded={summaryOpen}
        onClick={() => setSummaryOpen((v) => !v)}
        className="lg:hidden w-full text-left flex items-center justify-between gap-3 px-5 py-4 transition-colors"
        style={{
          background: C.scheme2,
          color: C.accent,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <span className="inline-flex items-center gap-2 text-[14px]">
          {summaryOpen ? "Hide" : "Show"} order summary
          <ChevronDown size={16} className={summaryOpen ? "rotate-180 transition-transform" : "transition-transform"} />
        </span>
        <span className="text-[18px] font-semibold tabular-nums" style={{ color: C.ink }}>
          {usdc(total)}
        </span>
      </button>
      {summaryOpen && (
        <div
          id="disclosure_details"
          className="lg:hidden px-5 py-6"
          style={{ background: C.scheme2, borderBottom: `1px solid ${C.border}` }}
        >
          <Summary />
        </div>
      )}

      {/* Main two-column grid */}
      <div
        className="mx-auto max-w-[1060px] grid lg:grid-cols-[1fr_440px]"
        style={{ borderRight: `none` }}
      >
        {/* LEFT — form */}
        <form
          onSubmit={onPay}
          className="px-5 lg:px-10 py-8 lg:py-10"
          style={{ background: C.scheme1, borderRight: `1px solid ${C.border}` }}
        >
          <h1 className="sr-only">Generous Motors Checkout</h1>

          {/* Express checkout */}
          <section aria-label="Express checkout" className="space-y-3">
            <h2 className="text-center text-[14px]" style={{ color: C.inkSubdued }}>
              Express checkout
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
              <ExpressBtn className="lg:col-span-3 lg:col-auto" tone="shoppay" label="Shop Pay" />
              <ExpressBtn tone="paypal" label="PayPal" />
              <ExpressBtn tone="gpay" label="G Pay" />
            </div>
          </section>

          {/* OR divider */}
          <div className="my-8 flex items-center gap-3" aria-hidden>
            <span className="h-px flex-1" style={{ background: C.border }} />
            <span className="text-[13px]" style={{ color: C.inkSubdued }}>OR</span>
            <span className="h-px flex-1" style={{ background: C.border }} />
          </div>

          {/* Contact */}
          <Section title="Contact">
            <Field label="Email" defaultValue={MOCK.email} type="email" name="email" autoComplete="email" />
            <CheckboxRow defaultChecked label="Email me with winner updates and promotions" />
          </Section>

          {/* Delivery */}
          <Section title="Delivery">
            <Select label="Country/region" defaultValue={MOCK.country} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name" defaultValue={MOCK.firstName} name="firstName" autoComplete="given-name" />
              <Field label="Last name" defaultValue={MOCK.lastName} name="lastName" autoComplete="family-name" />
            </div>
            <Field label="Address" defaultValue={MOCK.address1} name="address1" autoComplete="address-line1" />
            <Field label="Apartment, suite, etc. (optional)" defaultValue={MOCK.address2} name="address2" autoComplete="address-line2" />
            <div className="grid grid-cols-3 gap-3">
              <Field label="City" defaultValue={MOCK.city} name="city" autoComplete="address-level2" />
              <StateSelect defaultValue={MOCK.state} />
              <Field label="ZIP code" defaultValue={MOCK.zip} name="zip" autoComplete="postal-code" />
            </div>
            <Field label="Phone" defaultValue={MOCK.phone} name="phone" autoComplete="tel" />
          </Section>

          {/* Shipping method */}
          <Section title="Shipping method">
            <div
              className="overflow-hidden"
              style={{ border: `1px solid ${C.border}`, borderRadius: 8 }}
            >
              <label
                className="flex items-center justify-between gap-3 px-4 py-3.5"
                style={{ background: C.borderSoft }}
              >
                <span className="flex items-center gap-3">
                  <input type="radio" name="ship" defaultChecked className="h-[18px] w-[18px]" style={{ accentColor: C.accent }} />
                  <span className="text-[14px]">Standard — tickets printed on draw day</span>
                </span>
                <span className="text-[14px] font-medium tabular-nums">FREE</span>
              </label>
            </div>
          </Section>

          {/* Payment */}
          <Section title="Payment" sub="All transactions are secure and encrypted.">
            <div className="overflow-hidden" style={{ border: `1px solid ${C.border}`, borderRadius: 8 }}>
              <div
                className="flex items-center justify-between gap-3 px-4 py-3"
                style={{ background: C.borderSoft, borderBottom: `1px solid ${C.border}` }}
              >
                <span className="flex items-center gap-3">
                  <input type="radio" defaultChecked className="h-[18px] w-[18px]" style={{ accentColor: C.accent }} />
                  <span className="text-[14px] font-medium">Credit card</span>
                </span>
                <span className="flex gap-1.5 items-center">
                  <VisaMark />
                  <MastercardMark />
                  <AmexMark />
                  <DiscoverMark />
                  <span className="text-[12px] font-medium" style={{ color: C.inkSubdued }}>+4</span>
                </span>
              </div>
              <div className="p-4 space-y-3" style={{ background: "#FFFFFF" }}>
                <Field label="Card number" defaultValue={MOCK.cardNumber} name="card" autoComplete="cc-number" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Expiration date (MM / YY)" defaultValue={MOCK.cardExp} name="cardExp" autoComplete="cc-exp" />
                  <Field label="Security code" defaultValue={MOCK.cardCvc} name="cardCvc" autoComplete="cc-csc" />
                </div>
                <Field label="Name on card" defaultValue={MOCK.cardName} name="cardName" autoComplete="cc-name" />
              </div>
            </div>
            <CheckboxRow defaultChecked label="Use shipping address as billing address" />
          </Section>

          {/* Remember me */}
          <Section title="Remember me">
            <div className="overflow-hidden" style={{ border: `1px solid ${C.border}`, borderRadius: 8 }}>
              <label
                className="flex items-start gap-3 px-4 py-3.5 cursor-pointer"
                style={{ background: rememberMe ? "#F0E8FA" : C.scheme1 }}
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mt-0.5 h-[18px] w-[18px]"
                  style={{ accentColor: "#5A31F4" }}
                />
                <span className="text-[14px]">
                  <span className="font-medium">Save my information for a faster checkout</span>
                  <span className="block mt-0.5 text-[13px]" style={{ color: C.inkSubdued }}>
                    With a Shop account
                    <span aria-hidden className="inline-flex items-center mx-1 px-1.5 py-0.5 rounded text-white text-[10px] font-bold" style={{ background: "#5A31F4" }}>
                      shop
                    </span>
                    securely save your info on millions of businesses.
                  </span>
                </span>
              </label>
              {rememberMe && (
                <div className="px-4 py-4 border-t space-y-2" style={{ borderColor: C.border, background: "#FFFFFF" }}>
                  <Field label="Mobile phone number" defaultValue={MOCK.phone} name="rememberPhone" autoComplete="tel" />
                  <p className="text-[12px]" style={{ color: C.inkSubdued }}>
                    A verification code will be sent here. Standard message and data rates apply.
                  </p>
                </div>
              )}
            </div>
          </Section>

          {/* Checkout upsell — quiet, single offer */}
          {upgrade && (
            <div className="mt-8 border rounded-lg p-4 flex flex-wrap items-center justify-between gap-3" style={{ borderColor: C.border, background: "#F7F7F7" }}>
              <div>
                <p className="text-[13px] font-semibold" style={{ color: C.ink }}>
                  Make it {upgrade.entries} tickets instead
                </p>
                <p className="text-[12px]" style={{ color: C.inkSubdued }}>
                  {usdc(upgrade.priceUSD)} — save {usdc(upgrade.entries * 10 - upgrade.priceUSD)} vs. buying singles
                </p>
              </div>
              <button
                type="button"
                onClick={onUpgrade}
                className="text-[13px] font-medium px-4 py-2 rounded-md border transition-colors"
                style={{ borderColor: C.primary, color: C.primary }}
              >
                Upgrade order
              </button>
            </div>
          )}

          {/* Pay button */}
          <button
            type="submit"
            disabled={submitting}
            className="mt-8 w-full inline-flex items-center justify-center text-white text-[16px] font-medium transition-colors disabled:opacity-70 disabled:cursor-wait"
            style={{
              height: 56,
              background: submitting ? C.primaryHover : C.primary,
              borderRadius: 8,
            }}
            onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = C.primaryHover; }}
            onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = C.primary; }}
          >
            {submitting ? "Processing…" : "Pay now"}
          </button>

          {/* Footer */}
          <footer className="mt-10 pt-6 border-t flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-3" style={{ borderColor: C.border }}>
            <p className="text-[12px]" style={{ color: C.inkSubdued }}>
              Powered by <strong style={{ color: C.ink }}>shopify</strong>
            </p>
            <nav className="flex flex-wrap gap-4 text-[13px]">
              <a href="#" style={{ color: C.accent }}>Refund policy</a>
              <a href="#" style={{ color: C.accent }}>Shipping</a>
              <a href="#" style={{ color: C.accent }}>Privacy</a>
              <a href="#" style={{ color: C.accent }}>Terms of service</a>
            </nav>
          </footer>
        </form>

        {/* RIGHT — order summary (desktop only) */}
        <aside
          className="hidden lg:block px-10 py-10 lg:sticky lg:top-0 self-start"
          style={{ background: C.scheme2 }}
        >
          <h2 className="sr-only">Order summary</h2>
          <Summary />
        </aside>
      </div>

      {/* Submitting overlay */}
      {submitting && (
        <div className="fixed inset-0 z-50 bg-white/95 flex items-center justify-center" style={{ fontFamily: FONT_STACK }}>
          <div className="text-center px-5">
            <div className="mx-auto h-10 w-10 border-4 rounded-full animate-spin" style={{ borderColor: C.border, borderTopColor: C.primary }} />
            <p className="mt-5 text-[15px]" style={{ color: C.ink }}>Processing payment…</p>
            <p className="mt-1 text-[12px]" style={{ color: C.inkSubdued }}>Returning to Generous Motors</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------- atomic helpers ----------------- */

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="text-[19px] font-medium" style={{ color: "#000" }}>{title}</h2>
      {sub && <p className="mt-1 text-[13px]" style={{ color: "rgba(0,0,0,0.56)" }}>{sub}</p>}
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block relative">
      <span className="absolute left-3 top-1.5 text-[11px]" style={{ color: "rgba(0,0,0,0.56)" }}>{label}</span>
      <input
        {...rest}
        className="w-full pt-6 pb-2 px-3 text-[16px] bg-white outline-none focus:ring-2 focus:ring-[#1773b0]/30"
        style={{ border: `1px solid #C9C2C2`, borderRadius: 8, color: "#000" }}
      />
    </label>
  );
}

function Select({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <label className="block relative">
      <span className="absolute left-3 top-1.5 text-[11px]" style={{ color: "rgba(0,0,0,0.56)" }}>{label}</span>
      <select
        defaultValue={defaultValue}
        className="w-full pt-6 pb-2 px-3 text-[16px] bg-white outline-none focus:ring-2 focus:ring-[#1773b0]/30 appearance-none"
        style={{ border: `1px solid #C9C2C2`, borderRadius: 8, color: "#000" }}
      >
        <option>{defaultValue}</option>
      </select>
      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(0,0,0,0.56)" }} />
    </label>
  );
}

function StateSelect({ defaultValue }: { defaultValue: string }) {
  const states = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];
  return (
    <label className="block relative">
      <span className="absolute left-3 top-1.5 text-[11px]" style={{ color: "rgba(0,0,0,0.56)" }}>State</span>
      <select
        defaultValue={defaultValue}
        className="w-full pt-6 pb-2 px-3 text-[16px] bg-white outline-none focus:ring-2 focus:ring-[#1773b0]/30 appearance-none"
        style={{ border: `1px solid #C9C2C2`, borderRadius: 8, color: "#000" }}
      >
        {states.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(0,0,0,0.56)" }} />
    </label>
  );
}

function CheckboxRow({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2.5 text-[14px] cursor-pointer" style={{ color: "#000" }}>
      <input type="checkbox" defaultChecked={defaultChecked} className="h-[18px] w-[18px]" style={{ accentColor: "#1773B0" }} />
      <span>{label}</span>
    </label>
  );
}

function ExpressBtn({ label, tone, className }: { label: string; tone: "shoppay" | "paypal" | "gpay"; className?: string }) {
  const styles: Record<typeof tone, React.CSSProperties> = {
    shoppay: { background: "#5A31F4", color: "#fff" },
    paypal: { background: "#FFC439", color: "#003087" },
    gpay: { background: "#FFFFFF", color: "#000", border: "1px solid #C9C2C2" },
  };
  return (
    <button
      type="button"
      className={`h-12 inline-flex items-center justify-center text-[14px] font-semibold ${className ?? ""}`}
      style={{ borderRadius: 8, ...styles[tone] }}
    >
      {tone === "shoppay" && <span className="inline-flex items-center gap-1.5"><span className="font-extrabold text-[15px]">Shop</span><span className="font-extrabold text-[15px]">Pay</span></span>}
      {tone === "paypal" && <span className="font-extrabold italic text-[15px]">PayPal</span>}
      {tone === "gpay" && <span><span className="font-medium">G</span> Pay</span>}
      {label && tone !== "shoppay" && tone !== "paypal" && tone !== "gpay" && label}
    </button>
  );
}

/** Real card-face SVG marks. 38 x 24 viewbox to match Shopify checkout sizing. */
function CardShell({ children, fill }: { children: React.ReactNode; fill: string }) {
  return (
    <span
      className="inline-flex items-center justify-center"
      style={{ width: 38, height: 24, borderRadius: 4, background: fill, border: "1px solid rgba(0,0,0,0.08)" }}
    >
      <svg width="38" height="24" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>{children}</svg>
    </span>
  );
}

function VisaMark() {
  return (
    <CardShell fill="#1A1F71">
      {/* "VISA" wordmark — letterforms drawn as paths so we don't depend on fonts */}
      <g fill="#FFFFFF">
        <path d="M11.6 16.2L13.3 8.1H15.9L14.2 16.2H11.6Z"/>
        <path d="M22.7 8.3C22.1 8.1 21.2 7.9 20.2 7.9C17.9 7.9 16.3 9 16.3 10.6C16.3 11.8 17.5 12.5 18.4 12.9C19.3 13.3 19.6 13.6 19.6 14C19.6 14.6 18.8 14.8 18.1 14.8C17.1 14.8 16.5 14.7 15.7 14.4L15.3 14.2L14.9 16.4C15.5 16.6 16.6 16.8 17.7 16.8C20.2 16.8 21.7 15.7 21.7 14C21.7 13 21 12.2 19.5 11.6C18.6 11.2 18.1 10.9 18.1 10.5C18.1 10.1 18.5 9.7 19.5 9.7C20.3 9.7 20.9 9.9 21.3 10L21.6 10.1L22.7 8.3Z"/>
        <path d="M29.4 8.1H27.4C26.8 8.1 26.4 8.3 26.1 8.9L22.6 16.2H25.1L25.6 14.9H28.6L28.9 16.2H31.1L29.4 8.1ZM26.3 13.2C26.5 12.7 27.3 10.6 27.3 10.6L27.6 9.9L27.8 10.6C27.8 10.6 28.3 12.8 28.4 13.2H26.3Z"/>
        <path d="M9.6 8.1L7.1 13.7L6.8 12.4C6.4 10.9 5 9.2 3.5 8.4L5.8 16.2H8.3L12 8.1H9.6Z"/>
        <path d="M4.6 8.1H0.8L0.8 8.3C3.7 9 5.6 10.7 6.4 12.7L5.6 8.9C5.5 8.3 5.1 8.1 4.6 8.1Z" fill="#F7B600"/>
      </g>
    </CardShell>
  );
}

function MastercardMark() {
  return (
    <CardShell fill="#FFFFFF">
      <circle cx="15" cy="12" r="6.5" fill="#EB001B" />
      <circle cx="23" cy="12" r="6.5" fill="#F79E1B" />
      <path
        d="M19 7.2c1.6 1.2 2.6 3.1 2.6 5.3 0 2.2-1 4.1-2.6 5.3-1.6-1.2-2.6-3.1-2.6-5.3 0-2.2 1-4.1 2.6-5.3z"
        fill="#FF5F00"
      />
    </CardShell>
  );
}

function AmexMark() {
  return (
    <CardShell fill="#006FCF">
      <g fill="#FFFFFF">
        {/* "AMERICAN EXPRESS" stacked — uses paths for AMEX letters at center */}
        <text
          x="19" y="11"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="4"
          fontWeight="700"
          textAnchor="middle"
          fill="#FFFFFF"
          letterSpacing="0.3"
        >
          AMERICAN
        </text>
        <text
          x="19" y="17"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="4"
          fontWeight="700"
          textAnchor="middle"
          fill="#FFFFFF"
          letterSpacing="0.3"
        >
          EXPRESS
        </text>
      </g>
    </CardShell>
  );
}

function DiscoverMark() {
  return (
    <CardShell fill="#FFFFFF">
      {/* Discover — gray text "DISCOVER" with the orange dot mark */}
      <g>
        <text
          x="19" y="14"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="5"
          fontWeight="800"
          textAnchor="middle"
          fill="#231F20"
          letterSpacing="0.2"
        >
          DISC
        </text>
        <circle cx="29" cy="12" r="4" fill="#FF6000" />
      </g>
    </CardShell>
  );
}

function Row({ k, v, muted }: { k: string; v: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[14px]">
      <span style={{ color: muted ? "rgba(0,0,0,0.56)" : "#000" }}>{k}</span>
      <span className="tabular-nums" style={{ color: "#000" }}>{v}</span>
    </div>
  );
}
