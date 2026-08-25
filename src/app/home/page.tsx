import { Hero } from "@/components/hero";
import { WinnersCarousel } from "@/components/winners-carousel";
import { HowItWorks } from "@/components/how-it-works";
import { PricingTiers } from "@/components/pricing-tiers";
import { CharityBand } from "@/components/charity-band";
import { LiveDrawBlock } from "@/components/live-draw-block";
import { FAQAccordion } from "@/components/faq-accordion";

// The real Generous Motors homepage. Served at /beta (the public site lives under
// /beta/*); the bare "/" shows the coming-soon teaser instead.
export default function HomePage() {
  return (
    <>
      <Hero />
      <WinnersCarousel />
      <HowItWorks />
      <PricingTiers />
      <CharityBand />
      <LiveDrawBlock />
      <FAQAccordion />
    </>
  );
}
