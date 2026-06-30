"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import styles from "./StepMap.module.css";
import { type StepData } from "./StepCard";

const NODE_R = 34;
const RING1 = 228;
const SPREAD1 = Math.PI * 1.6;
const ROW_PTS = 400;
const BONUS_PTS = 1000;
const CARD_SCALE = 1; // not used directly -- card sized to viewport below

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

  // Card in overlay: preserve pit aspect ratio, cap to sensible overlay size
  // Exact pit card size -- same w/h as the physics body
  const cw = cardPos?.w ?? 120;
  const ch = cardPos?.h ?? 140;
  // Card appears where it was tapped, clamped so it stays fully on screen
  const cx = cardPos
    ? Math.max(cw / 2 + 16, Math.min(vp.w - cw / 2 - 16, cardPos.x))
    : vp.w / 2;
  const cy = cardPos
    ? Math.max(ch / 2 + 80, Math.min(vp.h - ch / 2 - 40, cardPos.y))
    : vp.h * 0.42;
  const cardImg = cardPos?.image ?? "";

  const [pan, setPan] = useState({ x: 0, y: 0 });
  useEffect(() => setPan({ x: 0, y: 0 }), [step.number]);
  const drag = useRef<{ id: number; sx: number; sy: number; px: number; py: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  // Pan -- exact LineageMap copy
  const onPanDown = (e: React.PointerEvent) => {
    suppressClick.current = false;
    drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y, moved: false };
  };
  const onPanMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) > 6) d.moved = true;
    if (d.moved) setPan({ x: d.px + dx, y: d.py + dy }); // suppressClick set in onPanUp only
  };
  const onPanUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d && d.moved) suppressClick.current = true; // only after confirmed drag
  };

  // All nodes unlocked from the start -- tapping shows text, double-tap on card closes
  const [openCount, setOpenCount] = useState(0);
  useEffect(() => { setOpenCount(step.rows.length); }, [step.number, step.rows.length]);
  const [openNodes, setOpenNodes] = useState<Set<number>>(new Set());
  useEffect(() => setOpenNodes(new Set()), [step.number]);
  const [activeTexts, setActiveTexts] = useState<Set<number>>(new Set());
  useEffect(() => setActiveTexts(new Set()), [step.number]);

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

  // Card double-click handler -- uses setOpenCount functional form so c is always fresh
  const handleCardDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenCount((c) => {
      if (c >= step.rows.length) {
        // All nodes already open -- close
        window.setTimeout(() => onClose(), 0);
        return c;
      }
      const next = Math.min(c + 1, step.rows.length);
      if (next > c) {
        const row = next - 1;
        setActiveTexts((prev) => { const s = new Set(prev); s.add(row); return s; });
        setOpenNodes((prev) => { const s = new Set(prev); s.add(row); return s; });
        const key = `${step.number}:${row}`;
        if (!seenRows.has(key)) {
          seenRows.add(key);
          onScore?.(ROW_PTS);
          addFlash(cx + pan.x, cy + pan.y - ch / 2 - 20, ROW_PTS);
        }
      }
      return next;
    });
  };

  const handleNodeClick = useCallback((e: React.MouseEvent, n: StepNode, unlocked: boolean) => {
    e.stopPropagation();
    if (suppressClick.current) { suppressClick.current = false; return; }
    if (!unlocked) return;
    setOpenNodes((prev) => { const s = new Set(prev); s.add(n.row); return s; });
    setActiveTexts((prev) => { const s = new Set(prev); if (s.has(n.row)) s.delete(n.row); else s.add(n.row); return s; });
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

  // Auto button -- reveal all nodes one by one with 400ms gaps
  const [autoRunning, setAutoRunning] = useState(false);
  const handleAuto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (autoRunning || allUnlocked) return;
    setAutoRunning(true);
    let c = openCount;
    const tick = () => {
      if (c >= step.rows.length) { setAutoRunning(false); return; }
      setOpenCount((prev) => {
        const next = Math.min(prev + 1, step.rows.length);
        if (next > prev) {
          const row = next - 1;
          setActiveTexts((prev) => { const s = new Set(prev); s.add(row); return s; });
          setOpenNodes((s) => { const ns = new Set(s); ns.add(row); return ns; });
          const key = `${step.number}:${row}`;
          if (!seenRows.has(key)) { seenRows.add(key); onScore?.(ROW_PTS); }
        }
        return next;
      });
      c++;
      window.setTimeout(tick, 500);
    };
    window.setTimeout(tick, 0);
  };

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
      onClick={(e) => { if (suppressClick.current) { suppressClick.current = false; return; } onClose(); }}
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
        onClick={(e) => e.stopPropagation()}
          onDoubleClick={handleCardDoubleClick}
        style={{
          position: "fixed",
          left: cx + pan.x - cw / 2,
          top: cy + pan.y - ch / 2,
          width: cw, height: ch,
          borderRadius: Math.round(cw * 0.1),
          overflow: "hidden",
          pointerEvents: "all",
          cursor: "pointer",
          zIndex: 3,
          background: "#ffed00",
          userSelect: "none",
          WebkitUserSelect: "none" as any,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        {/* Matches pit canvas exactly: BORDER=3%, FOOTER=18%, RADIUS=10% */}
        {(() => {
          const B = Math.round(cw * 0.03);
          const FOOTER = Math.round(ch * 0.18);
          const illoW = cw - B * 2;
          const illoH = ch - FOOTER - B * 2;
          const illoR = Math.round(cw * 0.07);
          const footerFs = Math.max(10, Math.round(FOOTER * 0.35));
          return (
            <>
              {/* Inset image area */}
              <div style={{
                position: "absolute",
                left: B, top: B,
                width: illoW, height: illoH,
                borderRadius: illoR,
                overflow: "hidden",
              }}>
                {step.number <= 3 ? (
                  <>
                    <video
                      ref={(el) => { videoRef.current = el; if (el) { el.muted = true; el.volume = 0; } }}
                      src={`/step${step.number}-video-animation.mp4`}
                      autoPlay muted playsInline
                      onCanPlay={(e) => { const v = e.target as HTMLVideoElement; v.muted = true; v.volume = 0; setVideoReady(true); }}
                      onEnded={(e) => { (e.target as HTMLVideoElement).pause(); }}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                    {!videoReady && cardImg && (
                      <img src={cardImg} alt=""
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
                      />
                    )}
                  </>
                ) : (
                  cardImg && (
                    <img src={cardImg} alt=""
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  )
                )}
              </div>
              {/* Footer caption -- same as pit */}
              <div style={{
                position: "absolute",
                left: 0, bottom: 0, right: 0,
                height: FOOTER,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Luckiest Guy', system-ui",
                fontSize: footerFs,
                color: "#0a3a57",
                textAlign: "center",
                letterSpacing: "0.02em",
                lineHeight: 1.1,
                pointerEvents: "none",
                padding: "0 6px",
              }}>{step.caption}</div>
            </>
          );
        })()}
      </div>

      {/* ── LAYER 3: nodes and text ABOVE card ── */}
      <svg style={{ ...svgStyle, zIndex: 4, pointerEvents: "none" }}>
        {nodes.map((n) => {
          const unlocked = n.row < openCount;
          const isOpen = openNodes.has(n.row);
          const isActive = activeTexts.has(n.row);
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
                    pointerEvents: "none",
                  }}
                />
                {/* Transparent hit rect -- SVG image elements are unreliable for pointer events */}
                <rect x={-NODE_R} y={-NODE_R} width={NODE_R * 2} height={NODE_R * 2} fill="transparent" />
                <circle cx={NODE_R * 0.95} cy={-NODE_R * 0.95} r={22}
                  fill={n.row === 0 ? "#ffed00" : unlocked ? "#ffed00" : "transparent"}
                  stroke={n.row === 0 ? "#0a3a57" : unlocked ? "#0a3a57" : "#ffffff"}
                  strokeWidth={2.5}
                />
                <text
                  x={NODE_R * 0.95} y={-NODE_R * 0.95}
                  textAnchor="middle" dominantBaseline="central"
                  fontFamily="'Luckiest Guy',system-ui" fontSize={18}
                  fill={n.row === 0 ? "#0a3a57" : unlocked ? "#0a3a57" : "#ffffff"}
                >{n.row + 1}</text>
              </g>

              {isActive && unlocked && (
                <foreignObject x={nx + NODE_R + 10} y={ny - 36} width={200} height={140} style={{ overflow: "visible", pointerEvents: "none" }}>
                  <div style={{
                    background: "rgba(10,58,87,0.92)",
                    color: "#ffffff",
                    font: "500 11px/1.4 Montserrat, system-ui, sans-serif",
                    padding: "7px 10px",
                    borderRadius: 8,
                    boxShadow: "0 4px 12px rgba(10,58,87,0.35)",
                    maxWidth: 190,
                    pointerEvents: "none",
                  }}>
                    <div style={{ fontFamily: "'Luckiest Guy', system-ui", fontSize: 13, color: "#ffed00", marginBottom: 3 }}>{row.title}</div>
                    {row.body}
                  </div>
                </foreignObject>
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

      {/* 0/N counter pill -- matches LineageMap frameCount style exactly */}
      <div style={{
        position: "fixed", top: 26, left: "clamp(16px, 3.5vw, 40px)",
        zIndex: 20, padding: "5px 18px", borderRadius: 20,
        background: "#0a3a57", color: "#ffffff",
        fontFamily: "'Luckiest Guy', system-ui", fontSize: 24, lineHeight: 1.1,
        letterSpacing: "0.5px", pointerEvents: "none",
        boxShadow: "0 3px 0 rgba(10,58,87,0.3)",
      }}>
        {openCount}/{step.rows.length}
      </div>
      {/* Auto button -- bottom right, same style as LineageMap */}
      {false && (
        <div
          onClick={handleAuto}
          onPointerDown={(e) => e.stopPropagation()}
          role="button"
          aria-label="Auto reveal"
          style={{
            position: "fixed", right: "clamp(18px, 4vw, 48px)", bottom: "clamp(18px, 4vw, 48px)",
            zIndex: 20, cursor: autoRunning ? "default" : "pointer",
            opacity: autoRunning ? 0.6 : 1,
          }}
        >
          <img
            src="/auto-icon-redux.svg"
            alt="Auto"
            style={{
              display: "block", width: 84, height: 84, padding: 10,
              background: "#ffed00", borderRadius: 20,
              boxShadow: "0 5px 0 rgba(10,58,87,0.3)",
              boxSizing: "border-box",
            }}
          />
        </div>
      )}
      {/* No X button -- overlay closes automatically once all nodes are opened */}

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