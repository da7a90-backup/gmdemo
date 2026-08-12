// Mock data for the non-functional Generous Motors demo.
// All values are illustrative; nothing here represents real entries, winners, or donations.

export type Draw = {
  id: string;
  slug: string;
  status: "active" | "closed";
  cycle: number;
  vehicle: {
    year: number;
    make: string;
    model: string;
    trim: string;
    valueUSD: number;
    /** First entry is the primary; the rest are gallery alternates / hover swap. */
    images: string[];
    /** Convenience alias for the first image. */
    image: string;
    /** Headline performance figures — big stat tiles under the gallery. */
    headlineSpecs: { label: string; value: number; suffix: string; decimals?: number }[];
    /** Grouped spec-sheet rows. */
    specGroups: { title: string; rows: { k: string; v: string }[] }[];
  };
  charity: {
    name: string;
    blurb: string;
    logo: string;
    url: string;
  };
  drawDateISO: string;
  ticketsSold: number;
  pricePerTicketUSD: number;
};

export const draws: Draw[] = [
  {
    id: "draw-cycle-12",
    slug: "2024-corvette-z06",
    status: "active",
    cycle: 12,
    vehicle: {
      year: 2024,
      make: "Chevrolet",
      model: "Corvette",
      trim: "Z06 Coupe — Accelerate Yellow Metallic",
      valueUSD: 119000,
      images: [
        "/vehicles/corvette-z06-1.jpg", // primary — front 3/4 (C8 Z06)
        "/vehicles/corvette-z06-3.jpg", // hover swap on home — driver side (C7)
        "/vehicles/corvette-z06-2.jpg", // gallery — rear at car show
        "/vehicles/corvette-z06-4.jpg", // gallery — front grille detail
      ],
      image: "/vehicles/corvette-z06-1.jpg",
      headlineSpecs: [
        { label: "Horsepower", value: 670, suffix: " hp" },
        { label: "0–60 mph", value: 2.6, suffix: " s", decimals: 1 },
        { label: "Top speed", value: 195, suffix: " mph" },
        { label: "Redline", value: 8600, suffix: " rpm" },
      ],
      specGroups: [
        {
          title: "Powertrain",
          rows: [
            { k: "Engine", v: "5.5L LT6 flat-plane V8" },
            { k: "Induction", v: "Naturally aspirated" },
            { k: "Torque", v: "460 lb-ft @ 6,300 rpm" },
            { k: "Transmission", v: "8-speed dual-clutch" },
            { k: "Drive", v: "Mid-engine · RWD" },
          ],
        },
        {
          title: "Performance",
          rows: [
            { k: "0–60 mph", v: "2.6 seconds" },
            { k: "Quarter mile", v: "10.6 s @ 131 mph" },
            { k: "Top speed", v: "195 mph" },
            { k: "Redline", v: "8,600 rpm" },
            { k: "Exhaust", v: "Center-exit quad tips" },
          ],
        },
        {
          title: "Body & chassis",
          rows: [
            { k: "Layout", v: "2-seat targa coupe" },
            { k: "Wheels", v: "20″ front · 21″ rear" },
            { k: "Curb weight", v: "3,666 lb" },
            { k: "Paint", v: "Accelerate Yellow Metallic" },
            { k: "MSRP as configured", v: "$119,000" },
          ],
        },
      ],
    },
    charity: {
      name: "Habitat for Humanity",
      blurb:
        "Building strength, stability and self-reliance through shelter for families across the United States.",
      logo: "/charities/habitat.svg",
      url: "https://www.habitat.org/",
    },
    drawDateISO: "2026-07-18T19:00:00-04:00",
    ticketsSold: 3247,
    pricePerTicketUSD: 10,
  },
];

export const activeDraw = draws[0];

export type Tier = {
  id: string;
  name: string;
  priceUSD: number;
  entries: number;
  badge?: string;
  popular?: boolean;
  blurb?: string;
};

export const ticketTiers: Tier[] = [
  { id: "t-1",   name: "1 ticket",    priceUSD: 10,  entries: 1 },
  { id: "t-5",   name: "5 tickets",   priceUSD: 45,  entries: 5,   blurb: "Save $5" },
  { id: "t-10",  name: "10 tickets",  priceUSD: 85,  entries: 10,  badge: "Most picked", popular: true, blurb: "Save $15" },
  { id: "t-25",  name: "25 tickets",  priceUSD: 200, entries: 25,  blurb: "Save $50" },
  { id: "t-50",  name: "50 tickets",  priceUSD: 375, entries: 50,  blurb: "Save $125" },
  { id: "t-100", name: "100 tickets", priceUSD: 700, entries: 100, blurb: "Save $300" },
];

export type MembershipTier = {
  id: string;
  name: string;
  monthlyUSD: number;
  monthlyEntries: number;
  multiplierStart: number;
  shopDiscountPct: number;
  popular?: boolean;
  perks: string[];
};

