"use client";
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

  if (shortlist.length === 0) return null;

  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        <span className={styles.label}>Liked</span>
        <div className={styles.pills}>
          {shortlist.map((e, i) => (
            <div
              key={`${e.full}-${i}`}
              className={`${styles.pill} ${landingIdx === i ? styles.landing : ""}`}
            >
              <span className={styles.pillName}>{e.nickname && e.nickname !== e.full ? e.nickname : e.full}</span>
              <button
                className={styles.pillRemove}
                onClick={() => onRemove(i)}
                aria-label={`Remove ${e.full}`}
              >×</button>
            </div>
          ))}
        </div>
        <div className={styles.actions}>
          {shortlist.length >= 3 && (
            <button className={styles.knockoutBtn} onClick={onKnockout}>
              🏆 Knockout
            </button>
          )}
          <button className={styles.clearBtn} onClick={onClear} aria-label="Clear shortlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
