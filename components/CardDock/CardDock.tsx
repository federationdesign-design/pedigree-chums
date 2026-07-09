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
          <span className={styles.abbr}>{item.abbr}</span>
          <span className={styles.label}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
