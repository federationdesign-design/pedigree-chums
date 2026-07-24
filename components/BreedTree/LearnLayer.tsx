"use client";

import { useMemo, useRef, useState } from "react";
import type { HierarchyCircularNode } from "d3-hierarchy";
import type { LineageNode } from "../../data/lineage";
import { bust } from "../../data/imgVersion";
import css from "./LearnLayer.module.css";

type Node = HierarchyCircularNode<LineageNode>;

/* The learn layer: a fallen circle lifted out of the pit onto its own layer.
   Its nested circles (the breed's make-up) sprout out as connected nodes,
   one generation per press of the blue Learn button, exactly like the main
   pit's lineage map but inverted. Dotted circular frames wait on the left;
   dragging a node into its own frame scores, a wrong frame head-shakes. */

export default function LearnLayer({
  root,
  rootPos,
  onScore,
  onClose,
}: {
  root: Node;
  rootPos?: { x: number; y: number } | null;
  onScore?: (v: number) => void;
  onClose: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // every breed inside this circle, breadth-first: these are the frames
  const allDescendants = useMemo(() => {
    const out: Node[] = [];
    const q: Node[] = [...(root.children ?? [])];
    while (q.length) {
      const n = q.shift() as Node;
      out.push(n);
      for (const ch of n.children ?? []) q.push(ch);
    }
    return out;
  }, [root]);

  const [shown, setShown] = useState<Node[]>([]); // revealed nodes, in reveal order
  const [revealed, setRevealed] = useState<Set<Node>>(new Set());
  const [placed, setPlaced] = useState<Map<Node, number>>(new Map());
  const [drag, setDrag] = useState<{ node: Node; x: number; y: number } | null>(null);
  const [shakeFrame, setShakeFrame] = useState<number | null>(null);
  const [burstFrame, setBurstFrame] = useState<number | null>(null);

  // how many Learn presses remain: every visible-or-root node with children
  // still unrevealed is one press, like the pit's counter
  const revealables = useMemo(() => {
    const vis = [root, ...shown];
    return vis.filter((n) => (n.children?.length ?? 0) > 0 && !revealed.has(n));
  }, [root, shown, revealed]);

  const revealStep = () => {
    const next = revealables[0];
    if (!next) return;
    setRevealed((r) => new Set(r).add(next));
    setShown((sh) => [...sh, ...(next.children ?? []).filter((c) => !sh.includes(c))]);
  };

  // tree layout: root centre-top, each generation a row beneath it
  const positions = useMemo(() => {
    const pos = new Map<Node, { x: number; y: number }>();
    // The lifted circle stays exactly where it was in the pit; the tree of
    // children builds around that anchor. Fallback keeps the old stage spot.
    const rx = rootPos ? Math.max(24, Math.min(92, rootPos.x)) : 62;
    const ry = rootPos ? Math.max(12, Math.min(60, rootPos.y)) : 24;
    pos.set(root, { x: rootPos?.x ?? rx, y: rootPos?.y ?? ry });
    const byLevel = new Map<number, Node[]>();
    for (const n of shown) {
      if (placed.has(n)) continue;
      const lvl = n.depth - root.depth;
      byLevel.set(lvl, [...(byLevel.get(lvl) ?? []), n]);
    }
    const anchor = pos.get(root) as { x: number; y: number };
    for (const [lvl, row] of byLevel) {
      const y = Math.min(60, anchor.y) + lvl * 21;
      row.forEach((n, i) => {
        const x = Math.max(24, Math.min(92, anchor.x)) + (i - (row.length - 1) / 2) * Math.min(20, 64 / Math.max(row.length, 1));
        pos.set(n, { x: Math.max(34, Math.min(92, x)), y: Math.min(88, y) });
      });
    }
    return pos;
  }, [root, shown, placed, rootPos]);

  const startNodeDrag = (e: React.PointerEvent, node: Node) => {
    e.stopPropagation();
    e.preventDefault();
    const wrap = wrapRef.current;
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    const toLocal = (cx: number, cy: number) => ({ x: cx - r.left, y: cy - r.top });
    const p0 = toLocal(e.clientX, e.clientY);
    setDrag({ node, x: p0.x, y: p0.y });
    const move = (ev: PointerEvent) => {
      const p = toLocal(ev.clientX, ev.clientY);
      setDrag({ node, x: p.x, y: p.y });
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setDrag(null);
      // frame hit test in client coords
      const myIdx = allDescendants.indexOf(node);
      for (const [idx, el] of frameRefs.current) {
        const fr = el.getBoundingClientRect();
        const cx = fr.left + fr.width / 2, cy = fr.top + fr.height / 2;
        if (Math.hypot(ev.clientX - cx, ev.clientY - cy) < fr.width * 0.7) {
          if (idx === myIdx && !placed.has(node)) {
            setPlaced((m) => new Map(m).set(node, idx));
            setBurstFrame(idx);
            window.setTimeout(() => setBurstFrame((b) => (b === idx ? null : b)), 600);
            onScore?.(100);
          } else {
            setShakeFrame(idx);
            window.setTimeout(() => setShakeFrame((sf) => (sf === idx ? null : sf)), 450);
          }
          return;
        }
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const nodeImgSrc = (n: Node) => (n.data.img ? bust(n.data.img) : null);
  const framesDone = placed.size === allDescendants.length && allDescendants.length > 0;

  return (
    <div className={css.layer} ref={wrapRef} onClick={onClose}>
      {/* connectors */}
      <svg className={css.wires} aria-hidden="true">
        {[root, ...shown].map((n, i) => {
          if (placed.has(n)) return null;
          const p = n === root ? null : n.parent;
          if (!p || placed.has(p)) return null;
          const a = positions.get(p), b = positions.get(n);
          if (!a || !b) return null;
          return <line key={i} x1={`${a.x}%`} y1={`${a.y}%`} x2={`${b.x}%`} y2={`${b.y}%`} />;
        })}
      </svg>

      {/* the lifted circle, modestly enlarged */}
      <div
        className={css.rootCircle}
        style={{ left: `${positions.get(root)?.x}%`, top: `${positions.get(root)?.y}%` }}
        onClick={(e) => e.stopPropagation()}
      >
        {nodeImgSrc(root) ? <img src={nodeImgSrc(root) as string} alt={root.data.name} /> : <span>{root.data.name}</span>}
      </div>
      <div className={css.rootName} style={{ left: `${positions.get(root)?.x}%`, top: `calc(${positions.get(root)?.y}% + 84px)` }}>
        {root.data.name}
      </div>

      {/* revealed child nodes */}
      {shown.map((n, i) => {
        if (placed.has(n)) return null;
        const p = drag?.node === n ? null : positions.get(n);
        const x = drag?.node === n ? drag.x : undefined;
        return (
          <div
            key={i}
            className={`${css.node}${drag?.node === n ? " " + css.nodeDragging : ""}`}
            style={
              drag?.node === n
                ? { left: x, top: drag?.y, transform: "translate(-50%, -50%) scale(1.06)" }
                : { left: `${p?.x}%`, top: `${p?.y}%` }
            }
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => startNodeDrag(e, n)}
          >
            {nodeImgSrc(n) ? <img src={nodeImgSrc(n) as string} alt={n.data.name} draggable={false} /> : <span>{n.data.name}</span>}
          </div>
        );
      })}

      {/* Learn button with remaining-press counter, pit style */}
      <div className={css.controls} style={{ left: `${Math.max(24, Math.min(92, rootPos?.x ?? 62))}%` }} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={css.learn} onClick={revealStep} disabled={revealables.length === 0}>
          Learn
          {revealables.length > 0 && <span className={css.learnCount}>{revealables.length}</span>}
        </button>
        {framesDone && <span className={css.doneNote}>All found!</span>}
      </div>

      {/* dotted circular frames, left column */}
      <div className={css.frames} onClick={(e) => e.stopPropagation()}>
        {allDescendants.map((n, idx) => {
          const isTarget = drag && allDescendants.indexOf(drag.node) === idx;
          const filledBy = [...placed.entries()].find(([, fi]) => fi === idx)?.[0] ?? null;
          const known = shown.includes(n) || !!filledBy;
          return (
            <div
              key={idx}
              ref={(el) => { if (el) frameRefs.current.set(idx, el); else frameRefs.current.delete(idx); }}
              className={[
                css.frame,
                isTarget ? css.frameLit : "",
                shakeFrame === idx ? css.frameShake : "",
                filledBy ? css.frameFilled : "",
              ].join(" ").trim()}
            >
              {filledBy && nodeImgSrc(filledBy) && <img src={nodeImgSrc(filledBy) as string} alt={filledBy.data.name} draggable={false} />}
              {isTarget && !filledBy && known && <span className={css.frameName}>{n.data.name}</span>}
              {burstFrame === idx && <span className={css.plus}>+100</span>}
            </div>
          );
        })}
      </div>

      {/* tap anywhere off the layer content to drop the circle back in */}
    </div>
  );
}
