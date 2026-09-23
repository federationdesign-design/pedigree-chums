"use client";

import { useState } from "react";
import styles from "./DrawnBritain.module.css";
import { GB } from "../SeaLevelMap/SeaLevelMap";

/* HOW WE DREW BRITAIN, 23 September 2026 (owner). The second column on the
   Saxons 'n' Normans page, beside Who Owns Britain. Copy flagged for owner review.

   Four maps, each the best anyone could do at the time, with today's coastline
   ghosted behind so the difference reads at a glance:
     Roman (Ptolemy), about AD 150   Scotland bent east at a right angle
     Anglo-Saxon (the Cotton map), c. 1025   a lumpy oblong at the edge of the
                             known world
     Matthew Paris, c. 1250  the first map where England looks like England
     The Gough map, c. 1360  towns and roads, and a coastline you would recognise

   THE LAST TWO ARE LATER THAN THIS ERA and are here as the pay-off: the shape
   the Saxons and Normans could not draw is finally got right a couple of
   centuries after the Conquest.

   NO NEW MAP DATA. Every frame is the site's own coastline put through a
   transform that reproduces the error that map made, not a trace of the original
   document. Ptolemy's is a real rotation of everything north of the Solway to
   Tyne line; the Cotton map is squashed and widened; Matthew Paris is narrowed
   with the waist pinched at Stirling; Gough is today's shape barely touched. So
   these are impressions of four famous maps, and the note under them says so.

   Sources: Ptolemy's Geography and its rotated Scotland; the Cotton (Anglo-Saxon)
   map, British Library Cotton MS Tiberius B V; Matthew Paris's maps of Britain,
   about 1250; the Gough Map, Bodleian Library, about 1360. */

type LL = [number, number];
const VIEW = { x: 88, y: 168, w: 178, h: 204 };
const project = ([lo, la]: LL): [number, number] => [(lo + 11) * 20, (61 - la) * 33];

/* Everything above this projected y is "the north" for Ptolemy's rotation: the
   Solway to Tyne line, about 55 degrees. */
const NORTH_Y = project([-3, 55])[1];
const PIVOT = project([-2.6, 55]);

const rotateNorth = (p: [number, number]): [number, number] => {
  if (p[1] > NORTH_Y) return p;
  const dx = p[0] - PIVOT[0];
  const dy = p[1] - PIVOT[1];
  /* A quarter turn clockwise, so the north swings east across the top. */
  return [PIVOT[0] - dy * 1.15, PIVOT[1] + dx * 0.72];
};

const squash = (p: [number, number]): [number, number] => {
  const cx = VIEW.x + VIEW.w / 2;
  const cy = VIEW.y + VIEW.h / 2;
  const wobble = Math.sin((p[1] - VIEW.y) / 14) * 5;
  return [cx + (p[0] - cx) * 1.4 + wobble, cy + (p[1] - cy) * 0.78];
};

const pinch = (p: [number, number]): [number, number] => {
  const cx = VIEW.x + VIEW.w / 2;
  /* Narrower overall, and narrower still in the north, where Matthew Paris drew
     Scotland hanging on by a thread at Stirling. */
  const northness = Math.max(0, Math.min(1, (project([-4, 56.2])[1] - p[1]) / 60));
  return [cx + (p[0] - cx) * (0.78 - northness * 0.3), p[1]];
};

const nearlyRight = (p: [number, number]): [number, number] => {
  const cx = VIEW.x + VIEW.w / 2;
  return [cx + (p[0] - cx) * 1.04, p[1]];
};

type Frame = {
  id: string;
  title: string;
  when: string;
  bend: (p: [number, number]) => [number, number];
  caption: string;
};

const FRAMES: Frame[] = [
  {
    id: "ptolemy",
    /* Named by WHO drew it, not the mapmaker (owner, 23 Sept 2026): "Ptolemy"
       and "The Cotton map" meant nothing to a reader arriving here. */
    title: "Roman",
    when: "about AD 150",
    bend: rotateNorth,
    caption: "The Romans mapped Britain from reports and rough measurements, and Scotland came out bent east at a right angle. Nobody corrected it for over a thousand years.",
  },
  {
    id: "cotton",
    title: "Anglo-Saxon",
    when: "about 1025",
    bend: squash,
    caption: "An Anglo-Saxon world map, with Britain a lumpy oblong in the bottom corner. It is not a mistake so much as a different job: this map shows where places sit in the world, not what the coast looks like.",
  },
  {
    id: "paris",
    title: "Matthew Paris",
    when: "about 1250",
    bend: pinch,
    caption: "A monk at St Albans drew the first map where England looks like England. Scotland is still squeezed thin, joined to the rest by a narrow waist at Stirling.",
  },
  {
    id: "gough",
    title: "The Gough map",
    when: "about 1360",
    bend: nearlyRight,
    caption: "Towns, rivers and roads, and a coastline you would recognise today. Three hundred years after the Normans, Britain finally knew its own shape.",
  },
];

const path = (bend: (p: [number, number]) => [number, number]) =>
  GB.map((ll) => bend(project(ll)).map((n) => n.toFixed(1)).join(",")).join(" ");
const today = GB.map((ll) => project(ll).map((n) => n.toFixed(1)).join(",")).join(" ");

export default function DrawnBritain() {
  const [i, setI] = useState(0);
  const frame = FRAMES[i];

  return (
    <section className={styles.panel} aria-labelledby="drawn-britain-title">
      <h2 id="drawn-britain-title" className={`display ${styles.title}`}>
        How We Drew <span className="display-yellow">Britain</span>
      </h2>
      <p className={styles.intro}>
        Nobody living here knew what Britain looked like. It took over a thousand years to get the shape right.
      </p>

      <div className={styles.tabs} role="tablist" aria-label="Old maps of Britain">
        {FRAMES.map((f, n) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={n === i}
            className={`${styles.tab}${n === i ? " " + styles.tabOn : ""}`}
            onClick={() => setI(n)}
          >
            {f.title}
          </button>
        ))}
      </div>

      <p className={styles.when}>{frame.when}</p>
      <p className={styles.caption} aria-live="polite">{frame.caption}</p>

      <div className={styles.mapWrap}>
        <svg viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} className={styles.map} role="img" aria-label={`Britain as drawn by ${frame.title}, ${frame.when}, beside its real shape`}>
          <polygon points={today} className={styles.ghost} />
          <polygon points={path(frame.bend)} className={styles.drawn} />
        </svg>
      </div>

      <ul className={styles.legend}>
        <li><span className={`${styles.swatch} ${styles.swDrawn}`} aria-hidden="true" /> As they drew it</li>
        <li><span className={`${styles.swatch} ${styles.swGhost}`} aria-hidden="true" /> The real shape</li>
      </ul>
      <p className={styles.note}>
        Impressions, not copies. Each outline is Britain&apos;s real coastline put through the mistake that map made, so you can see the error rather than the document.
      </p>
    </section>
  );
}
