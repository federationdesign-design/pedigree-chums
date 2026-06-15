"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { breeds, type Breed } from "../../data/breeds";
import styles from "./know.module.css";

// Curated themed rows (editorial). Names must match data/breeds.ts exactly.
const ROWS: { title: string; accent: string; names: string[] }[] = [
  {
    title: "Popular UK breeds",
    accent: "breeds",
    names: ["Yorkshire Terrier", "Greyhound", "Bulldog", "Golden Retriever"],
  },
  {
    title: "Oldest UK breeds",
    accent: "breeds",
    names: ["Lurcher", "Greyhound", "Corgi", "Bloodhound"],
  },
  {
    title: "The top dogs",
    accent: "dogs",
    names: ["Labrador", "Border Collie", "Cocker Spaniel", "Staffordshire Bull Terrier"],
  },
  {
    title: "The ol' favourites",
    accent: "favourites",
    names: ["West Highland Terrier", "German Shepherd", "Beagle", "Old English Sheepdog"],
  },
  {
    title: "The new favourites",
    accent: "favourites",
    names: ["French Bulldog", "Pug", "Cockapoo", "Cavapoo"],
  },
];

const byName = (name: string): Breed | undefined =>
  breeds.find((b) => b.name === name);

function ChumCard({ breed }: { breed: Breed }) {
  // Phase 2: wrap in <Link href={`/know-your-chums/${breed.slug}`}> once the
  // individual breed pages exist. Plain card for now to avoid 404s.
  return (
    <article className={styles.chumCard}>
      <div className={styles.chumImgWrap}>
        <Image
          src={breed.image}
          alt={breed.name}
          width={300}
          height={300}
          className={styles.chumImg}
          unoptimized
        />
      </div>
      <h4 className={styles.chumName}>{breed.name}</h4>
    </article>
  );
}

export default function ChumExplorer() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return [...breeds]
      .filter((b) => b.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [query]);

  return (
    <section className={styles.explorer}>
      <div className={styles.searchWrap}>
        <input
          type="text"
          className={styles.search}
          placeholder="Search a chum…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search the breeds in the pack"
        />
      </div>

      {results ? (
        // Active search → grid of matches across all 54
        results.length ? (
          <>
            <p className={styles.resultCount}>
              {results.length} {results.length === 1 ? "chum" : "chums"} found
            </p>
            <div className={styles.resultGrid}>
              {results.map((b) => (
                <ChumCard key={b.slug} breed={b} />
              ))}
            </div>
          </>
        ) : (
          <p className={styles.noResults}>
            No chums match “{query}”. Try another breed name.
          </p>
        )
      ) : (
        // No search → the curated themed rows
        ROWS.map((row) => {
          const dogs = row.names.map(byName).filter(Boolean) as Breed[];
          // accent word sits at the end of each title
          const prefix = row.title.slice(0, row.title.length - row.accent.length);
          return (
            <div key={row.title} className={styles.row}>
              <h3 className={`display ${styles.rowTitle}`}>
                {prefix}
                <span className="display-yellow">{row.accent}</span>
              </h3>
              <div className={styles.rowGrid}>
                {dogs.map((b) => (
                  <ChumCard key={`${row.title}-${b.slug}`} breed={b} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </section>
  );
}
