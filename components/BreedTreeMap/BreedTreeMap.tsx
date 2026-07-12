"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import type { LineageNode } from "../../data/lineage";
import { breeds } from "../../data/breeds";
import { ukBreeds } from "../../data/uk-breeds";
import { breedInfo } from "../../data/breedInfo";
import styles from "./BreedTreeMap.module.css";

type BreedTag = "extinct" | "trending" | "popular" | "endangered" | "in-decline";

const TAG_STYLE: Record<BreedTag, { bg: string }> = {
  extinct:      { bg: "#d64545" },
  trending:     { bg: "#2e9e5b" },
  popular:      { bg: "#4ade80" },
  endangered:   { bg: "#ff7a3c" },
  "in-decline": { bg: "#ffb02e" },
};

const PROGENITOR_STATUS: Record<string, BreedTag> = {
  "Talbot hound": "extinct", "Talbot hounds": "extinct", "St Hubert Hound": "extinct",
  "Old scenting hounds": "extinct", "Old English Black and Tan Terrier": "extinct",
  "White English Terrier": "extinct", "Old English White Terrier": "extinct",
  "English White Terrier": "extinct",

  // ── Additional extinct progenitor lines ───────────────────────────────────
  "Ancient Molossers":               "extinct",
  "Ancient Chinese toy dogs":        "extinct",
  "Ancient Techichi dogs":           "extinct",
  "Ancient eastern sighthounds":     "extinct",
  "Ancient spotted hounds":          "extinct",
  "Ancient Arctic spitz":            "extinct",
  "Ancient Spitz-type dogs":         "extinct",
  "Arctic sled spitz":               "extinct",
  "Spitz-type dogs":                 "extinct",
  "Brabant Bullenbeisser":           "extinct",
  "German Bullenbeisser types":      "extinct",
  "Medieval Alaunts and catch dogs": "extinct",
  "Mastiff and Alaunt war dogs":     "extinct",
  "Old English Bulldog":             "extinct",
  "Old German boarhounds":           "extinct",
  "Old German farm guards":          "extinct",
  "Old German hunting dogs":         "extinct",
  "Old German ratting terriers":     "extinct",
  "Early Germanic hunting dogs":     "extinct",
  "German bracke scenthounds":       "extinct",
  "Old British bandogs":             "extinct",
  "Old British ratting terriers":    "extinct",
  "Old Border terriers":             "extinct",
  "Old Highland terriers":           "extinct",
  "Old Welsh land spaniels":         "extinct",
  "Old Welsh Grey Sheepdog":         "extinct",
  "Old Scotch Collie":               "extinct",
  "Old working collies":             "extinct",
  "Old hill and bearded collies":    "extinct",
  "Old working bandogs":             "extinct",
  "Old hunting dogs of the Celts":   "extinct",
  "Old setting spaniels":            "extinct",
  "Old sporting toy spaniels":       "extinct",
  "Old toy spaniels":                "extinct",
  "Old European lapdogs":            "extinct",
  "Old European water dogs":         "extinct",
  "Old earth terriers":              "extinct",
  "Old fell terriers":               "extinct",
  "Old wirehaired fell terriers":    "extinct",
  "Old black-and-tan setters":       "extinct",
  "Old short-legged working dogs":   "extinct",
  "Old Irish water dogs":            "extinct",
  "Alpine mastiff farm dogs":        "extinct",
  "Heavier working spaniels":        "extinct",
  "Celtic Hound":                    "extinct",
  "Roman drover dogs":               "extinct",
  "Farm and kitchen curs":           "extinct",
  "Cur":                             "extinct",
  "Pug-type toy dogs":               "extinct",
  "Mountain coursing hounds":        "extinct",
  "Rough northern sighthounds":      "extinct",
  "Bloodhound and Gascon hounds":    "extinct",
  "Basset and heavy hounds":         "extinct",
  "St Hubert and Talbot hounds":     "extinct",
  "Southern Hound":                  "extinct",
  "Rache":                           "extinct",
  "Staghound":                       "extinct",
  "Buckhound":                       "extinct",
  "Dumfriesshire Hound":             "extinct",
  "Newfoundland landrace dogs":      "extinct",
  "Local German cattle dogs":        "extinct",
  "German farm spitz":               "extinct",
  "Schnauzer-type farm dogs":        "extinct",
  "Standard Schnauzer farm dogs":    "extinct",
  "German Pinscher":                 "extinct",
  "Mediterranean miniature sighthounds": "extinct",
  "Low-slung soldiers' dogs":        "extinct",
  "Norwich terrier stock":           "extinct",
  "Skye terrier stock":              "endangered",
  "Collie or working dog":           "extinct",
  "Working hunt terriers":           "extinct",
  // ── Endangered living breeds appearing as ancestors ───────────────────────
  "Otterhound":                      "endangered",
  "Scottish Deerhound":              "endangered",
  "Deerhound":                       "endangered",
  "Bloodhound":                      "endangered",
  "Irish Wolfhound":                 "endangered",
  "Old English Sheepdog":            "endangered",
  "English Foxhound":                "in-decline",
  "Curly-Coated Retriever":          "endangered",
  "Golden Retriever":                "popular",
  "Goldendoodle":                    "popular",
  "Basset Hound":                    "in-decline",
  "Afghan Hound":                    "in-decline",
  "German Shepherd":                 "popular",
  "German Shepherd Dog":             "popular",
  "Greyhound":                       "in-decline",
  "Italian Greyhound":               "popular",
  "Northern Inuit Dog":              "endangered",
};


