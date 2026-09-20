"use client";

/* The pack search: type a breed, pick it from the drop-down, land on its page.

   LIFTED FROM THE HOME PAGE, NOT REWRITTEN (owner instruction, 5 August). The
   behaviour below is the home page's own search, moved here whole: prefix
   match against the 54-dog pack, capped at eight, GO and Enter both taking the
   top match, and a click outside closing the list. app/home/HomeClient.tsx now
   renders this component, so there is one search on the site rather than two
   that can drift. */

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { breeds } from "../../data/breeds";
import styles from "./ChumSearch.module.css";

// `hint` replaces the example-breed placeholder with a fixed one. Opt-in, because
// this search is also on /home, where the "Labrador..." example is doing a different
// job: it shows you what to type. Know your chums asked for a plain instruction
// instead (Steve, 20 September 2026). Pass nothing and /home is unchanged.
export default function ChumSearch({ hint }: { hint?: string } = {}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [example, setExample] = useState("Labrador...");
  const wrapRef = useRef<HTMLDivElement>(null);

  /* Mobile shows a single example breed; wider screens show the full list.

     A FIXED HINT IS DERIVED, NOT STORED. The first version set state inside this
     effect when `hint` was passed, which eslint rejects: a synchronous setState in
     an effect body causes a cascading render. There is nothing to synchronise in
     that case anyway, so the hint simply wins at the point of use below and the
     effect returns before it subscribes to anything. */
  useEffect(() => {
    if (hint) return;
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = () => setExample(mq.matches ? "Labrador" : "Labrador...");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [hint]);

  const placeholder = hint ?? example;

  const filtered = query.trim().length === 0
    ? []
    : breeds.filter((b) =>
        b.name.toLowerCase().startsWith(query.trim().toLowerCase())
      ).slice(0, 8);

  const goToTopMatch = () => {
    if (filtered.length > 0) {
      router.push(`/chums/${filtered[0].slug}`);
      setOpen(false);
    }
  };

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
    <div className={styles.searchWrap} ref={wrapRef}>
      <input
        className={styles.searchInput}
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === "Enter") goToTopMatch(); }}
        autoComplete="off"
        spellCheck={false}
      />
      {query.trim().length > 0 && (
        <button
          type="button"
          className={styles.searchGo}
          onClick={goToTopMatch}
          aria-label="Go"
        >
          GO
        </button>
      )}
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
              <img src={b.image} alt={b.name} className={styles.dropdownThumb} />
              {b.name}
            </Link>
          )) : (
            <div className={styles.dropdownEmpty}>No chums found for &ldquo;{query}&rdquo;</div>
          )}
        </div>
      )}
    </div>
  );
}