export const membershipTiers: MembershipTier[] = [
  {
    id: "m-essential",
    name: "Essential",
    monthlyUSD: 19,
    monthlyEntries: 20,
    multiplierStart: 1.0,
    shopDiscountPct: 5,
    perks: [
      "20 auto-entries into every car draw",
      "Early access to bonus ticket offers",
      "Drawing alerts to your inbox",
      "1-click pause / cancel anytime",
    ],
  },
  {
    id: "m-premium",
    name: "Premium",
    monthlyUSD: 49,
    monthlyEntries: 60,
    multiplierStart: 1.05,
    shopDiscountPct: 15,
    popular: true,
    perks: [
      "60 auto-entries into every car draw",
      "Early access to bonus ticket offers",
      "Flash-sale alerts before they go public",
      "Drawing alerts to your inbox",
    ],
  },
  {
    id: "m-vip",
    name: "VIP",
    monthlyUSD: 149,
    monthlyEntries: 200,
    multiplierStart: 1.1,
    shopDiscountPct: 25,
    perks: [
      "200 auto-entries into every car draw",
      "First look at each new cycle before it goes public",
      "Member-only bonus multipliers",
      "Drawing alerts + flash-sale alerts",
    ],
  },
];

export type Winner = {
  id: string;
  firstName: string;
  lastInitial: string;
  city: string;
  state: string;
  vehicle: string;
  drawCycle: number;
  charity: string;
  quote: string;
  drawDateISO: string;
  photo: string;
  videoClipUrl?: string;
};

export const winners: Winner[] = [
  {
    id: "w-011",
    firstName: "Maria",
    lastInitial: "T",
    city: "Miami",
    state: "FL",
    vehicle: "1969 Mustang Fastback",
    drawCycle: 11,
    charity: "Habitat for Humanity",
    quote:
      "I sat down to watch on Facebook, and twenty minutes later my mom was screaming. Then the phone rang.",
    drawDateISO: "2026-05-31T19:00:00-04:00",
    photo: "/winners/maria-t.jpg",
  },
  {
    id: "w-010",
    firstName: "James",
    lastInitial: "R",
    city: "Houston",
    state: "TX",
    vehicle: "2023 Corvette Stingray",
    drawCycle: 10,
    charity: "St. Jude Children's",
    quote:
      "Knowing the cycle had already funded St. Jude before they pulled my ticket — that's the part that still hits.",
    drawDateISO: "2026-04-19T19:00:00-04:00",
    photo: "/winners/james-r.jpg",
  },
  {
    id: "w-009",
    firstName: "Angela",
    lastInitial: "P",
    city: "Tampa",
    state: "FL",
    vehicle: "Ford Bronco Heritage",
    drawCycle: 9,
    charity: "Feeding America",
    quote: "Real ticket, real drum, real phone call. I didn't believe any of it was real until they read my address.",
    drawDateISO: "2026-03-08T19:00:00-05:00",
    photo: "/winners/angela-p.jpg",
  },
  {
    id: "w-008",
    firstName: "Derek",
    lastInitial: "M",
    city: "Atlanta",
    state: "GA",
    vehicle: "Dodge Challenger SRT",
    drawCycle: 8,
    charity: "Boys & Girls Club",
    quote: "I keep showing my kids the clip. They like the drum part more than the car part.",
    drawDateISO: "2026-01-25T19:00:00-05:00",
    photo: "/winners/derek-m.jpg",
  },
  {
    id: "w-007",
    firstName: "Priya",
    lastInitial: "S",
    city: "Phoenix",
    state: "AZ",
    vehicle: "Porsche 911 Carrera",
    drawCycle: 7,
    charity: "World Central Kitchen",
    quote: "Bought one ticket for $10. Watched the stream live. Walked away with a 911. Madness.",
    drawDateISO: "2025-12-14T19:00:00-05:00",
    photo: "/winners/priya-s.jpg",
  },
  {
    id: "w-006",
    firstName: "Marcus",
    lastInitial: "T",
    city: "Dallas",
    state: "TX",
    vehicle: "Toyota Supra GR",
    drawCycle: 6,
    charity: "Make-A-Wish",
    quote: "Best part wasn't the car. Best part was the kid Make-A-Wish funded the day after, on stream.",
    drawDateISO: "2025-10-29T19:00:00-04:00",
    photo: "/winners/marcus-t.jpg",
  },
  {
    id: "w-005",
    firstName: "Sasha",
    lastInitial: "K",
    city: "Brooklyn",
    state: "NY",
    vehicle: "BMW M2 Competition",
    drawCycle: 5,
    charity: "Boys & Girls Club",
    quote: "I forgot I'd entered. Then they called my number on Facebook Live.",
    drawDateISO: "2025-09-12T19:00:00-04:00",
    photo: "/winners/sasha-k.jpg",
  },
  {
    id: "w-004",
    firstName: "Devon",
    lastInitial: "B",
    city: "Oakland",
    state: "CA",
    vehicle: "Acura NSX",
    drawCycle: 4,
    charity: "Feeding America",
    quote: "10% went to Feeding America that cycle. That's why I bought in. The car was a wild bonus.",
    drawDateISO: "2025-07-25T19:00:00-04:00",
    photo: "/winners/devon-b.jpg",
  },
];

