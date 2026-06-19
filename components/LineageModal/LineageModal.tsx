"use client";

import { useState, useEffect } from "react";
import BreedTree from "../BreedTree/BreedTree";
import type { LineageNode } from "../../data/lineage";
import styles from "../../app/know-your-chums/know.module.css";

type Props = {
  name: string;
  image: string;
  character?: string;
  fact?: string;
  lineage: LineageNode;
  onClose: () => void;
};

export default function LineageModal({ name, image, character, fact, lineage, onClose }: Props) {
  const [treeActive, setTreeActive] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true" aria-label={name}>
      <div className={`${styles.modalCard} ${styles.modalCardSolo}`} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose} aria-label="Close">
          &times;
        </button>

        <div className={styles.familyLead}>
          <h3 className={`${styles.modalName} ${styles.familyTitle}`}>{name}</h3>
          <div className={`${styles.familyText} ${treeActive ? styles.familyTextDim : ""}`}>
            <h4 className={`${styles.modalSubhead} ${styles.familySub}`}>Where the breed comes from</h4>
            {character && <h4 className={styles.modalSubhead}>Personality</h4>}
            {character && <p className={styles.modalChar}>{character}</p>}
            {fact && <p className={styles.modalFact}>Did you know? {fact}.</p>}
          </div>
        </div>
        <div className={styles.familyCol}>
          <BreedTree root={lineage} rootImage={image} onActiveChange={setTreeActive} />
        </div>
      </div>
    </div>
  );
}
