"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./EraNav.module.css";

/* Era page navigation for phones (owner request, 22 September 2026): a short
   BACK button and a NEXT ERA button in the history page's own button style, plus
   a left swipe that moves to the next era.

   BACK goes to the PREVIOUS ERA, not to the index and not through the browser's
   history (owner, 23 Sept 2026: from the 1900s it must land on the 1800s). The
   browser-history version was replaced because a soft navigation never updates
   document.referrer, so the check failed and it fell through to the index every
   time. On the first era there is no previous one, so it goes to the index.

   The swipe listens on the document rather than a wrapper so it works wherever
   the reader is on a long page. It only fires on a clear horizontal drag, at
   least 70px across and more across than down, so scrolling the page and
   dragging a map slider are both left alone. A swipe from the very left edge is
   ignored too, since that is the browser's own back gesture. */

type Props = { backHref: string; backLabel: string; nextHref: string | null; nextLabel: string | null };

export default function EraNav({ backHref, backLabel, nextHref, nextLabel }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!nextHref) return;
    let x = 0;
    let y = 0;
    let live = false;
    const start = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
      live = x > 40;
    };
    const end = (e: TouchEvent) => {
      if (!live) return;
      live = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - x;
      const dy = t.clientY - y;
      if (dx < -70 && Math.abs(dx) > Math.abs(dy) * 1.6) router.push(nextHref);
    };
    document.addEventListener("touchstart", start, { passive: true });
    document.addEventListener("touchend", end, { passive: true });
    return () => {
      document.removeEventListener("touchstart", start);
      document.removeEventListener("touchend", end);
    };
  }, [nextHref, router]);

  return (
    <div className={styles.row}>
      <Link href={backHref} className={styles.btn}>
        {backLabel}
      </Link>
      {nextHref && (
        <Link href={nextHref} className={`${styles.btn} ${styles.btnAlt}`}>
          {nextLabel ?? "Next era"}
        </Link>
      )}
    </div>
  );
}
