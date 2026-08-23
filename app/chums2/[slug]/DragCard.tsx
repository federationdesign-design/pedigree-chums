"use client";

import { useRef, useEffect, useCallback } from "react";
import styles from "./chums2.module.css";

export type Rect = { x: number; y: number; w: number; h: number };

// Draggable pop-out card for the v2 chum page. Lifted from the live page's
// DragCard pattern (app/chums/[slug]/BreedClient.tsx) into /chums2 so the live
// page is untouched, with one addition: it reports its measured rect (on mount,
// resize and after a drag) so Chums2Client's placement algorithm can open a new
// card in the first slot that overlaps no open card. (Brief 5.4.)
export default function DragCard({
  id, x, y, zIndex, onBringToFront, onClose, onRectChange, children, className, style,
}: {
  id: string;
  x: number;
  y: number;
  zIndex: number;
  onBringToFront: (id: string) => void;
  onClose: () => void;
  onRectChange: (id: string, rect: Rect) => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pos = useRef({ x, y });
  const drag = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);

  const report = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    onRectChange(id, { x: pos.current.x, y: pos.current.y, w: el.offsetWidth, h: el.offsetHeight });
  }, [id, onRectChange]);

  // Apply the placement position, and re-measure whenever size changes (content
  // images loading, cards with internal toggles) so open rects stay accurate.
  useEffect(() => {
    pos.current = { x, y };
    const el = ref.current;
    if (!el) return;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [x, y, report]);

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

  const onPointerUp = useCallback(() => {
    if (!drag.current) return;
    drag.current = null;
    report();
  }, [report]);

  return (
    <div
      ref={ref}
      data-card-id={id}
      className={`${styles.card} ${className ?? ""}`}
      style={{ position: "absolute", zIndex, ...style }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <button
        type="button"
        className={styles.cardClose}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Close card"
      >
        &times;
      </button>
      {children}
    </div>
  );
}
