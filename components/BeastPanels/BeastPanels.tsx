"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./BeastPanels.module.css";

/* THE THREE PANELS FOR THE HEART OF THE BEAST ESSAY, 23 September 2026 (owner).

   Built to match the Anubis essay's map panels and the era pages: the same blue
   container, the same navy pills, the same small print under a rule.

   BreedFacts   the German Shepherd, using the figures the chum page already
                carries, so the article and the chum page can never disagree.
   RescueRoll   a sliding gallery of the three Dickin Medal dogs. Drawn cards, not
                photographs, because the photographs are PDSA's and this can go
                live without waiting on permission.
   GazeLoop     the 2015 oxytocin study as a circuit: the dog's gaze closes the
                loop, and the wolf control group shows it open.

   All three are client components only because the roll and the loop have a
   selected state; there is no data fetching and no effects. */

/* ---------------------------------------------------------------- BreedFacts */

/* Figures copied from data/breeds.ts (German Shepherd) and data/breed-info.json,
   and the training card from data/trainingDifficulty.ts, so a reader sees the
   same numbers here as on /chums/german-shepherd. */
const SPECS: [string, string][] = [
  ["Size", "Large"],
  ["Height", "77cm"],
  ["Weight", "22 to 40kg"],
  ["Top speed", "48km/h"],
  ["Life span", "up to 13 years"],
  ["Recognised", "1899"],
  ["Look for", "Sloped back"],
  ["Coat", "Short, thick, black and tan"],
];
const TEMPERAMENT = ["Loyal", "Obedient", "Curious", "Alert", "Confident"];
const PROS = ["Highly trainable", "Versatile working dog", "Loyal", "Natural protector"];
const CONS = ["Heavy shedding", "Needs lots of exercise", "Can develop anxiety", "Prone to hip dysplasia"];
const TRAINING = {
  label: "Highly trainable",
  traits: [
    "Focused, driven and quick to learn when properly motivated",
    "Bonds deeply with one handler, which aids consistency",
    "Excels at complex multi-step tasks",
  ],
  goodFor: "Police, military, search and rescue, protection sport",
  watchOut: "Needs firm, consistent handling from day one. Inconsistency creates anxiety.",
};

