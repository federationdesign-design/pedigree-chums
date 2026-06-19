"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getLineage, type LineageNode } from "../../data/lineage";
import styles from "./LineageMap.module.css";

type Node = LineageNode & {
  _id: string;
  _parent: Node | null;
  _leaves: number;
  _x: number;
  _y: number;
  _dir: number; // outward direction this node sits at, so its own children fan away
};

// half-size of the dog card at the centre of the fan
const ROOT = 58;
// distance from the dog to its direct ancestors (mirrors the canvas hover-fan)
const RING1 = ROOT + 96;
// distance added at each deeper generation
const RSTEP = 128;
// the dog's first ring sweeps the same 270 degrees as the hover-fan, centred above it
const SPREAD1 = Math.PI * 1.5;
// deeper generations fan in a tighter arc out along the branch
const SPREADN = Math.PI * 0.9;
// how far the whole fan is allowed to lean to match the dog's tilt
const MAX_LEAN = 0.34;
// size of the breed image card that pops out beside a clicked circle
const CARD = 82;

function sumLeaves(n: LineageNode): number {
  const c = n.children || [];
  return c.length ? c.reduce((s, x) => s + sumLeaves(x), 0) : n.value ?? 0;
}
function radius(share: number) {
  return Math.max(21, 5 * Math.sqrt(share));
}
function lean(a: number) {
  let x = a;
  while (x > Math.PI) x -= Math.PI * 2;
  while (x < -Math.PI) x += Math.PI * 2;
  return Math.max(-MAX_LEAN, Math.min(MAX_LEAN, x));
}

