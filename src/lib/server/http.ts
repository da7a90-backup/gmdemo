// Uniform Route Handler helpers: consistent JSON shape + light validation.
import { NextResponse } from "next/server";

export const ok = <T>(data: T, status = 200) => NextResponse.json({ ok: true, data }, { status });
export const fail = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isEmail = (v: unknown): v is string => typeof v === "string" && EMAIL_RE.test(v.trim());

/** Very light US/E.164 phone normalization → E.164, or null if implausible. */
export function normalizePhone(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const d = v.replace(/[^\d+]/g, "");
  if (d.startsWith("+") && d.length >= 11 && d.length <= 16) return d;
  const digits = d.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}
