"use client";

import { useEffect } from "react";

/* MOBILE CAROUSEL BEHAVIOUR for /good-dog-bad-dog.

   MOVED OUT OF AN INLINE SCRIPT, 23 September 2026 (owner: "the green go to first
   dog button does not work"). The code below is unchanged; only where it runs has
   moved. It used to live in a <script dangerouslySetInnerHTML> inside the page.
   That runs on a full page load, but React inserts script nodes through the DOM
   when a page is reached by a client-side navigation, and a script inserted that
   way NEVER EXECUTES. Arriving at this page from anywhere else on the site left
   the button dead, the progress bar frozen and the vertical-flick advance off,
   while a hard refresh made all three work. As a client component in an effect,
   it runs on every arrival, and its listeners are torn down when the page is
   left rather than being left attached to the document.

   The button itself is plain markup in page.tsx, found here by id, and the click
   is handled by delegation, so hydration replacing the node cannot break it. */

export default function MobileCarousel() {
  useEffect(() => {

      const carousel = document.getElementById('mobile-carousel');
      const bar = document.getElementById('mobile-progress');
      if (!carousel || !bar) return;
      const update = () => {
        const max = carousel.scrollWidth - carousel.clientWidth;
        bar.style.width = (max > 0 ? (carousel.scrollLeft / max) * 100 : 0) + '%';
      };
      carousel.addEventListener('scroll', update, { passive: true });
      update();

      function goTo(idx: number) {
        /* Re-queried each time so the handler still works if React has
           replaced these nodes during hydration. */
        const c = document.getElementById('mobile-carousel');
        if (!c) return;
        const count = c.children.length;
        if (idx < 0) idx = 0;
        if (idx > count - 1) idx = count - 1;
        const from = c.scrollLeft;
        const target = idx * c.clientWidth;
        /* scroll-snap-type: x mandatory blocks programmatic smooth scrolling
           on iOS Safari, which is why this button did nothing while native
           swiping worked. The touchend handler below already relies on the
           same off/on trick -- that is the only reason it succeeds. */
        c.style.scrollSnapType = 'none';
        c.scrollTo({ left: target, behavior: 'smooth' });
        /* If smooth scrolling was ignored outright, jump there instead. */
        setTimeout(function(){
          if (Math.abs(c.scrollLeft - from) < 2) c.scrollLeft = target;
        }, 400);
        setTimeout(function(){ c.style.scrollSnapType = ''; }, 700);
      }

      /* Delegated rather than bound directly, so the button keeps working
         even if its node is re-created after this script has run. */
      const onClick = (e: MouseEvent) => {
        const t = e.target as HTMLElement | null;
        if (t && t.closest && t.closest('#intro-next-btn')) goTo(1);
      };
      document.addEventListener('click', onClick);

      /* Continuous vertical drag -> horizontal movement.
         touch-action: pan-x means the browser has no default action for
         vertical touches, so passive listeners are safe: no preventDefault,
         no interference with native horizontal swiping. */
      const GAIN = 1.6;           /* px of horizontal travel per px of vertical drag */
      let startX = 0, startY = 0, startLeft = 0, lastY = 0, lastT = 0, vel = 0;
      let axis: string | null = null;          /* null | 'v' | 'h' */

      const onTouchStart = (e: TouchEvent) => {
        if (e.touches.length !== 1) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startLeft = carousel.scrollLeft;
        lastY = startY; lastT = Date.now(); vel = 0;
        axis = null;
      };
      carousel.addEventListener('touchstart', onTouchStart, { passive: true });

      const onTouchMove = (e: TouchEvent) => {
        if (e.touches.length > 1) return; /* pinch: let the browser zoom */
        const t = e.touches[0];
        if (!axis) {
          const adx = Math.abs(t.clientX - startX);
          const ady = Math.abs(t.clientY - startY);
          if (adx < 6 && ady < 6) return;           /* not decided yet */
          axis = ady > adx ? 'v' : 'h';
          if (axis === 'v') carousel.style.scrollSnapType = 'none';
        }
        if (axis !== 'v') return;                    /* horizontal: native handles it */
        const now = Date.now();
        if (now > lastT) vel = (lastY - t.clientY) / (now - lastT);
        lastY = t.clientY; lastT = now;
        carousel.scrollLeft = startLeft + (startY - t.clientY) * GAIN;
      };
      carousel.addEventListener('touchmove', onTouchMove, { passive: true });

      const onTouchEnd = () => {
        if (axis !== 'v') return;
        axis = null;
        const w = carousel.clientWidth;
        let idx: number;
        if (Math.abs(vel) > 0.35) {
          /* decisive flick at release: continue one slide in that direction */
          idx = (vel > 0 ? Math.ceil : Math.floor)(carousel.scrollLeft / w);
        } else {
          idx = Math.round(carousel.scrollLeft / w);
        }
        const count = carousel.children.length;
        if (idx < 0) idx = 0;
        if (idx > count - 1) idx = count - 1;
        carousel.scrollTo({ left: idx * w, behavior: 'smooth' });
        setTimeout(function(){ carousel.style.scrollSnapType = ''; }, 450);
      };
      carousel.addEventListener('touchend', onTouchEnd, { passive: true });

      /* Torn down on leaving the page, which the inline script could not do. */
      return () => {
        carousel.removeEventListener('scroll', update);
        document.removeEventListener('click', onClick);
        carousel.removeEventListener('touchstart', onTouchStart);
        carousel.removeEventListener('touchmove', onTouchMove);
        carousel.removeEventListener('touchend', onTouchEnd);
      };

  }, []);

  return null;
}
