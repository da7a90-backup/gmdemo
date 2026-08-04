"use client";
import { useEffect, useState } from "react";
import { getContent, contentDefault, ensureRemoteContent, CONTENT_EVENT, CONTENT_DEFAULTS } from "@/lib/content";

/**
 * CMS-managed text. Renders the default copy on the server, then swaps in
 * the admin-edited value (if any) after mount. Usable inside server components.
 */
export function Copy({ k }: { k: string }) {
  const [text, setText] = useState(() => contentDefault(k));

  useEffect(() => {
    ensureRemoteContent(); // one-time fetch of Shopify copy (shared across all <Copy>)
    const load = () => setText(getContent()[k] ?? contentDefault(k));
    load();
    window.addEventListener(CONTENT_EVENT, load);
    return () => window.removeEventListener(CONTENT_EVENT, load);
  }, [k]);

  return <>{text}</>;
}

/**
 * Reactive copy lookup for string contexts (placeholders, aria labels,
 * interpolated templates) where the <Copy> element can't be used. SSR/first
 * paint returns code defaults (hydration-safe); swaps to Shopify/admin copy
 * after mount. Returns a `t(key)` getter.
 */
export function useCopy(): (k: string) => string {
  const [map, setMap] = useState<Record<string, string>>(() => CONTENT_DEFAULTS);

  useEffect(() => {
    ensureRemoteContent();
    const load = () => setMap(getContent());
    load();
    window.addEventListener(CONTENT_EVENT, load);
    return () => window.removeEventListener(CONTENT_EVENT, load);
  }, []);

  return (k: string) => map[k] ?? contentDefault(k);
}
