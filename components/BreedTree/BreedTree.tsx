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
// How far right of centre the diagram sits, as a fraction of the canvas width,
// so it clears the text column on the left.
const SHIFT = 0.66;
type Node = HierarchyCircularNode<LineageNode>;
type View = [number, number, number];

// Classic bounce easing for the drop-in entrance: overshoots slightly and
// settles, so circles land with a little bounce rather than a dead stop.
function easeOutBounce(x: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (x < 1 / d1) return n1 * x * x;
  if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
  if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
  return n1 * (x -= 2.625 / d1) * x + 0.984375;
}

// On mobile the packed circles sit side by side and stay small. We re-lay the
// top-level circles into a tall-screen arrangement (2 stacked, 3 a triangle, 4 a
// grid) and scale each subtree to match, so they load far bigger and easier to
// read. Counts above 4 keep the packed layout.
function relayoutMobile(nodes: Node[]) {
  const root = nodes[0];
  const kids = root.children ?? [];
  const n = kids.length;
  if (n < 1 || n > 4) return;
  const FW = SIZE;
  const FH = SIZE / 0.7; // designed for a portrait stage; labels clamp if it differs
  const GAP = 44;
  const LAB = 110; // room kept beyond a circle for its label
  let slots: { x: number; y: number; r: number }[];
  if (n === 1) {
    const r = Math.min(FW * 0.46, (FH - 2 * LAB) / 2);
    slots = [{ x: 0, y: 0, r }];
  } else if (n === 2) {
    const r = Math.min(FW * 0.46, (FH - GAP - 2 * LAB) / 4);
    const d = r + GAP / 2;
    slots = [{ x: 0, y: -d, r }, { x: 0, y: d, r }];
  } else if (n === 3) {
    const r = Math.min((FW - GAP) / 4, (FH - 2 * LAB - GAP) / 4);
    const dx = r + GAP / 2;
    slots = [{ x: 0, y: -(r + LAB * 0.4), r }, { x: -dx, y: r + GAP / 2, r }, { x: dx, y: r + GAP / 2, r }];
  } else {
    const r = Math.min((FW - GAP) / 4, (FH - GAP - 2 * LAB) / 4);
    const dx = r + GAP / 2;
    const dy = r + GAP / 2 + LAB * 0.3;
    slots = [{ x: -dx, y: -dy, r }, { x: dx, y: -dy, r }, { x: -dx, y: dy, r }, { x: dx, y: dy, r }];
  }
  kids.forEach((kid, i) => {
    const slot = slots[i];
    const s = slot.r / kid.r;
    const ox = kid.x, oy = kid.y;
    kid.descendants().forEach((d) => {
      d.x = slot.x + (d.x - ox) * s;
      d.y = slot.y + (d.y - oy) * s;
      d.r = d.r * s;
    });
  });
  root.x = 0;
  root.y = 0;
  root.r = FW / (2 * PAD);
}

