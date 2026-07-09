"use client";

import type { FamousDog } from "../../data/famousDogs";
import styles from "./FamousDogsSection.module.css";

interface Props {
  dogs: FamousDog[];
}

function typeColour(type: string): string {
  return TYPE_COLOURS[type] ?? "#ffffff";
}

export default function FamousDogsSection({ dogs }: Props) {
  return (
    <div className={styles.section}>
      <h2 className={styles.heading}>Famous Chums</h2>
      <div className={styles.strip}>
        {dogs.map((dog) => {
          const colour = typeColour(dog.type);
          const icon = TYPE_ICONS[dog.type] ?? "🐕";
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
