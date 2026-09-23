"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./XolotlPanel.module.css";
import { WORLD_PATHS, lonX, latY } from "../../data/worldOutline";

/* XOLOTL AND THE DOG THAT OUTLIVED HIM.

   Moved out of the trail map and given his own panel on 23 September 2026
   (owner). He never belonged on that trail: the Aztecs had no contact with Egypt,
   Greece, India or Britain and arrived at the same idea anyway, which is the
   essay's strongest evidence that this is a human reflex rather than a borrowed
   story. Standing alone makes the point better than a marker did.

   THE STORY THE TIMELINE TELLS. Xolotl is the only death-dog in the essay whose
   religion was deliberately destroyed, and whose actual dog nearly went with it.
   The Xoloitzcuintli is named for him, the conquistadors ate it close to
   extinction, and it was saved in the 1950s by an expedition that found ten dogs.
   That is a dog story, not a mythology footnote, which is why it earns a panel.

   Sources: National Geographic, "This hairless Mexican dog has a storied, ancient
   past" (conquistadors' appetite, near-extinction, 1956 recognition); American
   Kennel Club breed history (European breeds, retreat to mountain villages);
   Xoloitzcuintli Club of America and Wikipedia (the 1954 Xolo Expedition led by
   Norman Pelham Wright, ten dogs, standard adopted 1 May 1956); dates for the
   founding of Tenochtitlan, Cortes's landing at Veracruz in 1519 and the fall of
   the city in 1521 are standard history. */

type Stop = {
  id: string;
  year: string;
  heading: string;
  body: string;
  at?: [number, number]; // lon, lat
  place?: string;
  labelLeft?: boolean;
};

const STOPS: Stop[] = [
  {
    id: "ancient",
    year: "about 1500 BC",
    heading: "The dog arrives first",
    body: "Hairless dogs are living in Mesoamerica at least three and a half thousand years ago, long before the Aztecs. Clay figures of them turn up in tombs across Mexico, most famously at Colima.",
    at: [-103.7, 19.2],
    place: "Colima",
    labelLeft: true,
  },
  {
    id: "tenochtitlan",
    year: "1325",
    heading: "Tenochtitlan is founded",
    body: "The Aztec capital rises on an island in Lake Texcoco. Xolotl, god of lightning and death, guides the sun through the underworld each night, and his dog guides the dead through Mictlan.",
    at: [-99.13, 19.43],
    place: "Tenochtitlan",
  },
  {
    id: "dogofxolotl",
    year: "before 1519",
    heading: "The dog of Xolotl",
    body: "The Xoloitzcuintli takes its name from the god: Xolotl plus itzcuintli, dog. Aztec belief held that the god made it from a sliver of the Bone of Life. Dogs were buried with their owners to guide them across.",
    at: [-99.13, 19.43],
    place: "Tenochtitlan",
  },
  {
    id: "cortes",
    year: "1519",
    heading: "The conquistadors land",
    body: "Cortes comes ashore near Veracruz with roughly six hundred men. Within two years the city is gone, and with it the official religion that had given the dog its meaning.",
    at: [-96.13, 19.19],
    place: "Veracruz",
  },
  {
    id: "fall",
    year: "1521",
    heading: "Tenochtitlan falls",
    body: "The capital is taken and the gods are outlawed. Temples come down, codices are burned, and Xolotl stops being a god anyone is allowed to name. Unlike Anubis, he was not forgotten. He was removed.",
    at: [-99.13, 19.43],
    place: "Tenochtitlan",
  },
  {
    id: "eaten",
    year: "1500s to 1800s",
    heading: "And they ate the dog",
    body: "The settlers developed a taste for it. European breeds arrived and bred into what was left. By the nineteenth century the Xolo survived only in remote mountain villages, a sacred animal reduced to a rarity.",
  },
  {
    id: "expedition",
    year: "1954",
    heading: "Ten dogs in Guerrero",
    body: "Facing extinction, the Mexican Kennel Club sent an expedition into the countryside under Norman Pelham Wright. It came back from the Rio Balsas country with ten pure Xolos. Every Xolo alive descends from them.",
    at: [-100.5, 17.9],
    place: "Rio Balsas",
    labelLeft: true,
  },
  {
    id: "national",
    year: "1956",
    heading: "The god's dog, saved",
    body: "The breed standard is adopted on 1 May 1956 and the Xolo is recognised in its own country. The god was destroyed in two years. His dog took four centuries to nearly die, and came back.",
    at: [-99.13, 19.43],
    place: "Mexico City",
  },
];

