"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { contours } from "d3-contour";
import { TERRAIN_B64, TERRAIN_COLS, TERRAIN_OFFSET, TERRAIN_ROWS } from "../../data/britainTerrain";
import styles from "./SeaLevelMap.module.css";

/* Britain becomes an island: an interactive sea level map for the Ancient era
   page (/britains-dog-history/ancient). Added 22 September 2026 at the owner's
   request. Simplified: coarse terrain grid, a single global sea level curve, and
   no allowance for land rising or sinking after the ice. Copy flagged for owner review. */

const W = 400;
const H = 429;
/* Visible window crops 10% off the top and 10% off the bottom of the drawing,
   making the panel 20% shorter (owner request, 22 Sept 2026). */
const CROP_Y = H * 0.1;
const CROP_H = H * 0.8;
/* Real terrain (22 Sept 2026, owner chose option C): ETOPO1 heights, see
   data/britainTerrain.ts. Land is drawn as filled contours of height above the
   current sea, in seven 10 m bands, recomputed as the sea moves. Grid sample i
   sits at contour coordinate i + 0.5 (d3-contour), and the map keeps the old
   projection: x = (lon + 11) * 20, y = (61 - lat) * 33. */
const SX = 20 / 6;
const SY = 33 / 6;

let terrainCache: number[] | null = null;
const terrain = () => {
  if (!terrainCache) {
    const bin = atob(TERRAIN_B64);
    terrainCache = Array.from({ length: bin.length }, (_, i) => bin.charCodeAt(i) - TERRAIN_OFFSET);
  }
  return terrainCache;
};

const contourGen = contours().size([TERRAIN_COLS, TERRAIN_ROWS]);

const ringPath = (ring: number[][]) =>
  ring.map(([x, y], i) => `${i ? "L" : "M"}${((x - 0.5) * SX).toFixed(1)},${((y - 0.5) * SY).toFixed(1)}`).join("") + "Z";

/* Seven bands, 10 m each, from the water line up; the top band is 60 m and over.
   Shades are steps of the site green (--cta): light near the water, dark on high
   ground. */
const BAND_FILLS = [
  "color-mix(in srgb, var(--cta) 45%, white)",
  "color-mix(in srgb, var(--cta) 63%, white)",
  "color-mix(in srgb, var(--cta) 82%, white)",
  "var(--cta)",
  "color-mix(in srgb, var(--cta) 82%, black)",
  "color-mix(in srgb, var(--cta) 66%, black)",
  "color-mix(in srgb, var(--cta) 50%, black)",
];

const landBands = (sea: number) =>
  contourGen
    .thresholds(BAND_FILLS.map((_, i) => sea + i * 10))(terrain())
    .map((mp) => mp.coordinates.map((poly) => poly.map(ringPath).join("")).join(""));

/* Approximate relative sea level, [years ago, metres against today]. */
const CURVE: [number, number][] = [[20000,-120],[16000,-100],[14500,-80],[12000,-60],[11000,-50],[10000,-40],[9000,-28],[8500,-24],[8000,-18],[7500,-12],[7000,-8],[6000,-4],[5000,-2],[0,0]];

/* Approximate average July temperature in southern Britain, [years ago, degrees C].
   Rounded from fossil beetle studies: warm at the start, a sharp cold snap (the
   Younger Dryas, about 12,900 to 11,700 years ago), then fast warming. Added
   22 Sept 2026 at owner request. Flagged for owner review. */
const TEMP: [number, number][] = [[13300,14],[12900,13],[12700,10],[11800,10],[11500,16],[9000,17.5],[6000,17],[3000,16],[0,16.5]];
const T_MIN = 8;
const T_MAX = 20;

const tempAt = (y: number) => {
  for (let i = 0; i < TEMP.length - 1; i++) {
    const [a, b] = [TEMP[i], TEMP[i + 1]];
    if (y <= a[0] && y >= b[0]) return a[1] + ((b[1] - a[1]) * (a[0] - y)) / (a[0] - b[0]);
  }
  return TEMP[TEMP.length - 1][1];
};

const seaAt = (y: number) => {
  for (let i = 0; i < CURVE.length - 1; i++) {
    const [a, b] = [CURVE[i], CURVE[i + 1]];
    if (y <= a[0] && y >= b[0]) return a[1] + ((b[1] - a[1]) * (a[0] - y)) / (a[0] - b[0]);
  }
  return 0;
};

const EVENTS: [number, string][] = [
  [18000, "The last Ice Age is at its peak. Ice covers Scotland, Ireland and northern England, and you could walk from Norfolk to Denmark."],
  [14500, "The ice melts fast. Meltwater pours into the oceans and the sea starts to climb."],
  [11500, "Doggerland is a rich lowland of rivers, marshes and hills, roamed by hunters and animals."],
  [10300, "About 11,000 years ago, the earliest known dogs in Britain lived at Star Carr in Yorkshire. They could still have arrived on foot."],
  [8600, "Doggerland shrinks to a low land bridge between East Anglia and the Low Countries."],
  [7800, "Around 8,200 years ago an undersea landslide off Norway sends a tsunami across the region. Soon after, Britain becomes an island."],
  [6800, "The last of Doggerland, an island on the Dogger Bank, slips beneath the sea."],
  [3000, "The coastlines are close to today's. Britain and Ireland are islands."],
  [-1, "Today, Doggerland lies under the North Sea. Trawlers still net its bones and tools."],
];

