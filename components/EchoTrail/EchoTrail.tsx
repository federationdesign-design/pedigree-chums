"use client";

import { useState } from "react";
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

   The dashes do the arguing. XOLOTL IS NOT ON THIS MAP AT ALL (owner, 23 Sept
   2026): the Aztecs had no contact with any of the others, so he never belonged on
   the trail, and keeping Mexico in view shrank the part of the map the essay
   actually uses. He now has his own panel underneath, which makes his point more
   forcefully than a lone marker did.

   THE ORDER IS THE OWNER'S, not chronology: Anubis, Yama's dogs, Garmr, Cerberus,
   Cwn Annwn, Black Shuck. Each card shows its own date, so a reader can see that
   Garmr is written down long after Cerberus.

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
  /* Round thumbnail beside the write-up. Drop a square image at this path to
     switch it on; the card simply omits the portrait until the file exists. */
  img?: string;
};

const SPOTS: Spot[] = [
  {
    id: "egypt",
    place: "Egypt",
    figure: "Anubis",
    at: [31, 27],
    when: "from about 3100 BC",
    body: "Embalmer, guardian of the cemetery and guide of the dead, and the impartial referee at the weighing of the heart. The likeliest reason a dog got the job at all is that jackals and pariah dogs were already digging in the desert graves.",
    evidence: "British Museum, Book of the Dead judgement scenes and Anubis collection records.",
    img: "/good-dog-bad-dog/anubis/anubis.png",
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
    img: "/good-dog-bad-dog/anubis/yama.png",
  },
  {
    id: "norse",
    place: "Norse world",
    figure: "Garmr",
    at: [10, 60],
    when: "recorded about AD 1200",
    body: "The blood-caked dog howling at the mouth of Hel, whose barking announces the end of the world. Norse settlement is also the route by which a hellhound idea reached the part of England that later produced Black Shuck.",
    evidence: "Poetic Edda, Voluspa and Grimnismal.",
    img: "/good-dog-bad-dog/anubis/garmr.png",
  },
  {
    id: "greece",
    place: "Greece",
    figure: "Cerberus",
    at: [23, 38],
    when: "by about 700 BC",
    body: "The monstrous hound on the gates of Hades, whose job was less keeping the living out than keeping the dead in. Hecate, goddess of crossroads and boundaries, also kept hounds, and was heard before she was seen.",
    evidence: "Hesiod, Theogony; Homer, Iliad, on the hound of Hades.",
    img: "/good-dog-bad-dog/anubis/cerberus.png",
  },
  {
    id: "wales",
    place: "Wales",
    figure: "Cwn Annwn",
    at: [-4.2, 52.4],
    when: "medieval",
    body: "Spectral white hounds with red ears, hunting the sky for souls. Hearing them meant a death was coming. They grow quieter as they get closer, which is the detail that makes them frightening rather than merely loud.",
    evidence: "The Mabinogion, first branch: Pwyll's meeting with Arawn.",
    labelLeft: true,
    img: "/good-dog-bad-dog/anubis/cwn-annwn.png",
  },
  {
    id: "england",
    place: "East Anglia",
    figure: "Black Shuck",
    at: [1.3, 52.6],
    when: "from about 1577",
    body: "A vast black dog of the lanes, marshes and churchyards, the size of a calf, with eyes like coals. In 1577 he was said to have burst into churches at Bungay and Blythburgh during a storm. The scorch marks are still shown to visitors.",
    evidence: "Abraham Fleming's pamphlet, 1577; the name probably from Old English scucca, demon.",
    img: "/good-dog-bad-dog/anubis/black-shuck.png",
  },
];

/* His own panel, off the map entirely. */
const XOLOTL = {
  place: "Mexico",
  figure: "Xolotl",
  when: "by about AD 1300",
  body: "The dog-headed god who guides the dead across the underworld river. The Aztecs had no contact with Egypt, Greece, India or Britain, and arrived at the same idea anyway. Dogs were buried with their owners to make the crossing with them.",
  evidence: "Codex Borgia and Codex Magliabechiano.",
  img: "/good-dog-bad-dog/anubis/xolotl.png",
};

