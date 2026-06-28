"use client";
import React, { useRef, useState, useCallback, useEffect } from "react";
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
  onScore?: (pts: number) => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  cardPos?: CardInfo | null;
};

const NODE_W = 280;
const NODE_H = 88;
const NODE_RX = 14;
const NODE_GAP_Y = 130;
const NODE_OFFSET_X = 160;
const CHAIN_TOP = 60;
const ICON_SIZE = 40;
const ROW_PTS = 400;
const BONUS_PTS = 1000;

const seenRows = new Set<string>();

function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const cx1 = x1 + dx / 3 * 2;
  const cy1 = y1;
  const cx2 = x1 + dx / 3;
  const cy2 = y2;
  return `M${x1},${y1} C${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`;
}

function wrapText(text: string, charLimit = 32): string[] {
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

export default function StepCard({ step, onClose, onScore, onPrev, onNext, hasPrev, hasNext, cardPos }: Props) {
  const [unlocked, setUnlocked] = useState(1);
  const [cardDrag, setCardDrag] = useState({ x: 0, y: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const cardDragRef = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);
  const panRef = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    setUnlocked(1);
    setPan({ x: 0, y: 0 });
    setCardDrag({ x: 0, y: 0 });
  }, [step.number]);

  const awardRow = useCallback((rowIdx: number) => {
    const key = `${step.number}:${rowIdx}`;
    if (seenRows.has(key)) return;
    seenRows.add(key);
    onScore?.(ROW_PTS);
    const allSeen = step.rows.every((_, i) => seenRows.has(`${step.number}:${i}`));
    if (allSeen) onScore?.(BONUS_PTS);
  }, [step, onScore]);

  const unlockNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setUnlocked((u) => {
      const next = Math.min(u + 1, step.rows.length);
      if (next > u) awardRow(next - 1);
      return next;
    });
  }, [step.rows.length, awardRow]);

  const baseX = cardPos?.x ?? (typeof window !== "undefined" ? window.innerWidth / 2 : 400);
  const baseY = cardPos?.y ?? (typeof window !== "undefined" ? window.innerHeight / 2 : 300);
  const cw = cardPos?.w ?? 140;
  const ch = cardPos?.h ?? 160;
  const angle = cardPos?.angle ?? 0;
  const image = cardPos?.image ?? "";
  const angleDeg = (angle * 180) / Math.PI;
  const BORDER = Math.round(cw * 0.04);
  const FOOTER = Math.round(ch * 0.18);
  const illoH = ch - FOOTER - BORDER * 2;

  const cx = baseX + cardDrag.x + pan.x;
  const cy = baseY + cardDrag.y + pan.y;

  const nodePositions = step.rows.map((_, i) => ({
    x: cx + (i % 2 === 0 ? -NODE_OFFSET_X : NODE_OFFSET_X),
    y: cy + ch / 2 + CHAIN_TOP + i * NODE_GAP_Y,
  }));

  const cardBottom = { x: cx, y: cy + ch / 2 };
  const nodeTop = (i: number) => ({ x: nodePositions[i].x, y: nodePositions[i].y - NODE_H / 2 });
  const nodeBottom = (i: number) => ({ x: nodePositions[i].x, y: nodePositions[i].y + NODE_H / 2 });

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

  const onPanDown = useCallback((e: React.PointerEvent) => {
    suppressClick.current = false;
    panRef.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y, moved: false };
  }, [pan]);

  const onPanMove = useCallback((e: React.PointerEvent) => {
    const d = panRef.current;
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) > 6) d.moved = true;
    if (d.moved) setPan({ x: d.ox + dx, y: d.oy + dy });
  }, []);

  const onPanUp = useCallback(() => {
    const d = panRef.current; panRef.current = null;
    if (d && d.moved) suppressClick.current = true;
  }, []);

  const allUnlocked = unlocked >= step.rows.length;

  return (
    <div
      className={styles.overlay}
      onPointerDown={onPanDown}
      onPointerMove={onPanMove}
      onPointerUp={onPanUp}
      onPointerCancel={onPanUp}
      onClick={() => { if (suppressClick.current) suppressClick.current = false; }}
    >
      <svg
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }}
        aria-hidden="true"
      >
        <defs>
          {image && (
            <clipPath id="sc-card-clip">
              <rect x={-cw / 2 + BORDER} y={-ch / 2 + BORDER} width={cw - BORDER * 2} height={illoH} rx={cw * 0.07} />
            </clipPath>
          )}
        </defs>

        <path
          d={bezierPath(cardBottom.x, cardBottom.y, nodeTop(0).x, nodeTop(0).y)}
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth={2}
          strokeDasharray="5 7"
        />
        {step.rows.slice(0, -1).map((_, i) => {
          const isUnlocked = unlocked > i + 1;
          return (
            <path
              key={i}
              d={bezierPath(nodeBottom(i).x, nodeBottom(i).y, nodeTop(i + 1).x, nodeTop(i + 1).y)}
              fill="none"
              stroke={isUnlocked ? "rgba(255,237,0,0.5)" : "rgba(255,255,255,0.15)"}
              strokeWidth={isUnlocked ? 2.5 : 1.5}
              strokeDasharray={isUnlocked ? "0" : "5 7"}
            />
          );
        })}

        <g
          transform={`translate(${cx},${cy})`}
          style={{ cursor: "grab", pointerEvents: "all" }}
          onPointerDown={onCardDown}
          onPointerMove={onCardMove}
          onPointerUp={onCardUp}
          onPointerCancel={onCardUp}
        >
          <rect x={-cw / 2} y={-ch / 2} width={cw} height={ch} rx={cw * 0.1} fill="#ffed00" />
          <g transform={`rotate(${angleDeg})`}>
            {image && (
              <>
                <image
                  href={image}
                  x={-cw / 2 + BORDER} y={-ch / 2 + BORDER}
                  width={cw - BORDER * 2} height={illoH}
                  clipPath="url(#sc-card-clip)"
                  preserveAspectRatio="xMidYMid slice"
                />
                <text
                  x={0} y={ch / 2 - FOOTER / 2}
                  textAnchor="middle" dominantBaseline="central"
                  fontFamily="'Luckiest Guy', system-ui"
                  fontSize={Math.max(8, Math.round(FOOTER * 0.28))}
                  fill="#0a3a57"
                >
                  {step.caption}
                </text>
              </>
            )}
          </g>
          <circle cx={cw / 2 - 14} cy={-ch / 2 + 14} r={13} fill="#009fe0" />
          <text x={cw / 2 - 14} y={-ch / 2 + 14} textAnchor="middle" dominantBaseline="central"
            fontFamily="'Luckiest Guy',system-ui" fontSize={12} fill="#ffffff">
            {step.number}
          </text>
        </g>

        {step.rows.map((row, i) => {
          const nx = nodePositions[i].x;
          const ny = nodePositions[i].y;
          const isUnlocked = i < unlocked;
          const isNext = i === unlocked && !allUnlocked;
          const bodyLines = wrapText(row.body);
          const isLeft = i % 2 === 0;

          return (
            <g
              key={i}
              transform={`translate(${nx},${ny})`}
              style={{ pointerEvents: isNext ? "all" : "none", cursor: isNext ? "pointer" : "default" }}
              onClick={isNext ? unlockNext : undefined}
            >
              <rect
                x={-NODE_W / 2} y={-NODE_H / 2}
                width={NODE_W} height={NODE_H}
                rx={NODE_RX}
                fill={isUnlocked ? "rgba(10,58,87,0.85)" : "rgba(10,58,87,0.35)"}
                stroke={isUnlocked ? "rgba(255,237,0,0.4)" : isNext ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.1)"}
                strokeWidth={isUnlocked ? 1.5 : 1}
                style={isNext ? { animation: "scNodePulse 1.8s ease-in-out infinite" } : undefined}
              />
              {!isUnlocked && !isNext && (
                <rect x={-NODE_W / 2} y={-NODE_H / 2} width={NODE_W} height={NODE_H} rx={NODE_RX} fill="rgba(0,0,0,0.35)" />
              )}
              <image
                href={row.icon}
                x={-NODE_W / 2 + 14} y={-ICON_SIZE / 2}
                width={ICON_SIZE} height={ICON_SIZE}
                style={{ opacity: isUnlocked ? 1 : 0.3 }}
              />
              <text
                x={-NODE_W / 2 + 14 + ICON_SIZE + 10} y={-10}
                fontFamily="Montserrat,sans-serif" fontSize={14} fontWeight="700"
                fill={isUnlocked ? "#ffffff" : "rgba(255,255,255,0.3)"}
              >
                {row.title}
              </text>
              {bodyLines.map((line, li) => (
                <text
                  key={li}
                  x={-NODE_W / 2 + 14 + ICON_SIZE + 10} y={8 + li * 16}
                  fontFamily="Montserrat,sans-serif" fontSize={11} fontWeight="500"
                  fill={isUnlocked ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)"}
                >
                  {line}
                </text>
              ))}
              {isNext && (
                <text
                  x={0} y={NODE_H / 2 - 8}
                  textAnchor="middle"
                  fontFamily="Montserrat,sans-serif" fontSize={10} fontWeight="700"
                  fill="rgba(255,237,0,0.7)"
                  letterSpacing="1"
                >
                  TAP TO UNLOCK
                </text>
              )}
              {isUnlocked && i < step.rows.length - 1 && (
                <text
                  x={isLeft ? NODE_W / 2 - 10 : -NODE_W / 2 + 10}
                  y={NODE_H / 2 + 18}
                  textAnchor="middle"
                  fontFamily="Montserrat,sans-serif" fontSize={14}
                  fill="rgba(255,237,0,0.6)"
                >
                  {isLeft ? "↘" : "↙"}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <button type="button" className={styles.close}
        onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Close">
        &times;
      </button>

      <div className={styles.nav}>
        <button type="button"
          className={`${styles.navBtn}${!hasPrev ? " " + styles.navBtnHidden : ""}`}
          onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
          aria-label="Previous step">
          &#8592;
        </button>
        <div className={styles.navMid}>
          <span className={styles.navStep}>Step {step.number} of 6</span>
          <div className={styles.progressDots}>
            {step.rows.map((_, i) => (
              <div key={i} className={`${styles.dot}${i < unlocked ? " " + styles.dotFilled : ""}`} />
            ))}
          </div>
        </div>
        <button type="button"
          className={`${styles.navBtn}${!hasNext ? " " + styles.navBtnHidden : ""}`}
          onClick={(e) => { e.stopPropagation(); onNext?.(); }}
          aria-label="Next step">
          &#8594;
        </button>
      </div>
    </div>
  );
}