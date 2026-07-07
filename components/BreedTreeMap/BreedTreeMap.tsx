"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import type { LineageNode } from "../../data/lineage";
import styles from "./BreedTreeMap.module.css";

// ── Constants (matching LineageMap pit values) ────────────────────────────────
const ROOT   = 58;
const RING1  = ROOT + 96;
const RSTEP  = 128;
const SPREAD1 = Math.PI * 1.1;
const SPREADN = Math.PI * 1.4;

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

function radius(share: number) {
  return Math.max(21, 5 * Math.sqrt(share));
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

  // Tooltip
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

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
    const nx = panDrag.current.px + dx;
    const ny = panDrag.current.py + dy;
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
  const VIEW_W = 1400;
  const VIEW_H = 1000;

  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      onPointerDown={onWrapPointerDown}
      onPointerMove={onWrapPointerMove}
      onPointerUp={onWrapPointerUp}
      onPointerLeave={onWrapPointerUp}
    >
      <svg
        className={styles.svg}
        viewBox={`${-VIEW_W / 2 - pan.x} ${-VIEW_H / 2 - pan.y} ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
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
              className={styles.rod}
              x1={(n._parent as Node)._x}
              y1={(n._parent as Node)._y}
              x2={n._x}
              y2={n._y}
            />
          ))}
        </g>

        {/* Root node */}
        <g transform={`translate(${root._x},${root._y})`}>
          <circle
            className={styles.discRoot}
            r={ROOT}
            fill={rootImage ? "url(#btm-root)" : "var(--navy, #0a3a57)"}
          />
          <text
            className={styles.nm}
            textAnchor="middle"
            dominantBaseline="central"
            y={ROOT + 18}
            style={{ fontSize: 13 }}
          >
            {root.name}
          </text>
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
              onClick={(e) => { e.stopPropagation(); toggleNode(n); }}
              onMouseEnter={(e) => {
                const rect = wrapRef.current?.getBoundingClientRect();
                if (!rect) return;
                setTooltip({
                  x: e.clientX - rect.left + 14,
                  y: e.clientY - rect.top - 10,
                  name: n.name,
                  share,
                  note: n.note,
                });
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              <circle
                className={`${styles.disc} ${isOpen && hasKids ? styles.discOpen : ""}`}
                r={r}
                fill={n.img ? `url(#btm-${n._id})` : undefined}
              />
              <text
                className={styles.pct}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={Math.max(11, r * 0.5)}
              >
                {`${share}%`}
              </text>

              {/* Name pill */}
              {(() => {
                const w = n.name.length * 6.8 + 20;
                const py = -r - 13;
                return (
                  <g>
                    <rect className={styles.nmPill} x={-w / 2} y={py - 10} width={w} height={20} rx={10} />
                    <text className={styles.nm} textAnchor="middle" dominantBaseline="central" y={py}>
                      {n.name}
                    </text>
                  </g>
                );
              })()}

              {/* Expand hint */}
              {hasKids && !isOpen && (
                <text className={styles.more} textAnchor="middle" y={r + 14}>
                  +{descendantCount} inside
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className={styles.tooltip}
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <span className={styles.tooltipName}>{tooltip.name}</span>
          <span className={styles.tooltipShare}>{tooltip.share}% of ancestry</span>
          {tooltip.note && <span className={styles.tooltipNote}>{tooltip.note}</span>}
        </div>
      )}
    </div>
  );
}
