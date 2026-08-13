"use client";
import { useEffect, useRef, useState } from "react";
import PreorderCheckout from "./PreorderCheckout";
import styles from "./proto.module.css";

/*
 * THROWAWAY prototype (preorder branch only). Hero up top, Stripe checkout card
 * poking up into it from the right. Three overlap rules to compare, switched
 * from the URL the way the pit reads its ?simdebug hook: client-side, off
 * window.location.search, once on mount.
 *
 *   ?ov=fixed    checkout top sits ovv px DOWN from the hero's TOP edge
 *   ?ov=pct      checkout top sits ovv% of the hero height down from the top
 *   ?ov=bottom   checkout top sits ovv px UP from the hero's BOTTOM edge
 *
 *   ?ovv=<n>     the value knob for whichever rule is active (px, or % for pct)
 *
 * The three diverge as the hero (80vh) resizes: fixed stays glued near the top,
 * bottom stays glued to the bottom edge, pct scales with the hero.
 */

type OvMode = "fixed" | "pct" | "bottom";

// Must mirror .hero min-height in proto.module.css so the CSS-side overlap maths
// matches the real rendered hero height without measuring it first.
const HERO_H = "clamp(460px, 80vh, 1000px)";

const DEFAULT_VALUE: Record<OvMode, number> = { fixed: 440, pct: 30, bottom: 200 };

// The pull-up as a CSS length, clamped so a knob can never open a gap below the
// hero (marginTop > 0) or fling the card above the hero's top (< -HERO_H).
function marginTopFor(mode: OvMode, value: number): string {
  const raw =
    mode === "pct"
      ? `calc(${value / 100 - 1} * ${HERO_H})` // top at value% down the hero
      : mode === "bottom"
        ? `${-value}px` // top value px above the hero's bottom edge
        : `calc(${value}px - ${HERO_H})`; // fixed: top value px below the hero's top edge
  return `min(0px, max(${raw}, calc(${HERO_H} * -1)))`;
}

export default function PreorderPrototype() {
  const heroRef = useRef<HTMLElement>(null);
  const [heroH, setHeroH] = useState(0);
  const [mode, setMode] = useState<OvMode>("fixed");
  const [value, setValue] = useState<number>(DEFAULT_VALUE.fixed);

  // Read the tuning knobs once on mount.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const m = p.get("ov");
    const nextMode: OvMode = m === "pct" || m === "bottom" || m === "fixed" ? m : "fixed";
    const raw = p.get("ovv");
    const parsed = raw === null || raw === "" ? NaN : Number(raw);
    setMode(nextMode);
    setValue(Number.isFinite(parsed) ? parsed : DEFAULT_VALUE[nextMode]);
  }, []);

  // Measure the hero purely to feed the read-out badge. The 80vh hero moves with
  // the viewport, so keep watching it.
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const measure = () => setHeroH(el.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const overlapPx =
    mode === "pct" ? heroH * (1 - value / 100) : mode === "bottom" ? value : heroH - value;
  const shownOverlap = Math.max(0, Math.min(heroH, overlapPx));

  return (
    <main className={styles.wrap}>
      <section ref={heroRef} className={styles.hero}>
        <div className={styles.heroImg} aria-hidden="true" />
        <div className={styles.heroTint} aria-hidden="true" />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Secure your <span>pack</span>
          </h1>
          <p className={styles.heroSub}>
            Pay the pre-release price of £6.99. Free UK mainland delivery is
            included, and your card details stay with Stripe throughout.
          </p>
        </div>
      </section>

      <div className={styles.stage} style={{ marginTop: marginTopFor(mode, value) }}>
        <div className={styles.col}>
          <PreorderCheckout />
        </div>
      </div>

      <div className={styles.badge}>
        {`ov=${mode}  ovv=${value}\nheroH=${Math.round(heroH)}  overlap=${Math.round(shownOverlap)}`}
      </div>
    </main>
  );
}
