"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./EchoTrail.module.css";
import { WORLD_PATHS, lonX, latY } from "../../data/worldOutline";

/* A TRAIL OF ECHOES, NOT A FAMILY TREE.

   The interactive map for the Anubis essay, built 23 September 2026 to the
   owner's brief (Anubis_article_updates.docx, section 7). The brief is explicit
   about what the visual must and must not say:

     - start in Egypt with Anubis, end in East Anglia with Black Shuck;
     - show intermediate cultures ONLY where the article discusses them;
     - use a BROKEN route, never one continuous line, because a continuous arrow
       would draw a lineage the article spends its length denying;
     - caption it "A trail of echoes, not a family tree";
     - never imply Black Shuck descended from Anubis, or that the motif spread
       from Egypt outwards.

   The dashes do the arguing. XOLOTL IS NOT HERE AT ALL (owner, 23 Sept 2026): the
   Aztecs had no contact with any of the others, so he never belonged on the trail,
   and keeping Mexico in view shrank the part of the map the essay uses. He has his
   own panel now, components/XolotlPanel, with its own map and his dog's story.

   THE ORDER IS CHRONOLOGICAL (owner, 23 September 2026), because the slider has to
   read as a timeline: Anubis about 3100 BC, Yama's dogs about 1500 BC, Cerberus by
   about 700 BC, Garmr about AD 1000, Cwn Annwn about 1100, Black Shuck 1577. The
   dates are when each figure is first WRITTEN DOWN, the only thing anyone can
   date; the belief behind each is older, and the cards say so in their own words.

   Card copy is 35 to 55 words each, per section 6 of the brief: culture, figure,
   role, one striking detail, and an evidence note. */

type Spot = {
  id: string;
  place: string;
  figure: string;
  at: [number, number]; // lon, lat
  when: string;
  body: string;
  evidence: string;
  labelLeft?: boolean;
  /* Label nudges in MAP UNITS (about half a pixel each at the usual size), for
     the two labels that collided with the panel edge or their own dot. */
  dx?: number;
  dy?: number;
  /* Round thumbnail beside the write-up, in /public, named as the owner supplied
     them on 23 September 2026. The card omits the portrait if the file is missing,
     so nothing breaks if one is renamed. */
  img?: string;
};

const SPOTS: Spot[] = [
  {
    id: "egypt",
    place: "Egypt",
    figure: "Anubis",
    at: [31, 27],
    dy: -2.5,
    when: "from about 3100 BC",
    body: "Embalmer, guardian of the cemetery and guide of the dead, and the impartial referee at the weighing of the heart. The likeliest reason a dog got the job at all is that jackals and pariah dogs were already digging in the desert graves.",
    evidence: "British Museum, Book of the Dead judgement scenes and Anubis collection records.",
    img: "/Anubis-profile.png",
  },
  {
    id: "india",
    place: "India",
    figure: "Yama's two dogs",
    at: [78, 24],
    when: "about 1500 BC",
    body: "Shabala and Shyama, the four-eyed brindled watchdogs of Yama, lord of the dead. The mourner is told to hurry past them. They guard the road rather than a door, which is a rarer idea than it sounds.",
    evidence: "Rigveda 10.14, the funeral hymn.",
    labelLeft: true,
    img: "/Yamas-profile.png",
  },
  {
    id: "greece",
    place: "Greece",
    figure: "Cerberus",
    at: [23, 38],
    when: "by about 700 BC",
    body: "The monstrous hound on the gates of Hades, whose job was less keeping the living out than keeping the dead in. Hecate, goddess of crossroads and boundaries, also kept hounds, and was heard before she was seen.",
    evidence: "Hesiod, Theogony; Homer, Iliad, on the hound of Hades.",
    img: "/Cerberus-profile.png",
  },
  {
    id: "norse",
    place: "Norse world",
    figure: "Garmr",
    at: [10, 60],
    when: "written down about AD 1000",
    body: "The blood-caked dog howling at the mouth of Hel, whose barking announces the end of the world. Norse settlement is also the route by which a hellhound idea reached the part of England that later produced Black Shuck.",
    evidence: "Voluspa, about AD 1000, preserved in the Poetic Edda; also Grimnismal.",
    img: "/Garmr-profile.png",
  },
  {
    id: "wales",
    place: "Wales",
    figure: "Cwn Annwn",
    at: [-4.2, 52.4],
    /* Ran off the left edge as a left-hand label (owner, 23 Sept 2026). */
    dx: 10,
    dy: 2.5,
    when: "written down about 1100",
    body: "Spectral white hounds with red ears, hunting the sky for souls. Hearing them meant a death was coming. They grow quieter as they get closer, which is the detail that makes them frightening rather than merely loud.",
    evidence: "The Mabinogion, first branch: Pwyll's meeting with Arawn.",
    img: "/Cwn-Annwn-profile.png",
  },
  {
    id: "england",
    place: "East Anglia",
    figure: "Black Shuck",
    at: [1.3, 52.6],
    when: "from about 1577",
    body: "A vast black dog of the lanes, marshes and churchyards, the size of a calf, with eyes like coals. In 1577 he was said to have burst into churches at Bungay and Blythburgh during a storm. The scorch marks are still shown to visitors.",
    evidence: "Abraham Fleming's pamphlet, 1577; the name probably from Old English scucca, demon.",
    img: "/Black-Shuck-profile.png",
  },
];


/* Cropped to the part of the sheet the trail actually crosses, Ireland to India.
   With Mexico gone the map can be almost twice the scale (owner, 23 Sept 2026). */
