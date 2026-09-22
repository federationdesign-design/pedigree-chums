"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./DogCartBan.module.css";
import { GB } from "../SeaLevelMap/SeaLevelMap";

/* The dog-cart ban and Britain's dog population, 1800 to 1900. The 1800s era
   page. Rebuilt 22 September 2026 as a playable timeline at the owner's request
   (it was three tabs and a grid of dots). Copy flagged for owner review.

   THE LAW. Metropolitan Police Act 1839, section 56: no dog may draw a cart
   inside the Metropolitan Police District, a 15-mile radius of Charing Cross,
   from 1 January 1840, on penalty of forty shillings and five pounds for a second
   offence (Wikipedia, Drafting (dog), quoting the Act). More than 3,000 dogs were
   destroyed as a result of that one clause (David Lamb, "Carting Dogs in
   Chandler's Ford"). The ban reached the rest of England and Wales in 1854
   (Wikipedia, Victorian morality); an 1841 bill had failed.

   THE DOG COUNT IS A MODEL, AND THE PANEL SAYS SO. Nobody counted Britain's dogs
   before the dog licence of 1867, so the line is worked out from the census: the
   population of England and Wales at each census (1801 to 1901, Vision of
   Britain, from the 1931 census General Report) divided by 17, which is the
   Victorian ratio of about one dog for every 17 people implied by the 1867
   licence returns (Who Do You Think You Are magazine). Real recorded figures are
   plotted as separate dots so nobody mistakes the model for a count: 830,000
   licences in 1867 and 1,362,176 in 1876 (Board of Agriculture and Parliamentary
   Papers, via the Embsay with Eastby history), and a contemporary estimate of
   about 2,000,000 dogs in Great Britain in the 1880s (Mulhall). DO NOT present
   the modelled line as a measured figure. */

const CHARING: [number, number] = [-0.1281, 51.5074];
const R_LAT = 15 / 69.1;
const R_LON = R_LAT / Math.cos((51.5 * Math.PI) / 180);

const K = 20;
const px = (p: [number, number]) => [(p[0] + 11) * K * 2.2, (61 - p[1]) * K * 3.6] as const;
const VIEW = { x: 220, y: 470, w: 352, h: 300 };

const START = 1800;
const END = 1900;

const TOWNS: { name: string; at: [number, number]; left?: boolean }[] = [
  { name: "London", at: CHARING, left: true },
  { name: "Birmingham", at: [-1.9, 52.48] },
  { name: "Bristol", at: [-2.59, 51.45], left: true },
];

/* Census population of England and Wales, in millions. */
const CENSUS: [number, number][] = [
  [1801, 8.89], [1811, 10.16], [1821, 12.0], [1831, 13.9], [1841, 15.91], [1851, 17.93],
  [1861, 20.07], [1871, 22.71], [1881, 25.97], [1891, 29.0], [1901, 32.53],
];
const PER_DOG = 17;

/* Figures that were actually written down, plotted as dots. */
const RECORDED: { year: number; dogs: number; what: string }[] = [
  { year: 1867, dogs: 830000, what: "830,000 dog licences, the first year they were issued" },
  { year: 1876, dogs: 1362176, what: "1,362,176 licences in Great Britain" },
  { year: 1885, dogs: 2000000, what: "about 2,000,000 dogs, one writer's estimate" },
];

const peopleAt = (year: number) => {
  if (year <= CENSUS[0][0]) return CENSUS[0][1];
  for (let i = 0; i < CENSUS.length - 1; i++) {
    const [ya, va] = CENSUS[i];
    const [yb, vb] = CENSUS[i + 1];
    if (year <= yb) return va + ((vb - va) * (year - ya)) / (yb - ya);
  }
  return CENSUS[CENSUS.length - 1][1];
};
const dogsAt = (year: number) => (peopleAt(year) * 1_000_000) / PER_DOG;

const EVENTS: [number, string][] = [
  [1876, "The count keeps climbing: 1,362,176 licensed dogs in Great Britain, and many more never licensed."],
  [1867, "The dog licence arrives. For the first time somebody actually counts: 830,000 licences, at five shillings each."],
  [1854, "The ban spreads to the rest of England and Wales. An earlier attempt in 1841 had failed."],
  [1840, "The ban bites. More than 3,000 dogs are destroyed, because a dog that cannot earn its keep still has to be fed."],
  [1839, "Parliament bans dogs from pulling carts within 15 miles of Charing Cross, from 1 January 1840."],
  [1800, "Dogs work for a living: hauling milk, bread, rags and cat meat through the streets. Nobody counts them."],
];

const CW = 620;
const CH = 190;
const CPAD = { l: 46, r: 12, t: 14, b: 26 };
const cx0 = (year: number) => CPAD.l + ((year - START) / (END - START)) * (CW - CPAD.l - CPAD.r);
const cy0 = (dogs: number) => CH - CPAD.b - (dogs / 2_400_000) * (CH - CPAD.t - CPAD.b);