const LIVING_STATUS: Record<string, BreedTag> = {
  "Labrador": "popular", "Poodle": "popular",
};

const LIVING_NAMES = new Set<string>(
  [...ukBreeds.map((b) => b.name), ...breeds.map((b) => b.name)].map((s) => s.toLowerCase().trim())
);

function nodeStatus(name: string, note: string): BreedTag | null {
  const n = (note || "").toLowerCase();
  if (n.includes("extinct")) return "extinct";
  if (n.includes("in decline") || n.includes("declining")) return "in-decline";
  if (n.includes("endangered") || n.includes("vulnerable")) return "endangered";
  if (PROGENITOR_STATUS[name]) return PROGENITOR_STATUS[name];
  if (LIVING_STATUS[name]) return LIVING_STATUS[name];
  const key = name.toLowerCase().trim();
  const uk = ukBreeds.find((b) => b.name.toLowerCase().trim() === key);
  if (uk) return (uk.tag as BreedTag) ?? "popular";
  if (LIVING_NAMES.has(key)) return "popular";
  return null;
}

const ROOT    = 58;
const RING1   = ROOT + 96; // matches pit
const RSTEP   = 128; // matches pit
const SPREAD1 = Math.PI * 1.5; // matches pit
const SPREADN = Math.PI * 0.9; // matches pit - tighter deep arcs = less crisscross

type Node = LineageNode & {
  _id: string;
  _parent: Node | null;
  _leaves: number;
  _x: number;
  _y: number;
  _dir: number;
};

export type FrameNode = { id: string; name: string; img: string; pct?: number; note?: string; status?: BreedTag | null };

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

function radius(share: number) { return Math.max(21, 5 * Math.sqrt(share)); }

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
  // Phase 1: hard collision resolution (8 passes)
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
];

