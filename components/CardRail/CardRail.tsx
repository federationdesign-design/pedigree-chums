"use client";
import { useRef, useEffect } from "react";
import Image from "next/image";
import { cards } from "../../content/cards";
import styles from "./CardRail.module.css";

// The Cocker (card.jpg) is the fixed feature card, so keep it out of the
// scrolling deck to avoid showing it twice.
const FEATURE = "/card.jpg";
const deck = cards.filter((c) => c !== FEATURE);

export default function CardRail() {
  const railRef = useRef<HTMLDivElement>(null);

  // Native non-passive wheel listener: vertical wheel scrolls the row sideways.
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (delta === 0) return;
      const atStart = el.scrollLeft <= 0;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
      if ((delta < 0 && atStart) || (delta > 0 && atEnd)) return;
      e.preventDefault();
      el.scrollLeft += delta;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <h2 className="display">
          Meet the <span className="display-yellow">Pack</span>
        </h2>
        <p className={styles.sub}>
          Hand-illustrated cards for all 54 breeds. Scroll through to see them all.
        </p>
      </div>

      <div className={styles.railWrap}>
        <Image
          src={FEATURE}
          alt="Cocker Spaniel breed card"
          width={300}
          height={430}
          className={styles.featureCard}
          priority
        />

        <div ref={railRef} className={styles.rail} role="list" aria-label="Breed cards">
          {deck.map((src, i) => (
            <div className={styles.item} role="listitem" key={src}>
              <Image
                src={src}
                alt={`Breed card ${i + 1}`}
                width={300}
                height={430}
                className={styles.card}
                sizes="(max-width: 700px) 60vw, 280px"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
