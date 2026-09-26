"use client";
import { useEffect, useState } from "react";
import { readLevelsDone, LEVELS_DONE_KEY, LEVELS_DONE_EVENT } from "../../lib/levelsDone";
import styles from "./PlayLadder.module.css";

/* A GREEN TICK ON A COMPLETED LEVEL, 27 September 2026 (owner). Read from the
   browser after the page loads (the table itself is drawn on the server, which
   cannot know), and kept up to date if a level is finished in another tab. The
   row's name is struck through by CSS (.row:has(.doneTick)). */
export default function DoneTick({ name }: { name: string }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const check = () => setDone(readLevelsDone().has(name));
    check();
    const onStorage = (e: StorageEvent) => { if (e.key === LEVELS_DONE_KEY) check(); };
    window.addEventListener("storage", onStorage);
    window.addEventListener(LEVELS_DONE_EVENT, check);
    return () => { window.removeEventListener("storage", onStorage); window.removeEventListener(LEVELS_DONE_EVENT, check); };
  }, [name]);
  if (!done) return null;
  return (
    <span className={styles.doneTick} role="img" aria-label="Completed">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </span>
  );
}
