"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import styles from "./WhoOwnsBritain.module.css";
import { GB } from "../SeaLevelMap/SeaLevelMap";

/* WHO OWNS BRITAIN? The Saxons 'n' Normans era page, added 22 September 2026 at
   the owner's request. Copy flagged for owner review.

   IT PICKS UP WHERE DOGGERLAND STOPS. That map ends 2,000 years ago, about AD 1,
   so this one opens with the island already full: the Britons, descended from the
   people who arrived around 2450 BC, hold everything. Every wave then takes
   territory off them, and they are pushed west rather than wiped out. That is the
   honest version and the better story.

   Sources: the Roman invasion of AD 43 and Hadrian's Wall from 122; the end of
   Roman rule in 410; the Anglo-Saxon kingdoms of the sixth century; the first
   Viking raid on Lindisfarne in 793; Alfred's victory at Edington in 878 and the
   Danelaw boundary "up the Thames, and then up the Lea ... then in a straight
   line to Bedford, then up the Ouse to Watling Street", which later writers run
   on north west to Chester; Aethelstan's single kingdom of England in 927; the
   Norman conquest of 1066 (Wikipedia: Roman Britain, Danelaw, Treaty of Alfred
   and Guthrum, Great Heathen Army; Historic UK on the Five Boroughs).

   THE SHAPES ARE COARSE ON PURPOSE. Each people is a simple polygon clipped to
   the coastline the site already draws, so no new map data was needed. Borders in
   this period moved every few years and were never lines on a map; the note under
   the map says so. */

type LL = [number, number];
const pt = ([lo, la]: LL) => [(lo + 11) * 20, (61 - la) * 33] as const;
const px = (p: LL) => pt(p).map((n) => n.toFixed(1)).join(",");
const poly = (a: LL[]) => a.map(px).join(" ");
const VIEW = { x: 88, y: 168, w: 178, h: 204 };

const START = 1;
const END = 1100;

/* Everything south of the wall, which the Romans held. */
const ROMAN: LL[] = [[-6.5, 54.9], [2.2, 54.9], [2.2, 49.7], [-6.5, 49.7]];
/* The Saxon east and south, leaving Wales, Cornwall and the north west British. */
const SAXON: LL[] = [[-2.9, 55.0], [2.2, 55.0], [2.2, 50.2], [-4.0, 50.2], [-3.4, 51.5], [-2.9, 52.6]];
/* North and east of the treaty line: Thames, Lea, Bedford, Ouse, Watling Street
   on to Chester, then everything above it to the Tees and beyond. */
const DANELAW: LL[] = [[0.1, 51.5], [-0.05, 51.8], [-0.47, 52.14], [-1.3, 52.6], [-2.9, 53.2], [-2.6, 55.0], [2.2, 55.0], [2.2, 51.5]];
/* England and Wales, which is what William took. */
const NORMAN: LL[] = [[-5.8, 55.2], [2.2, 55.2], [2.2, 49.7], [-5.8, 49.7]];

type Wave = { from: number; name: string; area: LL[]; fill: string; pattern: string };
const WAVES: Wave[] = [
  { from: 43, name: "Romans", area: ROMAN, fill: "var(--family-emergency)", pattern: "wob-hatch" },
  { from: 500, name: "Saxons", area: SAXON, fill: "var(--family-science)", pattern: "wob-dots" },
  { from: 878, name: "Danelaw", area: DANELAW, fill: "var(--family-people)", pattern: "wob-cross" },
  { from: 1066, name: "Normans", area: NORMAN, fill: "var(--navy)", pattern: "wob-vert" },
];

/* Rome leaves: the Roman wash fades out over the fifth century. */
const ROME_ENDS = 410;

const EVENTS: [number, string][] = [
  [1066, "The Normans win at Hastings and take the whole of England. New lords, new castles, new hunting laws."],
  [1013, "Danish kings rule England again for a while. The island changes hands twice more before 1066."],
  [927, "Aethelstan makes one kingdom of England out of the lot."],
  [878, "Alfred beats Guthrum at Edington. Everything north and east of a line from London towards Chester lives under Danish law: the Danelaw."],
  [865, "The Great Heathen Army lands and takes East Anglia, Northumbria and much of Mercia."],
  [793, "Vikings raid the monastery at Lindisfarne. The raiding turns into settling."],
  [600, "Saxon kingdoms fill the east and south. The Britons hold Wales, Cornwall and the north west, and their dogs stay with them."],
  [450, "Angles, Saxons and Jutes arrive from across the North Sea and start taking land."],
  [410, "Rome leaves. Britain is on its own for the first time in nearly 400 years."],
  [122, "Hadrian's Wall is built across the north. Everything below it is Roman, everything above it is not."],
  [43, "Rome invades. Within 40 years the south and the midlands are Roman."],
  [1, "The Britons hold the whole island. Their families have been here since about 2450 BC, and so have their dogs."],
];

type Scheme = "black-on-white" | "white-on-black" | null;
const SCHEME_ATTR = "data-pc-contrast-scheme";
const readScheme = (): Scheme => {
  const v = document.documentElement.getAttribute(SCHEME_ATTR);
  return v === "black-on-white" || v === "white-on-black" ? v : null;
};
const subscribeScheme = (cb: () => void) => {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: [SCHEME_ATTR] });
  return () => obs.disconnect();
};
const useScheme = (): Scheme => useSyncExternalStore(subscribeScheme, readScheme, () => null);

