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

  // openCount drives sequential unlocking: node i unlocks when openCount > i
  // double-tap the card increments openCount
  const [openCount, setOpenCount] = useState(0);
  useEffect(() => setOpenCount(0), [step.number]);

  // track which node's text is currently shown (null = none)
  const [shownNode, setShownNode] = useState<number | null>(null);
  useEffect(() => setShownNode(null), [step.number]);

  // double-tap detection on the card
  const lastCardTap = useRef(0);
  const handleCardDoubleTap = useCallback((e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastCardTap.current < 400) {
      lastCardTap.current = 0;
      setOpenCount((c: number) => {
        const next = Math.min(c + 1, step.rows.length);
        if (next > c) setShownNode(next - 1);
        return next;
      });
    } else {
      lastCardTap.current = now;
    }
  }, [step.rows.length]);

  const awardRow = useCallback((rowIdx: number) => {
    const key = `${step.number}:${rowIdx}`;
    if (seenRows.has(key)) return;
    seenRows.add(key);
    onScore?.(ROW_PTS);
    const allSeen = step.rows.every((_, i) => seenRows.has(`${step.number}:${i}`));
    if (allSeen) onScore?.(BONUS_PTS);
  }, [step, onScore]);

  const tapNode = useCallback((n: StepNode, unlocked: boolean) => {
    if (suppressClick.current) { suppressClick.current = false; return; }
    if (!unlocked) return;
    setShownNode((prev: number | null) => prev === n.row ? null : n.row);
    awardRow(n.row);
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

  const BORDER = Math.round(cw * 0.04);
  const FOOTER = Math.round(ch * 0.18);
  const illoH = ch - FOOTER - BORDER * 2;
  const allUnlocked = openCount >= step.rows.length;

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
        </defs>

        {/* Edge lines -- only to unlocked nodes */}
        {nodes.map((n) => {
          const unlocked = n.row < openCount;
          return (
            <line
              key={`e-${n.id}`}
              x1={cx + pan.x}
              y1={cy + pan.y}
              x2={n.x + pan.x}
              y2={n.y + pan.y}
              stroke={unlocked ? "rgba(255,237,0,0.7)" : "rgba(255,255,255,0.2)"}
              strokeWidth={unlocked ? 3 : 1.5}
              strokeDasharray={unlocked ? undefined : "6 8"}
            />
          );
        })}

        {/* Root card -- double-tap to unlock nodes */}
        <g
          transform={`translate(${cx + pan.x},${cy + pan.y})`}
          style={{ pointerEvents: "all", cursor: "pointer" }}
          onClick={handleCardDoubleTap}
        >
          <rect x={-cw / 2} y={-ch / 2} width={cw} height={ch} fill="transparent" />
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
          {!allUnlocked && (
            <circle cx={0} cy={0} r={Math.max(cw, ch) * 0.6}
              fill="none" stroke="rgba(255,237,0,0.25)" strokeWidth={2} strokeDasharray="4 6" />
          )}
        </g>

        {/* Nodes */}
        {nodes.map((n) => {
          const nx = n.x + pan.x;
          const ny = n.y + pan.y;
          const unlocked = n.row < openCount;
          const isShown = shownNode === n.row;
          const row = step.rows[n.row];
          const nodeNum = n.row + 1;
          const textW = 320;
          const textX = nx + NODE_R + 20 + textW < vp.w ? NODE_R + 20 : -(NODE_R + 20 + textW);

          return (
            <g key={n.id}>
              <g
                transform={`translate(${nx},${ny})`}
                style={{ pointerEvents: unlocked ? "all" : "none", cursor: unlocked ? "pointer" : "default" }}
                onClick={(e) => { e.stopPropagation(); tapNode(n, unlocked); }}
              >
                {!unlocked && (
                  <circle r={NODE_R} fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} strokeDasharray="4 5" />
                )}
                <image
                  href={row.icon}
                  x={-NODE_R * 0.75} y={-NODE_R * 0.75}
                  width={NODE_R * 1.5} height={NODE_R * 1.5}
                  style={{
                    opacity: unlocked ? 1 : 0.3,
                    filter: isShown ? "brightness(0) saturate(100%) invert(93%) sepia(67%) saturate(500%) hue-rotate(0deg)" : "none",
                  }}
                />
                <circle cx={NODE_R * 0.65} cy={-NODE_R * 0.65} r={12}
                  fill={unlocked ? "#ffed00" : "rgba(255,255,255,0.2)"}
                  stroke={unlocked ? "#0a3a57" : "rgba(255,255,255,0.3)"}
                  strokeWidth={1.5} />
                <text
                  x={NODE_R * 0.65} y={-NODE_R * 0.65}
                  textAnchor="middle" dominantBaseline="central"
                  fontFamily="'Luckiest Guy',system-ui"
                  fontSize={11}
                  fill={unlocked ? "#0a3a57" : "rgba(255,255,255,0.5)"}
                >
                  {nodeNum}
                </text>
              </g>

              {isShown && unlocked && (
                <g transform={`translate(${nx},${ny})`} style={{ pointerEvents: "none" }}>
                  <text
                    x={textX} y={-NODE_R * 0.5}
                    fontFamily="'Luckiest Guy', system-ui"
                    fontSize={32}
                    fill="#ffffff"
                    style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.6))" }}
                  >
                    {row.title}
                  </text>
                  {row.body.split(/\s+/).reduce((lines: string[], word: string) => {
                    if (lines.length === 0) return [word];
                    const last = lines[lines.length - 1];
                    return last.length + word.length < 22
                      ? [...lines.slice(0, -1), last + " " + word]
                      : [...lines, word];
                  }, []).map((line: string, li: number) => (
                    <text
                      key={li}
                      x={textX} y={-NODE_R * 0.5 + 38 + li * 30}
                      fontFamily="Montserrat, sans-serif"
                      fontSize={22}
                      fontWeight="600"
                      fill="rgba(255,255,255,0.92)"
                      style={{ filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.7))" }}
                    >
                      {line}
                    </text>
                  ))}
                </g>
              )}
            </g>
          );
        })}

        {!allUnlocked && (
          <text
            x={cx + pan.x} y={cy + pan.y + ch / 2 + 28}
            textAnchor="middle"
            fontFamily="Montserrat, sans-serif"
            fontSize={14}
            fontWeight="600"
            fill="rgba(255,255,255,0.55)"
          >
            double-tap card to reveal
          </text>
        )}
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
              <div key={i} className={`${styles.dot}${i < openCount ? " " + styles.dotFilled : ""}`} />
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