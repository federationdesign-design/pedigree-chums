"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import styles from "./chums2.module.css";
import type { LineageNode } from "../../../data/lineage";
import BreedTree from "../../../components/BreedTree/BreedTree";
import LineageMap from "../../../components/PackPit/LineageMap";
import Chums2Rail, { type RailItem } from "./Chums2Rail";
import DragCard, { type Rect } from "./DragCard";
import { ICONS } from "../../../components/CardDock/CardDock";
import { INFLUENCE_GLYPH, DIAGRAM_GLYPH, HEALTH_GLYPH } from "./chums2Icons";
import { breedInfo } from "../../../data/breedInfo";
import TileZoom from "../../../components/TileZoom/TileZoom";
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
import BreedTreeMap, { type FrameNode } from "../../../components/BreedTreeMap/BreedTreeMap";
import FamousDogsSection from "../../../components/FamousDogsSection/FamousDogsSection";
import famousDogs from "../../../data/famousDogs";

type BreedInfo = {
  subtitle: string;
  temperament: string[];
  pros: string[];
  cons: string[];
};

type Props = {
  name: string;
  slug: string;
  image: string;
  info: BreedInfo;
  lineage: LineageNode | null;
  character: string;
};

// Section visibility. Reset to header-only (production review 2026-08-22): the
// square image, the title and the subtitle are the only visible content. Every
// other section below is KEPT and fully wired, just gated here so it can be
// switched back on one at a time under Steve's direction.
const SHOW_SECTIONS = {
  introBox: true,       // blue intro description box (the breed write-up)
  lifespanChart: true,  // the lifespan chart (right of famous chums)
  diagram: false,       // circular BreedTree diagram (main band)
  ancestorPack: true,   // hidden BreedTreeMap feed + pack grid
  famousChums: true,    // FamousDogsSection
  cards: false,         // rail pop-out DragCards
  tree: true,           // family tree (inline bounded LineageMap, right of the intro box)
  rail: true,           // the icon rail (icons only for now; pop-outs gated off)
  backButton: false,    // the Back link
};

// Small pit-style X used to close a panel (diagram, tree).
function CloseX() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <line x1="7" y1="7" x2="25" y2="25" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="25" y1="7" x2="7" y2="25" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

// A card definition: what the rail shows and what the DragCard holds.
type CardDef = { id: string; label: string; icon: React.ReactNode; width: number; body: React.ReactNode };

// Percentage-detail popout helpers, mirroring the shipped pattern in
// components/PackPit/LineageMap.tsx and components/BreedTreeMap/BreedTreeMap.tsx
// (the pctHover / pctCard). The data (pct = share of the whole chum, share =
// share of the parent, depth) comes from BreedTreeMap's onFramesReady. (D24.)
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

// ── Placement algorithm (brief 5.4) ─────────────────────────────────────────
// Deterministic anchor grid, left-to-right then top-to-bottom, starting beside
// the rail. Open a card at the first slot whose rect intersects no open card
// rect and stays inside the viewport width. If none is free, use the last slot
// and bring it to front (logged by the caller).
const SLOT_TOP = 196;      // clears the fixed nav + header band
const SLOT_LEFT = 120;     // beside the left rail
const SLOT_STEP_X = 372;   // column pitch
const SLOT_STEP_Y = 232;   // row pitch
const SLOT_MARGIN = 24;    // keep off the right edge
const EST_H = 260;         // incoming-card height estimate before it mounts

function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function buildSlots(vw: number): { x: number; y: number }[] {
  const slots: { x: number; y: number }[] = [];
  const cols = Math.max(1, Math.floor((vw - SLOT_LEFT - SLOT_MARGIN) / SLOT_STEP_X));
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < cols; col++) {
      slots.push({ x: SLOT_LEFT + col * SLOT_STEP_X, y: SLOT_TOP + row * SLOT_STEP_Y });
    }
  }
  return slots;
}

