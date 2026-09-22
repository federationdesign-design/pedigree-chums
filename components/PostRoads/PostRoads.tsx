"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./PostRoads.module.css";
import { GB, type LL } from "../SeaLevelMap/SeaLevelMap";

/* The King's Post: England's first post roads, 1500 to 1700. Tudor 'n' Stuart
   era page, added 22 Sept 2026 at the owner's request. Copy flagged for owner
   review. SIMPLIFIED: each road is drawn through a few towns on its known line,
   not surveyed.

   Sources: Wikipedia "General Post Office" (Tuke's 1533 report of regular posts
   London-Berwick and London-Dover; post roads to the west and towards Ireland by
   the 1550s; 1635 proclamation, running post night and day, extension to Bristol
   and to Colchester, Norwich and Yarmouth; Plymouth road extended to Falmouth in
   the 1600s; Blome's 1673 count of over 140 stages and over 380 post towns);
   royal.uk "Stamps" (James I's four posts to Berwick, Beaumaris, Dover and
   Plymouth; riders blowing their horn four times every mile); Highways Act 1555
   (four days a year of parish road work). Same projection as the other maps:
   x = (lon + 11) * 20, y = (61 - lat) * 33. */

const VIEW = { x: 100, y: 155, w: 170, h: 218 };
const START = 1500;
const END = 1700;

const pt = ([lo, la]: LL) => [(lo + 11) * 20, (61 - la) * 33] as const;
const px = (p: LL) => pt(p).map((n) => n.toFixed(1)).join(",");

const LONDON: LL = [-0.1, 51.51];

/* `left`: put the end label on the left, for towns near the map's right edge.
   `bye`: a bye-post or cross-post, the side roads off the main post roads (the
   nearest thing to today's B roads). Drawn thinner and dashed. */
type Road = { id: string; year: number; path: LL[]; end: string; left?: boolean; bye?: boolean };

const ROADS: Road[] = [
  { id: "dover", year: 1533, end: "Dover", left: true, path: [LONDON, [0.5, 51.39], [1.08, 51.28], [1.31, 51.13]] },
  { id: "north", year: 1533, end: "Berwick", path: [LONDON, [-0.02, 52.05], [-0.18, 52.33], [-0.48, 52.65], [-0.81, 53.08], [-1.13, 53.52], [-1.08, 53.96], [-1.43, 54.34], [-1.57, 54.78], [-1.61, 54.97], [-1.69, 55.17], [-2.0, 55.77]] },
  { id: "plymouth", year: 1550, end: "Plymouth", path: [LONDON, [-0.51, 51.43], [-1.09, 51.27], [-1.79, 51.07], [-2.2, 51.0], [-3.19, 50.8], [-3.53, 50.72], [-4.14, 50.37]] },
  { id: "ireland", year: 1550, end: "Holyhead", path: [LONDON, [-0.34, 51.75], [-0.99, 52.13], [-1.51, 52.41], [-1.83, 52.68], [-2.15, 52.9], [-2.52, 53.07], [-2.89, 53.19], [-3.83, 53.28], [-4.63, 53.31]] },
  { id: "edinburgh", year: 1635, end: "Edinburgh", path: [[-2.0, 55.77], [-2.5, 55.95], [-3.19, 55.95]] },
  { id: "bristol", year: 1635, end: "Bristol", path: [LONDON, [-0.97, 51.45], [-1.32, 51.4], [-1.73, 51.42], [-2.36, 51.38], [-2.59, 51.45]] },
  { id: "yarmouth", year: 1640, end: "Yarmouth", left: true, path: [LONDON, [0.47, 51.73], [0.9, 51.89], [1.16, 52.06], [1.3, 52.63], [1.73, 52.61]] },
  { id: "falmouth", year: 1660, end: "Falmouth", path: [[-4.14, 50.37], [-4.6, 50.45], [-5.07, 50.15]] },
  /* Bye-posts and cross-posts (added 22 Sept 2026, owner: "B roads"). 1635
     proclamation: bye-posts to places off the post roads "such as Lincoln and
     Hull", and the extension to Oxford; 1698: the Bristol-Exeter cross-post, before
     which letters between the two went via London (Wikipedia, General Post Office).
     Their exact lines are not recorded here, so each is drawn from the nearest
     post-road town. */
  { id: "oxford", year: 1635, end: "Oxford", bye: true, path: [LONDON, [-0.75, 51.63], [-1.26, 51.75]] },
  { id: "lincoln", year: 1636, end: "Lincoln", bye: true, left: true, path: [[-0.81, 53.08], [-0.54, 53.23]] },
  { id: "hull", year: 1636, end: "Hull", bye: true, path: [[-1.08, 53.96], [-0.75, 53.82], [-0.34, 53.74]] },
  { id: "crosspost", year: 1698, end: "Exeter", bye: true, path: [[-2.59, 51.45], [-3.0, 51.13], [-3.1, 51.02], [-3.53, 50.72]] },
];

