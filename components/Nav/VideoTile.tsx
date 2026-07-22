"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./Nav.module.css";

// A background video tile. loop controls whether it repeats; reverseOnHover
// plays the clip backwards while the pointer is over it (forward again on leave).
export default function VideoTile({
  href,
  src,
  labelA,
  labelB,
  cta,
  sizeClass,
  loop = true,
  reverseOnHover = false,
  onNavigate,
}: {
  href: string;
  src: string;
  labelA: string;
  labelB?: string;
  cta: string;
  sizeClass: string;
  loop?: boolean;
  reverseOnHover?: boolean;
  onNavigate: () => void;
}) {
  const vref = useRef<HTMLVideoElement>(null);
  const rafRef = useRef(0);
  const reversingRef = useRef(false);
  const lastTsRef = useRef(0);

  useEffect(() => {
    vref.current?.play().catch(() => {});
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const step = (ts: number) => {
    const v = vref.current;
    if (!v || !reversingRef.current) return;
    if (lastTsRef.current) {
      const dt = (ts - lastTsRef.current) / 1000;
      v.currentTime = Math.max(0, v.currentTime - dt);
    }
    lastTsRef.current = ts;
    if (v.currentTime <= 0.02) { reversingRef.current = false; return; }
    rafRef.current = requestAnimationFrame(step);
  };

  function handleEnter() {
    if (!reverseOnHover) return;
    const v = vref.current;
    if (!v) return;
    v.pause();
    reversingRef.current = true;
    lastTsRef.current = 0;
    rafRef.current = requestAnimationFrame(step);
  }
  function handleLeave() {
    if (!reverseOnHover) return;
    reversingRef.current = false;
    cancelAnimationFrame(rafRef.current);
    vref.current?.play().catch(() => {});
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
        <video ref={vref} className={styles.tileImgTag} src={src} muted playsInline loop={loop} autoPlay preload="auto" />
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
