"use client";

import styles from "./MoneyForShips.module.css";

/* Money for Ships: Britain's national debt, 1688 to 1802, with the wars that
   caused it. The 1700s era page, added 22 September 2026 at the owner's request.
   Copy flagged for owner review.

   Figures are the published National Debt table (years as given; £ rounded to
   the nearest £100,000 here), plus the 1688 "King's Debt" of about £0.7m from the
   same source. The Bank of England (1694) and the first government bonds (1693)
   are from Wikipedia, Financial Revolution; the Bank's founding loan was raised
   to rebuild the navy (Tontine Coffee-House). */

const DEBT: [number, number][] = [
  [1688, 0.7], [1697, 14.5], [1702, 12.8], [1714, 36.2], [1739, 46.4], [1748, 75.4],
  [1757, 77.8], [1763, 132.1], [1776, 130.5], [1781, 187.8], [1786, 243.2], [1793, 244.7], [1802, 523.3],
];

const WARS: { from: number; to: number; name: string }[] = [
  { from: 1689, to: 1697, name: "France" },
  { from: 1702, to: 1713, name: "Spain" },
  { from: 1739, to: 1748, name: "Spain and France" },
  { from: 1756, to: 1763, name: "Seven Years War" },
  { from: 1775, to: 1783, name: "America" },
  { from: 1793, to: 1802, name: "France again" },
];

const MARKS: { year: number; text: string }[] = [
  { year: 1694, text: "Bank of England" },
  { year: 1763, text: "Empire in India and Canada" },
  { year: 1783, text: "America lost" },
];

const X0 = 1685;
const X1 = 1805;
const YMAX = 550;
const W = 620;
const H = 300;
const PAD = { l: 44, r: 14, t: 16, b: 34 };

const px = (year: number) => PAD.l + ((year - X0) / (X1 - X0)) * (W - PAD.l - PAD.r);
const py = (m: number) => H - PAD.b - (m / YMAX) * (H - PAD.t - PAD.b);

export default function MoneyForShips() {
  const line = DEBT.map(([y, m]) => `${px(y).toFixed(1)},${py(m).toFixed(1)}`).join(" ");
  const area = `${px(X0).toFixed(1)},${py(0).toFixed(1)} ${line} ${px(1802).toFixed(1)},${py(0).toFixed(1)}`;

  return (
    <section className={styles.panel} aria-labelledby="money-ships-title">
      <h2 id="money-ships-title" className={`display ${styles.title}`}>
        Money for <span className="display-yellow">Ships</span>
      </h2>
      <p className={styles.intro}>
        After 1688 Britain borrowed money the Dutch way, and promised Parliament would pay it back. That let it borrow more cheaply than its rivals, and spend the money on warships.
      </p>

      <div className={styles.chartWrap}>
        <svg viewBox={`0 0 ${W} ${H}`} className={styles.chart} role="img" aria-label="Line chart of Britain's national debt from 1688 to 1802, rising from under one million pounds to over five hundred million">
          {[0, 100, 200, 300, 400, 500].map((m) => (
            <g key={m}>
              <line x1={PAD.l} x2={W - PAD.r} y1={py(m)} y2={py(m)} className={styles.grid} />
              <text x={PAD.l - 6} y={py(m) + 3.5} textAnchor="end" className={styles.axis}>{m === 0 ? "0" : `£${m}m`}</text>
            </g>
          ))}
          {WARS.map((w) => (
            <g key={w.name}>
              <rect x={px(w.from)} y={PAD.t} width={px(w.to) - px(w.from)} height={H - PAD.t - PAD.b} className={styles.war} />
              <text x={(px(w.from) + px(w.to)) / 2} y={PAD.t + 10} textAnchor="middle" className={styles.warLabel}>{w.name}</text>
            </g>
          ))}
          <polygon points={area} className={styles.fill} />
          <polyline points={line} className={styles.line} />
          {DEBT.map(([y, m]) => (
            <circle key={y} cx={px(y)} cy={py(m)} r={3} className={styles.dot}>
              <title>{`${y}: about £${m}m`}</title>
            </circle>
          ))}
          {MARKS.map((mk) => (
            <g key={mk.year}>
              <line x1={px(mk.year)} x2={px(mk.year)} y1={H - PAD.b} y2={H - PAD.b + 6} className={styles.grid} />
              <text x={px(mk.year)} y={H - PAD.b + 16} textAnchor="middle" className={styles.mark}>{mk.text}</text>
            </g>
          ))}
          {[1700, 1750, 1800].map((y) => (
            <text key={y} x={px(y)} y={H - PAD.b + 26} textAnchor="middle" className={styles.axis}>{y}</text>
          ))}
        </svg>
      </div>

      <ul className={styles.facts}>
        <li><span className={styles.big}>£0.7m</span> owed in 1688, the year William landed</li>
        <li><span className={styles.big}>£132m</span> by 1763, after winning the Seven Years War</li>
        <li><span className={styles.big}>£523m</span> by 1802, and the biggest navy in the world</li>
      </ul>
      <p className={styles.note}>Shaded bands are wars. Figures are the published national debt for the years shown, rounded.</p>
    </section>
  );
}
