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
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <SiteShell>{children}</SiteShell>
        <EmailPopup />
      </body>
    </html>
  );
}
