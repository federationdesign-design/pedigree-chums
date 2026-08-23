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
  // ?diag=1 isolation rig (D46): read on the server so there is no hydration flip.
  diag?: boolean;
  // ?audit=1 TEMPORARY gutter measurement (REMOVE BEFORE COMMIT once the fit lands).
  audit?: boolean;
};

// Section visibility. Reset to header-only (production review 2026-08-22): the
// square image, the title and the subtitle are the only visible content. Every
// other section below is KEPT and fully wired, just gated here so it can be
// switched back on one at a time under Steve's direction.
const SHOW_SECTIONS = {
  introBox: true,       // blue intro description box (the breed write-up)
  lifespanChart: true,  // the lifespan chart (right of famous chums)
  diagram: true,        // circular BreedTree diagram (right of the intro box)
  ancestorPack: true,   // hidden BreedTreeMap feed + pack grid
  famousChums: true,    // FamousDogsSection
  cards: true,          // rail pop-out DragCards (D71: re-enabled; collision-placed, draggable, persist until X)
  tree: true,           // family tree (inline bounded LineageMap, right of the intro box)
  rail: true,           // the icon rail (opens the cards above)
  backButton: false,    // the Back link
};

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

// ── Card placement: FIXED, deterministic slots (D73 #4) ──────────────────────
// Each card owns a slot by its position in the RAIL ORDER, independent of open order,
// so opening health first still lands it in health's own slot (not slot 1). Slots flow
// left-to-right from DIRECTLY below famous chums, exactly CARD_GAP between cards on both
// axes, wrapping down at the canvas edge. Coords are canvas-space (DragCard is absolute).
const SLOT_TOP = 196;      // fallback band top if famous chums cannot be measured
const SLOT_LEFT = 120;     // left inset of the band
const SLOT_MARGIN = 24;    // keep off the right edge
const CARD_GAP = 10;       // exact gap between cards, both axes (D73 #3)
const EST_H = 260;         // card height estimate (row pitch + canvas-growth reserve)

// The rail order doubles as the fixed slot order. tree/diagram are panels, not placed
// cards, so they are skipped when the slot walk hits them.
const RAIL_ORDER = [
  "temperament", "tree", "lifespanExplain", "cost", "suitability",
  "exercise", "grooming", "training", "influence", "health", "diagram",
];

// Intro-box write-up alias (2026-08-23). breedInfo is keyed by tree-NODE name, but a
// few breed cards use a shorter/different root name than the node that carries the
// write-up, so breedInfo[breed.name] misses and the box shows only the fallback. This
// is the same class of mismatch data/lineageNames.ts (UK_TO_LINEAGE) exists for, but
// that map runs the opposite direction (uk-name -> lineage-name) and targets lineage
// keys, not breedInfo keys, so a small dedicated map is clearer than reversing it.
// Each target is verified to exist in breedInfo. Extend here, do NOT rename data keys.
const INTRO_ALIASES: Record<string, string> = {
  "Corgi": "Pembroke Welsh Corgi",
  "West Highland Terrier": "West Highland White Terrier",
  "German Shepherd": "German Shepherd Dog",
  "Dachshund": "Teckel (Dachshund) family",
  "Springer Spaniel": "English Springer Spaniel",
  "Labrador": "Labrador Retriever",
};

