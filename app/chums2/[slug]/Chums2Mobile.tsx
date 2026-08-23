"use client";

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import styles from "./chums2mobile.module.css";
// Reuse the DESKTOP card-content styles for the slot bodies (content styling, not layout;
// desktop output is unchanged). Layout stays in chums2mobile.module.css (`styles`).
import cardStyles from "./chums2.module.css";
import type { LineageNode } from "../../../data/lineage";
import { breedInfo } from "../../../data/breedInfo";
import BreedTreeMap, { type FrameNode } from "../../../components/BreedTreeMap/BreedTreeMap";
import FamousDogsSection from "../../../components/FamousDogsSection/FamousDogsSection";
import famousDogs from "../../../data/famousDogs";
import TileZoom from "../../../components/TileZoom/TileZoom";
// Slot card content: the SAME shared components + data the desktop client uses.
import { ICONS } from "../../../components/CardDock/CardDock";
import { INFLUENCE_GLYPH, HEALTH_GLYPH } from "./chums2Icons";
import LifespanChart from "../../../components/LifespanChart/LifespanChart";
import OutboundLink from "../../../components/OutboundLink/OutboundLink";
import { lifespanCurves, EXPLANATION, METHOD, SOURCES } from "../../../data/lifespanCurves";
import RunningCostCard from "../../../components/RunningCostCard/RunningCostCard";
import runningCosts from "../../../data/runningCosts";
import SuitabilityRadar from "../../../components/SuitabilityRadar/SuitabilityRadar";
import suitabilityScores from "../../../data/suitabilityScores";
import ExerciseCard from "../../../components/ExerciseCard/ExerciseCard";
import exerciseNeeds from "../../../data/exerciseNeeds";
import GroomingCard from "../../../components/GroomingCard/GroomingCard";
import groomingNeeds from "../../../data/groomingNeeds";
import TrainingCard from "../../../components/TrainingCard/TrainingCard";
import trainingDifficulty from "../../../data/trainingDifficulty";
import HealthSection from "../../../components/HealthSection/HealthSection";
import healthConditions from "../../../data/healthConditions";

type BreedInfo = { subtitle: string; temperament: string[]; pros: string[]; cons: string[] };

type Props = {
  name: string;
  slug: string;
  image: string;
  info: BreedInfo;
  lineage: LineageNode | null;
  character: string;
};

// /chums2 MOBILE v1 section flags. Stage 1: header, blue intro box, ancestor pack, famous
// chums. Stage 2 (now ON): the bottom two-row icon RAIL, the intro-box SLOT swap (rail-icon
// card content replaces the intro box, one at a time), and the LIFESPAN chart + explanation
// as a slot card. `slot` gates the shared card list (temperament, cost, ...); `lifespan`
// gates the lifespan card specifically. The circular diagram and the family tree stay
// OMITTED from mobile v1 (no icons, not mounted).
const MOBILE_SECTIONS = {
  header: true,
  introBox: true,
  ancestorPack: true,
  famousChums: true,
  rail: true,      // bottom two-row icon rail, fixed to the viewport bottom
  slot: true,      // rail-icon card content REPLACES the intro-box slot
  lifespan: true,  // lifespan chart (BreedMobile's .lifespanScroll) + explanation, as a slot card
};

// Duplicated (NOT shared) from the desktop client so the desktop stays byte-identical: the
// intro-box write-up alias and the small %-popout helpers. Data-only, trivial.
const INTRO_ALIASES: Record<string, string> = {
  "Corgi": "Pembroke Welsh Corgi",
  "West Highland Terrier": "West Highland White Terrier",
  "German Shepherd": "German Shepherd Dog",
  "Dachshund": "Teckel (Dachshund) family",
  "Springer Spaniel": "English Springer Spaniel",
  "Labrador": "Labrador Retriever",
};
const PCT_TITLES = [
  "Our best guess, not hard science.",
  "An educated guess, not gospel.",
  "Informed estimate, not exact science.",
  "Our reckoning, not the final word.",
  "A considered guess, not cold fact.",
  "Best judgement, not laboratory proof.",
  "Our read on it, not a certainty.",
  "A fair estimate, not a fixed figure.",
  "Studied guesswork, not hard data.",
  "Our interpretation, not established fact.",
];
const genLabel = (d: number) =>
  d <= 0 ? "the breed itself" : d === 1 ? "parent" : d === 2 ? "grandparent" : `${"great-".repeat(d - 2)}grandparent`;
