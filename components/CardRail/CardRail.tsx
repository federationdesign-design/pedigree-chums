"use client";
import { useRef, useEffect } from "react";
import Image from "next/image";
import { cards } from "../../content/cards";
import styles from "./CardRail.module.css";
import HoverCardVideo from "../HoverCardVideo/HoverCardVideo";

// The Cocker (card.jpg) is the fixed feature card, so keep it out of the
// scrolling deck to avoid showing it twice.
const FEATURE = "/card.jpg";
const deck = cards.filter((c) => c !== FEATURE);

export default function CardRail() {
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;

    // "Hold" distance = how far the row scrolls before the page is allowed to
    // scroll too. We hold for the first 3 cards, then release: the page scrolls
    // while the remaining cards keep moving at the same time.
    const holdDistance = () => {
      const items = el.querySelectorAll<HTMLElement>('[role="listitem"]');
      if (items.length > 3) {
        return items[3].offsetLeft - items[0].offsetLeft;
      }
      return el.clientWidth;
    };
    let hold = holdDistance();
    const onResize = () => {
      hold = holdDistance();
    };

    const onWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (delta === 0) return;
      const max = el.scrollWidth - el.clientWidth;

      if (delta > 0) {
        // scrolling down / forward
        if (el.scrollLeft >= max) return; // row finished: let the page scroll
        if (el.scrollLeft < hold) {
          // hold zone: freeze the page, move the cards
          e.preventDefault();
        }
        // release zone (>= hold): do NOT preventDefault, so the page scrolls
        // AND the cards advance together
        el.scrollLeft = Math.min(el.scrollLeft + delta, max);
      } else {
        // scrolling up / back
        if (el.scrollLeft <= 0) return; // row at start: let the page scroll up
        if (el.scrollLeft <= hold) {
          e.preventDefault();
        }
        el.scrollLeft = Math.max(el.scrollLeft + delta, 0);
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
    };
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
              {src === "/card11.jpg" ? (
                <HoverCardVideo poster={src} vimeoId="1199364230" />
              ) : (
                <Image
                  src={src}
                  alt={`Breed card ${i + 1}`}
                  width={300}
                  height={430}
                  className={styles.card}
                  sizes="(max-width: 700px) 60vw, 280px"
                  draggable={false}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
