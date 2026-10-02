import type { Metadata, Viewport } from "next";
import { Teaser } from "@/components/teaser/teaser";

export const metadata: Metadata = {
  title: "Generous Motors — Launching soon",
  description: "Something big is pulling up. Drop your email to be first in line when Generous Motors launches.",
};

// Cream browser chrome to match the light lander.
export const viewport: Viewport = { themeColor: "#f1e9d3" };

export default function Page() {
  return <Teaser />;
}
