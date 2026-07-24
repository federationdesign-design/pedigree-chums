"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import BreedTree from "../BreedTree/BreedTree";
import CookieBanner from "../CookieBanner/CookieBanner";
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
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const apply = () => setIsNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  const [score, setScore] = useState(0);
  const [scorePulse, setScorePulse] = useState(false);
  const shakeFnRef = useRef<(() => void) | null>(null);
  const addScore = (v: number) => {
    setScore((s) => s + v);
    setScorePulse(true);
    window.setTimeout(() => setScorePulse(false), 400);
  };

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let t: number | undefined;
    try {
      if (!localStorage.getItem("pc-cookie-consent")) {
        t = window.setTimeout(() => window.dispatchEvent(new Event("pc:open-cookies")), 1000);
      }
    } catch { /* private mode */ }
    return () => window.clearTimeout(t);
  }, []);

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
      {/* Score, fixed top-right beside where the in-pit close object starts */}
      <div className={css.scoreTotal + (scorePulse ? " " + css.scorePulse : "")} aria-label={`Score: ${score.toLocaleString("en-GB")}`}>
        {score.toLocaleString("en-GB")}
      </div>
      {/* Title floats over the pit and never affects its size */}
      <h3 className={css.title}>
        {(isNarrow ? titleLines(shownName) : [shownName]).map((line, i, arr) => (
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
          strokeByDepth
          tinted={false}
          namePill
          onShownChange={setShownName}
          hideCaption={!captionOpen}
          onCaptionClose={() => setCaptionOpen(false)}
          onScore={addScore}
          registerShake={(fn) => { shakeFnRef.current = fn; }}
          onToggleCaption={() => setCaptionOpen((o) => !o)}
          onPitClose={onClose}
          rootNote={character}
          onClose={onClose}
        />
        {/* Pit floor, same graphic as the main pit */}
        <img src="/floor-shortened-svg.svg" alt="" aria-hidden="true" className={css.floor} />
      </div>

      {/* Shake button, straight from the pit: jelly icon, bottom right */}
      <button
        type="button"
        className={css.shake}
        onClick={(e) => {
          shakeFnRef.current?.();
          const el = e.currentTarget;
          el.classList.add(css.shakeFlash);
          window.setTimeout(() => el.classList.remove(css.shakeFlash), 300);
        }}
        aria-label="Shake the pit"
      >
        <span className={css.shakeIcon} aria-hidden="true" />
      </button>

      {/* The cookie notice must be reachable above this overlay */}
      <CookieBanner />
    </div>,
    document.body,
  );
}
