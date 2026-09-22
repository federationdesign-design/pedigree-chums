"use client";

import { useState } from "react";
import styles from "./DickinMap.module.css";
import { lonX, latY } from "../../data/worldOutline";
import { EUROPE_PATHS } from "../../data/europeOutline";

/* The Dickin Medal map. The 1900s era page, added 22 September 2026 at the
   owner's request. Copy flagged for owner review.

   Sources: the PDSA Dickin Medal, founded December 1943 by Maria Dickin, founder
   of the PDSA, and known as the animals' Victoria Cross; 54 medals between 1943
   and 1949, and 75 recipients to date including 38 dogs (PDSA; Historic England
   blog; Wikipedia, Dickin Medal). Each dog's citation below follows the PDSA roll
   of honour and the Wikipedia table. Places are where the dog did the work, not
   where the medal was given, and are marked at map scale only. */

/* Europe and North Africa only (owner, 22 Sept 2026): Judy served in the Far
   East, and keeping her on the map shrank Europe to nothing, so she is a note
   under the card instead. Marker and label sizes scale with the window. */
const VIEW = { x: 504, y: 96, w: 102, h: 88 };
const S = VIEW.w / 420;

type Dog = {
  name: string;
  breed: string;
  year: number;
  at: [number, number];
  place: string;
  story: string;
  left?: boolean;
  /* Label nudge in map units, about 5.5px each (owner, 22 Sept 2026). */
  dy?: number;
};

const DOGS: Dog[] = [
  { name: "Rip", breed: "Mongrel", year: 1945, at: [-0.13, 51.5], place: "London", left: true, story: "A stray taken in by an air raid warden, and the first search and rescue dog of the Air Raid Patrol. He is believed to have found more than 100 people buried in the Blitz." },
  { name: "Beauty", breed: "Wire-haired terrier", year: 1945, at: [-0.5, 52.4], place: "London", left: true, story: "The pioneer at locating buried air-raid victims, working with a PDSA rescue squad. She dug out 63 animals herself." },
  { name: "Jet and Irma", breed: "Alsatians", year: 1945, at: [1.2, 53.2], place: "London", story: "Civil Defence rescue dogs who worked the wreckage of bombed buildings, finding people trapped underneath." },
  { name: "Rob", breed: "Collie", year: 1945, at: [9.5, 34], place: "North Africa", story: "A farm collie who joined the SAS and made more than 20 parachute jumps during the North African campaign." },
  { name: "Brian", breed: "Alsatian", year: 1947, at: [-0.6, 49.3], place: "Normandy", left: true, story: "A patrol dog with a parachute battalion. He landed in Normandy with them and, once he had done the jumps, was a qualified paratrooper." },
  { name: "Rifleman Khan", breed: "Alsatian", year: 1945, at: [3.6, 51.5], place: "Walcheren", dy: -0.9, story: "A family pet lent to the army. When his landing craft was hit he swam back through the water to drag his handler ashore." },
  { name: "Ricky", breed: "Welsh collie", year: 1947, at: [5.75, 51.28], place: "Nederweert", dy: 1.45, story: "He was clearing mines along a canal bank in Holland when one exploded. Wounded in the head, he stayed calm and kept working." },
  { name: "Antis", breed: "Alsatian", year: 1949, at: [14.4, 50.1], place: "Czechoslovakia", story: "He flew with a Czech airman in the RAF, then years later helped his owner escape across the frontier." },
];

export default function DickinMap() {
  const [pick, setPick] = useState(0);
  const dog = DOGS[pick];

  return (
    <section className={styles.panel} aria-labelledby="dickin-title">
      <h2 id="dickin-title" className={`display ${styles.title}`}>
        The Animals&rsquo; <span className="display-yellow">Victoria Cross</span>
      </h2>
      <p className={styles.intro}>
        In 1943 Maria Dickin founded a medal for animals: the animals&rsquo; Victoria Cross. Four years after the panic, Britain was pinning bronze on dogs. Tap a marker.
      </p>

      <div className={styles.mapWrap}>
        <svg viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} className={styles.map} role="img" aria-label="Map showing where Dickin Medal dogs served">
          {EUROPE_PATHS.map((d, i) => (
            <path key={i} d={d} className={styles.land} />
          ))}
          {DOGS.map((d, i) => {
            const cx = lonX(d.at[0]);
            const cy = latY(d.at[1]);
            return (
              <g key={d.name} onClick={() => setPick(i)} className={styles.hit}>
                <circle cx={cx} cy={cy} r={(i === pick ? 7 : 5) * S} className={i === pick ? styles.pinOn : styles.pin} />
                <text
                  x={d.left ? cx - 9 * S : cx + 9 * S}
                  y={cy + 3.5 * S + (d.dy ?? 0)}
                  textAnchor={d.left ? "end" : "start"}
                  fontSize={9 * S}
                  className={styles.pinLabel}
                >
                  {d.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className={styles.card} aria-live="polite">
        <span className={styles.cardMeta}>{`${dog.breed} · ${dog.place} · medal ${dog.year}`}</span>
        <h3 className={`display ${styles.cardName}`}>{dog.name}</h3>
        <p className={styles.cardStory}>{dog.story}</p>
      </div>

      <p className={styles.aside}>
        <strong>Off the map:</strong> Judy, a pointer, was ship&rsquo;s dog on HMS Gnat and HMS Grasshopper and ended up in a prisoner of war camp in Sumatra, where she kept the prisoners going. She got her medal in 1946.
      </p>

      <p className={styles.note}>
        The medal has gone to 75 animals so far, 38 of them dogs, along with pigeons, horses and one cat. Markers show roughly where each dog served.
      </p>
    </section>
  );
}