/* In a scheme each people is told apart by PATTERN, not colour, the same rule the
   Doggerland map follows. */
function Patterns({ fg }: { fg: string }) {
  return (
    <defs>
      <pattern id="wob-hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="4" stroke={fg} strokeWidth="1.1" />
      </pattern>
      <pattern id="wob-dots" width="4.5" height="4.5" patternUnits="userSpaceOnUse">
        <circle cx="1.6" cy="1.6" r="0.9" fill={fg} />
      </pattern>
      <pattern id="wob-cross" width="5" height="5" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="5" stroke={fg} strokeWidth="0.9" />
        <line x1="0" y1="0" x2="5" y2="0" stroke={fg} strokeWidth="0.9" />
      </pattern>
      <pattern id="wob-vert" width="3" height="3" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="3" stroke={fg} strokeWidth="1.4" />
      </pattern>
    </defs>
  );
}

export default function WhoOwnsBritain() {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const scheme = useScheme();
  const fg = scheme === "white-on-black" ? "#ffffff" : "#000000";
  const span = END - START;

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setT((v) => {
        const n = Math.min(span, v + 6);
        if (n >= span) setPlaying(false);
        return n;
      });
    }, 40);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, span]);

  const year = START + t;
  const caption = EVENTS.find((e) => year >= e[0])?.[1] ?? "";

  /* How much of a wave is on the map: it washes in over 80 years, and Rome
     washes back out over the fifth century. */
  const strength = (w: Wave) => {
    const inK = Math.min(1, Math.max(0, (year - w.from) / 80));
    if (w.name !== "Romans") return inK;
    const out = Math.min(1, Math.max(0, (year - ROME_ENDS) / 50));
    return inK * (1 - out);
  };

  const togglePlay = () => {
    if (!playing && t >= span) setT(0);
    setPlaying((p) => !p);
  };

  const wall = year >= 122 && year < 460;

  return (
    <section className={styles.panel} aria-labelledby="who-owns-title">
      <h2 id="who-owns-title" className={`display ${styles.title}`}>
        Who Owns <span className="display-yellow">Britain?</span>
      </h2>
      <p className={styles.intro}>
        For six hundred years the island belonged to whoever had just arrived. Press play and watch the Britons get pushed west.
      </p>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>Year</span>
          <span className={styles.statLabel}>{year < 1 ? "AD 1" : `AD ${year}`}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>In charge</span>
          <span className={styles.statLabel}>
            {year >= 1066 ? "Normans" : year >= 878 ? "English and Danes" : year >= 500 ? "Saxons and Britons" : year >= 410 ? "Britons" : year >= 43 ? "Rome" : "Britons"}
          </span>
        </div>
      </div>

      <p className={styles.caption} aria-live="polite">{caption}</p>

      <div className={styles.controls}>
        <button type="button" className={styles.play} onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
          {playing ? (
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" /><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
          )}
        </button>
        <input
          type="range"
          min={0}
          max={span}
          step={1}
          value={t}
          onChange={(ev) => {
            setPlaying(false);
            setT(Number(ev.target.value));
          }}
          className={styles.slider}
          aria-label="Year"
          aria-valuetext={`AD ${year}`}
        />
      </div>

      <div className={styles.mapWrap}>
        <svg viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} className={styles.map} role="img" aria-label={`Map of Britain in AD ${year}, showing who held which part`}>
          {scheme && <Patterns fg={fg} />}
          <defs>
            <clipPath id="wob-land">
              <polygon points={poly(GB)} />
            </clipPath>
          </defs>
          {/* The Britons hold everything underneath; every wave paints over them. */}
          <polygon points={poly(GB)} className={styles.britons} />
          <g clipPath="url(#wob-land)">
            {WAVES.map((w) => {
              const k = strength(w);
              if (k <= 0) return null;
              return (
                <polygon
                  key={w.name}
                  points={poly(w.area)}
                  opacity={k}
                  style={{ fill: scheme ? `url(#${w.pattern})` : w.fill }}
                />
              );
            })}
          </g>
          {wall && (
            <line x1={pt([-3.1, 55.0])[0]} y1={pt([-3.1, 55.0])[1]} x2={pt([-1.4, 55.0])[0]} y2={pt([-1.4, 55.0])[1]} className={styles.wall} />
          )}
          <polygon points={poly(GB)} className={styles.coast} />
          {year >= 793 && year < 900 && (
            <circle cx={pt([-1.8, 55.7])[0]} cy={pt([-1.8, 55.7])[1]} r={2.4} className={styles.raid}>
              <title>Lindisfarne, raided 793</title>
            </circle>
          )}
        </svg>
      </div>

      <ul className={styles.legend}>
        <li><span className={`${styles.swatch} ${styles.swBritons}`} aria-hidden="true" /> Britons</li>
        <li><span className={`${styles.swatch} ${styles.swRomans}`} aria-hidden="true" /> Romans</li>
        <li><span className={`${styles.swatch} ${styles.swSaxons}`} aria-hidden="true" /> Saxons</li>
        <li><span className={`${styles.swatch} ${styles.swDanes}`} aria-hidden="true" /> Danelaw</li>
        <li><span className={`${styles.swatch} ${styles.swNormans}`} aria-hidden="true" /> Normans</li>
      </ul>
      <p className={styles.note}>
        Simplified map. These borders moved every few years and were never drawn as lines, so the shapes show roughly who held what, not exact frontiers.
      </p>
    </section>
  );
}
