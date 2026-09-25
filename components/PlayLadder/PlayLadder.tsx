import Link from "next/link";
import type React from "react";
import { breeds, breedCard } from "../../data/breeds";
import { bust } from "../../data/imgVersion";
import { chumCircleCount } from "../../data/playIntros";
import { getLineage, type LineageNode } from "../../data/lineage";
import { resolveLineageName } from "../../data/lineageNames";
import { isEchoName } from "../../data/lineageShape";
import { treesContaining } from "../../data/lineageArchive";
import { ukBreeds } from "../../data/uk-breeds";
import { statusFor, STATUS_LABEL, type BreedStatus } from "../../data/breedStatus";
import ScrollRail from "../PlayChumsRail/ScrollRail";
import styles from "./PlayLadder.module.css";

/* THE PLAY LADDERS (owner, 24 September 2026): every chum's game, ranked from
   the fewest circles to the most, in three lists, Easy, Medium and Hard. Each row
   shows the chum's card picture, the number of DIFFERENT dogs in its tree, and
   the number of CIRCLES that drop (a dog met twice drops twice, so circles can be
   far more than dogs). Counted on the server from the lineage data, so the lists
   follow every change to the trees by themselves.

   SEVEN LADDERS, HARDEST FIRST (owner, 24 September 2026, replacing the three
   of Easy, Medium and Hard). Split by RANK rather than by fixed circle counts, so
   the columns stay even as the trees grow: the chums are ranked hardest first
   and dealt out in order, the first columns taking one extra when the count does
   not divide by seven (54 chums: five columns of 8, two of 7). Inside each column
   the hardest is at the top. */
/* SIX TABLES OF TEN (owner, 24 September 2026): "Very easy" is gone and each
   table holds up to PER_TABLE chums, dealt out hardest first, so the last table
   takes whatever is left. */
/* FIVE TABLES OF ELEVEN, 24 September 2026 (owner): one table fewer, one more
   dog in each, and Impossible moved to the END, alone on the last row, so the
   top row reads down through the difficulties and finishes on Easy. The tables
   are still dealt hardest first; only the order they are SHOWN in changes. */
const PER_TABLE = 11;
const LEVELS: { title: string; colour: string }[] = [
  { title: "Impossible", colour: "#ffffff" }, // was "Oober"; white, was purple (owner, 24 September 2026)
  { title: "Extreme", colour: "#ef4444" }, // was "Very hard" (owner, 25 September 2026)
  { title: "Hard", colour: "#f97316" },
  { title: "Medium", colour: "#ffd23e" },
  { title: "Simple", colour: "#84cc16" }, // was "Easy" (owner, 25 September 2026)
];

// Different dogs in a chum's tree: every name below the chum, counted once.
function dogCount(name: string): number {
  const lin = getLineage(resolveLineageName(name));
  if (!lin) return 0;
  const names = new Set<string>();
  const walk = (x: LineageNode, parent: LineageNode | null, depth: number) => {
    if (depth > 0 && !(parent && isEchoName(x.name, parent.name))) names.add(x.name);
    for (const c of x.children ?? []) walk(c, x, depth + 1);
  };
  walk(lin, null, 0);
  return names.size;
}

/* THE ERA PILL, THE STATUS COLOUR AND THE RARITY DOT (owner, 24 September 2026).

   ERA: the dog's own era from the timelines where it has one; the four pack
   names that differ from the timeline's are mapped the same way breedStatus.ts
   maps them. The imports have no timeline row, so theirs is read from the
   decade they were established. No figure, no pill.

   STATUS COLOUR fills the pill: the colours the Know Your Chums page gives
   the same five statuses, so a chum reads the same on both pages.

   RARITY DOT: the rarity the game gives a dog, from how many family trees it
   appears in. The thresholds and colours are the game's own (rarityTier in
   BreedTree.tsx, RARITY_BAND in LineageMap.tsx), copied because those files are
   client code this server list cannot borrow from. Change them together. */
