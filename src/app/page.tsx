import type { Metadata, Viewport } from "next";
import { Teaser } from "@/components/teaser/teaser";

export const metadata: Metadata = {
  title: "Generous Motors — Launching soon",
  description: "Something big is pulling up. Drop your email to be first in line when Generous Motors launches.",
};

// Dark browser chrome on the teaser so the mobile address bar matches the video.
export const viewport: Viewport = { themeColor: "#0a0a0a", colorScheme: "dark" };

export default function Page() {
  return <Teaser />;
}