// ── Main component ──────────────────────────────────────────────────────────
// Stage 1: header + flow skeleton. Stage 2: circular diagram (healthy hosting)
// + X close + rail reopen. Stage 3: rail cards closed on load, deterministic
// pop-out placement, draggable cards. Production feedback (2026-08-22): the
// intro box and the lifespan chart are always-on-page in the left column, not
// rail cards, and the ?alt=1 fork is deleted (see DECISIONS D11).
export default function Chums2Client({ name, slug, image, info, lineage }: Props) {
  // The intro box shows the learn-area write-up (data/breedInfo.ts), plus the
  // "keep digging" prompt when the breed has ancestry to open, composed exactly
  // as the diagram caption does (BreedTree). NOT the subtitle or the temperament
  // blurb, and NOT breed.character. (Correction 2026-08-22, D22.)
  const introText = (breedInfo[name] ?? "") + (lineage?.children?.length ? " Tap a circle inside to keep digging." : "");

  // Historical-influence breakdown, same computation as the live page's
  // ancestry card (leaf shares, normalised, merged, sorted desc).
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

  // Card inventory available for this breed. Cards with no data are omitted, so
  // the rail never shows an icon that opens an empty card. Bodies for the
  // imported-component cards (lifespan, cost, ...) arrive in stage 4.
  const cards = useMemo<CardDef[]>(() => {
    const list: CardDef[] = [];
    // Intro box and the lifespan CHART are no longer rail cards (production
    // feedback items 8 and 9): they render always-on-page in the left column
    // below. Only the lifespan EXPLANATION stays as a rail card.
    if (info.temperament.length || info.pros.length || info.cons.length) {
      list.push({
        id: "temperament", label: "Temperament", icon: ICONS.infoBox, width: 420,
        body: (
          <>
            <p className={styles.cardHeading}>Temperament</p>
            {info.temperament.length > 0 && (
              <div className={styles.temperamentTags}>
                {info.temperament.map((t) => <span key={t} className={styles.chip}>{t}</span>)}
              </div>
            )}
            {(info.pros.length > 0 || info.cons.length > 0) && (
              <>
                <div className={styles.divider} />
                <div className={styles.prosConsGrid}>
                  <div className={styles.prosCol}>
                    <p className={`${styles.prosConsHead} ${styles.prosHead}`}>Pros</p>
                    <ul className={styles.prosConsList}>{info.pros.map((p) => <li key={p}>{p}</li>)}</ul>
                  </div>
                  <div className={styles.consCol}>
                    <p className={`${styles.prosConsHead} ${styles.consHead}`}>Cons</p>
                    <ul className={styles.prosConsList}>{info.cons.map((c) => <li key={c}>{c}</li>)}</ul>
                  </div>
                </div>
              </>
            )}
          </>
        ),
      });
    }
    if (influence.length > 0) {
      list.push({
        id: "influence", label: "Historical influence", icon: INFLUENCE_GLYPH, width: 360,
        body: (
          <>
            <p className={styles.cardHeading}>Historical influence</p>
            {influence.map((a) => (
              <div key={a.name}>
                <div className={styles.influenceRow}>
                  <span className={styles.influenceName}>{a.name}</span>
                  <span className={styles.influencePct}>{a.pct}%</span>
                </div>
                <div className={styles.influenceBar} style={{ width: `calc(${a.pct}% - 40px)` }} />
              </div>
            ))}
            <p className={styles.influenceNote}>
              Our best guess, not hard science. These figures come from history and old breeding records, our viewpoint, not proven fact.
            </p>
          </>
        ),
      });
    }
    if (lifespanCurves[name]) {
      // Explanation only: the chart itself is always-on-page (item 9).
      list.push({
        id: "lifespanExplain", label: "Lifespan", icon: ICONS.lifespanExplain, width: 420,
        body: (
          <>
            <p className={styles.cardHeading}>The Lifespan Diagram</p>
            <p className={styles.explainBody}>{EXPLANATION}</p>
            <details>
              <summary className={styles.explainSummary}>Method &amp; sources</summary>
              <p className={styles.explainBody} style={{ fontStyle: "italic", fontSize: 10 }}>{METHOD}</p>
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
    if (runningCosts[slug]) {
      list.push({ id: "cost", label: "Cost to care", icon: ICONS.runningCost, width: 380, body: <RunningCostCard config={runningCosts[slug]} /> });
    }
    if (suitabilityScores[slug]) {
      list.push({ id: "suitability", label: "Suitability", icon: ICONS.suitability, width: 380, body: <SuitabilityRadar score={suitabilityScores[slug]} breedName={name} /> });
    }
    if (exerciseNeeds[slug]) {
      list.push({ id: "exercise", label: "Exercise", icon: ICONS.exercise, width: 400, body: <ExerciseCard data={exerciseNeeds[slug]} /> });
    }
    if (groomingNeeds[slug]) {
      list.push({ id: "grooming", label: "Grooming", icon: ICONS.grooming, width: 380, body: <GroomingCard data={groomingNeeds[slug]} /> });
    }
    if (trainingDifficulty[slug]) {
      list.push({ id: "training", label: "Training", icon: ICONS.training, width: 380, body: <TrainingCard data={trainingDifficulty[slug]} /> });
    }
    if (healthConditions[slug]) {
      // Brief 5.5: HealthSection unchanged inside a card. It is wider than the
      // other cards, so cap the card at 560 and let it scroll internally.
      // (Decision D10.)
      list.push({
        id: "health", label: "Health", icon: HEALTH_GLYPH, width: 560,
        body: <div className={styles.scrollBody}><HealthSection profile={healthConditions[slug]} /></div>,
      });
    }
    return list;
  }, [name, slug, info, influence]);

  const cardById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  // Every rail card starts CLOSED on load (brief 5.4). The diagram and the
  // family tree are panels that start OPEN (the tree now renders INLINE and
  // visible on load, D31); each is added to `closed` only when X'd, which rails
  // its reopen icon.
  const [closed, setClosed] = useState<Set<string>>(() => new Set(cards.map((c) => c.id)));
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [zOrders, setZOrders] = useState<Record<string, number>>({});
  const zCounter = useRef(120);
  const openRects = useRef<Map<string, Rect>>(new Map());

  // ── Ancestor pack (brief 5.6) ─────────────────────────────────────────────
  // Fed by a hidden BreedTreeMap via onFramesReady, exactly as the live page.
  const [frames, setFrames] = useState<FrameNode[]>([]);
  // Which tile popout is open, and which kind. Only one is open at a time, so
  // opening any one replaces the others. The enlarged image (kind "image") also
  // carries the tile's screen rect, captured at click, as the TileZoom anchor.
  const [openPop, setOpenPop] = useState<{ id: string; kind: "info" | "pct" | "image"; anchor?: { x: number; y: number; size: number } } | null>(null);
  // Close the i / % popouts on a click anywhere outside (their trigger and body
  // stop propagation). The enlarged image is excluded: it closes the mini pit's
  // way, a 2s auto-close after the pointer leaves it, handled inside TileZoom.
  useEffect(() => {
    if (!openPop || openPop.kind === "image") return;
    const onDoc = () => setOpenPop(null);
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [openPop]);

  // Wide-canvas page (like the live /chums page): enable horizontal scroll
  // (the global rule clips it) and mark <body> so the route-scoped CSS can make
  // body a 2000px-wide positioning context and un-fix the shared chrome (nav bar
  // + 0/10 counter) so they scroll away with the page instead of riding the
  // viewport. All scoped to /chums2 via the data attribute. (D30.)
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlX = html.style.overflowX;
    const prevBodyX = body.style.overflowX;
    html.style.overflowX = "auto";
    body.style.overflowX = "auto";
    body.setAttribute("data-pc-chums2", "");
    return () => {
      html.style.overflowX = prevHtmlX;
      body.style.overflowX = prevBodyX;
      body.removeAttribute("data-pc-chums2");
    };
  }, []);
  const handleFramesReady = useCallback((nodes: FrameNode[]) => {
    setFrames((prev) => {
      if (prev.length > 0) return prev;
      const seen = new Set<string>();
      return nodes.filter((n) => (seen.has(n.id) ? false : (seen.add(n.id), true)));
    });
  }, []);

  // Grid shape (item 12): ALWAYS at least 2 rows, never 1 long row, max 3.
  // Columns grow with the pack (grid-auto-flow: column), so a big pack adds
  // width, not a 4th row. maxPerRow = 15 (52px tiles) sets the 2->3 row step.
  // (Decision D12, revised.)
  const MAX_PER_ROW = 15;
  const packRows = frames.length > 2 * MAX_PER_ROW ? 3 : 2;
  const packCols = Math.max(1, Math.ceil(frames.length / packRows));

  const frameBorder = (status?: FrameNode["status"]) =>
    status === "extinct" ? "#ef4444" : status === "endangered" || status === "in-decline" ? "#f97316" : "#22c55e";

  const bringToFront = useCallback((id: string) => {
    zCounter.current = Math.min(zCounter.current + 1, 290);
    setZOrders((prev) => ({ ...prev, [id]: zCounter.current }));
  }, []);

  const onRectChange = useCallback((id: string, rect: Rect) => {
    openRects.current.set(id, rect);
  }, []);

  const placeCard = useCallback((id: string) => {
    const width = cardById.get(id)?.width ?? 380;
    const vw = typeof window !== "undefined" ? window.innerWidth : 1440;
    const slots = buildSlots(vw);
    const openList = [...openRects.current.values()];
    for (const slot of slots) {
      if (slot.x + width > vw - SLOT_MARGIN) continue;      // stays inside viewport width
      const candidate: Rect = { x: slot.x, y: slot.y, w: width, h: EST_H };
      if (!openList.some((r) => intersects(candidate, r))) {
        return { x: slot.x, y: slot.y };
      }
    }
    // No free slot: last slot, brought to front (brief 5.4 asks to log this).
    const last = slots[slots.length - 1];
    console.warn(`[chums2] no free slot for card "${id}"; opening at last slot and bringing to front`);
    return { x: last.x, y: last.y };
  }, [cardById]);

  const openCard = useCallback((id: string) => {
    // Pop-outs are gated by SHOW_SECTIONS: while a section is off, its rail icon
    // is a no-op (the icon stays, nothing opens). Currently only the rail is on.
    if (id === "diagram" && !SHOW_SECTIONS.diagram) return;
    if (id === "tree" && !SHOW_SECTIONS.tree) return;
    if (id !== "diagram" && id !== "tree" && !SHOW_SECTIONS.cards) return;
    // Panels (diagram, tree) re-render in the main-band grid, no placement.
    if (id === "diagram" || id === "tree") {
      setClosed((prev) => { const next = new Set(prev); next.delete(id); return next; });
      return;
    }
    const pos = placeCard(id);
    setPositions((prev) => ({ ...prev, [id]: pos }));
    setClosed((prev) => { const next = new Set(prev); next.delete(id); return next; });
    bringToFront(id);
  }, [placeCard, bringToFront]);

  const closeCard = useCallback((id: string) => {
    openRects.current.delete(id);
    setClosed((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  // Rail order matches the concept (D22, item 6): brain (temperament) first,
  // then the family tree, then the rest in concept order. Cards not shown in the
  // concept (influence, health) and the diagram trail after it. Only closed +
  // available items render.
  const railItems: RailItem[] = useMemo(() => {
    const byId = new Map<string, RailItem>();
    byId.set("diagram", { id: "diagram", label: "Diagram", icon: DIAGRAM_GLYPH });
    byId.set("tree", { id: "tree", label: "Family tree", icon: ICONS.ancestry });
    cards.forEach((c) => byId.set(c.id, { id: c.id, label: c.label, icon: c.icon }));
    const RAIL_ORDER = [
      "temperament", "tree", "lifespanExplain", "cost", "suitability",
      "exercise", "grooming", "training", "influence", "health", "diagram",
    ];
    return RAIL_ORDER
      .map((id) => byId.get(id))
      .filter((it): it is RailItem => !!it && closed.has(it.id));
  }, [cards, closed]);

  return (
    <div className={styles.canvas} data-canvas="true">
      {/* Header (brief 5.1). */}
      <header className={styles.header}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.headerImg} src={image} alt={name} />
        <div className={styles.headerText}>
          <h1 className={styles.title}>
            <span className={styles.titleLead}>Learn about the</span>{" "}
            <span className={styles.titleName}>{name}</span>
          </h1>
          {info.subtitle && <p className={styles.subtitle}>{info.subtitle}</p>}
        </div>
      </header>

      {/* Left band: the icon rail with the blue intro description box immediately
          to its right, the box's TOP aligned to the rail's first icon
          (align-items:flex-start). In the left column below the chum square. The
          rail's pop-outs are still gated off; the lifespan chart is still off. */}
      {(SHOW_SECTIONS.rail || SHOW_SECTIONS.introBox || SHOW_SECTIONS.lifespanChart || SHOW_SECTIONS.ancestorPack || SHOW_SECTIONS.famousChums) && (
        <div className={styles.leftBand}>
          {SHOW_SECTIONS.rail && <Chums2Rail items={railItems} onOpen={openCard} />}
          {(SHOW_SECTIONS.introBox || SHOW_SECTIONS.lifespanChart || SHOW_SECTIONS.ancestorPack || SHOW_SECTIONS.famousChums || SHOW_SECTIONS.tree) && (
            <div className={styles.introStack} data-region="intro-band">
              {/* Top row: the intro write-up box on the left, the family tree
                  inline to its right in the open area (bounded LineageMap). */}
              {((SHOW_SECTIONS.introBox && introText) || (SHOW_SECTIONS.tree && lineage && !closed.has("tree"))) && (
                <div className={styles.introTopRow}>
                  {SHOW_SECTIONS.introBox && introText && (
                    <div className={styles.introBox}>
                      <p className={styles.introBody}>{introText}</p>
                    </div>
                  )}
                  {SHOW_SECTIONS.tree && lineage && !closed.has("tree") && (
                    <div className={styles.treeRegion} data-region="tree">
                      <LineageMap
                        breed={{ name, image, x: 550, y: 320, angle: 0 }}
                        bounded
                        hideLeafImages
                        strongBg
                        currentScore={0}
                        initialDepth={2}
                        onClose={() => closeCard("tree")}
                      />
                    </div>
                  )}
                </div>
              )}
              {/* Ancestor pack: directly below the intro box, left-aligned with
                  it (both in this right column). Tiles are exactly one rail-icon
                  tile (61px); rows capped at 3, columns grow; no internal scroll. */}
              {SHOW_SECTIONS.ancestorPack && frames.length > 0 && (
                <section className={styles.ancestorPack} data-region="ancestor-pack">
                  <p className={styles.packTitle}>Ancestor Pack</p>
                  <div className={styles.packGrid} style={{ ["--pack-rows" as string]: String(packRows) }} data-cols={packCols}>
                    {frames.map((f) => (
                      <div key={f.id} className={styles.frame} style={{ borderColor: frameBorder(f.status) }}>
                        <div className={styles.frameInner}>
                          <button
                            type="button"
                            className={styles.frameImgBtn}
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
                              {f.note && <p className={styles.framePopoverNote}>{f.note}</p>}
                              <button
                                type="button"
                                className={styles.framePopoverClose}
                                onClick={(e) => { e.stopPropagation(); setOpenPop(null); }}
                                aria-label="Close"
                              >&times;</button>
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
                              <button
                                type="button"
                                className={styles.framePopoverClose}
                                onClick={(e) => { e.stopPropagation(); setOpenPop(null); }}
                                aria-label="Close"
                              >&times;</button>
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
              {/* Lower band: famous chums (left) and the lifespan chart (right),
                  tops aligned. Count-aware via flex: famous takes the width its
                  card count needs and the chart takes the rest with a fixed gap;
                  with zero famous chums the famous block does not render and the
                  chart grows to the full band. Cards wrap within their own width,
                  so the chart is never pushed under or over them. No absolute
                  offsets. (D28.) */}
              {((SHOW_SECTIONS.famousChums && famousDogs[slug]) || (SHOW_SECTIONS.lifespanChart && lifespanCurves[name])) && (
                <div className={styles.lowerBand}>
                  {SHOW_SECTIONS.famousChums && famousDogs[slug] && (
                    <div className={styles.famousWrap} data-region="famous-chums">
                      <FamousDogsSection dogs={famousDogs[slug]} />
                    </div>
                  )}
                  {SHOW_SECTIONS.lifespanChart && lifespanCurves[name] && (
                    <div className={styles.chartSlot} data-region="lifespan-chart">
                      <p className={styles.packTitle}>Likely life span</p>
                      <div className={styles.chartFluid}>
                        <LifespanChart breedName={name} fluid />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main band: circular diagram (big, centred on screen). */}
      {SHOW_SECTIONS.diagram && (
      <section className={styles.mainBand} data-region="main-band">
        {lineage && !closed.has("diagram") && (
          <div className={styles.diagramPanel} data-region="diagram">
            <button
              type="button"
              className={styles.panelClose}
              onClick={() => closeCard("diagram")}
              aria-label="Close diagram"
              title="Close diagram"
            >
              <CloseX />
            </button>
            <BreedTree
              root={lineage}
              rootImage={image}
              rootLabel={name}
              centred
              fill
              dockAside
              strokeByDepth
              tinted={false}
              displayOnly
            />
          </div>
        )}

      </section>
      )}

      {/* Hidden BreedTreeMap: feeds ancestor-pack frames via onFramesReady only
          (brief 5.6). Not rendered visibly. Only mounted when the pack is shown. */}
      {SHOW_SECTIONS.ancestorPack && lineage && (
        <div className={styles.hiddenMap} aria-hidden="true">
          <BreedTreeMap lineage={lineage} rootImage={image} filledIds={[]} onFramesReady={handleFramesReady} />
        </div>
      )}


      {/* Open draggable cards. */}
      {cards.map((c) =>
        !SHOW_SECTIONS.cards || closed.has(c.id) ? null : (
          <DragCard
            key={c.id}
            id={c.id}
            x={positions[c.id]?.x ?? SLOT_LEFT}
            y={positions[c.id]?.y ?? SLOT_TOP}
            zIndex={zOrders[c.id] ?? 120}
            onBringToFront={bringToFront}
            onClose={() => closeCard(c.id)}
            onRectChange={onRectChange}
            style={{ width: c.width, padding: "0 0 18px" }}
          >
            {c.body}
          </DragCard>
        )
      )}

      {/* Family tree now renders INLINE in the top row (bounded LineageMap, see
          above and DECISIONS D31), not as a full-viewport overlay. */}

      {/* Enlarged ancestor image: the SAME shared component the mini pit learn
          area renders (components/TileZoom/TileZoom.tsx), so it grows in place
          from the tile with the yellow-name navy panel beside it, no backdrop,
          no X, 2s auto-close, exactly like the mini pit. Anchored to the tile's
          screen rect captured at click. (D26.) */}
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

      {SHOW_SECTIONS.backButton && <Link href="/home" className={styles.backBtn}>Back</Link>}
    </div>
  );
}
