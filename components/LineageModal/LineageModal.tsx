"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import BreedTree from "../BreedTree/BreedTree";
import CardDock from "../CardDock/CardDock";
import type { LineageNode } from "../../data/lineage";
import css from "./LineageModal.module.css";

// Breed names longer than 11 characters break onto a second line at the
// nearest word boundary, so long names never force a tiny single line.
function titleLines(name: string): string[] {
  if (name.length <= 11 || !name.includes(" ")) return [name];
  const words = name.split(" ");
  let first = words[0];
  let i = 1;
  while (i < words.length && (first + " " + words[i]).length <= 11) {
    first += " " + words[i];
    i++;
  }
  const rest = words.slice(i).join(" ");
  return rest ? [first, rest] : [first];
}

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
  const [shownName, setShownName] = useState(name);
  const [captionOpen, setCaptionOpen] = useState(false); // closed from the start

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
      {/* Header: close top right; centred title follows the hovered circle */}
      <div className={css.header}>
        <button type="button" className={css.close} onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <line x1="7" y1="7" x2="25" y2="25" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <line x1="25" y1="7" x2="7" y2="25" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <h3 className={css.title}>
        {titleLines(shownName).map((line, i, arr) => (
          <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
        ))}
      </h3>

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
          namePill
          onShownChange={setShownName}
          hideCaption={!captionOpen}
          onCaptionClose={() => setCaptionOpen(false)}
          rootNote={character}
          onClose={onClose}
        />
        {/* Pit floor, same graphic as the main pit */}
        <img src="/floor-shortened-svg.svg" alt="" aria-hidden="true" className={css.floor} />
      </div>

      {/* Reopen icon for the description box, chum-page style */}
      {!captionOpen && (
        <CardDock
          items={[{ id: "ancestry", label: "Description", abbr: "AN" }]}
          onReopen={() => setCaptionOpen(true)}
        />
      )}
    </div>,
    document.body,
  );
}
