"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./know.module.css";

type Bar = { name: string; pct: number; img: string | null; label?: string; w?: number };

// RVC VetCompass (O'Neill et al. 2023), UK 2019 demography.
const ALL_AGES: Bar[] = [
  { name: "Labrador Retriever", pct: 6.9, img: "/lab-square.png" },
  { name: "Jack Russell Terrier", pct: 4.5, img: "/jack-russel-square.jpg" },
  { name: "English Cocker Spaniel", pct: 4.3, img: "/cocker-square.png" },
  { name: "Staffordshire Bull Terrier", pct: 4.2, img: "/staffy-square.png" },
  { name: "Chihuahua", pct: 3.6, img: "/Chihuahua-square.png" },
];

const PUPPIES: Bar[] = [
  { name: "French Bulldog", pct: 7.0, img: "/frenchy-square.png" },
  { name: "Cockapoo", pct: 6.2, img: "/cockapoo-square.png" },
  { name: "Labrador Retriever", pct: 5.8, img: "/lab-square.png" },
  { name: "English Cocker Spaniel", pct: 4.7, img: "/cocker-square.png" },
  { name: "Chihuahua", pct: 4.2, img: "/Chihuahua-square.png" },
];

// The rarest breeds in the pack, by estimated share of the UK dog population.
// Derived from Kennel Club annual puppy registrations (2024): Bloodhound ~50,
// Mastiff ~100, Irish Wolfhound 165, English Setter 185, Old English Sheepdog 241.
// `w` is the bar width (%); the labels carry the true estimated share. Bars are
// scaled up for legibility so the breed name sits inside the bar.
const RARE: Bar[] = [
  { name: "Bloodhound", pct: 0.004, label: "0.004%", w: 34, img: "/bloodhound-square.png" },
  { name: "Mastiff", pct: 0.007, label: "0.007%", w: 42, img: "/mastiff-square.jpg" },
  { name: "Irish Wolfhound", pct: 0.01, label: "0.01%", w: 50, img: "/irish-square.png" },
  { name: "English Setter", pct: 0.019, label: "0.019%", w: 56, img: "/english-setter-square.jpg" },
  { name: "Old English Sheepdog", pct: 0.024, label: "0.024%", w: 70, img: "/old-english-square.png" },
];

const MAX_PCT = 7.0; // longest common-breed bar = French Bulldog 7.0%

function BarTable({
  caption,
  bars,
  max = MAX_PCT,
}: {
  caption: string;
  bars: Bar[];
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className={styles.statBlock} ref={ref}>
      <p className={styles.statCaption}>{caption}</p>
      {bars.map((b, i) => {
        const target = b.w != null ? b.w : (b.pct / max) * 78;
        return (
          <div className={styles.barRow} key={`${b.name}-${i}`}>
            <div className={styles.barThumb}>
              {b.img ? (
                <Image src={b.img} alt={b.name} width={120} height={120} unoptimized />
              ) : (
                <span className={styles.barThumbPaw} aria-hidden="true">
                  🐾
                </span>
              )}
            </div>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{ width: inView ? `${target}%` : "0%" }}
              >
                <span className={styles.barName}>{b.name}</span>
              </div>
              <span className={styles.barPct}>{b.label ?? `${b.pct.toFixed(1)}%`}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function BreedStats() {
  return (
    <section className={styles.statsSection}>
      <h2 className={`display ${styles.statsHeading}`}>
        The trends <span className="display-yellow">&amp; stats</span>
      </h2>

      <BarTable caption="The most common dog breeds across all ages" bars={ALL_AGES} />

      <p className={styles.statsIntro}>
        The most common dogs across all ages were the crossbreed, Labrador and
        Jack Russell. But look at the puppies: among dogs under one year, the
        French Bulldog and Cockapoo had surged into the top three, a sign of the
        designer-crossbreed boom. The pack has both the classics and the new
        favourites.
      </p>

      <BarTable caption="The most common puppy breeds" bars={PUPPIES} />

      <p className={styles.statsIntro}>
        Now the other end of the lead. These five are in the pack too, yet you
        would be lucky to pass one in the park. Each makes up the tiniest sliver
        of Britain&apos;s dogs: the Bloodhound, with only around fifty puppies
        registered a year, the gentle Mastiff at roughly a hundred, and three
        more native breeds the Kennel Club counts as vulnerable. Choosing one is
        a quiet act of rescue.
      </p>

      <BarTable caption="And the rarest breeds in the pack" bars={RARE} />

      <p className={styles.source}>
        Rarity estimated from Kennel Club puppy registrations (2024). Most-common
        figures: RVC VetCompass, O&apos;Neill et al. (2023).
      </p>
    </section>
  );
}
