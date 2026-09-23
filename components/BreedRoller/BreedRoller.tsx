"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./BreedRoller.module.css";
import { levelBreeds, levelSlug } from "../../data/levels";
import { breeds } from "../../data/breeds";
import { ukBreeds } from "../../data/uk-breeds";

/* A rolling picker of every dog in every era slider, for the mobile intro
   (owner request, 22 September 2026, modelled on the date-picker pattern they
   sent: one scrolling column, snap to centre, faded top and bottom).

   The list is levelBreeds(), which is the same sort BreedStrip runs, so the
   order here is the campaign order and cannot drift from the sliders. Only dogs
   that have their own page are listed, since tapping one opens that page. */

/* A to Z, not timeline order (owner, 22 Sept 2026): this is a find-a-dog list,
   so the alphabet is the useful order. */
/* TWO SOURCES, because the 54 pack dogs are not in the level list at all (owner,
   22 Sept 2026): every timeline level goes to its history page, and every pack
   chum goes to its chum page. Anything named in both keeps the history page. */
type Row = { name: string; era: string; href: string };
const LEVEL_ROWS: Row[] = levelBreeds().map((b) => ({
  name: b.name,
  era: b.era,
  /* Straight into a playing round, not the level's start screen (owner,
     23 September 2026): readers arriving from this list did not realise there was
     a game here. Closing the level returns them to the history page. */
  href: `/britains-dog-history/play/${levelSlug(b.name)}`,
}));
/* Pack chums show an era too (owner, 22 Sept 2026, "none of the 54 were created
   today"). Three steps, in order:
     1. the timeline catalogue's own era, where the pack name is in it;
     2. the same, under the catalogue's fuller name for four pack short names;
     3. for breeds the catalogue does not carry at all, mostly ones from abroad,
        the band their `established` year falls in. That year is when the breed
        was formally recognised, not when the dog first existed, so the band is an
        honest floor rather than a claim about origins. */
const ERA_BY_NAME = new Map(ukBreeds.map((b) => [b.name, b.era]));
const PACK_ALIAS: Record<string, string> = {
  "West Highland Terrier": "West Highland White Terrier",
  "Springer Spaniel": "English Springer Spaniel",
  Labrador: "Labrador Retriever",
  Corgi: "Pembroke Welsh Corgi",
};
/* HAND-AUTHORED ORIGIN ERAS (owner choice A, 22 Sept 2026). `established` is the
   year a kennel club recognised a breed, not when the dog first existed, so every
   ancient breed from abroad was reading "1900s". These are editorial calls on when
   the TYPE appears, written to the site's own era words, and they are the first
   thing the lookup tries for a pack chum. Correct any of them here. */
const PACK_ERA: Record<string, string> = {
  "Afghan Hound": "Ancient",
  Maltese: "Ancient",
  Pug: "Ancient",
  Chihuahua: "Ancient",
  "Shih Tzu": "Ancient",
  "Siberian Husky": "Ancient",
  "Italian Greyhound": "Ancient",
  Rottweiler: "Ancient",
  "Great Dane": "Medieval",
  Corgi: "Medieval",
  "Bichon Frise": "Medieval",
  Poodle: "1500s",
  Papillon: "1500s",
  "Saint Bernard": "1600s",
  Dachshund: "1600s",
  Dalmatian: "1600s",
  Pomeranian: "1700s",
  Weimaraner: "early 1800s",
  "Boston Terrier": "late 1800s",
  "Doberman Pinscher": "late 1800s",
  "German Shepherd": "late 1800s",
  Boxer: "late 1800s",
  "Miniature Schnauzer": "late 1800s",
  "French Bulldog": "late 1800s",
};

const bandFor = (established: string) => {
  const year = Number(established.match(/[0-9]{4}/)?.[0]);
  if (!year) return "1800s";
  if (year < 1700) return "1600s";
  if (year < 1800) return "1700s";
  if (year < 1850) return "early 1800s";
  if (year < 1880) return "mid 1800s";
  if (year < 1900) return "late 1800s";
  return "1900s";
};
const packEra = (name: string, established: string) =>
  PACK_ERA[name] ?? ERA_BY_NAME.get(name) ?? ERA_BY_NAME.get(PACK_ALIAS[name] ?? "") ?? bandFor(established);

const PACK_ROWS: Row[] = breeds
  .filter((p) => !LEVEL_ROWS.some((r) => r.name === p.name))
  .map((p) => ({ name: p.name, era: packEra(p.name, p.established), href: `/chums/${p.slug}` }));
const DOGS: Row[] = [...LEVEL_ROWS, ...PACK_ROWS].sort((a, b) => a.name.localeCompare(b.name));

/* CHUMS MODE, 23 September 2026 (owner): the same roller on Know your chums,
   listing the 54 pack dogs only and going to their chum pages rather than into a
   level. Same A to Z rule. */
const CHUMS: Row[] = breeds
  .map((p) => ({ name: p.name, era: packEra(p.name, p.established), href: `/chums/${p.slug}` }))
  .sort((a, b) => a.name.localeCompare(b.name));

/* mode "history" (the default) lists every timeline level and every pack chum and
   goes into the game; mode "chums" lists the 54 pack dogs and goes to their chum
   pages (owner, 23 September 2026, for Know your chums). */
type Props = { mode?: "history" | "chums" };

export default function BreedRoller({ mode = "history" }: Props) {
  const rows = mode === "chums" ? CHUMS : DOGS;
  const label = mode === "chums" ? "Britain\u2019s chums a-z" : "Britain\u2019s dogs a-z";
  const listRef = useRef<HTMLUListElement | null>(null);
  const [centre, setCentre] = useState(0);

  /* Coming back from a dog page should land where the user left off, so the
     scroll position is kept for the session (owner, 22 Sept 2026). */
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    try {
      const saved = window.sessionStorage.getItem(`pc-breed-roller-${mode}`);
      if (saved) list.scrollTop = Number(saved);
    } catch {
      /* private mode: not worth breaking the picker over */
    }
    const save = () => {
      try {
        window.sessionStorage.setItem(`pc-breed-roller-${mode}`, String(list.scrollTop));
      } catch {
        /* as above */
      }
    };
    list.addEventListener("scroll", save, { passive: true });
    return () => list.removeEventListener("scroll", save);
  }, [mode]);

  /* Highlight the row at the TOP of the window, not the middle (owner, 22 Sept
     2026). Centring needed half the list's height as padding at each end, and
     those empty half-slots were the gap under the heading and the gap at the
     foot. With the top row as the marker the list runs flush, first dog to last. */
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const top = list.scrollTop + 4;
        const items = Array.from(list.children) as HTMLElement[];
        let best = 0;
        let bestGap = Infinity;
        items.forEach((el, i) => {
          const gap = Math.abs(el.offsetTop - top);
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
      <span className={styles.label}>{label}</span>
      <ul className={styles.list} ref={listRef} aria-label={mode === "chums" ? "Every chum in the pack" : "Every dog in the timeline"}>
        {rows.map((d, i) => (
          <li key={d.href} className={`${styles.item} ${i === centre ? styles.on : ""}`}>
            <Link href={d.href} className={styles.link}>
              <span className={styles.name}>{d.name}</span>
              <span className={styles.era}>{d.era}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
