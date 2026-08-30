"use client";

import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./page.module.css";
/* The one approved container for text on a darker ground (brief section 1): the
   britains-dog-history blue-fade panel. Imported and reused as-is; the press page
   adds only the .panel/.copy* helpers that let it fill a slide. */
import panel from "../britains-dog-history/history.module.css";

/* Press pack, /press. The online pack is 16 screens (docs/press/COPY.md, the short
   70/30 version). Each screen is one slide: a picture (dominant) over a short,
   verbatim copy block in the blue-fade panel. Copy is the owner's own, cut but
   never rewritten; screens 9, 13 and 15 of the long version are PDF-only and do
   not appear here, and sections 17-19 (A Little Deeper, Press Assets, Press
   Enquiries) are the new tail. Every image comes from the supplied press folder.

   Two screens are Vimeo clips and one is a self-hosted clip, all behind a
   click-to-play facade: the iframe/video is kept out of the DOM until the poster
   is tapped and unmounted again when the slide is swiped away, so a live player
   never captures touch and fights the swipe rail.

   Mechanics are the proven scroll-snap + goTo pattern (the superpower rail's React
   model, not its dark theme), plus the net-new prev/next pair, keyboard arrows and
   position indicator. Horizontal swipe comes free from native scroll-snap. */

type Pic = { src: string; alt: string; w: number; h: number };
type Media =
  | { type: "image"; pic: Pic; priority?: boolean }
  | { type: "thumbs"; items: Pic[] }
  | { type: "diptych"; items: [Pic, Pic] }
  | { type: "vimeo"; videoId: string; poster: string; alt: string; w: number; h: number; label: string }
  | { type: "file"; src: string; poster: string; alt: string; w: number; h: number; label: string };

type Block = { kind: "standfirst" | "body" | "display"; text: string };
type Screen = { title?: string; media?: Media; blocks: Block[] };

