"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./SeaLevelMap.module.css";

/* Britain becomes an island: an interactive sea level map for the Ancient era
   page (/britains-dog-history/ancient). Added 22 September 2026 at the owner's
   request. Schematic only: coastlines, shelf depths and the sea level curve are
   simplified and ignore isostatic rebound. Copy flagged for owner review. */

type LL = [number, number];

const W = 400;
const H = 429;
const proj = ([lo, la]: LL) => `${((lo + 11) * 20).toFixed(1)},${((61 - la) * 33).toFixed(1)}`;
const pts = (a: LL[]) => a.map(proj).join(" ");

const GB: LL[] = [[1.35,51.13],[1.44,51.38],[0.9,51.5],[1.15,51.78],[1.57,52.08],[1.75,52.47],[1.3,52.93],[0.5,52.95],[0.2,52.8],[0.35,53.15],[0.12,53.58],[-0.08,54.12],[-0.6,54.49],[-1.2,54.7],[-1.42,55],[-2,55.77],[-2.13,55.9],[-2.5,56],[-3.2,56.05],[-2.58,56.28],[-2.9,56.46],[-2.45,56.7],[-2.07,57.15],[-1.82,57.6],[-2,57.69],[-3.3,57.72],[-4.2,57.5],[-3.77,57.86],[-3.65,58.12],[-3.08,58.44],[-3.02,58.64],[-3.37,58.67],[-5,58.62],[-5.25,58.15],[-5.3,57.9],[-5.8,57.7],[-5.7,57.28],[-5.83,57],[-6.22,56.73],[-5.47,56.42],[-5.8,55.3],[-5.6,55.42],[-4.8,55.9],[-4.63,55.46],[-4.86,54.63],[-4.05,54.83],[-3.3,54.95],[-3.64,54.5],[-3.2,54.1],[-2.9,54.05],[-3.05,53.82],[-3,53.4],[-3.86,53.33],[-4.6,53.4],[-4.68,53.3],[-4.77,52.79],[-4.08,52.41],[-4.7,52.1],[-5.3,51.88],[-5.1,51.7],[-4.7,51.67],[-4.2,51.55],[-3.17,51.45],[-2.6,51.6],[-2.7,51.45],[-3.47,51.2],[-4.53,51.02],[-4.95,50.55],[-5.71,50.07],[-5.2,49.96],[-4.14,50.35],[-3.64,50.22],[-3.4,50.62],[-2.9,50.72],[-2.45,50.52],[-1.95,50.68],[-1.3,50.78],[-0.78,50.73],[-0.14,50.82],[0.25,50.73],[0.97,50.91]];
const IE: LL[] = [[-7.37,55.38],[-6.15,55.22],[-5.9,54.65],[-5.5,54.4],[-6.3,54],[-6.1,53.35],[-6,52.98],[-6.35,52.17],[-7,52.13],[-8.3,51.8],[-9.8,51.45],[-10.45,52.1],[-9.93,52.56],[-9.1,53.2],[-10.2,53.4],[-10.1,54.2],[-8.5,54.3],[-8.8,54.6],[-8.3,55.15]];
const EU: LL[] = [[-4.75,48.05],[-4.8,48.4],[-4,48.72],[-2,48.65],[-1.5,48.63],[-1.9,49.7],[-1.26,49.7],[-0.3,49.3],[0.1,49.5],[1.08,49.93],[1.6,50.2],[1.6,50.73],[1.85,50.96],[2.37,51.05],[2.9,51.23],[3.5,51.4],[4.1,51.95],[4.75,52.95],[5.5,53.45],[6.9,53.45],[8.7,53.9],[8.3,54.9],[8.1,55.6],[8.6,57.1],[9,57.15],[9,48],[-4.75,48]];
const NO: LL[] = [[4.9,61],[9,61],[9,58.5],[8,58.15],[7.05,58],[6,58.3],[5.6,58.9],[5.2,59.5],[5,60.4]];
const SMALL: LL[][] = [
  [[-3.3,59.1],[-2.8,59.3],[-2.7,58.8],[-3.2,58.8]],
  [[-1.3,60.8],[-0.9,60.6],[-1.2,59.9],[-1.5,60.2]],
  [[-6.2,58.5],[-6.9,58.2],[-7.5,57],[-7.2,57.1],[-6.4,58.1]],
  [[-4.8,54.05],[-4.3,54.4],[-4.4,54.1]],
];

