"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import styles from "./StepMap.module.css";
import { type StepData } from "./StepCard";

// Card is 2x the pit size in the overlay
const CARD_SCALE = 2;
const NODE_R = 56; // bigger icons
const RING1 = 220; // nodes spread further since card is bigger
const SPREAD1 = Math.PI * 1.6;
const ROW_PTS = 400;
const BONUS_PTS = 1000;

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

  // Card position: centred on screen, 2x the pit card size
  const baseCw = cardPos?.w ?? 120;
  const baseCh = cardPos?.h ?? 140;
  const cw = baseCw * CARD_SCALE;
  const ch = baseCh * CARD_SCALE;
  const cx = vp.w / 2;
  const cy = vp.h * 0.38;
  const cardImg = cardPos?.image ?? "";

  const [pan, setPan] = useState({ x: 0, y: 0 });
  useEffect(() => setPan({ x: 0, y: 0 }), [step.number]);
  const drag = useRef<{ id: number; sx: number; sy: number; px: number; py: number; moved: boolean } | null>(null);

  const [openCount, setOpenCount] = useState(0);
  useEffect(() => setOpenCount(0), [step.number]);

  const [openNodes, setOpenNodes] = useState<Set<number>>(new Set());
  useEffect(() => setOpenNodes(new Set()), [step.number]);

  const [activeText, setActiveText] = useState<number | null>(null);
  useEffect(() => setActiveText(null), [step.number]);

  const [videoReady, setVideoReady] = useState(false);
  useEffect(() => setVideoReady(false), [step.number]);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Double-tap via pointerUp -- completely separate from pan system
  const lastCardTap = useRef(0);
  const cardTapMoved = useRef(false);

  const awardRowImmediate = useCallback((rowIdx: number) => {
    const key = `${step.number}:${rowIdx}`;
    if (seenRows.has(key)) return;
    seenRows.add(key);
  }, [step.number]);

  const awardRow = useCallback((rowIdx: number) => {
    const key = `${step.number}:${rowIdx}`;
    if (seenRows.has(key)) return;
    seenRows.add(key);
    onScore?.(ROW_PTS);
    const allSeen = step.rows.every((_, i) => seenRows.has(`${step.number}:${i}`));
    if (allSeen) onScore?.(BONUS_PTS);
  }, [step, onScore]);

  const handleCardPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    cardTapMoved.current = false;
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
  }, []);

  const handleCardPointerMove = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    if (Math.abs(e.movementX) > 6 || Math.abs(e.movementY) > 6) cardTapMoved.current = true;
  }, []);

  const handleCardPointerUp = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    if (cardTapMoved.current) return;
    const now = Date.now();
    if (now - lastCardTap.current < 450) {
      lastCardTap.current = 0;
      setOpenCount((c: number) => {
        const next = Math.min(c + 1, step.rows.length);
        if (next > c) {
          const newRow = next - 1;
          setActiveText(newRow);
          setOpenNodes((prev) => { const s = new Set(prev); s.add(newRow); return s; });
          awardRowImmediate(newRow);
        }
        return next;
      });
    } else {
      lastCardTap.current = now;
    }
  }, [step.rows.length, awardRowImmediate]);

  // Node tap -- uses pointerUp too so suppressClick never blocks it
  const lastNodeTap = useRef<{ id: string; t: number } | null>(null);
  const nodeTapMoved = useRef(false);

  const handleNodePointerDown = useCallback((e: React.PointerEvent, nodeId: string) => {
    e.stopPropagation();
    nodeTapMoved.current = false;
    lastNodeTap.current = { id: nodeId, t: Date.now() };
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
  }, []);

  const handleNodePointerMove = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    if (Math.abs(e.movementX) > 6 || Math.abs(e.movementY) > 6) nodeTapMoved.current = true;
  }, []);

  const handleNodePointerUp = useCallback((e: React.PointerEvent, n: StepNode, unlocked: boolean) => {
    e.stopPropagation();
    if (!unlocked || nodeTapMoved.current) return;
    if (!lastNodeTap.current || lastNodeTap.current.id !== n.id) return;
    if (Date.now() - lastNodeTap.current.t > 600) return;
    setOpenNodes((prev) => { const s = new Set(prev); s.add(n.row); return s; });
    setActiveText((prev: number | null) => prev === n.row ? null : n.row);
    awardRow(n.row);
  }, [awardRow]);

  const onPanDown = (e: React.PointerEvent) => {
    drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y, moved: false };
  };
  const onPanMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) > 6) d.moved = true;
    if (d.moved) setPan({ x: d.px + dx, y: d.py + dy });
  };
  const onPanUp = () => { drag.current = null; };

  const nodes: StepNode[] = useMemo(() => {
    const cnt = step.rows.length;
    return step.rows.map((_, i) => {
      const seed = step.number * 137.5;
      const rng = (n: number) => ((Math.sin(seed + n * 91.7) + 1) / 2);
      const baseAngle = Math.PI / 2;
      const a = baseAngle + (i - (cnt - 1) / 2) * (SPREAD1 / Math.max(cnt, 2));
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
    // prefer right, fall back to left if it would overlap the card
    let tx = nx + NODE_R + 20;
    if (tx + textW > cardL && nx < cardR) tx = nx - NODE_R - 20 - textW;
    tx = Math.max(12, Math.min(vp.w - textW - 12, tx));
    const ty = Math.max(60, Math.min(vp.h - 180, ny - 40));
    return { tx, ty };
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
          fontSize: "clamp(22px, 4vw, 48px)",
          color: "#ffffff",
          letterSpacing: "0.04em",
          filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))",
          lineHeight: 1,
        }}>
          HOW TO PLAY...
        </div>
        <div style={{
          fontFamily: "'Luckiest Guy', system-ui",
          fontSize: "clamp(28px, 5.5vw, 64px)",
          color: "#ffed00",
          letterSpacing: "0.04em",
          filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))",
          lineHeight: 1,
          marginTop: 4,
        }}>
          STEP {step.number}
        </div>
      </div>

      {/* Card -- 2x size, centred, HTML so img/video render reliably */}
      <div
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        onPointerDown={handleCardPointerDown}
        onPointerMove={handleCardPointerMove}
        onPointerUp={handleCardPointerUp}
        style={{
          position: "fixed",
          left: cx + pan.x - cw / 2,
          top: cy + pan.y - ch / 2,
          width: cw,
          height: ch,
          borderRadius: cw * 0.08,
          overflow: "hidden",
          pointerEvents: "all",
          cursor: "pointer",
          zIndex: 4,
          border: "5px solid #ffed00",
          userSelect: "none",
          WebkitUserSelect: "none",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        {/* Video -- always loading */}
        <video
          ref={(el) => { videoRef.current = el; if (el) { el.muted = true; el.volume = 0; } }}
          src={`/step${step.number}-video-animation.mp4`}
          autoPlay
          muted
          playsInline
          onLoadedMetadata={(e) => { const v = e.target as HTMLVideoElement; v.muted = true; v.volume = 0; }}
          onCanPlay={(e) => { const v = e.target as HTMLVideoElement; v.muted = true; v.volume = 0; setVideoReady(true); }}
          onEnded={(e) => { (e.target as HTMLVideoElement).pause(); }}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        {/* Image placeholder until video ready */}
        {!videoReady && cardImg && (
          <div style={{ position: "absolute", inset: 0 }}>
            <img
              src={cardImg}
              alt=""
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }}
            />
          </div>
        )}
        {/* Caption at bottom -- Luckiest Guy, bigger */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "clamp(8px,2%,16px) 10px clamp(10px,2.5%,18px)",
          background: "#ffed00",
          fontFamily: "'Luckiest Guy', system-ui",
          fontSize: "clamp(12px, 2.2vw, 22px)",
          color: "#0a3a57",
          textAlign: "center",
          letterSpacing: "0.02em",
          lineHeight: 1.1,
          pointerEvents: "none",
        }}>
          {step.caption}
        </div>
        {/* Double-tap hint */}
        {!allUnlocked && (
          <div style={{
            position: "absolute", bottom: 44, left: 0, right: 0,
            textAlign: "center", fontFamily: "Montserrat, sans-serif",
            fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.9)",
            pointerEvents: "none",
            textShadow: "0 1px 4px rgba(0,0,0,0.8)",
          }}>
            double-tap to reveal
          </div>
        )}
      </div>

      {/* SVG layer: edges + nodes + text -- sits above card */}
      <svg
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none", zIndex: 5 }}
      >
        {/* Edge lines -- drawn BELOW nodes but ABOVE card (SVG painter order) */}
        {nodes.map((n) => {
          const unlocked = n.row < openCount;
          return (
            <line
              key={`e-${n.id}`}
              x1={cx + pan.x} y1={cy + pan.y}
              x2={n.x + pan.x} y2={n.y + pan.y}
              stroke={unlocked ? "#ffed00" : "#ffffff"}
              strokeWidth={unlocked ? 3 : 2}
              strokeDasharray={unlocked ? undefined : "7 9"}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((n) => {
          const unlocked = n.row < openCount;
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
                onPointerDown={(e) => handleNodePointerDown(e, n.id)}
                onPointerMove={handleNodePointerMove}
                onPointerUp={(e) => handleNodePointerUp(e, n, unlocked)}
              >
                {/* Icon -- bigger, no dashed ring */}
                <image
                  href={row.icon}
                  x={-NODE_R} y={-NODE_R}
                  width={NODE_R * 2} height={NODE_R * 2}
                  style={{
                    opacity: unlocked ? 1 : 0.55,
                    filter: isOpen
                      ? "drop-shadow(0 0 8px rgba(255,237,0,1)) brightness(0) saturate(100%) invert(93%) sepia(67%) saturate(600%) hue-rotate(0deg)"
                      : "drop-shadow(0 2px 5px rgba(0,0,0,0.5))",
                  }}
                />
                {/* Number badge */}
                <circle cx={NODE_R * 0.72} cy={-NODE_R * 0.72} r={14}
                  fill={unlocked ? "#ffed00" : "rgba(255,255,255,0.9)"}
                  stroke={unlocked ? "#0a3a57" : "rgba(0,0,0,0.15)"}
                  strokeWidth={1.5}
                />
                <text
                  x={NODE_R * 0.72} y={-NODE_R * 0.72}
                  textAnchor="middle" dominantBaseline="central"
                  fontFamily="'Luckiest Guy',system-ui" fontSize={13}
                  fill={unlocked ? "#0a3a57" : "#666"}
                >
                  {n.row + 1}
                </text>
              </g>

              {/* Text panel */}
              {isActive && unlocked && (
                <g style={{ pointerEvents: "none" }}>
                  <text
                    x={tx} y={ty}
                    fontFamily="'Luckiest Guy', system-ui"
                    fontSize={36}
                    fill="#ffffff"
                    dominantBaseline="hanging"
                    style={{ filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.8))" }}
                  >
                    {row.title}
                  </text>
                  {row.body.split(/\s+/).reduce((lines: string[], word: string) => {
                    if (!lines.length) return [word];
                    const last = lines[lines.length - 1];
                    return last.length + word.length < 22
                      ? [...lines.slice(0, -1), last + " " + word]
                      : [...lines, word];
                  }, []).map((line: string, li: number) => (
                    <text
                      key={li}
                      x={tx} y={ty + 50 + li * 34}
                      fontFamily="Montserrat, sans-serif"
                      fontSize={22}
                      fontWeight="700"
                      fill="rgba(255,255,255,0.95)"
                      dominantBaseline="hanging"
                      style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.9))" }}
                    >
                      {line}
                    </text>
                  ))}
                </g>
              )}
            </g>
          );
        })}
      </svg>

      <button type="button" className={styles.close}
        onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Close"
        style={{ zIndex: 20 }}>
        &times;
      </button>

      <div className={styles.nav} style={{ zIndex: 20 }}>
        <button type="button"
          className={`${styles.navBtn}${!hasPrev ? " " + styles.navBtnHidden : ""}`}
          onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
          aria-label="Previous step">&#8592;</button>
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
          aria-label="Next step">&#8594;</button>
      </div>
    </div>
  );
}