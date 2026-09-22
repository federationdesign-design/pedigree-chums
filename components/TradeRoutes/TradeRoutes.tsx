"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./TradeRoutes.module.css";
import { WORLD_PATHS, lonX, latY } from "../../data/worldOutline";

/* Ships, Spices and Pugs: the English and Dutch sea routes east, 1600 to 1800.
   The 1700s era page, added 22 September 2026 at the owner's request. Copy
   flagged for owner review.

   SIMPLIFIED: each route is drawn through a handful of waypoints on its general
   line, not a real sailing track. Dates are the founding or first-trading dates
   of the places named. Sources: the East India Company's 1600 charter and the
   Dutch East India Company's 1602 charter; Batavia 1619; Madras 1639; the Dutch
   Cape supply station 1652; Bombay handed to the company 1668; Calcutta 1690;
   English trade at Canton from 1699; and a pug travelling with William III and
   Mary II in 1688 (Wikipedia, Pug). */

/* The Americas are cropped out (owner, 22 Sept 2026): nothing on this map
   happens there, and the window from about 32W to 145E and 60N to 15S lets
   Europe, Africa and Asia be drawn much bigger. */
const VIEW = { x: 444, y: 90, w: 531, h: 315 };
const START = 1600;
const END = 1805; /* owner, 22 Sept 2026: was 1800 */

type LL = [number, number];
const pts = (a: LL[]) => a.map(([lo, la]) => `${lonX(lo).toFixed(1)},${latY(la).toFixed(1)}`).join(" ");

/* Route waypoints, London or Amsterdam out to the east. */
const EN_INDIA: LL[] = [[0, 51.5], [-10, 44], [-25, 18], [-30, -5], [-10, -30], [18, -34.4], [50, -30], [72, 5], [80.3, 13.1]];
const EN_BENGAL: LL[] = [[80.3, 13.1], [84, 18], [88.4, 22.6]];
/* Round the Malay peninsula and up the South China Sea, so the line stays at sea. */
const EN_CHINA: LL[] = [[80.3, 13.1], [92, 6], [98, 3.5], [103, 1.2], [107, 6], [111, 14], [113.3, 23.1]];
const NL_EAST: LL[] = [[4.9, 52.4], [-6, 46], [-22, 14], [-28, -8], [-8, -32], [18, -34.4], [55, -28], [85, -12], [106.8, -6.2]];

/* `dx`/`dy` nudge a label in map units, about a pixel each at the usual size.
   `noLabel` marks a point shown without text. The 1688 pug marker was removed on
   22 Sept 2026 (owner): a lone yellow dot on Britain with no label read as an
   error, and the caption still tells the story. */
type Port = { year: number; name: string; at: LL; dog?: boolean; left?: boolean; dx?: number; dy?: number; noLabel?: boolean };
const PORTS: Port[] = [
  { year: 1600, name: "London", at: [0, 51.5], left: true },
  { year: 1602, name: "Amsterdam", at: [4.9, 52.4] },
  { year: 1619, name: "Batavia", at: [106.8, -6.2] },
  { year: 1639, name: "Madras", at: [80.3, 13.1], left: true },
  { year: 1652, name: "Cape Town", at: [18, -34.4], dx: -5, dy: 8 },
  { year: 1668, name: "Bombay", at: [72.8, 19], left: true },
  { year: 1690, name: "Calcutta", at: [88.4, 22.6] },
  { year: 1699, name: "Canton", at: [113.3, 23.1] },
];


/* SEA BATTLES (owner request, 22 Sept 2026): the Royal Navy's best-known fights
   inside this map window, each popping in on its date and fading a few years
   later. `size` is an editorial 1 to 5 for how big and how important the battle
   was, not a measured figure: 5 is a fleet-destroying victory (Quiberon Bay, the
   Nile), 2 a smaller action (Dogger Bank). Battles fought in the Americas, such
   as the Saintes in 1782, are outside this map. */
