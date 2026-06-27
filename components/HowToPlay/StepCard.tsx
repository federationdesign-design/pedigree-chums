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
const PANEL_W = 480;
const PANEL_GAP = 32;

// Simple word wrapper for SVG text -- splits into lines of max ~charLimit chars
function wrapText(text: string, charLimit = 48): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > charLimit) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = current ? current + " " + word : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

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
    const d = dragRef.current; dragRef.current = null;
    if (d && d.moved) suppressClick.current = true;
  };
  const onOverlayClick = () => {
    if (suppressClick.current) { suppressClick.current = false; return; }
    onClose();
  };

  // Panel sits to the right of the card (in SVG space, unrotated)
  const panelX = cw / 2 + PANEL_GAP;
  const panelY = -ch / 2;
  const headerH = 100;

  return (
    <div
      className={styles.overlay}
      onPointerDown={onOverlayDown}
      onPointerMove={onOverlayMove}
      onPointerUp={onOverlayUp}
      onPointerCancel={onOverlayUp}
      onClick={onOverlayClick}
    >
      <svg style={{ position: "fixed", inset: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }} aria-hidden="true">
        <defs>
          <clipPath id="htp-card-clip">
            <rect x={-cw / 2} y={-ch / 2} width={cw} height={ch} rx={RADIUS} />
          </clipPath>
        </defs>

        {/* Everything in one group -- card + panel -- translates together */}
        <g transform={`translate(${cx},${cy})`}>

          {/* Card (rotated to match pit angle) */}
          <g transform={`rotate(${angleDeg})`}>
            <rect x={-cw / 2} y={-ch / 2} width={cw} height={ch} rx={RADIUS} fill="#ffffff" />
            {image && (
              <image href={image} x={-cw / 2} y={-ch / 2} width={cw} height={ch} clipPath="url(#htp-card-clip)" preserveAspectRatio="xMidYMid slice" />
            )}
            <rect x={-cw / 2 - 4} y={-ch / 2 - 4} width={cw + 8} height={ch + 8} rx={RADIUS + 4} fill="none" stroke="var(--yellow, #ffd23e)" strokeWidth={5} />
          </g>

          {/* Text panel -- always upright, offset to the right of the card */}
          <g transform={`translate(${panelX}, ${panelY})`} style={{ pointerEvents: "none" }}>
            {/* Heading */}
            <text
              y={0}
              fontFamily="var(--font-display,'Luckiest Guy',system-ui)"
              fontSize={18}
              fill="rgba(255,255,255,0.8)"
              letterSpacing="1"
            >
              HOW TO PLAY...
            </text>
            <text
              y={52}
              fontFamily="var(--font-display,'Luckiest Guy',system-ui)"
              fontSize={52}
              fill="var(--yellow,#ffd23e)"
            >
              {step.heading}
            </text>

            {/* Rows */}
            {step.rows.map((row, i) => {
              const bodyLines = wrapText(row.body);
              const prevRows = step.rows.slice(0, i);
              const ry = headerH + prevRows.reduce((acc, r) => acc + 36 + wrapText(r.body).length * 18 + 16, 0);
              return (
                <g key={i} transform={`translate(0, ${ry})`}>
                  {i > 0 && (
                    <line x1={0} y1={-8} x2={PANEL_W} y2={-8} stroke="rgba(255,255,255,0.3)" strokeWidth={2} strokeDasharray="5 10" />
                  )}
                  <image href={row.icon} x={0} y={0} width={44} height={44} />
                  <text x={56} y={16} fontFamily="Montserrat,sans-serif" fontSize={16} fontWeight="700" fill="#ffffff">{row.title}</text>
                  {bodyLines.map((line, li) => (
                    <text key={li} x={56} y={36 + li * 18} fontFamily="Montserrat,sans-serif" fontSize={13} fontWeight="600" fill="rgba(255,255,255,0.88)">{line}</text>
                  ))}
                </g>
              );
            })}
          </g>

        </g>
      </svg>

      {/* Close button -- fixed top right like LineageMap */}
      <button type="button" className={styles.close} onClick={(e: React.MouseEvent) => { e.stopPropagation(); onClose(); }} aria-label="Close">
        &times;
      </button>
    </div>
  );
}
