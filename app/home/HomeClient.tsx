"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import styles from "./home.module.css";
import { breeds } from "../../data/breeds";

export default function HomeClient() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim().length === 0
    ? []
    : breeds.filter((b) =>
        b.name.toLowerCase().startsWith(query.trim().toLowerCase())
      ).slice(0, 8);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <>
      {/* Hero image */}
      <section className={styles.hero}>
        <div className={styles.heroImg} aria-hidden="true" />
        <div className={styles.heroTint} aria-hidden="true" />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Pedigree <span>Chums</span></h1>
          <p className={styles.heroSub}>The on-the-go dog spotting game. 54 breeds to discover.</p>
        </div>
      </section>

      {/* Search hero */}
      <section className={styles.searchHero}>
        <p className={styles.searchEyebrow}>54 breeds to discover</p>
        <h1 className={styles.searchTitle}>
          Explore Britain&apos;s most <span>popular breeds</span>
        </h1>
        <p className={styles.searchSub}>
          Type a breed to explore its family tree, history, and personality
        </p>
        <div className={styles.searchWrap} ref={wrapRef}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Labrador, Cockapoo, Pug..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            autoComplete="off"
            spellCheck={false}
          />
          <span className={styles.searchIcon}>🐾</span>
          {open && query.trim().length > 0 && (
            <div className={styles.dropdown}>
              {filtered.length > 0 ? filtered.map((b) => (
                <Link
                  key={b.slug}
                  href={`/chums/${b.slug}`}
                  className={styles.dropdownItem}
                  onClick={() => { setOpen(false); setQuery(""); }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={b.image}
                    alt={b.name}
                    className={styles.dropdownThumb}
                  />
                  {b.name}
                </Link>
              )) : (
                <div className={styles.dropdownEmpty}>No chums found for &ldquo;{query}&rdquo;</div>
              )}
            </div>
          )}
        </div>
      </section>


      {/* Product section */}
      <section className={styles.product}>
        <div className={styles.productImage}>
          <span className={styles.productCorner}>Pre-order</span>
        </div>
        <div className={styles.productContent}>
          <h2 className={styles.productTitle}>
            Pedigree <span>Chums</span>
          </h2>
          <p className={styles.productDesc}>
            The on-the-go dog spotting game for curious minds and dog lovers. 54 illustrated breed cards packed with traits, stats, and tell-tale features. Spot a dog. Call it out. Claim your chum.
          </p>
          <div className={styles.productMeta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Players</span>
              <span className={styles.metaValue}>2+</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Age</span>
              <span className={styles.metaValue}>7+</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Where</span>
              <span className={styles.metaValue}>Anywhere</span>
            </div>
          </div>
          <div className={styles.productCta}>
            <button
              className={styles.btnPrimary}
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("pc:open-offer"))}
            >
              Pre-order now
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
