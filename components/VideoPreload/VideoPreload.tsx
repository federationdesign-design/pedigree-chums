"use client";

import { useEffect } from "react";

// While the visitor plays in the pit on the homepage, quietly warm everything the
// About page's Vimeo hero needs (DNS/TLS handshakes, the player SDK, the player
// document) so the video is ready to start the moment they cross over. It waits
// for the page to go idle, and bows out on data-saver or very slow links, so it
// never competes with the pit for bandwidth.

// Keep these in step with components/Hero/Hero.tsx.
const VIMEO_IFRAME =
  "https://player.vimeo.com/video/1199216471?autoplay=1&loop=0&muted=1&controls=0&title=0&byline=0&portrait=0&autopause=0";
const VIMEO_SDK = "https://player.vimeo.com/api/player.js";
const PRECONNECT = ["https://player.vimeo.com", "https://i.vimeocdn.com", "https://f.vimeocdn.com"];

export default function VideoPreload() {
  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (conn?.saveData) return; // respect data saver
    if (conn?.effectiveType && /(^|-)2g$/.test(conn.effectiveType)) return; // skip on very slow links

    const hint = (rel: string, href: string, as?: string) => {
      if (document.head.querySelector(`link[data-vpre][href="${href}"]`)) return; // never double up
      const l = document.createElement("link");
      l.rel = rel;
      l.href = href;
      if (as) l.as = as;
      if (rel === "preconnect") l.crossOrigin = "anonymous";
      l.setAttribute("data-vpre", "");
      document.head.appendChild(l);
    };

    const warm = () => {
      PRECONNECT.forEach((h) => hint("preconnect", h)); // open the connections early
      hint("prefetch", VIMEO_SDK, "script"); // cache the player SDK
      hint("prefetch", VIMEO_IFRAME); // cache the player document
    };

    const w = window as Window & {
      requestIdleCallback?: (cb: IdleRequestCallback, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    let idle = 0;
    let timer = 0;
    if (w.requestIdleCallback) idle = w.requestIdleCallback(warm, { timeout: 3000 });
    else timer = window.setTimeout(warm, 1500);

    return () => {
      if (idle && w.cancelIdleCallback) w.cancelIdleCallback(idle);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return null;
}