export default function BreedTree({
  root,
  rootImage,
  onActiveChange,
  onClose,
}: {
  root: LineageNode;
  rootImage?: string;
  onActiveChange?: (active: boolean) => void;
  onClose?: () => void;
}) {
  const [isMobile, setIsMobile] = useState(false);
  const nodes = useMemo<Node[]>(() => {
    const h = hierarchy<LineageNode>(root)
      .sum((d) => d.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    const ns = pack<LineageNode>().size([SIZE, SIZE]).padding(8)(h).descendants();
    if (isMobile) relayoutMobile(ns);
    return ns;
  }, [root, isMobile]);

  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const circlesRef = useRef<SVGGElement>(null);
  const labelsRef = useRef<SVGGElement>(null);
  const viewRef = useRef<View>([nodes[0].x, nodes[0].y, nodes[0].r * 2 * PAD]);
  const focusRef = useRef<Node>(nodes[0]);
  const rafRef = useRef<number>(0);

  const [focus, setFocus] = useState<Node>(nodes[0]);
  const [hovered, setHovered] = useState<Node | null>(null);
  const [entered, setEntered] = useState(false);
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
  // Thinner stroke the deeper (smaller) the circle, so the ring never
  // overpowers a tiny image several levels down: 3, 2, 1, then finer still.
  function strokeWidthFor(d: Node): number {
    const widths = [3, 2, 1, 0.6, 0.4];
    return widths[d.depth - 1] ?? 0.4;
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
      if (l) {
        if (d === focusRef.current) {
          // The focused circle's own label sits at its centre.
          l.setAttribute("transform", "translate(0,0)");
        } else {
          // Child labels sit above or below their circle (never to the side, so
          // they do not run off the narrow horizontal edges), centred on the
          // circle and clamped to stay inside the canvas.
          const childR = d.r * k;
          const vbWl = aspect >= 1 ? SIZE * aspect : SIZE;
          const vbHl = aspect >= 1 ? SIZE : SIZE / aspect;
          const xMinl = aspect >= 1 ? -vbWl * SHIFT : -vbWl / 2;
          const margin = 120;
          const lx = Math.max(xMinl + margin, Math.min(xMinl + vbWl - margin, tx));
          // sit the label clear of the circle (was tight enough to touch), and
          // keep the whole label inside the canvas top and bottom
          let ly = ty < 0 ? ty - childR - 70 : ty + childR + 70;
          ly = Math.max(-vbHl / 2 + 60, Math.min(vbHl / 2 - 110, ly));
          l.setAttribute("transform", `translate(${lx},${ly})`);
        }
      }
    });
  }

  function zoom(d: Node) {
    focusRef.current = d;
    setFocus(d);
    onActiveChange?.(d !== nodes[0]);
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
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const st = stageRef.current;
    if (st && !reduce) {
      st.classList.remove(styles.shake);
      void st.offsetWidth; // force reflow so the animation can retrigger
      st.classList.add(styles.shake);
    }
    if (focusRef.current !== d) zoom(d);
    else if (d.parent) zoom(d.parent);
  }
  function onBackground() {
    if (focusRef.current !== nodes[0]) zoom(nodes[0]);
    else onClose?.();
  }

  useEffect(() => {
    focusRef.current = nodes[0];
    setFocus(nodes[0]);
    setReady(true);

    const v: View = [nodes[0].x, nodes[0].y, nodes[0].r * 2 * PAD];
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      zoomTo(v);
      setEntered(true);
      return () => cancelAnimationFrame(rafRef.current);
    }

    // Drop-in entrance: every circle starts above the canvas and falls into its
    // packed position with a small bounce, staggered by index so the larger
    // outer circles land first and the nested ones drop in just after. Labels
    // stay hidden until everything has settled.
    setEntered(false);
    const cg = circlesRef.current;
    const k = SIZE / v[2];
    const dropFrom = SIZE * 1.3;
    const dur = 700;
    const stagger = 45;
    const total = dur + stagger * Math.max(0, nodes.length - 1);
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      nodes.forEach((d, i) => {
        const c = cg?.children[i] as SVGCircleElement | undefined;
        if (!c) return;
        const tx = (d.x - v[0]) * k;
        const ty = (d.y - v[1]) * k;
        const lt = Math.max(0, Math.min(1, (elapsed - i * stagger) / dur));
        const drop = (1 - easeOutBounce(lt)) * dropFrom;
        c.setAttribute("transform", `translate(${tx},${ty - drop})`);
        c.setAttribute("r", String(d.r * k));
      });
      if (elapsed < total) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        zoomTo(v);
        setEntered(true);
      }
    };
    rafRef.current = requestAnimationFrame(step);

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

  // Track the mobile breakpoint so the top-level circles can be re-laid out big.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Widen (or heighten) the viewBox to the stage's aspect so the focused circle
  // still fits the short side while the long side gains room for siblings. On a
  // wide canvas we also push the origin rightwards so the diagram sits on the
  // right of the pop-up, clear of the text column, rather than dead centre.
  const vbW = aspect >= 1 ? SIZE * aspect : SIZE;
  const vbH = aspect >= 1 ? SIZE : SIZE / aspect;
  const xMin = aspect >= 1 ? -vbW * SHIFT : -vbW / 2;
  const viewBox = `${xMin} ${-vbH / 2} ${vbW} ${vbH}`;

  const trail = focus.ancestors().reverse();
  // The caption follows the hovered circle when there is one, so you can read a
  // breed's note just by pointing at it, and falls back to the focused circle.
  const shown = hovered ?? focus;
  const shownShare = shown.parent
    ? Math.round(((shown.value ?? 0) / (shown.parent.value || 1)) * 100)
    : null;
  // While a circle is hovered, hide the circles nested inside it so its own
  // image comes clear to the front instead of being covered by its progenitors.
  // Moving onto one of those inner circles re-hovers it and brings it back.
  const buriedSet = hovered ? new Set(hovered.descendants()) : null;

  return (
    <div className={styles.tree} ref={wrapRef}>
      <div className={styles.stage} ref={stageRef}>
        <svg
          viewBox={viewBox}
          onClick={onBackground}
          style={{ opacity: ready ? 1 : 0 }}
        >
          <defs>
            {/* Per-level duotone tints. feColorMatrix flattens the image to
                brightness (a luminance-preserving greyscale), then
                feComponentTransfer maps that brightness onto a two-colour ramp,
                so each tinted ring keeps its tones but reads as a single hue. */}
            <filter id="bt-tint-a" colorInterpolationFilters="sRGB">
              <feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0" />
              <feComponentTransfer>
                <feFuncR type="table" tableValues="0.05 0.72" />
                <feFuncG type="table" tableValues="0.22 0.86" />
                <feFuncB type="table" tableValues="0.40 0.98" />
              </feComponentTransfer>
            </filter>
            <filter id="bt-tint-b" colorInterpolationFilters="sRGB">
              <feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0" />
              <feComponentTransfer>
                <feFuncR type="table" tableValues="0.24 0.98" />
                <feFuncG type="table" tableValues="0.15 0.82" />
                <feFuncB type="table" tableValues="0.03 0.42" />
              </feComponentTransfer>
            </filter>
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
              const hasImg = !hidden && !!nodeImg(d);
              // The larger "bottom" image in each circle stays full colour and
              // the images nested on top of it are tinted, alternating inward.
              // The root (depth 0) is hidden, so depth 1 is the first visible
              // ring and stays full colour; depth 2 is the first tinted ring.
              const tinted = hasImg && d.depth % 2 === 0;
              const tintClass = tinted
                ? Math.floor((d.depth - 2) / 2) % 2 === 0
                  ? styles.tintA
                  : styles.tintB
                : "";
              const cls = hasImg ? `${styles.imgCircle} ${tintClass}`.trim() : undefined;
              const buried = !!buriedSet && d !== hovered && buriedSet.has(d);
              return (
                <circle
                  key={i}
                  className={cls}
                  fill={hidden ? "none" : nodeImg(d) ? `url(#bt-img-${i})` : fillFor(d)}
                  stroke={hidden ? "none" : "#ffd23e"}
                  strokeWidth={hidden ? 0 : strokeWidthFor(d)}
                  style={{
                    cursor: hidden ? "default" : "pointer",
                    pointerEvents: hidden ? "none" : "auto",
                    opacity: buried ? 0 : undefined,
                  }}
                  onMouseEnter={hidden ? undefined : () => setHovered(d)}
                  onMouseLeave={hidden ? undefined : () => setHovered((h) => (h === d ? null : h))}
                  onClick={(e) => onCircle(e, d)}
                />
              );
            })}
          </g>

          <g ref={labelsRef} textAnchor="middle" style={{ fontFamily: "var(--font-body), system-ui, sans-serif", opacity: entered ? 1 : 0, transition: "opacity 0.3s ease" }}>
            {nodes.map((d, i) => {
              const isChild = d.parent === focus;
              // When zoomed right into a single circle that has nothing inside
              // it, show that circle's own share centred within it.
              const isLeafFocus = d === focus && !!d.parent && !d.children;
              const visible = isChild || isLeafFocus;
              const pct = d.parent ? Math.round((d.value ?? 0) / (d.parent.value || 1) * 100) : null;
              return (
                <g key={i} style={{ display: visible ? "inline" : "none", pointerEvents: "none" }}>
                  {isChild && (
                    <>
                      <text x={0} y={-42} style={{ fill: "#ffffff", fontWeight: 800, fontSize: "15px" }}>
                        {d.data.name}
                      </text>
                      <line x1={-80} x2={80} y1={-22} y2={-22} stroke="#ffffff" strokeWidth={2.5} strokeOpacity={0.85} />
                    </>
                  )}
                  <text x={0} y={42} style={{ fill: "#ffffff", fontWeight: 800, fontSize: "60px" }}>
                    {pct !== null ? `${pct}%` : ""}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className={styles.aside}>
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

        <div className={styles.caption}>
          <span className={styles.cName}>{shown.data.name}</span>
          {shownShare !== null && shown.parent && (
            <span className={styles.cShare}>
              {shownShare}% of {shown.parent.data.name}
            </span>
          )}
          <p className={styles.cNote}>
            {shown.data.note}
            {shown.children ? " Tap a circle inside to keep digging." : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
