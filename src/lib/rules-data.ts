// Official Rules sections — seeded into Shopify `rule_section` metaobjects, and
// used as the fallback when Shopify is unreachable. Client-safe (pure data).
//
// Bodies may contain {tokens} for the cycle's dynamic values; fill them with
// fillRuleTokens() at render time so Kevin can edit the prose in Shopify while
// the live cycle number / charity / vehicle stay correct.
export type RuleSection = { title: string; body: string };

export type RuleTokens = {
  cycle: string | number;
  charity: string;
  vehicle: string; // e.g. "2024 Chevrolet Corvette (Stingray)"
  value: string;   // formatted USD
  drawWhen: string; // formatted draw date/time (ET)
};

export function fillRuleTokens(body: string, t: RuleTokens): string {
  return body
    .replaceAll("{cycle}", String(t.cycle))
    .replaceAll("{charity}", t.charity)
    .replaceAll("{vehicle}", t.vehicle)
    .replaceAll("{value}", t.value)
    .replaceAll("{drawWhen}", t.drawWhen);
}

export const DEFAULT_RULES: RuleSection[] = [
  {
    title: "Sponsor & operator",
    body: "The drawing is operated by Generous Motors Foundation, Inc., a Florida not-for-profit corporation recognized by the IRS as a 501(c)(3) charitable organization, with its principal place of business at 2900 NW 2nd Avenue, Miami, Florida 33127 (“Generous Motors”).",
  },
  {
    title: "Eligibility",
    body: "Open to legal residents of the 50 United States and the District of Columbia who are 18 years of age or older at the time of entry. Employees, directors, and officers of Generous Motors, and members of their immediate households, are not eligible. Void where prohibited by law.",
  },
  {
    title: "How to enter",
    body: "(a) Ticket entry: purchase raffle tickets on the Tickets page or through a membership; each ticket equals one entry into the cycle’s drawing. (b) Free alternate method of entry: hand-print your full name, mailing address, phone number, email, and date of birth on a 3″×5″ card and mail it in a stamped envelope to “Cycle {cycle} Free Entry, Generous Motors Foundation, Inc., 2900 NW 2nd Avenue, Miami, FL 33127.” One free entry per outer envelope. Free entries have equal odds and are printed onto identical paper tickets and placed in the same drum as all other entries.",
  },
  {
    title: "The drawing — date, hour, and place",
    body: "The cycle {cycle} winner will be selected on {drawWhen} (ET), streamed live on Facebook Live and archived to YouTube, from the Generous Motors garage in Miami, Florida. Every entry is printed onto a physical paper ticket and drawn by hand from a rotating drum on camera. No winner is predetermined and the selection is not rigged in any way.",
  },
  {
    title: "Prize & source of prize funds",
    body: "One (1) grand prize: a {vehicle}, approximate retail value {value}, or the disclosed cash equivalent at the winner’s election at claim time. Prizes are purchased with proceeds from ticket sales for the cycle and, where needed, the general funds of Generous Motors Foundation, Inc. All federal, state, and local taxes are the winner’s sole responsibility; an IRS Form 1099 will be issued.",
  },
  {
    title: "Odds of winning",
    body: "Odds of winning depend on the total number of entries received for cycle {cycle}.",
  },
  {
    title: "Winner notification & claim",
    body: "The winner is announced on the live stream and contacted by phone and email within 24 hours. Vehicle delivery, registration, and title transfer are arranged within approximately 30 days of verification. If a winner cannot be reached within 14 days or is ineligible, a replacement winner is drawn from the same drum on a recorded stream.",
  },
  {
    title: "Charity commitment",
    body: "10% of the cycle’s proceeds is paid to the cycle’s named partner charity ({charity} for cycle {cycle}). The wire receipt is published on the blog within seven business days of the cycle close.",
  },
  {
    title: "Governing law",
    body: "The drawing is conducted in accordance with Section 849.0935, Florida Statutes. These rules are governed by the laws of the State of Florida. By entering, entrants agree to be bound by these Official Rules and the decisions of Generous Motors, which are final.",
  },
];
