"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { hierarchy, pack, packSiblings, packEnclose, type HierarchyCircularNode } from "d3-hierarchy";
import { interpolateZoom } from "d3-interpolate";
import type { LineageNode } from "../../data/lineage";
import { bust } from "../../data/imgVersion";
import { breedInfo } from "../../data/breedInfo";
import styles from "./BreedTree.module.css";

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
  tinted = true,
  namePill = false,
  onShownChange,
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
  tinted?: boolean;
  namePill?: boolean;
  onShownChange?: (name: string) => void;
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
      pillRef.current.setAttribute("transform", `translate(${(pb.x - v[0]) * k},${(pb.y - v[1]) * k})`);
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
    cancelAnimationFrame(fallRafRef.current);
    setFalling(false);
    focusRef.current = d;
    setFocus(d);
    onActiveChange?.(d !== nodes[0]);
    const target: View = [d.x, d.y, d.r * 2 * (isMobileRef.current ? PAD : ZOOM_PAD)];
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

    const v: View = [nodes[0].x, nodes[0].y, nodes[0].r * 2 * (isMobile ? PAD : ZOOM_PAD)];
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
    const timer = window.setTimeout(() => {
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
      const M = 14; // margin inside the frame, svg units
      const xL = v[0] + (xMinF + M) / k;
      const xR = v[0] + (xMinF + vbWf - M) / k;
      const yF = v[1] + (vbHf / 2 - M) / k;
      const yF0 = yF;
      const worldH = vbHf / k;
      type Body = { n: Node | null; x: number; y: number; vx: number; vy: number; r: number; pct: number; idx: number; lastFx: number; popped: boolean; ghosts: Set<Body> };
      const d1 = nodes.filter((n) => n.depth === 1);
      const pctOf = (n: Node) => (n.parent ? Math.round(((n.value ?? 0) / (n.parent.value || 1)) * 100) : 0);
      const bodies: Body[] = d1.map((n, i) => ({ n, x: n.x, y: n.y, vx: 0, vy: 0, r: n.r, pct: pctOf(n), idx: i, lastFx: 0, popped: false, ghosts: new Set<Body>() }));
      if (bodies.length === 0) { setFalling(false); return; }
      // yellow % badges become small bodies, spawned at each circle's lower-right rim
      const BADGE_R = 38 / k;
      const badges: Body[] = d1.map((n, i) => ({
        n: null, x: n.x + n.r * 0.6, y: n.y + n.r * 0.6, vx: 0, vy: 0,
        r: BADGE_R, pct: pctOf(n), idx: i, lastFx: 0, popped: true, ghosts: new Set<Body>(),
      }));
      badgeBodiesRef.current = badges;
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
            ghosts: new Set<Body>(),
          };
          for (const other of all) if (other.n && ch.ancestors().includes(other.n)) nb.ghosts.add(other);
          owned.add(ch);
          all.push(nb);
        }
      };
      const G = worldH * 2.4; // per s^2
      const REST = 0.48;
      const WALL_REST = 0.35;
      // little white numbers that flash up on a hit, copied from PackPit:
      // 650ms life, alpha 1-t, rising 22 + t*34, weight 400, --font-pct
      const fxScale = vbHf / stageH; // svg units per screen px, so sizes match the pit
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
      };
      const FX_LIFE = 650;
      const drawNumbers = (now: number, view: View) => {
        const kk = SIZE / view[2];
        for (let i = numbers.length - 1; i >= 0; i--) {
          const n = numbers[i];
          const t = (now - n.born) / FX_LIFE;
          if (t >= 1) { n.el.remove(); numbers.splice(i, 1); continue; }
          n.el.setAttribute("x", String((n.x - view[0]) * kk));
          n.el.setAttribute("y", String((n.y - view[1]) * kk - (22 + t * 34) * fxScale));
          n.el.style.opacity = String(1 - t);
        }
      };
      const FX_COOLDOWN = 220;
      const FX_MIN = worldH * 0.05; // minimum impact speed to flash
      let last = performance.now();
      const started = last;
      const step = (now: number) => {
        const dt = Math.min(0.032, (now - last) / 1000);
        last = now;
        for (const b of all) {
          b.vy += G * dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          if (b.y + b.r > yF) {
            if (b.vy > FX_MIN && now - b.lastFx > FX_COOLDOWN) { numAt(b.x, yF - b.r, b.pct, now); b.lastFx = now; }
            const hitSpeed = b.vy;
            b.y = yF - b.r; b.vy = -b.vy * REST; b.vx *= 0.96;
            if (hitSpeed > FX_MIN * 0.6) popChildren(b);
          }
          if (b.x - b.r < xL) { b.x = xL + b.r; b.vx = -b.vx * WALL_REST; }
          if (b.x + b.r > xR) { b.x = xR - b.r; b.vx = -b.vx * WALL_REST; }
        }
        for (let i = 0; i < all.length; i++) {
          for (let j = i + 1; j < all.length; j++) {
            const a = all[i], c = all[j];
            const dx = c.x - a.x, dy = c.y - a.y;
            const dist = Math.hypot(dx, dy) || 0.001;
            if (a.ghosts.has(c) || c.ghosts.has(a)) {
              if (dist >= a.r + c.r) { a.ghosts.delete(c); c.ghosts.delete(a); }
              continue;
            }
            const overlap = a.r + c.r - dist;
            if (overlap > 0) {
              const nx = dx / dist, ny = dy / dist;
              const ma = a.r * a.r, mc = c.r * c.r, mt = ma + mc;
              a.x -= nx * overlap * (mc / mt); a.y -= ny * overlap * (mc / mt);
              c.x += nx * overlap * (ma / mt); c.y += ny * overlap * (ma / mt);
              const rel = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
              if (rel < 0) {
                if (-rel > FX_MIN && now - a.lastFx > FX_COOLDOWN) {
                  const cx = a.x + nx * a.r, cy = a.y + ny * a.r;
                  numAt(cx, cy, a.pct, now);
                  a.lastFx = now; c.lastFx = now;
                }
                const imp = (-(1 + REST) * rel) / (1 / ma + 1 / mc);
                a.vx -= (imp / ma) * nx; a.vy -= (imp / ma) * ny;
                c.vx += (imp / mc) * nx; c.vy += (imp / mc) * ny;
              }
            }
          }
        }
        // name pill: capsule vs every ball; static until its first hit
        const pill = pillBodyRef.current;
        if (pill) {
          const prW = pill.pr / k;
          const LW = pill.L / k;
          if (!pill.stuck) {
            pill.vy += G * dt;
            pill.x += pill.vx * dt;
            pill.y += pill.vy * dt;
            if (pill.y + prW > yF) { pill.y = yF - prW; pill.vy = -pill.vy * REST; pill.vx *= 0.94; }
            if (pill.x - LW - prW < xL) { pill.x = xL + LW + prW; pill.vx = -pill.vx * WALL_REST; }
            if (pill.x + LW + prW > xR) { pill.x = xR - LW - prW; pill.vx = -pill.vx * WALL_REST; }
          }
          const mp = prW * (LW + prW) * 2.5; // heavier than it looks, so it is not batted about
          for (const b of all) {
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
                if (rel < 0) { b.vx -= (1 + REST) * rel * nx; b.vy -= (1 + REST) * rel * ny; }
                if (now - b.lastFx > FX_COOLDOWN) { numAt(cxp, pill.y - prW, b.pct, now); b.lastFx = now; }
                pill.stuck = false;
              } else {
                const mb = b.r * b.r, mt = mb + mp;
                b.x += nx * overlap * (mp / mt); b.y += ny * overlap * (mp / mt);
                pill.x -= nx * overlap * (mb / mt); pill.y -= ny * overlap * (mb / mt);
                const rel = (b.vx - pill.vx) * nx + (b.vy - pill.vy) * ny;
                if (rel < 0) {
                  const imp = (-(1 + REST) * rel) / (1 / mb + 1 / mp);
                  b.vx += (imp / mb) * nx; b.vy += (imp / mb) * ny;
                  pill.vx -= (imp / mp) * nx; pill.vy -= (imp / mp) * ny;
                }
              }
            }
          }
        }
        let still = true;
        if (pill && !pill.stuck && Math.hypot(pill.vx, pill.vy) > worldH * 0.012) still = false;
        for (const b of all) {
          if (b.n) {
            const dxm = b.x - b.n.x, dym = b.y - b.n.y;
            if (dxm || dym) moveSubtree(b.n, dxm, dym);
          }
          const sp = Math.hypot(b.vx, b.vy);
          const cap = worldH * 2.5;
          if (sp > cap) { b.vx *= cap / sp; b.vy *= cap / sp; }
          const onFloorish = b.y + b.r > yF - worldH * 0.02;
          if (Math.hypot(b.vx, b.vy) > worldH * 0.012 || !onFloorish) still = false;
        }
        zoomTo(viewRef.current);
        drawNumbers(now, viewRef.current);
        if ((!still || numbers.length > 0) && now - started < 9000) {
          fallRafRef.current = requestAnimationFrame(step);
        } else {
          numbers.forEach((n) => n.el.remove());
          numbers.length = 0;
          setFalling(false);
        }
      };
      fallRafRef.current = requestAnimationFrame(step);
    }, 2000);
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
  const buriedSet = hovered ? new Set(hovered.descendants()) : null;

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
              const buried = !!buriedSet && d !== hovered && buriedSet.has(d);
              return (
                <circle
                  key={i}
                  className={cls}
                  fill={hidden ? "none" : nodeImg(d) ? `url(#bt-img-${i})` : fillFor(d)}
                  stroke={hidden ? "none" : stroke}
                  strokeWidth={hidden ? 0 : strokeWidthFor(d)}
                  style={{
                    cursor: hidden ? "default" : "pointer",
                    pointerEvents: hidden || falling ? "none" : "auto",
                    opacity: buried ? 0 : undefined,
                  }}
                  onMouseEnter={hidden ? undefined : () => setHovered(d)}
                  onMouseLeave={hidden ? undefined : () => setHovered((h) => (h === d ? null : h))}
                  onClick={disableZoom ? undefined : (e) => onCircle(e, d)}
                />
              );
            })}
          </g>

          <g ref={labelsRef} textAnchor="middle" style={{ fontFamily: "var(--font-body), system-ui, sans-serif", opacity: hideLabels ? 0 : entered ? 1 : 0, transition: "opacity 0.3s ease", pointerEvents: hideLabels ? "none" : "auto" }}>
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
                      style={{ fill: "#ffffff", fontFamily: "var(--font-display), system-ui, sans-serif", fontSize: isMobile ? "51px" : "17px", letterSpacing: "0.5px" }}
                    >
                      {d.data.name.toUpperCase()}
                    </text>
                  )}
                  {pct !== null && !(dropped && d.depth === 1) && (
                    <g>
                      <circle cx={0} cy={50} r={38} style={{ fill: "var(--yellow)", stroke: "var(--navy)", strokeWidth: 3 }} />
                      <text x={0} y={50} dominantBaseline="central" style={{ fill: "var(--navy)", fontFamily: "var(--font-body), system-ui, sans-serif", fontWeight: 800, fontSize: "26px" }}>
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
          <g ref={badgesRef} style={{ display: dropped ? "inline" : "none", pointerEvents: "none" }} textAnchor="middle">
            {nodes.filter((n) => n.depth === 1).map((d, i) => {
              const v = viewRef.current;
              const kk = SIZE / v[2];
              const b = badgeBodiesRef.current?.[i];
              const bx = b ? b.x : d.x + d.r * 0.6;
              const by = b ? b.y : d.y + d.r * 0.6;
              return (
              <g key={i} transform={`translate(${(bx - v[0]) * kk},${(by - v[1]) * kk})`}>
                <circle cx={0} cy={0} r={38} style={{ fill: "var(--yellow)", stroke: "var(--navy)", strokeWidth: 3 }} />
                <text x={0} y={0} dominantBaseline="central" style={{ fill: "var(--navy)", fontFamily: "var(--font-body), system-ui, sans-serif", fontWeight: 800, fontSize: "26px" }}>
                  {`${d.parent ? Math.round(((d.value ?? 0) / (d.parent.value || 1)) * 100) : 0}%`}
                </text>
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
            const label = shown.data.name.toUpperCase();
            const fs = 30;
            const pr = 27;
            const L = Math.max(50, (label.length * fs * 0.34) / 2);
            const pb = pillBodyRef.current;
            if (pb) { pb.L = L; pb.pr = pr; }
            const vbWr = aspect >= 1 ? SIZE * aspect : SIZE;
            const vbHr = aspect >= 1 ? SIZE : SIZE / aspect;
            const xMinR = aspect >= 1 ? -vbWr * shift : -vbWr / 2;
            const wx = pb ? pb.x : v[0] + (xMinR + vbWr / 2) / kk;
            const wy = pb ? pb.y : v[1] + (vbHr / 2 - 14) / kk - pr / kk;
            return (
              <g ref={pillRef} transform={`translate(${(wx - v[0]) * kk},${(wy - v[1]) * kk})`} style={{ pointerEvents: "none" }}>
                <rect x={-L - pr} y={-pr} width={(L + pr) * 2} height={pr * 2} rx={pr}
                  style={{ fill: "var(--blue-sky, #5cc4ee)", stroke: "var(--navy)", strokeWidth: 3 }} />
                <text x={0} y={0} textAnchor="middle" dominantBaseline="central"
                  style={{ fill: "var(--navy)", fontFamily: "var(--font-display), system-ui, sans-serif", fontSize: `${fs}px`, letterSpacing: "1px" }}>
                  {label}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      <div className={`${styles.aside}${dockAside ? " " + styles.asideDocked : ""}`} style={{ position: "relative" }}>
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
            {breedInfo[shown.data.name] || (shown.depth === 0 && rootNote ? rootNote : shown.data.note)}
            {shown.children ? " Tap a circle inside to keep digging." : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