const UK_ALIAS: Record<string, string> = {
  Corgi: "Pembroke Welsh Corgi",
  "Springer Spaniel": "English Springer Spaniel",
  Labrador: "Labrador Retriever",
  "West Highland Terrier": "West Highland White Terrier",
};
function eraOf(name: string, established: string): string | null {
  const row = ukBreeds.find((u) => u.name === (UK_ALIAS[name] ?? name)) ?? ukBreeds.find((u) => u.name === name);
  if (row?.era) return row.era;
  const m = established.match(/(\d{4})/);
  return m ? `${Math.floor(Number(m[1]) / 10) * 10}s` : null;
}
const STATUS_COLOUR: Record<BreedStatus, { bg: string; fg: string }> = {
  trending: { bg: "#22c55e", fg: "#ffffff" },
  popular: { bg: "#22c55e", fg: "#ffffff" }, // the buttons' green (owner, 25 September 2026); was #2e9e5b
  "in-decline": { bg: "#ffed00", fg: "#0a3a57" },
  endangered: { bg: "#e08a1e", fg: "#ffffff" },
  rare: { bg: "#f0a437", fg: "#ffffff" },
};
const RARITY: { min: number; colour: string; label: string }[] = [
  { min: 79, colour: "#f47421", label: "Very common" }, // was 60, 25 September 2026 (owner), matching BreedTree's rarityTier
  { min: 20, colour: "#ffd23e", label: "Common" },
  { min: 10, colour: "#5dbf86", label: "Uncommon" },
  { min: 4, colour: "#2547c4", label: "Rare" },
  { min: 0, colour: "#4d2e91", label: "Extremely rare" },
];
const rarityOf = (name: string) => RARITY.find((r) => treesContaining(name) >= r.min) ?? RARITY[RARITY.length - 1];

type Row = { slug: string; name: string; image: string; circles: number; dogs: number; era: string | null; status: BreedStatus | undefined; rarity: { colour: string; label: string } };

function Ladder({ title, colour, rows }: { title: string; colour: string; rows: Row[] }) {
  const top = rows[0];
  const topStatus = top?.status;
  return (
    <section className={styles.ladder} aria-label={`${title} levels`}>
      <header className={styles.head}>
        {/* THE TOP CHUM'S PRINTED CARD, from the pack (owner, 24 September 2026),
            with the Chum Finder's flash across its foot carrying the chum's
            status in its status colour. The level's name sits under it. */}
        {top ? (
          <Link href={`/play/${top.slug}`} className={styles.topCard} aria-label={`Play the ${top.name}, the top of ${title}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bust(breedCard[top.slug] ?? top.image)} alt="" loading="lazy" width={821} height={1122} />
            {topStatus ? (
              <span className={styles.flash} style={{ background: STATUS_COLOUR[topStatus].bg, color: STATUS_COLOUR[topStatus].fg }}>{STATUS_LABEL[topStatus]}</span>
            ) : null}
          </Link>
        ) : null}
        {/* --chars lets the CSS cap the title at 80% of the table's width, whatever
            the word's length (see .title). */}
        <h2 className={styles.title} style={{ color: colour, ["--chars" as string]: title.length } as React.CSSProperties}>{title}</h2>
      </header>
      {/* A TABLE, 24 September 2026 (owner): the column names once at the top,
          a line between the rows. */}
      <div className={styles.colHead} aria-hidden="true">
        <span />
        <span>Chum history</span>
        <span>Anc</span>
        <span>Ins</span>
      </div>
      <ol className={styles.list}>
        {rows.map((r, i) => (
          <li key={r.slug}>
            <Link href={`/play/${r.slug}`} className={styles.row} aria-label={`Play the ${r.name}: ${r.dogs} ancestors, ${r.circles} instances`}>
              <span className={styles.rank}>{i + 1}</span>
              <span className={styles.chum}>
                <span className={styles.nameLine}>
                  <span className={styles.name}>{r.name}</span>
                </span>
              </span>
              <span className={styles.num}>{r.dogs}</span>
              <span className={styles.num}>{r.circles}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function PlayLadder() {
  const rows: Row[] = breeds
    .filter((b) => !!b.slug)
    .map((b) => ({ slug: b.slug, name: b.name, image: b.image, circles: chumCircleCount(b.name), dogs: dogCount(b.name), era: eraOf(b.name, b.established), status: statusFor(b.name), rarity: rarityOf(b.name) }))
    .sort((a, b) => b.circles - a.circles || a.name.localeCompare(b.name));
  // Dealt out hardest first; the first (rows % 7) columns take one extra.
  const dealt = LEVELS.map((lv, i) => ({ ...lv, rows: rows.slice(i * PER_TABLE, (i + 1) * PER_TABLE) })).filter((g) => g.rows.length > 0);
  // Shown with Impossible (the first dealt) moved to the end.
  // Easiest first, 25 September 2026 (owner): Easy, Medium, Hard, Very hard,
  // then Impossible alone at the end.
  const groups = [...dealt.slice(1).reverse(), ...dealt.slice(0, 1)];
  return (
    /* A HORIZONTAL SCROLL ON A PHONE, one ladder at a time, with the video
       slider's own scrollbar (owner, 24 September 2026); side by side on desktop,
       where the scrollbar hides itself because nothing overflows. */
    <div className={styles.outer}>
      <ScrollRail className={styles.wrap}>
        {groups.map((g) => (
          <Ladder key={g.title} title={g.title} colour={g.colour} rows={g.rows} />
        ))}
      </ScrollRail>
    </div>
  );
}
