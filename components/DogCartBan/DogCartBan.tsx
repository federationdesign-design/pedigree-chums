"use client";

import { useState } from "react";
import styles from "./DogCartBan.module.css";
import { GB } from "../SeaLevelMap/SeaLevelMap";

/* The dog-cart ban: London, 1839. The 1800s era page, added 22 September 2026 at
   the owner's request. Copy flagged for owner review.

   Sources: Metropolitan Police Act 1839, section 56, banning any dog from drawing
   a cart inside the Metropolitan Police District, a 15-mile radius of Charing
   Cross, from 1 January 1840, with a penalty of forty shillings and five pounds
   for a second offence (Wikipedia, Drafting (dog), quoting the Act; Wikipedia,
   Metropolitan Police Act 1839). More than 3,000 dogs were destroyed as a result
   of that one clause (David Lamb, "Carting Dogs in Chandler's Ford"). The ban was
   extended to the rest of England and Wales in 1854 (Wikipedia, Victorian
   morality). A nationwide bill was attempted in 1841 and some accounts date the
   national ban to that year, which is why the panel says 1854 and mentions the
   earlier attempt. */

const CHARING: [number, number] = [-0.1281, 51.5074];
/* 15 miles is about 0.217 degrees of latitude; a degree of longitude at 51.5N is
   about 0.62 of a degree of latitude, so the circle is drawn as an ellipse. */
const R_LAT = 15 / 69.1;
const R_LON = R_LAT / Math.cos((51.5 * Math.PI) / 180);

const K = 20;
const px = (p: [number, number]) => [(p[0] + 11) * K * 2.2, (61 - p[1]) * K * 3.6] as const;
/* Southern Britain, so the circle reads as "London and everything around it". */
const VIEW = { x: 220, y: 470, w: 352, h: 300 };

const TOWNS: { name: string; at: [number, number]; left?: boolean }[] = [
  { name: "London", at: CHARING, left: true },
  { name: "Birmingham", at: [-1.9, 52.48] },
  { name: "Bristol", at: [-2.59, 51.45], left: true },
];

const STEPS: { year: string; text: string }[] = [
  { year: "1839", text: "Parliament bans dogs from pulling carts anywhere within 15 miles of Charing Cross. The rule starts on 1 January 1840." },
  { year: "1840", text: "Overnight, thousands of working dogs have no job. More than 3,000 are destroyed, because a dog that cannot earn its keep costs money to feed." },
  { year: "1854", text: "The ban spreads to the rest of England and Wales. An earlier attempt in 1841 had failed." },
];

export default function DogCartBan() {
  const [step, setStep] = useState(0);
  const [cx, cy] = px(CHARING);
  const rx = px([CHARING[0] + R_LON, CHARING[1]])[0] - cx;
  const ry = cy - px([CHARING[0], CHARING[1] + R_LAT])[1];
  /* Thirty dots, each one a hundred dogs. They grey out as the story moves on. */
  const lost = step >= 1 ? 30 : 0;

  return (
    <section className={styles.panel} aria-labelledby="dogcart-title">
      <h2 id="dogcart-title" className={`display ${styles.title}`}>
        The Dog Cart <span className="display-yellow">Ban</span>
      </h2>
      <p className={styles.intro}>
        For poor traders, a dog and a cart was a whole business: milk, bread, rags, cat meat. Then one law made it illegal, and the dogs became a cost nobody could afford.
      </p>

      <div className={styles.steps} role="tablist" aria-label="What happened">
        {STEPS.map((s, i) => (
          <button
            key={s.year}
            type="button"
            role="tab"
            aria-selected={step === i}
            className={`${styles.stepBtn} ${step === i ? styles.stepOn : ""}`}
            onClick={() => setStep(i)}
          >
            {s.year}
          </button>
        ))}
      </div>
      <p className={styles.caption} aria-live="polite">{STEPS[step].text}</p>

      <div className={styles.mapWrap}>
        <svg viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} className={styles.map} role="img" aria-label="Map of south east England showing the 15 mile circle around Charing Cross where dog carts were banned">
          <polygon points={GB.map((p) => px(p).join(",")).join(" ")} className={styles.land} />
          {/* The map has to move with the story (owner, 22 Sept 2026): the circle
              fills red once the ban bites in 1840, and the whole country turns red
              in 1854 when the ban spreads. */}
          {step >= 2 && <polygon points={GB.map((p) => px(p).join(",")).join(" ")} className={styles.banned} />}
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} className={step >= 1 ? styles.ringOn : styles.ring} />
          {TOWNS.map((t) => {
            const [tx, ty] = px(t.at);
            return (
              <g key={t.name}>
                <circle cx={tx} cy={ty} r={t.name === "London" ? 4 : 2.6} className={styles.town} />
                <text x={t.left ? tx - 5 : tx + 5} y={ty + 3} textAnchor={t.left ? "end" : "start"} className={styles.townLabel}>
                  {t.name}
                </text>
              </g>
            );
          })}
          <text x={cx} y={cy - ry - 5} textAnchor="middle" className={styles.ringLabel}>
            15 miles from Charing Cross
          </text>
          <text x={VIEW.x + VIEW.w / 2} y={VIEW.y + VIEW.h - 8} textAnchor="middle" className={styles.mapNote}>
            {step === 0 ? "Dog carts still legal everywhere" : step === 1 ? "Banned inside the circle" : "Banned across England and Wales"}
          </text>
        </svg>
      </div>

      <div className={styles.dogs}>
        <span className={styles.dogsTitle}>Each dot is 100 dogs</span>
        <div className={styles.dogGrid} aria-hidden="true">
          {Array.from({ length: 30 }, (_, i) => (
            <span key={i} className={`${styles.dogDot} ${i < lost ? styles.dogGone : ""}`} />
          ))}
        </div>
        <p className={styles.dogsText}>
          {step >= 1 ? "More than 3,000 dogs, gone from one clause in one law." : "Around 3,000 dogs were pulling carts in and around London."}
        </p>
      </div>

      <p className={styles.note}>
        The law was meant kindly: campaigners said cart work was cruel, and the RSPCA pushed for it. But nobody made a plan for the dogs, and the dogs paid for it.
      </p>
    </section>
  );
}
