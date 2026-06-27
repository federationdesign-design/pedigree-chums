"use client";
import React, { useRef, useState } from "react";
import styles from "./StepCard.module.css";

export type StepRow = {
  icon: string;
  title: string;
  body: string;
};

export type StepData = {
  number: number;
  illustration: string;
  caption: string;
  heading: string;
  rows: StepRow[];
};

type CardInfo = {
  x: number; y: number;
  w: number; h: number;
  angle: number;
  image: string;
};

type Props = {
  step: StepData;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  totalSteps: number;
  onStepSelect: (i: number) => void;
  cardPos?: CardInfo | null;
};

const RADIUS = 16;

export default function StepCard({ step, onClose, onPrev, onNext, totalSteps, onStepSelect, cardPos }: Props) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number; moved: boolean; onCard: boolean } | null>(null);
  const suppressClick = useRef(false);

  const cx = pos?.x ?? cardPos?.x ?? (typeof window !== "undefined" ? window.innerWidth / 2 : 400);
  const cy = pos?.y ?? cardPos?.y ?? (typeof window !== "undefined" ? window.innerHeight / 2 : 300);
  const cw = cardPos?.w ?? 120;
  const ch = cardPos?.h ?? 120;
  const angle = cardPos?.angle ?? 0;
  const image = cardPos?.image ?? "";
  const angleDeg = (angle * 180) / Math.PI;

  // Check if a pointer event hit the card (rough AABB, good enough)
  const hitCard = (e: React.PointerEvent) => {
    const dx = e.clientX - cx, dy = e.clientY - cy;
    // rotate point into card local space to account for card angle
    const cos = Math.cos(-angle), sin = Math.sin(-angle);
    const lx = dx * cos - dy * sin, ly = dx * sin + dy * cos;
    return Math.abs(lx) <= cw / 2 + 8 && Math.abs(ly) <= ch / 2 + 8;
  };

  const onOverlayDown = (e: React.PointerEvent) => {
    suppressClick.current = false;
    const onCard = hitCard(e);
    dragRef.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: cx, oy: cy, moved: false, onCard };
  };

  const onOverlayMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) > 6) d.moved = true;
    if (d.moved && d.onCard) setPos({ x: d.ox + dx, y: d.oy + dy });
  };

  const onOverlayUp = () => {
    const d = dragRef.current;
    dragRef.current = null;
    if (d && d.moved) suppressClick.current = true;
  };

  const onOverlayClick = () => {
    if (suppressClick.current) { suppressClick.current = false; return; }
    onClose();
  };

  // Panel position -- opposite side from the card
  const panelStyle: React.CSSProperties = (() => {
    if (typeof window === "undefined") return {};
    const vw = window.innerWidth;
    const panelW = Math.min(620, vw * 0.52);
    const margin = 32;
    if (cx > vw / 2) {
      return { position: "fixed" as const, left: Math.max(margin, cx - cw / 2 - panelW - margin), top: "50%", transform: "translateY(-50%)", width: panelW };
    } else {
      return { position: "fixed" as const, left: Math.min(cx + cw / 2 + margin, vw - panelW - margin), top: "50%", transform: "translateY(-50%)", width: panelW };
    }
  })();

  return (
    <div
      className={styles.overlay}
      onPointerDown={onOverlayDown}
      onPointerMove={onOverlayMove}
      onPointerUp={onOverlayUp}
      onPointerCancel={onOverlayUp}
      onClick={onOverlayClick}
    >
      {/* The physical card -- SVG at its pit position */}
      <svg
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }}
        aria-hidden="true"
      >
        <defs>
          <clipPath id="htp-card-clip">
            <rect x={-cw / 2} y={-ch / 2} width={cw} height={ch} rx={RADIUS} />
          </clipPath>
        </defs>
        <g transform={`translate(${cx},${cy}) rotate(${angleDeg})`}>
          <rect x={-cw / 2} y={-ch / 2} width={cw} height={ch} rx={RADIUS} fill="#ffffff" />
          {image && (
            <image
              href={image}
              x={-cw / 2} y={-ch / 2}
              width={cw} height={ch}
              clipPath="url(#htp-card-clip)"
              preserveAspectRatio="xMidYMid slice"
            />
          )}
          <rect
            x={-cw / 2 - 4} y={-ch / 2 - 4}
            width={cw + 8} height={ch + 8}
            rx={RADIUS + 4}
            fill="none"
            stroke="var(--yellow, #ffd23e)"
            strokeWidth={5}
          />
        </g>
      </svg>

      {/* Close */}
      <button type="button" className={styles.close} onClick={(e: React.MouseEvent) => { e.stopPropagation(); onClose(); }} aria-label="Close">
        &times;
      </button>

      {/* Content panel */}
      <div className={styles.panel} style={panelStyle} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headingGroup}>
            <p className={styles.overline}>HOW TO PLAY...</p>
            <h2 className={styles.heading}>{step.heading}</h2>
          </div>
        </div>

        <div className={styles.rows}>
          {step.rows.map((row, i) => (
            <div key={i} className={styles.row}>
              <div className={styles.iconWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={row.icon} alt="" className={styles.icon} aria-hidden="true" />
              </div>
              <div className={styles.rowText}>
                <p className={styles.rowTitle}>{row.title}</p>
                <p className={styles.rowBody}>{row.body}</p>
              </div>
              {i < step.rows.length - 1 && <div className={styles.divider} />}
            </div>
          ))}
        </div>

        <div className={styles.navRow}>
          <button type="button" className={styles.nav} onClick={(e: React.MouseEvent) => { e.stopPropagation(); onPrev && onPrev(); }} disabled={!onPrev} aria-label="Previous step">
            &#8592;
          </button>
          <div className={styles.dots}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.dot} ${i === step.number - 1 ? styles.dotActive : ""}`}
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); onStepSelect(i); }}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>
          <button type="button" className={styles.nav} onClick={(e: React.MouseEvent) => { e.stopPropagation(); onNext && onNext(); }} disabled={!onNext} aria-label="Next step">
            &#8594;
          </button>
        </div>
      </div>
    </div>
  );
}