export default function DogCartBan() {
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
    }, 70);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, span]);

  const year = START + t;
  const caption = EVENTS.find((e) => year >= e[0])?.[1] ?? "";
  const [mx, my] = px(CHARING);
  const rx = px([CHARING[0] + R_LON, CHARING[1]])[0] - mx;
  const ry = my - px([CHARING[0], CHARING[1] + R_LAT])[1];

  const line = [];
  for (let y = START; y <= year; y += 2) line.push(`${cx0(y).toFixed(1)},${cy0(dogsAt(y)).toFixed(1)}`);
  line.push(`${cx0(year).toFixed(1)},${cy0(dogsAt(year)).toFixed(1)}`);

  const togglePlay = () => {
    if (!playing && t >= span) setT(0);
    setPlaying((p) => !p);
  };

  return (
    <section className={styles.panel} aria-labelledby="dogcart-title">
      <h2 id="dogcart-title" className={`display ${styles.title}`}>
        The Dog Cart <span className="display-yellow">Ban</span>
      </h2>
      <p className={styles.intro}>
        For poor traders, a dog and a cart was a whole business: milk, bread, rags, cat meat. Then one law made it illegal. Press play to watch the century go by.
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
          <span className={styles.statValue}>Dogs, roughly</span>
          <span className={styles.statLabel}>{`${(Math.round(dogsAt(year) / 10000) / 100).toFixed(2)} million`}</span>
        </div>
      </div>

      <p className={styles.caption} aria-live="polite">{caption}</p>

      <div className={styles.mapWrap}>
        <svg viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} className={styles.map} role="img" aria-label={`Map of southern Britain in ${year} showing where dog carts were banned`}>
          <polygon points={GB.map((p) => px(p).join(",")).join(" ")} className={styles.land} />
          {year >= 1854 && <polygon points={GB.map((p) => px(p).join(",")).join(" ")} className={styles.banned} />}
          <ellipse cx={mx} cy={my} rx={rx} ry={ry} className={year >= 1840 ? styles.ringOn : styles.ring} />
          {TOWNS.map((tw) => {
            const [tx, ty] = px(tw.at);
            return (
              <g key={tw.name}>
                <circle cx={tx} cy={ty} r={tw.name === "London" ? 4 : 2.6} className={styles.town} />
                <text x={tw.left ? tx - 5 : tx + 5} y={ty + 3} textAnchor={tw.left ? "end" : "start"} className={styles.townLabel}>
                  {tw.name}
                </text>
              </g>
            );
          })}
          <text x={mx} y={my - ry - 5} textAnchor="middle" className={styles.ringLabel}>
            15 miles from Charing Cross
          </text>
          {/* At the top of the map (owner, 22 Sept 2026: it was at the foot). */}
          <text x={VIEW.x + VIEW.w / 2} y={VIEW.y + 16} textAnchor="middle" className={styles.mapNote}>
            {year < 1840 ? "Dog carts still legal everywhere" : year < 1854 ? "Banned inside the circle" : "Banned across England and Wales"}
          </text>
        </svg>
      </div>

      <div className={styles.chartWrap}>
        <span className={`display ${styles.chartTitle}`}>How many dogs were there?</span>
        <svg viewBox={`0 0 ${CW} ${CH}`} className={styles.chart} role="img" aria-label="Chart of the estimated number of dogs in England and Wales through the 1800s">
          {[0, 1_000_000, 2_000_000].map((v) => (
            <g key={v}>
              <line x1={CPAD.l} x2={CW - CPAD.r} y1={cy0(v)} y2={cy0(v)} className={styles.grid} />
              <text x={CPAD.l - 6} y={cy0(v) + 3.5} textAnchor="end" className={styles.axis}>{v === 0 ? "0" : `${v / 1_000_000}m`}</text>
            </g>
          ))}
          <polyline points={line.join(" ")} className={styles.dogLine} />
          {RECORDED.filter((r) => year >= r.year).map((r) => (
            <circle key={r.year} cx={cx0(r.year)} cy={cy0(r.dogs)} r={4} className={styles.recorded}>
              <title>{`${r.year}: ${r.what}`}</title>
            </circle>
          ))}
          {[1800, 1850, 1900].map((y) => (
            <text key={y} x={cx0(y)} y={CH - CPAD.b + 16} textAnchor="middle" className={styles.axis}>{y}</text>
          ))}
        </svg>
      </div>

      <p className={styles.note}>
        The line is our own estimate: the census population of England and Wales divided by 17, the Victorian rule of thumb of one dog per 17 people. The yellow dots are figures somebody really wrote down, starting with the first dog licences in 1867.
      </p>
    </section>
  );
}
