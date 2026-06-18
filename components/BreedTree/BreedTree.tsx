"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { hierarchy, pack, type HierarchyCircularNode } from "d3-hierarchy";
import { interpolateZoom } from "d3-interpolate";
import type { LineageNode } from "../../data/lineage";
import styles from "./BreedTree.module.css";

const SIZE = 760;
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
  const circlesRef = useRef<SVGGElement>(null);
  const labelsRef = useRef<SVGGElement>(null);
  const viewRef = useRef<View>([nodes[0].x, nodes[0].y, nodes[0].r * 2]);
  const focusRef = useRef<Node>(nodes[0]);
  const rafRef = useRef<number>(0);

  const [focus, setFocus] = useState<Node>(nodes[0]);
  const [ready, setReady] = useState(false);

  function nodeImg(d: Node): string | undefined {
    return d.depth === 0 ? rootImage ?? d.data.img : d.data.img;
  }
  function fillFor(d: Node): string {
    return d.depth === 0 ? "#0a3a57" : d.depth === 1 ? "#1f8fd0" : "#bfe3f7";
  }

  function zoomTo(v: View) {
    const k = SIZE / v[2];
    viewRef.current = v;
    const cg = circlesRef.current;
    const lg = labelsRef.current;
    nodes.forEach((d, i) => {
      const tx = (d.x - v[0]) * k;
      const ty = (d.y - v[1]) * k;
      const c = cg?.children[i] as SVGCircleElement | undefined;
      if (c) {
        c.setAttribute("transform", `translate(${tx},${ty})`);
        c.setAttribute("r", String(d.r * k));
      }
      const l = lg?.children[i] as SVGTextElement | undefined;
      if (l) l.setAttribute("transform", `translate(${tx},${ty})`);
    });
  }

  function zoom(d: Node) {
    focusRef.current = d;
    setFocus(d);
    const target: View = [d.x, d.y, d.r * 2];
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

  function isFullscreen() {
    return wrapRef.current?.classList.contains(styles.fullscreen) ?? false;
  }
  function onCircle(e: React.MouseEvent, d: Node) {
    e.stopPropagation();
    if (!isFullscreen()) wrapRef.current?.classList.add(styles.fullscreen);
    if (focusRef.current !== d) zoom(d);
    else if (d.parent) zoom(d.parent);
  }
  function onBackground() {
    if (isFullscreen()) zoom(nodes[0]);
  }
  function exitFullscreen() {
    wrapRef.current?.classList.remove(styles.fullscreen);
    zoom(nodes[0]);
  }

  useEffect(() => {
    zoomTo([nodes[0].x, nodes[0].y, nodes[0].r * 2]);
    focusRef.current = nodes[0];
    setFocus(nodes[0]);
    setReady(true);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes]);

  const trail = focus.ancestors().reverse();
  const share = focus.parent ? Math.round((focus.value ?? 0) / (focus.parent.value || 1) * 100) : null;

  return (
    <div className={styles.tree} ref={wrapRef}>
      <button className={styles.fsClose} onClick={exitFullscreen} aria-label="Close the family view">
        &times;
      </button>

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

      <div className={styles.stage}>
        <svg
          viewBox={`${-SIZE / 2} ${-SIZE / 2} ${SIZE} ${SIZE}`}
          onClick={onBackground}
          style={{ opacity: ready ? 1 : 0 }}
        >
          <defs>
            {nodes.map((d, i) =>
              nodeImg(d) ? (
                <pattern key={i} id={`bt-img-${i}`} patternContentUnits="objectBoundingBox" width="1" height="1">
                  <image href={nodeImg(d)} width="1" height="1" preserveAspectRatio="xMidYMid slice" />
                </pattern>
              ) : null
            )}
          </defs>

          <g ref={circlesRef}>
            {nodes.map((d, i) => (
              <circle
                key={i}
                fill={nodeImg(d) ? `url(#bt-img-${i})` : fillFor(d)}
                stroke="rgba(10,58,87,0.35)"
                strokeWidth={2}
                style={{ cursor: "pointer" }}
                onClick={(e) => onCircle(e, d)}
              />
            ))}
          </g>

          <g ref={labelsRef} textAnchor="middle" style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}>
            {nodes.map((d, i) => {
              const visible = d.parent === focus;
              return (
                <text
                  key={i}
                  style={{
                    display: visible ? "inline" : "none",
                    fillOpacity: visible ? 1 : 0,
                    fill: d.depth >= 2 ? "#0a3a57" : "#ffffff",
                    pointerEvents: "none",
                  }}
                >
                  <tspan x={0} dy="-0.1em" style={{ fontWeight: 800, fontSize: "15px" }}>
                    {d.data.name}
                  </tspan>
                  <tspan x={0} dy="1.3em" style={{ fontWeight: 700, fontSize: "12px", opacity: 0.78 }}>
                    {d.parent ? `${Math.round((d.value ?? 0) / (d.parent.value || 1) * 100)}% of the mix` : ""}
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
