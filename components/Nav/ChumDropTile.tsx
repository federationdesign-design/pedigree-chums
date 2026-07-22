"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./Nav.module.css";

// Four short clips, played 1 -> 2 -> 3 -> 4 then looped. All are preloaded and
// stacked; we cross-cut ~0.1s before each ends so the joins are near-seamless.
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
  const vids = useRef<(HTMLVideoElement | null)[]>([]);
  const activeRef = useRef(0);
  const startedRef = useRef(false);
  const [active, setActive] = useState(0);

  // 4-second delay after the menu opens, then start the sequence.
  useEffect(() => {
    const t = setTimeout(() => {
      startedRef.current = true;
      const v = vids.current[0];
      if (v) {
        try { v.currentTime = 0; } catch {}
        v.play().catch(() => {});
      }
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  function goTo(next: number) {
    const cur = activeRef.current;
    const nv = vids.current[next];
    if (nv) {
      try { nv.currentTime = 0; } catch {}
      nv.play().catch(() => {}); // start next slightly before current ends
    }
    activeRef.current = next;
    setActive(next);
    if (cur !== next) vids.current[cur]?.pause();
  }

  // Switch ~0.1s before the clip ends for a quicker cut.
  function onTimeUpdate(i: number) {
    if (!startedRef.current || i !== activeRef.current) return;
    const v = vids.current[i];
    if (v && v.duration && v.currentTime >= v.duration - 0.1) {
      goTo((i + 1) % CLIPS.length);
    }
  }
  // Fallback in case a timeupdate near the very end is missed.
  function onEnded(i: number) {
    if (i === activeRef.current) goTo((i + 1) % CLIPS.length);
  }

  function handleEnter() {
    vids.current[activeRef.current]?.pause();
  }
  function handleLeave() {
    if (startedRef.current) vids.current[activeRef.current]?.play().catch(() => {});
  }

  return (
    <Link
      href={href}
      className={`${styles.tile} ${styles.chumDrop} ${sizeClass}`}
      onClick={onNavigate}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <span className={styles.tileImg} aria-hidden>
        {CLIPS.map((src, i) => (
          <video
            key={src}
            ref={(el) => { vids.current[i] = el; }}
            className={styles.chumDropVideo}
            style={{ opacity: i === active ? 1 : 0 }}
            src={src}
            muted
            playsInline
            preload="auto"
            onTimeUpdate={() => onTimeUpdate(i)}
            onEnded={() => onEnded(i)}
          />
        ))}
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
