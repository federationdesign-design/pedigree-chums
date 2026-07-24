"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { hierarchy, pack, packSiblings, packEnclose, type HierarchyCircularNode } from "d3-hierarchy";
import { interpolateZoom } from "d3-interpolate";
import type { LineageNode } from "../../data/lineage";
import { bust } from "../../data/imgVersion";
import { breedInfo } from "../../data/breedInfo";
import styles from "./BreedTree.module.css";
import LineageMap from "../PackPit/LineageMap";

const SIZE = 760;
// A little breathing room around the focused circle so its stroke is not
// clipped against the square edge, and so siblings stay well out of frame.
const PAD = 1.4;
// How far right of centre the diagram sits, as a fraction of the canvas width,
// so it clears the text column on the left.
const SHIFT = 0.66;
// Desktop fills the circles closer to the frame edge than the default PAD, so
// the diagram reads large beside the text column. Mobile keeps PAD (its masonry
// layout already fills the screen).
const ZOOM_PAD = 1.1;
// Breed-title placement on each circle, relative to its label anchor. TITLE_DY
// moves it up (more negative) or down toward the circle; TITLE_ANGLE tilts it
// (negative leans the text up to the right). Tweak these two to taste.
const TITLE_DY = -42;
const TITLE_ANGLE = -10;
type Node = HierarchyCircularNode<LineageNode>;

// Names over 11 characters split to two lines at the nearest word boundary,
// same rule as the pop-up title, which lets the labels run twice the size.
function splitLabel(name: string): string[] {
  if (name.length <= 11 || !name.includes(" ")) return [name];
  const words = name.split(" ");
  let first = words[0];
  let i = 1;
  while (i < words.length && (first + " " + words[i]).length <= 11) {
    first += " " + words[i];
    i++;
  }
  const rest = words.slice(i).join(" ");
  return rest ? [first, rest] : [first];
}
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
// On mobile a square packing leaves the circles small. We keep d3's organic,
// value-proportional, edge-touching arrangement (so the dominant breed reads
// large and the cluster stays connected) but rotate it so its long axis runs
// down the screen and scale it to fill the tall stage. The result is the
// masonry look: big circles nestled together, filling the portrait.
// Make every top-level ancestor circle sized by its own share, not by how its
// grafted progenitors happen to pack. d3 sizes an internal circle by enclosing
// its children, so a branch that grafts into many small circles can swell past
// a higher-share branch with fewer. We re-pack the top ring with radii
// proportional to sqrt(value) and scale each subtree to match, so the 50/30/20
// labels and the circle sizes finally agree. Runs before any mobile relayout so
// phones inherit the corrected proportions.
function normalizeTop(nodes: Node[]) {
  const root = nodes[0];
  const d1 = nodes.filter((n) => n.depth === 1);
  if (!root || d1.length < 2) return;
  const circles = d1.map((n) => ({
    x: 0,
    y: 0,
    r: Math.sqrt(Math.max(n.value ?? 0, 0.0001)),
    node: n,
  }));
  packSiblings(circles);
  const enc = packEnclose(circles);
  if (!enc || enc.r <= 0) return;
  const target = SIZE / 2 - PAD;
  const s = target / enc.r;
  for (const c of circles) {
    const nx = (c.x - enc.x) * s + SIZE / 2;
    const ny = (c.y - enc.y) * s + SIZE / 2;
    const nr = c.r * s;
    const n = c.node;
    const k = nr / n.r;
    const ox = n.x;
    const oy = n.y;
    n.descendants().forEach((d) => {
      d.x = (d.x - ox) * k + nx;
      d.y = (d.y - oy) * k + ny;
      d.r = d.r * k;
    });
  }
  root.x = SIZE / 2;
  root.y = SIZE / 2;
  root.r = target;
}

