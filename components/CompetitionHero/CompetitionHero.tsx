"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./CompetitionHero.module.css";

/* Hero for the Spot your Chum competition pages (brief 4a). The WIN ME badge and
   the breed name are baked into the video, so this is the footage as-is: no badge
   or name overlay. Full-frame (no crop) so the baked WIN ME (top-left) and breed
   name (podium, bottom-centre) both stay visible; a shorter band would clip one.

   Reuses the /chumspot hero video pattern (autoplay muted playsInline, pause on
   end) and extends it with prefers-reduced-motion handling that /chumspot lacks:
   reduced-motion users get the poster only, with the video never downloaded.

   Video and poster paths come from the per-breed config. */

type Props = {
  /** Hero video path. */
  video: string;
  /** Poster frame, also the reduced-motion still. */
  poster: string;
  /** Alt for the poster still (describes the baked scene). */
  alt: string;
};

export default function CompetitionHero({ video, poster, alt }: Props) {
  // Default to the poster (motion off) so reduced-motion users never trigger a
  // download or an autoplay flash before the media query is read on mount.
  const [motion, setMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotion(!mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <section className={styles.hero}>
      <div className={styles.frame}>
        {motion ? (
          <video
            className={styles.media}
            src={video}
            poster={poster}
            autoPlay
            muted
            playsInline
            onEnded={(e) => {
              const v = e.currentTarget;
              v.pause();
            }}
          />
        ) : (
          <Image
            className={styles.media}
            src={poster}
            alt={alt}
            fill
            sizes="100vw"
            priority
          />
        )}
      </div>
    </section>
  );
}
