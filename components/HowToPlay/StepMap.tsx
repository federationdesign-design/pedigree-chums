"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import styles from "./StepMap.module.css";
import { type StepData } from "./StepCard";

const NODE_R = 56;
const RING1 = 340;
const SPREAD1 = Math.PI * 1.6;
const ROW_PTS = 400;
const BONUS_PTS = 1000;
const CARD_SCALE = 2;

const seenRows = new Set<string>();

type StepNode = { id: string; row: number; x: number; y: number; };

export default function StepMap({
  step, onClose, onScore, onPrev, onNext, hasPrev, hasNext, cardPos,
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

  const cw = (cardPos?.w ?? 120) * CARD_SCALE;
  const ch = (cardPos?.h ?? 140) * CARD_SCALE;
  const cx = vp.w / 2;
  const cy = vp.h * 0.42;
  const cardImg = cardPos?.image ?? "";

  const [pan, setPan] = useState({ x: 0, y: 0 });
  useEffect(() => setPan({ x: 0, y: 0 }), [step.number]);
  const drag = useRef<{ id: number; sx: number; sy: number; px: number; py: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

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
  const onPanUp = () => {
    if (drag.current?.moved) suppressClick.current = true;
    drag.current = null;
  };

  const [openCount, setOpenCount] = useState(0);
  useEffect(() => setOpenCount(0), [step.number]);
  const [openNodes, setOpenNodes] = useState<Set<number>>(new Set());
  useEffect(() => setOpenNodes(new Set()), [step.number]);
  const [activeText, setActiveText] = useState<number | null>(null);
  useEffect(() => setActiveText(null), [step.number]);

  // Flash numbers -- exact LineageMap style
  type FlashNum = { id: number; x: number; y: number; val: number; size: number; neg: boolean; big: boolean; };
  const [flashNums, setFlashNums] = useState<FlashNum[]>([]);
  const flashIdRef = useRef(0);
  const addFlash = (x: number, y: number, val: number) => {
    const id = flashIdRef.current++;
    const isNeg = val < 0;
    const isBig = val >= 400;
    const size = isNeg ? 21 : isBig ? 21 : 15;
    setFlashNums((prev) => [...prev, { id, x, y, val, size, neg: isNeg, big: isBig }]);
    setTimeout(() => setFlashNums((prev) => prev.filter((f) => f.id !== id)), isNeg ? 1200 : isBig ? 900 : 650);
  };

  const [videoReady, setVideoReady] = useState(false);
  useEffect(() => setVideoReady(false), [step.number]);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const lastCardTap = useRef(0);
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (suppressClick.current) { suppressClick.current = false; return; }
    const now = Date.now();
    if (now - lastCardTap.current < 450) {
      lastCardTap.current = 0;
      setOpenCount((c: number) => {
        const next = Math.min(c + 1, step.rows.length);
        if (next > c) {
          const row = next - 1;
          setActiveText(row);
          setOpenNodes((prev) => { const s = new Set(prev); s.add(row); return s; });
          const key = `${step.number}:${row}`;
          if (!seenRows.has(key)) {
            seenRows.add(key);
            onScore?.(ROW_PTS);
            // flash at card centre
            const cardX = cx + pan.x;
            const cardY = cy + pan.y - ch / 2 - 20;
            addFlash(cardX, cardY, ROW_PTS);
          }
        }
        return next;
      });
    } else {
      lastCardTap.current = now;
    }
  }, [step.number, step.rows.length, onScore]);

  const handleNodeClick = useCallback((e: React.MouseEvent, n: StepNode, unlocked: boolean) => {
    e.stopPropagation();
    if (suppressClick.current) { suppressClick.current = false; return; }
    if (!unlocked) return;
    setOpenNodes((prev) => { const s = new Set(prev); s.add(n.row); return s; });
    setActiveText((prev: number | null) => prev === n.row ? null : n.row);
    const key = `${step.number}:${n.row}`;
    if (!seenRows.has(key)) {
      seenRows.add(key);
      onScore?.(ROW_PTS);
      addFlash(n.x + pan.x, n.y + pan.y - NODE_R, ROW_PTS);
      const allSeen = step.rows.every((_, i) => seenRows.has(`${step.number}:${i}`));
      if (allSeen) {
        onScore?.(BONUS_PTS);
        addFlash(n.x + pan.x, n.y + pan.y - NODE_R - 40, BONUS_PTS);
      }
    }
  }, [step, onScore]);

  const nodes: StepNode[] = useMemo(() => {
    const cnt = step.rows.length;
    return step.rows.map((_, i) => {
      const seed = step.number * 137.5;
      const rng = (n: number) => ((Math.sin(seed + n * 91.7) + 1) / 2);
      const a = Math.PI / 2 + (i - (cnt - 1) / 2) * (SPREAD1 / Math.max(cnt, 2));
      const jitter = (rng(i) - 0.5) * 0.25;
      const dist = RING1 + rng(i + 10) * 60;
      return {
        id: `${step.number}:${i}`,
        row: i,
        x: cx + Math.cos(a + jitter) * dist,
        y: cy + Math.sin(a + jitter) * dist,
      };
    });
  }, [step.number, step.rows.length, cx, cy]);

  const allUnlocked = openCount >= step.rows.length;

  const getTextPos = (nx: number, ny: number) => {
    const textW = 320;
    const cardL = cx + pan.x - cw / 2 - 20;
    const cardR = cx + pan.x + cw / 2 + 20;
    let tx = nx + NODE_R + 20;
    if (tx + textW > cardL && nx < cardR) tx = nx - NODE_R - 20 - textW;
    tx = Math.max(12, Math.min(vp.w - textW - 12, tx));
    const ty = Math.max(100, Math.min(vp.h - 200, ny - 40));
    return { tx, ty };
  };

  const svgStyle: React.CSSProperties = {
    position: "fixed", inset: 0,
    width: "100%", height: "100%",
    overflow: "visible",
    pointerEvents: "none",
  };

  return (
    <div
      className={styles.overlay}
      onPointerDown={onPanDown}
      onPointerMove={onPanMove}
      onPointerUp={onPanUp}
      onPointerCancel={onPanUp}
    >
      {/* HOW TO PLAY header */}
      <div style={{
        position: "fixed", top: 24, left: 0, right: 0,
        textAlign: "center", pointerEvents: "none", zIndex: 10,
      }}>
        <div style={{
          fontFamily: "'Luckiest Guy', system-ui",
          fontSize: "clamp(24px, 3.5vw, 48px)",
          color: "#ffffff", letterSpacing: "0.04em", lineHeight: 1.1,
        }}>HOW TO PLAY...</div>
        <div style={{
          fontFamily: "'Luckiest Guy', system-ui",
          fontSize: "clamp(36px, 5.5vw, 72px)",
          color: "#ffed00", letterSpacing: "0.04em", lineHeight: 1, marginTop: 2,
        }}>STEP {step.number}</div>
      </div>

      {/* ── LAYER 1: edge lines BELOW the card ── */}
      <svg style={{ ...svgStyle, zIndex: 2 }}>
        {nodes.map((n) => {
          const unlocked = n.row < openCount;
          return (
            <line key={`e-${n.id}`}
              x1={cx + pan.x} y1={cy + pan.y}
              x2={n.x + pan.x} y2={n.y + pan.y}
              stroke={unlocked ? "#ffed00" : "#ffffff"}
              strokeWidth={unlocked ? 3 : 2}
              strokeDasharray={unlocked ? undefined : "7 9"}
            />
          );
        })}
      </svg>

      {/* ── LAYER 2: card HTML -- above edges, below nodes ── */}
      <div
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        onClick={handleCardClick}
        style={{
          position: "fixed",
          left: cx + pan.x - cw / 2,
          top: cy + pan.y - ch / 2,
          width: cw, height: ch,
          borderRadius: cw * 0.08,
          overflow: "hidden",
          pointerEvents: "all",
          cursor: "pointer",
          zIndex: 3,
          border: "5px solid #ffed00",
          userSelect: "none",
          WebkitUserSelect: "none" as any,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <video
          ref={(el) => { videoRef.current = el; if (el) { el.muted = true; el.volume = 0; } }}
          src={`/step${step.number}-video-animation.mp4`}
          autoPlay muted playsInline
          onCanPlay={(e) => { const v = e.target as HTMLVideoElement; v.muted = true; v.volume = 0; setVideoReady(true); }}
          onEnded={(e) => { (e.target as HTMLVideoElement).pause(); }}
          style={{ flex: 1, width: "100%", objectFit: "cover", display: "block", minHeight: 0 }}
        />
        {!videoReady && cardImg && (
          <img src={cardImg} alt=""
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
          />
        )}
        <div style={{
          flexShrink: 0,
          padding: "10px 12px 12px",
          background: "#ffed00",
          fontFamily: "'Luckiest Guy', system-ui",
          fontSize: "clamp(14px, 2vw, 22px)",
          color: "#0a3a57",
          textAlign: "center",
          letterSpacing: "0.02em",
          lineHeight: 1.1,
          pointerEvents: "none",
          position: "relative",
          zIndex: 2,
        }}>{step.caption}</div>
        {!allUnlocked && (
          <div style={{
            position: "absolute", bottom: 52, left: 0, right: 0,
            textAlign: "center",
            fontFamily: "'Luckiest Guy', system-ui",
            fontSize: 14, color: "rgba(255,255,255,0.95)",
            pointerEvents: "none",
            textShadow: "0 1px 4px rgba(0,0,0,0.9)",
          }}>double-tap to reveal</div>
        )}
      </div>

      {/* ── LAYER 3: nodes and text ABOVE card ── */}
      <svg style={{ ...svgStyle, zIndex: 4 }}>
        {nodes.map((n) => {
          const unlocked = true;
          const isOpen = openNodes.has(n.row);
          const isActive = activeText === n.row;
          const row = step.rows[n.row];
          const nx = n.x + pan.x;
          const ny = n.y + pan.y;
          const { tx, ty } = getTextPos(nx, ny);

          return (
            <g key={n.id}>
              <g
                transform={`translate(${nx},${ny})`}
                style={{ pointerEvents: "all", cursor: unlocked ? "pointer" : "default" }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => handleNodeClick(e, n, unlocked)}
              >
                <image
                  href={row.icon}
                  x={-NODE_R} y={-NODE_R}
                  width={NODE_R * 2} height={NODE_R * 2}
                  style={{
                    filter: isOpen
                      ? "brightness(0) saturate(100%) invert(93%) sepia(67%) saturate(600%) hue-rotate(0deg)"
                      : "none",
                  }}
                />
                <circle cx={NODE_R * 0.72} cy={-NODE_R * 0.72} r={22}
                  fill={unlocked ? "#ffed00" : "rgba(255,255,255,0.9)"}
                  stroke={unlocked ? "#0a3a57" : "rgba(0,0,0,0.15)"}
                  strokeWidth={2}
                />
                <text
                  x={NODE_R * 0.72} y={-NODE_R * 0.72}
                  textAnchor="middle" dominantBaseline="central"
                  fontFamily="'Luckiest Guy',system-ui" fontSize={18}
                  fill={unlocked ? "#0a3a57" : "#666"}
                >{n.row + 1}</text>
              </g>

              {isActive && unlocked && (
                <g style={{ pointerEvents: "none" }}>
                  <text x={tx} y={ty}
                    fontFamily="'Luckiest Guy', system-ui"
                    fontSize={36} fill="#ffffff"
                    dominantBaseline="hanging"
                  >{row.title}</text>
                  {row.body.split(/\s+/).reduce((lines: string[], word: string) => {
                    if (!lines.length) return [word];
                    const last = lines[lines.length - 1];
                    return last.length + word.length < 22
                      ? [...lines.slice(0, -1), last + " " + word]
                      : [...lines, word];
                  }, []).map((line: string, li: number) => (
                    <text key={li}
                      x={tx} y={ty + 44 + li * 29}
                      fontFamily="Montserrat, sans-serif"
                      fontSize={20} fontWeight="700"
                      fill="rgba(255,255,255,0.95)"
                      dominantBaseline="hanging"
                    >{line}</text>
                  ))}
                </g>
              )}
            </g>
          );
        })}
        {/* Flash numbers -- LineageMap style: green big, red neg, white default */}
        {flashNums.map((f) => (
          <text
            key={f.id}
            x={f.x}
            y={f.y}
            textAnchor="middle"
            fontSize={f.size}
            fontFamily="'Luckiest Guy', system-ui"
            fontWeight="700"
            style={{
              fill: f.neg ? "#ff2d4f" : f.big ? "#22c55e" : "#ffffff",
              pointerEvents: "none",
              animation: "smFlashNum 0.9s ease-out forwards",
            }}
          >{f.val > 0 ? `+${f.val}` : f.val}</text>
        ))}
      </svg>

      <button type="button" className={styles.close}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{ zIndex: 20 }} aria-label="Close">&times;</button>

      {/* Prev/next arrows only -- no dots, no step counter */}
      <div style={{
        position: "fixed", bottom: 32, left: 0, right: 0,
        display: "flex", justifyContent: "space-between",
        padding: "0 32px", zIndex: 20, pointerEvents: "none",
      }}>
        <button type="button"
          onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
          style={{
            pointerEvents: hasPrev ? "all" : "none", opacity: hasPrev ? 1 : 0,
            width: 56, height: 56, borderRadius: 14, border: "none",
            background: "#ffed00", fontFamily: "'Luckiest Guy', system-ui",
            fontSize: 26, color: "#0a3a57", cursor: "pointer",
            boxShadow: "0 4px 0 rgba(10,58,87,0.3)",
          }}
          aria-label="Previous step">&#8592;</button>
        <button type="button"
          onClick={(e) => { e.stopPropagation(); onNext?.(); }}
          style={{
            pointerEvents: hasNext ? "all" : "none", opacity: hasNext ? 1 : 0,
            width: 56, height: 56, borderRadius: 14, border: "none",
            background: "#ffed00", fontFamily: "'Luckiest Guy', system-ui",
            fontSize: 26, color: "#0a3a57", cursor: "pointer",
            boxShadow: "0 4px 0 rgba(10,58,87,0.3)",
          }}
          aria-label="Next step">&#8594;</button>
      </div>
    </div>
  );
}