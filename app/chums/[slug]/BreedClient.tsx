"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import styles from "./breed.module.css";
import BreedTree from "../../../components/BreedTree/BreedTree";
import BreedTreeMap from "../../../components/BreedTreeMap/BreedTreeMap";
import type { LineageNode } from "../../../data/lineage";
import LifespanChart from "../../../components/LifespanChart/LifespanChart";
import { lifespanCurves, EXPLANATION, METHOD, SOURCES } from "../../../data/lifespanCurves";

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
export default function BreedClient({ name, image, info, lineage }: Props) {
  const zCounter = useRef(20);
  const bringToFront = useCallback((id: string) => {
    zCounter.current += 1;
    setZOrders((prev) => ({ ...prev, [id]: zCounter.current }));
  }, []);

  const [zOrders, setZOrders] = useState({ infoBox: 12, ancestry: 13, lifespanChart: 14, lifespanExplain: 15 });
  const [closedCards, setClosedCards] = useState<Set<string>>(new Set());
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
    const total = (lineage.children as any[])?.reduce((s: number, c: any) => s + (c.value ?? 0), 0) || 1;
    return ((lineage.children as any[]) || [])
      .map((c: any) => ({ name: c.name, pct: Math.round((c.value ?? 0) / total * 100) }))
      .filter((a: any) => a.pct > 0)
      .sort((a: any, b: any) => b.pct - a.pct)
      .slice(0, 8);
  }, [lineage]);

  const hasLifespan = !!lifespanCurves[name];

  // Fixed layout positions
  const HEADER_H = 180;    // approx height of H1+H2
  const CARD_TOP = HEADER_H + 20;
  const LEFT_EDGE = 48;
  const CARD_GAP = 10;
  const INFO_W = 420;
  const ANCESTRY_W = 340;
  const CHART_TOP = CARD_TOP;
  const EXPLAIN_TOP = CARD_TOP + 280; // below chart
  const DIAGRAM_TOP = CARD_TOP + 520; // below cards
  const CIRCLE_LEFT = LEFT_EDGE;
  const TREE_LEFT = CIRCLE_LEFT + 820; // right of circular diagram

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
        <DragCard id="ancestry" initialX={LEFT_EDGE} initialY={CARD_TOP + 340} zIndex={zOrders.ancestry}
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
        <div style={{ position: "absolute", left: LEFT_EDGE + INFO_W + CARD_GAP, top: CHART_TOP, marginTop: -25 }}>
          <LifespanChart breedName={name} />
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

      {/* Family tree - fixed position to right of circular */}
      {lineage && (
        <div style={{ position: "absolute", left: TREE_LEFT, top: DIAGRAM_TOP }}>
          <BreedTreeMap lineage={lineage} rootImage={image} />
        </div>
      )}

      {/* Spacer to give canvas height */}
      <div style={{ height: DIAGRAM_TOP + 1200 }} />

      {/* Back button */}
      <Link href="/home" className={styles.backBtn}>
        Back
      </Link>
    </div>
  );
}
