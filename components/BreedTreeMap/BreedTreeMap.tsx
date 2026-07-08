"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import type { LineageNode } from "../../data/lineage";
import styles from "./BreedTreeMap.module.css";

const ROOT    = 77;
const RING1   = ROOT + 128;
const RSTEP   = 197;
const SPREAD1 = Math.PI * 1.1;
const SPREADN = Math.PI * 1.6;

type Node = LineageNode & {
  _id: string;
  _parent: Node | null;
  _leaves: number;
  _x: number;
  _y: number;
  _dir: number;
};

function sumLeaves(n: LineageNode): number {
  const kids = n.children as LineageNode[] | undefined;
  if (!kids || kids.length === 0) return n.value ?? 1;
  return kids.reduce((s, k) => s + sumLeaves(k), 0);
}

function countDescendants(n: LineageNode): number {
  const kids = n.children as LineageNode[] | undefined;
  if (!kids || kids.length === 0) return 0;
  return kids.length + kids.reduce((s, k) => s + countDescendants(k), 0);
}

function radius(_share: number) { return 28; }

function layoutTree(root: Node) {
  root._x = 0; root._y = 0; root._dir = -Math.PI / 2;
  function place(n: Node, depth: number) {
    const kids = n.children as Node[] | undefined;
    if (!kids || kids.length === 0) return;
    const cnt = kids.length;
    const spread = depth === 0 ? SPREAD1 : SPREADN;
    let center = depth === 0 ? -Math.PI / 2 : n._dir;
    if (cnt === 1 && depth > 0) {
      center = n._dir + (depth % 2 === 1 ? 1 : -1) * (Math.PI * 0.38);
    }
    const dist = depth === 0 ? RING1 : RSTEP;
    const step = spread / Math.max(cnt, 2);
    kids.forEach((k, i) => {
      const a = center + (i - (cnt - 1) / 2) * step;
      k._x = n._x + Math.cos(a) * dist;
      k._y = n._y + Math.sin(a) * dist;
      k._dir = a;
      place(k, depth + 1);
    });
  }
  place(root, 0);
  const MIN_DIST = 28 * 2 + 8;
  const all: Node[] = [];
  const collect = (n: Node) => { all.push(n); (n.children as Node[] | undefined)?.forEach(collect); };
  collect(root);
  for (let pass = 0; pass < 8; pass++) {
    let moved = false;
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const a = all[i]; const b = all[j];
        if (a._parent === b || b._parent === a) continue;
        const dx = b._x - a._x; const dy = b._y - a._y;
        const dist = Math.hypot(dx, dy) || 0.001;
        if (dist < MIN_DIST) {
          const push = (MIN_DIST - dist) / 2;
          const nx = dx / dist * push; const ny = dy / dist * push;
          if (a !== root) { a._x -= nx; a._y -= ny; }
          if (b !== root) { b._x += nx; b._y += ny; }
          moved = true;
        }
      }
    }
    if (!moved) break;
  }
}

function getShown(root: Node, open: Set<string>): Node[] {
  const result: Node[] = [root];
  function walk(n: Node) {
    if (!open.has(n._id)) return;
    (n.children as Node[] | undefined)?.forEach((k) => { result.push(k); walk(k); });
  }
  walk(root);
  return result;
}

function allIds(n: Node): string[] {
  const ids = [n._id];
  (n.children as Node[] | undefined)?.forEach((k) => ids.push(...allIds(k)));
  return ids;
}

const TITLES = [
  "Our best guess, not hard science.",
  "An educated guess, not gospel.",
  "Informed estimate, not exact science.",
  "Our reckoning, not the final word.",
  "A considered guess, not cold fact.",
  "Best judgement, not laboratory proof.",
  "Our read on it, not a certainty.",
  "A fair estimate, not a fixed figure.",
  "Studied guesswork, not hard data.",
  "Our interpretation, not established fact.",
];

export type FrameNode = { id: string; name: string; img: string };

