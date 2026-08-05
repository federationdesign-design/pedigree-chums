"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { breeds, type Breed } from "../../data/breeds";
/* The same search as the home page, lifted whole rather than remade
   (owner instruction, 5 August). It replaces the old grid-filtering box: this
   one suggests dogs from the pack as you type and goes straight to the chum. */
import ChumSearch from "../../components/ChumSearch/ChumSearch";
import styles from "./know.module.css";

/* EVERY DOG IN THE PACK APPEARS EXACTLY ONCE (owner instruction, 5 August).
   The rows used to hold four each, which showed 36 of the 54. The assertion
   below is what keeps that true: add a dog to the pack without placing it here
   and the dev console says so by name.

   The groupings are the agent's proposal and need owner review. The rules
   given collide in places (every "small" dog into Pint-sized pups would empty
   the popular rows of the Cocker Spaniel, French Bulldog and Chihuahua), so
   where they did, the dog sits in the row that describes it best and
   Pint-sized pups takes the rest of the small dogs. */
const ROWS: { title: string; accent: string; names: string[] }[] = [
  /* Reviewed as asked: these are the actual most-owned breeds in Britain
     (RVC VetCompass, O'Neill et al. 2023), which is what the same source
     already drives the bar charts above with. The old four were a mix of
     popular and merely well-known. */
  {
    title: "The top dogs",
    accent: "dogs",
    names: ["Labrador", "Jack Russell Terrier", "Cocker Spaniel", "Staffordshire Bull Terrier", "French Bulldog", "Chihuahua"],
  },
  {
    title: "Popular UK breeds",
    accent: "breeds",
    names: ["Golden Retriever", "Springer Spaniel", "Dachshund", "Miniature Schnauzer", "Boxer", "Bull Terrier"],
  },
  {
    title: "The ol' favourites",
    accent: "favourites",
    names: ["West Highland Terrier", "Yorkshire Terrier", "Cavalier King Charles Spaniel", "Whippet", "Border Terrier", "Lurcher"],
  },
  /* All seven crossbreeds in the pack, including the three the strip on
     Britain's dog history just gained. */
  {
    title: "The new favourites",
    accent: "favourites",
    names: ["Cockapoo", "Cavapoo", "Labradoodle", "Goldendoodle", "Cavachon", "Maltipoo", "Jackapoo"],
  },
  {
    title: "Oldest UK breeds",
    accent: "breeds",
    names: ["Irish Wolfhound", "Corgi", "Bulldog", "Beagle", "Greyhound", "Basset Hound"],
  },
  /* Dogs whose homeland is not Britain. */
  {
    title: "Furthest from home",
    accent: "home",
    names: ["Afghan Hound", "Shih Tzu", "Pug", "Siberian Husky", "Great Dane", "Saint Bernard", "Dalmatian", "Weimaraner", "Poodle", "Boston Terrier"],
  },
  /* The pack's vulnerable natives, the same five the rarity chart above is
     built from, minus the English Setter, which is not in the pack. */
  {
    title: "Endangered dogs",
    accent: "dogs",
    names: ["Old English Sheepdog", "Bloodhound", "Mastiff", "Irish Setter"],
  },
  /* Bred for a job and still doing one: herding, guarding, police and
     military work, mountain rescue. */
  {
    title: "Employed dogs",
    accent: "dogs",
    names: ["Border Collie", "German Shepherd", "Rottweiler", "Doberman Pinscher"],
  },
  /* The rest of the small dogs, once the rows above have taken the ones they
     describe better. */
  {
    title: "Pint-sized pups",
    accent: "pups",
    names: ["Pomeranian", "Maltese", "Bichon Frise", "Papillon", "Italian Greyhound", "Chihuahua", "Cavachon"],
  },
];

/* Two dogs above are deliberately listed twice in the source (Chihuahua and
   Cavachon read naturally in two rows), so the render de-duplicates: a dog is
   drawn in the FIRST row that claims it. Anything left over lands in the
   catch-all row below, which is what the owner asked for rather than leaving a
   dog off the page. */
const CATCH_ALL = { title: "The rest of the pack", accent: "pack" };

const byName = (name: string): Breed | undefined => breeds.find((b) => b.name === name);

/* The write-ups are stored to read mid-sentence, because BreedDialog says
   "Did you know? {fact}." On the card the same line starts the sentence, so
   it is capitalised HERE rather than in data/breeds.ts: changing the stored
   copy would put a capital in the middle of the dialog's sentence.
   "cross Bred from ..." also carries a stray capital, which the second rule
   settles. */