/* Big towns, circles sized by estimated population (area proportional).
   Anchors are [year, people]; between anchors the size is interpolated, outside
   them it holds. Sources: London 55,000 c.1520 (eHRAF, British 1485-1603), about
   200,000 by 1600 and about 600,000 by 1700 (CAMPOP, Cambridge, 2024 blog);
   Norwich about 12,000 in 1520 to about 30,000 by 1700 (CAMPOP); Bristol and York
   8,000 to 9,000 c.1520 (eHRAF); all 1680 figures from Langton (2000), as tabled
   in Bogart's historic urban dataset. Towns with only a 1680 figure are shown at
   that size throughout. All are estimates. */
type Town = { name: string; at: LL; pop: [number, number][]; label?: boolean };
const TOWNS: Town[] = [
  { name: "London", at: LONDON, pop: [[1520, 55000], [1600, 200000], [1700, 600000]] },
  { name: "Norwich", at: [1.3, 52.63], pop: [[1520, 12000], [1700, 30000]], label: true },
  { name: "Bristol", at: [-2.59, 51.45], pop: [[1520, 8500], [1680, 13500]] },
  { name: "York", at: [-1.08, 53.96], pop: [[1520, 8500], [1680, 14200]], label: true },
  { name: "Newcastle", at: [-1.61, 54.97], pop: [[1680, 11600]], label: true },
  { name: "Oxford", at: [-1.26, 51.75], pop: [[1680, 11100]] },
  { name: "Cambridge", at: [0.12, 52.2], pop: [[1680, 10600]], label: true },
  { name: "Exeter", at: [-3.53, 50.72], pop: [[1680, 10300]] },
  { name: "Ipswich", at: [1.16, 52.06], pop: [[1680, 9800]] },
  { name: "Great Yarmouth", at: [1.73, 52.61], pop: [[1680, 9200]] },
];

const popAt = (pts: [number, number][], y: number) => {
  if (y <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, b] = [pts[i], pts[i + 1]];
    if (y <= b[0]) return a[1] + ((b[1] - a[1]) * (y - a[0])) / (b[0] - a[0]);
  }
  return pts[pts.length - 1][1];
};

/* Circle radius in map units: 10,000 people = 2 units, scaling with the square
   root so a circle's AREA matches the population. */
const radius = (people: number) => 2 * Math.sqrt(people / 10000);

const roundPop = (n: number) => (n >= 100000 ? Math.round(n / 10000) * 10000 : Math.round(n / 1000) * 1000);

/* Years for a road to draw itself out once it appears. */
const GROW = 8;

const EVENTS: [number, string][] = [
  [1673, "By 1673 there are over 140 post stages on the main roads, and over 380 post towns."],
  [1660, "An Act of Parliament sets up the General Post Office, and the Plymouth road is stretched on to Falmouth."],
  [1698, "A cross-post finally links Bristol and Exeter. Until now, a letter between them had to go all the way round through London!"],
  [1635, "Charles I opens the post to everyone. Anyone who can pay can now send a letter, and side roads called bye-posts reach towns like Lincoln and Hull."],
  [1603, "Under James I, four posts run from the royal court: to Scotland, to Ireland, to Europe through Dover, and to the dockyard at Plymouth."],
  [1580, "In Elizabeth I's day, post riders must blow their horn whenever they meet someone, or four times every mile."],
  [1555, "The Highways Act: every parish must mend its own roads, and everyone works on them for four days a year."],
  [1550, "By the 1550s, post roads also run west to Plymouth and north-west towards Ireland."],
  [1533, "Regular posts now run from London to Berwick and to Dover. Riders swap tired horses for fresh ones at post-houses along the way."],
  [1516, "Henry VIII makes Brian Tuke his Master of the Posts, in charge of carrying the king's letters."],
  [1500, "Around 1500, letters travel with messengers, carriers or pedlars. There is no national post."],
];

