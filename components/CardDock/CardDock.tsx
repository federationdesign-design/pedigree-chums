"use client";

import styles from "./CardDock.module.css";

export interface DockItem {
  id: string;
  label: string;
  abbr: string;
}

interface Props {
  items: DockItem[];
  onReopen: (id: string) => void;
}

const ICONS: Record<string, JSX.Element> = {
  infoBox: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
      <path d="M12 8v4M12 16h.01"/>
    </svg>
  ),
  ancestry: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="2"/>
      <circle cx="5" cy="19" r="2"/>
      <circle cx="19" cy="19" r="2"/>
      <path d="M12 7v4M12 11l-5 6M12 11l5 6"/>
    </svg>
  ),
  lifespanExplain: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3"/>
    </svg>
  ),
  runningCost: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  suitability: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  exercise: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
  grooming: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/>
      <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1 1 2.97.9 3.5 3.02.5 2.08 2.86 2.54 4.5 1.5 1.6-1 1.34-2.3.5-3.5-.83-1.14-1.5-2.5-3.5-3.06z"/>
    </svg>
  ),
  training: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
};

export default function CardDock({ items, onReopen }: Props) {
  if (items.length === 0) return null;

  return (
    <div className={styles.dock}>
      {items.map((item) => (
        <button
          key={item.id}
          className={styles.icon}
          onClick={() => onReopen(item.id)}
          title={`Reopen ${item.label}`}
          aria-label={`Reopen ${item.label}`}
        >
          <span className={styles.abbr}>{ICONS[item.id] ?? item.abbr}</span>
          <span className={styles.label}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