/* Land that is dry only while the sea sits more than `d` metres below today. */
const SHELF: { d: number; a: LL[] }[] = [
  { d: 120, a: [[-7.5,48],[-9.5,49.5],[-10.5,50.8],[-11,52],[-11,55],[-10,56.5],[-8.5,57.5],[-7.5,58.6],[-5.5,59.4],[-3,60],[-1.5,61],[4,61],[4.2,60],[4.5,59.2],[5.8,58.2],[8,57.8],[9,57.9],[9,48]] },
  { d: 80, a: [[-4.9,48],[-5.3,48.9],[-6.2,49.6],[-6.6,50.3],[-6,51.2],[-7.5,51.3],[-10.2,51.4],[-10.6,52.3],[-10.5,53.5],[-10.6,54.5],[-9.2,55.6],[-7.5,56.3],[-7.8,57.3],[-7,58.4],[-4.5,58.9],[-2.5,59.3],[-1.5,59.3],[1,58.8],[3,58],[5.5,57.6],[7.5,57.5],[9,57.4],[9,48]] },
  { d: 50, a: [[-2.2,56.1],[-1,56.3],[1,56.35],[3,56.6],[5,56.5],[7,56.7],[8.3,56.9],[9,56.9],[9,49.5],[-1.2,49.5],[-1.3,50.7],[-1,52],[-2.3,55.3]] },
  { d: 45, a: [[-3,53.3],[-4.3,53.5],[-4.8,54.1],[-3.6,54.8],[-3,54.3]] },
  { d: 30, a: [[0.1,53.6],[0.9,54.3],[1.8,55],[3,55.5],[4.2,55.3],[5.5,54.6],[7.5,54.9],[9,55],[9,52.5],[4.3,52.2],[3.2,51.9],[2.2,51.8],[1.6,52.2],[1.2,53],[0.4,53.2]] },
  { d: 22, a: [[1.7,52.3],[2.6,52.6],[3.6,53],[4.5,52.9],[4,52.3],[2.8,52],[1.8,51.9]] },
  { d: 12, a: [[1.6,54.6],[2.2,55.2],[3.2,55.5],[4.2,55.2],[3.5,54.7],[2.4,54.5]] },
];

const ICE: LL[] = [[-10.5,51.8],[-8,51.3],[-6.3,50],[-5,51.3],[-4,51.9],[-3,52.3],[-2.3,53],[-1.5,53.3],[0.2,53],[0.6,53.1],[1.5,54],[3,55],[5,56.5],[7,57.5],[9,58],[9,61],[-3,61],[-8,59],[-10.5,57],[-11,54]];

/* Approximate relative sea level, [years ago, metres against today]. */
const CURVE: [number, number][] = [[20000,-120],[16000,-100],[14500,-80],[12000,-60],[11000,-50],[10000,-40],[9000,-28],[8500,-24],[8000,-18],[7500,-12],[7000,-8],[6000,-4],[5000,-2],[0,0]];

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
/* Site palette from app/globals.css (owner request, 22 Sept 2026). */
const LAND = "var(--cta)";
const SEA = "var(--blue-deep)";
const COAST = "var(--navy)";

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
  const seaShown = Math.round(sea);
  const caption = EVENTS.find((e) => yearsAgo >= e[0])?.[1] ?? "";
  const iceOpacity = Math.min(0.95, Math.max(0, (yearsAgo - 13500) / 4500));

  const togglePlay = () => {
    if (!playing && t >= START) setT(0);
    setPlaying((p) => !p);
  };

  return (
    <section className={styles.panel} aria-labelledby="sea-level-title">
      <h2 id="sea-level-title" className={`display ${styles.title}`}>
        Britain Becomes an <span className="display-yellow">Island</span>
      </h2>
      <p className={styles.intro}>
        When the first dogs came to Britain, the sea was far lower and Britain was joined to Europe by a lost land called Doggerland. Press play to watch the sea rise.
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
          <span className={styles.statLabel}>Sea level against today</span>
          <span className={styles.statValue}>{seaShown === 0 ? "0" : seaShown} m</span>
        </div>
      </div>

      <p className={styles.caption} aria-live="polite">{caption}</p>

      <div className={styles.mapWrap}>
        <svg viewBox={`0 0 ${W} ${H}`} className={styles.map} role="img" aria-label="Map of Britain and Doggerland as the sea rises">
          <rect x={0} y={0} width={W} height={H} style={{ fill: SEA }} />
          {SHELF.map(({ d, a }) => (
            <polygon key={d} points={pts(a)} style={{ fill: LAND }} opacity={Math.min(1, Math.max(0, (-d + 3 - sea) / 6))} />
          ))}
          {[GB, IE, EU, NO, ...SMALL].map((a, i) => (
            <polygon key={`l${i}`} points={pts(a)} style={{ fill: LAND }} />
          ))}
          <polygon points={pts(ICE)} fill="#ffffff" stroke="#b4b2a9" strokeWidth={0.8} opacity={iceOpacity} />
          {[GB, IE, NO, ...SMALL, EU.slice(0, 25)].map((a, i) => (
            <polygon key={`c${i}`} points={pts(a)} fill="none" style={{ stroke: COAST }} strokeWidth={1} strokeDasharray="3 2" />
          ))}
          <text x={250} y={190} fontSize={13} fill="#ffffff" opacity={sea < -14 ? 1 : 0} className={styles.mapLabel}>
            Doggerland
          </text>
        </svg>
      </div>

      <ul className={styles.legend}>
        <li><span className={styles.swatch} style={{ background: LAND }} /> Dry land</li>
        <li><span className={styles.dash} /> Today&apos;s coastline</li>
      </ul>
      <p className={styles.note}>Simplified map. Coastlines and sea levels are approximate.</p>
    </section>
  );
}
