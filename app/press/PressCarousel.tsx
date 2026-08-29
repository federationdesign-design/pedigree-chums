"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./page.module.css";

/* Press pack: the click-through carousel. Media is wired into the slides that
   have a resolved asset (docs/press/PLAN.md plus the owner's pick list, 30 Aug);
   the remaining slides stay as PLACEHOLDER frames, either because the section is
   deferred (press release text, no-board, a-little-deeper, assets/contact) or
   because the copy is owner-supplied and not yet written (story payoff, the two
   closing lines).

   Every image comes from the supplied press folder; nothing from the repo root.
   The owner's picks are primary and my recommendations only fill the gaps they
   leave (the Find Pug dates/prize still uses get-your-ticket).

   Mechanics are the proven scroll-snap + goTo pattern (borrowed from the
   superpower rail's React model, not its dark theme), plus the three controls
   that are net-new to this pack: a previous/next pair, keyboard arrows, and a
   position indicator. Horizontal swipe comes free from native scroll-snap.

   Two slides are Vimeo clips behind a click-to-play facade: the story video
   (advert2B) on Story in 30s, and advertB on Find Pug. A live Vimeo iframe
   captures touch and would fight the swipe rail (its own comment on
   CompetitionVideoRow documents exactly this), so the iframe is kept out of the
   DOM until the poster is tapped, and unmounted again when the slide is swiped
   away. */

type Slide =
  | { kind: "image"; src: string; alt: string; width: number; height: number; priority?: boolean }
  | {
      kind: "video";
      videoId: string;
      poster: string;
      alt: string;
      width: number;
      height: number;
      label: string;
    }
  | { kind: "placeholder"; label: string };

