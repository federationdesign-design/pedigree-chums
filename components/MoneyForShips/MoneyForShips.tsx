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
/* TWICE THE HEIGHT AND EDGE TO EDGE (owner, 23 September 2026). H was 300; the
   chart is easier to read tall, and the extra room lets the axis figures and the
   war dots grow with it. The right padding drops to zero so the line runs to the
   edge of the panel, and the left keeps just enough for the pound figures. */
const W = 620;
const H = 600;
const PAD = { l: 52, r: 0, t: 24, b: 52 };

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
              <text x={PAD.l - 8} y={py(m) + 7} textAnchor="end" className={styles.axis}>{m === 0 ? "0" : `£${m}m`}</text>
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
                {/* At the top of each dashed line, not on the debt curve, so they are
                    never hidden behind the line's own dots (owner, 22 Sept 2026). */}
                <circle cx={x0} cy={PAD.t} r={8} className={styles.warStart}>
                  <title>{`${w.name} begins, ${w.from}`}</title>
                </circle>
                <circle cx={x1} cy={PAD.t} r={8} className={styles.warEnd}>
                  <title>{`${w.name} ends, ${w.to}`}</title>
                </circle>
                <text x={(x0 + x1) / 2} y={PAD.t + 26} textAnchor="middle" className={styles.warLabel}>
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
            <circle key={y} cx={px(y)} cy={py(m)} r={5} className={styles.dot}>
              <title>{`${y}: about £${m}m`}</title>
            </circle>
          ))}
          {[1700, 1750, 1800].map((y) => (
            <text key={y} x={px(y)} y={H - PAD.b + 30} textAnchor="middle" className={styles.axis}>{y}</text>
          ))}
        </svg>
      </div>

      {/* Three-stop timeline (owner, 22 Sept 2026): was a plain bullet list. */}
      <ol className={styles.timeline}>
        {[
          { figure: "£0.7m", text: "government debt in 1688" },
          { figure: "£132m", text: "by 1763, after winning the Seven Years War" },
          { figure: "£523m", text: "owed in 1802, and now the most powerful country" },
        ].map((s) => (
          <li key={s.figure} className={styles.stop}>
            <span className={styles.stopDot} aria-hidden="true" />
            <span className={styles.big}>{s.figure}</span>
            <span className={styles.stopText}>{s.text}</span>
          </li>
        ))}
      </ol>
      {/* Explainer on bonds (owner request, 22 Sept 2026). Copy flagged for review.
          The last paragraph is deliberately careful: the money was not conjured from
          nothing, it was a promise that future taxes would pay for it. The present-day
          figure is the ONS public sector finances release for August 2026, which puts
          debt just below £3 trillion; check it before any reprint. */}
      <div className={styles.explain}>
        <h3 className={styles.explainTitle}>So what is a bond?</h3>
        <p className={styles.explainText}>
          It is not the same as money. A coin is worth what it says right now. A bond is a promise about the future. But because everyone believed Parliament would pay, people bought and sold bonds happily, so a bond worked almost as well as cash.
        </p>
        <p className={styles.explainText}>
          That understanding was what let the government spend sums of money it did not have. It borrowed from thousands of rich and wealthy people at once (making them even richer, and what is now known as the 1%). The government paid them back with interest from raising taxes, and ordered the Bank of England to print paper &lsquo;money&rsquo;, which is why they are called &lsquo;notes&rsquo;, backed by that loan. It was like money out of thin air, only backed by a promise. Future taxpayers are still paying for it now: the UK&rsquo;s debt today is just under £3 trillion.
        </p>
      </div>

      <p className={styles.note}>Dashed lines mark wars: a green dot where one starts, a red dot where it ends. Figures are the published national debt for the years shown, rounded.</p>
    </section>
  );
}
