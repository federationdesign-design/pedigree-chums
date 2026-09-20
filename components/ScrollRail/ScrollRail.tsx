"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./ScrollRail.module.css";

/* A horizontal rail with the site's yellow draggable scrollbar under it.
   The sync and drag maths are CardRail's, unchanged: pure DOM writes rather than
   setState, so scrolling never re-renders the rail's children.

   WHY THIS EXISTS RATHER THAN REUSING CardRail. CardRail is 266 lines welded to
   the chum card deck: it reads content/cards, builds Vimeo ids from filenames,
   and renders a lightbox and parallax triangles. None of that is wanted here, so
   only the scrollbar behaviour is shared.

   The caller keeps ownership of the rail's own layout by passing `className`.
   This component adds no layout of its own beyond the scrollbar, so the page
   decides the widths, the gap, the snap and where it scrolls at all.

   The track hides itself whenever there is nothing to scroll, which is what
   makes it safe on a page whose rail only overflows at narrow widths: on
   desktop the conga is a static five-column row, so the bar takes no space. */
export default function ScrollRail({
  className,
  children,
  label,
}: {
  className?: string;
  children: ReactNode;
  /** Names the rail for screen readers, e.g. "Etymology steps". */
  label?: string;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = railRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!el || !track || !thumb) return;

    const sync = () => {
      const max = el.scrollWidth - el.clientWidth;
      /* `display` rather than CardRail's `opacity`, so the bar gives its 12px
         back when the rail does not overflow instead of leaving a gap. */
      if (max <= 1) {
        track.style.display = "none";
        return;
      }
      track.style.display = "block";
      thumb.style.width = `${(el.clientWidth / el.scrollWidth) * 100}%`;
      thumb.style.left = `${(el.scrollLeft / el.scrollWidth) * 100}%`;
    };

    let dragging = false;
    let startX = 0;
    let startScroll = 0;

    const onDown = (e: PointerEvent) => {
      dragging = true;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      thumb.setPointerCapture(e.pointerId);
      e.preventDefault();
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const trackW = track.clientWidth || 1;
      const max = el.scrollWidth - el.clientWidth;
      const next = startScroll + ((e.clientX - startX) / trackW) * el.scrollWidth;
      el.scrollLeft = Math.max(0, Math.min(next, max));
    };
    const onUp = () => {
      dragging = false;
    };

    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    thumb.addEventListener("pointerdown", onDown);
    thumb.addEventListener("pointermove", onMove);
    thumb.addEventListener("pointerup", onUp);
    thumb.addEventListener("pointercancel", onUp);
    const ro = new ResizeObserver(sync);
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      thumb.removeEventListener("pointerdown", onDown);
      thumb.removeEventListener("pointermove", onMove);
      thumb.removeEventListener("pointerup", onUp);
      thumb.removeEventListener("pointercancel", onUp);
      ro.disconnect();
    };
  }, []);

  return (
    <>
      <div ref={railRef} className={className} aria-label={label}>
        {children}
      </div>
      <div ref={trackRef} className={styles.track} aria-hidden="true">
        <div ref={thumbRef} className={styles.thumb} />
      </div>
    </>
  );
}