export default function BreedTreeMap({
  lineage,
  rootImage,
  filledIds = [],
  onFramesReady,
  onImageDropped,
  onDragName,
}: {
  lineage: LineageNode;
  rootImage?: string;
  filledIds?: string[];
  onFramesReady?: (frames: FrameNode[]) => void;
  onImageDropped?: (nodeId: string, nodeName: string, clientX: number, clientY: number) => void;
  onDragName?: (name: string | null) => void;
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

  // Pct card on node click
  type PctCard = { name: string; share: number; norm: number; depth: number; x: number; y: number };
  const [pctCard, setPctCard] = useState<PctCard | null>(null);

  // Draggable image cards
  type DragImg = { id: string; name: string; img: string; x: number; y: number; placed: boolean };
  const [dragImgs, setDragImgs] = useState<DragImg[]>([]);
  const [draggingImg, setDraggingImg] = useState<string | null>(null);

  // Opened node IDs (turn blue when eye clicked)
  const [openedIds, setOpenedIds] = useState<Set<string>>(new Set());

  // Notify parent of frame nodes — fire only once per root
  const framesReadyFired = useRef(false);
  useEffect(() => {
    if (!onFramesReady || framesReadyFired.current) return;
    framesReadyFired.current = true;
    const found: FrameNode[] = [];
    const seenImg = new Set<string>();
    const walk = (n: Node) => {
      if (n.img && n._parent) {
        const img = n.img as string;
        if (!seenImg.has(img)) {
          seenImg.add(img);
          const pct = Math.round((n._leaves / root._leaves) * 100);
          const status = nodeStatus(n.name, n.note ?? "");
          found.push({ id: n._id, name: n.name, img, pct, note: breedInfo[n.name] || n.note, status });
        }
      }
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
        style={{ position: "relative", display: "inline-block" }}
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

          {/* Edges */}
          <g>
            {shown.filter((n) => n._parent).map((n) => (
              <line key={`rod-${n._id}`}
                className={`${styles.edge} ${open.has(n._id) ? styles.edgeLit : ""}`}
                x1={(n._parent as Node)._x} y1={(n._parent as Node)._y}
                x2={n._x} y2={n._y} />
            ))}
          </g>

          {/* Root node */}
          <g transform={`translate(${root._x},${root._y})`}>
            <rect x={-ROOT - 4} y={-ROOT - 4} width={ROOT * 2 + 8} height={ROOT * 2 + 8}
              rx={20} fill="#0a3a57" stroke="#ffd23e" strokeWidth={4} />
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

          {/* Child nodes */}
          {shown.filter((n) => n._parent).map((n) => {
            const parent = n._parent as Node;
            const share = Math.round((n._leaves / parent._leaves) * 100);
            const r = radius(share);
            const hasKids = !!(n.children as Node[] | undefined)?.length;
            const isOpen = open.has(n._id);
            const descendantCount = countDescendants(n);
            const isFilled = filledIds.includes(n._id);
            const isOpened = openedIds.has(n._id);

            return (
              <g key={n._id} data-node="1" transform={`translate(${n._x},${n._y})`}
                style={{ cursor: "pointer" }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  // Branch nodes: toggle open/closed
                  if (hasKids) { toggleNode(n); return; }
                  // Leaf/image nodes: click opens image card
                  if (n.img && !dragImgs.find((d) => d.id === n._id)) {
                    const wrap = wrapRef.current;
                    if (!wrap) return;
                    const wrapRect = wrap.getBoundingClientRect();
                    setOpenedIds((prev) => new Set([...prev, n._id]));
                    setDragImgs((prev) => [...prev, {
                      id: n._id, name: n.name, img: n.img as string,
                      x: e.clientX - wrapRect.left + 20,
                      y: e.clientY - wrapRect.top - 80,
                      placed: false,
                    }]);
                  }
                }}>

                <circle
                  className={`${styles.disc} ${hasKids && !isOpen ? styles.discHas : ""} ${isOpen ? styles.discOpen : ""}`.trim()}
                  r={r}
                  fill="none"
                  style={{
                    fill: isFilled ? "#22c55e" : isOpened ? "#22c55e" : (n.img && !hasKids) ? "var(--navy, #0a3a57)" : n.img ? "#ffd23e" : undefined,
                    stroke: isFilled ? "#22c55e" : isOpened ? "#22c55e" : undefined,
                    strokeWidth: (isFilled || isOpened) ? 3 : undefined,
                  }} />

                <text className={styles.pct} textAnchor="middle" dominantBaseline="central"
                  fontSize={Math.max(11, r * 0.5)} style={isOpen ? { fill: "#ffffff" } : undefined}>
                  {`${share}%`}
                </text>

                {/* Name pill - wraps at 16 chars */}
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
                      <rect className={`${styles.nmPill} ${styles.nmPillHover}`} x={-pillW / 2} y={py} width={pillW} height={pillH} rx={pillH / 2} />
                      {lines.map((line, i) => (
                        <text key={i} className={`${styles.nm} ${styles.nmHover}`} textAnchor="middle" dominantBaseline="central"
                          y={py + padY + i * lineH + lineH / 2} style={{ fontSize: "12px" }}>{line}</text>
                      ))}
                    </g>
                  );
                })()}

                {/* Expand hint */}
                {hasKids && !isOpen && (
                  <text className={styles.more} textAnchor="middle" y={r + 14}>+{descendantCount} inside</text>
                )}

                {/* Eye icon - nodes with images not yet opened */}
                {n.img && !dragImgs.find((d) => d.id === n._id) && (
                  <g transform={`translate(${r - 8}, ${-r + 8})`} style={{ cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const wrap = wrapRef.current;
                      if (!wrap) return;
                      const wrapRect = wrap.getBoundingClientRect();
                      const x = e.clientX - wrapRect.left + 20;
                      const y = e.clientY - wrapRect.top - 80;
                      setOpenedIds((prev) => new Set([...prev, n._id]));
                      setDragImgs((prev) => [...prev, { id: n._id, name: n.name, img: n.img as string, x, y, placed: false }]);
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

        {/* Pct card on node click */}
        {pctCard && (
          <div className={styles.pctCard} style={{ left: Math.min(pctCard.x, 700), top: pctCard.y }}>
            <button className={styles.pctClose} onClick={() => setPctCard(null)}>×</button>
            <div className={styles.pctName}>{pctCard.name}</div>
            <div className={styles.pctBig}>{pctCard.norm < 1 ? "<1%" : `${pctCard.norm}%`} of your chum</div>
            <div className={styles.pctRow}>As {genLabel(pctCard.depth)}: {pctCard.share < 1 ? "<1%" : `${pctCard.share}%`}</div>
            <div className={styles.pctTitle}>{TITLES[Math.abs(pctCard.name.split("").reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)) % TITLES.length]}</div>
            <div className={styles.pctDisclaimer}>These figures come from history and old breeding records, our viewpoint, not proven fact.</div>
          </div>
        )}

        {/* Draggable image cards */}
        {dragImgs.filter((d) => !d.placed && !filledIds.includes(d.id)).map((d) => (
          <div key={d.id}
            className={`${styles.imgCard} ${draggingImg === d.id ? styles.imgCardDragging : ""}`}
            style={{ position: "absolute", left: d.x, top: d.y, zIndex: 200 }}
            onPointerDown={(e) => {
              e.preventDefault(); e.stopPropagation();
              setDraggingImg(d.id);
              onDragName?.(d.name);
              const startX = e.clientX - d.x; const startY = e.clientY - d.y;
              const el = e.currentTarget;
              el.setPointerCapture(e.pointerId);
              const onMove = (ev: PointerEvent) => setDragImgs((prev) => prev.map((p) => p.id === d.id ? { ...p, x: ev.clientX - startX, y: ev.clientY - startY } : p));
              const onUp = (ev: PointerEvent) => {
                setDraggingImg(null);
                onDragName?.(null);
                el.removeEventListener("pointermove", onMove);
                el.removeEventListener("pointerup", onUp);
                onImageDropped?.(d.id, d.name, ev.clientX, ev.clientY);
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
    </div>
  );
}
