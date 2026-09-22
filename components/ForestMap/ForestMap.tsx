"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ForestMap.module.css";
import { GB, type LL } from "../SeaLevelMap/SeaLevelMap";

/* The King's Forests: a simplified map of England's royal forests growing after
   1066, peaking under Henry II, then shrinking. Medieval era page, added 22 Sept
   2026 at the owner's request (option A). Copy flagged for owner review.

   SIMPLIFIED ON PURPOSE. Forest positions are real, but each is drawn as an
   ellipse, and every forest grows and shrinks on one shared curve (EXTENT) rather
   than its own documented history. Anchors for the curve and captions:
   - forest law introduced by the Normans after 1066 (Wikipedia, Royal forest)
   - about 25 royal forests by 1086 (History Hit, Charter of the Forest)
   - greatest extent under Henry II, 1154 to 1189, about 30% of the country
     (encyclopedia.com, forest laws; Oxford "Ancient Oaks", Royal Forests)
   - all of Huntingdonshire declared forest by Henry II; all of Essex forest at
     one stage in the 12th century (Wikipedia, Royal forest)
   - Assize of the Forest 1184, dogs' toes clipped (encyclopedia.com)
   - Charter of the Forest 1217; large areas disafforested in the 14th century
     (encyclopedia.com, forest laws)
   Same projection as the other maps: x = (lon + 11) * 20, y = (61 - lat) * 33. */

const VIEW = { x: 88, y: 168, w: 178, h: 204 };
const START = 1066;
const END = 1400;

const px = ([lo, la]: LL) => `${((lo + 11) * 20).toFixed(1)},${((61 - la) * 33).toFixed(1)}`;

/* [name, lat, lon, relative size in km]. Drawn at SIZE_SCALE times this, so that at
   the peak the forests plus the two whole counties cover roughly a quarter to a
   third of England, in line with the sources, rather than a token few dots. */
const SIZE_SCALE = 2;
const FORESTS: [string, number, number, number][] = [
  ["New Forest", 50.87, -1.6, 20],
  ["Clarendon", 51.07, -1.73, 8],
  ["Chute", 51.25, -1.55, 8],
  ["Savernake", 51.38, -1.65, 9],
  ["Selwood", 51.15, -2.35, 10],
  ["Gillingham", 51.03, -2.28, 5],
  ["Exmoor", 51.15, -3.65, 13],
  ["Dartmoor", 50.57, -3.95, 18],
  ["Windsor", 51.43, -0.65, 14],
  ["Dean", 51.8, -2.53, 12],
  ["Wychwood", 51.85, -1.52, 10],
  ["Shotover", 51.75, -1.18, 5],
  ["Bernwood", 51.82, -1.05, 7],
  ["Salcey and Whittlewood", 52.12, -0.95, 10],
  ["Rockingham", 52.52, -0.65, 16],
  ["Feckenham", 52.25, -1.98, 8],
  ["Kinver", 52.44, -2.25, 7],
  ["Cannock", 52.72, -2.0, 10],
  ["Sherwood", 53.15, -1.08, 16],
  ["High Peak", 53.33, -1.85, 14],
  ["Galtres", 54.05, -1.12, 9],
  ["Pickering", 54.3, -0.75, 14],
  ["Inglewood", 54.75, -2.85, 16],
  ["Waltham", 51.68, 0.05, 10],
];

/* Whole counties afforested in the 12th century (approximate outlines). */
const ESSEX: LL[] = [[0, 51.5], [0.45, 51.47], [0.95, 51.55], [0.95, 51.75], [1.3, 51.85], [1.28, 51.95], [0.9, 51.97], [0.55, 52.07], [0.35, 52.05], [0.1, 51.95], [0, 51.75]];
const HUNTS: LL[] = [[-0.5, 52.2], [-0.2, 52.2], [0.05, 52.3], [-0.05, 52.5], [-0.4, 52.57], [-0.5, 52.45]];

/* Share of peak size, by year: none before the Normans, growing to a peak under
   Henry II, easing after the 1217 Charter, falling in the 14th century. */
const EXTENT: [number, number][] = [[1066, 0], [1070, 0.25], [1086, 0.55], [1135, 0.7], [1154, 0.85], [1189, 1], [1217, 0.95], [1250, 0.8], [1300, 0.65], [1350, 0.45], [1400, 0.4]];

