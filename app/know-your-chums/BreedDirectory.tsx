"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { breeds, type Breed } from "../../data/breeds";
import styles from "./know.module.css";

type Filter =
  | { kind: "all" }
  | { kind: "size"; value: Breed["sizeBand"] }
  | { kind: "type"; value: Breed["type"] }
  | { kind: "skull"; value: Breed["skull"] };

const SIZE_LABELS: Record<Breed["sizeBand"], string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  giant: "Giant",
};
const SKULL_LABELS: Record<Breed["skull"], string> = {
  flat: "Flat-faced",
  medium: "Medium muzzle",
  long: "Long-faced",
};

export default function BreedDirectory() {
  const [filter, setFilter] = useState<Filter>({ kind: "all" });
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    let list = breeds;
    if (filter.kind === "size") list = list.filter((b) => b.sizeBand === filter.value);
    if (filter.kind === "type") list = list.filter((b) => b.type === filter.value);
    if (filter.kind === "skull") list = list.filter((b) => b.skull === filter.value);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((b) => b.name.toLowerCase().includes(q));
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [filter, query]);

  const isActive = (f: Filter) =>
    f.kind === filter.kind &&
    ("value" in f && "value" in filter ? f.value === filter.value : f.kind === filter.kind);

  return (
    <div>
      {/* Search */}
      <div className={styles.searchWrap}>
        <input
          type="text"
          className={styles.search}
          placeholder="Search a breed…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search breeds"
        />
      </div>

      {/* Filter pills */}
      <div className={styles.filters} role="group" aria-label="Filter breeds">
        <button
          className={`${styles.pill} ${filter.kind === "all" ? styles.pillOn : ""}`}
          onClick={() => setFilter({ kind: "all" })}
        >
          All 54
        </button>
        {(["small", "medium", "large", "giant"] as const).map((s) => (
          <button
            key={s}
            className={`${styles.pill} ${isActive({ kind: "size", value: s }) ? styles.pillOn : ""}`}
            onClick={() => setFilter({ kind: "size", value: s })}
          >
            {SIZE_LABELS[s]}
          </button>
        ))}
        <button
          className={`${styles.pill} ${isActive({ kind: "type", value: "designer-crossbreed" }) ? styles.pillOn : ""}`}
          onClick={() => setFilter({ kind: "type", value: "designer-crossbreed" })}
        >
          Designer crossbreeds
        </button>
        <button
          className={`${styles.pill} ${isActive({ kind: "type", value: "classic" }) ? styles.pillOn : ""}`}
          onClick={() => setFilter({ kind: "type", value: "classic" })}
        >
          Classic breeds
        </button>
      </div>

      <p className={styles.count}>
        {shown.length} {shown.length === 1 ? "chum" : "chums"}
      </p>

      {/* Grid */}
      <div className={styles.grid}>
        {shown.map((b) => (
          <article key={b.slug} className={styles.card}>
            <div className={styles.cardImgWrap}>
              <Image
                src={b.image}
                alt={b.name}
                width={300}
                height={300}
                className={styles.cardImg}
                sizes="(max-width: 700px) 45vw, 240px"
                unoptimized
              />
              {b.type === "designer-crossbreed" && (
                <span className={styles.badge}>Designer cross</span>
              )}
            </div>
            <h3 className={styles.cardName}>{b.name}</h3>
            <p className={styles.lookFor}>
              <span className={styles.lookForLabel}>Look for:</span> {b.lookFor}
            </p>
            <ul className={styles.stats}>
              <li>{SIZE_LABELS[b.sizeBand]}</li>
              <li>{SKULL_LABELS[b.skull]}</li>
              <li>{b.weight.replace(/[()]/g, "")}</li>
            </ul>
            <p className={styles.character}>{b.character}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
