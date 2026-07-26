"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import BreedTree from "../BreedTree/BreedTree";
import CookieBanner from "../CookieBanner/CookieBanner";
import type { LineageNode } from "../../data/lineage";
import { levelThemeFor } from "../../data/levelThemes";
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
  nextLevelLabel?: string;
  initialScore?: number;
  onScoreChange?: (s: number) => void;
  onNextLevel?: () => void;
  onStartOver?: () => void;
  // history-page era strip, e.g. "ancient-medieval". Picks the pit's themed
  // background; an era with no artwork keeps the plain blue gradient.
  era?: string;
};

export default function LineageModal({ name, image, character, lineage, onClose, nextLevelLabel, onNextLevel, onStartOver, initialScore, onScoreChange, era }: Props) {
  const theme = levelThemeFor(era);
  const [mounted, setMounted] = useState(false);
  const [shownName, setShownName] = useState(name);
  const [captionOpen, setCaptionOpen] = useState(false); // hidden behind the info icon (rolled back by request)
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const apply = () => setIsNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  const [score, setScore] = useState(initialScore ?? 0); // campaign total rides in across levels
  useEffect(() => { onScoreChange?.(score); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [score]);
  const [phase, setPhase] = useState<"play" | "won" | "lost">("play");
  // The start screen is bare: no shake, no slow motion. They arrive with the
  // round, so nothing is offered that cannot do anything yet.
  const [running, setRunning] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const replay = () => {
    setPhase("play");
    setScore(0);
    setSlowmo(false); // a fresh pit always starts at full speed
    setCaptionOpen(false);
    setRunKey((k) => k + 1); // remounts the pit fresh
  };
  const [scorePulse, setScorePulse] = useState(false);
  const shakeFnRef = useRef<(() => void) | null>(null);
  const slowmoFnRef = useRef<(() => void) | null>(null);
  const [slowmo, setSlowmo] = useState(false);
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
          key={runKey}
          root={lineage}
          rootImage={image}
          centred
          fill
          dockAside
          gravity
          strokeByDepth
          tinted={false}
          onShownChange={setShownName}
          levelTheme={theme}
          onStartedChange={setRunning}
          hideCaption={!captionOpen}
          onCaptionClose={() => setCaptionOpen(false)}
          onScore={addScore}
          registerShake={(fn) => { shakeFnRef.current = fn; }}
          registerSlowmo={(fn) => { slowmoFnRef.current = fn; }}
          onToggleCaption={() => setCaptionOpen((o) => !o)}
          onPitClose={onClose}
          onRoundWon={() => {
            setPhase("won");
            // celebration: confetti over the flash (canvas-confetti, CDN pattern)
            const fire = () => (window as any).confetti?.({ particleCount: 180, spread: 110, origin: { x: 0.5, y: 0.45 }, colors: ["#ffe227", "#ffffff", "#22c55e", "#ff6b6b"], startVelocity: 45 });
            if ((window as any).confetti) fire();
            else {
              const sc = document.createElement("script");
              sc.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js";
              sc.onload = fire;
              document.body.appendChild(sc);
            }
          }}
          onPitFull={() => setPhase("lost")}
          rootNote={character}
          onClose={onClose}
        />
        {/* Pit floor, same graphic as the main pit. A themed level brings its
            own ground art, so the default strip stands down rather than
            doubling up underneath it. */}
        {!theme && <img src="/floor-shortened-svg.svg" alt="" aria-hidden="true" className={css.floor} />}
      </div>

      {/* Slow motion, straight from the main pit: snail icon, sits above shake.
          Quarter speed while active, navy while on. */}
      {running && (
        <>
        <button
          type="button"
          className={`${css.slowmo}${slowmo ? " " + css.slowmoActive : ""}`}
          onClick={() => { slowmoFnRef.current?.(); setSlowmo((s2) => !s2); }}
          aria-label={slowmo ? "Normal speed" : "Slow motion"}
        >
          <img src="/svg-snail-icon.svg" alt="" aria-hidden="true" className={css.slowmoIcon} />
        </button>

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
        </>
      )}

      {/* Round won / game over, main-pit flash styling */}
      {phase !== "play" && (
        <div className={css.endOverlay} role="alertdialog" aria-label={phase === "won" ? "Round won" : "Game over"}>
          <div className={css.endFlash} style={phase === "won" ? { fontSize: "clamp(6.8rem, 24vw, 16rem)" } : undefined}>{phase === "won" ? "ROUND WON" : "GAME OVER"}</div>
          <div className={css.endBtns}>
            {phase === "lost" && onStartOver && (
              <button type="button" className={css.endBtn} onClick={onStartOver}>Start again</button>
            )}
            {phase === "won" && nextLevelLabel && onNextLevel && (
              <button type="button" className={css.endBtn} onClick={onNextLevel} style={{ transform: "scale(0.5)", transformOrigin: "center top", background: "#22c55e", borderColor: "#15803d" }}>{nextLevelLabel}</button>
            )}
            {(phase === "lost" || !nextLevelLabel || !onNextLevel) && (
              <button type="button" className={`${css.endBtn} ${css.endBtnAlt}`} onClick={onClose}>Close</button>
            )}
          </div>
        </div>
      )}

      {/* The cookie notice must be reachable above this overlay */}
      <CookieBanner />
    </div>,
    document.body,
  );
}
