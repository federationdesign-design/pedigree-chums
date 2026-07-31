"use client";

import { useEffect, type RefObject } from "react";

/* PLAY WHEN SEEN, NOT WHEN MOUNTED.

   The menu's tiles are background videos. They used to autoplay the moment the
   menu opened, and `autoplay` fetches the whole file whatever `preload` says.
   With five of them that is several megabytes starting at once, on a phone, at
   the exact moment the reader is about to tap a link and needs the bandwidth
   for the page they are going to.

   This plays a tile only while it is actually on screen and pauses it when it
   is not. Tiles above the fold behave exactly as before. Tiles further down the
   menu cost nothing until they are scrolled to.

   The tiles are decoration on a link, so the worst case if the observer never
   fires is a still frame rather than a moving one. The link is untouched. */
export default function useInViewPlay(ref: RefObject<HTMLVideoElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // No observer at all: behave exactly as it always did.
    if (typeof IntersectionObserver === "undefined") {
      el.play().catch(() => {});
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) el.play().catch(() => {});
          else el.pause();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
}
