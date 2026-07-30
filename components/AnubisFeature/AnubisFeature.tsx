"use client";
import { useRef } from "react";
import Link from "next/link";
import { usePingPongVideo } from "../../lib/usePingPongVideo";
import styles from "./AnubisFeature.module.css";

// The "Anubis" slide from the hero carousel, surfaced as a single standalone
// feature tile (used on the home page beneath the video grid).
export default function AnubisFeature() {
  const videoRef = useRef<HTMLVideoElement>(null);
  usePingPongVideo(videoRef); // forward/back bounce; hover reverses direction

  return (
    <section className={styles.wrap}>
      <Link href="/good-dog-bad-dog/anubis" className={styles.slot}>
        <video
          ref={videoRef}
          className={styles.media}
          src="/history/Anubis-hero-vid.mp4"
          poster="/history/Anubis-hero.jpg"
          muted
          playsInline
          preload="auto"
          aria-hidden
        />
        <div className={styles.content}>
          <div className={styles.tags}>
            <span className={styles.tagBad}>Bad dog</span>
            <span className={styles.tagOutline}>Egypt</span>
            <span className={styles.tagOutline}>Myth</span>
          </div>
          <div className={styles.bottom}>
            <p className={styles.title}>
              <span className={styles.titleAccent}>Anubis:</span> The Scavenger Made Into a God
            </p>
            <span className={styles.btn}>About this dog</span>
          </div>
        </div>
      </Link>
    </section>
  );
}