export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  body: string;
  tag: "Behind the draw" | "Cycle update" | "Partner spotlight" | "Winner stories";
};

export const blogPosts: BlogPost[] = [
  {
    slug: "how-the-drum-works",
    title: "Yes, we really print the tickets and spin the drum",
    date: "2026-06-19",
    author: "Kevin S.",
    tag: "Behind the draw",
    excerpt:
      "Every entry becomes a physical paper ticket on draw day. Here is the whole process, from the printer to the barrel to the live call.",
    body: "Most online raffles draw with a random-number generator and call it a day. We do that too — but only after every entry has been printed onto real 60 lb ticket stock, dropped into a physical drum, and spun on camera. The reason is simple: a computer pick is easy to question, even when it's fair. A barrel pick on a livestream is impossible to argue with. We've drawn the same way every cycle since cycle 1 and have not had a reason to stop.",
  },
  {
    slug: "cycle-12-corvette-charity-pick",
    title: "Cycle 12: why Habitat for Humanity",
    date: "2026-06-12",
    author: "Maya R.",
    tag: "Partner spotlight",
    excerpt:
      "Each cycle's charity is chosen by the prior cycle's winner. Maria T. picked Habitat for Humanity for cycle 12. Here's why.",
    body: "After Maria won the 1969 Mustang in cycle 11, we asked her the question we ask every winner: who should the next cycle's 10% go to? She didn't even pause. Habitat for Humanity built her aunt's house in Hialeah after Hurricane Andrew. The full conversation, including why Maria refused to take the cash equivalent for the Mustang, is in this post.",
  },
  {
    slug: "what-our-501c3-means",
    title: "What being a 501(c)(3) actually changes",
    date: "2026-05-30",
    author: "Kevin S.",
    tag: "Behind the draw",
    excerpt:
      "Being IRS-recognized as a non-profit is not a slogan. Here is exactly what shifts: the receipts, the rules, the public 990, the audit trail.",
    body: "We're a registered 501(c)(3). 10% of every cycle goes directly to that cycle's nonprofit partner. Each cycle produces a receipt for the charity's records. The 10% you see on the home page is the same 10% the charity sees.",
  },
  {
    slug: "membership-explained",
    title: "Membership, in plain English",
    date: "2026-05-12",
    author: "Maya R.",
    tag: "Cycle update",
    excerpt:
      "Why we built the monthly tier and what it actually costs vs. one-off tickets.",
    body: "Members get entries every cycle automatically, plus early access to bonus ticket offers and drawing alerts. The math: at Premium ($49/mo) you receive 60 entries every cycle. Buying that same volume of one-off tickets averages out to about $147. The point is not the math though. The point is that you never forget to enter.",
  },
  {
    slug: "cycle-11-recap",
    title: "Cycle 11 in one minute: $487k raised, 1 Mustang gone",
    date: "2026-06-04",
    author: "Maya R.",
    tag: "Winner stories",
    excerpt:
      "Maria T. drove off in the '69 Fastback. Habitat for Humanity got a $48,700 check on the same stream.",
    body: "Cycle 11 closed with 48,729 entries. Gross was $487,290. 10% to Habitat for Humanity. Maria was on the phone within 90 seconds of the pull. The full stream replay is on YouTube; the cycle 11 reconciliation PDF is linked at the bottom of this post.",
  },
];

// Mock entries indexed by a "contact key" (email lower or phone digits) for the lookup page.
export type Entry = {
  id: string;
  drawCycle: number;
  drawSlug: string;
  vehicle: string;
  ticketCount: number;
  status: "active" | "won" | "did-not-win";
  purchasedAtISO: string;
  drawDateISO: string;
};

export type EntryRecord = {
  email: string;
  phone: string;
  fullName: string;
  active: Entry[];
  past: Entry[];
};

