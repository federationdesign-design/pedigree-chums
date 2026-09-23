"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./AnubisPanel.module.css";
import { WORLD_PATHS, lonX, latY } from "../../data/worldOutline";

/* ANUBIS: THE FIRST OF THE SIX PER-GOD PANELS (owner chose option B on
   23 September 2026: six separate components rather than one driven by data, so
   each god can have the map and the devices its own story needs).

   THE STORY THIS ONE TELLS. Anubis is the only god in the essay who was demoted.
   He runs the underworld for a thousand years, Osiris takes the throne from him,
   and he is left with the work: embalming, guiding, and holding the scales. Then
   the job turns industrial. Nearly eight million animals, ninety-two per cent of
   them dogs, were bred, killed and mummified as offerings to him at North
   Saqqara. The god of a decent death, supplied by puppy farms.

   Sources: Nicholson, Ikram and Mills, "The Catacombs of Anubis at North
   Saqqara", Antiquity 89 (2015), for the catacomb estimate of about 7.7 million,
   the 92 per cent figure and the Late Period to Roman date range; Salima Ikram in
   NPR coverage of the same study for the breeding of animals to be offered;
   British Museum Book of the Dead material for the weighing of the heart; the
   closure of the temples under Theodosius and the last dated hieroglyphic
   inscription at Philae in AD 394 are standard history. */

type Stop = {
  id: string;
  year: string;
  heading: string;
  body: string;
  at?: [number, number]; // lon, lat
  place?: string;
  labelLeft?: boolean;
  dx?: number;
  dy?: number;
};

const STOPS: Stop[] = [
  {
    id: "first",
    year: "about 3100 BC",
    heading: "A dog at the edge of the graves",
    body: "Egypt buries its dead at the desert edge, and jackals and pariah dogs dig there. Canine gods appear on the earliest seals. Rather than fight the animal robbing the graves, Egypt gives it the job of guarding them.",
    at: [31.22, 29.87],
    place: "Saqqara",
  },
  {
    id: "oldkingdom",
    year: "about 2600 BC",
    heading: "Lord of the dead",
    body: "For a thousand years Anubis runs the underworld outright. Tomb spells call him He Who Is Upon His Mountain, the one watching the cemetery from the cliffs above it. No other god is closer to the moment of death.",
    at: [31.22, 29.87],
    place: "Saqqara",
  },
  {
    id: "demoted",
    year: "about 2000 BC",
    heading: "The god who was demoted",
    body: "Osiris takes over as lord of the dead. Anubis is not thrown out; he is handed the work. Embalming, guarding, guiding, weighing. The management changes and the dog keeps the night shift.",
    at: [31.92, 26.18],
    place: "Abydos",
    labelLeft: true,
  },
  {
    id: "scales",
    year: "about 1550 BC",
    heading: "He holds the scales",
    body: "In the Book of the Dead, Anubis works the balance: the heart on one pan, the feather of truth on the other. Egypt handed its most sacred task to a dog because a dog could be trusted not to cheat.",
    at: [32.64, 25.7],
    place: "Thebes",
  },
  {
    id: "catacombs",
    year: "747 to 332 BC",
    heading: "The catacombs open",
    body: "Pilgrims come to Saqqara to buy a mummified dog and leave it for the god, the way a visitor might light a candle. Tunnels are cut to hold them, and the offering becomes an industry.",
    at: [31.22, 29.87],
    place: "North Saqqara",
  },
  {
    id: "millions",
    year: "by about AD 30",
    heading: "Nearly eight million dogs",
    body: "The Cardiff survey estimates about 7.7 million animals in the catacombs, ninety-two per cent of them dogs, many of them newborn. You do not get eight million mummies without breeding dogs to supply them.",
    at: [31.22, 29.87],
    place: "North Saqqara",
  },
  {
    id: "empire",
    year: "AD 1 to 300",
    heading: "He leaves Egypt",
    body: "Under Rome, Anubis merges with Hermes as Hermanubis and travels with the cult of Isis across the empire, as far as a temple in Roman London. The dog at the door of the dead goes on tour.",
    at: [31.22, 29.87],
    place: "Alexandria",
    dx: -2,
    dy: -2,
  },
  {
    id: "closed",
    year: "AD 380s to 394",
    heading: "The lights go out",
    body: "The old temples are closed by imperial order, and the last dated hieroglyphic inscription is cut at Philae in AD 394. Anubis is not defeated or replaced. The building simply shuts, with the dog still inside.",
    at: [32.89, 24.02],
    place: "Philae",
  },
];

