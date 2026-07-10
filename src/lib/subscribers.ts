// SMS + newsletter subscriber lists (demo).
// Seeded with mock subscribers; the SMS popup and footer newsletter form
// append to these stores, and the admin desk manages them.

export type SmsSubscriber = { id: string; phone: string; joinedISO: string; source: string };
export type EmailSubscriber = { id: string; email: string; joinedISO: string; source: string };

const SMS_KEY = "gm:sms-subs-v1";
const EMAIL_KEY = "gm:email-subs-v1";
export const SUBSCRIBERS_EVENT = "gm:subscribers-updated";

const SMS_SEED: SmsSubscriber[] = [
  { id: "s-001", phone: "(305) 555-0142", joinedISO: "2026-06-02T10:15:00-04:00", source: "Popup" },
  { id: "s-002", phone: "(646) 555-0177", joinedISO: "2026-06-11T18:40:00-04:00", source: "Popup" },
  { id: "s-003", phone: "(512) 555-0128", joinedISO: "2026-06-25T09:05:00-04:00", source: "Checkout" },
];

const EMAIL_SEED: EmailSubscriber[] = [
  { id: "e-001", email: "maria.t@example.com", joinedISO: "2026-05-14T12:00:00-04:00", source: "Footer" },
  { id: "e-002", email: "jwheeler@example.com", joinedISO: "2026-05-30T16:22:00-04:00", source: "Footer" },
  { id: "e-003", email: "derek.f@example.com", joinedISO: "2026-06-19T08:47:00-04:00", source: "Checkout" },
  { id: "e-004", email: "priya.k@example.com", joinedISO: "2026-07-01T20:10:00-04:00", source: "Footer" },
];

function read<T>(key: string, seed: T[]): T[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : seed;
  } catch {
    return seed;
  }
}

function write<T>(key: string, list: T[]) {
  window.localStorage.setItem(key, JSON.stringify(list));
  window.dispatchEvent(new Event(SUBSCRIBERS_EVENT));
}

const uid = () => Math.random().toString(36).slice(2, 8);

export const getSmsSubscribers = () => read<SmsSubscriber>(SMS_KEY, SMS_SEED);
export const getEmailSubscribers = () => read<EmailSubscriber>(EMAIL_KEY, EMAIL_SEED);

export function addSmsSubscriber(phone: string, source = "Popup") {
  const list = getSmsSubscribers();
  if (list.some((s) => s.phone.replace(/\D/g, "") === phone.replace(/\D/g, ""))) return;
  write(SMS_KEY, [{ id: `s-${uid()}`, phone, joinedISO: new Date().toISOString(), source }, ...list]);
}

export function removeSmsSubscriber(id: string) {
  write(SMS_KEY, getSmsSubscribers().filter((s) => s.id !== id));
}

export function addEmailSubscriber(email: string, source = "Footer") {
  const list = getEmailSubscribers();
  const norm = email.trim().toLowerCase();
  if (list.some((s) => s.email.toLowerCase() === norm)) return;
  write(EMAIL_KEY, [{ id: `e-${uid()}`, email: norm, joinedISO: new Date().toISOString(), source }, ...list]);
}

export function removeEmailSubscriber(id: string) {
  write(EMAIL_KEY, getEmailSubscribers().filter((s) => s.id !== id));
}