const SCREENS: Screen[] = [
  // 1 Cover (§1). Picture: ad1d still (child with a real dog). "Cover" is a label,
  // not copy, so no title is printed.
  {
    media: {
      type: "image",
      priority: true,
      pic: {
        src: "/press/ad1d-still.jpg",
        alt: "A young girl in green hugging a grey dog on grass while a woman holds it, a real-world family and dog moment.",
        w: 750,
        h: 1064,
      },
    },
    blocks: [
      { kind: "standfirst", text: "Pedigree Chums. A Very British Game." },
      {
        kind: "body",
        text: "Fifty-four Chums introduce the dogs. Britain provides the places to find them.",
      },
      { kind: "display", text: "There is no board. Britain is the board." },
    ],
  },
  // 2 The Cards Are the Lens (§2)
  {
    title: "The Cards Are the Lens",
    media: {
      type: "image",
      pic: {
        src: "/press/card-on-cartoon.jpg",
        alt: "The illustrated Pug character card set against a painted parkland background.",
        w: 1798,
        h: 2500,
      },
    },
    blocks: [
      { kind: "standfirst", text: "Look at the card. Then look up." },
      {
        kind: "body",
        text: "A dog in the park becomes a Labrador. A dog on the train becomes a Collie.",
      },
      {
        kind: "body",
        text: "The cards provide the structure. The real world provides the chance.",
      },
    ],
  },
  // 3 Meet Pug (§3)
  {
    title: "Meet Pug",
    media: {
      type: "image",
      pic: {
        src: "/press/card-on-colour.jpg",
        alt: "The Pug character card on a blue and yellow studio set.",
        w: 1798,
        h: 2500,
      },
    },
    blocks: [
      { kind: "standfirst", text: "One of 54 Chums." },
      {
        kind: "body",
        text: "There may be millions of dogs outside the cards. In our world, there is only one Pug.",
      },
    ],
  },
  // 4 Imaginary. Real. Tangible. (§4). Thumbs map the four-beat cycle:
  // imaginary (card), real (dog), tangible (figurine), imaginary again (card).
  {
    title: "Imaginary. Real. Tangible.",
    media: {
      type: "thumbs",
      items: [
        {
          src: "/press/card-on-real.jpg",
          alt: "The Pug card shown against a real grassy field: imaginary.",
          w: 4930,
          h: 6855,
        },
        {
          src: "/press/dog-on-real.jpg",
          alt: "A real fawn Pug standing in long grass: real.",
          w: 2158,
          h: 3000,
        },
        {
          src: "/press/to-pickup.jpg",
          alt: "The blue 3D printed Pug figurine on a plain background: tangible.",
          w: 1122,
          h: 1402,
        },
        {
          src: "/press/card-on-colour.jpg",
          alt: "The Pug card again: imaginary once more.",
          w: 1798,
          h: 2500,
        },
      ],
    },
    blocks: [
      { kind: "standfirst", text: "One Pug. Three states." },
      {
        kind: "body",
        text: "Inside the card, Pug is imaginary. In the real world, Pug is real. As a figurine, Pug is tangible.",
      },
      { kind: "display", text: "Imaginary → Real → Tangible → Imaginary" },
    ],
  },
  // 5 Why Pug? (§5). Vimeo advertB.
  {
    title: "Why Pug?",
    media: {
      type: "vimeo",
      videoId: "1221597431",
      poster: "/press/advertB-poster.jpg",
      alt: "A fawn Pug walking through grass, the opening frame of the Find Pug advert.",
      w: 1250,
      h: 1660,
      label: "the Find Pug advert",
    },
    blocks: [
      { kind: "standfirst", text: "We had a plan. Pug had instincts." },
      { kind: "body", text: "A ball rolls past. Pug follows it." },
      {
        kind: "body",
        text: "Pug is not trying to cause trouble. Pug is simply behaving like a dog.",
      },
    ],
  },
  // 6 One Pug. One Prize. (§6)
  {
    title: "One Pug. One Prize.",
    media: {
      type: "image",
      pic: {
        src: "/press/get-your-ticket.jpg",
        alt: "A We Lost Pug, Find Pug free-entry ticket above the blue Pug figurine being photographed on a Pug podium.",
        w: 1042,
        h: 1452,
      },
    },
    blocks: [
      { kind: "standfirst", text: "A genuine one-of-one." },
      {
        kind: "body",
        text: "The physical Pug is the only one currently in existence, with no plans to produce another.",
      },
      { kind: "body", text: "But first, we have another problem to solve." },
    ],
  },
  // 7 Making Pug Tangible (§7). Vimeo make-ad (moved here; fits the making of it).
  {
    title: "Making Pug Tangible",
    media: {
      type: "vimeo",
      videoId: "1221597430",
      poster: "/press/make-ad-poster.jpg",
      alt: "The Pug figurine as a grey 3D model in a sculpting program, before it is printed.",
      w: 1440,
      h: 1920,
      label: "the making of the figurine",
    },
    blocks: [
      { kind: "standfirst", text: "From imagination into your hand." },
      {
        kind: "body",
        text: "A character that begins as an illustration becomes something real enough to hold.",
      },
      { kind: "body", text: "The form changes. Pug does not." },
    ],
  },
  // 8 Find Pug (§8). Thumbs: slide2, slide4, slide6 (slide5 dropped, "collect them
  // all" contradicts the one-of-one copy).
  {
    title: "Find Pug",
    media: {
      type: "thumbs",
      items: [
        {
          src: "/press/slide2.jpg",
          alt: "The Pug character card on a blue and yellow set.",
          w: 1250,
          h: 1738,
        },
        {
          src: "/press/slide4.jpg",
          alt: "A real Pug in grass with TikTok and Instagram icons and the words When you do.",
          w: 1250,
          h: 1738,
        },
        {
          src: "/press/slide6.jpg",
          alt: "The blue Pug figurine being photographed on a Pug podium and held in a palm, with a Win Me badge.",
          w: 1250,
          h: 1738,
        },
      ],
    },
    blocks: [
      { kind: "standfirst", text: "The public becomes part of the story." },
      {
        kind: "body",
        text: "Look up. Notice a dog. Recognise the breed. This time, we are looking for Pug.",
      },
      {
        kind: "display",
        text: "Spot Pug. Take a photograph. Post it. Tag Pedigree Chums. Use #ChumSpot.",
      },
    ],
  },
  // 9 Then Pug Left (§10). Diptych: card with Pug, then blank card.
  {
    title: "Then Pug Left",
    media: {
      type: "diptych",
      items: [
        {
          src: "/press/slide10.jpg",
          alt: "The pre-order product scene with the Pug present on the card.",
          w: 1250,
          h: 1738,
        },
        {
          src: "/press/slide12.jpg",
          alt: "The same pre-order scene with the card now blank.",
          w: 1250,
          h: 1738,
        },
      ],
    },
    blocks: [
      { kind: "standfirst", text: "We turned our backs." },
      {
        kind: "body",
        text: "During the photoshoot, Pug jumped from the card and disappeared into the real world.",
      },
      { kind: "body", text: "And now the Pug card is empty." },
    ],
  },
  // 10 There Is Only One Pug (§11). Thumbs: the five leaving/real-Pug beats.
  {
    title: "There Is Only One Pug",
    media: {
      type: "thumbs",
      items: [
        {
          src: "/press/slide13.jpg",
          alt: "The Pug card standing in a sunlit painted field, with the words Find Pug.",
          w: 1250,
          h: 1738,
        },
        {
          src: "/press/slide14.jpg",
          alt: "The cartoon Pug leaping out of its card into a painted sky.",
          w: 1250,
          h: 1738,
        },
        {
          src: "/press/slide14b.jpg",
          alt: "The cartoon Pug flying over an empty field with a person-and-dog icon.",
          w: 1250,
          h: 1738,
        },
        {
          src: "/press/slide15.jpg",
          alt: "A real fawn Pug walking through grass, tagged hashtag ChumSpot.",
          w: 1250,
          h: 1738,
        },
        {
          src: "/press/slide16.jpg",
          alt: "A real fawn Pug running through grass, tagged hashtag ChumSpot.",
          w: 1250,
          h: 1738,
        },
      ],
    },
    blocks: [
      { kind: "standfirst", text: "So how can any real Pug be Pug?" },
      {
        kind: "body",
        text: "In Pedigree Chums, each breed is represented by one Chum.",
      },
      { kind: "body", text: "Every real Pug you see could be a sighting of Pug." },
    ],
  },
  // 11 Turning Imagination Into Reality (§12). Self-hosted portrait-advert (the
  // clip displaced from screen 7).
  {
    title: "Turning Imagination Into Reality",
    media: {
      type: "file",
      src: "/press/portrait-advert.mp4",
      poster: "/press/portrait-advert-poster.jpg",
      alt: "The blue Pug figurine on a yellow Pug podium, the opening frame of the portrait advert.",
      w: 1328,
      h: 2004,
      label: "the portrait advert",
    },
    blocks: [
      { kind: "standfirst", text: "This is what Pedigree Chums was designed to do." },
      {
        kind: "body",
        text: "The card introduces the dog. Your imagination gives the dog character.",
      },
      { kind: "body", text: "Then you look up and find that dog walking past you." },
    ],
  },
  // 12 What We Have Now (§14). Empty podium.
  {
    title: "What We Have Now",
    media: {
      type: "image",
      pic: {
        src: "/press/no-3d-on-podium.jpg",
        alt: "An empty yellow podium in front of blue and cream arches.",
        w: 1798,
        h: 2500,
      },
    },
    blocks: [
      { kind: "standfirst", text: "53 Chums and one blank card." },
      {
        kind: "body",
        text: "There is no spare Pug. There is no replacement card waiting backstage.",
      },
      { kind: "body", text: "We cannot really launch like that." },
    ],
  },
  // 13 Help Us Find Pug (§16). Winner promo.
  {
    title: "Help Us Find Pug",
    media: {
      type: "image",
      pic: {
        src: "/press/winner-promo.jpg",
        alt: "The boxed blue Pug figurine with a We Have a Winner banner.",
        w: 1798,
        h: 2324,
      },
    },
    blocks: [
      { kind: "standfirst", text: "Get involved." },
      {
        kind: "display",
        text: "Spot Pug. Photograph Pug. Post Pug. Tag Pedigree Chums. Use #ChumSpot.",
      },
      {
        kind: "body",
        text: "One participant will receive the one-of-one physical Pug.",
      },
      { kind: "body", text: "We really would quite like Pug back." },
      { kind: "display", text: "There is no board. Britain is the board." },
    ],
  },
  // 14 A Little Deeper (§17). No picture assigned in the list; copy-only.
  {
    title: "A Little Deeper",
    blocks: [
      { kind: "standfirst", text: "Dog spotting is only the beginning." },
      {
        kind: "body",
        text: "Breed pages, working dogs, dogs and history, all built around curiosity rather than homework.",
      },
      {
        kind: "display",
        text: "Like dogs, curious people tend to find interesting things when they start digging.",
      },
    ],
  },
  // 15 Press Assets (§18). Copy-only.
  {
    title: "Press Assets",
    blocks: [
      { kind: "standfirst", text: "Available on request." },
      {
        kind: "body",
        text: "Hero films, campaign photography, the blank card, figurine photography, 3D-printing footage, logos and social artwork.",
      },
      {
        kind: "body",
        text: "The full press release is available as a PDF and quotable in whole or in part.",
      },
    ],
  },
  // 16 Press Enquiries (§19). Copy-only. The bracketed lines are owner placeholders
  // carried verbatim from the copy file (logged in PLACEHOLDERS.md).
  {
    title: "Press Enquiries",
    blocks: [
      { kind: "standfirst", text: "Get in touch." },
      { kind: "body", text: "[NAME]\n[EMAIL]\n[TELEPHONE]" },
      { kind: "body", text: "Website: [WEBSITE]\nInstagram: [HANDLE]" },
      { kind: "body", text: "Competition opens: [DATE]. Closes: [DATE]." },
      { kind: "display", text: "There is no board. Britain is the board." },
    ],
  },
];

