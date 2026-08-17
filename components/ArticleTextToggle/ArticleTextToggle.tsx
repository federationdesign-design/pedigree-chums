"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ArticleTextToggle.module.css";

// Per-page body-text colour toggle for the essay articles (Dogs at Work, Good
// Dog Bad Dog, smarter-than-the-test). Default is the black shipped in ea480b7e
// (the WCAG-compliant state); this flips every .essayBody paragraph on the page
// to white in one action. Scope is paragraphs only, exactly as the black change:
// the white override lives in each essay CSS module as
//   :root:not([data-pc-contrast-scheme]) main[data-pc-textinvert="on"] .essayBody p
// so headings, panels and chrome are untouched, and a future accessibility
// toolbar (which sets data-pc-contrast-scheme on <html>) wins automatically.
//
// State persists per tab in sessionStorage keyed on the pathname, and resets
// when the browser session ends. SSR emits no attribute, so black is always the
// first paint; the client applies a stored white choice after hydration.
//
// Opt-in cost (documented): white body text bottoms out at ~1.45:1 on the site
// gradient (cyan end), failing WCAG 1.4.3 at every position. This is a
// deliberate, user-initiated non-compliant state.

const keyFor = () => "pc-textinvert:" + window.location.pathname;

// `centered` centres the control in its full-width row instead of hugging the
// shared left essay axis. The essays render it prop-less (left-aligned on that
// axis); /home opts in because it has no essay axis to line up with.
export default function ArticleTextToggle({ centered = false }: { centered?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [white, setWhite] = useState(false);

  useEffect(() => {
    const main = ref.current?.closest("main");
    const on = sessionStorage.getItem(keyFor()) === "1";
    setWhite(on);
    if (main) {
      if (on) main.setAttribute("data-pc-textinvert", "on");
      else main.removeAttribute("data-pc-textinvert");
    }
    // Clear on unmount (navigation) so the attribute never lingers on the shell.
    return () => main?.removeAttribute("data-pc-textinvert");
  }, []);

  const toggle = () => {
    const main = ref.current?.closest("main");
    const next = !white;
    setWhite(next);
    if (main) {
      if (next) main.setAttribute("data-pc-textinvert", "on");
      else main.removeAttribute("data-pc-textinvert");
    }
    if (next) sessionStorage.setItem(keyFor(), "1");
    else sessionStorage.removeItem(keyFor());
  };

  return (
    <div ref={ref} className={centered ? styles.wrap + " " + styles.wrapCentered : styles.wrap}>
      <button
        type="button"
        className={styles.toggle}
        aria-pressed={white}
        aria-label={white ? "Switch to black text" : "Switch to white text"}
        onClick={toggle}
      >
        <span className={styles.icon} aria-hidden="true">◐</span>
      </button>
    </div>
  );
}