export const entryDB: EntryRecord[] = [
  {
    email: "demo@generousmotors.org",
    phone: "5550101234",
    fullName: "Demo Player",
    active: [
      {
        id: "e-001",
        drawCycle: 12,
        drawSlug: "2024-corvette-z06",
        vehicle: "2024 Corvette Z06",
        ticketCount: 10,
        status: "active",
        purchasedAtISO: "2026-06-18T14:22:00-04:00",
        drawDateISO: "2026-07-18T19:00:00-04:00",
      },
    ],
    past: [
      {
        id: "e-h001",
        drawCycle: 11,
        drawSlug: "1969-mustang-fastback-cycle11",
        vehicle: "1969 Mustang Fastback",
        ticketCount: 25,
        status: "did-not-win",
        purchasedAtISO: "2026-04-29T20:00:00-04:00",
        drawDateISO: "2026-05-31T19:00:00-04:00",
      },
      {
        id: "e-h002",
        drawCycle: 10,
        drawSlug: "2023-corvette-stingray",
        vehicle: "2023 Corvette Stingray",
        ticketCount: 10,
        status: "did-not-win",
        purchasedAtISO: "2026-03-30T11:42:00-04:00",
        drawDateISO: "2026-04-19T19:00:00-04:00",
      },
      {
        id: "e-h003",
        drawCycle: 6,
        drawSlug: "toyota-supra",
        vehicle: "Toyota Supra GR",
        ticketCount: 1,
        status: "did-not-win",
        purchasedAtISO: "2025-10-20T15:00:00-04:00",
        drawDateISO: "2025-10-29T19:00:00-04:00",
      },
    ],
  },
];

// Charity & cycle KPIs for headline counters.
export const lifetimeStats = {
  carsGivenAway: 11,
  lifetimePayoutUSD: 1083000,
  totalDonatedUSD: 487300,
  cyclesRun: 11,
  charitiesFunded: 8,
  ticketsCounted: 423191,
};

// Honest zero baseline — used as the fallback for the real DB stats so pages
// never invent payout/donation/car figures before there's real data.
export const zeroStats: typeof lifetimeStats = {
  carsGivenAway: 0,
  lifetimePayoutUSD: 0,
  totalDonatedUSD: 0,
  cyclesRun: 0,
  charitiesFunded: 0,
  ticketsCounted: 0,
};

// Purchase ledger for admin ticket printing — one row per completed order.
export type Purchase = {
  orderId: string;
  fullName: string;
  phone: string;
  email: string;
  drawCycle: number;
  ticketCount: number;
  purchasedAtISO: string;
};

export const purchases: Purchase[] = [
  { orderId: "GM-ORD-2413", fullName: "Demo Player",     phone: "(555) 010-1234", email: "demo@generousmotors.org", drawCycle: 12, ticketCount: 10, purchasedAtISO: "2026-06-18T14:22:00-04:00" },
  { orderId: "GM-ORD-2398", fullName: "Alicia Romero",   phone: "(305) 555-0142", email: "alicia.r@example.com",    drawCycle: 12, ticketCount: 25, purchasedAtISO: "2026-06-15T09:10:00-04:00" },
  { orderId: "GM-ORD-2371", fullName: "Marcus Boone",    phone: "(646) 555-0177", email: "mboone@example.com",      drawCycle: 12, ticketCount: 5,  purchasedAtISO: "2026-06-28T19:45:00-04:00" },
  { orderId: "GM-ORD-2344", fullName: "Priya Kapoor",    phone: "(512) 555-0128", email: "priya.k@example.com",     drawCycle: 12, ticketCount: 50, purchasedAtISO: "2026-07-03T11:05:00-04:00" },
  { orderId: "GM-ORD-2331", fullName: "Tom Callahan",    phone: "(216) 555-0193", email: "tcallahan@example.com",   drawCycle: 12, ticketCount: 1,  purchasedAtISO: "2026-07-08T08:30:00-04:00" },
  { orderId: "GM-ORD-2107", fullName: "Maria Torres",    phone: "(786) 555-0110", email: "maria.t@example.com",     drawCycle: 11, ticketCount: 25, purchasedAtISO: "2026-04-29T20:00:00-04:00" },
  { orderId: "GM-ORD-2093", fullName: "James Wheeler",   phone: "(919) 555-0164", email: "jwheeler@example.com",    drawCycle: 11, ticketCount: 10, purchasedAtISO: "2026-05-12T13:25:00-04:00" },
  { orderId: "GM-ORD-2075", fullName: "Demo Player",     phone: "(555) 010-1234", email: "demo@generousmotors.org", drawCycle: 11, ticketCount: 25, purchasedAtISO: "2026-04-29T20:00:00-04:00" },
  { orderId: "GM-ORD-1899", fullName: "Angela Fontaine", phone: "(504) 555-0135", email: "angela.f@example.com",    drawCycle: 10, ticketCount: 10, purchasedAtISO: "2026-03-22T17:55:00-04:00" },
  { orderId: "GM-ORD-1876", fullName: "Derek Fields",    phone: "(415) 555-0181", email: "derek.f@example.com",     drawCycle: 10, ticketCount: 100, purchasedAtISO: "2026-03-30T11:42:00-04:00" },
];
