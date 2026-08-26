"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./CompetitionHero.module.css";

/* Hero for the Spot your Chum competition pages (brief 4a). The WIN ME badge and
   the breed name are baked into the video, so this is the footage as-is.

   Behaviour (Steve, 26 Aug 2026):
   - The full-resolution poster shows immediately, so the hero is complete on
     first paint with no blank frame or layout shift.
   - After a 3s beat, the video mounts and autoplays over the poster, plays
     through once, and holds on its final frame (onEnded pause, no loop).
   - Reduced-motion users get the poster only: the video is never mounted, so it
     is never downloaded. The `still` prop forces the same poster-only path (a
     config kill switch, e.g. while a correct export is being sourced).

   The video is mounted after the poster in the DOM, so it stacks on top once it
   starts; both share .media (absolute inset:0, object-fit cover). Its first frame
   equals the poster, so the hand-off is seamless. Video and poster paths come
   from the per-breed config. */

type Props = {
  /** Hero video path. */
  video: string;
  /** Poster frame, shown immediately and as the reduced-motion still. */
  poster: string;
  /** Alt for the poster still (describes the baked scene). */
  alt: string;
  /** Force poster-only and never load the video (config kill switch). */
  still?: boolean;
};

export default function CompetitionHero({ video, poster, alt, still = false }: Props) {
  // Gate mounting the <video>: false until the 3s beat, and never true for
  // reduced-motion or `still` (so the video is not downloaded in those cases).
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (still) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return; // reduced motion: poster only, no timer, no video
    const timer = window.setTimeout(() => setShowVideo(true), 3000);
    return () => window.clearTimeout(timer);
  }, [still]);

  return (
    <section className={styles.hero}>
      <div className={styles.frame}>
        <Image
          className={styles.media}
          src={poster}
          alt={alt}
          fill
          sizes="100vw"
          priority
        />
        {showVideo && (
          <video
            className={styles.media}
            src={video}
            poster={poster}
            autoPlay
            muted
            playsInline
            aria-hidden="true"
            onEnded={(e) => {
              e.currentTarget.pause();
            }}
          />
        )}
      </div>
    </section>
  );
}
