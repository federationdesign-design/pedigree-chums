"use client";

import { useState } from "react";
import styles from "./CaiusDogs.module.css";

/* Caius's dog family tree: John Caius's 1570s sorting of England's dogs, from De
   Canibus Britannicis (Latin) and Abraham Fleming's 1576 English translation, Of
   Englishe Dogges (Project Gutenberg #27050, public domain). Tudor 'n' Stuart era
   page, added 22 Sept 2026 at the owner's request. The groups and names follow
   Caius's own diagram; the job lines are our plain-English retelling; the
   "Today" lines are our hedged pointers to modern relatives, not pedigrees.
   Copy flagged for owner review. */

type Dog = { id: string; name: string; old: string; job: string; today: string };
type Group = { label: string; dogs: Dog[] };
type Kind = { id: string; title: string; caius: string; groups: Group[] };

const KINDS: Kind[] = [
  {
    id: "gentle",
    title: "Gentle",
    caius: "Dogs \"of a gentle kinde, seruing the game\"",
    groups: [
      {
        label: "Hunting",
        dogs: [
          { id: "harrier", name: "Harrier", old: "Harier", job: "Hunted by smell, with long droopy lips and hanging ears. Each one had its favourite quarry: hare, fox, otter, badger and more.", today: "The Harrier and Beagle families." },
          { id: "terrier", name: "Terrier", old: "Terrare", job: "The smallest scent hound. It crept down into burrows after foxes and badgers, and nipped them until they bolted.", today: "Britain's many terriers." },
          { id: "bloodhound", name: "Bloodhound", old: "Blud-hunde", job: "Followed the scent of blood, and was trained to track cattle thieves on the border between England and Scotland.", today: "The Bloodhound." },
          { id: "gazehound", name: "Gazehound", old: "Gasehunde", job: "Hunted by sight, not smell. It picked out one animal from a whole herd and chased it down.", today: "A lost type, though today's sighthounds hunt the same way." },
          { id: "greyhound", name: "Greyhound", old: "Grehunde", job: "The fastest of all, chasing hares, deer and foxes. Caius said its name meant it was top of the dogs.", today: "The Greyhound." },
          { id: "leviner", name: "Leviner or Lyemmer", old: "Leviner, or Lyemmer", job: "Halfway between a harrier and a greyhound: a good nose and fast legs. It was led on a leash called a lyam.", today: "Most like today's lurchers." },
          { id: "tumbler", name: "Tumbler", old: "Tumbler", job: "A trickster. It pretended to ignore the rabbits, lay low by their burrow, then pounced as they came home.", today: "A lost type." },
          { id: "stealer", name: "Stealer", old: "Night curre", job: "Hunted rabbits silently in the dark and carried them back to its master.", today: "A lost type." },
        ],
      },
      {
        label: "Bird dogs",
        dogs: [
          { id: "spaniel", name: "Land spaniel", old: "Spainel", job: "Found and flushed birds for the hunter's hawk. Most were white with big red spots.", today: "Springer and Cocker Spaniels." },
          { id: "setter", name: "Setter", old: "Setter", job: "Crept along silently, then lay down to show exactly where the partridges were hiding, ready for the net.", today: "The English Setter." },
          { id: "water", name: "Water spaniel", old: "Water-spainel, or Fynder", job: "Swam out for ducks, and fetched back arrows that missed their target.", today: "The Irish Water Spaniel. England's own water spaniel is extinct." },
        ],
      },
      {
        label: "Lapdogs",
        dogs: [
          { id: "comforter", name: "Comforter", old: "Spainel-gentle, or Comforter", job: "A tiny pet for fine ladies. People believed its warmth could ease a sore tummy.", today: "Toy spaniels such as the Cavalier King Charles." },
        ],
      },
    ],
  },
  {
    id: "homely",
    title: "Homely",
    caius: "Dogs \"of a homely kind, apt for sundry necessary vses\"",
    groups: [
      {
        label: "Working",
        dogs: [
          { id: "shepherd", name: "Shepherd's dog", old: "Shepherd's Dog", job: "Moved the sheep at a whistle. Caius noticed that in England the shepherd follows the sheep, not the other way round.", today: "Today's sheepdogs and collies." },
          { id: "mastiff", name: "Mastiff or Bandog", old: "Mastive, or Bandedogge", job: "A huge guard dog, chained up by day and let loose at night. Sadly it was also made to fight bears and bulls.", today: "The Mastiff and the bulldogs." },
        ],
      },
    ],
  },
  {
    id: "currish",
    title: "Currish",
    caius: "Dogs \"of a currishe kinde, meete for many toyes\"",
    groups: [
      {
        label: "Odd jobs",
        dogs: [
          { id: "wappe", name: "Wappe", old: "Wappe, or Warner", job: "Barked to tell the house that visitors had arrived: a furry doorbell.", today: "A lost type." },
          { id: "turnspit", name: "Turnspit", old: "Turnespete", job: "Ran inside a wooden wheel in the kitchen to turn the meat roasting over the fire.", today: "Extinct." },
          { id: "dancer", name: "Dancer", old: "Daunser", job: "Taught by travelling showmen to dance to drums and harps, stand on its hind legs and beg.", today: "A lost type." },
        ],
      },
    ],
  },
];

const ALL = KINDS.flatMap((k) => k.groups.flatMap((g) => g.dogs.map((d) => ({ ...d, kind: k.title }))));

export default function CaiusDogs() {
  const [sel, setSel] = useState("turnspit");
  const dog = ALL.find((d) => d.id === sel) ?? ALL[0];

  return (
    <section className={styles.panel} aria-labelledby="caius-title">
      <h2 id="caius-title" className={`display ${styles.title}`}>
        1st Book of <span className="display-yellow">Dogs</span>
      </h2>
      <p className={styles.intro}>
        In 1576 Doctor John Caius sorted England&apos;s dogs into three kinds. Tap a dog to see what job it did, and what it became.
      </p>

      <div className={styles.tree}>
        {KINDS.map((k) => (
          <div key={k.id} className={styles.kind}>
            <h3 className={`display ${styles.kindTitle}`}>{k.title}</h3>
            <p className={styles.kindQuote}>{k.caius}</p>
            {k.groups.map((g) => (
              <div key={g.label} className={styles.group}>
                <span className={styles.groupLabel}>{g.label}</span>
                <div className={styles.chips}>
                  {g.dogs.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      className={styles.chip}
                      aria-pressed={sel === d.id}
                      onClick={() => setSel(d.id)}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className={styles.card} aria-live="polite">
        <span className={styles.cardKind}>{dog.kind} kind</span>
        <h3 className={`display ${styles.cardName}`}>{dog.name}</h3>
        <p className={styles.cardOld}>Caius called it: &ldquo;{dog.old}&rdquo;</p>
        <p className={styles.cardJob}>{dog.job}</p>
        <p className={styles.cardToday}>
          <span className={styles.todayLabel}>Today:</span> {dog.today}
        </p>
      </div>

      <p className={styles.note}>
        Source: John Caius, Of Englishe Dogges, translated by Abraham Fleming, 1576 (public domain, Project Gutenberg).
      </p>
    </section>
  );
}
