"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

  // Poster placeholder covers the frame until the clip actually starts, so
  // there is no black screen while Vimeo loads.
  const [posterShown, setPosterShown] = useState(true);

  // Sticky mini-player: once the page is scrolled while the video is open, the
  // player docks to the bottom-right corner (YouTube-style) and lets the page
  // behind it stay interactive. Scrolling back up restores it to centre.
  const [minimized, setMinimized] = useState(false);
  const isOpen = index !== null;
  useEffect(() => {
    if (!isOpen) return;
    const openY = window.scrollY;
    const onScroll = () => setMinimized(window.scrollY - openY > 100);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      setMinimized(false);
    };
  }, [isOpen]);

  // Keep the latest advance handler in a ref so the player's "ended" listener
  // (attached once per video) always advances from the current index.
  const advanceRef = useRef<() => void>(() => {});
  useEffect(() => {
    advanceRef.current = () => {
      if (index === null) return;
      onIndex((index + 1) % videos.length);
    };
  });

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

  // Attach the Vimeo SDK to the current iframe: force loop off (so the clip
  // ends and "ended" fires for auto-advance), and hide the poster once the
  // video is playing. A timeout is a safety net if the SDK or events never
  // fire, so the poster never gets stuck over the video.
  useEffect(() => {
    if (index === null) return;
    if (!iframeRef.current) return;

    setPosterShown(true);

    let player: { off?: (e: string) => void; destroy?: () => void } | null = null;
    let cancelled = false;
    const hidePoster = () => setPosterShown(false);
    const fallback = window.setTimeout(hidePoster, 1600);

    loadVimeoSdk().then((Vimeo) => {
      if (cancelled || !Vimeo || !iframeRef.current) return;
      const Player = (Vimeo as { Player: new (el: HTMLIFrameElement) => unknown }).Player;
      const p = new Player(iframeRef.current) as {
        on: (e: string, cb: () => void) => void;
        off?: (e: string) => void;
        destroy?: () => void;
        setLoop?: (loop: boolean) => Promise<unknown>;
      };
      // Force loop off via the API so the clip actually reaches its end and
      // fires "ended", regardless of the video's Vimeo embed settings.
      p.setLoop?.(false).catch(() => {});
      p.on("playing", hidePoster);
      p.on("ended", () => advanceRef.current());
      player = p;
    });

    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
      if (player) {
        try {
          player.off?.("playing");
          player.off?.("ended");
          player.destroy?.();
        } catch {
          /* iframe already gone */
        }
      }
    };
    // Re-attach whenever the video changes (the iframe is keyed by vimeoId).
  }, [index, videos.length]);

  if (index === null || typeof document === "undefined") return null;
  const v = videos[index];
  const prev = () => onIndex((index - 1 + videos.length) % videos.length);
  const next = () => onIndex((index + 1) % videos.length);

  return createPortal(
    <div className={`${styles.overlay} ${minimized ? styles.minimized : ""}`} onClick={onClose}>
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/blue-arrow.svg" className={styles.chevImg} alt="" />
        </button>
      )}

      {/* keyed by id so it remounts (and re-runs the pop) on each navigation */}
      <div key={v.vimeoId} className={styles.stage} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={styles.close}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close video"
        >
          &times;
        </button>
        <iframe
          ref={iframeRef}
          className={styles.video}
          src={`https://player.vimeo.com/video/${v.vimeoId}?autoplay=1&loop=0&muted=1&controls=0&title=0&byline=0&portrait=0`}
          title="Breed video"
          allow="autoplay; fullscreen; picture-in-picture"
          frameBorder="0"
        />
        <div
          className={`${styles.poster} ${posterShown ? "" : styles.posterHidden}`}
          style={{ backgroundImage: `url(${v.poster})` }}
          aria-hidden="true"
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/blue-arrow.svg" className={styles.chevImg} alt="" />
        </button>
      )}
    </div>,
    document.body
  );
}
