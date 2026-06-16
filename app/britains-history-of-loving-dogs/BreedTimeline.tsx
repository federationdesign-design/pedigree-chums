"use client";

import { useRef, useCallback } from "react";
import Image from "next/image";
import { ukBreeds } from "../../data/uk-breeds";
import styles from "./history.module.css";

// Simple dog-silhouette icon for breeds we have no square art for.
function DogIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.dogIcon}>
      <path d="M4 5l2 1 2-1v3l2 1v8h2v-4h2v4h2v-6l2-1V5l-2 1-1 2h-3l-2-2H6L4 5zm2.5 3.5a.9.9 0 110 1.8.9.9 0 010-1.8z" />
    </svg>
  );
}

export default function BreedTimeline() {
  const trackRef = useRef<HTMLDivElement>(null);

  // Turn vertical mouse-wheel movement into horizontal scroll along the track.
  const onWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // let real horizontal scroll pass
    const atStart = el.scrollLeft <= 0;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
    // Only hijack the wheel when there is room to scroll horizontally,
    // so the page can still scroll vertically at the track's edges.
    if ((e.deltaY < 0 && atStart) || (e.deltaY > 0 && atEnd)) return;
    e.preventDefault();
    el.scrollLeft += e.deltaY;
  }, []);

  return (
    <section className={styles.timeline}>
      <h2 className={`display ${styles.timelineHeading}`}>
        A timeline of <span className="display-yellow">British dogs</span>
      </h2>
      <p className={styles.timelineIntro}>
        From ancient wolfhounds to today&apos;s designer crosses, scroll through the
        breeds Britain and Ireland gave the world. Oldest on the left, newest on the
        right. Hover a dog to learn more.
      </p>

      <div className={styles.timelineTrack} ref={trackRef} onWheel={onWheel}>
        <div className={styles.timelineRow}>
          {ukBreeds.map((b) => (
            <div key={b.name} className={styles.tlCard} tabIndex={0}>
              <span className={styles.tlEra}>{b.era}</span>
              <div className={styles.tlThumb}>
                {b.image ? (
                  <Image src={b.image} alt={b.name} width={120} height={120} unoptimized />
                ) : (
                  <DogIcon />
                )}
                {b.tag && (
                  <span
                    className={`${styles.tlTag} ${
                      b.tag === "extinct" ? styles.tlTagExtinct : styles.tlTagCross
                    }`}
                  >
                    {b.tag === "extinct" ? "Extinct" : "Cross"}
                  </span>
                )}
              </div>
              <span className={styles.tlName}>{b.name}</span>
              <span className={styles.tlNote}>{b.note}</span>
            </div>
          ))}
        </div>
      </div>
      <p className={styles.timelineHint}>Scroll sideways to travel through time &rarr;</p>
    </section>
  );
}
