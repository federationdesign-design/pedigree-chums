"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { hierarchy, pack, type HierarchyCircularNode } from "d3-hierarchy";
import { interpolateZoom } from "d3-interpolate";
import type { LineageNode } from "../../data/lineage";
import styles from "./BreedTree.module.css";

const SIZE = 760;
// A little breathing room around the focused circle so its stroke is not
// clipped against the square edge, and so siblings stay well out of frame.
const PAD = 1.4;
type Node = HierarchyCircularNode<LineageNode>;
type View = [number, number, number];

export default function BreedTree({ root, rootImage }: { root: LineageNode; rootImage?: string }) {
  const nodes = useMemo<Node[]>(() => {
    const h = hierarchy<LineageNode>(root)
      .sum((d) => d.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    return pack<LineageNode>().size([SIZE, SIZE]).padding(8)(h).descendants();
  }, [root]);

  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const circlesRef = useRef<SVGGElement>(null);
  const labelsRef = useRef<SVGGElement>(null);
  const viewRef = useRef<View>([nodes[0].x, nodes[0].y, nodes[0].r * 2 * PAD]);
  const focusRef = useRef<Node>(nodes[0]);
  const rafRef = useRef<number>(0);

  const [focus, setFocus] = useState<Node>(nodes[0]);
  const [ready, setReady] = useState(false);
  // Aspect ratio of the visible stage. The viewBox is widened to match it so
  // the diagram uses the whole available canvas: the surrounding circles spread
  // out into the extra space and stay in view instead of cropping at the edges.
  const [aspect, setAspect] = useState(1);

  function nodeImg(d: Node): string | undefined {
    return d.depth === 0 ? rootImage ?? d.data.img : d.data.img;
  }
  function fillFor(d: Node): string {
    return d.depth === 0 ? "#0a3a57" : d.depth === 1 ? "#1f8fd0" : "#bfe3f7";
  }
  // Outermost visible ring (depth 1) gets a 5-unit stroke; each level deeper
  // loses one, down to a minimum of 1.
  function strokeWidthFor(d: Node): number {
    return Math.max(6 - d.depth, 1);
  }

  function zoomTo(v: View) {
    const k = SIZE / v[2];
    viewRef.current = v;
    const cg = circlesRef.current;
    const lg = labelsRef.current;
    const fr = focusRef.current.r * k; // focused circle radius in the current view
    nodes.forEach((d, i) => {
      const tx = (d.x - v[0]) * k;
      const ty = (d.y - v[1]) * k;
      const c = cg?.children[i] as SVGCircleElement | undefined;
      if (c) {
        c.setAttribute("transform", `translate(${tx},${ty})`);
        c.setAttribute("r", String(d.r * k));
      }
      const l = lg?.children[i] as SVGTextElement | undefined;
      if (l) {
        // Park the label just outside the focused circle, pushed out along the
        // line from the centre to this node, so it never sits on any circle.
        const dist = Math.hypot(tx, ty) || 1;
        const rad = fr + 58;
        const lx = (tx / dist) * rad;
        const ly = (ty / dist) * rad;
        l.setAttribute("transform", `translate(${lx},${ly})`);
      }
    });
  }

  function zoom(d: Node) {
    focusRef.current = d;
    setFocus(d);
    const target: View = [d.x, d.y, d.r * 2 * PAD];
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    cancelAnimationFrame(rafRef.current);
    if (reduce) {
      zoomTo(target);
      return;
    }
    const interp = interpolateZoom(viewRef.current, target);
    const dur = 720;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      zoomTo(interp(t) as View);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }

  function onCircle(e: React.MouseEvent, d: Node) {
    e.stopPropagation();
    if (focusRef.current !== d) zoom(d);
    else if (d.parent) zoom(d.parent);
  }
  function onBackground() {
    if (focusRef.current !== nodes[0]) zoom(nodes[0]);
  }

  useEffect(() => {
    zoomTo([nodes[0].x, nodes[0].y, nodes[0].r * 2 * PAD]);
    focusRef.current = nodes[0];
    setFocus(nodes[0]);
    setReady(true);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes]);

  // Track the stage's real aspect ratio. This also catches the fullscreen
  // toggle (done via a class), so the canvas re-widens when it takes over the
  // screen and narrows back when it returns to the pop-up column.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) setAspect(w / h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Widen (or heighten) the viewBox to the stage's aspect so the focused circle
  // still fits the short side while the long side gains room for siblings.
  const vbW = aspect >= 1 ? SIZE * aspect : SIZE;
  const vbH = aspect >= 1 ? SIZE : SIZE / aspect;
  const viewBox = `${-vbW / 2} ${-SIZE / 2} ${vbW} ${vbH}`;

  const trail = focus.ancestors().reverse();
  const share = focus.parent ? Math.round((focus.value ?? 0) / (focus.parent.value || 1) * 100) : null;

  return (
    <div className={styles.tree} ref={wrapRef}>
      <div className={styles.crumbs}>
        {trail.map((n, i) => (
          <span key={i}>
            {i > 0 && <span className={styles.sep}>&rsaquo;</span>}
            <button
              className={n === focus ? styles.crumbCur : styles.crumb}
              onClick={() => zoom(n)}
            >
              {n.data.name}
            </button>
          </span>
        ))}
      </div>

      <div className={styles.stage} ref={stageRef}>
        <svg
          viewBox={viewBox}
          onClick={onBackground}
          style={{ opacity: ready ? 1 : 0 }}
        >
          <defs>
            {nodes.map((d, i) =>
              nodeImg(d) ? (
                <pattern key={i} id={`bt-img-${i}`} patternContentUnits="objectBoundingBox" width="1" height="1">
                  <image href={encodeURI(nodeImg(d) as string)} width="1" height="1" preserveAspectRatio="xMidYMid slice" />
                </pattern>
              ) : null
            )}
          </defs>

          <g ref={circlesRef}>
            {nodes.map((d, i) => {
              // The outer breed circle (root) is hidden so only the ancestor
              // circles inside it show. It stays in the DOM (rendered invisible
              // and non-interactive) so the index alignment used by zoomTo holds.
              const hidden = d.depth === 0;
              return (
                <circle
                  key={i}
                  fill={hidden ? "none" : nodeImg(d) ? `url(#bt-img-${i})` : fillFor(d)}
                  stroke={hidden ? "none" : "#ffd23e"}
                  strokeWidth={hidden ? 0 : strokeWidthFor(d)}
                  style={{
                    cursor: hidden ? "default" : "pointer",
                    pointerEvents: hidden ? "none" : "auto",
                  }}
                  onClick={(e) => onCircle(e, d)}
                />
              );
            })}
          </g>

          <g ref={labelsRef} textAnchor="middle" style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}>
            {nodes.map((d, i) => {
              const visible = d.parent === focus;
              const pct = d.parent ? Math.round((d.value ?? 0) / (d.parent.value || 1) * 100) : null;
              return (
                <text
                  key={i}
                  style={{
                    display: visible ? "inline" : "none",
                    fillOpacity: visible ? 1 : 0,
                    fill: "#ffffff",
                    pointerEvents: "none",
                  }}
                >
                  <tspan x={0} dy={-30} style={{ fontWeight: 800, fontSize: "15px" }}>
                    {d.data.name}
                  </tspan>
                  <tspan x={0} dy={46} style={{ fontWeight: 800, fontSize: "60px" }}>
                    {pct !== null ? `${pct}%` : ""}
                  </tspan>
                  <tspan x={0} dy={18} style={{ fontWeight: 700, fontSize: "12px", opacity: 0.85 }}>
                    {pct !== null ? "of the mix" : ""}
                  </tspan>
                </text>
              );
            })}
          </g>
        </svg>
      </div>

      <div className={styles.caption}>
        <span className={styles.cName}>{focus.data.name}</span>
        {share !== null && focus.parent && (
          <span className={styles.cShare}>
            {share}% of {focus.parent.data.name}
          </span>
        )}
        <p className={styles.cNote}>
          {focus.data.note}
          {focus.children ? " Tap a circle inside to keep digging." : ""}
        </p>
      </div>
    </div>
  );
}
