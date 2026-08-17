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
//
// MOBILE (<=768px) COLLAPSE: below 769px the two boxes are too wide to sit
// beside the hamburger with the logo showing, so they collapse behind a single
// master icon that matches the hamburger exactly and opens the five controls as
// a dropdown. Any active setting is echoed as a small chip to the LEFT of the
// master icon (the active scheme's own sample, and the crossed-photo when images
// are hidden, so both can show at once). Desktop is unchanged: it still renders
// the two segmented boxes, and the mobile cluster is display:none there.

import { useEffect, useRef, useState } from "react";
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
  // Mobile only: the master-icon dropdown open state. Never opened on desktop
  // (the trigger is display:none there), so it stays false.
  const [open, setOpen] = useState(false);
  const clusterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLocalScheme(getScheme());
    setHidden(getHideImages());
  }, []);

  // Dismiss the mobile dropdown on an outside tap or Escape. Only wired while
  // open, so there is no idle listener.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!clusterRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

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
      {/* DESKTOP (>=769px): the two segmented boxes, unchanged. Hidden <=768px. */}
      <div className={`${styles.box} ${styles.boxSchemes} ${styles.desktopBox}`} role="group" aria-label="Accessibility scheme">
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

      <div className={`${styles.box} ${styles.desktopBox}`} role="group" aria-label="Images">
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

      {/* MOBILE (<=768px): active-state chips, then the master icon that opens the
          dropdown. Order left to right ends up: chips, master, hamburger (the
          hamburger is the master's sibling in the header). Hidden on desktop. */}
      <div className={styles.mobileCluster} ref={clusterRef}>
        {/* Active scheme chip: the scheme's own sample (reusing the aBlackOnWhite /
            aWhiteOnBlack class names so the scheme-mode overrides already cover it). */}
        {scheme === "black-on-white" && (
          <span className={`${styles.chip} ${styles.aBlackOnWhite}`} aria-hidden="true"><span>A</span></span>
        )}
        {scheme === "white-on-black" && (
          <span className={`${styles.chip} ${styles.aWhiteOnBlack}`} aria-hidden="true"><span>A</span></span>
        )}
        {/* Hide-images chip: the crossed photo, shown only while images are hidden. */}
        {hidden && (
          <span className={`${styles.chip} ${styles.chipHide}`} aria-hidden="true">{CrossedPhoto}</span>
        )}

        <div className={styles.masterWrap}>
          <button
            type="button"
            className={styles.master}
            aria-haspopup="true"
            aria-expanded={open}
            aria-label="Accessibility options"
            onClick={() => setOpen((o) => !o)}
          >
            <span className={styles.masterGlyph} aria-hidden="true" />
          </button>

          {open && (
            <div className={styles.panel} role="group" aria-label="Accessibility settings">
              <button
                type="button"
                className={`${styles.panelBtn} ${styles.aDefault}`}
                aria-pressed={scheme === null}
                aria-label="Default colours"
                onClick={() => chooseScheme(null)}
              >
                <span aria-hidden="true">A</span>
              </button>
              <button
                type="button"
                className={`${styles.panelBtn} ${styles.aBlackOnWhite}`}
                aria-pressed={scheme === "black-on-white"}
                aria-label="Black on white"
                onClick={() => chooseScheme("black-on-white")}
              >
                <span aria-hidden="true">A</span>
              </button>
              <button
                type="button"
                className={`${styles.panelBtn} ${styles.aWhiteOnBlack}`}
                aria-pressed={scheme === "white-on-black"}
                aria-label="White on black"
                onClick={() => chooseScheme("white-on-black")}
              >
                <span aria-hidden="true">A</span>
              </button>
              <button
                type="button"
                className={styles.panelBtn}
                aria-pressed={hidden}
                aria-label={hidden ? "Show images" : "Hide images"}
                onClick={toggleImages}
              >
                {CrossedPhoto}
              </button>
              <button
                type="button"
                className={styles.panelBtn}
                aria-label="Reset accessibility settings"
                onClick={reset}
              >
                {Refresh}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
