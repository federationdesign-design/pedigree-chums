"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import styles from "./breed.module.css";
import BreedTree from "../../../components/BreedTree/BreedTree";
import BreedTreeMap from "../../../components/BreedTreeMap/BreedTreeMap";
import type { LineageNode } from "../../../data/lineage";
import LifespanChart from "../../../components/LifespanChart/LifespanChart";
import { lifespanCurves } from "../../../data/lifespanCurves";

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
}: {
  id: string;
  style: React.CSSProperties;
  className: string;
  children: React.ReactNode;
  onBringToFront: (id: string) => void;
  draggingStyle?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const origin = useRef({ px: 0, py: 0, ex: 0, ey: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, circle, svg")) return;
    e.preventDefault();
    onBringToFront(id);
    dragging.current = true;
    setIsDragging(true);
    const el = ref.current!;
    const rect = el.getBoundingClientRect();
    origin.current = { px: rect.left, py: rect.top, ex: e.clientX, ey: e.clientY };
    el.setPointerCapture(e.pointerId);
  }, [id, onBringToFront]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const el = ref.current!;
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
      <div className={styles.dragHandle}>
        <div className={styles.dragPips}>
          <span /><span /><span />
        </div>
      </div>
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

  const [zOrders, setZOrders] = useState({ tree: 11, infoBox: 12, ancestry: 13 });

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

  const bringToFront = useCallback((id: string) => {
    zCounter.current += 1;
    setZOrders((prev) => ({ ...prev, [id]: zCounter.current }));
  }, []);

  // Calculate initial pixel positions after mount


  return (
    <div className={styles.canvas}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.h1}>{name}</h1>
        <p className={styles.subtitle}>{info.subtitle}</p>
      </div>

      {/* Two cards side by side */}
      <div className={styles.cardsRow}>
        {/* Temperament card */}
        <DragCard
          id="infoBox"
          className={`${styles.card} ${styles.infoCard}`}
          style={{ position: "relative", zIndex: 12 }}
          onBringToFront={bringToFront}
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

        {/* Lifespan chart - above family tree */}
        {lifespanCurves[name] && (
          <LifespanChart breedName={name} />
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
