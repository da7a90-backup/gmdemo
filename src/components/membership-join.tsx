"use client";
import { useRouter } from "next/navigation";
import { startMembershipCheckout } from "@/lib/checkout";

/** "Join {tier}" button for the server-rendered membership page — starts a real
 * Shopify subscription checkout, falling back to the demo checkout if unavailable. */
export function MembershipJoinButton({
  tier, id, className, children,
}: {
  tier: string; id: string; className?: string; children: React.ReactNode;
}) {
  const router = useRouter();
  const onClick = async () => {
    const redirected = await startMembershipCheckout(tier, { attr_source: "organic", attr_channel: "Organic", attr_page: "/membership" });
    if (!redirected) router.push(`/beta/checkout?tier=${id}&type=monthly`);
  };
  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}
