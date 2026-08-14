"use client";

// Task 8. The accessibility toolbar: two segmented boxes on the header axis.
// Box one is the three colour schemes, each drawn as the letter A in the scheme
// it applies; the active one is outlined. Box two is hide-images (a crossed
// photo, name flips hide/show) and reset (a refresh glyph). Icons only, no text
// labels; state rides on aria-pressed and the outline, never colour alone
// (decision 5). It drives the plumbing from tasks 5 to 7 via lib/contrastScheme.
//
// Reset clears the scheme and hide-images only. The per-article text toggle is
// left untouched: it is gated on :root:not([data-pc-contrast-scheme]) and keyed
// in sessionStorage, so clearing the scheme restores whatever it was set to
// (decision 15).

import { useEffect, useState } from "react";
import {
  getScheme, setScheme, clearScheme, type ContrastScheme,
  getHideImages, setHideImages,
} from "../../lib/contrastScheme";
import styles from "./PcContrastToolbar.module.css";

const CrossedPhoto = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="8.5" cy="9.5" r="1.5" />
    <path d="M21 15l-4.5-4.5L7 20" />
    <path d="M3.5 3.5l17 17" />
  </svg>
);

const Refresh = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8 8 0 1 0-.9 4.5" />
    <path d="M20 4v6h-6" />
  </svg>
);

export default function PcContrastToolbar() {
  const [scheme, setLocalScheme] = useState<ContrastScheme | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setLocalScheme(getScheme());
    setHidden(getHideImages());
  }, []);

  const chooseScheme = (next: ContrastScheme | null) => {
    if (next) setScheme(next); else clearScheme();
    setLocalScheme(next);
  };

  const toggleImages = () => {
    const next = !hidden;
    setHideImages(next);
    setHidden(next);
  };

  const reset = () => {
    clearScheme();
    setHideImages(false);
    setLocalScheme(null);
    setHidden(false);
  };

  return (
    <div className={styles.toolbar}>
      <div className={`${styles.box} ${styles.boxSchemes}`} role="group" aria-label="Accessibility scheme">
        {(scheme !== null || hidden) && (
          <button
            type="button"
            className={styles.cell}
            aria-label="Reset accessibility settings"
            onClick={reset}
          >
            {Refresh}
          </button>
        )}
        <button
          type="button"
          className={`${styles.cell} ${styles.aDefault}`}
          aria-pressed={scheme === null}
          aria-label="Default colours"
          onClick={() => chooseScheme(null)}
        >
          <span aria-hidden="true">A</span>
        </button>
        <button
          type="button"
          className={`${styles.cell} ${styles.aBlackOnWhite}`}
          aria-pressed={scheme === "black-on-white"}
          aria-label="Black on white"
          onClick={() => chooseScheme("black-on-white")}
        >
          <span aria-hidden="true">A</span>
        </button>
        <button
          type="button"
          className={`${styles.cell} ${styles.aWhiteOnBlack}`}
          aria-pressed={scheme === "white-on-black"}
          aria-label="White on black"
          onClick={() => chooseScheme("white-on-black")}
        >
          <span aria-hidden="true">A</span>
        </button>
      </div>

      <div className={styles.box} role="group" aria-label="Images">
        <button
          type="button"
          className={styles.cell}
          aria-pressed={hidden}
          aria-label={hidden ? "Show images" : "Hide images"}
          onClick={toggleImages}
        >
          {CrossedPhoto}
        </button>
      </div>
    </div>
  );
}
