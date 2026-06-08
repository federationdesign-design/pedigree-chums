"use client";
import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { cards } from "../../content/cards";
import styles from "./CardRail.module.css";
import VideoLightbox, { type LightboxVideo } from "../VideoLightbox/VideoLightbox";

// The Cocker (card.jpg) is the fixed feature card, so keep it out of the
// scrolling deck to avoid showing it twice.
const FEATURE = "/card.jpg";
const deck = cards.filter((c) => c !== FEATURE);

// A card whose filename ends in -<digits> (e.g. card11-1199268788.jpg) is a
// video card; the digits are its Vimeo ID. Plain-named cards are just images.
function vimeoIdFromSrc(src: string): string | null {
  const m = src.match(/-(\d+)\.[a-z0-9]+$/i);
  return m ? m[1] : null;
}

// The pre-load (placeholder) image for a video card: strip the Vimeo id and
// extension to get the base name, then add the standard pre-load suffix.
// Some files were saved with inconsistent spellings, so those carry an
// explicit override here. Tidy fix later: rename them all to "-pre-load.jpg".
const PRELOAD_OVERRIDES: Record<string, string> = {
  card14: "/card14-pre-laod.jpg",
  card36: "/card36-pre-loader.jpg",
};
function preloadFromSrc(src: string): string {
  const base = src.replace(/^\//, "").replace(/\.[a-z0-9]+$/i, "").replace(/-\d+$/, "");
  return PRELOAD_OVERRIDES[base] ?? `/${base}-pre-load.jpg`;
}

// The ordered list of video card sources, the lightbox list (using the
// landscape pre-load image as the poster), and a lookup from card src to its
// position in that list (so the rail's click handler stays keyed by card src).
const videoSources = deck
  .map((src) => ({ src, vimeoId: vimeoIdFromSrc(src) }))
  .filter((c): c is { src: string; vimeoId: string } => c.vimeoId !== null);

const videoCards: LightboxVideo[] = videoSources.map((c) => ({
  poster: preloadFromSrc(c.src),
  vimeoId: c.vimeoId,
}));

const videoIndexBySrc: Record<string, number> = {};
videoSources.forEach((c, i) => {
  videoIndexBySrc[c.src] = i;
});

export default function CardRail() {
  const railRef = useRef<HTMLDivElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;

    const holdDistance = () => {
      const items = el.querySelectorAll<HTMLElement>('[role="listitem"]');
      if (items.length > 3) {
        return items[3].offsetLeft - items[0].offsetLeft;
      }
      return el.clientWidth;
    };
    let hold = holdDistance();
    const onResize = () => {
      hold = holdDistance();
    };

    const onWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (delta === 0) return;
      const max = el.scrollWidth - el.clientWidth;

      if (delta > 0) {
        if (el.scrollLeft >= max) return;
        if (el.scrollLeft < hold) {
          e.preventDefault();
        }
        el.scrollLeft = Math.min(el.scrollLeft + delta, max);
      } else {
        if (el.scrollLeft <= 0) return;
        if (el.scrollLeft <= hold) {
          e.preventDefault();
        }
        el.scrollLeft = Math.max(el.scrollLeft + delta, 0);
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <h2 className="display">
          Meet the <span className="display-yellow">Pack</span>
        </h2>
        <p className={styles.sub}>
          Hand-illustrated cards for all 54 breeds. Scroll through to see them all.
        </p>
      </div>

      <div className={styles.railWrap}>
        <Image
          src={FEATURE}
          alt="Cocker Spaniel breed card"
          width={300}
          height={430}
          className={styles.featureCard}
          priority
        />

        <div ref={railRef} className={styles.rail} role="list" aria-label="Breed cards">
          {deck.map((src) => {
            const vimeoId = vimeoIdFromSrc(src);
            return (
              <div className={styles.item} role="listitem" key={src}>
                {vimeoId ? (
                  <button
                    type="button"
                    className={styles.videoCard}
                    onClick={() => setOpenIndex(videoIndexBySrc[src])}
                    aria-label="Play breed video"
                  >
                    <Image
                      src={src}
                      alt="Breed card"
                      width={300}
                      height={430}
                      className={styles.card}
                      sizes="(max-width: 700px) 60vw, 280px"
                      draggable={false}
                    />
                  </button>
                ) : (
                  <Image
                    src={src}
                    alt="Breed card"
                    width={300}
                    height={430}
                    className={styles.card}
                    sizes="(max-width: 700px) 60vw, 280px"
                    draggable={false}
                  />
                )}
                <span className={styles.cardHover} aria-hidden="true" />
              </div>
            );
          })}
        </div>
      </div>

      <VideoLightbox
        videos={videoCards}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onIndex={setOpenIndex}
      />
    </section>
  );
}
