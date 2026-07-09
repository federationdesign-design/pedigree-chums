"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { breeds, type Breed } from "../../data/breeds";
import styles from "./know.module.css";

const ROWS: { title: string; accent: string; names: string[] }[] = [
  { title: "The top dogs", accent: "dogs", names: ["French Bulldog", "Chihuahua", "Dachshund", "German Shepherd"] },
  { title: "Popular UK breeds", accent: "breeds", names: ["Cocker Spaniel", "Golden Retriever", "Staffordshire Bull Terrier", "Springer Spaniel"] },
  { title: "The ol' favourites", accent: "favourites", names: ["West Highland Terrier", "Yorkshire Terrier", "Cavalier King Charles Spaniel", "Whippet"] },
  { title: "The new favourites", accent: "favourites", names: ["Cockapoo", "Cavapoo", "Labradoodle", "Goldendoodle"] },
  { title: "Oldest UK breeds", accent: "breeds", names: ["Irish Wolfhound", "Corgi", "Bulldog", "Beagle"] },
  { title: "Furthest from home", accent: "home", names: ["Afghan Hound", "Shih Tzu", "Pug", "Siberian Husky"] },
  { title: "Endangered dogs", accent: "dogs", names: ["Old English Sheepdog", "Bloodhound", "Greyhound", "Mastiff"] },
  { title: "Employed dogs", accent: "dogs", names: ["Labrador", "Border Collie", "Rottweiler", "Doberman Pinscher"] },
  { title: "Pint-sized pups", accent: "pups", names: ["Pomeranian", "Maltese", "Papillon", "Bichon Frise"] },
];

const byName = (name: string): Breed | undefined => breeds.find((b) => b.name === name);

function ChumCard({ breed }: { breed: Breed }) {
  return (
    <Link href={`/chums/${breed.slug}`} className={styles.chumCard} aria-label={`Explore ${breed.name}`}>
      <div className={styles.flipInner}>
        <div className={styles.flipFront}>
          <Image src={breed.image} alt={breed.name} width={300} height={300} className={styles.chumImg} unoptimized />
        </div>
        <div className={styles.flipBack}>
          <span className={styles.flipName}>{breed.name}</span>
        </div>
      </div>
    </Link>
  );
}

export default function ChumExplorer() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return [...breeds].filter((b) => b.name.toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name));
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
          <p className={styles.noResults}>No chums match &ldquo;{query}&rdquo;. Try another breed name.</p>
        )
      ) : (
        ROWS.map((row) => {
          const dogs = row.names.map(byName).filter(Boolean) as Breed[];
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