const SLIDES: Slide[] = [
  // 1 Cover (owner: slide1.jpg)
  {
    kind: "image",
    src: "/press/cover.jpg",
    alt: "Poster reading Can You Find Pug over a photograph of an empty grassy field under a blue sky, with a large yellow question mark and the Pedigree Chums logo.",
    width: 1250,
    height: 1738,
    priority: true,
  },
  // 2 Story in 30s (owner: advert2B.mp4, Vimeo 1221597429, facade)
  {
    kind: "video",
    videoId: "1221597429",
    poster: "/press/story-video-poster.jpg",
    alt: "The Pug character card standing on a blue and yellow set, the opening frame of the story video.",
    width: 1380,
    height: 1920,
    label: "the story video",
  },
  // 3 Story in 30s (2 of 2): owner copy only, no image
  { kind: "placeholder", label: "Story in 30s (2 of 2)" },
  // 4 Press release (owner: blue-orig1.jpg)
  {
    kind: "image",
    src: "/press/press-release.jpg",
    alt: "The blue 3D printed Pug figurine facing forward on a plain pale background.",
    width: 1449,
    height: 1473,
  },
  // 5 Press release (2 of 2): Section 3 release text deferred
  { kind: "placeholder", label: "Press release (2 of 2)" },
  // 6 How the world works: Imaginary (owner: card-on-cartoon.jpg)
  {
    kind: "image",
    src: "/press/state-imaginary.jpg",
    alt: "The illustrated Pug character card: a cartoon Pug on a blue breed card headed Pug, set against a painted parkland background.",
    width: 1798,
    height: 2500,
  },
  // 7 Real (owner: dog-on-real.jpg)
  {
    kind: "image",
    src: "/press/state-real.jpg",
    alt: "A real fawn Pug standing in long grass under a bright blue sky, photographed from low down.",
    width: 2158,
    height: 3000,
  },
  // 8 Tangible (owner: slide3.jpg)
  {
    kind: "image",
    src: "/press/state-tangible.jpg",
    alt: "The blue 3D printed Pug figurine on a yellow podium labelled Pug beneath a Win Me badge, in front of blue and cream arches.",
    width: 1250,
    height: 1738,
  },
  // 9 Missing card 1 (owner order: slide13.jpg)
  {
    kind: "image",
    src: "/press/missing-1.jpg",
    alt: "The Pug character card standing in a sunlit painted field, with the words Find Pug.",
    width: 1250,
    height: 1738,
  },
  // 10 Missing card 2 (owner order: slide14.jpg)
  {
    kind: "image",
    src: "/press/missing-2.jpg",
    alt: "The cartoon Pug leaping up out of its breed card into a painted sky, with the words Find Pug.",
    width: 1250,
    height: 1738,
  },
  // 11 Missing card 3 (owner order: slide14b.jpg)
  {
    kind: "image",
    src: "/press/missing-3.jpg",
    alt: "The cartoon Pug flying through a painted sky above an empty field, with a person-and-dog icon and the words Find Pug.",
    width: 1250,
    height: 1738,
  },
  // 12 Missing card 4 (owner order: slide17b.jpg)
  {
    kind: "image",
    src: "/press/missing-4.jpg",
    alt: "A close-up of the blue 3D printed Pug figurine held in a hand against a blue and yellow set.",
    width: 1250,
    height: 1738,
  },
  // 13 Missing card 5 (owner order: zoom-card.jpg)
  {
    kind: "image",
    src: "/press/missing-5.jpg",
    alt: "The Pug breed card standing upright on a podium, the cartoon Pug present on the blue card.",
    width: 1250,
    height: 1738,
  },
  // 14 Missing card 6 (owner order: slide12.jpg)
  {
    kind: "image",
    src: "/press/missing-6.jpg",
    alt: "A Pre-order now scene: the Pug character card and the boxed Pedigree Chums set on blue podiums against a yellow background.",
    width: 1250,
    height: 1738,
  },
  // 15 Missing card 7 (owner order: slide15.jpg)
  {
    kind: "image",
    src: "/press/missing-7.jpg",
    alt: "A real fawn Pug walking through grass, overlaid with the hashtag ChumSpot and the words Add photo to our feed.",
    width: 1250,
    height: 1738,
  },
  // 16 Missing card 8 (owner order: slide16.jpg)
  {
    kind: "image",
    src: "/press/missing-8.jpg",
    alt: "A real fawn Pug running through grass, overlaid with the hashtag ChumSpot and the words Add photo to our feed.",
    width: 1250,
    height: 1738,
  },
  // 17-18 Closing lines: owner copy only, no image
  { kind: "placeholder", label: "54 became 53" },
  { kind: "placeholder", label: "We can't launch like that" },
  // 19 Find Pug: the steps (owner: advertB.mp4, Vimeo 1221597431, facade)
  {
    kind: "video",
    videoId: "1221597431",
    poster: "/press/findpug-video-poster.jpg",
    alt: "A fawn Pug walking through grass under a blue sky, the opening frame of the Find Pug advert.",
    width: 1250,
    height: 1660,
    label: "the Find Pug advert",
  },
  // 20 Find Pug: dates and prize (gap-fill: get-your-ticket.jpg)
  {
    kind: "image",
    src: "/press/findpug-ticket.jpg",
    alt: "A We Lost Pug, Find Pug free-entry ticket above a photo of the blue Pug figurine being placed on a Pug podium in front of a camera.",
    width: 1042,
    height: 1452,
  },
  // 21 One-of-one: the figurine (owner: slide6.jpg)
  {
    kind: "image",
    src: "/press/figurine-a.jpg",
    alt: "The blue 3D printed Pug figurine being photographed on a Pug podium and held in an open palm, with a Win Me badge.",
    width: 1250,
    height: 1738,
  },
  // 22 One-of-one: only one exists (owner: slide5.jpg)
  {
    kind: "image",
    src: "/press/figurine-b.jpg",
    alt: "The blue 3D printed Pug figurine inside a Pedigree Chums window box labelled Pug, a loyal little legend, on a yellow and blue set.",
    width: 1250,
    height: 1738,
  },
  // 23-25 No board: owner pick ad1d.mp4 is not on Vimeo, so this stays a
  // placeholder until the clip is uploaded (no substitute).
  { kind: "placeholder", label: "Britain is the board" },
  { kind: "placeholder", label: "Take them outside" },
  { kind: "placeholder", label: "The traffic-jam example" },
  // 26-27 A little deeper: Section 9, deferred (no supplied asset fits)
  { kind: "placeholder", label: "A little deeper (1 of 2)" },
  { kind: "placeholder", label: "A little deeper (2 of 2)" },
  // 28-29 Assets and contact: Section 10, deferred
  { kind: "placeholder", label: "Assets: the thumbnails" },
  { kind: "placeholder", label: "Assets: contact and handles" },
];

/* A Vimeo clip kept out of the DOM until the poster is tapped. Its own box carries
   the clip's aspect (--aspect = w/h), so poster and player fill it with no
   letterbox. When the slide is swiped away (active goes false) the iframe is
   unmounted and the facade returns, so a Vimeo player never sits off-screen
   capturing touch or holding a connection. */
function VideoFacade({
  videoId,
  poster,
  alt,
  width,
  height,
  label,
  active,
}: {
  videoId: string;
  poster: string;
  alt: string;
  width: number;
  height: number;
  label: string;
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
          title={label}
          allow="autoplay; fullscreen; picture-in-picture"
          frameBorder="0"
        />
      ) : (
        <button
          type="button"
          className={styles.videoFacade}
          onClick={() => setPlaying(true)}
          aria-label={`Play ${label}`}
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
                  label={slide.label}
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