const VIEW = { x: 500, y: 70, w: 320, h: 150 };
const px = (s: Spot) => [lonX(s.at[0]), latY(s.at[1])] as const;

/* "written down about AD 1000" ran off the end of the control on a phone, so the
   date breaks after "about" (owner, 23 September 2026). */
function WhenLabel({ when }: { when: string }) {
  const at = when.indexOf("about ");
  if (at === -1) return <>{when}</>;
  const head = when.slice(0, at + "about".length);
  const tail = when.slice(at + "about".length).trim();
  return (
    <>
      {head}
      <br />
      {tail}
    </>
  );
}

const PLAY_MS = 1600;

export default function EchoTrail() {
  /* A step slider, like the era-page maps: 0 is Anubis alone, and each step draws
     one more hop of the trail (owner, 23 Sept 2026). */
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const open = SPOTS[step];
  const shown = SPOTS.slice(0, step + 1);

  /* Play walks the trail on its own, as the era-page maps do. */
  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setStep((v) => {
        const n = v + 1;
        if (n >= SPOTS.length - 1) setPlaying(false);
        return Math.min(SPOTS.length - 1, n);
      });
    }, PLAY_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing]);

  const togglePlay = () => {
    if (!playing && step >= SPOTS.length - 1) setStep(0);
    setPlaying((p) => !p);
  };

  return (
    <section className={styles.panel} aria-labelledby="echo-trail-title">
      {/* Shorter and centred, to match the era-page panel headings (owner,
          23 Sept 2026). "Not a family tree" now lives in the line underneath,
          where it reads as the argument rather than as a subtitle. */}
      <h2 id="echo-trail-title" className={`display ${styles.title}`}>
        A Trail of <span className="display-yellow">Echoes</span>
      </h2>
      <p className={styles.intro}>
        Seven cultures, one idea: a dog at the edge of the dark. Tap a marker to meet each of them. The line
        between them is broken on purpose, because these stories are not descended from one another.
      </p>

      <div className={styles.tabs} role="tablist" aria-label="Cultures">
        {SPOTS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={s.id === open.id}
            className={`${styles.tab}${s.id === open.id ? " " + styles.tabOn : ""}`}
            onClick={() => setStep(i)}
          >
            {s.figure}
          </button>
        ))}
      </div>

      {/* The portrait and the name sit on one row; the write-up runs the full
          width underneath rather than indenting past the portrait (owner,
          23 Sept 2026). */}
      <div className={styles.mapWrap}>
        <svg
          viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
          className={styles.map}
          role="img"
          aria-label="Map from Egypt to East Anglia showing seven cultures that placed a dog at the door of the dead"
        >
          {WORLD_PATHS.map((d, i) => (
            <path key={i} d={d} className={styles.land} />
          ))}

          {/* The broken route. Drawn as separate dashed hops, not one path, so it
              can never read as a migration arrow, and only as far as the slider
              has reached. */}
          {shown.slice(0, -1).map((s, i) => {
            const a = px(s);
            const b = px(shown[i + 1]);
            return <line key={s.id} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className={styles.hop} />;
          })}

          {SPOTS.map((s, i) => {
            const [cx, cy] = px(s);
            const on = s.id === open.id;
            return (
              <g key={s.id} className={styles.spot} onClick={() => setStep(i)}>
                <circle cx={cx} cy={cy} r={on ? 7 : 5} className={on ? styles.dotOn : styles.dot} />
                {/* A name appears as the timeline reaches its dot and STAYS, so
                    the last step shows the whole trail named (owner, 23 Sept
                    2026). */}
                {i <= step && (
                  <text
                    x={(s.labelLeft ? cx - 9 : cx + 9) + (s.dx ?? 0)}
                    y={cy + 3 + (s.dy ?? 0)}
                    textAnchor={s.labelLeft ? "end" : "start"}
                    className={styles.label}
                  >
                    {s.figure}
                  </text>
                )}
                <circle cx={cx} cy={cy} r={14} className={styles.hit}>
                  <title>{`${s.figure}, ${s.place}`}</title>
                </circle>
              </g>
            );
          })}
        </svg>
      </div>

      {/* The era-page map control: a round play button beside the slider, both
          inside one bar (owner, 23 Sept 2026). */}
      <div className={styles.controls}>
        <button type="button" className={styles.play} onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
          {playing ? (
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
              <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M8 5v14l11-7z" fill="currentColor" />
            </svg>
          )}
        </button>
        <input
          type="range"
          min={0}
          max={SPOTS.length - 1}
          step={1}
          value={step}
          onChange={(e) => {
            setPlaying(false);
            setStep(Number(e.target.value));
          }}
          className={styles.slider}
          aria-label="Move along the trail"
          aria-valuetext={`${open.figure}, ${open.when}`}
        />
        <span className={styles.stepWhen}><WhenLabel when={open.when} /></span>
      </div>

      <div className={styles.card} aria-live="polite">
        <div className={styles.cardTop}>
          {open.img && (
            <Image src={open.img} alt="" width={96} height={96} className={styles.portrait} unoptimized />
          )}
          <div className={styles.cardNames}>
            <p className={styles.cardHead}>
              <span className={styles.cardPlace}>{open.place}</span>
              <span className={styles.cardWhen}>{open.when}</span>
            </p>
            <p className={styles.cardFigure}>{open.figure}</p>
          </div>
        </div>
        <p className={styles.cardBody}>{open.body}</p>
        <p className={styles.cardEvidence}>{open.evidence}</p>
      </div>

      <p className={styles.note}>
        Simplified map. The broken line shows where the article travels, not a route anyone took: similarity is
        not ancestry, and none of these figures descends from Anubis.
      </p>

    </section>
  );
}
