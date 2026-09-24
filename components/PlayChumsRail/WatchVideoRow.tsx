"use client";

import { useState } from "react";
import VideoLightbox from "../VideoLightbox/VideoLightbox";
import styles from "./PlayChumsRail.module.css";

/* THE WATCH VIDEO ROW on a play slider card (owner, 24 September 2026). Opens the
   chum's film in the site's own Vimeo lightbox, the one the video grid uses. A
   client component because the lightbox keeps open/closed state; the rest of the
   rail stays on the server. */
export default function WatchVideoRow({ name, vimeoId, poster, seconds }: { name: string; vimeoId: string; poster: string; seconds: number | null }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <button type="button" className={styles.row} onClick={() => setOpen(0)} aria-label={`Watch the ${name} video${seconds ? `, ${seconds} seconds` : ""}`}>
        <span className={styles.rowLabel}>Watch video</span>
        <span className={`${styles.dot} ${styles.dotFilm}`} aria-hidden="true">🎬</span>
        {seconds ? (
          <span className={`${styles.dot} ${styles.dotSecs}`} aria-hidden="true">
            <span className={styles.dotNum}>{seconds}</span>
            <span className={styles.dotUnit}>secs</span>
          </span>
        ) : null}
      </button>
      <VideoLightbox videos={[{ poster, vimeoId }]} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </>
  );
}