export default function LineageMap({
  breed,
  onClose,
}: {
  breed: { name: string; image: string; x: number; y: number; angle: number };
  onClose: () => void;
}) {
  const [vp, setVp] = useState({ w: 1280, h: 800 });
  useEffect(() => {
    const f = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);

  const root = useMemo(() => {
    const t = getLineage(breed.name);
    if (!t) return null;
    const r = JSON.parse(JSON.stringify(t)) as Node;
    const assign = (n: Node, id: string, parent: Node | null) => {
      n._id = id;
      n._parent = parent;
      n._leaves = sumLeaves(n);
      (n.children as Node[] | undefined)?.forEach((c, i) => assign(c, `${id}.${i}`, n));
    };
    assign(r, "0", null);
    return r;
  }, [breed.name]);

  const hasTree = !!(root && root.children && root.children.length);

  // the open set is the single line currently being followed (root..node)
  const [open, setOpen] = useState<Set<string>>(() => new Set(["0"]));
  useEffect(() => setOpen(new Set(["0"])), [breed.name]);
  // the circle whose breed image is currently popped out, if any
  const [picked, setPicked] = useState<string | null>(null);
  useEffect(() => setPicked(null), [breed.name]);
  // pan offset so the whole diagram can be dragged to reveal off-screen parts
  const [pan, setPan] = useState({ x: 0, y: 0 });
  useEffect(() => setPan({ x: 0, y: 0 }), [breed.name]);
  const drag = useRef<{ id: number; sx: number; sy: number; px: number; py: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  const base = lean(breed.angle || 0);

  const shown = useMemo(() => {
    if (!root) return [] as Node[];
    const list: Node[] = [];
    root._x = breed.x;
    root._y = breed.y;
    root._dir = -Math.PI / 2 + base;
    list.push(root);
    const walk = (n: Node, depth: number) => {
      const kids = open.has(n._id) && n.children && n.children.length ? (n.children as Node[]) : null;
      if (!kids) return;
      const cnt = kids.length;
      const spread = depth === 0 ? SPREAD1 : SPREADN;
      const center = depth === 0 ? -Math.PI / 2 + base : n._dir;
      const dist = depth === 0 ? RING1 : RSTEP;
      const step = spread / Math.max(cnt, 2);
      kids.forEach((k, i) => {
        const a = center + (i - (cnt - 1) / 2) * step;
        k._x = n._x + Math.cos(a) * dist;
        k._y = n._y + Math.sin(a) * dist;
        k._dir = a;
        list.push(k);
        walk(k, depth + 1);
      });
    };
    walk(root, 0);
    return list;
  }, [root, open, breed.x, breed.y, base]);

  const follow = (n: Node) => {
    const s = new Set<string>();
    let c: Node | null = n;
    while (c) {
      s.add(c._id);
      c = c._parent;
    }
    setOpen(s);
  };

  // Drag anywhere to pan the diagram. A drag suppresses the click that would
  // otherwise close the overlay or select a circle.
  const onPanDown = (e: React.PointerEvent) => {
    suppressClick.current = false;
    drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y, moved: false };
  };
  const onPanMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) > 6) d.moved = true;
    if (d.moved) setPan({ x: d.px + dx, y: d.py + dy });
  };
  const onPanUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d && d.moved) suppressClick.current = true;
  };
  const closeIfTap = () => {
    if (suppressClick.current) { suppressClick.current = false; return; }
    onClose();
  };

  const tagW = breed.name.length * 9.5 + 28;
  const clip = "lm-clip-root";

  // only show the pop-out while its circle is actually on screen and has art
  const pickedNode = picked ? shown.find((n) => n._id === picked && n._parent && n.img) || null : null;

  // the dog card, drawn at a given point, leaning to match the pile angle
  const rootCard = (cx: number, cy: number) => (
    <>
      <g
        className={styles.rootHit}
        transform={`translate(${cx},${cy}) rotate(${(base * 180) / Math.PI})`}
        onClick={(e) => e.stopPropagation()}
      >
        <clipPath id={clip}>
          <rect x={-ROOT} y={-ROOT} width={ROOT * 2} height={ROOT * 2} rx={20} />
        </clipPath>
        <rect x={-ROOT - 5} y={-ROOT - 5} width={ROOT * 2 + 10} height={ROOT * 2 + 10} rx={24} className={styles.rootCard} />
        {breed.image ? (
          <image
            href={breed.image}
            x={-ROOT}
            y={-ROOT}
            width={ROOT * 2}
            height={ROOT * 2}
            clipPath={`url(#${clip})`}
            preserveAspectRatio="xMidYMid slice"
          />
        ) : null}
      </g>
      <g className={styles.rootHit} transform={`translate(${cx},${cy + ROOT + 26})`} onClick={(e) => e.stopPropagation()}>
        <rect className={styles.tag} x={-tagW / 2} y={-16} width={tagW} height={32} rx={16} />
        <text className={styles.tagText} textAnchor="middle" dominantBaseline="central">
          {breed.name}
        </text>
      </g>
    </>
  );

  return (
    <div
      className={styles.overlay}
      onClick={closeIfTap}
      onPointerDown={onPanDown}
      onPointerMove={onPanMove}
      onPointerUp={onPanUp}
      onPointerCancel={onPanUp}
    >
      <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
        &times;
      </button>
      <svg className={styles.svg} viewBox={`${-pan.x} ${-pan.y} ${vp.w} ${vp.h}`} width={vp.w} height={vp.h} xmlns="http://www.w3.org/2000/svg">
        {hasTree ? (
          <>
            {shown
              .filter((n) => n._parent)
              .map((n) => {
                const p = n._parent as Node;
                return (
                  <line
                    key={`e${n._id}`}
                    className={`${styles.edge} ${open.has(n._id) ? styles.lit : ""}`.trim()}
                    x1={p._x}
                    y1={p._y}
                    x2={n._x}
                    y2={n._y}
                  />
                );
              })}
            {shown
              .filter((n) => n._parent)
              .map((n) => {
                const hasKids = !!(n.children && n.children.length);
                const isOpen = open.has(n._id) && hasKids;
                const share = Math.round((n._leaves / (n._parent as Node)._leaves) * 100);
                const r = radius(share);
                return (
                  <g
                    key={n._id}
                    className={styles.node}
                    transform={`translate(${n._x},${n._y})`}
                    onMouseEnter={() => { if (!drag.current?.moved) follow(n); }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (suppressClick.current) { suppressClick.current = false; return; }
                      follow(n);
                      setPicked((cur) => (cur === n._id ? null : n._id));
                    }}
                  >
                    <circle className={`${styles.disc} ${hasKids && !isOpen ? styles.has : ""}`.trim()} r={r} />
                    <text className={styles.pct} textAnchor="middle" dominantBaseline="central" fontSize={Math.max(13, r * 0.5)}>
                      {share}%
                    </text>
                    <text className={styles.nm} textAnchor="middle" y={-r - 9}>
                      {n.name}
                    </text>
                    {hasKids && !isOpen ? (
                      <text className={styles.plus} textAnchor="middle" y={r + 15}>
                        + {n.children!.length} inside
                      </text>
                    ) : null}
                  </g>
                );
              })}
            {pickedNode
              ? (() => {
                  const share = Math.round((pickedNode._leaves / (pickedNode._parent as Node)._leaves) * 100);
                  const r = radius(share);
                  const d = r + 10 + CARD / 2;
                  const cx = pickedNode._x + Math.cos(pickedNode._dir) * d;
                  const cy = pickedNode._y + Math.sin(pickedNode._dir) * d;
                  const ex = pickedNode._x + Math.cos(pickedNode._dir) * r;
                  const ey = pickedNode._y + Math.sin(pickedNode._dir) * r;
                  return (
                    <g className={styles.rootHit} onClick={(e) => e.stopPropagation()}>
                      <line className={`${styles.edge} ${styles.lit}`} x1={ex} y1={ey} x2={cx} y2={cy} />
                      <clipPath id="lm-pick-clip">
                        <rect x={cx - CARD / 2} y={cy - CARD / 2} width={CARD} height={CARD} rx={15} />
                      </clipPath>
                      <rect
                        x={cx - CARD / 2 - 4}
                        y={cy - CARD / 2 - 4}
                        width={CARD + 8}
                        height={CARD + 8}
                        rx={19}
                        className={styles.pickCard}
                      />
                      <image
                        href={pickedNode.img as string}
                        x={cx - CARD / 2}
                        y={cy - CARD / 2}
                        width={CARD}
                        height={CARD}
                        clipPath="url(#lm-pick-clip)"
                        preserveAspectRatio="xMidYMid slice"
                      />
                    </g>
                  );
                })()
              : null}
            {rootCard(breed.x, breed.y)}
          </>
        ) : (
          <>
            {rootCard(breed.x, breed.y)}
            <g transform={`translate(${breed.x},${breed.y + ROOT + 64})`}>
              <rect className={styles.tag} x={-150} y={-18} width={300} height={36} rx={12} />
              <text className={styles.tagText} textAnchor="middle" dominantBaseline="central" fontSize={13}>
                Ancestry not mapped for this one yet.
              </text>
            </g>
          </>
        )}
      </svg>
    </div>
  );
}
