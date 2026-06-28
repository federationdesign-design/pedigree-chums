"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import styles from "./StepMap.module.css";
import { type StepData } from "./StepCard";

const ROOT_HALF = 58;
const RING1 = ROOT_HALF + 120;
const SPREAD1 = Math.PI * 1.6;
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

  // openCount: each double-tap on card unlocks the next node
  const [openCount, setOpenCount] = useState(0);
  useEffect(() => setOpenCount(0), [step.number]);

  // openNodes: set of permanently opened node rows (never closes)
  const [openNodes, setOpenNodes] = useState<Set<number>>(new Set());
  useEffect(() => setOpenNodes(new Set()), [step.number]);

  // activeText: which node's text is currently displayed (only one at a time)
  const [activeText, setActiveText] = useState<number | null>(null);
  useEffect(() => setActiveText(null), [step.number]);

  // videoReady: true once the video canplay event fires
  const [videoReady, setVideoReady] = useState(false);
  useEffect(() => setVideoReady(false), [step.number]);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // double-tap detection on the card
  const lastCardTap = useRef(0);
  const handleCardTap = useCallback((e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    if (suppressClick.current) return;
    const now = Date.now();
    if (now - lastCardTap.current < 400) {
      lastCardTap.current = 0;
      setOpenCount((c: number) => {
        const next = Math.min(c + 1, step.rows.length);
        if (next > c) {
          setActiveText(next - 1);
          awardRowImmediate(next - 1);
        }
        return next;
      });
    } else {
      lastCardTap.current = now;
    }
  }, [step.rows.length]);

  const awardRowImmediate = (rowIdx: number) => {
    const key = `${step.number}:${rowIdx}`;
    if (seenRows.has(key)) return;
    seenRows.add(key);
  };

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
    // mark permanently open
    setOpenNodes((prev) => { const next = new Set(prev); next.add(n.row); return next; });
    // show this node's text (toggle off if already showing, but keep node open)
    setActiveText((prev: number | null) => prev === n.row ? null : n.row);
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
      const jitter = (rng(i) - 0.5) * 0.3;
      const dist = RING1 + rng(i + 10) * 50;
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

  // Work out safe text position: keep text away from the card rect
  const cardLeft = cx + pan.x - cw / 2;
  const cardRight = cx + pan.x + cw / 2;
  const cardTop = cy + pan.y - ch / 2;
  const cardBottom = cy + pan.y + ch / 2;

  const getTextPos = (nx: number, ny: number) => {
    const textW = 300;
    const textH = 120;
    // prefer right of node
    let tx = nx + NODE_R + 24;
    let ty = ny - 20;
    // if right side overlaps card, try left
    if (tx < cardRight && tx + textW > cardLeft && ty < cardBottom && ty + textH > cardTop) {
      tx = nx - NODE_R - 24 - textW;
    }
    // clamp to viewport
    tx = Math.max(12, Math.min(vp.w - textW - 12, tx));
    ty = Math.max(12, Math.min(vp.h - textH - 80, ty));
    return { tx, ty };
  };

  return (
    <div
      className={styles.overlay}
      onPointerDown={onPanDown}
      onPointerMove={onPanMove}
      onPointerUp={onPanUp}
      onPointerCancel={onPanUp}
      onClick={() => { if (suppressClick.current) suppressClick.current = false; }}
    >
      {/* Card: video loads in background, image shows until ready */}
      <div style={{
        position: "fixed",
        left: cx + pan.x - cw / 2,
        top: cy + pan.y - ch / 2,
        width: cw,
        height: ch,
        borderRadius: cw * 0.1,
        overflow: "hidden",
        pointerEvents: "all",
        cursor: "pointer",
        zIndex: 2,
        border: "4px solid #ffed00",
      }}
        onClick={handleCardTap}
      >
        {/* video -- always mounted, plays as soon as browser is ready */}
        <video
          ref={videoRef}
          src={`/step${step.number}-video-animation.mp4`}
          autoPlay
          loop
          muted
          playsInline
          onCanPlay={() => setVideoReady(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        {/* image placeholder sits on top until video is ready */}
        {!videoReady && cardImg && (
          <div style={{
            position: "absolute", inset: 0,
            background: "#ffed00",
            display: "flex", flexDirection: "column",
          }}>
            <img
              src={cardImg}
              alt={step.caption}
              style={{ flex: 1, width: "100%", objectFit: "cover", display: "block" }}
            />
            <div style={{
              padding: "4px 6px",
              fontFamily: "'Luckiest Guy', system-ui",
              fontSize: Math.max(8, Math.round(FOOTER * 0.28)),
              color: "#0a3a57",
              textAlign: "center",
            }}>
              {step.caption}
            </div>
          </div>
        )}
        {/* step number badge */}
        <div style={{
          position: "absolute", top: 8, right: 8,
          width: 26, height: 26, borderRadius: "50%",
          background: "#009fe0", display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Luckiest Guy', system-ui", fontSize: 13, color: "#fff",
          pointerEvents: "none",
        }}>
          {step.number}
        </div>
        {/* double-tap hint */}
        {!allUnlocked && (
          <div style={{
            position: "absolute", bottom: 6, left: 0, right: 0,
            textAlign: "center", fontFamily: "Montserrat, sans-serif",
            fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.85)",
            pointerEvents: "none",
          }}>
            double-tap to reveal
          </div>
        )}
      </div>

      <svg
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }}
        aria-hidden="true"
      >
        <defs>
          {!videoReady && cardImg && (
            <clipPath id="sm-card-clip">
              <rect x={-cw / 2 + BORDER} y={-ch / 2 + BORDER} width={cw - BORDER * 2} height={illoH} rx={cw * 0.07} />
            </clipPath>
          )}
        </defs>

        {/* Edge lines */}
        {nodes.map((n) => {
          const unlocked = n.row < openCount;
          return (
            <line
              key={`e-${n.id}`}
              x1={cx + pan.x}
              y1={cy + pan.y}
              x2={n.x + pan.x}
              y2={n.y + pan.y}
              stroke={unlocked ? "rgba(255,237,0,0.8)" : "rgba(255,255,255,0.3)"}
              strokeWidth={unlocked ? 3 : 1.5}
              strokeDasharray={unlocked ? undefined : "6 8"}
            />
          );
        })}

        {/* Static card (before video) */}
        {!videoReady && (
          <g
            transform={`translate(${cx + pan.x},${cy + pan.y})`}
            style={{ pointerEvents: "all", cursor: "pointer" }}
            onClick={handleCardTap}
          >
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
            {/* pulse ring hint */}
            <circle cx={0} cy={0} r={Math.max(cw, ch) * 0.62}
              fill="none" stroke="rgba(255,237,0,0.3)" strokeWidth={2} strokeDasharray="5 7" />
          </g>
        )}

        {/* Nodes -- always fully visible, numbers always shown */}
        {nodes.map((n) => {
          const unlocked = n.row < openCount;
          const isOpen = openNodes.has(n.row);
          const isActive = activeText === n.row;
          const row = step.rows[n.row];
          const nodeNum = n.row + 1;
          const nx = n.x + pan.x;
          const ny = n.y + pan.y;
          const { tx, ty } = getTextPos(nx, ny);

          return (
            <g key={n.id}>
              {/* Node */}
              <g
                transform={`translate(${nx},${ny})`}
                style={{ pointerEvents: unlocked ? "all" : "none", cursor: unlocked ? "pointer" : "default" }}
                onClick={(e) => { e.stopPropagation(); tapNode(n, unlocked); }}
              >
                {/* icon -- full opacity always, yellow tint when open */}
                <image
                  href={row.icon}
                  x={-NODE_R * 0.8} y={-NODE_R * 0.8}
                  width={NODE_R * 1.6} height={NODE_R * 1.6}
                  style={{
                    filter: isOpen
                      ? "brightness(0) saturate(100%) invert(93%) sepia(67%) saturate(600%) hue-rotate(0deg) drop-shadow(0 0 6px rgba(255,237,0,0.8))"
                      : unlocked
                        ? "drop-shadow(0 2px 4px rgba(0,0,0,0.4))"
                        : "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                  }}
                />
                {/* number badge -- always visible */}
                <circle
                  cx={NODE_R * 0.7} cy={-NODE_R * 0.7} r={13}
                  fill={unlocked ? "#ffed00" : "rgba(255,255,255,0.85)"}
                  stroke={unlocked ? "#0a3a57" : "rgba(0,0,0,0.2)"}
                  strokeWidth={1.5}
                />
                <text
                  x={NODE_R * 0.7} y={-NODE_R * 0.7}
                  textAnchor="middle" dominantBaseline="central"
                  fontFamily="'Luckiest Guy',system-ui"
                  fontSize={12}
                  fill={unlocked ? "#0a3a57" : "#555"}
                >
                  {nodeNum}
                </text>
                {/* locked indicator ring */}
                {!unlocked && (
                  <circle r={NODE_R + 4} fill="none"
                    stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} strokeDasharray="4 5" />
                )}
              </g>

              {/* Text -- large, naked, positioned away from card */}
              {isActive && unlocked && (
                <g style={{ pointerEvents: "none" }}>
                  {/* title */}
                  <text
                    x={tx} y={ty}
                    fontFamily="'Luckiest Guy', system-ui"
                    fontSize={34}
                    fill="#ffffff"
                    dominantBaseline="hanging"
                    style={{ filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.7))" }}
                  >
                    {row.title}
                  </text>
                  {/* body lines */}
                  {row.body.split(/\s+/).reduce((lines: string[], word: string) => {
                    if (lines.length === 0) return [word];
                    const last = lines[lines.length - 1];
                    return last.length + word.length < 20
                      ? [...lines.slice(0, -1), last + " " + word]
                      : [...lines, word];
                  }, []).map((line: string, li: number) => (
                    <text
                      key={li}
                      x={tx} y={ty + 46 + li * 32}
                      fontFamily="Montserrat, sans-serif"
                      fontSize={22}
                      fontWeight="700"
                      fill="rgba(255,255,255,0.95)"
                      dominantBaseline="hanging"
                      style={{ filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.8))" }}
                    >
                      {line}
                    </text>
                  ))}
                </g>
              )}
            </g>
          );
        })}

        {/* Double-tap hint below card when not yet started */}
        {!videoReady && (
          <text
            x={cx + pan.x} y={cy + pan.y + ch / 2 + 26}
            textAnchor="middle"
            fontFamily="Montserrat, sans-serif"
            fontSize={13}
            fontWeight="600"
            fill="rgba(255,255,255,0.6)"
          >
            double-tap to reveal
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