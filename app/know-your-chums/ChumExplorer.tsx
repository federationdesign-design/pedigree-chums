"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { breeds, type Breed } from "../../data/breeds";
import { getLineage } from "../../data/lineage";
import BreedTree from "../../components/BreedTree/BreedTree";
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
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const cleanWeight = (w: string) => w.replace(/[()]/g, "").trim();

function ChumCard({ breed, onOpen }: { breed: Breed; onOpen: (b: Breed) => void }) {
  return (
    <button className={styles.chumCard} onClick={() => onOpen(breed)} aria-label={`View ${breed.name}`}>
      <div className={styles.flipInner}>
        <div className={styles.flipFront}>
          <Image src={breed.image} alt={breed.name} width={300} height={300} className={styles.chumImg} unoptimized />
        </div>
        <div className={styles.flipBack}>
          <span className={styles.flipName}>{breed.name}</span>
        </div>
      </div>
    </button>
  );
}

function BreedModal({ breed, onClose }: { breed: Breed; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const lineage = getLineage(breed.name);

  const stats: [string, string][] = [
    ["Size", cap(breed.sizeBand)],
    ["Muzzle", cap(breed.skull)],
    ["Weight", cleanWeight(breed.weight)],
    ["Height", breed.height],
    ["Length", breed.length],
  ];

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true" aria-label={breed.name}>
      <div className={`${styles.modalCard} ${lineage ? styles.modalCardSolo : ""}`} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose} aria-label="Close">
          &times;
        </button>
        {!lineage && (
          <div className={styles.modalImgWrap}>
            <Image src={breed.image} alt={breed.name} width={600} height={600} className={styles.modalImg} unoptimized />
          </div>
        )}
        <div className={styles.modalInfo}>
          <h3 className={styles.modalName}>{breed.name}</h3>
          {lineage && (
            <div className={styles.familyBlock}>
              <h4 className={styles.modalSubhead}>Where the {breed.name} comes from</h4>
              <p className={styles.familyIntro}>
                A best-guess family tree. Tap a circle to dig into the breeds that made it; it opens up full screen.
              </p>
              <BreedTree root={lineage} rootImage={breed.image} />
              <hr className={styles.familyDivider} />
            </div>
          )}
          <div className={styles.modalDetails}>
            <p className={styles.modalLookFor}>
              <strong>Look for:</strong> {breed.lookFor}
            </p>
            <dl className={styles.modalStats}>
              {stats.map(([k, v]) => (
                <div key={k} className={styles.modalStatRow}>
                  <dt>{k}:</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <h4 className={styles.modalSubhead}>Personality</h4>
            <p className={styles.modalChar}>{breed.character}</p>
            {breed.fact && <p className={styles.modalFact}>Did you know? {breed.fact}.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChumExplorer() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Breed | null>(null);

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
                <ChumCard key={b.slug} breed={b} onOpen={setSelected} />
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
                  <ChumCard key={`${row.title}-${b.slug}`} breed={b} onOpen={setSelected} />
                ))}
              </div>
            </div>
          );
        })
      )}

      {selected && <BreedModal breed={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