export function BreedFacts() {
  const [tab, setTab] = useState<"specs" | "character" | "training">("specs");

  return (
    <section className={styles.panel} aria-labelledby="gsd-title">
      <h2 id="gsd-title" className={`display ${styles.title}`}>
        Meet the <span className="display-yellow">German Shepherd</span>
      </h2>
      <p className={styles.intro}>
        Odin is not a breed chosen for the poster. Everything the film asks of him is on this dog&rsquo;s job
        description, including the line about bonding to one handler.
      </p>

      <div className={styles.tabs} role="tablist" aria-label="German Shepherd facts">
        {([
          ["specs", "The dog"],
          ["character", "Character"],
          ["training", "Training"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`${styles.tab}${tab === id ? " " + styles.tabOn : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={styles.card}>
        <div className={styles.cardTop}>
          {/* The portrait links to the chum page (owner, 23 September 2026). */}
          <Link href="/chums/german-shepherd" className={styles.portraitLink} aria-label="German Shepherd">
            <Image
              src="/german-shepard-square.jpg"
              alt=""
              width={96}
              height={96}
              className={styles.portrait}
              unoptimized
            />
          </Link>
          <div className={styles.cardNames}>
            <p className={styles.cardHead}>
              <span className={styles.cardPlace}>Pack chum</span>
              <span className={styles.cardWhen}>recognised 1899</span>
            </p>
            <p className={styles.cardFigure}>Brains, bravery and boundless loyalty</p>
          </div>
        </div>

        {tab === "specs" && (
          <dl className={styles.specs}>
            {SPECS.map(([k, v]) => (
              <div key={k} className={styles.spec}>
                <dt className={styles.specKey}>{k}</dt>
                <dd className={styles.specVal}>{v}</dd>
              </div>
            ))}
          </dl>
        )}

        {tab === "character" && (
          <div className={styles.cols}>
            <div>
              <p className={styles.colHead}>Temperament</p>
              <ul className={styles.chips}>
                {TEMPERAMENT.map((t) => (
                  <li key={t} className={styles.chip}>{t}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className={styles.colHead}>Pros</p>
              <ul className={styles.bullets}>
                {PROS.map((t) => (
                  <li key={t} className={styles.pro}>{t}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className={styles.colHead}>Cons</p>
              <ul className={styles.bullets}>
                {CONS.map((t) => (
                  <li key={t} className={styles.con}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {tab === "training" && (
          <div>
            <p className={styles.trainLabel}>{TRAINING.label}</p>
            <ul className={styles.bullets}>
              {TRAINING.traits.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <p className={styles.cardBody}>
              <strong>Good for:</strong> {TRAINING.goodFor}
            </p>
            <p className={styles.cardBody}>
              <strong>Watch out:</strong> {TRAINING.watchOut}
            </p>
          </div>
        )}
      </div>

      <p className={styles.note}>
        Figures as shown on the German Shepherd chum page. Heights and weights are breed-standard ranges, not
        measurements of any one dog.
      </p>
    </section>
  );
}

/* ---------------------------------------------------------------- RescueRoll */

type Rescue = {
  id: string;
  name: string;
  breed: string;
  when: string;
  where: string;
  body: string;
  citation: string;
};

const RESCUES: Rescue[] = [
  {
    id: "rip",
    name: "Rip",
    breed: "Mongrel, no training at all",
    when: "1940",
    where: "Poplar, east London",
    body: "A stray, picked up after a raid by air raid warden Mr E. King and adopted as mascot of the Southill Street patrol. Nobody taught him anything. He began finding people under the rubble on his own, and Britain trained search dogs afterwards partly because he had shown it could be done.",
    citation: "Dickin Medal, 1945: for locating many air-raid victims during the blitz of 1940.",
  },
  {
    id: "sheila",
    name: "Sheila",
    breed: "Border collie, a working farm dog",
    when: "16 December 1944",
    where: "The Cheviot Hills",
    body: "A US bomber came down on the hill in fog and snow, still carrying its bombs. Shepherd John Dagg climbed to it with Sheila, who led him to four airmen sheltering in a crevice. They had barely reached the cottage when the bombs went off and blew in two of its windows.",
    citation: "Dickin Medal, 2 July 1945. The first animal with no military connection to receive one.",
  },
  {
    id: "judy",
    name: "Judy",
    breed: "Pointer, a ship's dog",
    when: "1942 to 1945",
    where: "Sumatra",
    body: "She survived a sinking and then three years in Japanese prison camps. Her man, Frank Williams, said she was the reason he came through: not because she fed him or freed him, but because she gave him something to protect.",
    citation: "Dickin Medal, May 1946: for magnificent courage and endurance in Japanese prison camps.",
  },
];

export function RescueRoll() {
  return (
    <section className={styles.panel} aria-labelledby="rescue-title">
      <h2 id="rescue-title" className={`display ${styles.title}`}>
        The Dogs Who <span className="display-yellow">Would Not Leave</span>
      </h2>
      <p className={styles.intro}>
        Britain has a medal for this. Swipe through three of the dogs who earned it, none of whom were doing
        anything they had been told to do.
      </p>

      {/* A plain snap-scrolling row: the next card peeks in as the swipe cue, and
          nothing here fights the page's own vertical scroll. */}
      <div className={styles.roll}>
        {RESCUES.map((r) => (
          <article key={r.id} className={styles.rollCard}>
            <p className={styles.cardHead}>
              <span className={styles.cardPlace}>{r.where}</span>
              <span className={styles.cardWhen}>{r.when}</span>
            </p>
            <p className={styles.cardFigure}>{r.name}</p>
            <p className={styles.rollBreed}>{r.breed}</p>
            <p className={styles.cardBody}>{r.body}</p>
            <p className={styles.rollCitation}>{r.citation}</p>
          </article>
        ))}
      </div>

      <p className={styles.note}>
        Citations from the PDSA Dickin Medal roll. Rip is often credited with more than a hundred lives and Judy
        with being the only dog registered as a prisoner of war; neither detail is in the citations, so neither is
        relied on here.
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ GazeLoop */

export function GazeLoop() {
  const [wolf, setWolf] = useState(false);

  return (
    <section className={styles.panel} aria-labelledby="gaze-title">
      <h2 id="gaze-title" className={`display ${styles.title}`}>
        The Loop That <span className="display-yellow">Closes</span>
      </h2>
      <p className={styles.intro}>
        In 2015 a team at Azabu University measured what happens when a dog looks at its owner. Then they ran it
        again with wolves. Switch between the two.
      </p>

      <div className={styles.tabs} role="tablist" aria-label="Dogs or wolves">
        <button
          type="button"
          role="tab"
          aria-selected={!wolf}
          className={`${styles.tab}${!wolf ? " " + styles.tabOn : ""}`}
          onClick={() => setWolf(false)}
        >
          Dog and owner
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={wolf}
          className={`${styles.tab}${wolf ? " " + styles.tabOn : ""}`}
          onClick={() => setWolf(true)}
        >
          Wolf and handler
        </button>
      </div>

      <div className={styles.mapWrap}>
        {/* AN INFINITY SYMBOL, not two circles joined by a line (owner, 23 September
            2026). The point of the 2015 finding is that this is one continuous
            circuit with no beginning: the dog's gaze raises the owner's oxytocin,
            the owner's response raises the dog's, and round it goes. A lemniscate
            says that in one shape. The wolf version is the same figure drawn
            broken, because the circuit never closes. */}
        <svg viewBox="0 0 340 180" className={styles.map} role="img" aria-label={wolf ? "The loop between wolf and handler, drawn broken because it never closes" : "The loop between dog and owner, drawn as a continuous infinity symbol"}>
          <defs>
            <path
              id="gaze-loop-path"
              d="M170,90 C140,34 66,34 66,90 C66,146 140,146 170,90 C200,34 274,34 274,90 C274,146 200,146 170,90 Z"
            />
          </defs>

          {/* The circuit itself. */}
          <use href="#gaze-loop-path" className={wolf ? styles.loopOff : styles.loop} />

          {/* Which way it runs. Hidden on the wolf version, where nothing runs. */}
          {!wolf && (
            <>
              <polygon points="116,42 126,46 116,51" className={styles.flow} />
              <polygon points="224,138 214,134 224,129" className={styles.flow} />
            </>
          )}

          <text x={104} y={86} textAnchor="middle" className={styles.nodeLabel}>{wolf ? "WOLF" : "DOG"}</text>
          <text x={104} y={102} textAnchor="middle" className={styles.nodeSub}>{wolf ? "looks away" : "gazes"}</text>

          <text x={236} y={86} textAnchor="middle" className={styles.nodeLabel}>HUMAN</text>
          <text x={236} y={102} textAnchor="middle" className={styles.nodeSub}>{wolf ? "no change" : "oxytocin up"}</text>

          <text x={170} y={22} textAnchor="middle" className={styles.armLabel}>
            {wolf ? "the look never comes" : "the look"}
          </text>
          <text x={170} y={170} textAnchor="middle" className={styles.armLabel}>
            {wolf ? "so nothing comes back" : "attention, touch, talk"}
          </text>
        </svg>
      </div>

      <div className={styles.card}>
        <p className={styles.cardFigure}>{wolf ? "The circuit stays open" : "The circuit closes"}</p>
        <p className={styles.cardBody}>
          {wolf
            ? "Wolves raised by the very people testing them did not hold human eye contact in the same way, and the hormone exchange did not follow. Whatever this is, dogs acquired it after the two split."
            : "Owners whose dogs gazed at them most showed the biggest rise in oxytocin, the hormone of parent and infant bonding, and their dogs rose with them. Give a dog oxytocin and it gazes more, which raises the owner's in turn. The loop can be started from either end."}
        </p>
      </div>

      <p className={styles.note}>
        Nagasawa and colleagues, Science, 2015. One study, partly replicated since, with effects that vary by the
        dog&rsquo;s sex, breed and history. Oxytocin is not a love potion, and nobody serious says it is.
      </p>
    </section>
  );
}