const interp = (pts: [number, number][], x: number) => {
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, b] = [pts[i], pts[i + 1]];
    if (x >= a[0] && x <= b[0]) return a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0]);
  }
  return pts[pts.length - 1][1];
};

/* Whole-county forests shown from Henry II's accession until the Charter. */
const countyOpacity = (y: number) => (y < 1140 ? 0 : y < 1154 ? (y - 1140) / 14 : y < 1217 ? 1 : y < 1240 ? 1 - (y - 1217) / 23 : 0);

const REIGNS: [number, string][] = [
  [1066, "William I"], [1087, "William II"], [1100, "Henry I"], [1135, "Stephen"], [1154, "Henry II"],
  [1189, "Richard I"], [1199, "John"], [1216, "Henry III"], [1272, "Edward I"], [1307, "Edward II"],
  [1327, "Edward III"], [1377, "Richard II"],
];
const kingAt = (y: number) => [...REIGNS].reverse().find((r) => y >= r[0])?.[1] ?? "William I";

const EVENTS: [number, string][] = [
  [1300, "In the 1300s, large areas are taken out of forest law. The forests shrink, but some, like the New Forest, still exist today."],
  [1217, "The Charter of the Forest gives ordinary people some rights back, like collecting firewood and letting their pigs graze."],
  [1184, "The Assize of the Forest: dogs living in a royal forest must have their toes clipped, so they cannot chase the king's deer."],
  [1154, "Henry II makes all of Huntingdonshire a royal forest. For a while, all of Essex is forest too. The forests are at their biggest, around a third of southern England."],
  [1086, "By the time of the Domesday Book there are about 25 royal forests, including the brand new New Forest."],
  [1066, "William the Conqueror brings forest law from Normandy. The deer and wild boar now belong to the king alone."],
];

export default function ForestMap() {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const span = END - START;

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setT((v) => {
        const n = Math.min(span, v + 2);
        if (n >= span) setPlaying(false);
        return n;
      });
    }, 60);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, span]);

  const year = START + t;
  const e = interp(EXTENT, year);
  const s = Math.sqrt(e);
  const county = countyOpacity(year);
  const caption = EVENTS.find((ev) => year >= ev[0])?.[1] ?? "";

  const togglePlay = () => {
    if (!playing && t >= span) setT(0);
    setPlaying((p) => !p);
  };

  return (
    <section className={styles.panel} aria-labelledby="forest-map-title">
      <h2 id="forest-map-title" className={`display ${styles.title}`}>
        The King&apos;s <span className="display-yellow">Forests</span>
      </h2>
      <p className={styles.intro}>
        After 1066, Norman kings turned huge areas of England into royal forests, where only the king could hunt. Press play to watch them grow, then shrink.
      </p>

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
          aria-valuetext={`${year}`}
        />
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Year</span>
          <span className={styles.statValue}>{year}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>King</span>
          <span className={styles.statValue}>{kingAt(year)}</span>
        </div>
      </div>

      <p className={styles.caption} aria-live="polite">{caption}</p>

      <div className={styles.mapWrap}>
        <svg viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} className={styles.map} role="img" aria-label={`Simplified map of England's royal forests in ${year}`}>
          <polygon points={GB.map(px).join(" ")} className={styles.land} />
          <g className={styles.forest}>
            <polygon points={ESSEX.map(px).join(" ")} opacity={county} />
            <polygon points={HUNTS.map(px).join(" ")} opacity={county} />
            {s > 0 &&
              FORESTS.map(([name, lat, lon, km]) => (
                <ellipse
                  key={name}
                  cx={(lon + 11) * 20}
                  cy={(61 - lat) * 33}
                  rx={((km * SIZE_SCALE * s) / 68) * 20}
                  ry={((km * SIZE_SCALE * s) / 111) * 33}
                >
                  <title>{name}</title>
                </ellipse>
              ))}
          </g>
        </svg>
      </div>

      <ul className={styles.legend}>
        <li><span className={`${styles.swatch} ${styles.swatchLand}`} aria-hidden="true" /> Land</li>
        <li><span className={`${styles.swatch} ${styles.swatchForest}`} aria-hidden="true" /> Royal forest</li>
      </ul>
      <p className={styles.note}>Simplified map. Forest positions are real, but their shapes and growth are approximate.</p>
    </section>
  );
}
