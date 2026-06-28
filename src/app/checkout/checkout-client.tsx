"use client";
import { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, ShieldCheck, ChevronRight, CreditCard } from "lucide-react";
import {
  activeDraw,
  ticketTiers,
  membershipTiers,
} from "@/lib/mock-data";
import { usdc } from "@/lib/format";

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
        kind: "membership" as const,
        name: `${m.name} Membership`,
        sub: `${m.monthlyEntries} entries / cycle · auto-enrolled`,
        priceUSD: m.monthlyUSD,
        recurring: true,
        entries: m.monthlyEntries,
        membershipId: m.id,
      };
    }
    // If qty is set explicitly, charge flat $10/ticket and override entries.
    if (qtyParam > 0) {
      return {
        kind: "ticket" as const,
        name: `${qtyParam} ${qtyParam === 1 ? "ticket" : "tickets"}`,
        sub: `Cycle ${activeDraw.cycle} · ${activeDraw.vehicle.year} ${activeDraw.vehicle.make} ${activeDraw.vehicle.model}`,
        priceUSD: qtyParam * 10,
        recurring: false,
        entries: qtyParam,
        tierId: "t-custom",
      };
    }
    const t = ticketTiers.find((x) => x.id === tierId) ?? ticketTiers[2];
    return {
      kind: "ticket" as const,
      name: `${t.entries} ${t.entries === 1 ? "ticket" : "tickets"}`,
      sub: `Cycle ${activeDraw.cycle} · ${activeDraw.vehicle.year} ${activeDraw.vehicle.make} ${activeDraw.vehicle.model}`,
      priceUSD: t.priceUSD,
      recurring: false,
      entries: t.entries,
      tierId: t.id,
    };
  }, [tierId, qtyParam, type]);

  const charityCut = +(item.priceUSD * 0.10).toFixed(2);
  const subtotal = item.priceUSD;
  const taxes = 0;
  const total = subtotal + taxes;

  const [submitting, setSubmitting] = useState(false);

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
    try {
      sessionStorage.setItem("gm:lastOrder", JSON.stringify(payload));
    } catch {}
    setTimeout(() => router.push(`/thank-you?order=${draftId}`), 750);
  };

  return (
    <div className="bg-paper-3 border-t border-ink">
      <header className="border-b border-ink bg-paper-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link
            href="/"
            className="flex items-center gap-2.5"
          >
            <span aria-hidden className="inline-flex h-8 w-8 items-center justify-center bg-ink text-paper font-condensed font-bold text-base leading-none border border-ink">G</span>
            <span className="flex flex-col leading-[1]">
              <span className="font-condensed uppercase tracking-[0.22em] text-[9px] text-ink-3">Generous</span>
              <span className="font-display font-bold text-[18px] -mt-0.5 tracking-tight">Motors</span>
            </span>
          </Link>
          <nav aria-label="Checkout steps" className="hidden sm:flex items-center gap-2 font-condensed uppercase tracking-[0.22em] text-[11px] text-ink-3">
            <span className="text-ink-2">Cart</span>
            <ChevronRight size={12} />
            <strong className="text-ink">Information</strong>
            <ChevronRight size={12} />
            <span>Shipping</span>
            <ChevronRight size={12} />
            <span>Payment</span>
          </nav>
          <span className="inline-flex items-center gap-1.5 font-condensed uppercase tracking-[0.22em] text-[11px] text-ink-3">
            <Lock size={12} /> Secure
          </span>
        </div>
      </header>

      <form
        onSubmit={onPay}
        className="mx-auto grid max-w-6xl gap-12 px-5 py-10 lg:grid-cols-[1fr_420px] lg:gap-16"
      >
        {/* LEFT: form */}
        <div className="space-y-10 order-2 lg:order-1">
          <Section title="Express checkout" pill="instant">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <ExpressBtn label="Shop Pay" />
              <ExpressBtn label="PayPal" />
              <ExpressBtn label="Apple Pay" />
              <ExpressBtn label="Google Pay" />
            </div>
            <div className="my-6 flex items-center gap-3 font-condensed uppercase tracking-[0.22em] text-[11px] text-ink-3">
              <span className="h-px flex-1 bg-rule-soft" /> or <span className="h-px flex-1 bg-rule-soft" />
            </div>
          </Section>

          <Section title="Contact">
            <Field label="Email" defaultValue={MOCK.email} type="email" name="email" autoComplete="email" />
            <label className="mt-2 flex items-center gap-2 text-[14px] text-ink-2 font-serif">
              <input type="checkbox" defaultChecked className="h-4 w-4 border-ink" />
              Email me draw updates and winner reveals
            </label>
          </Section>

          <Section title="Shipping address" sub="Only used to mail your free t-shirt if your tier includes one — and to verify identity if you win.">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name" defaultValue={MOCK.firstName} name="firstName" autoComplete="given-name" />
              <Field label="Last name" defaultValue={MOCK.lastName} name="lastName" autoComplete="family-name" />
            </div>
            <Field label="Address" defaultValue={MOCK.address1} name="address1" autoComplete="address-line1" />
            <Field label="Apartment, suite, etc. (optional)" defaultValue={MOCK.address2} name="address2" autoComplete="address-line2" />
            <div className="grid grid-cols-3 gap-3">
              <Field label="City" defaultValue={MOCK.city} name="city" autoComplete="address-level2" className="col-span-3 sm:col-span-1" />
              <Select label="State" defaultValue={MOCK.state} name="state" className="col-span-3 sm:col-span-1" />
              <Field label="ZIP" defaultValue={MOCK.zip} name="zip" autoComplete="postal-code" className="col-span-3 sm:col-span-1" />
            </div>
            <Field label="Phone" defaultValue={MOCK.phone} name="phone" autoComplete="tel" />
          </Section>

          <Section title="Payment" sub="All transactions are secure and encrypted." pill="Stripe">
            <div className="border border-ink bg-paper-2 p-4 grid gap-3">
              <Field label="Card number" defaultValue={MOCK.cardNumber} icon={<CreditCard size={14} className="text-ink-3" />} name="card" autoComplete="cc-number" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Expiration (MM/YY)" defaultValue={MOCK.cardExp} name="cardExp" autoComplete="cc-exp" />
                <Field label="Security code" defaultValue={MOCK.cardCvc} name="cardCvc" autoComplete="cc-csc" />
              </div>
              <Field label="Name on card" defaultValue={MOCK.cardName} name="cardName" autoComplete="cc-name" />
            </div>
            <label className="mt-3 flex items-center gap-2 text-[14px] text-ink-2 font-serif">
              <input type="checkbox" defaultChecked className="h-4 w-4 border-ink" />
              Billing address is the same as shipping
            </label>
          </Section>

          <Section title="Age & eligibility">
            <label className="flex items-start gap-3 text-[14px] text-ink-2 font-serif">
              <input type="checkbox" defaultChecked className="mt-1 h-4 w-4 border-ink" />
              <span>
                I am 18 or older and a legal resident of the 50 United States or D.C. I&apos;ve read the{" "}
                <Link href="/legal/rules" className="underline">Official Rules</Link> and the{" "}
                <Link href="/legal/play" className="underline">Responsible Play</Link> note.
              </span>
            </label>
          </Section>

          <div className="flex flex-col gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-14 items-center justify-center bg-accent text-paper-3 border border-accent font-condensed uppercase tracking-[0.22em] text-[13px] hover:bg-ink hover:border-ink disabled:opacity-60"
            >
              {submitting ? "Processing…" : `Pay ${usdc(total)}`}
            </button>
            <p className="text-center font-condensed uppercase tracking-[0.22em] text-[10px] text-ink-3 inline-flex items-center justify-center gap-2">
              <ShieldCheck size={12} className="text-charity" /> Mock checkout. No real card is charged.
            </p>
          </div>
        </div>

        {/* RIGHT: order summary */}
        <aside className="order-1 lg:order-2 lg:sticky lg:top-24 self-start border border-ink bg-paper-2 p-6">
          <p className="section-eyebrow section-eyebrow-rule">Order summary</p>
          <ul className="mt-5 space-y-4">
            <li className="flex gap-4">
              <div
                className="h-16 w-16 border border-ink"
                style={{
                  background:
                    "linear-gradient(135deg, #0e0e0e, #221814 60%, #5b3a1c)",
                }}
                aria-hidden
              />
              <div className="flex-1">
                <p className="font-display font-bold text-ink leading-tight">{item.name}</p>
                <p className="dateline leading-tight mt-1">{item.sub}</p>
              </div>
              <p className="tabular-nums font-condensed font-semibold">
                {usdc(item.priceUSD)}{item.recurring && <span className="text-ink-3 text-[12px]">/mo</span>}
              </p>
            </li>
          </ul>

          <div className="mt-6 border border-charity bg-charity-soft p-3 text-[13px] text-charity flex items-start gap-2">
            <ShieldCheck size={14} className="mt-0.5 shrink-0" />
            <p>
              <strong>{usdc(charityCut)}</strong> of this purchase goes directly to <strong>{activeDraw.charity.name}</strong>.
            </p>
          </div>

          <div className="mt-6 space-y-2 text-[15px]">
            <Row k="Subtotal" v={usdc(subtotal)} />
            <Row k="Shipping" v={item.recurring ? "—" : "Free"} />
            <Row k="Taxes" v={usdc(taxes)} sub="non-profit ticket purchase" />
            <Row k="Charity allocation" v={`-${usdc(charityCut)}`} muted sub="already counted in price" />
          </div>
          <div className="mt-4 pt-4 border-t border-ink flex items-center justify-between">
            <span className="font-condensed uppercase tracking-[0.22em] text-[11px] text-ink-2">Total</span>
            <span className="font-condensed font-semibold numeral text-2xl text-ink tabular-nums">{usdc(total)}{item.recurring && <span className="text-ink-3 text-sm"> / mo</span>}</span>
          </div>

          <p className="mt-6 text-[12px] text-ink-3 font-serif italic">
            See{" "}
            <Link href="/legal/rules" className="underline">Official Rules</Link>.
          </p>
        </aside>
      </form>
    </div>
  );
}

