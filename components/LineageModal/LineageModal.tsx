"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import BreedTree from "../BreedTree/BreedTree";
import type { LineageNode } from "../../data/lineage";
import css from "./LineageModal.module.css";

type Props = {
  name: string;
  image: string;
  character?: string;
  fact?: string;
  lineage: LineageNode;
  onClose: () => void;
};

export default function LineageModal({ name, image, character, lineage, onClose }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    document.body.classList.add("pc-modal-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      document.body.classList.remove("pc-modal-open");
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className={css.overlay} role="dialog" aria-modal="true" aria-label={name}>
      {/* Header: close only, top right; the name lives below the circles */}
      <div className={css.header}>
        <button type="button" className={css.close} onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <line x1="7" y1="7" x2="25" y2="25" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <line x1="25" y1="7" x2="7" y2="25" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* The diagram owns everything below the header. BreedTree runs in
          fill + dockAside mode: caption and breadcrumbs docked at the top,
          circles filling the rest. The character text becomes the caption
          shown at root, replacing the old floating blue box. */}
      <div className={css.stageArea}>
        <BreedTree
          root={lineage}
          rootImage={image}
          centred
          fill
          dockAside
          gravity
          stroke="var(--navy)"
          tinted={false}
          rootNote={character}
          onClose={onClose}
        />
      </div>

      {/* Breed name: centred, below the circles */}
      <h3 className={css.title}>{name}</h3>
    </div>,
    document.body,
  );
}
