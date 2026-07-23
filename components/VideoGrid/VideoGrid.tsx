"use client";
import { useState } from "react";
import { cards } from "../../content/cards";
import VideoLightbox, { type LightboxVideo } from "../VideoLightbox/VideoLightbox";
import styles from "./VideoGrid.module.css";

// Same breed-card videos as the "Meet the Pack" rail: a card named
// cardN-<vimeoId>.jpg carries a Vimeo id in its filename, and its landscape
// pre-load image is the poster. (Logic mirrors CardRail.)
const FEATURE = "/card.jpg";
const PRELOAD_OVERRIDES: Record<string, string> = {
  card14: "/card14-pre-laod.jpg",
  card36: "/card36-pre-loader.jpg",
  card44: "/card44-pre-laoder.jpg",
};
function vimeoIdFromSrc(src: string): string | null {
  const m = src.match(/-(\d+)\.[a-z0-9]+$/i);
  return m ? m[1] : null;
}
function preloadFromSrc(src: string): string {
  const base = src.replace(/^\//, "").replace(/\.[a-z0-9]+$/i, "").replace(/-\d+$/, "");
  return PRELOAD_OVERRIDES[base] ?? `/${base}-pre-load.jpg`;
}

// First six video cards, as {poster, vimeoId}, for a 3 x 2 grid.
const VIDEOS: LightboxVideo[] = cards
  .filter((c) => c !== FEATURE)
  .map((src) => ({ src, vimeoId: vimeoIdFromSrc(src) }))
  .filter((c): c is { src: string; vimeoId: string } => c.vimeoId !== null)
  .slice(0, 6)
  .map((c) => ({ poster: preloadFromSrc(c.src), vimeoId: c.vimeoId }));

export default function VideoGrid() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className={styles.grid} aria-label="Pedigree Chums in action">
      <div className={styles.inner}>
        {VIDEOS.map((v, i) => (
          <button
            type="button"
            key={v.vimeoId}
            className={styles.cell}
            onClick={() => setOpenIndex(i)}
            aria-label="Play video"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={v.poster} alt="" className={styles.poster} loading="lazy" />
            <span className={styles.play} aria-hidden />
          </button>
        ))}
      </div>

      <VideoLightbox
        videos={VIDEOS}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onIndex={setOpenIndex}
      />
    </section>
  );
}
