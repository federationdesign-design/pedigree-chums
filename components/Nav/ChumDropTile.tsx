"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./Nav.module.css";

// Four short clips, played 1 -> 2 -> 3 -> 4 then looped. Export the optimised
// (small, H.264 .mp4) clips into /public with exactly these names.
const CLIPS = [
  "/chum-drop-1.mp4",
  "/chum-drop-2.mp4",
  "/chum-drop-3.mp4",
  "/chum-drop-4.mp4",
];

export default function ChumDropTile({
  href,
  labelA,
  labelB,
  cta,
  sizeClass,
  onNavigate,
}: {
  href: string;
  labelA: string;
  labelB?: string;
  cta: string;
  sizeClass: string;
  onNavigate: () => void;
}) {
  const vref = useRef<HTMLVideoElement>(null);
  const [i, setI] = useState(0);
  const [started, setStarted] = useState(false);

  // 4-second delay after the menu opens, then begin the sequence.
  useEffect(() => {
    const t = setTimeout(() => setStarted(true), 4000);
    return () => clearTimeout(t);
  }, []);

  // Load + play the current clip once the sequence has started.
  useEffect(() => {
    const v = vref.current;
    if (!v || !started) return;
    v.load();
    v.play().catch(() => {});
  }, [i, started]);

  // When a clip ends, advance to the next (looping back to the first).
  function handleEnded() {
    setI((n) => (n + 1) % CLIPS.length);
  }
  // Hover pauses playback; leaving resumes it.
  function handleEnter() {
    vref.current?.pause();
  }
  function handleLeave() {
    if (started) vref.current?.play().catch(() => {});
  }

  return (
    <Link
      href={href}
      className={`${styles.tile} ${sizeClass}`}
      onClick={onNavigate}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <span className={styles.tileImg} aria-hidden>
        <video
          ref={vref}
          className={styles.tileImgTag}
          src={CLIPS[i]}
          muted
          playsInline
          preload="auto"
          onEnded={handleEnded}
        />
      </span>
      <span className={styles.tileMeta}>
        <span className={styles.tileLabel}>
          <span className={styles.tileLabelAccent}>{labelA}</span>{labelB ? ` ${labelB}` : ""}
        </span>
        <span className={styles.tileCta}>{cta} →</span>
      </span>
    </Link>
  );
}
