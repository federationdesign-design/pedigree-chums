"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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

export default function LineageModal({ name, image, character, lineage, onClose }: Props) {
  const [treeActive, setTreeActive] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    // Flag the page so the site nav steps aside while the pop-up is open, so
    // the close button is the only control in the top corner.
    document.body.classList.add("pc-modal-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      document.body.classList.remove("pc-modal-open");
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className={`${styles.modalOverlay} ${styles.modalOverlaySolo}`} onClick={onClose} role="dialog" aria-modal="true" aria-label={name}>
      <div className={`${styles.modalCard} ${styles.modalCardSolo}`} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.lineageClose} onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <line x1="7" y1="7" x2="25" y2="25" />
            <line x1="25" y1="7" x2="7" y2="25" />
          </svg>
        </button>
        <div className={styles.familyLead}>
          <h3 className={`${styles.modalName} ${styles.familyTitle}`}>{name}</h3>
          <div className={`${styles.familyText} ${treeActive ? styles.familyTextDim : ""}`}>
            {character && <p className={styles.modalChar}>{character}</p>}
          </div>
        </div>
        <div className={styles.familyCol}>
          <BreedTree root={lineage} rootImage={image} onActiveChange={setTreeActive} onClose={onClose} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
