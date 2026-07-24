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
  onShownChange,
  hideCaption = false,
  onCaptionClose,
  onScore,
  registerShake,
  onToggleCaption,
  onPitClose,
  onRoundWon,
  onPitFull,
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
  onShownChange?: (name: string) => void;
  hideCaption?: boolean;
  onCaptionClose?: () => void;
  onScore?: (v: number) => void;
  registerShake?: (fn: () => void) => void;
  onToggleCaption?: () => void;
  onPitClose?: () => void;
  onRoundWon?: () => void;
  onPitFull?: () => void;
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
  // rods and name pills scattered in from the learn layer, pit-style props:
  // sizes are view units frozen at the drop; dead ones keep their slot so the
  // render children stay index-aligned with the bridge lists
  const [rodList, setRodList] = useState<{ len: number; h: number; lit: boolean }[]>([]);
  const [deadRods, setDeadRods] = useState<Set<number>>(new Set());
  const [pillList, setPillList] = useState<{ lines: string[]; w: number; h: number; rx: number }[]>([]);
  const [deadPills, setDeadPills] = useState<Set<number>>(new Set());
  useEffect(() => {
    if (!dockAside) return;
    setBadgePcts(
      nodes.filter((n) => n.depth === 1).map((n) => (n.parent ? Math.round(((n.value ?? 0) / (n.parent.value || 1)) * 100) : 0)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, dockAside]);
  const [learnNode, setLearnNode] = useState<Node | null>(null);
  const [learnCard, setLearnCard] = useState<{ name: string; image: string; x: number; y: number; angle: number; r: number } | null>(null);
  const removedNodesRef = useRef<Set<Node>>(new Set());
  const spawnBadgeRef = useRef<((x: number, y: number, r: number, pct: number) => void) | null>(null);
  const spawnRodRef = useRef<((x1: number, y1: number, x2: number, y2: number, lit: boolean) => void) | null>(null);
  const spawnPillRef = useRef<((x: number, y: number, w: number, name: string) => void) | null>(null);
  type PropBody = { x: number; y: number; vx: number; vy: number; a: number; idx: number; hits: number; maxHits: number; dead?: boolean; lastKnock?: number; mb?: any };
  const rodBodiesRef = useRef<PropBody[]>([]);
  const pillBodiesRef = useRef<PropBody[]>([]);
  const rodsGRef = useRef<SVGGElement>(null);
  const pillsGRef = useRef<SVGGElement>(null);
  const [inertBadges, setInertBadges] = useState<Set<number>>(new Set());
  const pitBodiesRef = useRef<{ find: (n: Node) => { x: number; y: number; vx: number; vy: number; held?: boolean } | undefined; owned: Set<Node> } | null>(null);
  const runFallRef = useRef<(() => void) | null>(null);
  const fullTriggeredRef = useRef(false);
  // The pit-full countdown, ported from the main pit: huge sequential digits
  // 10 to 0 over the stage, a pause on 0, then GAME OVER hands to the shell.
  const runCountdown = () => {
    const st = stageRef.current;
    if (!st) { onPitFull?.(); return; }
    const el = document.createElement("div");
    el.style.cssText = "position:absolute;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;font-family:var(--font-display,'Luckiest Guy',system-ui);font-size:clamp(5rem,18vw,12rem);color:#fff;pointer-events:none;text-shadow:0 4px 40px rgba(0,0,0,0.6)";
    st.appendChild(el);
    const steps = ["10","9","8","7","6","5","4","3","2","1","0"];
    let i = 0;
    el.textContent = steps[i];
    const tick = window.setInterval(() => {
      i++;
      if (i < steps.length) { el.textContent = steps[i]; return; }
      window.clearInterval(tick);
      // hold on 0, then GAME OVER, then hand over
      window.setTimeout(() => {
        el.textContent = "GAME OVER";
        window.setTimeout(() => { el.remove(); onPitFull?.(); }, 1400);
      }, 1200);
    }, 1000);
  };
  const shakeInnerRef = useRef<(() => void) | null>(null);
  const fellRef = useRef(false);
  const fallRafRef = useRef(0);
  type BadgeBody = { x: number; y: number; vx: number; vy: number; r: number; pct: number; idx: number };
  const badgeBodiesRef = useRef<BadgeBody[] | null>(null);
  const badgesRef = useRef<SVGGElement>(null);
  const fxRef = useRef<SVGGElement>(null);
  // Drag support: badges can be picked up and flung, like
  // objects in the main pit. Circles stay click-to-zoom only. The sim exposes
  // a wake() so a drag can restart physics after everything has settled.
  const wakeRef = useRef<(() => void) | null>(null);
  const simRunningRef = useRef(false);
  const matterCleanupRef = useRef<(() => void) | null>(null);
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
    wakeRef.current?.();    wakeRef.current?.();
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
    const ub = uiBodiesRef.current;
    if (ub) {
      for (const u of ub) {
        const el = (u.kind === "close" ? uiCloseRef : uiDescRef).current;
        if (el) el.setAttribute("transform", `translate(${(u.x - v[0]) * k},${(u.y - v[1]) * k}) rotate(${u.a * 57.2958})`);
      }
    }
    for (const [listRef, gRef] of [[rodBodiesRef, rodsGRef], [pillBodiesRef, pillsGRef]] as const) {
      const list = (listRef as typeof rodBodiesRef).current;
      const gg = (gRef as typeof rodsGRef).current;
      if (list && gg) for (const pr of list) {
        const el = gg.children[pr.idx] as SVGGElement | undefined;
        if (el) el.setAttribute("transform", `translate(${(pr.x - v[0]) * k},${(pr.y - v[1]) * k}) rotate(${pr.a * 57.2958})`);
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
          r: cr.width / 2, // keep the circle's on-screen size on the next layer
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
    const doFall = async () => {
      if (fellRef.current) return;
      if (focusRef.current !== nodes[0]) return; // user already exploring
      const Matter = (await import("matter-js")) as any; // pit convention: dynamic, untyped
      if (fellRef.current || focusRef.current !== nodes[0]) return; // re-check across the await
      const { Engine, Bodies, Body: MBody, Composite, Events } = Matter;
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
      const worldH = vbHf / k;
      // svg units per screen px via the real screen transform: used for pit-
      // exact number sizing and for screen-sized UI objects
      const svgEl = st ? st.querySelector("svg") : null;
      const ctm0 = svgEl ? (svgEl as SVGSVGElement).getScreenCTM() : null;
      const fxScale = ctm0 && ctm0.a ? 1 / ctm0.a : vbHf / stageH;
      // ---- frozen drop-time transform: Matter bodies live in CLIENT PX ----
      // (the pit's native space, so every pit constant copies verbatim). World
      // coords stay the render currency: sync after each Engine.update, so
      // live zoom during physics keeps working.
      const CT = ctm0
        ? { a: ctm0.a, b: ctm0.b, c: ctm0.c, d: ctm0.d, e: ctm0.e, f: ctm0.f }
        : { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
      const det = CT.a * CT.d - CT.b * CT.c || 1;
      const vD0 = v[0], vD1 = v[1], kD = k;
      const pxFromWorld = (wx: number, wy: number) => {
        const ux = (wx - vD0) * kD, uy = (wy - vD1) * kD;
        return { x: CT.a * ux + CT.c * uy + CT.e, y: CT.b * ux + CT.d * uy + CT.f };
      };
      const worldFromPx = (px: number, py: number) => {
        const x0 = px - CT.e, y0 = py - CT.f;
        return { x: vD0 + (CT.d * x0 - CT.c * y0) / det / kD, y: vD1 + (-CT.b * x0 + CT.a * y0) / det / kD };
      };
      const pxPerWorld = Math.hypot(CT.a, CT.b) * kD || 1;
      const stagePxH = worldH * pxPerWorld;
      // old world-units-per-second speeds (in worldH multiples) -> px per 16.66ms step
      const vps = (x: number) => (stagePxH * x) / 60;

      type Body = { n: Node | null; x: number; y: number; vx: number; vy: number; r: number; pct: number; idx: number; lastFx: number; popped: boolean; a: number; va: number; ia: number; iva: number; held?: boolean; charges?: number; lastKnock?: number; inert?: boolean; mb?: any; mbIn?: boolean };
      const d1 = nodes.filter((n) => n.depth === 1);
      const pctOf = (n: Node) => (n.parent ? Math.round(((n.value ?? 0) / (n.parent.value || 1)) * 100) : 0);
      const bodies: Body[] = d1.map((n, i) => ({ n, x: n.x, y: n.y, vx: 0, vy: 0, r: n.r, pct: pctOf(n), idx: i, lastFx: 0, popped: false, a: 0, va: 0, ia: 0, iva: 0 }));
      if (bodies.length === 0) { setFalling(false); return; }
      // yellow % badges become small bodies, spawned at each circle's lower-right rim
      const BADGE_R = 46 / k;
      const badges: Body[] = d1.map((n, i) => ({
        n: null, x: n.x + n.r * 0.707, y: n.y + n.r * 0.707, vx: 0, vy: 0,
        r: BADGE_R, pct: pctOf(n), idx: i, lastFx: 0, popped: true, a: 0, va: 0, ia: 0, iva: 0, charges: 20,
      }));
      badgeBodiesRef.current = badges;

      // ---- Matter world ----
      const engine = Engine.create();
      engine.gravity.y = 1; // pit verbatim
      const world = engine.world;
      const CIRCLE_OPTS = { restitution: 0.78, friction: 0.1, frictionAir: 0.01, density: 0.001 }; // tennis-ball lively floor bounce
      const BADGE_OPTS = { restitution: 0.48, friction: 0.1, frictionAir: 0.01, density: 0.001 };
      const mkCircle = (b: Body, kind: string, opts: any) => {
        const p = pxFromWorld(b.x, b.y);
        const mb = Bodies.circle(p.x, p.y, Math.max(2, b.r * pxPerWorld), opts);
        mb.plugin = { bridge: b, kind };
        b.mb = mb; b.mbIn = true;
        Composite.add(world, mb);
        return mb;
      };
      for (const b of bodies) mkCircle(b, "circle", CIRCLE_OPTS);
      for (const b of badges) mkCircle(b, "badge", BADGE_OPTS);
      // walls and floor: thick statics, pit-style, in px space
      const T = 600;
      const pL = pxFromWorld(xL, yF), pR = pxFromWorld(xR, yF);
      const pTop = pxFromWorld(xL, v[1] - vbHf / k);
      const wPx = pR.x - pL.x;
      const sideH = (pL.y - pTop.y) + T * 4, sideC = pL.y + T * 2 - sideH / 2;
      const floorB = Bodies.rectangle(pL.x + wPx / 2, pL.y + T / 2, wPx + T * 2, T, { isStatic: true, restitution: 0.4 });
      floorB.plugin = { kind: "floor" };
      const wallL = Bodies.rectangle(pL.x - T / 2, sideC, T, sideH, { isStatic: true, restitution: 0.35 });
      const wallR = Bodies.rectangle(pR.x + T / 2, sideC, T, sideH, { isStatic: true, restitution: 0.35 });
      wallL.plugin = { kind: "wall" }; wallR.plugin = { kind: "wall" };
      Composite.add(world, [floorB, wallL, wallR]);

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
      for (const u of uiBodies as any[]) {
        const p = pxFromWorld(u.x, u.y);
        const um = Bodies.circle(p.x, p.y, Math.max(2, u.r * pxPerWorld), { isStatic: u.fixed, restitution: 0.3, frictionAir: 0.012, density: 0.0012 });
        um.plugin = { ui: u };
        u.mb = um;
        Composite.add(world, um);
      }

      const all = bodies.concat(badges);
      // nodes that have their own body: their subtrees no longer ride a parent
      const owned = new Set<Node>(bodies.map((b) => b.n as Node));
      pitBodiesRef.current = {
        find: (n: Node) => all.find((b) => b.n === n),
        owned,
      };
      const moveSubtree = (root: Node, dxm: number, dym: number) => {
        const stack: Node[] = [root];
        while (stack.length) {
          const d = stack.pop() as Node;
          d.x += dxm; d.y += dym;
          for (const ch of d.children ?? []) if (!owned.has(ch)) stack.push(ch);
        }
      };

      // ghost immunity: a fresh pop shares a negative collision group with its
      // parent so it escapes without an explosion; cleared on a 650ms timer
      let ghostSeq = 1;
      const ghostTimers: number[] = [];
      const ghost = (mbs: any[]) => {
        const g = -(ghostSeq++);
        for (const m of mbs) m.collisionFilter.group = g;
        ghostTimers.push(window.setTimeout(() => {
          for (const m of mbs) if (m.collisionFilter.group === g) m.collisionFilter.group = 0;
        }, 650));
      };

      // First solid hit pops a circle's direct children out as their own
      // bodies (their subtrees riding along), inheriting some momentum plus
      // an upward-outward burst; each child brings its yellow % badge.
      const popChildren = (b: Body) => {
        if (!b.n || b.popped) return;
        b.popped = true;
        const newMbs: any[] = b.mb ? [b.mb] : [];
        for (const ch of b.n.children ?? []) {
          const nb: Body = { n: ch, x: ch.x, y: ch.y, vx: 0, vy: 0, r: ch.r, pct: pctOf(ch), idx: -1, lastFx: 0, popped: false, a: 0, va: 0, ia: 0, iva: 0 };
          owned.add(ch);
          all.push(nb);
          const mb = mkCircle(nb, "circle", CIRCLE_OPTS);
          MBody.setVelocity(mb, {
            x: (b.mb ? b.mb.velocity.x * 0.4 : 0) + (Math.random() - 0.5) * vps(0.7),
            y: (b.mb ? b.mb.velocity.y * 0.3 : 0) - vps(0.45 + Math.random() * 0.35),
          });
          MBody.setAngularVelocity(mb, (Math.random() - 0.5) * 0.8 / 60);
          newMbs.push(mb);
          const bl = badgeBodiesRef.current;
          if (bl) {
            const bb: Body = { n: null, x: ch.x + ch.r * 0.6, y: ch.y + ch.r * 0.6, vx: 0, vy: 0, r: BADGE_R, pct: pctOf(ch), idx: bl.length, lastFx: 0, popped: true, a: 0, va: 0, ia: 0, iva: 0, charges: 20 };
            bl.push(bb);
            all.push(bb);
            const mbb = mkCircle(bb, "badge", BADGE_OPTS);
            MBody.setVelocity(mbb, { x: mb.velocity.x * 0.8 + (Math.random() - 0.5) * vps(0.3), y: mb.velocity.y * 0.8 });
            newMbs.push(mbb);
            setBadgePcts((l) => [...l, bb.pct]);
          }
        }
        if (newMbs.length > 1) ghost(newMbs);
      };

      // rods (thin chamfered bars, lit yellow / unlit white, 2 knocks) and the
      // name pill (navy capsule, 3 knocks then gone) - pit props, verbatim specs
      const killProp = (pr: any, kind: string, now2: number) => {
        pr.dead = true;
        poofAt(pr.x, pr.y, now2);
        if (pr.mb) Composite.remove(world, pr.mb);
        (kind === "rod" ? setDeadRods : setDeadPills)((prev) => new Set(prev).add(pr.idx));
      };
      spawnRodRef.current = (x1: number, y1: number, x2: number, y2: number, lit: boolean) => {
        const lenPx = Math.max(10, Math.hypot(x2 - x1, y2 - y1));
        const ang = Math.atan2(y2 - y1, x2 - x1);
        const w = worldFromPx((x1 + x2) / 2, (y1 + y2) / 2);
        const pr = { x: w.x, y: w.y, vx: 0, vy: 0, a: ang, idx: rodBodiesRef.current.length, hits: 0, maxHits: 2, mb: null as any };
        const mb = Bodies.rectangle((x1 + x2) / 2, (y1 + y2) / 2, lenPx, 8, { chamfer: { radius: 4 }, restitution: 0.4, friction: 0.1, frictionAir: 0.01, density: 0.001, angle: ang });
        mb.plugin = { prop: pr, kind: "rod" };
        pr.mb = mb;
        Composite.add(world, mb);
        MBody.setVelocity(mb, { x: (Math.random() - 0.5) * 3, y: 3 }); // pit scatter contract
        rodBodiesRef.current.push(pr);
        setRodList((l) => [...l, { len: lenPx * fxScale, h: 8 * fxScale, lit }]);
        wake();
      };
      spawnPillRef.current = (sx: number, sy: number, wPx: number, name: string) => {
        const w = worldFromPx(sx, sy);
        // wrap long names: pill grows in depth, corner radius stays 13px so the
        // capsule shape never changes; width hugs the longest line at 12px text
        const lines = (() => {
          if (name.length <= 16) return [name];
          const mid = Math.floor(name.length / 2);
          let best = -1;
          for (let i = 0; i < name.length; i++) if (name[i] === " " && (best === -1 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
          return best === -1 ? [name] : [name.slice(0, best), name.slice(best + 1)];
        })();
        const pw = Math.max(44, Math.max(...lines.map((l) => l.length)) * 7.4 + 22 + (lines.length > 1 ? 10 : 0));
        const ph = lines.length > 1 ? 46 : 26;
        const pr = { x: w.x, y: w.y, vx: 0, vy: 0, a: 0, idx: pillBodiesRef.current.length, hits: 0, maxHits: 3, mb: null as any };
        const mb = Bodies.rectangle(sx, sy, pw, ph, { chamfer: { radius: ph / 2 }, restitution: 0.3, friction: 0.1, frictionAir: 0.012, density: 0.0012 });
        mb.plugin = { prop: pr, kind: "pill" };
        pr.mb = mb;
        Composite.add(world, mb);
        MBody.setVelocity(mb, { x: (Math.random() - 0.5) * 3, y: 3 });
        pillBodiesRef.current.push(pr);
        setPillList((l) => [...l, { lines, w: pw * fxScale, h: ph * fxScale, rx: 13 * fxScale }]);
        wake();
      };
      spawnBadgeRef.current = (sx: number, sy: number, rPx: number, pctVal: number) => {
        // client px in, which is the physics space itself now
        const bl = badgeBodiesRef.current;
        if (!bl) return;
        const w = worldFromPx(sx, sy);
        const nb: Body = { n: null, x: w.x, y: w.y, vx: 0, vy: 0, r: 46 / kD, pct: pctVal, idx: bl.length, lastFx: 0, popped: true, a: 0, va: 0, ia: 0, iva: 0, charges: 20 };
        bl.push(nb);
        all.push(nb);
        const mb = mkCircle(nb, "badge", BADGE_OPTS);
        MBody.setVelocity(mb, { x: (Math.random() - 0.5) * 3, y: 3 }); // pit scatter contract, verbatim
        setBadgePcts((l) => [...l, pctVal]);
        wake();
      };

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
        if (rv < 5) return; // pit onPctHit verbatim: a real knock, not a nudge
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
      const FX_MIN_PS = vps(0.05); // minimum impact speed to flash, px/step
      const isDragged = (b: unknown) => dragRef.current?.body === b;

      // collisions drive everything the walls-and-passes loop used to:
      // number flashes, cascade pops, badge knocks, menu-button sink/tilt
      const onCollide = (ev: any) => {
        const now = performance.now();
        for (const pair of ev.pairs) {
          const A = pair.bodyA, B = pair.bodyB;
          const pa = A.plugin || {}, pb2 = B.plugin || {};
          const nrm = pair.collision.normal;
          const rv = Math.abs((B.velocity.x - A.velocity.x) * nrm.x + (B.velocity.y - A.velocity.y) * nrm.y);
          let flashed = false;
          const hitSide = (P: any, otherMb: any) => {
            const b: Body | undefined = P.bridge;
            if (!b || b.held) return;
            if (!flashed && !b.inert && rv > FX_MIN_PS && now - b.lastFx > FX_COOLDOWN) {
              const c = (pair.collision.supports && pair.collision.supports[0]) || (b.mb ? b.mb.position : null);
              if (c) {
                const w = worldFromPx(c.x, c.y);
                numAt(w.x, w.y, b.pct, now);
                b.lastFx = now;
                flashed = true;
              }
            }
            if (rv > FX_MIN_PS * 0.6) popChildren(b);
            if (!otherMb.isStatic) knockBadge(b, rv, now); // statics do not count, pit rule
          };
          hitSide(pa, B);
          hitSide(pb2, A);
          for (const [P, other] of [[pa, B], [pb2, A]] as any[]) {
            const pr = P.prop;
            if (!pr || pr.dead || other.isStatic || rv < 5) continue;
            if (pr.lastKnock && now - pr.lastKnock < 600) continue;
            pr.lastKnock = now;
            pr.hits += 1;
            if (pr.hits >= pr.maxHits) killProp(pr, P.kind, now);
          }
          for (const [P] of [[pa], [pb2]] as any[]) {
            if (P.ui && P.ui.fixed && rv > FX_MIN_PS * 0.3) {
              const u = P.ui;
              u.hits += 1;
              if (u.hits >= 5) {
                u.fixed = false;
                MBody.setStatic(u.mb, false);
                MBody.setAngularVelocity(u.mb, (Math.random() - 0.5) * 2 / 60);
              } else {
                u.y += 12 * uppW; // sink a notch and tip
                u.a += 0.09;
                MBody.setPosition(u.mb, pxFromWorld(u.x, u.y));
                MBody.setAngle(u.mb, u.a);
              }
            }
          }
        }
      };
      Events.on(engine, "collisionStart", onCollide);

      // ---- fixed-timestep loop (same clock discipline as the main pit):
      // accumulate real time, step in exact 16.66ms slices, settle-aware ----
      const STEP = 1000 / 60, MAX_ACC = 100;
      let acc = 0;
      let lastT: number | null = null;
      let started = performance.now();
      let stillFrames = 0;
      const SETTLE_PS = vps(0.012);
      const step = (nowRaf: number) => {
        const now = performance.now();
        if (lastT === null) lastT = nowRaf;
        acc += Math.max(0, nowRaf - lastT);
        lastT = nowRaf;
        if (acc > MAX_ACC) acc = MAX_ACC;
        let stepped = 0;
        while (acc >= STEP) {
          // a dragged body is pointer-driven: push bridge -> Matter before each slice
          const d: any = dragRef.current;
          const db: any = d && d.body;
          if (db && db.mb && db.mbIn) {
            MBody.setPosition(db.mb, pxFromWorld(db.x, db.y));
            MBody.setVelocity(db.mb, { x: (db.vx * pxPerWorld) / 60, y: (db.vy * pxPerWorld) / 60 });
          }
          Engine.update(engine, STEP);
          acc -= STEP;
          stepped++;
        }
        const dt = Math.max(0.004, Math.min(0.032, (stepped * STEP) / 1000 || 0.0166));
        // held bodies leave the world; released ones drop back in where lifted
        for (const b of all) {
          if (!b.mb) continue;
          if (b.held && b.mbIn) { Composite.remove(world, b.mb); b.mbIn = false; }
          else if (!b.held && !b.mbIn) {
            MBody.setPosition(b.mb, pxFromWorld(b.x, b.y));
            MBody.setVelocity(b.mb, { x: 0, y: 0 });
            Composite.add(world, b.mb);
            b.mbIn = true;
          }
        }
        let still = !dragRef.current;
        for (const b of all) {
          if (b.held) continue;
          if (b.mb && b.mbIn && !isDragged(b)) {
            const w = worldFromPx(b.mb.position.x, b.mb.position.y);
            b.x = w.x; b.y = w.y;
            b.a = b.n ? b.mb.angle : 0; // badges stay upright, pit-style
            b.vx = (b.mb.velocity.x * 60) / pxPerWorld;
            b.vy = (b.mb.velocity.y * 60) / pxPerWorld;
          }
          // the image inside lags its circle like water in a bowl: an
          // underdamped spring chases the body angle, overshoots, sloshes,
          // and settles a beat after the circle itself has stopped
          const sacc = (b.a - b.ia) * 16 - b.iva * 3.2;
          b.iva += sacc * dt;
          b.ia += b.iva * dt;
          if (b.n) {
            const dxm = b.x - b.n.x, dym = b.y - b.n.y;
            if (dxm || dym) moveSubtree(b.n, dxm, dym);
          }
          if (b.mb && b.mbIn && b.mb.speed > SETTLE_PS) still = false;
        }
        for (const list of [rodBodiesRef.current, pillBodiesRef.current]) {
          for (const pr of list) {
            if (pr.dead || !pr.mb) continue;
            if (!isDragged(pr)) {
              const w = worldFromPx(pr.mb.position.x, pr.mb.position.y);
              pr.x = w.x; pr.y = w.y; pr.a = pr.mb.angle;
              pr.vx = (pr.mb.velocity.x * 60) / pxPerWorld;
              pr.vy = (pr.mb.velocity.y * 60) / pxPerWorld;
            } else {
              MBody.setPosition(pr.mb, pxFromWorld(pr.x, pr.y));
              MBody.setVelocity(pr.mb, { x: (pr.vx * pxPerWorld) / 60, y: (pr.vy * pxPerWorld) / 60 });
            }
            if (pr.mb.speed > SETTLE_PS) still = false;
          }
        }
        const uis = uiBodiesRef.current as any[] | null;
        if (uis) for (const u of uis) {
          if (!u.fixed && u.mb) {
            if (!isDragged(u)) {
              const w = worldFromPx(u.mb.position.x, u.mb.position.y);
              u.x = w.x; u.y = w.y; u.a = u.mb.angle;
              u.vx = (u.mb.velocity.x * 60) / pxPerWorld;
              u.vy = (u.mb.velocity.y * 60) / pxPerWorld;
            } else {
              MBody.setPosition(u.mb, pxFromWorld(u.x, u.y));
              MBody.setVelocity(u.mb, { x: (u.vx * pxPerWorld) / 60, y: (u.vy * pxPerWorld) / 60 });
            }
            if (u.mb.speed > SETTLE_PS) still = false;
          }
        }
        // spin the circle images with their bodies (pattern rotation about the
        // centre); badges stay upright like the pit's % chips
        if (svgEl) {
          for (const b of all) {
            if (!b.n || Math.abs(b.ia) < 0.001) continue;
            const i = nodes.indexOf(b.n);
            const pat = (svgEl as SVGSVGElement).querySelector(`#bt-img-${i}`);
            if (pat) pat.setAttribute("patternTransform", `rotate(${b.ia * 57.2958} 0.5 0.5)`);
          }
        }
        zoomTo(viewRef.current);
        drawNumbers(now, viewRef.current);
        // pit-full: settled bodies whose tops reach the spawn zone, pit-style
        if (!fullTriggeredRef.current && now - started > 4000) {
          const zoneY = v[1] + (-vbHf / 2 + 150 * uppW) / k;
          let inZone = 0;
          for (const b of all) {
            if (b.held) continue;
            if (Math.hypot(b.vx, b.vy) > worldH * 0.03) continue;
            if (b.y - b.r < zoneY) inZone++;
          }
          if (inZone >= 5) {
            fullTriggeredRef.current = true;
            runCountdown();
          }
        }
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
        lastT = null;
        started = performance.now(); // fresh time budget each wake
        fallRafRef.current = requestAnimationFrame(step);
      };
      // Shake: pit-style jolt of everything in the mini pit (pit velocities, verbatim px/step).
      shakeInnerRef.current = () => {
        for (const b of all) if (b.mb && b.mbIn && !b.held) {
          MBody.setVelocity(b.mb, { x: (Math.random() - 0.5) * 18, y: -(8 + Math.random() * 14) });
        }
        const uu = uiBodiesRef.current as any[] | null;
        if (uu) for (const u of uu) if (!u.fixed && u.mb) {
          MBody.setVelocity(u.mb, { x: (Math.random() - 0.5) * 16, y: -(7 + Math.random() * 12) });
        }
        for (const list of [rodBodiesRef.current, pillBodiesRef.current]) {
          for (const pr of list) if (!pr.dead && pr.mb) MBody.setVelocity(pr.mb, { x: (Math.random() - 0.5) * 16, y: -(7 + Math.random() * 12) });
        }
        wake();
      };
      wakeRef.current = wake;
      matterCleanupRef.current = () => {
        Events.off(engine, "collisionStart", onCollide);
        for (const t of ghostTimers) window.clearTimeout(t);
        Composite.clear(engine.world, false);
        Engine.clear(engine);
      };
      wake();
    };
    runFallRef.current = doFall;
    registerShake?.(() => {
      if (!fellRef.current) runFallRef.current?.();
      shakeInnerRef.current?.();
    });
    const timer = window.setTimeout(doFall, 2000);
    return () => { window.clearTimeout(timer); cancelAnimationFrame(fallRafRef.current); matterCleanupRef.current?.(); matterCleanupRef.current = null; };
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
                  {pct !== null && !(dockAside && d.depth === 1) && (
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
          <g ref={badgesRef} style={{ display: dockAside ? "inline" : "none" }} textAnchor="middle">
            {badgePcts.map((pct, i) => {
              const v = viewRef.current;
              const kk = SIZE / v[2];
              const b = badgeBodiesRef.current?.[i];
              const d1n = nodes.filter((n) => n.depth === 1)[i];
              const bx = b ? b.x : d1n ? d1n.x + d1n.r * 0.707 : v[0];
              const by = b ? b.y : d1n ? d1n.y + d1n.r * 0.707 : v[1] - 99999;
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

          {/* Rods and name pills scattered in from the learn layer: true pit
              props with hit limits; dead ones keep their slot, hidden. */}
          <g ref={rodsGRef} style={{ display: dockAside ? "inline" : "none" }}>
            {rodList.map((rd, i2) => {
              const pr = rodBodiesRef.current[i2];
              const v2 = viewRef.current;
              const kk2 = SIZE / v2[2];
              const dead = deadRods.has(i2);
              return (
                <g key={i2} transform={pr ? `translate(${(pr.x - v2[0]) * kk2},${(pr.y - v2[1]) * kk2}) rotate(${pr.a * 57.2958})` : undefined}
                  style={{ display: dead ? "none" : undefined, cursor: "grab", pointerEvents: dead ? "none" : "auto", userSelect: "none" }}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => startDrag(e, rodBodiesRef.current[i2])}>
                  <rect x={-rd.len / 2} y={-rd.h / 2} width={rd.len} height={rd.h} rx={rd.h / 2}
                    style={{ fill: rd.lit ? "#ffd23e" : "#ffffff", stroke: "#0a3a57", strokeWidth: rd.h * 0.22 }} />
                </g>
              );
            })}
          </g>
          <g ref={pillsGRef} style={{ display: dockAside ? "inline" : "none" }} textAnchor="middle">
            {pillList.map((pl, i2) => {
              const pr = pillBodiesRef.current[i2];
              const v2 = viewRef.current;
              const kk2 = SIZE / v2[2];
              const dead = deadPills.has(i2);
              return (
                <g key={i2} transform={pr ? `translate(${(pr.x - v2[0]) * kk2},${(pr.y - v2[1]) * kk2}) rotate(${pr.a * 57.2958})` : undefined}
                  style={{ display: dead ? "none" : undefined, cursor: "grab", pointerEvents: dead ? "none" : "auto", userSelect: "none" }}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => startDrag(e, pillBodiesRef.current[i2])}>
                  <rect x={-pl.w / 2} y={-pl.h / 2} width={pl.w} height={pl.h} rx={pl.h / 2}
                    style={{ fill: "#0a3a57", stroke: "rgba(255,255,255,0.85)", strokeWidth: pl.rx * 0.154 }} />
                  {pl.lines.map((ln, li) => (
                    <text key={li} x={0} y={pl.lines.length > 1 ? (li === 0 ? -pl.rx * 0.77 : pl.rx * 0.77) : 0} dominantBaseline="central"
                      style={{ fill: "#ffffff", fontFamily: "Montserrat, var(--font-body), system-ui, sans-serif", fontWeight: 700, fontSize: `${pl.rx * 0.92}px`, pointerEvents: "none", userSelect: "none" }}>
                      {ln}
                    </text>
                  ))}
                </g>
              );
            })}
          </g>

          {/* Collision number flashes, appended imperatively by the sim. */}
          <g ref={fxRef} style={{ pointerEvents: "none" }} />

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
          rootRadius={learnCard.r}
          currentScore={0}
          onScore={onScore}
          onRemove={(name) => {
            // learnt: the circle leaves the pit for good
            if (learnNode && name === learnNode.data.name) {
              removedNodesRef.current.add(learnNode);
              const owned = pitBodiesRef.current?.owned;
              if (owned && [...owned].every((n) => removedNodesRef.current.has(n))) {
                window.setTimeout(() => onRoundWon?.(), 700); // after the poof lands
              }
            }
          }}
          onScatter={(data) => {
            // the learnt % circles, their rods and the name pill tip into the
            // pit as live objects at the very instant the layer drops them
            for (const c of data.circles ?? []) {
              spawnBadgeRef.current?.(c.x, c.y, c.r, Math.round(c.share));
            }
            for (const rd of data.rods ?? []) {
              spawnRodRef.current?.(rd.x1, rd.y1, rd.x2, rd.y2, !!rd.lit);
            }
            for (const pl of data.pills ?? []) {
              spawnPillRef.current?.(pl.x, pl.y, pl.w, pl.name);
            }
            wakeRef.current?.();
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
