"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./Nav.module.css";

// A single looping background video that fills the tile (cover -- cropping is OK).
export default function VideoTile({
  href,
  src,
  labelA,
  labelB,
  cta,
  sizeClass,
  loop = true,
  onNavigate,
}: {
  href: string;
  src: string;
  labelA: string;
  labelB?: string;
  cta: string;
  sizeClass: string;
  loop?: boolean;
  onNavigate: () => void;
}) {
  const vref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    vref.current?.play().catch(() => {});
  }, []);

  return (
    <Link href={href} className={`${styles.tile} ${sizeClass}`} onClick={onNavigate}>
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
