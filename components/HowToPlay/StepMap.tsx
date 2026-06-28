"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import styles from "./StepMap.module.css";
import { type StepData } from "./StepCard";

const ROOT_HALF = 58;
const RING1 = ROOT_HALF + 110;
const SPREAD1 = Math.PI * 1.5;
const NODE_R = 44;
const ROW_PTS = 400;
const BONUS_PTS = 1000;

const seenRows = new Set<string>();

type StepNode = {
  id: string;
  row: number;
  x: number;
  y: number;
};

export default function StepMap({
  step,
  onClose,
  onScore,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  cardPos,
}: {
  step: StepData;
  onClose: () => void;
  onScore?: (v: number) => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  cardPos?: { x: number; y: number; w: number; h: number; angle: number; image: string } | null;
}) {
  const [vp, setVp] = useState({ w: 1280, h: 800 });
  useEffect(() => {
    const f = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);

  const cx = cardPos?.x ?? vp.w / 2;
  const cy = cardPos?.y ?? vp.h * 0.35;
  const cardImg = cardPos?.image ?? "";
  const cw = cardPos?.w ?? 120;
  const ch = cardPos?.h ?? 140;

  const [pan, setPan] = useState({ x: 0, y: 0 });
  useEffect(() => setPan({ x: 0, y: 0 }), [step.number]);
  const drag = useRef<{ id: number; sx: number; sy: number; px: number; py: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  const [open, setOpen] = useState<Set<number>>(new Set());
  useEffect(() => setOpen(new Set()), [step.number]);

  const nodes: StepNode[] = useMemo(() => {
    const cnt = step.rows.length;
    return step.rows.map((_, i) => {
      const seed = step.number * 137.5;
      const rng = (n: number) => ((Math.sin(seed + n * 91.7) + 1) / 2);
      const baseAngle = Math.PI / 2;
      const a = baseAngle + (i - (cnt - 1) / 2) * (SPREAD1 / Math.max(cnt, 2));
      const jitter = (rng(i) - 0.5) * 0.45;
      const dist = RING1 + rng(i + 10) * 60;
      const angle = a + jitter;
      return {
        id: `${step.number}:${i}`,
        row: i,
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
      };
    });
  }, [step.number, step.rows.length, cx, cy]);

  const awardRow = useCallback((rowIdx: number) => {
    const key = `${step.number}:${rowIdx}`;
    if (seenRows.has(key)) return;
    seenRows.add(key);
    onScore?.(ROW_PTS);
    const allSeen = step.rows.every((_, i) => seenRows.has(`${step.number}:${i}`));
    if (allSeen) onScore?.(BONUS_PTS);
  }, [step, onScore]);

  const tapNode = useCallback((n: StepNode) => {
    if (suppressClick.current) { suppressClick.current = false; return; }
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(n.row)) { next.delete(n.row); return next; }
      next.add(n.row);
      awardRow(n.row);
      return next;
    });
  }, [awardRow]);

  const onPanDown = (e: React.PointerEvent) => {
    suppressClick.current = false;
    drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y, moved: false };
  };
  const onPanMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) > 6) d.moved = true;
    if (d.moved) { suppressClick.current = true; setPan({ x: d.px + dx, y: d.py + dy }); }
  };
  const onPanUp = () => { drag.current = null; };

  const BORDER = Math.round(cw * 0.04);
  const FOOTER = Math.round(ch * 0.18);
  const illoH = ch - FOOTER - BORDER * 2;

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
          {cardImg && (
            <clipPath id="sm-card-clip">
              <rect x={-cw / 2 + BORDER} y={-ch / 2 + BORDER} width={cw - BORDER * 2} height={illoH} rx={cw * 0.07} />
            </clipPath>
          )}
          {nodes.map((n) => (
            <clipPath key={`nc-${n.id}`} id={`sm-node-clip-${n.id}`}>
              <circle r={NODE_R} />
            </clipPath>
          ))}
        </defs>

        {/* Edge lines */}
        {nodes.map((n) => (
          <line
            key={`e-${n.id}`}
            x1={cx + pan.x}
            y1={cy + pan.y}
            x2={n.x + pan.x}
            y2={n.y + pan.y}
            stroke={open.has(n.row) ? "rgba(255,237,0,0.7)" : "rgba(255,255,255,0.45)"}
            strokeWidth={open.has(n.row) ? 3 : 2}
            strokeDasharray={open.has(n.row) ? undefined : "6 8"}
          />
        ))}

        {/* Root card */}
        <g transform={`translate(${cx + pan.x},${cy + pan.y})`} style={{ pointerEvents: "none" }}>
          <rect x={-cw / 2} y={-ch / 2} width={cw} height={ch} rx={cw * 0.1} fill="#ffed00" />
          {cardImg && (
            <>
              <image
                href={cardImg}
                x={-cw / 2 + BORDER} y={-ch / 2 + BORDER}
                width={cw - BORDER * 2} height={illoH}
                clipPath="url(#sm-card-clip)"
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
          <circle cx={cw / 2 - 14} cy={-ch / 2 + 14} r={13} fill="#009fe0" />
          <text x={cw / 2 - 14} y={-ch / 2 + 14} textAnchor="middle" dominantBaseline="central"
            fontFamily="'Luckiest Guy',system-ui" fontSize={12} fill="#ffffff">
            {step.number}
          </text>
        </g>

        {/* Nodes */}
        {nodes.map((n) => {
          const nx = n.x + pan.x;
          const ny = n.y + pan.y;
          const isOpen = open.has(n.row);
          const row = step.rows[n.row];
          const textCardRight = nx + NODE_R + 12 + 200 < vp.w;

          return (
            <g
              key={n.id}
              transform={`translate(${nx},${ny})`}
              style={{ pointerEvents: "all", cursor: "pointer" }}
              onClick={(e) => { e.stopPropagation(); tapNode(n); }}
            >
              <circle
                r={NODE_R}
                fill={isOpen ? "#ffed00" : "rgba(10,58,87,0.75)"}
                stroke={isOpen ? "#0a3a57" : "rgba(255,255,255,0.35)"}
                strokeWidth={isOpen ? 3 : 1.5}
              />
              <image
                href={row.icon}
                x={-NODE_R * 0.65} y={-NODE_R * 0.65}
                width={NODE_R * 1.3} height={NODE_R * 1.3}
                clipPath={`url(#sm-node-clip-${n.id})`}
                style={{ opacity: 1 }}
              />
              {isOpen && (() => {
                const cardW = 200;
                const cardH = NODE_R * 2 + 20;
                const ox = textCardRight ? NODE_R + 12 : -(NODE_R + 12 + cardW);
                const lines = row.body.match(/.{1,28}(\s|$)/g)?.slice(0, 3) ?? [];
                return (
                  <g transform={`translate(${ox},${-NODE_R})`} style={{ pointerEvents: "none" }}>
                    <rect x={0} y={0} width={cardW} height={cardH} rx={10}
                      fill="rgba(10,58,87,0.92)" stroke="rgba(255,237,0,0.4)" strokeWidth={1.5} />
                    <text x={12} y={22} fontFamily="Montserrat,sans-serif"
                      fontSize={13} fontWeight="700" fill="#ffffff">
                      {row.title}
                    </text>
                    {lines.map((line, li) => (
                      <text key={li} x={12} y={38 + li * 16}
                        fontFamily="Montserrat,sans-serif" fontSize={11}
                        fill="rgba(255,255,255,0.82)">
                        {line.trim()}
                      </text>
                    ))}
                  </g>
                );
              })()}
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
              <div key={i} className={`${styles.dot}${open.has(i) ? " " + styles.dotFilled : ""}`} />
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