// Demo account session — email + OTP sign-in persisted to localStorage.
// No backend: the OTP is generated client-side and shown in a simulated
// "demo inbox" card on the login page.

export type SessionUser = {
  email: string;
  memberSince: string; // ISO date
};

const STORAGE_KEY = "gm:session-v1";
export const SESSION_EVENT = "gm:session-updated";

export function getUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function signIn(email: string): SessionUser {
  const user: SessionUser = {
    email: email.trim().toLowerCase(),
    memberSince: new Date().toISOString(),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(SESSION_EVENT));
  return user;
}

export function signOut() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}
