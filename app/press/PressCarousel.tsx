"use client";

import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import ReadingProgress from "../../components/ReadingProgress/ReadingProgress";
import ArticleTextToggle from "../../components/ArticleTextToggle/ArticleTextToggle";
import WorkChevron from "../../components/WorkChevron/WorkChevron";
import BentoBoard from "../../components/Nav/BentoBoard";
import styles from "./page.module.css";
/* The one approved container for text on a darker ground (brief section 1): the
   britains-dog-history blue-fade panel. Imported and reused as-is; the press page
   adds only the .panel/.copy* helpers that let it fill a slide. */
import panel from "../britains-dog-history/history.module.css";

/* Press pack, /press. 17 screens after the screens 1-7 revision (docs/press/
   REVISIONS.md): the old "Imaginary. Real. Tangible." screen splits into two 2x2
   grids (new 4 and 5), which pushes everything after it down one. Screens 1 and 2
   now overlay their copy on the picture (bottom, inset 15px) rather than below it;
   the rest keep the picture-over-panel stack. Screen 3 is HELD pending its image
   list, so it is unchanged. Screens 4 and 5 carry clearly-labelled placeholder
   copy (logged in PLACEHOLDERS.md); the wording follows later.

   Text colour is left to the site's global controls (the A/A/A contrast toolbar
   and the text-invert toggle); no per-screen control is added.

   Video screens are Vimeo or self-hosted clips behind a click-to-play facade: the
   player is kept out of the DOM until the poster is tapped and unmounted again on
   swipe-away, so it never fights the swipe rail.

   Mechanics are the proven scroll-snap + goTo pattern, plus the net-new prev/next
   pair, keyboard arrows and position indicator. */

type Pic = { src: string; alt: string; w: number; h: number };
type VideoMedia =
  | { type: "vimeo"; videoId: string; poster: string; alt: string; w: number; h: number; label: string }
  | { type: "file"; src: string; poster: string; alt: string; w: number; h: number; label: string };
/* A cell in the neat two-column grid: either an image or a video. */
type NeatCell = { img: Pic } | { vid: VideoMedia };
type Media =
  | { type: "image"; pic: Pic; priority?: boolean }
  | { type: "thumbs"; items: Pic[] }
  | { type: "grid"; items: Pic[] }
  | { type: "gallery"; items: Pic[] }
  | { type: "diptych"; items: [Pic, Pic]; captions?: [string, string] }
  | { type: "pairAndRow"; pair: [Pic, Pic]; row: Pic[] }
  | { type: "neat"; colA: NeatCell[]; colB: NeatCell[]; split?: [number, number] }
  | { type: "videoStack"; video: VideoMedia; images: Pic[]; videoScale?: number; imgScale?: number }
  | { type: "bento" }
  | VideoMedia;

type Block = { kind: "standfirst" | "body" | "display"; text: string; mont?: boolean };
type Screen = {
  /* Round 3: a Luckiest Guy yellow title above the media, one class for all six. */
  topTitle?: string;
  title?: string;
  media?: Media;
  blocks: Block[];
  layout?: "overlay";
  /* px offset of the overlaid copy from the media bottom (default 15). */
  overlayBottom?: number;
  /* screen 2: images 30% wider, pushed to the top. */
  mediaVariant?: "wideTop";
  /* screens 1, 6: video 20% smaller. */
  mediaShrink?: boolean;
  /* Round 11: widen the non-overlay media to the --media-wide envelope. */
  mediaWide?: boolean;
  /* screen 16: a text-box grid of available assets. */
  assetGrid?: { heading: string; items: string[]; href?: string }[];
};

