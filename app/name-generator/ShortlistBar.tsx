"use client";
import { useEffect, useRef } from "react";
import styles from "./ShortlistBar.module.css";

export type ShortlistEntry = { full: string; nickname: string; score: number; breed: string };

type Props = {
  shortlist: ShortlistEntry[];
  onRemove: (idx: number) => void;
  onClear: () => void;
  onKnockout: () => void;
  landingIdx: number | null; // index that just landed (for animation)
};

export default function ShortlistBar({ shortlist, onRemove, onClear, onKnockout, landingIdx }: Props) {
  const barRef = useRef<HTMLDivElement>(null);

  // Scroll to end when new name added
  useEffect(() => {
    if (barRef.current) barRef.current.scrollLeft = barRef.current.scrollWidth;
  }, [shortlist.length]);

  if (shortlist.length === 0) return null;

  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        <span className={styles.label}>❤️ Liked</span>
        <div ref={barRef} className={styles.pills}>
          {shortlist.map((e, i) => (
            <div
              key={`${e.full}-${i}`}
              className={`${styles.pill} ${landingIdx === i ? styles.landing : ""}`}
            >
              <span className={styles.pillName}>{e.full}</span>
              {e.nickname && e.nickname !== e.full && (
                <span className={styles.pillNick}> "{e.nickname}"</span>
              )}
              <button
                className={styles.pillRemove}
                onClick={() => onRemove(i)}
                aria-label={`Remove ${e.full}`}
              >×</button>
            </div>
          ))}
        </div>
        <div className={styles.actions}>
          {shortlist.length >= 2 && (
            <button className={styles.knockoutBtn} onClick={onKnockout}>
              🏆 Knockout
            </button>
          )}
          <button className={styles.clearBtn} onClick={onClear} aria-label="Clear shortlist">
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}
