"use client";

import { useEffect, useRef, useState } from "react";
import { PANELS } from "./panels";
import styles from "./IntroGuide.module.css";

/* THE INTRO GUIDE, how to play (owner, J18-323, 1 October 2026): ten panels over a chum's intro
   video, shown on a player's first game and reopened from the yellow ? button.
   The intro owns the video and pauses it while this is open; this component only
   draws the panels and reports when it is closed. Next steps on, the last says
   "Let's play", Skip closes at any point, Escape closes, the arrows step. A tap
   inside never reaches the intro's own tap-to-skip.
   NOT components/HowToPlay, which is the older step-by-step guide used by the
   card rail and the main pit. */

export const INTRO_GUIDE_KEY = "pc-intro-guide-seen";

export function introGuideSeen(): boolean {
  try { return window.localStorage.getItem(INTRO_GUIDE_KEY) === "1"; } catch { return true; }
}

export default function IntroGuide({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  const artRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const panel = PANELS[i];
  const last = i === PANELS.length - 1;

  const close = () => {
    try { window.localStorage.setItem(INTRO_GUIDE_KEY, "1"); } catch { /* private mode: shows again next time */ }
    onClose();
  };

  // Panel 1's pit fills from script; any other panel is CSS only.
  useEffect(() => {
    const svg = artRef.current?.querySelector("svg");
    if (!svg || !panel.run) return;
    return panel.run(svg);
  }, [panel]);

  useEffect(() => { nextRef.current?.focus(); }, []);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); if (last) close(); else setI(i + 1); }
    else if (e.key === "ArrowLeft" && i > 0) { e.preventDefault(); setI(i - 1); }
  };

  return (
    <div
      className={styles.scrim}
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-guide-title"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={onKey}
    >
      <div className={styles.panel}>
        <div ref={artRef} className={styles.art} aria-hidden="true" dangerouslySetInnerHTML={{ __html: panel.art }} />
        <h2 id="intro-guide-title" className={styles.title}>{panel.title}</h2>
        <p className={styles.text}>{panel.text}</p>
        <div className={styles.dots} aria-hidden="true">
          {PANELS.map((p, k) => <span key={p.title} className={`${styles.dot}${k === i ? " " + styles.dotOn : ""}`} />)}
        </div>
        <p className={styles.srOnly} aria-live="polite">{`Step ${i + 1} of ${PANELS.length}`}</p>
        <div className={styles.row}>
          <button type="button" className={styles.skip} onClick={close}>Skip</button>
          <button ref={nextRef} type="button" className={styles.next} onClick={() => (last ? close() : setI(i + 1))}>
            {last ? "Let's play" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
