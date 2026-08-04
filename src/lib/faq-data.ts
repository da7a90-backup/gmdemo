// FAQ defaults — seeded into Shopify `faq_item` metaobjects, and used as the
// client fallback when Shopify is unreachable. Client-safe (pure data).
export type FaqItem = { question: string; answer: string };

export const DEFAULT_FAQ: FaqItem[] = [
  { question: "How do I enter?", answer: "Pick a ticket tier on the Tickets page. Each tier comes with a set number of entries." },
  { question: "How do you pick the winner?", answer: "Every entry is printed onto paper, dropped into our drum, and pulled on a livestream. The stream is fully transparent and archived in full." },
  { question: "How do I know the draw is fair?", answer: "Three things: every entry is a physically printed paper ticket, the pull is on a livestream archived to YouTube forever, and our 990 is publicly filed (we are a 501(c)(3))." },
  { question: "What if I win — when do I get the car?", answer: "We call you on the stream and arrange delivery, registration, and title transfer typically within 30 days." },
  { question: "Can I take the cash instead?", answer: "Yes. Every prize has a cash equivalent disclosed in the cycle's Official Rules. You choose at claim time." },
  { question: "Where does the charity money go?", answer: "10% of every cycle goes directly to the cycle's named partner charity. Each cycle publishes a reconciliation PDF and signed receipt." },
  { question: "Can I cancel my membership?", answer: "Yes, in 1 click from your account. Already-issued entries for the current cycle stay valid; no refunds for entries already in the drum." },
  { question: "Who can enter?", answer: "Legal residents of the 50 United States and DC, age 18+. Void where prohibited. See Official Rules for full eligibility." },
  { question: "Where do I find the official rules?", answer: "At generousmotors.org/rules — also linked below, in the footer of every page, and from every ticket-purchase confirmation email." },
  { question: "How are my data and payment kept safe?", answer: "All payment is processed by Shopify with PCI-DSS Level 1 compliance. We don't store card numbers." },
  { question: "Who do I contact for support?", answer: "support@generousmotors.org — typical response under 12 hours." },
];
