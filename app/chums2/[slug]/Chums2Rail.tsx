"use client";

import type { ReactNode } from "react";
import styles from "./Chums2Rail.module.css";

export type RailItem = {
  id: string;
  label: string;
  icon: ReactNode;
};

// Left-edge vertical icon rail for the v2 chum page. Presentational: it renders
// whatever railed items it is given (every card closed on load, plus the
// diagram/tree once they are closed) and reports a click. Placement, open/close
// state and the pop animation live in Chums2Client. Dedicated to /chums2 so the
// live page's CardDock is untouched. (Decision D5.)
export default function Chums2Rail({ items, openIds, onOpen }: { items: RailItem[]; openIds?: Set<string>; onOpen: (id: string) => void }) {
  if (items.length === 0) return null;
  return (
    <div className={styles.rail} role="toolbar" aria-label="Open a card">
      {items.map((item) => {
        // The icon stays in the rail PERMANENTLY (D73 #1). When its card is open it wears
        // the inverted "active" look (yellow tile, navy glyph); clicking then toggles it
        // closed. onOpen is a toggle in the host.
        const isOpen = !!openIds?.has(item.id);
        return (
          <button
            key={item.id}
            type="button"
            className={`${styles.icon} ${isOpen ? styles.iconOpen : ""}`.trim()}
            onClick={() => onOpen(item.id)}
            aria-pressed={isOpen}
            title={`${isOpen ? "Close" : "Open"} ${item.label}`}
            aria-label={`${isOpen ? "Close" : "Open"} ${item.label}`}
          >
            <span className={styles.glyph}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
