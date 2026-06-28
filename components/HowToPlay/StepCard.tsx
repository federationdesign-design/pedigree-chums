"use client";
import React, { useRef, useState, useCallback } from "react";
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
  hasPrev?: boolean;
  hasNext?: boolean;
  cardPos?: CardInfo | null;
};

const PANEL_W = 460;
const PANEL_GAP = 56;

function wrapText(text: string, charLimit = 46): string[] {
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

export default function StepCard({ step, onClose, onPrev, onNext, hasPrev, hasNext, cardPos }: Props) {
  // Card position -- starts at pit position, can be dragged independently
  const [cardDrag, setCardDrag] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  // Panel pan -- independent of card, pans the text content
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const cardDragRef = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);
  const panDragRef  = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  // Base card position from pit
  const baseX = cardPos?.x ?? (typeof window !== "undefined" ? window.innerWidth / 2 : 400);
  const baseY = cardPos?.y ?? (typeof window !== "undefined" ? window.innerHeight / 2 : 300);
  const cw = cardPos?.w ?? 140;
  const ch = cardPos?.h ?? 160;
  const angle = cardPos?.angle ?? 0;
  const image = cardPos?.image ?? "";
  const angleDeg = (angle * 180) / Math.PI;

  // Final card centre (base + drag)
  const cx = baseX + cardDrag.x;
  const cy = baseY + cardDrag.y;

  // Panel anchor: always to the right of the card centre, offset by pan
  const panelX = cx + cw / 2 + PANEL_GAP + pan.x;
  const panelY = cy - ch / 2 + pan.y;

  // ── Card drag handlers ──────────────────────────────────────────────────
  const onCardDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch {}
    cardDragRef.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: cardDrag.x, oy: cardDrag.y, moved: false };
  }, [cardDrag]);

  const onCardMove = useCallback((e: React.PointerEvent) => {
    const d = cardDragRef.current;
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) > 4) d.moved = true;
    if (d.moved) setCardDrag({ x: d.ox + dx, y: d.oy + dy });
  }, []);

  const onCardUp = useCallback((e: React.PointerEvent) => {
    const d = cardDragRef.current;
    if (d && e.pointerId === d.id) {
      try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch {}
      if (d.moved) suppressClick.current = true;
      cardDragRef.current = null;
    }
  }, []);

  // ── Panel pan handlers (backdrop drag) ─────────────────────────────────
  const onPanDown = useCallback((e: React.PointerEvent) => {
    suppressClick.current = false;
    panDragRef.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y, moved: false };
  }, [pan]);

  const onPanMove = useCallback((e: React.PointerEvent) => {
    const d = panDragRef.current;
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) > 6) d.moved = true;
    if (d.moved) setPan({ x: d.ox + dx, y: d.oy + dy });
  }, []);

  const onPanUp = useCallback(() => {
    const d = panDragRef.current;
    panDragRef.current = null;
    if (d && d.moved) suppressClick.current = true;
  }, []);

  // Tap on backdrop does nothing (like LineageMap -- X only closes)
  const onBackdropClick = useCallback(() => {
    if (suppressClick.current) { suppressClick.current = false; return; }
    // no-op: tap doesn't close
  }, []);

  const BORDER = Math.round(cw * 0.04);
  const FOOTER = Math.round(ch * 0.18);
  const illoH = ch - FOOTER - BORDER * 2;
  const illoRx = cw * 0.07;
  const headerH = 120;

  return (
    <div
      className={styles.overlay}
      onPointerDown={onPanDown}
      onPointerMove={onPanMove}
      onPointerUp={onPanUp}
      onPointerCancel={onPanUp}
      onClick={onBackdropClick}
    >
      <svg
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }}
        aria-hidden="true"
      >
        <defs>
          {image && (
            <clipPath id="sc-illo-clip">
              <rect x={-cw / 2 + BORDER} y={-ch / 2 + BORDER} width={cw - BORDER * 2} height={illoH} rx={illoRx} />
            </clipPath>
          )}
        </defs>

        {/* Tether line from card to panel */}
        <line
          x1={cx + cw / 2} y1={cy}
          x2={panelX} y2={panelY + ch / 2}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={2}
          strokeDasharray="6 8"
          pointerEvents="none"
        />

        {/* ── Card (draggable, rotated to pit angle) ── */}
        <g
          transform={`translate(${cx},${cy})`}
          style={{ cursor: "grab", pointerEvents: "all" }}
          onPointerDown={onCardDown}
          onPointerMove={onCardMove}
          onPointerUp={onCardUp}
          onPointerCancel={onCardUp}
        >
          {/* Yellow frame */}
          <rect x={-cw / 2} y={-ch / 2} width={cw} height={ch} rx={cw * 0.1} fill="#ffed00" />
          <g transform={`rotate(${angleDeg})`}>
            {image && (
              <>
                <image
                  href={image}
                  x={-cw / 2 + BORDER} y={-ch / 2 + BORDER}
                  width={cw - BORDER * 2} height={illoH}
                  clipPath="url(#sc-illo-clip)"
                  preserveAspectRatio="xMidYMid slice"
                />
                <text
                  x={0} y={ch / 2 - FOOTER / 2}
                  textAnchor="middle" dominantBaseline="central"
                  fontFamily="'Luckiest Guy', system-ui"
                  fontSize={Math.max(8, Math.round(FOOTER * 0.3))}
                  fill="#0a3a57"
                >
                  {step.caption}
                </text>
              </>
            )}
          </g>
        </g>

        {/* ── Text panel (tethered to card, independently pannable) ── */}
        <g
          transform={`translate(${panelX},${panelY})`}
          style={{ pointerEvents: "none" }}
        >
          {/* Step label */}
          <text
            y={0}
            fontFamily="var(--font-display,'Luckiest Guy',system-ui)"
            fontSize={20}
            fill="rgba(255,255,255,0.6)"
            letterSpacing="2"
          >
            HOW TO PLAY
          </text>

          {/* Step number + caption as heading */}
          <text
            y={52}
            fontFamily="var(--font-display,'Luckiest Guy',system-ui)"
            fontSize={52}
            fill="#ffed00"
          >
            {step.caption}
          </text>

          {/* Rows */}
          {step.rows.map((row, i) => {
            const bodyLines = wrapText(row.body);
            const prevRows = step.rows.slice(0, i);
            const ry2 = headerH + prevRows.reduce((acc, r) => acc + 44 + wrapText(r.body).length * 20 + 16, 0);
            return (
              <g key={i} transform={`translate(0, ${ry2})`}>
                {i > 0 && (
                  <line x1={0} y1={-8} x2={PANEL_W} y2={-8} stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} strokeDasharray="4 8" />
                )}
                <image href={row.icon} x={0} y={2} width={52} height={52} />
                <text x={68} y={18} fontFamily="Montserrat,sans-serif" fontSize={18} fontWeight="700" fill="#ffffff">{row.title}</text>
                {bodyLines.map((line, li) => (
                  <text key={li} x={68} y={38 + li * 20} fontFamily="Montserrat,sans-serif" fontSize={14} fontWeight="600" fill="rgba(255,255,255,0.85)">{line}</text>
                ))}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Close button -- X only, top right, like LineageMap */}
      <button
        type="button"
        className={styles.close}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Close"
      >
        &times;
      </button>

      {/* Prev / Next navigation */}
      {(hasPrev || hasNext) && (
        <div className={styles.nav}>
          <button
            type="button"
            className={`${styles.navBtn}${!hasPrev ? " " + styles.navBtnHidden : ""}`}
            onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
            aria-label="Previous step"
          >
            &#8592;
          </button>
          <span className={styles.navStep}>{step.number} / 6</span>
          <button
            type="button"
            className={`${styles.navBtn}${!hasNext ? " " + styles.navBtnHidden : ""}`}
            onClick={(e) => { e.stopPropagation(); onNext?.(); }}
            aria-label="Next step"
          >
            &#8594;
          </button>
        </div>
      )}
    </div>
  );
}
