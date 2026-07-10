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

  /* Temperament -- brain */
  infoBox: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5a7 7 0 0 0-7 7c0 1.9.76 3.63 2 4.9V19a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2.1A7 7 0 0 0 19 12a7 7 0 0 0-7-7z"/>
      <path d="M9 12h.01M15 12h.01M9.5 15.5s1 1 2.5 1 2.5-1 2.5-1"/>
      <path d="M5 12H3M21 12h-2"/>
      <path d="M12 5V3"/>
    </svg>
  ),

  /* Ancestry -- tree */
  ancestry: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="4" rx="1"/>
      <rect x="2" y="18" width="6" height="4" rx="1"/>
      <rect x="16" y="18" width="6" height="4" rx="1"/>
      <path d="M12 6v4M12 10H5v8M12 10h7v8"/>
    </svg>
  ),

  /* Lifespan -- hourglass */
  lifespanExplain: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 2h14M5 22h14"/>
      <path d="M6 2v4l5 5-5 5v4"/>
      <path d="M18 2v4l-5 5 5 5v4"/>
    </svg>
  ),

  /* Cost to care -- £ */
  runningCost: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.5 6.5A4 4 0 0 0 8 9v2H6"/>
      <path d="M8 13H6"/>
      <path d="M8 17h9"/>
      <circle cx="12" cy="12" r="10"/>
    </svg>
  ),

  /* Suitability -- jigsaw piece */
  suitability: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.9 14H2a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h2c0-1.1.9-2 2-2V6a1 1 0 0 1 1-1h2c0-1.1.9-2 2-2s2 .9 2 2h2a1 1 0 0 1 1 1v2c1.1 0 2 .9 2 2s-.9 2-2 2v2a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2z"/>
    </svg>
  ),

  /* Exercise -- running figure */
  exercise: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13" cy="4" r="1.5"/>
      <path d="M9 8l2 2 2-3 3 1.5"/>
      <path d="M7 13l2-4 3 2 2 5"/>
      <path d="M14 20l-2-3-3 3"/>
      <path d="M17 10l-2 1"/>
    </svg>
  ),

  /* Grooming -- scissors */
  grooming: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3"/>
      <circle cx="6" cy="18" r="3"/>
      <path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12"/>
    </svg>
  ),

  /* Training -- mortarboard */
  training: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 22 8 12 14 2 8 12 2"/>
      <path d="M6 11v5c0 2 2.67 3 6 3s6-1 6-3v-5"/>
      <path d="M22 8v6"/>
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
