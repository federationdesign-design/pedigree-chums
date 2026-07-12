"use client";

import type { FamousDog } from "../../data/famousDogs";
import styles from "./FamousDogsSection.module.css";

interface Props {
  dogs: FamousDog[];
}

const TYPE_COLOURS: Record<string, string> = {
  "Real":                   "#22c55e",
  "Animated":               "#5cc4ee",
  "Live-action film":       "#ffd23e",
  "Live-action TV":         "#ffd23e",
  "Literature":             "#fb923c",
  "Literature / film":      "#fb923c",
  "Literature / animation": "#fb923c",
  "Advertising":            "#a855f7",
  "Comics":                 "#5cc4ee",
  "Comics / film":          "#5cc4ee",
  "Real / animation":       "#22c55e",
  "Legend":                 "#fb923c",
  "Mascot":                 "#a855f7",
};

function typeColour(type: string): string {
  return TYPE_COLOURS[type] ?? "#ffffff";
}

const TYPE_ORDER: Record<string, number> = {
  "Real":                   0,
  "Real / animation":       0,
  "Legend":                 1,
  "Live-action TV":         2,
  "Live-action film":       2,
  "Literature":             3,
  "Literature / film":      3,
  "Literature / animation": 3,
  "Animated":               4,
  "Comics":                 5,
  "Comics / film":          5,
  "Advertising":            6,
  "Mascot":                 6,
};

function typeOrder(type: string): number {
  return TYPE_ORDER[type] ?? 99;
}

export default function FamousDogsSection({ dogs }: Props) {
  const sorted = [...dogs].sort((a, b) => typeOrder(a.type) - typeOrder(b.type));
  if (sorted.length === 0) return null;
  return (
    <div className={styles.section}>
      <h2 className={styles.heading}>Famous Chums</h2>
      <div className={styles.strip}>
        {sorted.map((dog) => {
          const colour = typeColour(dog.type);
          return (
            <a
              key={dog.name}
              href={dog.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.card}
            >
              <span className={styles.typePill} style={{ color: colour, borderColor: colour }}>
                {dog.type}
              </span>
              <span className={styles.name}>{dog.name}</span>
              <span className={styles.knownFor}>{dog.knownFor}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
