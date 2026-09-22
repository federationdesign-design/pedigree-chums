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

/* War bands. Labels name who Britain was fighting (owner, 22 Sept 2026), with
   "Seven" shortened to "7", and wrap onto a second line when the band is narrow. */
const WARS: { from: number; to: number; name: string }[] = [
  { from: 1689, to: 1697, name: "fight: France" },
  { from: 1702, to: 1713, name: "fight: Spain" },
  { from: 1739, to: 1748, name: "fight: Spain and France" },
  { from: 1756, to: 1763, name: "7 Years War" },
  { from: 1775, to: 1783, name: "fight: America" },
  { from: 1793, to: 1802, name: "fight: France again" },
];

/* Greedy wrap for a band label: about 4.6px a character at 9px type. */
const wrapLabel = (text: string, width: number) => {
  const max = Math.max(6, Math.floor(width / 4.6));
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
};

const X0 = 1685;
const X1 = 1805;
const YMAX = 550;
const W = 620;
const H = 300;
const PAD = { l: 44, r: 14, t: 16, b: 34 };

/* The debt in any year, read off the line between the two nearest figures, so a
   war's start and end can be marked on the line itself (owner, 22 Sept 2026). */
const debtAt = (year: number) => {
  if (year <= DEBT[0][0]) return DEBT[0][1];
  for (let i = 0; i < DEBT.length - 1; i++) {
    const [ya, va] = DEBT[i];
    const [yb, vb] = DEBT[i + 1];
    if (year <= yb) return va + ((vb - va) * (year - ya)) / (yb - ya);
  }
  return DEBT[DEBT.length - 1][1];
};

const px = (year: number) => PAD.l + ((year - X0) / (X1 - X0)) * (W - PAD.l - PAD.r);
const py = (m: number) => H - PAD.b - (m / YMAX) * (H - PAD.t - PAD.b);

export default function MoneyForShips() {
  const line = DEBT.map(([y, m]) => `${px(y).toFixed(1)},${py(m).toFixed(1)}`).join(" ");
  const area = `${px(X0).toFixed(1)},${py(0).toFixed(1)} ${line} ${px(1802).toFixed(1)},${py(0).toFixed(1)}`;

  return (
    <section className={styles.panel} aria-labelledby="money-ships-title">
      <h2 id="money-ships-title" className={`display ${styles.title}`}>
        The Adoption of <span className="display-yellow">Capitalism</span>
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
          {WARS.map((w) => {
            const x0 = px(w.from);
            const x1 = px(w.to);
            const lines = wrapLabel(w.name, x1 - x0);
            return (
              <g key={w.name}>
                {/* Dashed lines at the start and end of each war, not a filled band:
                    the fill read as a bar chart (owner, 22 Sept 2026). */}
                <line x1={x0} x2={x0} y1={PAD.t} y2={H - PAD.b} className={styles.warEdge} />
                <line x1={x1} x2={x1} y1={PAD.t} y2={H - PAD.b} className={styles.warEdge} />
                <circle cx={x0} cy={py(debtAt(w.from))} r={4.5} className={styles.warStart}>
                  <title>{`${w.name} begins, ${w.from}`}</title>
                </circle>
                <circle cx={x1} cy={py(debtAt(w.to))} r={4.5} className={styles.warEnd}>
                  <title>{`${w.name} ends, ${w.to}`}</title>
                </circle>
                <text x={(x0 + x1) / 2} y={PAD.t} textAnchor="middle" className={styles.warLabel}>
                  {lines.map((l, i) => (
                    <tspan key={l} x={(x0 + x1) / 2} dy={i === 0 ? 0 : 10}>
                      {l}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}
          <polygon points={area} className={styles.fill} />
          <polyline points={line} className={styles.line} />
          {DEBT.map(([y, m]) => (
            <circle key={y} cx={px(y)} cy={py(m)} r={3} className={styles.dot}>
              <title>{`${y}: about £${m}m`}</title>
            </circle>
          ))}
          {[1700, 1750, 1800].map((y) => (
            <text key={y} x={px(y)} y={H - PAD.b + 16} textAnchor="middle" className={styles.axis}>{y}</text>
          ))}
        </svg>
      </div>

      <ul className={styles.facts}>
        <li><span className={styles.big}>£0.7m</span> owed in 1688, the year William landed</li>
        <li><span className={styles.big}>£132m</span> by 1763, after winning the Seven Years War</li>
        <li><span className={styles.big}>£523m</span> by 1802, and the biggest navy in the world</li>
      </ul>
      {/* Explainer on bonds (owner request, 22 Sept 2026). Copy flagged for review.
          The last paragraph is deliberately careful: the money was not conjured from
          nothing, it was a promise that future taxes would pay for it. */}
      <div className={styles.explain}>
        <h3 className={styles.explainTitle}>So what is a bond?</h3>
        <p className={styles.explainText}>
          It is not the same as money. A coin is worth what it says right now. A bond is a promise about the future. But because everyone believed Parliament would pay, people bought and sold bonds happily, so a bond worked almost as well as cash.
        </p>
        <p className={styles.explainText}>
          That belief is what let the government spend sums it did not have. It borrowed from thousands of people at once, paid the interest out of taxes, and the Bank of England printed paper notes backed by the loan. It looked like money out of thin air. Really it was a promise that future taxpayers would pick up the bill, and they did, for two hundred years.
        </p>
      </div>

      <p className={styles.note}>Dashed lines mark wars: a green dot where one starts, a red dot where it ends. Figures are the published national debt for the years shown, rounded.</p>
    </section>
  );
}