function Section({
  title,
  sub,
  pill,
  children,
}: { title: string; sub?: string; pill?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center justify-between gap-3 border-b border-rule-soft pb-3">
        <h2 className="font-display font-bold text-xl text-ink">{title}</h2>
        {pill && (
          <span className="font-condensed uppercase tracking-[0.22em] text-[10px] text-ink-2 border border-ink-3 px-2 py-0.5">
            {pill}
          </span>
        )}
      </div>
      {sub && <p className="mt-2 text-[13px] text-ink-3 font-serif italic">{sub}</p>}
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  icon,
  className = "",
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; icon?: React.ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="font-condensed uppercase tracking-[0.22em] text-[10px] text-ink-3">{label}</span>
      <span className="mt-1.5 flex h-12 items-center border border-ink bg-paper-3 px-3 focus-within:border-accent">
        {icon && <span className="mr-2">{icon}</span>}
        <input
          {...rest}
          className="w-full bg-transparent text-[16px] text-ink placeholder:text-ink-3 outline-none"
        />
      </span>
    </label>
  );
}

function Select({ label, defaultValue, name, className = "" }: { label: string; defaultValue: string; name: string; className?: string }) {
  const states = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];
  return (
    <label className={`block ${className}`}>
      <span className="font-condensed uppercase tracking-[0.22em] text-[10px] text-ink-3">{label}</span>
      <span className="mt-1.5 flex h-12 items-center border border-ink bg-paper-3 px-3 focus-within:border-accent">
        <select
          name={name}
          defaultValue={defaultValue}
          className="w-full bg-transparent text-[16px] text-ink outline-none"
        >
          {states.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </span>
    </label>
  );
}

function ExpressBtn({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="h-11 border border-ink bg-ink text-paper font-condensed uppercase tracking-[0.22em] text-[11px] hover:bg-accent hover:border-accent"
    >
      {label}
    </button>
  );
}

function Row({ k, v, sub, muted }: { k: string; v: string; sub?: string; muted?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className={muted ? "text-ink-3" : "text-ink-2"}>{k}</p>
        {sub && <p className="dateline">{sub}</p>}
      </div>
      <p className={`tabular-nums numeral ${muted ? "text-ink-3" : "text-ink"}`}>{v}</p>
    </div>
  );
}