/* Timeline runs from 13,300 years ago (owner request, 22 Sept 2026; was 20,000). */
const START = 13300;
/* No sea fill: the blue panel shows through as the sea (owner request, 22 Sept 2026). */

export default function SeaLevelMap() {
  /* Slider runs left to right through time: 0 = START years ago, START = today. */
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setT((v) => {
        const n = Math.min(START, v + 100);
        if (n >= START) setPlaying(false);
        return n;
      });
    }, 60);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing]);

  const yearsAgo = START - t;
  const sea = seaAt(yearsAgo);
  const temp = tempAt(yearsAgo);
  const tempShown = Math.round(temp);
  /* Thermometer tube interior runs y 6 to 44 in its 20 x 60 viewBox. */
  const mercury = (38 * Math.min(1, Math.max(0, (temp - T_MIN) / (T_MAX - T_MIN)))).toFixed(1);
  const seaShown = Math.round(sea);
  const caption = EVENTS.find((e) => yearsAgo >= e[0])?.[1] ?? "";
  /* Recontour only when the rounded sea level changes. */
  const seaKey = Math.round(sea * 2) / 2;
  const bands = useMemo(() => landBands(seaKey), [seaKey]);

  const togglePlay = () => {
    if (!playing && t >= START) setT(0);
    setPlaying((p) => !p);
  };

  return (
    <section className={styles.panel} aria-labelledby="sea-level-title">
      <div className={styles.mapWrap}>
        {/* Everything overlaid on the map, which fills the panel top to bottom and
            edge to edge (owner request, 22 Sept 2026): title across the top, slider
            group top left, intro and key top right. Stacks above the map on small
            screens. */}
        <div className={styles.overlay}>
          <h2 id="sea-level-title" className={`display ${styles.title}`}>
            Britain Becomes an <span className="display-yellow">Island</span>
          </h2>
          <div className={styles.overlayLeft}>
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
                max={START}
                step={50}
                value={t}
                onChange={(e) => {
                  setPlaying(false);
                  setT(Number(e.target.value));
                }}
                className={styles.slider}
                aria-label="Years ago"
                aria-valuetext={`${yearsAgo.toLocaleString("en-GB")} years ago`}
              />
            </div>

            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Years ago</span>
                <span className={styles.statValue}>{yearsAgo.toLocaleString("en-GB")}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Sea level</span>
                <span className={styles.statValue}>{seaShown === 0 ? "0" : seaShown} m</span>
              </div>
              <div className={`${styles.stat} ${styles.tempStat}`}>
                <svg viewBox="0 0 20 60" className={styles.thermo} aria-hidden="true">
                  <rect x={6} y={4} width={8} height={42} rx={4} fill="rgba(255,255,255,0.25)" stroke="#ffffff" strokeWidth={1.5} />
                  <rect x={8} y={44 - Number(mercury)} width={4} height={Number(mercury) + 4} rx={2} style={{ fill: "var(--family-emergency)" }} />
                  <circle cx={10} cy={51} r={7} stroke="#ffffff" strokeWidth={1.5} style={{ fill: "var(--family-emergency)" }} />
                </svg>
                <span className={styles.tempText}>
                  <span className={styles.statLabel}>Summer temp</span>
                  <span className={styles.statValue}>{tempShown}&deg;C</span>
                </span>
              </div>
            </div>

            <p className={styles.caption} aria-live="polite">{caption}</p>
          </div>
          <div className={styles.overlayRight}>
            <p className={styles.intro}>
              When the first dogs came to Britain, the sea was far lower and Britain was joined to Europe by a lost land called Doggerland. Press play to watch the sea rise.
            </p>
            <ul className={styles.legend}>
              <li className={styles.legendTitle}>Height above sea</li>
              <li className={styles.scale}>
                <span>0</span>
                {BAND_FILLS.map((f, i) => (
                  <span key={i} className={styles.swatch} style={{ background: f }} />
                ))}
                <span>60+ m</span>
              </li>
            </ul>
            <p className={styles.note}>Simplified map. Sea levels are approximate. Terrain: NOAA ETOPO1, via Fatiando a Terra (CC BY 4.0).</p>
          </div>
        </div>
        <svg viewBox={`0 ${CROP_Y} ${W} ${CROP_H}`} className={styles.map} role="img" aria-label="Map of Britain and Doggerland as the sea rises">
          {bands.map((d, i) => (
            <path key={i} d={d} fillRule="evenodd" style={{ fill: BAND_FILLS[i] }} />
          ))}
          {/* Dashed outline of today's coastline removed at owner request, 22 Sept 2026. */}
          <text x={250} y={190} fontSize={13} fill="#ffffff" opacity={sea < -14 ? 1 : 0} className={styles.mapLabel}>
            Doggerland
          </text>
        </svg>
      </div>
    </section>
  );
}
