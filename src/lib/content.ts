// Site copy CMS (demo). Every editable string lives in this registry;
// the admin Content desk writes overrides to localStorage and the site
// picks them up through the <Copy k="..."/> component.

export type ContentField = {
  key: string;
  group: string;
  label: string;
  long?: boolean;
  def: string;
};

export const CONTENT_FIELDS: ContentField[] = [
  { key: "hero.h1.lead", group: "Homepage hero", label: "Headline — opening phrase", def: "Win the" },
  { key: "hero.h1.car", group: "Homepage hero", label: "Headline — teal italic word", def: "car." },
  { key: "hero.h1.fund", group: "Homepage hero", label: "Headline — second phrase", def: "Fund the" },
  { key: "hero.h1.cause", group: "Homepage hero", label: "Headline — marker-swipe word", def: "cause." },
  { key: "hero.promoLabel", group: "Homepage hero", label: "Countdown label", def: "Special promotion ends in" },
  { key: "hero.cta", group: "Homepage hero", label: "CTA button", def: "Enter now" },
  { key: "charity.eyebrow", group: "Charity band", label: "Eyebrow", def: "This cycle's partner" },
  { key: "charity.h.lead", group: "Charity band", label: "Heading — lead", def: "Ten percent." },
  { key: "charity.h.accent", group: "Charity band", label: "Heading — italic accent", def: "Paid first." },
  {
    key: "charity.body", group: "Charity band", label: "Supporting paragraph", long: true,
    def: "We pay charity on gross — before the car is bought, before payroll, before any expense. It is a smaller number than “net” would let us say. It is a number we can defend on camera.",
  },
  {
    key: "footer.mission", group: "Footer", label: "Mission line", long: true,
    def: "Drive the car. Fund the cause. 10% of every cycle goes to a real, named US charity — paid on gross before any operating cost.",
  },
  { key: "newsletter.title", group: "Footer newsletter", label: "Title", def: "Draw alerts, bonus offers, receipts." },
  {
    key: "newsletter.body", group: "Footer newsletter", label: "Body", long: true,
    def: "Subscribers get double entries on every ticket. One email per cycle, one click to leave.",
  },
];

const DEFAULTS: Record<string, string> = Object.fromEntries(CONTENT_FIELDS.map((f) => [f.key, f.def]));

const STORAGE_KEY = "gm:content-v1";
export const CONTENT_EVENT = "gm:content-updated";

export function getContent(): Record<string, string> {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Record<string, string>) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

/** Persist only the values that differ from defaults. */
export function saveContent(values: Record<string, string>) {
  const overrides: Record<string, string> = {};
  for (const [k, v] of Object.entries(values)) {
    if (DEFAULTS[k] !== undefined && v !== DEFAULTS[k]) overrides[k] = v;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  window.dispatchEvent(new Event(CONTENT_EVENT));
}

export function resetContent() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(CONTENT_EVENT));
}

export function contentDefault(key: string): string {
  return DEFAULTS[key] ?? "";
}
