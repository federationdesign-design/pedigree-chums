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
 * The lift is done with margin-top: -overlap PLUS min-height: overlap on the
 * stage, so the hero keeps its full height and the sections below never ride up
 * over it, while the card's growth still pushes those sections down.
 */

type OvMode = "fixed" | "pct" | "bottom";

// Must mirror .hero min-height in proto.module.css so the CSS-side overlap maths
// matches the real rendered hero height without measuring it first.
const HERO_H = "clamp(460px, 80vh, 1000px)";

const DEFAULT_VALUE: Record<OvMode, number> = { fixed: 440, pct: 30, bottom: 200 };

// The overlap (how far the checkout's top edge pokes up into the hero) as a CSS
// length, clamped to [0, HERO_H] so a knob can never open a gap below the hero
// or fling the card above its top. marginTop = -overlap, min-height = overlap.
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

      <div className={styles.stage} style={{ marginTop: `calc(-1 * ${overlap})`, minHeight: overlap }}>
        <div className={styles.col}>
          <PreorderCheckout />
        </div>
      </div>

      {/* Two column block: intro copy + PLAYERS / AGE / WHERE stats (left,
          inlined from HomeClient), FAQ ladder in a single column (right). */}
      <section className={styles.twoCol}>
        <div>
          <h2 className={styles.faqHeading}>
            Frequently Asked <span>Questions</span>
          </h2>
          <ProtoFaqLadder />
        </div>
        <div className={styles.introCol}>
          <h2 className={styles.introTitle}>
            Pedigree <span>Chums</span>
          </h2>
          <p className={styles.introDesc}>
            The on-the-go <span className={styles.hi}>dog spotting game</span> for curious
            minds and dog lovers. <span className={`${styles.white} ${styles.underline}`}>54
            illustrated breed cards</span> packed with traits, stats, and tell-tale features.{" "}
            <span className={styles.hi}>Spot a dog. </span>
            <span className={styles.white}>Make a friend, </span>
            <span className={`${styles.yellow} ${styles.underline}`}>you have a new chum.</span>
          </p>
          <div className={styles.meta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Players</span>
              <span className={styles.metaValue}>2+</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Age</span>
              <span className={styles.metaValue}>7+</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Where</span>
              <span className={styles.metaValue}>Anywhere</span>
            </div>
          </div>
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
