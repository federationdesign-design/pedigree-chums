"use client";

import { useEffect, useRef, useState } from "react";

/*
  usePinnedTrigger
  -----------------
  The shared mechanism behind every "Rule B" scroll scene (quotes, polls,
  and anything else that should animate once on arrival rather than being
  scrubbed by scroll distance).

  Unlike the old approach -- where an animation's progress was computed
  every frame from how far the reader had scrolled through a tall
  container -- this hook only answers one question: "has this scene just
  become pinned at the top of the viewport?" The animation itself is then
  driven by CSS transitions with a fixed duration, completely independent
  of scroll speed. This is what removes the "gap" problem structurally:
  the container only needs to reserve room for a pin + one short reading
  pause, never for "however long the animation needs to catch up".

  Replays every time the scene re-enters the pinned position (scrolling
  back up and returning re-triggers it) -- the simplest rule, and the one
  Steve confirmed he's happy to standardise on.
*/
export function usePinnedTrigger(pinOffset = 130) {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);
  const wasPinned = useRef(false);

  useEffect(() => {
    let raf = false;

    const check = () => {
      raf = false;
      const el = sceneRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const isPinned = r.top <= pinOffset && r.bottom > window.innerHeight * 0.35;

      if (isPinned && !wasPinned.current) {
        wasPinned.current = true;
        setActive(false);
        // one tick so the "reset" state paints before the "active" state,
        // guaranteeing the CSS transition actually plays on replay
        requestAnimationFrame(() => setActive(true));
      } else if (!isPinned && wasPinned.current) {
        wasPinned.current = false;
        setActive(false);
      }
    };

    const onScroll = () => {
      if (!raf) {
        raf = true;
        requestAnimationFrame(check);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    check();
    return () => window.removeEventListener("scroll", onScroll);
  }, [pinOffset]);

  return { sceneRef, active };
}