export default function PostRoads() {
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
    }, 60);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, span]);

  const year = START + t;
  const caption = EVENTS.find((ev) => year >= ev[0])?.[1] ?? "";
  const whoCan = year >= 1635 ? "Anyone who can pay" : year >= 1516 ? "The king's messengers" : "No post yet";

  const togglePlay = () => {
    if (!playing && t >= span) setT(0);
    setPlaying((p) => !p);
  };

  const [lx, ly] = pt(LONDON);

  return (
    <section className={styles.panel} aria-labelledby="post-roads-title">
      <h2 id="post-roads-title" className={`display ${styles.title}`}>
        The King&apos;s <span className="display-yellow">Post</span>
      </h2>
      <p className={styles.intro}>
        Before post boxes, the king&apos;s letters raced along special post roads, with fresh horses waiting every 20 miles or so. Press play to watch the network grow.
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
          <span className={styles.statLabel}>Who can send a letter?</span>
          <span className={styles.statValue}>{whoCan}</span>
        </div>
      </div>

      <p className={styles.caption} aria-live="polite">{caption}</p>

      <div className={styles.mapWrap}>
        <svg viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} className={styles.map} role="img" aria-label={`Simplified map of England's post roads in ${year}`}>
          <polygon points={GB.map(px).join(" ")} className={styles.land} />
          {TOWNS.map((tw) => {
            const [cx, cy] = pt(tw.at);
            return <circle key={tw.name} cx={cx} cy={cy} r={radius(popAt(tw.pop, year))} className={styles.city} />;
          })}
          {ROADS.map((r) => {
            const p = Math.min(1, Math.max(0, (year - r.year) / GROW));
            if (p <= 0) return null;
            const d = r.path.map(px).join(" ");
            const [ex, ey] = pt(r.path[r.path.length - 1]);
            return (
              <g key={r.id}>
                {r.bye ? (
                  <polyline points={d} className={styles.byeRoad} opacity={p} />
                ) : (
                  <>
                    <polyline points={d} pathLength={1} className={styles.roadCase} strokeDasharray="1" strokeDashoffset={1 - p} />
                    <polyline points={d} pathLength={1} className={styles.road} strokeDasharray="1" strokeDashoffset={1 - p} />
                  </>
                )}
                {p >= 1 && (
                  <>
                    <circle cx={ex} cy={ey} r={1.8} className={styles.town} />
                    <text x={r.left ? ex - 2.6 : ex + 2.6} y={ey + 1.8} textAnchor={r.left ? "end" : "start"} className={styles.townLabel}>{r.end}</text>
                  </>
                )}
              </g>
            );
          })}
          {TOWNS.filter((tw) => tw.label).map((tw) => {
            const [cx, cy] = pt(tw.at);
            const r = radius(popAt(tw.pop, year));
            return (
              <text key={tw.name} x={cx + r + 1.2} y={cy - r - 0.6} className={styles.cityLabel}>
                {tw.name}
              </text>
            );
          })}
          <circle cx={lx} cy={ly} r={2.6} className={styles.london} />
          <text x={lx + 3.2} y={ly + 5.5} className={styles.townLabel}>London</text>
        </svg>
      </div>

      <div className={styles.towns}>
        <span className={styles.townsTitle}>Biggest towns in {year}</span>
        <ol className={styles.townList}>
          {[...TOWNS]
            .map((tw) => ({ name: tw.name, people: popAt(tw.pop, year) }))
            .sort((a, b) => b.people - a.people)
            .slice(0, 5)
            .map((tw) => (
              <li key={tw.name}>
                <span className={styles.townName}>{tw.name}</span>
                <span className={styles.townPop}>about {roundPop(tw.people).toLocaleString("en-GB")}</span>
              </li>
            ))}
        </ol>
      </div>

      <ul className={styles.legend}>
        <li><span className={`${styles.swatch} ${styles.swatchLand}`} aria-hidden="true" /> Land</li>
        <li><span className={`${styles.swatch} ${styles.swatchRoad}`} aria-hidden="true" /> Post road</li>
        <li><span className={styles.swatchBye} aria-hidden="true" /> Side road (bye-post)</li>
        <li><span className={styles.swatchCity} aria-hidden="true" /> Town, sized by people</li>
      </ul>
      <p className={styles.note}>Simplified map. Roads are drawn through a few towns on their route, and populations are estimates. Most towns are shown at their size around 1680.</p>
    </section>
  );
}
