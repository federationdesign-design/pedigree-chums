"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import styles from "./breed.module.css";
import BreedTree from "../../../components/BreedTree/BreedTree";
import BreedTreeMap, { type FrameNode } from "../../../components/BreedTreeMap/BreedTreeMap";
import type { LineageNode } from "../../../data/lineage";
import LifespanChart from "../../../components/LifespanChart/LifespanChart";
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
import FamousDogsSection from "../../../components/FamousDogsSection/FamousDogsSection";
import famousDogs from "../../../data/famousDogs";
import CardDock from "../../../components/CardDock/CardDock";
import type { DockItem } from "../../../components/CardDock/CardDock";

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
};

// ── Draggable card ────────────────────────────────────────────────────────────
function DragCard({
  id, initialX, initialY, zIndex, children, onBringToFront, onClose, className, style,
}: {
  id: string;
  initialX: number;
  initialY: number;
  zIndex: number;
  children: React.ReactNode;
  onBringToFront: (id: string) => void;
  onClose?: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: initialX, y: initialY });
  const drag = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);

  // Apply initial position
  useEffect(() => {
    if (ref.current) {
      ref.current.style.left = `${initialX}px`;
      ref.current.style.top = `${initialY}px`;
    }
  }, [initialX, initialY]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, details, summary")) return;
    if ((target as unknown as Element).closest?.("g[data-node]")) return;
    e.preventDefault();
    onBringToFront(id);
    const el = ref.current!;
    drag.current = { sx: e.clientX, sy: e.clientY, px: pos.current.x, py: pos.current.y };
    el.setPointerCapture(e.pointerId);
  }, [id, onBringToFront]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.sx;
    const dy = e.clientY - drag.current.sy;
    pos.current = { x: drag.current.px + dx, y: drag.current.py + dy };
    const el = ref.current!;
    el.style.left = `${pos.current.x}px`;
    el.style.top = `${pos.current.y}px`;
  }, []);

  const onPointerUp = useCallback(() => { drag.current = null; }, []);

  return (
    <div
      ref={ref}
      className={`${styles.card} ${className ?? ""}`}
      style={{ position: "absolute", zIndex, ...style }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {onClose && (
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={{ position: "absolute", top: 8, right: 12, background: "none", border: "none", color: "var(--yellow, #ffd23e)", fontSize: 40, cursor: "pointer", lineHeight: 1, padding: 0, zIndex: 1, fontWeight: 700 }}
        >×</button>
      )}
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BreedClient({ name, slug, image, info, lineage }: Props) {
  const zCounter = useRef(120);
  const bringToFront = useCallback((id: string) => {
    zCounter.current = Math.min(zCounter.current + 1, 290);
    setZOrders((prev) => ({ ...prev, [id]: zCounter.current }));
  }, []);

  const infoBoxRef = useRef<HTMLDivElement>(null);
  const [infoBoxHeight, setInfoBoxHeight] = useState(276);

const [zOrders, setZOrders] = useState({ infoBox: 112, ancestry: 113, lifespanChart: 114, lifespanExplain: 115, runningCost: 111, suitability: 111, exercise: 111, grooming: 111, training: 111 });  const [closedCards, setClosedCards] = useState<Set<string>>(new Set());
  type PageFrame = { id: string; name: string; img: string; pct?: number; note?: string; status?: "extinct" | "trending" | "popular" | "endangered" | "in-decline" | null; filled: boolean; shake: boolean };
  const [frames, setFrames] = useState<PageFrame[]>([]);
  const [frameInfoHover, setFrameInfoHover] = useState<string | null>(null);

  const handleFramesReady = useCallback((nodes: FrameNode[]) => {
    setFrames((prev) => {
      if (prev.length > 0) return prev;
      const seen = new Set<string>();
      return nodes.filter((n) => {
        if (seen.has(n.id)) return false;
        seen.add(n.id);
        return true;
      }).map((n) => ({ ...n, filled: true, shake: false }));
    });
  }, []);
  const closeCard = useCallback((id: string) => setClosedCards((prev) => new Set([...prev, id])), []);

  const reopenCard = useCallback((id: string) => {
    setClosedCards((prev) => { const next = new Set(prev); next.delete(id); return next; });
    bringToFront(id);
  }, [bringToFront]);

  const ALL_DOCK_ITEMS: DockItem[] = [
    { id: "infoBox",       label: "Temperament",    abbr: "TM" },
    { id: "ancestry",      label: "Ancestry",       abbr: "AN" },
    { id: "lifespanExplain", label: "Lifespan",     abbr: "LS" },
    { id: "runningCost",   label: "Cost to care",   abbr: "CC" },
    { id: "suitability",   label: "Suitability",    abbr: "SU" },
    { id: "exercise",      label: "Exercise",       abbr: "EX" },
    { id: "grooming",      label: "Grooming",       abbr: "GR" },
    { id: "training",      label: "Training",       abbr: "TR" },
  ];

  // Canvas scroll control
  useEffect(() => {
    const prev = document.documentElement.style.overflowX;
    document.documentElement.style.overflowX = "auto";
    document.body.style.overflowX = "auto";
    return () => {
      document.documentElement.style.overflowX = prev;
      document.body.style.overflowX = "";
    };
  }, []);

  // Measure temperament card height so ancestry card sits 16px below it
  useEffect(() => {
    if (!infoBoxRef.current) return;
    const measure = () => {
      if (infoBoxRef.current) setInfoBoxHeight(infoBoxRef.current.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(infoBoxRef.current);
    return () => ro.disconnect();
  }, []);

  const ancestryBreakdown = useMemo(() => {
    if (!lineage) return [];
    // Collect all leaf nodes with normalised share (same as pit breedMix)
    const sumLeaves = (n: any): number => {
      const kids = n.children as any[] | undefined;
      if (!kids || kids.length === 0) return n.value ?? 1;
      return kids.reduce((s: number, k: any) => s + sumLeaves(k), 0);
    };
    const rootLeaves = sumLeaves(lineage);
    const results: { name: string; pct: number }[] = [];
    const walk = (n: any) => {
      const kids = n.children as any[] | undefined;
      if (!kids || kids.length === 0) {
        const pct = Math.round((sumLeaves(n) / rootLeaves) * 100);
        if (pct > 0) results.push({ name: n.name, pct });
      } else {
        kids.forEach(walk);
      }
    };
    (lineage.children as any[] | undefined)?.forEach(walk);
    // Sort descending, merge duplicates, normalise to exactly 100
    const merged = new Map<string, number>();
    results.forEach(({ name, pct }) => merged.set(name, (merged.get(name) ?? 0) + pct));
    const sorted = [...merged.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, pct]) => ({ name, pct }));
    return sorted;
  }, [lineage]);

  const hasLifespan = !!lifespanCurves[name];

  // Fixed layout positions
  const HEADER_H = 180;    // approx height of H1+H2
  const CARD_TOP = HEADER_H + 80;
  const LEFT_EDGE = 48;
  const CARD_GAP = 10;
  const INFO_W = 420;
  const ANCESTRY_W = 340;
  const CHART_TOP = CARD_TOP;
  const EXPLAIN_TOP = CARD_TOP + 255; // below chart
  const DIAGRAM_TOP = CARD_TOP + 620; // below cards
  const FRAMES_TOP = DIAGRAM_TOP + 800; // below diagrams
  const CIRCLE_LEFT = LEFT_EDGE;
  const TREE_LEFT = LEFT_EDGE + INFO_W + CARD_GAP + 1008 + 48 - 400; // right of lifespan chart

  return (
    <div className={styles.canvas} data-canvas="true">
      {/* Header - in flow */}
      <div className={styles.header}>
        <h1 className={styles.h1}>{name}</h1>
        <p className={styles.subtitle}>{info.subtitle}</p>
      </div>

      {/* All cards and diagrams absolutely positioned */}

      {/* Temperament card */}
      {!closedCards.has("infoBox") && (
        <DragCard id="infoBox" initialX={LEFT_EDGE} initialY={CARD_TOP} zIndex={zOrders.infoBox}
          onBringToFront={bringToFront} onClose={() => closeCard("infoBox")}
          style={{ width: INFO_W, padding: "0 0 20px" }}>
          <div ref={infoBoxRef}>
          <p className={styles.infoHeading}>Temperament</p>
          <div className={styles.infoSection}>
            <div className={styles.temperamentTags}>
              {info.temperament.map((t) => <span key={t} className={styles.tag}>{t}</span>)}
            </div>
          </div>
          <div className={styles.divider} />
          <div className={styles.infoSection}>
            <div className={styles.prosConsGrid}>
              <div className={styles.prosCol}>
                <p className={`${styles.prosConsHead} ${styles.pros}`}>Pros</p>
                <ul className={styles.prosConsList}>{info.pros.map((p) => <li key={p}>{p}</li>)}</ul>
              </div>
              <div className={styles.consCol}>
                <p className={`${styles.prosConsHead} ${styles.cons}`}>Cons</p>
                <ul className={styles.prosConsList}>{info.cons.map((c) => <li key={c}>{c}</li>)}</ul>
              </div>
            </div>
          </div>
          </div>
        </DragCard>
      )}

      {/* Ancestry card - below temperament */}
      {!closedCards.has("ancestry") && lineage && ancestryBreakdown.length > 0 && (
        <DragCard id="ancestry" initialX={TREE_LEFT - 200} initialY={CARD_TOP - 75} zIndex={zOrders.ancestry}
          onBringToFront={bringToFront} onClose={() => closeCard("ancestry")}
          style={{ width: ANCESTRY_W, padding: "0 0 16px" }}>
          <p className={styles.infoHeading}>Ancestry</p>
          {ancestryBreakdown.map((a) => (
            <div key={a.name}>
              <div className={styles.ancestryRow}>
                <span className={styles.ancestryName}>{a.name}</span>
                <span className={styles.ancestryPct}>{a.pct}%</span>
              </div>
              <div className={styles.ancestryBar} style={{ width: `calc(${a.pct}% - 40px)` }} />
            </div>
          ))}
          <p className={styles.ancestryDisclaimer}>
            Our best guess, not hard science. These figures come from history and old breeding records, our viewpoint, not proven fact.
          </p>
        </DragCard>
      )}

      {/* Lifespan chart - to the right of temperament */}
      {hasLifespan && (
        <div style={{ position: "absolute", left: LEFT_EDGE + INFO_W + CARD_GAP + 10, top: CHART_TOP, marginTop: -25, zIndex: 5 }}>
          <LifespanChart breedName={name} />
        </div>
      )}

      {/* Running cost card */}
      {runningCosts[slug] && !closedCards.has("runningCost") && (
        <DragCard id="runningCost" initialX={LEFT_EDGE + INFO_W + CARD_GAP + 10 + 1008 + 24 - 100} initialY={CHART_TOP - 15 + 200 + 50 - 250 - 50}
          zIndex={zOrders.runningCost} onBringToFront={bringToFront} onClose={() => setClosedCards((prev) => new Set(prev).add("runningCost"))}>
          <RunningCostCard config={runningCosts[slug]} />
        </DragCard>
      )}

      {/* Lifespan explanation card */}
      {!closedCards.has("lifespanExplain") && hasLifespan && (
        <DragCard id="lifespanExplain" initialX={LEFT_EDGE + INFO_W + CARD_GAP + 25 - 40 - 100 - 30} initialY={EXPLAIN_TOP + 50}
          zIndex={zOrders.lifespanExplain} onBringToFront={bringToFront} onClose={() => closeCard("lifespanExplain")}
          style={{ width: INFO_W, padding: "16px 20px 20px" }}>
          <p className={styles.infoHeading} style={{ paddingLeft: 0, marginTop: 0 }}>The Lifespan Diagram</p>
          <p style={{ fontFamily: "var(--font-body,'Montserrat',system-ui)", fontSize: 12, fontWeight: 600, lineHeight: 1.6, color: "#ffffff", margin: "0 0 12px" }}>
            A visual guide to how this breed moves through life. The horizontal axis shows age from birth to old age; the vertical axis represents overall function, health and quality of life. The curve rises quickly through puppyhood, holds high during the prime adult years, then gradually declines into the senior stage. The exact shape varies by breed. This is a conceptual illustration, not a clinical or veterinary prediction for any individual dog.
          </p>
          <details style={{ cursor: "pointer" }}>
            <summary style={{ fontFamily: "var(--font-body,'Montserrat',system-ui)", fontSize: 11, fontWeight: 700, color: "var(--yellow,#ffd23e)", letterSpacing: "0.05em" }}>Method &amp; sources</summary>
            <p style={{ fontFamily: "var(--font-body,'Montserrat',system-ui)", fontSize: 10, fontWeight: 600, color: "#ffffff", lineHeight: 1.6, margin: "8px 0", fontStyle: "italic" }}>{METHOD}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {SOURCES.map((s) => (
                <li key={s.url} style={{ marginBottom: 4 }}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-body,'Montserrat',system-ui)", fontSize: 10, color: "var(--yellow,#ffd23e)", textDecoration: "underline", wordBreak: "break-all" }}>{s.label}</a>
                </li>
              ))}
            </ul>
          </details>
        </DragCard>
      )}

      {/* Circular diagram - fixed position */}
      {lineage && (
        <div style={{ position: "absolute", left: CIRCLE_LEFT + 40, top: DIAGRAM_TOP - 200 }}
          ref={(el) => {
            if (!el) return;
            const stage = el.querySelector("[class*=stage]") as HTMLElement | null;
            if (stage) stage.style.zIndex = "1";
          }}>
          <BreedTree root={lineage} rootImage={image} centred size={760} hideLabels disableZoom />
        </div>
      )}

      {/* Family tree - draggable, starts at right of circular */}

      {/* Suitability radar */}
      {suitabilityScores[slug] && !closedCards.has("suitability") && (
        <DragCard id="suitability" initialX={LEFT_EDGE + INFO_W + CARD_GAP + 10 + 1008 + 24 - 100} initialY={CHART_TOP - 15 + 200 + 50 - 250 + 460 + 16 - 50}
          zIndex={zOrders.suitability} onBringToFront={bringToFront}
          onClose={() => setClosedCards((prev) => new Set(prev).add("suitability"))}
          style={{ width: 360 }}>
          <SuitabilityRadar score={suitabilityScores[slug]} breedName={name} />
        </DragCard>
      )}

      {/* Exercise needs card */}
      {exerciseNeeds[slug] && !closedCards.has("exercise") && (
        <DragCard id="exercise" initialX={LEFT_EDGE} initialY={CHART_TOP - 25 + 576 + 24 + 600 + 10 - 75}
          zIndex={zOrders.exercise} onBringToFront={bringToFront}
          onClose={() => setClosedCards((prev) => new Set(prev).add("exercise"))}
          style={{ width: 380, padding: "16px 0 16px" }}>
          <ExerciseCard data={exerciseNeeds[slug]} />
        </DragCard>
      )}

      {/* Grooming card */}
      {groomingNeeds[slug] && !closedCards.has("grooming") && (
        <DragCard id="grooming" initialX={LEFT_EDGE + 380 + 24 + 300} initialY={CHART_TOP - 25 + 576 + 24 + 600 + 10 + 20}
          zIndex={zOrders.grooming} onBringToFront={bringToFront}
          onClose={() => setClosedCards((prev) => new Set(prev).add("grooming"))}
          style={{ width: 360, padding: "16px 0 16px" }}>
          <GroomingCard data={groomingNeeds[slug]} />
        </DragCard>
      )}

      {/* Training difficulty card */}
      {trainingDifficulty[slug] && !closedCards.has("training") && (
        <DragCard id="training" initialX={LEFT_EDGE + INFO_W + CARD_GAP + 10 + 1008 + 24 - 100} initialY={CHART_TOP - 15 + 200 + 50 - 250 + 460 + 16 - 50 + 665 + 16 - 30}
          zIndex={zOrders.training} onBringToFront={bringToFront}
          onClose={() => setClosedCards((prev) => new Set(prev).add("training"))}
          style={{ width: 360, padding: 0 }}>
          <TrainingCard data={trainingDifficulty[slug]} />
        </DragCard>
      )}
      {/* Hidden BreedTreeMap -- feeds ancestor pack frames only, not rendered visibly */}
      {lineage && (
        <div style={{ position: "absolute", left: -9999, top: -9999, visibility: "hidden", pointerEvents: "none" }}>
          <BreedTreeMap lineage={lineage} rootImage={image} filledIds={[]} onFramesReady={handleFramesReady} onImageDropped={() => {}} onDragName={() => {}} />
        </div>
      )}

      {/* Ancestor pack frames */}
      {frames.length > 0 && (
        <div style={{ position: "absolute", left: LEFT_EDGE, top: FRAMES_TOP }}>
          <p style={{ fontFamily: "var(--font-display,'Luckiest Guy',system-ui)", fontSize: 78, letterSpacing: "0.1em", color: "var(--yellow,#ffd23e)", margin: "0 0 24px", textTransform: "uppercase", lineHeight: 1 }}>Ancestor Pack</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, maxWidth: 1200 }}>
            {frames.map((f) => (
              <div key={f.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div
                  style={{
                    width: 77, height: 77, borderRadius: 10,
                    border: `4px solid ${f.status === "extinct" ? "#ef4444" : f.status === "endangered" || f.status === "in-decline" ? "#f97316" : "#22c55e"}`,
                    background: "transparent", display: "flex", alignItems: "center", justifyContent: "center",
                    position: "relative", overflow: "visible",
                  }}
                >
                  <div style={{ position: "relative", width: "100%", height: "100%" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.img} alt={f.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6, display: "block" }} />

                    {/* Info button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setFrameInfoHover(frameInfoHover === f.id ? null : f.id); }}
                      style={{ position: "absolute", right: -14, top: -14, width: 28, height: 28, border: "2px solid #fff", borderRadius: "50%", background: "var(--blue-deep, #0b78bd)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, fontStyle: "italic", fontWeight: 700, fontSize: 14, fontFamily: "Georgia, serif", zIndex: 65 }}
                    >i</button>
                    {frameInfoHover === f.id && (
                      <div style={{ position: "absolute", left: 0, top: 20, background: "rgba(10,58,87,0.96)", border: "1.5px solid rgba(255,210,62,0.4)", borderRadius: 12, padding: "10px 14px", zIndex: 200, minWidth: 200, maxWidth: 260, boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}>
                        <p style={{ fontFamily: "var(--font-display,'Luckiest Guy',system-ui)", fontSize: 13, color: "#ffd23e", margin: "0 0 4px", letterSpacing: "0.05em" }}>{f.name}</p>
                        {f.note && <p style={{ fontFamily: "var(--font-body,'Montserrat',system-ui)", fontSize: 11, color: "#ffffff", margin: 0, lineHeight: 1.5 }}>{f.note}</p>}
                        <button onClick={(e) => { e.stopPropagation(); setFrameInfoHover(null); }} style={{ position: "absolute", top: 6, right: 8, background: "none", border: "none", color: "#ffd23e", fontSize: 16, cursor: "pointer" }}>×</button>
                      </div>
                    )}

                    {/* % pill */}
                    <div style={{ position: "absolute", right: -2, bottom: -14, background: "rgba(10,58,87,0.85)", color: "#ffd23e", borderRadius: 12, padding: "2px 8px", fontSize: 11, fontWeight: 700, fontFamily: "Montserrat, system-ui", zIndex: 65, whiteSpace: "nowrap" }}>
                      {f.pct != null && f.pct < 1 ? "<1%" : `${f.pct ?? "?"}%`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Health conditions -- fixed section below lifespan chart */}
      {healthConditions[slug] && (
        <div style={{ position: "absolute", top: CHART_TOP - 25 + 576 + 24, left: LEFT_EDGE + INFO_W + CARD_GAP + 10 + 300, width: 560 }}>
          <HealthSection profile={healthConditions[slug]} />
        </div>
      )}

      {/* Famous dogs -- fixed section below health conditions */}
      {famousDogs[slug] && (
        <div style={{ position: "absolute", top: CHART_TOP - 25 + 576 + 24 + 750, left: LEFT_EDGE + INFO_W + CARD_GAP + 10 + 300, width: 900 }}>
          <FamousDogsSection dogs={famousDogs[slug]} />
        </div>
      )}

      {/* Card dock -- reopens minimised cards */}
      <CardDock
        items={ALL_DOCK_ITEMS.filter((item) => closedCards.has(item.id))}
        onReopen={reopenCard}
      />

      {/* Spacer to give canvas height */}
      <div style={{ height: FRAMES_TOP + 25 }} />
      {/* Back button */}
      <Link href="/home" className={styles.backBtn}>
        Back
      </Link>
    </div>
  );
}
