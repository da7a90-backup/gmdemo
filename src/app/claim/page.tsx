import type { Metadata, Viewport } from "next";
import { ClaimShell } from "@/components/teaser/claim-shell";

export const metadata: Metadata = { title: "Claim your free ticket — Generous Motors", robots: { index: false } };
export const viewport: Viewport = { themeColor: "#0a0a0a", colorScheme: "dark" };

export default async function ClaimPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <ClaimShell token={token ?? ""} />;
}