function sentenceCase(text: string): string {
  const t = text.trim().replace(/^cross Bred\b/, "cross bred");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function ChumCard({ breed }: { breed: Breed }) {
  return (
    <Link href={`/chums/${breed.slug}`} className={styles.chumCard} aria-label={`Explore ${breed.name}`}>
      <div className={styles.flipInner}>
        <div className={styles.flipFront}>
          <Image src={breed.image} alt={breed.name} width={300} height={300} className={styles.chumImg} unoptimized />
          {/* The corner flash from Britain's dog history: the yellow wedge with
              the LEARN artwork over it. Always LEARN here, because every dog on
              this page has a chum page of its own to go to. */}
          <span className={styles.chumWedge} aria-hidden="true" />
          <span className={styles.chumFlash} aria-hidden="true" />
        </div>
        {/* The yellow reverse, matching Britain's dog history: the green tap
            pill, the dog's name and its write-up. */}
        <div className={styles.flipBack}>
          <span className={styles.flipHint}>Tap to learn about this dog</span>
          <span className={styles.flipName}>{breed.name}</span>
          <span className={styles.flipNote}>{sentenceCase(breed.fact)}</span>
        </div>
      </div>
    </Link>
  );
}

/* One row: a horizontal rail with the yellow draggable scrollbar under it.
   The rail, the scrollbar and the drag maths are the ones from
   app/britains-dog-history/BreedStrip.tsx, copied rather than reinvented so
   the two pages scroll identically. */
function ChumRow({ title, accent, dogs }: { title: string; accent: string; dogs: Breed[] }) {
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
      if (max <= 1) {
        track.style.opacity = "0";
        return;
      }
      track.style.opacity = "1";
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

  const prefix = title.slice(0, title.length - accent.length);

  return (
    <div className={styles.row}>
      <h3 className={`display ${styles.rowTitle}`}>
        {prefix}
        <span className="display-yellow">{accent}</span>
      </h3>
      <div className={styles.rowWrap}>
        <div ref={railRef} className={styles.rowRail} role="list">
          {dogs.map((b) => (
            <div className={styles.rowItem} role="listitem" key={`${title}-${b.slug}`}>
              <ChumCard breed={b} />
            </div>
          ))}
        </div>
        <div ref={trackRef} className={styles.rowScrollbar} aria-hidden="true">
          <div ref={thumbRef} className={styles.rowThumb} />
        </div>
      </div>
    </div>
  );
}

export default function ChumExplorer() {
  /* Resolve the rows, dropping any dog a row above already showed, then sweep
     up whatever the rows between them missed. */
  const seen = new Set<string>();
  const rows = ROWS.map((row) => {
    const dogs: Breed[] = [];
    for (const n of row.names) {
      const b = byName(n);
      if (!b || seen.has(b.slug)) continue;
      seen.add(b.slug);
      dogs.push(b);
    }
    return { ...row, dogs };
  }).filter((row) => row.dogs.length > 0);

  const leftovers = breeds.filter((b) => !seen.has(b.slug));
  if (leftovers.length) rows.push({ ...CATCH_ALL, names: [], dogs: leftovers });

  useEffect(() => {
    /* The coverage guard. Every dog in the pack has to be on this page exactly
       once; a name typo in ROWS would otherwise fail silently by quietly
       dropping that dog. Dev only. */
    if (process.env.NODE_ENV === "production") return;
    const placed = rows.flatMap((r) => r.dogs.map((d) => d.slug));
    const missing = breeds.filter((b) => !placed.includes(b.slug)).map((b) => b.name);
    const dupes = placed.filter((s, i) => placed.indexOf(s) !== i);
    const unknown = ROWS.flatMap((r) => r.names).filter((n) => !byName(n));
    if (missing.length) console.warn("[ChumExplorer] dogs missing from the page:", missing);
    if (dupes.length) console.warn("[ChumExplorer] dogs shown twice:", dupes);
    if (unknown.length) console.warn("[ChumExplorer] names matching no breed:", unknown);
  }, [rows]);

  return (
    <section className={styles.explorer}>
      <div className={styles.searchWrap}>
        <ChumSearch />
      </div>

      {rows.map((row) => (
        <ChumRow key={row.title} title={row.title} accent={row.accent} dogs={row.dogs} />
      ))}
    </section>
  );
}
