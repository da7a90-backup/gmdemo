import type { Metadata } from "next";
import { Source_Serif_4, Oswald } from "next/font/google";
import "./globals.css";
import { SiteShell } from "@/components/site-shell";
import { EmailPopup } from "@/components/email-popup";

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Generous Motors — Drive the car. Fund the cause.",
  description:
    "A US 501(c)(3) car raffle. One ticket enters you to win. 10% of every cycle goes to a real charity. Drawn live, on camera, every cycle.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${sourceSerif.variable} ${oswald.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <SiteShell>{children}</SiteShell>
        <EmailPopup />
      </body>
    </html>
  );
}