/* Egypt from the delta to Aswan. */
const VIEW = { x: 626, y: 172, w: 34, h: 30 };
const px = (at: [number, number]) => [lonX(at[0]), latY(at[1])] as const;
const PLAY_MS = 2000;

/* The Nile, traced by hand: the coastline data carries no rivers. */
const NILE: [number, number][] = [
  [30.4, 31.5],
  [31.0, 30.6],
  [31.22, 29.9],
  [31.18, 27.18],
  [31.92, 26.18],
  [32.64, 25.7],
  [32.89, 24.02],
];
const nilePath = NILE.map((p, i) => `${i === 0 ? "M" : "L"}${px(p)[0].toFixed(1)},${px(p)[1].toFixed(1)}`).join(" ");

function WhenLabel({ when }: { when: string }) {
  const at = when.indexOf("about ");
  if (at === -1) return <>{when}</>;
  return (
    <>
      {when.slice(0, at + "about".length)}
      <br />
      {when.slice(at + "about".length).trim()}
    </>
  );
}

export default function AnubisPanel() {
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

  /* The temples close at the last step, and the land goes grey with them. */
  const closed = step >= STOPS.findIndex((s) => s.id === "closed");

  return (
    <section className={styles.panel} aria-labelledby="anubis-panel-title">
      <h2 id="anubis-panel-title" className={`display ${styles.title}`}>
        The God They <span className="display-yellow">Demoted</span>
      </h2>
      <p className={styles.intro}>
        Anubis ran the underworld for a thousand years, lost the top job to Osiris, and kept the work. Then Egypt
        turned his worship into an industry that needed dogs by the million.
      </p>

      <ul className={styles.mapKey}>
        <li>
          <span className={`${styles.keySwatch} ${styles.keyNile}`} aria-hidden="true" /> The Nile
        </li>
        <li>
          <span className={`${styles.keySwatch} ${styles.keyBefore}`} aria-hidden="true" /> Egypt of the old gods
        </li>
        <li>
          <span className={`${styles.keySwatch} ${styles.keyAfter}`} aria-hidden="true" /> After the temples close, AD 394
        </li>
      </ul>

      <div className={styles.mapWrap}>
        <svg
          viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
          className={styles.map}
          role="img"
          aria-label={`Map of Egypt in ${open.year}: ${open.heading}`}
        >
          {WORLD_PATHS.map((d, i) => (
            <path key={i} d={d} className={`${styles.land}${closed ? " " + styles.landAfter : ""}`} />
          ))}
          <path d={nilePath} className={styles.nile} />

          {STOPS.filter((s) => s.at).map((s, i) => {
            const [cx, cy] = px(s.at as [number, number]);
            const on = s.id === open.id;
            return (
              <g key={`${s.id}-${i}`} className={styles.spot} onClick={() => setStep(STOPS.indexOf(s))}>
                <circle cx={cx} cy={cy} r={on ? 1.3 : 0.9} className={on ? styles.dotOn : styles.dot} />
                {on && (
                  <text
                    x={(s.labelLeft ? cx - 1.8 : cx + 1.8) + (s.dx ?? 0)}
                    y={cy + 0.6 + (s.dy ?? 0)}
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
        <span className={styles.stepWhen}>
          <WhenLabel when={open.year} />
        </span>
      </div>

      <div className={styles.card} aria-live="polite">
        <div className={styles.cardTop}>
          <Image src="/Anubis-profile.png" alt="" width={96} height={96} className={styles.portrait} unoptimized />
          <div className={styles.cardNames}>
            <p className={styles.cardHead}>
              <span className={styles.cardPlace}>Egypt</span>
              <span className={styles.cardWhen}>{open.year}</span>
            </p>
            <p className={styles.cardFigure}>{open.heading}</p>
          </div>
        </div>
        <p className={styles.cardBody}>{open.body}</p>
      </div>

      <p className={styles.note}>
        Simplified map, with the Nile drawn by hand. Catacomb figures are from Nicholson, Ikram and Mills, The
        Catacombs of Anubis at North Saqqara, Antiquity 2015: about 7.7 million animals, 92 per cent of them dogs.
      </p>
    </section>
  );
}
