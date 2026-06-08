"use client";
import { useEffect } from "react";
import styles from "./VideoLightbox.module.css";

export type LightboxVideo = { poster: string; vimeoId: string };

type Props = {
  videos: LightboxVideo[];
  index: number | null;
  onClose: () => void;
  onIndex: (i: number) => void;
};

export default function VideoLightbox({ videos, index, onClose, onIndex }: Props) {
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
          &#8249;
        </button>
      )}

      {/* keyed by id so it remounts (and re-runs the pop) on each navigation */}
      <div key={v.vimeoId} className={styles.stage} onClick={(e) => e.stopPropagation()}>
        <iframe
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
          &#8250;
        </button>
      )}
    </div>
  );
}
