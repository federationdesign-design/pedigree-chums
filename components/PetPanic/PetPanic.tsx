"use client";

import { useState } from "react";
import styles from "./PetPanic.module.css";

/* The 1939 pet panic. The 1900s era page, added 22 September 2026 at the owner's
   request. Copy flagged for owner review.

   TONE RULE: this is written for young readers. It says what happened and why,
   names no method, and ends on the people who refused. Do not add detail about
   how the animals were killed.

   Sources: the National Air Raid Precautions Animals Committee pamphlet "Advice
   to Animal Owners", which told owners to send pets to the country and ended
   "if you cannot place them in the care of neighbours, it really is kindest to
   have them destroyed"; about 400,000 cats and dogs in the first days after war
   was declared on 3 September 1939, and an estimated 750,000 by the end, about a
   quarter of the country's pets; the National Canine Defence League, today's Dogs
   Trust, spoke out against it in November 1939 (Wikipedia, British pet massacre;
   Wikipedia, Dogs Trust; Hilda Kean, The Great Cat and Dog Massacre, 2017). */

const STEPS: { label: string; text: string; dots: number }[] = [
  {
    label: "Summer 1939",
    text: "A government committee prints a leaflet for pet owners. Send your animals to the countryside, it says. And if you cannot, it really is kindest to have them destroyed.",
    dots: 0,
  },
  {
    label: "3 Sept 1939",
    text: "War is declared. Queues form outside animal clinics across London, in places half a mile long. Nobody has ordered this. People believe it is the patriotic thing to do.",
    dots: 10,
  },
  {
    label: "First week",
    text: "About 400,000 cats and dogs are gone in a few days. That is roughly a quarter of London's pets, and none of them were ill.",
    dots: 40,
  },
  {
    label: "By 1945",
    text: "An estimated 750,000 pets in total. Many owners regretted it almost at once, and blamed the panic the leaflet had started.",
    dots: 75,
  },
];

export default function PetPanic() {
  const [step, setStep] = useState(0);
  const gone = STEPS[step].dots;

  return (
    <section className={styles.panel} aria-labelledby="pet-panic-title">
      <h2 id="pet-panic-title" className={`display ${styles.title}`}>
        The 1939 Pet <span className="display-yellow">Panic</span>
      </h2>
      <p className={styles.intro}>
        Britain went to war in September 1939. In the first days, hundreds of thousands of families took their pets to be put to sleep. No law told them to.
      </p>

      <div className={styles.steps} role="tablist" aria-label="What happened">
        {STEPS.map((s, i) => (
          <button
            key={s.label}
            type="button"
            role="tab"
            aria-selected={step === i}
            className={`${styles.stepBtn} ${step === i ? styles.stepOn : ""}`}
            onClick={() => setStep(i)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <p className={styles.caption} aria-live="polite">{STEPS[step].text}</p>

      <div className={styles.counter}>
        <span className={styles.big}>{gone === 0 ? "0" : `${(gone * 10000).toLocaleString("en-GB")}`}</span>
        <span className={styles.counterText}>pets, each dot 10,000</span>
      </div>
      {/* Dots empty from the right, so the yellow that is left reads as what
          remains (owner, 22 Sept 2026). */}
      <div className={styles.grid} aria-hidden="true">
        {Array.from({ length: 75 }, (_, i) => (
          <span key={i} className={`${styles.dot} ${i >= 75 - gone ? styles.dotGone : ""}`} />
        ))}
      </div>

      {/* The refusers were a pill; they now close the panel (owner, 22 Sept 2026). */}
      <p className={styles.refusers}>
        Not everyone joined in. The National Canine Defence League, today&rsquo;s Dogs Trust, spoke out against it, and vets, charities and ordinary owners argued to keep animals alive. Within four years Britain would be giving dogs medals.
      </p>

      <p className={styles.note}>
        Figures are estimates from later histories. The leaflet never ordered anything: it was fear, and a single sentence, that did it.
      </p>
    </section>
  );
}