const pctTxt = (v: number) => (v < 1 ? "<1%" : `${Math.round(v)}%`);
const pctTitleFor = (id: string) =>
  PCT_TITLES[Math.abs([...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)) % PCT_TITLES.length];

// ── Mobile component ─────────────────────────────────────────────────────────
// Stage 1: header + default in-flow view (intro box, ancestor pack with tap popouts,
// famous chums). Shares the same DATA as the desktop client, never its layout.
export default function Chums2Mobile({ name, slug, image, info, lineage }: Props) {
  // The intro box shows the breed write-up (data/breedInfo.ts, via the alias). No "tap a
  // circle" prompt on mobile: the diagram is omitted, so there is nothing to tap.
  const introText = breedInfo[INTRO_ALIASES[name] ?? name] ?? "";

  // Ancestor pack, fed by a hidden BreedTreeMap exactly as the desktop client (D24/D60).
  const [frames, setFrames] = useState<FrameNode[]>([]);
  const handleFramesReady = useCallback((nodes: FrameNode[]) => {
    setFrames((prev) => {
      if (prev.length > 0) return prev;
      const seen = new Set<string>();
      return nodes.filter((n) => (seen.has(n.id) ? false : (seen.add(n.id), true)));
    });
  }, []);

  // One tap popout at a time: the enlarged image, the % card, or the i info card. Tapping
  // outside closes the i/% cards (their trigger/body stop propagation); the image self-
  // closes the mini pit's way. Same shape/data as desktop.
  const [openPop, setOpenPop] = useState<{ id: string; kind: "info" | "pct" | "image"; anchor?: { x: number; y: number; size: number } } | null>(null);

  const frameBorder = (status?: FrameNode["status"]) =>
    status === "extinct" ? "#ef4444" : status === "endangered" || status === "in-decline" ? "#f97316" : "#22c55e";

  // Oldest-first, matching desktop (uk-breeds anchor; no-anchor last).
  const orderedFrames = [...frames].sort((a, b) => {
    if (a.anchor == null && b.anchor == null) return 0;
    if (a.anchor == null) return 1;
    if (b.anchor == null) return -1;
    return a.anchor - b.anchor;
  });

  // Historical-influence breakdown: SAME computation as the desktop client and the live
  // ancestry card (leaf shares, normalised, merged, sorted desc). Duplicated data-only.
  const influence = useMemo(() => {
    if (!lineage) return [] as { name: string; pct: number }[];
    const sumLeaves = (n: LineageNode): number => {
      const kids = n.children;
      if (!kids || kids.length === 0) return n.value ?? 1;
      return kids.reduce((s, k) => s + sumLeaves(k), 0);
    };
    const rootLeaves = sumLeaves(lineage);
    const results: { name: string; pct: number }[] = [];
    const walk = (n: LineageNode) => {
      const kids = n.children;
      if (!kids || kids.length === 0) {
        const pct = Math.round((sumLeaves(n) / rootLeaves) * 100);
        if (pct > 0) results.push({ name: n.name, pct });
      } else {
        kids.forEach(walk);
      }
    };
    lineage.children?.forEach(walk);
    const merged = new Map<string, number>();
    results.forEach(({ name: nm, pct }) => merged.set(nm, (merged.get(nm) ?? 0) + pct));
    return [...merged.entries()].sort((a, b) => b[1] - a[1]).map(([nm, pct]) => ({ name: nm, pct }));
  }, [lineage]);

  // Slot cards: the SAME shared components + data + order the desktop rail uses, minus the
  // diagram and tree panels (omitted on mobile). The lifespan card carries the CHART (in the
  // BreedMobile .lifespanScroll wrapper) plus the explanation below it, per stage 2 item 3.
  // Desktop content styling is reused (cardStyles) for the text bodies; the shared components
  // carry their own styles. Cards with no data are omitted, so no rail icon opens an empty card.
  type SlotCard = { id: string; label: string; icon: ReactNode; body: ReactNode };
  const slotCards = useMemo<SlotCard[]>(() => {
    if (!MOBILE_SECTIONS.slot) return [];
    const list: SlotCard[] = [];
    if (info.temperament.length || info.pros.length || info.cons.length) {
      list.push({
        id: "temperament", label: "Temperament", icon: ICONS.infoBox,
        body: (
          <>
            <p className={cardStyles.cardHeading}>Temperament</p>
            {info.temperament.length > 0 && (
              <div className={cardStyles.temperamentTags}>
                {info.temperament.map((t) => <span key={t} className={cardStyles.chip}>{t}</span>)}
              </div>
            )}
            {(info.pros.length > 0 || info.cons.length > 0) && (
              <>
                <div className={cardStyles.divider} />
                <div className={cardStyles.prosConsGrid}>
                  <div className={cardStyles.prosCol}>
                    <p className={`${cardStyles.prosConsHead} ${cardStyles.prosHead}`}>Pros</p>
                    <ul className={cardStyles.prosConsList}>{info.pros.map((p) => <li key={p}>{p}</li>)}</ul>
                  </div>
                  <div className={cardStyles.consCol}>
                    <p className={`${cardStyles.prosConsHead} ${cardStyles.consHead}`}>Cons</p>
                    <ul className={cardStyles.prosConsList}>{info.cons.map((c) => <li key={c}>{c}</li>)}</ul>
                  </div>
                </div>
              </>
            )}
          </>
        ),
      });
    }
    if (MOBILE_SECTIONS.lifespan && lifespanCurves[name]) {
      list.push({
        id: "lifespan", label: "Lifespan", icon: ICONS.lifespanExplain,
        body: (
          <>
            <p className={cardStyles.cardHeading}>Likely life span</p>
            {/* Chart in the BreedMobile horizontal-scroll wrapper (lifted, not rebuilt). */}
            <div className={styles.lifespanScroll}><LifespanChart breedName={name} /></div>
            {/* Explanation below the scroller, in the same slot. */}
            <p className={cardStyles.cardHeading} style={{ marginTop: 14 }}>The Lifespan Diagram</p>
            <p className={cardStyles.explainBody}>{EXPLANATION}</p>
            <details>
              <summary className={cardStyles.explainSummary}>Method &amp; sources</summary>
              <p className={cardStyles.explainBody} style={{ fontStyle: "italic", fontSize: 10 }}>{METHOD}</p>
              <ul style={{ listStyle: "none", padding: "0 20px", margin: 0 }}>
                {SOURCES.map((s) => (
                  <li key={s.url} style={{ marginBottom: 4 }}>
                    <OutboundLink href={s.url} style={{ fontFamily: "var(--font-body,'Montserrat',system-ui)", fontSize: 10, color: "var(--yellow,#ffd23e)", textDecoration: "underline", wordBreak: "break-all" }}>{s.label}</OutboundLink>
                  </li>
                ))}
              </ul>
            </details>
          </>
        ),
      });
    }
    if (runningCosts[slug]) list.push({ id: "cost", label: "Cost to care", icon: ICONS.runningCost, body: <RunningCostCard config={runningCosts[slug]} /> });
    if (suitabilityScores[slug]) list.push({ id: "suitability", label: "Suitability", icon: ICONS.suitability, body: <SuitabilityRadar score={suitabilityScores[slug]} breedName={name} /> });
    if (exerciseNeeds[slug]) list.push({ id: "exercise", label: "Exercise", icon: ICONS.exercise, body: <ExerciseCard data={exerciseNeeds[slug]} /> });
    if (groomingNeeds[slug]) list.push({ id: "grooming", label: "Grooming", icon: ICONS.grooming, body: <GroomingCard data={groomingNeeds[slug]} /> });
    if (trainingDifficulty[slug]) list.push({ id: "training", label: "Training", icon: ICONS.training, body: <TrainingCard data={trainingDifficulty[slug]} /> });
    if (influence.length > 0) {
      list.push({
        id: "influence", label: "Historical influence", icon: INFLUENCE_GLYPH,
        body: (
          <>
            <p className={cardStyles.cardHeading}>Historical influence</p>
            {influence.map((a) => (
              <div key={a.name}>
                <div className={cardStyles.influenceRow}>
                  <span className={cardStyles.influenceName}>{a.name}</span>
                  <span className={cardStyles.influencePct}>{a.pct}%</span>
                </div>
                <div className={cardStyles.influenceBar} style={{ width: `calc(${a.pct}% - 40px)` }} />
              </div>
            ))}
            <p className={cardStyles.influenceNote}>
              Our best guess, not hard science. These figures come from history and old breeding records, our viewpoint, not proven fact.
            </p>
          </>
        ),
      });
    }
    if (healthConditions[slug]) {
      list.push({ id: "health", label: "Health", icon: HEALTH_GLYPH, body: <div className={cardStyles.scrollBody}><HealthSection profile={healthConditions[slug]} /></div> });
    }
    return list;
  }, [name, slug, info, influence]);

  // The open slot: null shows the breed intro; an id shows that card in the intro-box slot.
  const [openSlot, setOpenSlot] = useState<string | null>(null);
  const activeCard = openSlot ? slotCards.find((c) => c.id === openSlot) ?? null : null;
  const slotRef = useRef<HTMLDivElement>(null);

  // Opening a card scrolls the page smoothly to the slot top if it is not already near the
  // top (vertical only), mirroring the desktop rule (D76). Closing (X or re-tapping the open
  // icon) never scrolls. Measured after the swap so the slot's settled top is used.
  const toggleSlot = useCallback((id: string) => {
    setOpenSlot((prev) => {
      const next = prev === id ? null : id;
      if (next) {
        setTimeout(() => {
          const el = slotRef.current;
          if (!el) return;
          const r = el.getBoundingClientRect();
          if (r.top >= 0 && r.top <= 24) return; // slot top already at the top: no-op
          window.scrollBy({ top: r.top - 12, left: 0, behavior: "smooth" });
        }, 60);
      }
      return next;
    });
  }, []);

  return (
    <div className={`${styles.page} ${MOBILE_SECTIONS.rail ? styles.withRail : ""}`.trim()}>
      {/* Header: chum square on top, wrapped title below, subtitle under it. Centred,
          scaled to phone width. (Proposal - Steve to judge on screen: 96px square,
          20px lead / 30px name.) */}
      {MOBILE_SECTIONS.header && (
        <header className={styles.header}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.headerImg} src={image} alt={name} />
          <div className={styles.headerText}>
            <h1 className={styles.title}>
              <span className={styles.titleLead}>Learn about the</span>
              <span className={styles.titleName}>{name}</span>
            </h1>
            {info.subtitle && <p className={styles.subtitle}>{info.subtitle}</p>}
          </div>
        </header>
      )}

      {/* The intro-box position is the single content SLOT. By default it shows the breed
          write-up; a rail-icon tap swaps in that card's content (one at a time, X restores
          the intro). In flow (no fixed height on mobile). */}
      {MOBILE_SECTIONS.introBox && (introText || activeCard) && (
        <div ref={slotRef} className={`${styles.introBox} ${activeCard ? styles.slotOpen : ""}`.trim()}>
          {MOBILE_SECTIONS.slot && activeCard ? (
            <div className={styles.slotCard}>
              <button
                type="button"
                className={styles.slotClose}
                onClick={() => setOpenSlot(null)}
                aria-label={`Close ${activeCard.label}`}
              >&times;</button>
              {activeCard.body}
            </div>
          ) : (
            introText && <p className={styles.introBody}>{introText}</p>
          )}
        </div>
      )}

      {/* Ancestor pack: phone-sized tiles wrapping to the width; tap opens the same popout
          data as desktop (enlarge image, i card, % card). */}
      {MOBILE_SECTIONS.ancestorPack && orderedFrames.length > 0 && (
        <section className={styles.packSection}>
          <p className={styles.sectionTitle}>Ancestor Pack</p>
          <div className={styles.packGrid}>
            {orderedFrames.map((f) => (
              <div key={f.id} className={styles.frame} style={{ borderColor: frameBorder(f.status) }}>
                <div className={styles.frameInner}>
                  <button
                    type="button"
                    className={styles.frameImgBtn}
                    data-frame-id={f.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setOpenPop(openPop?.id === f.id && openPop.kind === "image" ? null : { id: f.id, kind: "image", anchor: { x: r.left, y: r.top, size: r.width } });
                    }}
                    aria-label={`Enlarge ${f.name}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className={styles.frameImg} src={f.img} alt={f.name} />
                  </button>
                  <button
                    type="button"
                    className={styles.frameInfoBtn}
                    onClick={(e) => { e.stopPropagation(); setOpenPop(openPop?.id === f.id && openPop.kind === "info" ? null : { id: f.id, kind: "info" }); }}
                    aria-label={`About ${f.name}`}
                  >i</button>
                  {openPop?.id === f.id && openPop.kind === "info" && (
                    <div className={styles.framePopover} onClick={(e) => e.stopPropagation()}>
                      <p className={styles.framePopoverName}>{f.name}</p>
                      {f.era && <p className={styles.framePopoverEra}>Era: {f.era}</p>}
                      {f.note && <p className={styles.framePopoverNote}>{f.note}</p>}
                      <button type="button" className={styles.framePopoverClose} onClick={(e) => { e.stopPropagation(); setOpenPop(null); }} aria-label="Close">&times;</button>
                    </div>
                  )}
                  <button
                    type="button"
                    className={styles.framePct}
                    onClick={(e) => { e.stopPropagation(); setOpenPop(openPop?.id === f.id && openPop.kind === "pct" ? null : { id: f.id, kind: "pct" }); }}
                    aria-label={`Percentage detail for ${f.name}`}
                  >{f.pct != null && f.pct < 1 ? "<1%" : `${f.pct ?? "?"}%`}</button>
                  {openPop?.id === f.id && openPop.kind === "pct" && (
                    <div className={styles.framePctCard} onClick={(e) => e.stopPropagation()}>
                      <button type="button" className={styles.framePopoverClose} onClick={(e) => { e.stopPropagation(); setOpenPop(null); }} aria-label="Close">&times;</button>
                      <p className={styles.pctCardName}>{f.name}</p>
                      <p className={styles.pctCardBig}>{pctTxt(f.pct ?? 0)} of your chum</p>
                      <div className={styles.pctCardRows}>
                        <div>As {genLabel(f.depth ?? 1)}: {pctTxt(f.share ?? f.pct ?? 0)}</div>
                        <div>Share of your chum: {pctTxt(f.pct ?? 0)}</div>
                      </div>
                      <p className={styles.pctCardTitle}>{pctTitleFor(f.id)}</p>
                      <p className={styles.pctCardDisclaimer}>These figures come from history and old breeding records, our viewpoint, not proven fact.</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Famous chums: the shared section, at mobile width. */}
      {MOBILE_SECTIONS.famousChums && famousDogs[slug] && (
        <div className={styles.famousWrap}>
          <FamousDogsSection dogs={famousDogs[slug]} />
        </div>
      )}

      {/* Hidden BreedTreeMap: feeds the ancestor-pack frames via onFramesReady only. Not the
          circular diagram (BreedTree) or the family tree (LineageMap) - those are omitted. */}
      {MOBILE_SECTIONS.ancestorPack && lineage && (
        <div className={styles.hiddenMap} aria-hidden="true">
          <BreedTreeMap lineage={lineage} rootImage={image} filledIds={[]} onFramesReady={handleFramesReady} />
        </div>
      )}

      {/* Enlarged ancestor image: the shared mini-pit TileZoom, anchored to the tapped tile. */}
      {openPop?.kind === "image" && (() => {
        const f = frames.find((x) => x.id === openPop.id);
        if (!f || !openPop.anchor) return null;
        return (
          <TileZoom
            key={f.id}
            open={{ img: f.img, name: f.name, description: f.note || "", anchor: openPop.anchor }}
            onClose={() => setOpenPop(null)}
          />
        );
      })()}

      {/* Bottom icon rail: fixed to the viewport bottom, two rows, ~46px icons. Same icon set
          as desktop minus the diagram/tree (which do not exist on mobile), same open-state
          colour inversion. Always reachable over scroll; .withRail on .page reserves the space
          so nothing hides behind it. */}
      {MOBILE_SECTIONS.rail && slotCards.length > 0 && (
        <nav className={styles.rail} aria-label="Open a detail card">
          {slotCards.map((c) => {
            const isOpen = openSlot === c.id;
            return (
              <button
                key={c.id}
                type="button"
                className={`${styles.railIcon} ${isOpen ? styles.railIconOpen : ""}`.trim()}
                onClick={() => toggleSlot(c.id)}
                aria-pressed={isOpen}
                aria-label={`${isOpen ? "Close" : "Open"} ${c.label}`}
              >
                <span className={styles.railGlyph}>{c.icon}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
