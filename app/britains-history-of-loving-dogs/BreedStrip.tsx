"use client";

import Image from "next/image";
import { ukBreeds, type UKBreed } from "../../data/uk-breeds";
import styles from "./history.module.css";

// Bigger dog silhouette for breeds with no square art.
function DogIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.dogIcon}>
      <path d="M4 5l2 1 2-1v3l2 1v8h2v-4h2v4h2v-6l2-1V5l-2 1-1 2h-3l-2-2H6L4 5zm2.5 3.5a.9.9 0 110 1.8.9.9 0 010-1.8z" />
    </svg>
  );
}

// Each era maps to a span of anchor years.
const ERA_RANGES: Record<string, [number, number]> = {
  "ancient-medieval": [0, 1499],
  c1500: [1500, 1699],
  c1700: [1700, 1799],
  early1800: [1800, 1844],
  mid1800: [1845, 1879],
  late1800: [1880, 1899],
  c1900: [1900, 1999],
  crosses: [2000, 9999],
};

const ERA_LABELS: Record<string, string> = {
  "ancient-medieval": "Ancient to medieval",
  c1500: "The 1500s and 1600s",
  c1700: "The 1700s",
  early1800: "The early 1800s",
  mid1800: "The mid-1800s",
  late1800: "The late 1800s",
  c1900: "The 1900s",
  crosses: "Today's crossbreeds",
};

export default function BreedStrip({ era }: { era: string }) {
  const range = ERA_RANGES[era];
  if (!range) return null;
  const breeds: UKBreed[] = ukBreeds.filter(
    (b) => b.anchor >= range[0] && b.anchor <= range[1]
  );
  if (breeds.length === 0) return null;

  return (
    <div className={styles.strip} aria-label={`Breeds: ${ERA_LABELS[era]}`}>
      <span className={styles.stripLabel}>{ERA_LABELS[era]}</span>
      <div className={styles.stripTrack}>
        <div className={styles.stripRow}>
          {breeds.map((b) => (
            <div key={b.name} className={styles.node}>
              <span className={styles.nodeEra}>{b.era}</span>
              <button type="button" className={styles.flipCard}>
                <span className={styles.flipInner}>
                  <span className={styles.flipFront}>
                    <span className={styles.nodeThumb}>
                      {b.image ? (
                        <Image
                          src={b.image}
                          alt={b.name}
                          width={160}
                          height={160}
                          unoptimized
                        />
                      ) : (
                        <DogIcon />
                      )}
                    </span>
                    {b.tag && (
                      <span
                        className={`${styles.nodeTag} ${
                          b.tag === "extinct"
                            ? styles.nodeTagExtinct
                            : styles.nodeTagCross
                        }`}
                      >
                        {b.tag === "extinct" ? "Extinct" : "Cross"}
                      </span>
                    )}
                  </span>
                  <span className={styles.flipBack}>
                    <span className={styles.flipNote}>{b.note}</span>
                  </span>
                </span>
              </button>
              <span className={styles.nodeName}>{b.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
