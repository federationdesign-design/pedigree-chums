"use client";

import { useEffect } from "react";
import Image from "next/image";
import { type Breed } from "../../data/breeds";
import { getLineage } from "../../data/lineage";
import LineageModal from "../../components/LineageModal/LineageModal";
import styles from "./know.module.css";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const cleanWeight = (w: string) => w.replace(/[()]/g, "").trim();

function BreedModal({ breed, onClose }: { breed: Breed; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const stats: [string, string][] = [
    ["Size", cap(breed.sizeBand)],
    ["Muzzle", cap(breed.skull)],
    ["Weight", cleanWeight(breed.weight)],
    ["Height", breed.height],
    ["Length", breed.length],
  ];

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true" aria-label={breed.name}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose} aria-label="Close">
          &times;
        </button>
        <div className={styles.modalImgWrap}>
          <Image src={breed.image} alt={breed.name} width={600} height={600} className={styles.modalImg} unoptimized />
        </div>
        <div className={styles.modalInfo}>
          <h3 className={styles.modalName}>{breed.name}</h3>
          <p className={styles.modalLookFor}>
            <strong>Look for:</strong> {breed.lookFor}
          </p>
          <dl className={styles.modalStats}>
            {stats.map(([k, v]) => (
              <div key={k} className={styles.modalStatRow}>
                <dt>{k}:</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <h4 className={styles.modalSubhead}>Personality</h4>
          <p className={styles.modalChar}>{breed.character}</p>
          {breed.fact && <p className={styles.modalFact}>Did you know? {breed.fact}.</p>}
        </div>
      </div>
    </div>
  );
}

// Opens the family-tree pop-up when the breed has lineage, else the plain card.
export default function BreedDialog({ breed, onClose }: { breed: Breed; onClose: () => void }) {
  const lineage = getLineage(breed.name);
  return lineage ? (
    <LineageModal
      name={breed.name}
      image={breed.image}
      character={breed.character}
      fact={breed.fact}
      lineage={lineage}
      onClose={onClose}
    />
  ) : (
    <BreedModal breed={breed} onClose={onClose} />
  );
}
