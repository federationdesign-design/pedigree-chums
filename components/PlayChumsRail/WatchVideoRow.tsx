"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./PlayChumsRail.module.css";

/* THE WATCH VIDEO ROW on a play slider card (owner, 24 September 2026).

   THE FILM PLAYS IN THE CARD, in place of the still (owner: the pop-up showed the
   portrait film small between two bars; it is the same shape as the card). The
   player is put into the card itself through a portal, because this row lives in
   the footer strip and the card is the box it has to fill. It sits over the still
   and the footer, and a close button puts the still back.

   The site's lightbox is no longer used here: it is built for landscape films.
   Autoplay is asked for on the press, which is a real tap, so a browser allows it
   with sound; a phone that still refuses shows Vimeo's own play button. */
export default function WatchVideoRow({ name, slug, vimeoId, seconds }: { name: string; slug: string; vimeoId: string; poster?: string; seconds: number | null }) {
  const [playing, setPlaying] = useState(false);
  const [card, setCard] = useState<HTMLElement | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  /* WATCHED TO THE END, STRAIGHT INTO THE GAME (owner, 24 September 2026: the
     films looped; a player who watches one through should land in the game as if
     they had pressed Play game). The film is asked not to loop (loop=0), and the
     player is told to report its end through Vimeo's standard postMessage
     interface, so no extra script is loaded. On the end the page goes to
     /play/<slug>?from=home, the Play game link exactly, so learn's back button
     still returns to the slider. "finish" is the older player's name for it. */
  useEffect(() => {
    if (!playing) return;
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== "https://player.vimeo.com") return;
      if (e.source !== frameRef.current?.contentWindow) return;
      let d: { event?: string } | null = null;
      try { d = typeof e.data === "string" ? JSON.parse(e.data) : e.data; } catch { return; }
      if (d?.event === "ended" || d?.event === "finish") window.location.assign(`/play/${slug}?from=home`);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [playing, slug]);
  // Once the player has loaded, ask it to send its end event.
  const listenForEnd = () => {
    const w = frameRef.current?.contentWindow;
    if (!w) return;
    for (const ev of ["ended", "finish"]) w.postMessage(JSON.stringify({ method: "addEventListener", value: ev }), "https://player.vimeo.com");
  };
  const open = () => {
    const el = btnRef.current?.closest<HTMLElement>("[data-play-card]") ?? null;
    setCard(el);
    setPlaying(true);
  };
  return (
    <>
      <button ref={btnRef} type="button" className={styles.row} onClick={open} aria-label={`Watch the ${name} video${seconds ? `, ${seconds} seconds` : ""}`}>
        <span className={styles.rowLabel}>Watch video</span>
        <span className={`${styles.dot} ${styles.dotFilm}`} aria-hidden="true">🎬</span>
        {seconds ? (
          <span className={`${styles.dot} ${styles.dotSecs}`} aria-hidden="true">
            <span className={styles.dotNum}>{seconds}</span>
            <span className={styles.dotUnit}>secs</span>
          </span>
        ) : null}
      </button>
      {playing && card
        ? createPortal(
            <div className={styles.player}>
              <iframe
                ref={frameRef}
                onLoad={listenForEnd}
                className={styles.playerFrame}
                src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&playsinline=1&loop=0&title=0&byline=0&portrait=0`}
                title={`${name} video`}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
              <button type="button" className={styles.playerClose} onClick={() => setPlaying(false)} aria-label="Close the video">
                ×
              </button>
            </div>,
            card,
          )
        : null}
    </>
  );
}
