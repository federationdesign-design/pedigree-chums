"use client";
import { useEffect, useRef, useState } from "react";
import PreorderCheckout from "./PreorderCheckout";
import ProtoFaqLadder from "./ProtoFaqLadder";
import CardRail from "../../components/CardRail/CardRail";
import styles from "./proto.module.css";

/*
 * THROWAWAY prototype (preorder branch only). Hero up top, Stripe checkout card
 * poking up into it from the right, then a two column block (intro + FAQ ladder)
 * and the chum card slider. Three overlap rules to compare, switched from the
 * URL the way the pit reads its ?simdebug hook: client-side, off
 * window.location.search, once on mount.
 *
 *   ?ov=fixed    checkout top sits ovv px DOWN from the hero's TOP edge
 *   ?ov=pct      checkout top sits ovv% of the hero height down from the top
 *   ?ov=bottom   checkout top sits ovv px UP from the hero's BOTTOM edge
 *
 *   ?ovv=<n>     the value knob for whichever rule is active (px, or % for pct)
 *
 * The checkout stage is positioned ABSOLUTELY (top = HERO_H - overlap) so it
 * overlaps the hero from the right but is out of flow: it no longer pushes the
 * sections below. The two column block is anchored 50px below the hero's bottom
 * (margin-top: 50px on .twoCol), independent of the checkout's height, so the
 * FAQ column no longer moves when the iframe grows. Consequence: the checkout
 * card can overlap the intro column on the right (both are right-aligned).
 */

type OvMode = "fixed" | "pct" | "bottom";

// Must mirror .hero min-height in proto.module.css so the CSS-side overlap maths
// matches the real rendered hero height without measuring it first.
const HERO_H = "clamp(460px, 80vh, 1000px)";

const DEFAULT_VALUE: Record<OvMode, number> = { fixed: 440, pct: 30, bottom: 200 };

// The overlap (how far the checkout's top edge pokes up into the hero) as a CSS
// length, clamped to [0, HERO_H] so a knob can never open a gap below the hero
// or fling the card above its top. The stage's absolute top = HERO_H - overlap.
function overlapCss(mode: OvMode, value: number): string {
  const raw =
    mode === "pct"
      ? `calc(${1 - value / 100} * ${HERO_H})` // top at value% down the hero
      : mode === "bottom"
        ? `${value}px` // top value px above the hero's bottom edge
        : `calc(${HERO_H} - ${value}px)`; // fixed: top value px below the hero's top edge
  return `clamp(0px, ${raw}, ${HERO_H})`;
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

  const overlap = overlapCss(mode, value);
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

      <div className={styles.stage} style={{ top: `calc(${HERO_H} - ${overlap})` }}>
        <div className={styles.col}>
          <PreorderCheckout />
        </div>
      </div>

      {/* One column: the FAQ ladder only. The intro copy + PLAYERS / AGE / WHERE
          stats have been removed from the page. The grid is deliberately left as
          two tracks so the FAQ keeps its existing left-hand width rather than
          expanding to fill the space (width unchanged, see the report). */}
      <section className={styles.twoCol}>
        <div>
          <h2 className={styles.faqHeading}>
            Frequently Asked <span>Questions</span>
          </h2>
          <ProtoFaqLadder />
        </div>
      </section>

      {/* Chum card slider, reused from components/CardRail exactly as /about does. */}
      <CardRail />

      <div className={styles.badge}>
        {`ov=${mode}  ovv=${value}\nheroH=${Math.round(heroH)}  overlap=${Math.round(shownOverlap)}`}
      </div>
    </main>
  );
}
