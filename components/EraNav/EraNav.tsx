"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./EraNav.module.css";

/* Era page navigation for phones (owner request, 22 September 2026): a short
   BACK button and a NEXT ERA button in the history page's own button style, plus
   a left swipe that moves to the next era.

   BACK goes back one page in the browser's own history, so a reader who came
   Ancient to Medieval to Tudor lands on Tudor, not at the top of the index
   (owner, 22 Sept 2026). It stays a real link to the index, which is what a
   direct arrival, a new tab or a crawler gets, and only intercepts the click
   when there is somewhere of ours to go back to.

   The swipe listens on the document rather than a wrapper so it works wherever
   the reader is on a long page. It only fires on a clear horizontal drag, at
   least 70px across and more across than down, so scrolling the page and
   dragging a map slider are both left alone. A swipe from the very left edge is
   ignored too, since that is the browser's own back gesture. */

type Props = { nextHref: string | null; nextLabel: string | null };

export default function EraNav({ nextHref, nextLabel }: Props) {
  const router = useRouter();

  /* Only step back when this page was reached from our own site in this tab;
     otherwise the link's own href takes over and opens the index. */
  const goBack = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const from = typeof document !== "undefined" ? document.referrer : "";
    const sameSite = !!from && from.startsWith(window.location.origin);
    if (!sameSite || window.history.length <= 1) return;
    e.preventDefault();
    router.back();
  };

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
      <Link href="/britains-dog-history" className={styles.btn} onClick={goBack}>
        Back
      </Link>
      {nextHref && (
        <Link href={nextHref} className={`${styles.btn} ${styles.btnAlt}`}>
          {nextLabel ?? "Next era"}
        </Link>
      )}
    </div>
  );
}
