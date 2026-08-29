"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./page.module.css";

/* Press pack: the click-through carousel. Media is now wired into the slides that
   have a resolved asset (docs/press/PLAN.md, "Resolved assets"); the remaining
   slides stay as PLACEHOLDER frames, either because the section is deferred
   (press release, no-board, a-little-deeper, assets/contact) or because the copy
   is owner-supplied and not yet written (story payoff, the two closing lines).

   Mechanics are the proven scroll-snap + goTo pattern (borrowed from the
   superpower rail's React model, not its dark theme), plus the three controls
   that are net-new to this pack: a previous/next pair, keyboard arrows, and a
   position indicator. Horizontal swipe comes free from native scroll-snap.

   The Find Pug slide (Section 6) is a Vimeo clip behind a click-to-play facade:
   a poster with a play button, the iframe mounting only on tap. A live Vimeo
   iframe captures touch and would fight the swipe rail (its own comment on
   CompetitionVideoRow documents exactly this), so it is kept out of the DOM until
   asked for, and unmounted again when the slide is swiped away. */

type Slide =
  | { kind: "image"; src: string; alt: string; width: number; height: number; priority?: boolean }
  | { kind: "video"; videoId: string; poster: string; alt: string; width: number; height: number }
  | { kind: "placeholder"; label: string };

const SLIDES: Slide[] = [
  // 1 Cover
  {
    kind: "image",
    src: "/press/cover.jpg",
    alt: "Poster reading Can You Find Pug over a photograph of an empty grassy field under a blue sky, with a large yellow question mark and the Pedigree Chums logo.",
    width: 1250,
    height: 1738,
    priority: true,
  },
  // 2 Story in 30s (1 of 2)
  {
    kind: "image",
    src: "/actual-cards.jpg",
    alt: "Four printed Pedigree Chums breed cards laid on a wooden table: Cavapoo, Yorkshire Terrier, Boston Terrier and Labradoodle.",
    width: 2713,
    height: 1490,
  },
  // 3 Story in 30s (2 of 2): owner copy only, no image (PLAN M2b)
  { kind: "placeholder", label: "Story in 30s (2 of 2)" },
  // 4-5 Press release: Section 3, deferred
  { kind: "placeholder", label: "Press release (1 of 2)" },
  { kind: "placeholder", label: "Press release (2 of 2)" },
  // 6 Imaginary
  {
    kind: "image",
    src: "/press/state-imaginary.jpg",
    alt: "The illustrated Pug character card: a cartoon Pug on a blue breed card headed Pug, set against a painted parkland background.",
    width: 1798,
    height: 2500,
  },
  // 7 Real
  {
    kind: "image",
    src: "/press/state-real.jpg",
    alt: "A real fawn Pug standing in long grass under a bright blue sky, photographed from low down.",
    width: 2158,
    height: 3000,
  },
  // 8 Tangible
  {
    kind: "image",
    src: "/press/state-tangible.jpg",
    alt: "The blue 3D printed Pug figurine sitting on a yellow podium in front of blue and cream arches.",
    width: 2500,
    height: 3476,
  },
  // 9 Missing card: the normal card
  {
    kind: "image",
    src: "/press/card-normal.jpg",
    alt: "The Pug breed card standing upright on a podium, the cartoon Pug present on the blue card.",
    width: 1250,
    height: 1738,
  },
  // 10 Missing card: Pug leaving
  {
    kind: "image",
    src: "/press/card-leaving.jpg",
    alt: "The cartoon Pug leaping up out of its breed card into a painted sky, the card behind it clouding over blank, with the words Find Pug.",
    width: 1250,
    height: 1738,
  },
  // 11 Missing card: the blank card. HELD: press/card-blank.jpg is currently the
  // pre-order composed artwork (a filled card with a PRE-ORDER sticker), not the
  // blank card the slide needs. Left as a placeholder until the right asset lands.
  { kind: "placeholder", label: "Missing card: the blank card" },
  // 12-13 Closing lines: owner copy only, no image (PLAN M5d/M5e)
  { kind: "placeholder", label: "54 became 53" },
  { kind: "placeholder", label: "We can't launch like that" },
  // 14 Find Pug: the steps (advertB, click-to-play facade)
  {
    kind: "video",
    videoId: "1221597431",
    poster: "/press/findpug-video-poster.jpg",
    alt: "A fawn Pug walking through grass under a blue sky, the opening frame of the Find Pug advert.",
    width: 240,
    height: 318,
  },
  // 15 Find Pug: dates and prize
  {
    kind: "image",
    src: "/press/findpug-ticket.jpg",
    alt: "A We Lost Pug, Find Pug free-entry ticket above a photo of the blue Pug figurine being placed on a Pug podium in front of a camera.",
    width: 1042,
    height: 1452,
  },
  // 16 One-of-one: the figurine
  {
    kind: "image",
    src: "/press/figurine-hero.jpg",
    alt: "The blue 3D printed Pug figurine facing forward on a plain pale background.",
    width: 1449,
    height: 1473,
  },
  // 17 One-of-one: only one exists
  {
    kind: "image",
    src: "/press/figurine-angle.jpg",
    alt: "The blue 3D printed Pug figurine seen from a three-quarter angle on a plain pale background.",
    width: 1449,
    height: 1473,
  },
  // 18-20 No board: Section 8, deferred
  { kind: "placeholder", label: "Britain is the board" },
  { kind: "placeholder", label: "Take them outside" },
  { kind: "placeholder", label: "The traffic-jam example" },
  // 21-22 A little deeper: Section 9, deferred
  { kind: "placeholder", label: "A little deeper (1 of 2)" },
  { kind: "placeholder", label: "A little deeper (2 of 2)" },
  // 23-24 Assets and contact: Section 10, deferred
  { kind: "placeholder", label: "Assets: the thumbnails" },
  { kind: "placeholder", label: "Assets: contact and handles" },
];

