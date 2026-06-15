"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./know.module.css";

type Bar = { name: string; pct: number; img: string | null };

// RVC VetCompass (O'Neill et al. 2023), UK 2019 demography.
const ALL_AGES: Bar[] = [
  { name: "Labrador Retriever", pct: 6.9, img: "/lab-square.png" },
  { name: "Jack Russell Terrier", pct: 4.5, img: null },
  { name: "English Cocker Spaniel", pct: 4.3, img: "/cocker-square.png" },
  { name: "Staffordshire Bull Terrier", pct: 4.2, img: "/staffy-square.png" },
  { name: "Chihuahua", pct: 3.6, img: "/Chihuahua-square.png" },
];

const PUPPIES: Bar[] = [
  { name: "French Bulldog", pct: 7.0, img: "/frenchy-square.png" },
  { name: "Cockapoo", pct: 6.2, img: "/cockapoo-square.png" },
  { name: "Labrador Retriever", pct: 5.8, img: "/lab-square.png" },
  { name: "English Cocker Spaniel", pct: 4.7, img: "/cocker-square.png" },
  { name: "Chihuahua", pct: 4.2, img: "/Chihuahua-square.png" },
];

const MAX_PCT = 7.0; // longest bar = French Bulldog 7.0%

function BarTable({ title, bars }: { title: string; bars: Bar[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className={styles.statBlock} ref={ref}>
      <h3 className={styles.statTitle}>{title}</h3>
      {bars.map((b, i) => (
        <div className={styles.barRow} key={`${b.name}-${i}`}>
          <div className={styles.barThumb}>
            {b.img ? (
              <Image src={b.img} alt={b.name} width={56} height={56} unoptimized />
            ) : (
              <span className={styles.barThumbPaw} aria-hidden="true">
                🐾
              </span>
            )}
          </div>
          <div className={styles.barMain}>
            <span className={styles.barName}>{b.name}</span>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{ width: inView ? `${(b.pct / MAX_PCT) * 100}%` : "0%" }}
              >
                <span className={styles.barPct}>{b.pct.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BreedStats() {
  return (
    <section className={styles.statsSection}>
      <h2 className={`display ${styles.statsHeading}`}>
        The trends <span className="display-yellow">&amp; stats</span>
      </h2>
      <p className={styles.statsIntro}>
        The share of the UK dog population made up by each breed. Look at the
        puppies: the French Bulldog and Cockapoo have surged to the top, a sign of
        the designer-crossbreed boom.
      </p>
      <div className={styles.statGrid}>
        <BarTable title="Most common breeds (all ages)" bars={ALL_AGES} />
        <BarTable title="Most common puppy breeds (under one year)" bars={PUPPIES} />
      </div>
      <p className={styles.source}>Source: RVC VetCompass, O&apos;Neill et al. (2023).</p>
    </section>
  );
}
