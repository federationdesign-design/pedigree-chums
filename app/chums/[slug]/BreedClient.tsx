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

// Default positions for each card (as % of viewport)

function DragCard({
  id,
  style,
  className,
  children,
  onBringToFront,
  draggingStyle,
  onClose,
}: {
  id: string;
  style: React.CSSProperties;
  className: string;
  children: React.ReactNode;
  onBringToFront: (id: string) => void;
  draggingStyle?: React.CSSProperties;
  onClose?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const origin = useRef({ px: 0, py: 0, ex: 0, ey: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, circle, svg, details, summary")) return;
    e.preventDefault();
    onBringToFront(id);
    dragging.current = true;
    setIsDragging(true);
    const el = ref.current!;
    const canvas = el.closest("[data-canvas]") as HTMLElement | null;
    const canvasRect = canvas?.getBoundingClientRect() ?? { left: 0, top: 0 };
    const rect = el.getBoundingClientRect();
    // Switch to absolute positioning relative to canvas
    el.style.position = "absolute";
    el.style.left = `${rect.left - canvasRect.left + (canvas?.scrollLeft ?? 0)}px`;
    el.style.top = `${rect.top - canvasRect.top + (canvas?.scrollTop ?? 0)}px`;
    el.style.margin = "0";
    origin.current = { px: rect.left - canvasRect.left + (canvas?.scrollLeft ?? 0), py: rect.top - canvasRect.top + (canvas?.scrollTop ?? 0), ex: e.clientX, ey: e.clientY };
    el.setPointerCapture(e.pointerId);
  }, [id, onBringToFront]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const el = ref.current!;
    const canvas = el.closest("[data-canvas]") as HTMLElement | null;
    const canvasRect = canvas?.getBoundingClientRect() ?? { left: 0, top: 0 };
    const dx = e.clientX - origin.current.ex;
    const dy = e.clientY - origin.current.ey;
    el.style.left = `${origin.current.px + dx}px`;
    el.style.top  = `${origin.current.py + dy}px`;
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
    setIsDragging(false);
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} ${isDragging ? styles.cardDragging : ""}`}
      style={{ ...style, ...(isDragging && draggingStyle ? draggingStyle : {}) }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {onClose && (
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            style={{ position: "absolute", top: 10, right: 12, background: "none", border: "none", color: "var(--yellow, #ffd23e)", fontSize: 28, cursor: "pointer", lineHeight: 1, padding: 0, zIndex: 1, fontWeight: 700 }}
          >×</button>
        )}
      {children}
    </div>
  );
}

export default function BreedClient({ name, image, info, lineage }: Props) {
  // Enable horizontal scroll for this wide canvas page
  useEffect(() => {
    const prev = document.documentElement.style.overflowX;
    document.documentElement.style.overflowX = "auto";
    document.body.style.overflowX = "auto";
    return () => {
      document.documentElement.style.overflowX = prev;
      document.body.style.overflowX = "";
    };
  }, []);

  const [zOrders, setZOrders] = useState({ tree: 11, infoBox: 12, ancestry: 13, lifespanExplain: 15 });

  // Compute top-level ancestry from lineage
  const ancestryBreakdown = useMemo(() => {
    if (!lineage) return [];
    const total = (lineage.children as any[])?.reduce((s: number, c: any) => s + (c.value ?? 0), 0) || 1;
    return ((lineage.children as any[]) || [])
      .map((c: any) => ({
        name: c.name,
        pct: Math.round(((c.value ?? 0) / total) * 100),
        note: c.note,
      }))
      .filter((c: any) => c.pct > 0)
      .sort((a: any, b: any) => b.pct - a.pct);
  }, [lineage]);
  const zCounter = useRef(20);
  const [closedCards, setClosedCards] = useState<Set<string>>(new Set());
  const closeCard = useCallback((id: string) => setClosedCards((prev) => new Set([...prev, id])), []);


  const bringToFront = useCallback((id: string) => {
    zCounter.current += 1;
    setZOrders((prev) => ({ ...prev, [id]: zCounter.current }));
  }, []);

  // Calculate initial pixel positions after mount


  return (
    <div className={styles.canvas} data-canvas="true">
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.h1}>{name}</h1>
        <p className={styles.subtitle}>{info.subtitle}</p>
      </div>

      {/* Two cards side by side */}
      <div className={styles.cardsRow}>
        {/* Temperament + ancestry in a column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <DragCard
          id="infoBox"
          className={`${styles.card} ${styles.infoCard}`}
          style={{ position: "relative", zIndex: 12 }}
          onBringToFront={bringToFront}
          onClose={() => closeCard("infoBox")}
          draggingStyle={{ background: "#ffffff", color: "var(--navy, #0a3a57)", border: "2px solid var(--navy, #0a3a57)" }}
        >
          <p className={styles.infoHeading}>Temperament</p>
          <div className={styles.infoSection}>
            <div className={styles.temperamentTags}>
              {info.temperament.map((t) => (
                <span key={t} className={styles.tag}>{t}</span>
              ))}
            </div>
          </div>
          <div className={styles.divider} />
          <div className={styles.infoSection}>
            <div className={styles.prosConsGrid}>
              <div className={styles.prosCol}>
                <p className={`${styles.prosConsHead} ${styles.pros}`}>Pros</p>
                <ul className={styles.prosConsList}>
                  {info.pros.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </div>
              <div className={styles.consCol}>
                <p className={`${styles.prosConsHead} ${styles.cons}`}>Cons</p>
                <ul className={styles.prosConsList}>
                  {info.cons.map((c) => <li key={c}>{c}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </DragCard>

        {/* Ancestry card */}
        {lineage && ancestryBreakdown.length > 0 && (
          <DragCard
            id="ancestry"
            className={`${styles.card} ${styles.ancestryCard}`}
            style={{ position: "relative", zIndex: 13 }}
            onBringToFront={bringToFront}
            onClose={() => closeCard("ancestry")}
          >
            <p className={styles.infoHeading} style={{ padding: "16px 20px 0" }}>Ancestry</p>
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
        </div>

        {/* Lifespan chart - in cards row */}
        {lifespanCurves[name] && (
          <div style={{ marginTop: -25 }}><LifespanChart breedName={name} /></div>
        )}

        {/* Lifespan explanation card */}
        {lifespanCurves[name] && (
          <DragCard
            id="lifespanExplain"
            className={`${styles.card}`}
            style={{ position: "relative", zIndex: 15, padding: "16px 20px 20px", width: "clamp(380px, 46vw, 620px)", flexShrink: 0 }}
            onBringToFront={bringToFront}
            onClose={() => closeCard("ancestry")}
          >
            <p className={styles.infoHeading} style={{ paddingLeft: 0 }}>The Lifespan Diagram</p>
            <p style={{ fontFamily: "var(--font-body,'Montserrat',system-ui)", fontSize: 12, fontWeight: 600, lineHeight: 1.6, color: "#ffffff", margin: "0 0 12px" }}>"A visual guide to how this breed moves through life. The horizontal axis shows age from birth to old age; the vertical axis represents overall function, health and quality of life. The curve rises quickly through puppyhood, holds high during the prime adult years, then gradually declines into the senior stage. The exact shape varies by breed — this diagram makes those differences easy to understand at a glance. This is a conceptual illustration, not a clinical or veterinary prediction for any individual dog."</p>
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
      </div>

      {/* Diagrams row */}
      <div className={styles.diagramsRow}>
        {/* Circular diagram - free, no container */}
        {lineage && (
          <div ref={(el) => {
            if (!el) return;
            const stage = el.querySelector("[class*=stage]") as HTMLElement | null;
            if (stage) stage.style.zIndex = "1";
          }}>
            <BreedTree root={lineage} rootImage={image} centred size={760} hideLabels />
          </div>
        )}

        {/* Family tree - free, natural size */}
        {lineage && (
          <BreedTreeMap lineage={lineage} rootImage={image} />
        )}

      </div>

      {/* Back button */}
      <Link href="/home" className={styles.backBtn}>
        ← All chums
      </Link>
    </div>
  );
}
