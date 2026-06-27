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
  cardPos?: CardInfo | null;
};

const RADIUS = 16;

export default function StepCard({ step, onClose, cardPos }: Props) {
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

  const hitCard = (e: React.PointerEvent) => {
    const dx = e.clientX - cx, dy = e.clientY - cy;
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
    if (!d || e.pointerId !== d.id || !d.onCard) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) > 6) d.moved = true;
    if (d.moved) setPos({ x: d.ox + dx, y: d.oy + dy });
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

  // Panel sits on whichever side has more room
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
      {/* The card -- SVG at its pit position, no pointer events (overlay handles drag) */}
      <svg style={{ position: "fixed", inset: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }} aria-hidden="true">
        <defs>
          <clipPath id="htp-card-clip">
            <rect x={-cw / 2} y={-ch / 2} width={cw} height={ch} rx={RADIUS} />
          </clipPath>
        </defs>
        <g transform={`translate(${cx},${cy}) rotate(${angleDeg})`}>
          <rect x={-cw / 2} y={-ch / 2} width={cw} height={ch} rx={RADIUS} fill="#ffffff" />
          {image && (
            <image href={image} x={-cw / 2} y={-ch / 2} width={cw} height={ch} clipPath="url(#htp-card-clip)" preserveAspectRatio="xMidYMid slice" />
          )}
          <rect x={-cw / 2 - 4} y={-ch / 2 - 4} width={cw + 8} height={ch + 8} rx={RADIUS + 4} fill="none" stroke="var(--yellow, #ffd23e)" strokeWidth={5} />
        </g>
      </svg>

      {/* Close */}
      <button type="button" className={styles.close} onClick={(e: React.MouseEvent) => { e.stopPropagation(); onClose(); }} aria-label="Close">
        &times;
      </button>

      {/* Text panel -- radiates from the card like the family tree */}
      <div className={styles.panel} style={panelStyle} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className={styles.header}>
          <p className={styles.overline}>HOW TO PLAY...</p>
          <h2 className={styles.heading}>{step.heading}</h2>
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
      </div>
    </div>
  );
}
