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

const RADIUS = 16; // card corner radius in px

export default function StepCard({ step, onClose, onPrev, onNext, totalSteps, onStepSelect, cardPos }: Props) {
  // Draggable card position
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number } | null>(null);

  const cx = pos?.x ?? cardPos?.x ?? (typeof window !== "undefined" ? window.innerWidth / 2 : 400);
  const cy = pos?.y ?? cardPos?.y ?? (typeof window !== "undefined" ? window.innerHeight / 2 : 300);
  const cw = cardPos?.w ?? 120;
  const ch = cardPos?.h ?? 120;
  const angle = cardPos?.angle ?? 0;
  const image = cardPos?.image ?? "";
  const angleDeg = (angle * 180) / Math.PI;

  // Position content panel to the side of the card that has more space
  const panelStyle: React.CSSProperties = (() => {
    if (typeof window === "undefined") return {};
    const vw = window.innerWidth;
    const panelW = Math.min(520, vw * 0.44);
    const margin = 32;
    const cardRight = cx + cw / 2;
    const cardLeft = cx - cw / 2;
    if (cardRight > vw / 2) {
      // card is right of centre -- panel goes left
      const left = Math.max(margin, cardLeft - panelW - margin);
      return { position: "fixed" as const, left, top: "50%", transform: "translateY(-50%)", width: panelW };
    } else {
      // card is left of centre -- panel goes right
      const left = Math.min(cardRight + margin, vw - panelW - margin);
      return { position: "fixed" as const, left, top: "50%", transform: "translateY(-50%)", width: panelW };
    }
  })();

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch {}
    dragRef.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: cx, oy: cy };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current; if (!d || e.pointerId !== d.id) return;
    setPos({ x: d.ox + (e.clientX - d.sx), y: d.oy + (e.clientY - d.sy) });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current; if (d && e.pointerId === d.id) {
      try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch {}
      dragRef.current = null;
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>

      {/* The physical card -- SVG rendered at its pit position, draggable */}
      <svg
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }}
        aria-hidden="true"
      >
        <defs>
          <clipPath id="htp-card-clip">
            <rect x={-cw / 2} y={-ch / 2} width={cw} height={ch} rx={RADIUS} />
          </clipPath>
        </defs>
        <g
          transform={`translate(${cx},${cy}) rotate(${angleDeg})`}
          style={{ pointerEvents: "all", cursor: dragRef.current ? "grabbing" : "grab" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Card background */}
          <rect x={-cw / 2} y={-ch / 2} width={cw} height={ch} rx={RADIUS} fill="#ffffff" />
          {/* Card image */}
          {image && (
            <image
              href={image}
              x={-cw / 2}
              y={-ch / 2}
              width={cw}
              height={ch}
              clipPath="url(#htp-card-clip)"
              preserveAspectRatio="xMidYMid slice"
            />
          )}
          {/* Yellow border */}
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

      {/* Close button */}
      <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
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
          <button type="button" className={styles.nav} onClick={onPrev} disabled={!onPrev} aria-label="Previous step">
            &#8592;
          </button>
          <div className={styles.dots}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.dot} ${i === step.number - 1 ? styles.dotActive : ""}`}
                onClick={() => onStepSelect(i)}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>
          <button type="button" className={styles.nav} onClick={onNext} disabled={!onNext} aria-label="Next step">
            &#8594;
          </button>
        </div>

      </div>
    </div>
  );
}
