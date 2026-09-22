"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import styles from "./BreedExplosion.module.css";
import { ukBreeds } from "../../data/uk-breeds";

/* The Breed Explosion: how many of Britain's breeds appear in each decade of the
   1800s. The 1800s era page, added 22 September 2026 at the owner's request.

   THE DATA IS OUR OWN. Each bar counts the breeds in data/uk-breeds.ts whose
   anchor year falls in that decade, so the chart updates itself whenever the
   catalogue changes. Anchors are ordering devices, not researched founding dates,
   which is why the note under the chart says "roughly when". The three markers
   are standard history: the first organised dog show at Newcastle in 1859, the
   Kennel Club in 1873 and the first Crufts in 1891. */

const FROM = 1800;
const TO = 1900;
/* Only the Kennel Club is marked now (owner, 22 Sept 2026): the 1859 first show
   and 1891 first Crufts lines were removed. */
const MARKS: { year: number; text: string }[] = [{ year: 1873, text: "Kennel Club" }];

const W = 620;
const H = 300;
const PAD = { l: 34, r: 14, t: 34, b: 46 };

export default function BreedExplosion() {
  const decades = useMemo(() => {
    const out: { decade: number; dogs: { name: string; image?: string }[] }[] = [];
    for (let d = FROM; d < TO; d += 10) {
      out.push({
        decade: d,
        dogs: ukBreeds
          .filter((b) => b.anchor >= d && b.anchor < d + 10)
          .map((b) => ({ name: b.name, image: b.image }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      });
    }
    return out;
  }, []);

  const [open, setOpen] = useState<number | null>(1870);
  const max = Math.max(...decades.map((d) => d.dogs.length), 1);
  const bw = (W - PAD.l - PAD.r) / decades.length;
  const bx = (i: number) => PAD.l + i * bw;
  const by = (n: number) => H - PAD.b - (n / max) * (H - PAD.t - PAD.b);
  const chosen = decades.find((d) => d.decade === open);

  return (
    <section className={styles.panel} aria-labelledby="breed-explosion-title">
      <h2 id="breed-explosion-title" className={`display ${styles.title}`}>
        The Breed <span className="display-yellow">Explosion</span>
      </h2>
      <p className={styles.intro}>
        Once shows began, how a dog looked started to matter as much as what it did. Britain went breed mad. Tap a bar to see which dogs arrived.
      </p>

      <div className={styles.chartWrap}>
        <svg viewBox={`0 0 ${W} ${H}`} className={styles.chart} role="img" aria-label="Bar chart of how many British breeds appear in each decade of the 1800s, peaking in the 1870s">
          {decades.map((d, i) => {
            const n = d.dogs.length;
            const on = d.decade === open;
            return (
              <g key={d.decade} onClick={() => setOpen(d.decade)} className={styles.barHit}>
                <rect x={bx(i) + 3} y={by(n)} width={bw - 6} height={H - PAD.b - by(n)} className={on ? styles.barOn : styles.bar}>
                  <title>{`${d.decade}s: ${n} breeds`}</title>
                </rect>
                <text x={bx(i) + bw / 2} y={by(n) - 5} textAnchor="middle" className={styles.barNum}>
                  {n}
                </text>
                <text x={bx(i) + bw / 2} y={H - PAD.b + 14} textAnchor="middle" className={styles.axis}>
                  {`${d.decade}s`}
                </text>
              </g>
            );
          })}
          {/* After the bars, so the dashed line sits on top (owner, 22 Sept 2026). */}
          {MARKS.map((m) => {
            const x = PAD.l + ((m.year - FROM) / (TO - FROM)) * (W - PAD.l - PAD.r);
            return (
              <g key={m.year}>
                <line x1={x} x2={x} y1={PAD.t - 12} y2={H - PAD.b} className={styles.markLine} />
                <text x={x} y={PAD.t - 16} textAnchor="middle" className={styles.markText}>
                  {m.text} {m.year}
                </text>
              </g>
            );
          })}
          <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} className={styles.axisLine} />
        </svg>
      </div>

      {/* Tag wall of the decade's dogs, each with its round portrait where the
          catalogue has one (owner, 22 Sept 2026). */}
      <div className={styles.picked} aria-live="polite">
        <span className={styles.pickedTitle}>
          {chosen ? (
            <>
              <span className={styles.pickedYears}>{`${chosen.decade}s:`}</span> {`${chosen.dogs.length} dogs`}
            </>
          ) : (
            "Tap a bar"
          )}
        </span>
        <ul className={styles.tagWall}>
          {chosen?.dogs.map((dog) => (
            <li key={dog.name} className={styles.tag}>
              {dog.image ? (
                <Image src={encodeURI(dog.image)} alt="" width={40} height={40} className={styles.tagImg} unoptimized />
              ) : (
                <span className={styles.tagImg} aria-hidden="true" />
              )}
              <span className={styles.tagName}>{dog.name}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className={styles.note}>
        Each bar counts the dogs in our own timeline by roughly when they appear, so it shows the shape of the boom rather than exact founding dates.
      </p>
    </section>
  );
}