// ── Main component ──────────────────────────────────────────────────────────
// Stage 1: header + flow skeleton. Stage 2: circular diagram (healthy hosting)
// + X close + rail reopen. Stage 3: rail cards closed on load, deterministic
// pop-out placement, draggable cards. Production feedback (2026-08-22): the
// intro box and the lifespan chart are always-on-page in the left column, not
// rail cards, and the ?alt=1 fork is deleted (see DECISIONS D11).
export default function Chums2Client({ name, slug, image, info, lineage, diag = false, audit = false }: Props) {
  // The intro box shows the learn-area write-up (data/breedInfo.ts), plus the
  // "keep digging" prompt when the breed has ancestry to open, composed exactly
  // as the diagram caption does (BreedTree). NOT the subtitle or the temperament
  // blurb, and NOT breed.character. (Correction 2026-08-22, D22.)
  const introText = (breedInfo[INTRO_ALIASES[name] ?? name] ?? "") + (lineage?.children?.length ? " Tap a circle inside to keep digging." : "");

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
  // The hovered ancestor NAME (from a pack tile OR a diagram circle). Drives BOTH the
  // diagram-circle yellow OUTLINE (passed to BreedTree as highlightName) and the INTRO
  // BOX content swap (D74 #3): while set, the box shows that ancestor's card in place of
  // the breed intro; null restores the intro. The old floating masonry ensemble is gone.
  const [hoverName, setHoverName] = useState<string | null>(null);
  // Close ALL popouts (i, %, and now the enlarged image too) on a click outside
  // them. The image used to be excluded because it self-closed on a 2s timer; that
  // timer is removed for this hosting (popout persistence), so the outside click is
  // now its close path (plus opening another, one-at-a-time). Its trigger, body and
  // the enlarged image itself stop propagation so those clicks do not count.
  useEffect(() => {
    if (!openPop) return;
    const onDoc = () => setOpenPop(null);
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [openPop]);

  // Wide-canvas page: enable horizontal scroll (the global rule clips it) and mark
  // <body> so the route-scoped CSS applies (the shared nav stays fixed as elsewhere;
  // min-width 3000 for the scroll). In ?diag=1 isolation mode (D46, the `diag` prop
  // is read on the server so there is no hydration flip) we mark a DIFFERENT attribute
  // so the diag globals apply (hide any shared chrome, 3000 min-width) and the normal
  // route CSS does not. Scoped to /chums2 via the data attribute. (D30, D42, D46.)
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlX = html.style.overflowX;
    const prevBodyX = body.style.overflowX;
    // The WINDOW must scroll both directions, like the old /chums page, with nothing
    // between body and the sections acting as a scroll container. globals pins
    // html+body to overflow-x:clip (so normal pages never scroll sideways); the wide
    // 3000px canvas needs that un-clipped. Use VISIBLE, not auto: `overflow-x:auto`
    // makes <body> a scroll container AND coerces its overflow-y to auto, and since
    // <body> is only as tall as the canvas's in-flow content while the absolute
    // diagram/tree/chart run below it, the body then clips them and drops its own
    // horizontal scrollbar mid-page. `visible` keeps html+body out of the scroll-
    // container role (per the globals comment) and lets the viewport provide the
    // scrollbars at the window edges; overflow-y stays visible so the window scrolls
    // down to the absolute sections too. (D30, D50.)
    html.style.overflowX = "visible";
    body.style.overflowX = "visible";
    const attr = diag ? "data-pc-chums2-diag" : "data-pc-chums2";
    body.setAttribute(attr, "");
    return () => {
      html.style.overflowX = prevHtmlX;
      body.style.overflowX = prevBodyX;
      body.removeAttribute(attr);
    };
  }, [diag]);

  // ?audit=1 TEMPORARY gutter instrument (REMOVE BEFORE COMMIT once the per-breed fit
  // lands). Measures the RESTING layout at runtime and prints the real gutter widths
  // on screen - no estimation. All x are canvas-space (viewport rect minus the
  // canvas's own left). setState lives in the async measure callback, not the effect
  // body, so it does not trip react-hooks/set-state-in-effect.
  const [auditText, setAuditText] = useState<string[] | null>(null);
  useEffect(() => {
    if (!audit) return;
    const measure = () => {
      const canvas = document.querySelector('[data-canvas="true"]') as HTMLElement | null;
      const box = document.querySelector('[data-region="intro-box"]') as HTMLElement | null;
      const tree = document.querySelector('[data-region="tree"]') as HTMLElement | null;
      const diagram = document.querySelector('[data-region="diagram"]');
      if (!canvas || !box || !tree || !diagram) return;
      const cx = canvas.getBoundingClientRect().left;
      const circles = (Array.from(diagram.querySelectorAll("circle[data-n]")) as SVGCircleElement[])
        .filter((c) => c.getAttribute("fill") !== "none"); // drop the hidden root/echo circles
      if (circles.length === 0) return;
      const rects = circles.map((c) => c.getBoundingClientRect());
      const stage = (diagram as HTMLElement).getBoundingClientRect();
      const boxRight = box.getBoundingClientRect().right - cx;
      const packLeft = Math.min(...rects.map((r) => r.left)) - cx;
      const packRight = Math.max(...rects.map((r) => r.right)) - cx;
      const packTop = Math.min(...rects.map((r) => r.top));
      const packBottom = Math.max(...rects.map((r) => r.bottom));
      const treeLeft = tree.getBoundingClientRect().left - cx;
      const packW = packRight - packLeft, packH = packBottom - packTop;
      // To fill the stage WIDTH, a pack of this aspect would need this much HEIGHT. If
      // that exceeds the stage height, the HEIGHT term binds (contain fit) -> the pack
      // fills the height and stays narrow. That is the diagnosis, on screen.
      const needH = packW > 0 ? Math.round((packH * stage.width) / packW) : 0;
      setAuditText([
        `breed: ${slug}   (circles measured: ${circles.length})`,
        `intro box right edge:  ${Math.round(boxRight)}`,
        `pack leftmost circle x: ${Math.round(packLeft)}`,
        `pack rightmost circle x: ${Math.round(packRight)}`,
        `tree column left edge:  ${Math.round(treeLeft)}`,
        `GUTTER 4 (box->pack):  ${Math.round(packLeft - boxRight)}px   [target 60]`,
        `GUTTER 5 (pack->tree): ${Math.round(treeLeft - packRight)}px   [target 100]`,
        `stage: ${Math.round(stage.width)} x ${Math.round(stage.height)}  aspect ${(stage.width / Math.max(stage.height, 1)).toFixed(2)}`,
        `pack on-screen: ${Math.round(packW)} x ${Math.round(packH)}  aspect ${(packW / Math.max(packH, 1)).toFixed(2)}`,
        `fill-width needs height ${needH} vs stage height ${Math.round(stage.height)} -> ${needH > stage.height ? "HEIGHT BINDS" : "width binds"}`,
      ]);
    };
    // Let the diagram settle (item 1 removes the drop, so it is immediate) then read.
    const t = window.setTimeout(measure, 700);
    window.addEventListener("resize", measure);
    return () => { window.clearTimeout(t); window.removeEventListener("resize", measure); };
  }, [audit, slug]);

  const handleFramesReady = useCallback((nodes: FrameNode[]) => {
    setFrames((prev) => {
      if (prev.length > 0) return prev;
      const seen = new Set<string>();
      return nodes.filter((n) => (seen.has(n.id) ? false : (seen.add(n.id), true)));
    });
  }, []);

  // Ancestor pack ORDER (2026-08-23): oldest first, by the ancestor's `anchor`
  // year (from data/uk-breeds.ts, carried on the frame). Ancestors with no anchor
  // (not in uk-breeds) sort LAST, keeping their feed order among themselves; no
  // dates are invented. This orders the tile grid AND the diagram-circle preview
  // reads from the same list.
  const orderedFrames = useMemo(() => {
    return [...frames].sort((a, b) => {
      if (a.anchor == null && b.anchor == null) return 0;
      if (a.anchor == null) return 1;
      if (b.anchor == null) return -1;
      return a.anchor - b.anchor;
    });
  }, [frames]);

  // Hovering a diagram circle sets the hovered ancestor NAME (D74 #3): drives the outline
  // and swaps the intro box to the ancestor card. An event handler (not an effect), so no
  // set-state-in-effect. Null on hover-out restores the intro. Tile hover sets the same.
  const onCircleHover = useCallback((nm: string | null) => setHoverName(nm), []);

  // Canvas GROWTH (D72 #5): DragCards are position:absolute (out of flow), so they do not
  // stretch the content-driven canvas. Force a min-height that contains the lowest OPEN
  // card so the page grows downward under the bottom band. Undefined when none are open.
  const cardsMinHeight = useMemo(() => {
    const openCards = cards.filter((c) => !closed.has(c.id) && positions[c.id]);
    if (openCards.length === 0) return undefined;
    return Math.max(...openCards.map((c) => (positions[c.id]?.y ?? 0) + EST_H)) + 40;
  }, [cards, closed, positions]);

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
    // FIXED slot (D73 #4): walk the cards in rail order, accumulating x by each card's
    // width + CARD_GAP and wrapping down at the canvas edge, and return THIS card's slot.
    // The result depends only on the card ORDER (not which are open), so a card always
    // lands in its own slot. The band starts DIRECTLY below famous chums (measured in
    // canvas coords by subtracting the canvas top, like ?audit=1); 10px gaps throughout.
    const canvasEl = typeof document !== "undefined" ? (document.querySelector('[data-canvas="true"]') as HTMLElement | null) : null;
    const cRect = canvasEl?.getBoundingClientRect();
    const canvasW = cRect?.width ?? 2244;
    const cTop = cRect?.top ?? 0;
    const famous = typeof document !== "undefined" ? document.querySelector('[data-region="famous-chums"]') : null;
    const bandTop = famous ? famous.getBoundingClientRect().bottom - cTop + CARD_GAP : SLOT_TOP;
    const ordered = RAIL_ORDER.map((rid) => cards.find((c) => c.id === rid)).filter((c): c is CardDef => !!c);
    let x = SLOT_LEFT, y = bandTop, rowH = 0;
    for (const c of ordered) {
      if (x + c.width > canvasW - SLOT_MARGIN && x > SLOT_LEFT) { x = SLOT_LEFT; y += rowH + CARD_GAP; rowH = 0; } // wrap
      if (c.id === id) return { x, y };
      x += c.width + CARD_GAP;
      rowH = Math.max(rowH, EST_H);
    }
    return { x: SLOT_LEFT, y: bandTop };
  }, [cards]);

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
  // D73 #1: every icon stays in the rail PERMANENTLY (no removal on open). Order is
  // fixed; `closed` no longer filters the list, only the per-icon open state below.
  const railItems: RailItem[] = useMemo(() => {
    const byId = new Map<string, RailItem>();
    byId.set("diagram", { id: "diagram", label: "Diagram", icon: DIAGRAM_GLYPH });
    byId.set("tree", { id: "tree", label: "Family tree", icon: ICONS.ancestry });
    cards.forEach((c) => byId.set(c.id, { id: c.id, label: c.label, icon: c.icon }));
    return RAIL_ORDER.map((id) => byId.get(id)).filter((it): it is RailItem => !!it);
  }, [cards]);

  // An icon is "open" when its card/panel is not in `closed`. Drives the inverted tile.
  const openIds = useMemo(() => {
    const s = new Set<string>();
    railItems.forEach((it) => { if (!closed.has(it.id)) s.add(it.id); });
    return s;
  }, [railItems, closed]);

  // Rail click TOGGLES (D73 #1): open if closed, close if open.
  const toggleCard = useCallback((id: string) => {
    if (closed.has(id)) openCard(id); else closeCard(id);
  }, [closed, openCard, closeCard]);

  // ?diag=1 ISOLATION RIG (D46). ONLY the circular diagram, hosted exactly as the
  // mini pit: an empty 3000 x viewport-height canvas with the stage absolutely
  // positioned over the whole of it (inset:0, no size box, no overflow rule), and
  // BreedTree in fill mode with the LineageModal learn-mode props + displayOnly (so
  // the DISPLAY_SPAN resting frame runs as shipped). Nothing else on the page exists
  // to interfere, so any at-rest straight edge / zoom clipping / bad zoom-out here is
  // BreedTree's displayOnly framing, not the page.
  if (diag) {
    return (
      <div className={styles.diagCanvas} data-canvas="true" data-diag="true">
        <div className={styles.diagStage}>
          {lineage && (
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
          )}
        </div>
      </div>
    );
  }

  // D74 #3: the hovered ancestor's frame, for the intro-box content swap. When set, the
  // box renders that ancestor's card in place of the breed intro; null -> intro text.
  const hoverFrame = hoverName ? frames.find((f) => f.name === hoverName) ?? null : null;

  return (
    <div className={styles.canvas} data-canvas="true" style={cardsMinHeight ? { minHeight: cardsMinHeight } : undefined}>
      {/* ?audit=1 TEMPORARY gutter readout - REMOVE BEFORE COMMIT once the fit lands. */}
      {audit && auditText && (
        <div
          style={{
            position: "fixed", top: 8, left: "50%", transform: "translateX(-50%)",
            zIndex: 99999, background: "#b91c1c", color: "#ffffff",
            font: "12px/1.5 ui-monospace, monospace", padding: "8px 14px",
            borderRadius: 6, whiteSpace: "pre", pointerEvents: "none",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          }}
        >
          {"⚠ REMOVE BEFORE COMMIT  ·  ?audit=1 gutter readout (canvas-space px)\n" + auditText.join("\n")}
        </div>
      )}
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
          {/* #0: the rail is an interactive LEAF. .leftBand is pointer-events:none so
              events fall THROUGH the wrapper to the behind-diagram; this wrapper turns
              them back on for the rail (which does not overlap the diagram anyway). */}
          {SHOW_SECTIONS.rail && <div className={styles.railWrap}><Chums2Rail items={railItems} openIds={openIds} onOpen={toggleCard} /></div>}
          {(SHOW_SECTIONS.introBox || SHOW_SECTIONS.lifespanChart || SHOW_SECTIONS.ancestorPack || SHOW_SECTIONS.famousChums || SHOW_SECTIONS.tree) && (
            <div className={styles.introStack} data-region="intro-band">
              {/* Top row: the intro write-up box on the left, the family tree
                  inline to its right in the open area (bounded LineageMap). */}
              {/* Upper band: the intro box with the ancestor pack DIRECTLY below it,
                  the circular diagram over the middle, and the family tree in the
                  top-right corner. position:relative so the diagram stage and the tree
                  are offset-placed against THIS band: the diagram's bottom:0 then lands
                  exactly above the lower band (pack/famous/chart) with no magic number,
                  and the tall tree no longer sits inline reserving height between the
                  intro box and the pack. */}
              <div className={styles.upperBand}>
                {SHOW_SECTIONS.introBox && introText && (
                  <div className={styles.introTopRow}>
                    <div className={styles.introBox} data-region="intro-box">
                      {/* D74 #3: on ancestor hover the SAME box swaps to that ancestor's
                          card (name + share, description, thumbnail + share detail); hover
                          out restores the breed intro. No floating popup, no movement. */}
                      {hoverFrame ? (
                        <div className={styles.introCard}>
                          <p className={styles.introCardHead}>
                            <span className={styles.introCardName}>{hoverFrame.name}</span>{" "}
                            <span className={styles.introCardPct}>{pctTxt(hoverFrame.pct ?? 0)} of your chum</span>
                          </p>
                          {hoverFrame.note && <p className={styles.introCardBody}>{hoverFrame.note}</p>}
                          <div className={styles.introCardRow}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img className={styles.introCardThumb} src={hoverFrame.img} alt={hoverFrame.name} style={{ borderColor: frameBorder(hoverFrame.status) }} />
                            <div className={styles.introCardMeta}>
                              <div>As {genLabel(hoverFrame.depth ?? 1)}: {pctTxt(hoverFrame.share ?? hoverFrame.pct ?? 0)}</div>
                              <div>Share of your chum: {pctTxt(hoverFrame.pct ?? 0)}</div>
                              <p className={styles.introCardTitle}>{pctTitleFor(hoverFrame.id)}</p>
                              <p className={styles.introCardDisc}>These figures come from history and old breeding records, our viewpoint, not proven fact.</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className={styles.introBody}>{introText}</p>
                      )}
                    </div>
                  </div>
                )}
              {/* Ancestor pack: directly below the intro box, left-aligned with
                  it (both in this right column). Tiles are exactly one rail-icon
                  tile (61px); rows capped at 3, columns grow; no internal scroll. */}
              {SHOW_SECTIONS.ancestorPack && frames.length > 0 && (
                <section className={styles.ancestorPack} data-region="ancestor-pack">
                  <p className={styles.packTitle}>Ancestor Pack</p>
                  <div className={styles.packGrid} style={{ ["--pack-rows" as string]: String(packRows) }} data-cols={packCols}>
                    {orderedFrames.map((f) => (
                      <div
                        key={f.id}
                        className={styles.frame}
                        style={{ borderColor: frameBorder(f.status) }}
                        onMouseEnter={() => setHoverName(f.name)}
                        onMouseLeave={() => setHoverName(null)}
                      >
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
                          {/* #1 (review): the i info popout opens ONLY from its own
                              button (click), NOT on circle-hover preview - its text
                              just repeats the image panel. So no `preview` clause here. */}
                          {openPop?.id === f.id && openPop.kind === "info" && (
                            <div className={styles.framePopover} onClick={(e) => e.stopPropagation()}>
                              <p className={styles.framePopoverName}>{f.name}</p>
                              {/* Era line (2026-08-23): only when the ancestor has an
                                  era in uk-breeds; never invented when absent. */}
                              {f.era && <p className={styles.framePopoverEra}>Era: {f.era}</p>}
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
                          {/* Inline % card is the CLICKED popout only; the hover preview's
                              % card renders in the docked ensemble below (D67 #2/#3). */}
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
              </div>
              {/* Famous chums: the bottom of the LEFT column, below the ancestor pack
                  (the lifespan chart is no longer beside it; it moved to the far-right
                  column below the tree, brief 3). */}
              {SHOW_SECTIONS.famousChums && famousDogs[slug] && (
                <div className={styles.famousWrap} data-region="famous-chums">
                  <FamousDogsSection dogs={famousDogs[slug]} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Circular diagram: canvas-child stage over the concept's RED ZONE (offsets in
          CSS .diagramStage): left at the intro/pack column's right, top below the
          header, right at the tree column's left, BOTTOM at the famous-chums row
          bottom (not the pack bottom), on the 3000px canvas. Offsets only, no sizing
          box, no overflow; BreedTree fill-measures it and (displayOnly) frames the
          pack to fill. pointer-events:none keeps the sections beneath clickable. */}
      {SHOW_SECTIONS.diagram && lineage && !closed.has("diagram") && (
        <div className={styles.diagramStage} data-region="diagram">
          {/* Chrome sweep (brief 5): the diagram's close X was a stray floating X on
              the invisible stage (nothing to attach it to), so it is removed. The
              diagram is a permanent centrepiece; it does not close. */}
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
            highlightName={hoverName}
            onCircleHover={onCircleHover}
          />
        </div>
      )}

      {/* Family tree: canvas-child in the top-right column (its concept home). */}
      {SHOW_SECTIONS.tree && lineage && !closed.has("tree") && (
        <div className={styles.treeRegion} data-region="tree">
          <LineageMap
            breed={{ name, image, x: 550, y: 320, angle: 0 }}
            bounded
            hideLeafImages
            strongBg
            currentScore={0}
            initialDepth={4}
            onNodeClick={(nodeName, rect) => {
              // The click already ran the pit's expand for this node (LineageMap).
              // Here we open THAT ancestor's pack popout DIRECTLY BELOW the node so it
              // reads as attached to it: the shared TileZoom (enlarge image + name/note
              // panel, side by side) centred under the node, a small offset down,
              // clamped to the viewport, flipping ABOVE the node only when there is no
              // room below. Never covers the node. Matched by name; no frame = nothing.
              const f = frames.find((x) => x.name === nodeName);
              if (!f) return;
              const SIZE = 61; // enlarge size (61 -> 183 zoomed), same as a pack tile
              const ZOOM = SIZE * 3, PANEL_W = 219, GAP = 12, EDGE = 8;
              const blockW = ZOOM + 10 + PANEL_W; // image + gap + description panel
              const vw = window.innerWidth, vh = window.innerHeight;
              const nodeCX = rect.x + rect.w / 2, nodeBottom = rect.y + rect.h;
              let x = nodeCX - blockW / 2; // centre the block under the node
              x = Math.max(EDGE, Math.min(x, vw - EDGE - blockW));
              let y = nodeBottom + GAP; // just below the node
              if (y + ZOOM > vh - EDGE) y = rect.y - GAP - ZOOM; // no room below -> flip above
              y = Math.max(EDGE, Math.min(y, vh - EDGE - ZOOM));
              setOpenPop({ id: f.id, kind: "image", anchor: { x, y, size: SIZE } });
            }}
            onClose={() => closeCard("tree")}
          />
        </div>
      )}

      {/* Lifespan chart: far-right column, BELOW the tree, heading with it (brief 3).
          Its concept home; it must not sit in the diagram zone, so it is a canvas
          -child in the tree column, not in the left-column lower band. */}
      {SHOW_SECTIONS.lifespanChart && lifespanCurves[name] && (
        <div className={styles.chartRegion} data-region="lifespan-chart">
          <p className={styles.packTitle}>Likely life span</p>
          <div className={styles.chartFluid}>
            <LifespanChart breedName={name} fluid />
          </div>
        </div>
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

      {/* Enlarged ancestor image (CLICK only): the shared mini-pit TileZoom, anchored to
          the tile rect captured at click. The old hover ensemble is gone (D74 #3 - the
          hover now swaps the intro box instead). Clicked image closes on outside click. */}
      {openPop?.kind === "image" && (() => {
        const f = frames.find((x) => x.id === openPop.id);
        if (!f || !openPop.anchor) return null;
        return (
          <TileZoom
            key={f.id}
            open={{ img: f.img, name: f.name, description: f.note || "", anchor: openPop.anchor }}
            onClose={() => setOpenPop(null)}
            persist
            borderColor={frameBorder(f.status)}
          />
        );
      })()}

      {SHOW_SECTIONS.backButton && <Link href="/home" className={styles.backBtn}>Back</Link>}
    </div>
  );
}
