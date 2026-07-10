// Campaign manager (demo) — the weekly newsletter and SMS blasts.
// Compose, save drafts, and "send" (marks sent to the current subscriber
// list and stamps mock delivery stats). Attached promos generate the
// trigger links that the tickets pages pick up.

export type Campaign = {
  id: string;
  channel: "email" | "sms";
  subject?: string; // email only
  body: string;
  /** Attached promo code — the send links to /tickets?promo=CODE. */
  promoCode?: string;
  status: "draft" | "sent";
  createdISO: string;
  sentISO?: string;
  recipients?: number;
  opens?: number;
  clicks?: number;
};

const STORAGE_KEY = "gm:campaigns-v1";
export const CAMPAIGNS_EVENT = "gm:campaigns-updated";

const SEED: Campaign[] = [
  {
    id: "c-e-024",
    channel: "email",
    subject: "Cycle 12 is live — the Z06 is on the drum",
    body: "The Accelerate Yellow Z06 is loaded. Subscribers get 2X entries on every ticket this week.",
    promoCode: "EMAIL2X",
    status: "sent",
    createdISO: "2026-07-01T09:00:00-04:00",
    sentISO: "2026-07-02T10:00:00-04:00",
    recipients: 4218,
    opens: 2320,
    clicks: 861,
  },
  {
    id: "c-s-017",
    channel: "sms",
    body: "GM: VIP flash deal — 3X entries on the Z06 draw thru Sunday. gm.org/t?promo=VIP3X Reply STOP to opt out",
    promoCode: "VIP3X",
    status: "sent",
    createdISO: "2026-07-05T15:00:00-04:00",
    sentISO: "2026-07-05T17:00:00-04:00",
    recipients: 1874,
    opens: 1836,
    clicks: 512,
  },
];

export function getCampaigns(channel?: Campaign["channel"]): Campaign[] {
  if (typeof window === "undefined") return SEED;
  let list: Campaign[];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    list = raw ? (JSON.parse(raw) as Campaign[]) : SEED;
  } catch {
    list = SEED;
  }
  return channel ? list.filter((c) => c.channel === channel) : list;
}

function persist(list: Campaign[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(CAMPAIGNS_EVENT));
}

export function saveCampaign(c: Omit<Campaign, "id" | "createdISO" | "status">): Campaign {
  const campaign: Campaign = {
    ...c,
    id: `c-${c.channel[0]}-${Math.random().toString(36).slice(2, 7)}`,
    createdISO: new Date().toISOString(),
    status: "draft",
  };
  persist([campaign, ...getCampaigns()]);
  return campaign;
}

/** "Send" — stamps the campaign sent with mock delivery stats for the demo. */
export function sendCampaign(id: string, recipients: number) {
  const list = getCampaigns().map((c) => {
    if (c.id !== id) return c;
    const openRate = c.channel === "sms" ? 0.98 : 0.55;
    const clickRate = c.channel === "sms" ? 0.27 : 0.2;
    return {
      ...c,
      status: "sent" as const,
      sentISO: new Date().toISOString(),
      recipients,
      opens: Math.round(recipients * openRate),
      clicks: Math.round(recipients * clickRate),
    };
  });
  persist(list);
}

export function deleteCampaign(id: string) {
  persist(getCampaigns().filter((c) => c.id !== id));
}