/* `foe` is who the Royal Navy was fighting; it is what the map shows, with the
   battle name kept as the marker's tooltip (owner, 22 Sept 2026). */
type Battle = { year: number; name: string; at: LL; size: number; left?: boolean; foe: string };
const BATTLES: Battle[] = [
  { year: 1667, name: "Raid on the Medway", at: [0.6, 51.4], size: 4, left: true, foe: "The Dutch" },
  { year: 1690, name: "Beachy Head", at: [0.3, 50.5], size: 4, foe: "France" },
  { year: 1692, name: "Barfleur and La Hougue", at: [-1.3, 49.6], size: 4, left: true, foe: "France" },
  { year: 1704, name: "Gibraltar taken", at: [-5.35, 36.1], size: 3, left: true, foe: "Spain" },
  { year: 1718, name: "Cape Passaro", at: [15.1, 36.6], size: 3, foe: "Spain" },
  { year: 1747, name: "Cape Finisterre", at: [-9.3, 43], size: 3, left: true, foe: "France" },
  { year: 1759, name: "Lagos", at: [-8.7, 37.1], size: 3, left: true, foe: "France" },
  { year: 1759, name: "Quiberon Bay", at: [-3.1, 47.4], size: 5, left: true, foe: "France" },
  { year: 1781, name: "Dogger Bank", at: [3.3, 54.8], size: 2, foe: "The Dutch" },
  { year: 1794, name: "The Glorious First of June", at: [-13, 47.5], size: 4, left: true, foe: "France" },
  { year: 1797, name: "Cape St Vincent", at: [-9.5, 36.9], size: 4, left: true, foe: "Spain" },
  { year: 1797, name: "Camperdown", at: [4.6, 52.8], size: 3, foe: "The Dutch" },
  { year: 1798, name: "The Nile", at: [30.1, 31.3], size: 5, foe: "France" },
  { year: 1805, name: "Trafalgar", at: [-6, 36.2], size: 5, foe: "France and Spain", left: true },
];

/* A battle shows for six years: two growing, two full, two fading. */
const battleScale = (b: Battle, year: number) => {
  const d = year - b.year;
  if (d < 0 || d > 6) return 0;
  if (d < 2) return (d + 1) / 2; /* visible from its own year, so 1805 still shows */
  if (d > 4) return (6 - d) / 2;
  return 1;
};

/* An eight-pointed burst, drawn around a centre. */
const burst = (cx: number, cy: number, r: number) =>
  Array.from({ length: 16 }, (_, i) => {
    const a = (Math.PI * i) / 8;
    const rad = i % 2 === 0 ? r : r * 0.45;
    return `${(cx + Math.cos(a) * rad).toFixed(1)},${(cy + Math.sin(a) * rad).toFixed(1)}`;
  }).join(" ");

const EVENTS: [number, string][] = [
  [1699, "English ships begin trading at Canton in China. Tea, silk and porcelain sail home, and so do small flat-faced dogs from the east."],
  [1690, "Calcutta is founded. English trading posts now ring the Indian coast."],
  [1688, "William and Mary sail from the Netherlands to take the English throne, and their pugs come too. The pug had reached Europe on Dutch trading ships from China."],
  [1668, "Bombay is handed to the East India Company, giving it a harbour of its own."],
  [1652, "The Dutch set up a supply station at the Cape of Good Hope, halfway to the east."],
  [1639, "The English build a fort at Madras, their first real foothold in India."],
  [1619, "The Dutch make Batavia, today's Jakarta, the capital of their eastern trade. The Spice Islands are the richest prize of all."],
  [1602, "The Dutch East India Company is founded, and sells shares to ordinary people to pay for its ships."],
  [1600, "Queen Elizabeth I grants a charter to the East India Company. Its ships have to sail right around Africa to reach the east."],
];