function relayoutMobile(nodes: Node[], aspect: number) {
  const root = nodes[0];
  const kids = root.children ?? [];
  const n = kids.length;
  if (n < 1) return;
  const FW = SIZE;
  const FH = SIZE / Math.min(Math.max(aspect, 0.42), 0.95);
  const ox = root.x, oy = root.y;
  const pts = nodes.map((d) => ({ d, x: d.x - ox, y: d.y - oy }));
  if (n === 1) {
    const s = Math.min(FW * 0.5, FH * 0.46) / kids[0].r;
    pts.forEach((p) => {
      p.d.x = p.x * s;
      p.d.y = p.y * s;
      p.d.r = p.d.r * s;
    });
    root.x = 0; root.y = 0; root.r = FW / (2 * PAD);
    return;
  }
  const d1 = pts.filter((p) => p.d.depth === 1);
  const w0 = Math.max(...d1.map((p) => p.x)) - Math.min(...d1.map((p) => p.x));
  const h0 = Math.max(...d1.map((p) => p.y)) - Math.min(...d1.map((p) => p.y));
  // turn a wide cluster on its side so the long axis runs down the portrait
  if (w0 > h0) pts.forEach((p) => { const t = p.x; p.x = p.y; p.y = -t; });
  const minX = Math.min(...d1.map((p) => p.x - p.d.r));
  const maxX = Math.max(...d1.map((p) => p.x + p.d.r));
  const minY = Math.min(...d1.map((p) => p.y - p.d.r));
  const maxY = Math.max(...d1.map((p) => p.y + p.d.r));
  const bw = maxX - minX, bh = maxY - minY;
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const M = 20;
  // fill the height, but cap how far circles may spill past the side edges
  const scale = Math.min((FH - M) / bh, (FW * 1.12) / bw);
  pts.forEach((p) => {
    p.d.x = (p.x - cx) * scale;
    p.d.y = (p.y - cy) * scale;
    p.d.r = p.d.r * scale;
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
  centred = false,
  size = 760,
  hideLabels = false,
  disableZoom = false,
  fill = false,
  dockAside = false,
  gravity = false,
  stroke = "#ffd23e",
  strokeByDepth = false,
  tinted = true,
  namePill = false,
  onShownChange,
  hideCaption = false,
  onCaptionClose,
  onScore,
  registerShake,
  onToggleCaption,
  onPitClose,
  rootNote,
}: {
  root: LineageNode;
  rootImage?: string;
  onActiveChange?: (active: boolean) => void;
  onClose?: () => void;
  centred?: boolean;
  size?: number;
  hideLabels?: boolean;
  disableZoom?: boolean;
  fill?: boolean;
  dockAside?: boolean;
  gravity?: boolean;
  stroke?: string;
  strokeByDepth?: boolean;
  tinted?: boolean;
  namePill?: boolean;
  onShownChange?: (name: string) => void;
  hideCaption?: boolean;
  onCaptionClose?: () => void;
  onScore?: (v: number) => void;
  registerShake?: (fn: () => void) => void;
  onToggleCaption?: () => void;
  onPitClose?: () => void;
  rootNote?: string;
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [aspect, setAspect] = useState(1);
  // Freeze the stage aspect used for the mobile layout after the first measure.
  // Drilling into a circle changes the breadcrumb/caption height, which resizes
  // the stage; if the layout tracked that, it would re-pack and replay its
  // entrance on every click. Capturing it once keeps the circles steady.
  const [layoutAspect, setLayoutAspect] = useState<number | null>(null);
  const aspectKey = isMobile ? layoutAspect ?? 0.55 : 1;
  const nodes = useMemo<Node[]>(() => {
    const h = hierarchy<LineageNode>(root)
      .sum((d) => d.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    const ns = pack<LineageNode>().size([SIZE, SIZE]).padding(8)(h).descendants();
    normalizeTop(ns);
    if (isMobile) relayoutMobile(ns, aspectKey);
    return ns;
  }, [root, isMobile, aspectKey]);

  // capture the stage aspect for the layout exactly once, on the first valid read
  useEffect(() => {
    if (isMobile && layoutAspect === null && aspect > 0.2 && aspect < 3) {
      setLayoutAspect(Math.min(Math.max(Math.round(aspect * 20) / 20, 0.42), 0.85));
    }
  }, [isMobile, aspect, layoutAspect]);

  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const circlesRef = useRef<SVGGElement>(null);
  const labelsRef = useRef<SVGGElement>(null);
  const isMobileRef = useRef(false);
  isMobileRef.current = isMobile;
  const viewRef = useRef<View>([nodes[0].x, nodes[0].y, nodes[0].r * 2 * (isMobile ? PAD : ZOOM_PAD)]);
  const focusRef = useRef<Node>(nodes[0]);
  const rafRef = useRef<number>(0);

  const [focus, setFocus] = useState<Node>(nodes[0]);
  const [hovered, setHovered] = useState<Node | null>(null);
  const [entered, setEntered] = useState(false);
  const [falling, setFalling] = useState(false);
  const [dropped, setDropped] = useState(false);
  const [badgePcts, setBadgePcts] = useState<number[]>([]);
  const [learnNode, setLearnNode] = useState<Node | null>(null);
  const [learnCard, setLearnCard] = useState<{ name: string; image: string; x: number; y: number; angle: number } | null>(null);
  const removedNodesRef = useRef<Set<Node>>(new Set());
  const spawnBadgeRef = useRef<((x: number, y: number, r: number, pct: number) => void) | null>(null);
  const [inertBadges, setInertBadges] = useState<Set<number>>(new Set());
  const pitBodiesRef = useRef<{ find: (n: Node) => { x: number; y: number; vx: number; vy: number; held?: boolean } | undefined; owned: Set<Node> } | null>(null);
  const runFallRef = useRef<(() => void) | null>(null);
  const shakeInnerRef = useRef<(() => void) | null>(null);
  const fellRef = useRef(false);
  const fallRafRef = useRef(0);
  type BadgeBody = { x: number; y: number; vx: number; vy: number; r: number; pct: number; idx: number };
  const badgeBodiesRef = useRef<BadgeBody[] | null>(null);
  const badgesRef = useRef<SVGGElement>(null);
  const fxRef = useRef<SVGGElement>(null);
  // The name pill: light-blue capsule at the foot of the pit showing the
  // hovered/focused breed. Sticky (static) until one falling body hits it,
  // then it drops and joins the pile. L/pr are view units; x/y world units.
  type PillBody = { x: number; y: number; vx: number; vy: number; L: number; pr: number; stuck: boolean };
  const pillRef = useRef<SVGGElement>(null);
  const pillBodyRef = useRef<PillBody | null>(null);
  // Drag support: badges and the name pill can be picked up and flung, like
  // objects in the main pit. Circles stay click-to-zoom only. The sim exposes
  // a wake() so a drag can restart physics after everything has settled.
  const wakeRef = useRef<(() => void) | null>(null);
  const simRunningRef = useRef(false);
  // In-pit UI objects (pit-menu style): the close X and the description
  // toggle are navy rounded squares that start fixed in the corner, sink and
  // tilt a notch on every knock, give way on the fifth, then tumble like
  // anything else. A tap always works, wherever they are.
  type UiBody = { x: number; y: number; vx: number; vy: number; r: number; half: number; a: number; va: number; fixed: boolean; hits: number; kind: "close" | "desc" };
  const uiBodiesRef = useRef<UiBody[] | null>(null);
  const uiCloseRef = useRef<SVGGElement>(null);
  const uiDescRef = useRef<SVGGElement>(null);
  const pressRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const dragRef = useRef<{
    body: { x: number; y: number; vx: number; vy: number };
    dx: number; dy: number; lx: number; ly: number; lt: number;
  } | null>(null);

  const svgPointToWorld = (e: { clientX: number; clientY: number; currentTarget: any }) => {
    const svg: SVGSVGElement | null = (e.currentTarget as SVGGElement).ownerSVGElement;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const sp = pt.matrixTransform(ctm.inverse());
    const v = viewRef.current;
    const k = SIZE / v[2];
    return { x: v[0] + sp.x / k, y: v[1] + sp.y / k };
  };

  // The main pit keeps its physics floor at the very bottom of the container
  // with the grass graphic layered behind the objects, so nothing hovers.
  // Same here: no reserved height, objects rest on the container's bottom edge.
  const floorReserveVU = () => 0;

  const clampRootView = (v: View): View => {
    if (!dockAside) return v;
    const st = stageRef.current;
    if (!st) return v;
    const asp = st.clientWidth / Math.max(st.clientHeight, 1);
    const vbHf = asp >= 1 ? SIZE : SIZE / asp;
    const k = SIZE / v[2];
    const root = nodes[0];
    const bottomView = (root.y + root.r - v[1]) * k;
    const maxBottom = vbHf / 2 - floorReserveVU() - 8;
    if (bottomView > maxBottom) return [v[0], v[1] + (bottomView - maxBottom) / k, v[2]];
    return v;
  };

  const startDrag = (e: React.PointerEvent, body: { x: number; y: number; vx: number; vy: number } | null | undefined, onTap?: () => void) => {
    if (!body) {
      // fixed or pre-drop objects: a press is simply a tap
      if (onTap) { e.stopPropagation(); onTap(); }
      return;
    }
    e.stopPropagation();
    e.preventDefault(); // stop the browser starting a text-selection drag on SVG text
    pressRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    // capture the svg NOW: React nulls e.currentTarget after this handler
    // returns, so the move closure must never touch the event again
    const svgEl = (e.currentTarget as SVGGElement).ownerSVGElement;
    if (!svgEl) return;
    const w = svgPointToWorld(e);
    if (!w) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { body, dx: body.x - w.x, dy: body.y - w.y, lx: w.x, ly: w.y, lt: performance.now() };
    body.vx = 0; body.vy = 0;
    const pb = pillBodyRef.current;
    if (pb && (body as unknown) === (pb as unknown)) pb.stuck = false; // picking it up knocks it loose
    wakeRef.current?.();
    const move = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const pt = svgEl.createSVGPoint();
      pt.x = ev.clientX; pt.y = ev.clientY;
      const ctm = svgEl.getScreenCTM();
      if (!ctm) return;
      const sp = pt.matrixTransform(ctm.inverse());
      const v = viewRef.current;
      const k = SIZE / v[2];
      const wx = v[0] + sp.x / k, wy = v[1] + sp.y / k;
      const now = performance.now();
      const dt = Math.max(0.008, (now - d.lt) / 1000);
      d.body.vx = d.body.vx * 0.4 + ((wx - d.lx) / dt) * 0.6;
      d.body.vy = d.body.vy * 0.4 + ((wy - d.ly) / dt) * 0.6;
      d.body.x = wx + d.dx; d.body.y = wy + d.dy;
      d.lx = wx; d.ly = wy; d.lt = now;
      wakeRef.current?.();
    };
    const up = (ev?: PointerEvent) => {
      const p0 = pressRef.current;
      pressRef.current = null;
      if (onTap && p0 && ev && performance.now() - p0.t < 350 && Math.hypot(ev.clientX - p0.x, ev.clientY - p0.y) < 8) {
        onTap(); // a quick, still press is a tap, wherever the object lies
      }
      dragRef.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      wakeRef.current?.();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };
  const [ready, setReady] = useState(false);

  function nodeImg(d: Node): string | undefined {
    return d.depth === 0 ? rootImage ?? d.data.img : d.data.img;
  }
  function fillFor(d: Node): string {
    return d.depth === 0 ? "#0a3a57" : d.depth === 1 ? "#1f8fd0" : "#bfe3f7";
  }
  // Thinner stroke the deeper (smaller) the circle, so the ring never
  // overpowers a tiny image several levels down: 5, 4, 3, then finer still.
  function strokeWidthFor(d: Node): number {
    const widths = [5, 4, 3, 2.6, 2.4];
    return widths[d.depth - 1] ?? 2.4;
  }

  function zoomTo(v: View) {
    const k = SIZE / v[2];
    viewRef.current = v;
    const cg = circlesRef.current;
    const lg = labelsRef.current;
    const bb = badgeBodiesRef.current;
    if (bb) {
      const bg = badgesRef.current;
      for (const b of bb) {
        const el = bg?.children[b.idx] as SVGGElement | undefined;
        if (el) el.setAttribute("transform", `translate(${(b.x - v[0]) * k},${(b.y - v[1]) * k})`);
      }
    }
    const pb = pillBodyRef.current;
    if (pb && pillRef.current) {
      pillRef.current.setAttribute("transform", `translate(${(pb.x - v[0]) * k},${(pb.y - v[1]) * k}) rotate(${((pb as unknown as { a?: number }).a ?? 0) * 57.2958})`);
    }
    const ub = uiBodiesRef.current;
    if (ub) {
      for (const u of ub) {
        const el = (u.kind === "close" ? uiCloseRef : uiDescRef).current;
        if (el) el.setAttribute("transform", `translate(${(u.x - v[0]) * k},${(u.y - v[1]) * k}) rotate(${u.a * 57.2958})`);
      }
    }
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
          const childR = d.r * k;
          if (isMobileRef.current) {
            // circles touch and vary in size, so the label sits centred on its
            // circle and scales with it (small circle, small label)
            const ls = Math.max(0.4, Math.min(1.25, childR / 250));
            l.setAttribute("transform", `translate(${tx},${ty}) scale(${ls})`);
          } else {
            // Desktop: labels sit above or below their circle (never to the side,
            // so they do not run off the narrow horizontal edges), centred and
            // clamped to stay inside the canvas.
            const vbWl = aspect >= 1 ? SIZE * aspect : SIZE;
            const vbHl = aspect >= 1 ? SIZE : SIZE / aspect;
            const xMinl = aspect >= 1 ? -vbWl * shift : -vbWl / 2;
            const margin = 120;
            const lx = Math.max(xMinl + margin, Math.min(xMinl + vbWl - margin, tx));
            let ly = ty < 0 ? ty - childR - 70 : ty + childR + 70;
            ly = Math.max(-vbHl / 2 + 60, Math.min(vbHl / 2 - 110, ly));
            l.setAttribute("transform", `translate(${lx},${ly})`);
          }
        }
      }
    });
  }

  function zoom(d: Node) {
    // the pit stays live through a zoom: physics keeps running underneath
    // while the view flies in, and everything returns as the view pulls back
    // If the visitor explored before the drop ever happened, re-arm the 2s
    // countdown each time they come back to the full view, so the drop is
    // delayed by curiosity rather than cancelled by it.
    if (gravity && !fellRef.current && d === nodes[0]) {
      window.setTimeout(() => { runFallRef.current?.(); }, 2000);
    }
    focusRef.current = d;
    setFocus(d);
    onActiveChange?.(d !== nodes[0]);
    let target: View = [d.x, d.y, d.r * 2 * (isMobileRef.current ? PAD : ZOOM_PAD) * (dockAside && d === nodes[0] ? 1.21 : 1)];
    if (d === nodes[0]) target = clampRootView(target);
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
    // once dropped, a circle that owns a body lifts out to the learn layer
    if (fellRef.current) {
      const pb = pitBodiesRef.current;
      const body = pb?.owned.has(d) ? pb.find(d) : undefined;
      if (body) {
        body.held = true;
        // the pulled-out card appears exactly where the circle sits, at its
        // current tumble angle, exactly like a dog card leaving the main pit
        const el = e.currentTarget as SVGCircleElement;
        const cr = el.getBoundingClientRect();
        setLearnCard({
          name: d.data.name,
          image: d.data.img ?? rootImage ?? "",
          x: cr.left + cr.width / 2,
          y: cr.top + cr.height / 2,
          angle: (body as unknown as { a?: number }).a ?? 0,
        });
        setLearnNode(d);
        return;
      }
    }
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

    const v: View = clampRootView([nodes[0].x, nodes[0].y, nodes[0].r * 2 * (isMobile ? PAD : ZOOM_PAD) * (dockAside ? 1.21 : 1)]);
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

  // Let the shell mirror the hovered/focused breed (title + pill text).
  useEffect(() => {
    onShownChange?.(((hovered ?? focus) as Node).data.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hovered, focus]);

  // Gravity: 2s after the entrance settles, the top-level ancestor circles
  // AND their yellow % badges disconnect and fall as physics bodies (nested
  // circles ride inside their parent), bounce off the container floor like
  // tennis balls, knock into each other, and come to rest as a live pile.
  // Collisions flash little white numbers (the circle's % share) that drift
  // up and fade, copied from the PackPit number effect. White breed names
  // vanish at the moment of the drop. Hand-rolled sim, no dependency.
  // Popup-only via the gravity prop; skipped for reduced motion; cancelled
  // by any zoom. Runs once per open.
  useEffect(() => {
    if (!gravity || !entered || fellRef.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const doFall = () => {
      if (fellRef.current) return;
      if (focusRef.current !== nodes[0]) return; // user already exploring
      fellRef.current = true;
      setFalling(true);
      setDropped(true); // names disappear, physics badges appear
      const v = viewRef.current;
      const k = SIZE / v[2];
      const st = stageRef.current;
      const stageH = st ? Math.max(st.clientHeight, 1) : SIZE;
      const asp = st ? st.clientWidth / stageH : aspect;
      const vbWf = asp >= 1 ? SIZE * asp : SIZE;
      const vbHf = asp >= 1 ? SIZE : SIZE / asp;
      const xMinF = asp >= 1 ? -vbWf * (centred ? 0.5 : SHIFT) : -vbWf / 2;
      const M = 4; // margin above the grass, svg units
      const floorVU = floorReserveVU();
      const xL = v[0] + (xMinF + M) / k;
      const xR = v[0] + (xMinF + vbWf - M) / k;
      const yF = v[1] + (vbHf / 2 - floorVU - M) / k;
      const yF0 = yF;
      const worldH = vbHf / k;
      type Body = { n: Node | null; x: number; y: number; vx: number; vy: number; r: number; pct: number; idx: number; lastFx: number; popped: boolean; ghosts: Map<Body, number>; a: number; va: number; ia: number; iva: number; held?: boolean; charges?: number; lastKnock?: number; inert?: boolean };
      const d1 = nodes.filter((n) => n.depth === 1);
      const pctOf = (n: Node) => (n.parent ? Math.round(((n.value ?? 0) / (n.parent.value || 1)) * 100) : 0);
      const bodies: Body[] = d1.map((n, i) => ({ n, x: n.x, y: n.y, vx: 0, vy: 0, r: n.r, pct: pctOf(n), idx: i, lastFx: 0, popped: false, ghosts: new Map<Body, number>(), a: 0, va: 0, ia: 0, iva: 0 }));
      if (bodies.length === 0) { setFalling(false); return; }
      // yellow % badges become small bodies, spawned at each circle's lower-right rim
      const BADGE_R = 46 / k;
      const badges: Body[] = d1.map((n, i) => ({
        n: null, x: n.x + n.r * 0.6, y: n.y + n.r * 0.6, vx: 0, vy: 0,
        r: BADGE_R, pct: pctOf(n), idx: i, lastFx: 0, popped: true, ghosts: new Map<Body, number>(), a: 0, va: 0, ia: 0, iva: 0, charges: 20,
      }));
      badgeBodiesRef.current = badges;
      setBadgePcts(d1.map((n) => pctOf(n)));
      // svg units per screen px via the real screen transform: used for pit-
      // exact number sizing and for screen-sized UI objects
      const svgEl = st ? st.querySelector("svg") : null;
      const ctm = svgEl ? (svgEl as SVGSVGElement).getScreenCTM() : null;
      const fxScale = ctm && ctm.a ? 1 / ctm.a : vbHf / stageH;

      // The close X and description toggle join the pit, fixed in the top-right
      // corner like the pit's menu button, in screen-size terms.
      const uppW = fxScale;
      if (!uiBodiesRef.current) {
        const uSz = 84 * uppW; // 84px on screen, dock-icon territory
        const m = 16 * uppW;
        const ux = v[0] + (xMinF + vbWf - m - uSz / 2) / k;
        uiBodiesRef.current = [
          { x: ux, y: v[1] + (-vbHf / 2 + m + uSz / 2) / k, vx: 0, vy: 0, r: (uSz / 2) * 1.1 / k, half: uSz / 2, a: 0, va: 0, fixed: true, hits: 0, kind: "close" },
          { x: ux, y: v[1] + (-vbHf / 2 + m + uSz * 1.5 + 14 * uppW) / k, vx: 0, vy: 0, r: (uSz / 2) * 1.1 / k, half: uSz / 2, a: 0, va: 0, fixed: true, hits: 0, kind: "desc" },
        ];
      }
      const uiBodies = uiBodiesRef.current;

      // The name pill enters the pit as a sticky capsule at the bottom centre.
      if (namePill && !pillBodyRef.current) {
        pillBodyRef.current = {
          x: v[0] + (xMinF + vbWf / 2) / k,
          y: yF0 - 27 / k,
          vx: 0, vy: 0, L: 120, pr: 27, stuck: true,
        };
      }
      const all = bodies.concat(badges);
      // nodes that have their own body: their subtrees no longer ride a parent
      const owned = new Set<Node>(bodies.map((b) => b.n as Node));
      pitBodiesRef.current = {
        find: (n: Node) => all.find((b) => b.n === n),
        owned,
      };
      spawnBadgeRef.current = (sx: number, sy: number, rPx: number, pctVal: number) => {
        // client px -> world, via the svg's real screen transform
        const svg2 = stageRef.current?.querySelector("svg") as SVGSVGElement | null;
        const c2 = svg2?.getScreenCTM();
        if (!svg2 || !c2) return;
        const pt = svg2.createSVGPoint();
        pt.x = sx; pt.y = sy;
        const sp = pt.matrixTransform(c2.inverse());
        const vNow = viewRef.current;
        const kNow = SIZE / vNow[2];
        const bl = badgeBodiesRef.current;
        if (!bl) return;
        const nb: Body = {
          n: null,
          x: vNow[0] + sp.x / kNow,
          y: vNow[1] + sp.y / kNow,
          vx: (Math.random() - 0.5) * worldH * 0.25,
          vy: worldH * 0.25,
          r: 46 / kNow, // matches the badge visual, which is a fixed 46 view units
          pct: pctVal, idx: bl.length, lastFx: 0, popped: true,
          ghosts: new Map<Body, number>(), a: 0, va: 0, ia: 0, iva: 0, charges: 20,
        };
        bl.push(nb);
        all.push(nb);
        setBadgePcts((l) => [...l, pctVal]);
        wake();
      };
      const moveSubtree = (root: Node, dxm: number, dym: number) => {
        const stack: Node[] = [root];
        while (stack.length) {
          const d = stack.pop() as Node;
          d.x += dxm; d.y += dym;
          for (const ch of d.children ?? []) if (!owned.has(ch)) stack.push(ch);
        }
      };
      // First floor hit pops a circle's direct children out as their own
      // bodies (their subtrees riding along), inheriting some momentum plus
      // an upward-outward burst. Ancestor bodies are ghosts to a fresh child
      // until it has fully cleared them, so it escapes without an explosion.
      const popChildren = (b: Body) => {
        if (!b.n || b.popped) return;
        b.popped = true;
        for (const ch of b.n.children ?? []) {
          const nb: Body = {
            n: ch, x: ch.x, y: ch.y,
            vx: b.vx * 0.4 + (Math.random() - 0.5) * worldH * 0.7,
            vy: b.vy * 0.3 - worldH * (0.45 + Math.random() * 0.35),
            r: ch.r, pct: pctOf(ch), idx: -1, lastFx: 0, popped: false,
            ghosts: new Map<Body, number>(), a: 0, va: (Math.random() - 0.5) * 0.8, ia: 0, iva: 0,
          };
          for (const other of all) if (other.n && ch.ancestors().includes(other.n)) nb.ghosts.set(other, performance.now());
          owned.add(ch);
          all.push(nb);
          // the child's yellow % badge pops out with it
          const bl = badgeBodiesRef.current;
          if (bl) {
            const bb: Body = {
              n: null, x: ch.x + ch.r * 0.6, y: ch.y + ch.r * 0.6,
              vx: nb.vx * 0.8 + (Math.random() - 0.5) * worldH * 0.3,
              vy: nb.vy * 0.8,
              r: BADGE_R, pct: pctOf(ch), idx: bl.length, lastFx: 0,
              popped: true, ghosts: new Map<Body, number>(nb.ghosts), a: 0, va: 0, ia: 0, iva: 0, charges: 20,
            };
            bl.push(bb);
            all.push(bb);
            setBadgePcts((l) => [...l, bb.pct]);
          }
        }
      };
      const G = worldH * 2.4; // per s^2
      const REST = 0.48;       // badges, pill, body-vs-body
      const BOUNCE = 0.78;     // circles off the floor: tennis-ball lively
      const WALL_REST = 0.35;
      // little white numbers that flash up on a hit, copied from PackPit:
      // 650ms life, alpha 1-t, rising 22 + t*34, weight 400, --font-pct
      const numbers: { el: SVGTextElement; x: number; y: number; born: number }[] = [];
      const pctFont = (getComputedStyle(document.documentElement).getPropertyValue("--font-pct").trim() || "Montserrat");
      const numAt = (x: number, y: number, val: number, now: number) => {
        const fx = fxRef.current;
        if (!fx) return;
        const el = document.createElementNS("http://www.w3.org/2000/svg", "text");
        el.textContent = String(val);
        el.setAttribute("text-anchor", "middle");
        el.style.fontFamily = pctFont + ", system-ui, sans-serif";
        el.style.fontWeight = "400";
        el.style.fontSize = `${15 * fxScale}px`;
        el.style.fill = "#ffffff";
        el.style.pointerEvents = "none";
        fx.appendChild(el);
        numbers.push({ el, x, y, born: now });
        onScore?.(val);
      };
      const FX_LIFE = 650;
      // understated three-ball pop, straight from the pit's whackAt: three
      // white circles drift out and fade where each name vanishes
      const parts: { el: SVGCircleElement; x: number; y: number; vx: number; vy: number; r: number; born: number; life: number }[] = [];
      const whackAt = (x: number, y: number, now: number) => {
        const fx = fxRef.current;
        if (!fx) return;
        for (let i = 0; i < 3; i++) {
          const a = Math.random() * Math.PI * 2, sp = (1 + Math.random() * 1.6) * 60 * fxScale;
          const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          el.setAttribute("r", String((5 + Math.random() * 4) * fxScale));
          el.style.fill = "#ffffff";
          el.style.pointerEvents = "none";
          fx.appendChild(el);
          parts.push({ el, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 36 * fxScale, r: 0, born: now, life: 420 + Math.random() * 220 });
        }
      };
      const drawNumbers = (now: number, view: View) => {
        const kk = SIZE / view[2];
        for (let i = parts.length - 1; i >= 0; i--) {
          const pp = parts[i];
          const t = (now - pp.born) / pp.life;
          if (t >= 1) { pp.el.remove(); parts.splice(i, 1); continue; }
          pp.x += (pp.vx / 60);
          pp.y += (pp.vy / 60);
          pp.el.setAttribute("cx", String((pp.x - view[0]) * kk));
          pp.el.setAttribute("cy", String((pp.y - view[1]) * kk));
          pp.el.style.opacity = String(1 - t);
        }
        for (let i = numbers.length - 1; i >= 0; i--) {
          const n = numbers[i];
          const t = (now - n.born) / FX_LIFE;
          if (t >= 1) { n.el.remove(); numbers.splice(i, 1); continue; }
          n.el.setAttribute("x", String((n.x - view[0]) * kk));
          n.el.setAttribute("y", String((n.y - view[1]) * kk - (22 + t * 34) * fxScale));
          n.el.style.opacity = String(1 - t);
        }
      };
      // the white names pop out of existence: three-ball pop at each label
      const t0 = performance.now();
      for (const n of d1) whackAt(n.x, n.y - n.r * 0.55, t0);

      // a solid knock spends one of a badge's 20 charges (600ms cooldown, like
      // the pit); at zero it goes inert: blue, silent, ungrabbable, with a poof
      const poofAt = (x: number, y: number, now2: number) => {
        const fx = fxRef.current;
        if (!fx) return;
        for (let i = 0; i < 10; i++) {
          const a2 = Math.random() * Math.PI * 2, sp2 = (0.4 + Math.random() * 2.2) * 60 * fxScale;
          const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          el.setAttribute("r", String((3 + Math.random() * 6) * fxScale));
          el.style.fill = "#ffffff";
          el.style.pointerEvents = "none";
          fx.appendChild(el);
          parts.push({ el, x: x + (Math.random() - 0.5) * 20 * fxScale, y: y + (Math.random() - 0.5) * 20 * fxScale, vx: Math.cos(a2) * sp2, vy: Math.sin(a2) * sp2 - 60 * fxScale, r: 0, born: now2, life: 420 + Math.random() * 340 });
        }
      };
      const knockBadge = (b: Body, rv: number, now2: number) => {
        if (b.n || b.inert || b.charges === undefined) return; // badges only
        if (rv < FX_MIN * 1.2) return; // a real knock, not a nudge
        if (b.lastKnock && now2 - b.lastKnock < 600) return;
        b.lastKnock = now2;
        b.charges -= 1;
        if (b.charges <= 0) {
          b.inert = true;
          poofAt(b.x, b.y, now2);
          setInertBadges((prev) => new Set(prev).add(b.idx));
        }
      };

      const FX_COOLDOWN = 220;
      const FX_MIN = worldH * 0.05; // minimum impact speed to flash
      let last = performance.now();
      let started = last;
      const isDragged = (b: unknown) => dragRef.current?.body === b;
      let stillFrames = 0;
      const step = (now: number) => {
        const dt = Math.min(0.032, Math.max(0.004, (now - last) / 1000));
        last = now;
        for (const b of all) {
          if (b.held) continue; // lifted out onto the learn layer
          if (isDragged(b)) continue; // position driven by the pointer
          b.vy += G * dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.va = Math.max(-1.0, Math.min(1.0, b.va)); // never a spinning-top blur
          b.a += b.va * dt;
          b.va *= 0.99;
          // the image inside lags its circle like water in a bowl: an
          // underdamped spring chases the body angle, overshoots, sloshes,
          // and settles a beat after the circle itself has stopped
          const sacc = (b.a - b.ia) * 16 - b.iva * 3.2;
          b.iva += sacc * dt;
          b.ia += b.iva * dt;
          if (b.y + b.r > yF) {
            if (b.vy > FX_MIN && now - b.lastFx > FX_COOLDOWN) { numAt(b.x, yF - b.r, b.pct, now); b.lastFx = now; }
            const hitSpeed = b.vy;
            b.y = yF - b.r; b.vy = -b.vy * (b.n ? BOUNCE : REST); b.vx *= 0.96;
            b.va = b.va * 0.5 + (b.vx / Math.max(b.r, 0.001)) * 0.22;
            if (hitSpeed > FX_MIN * 0.6) popChildren(b);
          }
          if (b.x - b.r < xL) { if (Math.abs(b.vx) > FX_MIN * 0.6) popChildren(b); b.x = xL + b.r; b.vx = -b.vx * WALL_REST; }
          if (b.x + b.r > xR) { if (Math.abs(b.vx) > FX_MIN * 0.6) popChildren(b); b.x = xR - b.r; b.vx = -b.vx * WALL_REST; }
        }
        for (let pass = 0; pass < 3; pass++) {
        for (let i = 0; i < all.length; i++) {
          for (let j = i + 1; j < all.length; j++) {
            const a = all[i], c = all[j];
            if (a.held || c.held) continue;
            const dx = c.x - a.x, dy = c.y - a.y;
            const dist = Math.hypot(dx, dy) || 0.001;
            const gBorn = a.ghosts.get(c) ?? c.ghosts.get(a);
            if (gBorn !== undefined) {
              if (dist >= a.r + c.r || now - gBorn > 650) {
                a.ghosts.delete(c); c.ghosts.delete(a); // immunity over: solid from here
              } else {
                continue;
              }
            }
            const overlap = a.r + c.r - dist;
            if (overlap > 0) {
              const nx = dx / dist, ny = dy / dist;
              let ma = a.r * a.r, mc = c.r * c.r;
              if (isDragged(a)) ma = ma * 1e6;
              if (isDragged(c)) mc = mc * 1e6;
              const mt = ma + mc;
              a.x -= nx * overlap * (mc / mt); a.y -= ny * overlap * (mc / mt);
              c.x += nx * overlap * (ma / mt); c.y += ny * overlap * (ma / mt);
              const rel = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
              if (rel < 0 && pass === 0) {
                if (-rel > FX_MIN && now - a.lastFx > FX_COOLDOWN) {
                  const cx = a.x + nx * a.r, cy = a.y + ny * a.r;
                  numAt(cx, cy, a.pct, now);
                  a.lastFx = now; c.lastFx = now;
                }
                const imp = (-(1 + REST) * rel) / (1 / ma + 1 / mc);
                a.vx -= (imp / ma) * nx; a.vy -= (imp / ma) * ny;
                c.vx += (imp / mc) * nx; c.vy += (imp / mc) * ny;
                knockBadge(a, -rel, now); knockBadge(c, -rel, now);
                if (-rel > FX_MIN * 0.6) { popChildren(a); popChildren(c); }
                const tang = (c.vx - a.vx) * -ny + (c.vy - a.vy) * nx;
                a.va += (tang / Math.max(a.r, 0.001)) * 0.045;
                c.va -= (tang / Math.max(c.r, 0.001)) * 0.045;
              }
            }
          }
        }
        }
        // in-pit buttons: fixed ones take knocks (sink + tilt, 5th drops them);
        // loose ones fall, bounce and spin like everything else
        const uis = uiBodiesRef.current;
        if (uis) {
          for (const u of uis) {
            if (!u.fixed && !isDragged(u)) {
              u.vy += G * dt;
              u.x += u.vx * dt;
              u.y += u.vy * dt;
              u.a += u.va * dt;
              u.va *= 0.995;
              if (u.y + u.r > yF) { u.y = yF - u.r; u.vy = -u.vy * 0.3; u.vx *= 0.9; u.va = u.va * 0.5 + (u.vx / Math.max(u.r, 0.001)) * 0.5; }
              if (u.x - u.r < xL) { u.x = xL + u.r; u.vx = -u.vx * WALL_REST; }
              if (u.x + u.r > xR) { u.x = xR - u.r; u.vx = -u.vx * WALL_REST; }
            }
            for (const b of all) {
              if (b.held) continue;
              const dx = b.x - u.x, dy = b.y - u.y;
              const dist = Math.hypot(dx, dy) || 0.001;
              const overlap = b.r + u.r - dist;
              if (overlap <= 0) continue;
              const nx = dx / dist, ny = dy / dist;
              if (u.fixed) {
                b.x += nx * overlap; b.y += ny * overlap;
                const rel = b.vx * nx + b.vy * ny;
                if (rel < 0) {
                  b.vx -= (1 + REST) * rel * nx; b.vy -= (1 + REST) * rel * ny;
                  if (-rel > FX_MIN * 0.3) {
                    u.hits += 1;
                    if (u.hits >= 5) { u.fixed = false; u.va = (Math.random() - 0.5) * 2; }
                    else { u.y += (12 * uppW) / 1; u.a += 0.09; } // sink a notch and tip
                  }
                }
              } else {
                const mb = isDragged(b) ? b.r * b.r * 1e6 : b.r * b.r;
                const mu = isDragged(u) ? u.r * u.r * 1e6 : u.r * u.r * 1.6;
                const mt = mb + mu;
                b.x += nx * overlap * (mu / mt); b.y += ny * overlap * (mu / mt);
                u.x -= nx * overlap * (mb / mt); u.y -= ny * overlap * (mb / mt);
                const rel = (b.vx - u.vx) * nx + (b.vy - u.vy) * ny;
                if (rel < 0) {
                  const imp = (-(1 + REST) * rel) / (1 / mb + 1 / mu);
                  b.vx += (imp / mb) * nx; b.vy += (imp / mb) * ny;
                  u.vx -= (imp / mu) * nx; u.vy -= (imp / mu) * ny;
                  u.va += ((Math.random() - 0.5) * -rel) / worldH;
                }
              }
            }
          }
        }
        // name pill: capsule vs every ball; static until its first hit
        const pill = pillBodyRef.current;
        if (pill) {
          const prW = pill.pr / k;
          const LW = pill.L / k;
          if (!pill.stuck && !isDragged(pill)) {
            pill.vy += G * dt;
            pill.x += pill.vx * dt;
            pill.y += pill.vy * dt;
            if (pill.y + prW > yF) { pill.y = yF - prW; pill.vy = -pill.vy * REST; pill.vx *= 0.94; }
            if (pill.x - LW - prW < xL) { pill.x = xL + LW + prW; pill.vx = -pill.vx * WALL_REST; }
            if (pill.x + LW + prW > xR) { pill.x = xR - LW - prW; pill.vx = -pill.vx * WALL_REST; }
          }
          const mp = prW * (LW + prW) * 2.5; // heavier than it looks, so it is not batted about
          for (const b of all) {
            if (b.held) continue;
            const cxp = Math.max(pill.x - LW, Math.min(pill.x + LW, b.x));
            const dx = b.x - cxp, dy = b.y - pill.y;
            const dist = Math.hypot(dx, dy) || 0.001;
            const overlap = b.r + prW - dist;
            if (overlap > 0) {
              const nx = dx / dist, ny = dy / dist;
              if (pill.stuck) {
                // first contact knocks it loose; resolve as a static bounce
                b.x += nx * overlap; b.y += ny * overlap;
                const rel = b.vx * nx + b.vy * ny;
                if (rel < 0) { b.vx -= (1 + REST) * rel * nx; b.vy -= (1 + REST) * rel * ny; if (-rel > FX_MIN * 0.6) popChildren(b); }
                if (now - b.lastFx > FX_COOLDOWN) { numAt(cxp, pill.y - prW, b.pct, now); b.lastFx = now; }
                pill.stuck = false;
              } else {
                const mb = isDragged(b) ? b.r * b.r * 1e6 : b.r * b.r;
                const mpe = isDragged(pill) ? mp * 1e6 : mp;
                const mt = mb + mpe;
                b.x += nx * overlap * (mpe / mt); b.y += ny * overlap * (mpe / mt);
                pill.x -= nx * overlap * (mb / mt); pill.y -= ny * overlap * (mb / mt);
                const rel = (b.vx - pill.vx) * nx + (b.vy - pill.vy) * ny;
                if (rel < 0) {
                  const imp = (-(1 + REST) * rel) / (1 / mb + 1 / mpe);
                  b.vx += (imp / mb) * nx; b.vy += (imp / mb) * ny;
                  pill.vx -= (imp / mpe) * nx; pill.vy -= (imp / mpe) * ny;
                }
              }
            }
          }
        }
        let still = true;
        if (dragRef.current) still = false;
        if (uis) for (const u of uis) if (!u.fixed && Math.hypot(u.vx, u.vy) > worldH * 0.012) still = false;
        if (pill && !pill.stuck && Math.hypot(pill.vx, pill.vy) > worldH * 0.012) still = false;
        for (const b of all) {
          if (b.held) { continue; }
          if (b.n) {
            const dxm = b.x - b.n.x, dym = b.y - b.n.y;
            if (dxm || dym) moveSubtree(b.n, dxm, dym);
          }
          const sp = Math.hypot(b.vx, b.vy);
          const cap = worldH * 2.5;
          if (sp > cap) { b.vx *= cap / sp; b.vy *= cap / sp; }
          if (sp > worldH * 0.012) still = false;
        }
        // spin the circle images with their bodies (pattern rotation about the
        // centre, scaled up so corners never show through); badges stay
        // upright like the pit's % chips
        if (svgEl) {
          for (const b of all) {
            if (!b.n || Math.abs(b.a) < 0.001) continue;
            const i = nodes.indexOf(b.n);
            const pat = (svgEl as SVGSVGElement).querySelector(`#bt-img-${i}`);
            if (pat) pat.setAttribute("patternTransform", `rotate(${b.ia * 57.2958} 0.5 0.5)`);
          }
        }
        zoomTo(viewRef.current);
        drawNumbers(now, viewRef.current);
        stillFrames = still ? stillFrames + 1 : 0;
        if ((stillFrames < 12 || numbers.length > 0) && now - started < 30000) {
          fallRafRef.current = requestAnimationFrame(step);
        } else {
          simRunningRef.current = false;
          numbers.forEach((n) => n.el.remove());
          numbers.length = 0;
          setFalling(false);
        }
      };
      const wake = () => {
        if (simRunningRef.current) return;
        simRunningRef.current = true;
        last = performance.now();
        started = last; // fresh time budget each wake
        fallRafRef.current = requestAnimationFrame(step);
      };
      // Shake: pit-style jolt of everything in the mini pit.
      shakeInnerRef.current = () => {
        for (const b of all) {
          b.vx = (Math.random() - 0.5) * worldH * 1.1;
          b.vy = -(0.45 + Math.random() * 0.85) * worldH;
        }
        const uu = uiBodiesRef.current;
        if (uu) for (const u of uu) if (!u.fixed) {
          u.vx = (Math.random() - 0.5) * worldH * 0.9;
          u.vy = -(0.4 + Math.random() * 0.7) * worldH;
        }
        const pl = pillBodyRef.current;
        if (pl) {
          pl.stuck = false;
          pl.vx = (Math.random() - 0.5) * worldH * 0.7;
          pl.vy = -(0.35 + Math.random() * 0.6) * worldH;
        }
        wake();
      };
      wakeRef.current = wake;
      wake();
    };
    runFallRef.current = doFall;
    registerShake?.(() => {
      if (!fellRef.current) runFallRef.current?.();
      shakeInnerRef.current?.();
    });
    const timer = window.setTimeout(doFall, 2000);
    return () => { window.clearTimeout(timer); cancelAnimationFrame(fallRafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gravity, entered, nodes]);

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
  const shift = centred ? 0.5 : SHIFT; // 0.5 = dead centre, 0.66 = offset right for text column
  const xMin = aspect >= 1 ? -vbW * shift : -vbW / 2;
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
  const buriedSet = hovered && !dropped ? new Set(hovered.descendants()) : null;

  return (
    <div className={`${styles.tree}${fill ? " " + styles.treeFill : ""}`} ref={wrapRef} style={fill ? undefined : { width: size, height: size }}>
      <div className={`${styles.stage}${dockAside ? " " + styles.stageDocked : ""}`} ref={stageRef}>
        <svg
          viewBox={viewBox}
          onClick={disableZoom ? undefined : onBackground}
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
                  <image href={encodeURI(bust(nodeImg(d) as string))} width="1" height="1" preserveAspectRatio="xMidYMid slice" />
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
              const tintThis = tinted && hasImg && d.depth % 2 === 0;
              const tintClass = tintThis
                ? Math.floor((d.depth - 2) / 2) % 2 === 0
                  ? styles.tintA
                  : styles.tintB
                : "";
              const cls = hasImg && tinted ? `${styles.imgCircle} ${tintClass}`.trim() : undefined;
              const heldHidden = (!!learnNode && (d === learnNode || (learnNode.descendants().includes(d) && !pitBodiesRef.current?.owned.has(d)))) || removedNodesRef.current.has(d);
              const buried = (!!buriedSet && d !== hovered && buriedSet.has(d)) || heldHidden;
              return (
                <circle
                  key={i}
                  className={cls}
                  fill={hidden ? "none" : nodeImg(d) ? `url(#bt-img-${i})` : fillFor(d)}
                  stroke={hidden ? "none" : strokeByDepth ? ["#ffd23e", "#0a3a57", "#5cc4ee", "#ffffff"][(d.depth - 1 + 4) % 4] : stroke}
                  strokeWidth={hidden ? 0 : strokeWidthFor(d)}
                  style={{
                    cursor: hidden ? "default" : "pointer",
                    pointerEvents: hidden ? "none" : "auto",
                    opacity: buried ? 0 : undefined,
                  }}
                  onMouseEnter={hidden ? undefined : () => setHovered(d)}
                  onMouseLeave={hidden ? undefined : () => setHovered((h) => (h === d ? null : h))}
                  onClick={disableZoom ? undefined : (e) => onCircle(e, d)}
                />
              );
            })}
          </g>

          <g ref={labelsRef} textAnchor="middle" style={{ fontFamily: "var(--font-body), system-ui, sans-serif", opacity: hideLabels ? 0 : entered ? 1 : 0, transition: "opacity 0.3s ease", pointerEvents: "none", userSelect: "none" }}>
            {nodes.map((d, i) => {
              const isChild = d.parent === focus;
              // When zoomed right into a single circle that has nothing inside
              // it, show that circle's own share centred within it.
              const isLeafFocus = d === focus && !!d.parent && !d.children;
              const visible = isChild || isLeafFocus;
              const pct = d.parent ? Math.round((d.value ?? 0) / (d.parent.value || 1) * 100) : null;
              return (
                <g key={i} style={{ display: visible ? "inline" : "none", pointerEvents: "none" }}>
                  {isChild && !(dropped && d.depth === 1) && (
                    <text
                      x={0}
                      y={TITLE_DY}
                      transform={`rotate(${TITLE_ANGLE} 0 ${TITLE_DY})`}
                      style={{ fill: "#ffffff", fontFamily: "var(--font-display), system-ui, sans-serif", fontSize: isMobile ? "102px" : "34px", letterSpacing: "0.5px" }}
                    >
                      {splitLabel(d.data.name.toUpperCase()).map((line, li) => (
                        <tspan key={li} x={0} dy={li === 0 ? 0 : "1.05em"}>{line}</tspan>
                      ))}
                    </text>
                  )}
                  {pct !== null && !(dropped && d.depth === 1) && (
                    <g>
                      <circle cx={0} cy={50} r={46} style={{ fill: "#ffd23e", stroke: "#0a3a57", strokeWidth: 3 }} />
                      <text x={0} y={50} dominantBaseline="central" style={{ fill: "#0a3a57", fontFamily: "Montserrat, var(--font-body), system-ui, sans-serif", fontWeight: 800, fontSize: `${46 * 0.7}px` }}>
                        {`${pct}%`}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* Physics badges: once dropped, the yellow % chips live here and are
              positioned by the sim / zoomTo from their body coordinates. */}
          <g ref={badgesRef} style={{ display: dropped ? "inline" : "none" }} textAnchor="middle">
            {badgePcts.map((pct, i) => {
              const v = viewRef.current;
              const kk = SIZE / v[2];
              const b = badgeBodiesRef.current?.[i];
              const bx = b ? b.x : v[0];
              const by = b ? b.y : v[1] - 99999;
              const st2 = stageRef.current;
              const upp2 = st2 ? (aspect >= 1 ? SIZE : SIZE / Math.max(aspect, 0.01)) / Math.max(st2.clientHeight, 1) : 1;
              const inert = inertBadges.has(i);
              return (
              <g key={i} transform={`translate(${(bx - v[0]) * kk},${(by - v[1]) * kk})`}
                style={{ cursor: inert ? "default" : "grab", pointerEvents: inert ? "none" : "auto", userSelect: "none" }}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={inert ? undefined : (e) => startDrag(e, badgeBodiesRef.current?.[i])}>
                <circle cx={0} cy={0} r={46} style={{ fill: inert ? "#0c5b92" : "#ffd23e", stroke: "#0a3a57", strokeWidth: 3 * upp2 }} />
                {!inert && (
                  <text x={0} y={0} dominantBaseline="central" style={{ fill: "#0a3a57", fontFamily: "Montserrat, var(--font-body), system-ui, sans-serif", fontWeight: 800, fontSize: `${46 * 0.7}px`, pointerEvents: "none", userSelect: "none" }}>
                    {`${pct}%`}
                  </text>
                )}
              </g>
              );
            })}
          </g>

          {/* Collision number flashes, appended imperatively by the sim. */}
          <g ref={fxRef} style={{ pointerEvents: "none" }} />

          {/* The name pill: light-blue capsule at the pit floor, showing the
              hovered/focused breed. Sticky until first hit, then it falls. */}
          {namePill && (() => {
            const v = viewRef.current;
            const kk = SIZE / v[2];
            const st = stageRef.current;
            const upp = st ? (aspect >= 1 ? SIZE : SIZE / Math.max(aspect, 0.01)) / Math.max(st.clientHeight, 1) : 1;
            const label = shown.data.name;
            const fs = 12 * upp;
            const ph = 26 * upp;
            const pr = ph / 2;
            const w = Math.max(44 * upp, label.length * fs * 0.62 + 20 * upp);
            const L = Math.max(0, w / 2 - pr);
            const pb = pillBodyRef.current;
            if (pb) { pb.L = L; pb.pr = pr; }
            const vbWr = aspect >= 1 ? SIZE * aspect : SIZE;
            const vbHr = aspect >= 1 ? SIZE : SIZE / aspect;
            const xMinR = aspect >= 1 ? -vbWr * shift : -vbWr / 2;
            const wx = pb ? pb.x : v[0] + (xMinR + vbWr / 2) / kk;
            const wy = pb ? pb.y : v[1] + (vbHr / 2 - floorReserveVU() - 6) / kk - pr / kk;
            return (
              <g ref={pillRef} transform={`translate(${(wx - v[0]) * kk},${(wy - v[1]) * kk})`}
                style={{ cursor: pb ? "grab" : "default", pointerEvents: pb ? "auto" : "none" }}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => startDrag(e, pillBodyRef.current)}>
                <rect x={-L - pr} y={-pr} width={(L + pr) * 2} height={pr * 2} rx={pr}
                  style={{ fill: "#0a3a57", stroke: "rgba(255,255,255,0.85)", strokeWidth: 2 * upp }} />
                <text x={0} y={1 * upp} textAnchor="middle" dominantBaseline="central"
                  style={{ fill: "#ffffff", fontFamily: "Montserrat, var(--font-body), system-ui, sans-serif", fontWeight: 700, fontSize: `${fs}px`, pointerEvents: "none", userSelect: "none" }}>
                  {label}
                </text>
              </g>
            );
                    })()}

          {/* In-pit buttons: close X and description toggle. Navy rounded
              squares with a yellow stroke; fixed top-right until knocked
              loose, always tappable. */}
          {dockAside && (() => {
            const v = viewRef.current;
            const kk = SIZE / v[2];
            const st = stageRef.current;
            const upp = st ? (aspect >= 1 ? SIZE : SIZE / Math.max(aspect, 0.01)) / Math.max(st.clientHeight, 1) : 1;
            const uSz = 84 * upp;
            const m = 16 * upp;
            const vbWr = aspect >= 1 ? SIZE * aspect : SIZE;
            const vbHr = aspect >= 1 ? SIZE : SIZE / aspect;
            const xMinR = aspect >= 1 ? -vbWr * shift : -vbWr / 2;
            const ub = uiBodiesRef.current;
            const defs: { kind: "close" | "desc"; wx: number; wy: number; a: number }[] = (["close", "desc"] as const).map((kind, idx) => {
              const b = ub?.find((u) => u.kind === kind);
              return {
                kind,
                wx: b ? b.x : v[0] + (xMinR + vbWr - m - uSz / 2) / kk,
                wy: b ? b.y : v[1] + (-vbHr / 2 + m + uSz / 2 + idx * (uSz + 14 * upp)) / kk,
                a: b ? b.a : 0,
              };
            });
            const half = uSz / 2;
            const iconStroke = 6 * upp;
            return defs.map((d) => (
              <g key={d.kind} ref={d.kind === "close" ? uiCloseRef : uiDescRef}
                transform={`translate(${(d.wx - v[0]) * kk},${(d.wy - v[1]) * kk}) rotate(${d.a * 57.2958})`}
                style={{ cursor: "pointer", pointerEvents: "auto" }}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => {
                  const b = uiBodiesRef.current?.find((u) => u.kind === d.kind);
                  const act = d.kind === "close" ? onPitClose : onToggleCaption;
                  startDrag(e, b && !b.fixed ? b : null, act);
                }}>
                <rect x={-half} y={-half} width={uSz} height={uSz} rx={20 * upp}
                  style={{ fill: "var(--navy, #0a3a57)", stroke: "var(--yellow, #ffd23e)", strokeWidth: 3 * upp }} />
                {d.kind === "close" ? (
                  <g stroke="var(--yellow, #ffd23e)" strokeWidth={iconStroke} strokeLinecap="round">
                    <line x1={-half * 0.34} y1={-half * 0.34} x2={half * 0.34} y2={half * 0.34} />
                    <line x1={half * 0.34} y1={-half * 0.34} x2={-half * 0.34} y2={half * 0.34} />
                  </g>
                ) : (
                  <g stroke="var(--yellow, #ffd23e)" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round"
                    transform={`scale(${uSz / 44}) translate(-12,-12)`}>
                    <rect x="9" y="2" width="6" height="4" rx="1" />
                    <rect x="2" y="18" width="6" height="4" rx="1" />
                    <rect x="16" y="18" width="6" height="4" rx="1" />
                    <path d="M12 6v4M12 10H5v8M12 10h7v8" />
                  </g>
                )}
              </g>
            ));
          })()}
        </svg>
      </div>

      {learnNode && learnCard && (
        <LineageMap
          breed={learnCard}
          tree={
            learnNode.data.children && learnNode.data.children.length > 0
              ? learnNode.data
              : { ...learnNode.data, children: [{ ...learnNode.data, children: undefined }] }
          }
          circular
          currentScore={0}
          onScore={onScore}
          onRemove={(name) => {
            // collected: the circle leaves the pit for good
            if (learnNode && name === learnNode.data.name) {
              removedNodesRef.current.add(learnNode);
            }
          }}
          onScatter={(data) => {
            // the learnt % circles tip into the pit as live objects
            for (const c of data.circles ?? []) {
              spawnBadgeRef.current?.(c.x, c.y, c.r, Math.round(c.share));
            }
          }}
          onClose={() => {
            const pb = pitBodiesRef.current;
            const body = learnNode ? pb?.find(learnNode) : undefined;
            if (body && learnNode && !removedNodesRef.current.has(learnNode)) {
              body.held = false; // falls back in from where it was lifted
            }
            setLearnNode(null);
            setLearnCard(null);
            wakeRef.current?.();
          }}
        />
      )}
      <div className={`${styles.aside}${dockAside ? " " + styles.asideDocked : ""}`} style={{ position: "relative", display: hideCaption ? "none" : undefined }}>
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

        <div className={styles.caption} style={{ position: "relative" }}>
          {onCaptionClose && (
            <button type="button" onClick={onCaptionClose} aria-label="Close description" className={styles.captionClose}>
              <svg viewBox="0 0 32 32" aria-hidden="true" style={{ width: 14, height: 14 }}>
                <line x1="7" y1="7" x2="25" y2="25" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                <line x1="25" y1="7" x2="7" y2="25" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </button>
          )}
          <span className={styles.cName}>{shown.data.name}</span>
          {shownShare !== null && shown.parent && (
            <span className={styles.cShare}>
              {shownShare}% of {shown.parent.data.name}
            </span>
          )}
          <p className={styles.cNote}>
            {breedInfo[shown.data.name] || (shown.depth === 0 && rootNote ? rootNote : shown.data.note)}
            {shown.children ? " Tap a circle inside to keep digging." : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
