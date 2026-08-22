"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./LeaveDialog.module.css";

/* Sitewide "you are about to leave our site" dialogue.

   ONE instance, mounted once in app/layout.tsx (inside #pc-site, so it keeps the
   same scheme treatment the two inline copies had). Any outbound link opens it by
   calling confirmLeave(href): either through the <OutboundLink> anchor wrapper, or
   directly via useLeaveDialog() for the few triggers that are not anchors (the
   history breed-card source spans, the name-generator tweet share).

   Replaces the duplicated inline dialogs in BreedStrip.tsx and TimelineRun.tsx.
   The copy and styling are unchanged from those; this version adds Escape-to-close
   and focus handling the inline ones lacked. */

type LeaveDialogContextValue = { confirmLeave: (href: string) => void };

const LeaveDialogContext = createContext<LeaveDialogContextValue | null>(null);

export function useLeaveDialog(): LeaveDialogContextValue {
  const ctx = useContext(LeaveDialogContext);
  if (!ctx) throw new Error("useLeaveDialog must be used within a LeaveDialogProvider");
  return ctx;
}

export default function LeaveDialogProvider({ children }: { children: ReactNode }) {
  const [leaving, setLeaving] = useState<string | null>(null);
  const goRef = useRef<HTMLButtonElement>(null);
  // The element focused before the dialogue opened, restored on close so keyboard
  // focus returns to the link the user activated.
  const returnFocus = useRef<Element | null>(null);

  const confirmLeave = useCallback((href: string) => {
    returnFocus.current = document.activeElement;
    setLeaving(href);
  }, []);

  const close = useCallback(() => {
    setLeaving(null);
    const el = returnFocus.current;
    if (el instanceof HTMLElement) el.focus();
  }, []);

  const go = useCallback(() => {
    if (leaving) window.open(leaving, "_blank", "noopener,noreferrer");
    close();
  }, [leaving, close]);

  // Focus the first action when it opens; Escape cancels.
  useEffect(() => {
    if (!leaving) return;
    goRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [leaving, close]);

  return (
    <LeaveDialogContext.Provider value={{ confirmLeave }}>
      {children}
      {leaving && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-label="Leaving Pedigree Chums"
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <div className={styles.card}>
            <p className={styles.text}>
              You are about to be linked to another site (and dogs), and we can&apos;t
              control anything from this point. Remember to come back and carry on
              exploring
            </p>
            <div className={styles.row}>
              <button ref={goRef} type="button" className={styles.go} onClick={go}>
                Off we go
              </button>
              <button type="button" className={styles.stay} onClick={close}>
                Stay here
              </button>
            </div>
          </div>
        </div>
      )}
    </LeaveDialogContext.Provider>
  );
}
