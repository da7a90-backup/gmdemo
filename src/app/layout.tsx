import type { Metadata } from "next";
import "./globals.css";
import { SiteShell } from "@/components/site-shell";
import { EmailPopup } from "@/components/email-popup";

export const metadata: Metadata = {
  title: "Generous Motors — Drive the car. Fund the cause.",
  description:
    "A US 501(c)(3) car raffle. One ticket enters you to win. 10% of every cycle goes to a real charity. Drawn live, on camera, every cycle.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Preload the above-the-fold General Sans weights (body 400, condensed
            labels 500, display headline 700). crossOrigin is required even for
            same-origin font preloads or the browser discards them and refetches. */}
        <link rel="preload" href="/fonts/general-sans-400.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/general-sans-500.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/general-sans-700.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <SiteShell>{children}</SiteShell>
        <EmailPopup />
      </body>
    </html>
  );
}
