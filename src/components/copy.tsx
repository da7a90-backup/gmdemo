"use client";
import { useEffect, useState } from "react";
import { getContent, contentDefault, CONTENT_EVENT } from "@/lib/content";

/**
 * CMS-managed text. Renders the default copy on the server, then swaps in
 * the admin-edited value (if any) after mount. Usable inside server components.
 */
export function Copy({ k }: { k: string }) {
  const [text, setText] = useState(() => contentDefault(k));

  useEffect(() => {
    const load = () => setText(getContent()[k] ?? contentDefault(k));
    load();
    window.addEventListener(CONTENT_EVENT, load);
    return () => window.removeEventListener(CONTENT_EVENT, load);
  }, [k]);

  return <>{text}</>;
}
