"use client";
import { useEffect, useRef } from "react";
import styles from "./VideoLightbox.module.css";

export type LightboxVideo = { poster: string; vimeoId: string };

type Props = {
  videos: LightboxVideo[];
  index: number | null;
  onClose: () => void;
  onIndex: (i: number) => void;
};

// Load the Vimeo Player SDK once, on demand. Returns the global Vimeo object.
let vimeoSdkPromise: Promise<unknown> | null = null;
function loadVimeoSdk(): Promise<unknown> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const w = window as unknown as { Vimeo?: unknown };
  if (w.Vimeo) return Promise.resolve(w.Vimeo);
  if (vimeoSdkPromise) return vimeoSdkPromise;
  vimeoSdkPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://player.vimeo.com/api/player.js";
    script.async = true;
    script.onload = () => resolve((window as unknown as { Vimeo?: unknown }).Vimeo ?? null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
  return vimeoSdkPromise;
}

export default function VideoLightbox({ videos, index, onClose, onIndex }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Keep the latest advance handler in a ref so the player's "ended" listener
  // (attached once per video) always advances from the current index.
  const advanceRef = useRef<() => void>(() => {});
  advanceRef.current = () => {
    if (index === null) return;
    onIndex((index + 1) % videos.length);
  };

  // Keyboard nav.
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onIndex((index + 1) % videos.length);
      else if (e.key === "ArrowLeft") onIndex((index - 1 + videos.length) % videos.length);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, videos.length, onClose, onIndex]);

  // Attach the Vimeo SDK to the current iframe and, when the clip ends,
  // auto-advance to the next card (looping forever via the modulo above).
  useEffect(() => {
    if (index === null) return;
    if (!iframeRef.current) return;

    let player: { off?: (e: string) => void; destroy?: () => void } | null = null;
    let cancelled = false;

    loadVimeoSdk().then((Vimeo) => {
      if (cancelled || !Vimeo || !iframeRef.current) return;
      const Player = (Vimeo as { Player: new (el: HTMLIFrameElement) => unknown }).Player;
      const p = new Player(iframeRef.current) as {
        on: (e: string, cb: () => void) => void;
        off?: (e: string) => void;
        destroy?: () => void;
      };
      p.on("ended", () => advanceRef.current());
      player = p;
    });

    return () => {
      cancelled = true;
      if (player) {
        try {
          player.off?.("ended");
          player.destroy?.();
        } catch {
          /* iframe already gone */
        }
      }
    };
    // Re-attach whenever the video changes (the iframe is keyed by vimeoId).
  }, [index, videos.length]);

  if (index === null) return null;
  const v = videos[index];
  const prev = () => onIndex((index - 1 + videos.length) % videos.length);
  const next = () => onIndex((index + 1) % videos.length);

  return (
    <div className={styles.overlay} onClick={onClose}>
      {videos.length > 1 && (
        <button
          type="button"
          className={`${styles.arrow} ${styles.prev}`}
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          aria-label="Previous video"
        >
          <span className={styles.label}>
            Last
            <br />
            Pooch
          </span>
          <span className={styles.chev}>&#8249;</span>
        </button>
      )}

      {/* keyed by id so it remounts (and re-runs the pop) on each navigation */}
      <div key={v.vimeoId} className={styles.stage} onClick={(e) => e.stopPropagation()}>
        <iframe
          ref={iframeRef}
          className={styles.video}
          src={`https://player.vimeo.com/video/${v.vimeoId}?autoplay=1&loop=0&muted=1&controls=0&title=0&byline=0&portrait=0`}
          title="Breed video"
          allow="autoplay; fullscreen; picture-in-picture"
          frameBorder="0"
        />
      </div>

      {videos.length > 1 && (
        <button
          type="button"
          className={`${styles.arrow} ${styles.next}`}
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          aria-label="Next video"
        >
          <span className={styles.label}>
            Next
            <br />
            Pooch
          </span>
          <span className={styles.chev}>&#8250;</span>
        </button>
      )}
    </div>
  );
}
