// Admin-added winners layered over the mock winner archive.
// Custom winners are stored in localStorage and merged (newest first)
// ahead of the built-in list, so they immediately become the "latest winner"
// across the home page, tickets page, and winners archive.

import { winners as baseWinners, type Winner } from "@/lib/mock-data";

const STORAGE_KEY = "gm:winners-v1";
export const WINNERS_EVENT = "gm:winners-updated";

export function getCustomWinners(): Winner[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Winner[]) : [];
  } catch {
    return [];
  }
}

export function getAllWinners(): Winner[] {
  return [...getCustomWinners(), ...baseWinners];
}

export function addWinner(w: Omit<Winner, "id" | "photo">): Winner {
  const winner: Winner = {
    ...w,
    id: `w-custom-${Math.random().toString(36).slice(2, 8)}`,
    photo: "",
  };
  const next = [winner, ...getCustomWinners()];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(WINNERS_EVENT));
  return winner;
}

export function removeWinner(id: string) {
  const next = getCustomWinners().filter((w) => w.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(WINNERS_EVENT));
}

// React hook — merged winner list that tracks admin additions live.
import { useEffect, useState } from "react";

export function useWinners(): Winner[] {
  const [list, setList] = useState<Winner[]>(baseWinners);
  useEffect(() => {
    const load = () => setList(getAllWinners());
    load();
    window.addEventListener(WINNERS_EVENT, load);
    return () => window.removeEventListener(WINNERS_EVENT, load);
  }, []);
  return list;
}