/* Cropped to central Mexico: Colima in the west, Veracruz on the Gulf. */
const VIEW = { x: 222, y: 200, w: 40, h: 26 };
const px = (at: [number, number]) => [lonX(at[0]), latY(at[1])] as const;
const PLAY_MS = 2000;

export default function XolotlPanel() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const open = STOPS[step];

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setStep((v) => {
        const n = v + 1;
        if (n >= STOPS.length - 1) setPlaying(false);
        return Math.min(STOPS.length - 1, n);
      });
    }, PLAY_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing]);

  const togglePlay = () => {
    if (!playing && step >= STOPS.length - 1) setStep(0);
    setPlaying((p) => !p);
  };

  /* The conquest years are marked on the map itself, so the moment the religion
     is destroyed is visible rather than only described. */
  const conquered = step >= STOPS.findIndex((s) => s.id === "fall");

  return (
    <section className={styles.panel} aria-labelledby="xolotl-title">
      <h2 id="xolotl-title" className={`display ${styles.title}`}>
        The God They <span className="display-yellow">Destroyed</span>
      </h2>
      <p className={styles.intro}>
        The Aztecs never met any of the others, and arrived at the same idea anyway. Then Spain arrived, and this
        is the only death-dog in the essay whose religion was deliberately wiped out, and whose real dog nearly
        went with it.
      </p>

      <div className={styles.controls}>
        <button type="button" className={styles.play} onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
          {playing ? (
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
              <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M8 5v14l11-7z" fill="currentColor" />
            </svg>
          )}
        </button>
        <input
          type="range"
          min={0}
          max={STOPS.length - 1}
          step={1}
          value={step}
          onChange={(e) => {
            setPlaying(false);
            setStep(Number(e.target.value));
          }}
          className={styles.slider}
          aria-label="Move through the story"
          aria-valuetext={`${open.year}, ${open.heading}`}
        />
        <span className={styles.stepWhen}>{open.year}</span>
      </div>

      <div className={styles.mapWrap}>
        <svg
          viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
          className={styles.map}
          role="img"
          aria-label={`Map of central Mexico in ${open.year}: ${open.heading}`}
        >
          {WORLD_PATHS.map((d, i) => (
            <path key={i} d={d} className={`${styles.land}${conquered ? " " + styles.landAfter : ""}`} />
          ))}

          {/* The Spanish arrival, drawn as a line in off the Gulf. */}
          {step >= STOPS.findIndex((s) => s.id === "cortes") && (
            <line
              x1={lonX(-93)}
              y1={latY(20.6)}
              x2={lonX(-96.13)}
              y2={latY(19.19)}
              className={styles.invasion}
            />
          )}

          {STOPS.filter((s) => s.at).map((s, i) => {
            const [cx, cy] = px(s.at as [number, number]);
            const on = s.id === open.id;
            return (
              <g key={`${s.id}-${i}`} className={styles.spot} onClick={() => setStep(STOPS.indexOf(s))}>
                <circle cx={cx} cy={cy} r={on ? 1.6 : 1.1} className={on ? styles.dotOn : styles.dot} />
                {on && (
                  <text
                    x={s.labelLeft ? cx - 2.2 : cx + 2.2}
                    y={cy + 0.7}
                    textAnchor={s.labelLeft ? "end" : "start"}
                    className={styles.label}
                  >
                    {s.place}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className={styles.card} aria-live="polite">
        <div className={styles.cardTop}>
          <Image src="/Xolotl-profile.png" alt="" width={96} height={96} className={styles.portrait} unoptimized />
          <div className={styles.cardNames}>
            <p className={styles.cardHead}>
              <span className={styles.cardPlace}>Mexico</span>
              <span className={styles.cardWhen}>{open.year}</span>
            </p>
            <p className={styles.cardFigure}>{open.heading}</p>
          </div>
        </div>
        <p className={styles.cardBody}>{open.body}</p>
      </div>

      <p className={styles.note}>
        Simplified map. Dates are the standard ones for the founding of Tenochtitlan, the landing at Veracruz and
        the fall of the city; the breed dates come from the 1954 expedition and the standard adopted in 1956.
      </p>
    </section>
  );
}