/* The Find Pug clip, kept out of the DOM until the poster is tapped. Its own box
   carries the clip's aspect (--aspect = w/h), so poster and player fill it with no
   letterbox. When the slide is swiped away (active goes false) the iframe is
   unmounted and the facade returns, so a Vimeo player never sits off-screen
   capturing touch or holding a connection. */
function VideoFacade({
  videoId,
  poster,
  alt,
  width,
  height,
  active,
}: {
  videoId: string;
  poster: string;
  alt: string;
  width: number;
  height: number;
  active: boolean;
}) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!active) setPlaying(false);
  }, [active]);

  return (
    <div
      className={styles.videoBox}
      style={{ "--aspect": width / height } as CSSProperties}
    >
      {playing ? (
        <iframe
          className={styles.videoFrame}
          src={`https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0&dnt=1`}
          title="Find Pug advert"
          allow="autoplay; fullscreen; picture-in-picture"
          frameBorder="0"
        />
      ) : (
        <button
          type="button"
          className={styles.videoFacade}
          onClick={() => setPlaying(true)}
          aria-label="Play the Find Pug advert"
          tabIndex={active ? 0 : -1}
        >
          <Image
            className={styles.videoPoster}
            src={poster}
            alt={alt}
            fill
            sizes="(min-width: 769px) 60vw, 90vw"
          />
          <span className={styles.playIcon} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export default function PressCarousel() {
  const railRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = SLIDES.length;

  const goTo = useCallback(
    (target: number) => {
      const rail = railRef.current;
      if (!rail) return;
      const clamped = Math.max(0, Math.min(count - 1, target));
      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      rail.scrollTo({
        left: clamped * rail.clientWidth,
        behavior: reduced ? "auto" : "smooth",
      });
    },
    [count],
  );

  // The settled slide is read back from scroll position, so a swipe, a button
  // and a keypress all feed the same counter (same idea as the superpower rail).
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const i = Math.round(rail.scrollLeft / rail.clientWidth);
        setIndex((prev) => (prev === i ? prev : i));
      });
    };
    rail.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      rail.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Keyboard: left/right step, home/end jump. Ignored while typing in a field
  // and when a modifier is held, so browser shortcuts are untouched.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo(index + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(index - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        goTo(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goTo(count - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, count, goTo]);

  const atStart = index <= 0;
  const atEnd = index >= count - 1;
  const progress = ((index + 1) / count) * 100;

  return (
    <section
      className={styles.pack}
      aria-roledescription="carousel"
      aria-label="Pedigree Chums press pack"
    >
      <div className={styles.rail} ref={railRef}>
        {SLIDES.map((slide, i) => (
          <article
            key={i}
            className={styles.slide}
            aria-roledescription="slide"
            aria-label={`Slide ${i + 1} of ${count}`}
            aria-hidden={i !== index}
          >
            {slide.kind === "image" ? (
              <div className={styles.media}>
                <Image
                  className={styles.mediaImg}
                  src={slide.src}
                  alt={slide.alt}
                  width={slide.width}
                  height={slide.height}
                  priority={slide.priority}
                  sizes="(min-width: 769px) 72vw, 92vw"
                />
              </div>
            ) : slide.kind === "video" ? (
              <div className={styles.media}>
                <VideoFacade
                  videoId={slide.videoId}
                  poster={slide.poster}
                  alt={slide.alt}
                  width={slide.width}
                  height={slide.height}
                  active={i === index}
                />
              </div>
            ) : (
              <div className={styles.placeholder}>
                <p className={styles.kicker}>Placeholder</p>
                <p className={styles.slideNum}>{i + 1}</p>
                <p className={styles.slideRole}>{slide.label}</p>
              </div>
            )}
          </article>
        ))}
      </div>

      <button
        type="button"
        className={`${styles.arrow} ${styles.prev}`}
        onClick={() => goTo(index - 1)}
        disabled={atStart}
        aria-label="Previous slide"
      >
        <span aria-hidden="true">{"‹"}</span>
      </button>
      <button
        type="button"
        className={`${styles.arrow} ${styles.next}`}
        onClick={() => goTo(index + 1)}
        disabled={atEnd}
        aria-label="Next slide"
      >
        <span aria-hidden="true">{"›"}</span>
      </button>

      <div className={styles.indicator}>
        <p className={styles.counter} aria-live="polite">
          {index + 1} / {count}
        </p>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={count}
          aria-valuenow={index + 1}
          aria-label="Slide position"
        >
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
      </div>
    </section>
  );
}
