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
          style={{ position: "absolute", top: 8, right: 12, background: "none", border: "none", color: "var(--yellow, #ffd23e)", fontSize: 28, cursor: "pointer", lineHeight: 1, padding: 0, zIndex: 1, fontWeight: 700 }}
        >×</button>
      )}
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BreedClient({ name, slug, image, info, lineage }: Props) {
  const zCounter = useRef(20);
  const bringToFront = useCallback((id: string) => {
    zCounter.current += 1;
    setZOrders((prev) => ({ ...prev, [id]: zCounter.current }));
  }, []);

  const [zOrders, setZOrders] = useState({ infoBox: 12, ancestry: 13, lifespanChart: 14, lifespanExplain: 15, familyTree: 10 });
  const [closedCards, setClosedCards] = useState<Set<string>>(new Set());
  type PageFrame = { id: string; name: string; img: string; pct?: number; note?: string; status?: string | null; filled: boolean; shake: boolean };
  const [frames, setFrames] = useState<PageFrame[]>([]);
  const [frameFlash, setFrameFlash] = useState<string | null>(null);
  const [filledIds, setFilledIds] = useState<string[]>([]);
  const [dragName, setDragName] = useState<string | null>(null);
  const [draggingImg, setDraggingImg] = useState<string | null>(null);
  const [frameInfoHover, setFrameInfoHover] = useState<string | null>(null);

  const handleFramesReady = useCallback((nodes: FrameNode[]) => {
    setFrames((prev) => {
      if (prev.length > 0) return prev; // already populated, ignore duplicate calls
      const seen = new Set<string>();
      return nodes.filter((n) => {
        if (seen.has(n.id)) return false;
        seen.add(n.id);
        return true;
      }).map((n) => ({ ...n, filled: false, shake: false }));
    });
  }, []);

  const handleDragName = useCallback((name: string | null) => {
    setDragName(name);
    if (name) {
      const frame = frames.find((f) => f.name === name);
      setDraggingImg(frame?.img ?? null);
    } else {
      setDraggingImg(null);
    }
  }, [frames]);

  const handleImageDropped = useCallback((nodeId: string, nodeName: string, clientX: number, clientY: number) => {
    setDragName(null);
    document.querySelectorAll<HTMLElement>("[data-frame]").forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        const frameId = el.dataset.frame!;
        setFrames((prev) => {
          const frame = prev.find((f) => f.id === frameId);
          const node = prev.find((f) => f.id === nodeId);
          if (frame && node && frame.img === node.img && !frame.filled) {
            setFilledIds((ids) => [...ids, nodeId]);
            setFrameFlash(frameId);
            setTimeout(() => setFrameFlash(null), 600);
            return prev.map((f) => f.id === frameId ? { ...f, filled: true } : f);
          } else if (frame && !frame.filled) {
            setTimeout(() => setFrames((p) => p.map((f) => f.id === frameId ? { ...f, shake: false } : f)), 400);
            return prev.map((f) => f.id === frameId ? { ...f, shake: true } : f);
          }
          return prev;
        });
      }
    });
  }, []);
  const closeCard = useCallback((id: string) => setClosedCards((prev) => new Set([...prev, id])), []);

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
  const TREE_TOP = DIAGRAM_TOP + 400; // tree 400px lower than circle
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
        </DragCard>
      )}

      {/* Ancestry card - below temperament */}
      {!closedCards.has("ancestry") && lineage && ancestryBreakdown.length > 0 && (
        <DragCard id="ancestry" initialX={LEFT_EDGE} initialY={CARD_TOP + 276} zIndex={zOrders.ancestry}
          onBringToFront={bringToFront} onClose={() => closeCard("ancestry")}
          style={{ width: ANCESTRY_W, padding: "0 0 16px" }}>
          <p className={styles.infoHeading} style={{ padding: "16px 16px 0" }}>Ancestry</p>
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

      {/* Running cost card - fixed, to the right of lifespan chart */}
      {runningCosts[slug] && (
        <div style={{ position: "absolute", left: LEFT_EDGE + INFO_W + CARD_GAP + 10 + 1008 + 24, top: CHART_TOP, marginTop: -25, zIndex: 5 }}>
          <RunningCostCard config={runningCosts[slug]} />
        </div>
      )}

      {/* Lifespan explanation card */}
      {!closedCards.has("lifespanExplain") && hasLifespan && (
        <DragCard id="lifespanExplain" initialX={LEFT_EDGE + INFO_W + CARD_GAP} initialY={EXPLAIN_TOP}
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
        <div style={{ position: "absolute", left: CIRCLE_LEFT, top: DIAGRAM_TOP }}
          ref={(el) => {
            if (!el) return;
            const stage = el.querySelector("[class*=stage]") as HTMLElement | null;
            if (stage) stage.style.zIndex = "1";
          }}>
          <BreedTree root={lineage} rootImage={image} centred size={760} hideLabels />
        </div>
      )}

      {/* Family tree - draggable, starts at right of circular */}
      {lineage && (
        <DragCard id="familyTree" initialX={TREE_LEFT} initialY={TREE_TOP} zIndex={10}
          onBringToFront={bringToFront}
          className=""
          style={{ background: "transparent", border: "none", boxShadow: "none", cursor: "default" }}>
          <BreedTreeMap lineage={lineage} rootImage={image} filledIds={filledIds} onFramesReady={handleFramesReady} onImageDropped={handleImageDropped} onDragName={handleDragName} />
        </DragCard>
      )}

      {/* Ancestor pack frames - far left */}
      {frames.length > 0 && (
        <div style={{ position: "absolute", left: LEFT_EDGE, top: FRAMES_TOP }}>
          <p style={{ fontFamily: "var(--font-display,'Luckiest Guy',system-ui)", fontSize: 78, letterSpacing: "0.1em", color: "var(--yellow,#ffd23e)", margin: "0 0 24px", textTransform: "uppercase", lineHeight: 1 }}>Ancestor Pack</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, maxWidth: 1200 }}>
            {frames.map((f) => (
              <div key={f.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div
                  data-frame={f.id}
                  style={{
                    width: 77, height: 77, borderRadius: 10,
                    border: f.filled ? "4px solid #22c55e" : draggingImg === f.img ? "4px solid #ffd23e" : "4px dashed rgba(255,255,255,0.3)",
                    background: "transparent", display: "flex", alignItems: "center", justifyContent: "center",
                    position: "relative", overflow: "visible", transition: "border-color 0.2s",
                    animation: f.shake ? "frameShake 0.4s ease" : frameFlash === f.id ? "frameFlash 0.6s ease" : "none"
                  }}
                >
                  {f.filled
                    ? (
                      <div style={{ position: "relative", width: "100%", height: "100%" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={f.img} alt={f.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 16, display: "block" }} />

                        {/* Status dot - top left (matches pit colour system) */}
                        <div title={f.status ?? "unknown"} style={{
                          position: "absolute", left: -4, top: -4, width: 14, height: 14,
                          borderRadius: "50%", border: "2px solid #ffffff", pointerEvents: "none",
                          background: f.status === "extinct" ? "#d64545" : f.status === "trending" ? "#2e9e5b" : f.status === "endangered" ? "#ff7a3c" : f.status === "in-decline" ? "#ffb02e" : "#4ade80"
                        }} />

                        {/* Info i - top right */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setFrameInfoHover(frameInfoHover === f.id ? null : f.id); }}
                          onPointerDown={(e) => e.stopPropagation()}
                          style={{ position: "absolute", right: -14, top: -14, width: 28, height: 28, border: "2px solid #fff", borderRadius: "50%", background: "var(--blue-deep, #0b78bd)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, fontStyle: "italic", fontWeight: 700, fontSize: 14, fontFamily: "Georgia, serif", zIndex: 65 }}
                        >i</button>
                        {frameInfoHover === f.id && (
                          <div style={{ position: "absolute", left: 0, top: 20, background: "rgba(10,58,87,0.96)", border: "1.5px solid rgba(255,210,62,0.4)", borderRadius: 12, padding: "10px 14px", zIndex: 200, minWidth: 200, maxWidth: 260, boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            <p style={{ fontFamily: "var(--font-display,'Luckiest Guy',system-ui)", fontSize: 13, color: "#ffd23e", margin: "0 0 4px", letterSpacing: "0.05em" }}>{f.name}</p>
                            {f.note && <p style={{ fontFamily: "var(--font-body,'Montserrat',system-ui)", fontSize: 11, color: "#ffffff", margin: 0, lineHeight: 1.5 }}>{f.note}</p>}
                            <p style={{ fontFamily: "var(--font-body,'Montserrat',system-ui)", fontSize: 10, color: "rgba(255,255,255,0.6)", margin: "6px 0 0", fontStyle: "italic" }}>Status: {f.status ?? "unknown"}</p>
                            <button onClick={(e) => { e.stopPropagation(); setFrameInfoHover(null); }} style={{ position: "absolute", top: 6, right: 8, background: "none", border: "none", color: "#ffd23e", fontSize: 16, cursor: "pointer" }}>×</button>
                          </div>
                        )}

                        {/* % pill - bottom right, clickable */}
                        <div
                          onClick={(e) => { e.stopPropagation(); }}
                          onPointerDown={(e) => e.stopPropagation()}
                          style={{ position: "absolute", right: -2, bottom: -14, background: "rgba(10,58,87,0.85)", color: "#ffd23e", borderRadius: 12, padding: "2px 8px", fontSize: 11, fontWeight: 700, cursor: "default", fontFamily: "Montserrat, system-ui", zIndex: 65, whiteSpace: "nowrap" }}
                        >
                          {f.pct != null && f.pct < 1 ? "<1%" : `${f.pct ?? "?"}%`}
                        </div>
                      </div>
                    )
                    : (
                      <span style={{ fontFamily: "var(--font-body,'Montserrat',system-ui)", fontSize: 11, fontWeight: 700, color: "#ffffff", textAlign: "center", lineHeight: 1.3, padding: "4px 6px", display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>{f.name}</span>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spacer to give canvas height */}
      <div style={{ height: FRAMES_TOP + 80 }} />
      {/* Back button */}
      <Link href="/home" className={styles.backBtn}>
        Back
      </Link>
    </div>
  );
}