export default function TradeRoutes() {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const span = END - START;

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setT((v) => {
        const n = Math.min(span, v + 1);
        if (n >= span) setPlaying(false);
        return n;
      });
    }, 50);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, span]);

  const year = START + t;
  const caption = EVENTS.find((e) => year >= e[0])?.[1] ?? "";
  const grow = (from: number) => Math.min(1, Math.max(0, (year - from) / 10));

  const togglePlay = () => {
    if (!playing && t >= span) setT(0);
    setPlaying((p) => !p);
  };

  const route = (d: LL[], from: number, cls: string) => {
    const p = grow(from);
    if (p <= 0) return null;
    return <polyline points={pts(d)} pathLength={1} className={cls} strokeDasharray={cls === styles.routeNl ? undefined : "1"} strokeDashoffset={cls === styles.routeNl ? undefined : 1 - p} opacity={cls === styles.routeNl ? p : 1} />;
  };

  return (
    <section className={styles.panel} aria-labelledby="trade-routes-title">
      <h2 id="trade-routes-title" className={`display ${styles.title}`}>
        Ships, Spices and <span className="display-yellow">Pugs</span>
      </h2>
      <p className={styles.intro}>
        Dutch and English ships sailed halfway round the world for spices, cotton, tea and silk. Dogs came home with them. Press play to watch the trade routes open up.
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
          <span className={styles.statValue}>Year</span>
          <span className={styles.statLabel}>{year}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>Trading posts</span>
          <span className={styles.statLabel}>{PORTS.filter((p) => !p.dog && year >= p.year).length}</span>
        </div>
      </div>

      <p className={styles.caption} aria-live="polite">{caption}</p>

      <div className={styles.mapWrap}>
        <svg viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} className={styles.map} role="img" aria-label={`World map of Dutch and English trade routes in ${year}`}>
          {WORLD_PATHS.map((d, i) => (
            <path key={i} d={d} className={styles.land} />
          ))}
          {route(NL_EAST, 1602, styles.routeNl)}
          {route(EN_INDIA, 1600, styles.routeEn)}
          {route(EN_BENGAL, 1690, styles.routeEn)}
          {route(EN_CHINA, 1699, styles.routeEn)}
          {BATTLES.map((b) => {
            const k = battleScale(b, year);
            if (k <= 0) return null;
            const cx = lonX(b.at[0]);
            const cy = latY(b.at[1]);
            const r = (5 + b.size * 2.2) * (0.6 + 0.4 * k);
            return (
              <g key={`${b.name}${b.year}`} opacity={k}>
                <polygon points={burst(cx, cy, r)} className={styles.battle}>
                  <title>{`${b.name}, ${b.year}`}</title>
                </polygon>
                <text x={b.left ? cx - r - 3 : cx + r + 3} y={cy + 3.5} textAnchor={b.left ? "end" : "start"} className={styles.battleLabel}>
                  {b.foe}
                </text>
              </g>
            );
          })}
          {PORTS.filter((p) => year >= p.year).map((p) => {
            const cx = lonX(p.at[0]);
            const cy = latY(p.at[1]);
            return (
              <g key={p.name} opacity={grow(p.year)}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={p.dog ? 6 : 5}
                  className={
                    p.dog ? styles.dogPort : p.name === "Amsterdam" ? styles.portNl : p.name === "London" ? styles.portEn : styles.port
                  }
                />
                {!p.noLabel && (
                  <text
                    x={(p.left ? cx - 8 : cx + 8) + (p.dx ?? 0)}
                    y={cy + 3.5 + (p.dy ?? 0)}
                    textAnchor={p.left ? "end" : "start"}
                    className={styles.portLabel}
                  >
                    {p.name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <ul className={styles.legend}>
        <li><span className={`${styles.swatch} ${styles.swatchEn}`} aria-hidden="true" /> English route</li>
        <li><span className={styles.swatchNl} aria-hidden="true" /> Dutch route</li>
        <li><span className={styles.swatchBattle} aria-hidden="true" /> Sea battle, bigger means bigger fight</li>
      </ul>
      <p className={styles.note}>Simplified map. Routes are drawn through a few points on their general line, not real sailing tracks, and battle markers are sized by how big the fight was, not measured.</p>
    </section>
  );
}
