"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./BreedRoller.module.css";
import { levelBreeds, levelSlug } from "../../data/levels";

/* A rolling picker of every dog in every era slider, for the mobile intro
   (owner request, 22 September 2026, modelled on the date-picker pattern they
   sent: one scrolling column, snap to centre, faded top and bottom).

   The list is levelBreeds(), which is the same sort BreedStrip runs, so the
   order here is the campaign order and cannot drift from the sliders. Only dogs
   that have their own page are listed, since tapping one opens that page. */

/* A to Z, not timeline order (owner, 22 Sept 2026): this is a find-a-dog list,
   so the alphabet is the useful order. */
const DOGS = levelBreeds()
  .map((b) => ({ name: b.name, era: b.era, slug: levelSlug(b.name) }))
  .sort((a, b) => a.name.localeCompare(b.name));

export default function BreedRoller() {
  const listRef = useRef<HTMLUListElement | null>(null);
  const [centre, setCentre] = useState(0);

  /* Coming back from a dog page should land where the user left off, so the
     scroll position is kept for the session (owner, 22 Sept 2026). */
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    try {
      const saved = window.sessionStorage.getItem("pc-breed-roller");
      if (saved) list.scrollTop = Number(saved);
    } catch {
      /* private mode: not worth breaking the picker over */
    }
    const save = () => {
      try {
        window.sessionStorage.setItem("pc-breed-roller", String(list.scrollTop));
      } catch {
        /* as above */
      }
    };
    list.addEventListener("scroll", save, { passive: true });
    return () => list.removeEventListener("scroll", save);
  }, []);

  /* Highlight whichever dog is nearest the middle of the window. */
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const mid = list.scrollTop + list.clientHeight / 2;
        const items = Array.from(list.children) as HTMLElement[];
        let best = 0;
        let bestGap = Infinity;
        items.forEach((el, i) => {
          const gap = Math.abs(el.offsetTop + el.offsetHeight / 2 - mid);
          if (gap < bestGap) {
            bestGap = gap;
            best = i;
          }
        });
        setCentre(best);
      });
    };
    list.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      list.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className={styles.picker}>
      <span className={styles.label}>Britain&rsquo;s dogs a-z</span>
      <ul className={styles.list} ref={listRef} aria-label="Every dog in the timeline">
        {DOGS.map((d, i) => (
          <li key={d.slug} className={`${styles.item} ${i === centre ? styles.on : ""}`}>
            <Link href={`/britains-dog-history/dog/${d.slug}`} className={styles.link}>
              <span className={styles.name}>{d.name}</span>
              <span className={styles.era}>{d.era}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