const SCREENS: Screen[] = [
  // 1 Cover. Vimeo film (ad1d), copy overlaid; video 20% smaller (round 3).
  {
    layout: "overlay",
    mediaShrink: true,
    media: {
      type: "vimeo",
      videoId: "1222451619",
      poster: "/press/ad1d-still.jpg",
      alt: "A young girl in green hugging a grey dog on grass while a woman holds it, a real-world family and dog moment.",
      w: 3594,
      h: 5100,
      label: "the opening film",
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
  // 2 The Card Is the Lens (round 3): title moved to the top, image subtitles,
  // second image now dog-on-real, the list rewritten as one bold comma sentence at
  // the top of the container, 10px gutter.
  {
    layout: "overlay",
    mediaVariant: "wideTop",
    topTitle: "The Card Is the Lens",
    media: {
      type: "diptych",
      captions: ["Imagination world", "Real-life world"],
      items: [
        {
          src: "/press/card-on-cartoon.jpg",
          alt: "The illustrated Pug card against a painted parkland background.",
          w: 1798,
          h: 2500,
        },
        {
          src: "/press/dog-on-real.jpg",
          alt: "A real fawn Pug standing in long grass under a bright blue sky.",
          w: 2158,
          h: 3000,
        },
      ],
    },
    // Round 9 (settled): the tail moved off to the "Meet Pug" diptych.
    blocks: [
      {
        kind: "standfirst",
        text: "The card introduces the dog, Your imagination gives the dog character, The real world brings the dog to life",
      },
      {
        kind: "body",
        text: "Every Chum begins in the card, where illustration turns a breed into something you can imagine.",
      },
    ],
  },
  // 3 Meet Pug (round 6): same diptych styling as screen 2, with a row of five
  // alternate-Pug images added below the two columns. (The pair sits in the normal
  // media envelope, not screen 2's wider one: at the wider width the portrait pair
  // grows tall enough to overrun the copy panel and the new row, so it cannot match
  // screen 2's exact size while also carrying the row and the copy. Flagged.)
  {
    topTitle: "Meet Pug",
    // Round 12: copy "The Card Is the Lens" positioning completely: an overlay wideTop
    // diptych. The round-6 five-image row is dropped, because the deep panel overlap
    // (round 11) always covered it and pushed it below the container.
    layout: "overlay",
    mediaVariant: "wideTop",
    media: {
      type: "diptych",
      items: [
        {
          src: "/press/dog-on-real.jpg",
          alt: "A real fawn Pug standing in long grass under a bright blue sky.",
          w: 2158,
          h: 3000,
        },
        {
          src: "/press/card-on-colour.jpg",
          alt: "The Pug character card on a blue and yellow studio set.",
          w: 1798,
          h: 2500,
        },
      ],
    },
    // Round 9 (settled): this slide's own copy moved to the video slide; it now carries
    // the tail moved off "The Card Is the Lens".
    blocks: [
      {
        kind: "body",
        text: "recognise and play with, helping you notice, recognise and understand the dogs that were already around you.",
      },
      {
        kind: "body",
        text: "The world has not changed. The way you look at it has.",
      },
    ],
  },
  // NEW (round 5, inserted after 3, before 4): Meet Pug, a video.
  {
    topTitle: "Meet Pug",
    media: {
      type: "file",
      src: "/press/pug-run.mp4",
      poster: "/press/pug-run-poster.jpg",
      alt: "A film of a Pug running.",
      w: 850,
      h: 980,
      label: "the Pug running film",
    },
    // Round 9 (settled): gains the copy moved off the "Meet Pug" diptych.
    blocks: [
      { kind: "standfirst", text: "One of 54 Chums." },
      {
        kind: "body",
        text: "There may be millions of Pug outside the cards. but in the chums world, there is only Pug. Every real Pug you see is the Pug.",
      },
    ],
  },
  // (Round 9: the two 2x2 grid screens, formerly "4 (new)" and "5 (new)", removed
  // entirely. This shifts the pack numbering after slide 4.)
  // 6 Why Pug? (round 5): two columns, a second video added, neat grid.
  {
    layout: "overlay",
    overlayBottom: 5,
    media: {
      type: "neat",
      colA: [
        {
          vid: {
            type: "vimeo",
            videoId: "1221597431",
            poster: "/press/advertB-poster.jpg",
            alt: "The illustrated Pug card on a painted parkland background, the opening frame of the Find Pug advert.",
            w: 1250,
            h: 1660,
            label: "the Find Pug advert",
          },
        },
      ],
      colB: [
        {
          vid: {
            type: "file",
            src: "/press/portrait-advert.mp4",
            poster: "/press/portrait-advert-poster.jpg",
            alt: "The blue Pug figurine on a yellow Pug podium, the opening frame of the portrait advert.",
            w: 1328,
            h: 2004,
            label: "the portrait advert",
          },
        },
      ],
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
  // 7 One Pug. One Prize. (round 3): title to the top, second column added with the
  // self-hosted Photoshop time-lapse video beside the ticket image.
  {
    layout: "overlay",
    overlayBottom: 5,
    topTitle: "One Pug. One Prize.",
    media: {
      type: "neat",
      // Round 11: reversed to column A 70%, column B (video) 30% (round 10 had it 30/70).
      split: [70, 30],
      colA: [
        {
          img: {
            src: "/press/get-your-ticket.jpg",
            alt: "A We Lost Pug, Find Pug free-entry ticket above the blue Pug figurine being photographed on a Pug podium.",
            w: 1042,
            h: 1452,
          },
        },
      ],
      colB: [
        {
          vid: {
            type: "file",
            src: "/press/photoshop-timesnaps.mp4",
            poster: "/press/photoshop-timesnaps-poster.jpg",
            alt: "A time-lapse of the Pug character being drawn and coloured in Photoshop.",
            w: 1112,
            h: 834,
            label: "the Photoshop time-lapse",
          },
        },
        {
          img: {
            src: "/press/blue-orig1.jpg",
            alt: "The blue 3D printed Pug figurine facing forward on a plain background.",
            w: 1449,
            h: 1473,
          },
        },
      ],
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
  // 8 Making Pug Tangible (round 3): title to the top, three assets fit uniformly
  // into a neat rectangle (neat), column gutter 10%.
  {
    layout: "overlay",
    overlayBottom: 5,
    topTitle: "Making Pug Tangible.",
    media: {
      type: "neat",
      // Round 10: column A (images) 30%, column B (video) 70%.
      split: [30, 70],
      colA: [
        {
          img: {
            src: "/press/handdrawn-pug.jpg",
            alt: "A rough blue-line hand drawing of the Pug character on a dark ground.",
            w: 1254,
            h: 1254,
          },
        },
        {
          img: {
            src: "/press/artworked-pug.jpg",
            alt: "The finished black line-art of the Pug character on a lemon background.",
            w: 1254,
            h: 1254,
          },
        },
      ],
      colB: [
        {
          vid: {
            type: "vimeo",
            videoId: "1221597430",
            poster: "/press/make-ad-poster.jpg",
            alt: "The Pug figurine as a grey 3D model in a sculpting program, before it is printed.",
            w: 1440,
            h: 1920,
            label: "the making of the figurine",
          },
        },
      ],
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
  // 9 Find Pug (round 3): title to the top, middle image dropped, two columns, the
  // steps line set in Montserrat.
  {
    topTitle: "Find Pug.",
    // Round 12: match "The Card Is the Lens" two-column positioning and size.
    layout: "overlay",
    mediaVariant: "wideTop",
    media: {
      type: "diptych",
      items: [
        { src: "/press/slide2.jpg", alt: "The Pug character card on a blue and yellow set.", w: 1250, h: 1738 },
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
        mont: true,
        text: "Spot Pug. Take a photograph. Post it. Tag Pedigree Chums. Use #ChumSpot.",
      },
    ],
  },
  // 10 Then Pug Left (round 4): full-width landscape video over two portrait images.
  {
    topTitle: "Then Pug Left.",
    media: {
      type: "videoStack",
      video: {
        type: "file",
        src: "/press/landscape-advert.mp4",
        poster: "/press/landscape-advert-poster.jpg",
        alt: "A landscape advert film for the Pedigree Chums Pug.",
        // Stored 1600x1200 with non-square pixels; it DISPLAYS as 16:9 (ffprobe
        // DAR 711:400). Frame the container to the display aspect, not the storage
        // size, or the clip letterboxes top and bottom.
        w: 1600,
        h: 900,
        label: "the landscape advert",
      },
      // Round 7: three new images added below the video (five in the row), each 10%
      // smaller, 10px gutter.
      imgScale: 0.9,
      images: [
        {
          src: "/press/slide9.jpg",
          alt: "A presenter placing the blue Pug figurine on a Pug podium in a studio.",
          w: 1250,
          h: 1738,
        },
        {
          src: "/press/slide19.jpg",
          alt: "The blue Pug figurine held in an open palm on a Pug podium, with a Win Me badge.",
          w: 1250,
          h: 1738,
        },
        { src: "/press/slide21.jpg", alt: "A Pedigree Chums Pug press image.", w: 1250, h: 1738 },
        { src: "/press/slide22.jpg", alt: "A Pedigree Chums Pug press image.", w: 1250, h: 1738 },
        { src: "/press/slide23.jpg", alt: "A Pedigree Chums Pug press image.", w: 1250, h: 1738 },
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
  // NEW (round 4, inserted after 10): There Is Only One Pug, copy from old 11.
  {
    topTitle: "There Is Only One Pug",
    media: {
      type: "videoStack",
      video: {
        type: "file",
        src: "/press/pug-escape.mp4",
        poster: "/press/pug-escape-poster.jpg",
        alt: "A film of the Pug escaping from the card into the real world.",
        w: 1280,
        h: 720,
        label: "the Pug escape film",
      },
      // Round 7: film 10% bigger, images 10% smaller. slide10.jpg added to make three
      // in a row. (The brief said "before the current slide12.jpg image", but this
      // screen had no slide12.jpg; slide10.jpg is placed first. Flagged.)
      // Round 12: video reduced 15% (1.1 -> 0.935) so the image row clears the copy panel.
      videoScale: 0.935,
      imgScale: 0.9,
      images: [
        { src: "/press/slide10.jpg", alt: "A Pedigree Chums Pug press image.", w: 1250, h: 1738 },
        {
          src: "/press/slide6.jpg",
          alt: "The blue Pug figurine being photographed on a Pug podium and held in a palm, with a Win Me badge.",
          w: 1250,
          h: 1738,
        },
        {
          src: "/press/non-zoom-card-no-dog.jpg",
          alt: "The Pug breed card with no dog on it: a blank card.",
          w: 1250,
          h: 1738,
        },
      ],
    },
    blocks: [
      { kind: "standfirst", text: "So how can any real Pug be Pug?" },
      { kind: "body", text: "In Pedigree Chums, each breed is represented by one Chum." },
      { kind: "body", text: "Every real Pug you see could be a sighting of Pug." },
    ],
  },
  // (old screen 11, the 5-thumb There Is Only One Pug, removed in round 4)
  // 12 Turning Imagination Into Reality (round 4): title to top, three-image gallery.
  {
    topTitle: "Turning Imagination Into Reality",
    // Round 12: match "The Card Is the Lens" positioning (overlay wideTop, centred).
    layout: "overlay",
    mediaVariant: "wideTop",
    media: {
      type: "gallery",
      items: [
        { src: "/press/cartoon-world.jpg", alt: "The Pug in its illustrated cartoon world.", w: 1250, h: 1738 },
        { src: "/press/no-dog-on-real.jpg", alt: "An empty real-world grassy field.", w: 1250, h: 1738 },
        { src: "/press/slide1.jpg", alt: "A Can You Find Pug poster.", w: 1250, h: 1738 },
      ],
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
  // 13 What We Have Now (round 4): title to top, two images.
  {
    topTitle: "What We Have Now",
    // Round 12: match "The Card Is the Lens" two-column positioning and size.
    layout: "overlay",
    mediaVariant: "wideTop",
    media: {
      type: "diptych",
      items: [
        { src: "/press/card-on-colour.jpg", alt: "The Pug character card on a blue and yellow studio set.", w: 1798, h: 2500 },
        { src: "/press/no-3d-on-podium.jpg", alt: "An empty yellow podium in front of blue and cream arches.", w: 1798, h: 2500 },
      ],
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
  // 14 Help Us Find Pug (round 4): title to top, Montserrat copy. Round 7: the four
  // images now sit in a 2x2 grid rather than a single row.
  {
    topTitle: "Help Us Find Pug",
    // Round 11: matched to "The Card Is the Lens": a wideTop diptych at native ratio,
    // filling more of the page (was a 2x2 grid with cover-fill).
    layout: "overlay",
    mediaVariant: "wideTop",
    media: {
      type: "diptych",
      items: [
        { src: "/press/slide4.jpg", alt: "A real Pug in grass with TikTok and Instagram icons and the words When you do.", w: 1250, h: 1738 },
        { src: "/press/slide5.jpg", alt: "The blue Pug figurine inside a Pedigree Chums window box.", w: 1250, h: 1738 },
      ],
    },
    blocks: [
      { kind: "standfirst", text: "Get involved." },
      {
        kind: "display",
        mont: true,
        text: "Spot Pug. Photograph Pug. Post Pug. Tag Pedigree Chums. Use #ChumSpot.",
      },
      { kind: "body", text: "One participant will receive the one-of-one physical Pug." },
      { kind: "body", text: "We really would quite like Pug back." },
      { kind: "display", mont: true, text: "There is no board. Britain is the board." },
    ],
  },
  // 15 A Little Deeper (round 4): title to top, the live bento menu as the media.
  {
    topTitle: "A Little Deeper",
    media: { type: "bento" },
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
  // 16 Press Assets (round 4): title to top, plus a text-box grid of the assets.
  {
    topTitle: "Press Assets",
    assetGrid: [
      { heading: "Video", items: ["Product", "CGI", "Live action"], href: "https://u.pcloud.link/publink/show?code=kZlwoJJZEuNohD0sHlf5SluVATShlfUmaexX" },
      { heading: "Photosets", items: ["Studio", "CGI", "Product"], href: "https://u.pcloud.link/publink/show?code=kZTwoJJZ45qECdWzTxQxWKs5DxpoFHbEApmy" },
      { heading: "Word docs", items: ["Campaign bio", "Competition terms"], href: "https://u.pcloud.link/publink/show?code=kZqwoJJZFScxcBvsTj8oo09dO5c4sHgkGAEV" },
    ],
    blocks: [
      { kind: "standfirst", text: "Available on request." },
      {
        kind: "body",
        text: "The full press release is available as a PDF and quotable in whole or in part.",
      },
    ],
  },
  // 17 Press Enquiries (was 16). Copy-only. Contact details supplied round 7.
  {
    title: "Press Enquiries",
    blocks: [
      { kind: "standfirst", text: "Get in touch." },
      { kind: "body", text: "Steven\nhello@pedigreechums.co.uk\n07507235380" },
      { kind: "body", text: "www.pedigreechums.co.uk\nhttps://www.instagram.com/" },
      { kind: "body", text: "Open date: 1st Sept\nClose date: 1st Oct" },
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
  onEnded,
}: {
  media: VideoMedia;
  active: boolean;
  // Round 10: fires when a self-hosted clip ends, to auto-advance. Vimeo iframes
  // cannot report end without the player SDK (a forbidden external script), so they
  // never auto-advance.
  onEnded?: () => void;
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
          onEnded={onEnded}
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

function MediaView({
  media,
  active,
  onEnded,
}: {
  media: Media;
  active: boolean;
  onEnded?: () => void;
}) {
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
  if (media.type === "grid") {
    return (
      <div className={styles.grid2x2}>
        {media.items.map((pic) => (
          <Thumb key={pic.src} pic={pic} />
        ))}
      </div>
    );
  }
  if (media.type === "diptych") {
    // index in the key: screen 3 uses the same file twice. Optional per-image
    // caption overlaid at the top (screen 2).
    return (
      <div className={styles.diptych}>
        {media.items.map((pic, i) => (
          <div key={`${pic.src}-${i}`} className={styles.diptychCell}>
            {media.captions ? (
              <span className={styles.imgCaption}>{media.captions[i]}</span>
            ) : null}
            <Thumb pic={pic} />
          </div>
        ))}
      </div>
    );
  }
  if (media.type === "neat") {
    // Two columns, each a stack of cells (image or video). Both columns stretch to
    // the same height and every cell cover-fills, so the block reads as one neat
    // rectangle with aligned edges and no gaps (screens 6, 7, 8).
    // Round 10: optional column split (e.g. [30, 70] for a wide video column). The
    // base flex is 1 1 0 (50/50); an inline flex-grow overrides it per column.
    const col = (cells: NeatCell[], grow?: number) => (
      <div className={styles.neatCol} style={grow ? { flexGrow: grow } : undefined}>
        {cells.map((c, i) => (
          <div key={i} className={styles.neatCell}>
            {"img" in c ? <Thumb pic={c.img} /> : <VideoFacade media={c.vid} active={active} onEnded={onEnded} />}
          </div>
        ))}
      </div>
    );
    return (
      <div className={styles.neat}>
        {col(media.colA, media.split?.[0])}
        {col(media.colB, media.split?.[1])}
      </div>
    );
  }
  if (media.type === "pairAndRow") {
    // Two columns with a row of images below (screen 3).
    return (
      <div className={styles.pairAndRow}>
        <div className={styles.diptych}>
          {media.pair.map((pic, i) => (
            <div key={`${pic.src}-${i}`} className={styles.diptychCell}>
              <Thumb pic={pic} />
            </div>
          ))}
        </div>
        <div className={styles.gallery}>
          {media.row.map((pic, i) => (
            <Thumb key={`${pic.src}-${i}`} pic={pic} />
          ))}
        </div>
      </div>
    );
  }
  if (media.type === "gallery") {
    return (
      <div className={styles.gallery}>
        {media.items.map((pic, i) => (
          <Thumb key={`${pic.src}-${i}`} pic={pic} />
        ))}
      </div>
    );
  }
  if (media.type === "videoStack") {
    // Full-width landscape video over a row of portrait images (slides 11 and 12).
    return (
      <div
        className={styles.videoStack}
        style={
          {
            "--video-scale": media.videoScale ?? 1,
            "--img-scale": media.imgScale ?? 1,
          } as CSSProperties
        }
      >
        <div className={styles.videoStackTop}>
          <VideoFacade media={media.video} active={active} onEnded={onEnded} />
        </div>
        <div className={styles.videoStackImgs}>
          {media.images.map((pic, i) => (
            <Thumb key={`${pic.src}-${i}`} pic={pic} />
          ))}
        </div>
      </div>
    );
  }
  if (media.type === "bento") {
    // The live bento launcher menu, scaled to fit the media area (screen 15).
    return (
      <div className={styles.bentoWrap}>
        <div className={styles.bentoScale}>
          <BentoBoard hidePromoTiles />
        </div>
      </div>
    );
  }
  return <VideoFacade media={media} active={active} onEnded={onEnded} />;
}

/* The blue-fade panel with the screen's copy. glowLayer + circles are the panel's
   own decoration, reproduced exactly as the history page composes them. */
function CopyPanel({
  title,
  blocks,
  assetGrid,
}: {
  title?: string;
  blocks: Block[];
  assetGrid?: { heading: string; items: string[]; href?: string }[];
}) {
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
                ? b.mont
                  ? styles.copyDisplayMont
                  : styles.copyDisplay
                : styles.copyBody;
          return (
            <p key={i} className={cls}>
              {b.text}
            </p>
          );
        })}
        {assetGrid ? (
          <div className={styles.assetGrid}>
            {assetGrid.map((g, i) => {
              const inner = (
                <>
                  <p className={styles.assetHeading}>{g.heading}</p>
                  {/* Round 9: items as one comma sentence, not a bulleted list. */}
                  <p className={styles.assetItem}>{g.items.join(", ")}</p>
                </>
              );
              // Round 9: the whole box (and its title) links to its pCloud folder,
              // opening in a new tab so the journalist keeps their place in the pack.
              return g.href ? (
                <a
                  key={i}
                  className={styles.assetBox}
                  href={g.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {inner}
                </a>
              ) : (
                <div key={i} className={styles.assetBox}>
                  {inner}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ScreenView({
  screen,
  active,
  onEnded,
}: {
  screen: Screen;
  active: boolean;
  onEnded?: () => void;
}): ReactNode {
  const hasCopy = screen.blocks.length > 0 || !!screen.assetGrid;
  const copy = hasCopy ? (
    <CopyPanel title={screen.title} blocks={screen.blocks} assetGrid={screen.assetGrid} />
  ) : null;
  const titleEl = screen.topTitle ? (
    <p className={styles.screenTitle}>{screen.topTitle}</p>
  ) : null;
  const shrink = screen.mediaShrink ? ` ${styles.mediaShrink}` : "";

  if (!screen.media) {
    return (
      <>
        {titleEl}
        <div className={styles.copyOnly}>{copy}</div>
      </>
    );
  }
  if (screen.layout === "overlay") {
    const variant =
      screen.media.type === "neat"
        ? ` ${styles.overlayMediaTwoCol}`
        : screen.mediaVariant === "wideTop"
          ? ` ${styles.overlayMediaWideTop}`
          : "";
    return (
      <>
        {titleEl}
        <div className={styles.overlayScreen}>
          <div className={`${styles.overlayMedia}${variant}${shrink}`}>
            <MediaView media={screen.media} active={active} onEnded={onEnded} />
          </div>
          {hasCopy ? (
            <div
              className={styles.overlayCopy}
            >
              {copy}
            </div>
          ) : null}
        </div>
      </>
    );
  }
  return (
    <>
      {titleEl}
      <div className={styles.screen}>
        <div
          className={`${styles.screenMedia}${
            screen.media.type === "bento" ? ` ${styles.screenMediaBento}` : ""
          }${screen.mediaWide ? ` ${styles.screenMediaWide}` : ""}${shrink}`}
        >
          <MediaView media={screen.media} active={active} onEnded={onEnded} />
        </div>
        {hasCopy ? <div className={styles.copyWrap}>{copy}</div> : null}
      </div>
    </>
  );
}

export default function PressCarousel() {
  const railRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  // Brief "walking" pulse on each slide change so the Scotty dog trots as the bar
  // advances, then settles to standing.
  const [walking, setWalking] = useState(false);
  const count = SCREENS.length;

  useEffect(() => {
    setWalking(true);
    const id = setTimeout(() => setWalking(false), 450);
    return () => clearTimeout(id);
  }, [index]);

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
      {/* Header title (round 3), shown on every screen. */}
      <p className={styles.headerTitle}>Press Pack</p>

      {/* Round 10: the site's light/dark text switch (ArticleTextToggle), reused as-is.
          It sets data-pc-textinvert on the press <main>; the .pack rule flips the copy
          from white to navy. Placed top-left, clear of the header/title/counter/arrows. */}
      <div className={styles.textToggle}>
        <ArticleTextToggle />
      </div>

      <div className={styles.rail} ref={railRef}>
        {SCREENS.map((screen, i) => (
          <article
            key={i}
            className={styles.slide}
            aria-roledescription="slide"
            aria-label={`Slide ${i + 1} of ${count}`}
            aria-hidden={i !== index}
          >
            <ScreenView
              screen={screen}
              active={i === index}
              onEnded={() => goTo(i + 1)}
            />
          </article>
        ))}
      </div>

      {/* Text light/dark control is the site's PcContrastToolbar, already rendered
          in the Nav header, so nothing is added here (round 3). */}

      <button
        type="button"
        className={`${styles.arrow} ${styles.prev}`}
        onClick={() => goTo(index - 1)}
        disabled={atStart}
        aria-label="Previous slide"
      >
        <WorkChevron />
      </button>
      <button
        type="button"
        className={`${styles.arrow} ${styles.next}`}
        onClick={() => goTo(index + 1)}
        disabled={atEnd}
        aria-label="Next slide"
      >
        <WorkChevron />
      </button>

      {/* Round 11: the progress counter (X / N) below the title is removed. The
          Scotty-dog progress bar below still indicates position. */}

      {/* Progress bar: the Argos ReadingProgress element (the Scotty-dog bar),
          reused as-is but driven by the carousel position instead of scroll. */}
      <ReadingProgress progress={progress} active={walking} />
    </section>
  );
}
