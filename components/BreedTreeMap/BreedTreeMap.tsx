"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import type { LineageNode } from "../../data/lineage";
import styles from "./BreedTreeMap.module.css";

// ── Constants (matching LineageMap pit values) ────────────────────────────────
const ROOT   = 77;
const RING1  = ROOT + 128;
const RSTEP  = 197;
const SPREAD1 = Math.PI * 1.1;
const SPREADN = Math.PI * 1.6;

// ── Types ─────────────────────────────────────────────────────────────────────
type Node = LineageNode & {
  _id: string;
  _parent: Node | null;
  _leaves: number;
  _x: number;
  _y: number;
  _dir: number;
};

type Tooltip = {
  x: number;
  y: number;
  name: string;
  share: number;
  note?: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
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

function radius(_share: number) {
  return 28; // fixed size - matches pit visual where nodes appear consistent
}

// Assign positions recursively from a root node
function layoutTree(root: Node) {
  root._x = 0;
  root._y = 0;
  root._dir = -Math.PI / 2;

  function place(n: Node, depth: number) {
    const kids = n.children as Node[] | undefined;
    if (!kids || kids.length === 0) return;
    const cnt = kids.length;
    const spread = depth === 0 ? SPREAD1 : SPREADN;
    let center = depth === 0 ? -Math.PI / 2 : n._dir;
    if (cnt === 1 && depth > 0) {
      const side = depth % 2 === 1 ? 1 : -1;
      center = n._dir + side * (Math.PI * 0.38);
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

  // Collision resolution - push overlapping nodes apart
  // Run multiple passes until stable
  const NODE_R = 28; // fixed radius
  const MIN_DIST = NODE_R * 2 + 8; // minimum distance between node centres
  const allNodes: Node[] = [];
  const collectAll = (n: Node) => {
    allNodes.push(n);
    (n.children as Node[] | undefined)?.forEach(collectAll);
  };
  collectAll(root);

  for (let pass = 0; pass < 8; pass++) {
    let moved = false;
    for (let i = 0; i < allNodes.length; i++) {
      for (let j = i + 1; j < allNodes.length; j++) {
        const a = allNodes[i];
        const b = allNodes[j];
        if (a._parent === b || b._parent === a) continue; // never push parent/child apart
        const dx = b._x - a._x;
        const dy = b._y - a._y;
        const dist = Math.hypot(dx, dy) || 0.001;
        if (dist < MIN_DIST) {
          const push = (MIN_DIST - dist) / 2;
          const nx = dx / dist * push;
          const ny = dy / dist * push;
          // Only push the node that is NOT the root
          if (a !== root) { a._x -= nx; a._y -= ny; }
          if (b !== root) { b._x += nx; b._y += ny; }
          moved = true;
        }
      }
    }
    if (!moved) break;
  }
}

// Build a flat list of all visible nodes given the open set
function getShown(root: Node, open: Set<string>): Node[] {
  const result: Node[] = [root];
  function walk(n: Node) {
    if (!open.has(n._id)) return;
    const kids = n.children as Node[] | undefined;
    if (!kids) return;
    kids.forEach((k) => { result.push(k); walk(k); });
  }
  walk(root);
  return result;
}

// Build all open node IDs recursively
function allIds(n: Node): string[] {
  const ids = [n._id];
  const kids = n.children as Node[] | undefined;
  if (kids) kids.forEach((k) => ids.push(...allIds(k)));
  return ids;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function BreedTreeMap({
  lineage,
  rootImage,
}: {
  lineage: LineageNode;
  rootImage?: string;
}) {
  // Deep clone and assign IDs + positions
  const root = useMemo<Node>(() => {
    const clone = JSON.parse(JSON.stringify(lineage)) as Node;
    function assign(n: Node, id: string, parent: Node | null) {
      n._id = id;
      n._parent = parent;
      n._leaves = sumLeaves(n);
      (n.children as Node[] | undefined)?.forEach((c, i) =>
        assign(c, `${id}.${i}`, n)
      );
    }
    assign(clone, "0", null);
    layoutTree(clone);
    return clone;
  }, [lineage]);

  // Start fully open
  const [open, setOpen] = useState<Set<string>>(() => new Set(allIds(root)));

  // Reset when lineage changes
  useEffect(() => {
    setOpen(new Set(allIds(root)));
  }, [root]);

  const shown = useMemo(() => getShown(root, open), [root, open]);

  // Pan state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef({ x: 0, y: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);



  // Draggable image cards (eye icon click)
  type DragImg = { id: string; name: string; img: string; x: number; y: number; placed: boolean };
  const [dragImgs, setDragImgs] = useState<DragImg[]>([]);
  const [draggingImg, setDraggingImg] = useState<string | null>(null); // id being dragged

  // Frames - one per node with image, stacked
  type Frame = { id: string; name: string; img: string; filled: boolean; shake: boolean };
  const [frames, setFrames] = useState<Frame[]>([]);
  const [frameFlash, setFrameFlash] = useState<string | null>(null);

  // Build frames from all nodes with images on mount
  useEffect(() => {
    const found: Frame[] = [];
    const walk = (n: Node) => {
      if (n.img && n._parent) {
        found.push({ id: n._id, name: n.name, img: n.img as string, filled: false, shake: false });
      }
      (n.children as Node[] | undefined)?.forEach(walk);
    };
    walk(root);
    setFrames(found);
  }, [root]);

  // Pct card (click) - detailed ancestry breakdown
  type PctCard = { name: string; share: number; norm: number; depth: number; note?: string; x: number; y: number };
  const [pctCard, setPctCard] = useState<PctCard | null>(null);

  // Calculate normalised share relative to root
  const normShare = (n: Node): number => {
    if (!n._parent) return 100;
    return Math.round((n._leaves / root._leaves) * 100);
  };

  const genLabel = (d: number) => {
    if (d <= 0) return "the breed itself";
    if (d === 1) return "parent";
    if (d === 2) return "grandparent";
    return `${"great-".repeat(d - 2)}grandparent`;
  };

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

  // Pan drag
  const panDrag = useRef<{ sx: number; sy: number; px: number; py: number; moved: boolean } | null>(null);

  const onWrapPointerDown = useCallback((e: React.PointerEvent) => {
    // Only pan on background (not on node circles)
    if ((e.target as SVGElement).closest("g[data-node]")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    panDrag.current = { sx: e.clientX, sy: e.clientY, px: panRef.current.x, py: panRef.current.y, moved: false };
  }, []);

  const onWrapPointerMove = useCallback((e: React.PointerEvent) => {
    if (!panDrag.current) return;
    const dx = e.clientX - panDrag.current.sx;
    const dy = e.clientY - panDrag.current.sy;
    if (!panDrag.current.moved && Math.hypot(dx, dy) < 4) return;
    panDrag.current.moved = true;
    const nx = panDrag.current.px - dx;
    const ny = panDrag.current.py - dy;
    panRef.current = { x: nx, y: ny };
    setPan({ x: nx, y: ny });
  }, []);

  const onWrapPointerUp = useCallback(() => {
    panDrag.current = null;
  }, []);

  // Toggle node open/closed
  const toggleNode = useCallback((n: Node) => {
    const kids = n.children as Node[] | undefined;
    if (!kids || kids.length === 0) return;
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(n._id)) {
        // Close: remove this node and all descendants
        allIds(n).forEach((id) => { if (id !== n._id) next.delete(id); });
        next.delete(n._id);
      } else {
        // Open: just this node's children become visible
        next.add(n._id);
      }
      return next;
    });
  }, []);

  // Fixed coordinate space - no scaling, tree spreads as large as it needs to
  // Calculate natural bounds from all node positions after layout
  const bounds = useMemo(() => {
    const allN: Node[] = [];
    const collect = (n: Node) => { allN.push(n); (n.children as Node[] | undefined)?.forEach(collect); };
    collect(root);
    const PAD = 120;
    const xs = allN.map((n) => n._x);
    const ys = allN.map((n) => n._y);
    return {
      minX: Math.min(...xs) - PAD,
      maxX: Math.max(...xs) + PAD,
      minY: Math.min(...ys) - PAD,
      maxY: Math.max(...ys) + PAD,
    };
  }, [root]);
  const VIEW_W = Math.max(1400, bounds.maxX - bounds.minX);
  const VIEW_H = Math.max(1000, bounds.maxY - bounds.minY);

  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      style={{ position: "relative" }}
      onPointerDown={onWrapPointerDown}
      onPointerMove={onWrapPointerMove}
      onPointerUp={onWrapPointerUp}
      onPointerLeave={onWrapPointerUp}
    >
      <svg
        className={styles.svg}
        width={VIEW_W}
        height={VIEW_H}
        viewBox={`${bounds.minX - pan.x} ${bounds.minY - pan.y} ${VIEW_W} ${VIEW_H}`}
        style={{ display: "block" }}
      >
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
        </defs>

        {/* Rods */}
        <g>
          {shown.filter((n) => n._parent).map((n) => (
            <line
              key={`rod-${n._id}`}
              className={`${styles.edge} ${open.has(n._id) ? styles.edgeLit : ""}`}
              x1={(n._parent as Node)._x}
              y1={(n._parent as Node)._y}
              x2={n._x}
              y2={n._y}
            />
          ))}
        </g>

        {/* Root node */}
        <g transform={`translate(${root._x},${root._y})`}>
          <defs>
            <clipPath id="btm-root-clip">
              <rect x={-ROOT} y={-ROOT} width={ROOT*2} height={ROOT*2} rx={16} />
            </clipPath>
          </defs>
          <rect
            x={-ROOT-4} y={-ROOT-4}
            width={ROOT*2+8} height={ROOT*2+8}
            rx={20}
            fill="var(--blue, #1497d6)"
            stroke="var(--yellow, #ffd23e)"
            strokeWidth={4}
          />
          {rootImage && (
            <image
              href={rootImage}
              x={-ROOT} y={-ROOT}
              width={ROOT*2} height={ROOT*2}
              clipPath="url(#btm-root-clip)"
              preserveAspectRatio="xMidYMid slice"
            />
          )}
          {(() => {
            const w = root.name.length * 6.8 + 20;
            const py = ROOT + 16;
            return (
              <g>
                <rect className={styles.nmPill} x={-w/2} y={py-10} width={w} height={20} rx={10} />
                <text className={styles.nm} textAnchor="middle" dominantBaseline="central" y={py}>{root.name}</text>
              </g>
            );
          })()}
        </g>

        {/* Child nodes */}
        {shown.filter((n) => n._parent).map((n) => {
          const parent = n._parent as Node;
          const share = Math.round((n._leaves / parent._leaves) * 100);
          const r = radius(share);
          const hasKids = !!(n.children as Node[] | undefined)?.length;
          const isOpen = open.has(n._id);
          const descendantCount = countDescendants(n);

          return (
            <g
              key={n._id}
              data-node="1"
              transform={`translate(${n._x},${n._y})`}
              style={{ cursor: hasKids ? "pointer" : "default" }}
              onClick={(e) => {
              e.stopPropagation();
              toggleNode(n);
            }}
  
            >
              <circle
                className={`${styles.disc} ${hasKids && !isOpen ? styles.discHas : ""} ${isOpen ? styles.discOpen : ""}`.trim()}
                r={r}
                fill={n.img ? `url(#btm-${n._id})` : undefined}
              />
              <text
                className={styles.pct}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={Math.max(11, r * 0.5)}
                style={isOpen ? { fill: "#ffffff" } : undefined}
              >
                {`${share}%`}
              </text>

              {/* Name pill - wraps at 16 chars */}
              {(() => {
                const MAX = 16;
                const words = n.name.split(" ");
                const lines: string[] = [];
                let current = "";
                for (const word of words) {
                  if ((current + " " + word).trim().length <= MAX) {
                    current = (current + " " + word).trim();
                  } else {
                    if (current) lines.push(current);
                    current = word;
                  }
                }
                if (current) lines.push(current);
                const lineH = 15;
                const padX = 14;
                const padY = 8;
                const pillH = lines.length * lineH + padY * 2;
                const pillW = Math.max(...lines.map((l) => l.length)) * 6.4 + padX * 2;
                const py = -r - 6 - pillH;
                return (
                  <g>
                    <rect className={styles.nmPill} x={-pillW / 2} y={py} width={pillW} height={pillH} rx={pillH / 2} />
                    {lines.map((line, i) => (
                      <text
                        key={i}
                        className={styles.nm}
                        textAnchor="middle"
                        dominantBaseline="central"
                        y={py + padY + i * lineH + lineH / 2}
                        style={{ fontSize: "12px" }}
                      >
                        {line}
                      </text>
                    ))}
                  </g>
                );
              })()}

              {/* Expand hint */}
              {hasKids && !isOpen && (
                <text className={styles.more} textAnchor="middle" y={r + 14}>
                  +{descendantCount} inside
                </text>
              )}

              {/* Eye icon on all nodes with images */}
              {n.img && !dragImgs.find((d) => d.id === n._id) && (
                <g
                  transform={`translate(${r - 8}, ${-r + 8})`}
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = wrapRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    // Position relative to wrap element
                    const wrapRect = wrapRef.current!.getBoundingClientRect();
                    setDragImgs((prev) => [
                      ...prev,
                      {
                        id: n._id,
                        name: n.name,
                        img: n.img as string,
                        x: 20 + prev.length * 20,
                        y: 20 + prev.length * 20,
                        placed: false,
                      }
                    ]);
                  }}
                >
                  <circle r={11} fill="var(--yellow, #ffd23e)" stroke="var(--navy, #0a3a57)" strokeWidth={1.5} />
                  <text textAnchor="middle" dominantBaseline="central" style={{ fontSize: "13px", fill: "var(--navy, #0a3a57)", fontWeight: 800, pointerEvents: "none", fontFamily: "system-ui" }}>👁</text>
                </g>
              )}


            </g>
          );
        })}
      </svg>

      {/* Draggable image cards */}
      {dragImgs.filter((d) => !d.placed).map((d) => (
        <div
          key={d.id}
          className={`${styles.imgCard} ${draggingImg === d.id ? styles.imgCardDragging : ""}`}
          style={{ position: "absolute", left: d.x, top: d.y, zIndex: 200 }}
          onPointerDown={(e) => {
            e.preventDefault();
            setDraggingImg(d.id);
            const startX = e.clientX - d.x;
            const startY = e.clientY - d.y;
            const el = e.currentTarget;
            el.setPointerCapture(e.pointerId);
            const onMove = (ev: PointerEvent) => {
              const nx = ev.clientX - startX;
              const ny = ev.clientY - startY;
              setDragImgs((prev) => prev.map((p) => p.id === d.id ? { ...p, x: nx, y: ny } : p));
            };
            const onUp = (ev: PointerEvent) => {
              setDraggingImg(null);
              el.removeEventListener("pointermove", onMove);
              el.removeEventListener("pointerup", onUp);
              // Check if dropped on matching frame
              const frameEls = document.querySelectorAll<HTMLElement>("[data-frame]");
              let matched = false;
              frameEls.forEach((f) => {
                const rect = f.getBoundingClientRect();
                if (ev.clientX >= rect.left && ev.clientX <= rect.right && ev.clientY >= rect.top && ev.clientY <= rect.bottom) {
                  const frameId = f.dataset.frame!;
                  const frame = frames.find((fr) => fr.id === frameId);
                  if (frame && frame.img === d.img && !frame.filled) {
                    // Correct match
                    setFrames((prev) => prev.map((fr) => fr.id === frameId ? { ...fr, filled: true } : fr));
                    setDragImgs((prev) => prev.map((p) => p.id === d.id ? { ...p, placed: true } : p));
                    setFrameFlash(frameId);
                    setTimeout(() => setFrameFlash(null), 600);
                    matched = true;
                  } else if (frame && !frame.filled) {
                    // Wrong match - shake
                    setFrames((prev) => prev.map((fr) => fr.id === frameId ? { ...fr, shake: true } : fr));
                    setTimeout(() => setFrames((prev) => prev.map((fr) => fr.id === frameId ? { ...fr, shake: false } : fr)), 400);
                  }
                }
              });
            };
            el.addEventListener("pointermove", onMove);
            el.addEventListener("pointerup", onUp);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={d.img} alt={d.name} className={styles.imgCardImg} draggable={false} />
          <button className={styles.imgCardClose} onClick={() => setDragImgs((prev) => prev.filter((p) => p.id !== d.id))}>×</button>
        </div>
      ))}

      {/* Pct card (click) */}
      {pctCard && (
        <div
          className={styles.pctCard}
          style={{ left: Math.min(pctCard.x, 700), top: pctCard.y }}
        >
          <button className={styles.pctClose} onClick={() => setPctCard(null)}>×</button>
          <div className={styles.pctName}>{pctCard.name}</div>
          <div className={styles.pctBig}>{pctCard.norm < 1 ? "<1%" : `${pctCard.norm}%`} of your chum</div>
          <div className={styles.pctRow}>As {genLabel(pctCard.depth)}: {pctCard.share < 1 ? "<1%" : `${pctCard.share}%`}</div>
          <div className={styles.pctRow}>Share of your chum: {pctCard.norm < 1 ? "<1%" : `${pctCard.norm}%`}</div>
          <div className={styles.pctTitle}>{TITLES[Math.abs(pctCard.name.split("").reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)) % TITLES.length]}</div>
          <div className={styles.pctDisclaimer}>These figures come from history and old breeding records, our viewpoint, not proven fact. (Though DNA reading can now trace bloodlines back with real precision, even reviving lost breeds.)</div>
        </div>
      )}
      {/* Frames panel - fixed position relative to wrap */}
      <div className={styles.framesCard} style={{ position: "absolute", top: 16, right: 16 }}>
        <p style={{ fontFamily: "var(--font-display, 'Luckiest Guy', system-ui)", fontSize: 13, letterSpacing: "0.1em", color: "var(--yellow, #ffd23e)", margin: "0 0 10px", textTransform: "uppercase" }}>Place your chums</p>
        <div className={styles.framesGrid}>
          {frames.map((f) => (
            <div
              key={f.id}
              data-frame={f.id}
              className={`${styles.frame} ${f.filled ? styles.frameFilled : ""} ${f.shake ? styles.frameShake : ""} ${frameFlash === f.id ? styles.frameFlash : ""}`}
            >
              {f.filled ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.img} alt={f.name} className={styles.frameImg} />
                  <span className={styles.frameLabel}>{f.name}</span>
                </>
              ) : (
                <span className={styles.frameEmpty}>+</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
