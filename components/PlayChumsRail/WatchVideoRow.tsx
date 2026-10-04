"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
export default function WatchVideoRow({ name, vimeoId, seconds }: { name: string; slug: string; vimeoId: string; poster?: string; seconds: number | null }) {
  const [playing, setPlaying] = useState(false);
  const [card, setCard] = useState<HTMLElement | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  /* WATCHED TO THE END, BACK TO THE CARD (owner, J18-328, 2 October 2026). This
     replaces 24 September's "straight into the game": at the end the film closes
     and the card returns to its still, with its Watch video and Play game rows.
     The films were looping instead of ending. Two reasons, both handled here:
     the end listener was registered on the iframe's load, before Vimeo's player
     was ready to accept it, so it was never registered; and a film can loop even
     with loop=0. So the listener is registered on Vimeo's own "ready" message (and
     retried after load as a fallback), and the end is read three ways: the
     "ended" event ("finish" on older players), playback reaching 99.5%, or the
     position jumping from the end back to the start, which is a loop. */
  const close = () => setPlaying(false);
  const register = useCallback(() => {
    const w = frameRef.current?.contentWindow;
    if (!w) return;
    for (const ev of ["ended", "finish", "timeupdate", "playProgress"]) {
      w.postMessage(JSON.stringify({ method: "addEventListener", value: ev }), "https://player.vimeo.com");
    }
  }, []);
  useEffect(() => {
    if (!playing) return;
    let last = 0;
    let done = false;
    const end = () => { if (!done) { done = true; setPlaying(false); } };
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== "https://player.vimeo.com") return;
      if (e.source !== frameRef.current?.contentWindow) return;
      let d: { event?: string; data?: { percent?: number } } | null = null;
      try { d = typeof e.data === "string" ? JSON.parse(e.data) : e.data; } catch { return; }
      if (!d?.event) return;
      if (d.event === "ready") { register(); return; }
      if (d.event === "ended" || d.event === "finish") { end(); return; }
      if (d.event === "timeupdate" || d.event === "playProgress") {
        const pct = d.data?.percent;
        if (typeof pct !== "number") return;
        if (pct >= 0.995 || (last > 0.9 && pct < 0.1)) { end(); return; }
        last = pct;
      }
    };
    window.addEventListener("message", onMsg);
    // Fallback for a player that sent "ready" before this listener existed.
    const retries = [600, 1800, 4000].map((ms) => window.setTimeout(register, ms));
    return () => {
      window.removeEventListener("message", onMsg);
      retries.forEach((t) => window.clearTimeout(t));
    };
  }, [playing, register]);
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
                onLoad={register}
                className={styles.playerFrame}
                src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&playsinline=1&loop=0&title=0&byline=0&portrait=0`}
                title={`${name} video`}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
              <button type="button" className={styles.playerClose} onClick={close} aria-label="Close the video">
                ×
              </button>
            </div>,
            card,
          )
        : null}
    </>
  );
}