export default function BreedTreeMap({
  lineage,
  rootImage,
  filledIds = [],
  onFramesReady,
  onImageDropped,
}: {
  lineage: LineageNode;
  rootImage?: string;
  filledIds?: string[];
  onFramesReady?: (frames: FrameNode[]) => void;
  onImageDropped?: (nodeId: string, clientX: number, clientY: number) => void;
}) {
  const root = useMemo<Node>(() => {
    const clone = JSON.parse(JSON.stringify(lineage)) as Node;
    function assign(n: Node, id: string, parent: Node | null) {
      n._id = id; n._parent = parent; n._leaves = sumLeaves(n);
      (n.children as Node[] | undefined)?.forEach((c, i) => assign(c, `${id}.${i}`, n));
    }
    assign(clone, "0", null);
    layoutTree(clone);
    return clone;
  }, [lineage]);

  const [open, setOpen] = useState<Set<string>>(() => new Set(allIds(root)));
  useEffect(() => { setOpen(new Set(allIds(root))); }, [root]);
  const shown = useMemo(() => getShown(root, open), [root, open]);

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef({ x: 0, y: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);

  type PctCard = { name: string; share: number; norm: number; depth: number; x: number; y: number };
  const [pctCard, setPctCard] = useState<PctCard | null>(null);

  type DragImg = { id: string; name: string; img: string; x: number; y: number; placed: boolean };
  const [dragImgs, setDragImgs] = useState<DragImg[]>([]);
  const [draggingImg, setDraggingImg] = useState<string | null>(null);
  const [dragName, setDragName] = useState<string | null>(null);

  // Frames state lives inside tree so drag coords match
  type Frame = { id: string; name: string; img: string; filled: boolean; shake: boolean };
  const [frames, setFrames] = useState<Frame[]>([]);
  const [frameFlash, setFrameFlash] = useState<string | null>(null);

  useEffect(() => {
    const found: Frame[] = [];
    const walk = (n: Node) => {
      if (n.img && n._parent) found.push({ id: n._id, name: n.name, img: n.img as string, filled: false, shake: false });
      (n.children as Node[] | undefined)?.forEach(walk);
    };
    walk(root);
    setFrames(found);
  }, [root]);

  useEffect(() => {
    if (!onFramesReady) return;
    const found: FrameNode[] = [];
    const walk = (n: Node) => {
      if (n.img && n._parent) found.push({ id: n._id, name: n.name, img: n.img as string });
      (n.children as Node[] | undefined)?.forEach(walk);
    };
    walk(root);
    onFramesReady(found);
  }, [root, onFramesReady]);

  const normShare = (n: Node) => !n._parent ? 100 : Math.round((n._leaves / root._leaves) * 100);
  const genLabel = (d: number) => d <= 0 ? "the breed itself" : d === 1 ? "parent" : d === 2 ? "grandparent" : `${"great-".repeat(d - 2)}grandparent`;

  const panDrag = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);

  const onWrapPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as SVGElement).closest("g[data-node]")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    panDrag.current = { sx: e.clientX, sy: e.clientY, px: panRef.current.x, py: panRef.current.y };
  }, []);

  const onWrapPointerMove = useCallback((e: React.PointerEvent) => {
    if (!panDrag.current) return;
    const nx = panDrag.current.px - (e.clientX - panDrag.current.sx);
    const ny = panDrag.current.py - (e.clientY - panDrag.current.sy);
    panRef.current = { x: nx, y: ny };
    setPan({ x: nx, y: ny });
  }, []);

  const onWrapPointerUp = useCallback(() => { panDrag.current = null; }, []);

  const toggleNode = useCallback((n: Node) => {
    const kids = n.children as Node[] | undefined;
    if (!kids || kids.length === 0) return;
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(n._id)) { allIds(n).forEach((id) => next.delete(id)); }
      else { next.add(n._id); }
      return next;
    });
  }, []);

  const bounds = useMemo(() => {
    const all: Node[] = [];
    const collect = (n: Node) => { all.push(n); (n.children as Node[] | undefined)?.forEach(collect); };
    collect(root);
    const PAD = 120;
    const xs = all.map((n) => n._x); const ys = all.map((n) => n._y);
    return { minX: Math.min(...xs) - PAD, maxX: Math.max(...xs) + PAD, minY: Math.min(...ys) - PAD, maxY: Math.max(...ys) + PAD };
  }, [root]);

  const VIEW_W = Math.max(1400, bounds.maxX - bounds.minX);
  const VIEW_H = Math.max(1000, bounds.maxY - bounds.minY);

  return (
    <div style={{ display: "block" }}>
      <div
        ref={wrapRef}
        className={styles.wrap}
        style={{ position: "relative" }}
        onPointerDown={onWrapPointerDown}
        onPointerMove={onWrapPointerMove}
        onPointerUp={onWrapPointerUp}
        onPointerLeave={onWrapPointerUp}
      >
        <svg className={styles.svg} width={VIEW_W} height={VIEW_H}
          viewBox={`${bounds.minX + pan.x} ${bounds.minY + pan.y} ${VIEW_W} ${VIEW_H}`}
          style={{ display: "block" }}>
          <defs>
            {rootImage && (
              <pattern id="btm-root" patternContentUnits="objectBoundingBox" width="1" height="1">
                <image href={rootImage} width="1" height="1" preserveAspectRatio="xMidYMid slice" />
              </pattern>
            )}
            {shown.filter((n) => n._parent && n.img).map((n) => (
              <pattern key={n._id} id={`btm-${n._id}`} patternContentUnits="objectBoundingBox" width="1" height="1">
                <image href={n.img as string} width="1" height="1" preserveAspectRatio="xMidYMid slice" />
              </pattern>
            ))}
            <clipPath id="btm-root-clip">
              <rect x={-ROOT} y={-ROOT} width={ROOT * 2} height={ROOT * 2} rx={16} />
            </clipPath>
          </defs>

          <g>
            {shown.filter((n) => n._parent).map((n) => (
              <line key={`rod-${n._id}`}
                className={`${styles.edge} ${open.has(n._id) ? styles.edgeLit : ""}`}
                x1={(n._parent as Node)._x} y1={(n._parent as Node)._y}
                x2={n._x} y2={n._y} />
            ))}
          </g>

          <g transform={`translate(${root._x},${root._y})`}>
            <rect x={-ROOT - 4} y={-ROOT - 4} width={ROOT * 2 + 8} height={ROOT * 2 + 8}
              rx={20} fill="var(--blue, #1497d6)" stroke="var(--yellow, #ffd23e)" strokeWidth={4} />
            {rootImage && (
              <image href={rootImage} x={-ROOT} y={-ROOT} width={ROOT * 2} height={ROOT * 2}
                clipPath="url(#btm-root-clip)" preserveAspectRatio="xMidYMid slice" />
            )}
            {(() => {
              const w = root.name.length * 6.8 + 20;
              const py = ROOT + 16;
              return (
                <g>
                  <rect className={styles.nmPill} x={-w / 2} y={py - 10} width={w} height={20} rx={10} />
                  <text className={styles.nm} textAnchor="middle" dominantBaseline="central" y={py}>{root.name}</text>
                </g>
              );
            })()}
          </g>

          {shown.filter((n) => n._parent).map((n) => {
            const parent = n._parent as Node;
            const share = Math.round((n._leaves / parent._leaves) * 100);
            const r = radius(share);
            const hasKids = !!(n.children as Node[] | undefined)?.length;
            const isOpen = open.has(n._id);
            const descendantCount = countDescendants(n);
            const isFilled = filledIds.includes(n._id);
            return (
              <g key={n._id} data-node="1" transform={`translate(${n._x},${n._y})`}
                style={{ cursor: "pointer" }}
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = wrapRef.current?.getBoundingClientRect();
                  if (rect) setPctCard({ name: n.name, share, norm: normShare(n), depth: n._parent ? 1 : 0, x: e.clientX - rect.left + 12, y: e.clientY - rect.top - 20 });
                  toggleNode(n);
                }}>
                <circle
                  className={`${styles.disc} ${hasKids && !isOpen ? styles.discHas : ""} ${isOpen ? styles.discOpen : ""}`.trim()}
                  r={r}
                  fill={isFilled ? "#22c55e" : n.img ? `url(#btm-${n._id})` : undefined}
                  style={isFilled ? { stroke: "#16a34a" } : undefined} />
                <text className={styles.pct} textAnchor="middle" dominantBaseline="central"
                  fontSize={Math.max(11, r * 0.5)} style={isOpen ? { fill: "#ffffff" } : undefined}>
                  {`${share}%`}
                </text>
                {(() => {
                  const MAX = 16;
                  const words = n.name.split(" ");
                  const lines: string[] = [];
                  let current = "";
                  for (const word of words) {
                    if ((current + " " + word).trim().length <= MAX) { current = (current + " " + word).trim(); }
                    else { if (current) lines.push(current); current = word; }
                  }
                  if (current) lines.push(current);
                  const lineH = 15; const padX = 14; const padY = 8;
                  const pillH = lines.length * lineH + padY * 2;
                  const pillW = Math.max(...lines.map((l) => l.length)) * 6.4 + padX * 2;
                  const py = -r - 6 - pillH;
                  return (
                    <g>
                      <rect className={styles.nmPill} x={-pillW / 2} y={py} width={pillW} height={pillH} rx={pillH / 2} />
                      {lines.map((line, i) => (
                        <text key={i} className={styles.nm} textAnchor="middle" dominantBaseline="central"
                          y={py + padY + i * lineH + lineH / 2} style={{ fontSize: "12px" }}>{line}</text>
                      ))}
                    </g>
                  );
                })()}
                {hasKids && !isOpen && (
                  <text className={styles.more} textAnchor="middle" y={r + 14}>+{descendantCount} inside</text>
                )}
                {n.img && !dragImgs.find((d) => d.id === n._id) && (
                  <g transform={`translate(${r - 8}, ${-r + 8})`} style={{ cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const wrap = wrapRef.current;
                      if (!wrap) return;
                      // Get node SVG position relative to wrap
                      const svgEl = wrap.querySelector("svg");
                      if (!svgEl) return;
                      const svgRect = svgEl.getBoundingClientRect();
                      const vbParts = svgEl.getAttribute("viewBox")?.split(" ").map(Number) ?? [0,0,1400,1000];
                      const scaleX = svgRect.width / (vbParts[2] ?? 1400);
                      const scaleY = svgRect.height / (vbParts[3] ?? 1000);
                      const screenX = (n._x - (vbParts[0] ?? 0)) * scaleX + svgRect.left - wrap.getBoundingClientRect().left;
                      const screenY = (n._y - (vbParts[1] ?? 0)) * scaleY + svgRect.top - wrap.getBoundingClientRect().top;
                      setDragImgs((prev) => [...prev, { id: n._id, name: n.name, img: n.img as string, x: screenX + 40, y: screenY - 80, placed: false }]);
                    }}>
                    <circle r={11} fill="var(--yellow, #ffd23e)" stroke="var(--navy, #0a3a57)" strokeWidth={1.5} />
                    <text textAnchor="middle" dominantBaseline="central"
                      style={{ fontSize: "13px", fill: "var(--navy, #0a3a57)", fontWeight: 800, pointerEvents: "none", fontFamily: "system-ui" }}>👁</text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {pctCard && (
          <div className={styles.pctCard} style={{ left: Math.min(pctCard.x, 700), top: pctCard.y }}>
            <button className={styles.pctClose} onClick={() => setPctCard(null)}>×</button>
            <div className={styles.pctName}>{pctCard.name}</div>
            <div className={styles.pctBig}>{pctCard.norm < 1 ? "<1%" : `${pctCard.norm}%`} of your chum</div>
            <div className={styles.pctRow}>As {genLabel(pctCard.depth)}: {pctCard.share < 1 ? "<1%" : `${pctCard.share}%`}</div>
            <div className={styles.pctRow}>Share of your chum: {pctCard.norm < 1 ? "<1%" : `${pctCard.norm}%`}</div>
            <div className={styles.pctTitle}>{TITLES[Math.abs(pctCard.name.split("").reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)) % TITLES.length]}</div>
            <div className={styles.pctDisclaimer}>These figures come from history and old breeding records, our viewpoint, not proven fact. (Though DNA reading can now trace bloodlines back with real precision, even reviving lost breeds.)</div>
          </div>
        )}

        {dragImgs.filter((d) => !d.placed).map((d) => (
          <div key={d.id}
            className={`${styles.imgCard} ${draggingImg === d.id ? styles.imgCardDragging : ""}`}
            style={{ position: "absolute", left: d.x, top: d.y, zIndex: 200 }}
            onPointerDown={(e) => {
              e.preventDefault(); e.stopPropagation();
              setDraggingImg(d.id);
              setDragName(d.name);
              const startX = e.clientX - d.x; const startY = e.clientY - d.y;
              const el = e.currentTarget;
              el.setPointerCapture(e.pointerId);
              const onMove = (ev: PointerEvent) => setDragImgs((prev) => prev.map((p) => p.id === d.id ? { ...p, x: ev.clientX - startX, y: ev.clientY - startY } : p));
              const onUp = (ev: PointerEvent) => {
                setDraggingImg(null);
                setDragName(null);
                el.removeEventListener("pointermove", onMove);
                el.removeEventListener("pointerup", onUp);
                document.querySelectorAll<HTMLElement>("[data-frame]").forEach((f) => {
                  const rect = f.getBoundingClientRect();
                  if (ev.clientX >= rect.left && ev.clientX <= rect.right && ev.clientY >= rect.top && ev.clientY <= rect.bottom) {
                    const frame = frames.find((fr) => fr.id === f.dataset.frame);
                    if (frame && frame.img === d.img && !frame.filled) {
                      setFrames((prev) => prev.map((fr) => fr.id === frame.id ? { ...fr, filled: true } : fr));
                      setDragImgs((prev) => prev.map((p) => p.id === d.id ? { ...p, placed: true } : p));
                      setFrameFlash(frame.id);
                      setTimeout(() => setFrameFlash(null), 600);
                    } else if (frame && !frame.filled) {
                      setFrames((prev) => prev.map((fr) => fr.id === frame.id ? { ...fr, shake: true } : fr));
                      setTimeout(() => setFrames((prev) => prev.map((fr) => fr.id === frame.id ? { ...fr, shake: false } : fr)), 400);
                    }
                  }
                });
              };
              el.addEventListener("pointermove", onMove);
              el.addEventListener("pointerup", onUp);
            }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={d.img} alt={d.name} className={styles.imgCardImg} draggable={false} />
            <button className={styles.imgCardClose} onClick={() => setDragImgs((prev) => prev.filter((p) => p.id !== d.id))}>×</button>
          </div>
        ))}
      </div>


      {frames.length > 0 && (
        <div className={styles.framesCard}>
          <p style={{ fontFamily: "var(--font-display,'Luckiest Guy',system-ui)", fontSize: 13, letterSpacing: "0.1em", color: "var(--yellow,#ffd23e)", margin: "0 0 12px", textTransform: "uppercase" }}>Ancestor Pack</p>
          <div className={styles.framesGrid}>
            {frames.map((f) => (
              <div key={f.id} className={styles.frameItem}>
                <div data-frame={f.id}
                  className={`${styles.frame} ${f.filled ? styles.frameFilled : ""} ${f.shake ? styles.frameShake : ""} ${frameFlash === f.id ? styles.frameFlash : ""}`.trim()}>
                  {f.filled
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={f.img} alt={f.name} className={styles.frameImg} />
                    : draggingImg && frames.find((df) => df.img === f.img) && dragName
                      ? <span className={styles.frameNameHint}>{dragName}</span>
                      : <span className={styles.frameEmpty}>+</span>}
                </div>
                <span className={styles.frameLabel}>{f.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