/* Cropped to the part of the sheet the trail actually crosses, Ireland to India.
   With Mexico gone the map can be almost twice the scale (owner, 23 Sept 2026). */
const VIEW = { x: 500, y: 70, w: 320, h: 150 };
const px = (s: Spot) => [lonX(s.at[0]), latY(s.at[1])] as const;

export default function EchoTrail() {
  /* A step slider, like the era-page maps: 0 is Anubis alone, and each step draws
     one more hop of the trail (owner, 23 Sept 2026). */
  const [step, setStep] = useState(0);
  const open = SPOTS[step];
  const shown = SPOTS.slice(0, step + 1);

  return (
    <section className={styles.panel} aria-labelledby="echo-trail-title">
      <h2 id="echo-trail-title" className={styles.title}>
        A trail of echoes, <span className={styles.titleAccent}>not a family tree</span>
      </h2>
      <p className={styles.intro}>
        Seven cultures, one idea: a dog at the edge of the dark. Tap a marker to meet each of them. The line
        between them is broken on purpose, because these stories are not descended from one another.
      </p>

      <div className={styles.controls}>
        <input
          type="range"
          min={0}
          max={SPOTS.length - 1}
          step={1}
          value={step}
          onChange={(e) => setStep(Number(e.target.value))}
          className={styles.slider}
          aria-label="Move along the trail"
          aria-valuetext={`${open.figure}, ${open.when}`}
        />
        <span className={styles.stepCount}>
          {step + 1} / {SPOTS.length}
        </span>
      </div>

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
            const reached = i <= step;
            return (
              <g
                key={s.id}
                className={`${styles.spot}${reached ? "" : " " + styles.spotAhead}`}
                onClick={() => setStep(i)}
              >
                <circle cx={cx} cy={cy} r={on ? 7 : 5} className={on ? styles.dotOn : styles.dot} />
                <text
                  x={s.labelLeft ? cx - 9 : cx + 9}
                  y={cy + 3}
                  textAnchor={s.labelLeft ? "end" : "start"}
                  className={styles.label}
                >
                  {s.figure}
                </text>
                <circle cx={cx} cy={cy} r={14} className={styles.hit}>
                  <title>{`${s.figure}, ${s.place}`}</title>
                </circle>
              </g>
            );
          })}
        </svg>
      </div>

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

      <div className={styles.card} aria-live="polite">
        {open.img && (
          <Image src={open.img} alt="" width={96} height={96} className={styles.portrait} unoptimized />
        )}
        <div className={styles.cardText}>
          <p className={styles.cardHead}>
            <span className={styles.cardPlace}>{open.place}</span>
            <span className={styles.cardWhen}>{open.when}</span>
          </p>
          <p className={styles.cardFigure}>{open.figure}</p>
          <p className={styles.cardBody}>{open.body}</p>
          <p className={styles.cardEvidence}>{open.evidence}</p>
        </div>
      </div>

      <p className={styles.note}>
        Simplified map. The broken line shows where the article travels, not a route anyone took: similarity is
        not ancestry, and none of these figures descends from Anubis.
      </p>

      {/* Off the map entirely, and the stronger for it. */}
      <div className={styles.outlier}>
        {XOLOTL.img && (
          <Image src={XOLOTL.img} alt="" width={96} height={96} className={styles.portrait} unoptimized />
        )}
        <div className={styles.cardText}>
          <p className={styles.cardHead}>
            <span className={styles.cardPlace}>{XOLOTL.place}</span>
            <span className={styles.cardWhen}>{XOLOTL.when}</span>
          </p>
          <p className={styles.cardFigure}>{XOLOTL.figure}</p>
          <p className={styles.cardBody}>{XOLOTL.body}</p>
          <p className={styles.cardEvidence}>{XOLOTL.evidence}</p>
          <p className={styles.cardOffTrail}>
            Not on the trail, and that is the point: no contact with any of the others, and the same idea anyway.
          </p>
        </div>
      </div>
    </section>
  );
}
