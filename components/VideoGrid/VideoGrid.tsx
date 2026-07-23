"use client";
import { useState } from "react";
import VideoLightbox, { type LightboxVideo } from "../VideoLightbox/VideoLightbox";
import styles from "./VideoGrid.module.css";

// Same breed-card videos as the "Meet the Pack" rail: a card named
// cardN-<vimeoId>.jpg carries a Vimeo id in its filename, and its landscape
// pre-load image is the poster. (Logic mirrors CardRail.)
const PRELOAD_OVERRIDES: Record<string, string> = {
  card14: "/card14-pre-laod.jpg",
  card36: "/card36-pre-loader.jpg",
  card44: "/card44-pre-laoder.jpg",
};
function vimeoIdFromSrc(src: string): string {
  const m = src.match(/-(\d+)\.[a-z0-9]+$/i);
  return m ? m[1] : "";
}
function preloadFromSrc(src: string): string {
  const base = src.replace(/^\//, "").replace(/\.[a-z0-9]+$/i, "").replace(/-\d+$/, "");
  return PRELOAD_OVERRIDES[base] ?? `/${base}-pre-load.jpg`;
}

// Explicit display order:
// Chihuahua, Cockapoo, French Bulldog, Border Collie, Weimaraner, Corgi.
const ORDER = [
  "/card11-1199268788.jpg", // Chihuahua
  "/card44-1199502279.jpg", // Cockapoo
  "/card14-1199399283.jpg", // French Bulldog
  "/card21-1199411114.jpg", // Border Collie
  "/card28-1199378147.jpg", // Weimaraner
  "/card8-1199364230.jpg", // Corgi
];
const VIDEOS: LightboxVideo[] = ORDER.map((src) => ({
  poster: preloadFromSrc(src),
  vimeoId: vimeoIdFromSrc(src),
}));

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
