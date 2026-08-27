"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./CompetitionHero.module.css";

/* Hero for the Spot your Chum competition pages (brief 4a). Two videos: a
   landscape film on desktop and a dedicated portrait film on mobile, each with its
   own poster, all from the per-breed config.

   Serving two videos without both downloading (Steve, 26 Aug 2026):
   - Exactly ONE <video> is ever rendered, chosen by matchMedia after mount, so
     only that file is fetched. The other is never in the DOM. Multiple <source
     media> tags are unreliable (browsers fetch more than one), so this is done in
     JS on purpose. The pick is made once on mount, so a session never loads both.
   - Cost: the video src is client-decided (no server-rendered <source>) and the
     video is requested only after hydration plus the 3s beat. The gap is covered
     because BOTH posters are server-rendered and CSS-picked: the matching one
     paints immediately for LCP, and display:none drops the other from the a11y
     tree so the alt is announced once.

   Reduced-motion and the `still` kill switch get the poster only: no video mounts,
   so none is downloaded. WIN ME and the breed name are still baked into the
   footage (the clean master + PNG overlay is a later change). */

type Source = { video: string; poster: string };

type Props = {
  /** Desktop (landscape) video + poster. */
  desktop: Source;
  /** Mobile (portrait) video + poster. */
  mobile: Source;
  /** Alt for the poster (describes the baked scene). */
  alt: string;
  /** Force poster-only and never load a video (config kill switch). */
  still?: boolean;
};

const MOBILE_QUERY = "(max-width: 768px)";

export default function CompetitionHero({ desktop, mobile, alt, still = false }: Props) {
  // The chosen source stays null until we know the viewport (client only), so no
  // video is server-rendered and exactly one is ever mounted.
  const [source, setSource] = useState<Source | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  // Once the video is actually playing it has replaced the poster, so we drop the
  // poster out of view: the desktop bottom mask makes the video transparent, and a
  // poster left stacked behind would ghost through the faded strip.
  const [videoPlaying, setVideoPlaying] = useState(false);
  // Sound starts off: autoplay only works muted, and unmuted autoplay is hostile.
  // The bottom-right toggle unmutes the mounted video.
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [soundOn, setSoundOn] = useState(false);

  const toggleSound = () => {
    const v = videoRef.current;
    if (!v) return;
    const next = !soundOn;
    v.muted = !next;
    // If the film has already played through and is holding on its last frame,
    // replay from the top so there is something to hear when sound is turned on.
    if (next && v.ended) {
      v.currentTime = 0;
      void v.play();
    }
    setSoundOn(next);
  };

  useEffect(() => {
    if (still) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Pick once, so a session never downloads both videos (a later resize across
    // the breakpoint swaps the poster via CSS; the mounted video stays, and
    // object-fit cover keeps it framed).
    setSource(window.matchMedia(MOBILE_QUERY).matches ? mobile : desktop);
    const timer = window.setTimeout(() => setShowVideo(true), 3000);
    return () => window.clearTimeout(timer);
  }, [still, desktop, mobile]);

  return (
    <section className={styles.hero}>
      <div className={styles.frame}>
        {/* Both posters server-rendered for immediate LCP; CSS shows one per
            breakpoint and hides (display:none) the other, which also drops it from
            the a11y tree so the alt is announced once. */}
        <Image
          className={`${styles.media} ${styles.posterDesktop} ${videoPlaying ? styles.posterPlayed : ""}`}
          src={desktop.poster}
          alt={alt}
          fill
          sizes="100vw"
          priority
        />
        <Image
          className={`${styles.media} ${styles.posterMobile} ${videoPlaying ? styles.posterPlayed : ""}`}
          src={mobile.poster}
          alt={alt}
          fill
          sizes="100vw"
          priority
        />
        {showVideo && source && (
          <video
            ref={videoRef}
            className={styles.media}
            src={source.video}
            poster={source.poster}
            autoPlay
            muted
            playsInline
            aria-hidden="true"
            onPlaying={() => setVideoPlaying(true)}
            onEnded={(e) => {
              e.currentTarget.pause();
            }}
          />
        )}
        {/* Sound toggle: bottom-right, only once a video is mounted, so reduced
            motion and `still` (poster only) never show a control with nothing to
            unmute. Real <button>, keyboard reachable; the label flips with state
            and aria-pressed announces on/off. */}
        {showVideo && source && (
          <button
            type="button"
            className={styles.soundToggle}
            onClick={toggleSound}
            aria-pressed={soundOn}
            aria-label={soundOn ? "Turn hero video sound off" : "Turn hero video sound on"}
          >
            {soundOn ? (
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" />
              </svg>
            ) : (
              /* Muted: a plain speaker, no waves and no X. The waves appearing is
                 the "on" state; their absence is "off". aria-pressed and the label
                 carry the state for assistive tech. */
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M3 9v6h4l5 5V4L7 9H3z" />
              </svg>
            )}
          </button>
        )}
      </div>
    </section>
  );
}
