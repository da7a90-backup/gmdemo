"use client";
import { useEffect } from "react";

/**
 * While the teaser is mounted, paint the document root dark. The mobile browser's
 * backdrop — behind/around the address bar and the overscroll/rubber-band area —
 * uses the ROOT element's background, not our fixed layer, so without this it
 * shows the site's cream (`bg-paper` on <body>). Reverts on unmount so the rest
 * of the site stays cream.
 */
export function RootDark({ color = "#0a0a0a" }: { color?: string }) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlBg: html.style.backgroundColor,
      bodyBg: body.style.backgroundColor,
      scheme: html.style.colorScheme,
    };
    html.style.backgroundColor = color;
    body.style.backgroundColor = color;
    html.style.colorScheme = "dark";
    return () => {
      html.style.backgroundColor = prev.htmlBg;
      body.style.backgroundColor = prev.bodyBg;
      html.style.colorScheme = prev.scheme;
    };
  }, [color]);
  return null;
}