/* A clip kept out of the DOM until the poster is tapped, then swapped for the
   player. Vimeo clips mount an iframe; the self-hosted clip mounts a <video>. When
   the slide is swiped away (active false) the player is unmounted and the facade
   returns, so it never sits off-screen capturing touch or holding a connection. */
function VideoFacade({
  media,
  active,
}: {
  media: Extract<Media, { type: "vimeo" | "file" }>;
  active: boolean;
}) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!active) setPlaying(false);
  }, [active]);

  return (
    <div
      className={styles.videoBox}
      style={{ "--aspect": media.w / media.h } as CSSProperties}
    >
      {playing && media.type === "vimeo" ? (
        <iframe
          className={styles.videoFrame}
          src={`https://player.vimeo.com/video/${media.videoId}?autoplay=1&title=0&byline=0&portrait=0&dnt=1`}
          title={media.label}
          allow="autoplay; fullscreen; picture-in-picture"
          frameBorder="0"
        />
      ) : playing && media.type === "file" ? (
        <video
          className={styles.videoFrame}
          src={media.src}
          poster={media.poster}
          autoPlay
          controls
          playsInline
        />
      ) : (
        <button
          type="button"
          className={styles.videoFacade}
          onClick={() => setPlaying(true)}
          aria-label={`Play ${media.label}`}
          tabIndex={active ? 0 : -1}
        >
          <Image
            className={styles.videoPoster}
            src={media.poster}
            alt={media.alt}
            fill
            sizes="(min-width: 769px) 60vw, 90vw"
          />
          <span className={styles.playIcon} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function Thumb({ pic }: { pic: Pic }) {
  return (
    <Image
      className={styles.thumbImg}
      src={pic.src}
      alt={pic.alt}
      width={pic.w}
      height={pic.h}
      sizes="(min-width: 769px) 36vw, 46vw"
    />
  );
}

function MediaView({ media, active }: { media: Media; active: boolean }) {
  if (media.type === "image") {
    return (
      <Image
        className={styles.mediaImg}
        src={media.pic.src}
        alt={media.pic.alt}
        width={media.pic.w}
        height={media.pic.h}
        priority={media.priority}
        sizes="(min-width: 769px) 72vw, 92vw"
      />
    );
  }
  if (media.type === "thumbs") {
    return (
      <div className={styles.thumbGrid}>
        {media.items.map((pic) => (
          <Thumb key={pic.src} pic={pic} />
        ))}
      </div>
    );
  }
  if (media.type === "diptych") {
    return (
      <div className={styles.diptych}>
        {media.items.map((pic) => (
          <Thumb key={pic.src} pic={pic} />
        ))}
      </div>
    );
  }
  return <VideoFacade media={media} active={active} />;
}

/* The blue-fade panel with the screen's copy. glowLayer + circles are the panel's
   own decoration, reproduced exactly as the history page composes them. */
function CopyPanel({ title, blocks }: { title?: string; blocks: Block[] }) {
  return (
    <div className={`${panel.section} ${styles.panel}`}>
      <div className={panel.glowLayer} aria-hidden="true">
        <div className={`${panel.glowCircle} ${panel.glowTop}`} />
        <div className={`${panel.glowCircle} ${panel.glowBottom}`} />
      </div>
      <div className={styles.panelBody}>
        {title ? <p className={styles.copyTitle}>{title}</p> : null}
        {blocks.map((b, i) => {
          const cls =
            b.kind === "standfirst"
              ? styles.copyStandfirst
              : b.kind === "display"
                ? styles.copyDisplay
                : styles.copyBody;
          return (
            <p key={i} className={cls}>
              {b.text}
            </p>
          );
        })}
      </div>
    </div>
  );
}

function ScreenView({ screen, active }: { screen: Screen; active: boolean }): ReactNode {
  const copy = <CopyPanel title={screen.title} blocks={screen.blocks} />;
  if (!screen.media) {
    return <div className={styles.copyOnly}>{copy}</div>;
  }
  return (
    <div className={styles.screen}>
      <div className={styles.screenMedia}>
        <MediaView media={screen.media} active={active} />
      </div>
      <div className={styles.copyWrap}>{copy}</div>
    </div>
  );
}

export default function PressCarousel() {
  const railRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = SCREENS.length;

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
        {SCREENS.map((screen, i) => (
          <article
            key={i}
            className={styles.slide}
            aria-roledescription="slide"
            aria-label={`Slide ${i + 1} of ${count}`}
            aria-hidden={i !== index}
          >
            <ScreenView screen={screen} active={i === index} />
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
