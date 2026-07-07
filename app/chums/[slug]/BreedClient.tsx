"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import styles from "./breed.module.css";
import BreedTree from "../../../components/BreedTree/BreedTree";
import BreedTreeMap from "../../../components/BreedTreeMap/BreedTreeMap";
import type { LineageNode } from "../../../data/lineage";

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
const DEFAULTS = {
  photo:    { x: 0.04, y: 0.28 },
  tree:     { x: 0.30, y: 0.10 },
  infoBox:  { x: 0.04, y: 0.62 },
  familyTree: { x: 0.62, y: 0.12 },
};

function DragCard({
  id,
  style,
  className,
  children,
  onBringToFront,
}: {
  id: string;
  style: React.CSSProperties;
  className: string;
  children: React.ReactNode;
  onBringToFront: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const origin = useRef({ px: 0, py: 0, ex: 0, ey: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Don't drag if clicking interactive elements inside
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
      style={style}
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
  const [zOrders, setZOrders] = useState({ photo: 10, tree: 11, infoBox: 12, familyTree: 13 });
  const zCounter = useRef(20);

  const bringToFront = useCallback((id: string) => {
    zCounter.current += 1;
    setZOrders((prev) => ({ ...prev, [id]: zCounter.current }));
  }, []);

  // Calculate initial pixel positions after mount
  const [positions, setPositions] = useState<Record<string, { left: string; top: string }>>({});
  useEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    setPositions({
      photo:      { left: `${DEFAULTS.photo.x * vw}px`,      top: `${DEFAULTS.photo.y * vh}px` },
      tree:       { left: `${DEFAULTS.tree.x * vw}px`,       top: `${DEFAULTS.tree.y * vh}px` },
      infoBox:    { left: `${DEFAULTS.infoBox.x * vw}px`,    top: `${DEFAULTS.infoBox.y * vh}px` },
      familyTree: { left: `${DEFAULTS.familyTree.x * vw}px`, top: `${DEFAULTS.familyTree.y * vh}px` },
    });
  }, []);

  if (!positions.photo) return null; // wait for positions before rendering

  return (
    <div className={styles.canvas}>
      {/* Title — static, not draggable */}
      <div className={styles.titleBlock}>
        <h1 className={styles.h1}>{name}</h1>
        <p className={styles.subtitle}>{info.subtitle}</p>
      </div>

      {/* Photo card */}
      <DragCard
        id="photo"
        className={`${styles.card} ${styles.photoCard}`}
        style={{ ...positions.photo, zIndex: zOrders.photo }}
        onBringToFront={bringToFront}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={name} className={styles.photoImg} draggable={false} />
      </DragCard>

      {/* Family tree card */}
      {lineage && positions.tree && (
        <div
          style={{
            position: "absolute",
            left: positions.tree.left,
            top: positions.tree.top,
            zIndex: zOrders.tree,
            width: 680,
            height: 680,
            overflow: "visible",
          }}
        >
          <BreedTree root={lineage} rootImage={image} centred />
        </div>
      )}

      {/* Info card */}
      <DragCard
        id="infoBox"
        className={`${styles.card} ${styles.infoCard}`}
        style={{ ...positions.infoBox, zIndex: zOrders.infoBox }}
        onBringToFront={bringToFront}
      >
        <div className={styles.infoSection}>
          <p className={styles.infoHeading}>Temperament</p>
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

      {/* Family tree - loose on canvas, no container, draggable */}
      {lineage && positions.familyTree && (
        <div
          style={{
            position: "absolute",
            left: positions.familyTree.left,
            top: positions.familyTree.top,
            zIndex: zOrders.familyTree,
            width: 700,
            height: 700,
            overflow: "visible",
            cursor: "grab",
            touchAction: "none",
            userSelect: "none" as const,
          }}
          onPointerDown={(e) => {
            if ((e.target as Element).closest("[data-node]")) return;
            const el = e.currentTarget;
            bringToFront("familyTree");
            const rect = el.getBoundingClientRect();
            const ox = e.clientX - rect.left, oy = e.clientY - rect.top;
            el.setPointerCapture(e.pointerId);
            let active = true;
            const onMove = (ev: PointerEvent) => { if (!active) return; el.style.left = `${ev.clientX - ox}px`; el.style.top = `${ev.clientY - oy}px`; };
            const onUp = () => { active = false; el.style.cursor = "grab"; window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
            el.style.cursor = "grabbing";
            window.addEventListener("pointermove", onMove);
            window.addEventListener("pointerup", onUp);
          }}
        >
          <BreedTreeMap lineage={lineage} rootImage={image} />
        </div>
      )}

      {/* Back button */}
      <Link href="/home" className={styles.backBtn}>
        ← All chums
      </Link>
    </div>
  );
}
