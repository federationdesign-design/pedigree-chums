"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getLineage, type LineageNode } from "../../data/lineage";
import { bust } from "../../data/imgVersion";
import { ukBreeds } from "../../data/uk-breeds";
import styles from "./LineageMap.module.css";

type BreedTag = "extinct" | "trending" | "popular" | "endangered" | "in-decline";
// Same status colours as the history page.
const TAG_STYLE: Record<BreedTag, { bg: string; fg: string; label: string }> = {
  extinct: { bg: "#d64545", fg: "#ffffff", label: "Extinct" },
  trending: { bg: "#2e9e5b", fg: "#ffffff", label: "Trending" },
  popular: { bg: "#4ade80", fg: "#0a3a57", label: "Popular" },
  endangered: { bg: "#ff7a3c", fg: "#ffffff", label: "Endangered" },
  "in-decline": { bg: "#ffb02e", fg: "#0a3a57", label: "In decline" },
};
// Progenitor breeds whose names do not line up with the history tag list but are
// documented extinct types. Extend this as needed.
const PROGENITOR_STATUS: Record<string, BreedTag> = {
  "Talbot hound": "extinct",
  "Talbot hounds": "extinct",
  "St Hubert Hound": "extinct",
  "Old scenting hounds": "extinct",
  "Old English Black and Tan Terrier": "extinct",
  "White English Terrier": "extinct",
  "Old English White Terrier": "extinct",
  "English White Terrier": "extinct",
};
// Work out a breed's state from its note, falling back to the history tag list.
function nodeStatus(name: string, note: string): BreedTag | null {
  const n = (note || "").toLowerCase();
  if (n.includes("extinct")) return "extinct";
  if (n.includes("in decline") || n.includes("declining")) return "in-decline";
  if (n.includes("endangered") || n.includes("vulnerable")) return "endangered";
  if (PROGENITOR_STATUS[name]) return PROGENITOR_STATUS[name];
  const uk = ukBreeds.find((b) => b.name === name);
  return (uk?.tag as BreedTag) ?? null;
}
// living breeds carry one of the active tags; everything else (extinct tag or no
// tag at all, e.g. old landrace "stock") counts as gone, matching the pack split
const ALIVE_TAGS = new Set<BreedTag>(["trending", "popular", "endangered", "in-decline"]);
const isAlive = (s: BreedTag | null) => !!s && ALIVE_TAGS.has(s);

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
const CARD = 110;
// every white flash number is this small, fixed size, matching the pit; it never
// scales with the circle that was tapped
const FLASH_SIZE = 15;
// the popped breed cards lean only slightly, capped at this angle (2 degrees)
const CARD_TILT = (2 * Math.PI) / 180;

function sumLeaves(n: LineageNode): number {
  const c = n.children || [];
  return c.length ? c.reduce((s, x) => s + sumLeaves(x), 0) : n.value ?? 0;
}
// every node nested below this one, not just the direct children, so the
// "inside" badge reflects the true depth of the branch
function countProgenitors(n: LineageNode): number {
  const c = n.children || [];
  return c.reduce((s, x) => s + 1 + countProgenitors(x), 0);
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
  onRemove,
  onScatter,
  onScore,
}: {
  breed: { name: string; image: string; x: number; y: number; angle: number };
  onClose: () => void;
  onRemove?: (name: string) => void;
  onScatter?: (circles: { x: number; y: number; r: number; share: number; name: string }[]) => void;
  onScore?: (v: number) => void;
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
  const [picked, setPicked] = useState<Set<string>>(() => new Set());
  useEffect(() => setPicked(new Set()), [breed.name]);
  // pan offset so the whole diagram can be dragged to reveal off-screen parts
  const [pan, setPan] = useState({ x: 0, y: 0 });
  useEffect(() => setPan({ x: 0, y: 0 }), [breed.name]);
  const drag = useRef<{ id: number; sx: number; sy: number; px: number; py: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  // custom drop positions for popped-out progenitor cards; drag to reposition,
  // they stay where dropped until the breed changes or the map closes
  const [dragPos, setDragPos] = useState<Map<string, { x: number; y: number }>>(new Map());
  useEffect(() => setDragPos(new Map()), [breed.name]);
  const cardDrag = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);

  // a dragged card becomes "pinned": snapshot its art so it survives its branch
  // closing, and keep showing it at its dropped spot until breed change / close
  const [pinned, setPinned] = useState<Map<string, { img: string; name: string; share: number; mix: number; status: BreedTag | null }>>(new Map());
  useEffect(() => setPinned(new Map()), [breed.name]);

  // Dismiss a fixed/opened card (the X in its corner).
  const removeCard = (id: string) => {
    setPicked((cur) => { if (!cur.has(id)) return cur; const s = new Set(cur); s.delete(id); return s; });
    setPinned((m) => { if (!m.has(id)) return m; const x = new Map(m); x.delete(id); return x; });
    setDragPos((m) => { if (!m.has(id)) return m; const x = new Map(m); x.delete(id); return x; });
  };

  // the remove control appears 25s after opening, or as soon as the whole tree is
  // exposed. clicking it pops the card from the pit, then tips the circles in too.
  const [showRemove, setShowRemove] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [packed, setPacked] = useState(false); // the ancestor pack has been ordered into its two columns
  const [packLabels, setPackLabels] = useState<{ alive: { x: number; y: number } | null; extinct: { x: number; y: number } | null }>({ alive: null, extinct: null });
  const [packHidden, setPackHidden] = useState<Set<string>>(new Set()); // duplicate ancestors folded out of the pack
  const [collecting, setCollecting] = useState(false); // my chum tapped: every card tumbles into the bottom-left
  const [boxPop, setBoxPop] = useState(false); // the card-pack box flourish on collect
  const [collectT, setCollectT] = useState(0); // 0..1 progress of that tumble
  const collectRef = useRef<{ cards: Map<string, { x: number; y: number; spin: number }>; rootSpin: number } | null>(null);
  useEffect(() => { setPacked(false); setPackLabels({ alive: null, extinct: null }); setPackHidden(new Set()); setCollecting(false); setCollectT(0); setBoxPop(false); collectRef.current = null; }, [breed.name]);
  // little white numbers that flash up when a node or the chum button is tapped
  const [flashes, setFlashes] = useState<{ id: number; x: number; y: number; val: number; size: number }[]>([]);
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number; s: number; born: number }[]>([]);
  const [seen, setSeen] = useState<Set<string>>(new Set()); // circles tapped at least once, recoloured blue
  const fxId = useRef(0);
  const scoredRef = useRef<Set<string>>(new Set());
  const flashNum = (x: number, y: number, val: number, size: number) => {
    const id = (fxId.current += 1);
    setFlashes((f) => [...f, { id, x, y, val, size }]);
    onScore?.(val); // add this flash into the pit's running total
    window.setTimeout(() => setFlashes((f) => f.filter((n) => n.id !== id)), 650);
  };
  // Exact copy of the pit's pink starburst: twelve spokes plus five sparkle dots,
  // sized from the circle itself so the family tree reads the same as the pit.
  const burstAt = (x: number, y: number, s: number) => {
    const id = (fxId.current += 1);
    setBursts((b) => [...b, { id, x, y, s, born: performance.now() }]);
    window.setTimeout(() => setBursts((b) => b.filter((n) => n.id !== id)), 450);
  };
  // tick while a burst is alive so the spokes animate frame by frame, like the pit
  const [, setTick] = useState(0);
  // simple requestAnimationFrame tween, used to glide the cards into the pack and to
  // tumble them all into the corner; onStep gets eased 0..1, onDone fires at the end
  const tween = (dur: number, onStep: (t: number) => void, onDone?: () => void) => {
    const t0 = performance.now();
    const loop = () => {
      const t = Math.min(1, (performance.now() - t0) / dur);
      onStep(t);
      if (t < 1) requestAnimationFrame(loop); else onDone?.();
    };
    requestAnimationFrame(loop);
  };
  useEffect(() => {
    if (bursts.length === 0) return;
    let raf = 0;
    const loop = () => { setTick((n) => (n + 1) % 1e6); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [bursts.length]);
  useEffect(() => {
    setShowRemove(false);
    setRemoving(false);
    const t = setTimeout(() => setShowRemove(true), 15000);
    return () => clearTimeout(t);
  }, [breed.name]);
  // every non-root circle in the whole tree; the green button also appears once
  // all of them have been turned blue (opened), not just after the 15s timer
  const totalNodes = useMemo(() => {
    if (!root) return 0;
    let c = 0;
    const walk = (n: Node) => { (n.children as Node[] | undefined)?.forEach((k) => { c += 1; walk(k); }); };
    walk(root);
    return c;
  }, [root]);
  useEffect(() => {
    if (totalNodes > 0 && seen.size >= totalNodes) {
      const t = setTimeout(() => setShowRemove(true), 1000); // hold the green button back one second after the last circle turns blue
      return () => clearTimeout(t);
    }
  }, [seen, totalNodes]);

  const base = lean(breed.angle || 0);
  const cardLean = Math.max(-CARD_TILT, Math.min(CARD_TILT, base)); // breed cards tilt at most 2 degrees
  const rootStatus = nodeStatus(breed.name, ""); // status dot for the main breed card

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
    if (packed) return; // keep the ordered pack fixed under the icon
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
  // Cards to draw: nodes that are picked and currently live in the open tree,
  // plus any pinned (dragged) card, which persists even after its branch closes.
  // Keyed by id so a live card that gets dragged keeps the same element.
  const liveById = new Map(shown.filter((n) => n._parent && n.img).map((n) => [n._id, n as Node]));
  const cardIds = new Set<string>([
    ...[...picked].filter((id) => liveById.has(id)),
    ...pinned.keys(),
  ]);
  const pickCards = [...cardIds]
    .map((id) => {
      const live = liveById.get(id);
      const snap = pinned.get(id);
      const img = (live?.img ?? snap?.img) as string;
      const name = live?.name ?? snap?.name ?? "";
      const share = live ? Math.round((live._leaves / (live._parent as Node)._leaves) * 100) : snap?.share ?? 0;
      // cumulative share of the whole breed: a node's leaves over the root's leaves,
      // which is the product of every parent share down the chain
      const mix = live ? (root ? Math.round((live._leaves / root._leaves) * 100) : share) : (snap?.mix ?? snap?.share ?? 0);
      const status = live ? nodeStatus(live.name, live.note) : snap?.status ?? null;
      const r = radius(share);
      const d = r + 10 + CARD / 2;
      const baseX = live ? live._x + Math.cos(live._dir) * d : 0;
      const baseY = live ? live._y + Math.sin(live._dir) * d : 0;
      const pos = dragPos.get(id);
      const cardX = pos ? pos.x : baseX;
      const cardY = pos ? pos.y : baseY;
      return { id, img, name, share, mix, status, cardX, cardY };
    })
    .filter((c) => c.img);

  // The "Complete Ancestor Pack" cleanup. Once half the tree has been opened the
  // clipboard icon appears; tapping it gathers every open card to the top left,
  // split into the living and the long-gone, and awards a one-off 400 points.
  const PACK_LEFT = 96, PACK_COL = 128, PACK_ROW = 128; // tighter pitch for the 15%-smaller cards
  const showPack = packed || (totalNodes > 0 && seen.size * 2 >= totalNodes);
  // icon fades in with progress: half-transparent at 50% opened, fully white at 100%
  const packProgress = totalNodes > 0 ? Math.max(0.5, Math.min(1, seen.size / totalNodes)) : 0.5;
  const allBlue = totalNodes > 0 && seen.size >= totalNodes; // every circle ticked
  const complete = allBlue || packed; // swap to the green-tick icon and make it the obvious button
  const doPack = (fx?: number, fy?: number) => {
    if (packed) return;
    // One card per ancestor: the same forebear is often bred in several times, so
    // fold the repeats out and keep only the first of each in the pack.
    const seenKey = new Set<string>();
    const hidden = new Set<string>();
    const uniq: typeof pickCards = [];
    for (const c of pickCards) {
      const key = c.name || c.img;
      if (seenKey.has(key)) { hidden.add(c.id); continue; }
      seenKey.add(key);
      uniq.push(c);
    }
    const alive: typeof pickCards = [], extinct: typeof pickCards = [];
    for (const c of uniq) (isAlive(c.status) ? alive : extinct).push(c);
    // as many columns as comfortably fit the screen, so a deep tree's cards stay on screen
    const cols = Math.max(2, Math.min(6, Math.floor((vp.w - 120) / PACK_COL)));
    const targets = new Map<string, { x: number; y: number }>();
    const place = (arr: typeof pickCards, top: number) => {
      arr.forEach((c, i) => {
        const sx = PACK_LEFT + (i % cols) * PACK_COL;
        const sy = top + Math.floor(i / cols) * PACK_ROW;
        targets.set(c.id, { x: sx - pan.x, y: sy - pan.y }); // screen target, stored in user coords
      });
      return top + Math.ceil(arr.length / cols) * PACK_ROW;
    };
    let y = 150;
    const labels: { alive: { x: number; y: number } | null; extinct: { x: number; y: number } | null } = { alive: null, extinct: null };
    // header sits 40px higher than the card row so it clears the cancel buttons
    if (alive.length) { labels.alive = { x: PACK_LEFT - CARD / 2, y: y - 40 }; y = place(alive, y + 64) + 8; }
    if (extinct.length) { labels.extinct = { x: PACK_LEFT - CARD / 2, y: y - 40 }; place(extinct, y + 64); }
    // where each card sits right now, so we can glide it from there to its slot
    const starts = new Map<string, { x: number; y: number }>();
    uniq.forEach((c) => starts.set(c.id, { x: c.cardX, y: c.cardY }));
    setPackLabels(labels);
    setPackHidden(hidden);
    setPacked(true);
    flashNum(fx ?? (160 - pan.x), fy ?? (96 - pan.y), 400, FLASH_SIZE); // one-off award, fed into the pit total
    tween(460, (t) => {
      const e = 1 - Math.pow(1 - t, 3); // ease out
      setDragPos((prev) => {
        const m = new Map(prev);
        uniq.forEach((c) => {
          const s = starts.get(c.id), g = targets.get(c.id);
          if (s && g) m.set(c.id, { x: s.x + (g.x - s.x) * e, y: s.y + (g.y - s.y) * e });
        });
        return m;
      });
    }, () => {
      setDragPos((prev) => { const m = new Map(prev); targets.forEach((g, id) => m.set(id, g)); return m; });
    });
  };

  // fully exposed = every branch that has children is open, nothing left to unfold
  const canRemove = showRemove && !removing;

  const startRemove = () => {
    if (removing) return;
    // snapshot where every visible card is right now, plus a tumble spin for each,
    // so they can all fall into the bottom-right corner like the main square card
    const cards = new Map<string, { x: number; y: number; spin: number }>();
    pickCards.forEach((c) => {
      if (packed && packHidden.has(c.id)) return;
      cards.set(c.id, { x: c.cardX, y: c.cardY, spin: (Math.random() < 0.5 ? -1 : 1) * (200 + Math.random() * 160) });
    });
    collectRef.current = { cards, rootSpin: (Math.random() < 0.5 ? -1 : 1) * 220 };
    setRemoving(true);
    setCollecting(true);
    setBoxPop(true); // the card-pack box pops in at the bottom-right as the cards are pushed into it
    burstAt(breed.x, breed.y, ROOT * 1.33); // pink starburst on the initial square card
    onRemove?.(breed.name); // pop the card out of the pit first, so it goes before the circles fall
    tween(520, (t) => setCollectT(t), () => {
      burstAt(60 - pan.x, vp.h - 60 - pan.y, ROOT * 1.5); // dot explosion where the cards crash into the bottom-left corner
      // hand the visible percentage circles to the pit as real falling bodies,
      // in screen coords (their user coords plus the current pan)
      const circles = shown
        .filter((n) => n._parent)
        .slice(0, 60)
        .map((n) => {
          const share = Math.round((n._leaves / (n._parent as Node)._leaves) * 100);
          return { x: n._x + pan.x, y: n._y + pan.y, r: radius(share), share, name: n.name };
        });
      // hold a beat so the bottom-right pack box can finish its pop before the overlay closes
      window.setTimeout(() => { onScatter?.(circles); onClose(); }, 680);
    });
  };

  // the bottom-left tally corner, in the diagram's own (panned) coordinates
  const cornerX = 60 - pan.x, cornerY = vp.h - 60 - pan.y;
  // a card's tumble-into-the-corner transform at the current collect progress
  const collectXf = (sx: number, sy: number, spin: number, baseDeg: number) => {
    const t = collectT;
    const x = sx + (cornerX - sx) * t;        // x slides toward the corner
    const y = sy + (cornerY - sy) * (t * t);  // y accelerates downward, a curved fall
    const sc = Math.max(0.04, 1 - t);          // shrinks into the tally
    return { transform: `translate(${x},${y}) rotate(${baseDeg + spin * t}) scale(${sc})`, opacity: t > 0.72 ? Math.max(0, (1 - t) / 0.28) : 1 };
  };

  // the dog card, drawn at a given point, leaning to match the pile angle
  const rootCard = (cx: number, cy: number) => {
    const baseDeg = (cardLean * 180) / Math.PI;
    const rootXf = collecting && collectRef.current
      ? collectXf(cx, cy, collectRef.current.rootSpin, baseDeg)
      : { transform: `translate(${cx},${cy}) rotate(${baseDeg})`, opacity: 1 };
    const groupFade = collecting ? Math.max(0, 1 - collectT * 1.6) : 1;
    return (
    <>
      <g
        className={styles.rootHit}
        transform={rootXf.transform}
        style={{ opacity: rootXf.opacity }}
        onClick={(e) => e.stopPropagation()}
      >
        <clipPath id={clip}>
          <rect x={-ROOT} y={-ROOT} width={ROOT * 2} height={ROOT * 2} rx={20} />
        </clipPath>
        <rect x={-ROOT - 5} y={-ROOT - 5} width={ROOT * 2 + 10} height={ROOT * 2 + 10} rx={24} className={styles.rootCard} />
        {breed.image ? (
          <image
            href={bust(breed.image)}
            x={-ROOT}
            y={-ROOT}
            width={ROOT * 2}
            height={ROOT * 2}
            clipPath={`url(#${clip})`}
            preserveAspectRatio="xMidYMid slice"
          />
        ) : null}
        {rootStatus && (() => {
          const ts = TAG_STYLE[rootStatus];
          return (
            <circle cx={-ROOT} cy={-ROOT} r={12} style={{ fill: ts.bg, stroke: "#ffffff", strokeWidth: 2, pointerEvents: "none" }}>
              <title>{ts.label}</title>
            </circle>
          );
        })()}
      </g>
      <g className={styles.rootHit} transform={`translate(${cx},${cy + ROOT + 26})`} style={{ opacity: groupFade }} onClick={(e) => e.stopPropagation()}>
        <rect className={styles.tag} x={-tagW / 2} y={-16} width={tagW} height={32} rx={16} />
        <text className={styles.tagText} textAnchor="middle" dominantBaseline="central">
          {breed.name}
        </text>
        {/* the 3-D Collect button sits on top; it orders the pack into the grid */}
        {allBlue && !packed && !collecting ? (
          <g
            className={styles.removeBtn}
            transform={`translate(0,62)`}
            onClick={(e) => { e.stopPropagation(); burstAt(cx, cy + ROOT + 88, ROOT * 0.9); doPack(cx, cy + ROOT + 88); }}
            onPointerDown={(e) => e.stopPropagation()}
            role="button"
            aria-label="Collect the ancestor pack"
          >
            <g className={styles.chumPop}>
              <rect x={-100} y={-26} width={200} height={68} rx={34} className={styles.compBase} />
              <g className={styles.chumTop}>
                <rect x={-100} y={-34} width={200} height={68} rx={34} className={styles.compPill} />
                <rect x={-88} y={-28} width={176} height={22} rx={12} className={styles.chumGloss} />
                <text className={styles.compText} textAnchor="middle" dominantBaseline="central" y={5}>Collect</text>
              </g>
            </g>
          </g>
        ) : null}
        {/* the green pack chum button sits below Collect; it pushes the cards into the box */}
        {canRemove || removing ? (
          <g
            className={styles.removeBtn}
            transform={`translate(0,138)`}
            onClick={(e) => { e.stopPropagation(); flashNum(cx, cy + ROOT + 164, 500, FLASH_SIZE); startRemove(); }}
            role="button"
            aria-label="Choose as pack chum"
          >
            <g className={styles.chumPop}>
              <rect x={-100} y={-26} width={200} height={68} rx={34} className={styles.chumBase} />
              <g className={removing ? styles.chumTopDown : styles.chumTop}>
                <rect x={-100} y={-34} width={200} height={68} rx={34} className={styles.chumPill} />
                <rect x={-88} y={-28} width={176} height={22} rx={12} className={styles.chumGloss} />
                <text className={styles.chumText} textAnchor="middle" dominantBaseline="central" y={5}>pack chum</text>
              </g>
            </g>
          </g>
        ) : null}
      </g>
    </>
    );
  };

  return (
    <>
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
      {totalNodes > 0 && !packed && !collecting && (() => {
        const prog = Math.min(1, seen.size / totalNodes); // 0 (none turned) -> 1 (all turned)
        const dotBg = `hsl(${212 - prog * 87}, ${72 + prog * 13}%, ${44 + prog * 3}%)`; // blue -> bright green
        return (
          <div className={styles.dotCount} style={{ background: dotBg }} aria-label={`${seen.size} of ${totalNodes} circles turned`}>
            {seen.size}/{totalNodes}
          </div>
        );
      })()}
      {showPack && (
        <button
          type="button"
          className={`${styles.packBtn} ${packed ? styles.packDone : ""} ${allBlue && !packed ? styles.packReady : ""}`.trim()}
          style={{ opacity: packed ? 1 : packProgress }}
          onClick={(e) => { e.stopPropagation(); doPack(); }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={packed ? "Ancestor pack complete" : complete ? "Collect the ancestor pack" : "Collect the ancestor pack"}
        >
          <img className={styles.packIcon} src="/checklist-icon-complete.svg" alt="" aria-hidden="true" />
          <span className={styles.packText}>{packed ? "Done!" : "Collect Ancestor Pack"}</span>
        </button>
      )}
      {packed && packLabels.alive && (
        <div className={styles.packHead} style={{ left: packLabels.alive.x, top: packLabels.alive.y }}>Alive and kicking</div>
      )}
      {packed && packLabels.extinct && (
        <div className={styles.packHead} style={{ left: packLabels.extinct.x, top: packLabels.extinct.y }}>Chasing balls up in the heavens</div>
      )}
      <svg className={styles.svg} viewBox={`${-pan.x} ${-pan.y} ${vp.w} ${vp.h}`} width={vp.w} height={vp.h} xmlns="http://www.w3.org/2000/svg">
        <g style={removing ? { pointerEvents: "none" } : undefined}>
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
                      burstAt(n._x, n._y, r * 1.33); // pink starburst, 33% over the circle radius, exactly as the pit
                      const firstHit = !scoredRef.current.has(n._id);
                      if (firstHit) scoredRef.current.add(n._id);
                      setSeen((s) => { if (s.has(n._id)) return s; const x = new Set(s); x.add(n._id); return x; }); // first tap turns it blue
                      flashNum(n._x, n._y - r, firstHit ? (hasKids ? 125 : 250) : 0, FLASH_SIZE); // only the first tap on a node scores; later taps read 0
                      follow(n);
                      const wasPicked = picked.has(n._id);
                      setPicked((cur) => {
                        const s = new Set(cur);
                        if (s.has(n._id)) s.delete(n._id);
                        else s.add(n._id);
                        return s;
                      });
                      if (wasPicked) {
                        setPinned((m) => { if (!m.has(n._id)) return m; const x = new Map(m); x.delete(n._id); return x; });
                        setDragPos((m) => { if (!m.has(n._id)) return m; const x = new Map(m); x.delete(n._id); return x; });
                      } else if (n.img && n._parent) {
                        // pin the opened card at its current spot so it stays on screen even after this branch closes
                        const sh = Math.round((n._leaves / (n._parent as Node)._leaves) * 100);
                        const rr = radius(sh), dd = rr + 10 + CARD / 2;
                        const px = n._x + Math.cos(n._dir) * dd, py = n._y + Math.sin(n._dir) * dd;
                        setPinned((m) => { const x = new Map(m); x.set(n._id, { img: n.img as string, name: n.name, share: sh, mix: root ? Math.round((n._leaves / root._leaves) * 100) : sh, status: nodeStatus(n.name, n.note) }); return x; });
                        setDragPos((m) => { const x = new Map(m); x.set(n._id, { x: px, y: py }); return x; });
                      }
                    }}
                  >
                    <circle className={`${styles.disc} ${hasKids && !isOpen ? styles.has : ""}`.trim()} r={r} style={seen.has(n._id) ? { fill: "#0c5b92" } : undefined} />
                    <text className={styles.pct} textAnchor="middle" dominantBaseline="central" fontSize={Math.max(13, r * 0.5)} style={seen.has(n._id) ? { fill: "#ffffff" } : undefined}>
                      {share}%
                    </text>
                    {picked.has(n._id) ? null : (
                      <text className={styles.nm} textAnchor="middle" y={-r - 9}>
                        {n.name}
                      </text>
                    )}
                    {hasKids && !isOpen ? (
                      <text className={styles.plus} textAnchor="middle" y={r + 15}>
                        + {countProgenitors(n)} inside
                      </text>
                    ) : null}
                  </g>
                );
              })}
            {pickCards.map((c) => {
              if (packed && packHidden.has(c.id)) return null; // folded-out duplicate
              const clipId = `lm-pick-${c.id}`;
              const cardDeg = -(cardLean * 180) / Math.PI;
              const packScale = packed ? 0.85 : 1; // ordered-grid cards sit 15% smaller
              const ci = collecting && collectRef.current ? collectRef.current.cards.get(c.id) : null;
              const cxf = ci ? collectXf(c.cardX, c.cardY, ci.spin, cardDeg) : null; // tumble to the corner with the main card
              return (
                <g
                  key={`pick-${c.id}`}
                  className={`${styles.rootHit} ${styles.grab}`}
                  transform={cxf
                    ? `${cxf.transform} scale(${packScale}) translate(${-c.cardX},${-c.cardY})`
                    : `translate(${c.cardX},${c.cardY}) rotate(${cardDeg}) scale(${packScale}) translate(${-c.cardX},${-c.cardY})`}
                  style={cxf ? { opacity: cxf.opacity } : undefined}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch {}
                    cardDrag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: c.cardX, oy: c.cardY, moved: false };
                  }}
                  onPointerMove={(e) => {
                    const cd = cardDrag.current;
                    if (!cd || e.pointerId !== cd.id) return;
                    const dx = e.clientX - cd.sx, dy = e.clientY - cd.sy;
                    if (!cd.moved && Math.hypot(dx, dy) > 3) cd.moved = true;
                    if (cd.moved) {
                      suppressClick.current = true;
                      setDragPos((m) => {
                        const next = new Map(m);
                        next.set(c.id, { x: cd.ox + dx, y: cd.oy + dy });
                        return next;
                      });
                      // snapshot once so the card outlives its branch closing
                      setPinned((m) => {
                        if (m.has(c.id)) return m;
                        const next = new Map(m);
                        next.set(c.id, { img: c.img, name: c.name, share: c.share, mix: c.mix, status: c.status });
                        return next;
                      });
                    }
                  }}
                  onPointerUp={(e) => {
                    const cd = cardDrag.current;
                    if (cd && e.pointerId === cd.id) {
                      try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch {}
                      cardDrag.current = null;
                    }
                  }}
                  onPointerCancel={() => { cardDrag.current = null; }}
                >
                  <clipPath id={clipId}>
                    <rect x={c.cardX - CARD / 2} y={c.cardY - CARD / 2} width={CARD} height={CARD} rx={15} />
                  </clipPath>
                  <image
                    href={bust(c.img)}
                    x={c.cardX - CARD / 2}
                    y={c.cardY - CARD / 2}
                    width={CARD}
                    height={CARD}
                    clipPath={`url(#${clipId})`}
                    preserveAspectRatio="xMidYMid slice"
                  />
                  <rect
                    x={c.cardX - CARD / 2}
                    y={c.cardY - CARD / 2}
                    width={CARD}
                    height={CARD}
                    rx={15}
                    className={styles.pickCard}
                  />
                  {!packed && (() => {
                    const pillH = 36;
                    const pillW = Math.max(64, c.name.length * 9.5 + 30); // one line, width grows with the name
                    const pillTop = c.cardY + CARD / 2 + 12; // sits just below the card, like the breed name pill
                    return (
                      <>
                        <rect className={styles.tag} x={c.cardX - pillW / 2} y={pillTop} width={pillW} height={pillH} rx={pillH / 2} />
                        <text className={styles.tagText} textAnchor="middle" x={c.cardX} y={pillTop + pillH / 2 + 2} dominantBaseline="central">
                          {c.name}
                        </text>
                      </>
                    );
                  })()}
                  {(() => {
                    const ts = TAG_STYLE[c.status ?? "extinct"]; // no tag means old stock, counted as gone, so red
                    const dx = c.cardX - CARD / 2, dy = c.cardY - CARD / 2; // top-left corner, protruding like the close button
                    return (
                      <circle cx={dx} cy={dy} r={12} style={{ fill: ts.bg, stroke: "#ffffff", strokeWidth: 2, pointerEvents: "none" }}>
                        <title>{ts.label}</title>
                      </circle>
                    );
                  })()}
                  {!packed && (() => {
                    const ccx = c.cardX + CARD / 2, ccy = c.cardY - CARD / 2; // top-right corner, button straddles it
                    return (
                      <g
                        style={{ cursor: "pointer" }}
                        onPointerDown={(e) => { e.stopPropagation(); }}
                        onClick={(e) => { e.stopPropagation(); removeCard(c.id); }}
                        role="button"
                        aria-label="Close"
                      >
                        <circle cx={ccx} cy={ccy} r={13} style={{ fill: "var(--navy)", stroke: "#ffffff", strokeWidth: 2 }} />
                        <path
                          d={`M ${ccx - 5} ${ccy - 5} l 10 10 M ${ccx + 5} ${ccy - 5} l -10 10`}
                          stroke="#ffffff"
                          strokeWidth={2}
                          strokeLinecap="round"
                        />
                      </g>
                    );
                  })()}
                  {packed && (() => {
                    const pw = 66, ph = 32, py = c.cardY + CARD / 2 - ph / 2 - 6; // pill near the foot of the card
                    const pillRight = c.cardX + CARD / 2 + 6; // right-aligned to the card, nudged just past the edge
                    return (
                      <>
                        <rect className={styles.mixPill} x={pillRight - pw} y={py} width={pw} height={ph} rx={ph / 2} />
                        <text className={styles.mixText} textAnchor="end" x={pillRight - 12} y={py + ph / 2 + 1} dominantBaseline="central">
                          {c.mix < 1 ? "<1%" : `${c.mix}%`}
                        </text>
                      </>
                    );
                  })()}
                </g>
              );
            })}
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
        {bursts.map((b) => {
          const t = Math.min(1, (performance.now() - b.born) / 420);
          const reach = b.s * (0.35 + t * 0.85), inner = b.s * (0.12 + t * 0.4);
          return (
            <g key={`b${b.id}`} transform={`translate(${b.x},${b.y}) rotate(${t * 5})`} opacity={1 - t} pointerEvents="none">
              {Array.from({ length: 12 }).map((_, k) => {
                const a = (k / 12) * Math.PI * 2;
                return <line key={k} x1={Math.cos(a) * inner} y1={Math.sin(a) * inner} x2={Math.cos(a) * reach} y2={Math.sin(a) * reach} stroke="#ff2d78" strokeWidth={2.4} strokeLinecap="round" />;
              })}
              {Array.from({ length: 5 }).map((_, k) => {
                const a = (k / 5) * Math.PI * 2 + 0.3, rr = reach * 1.05, sx = Math.cos(a) * rr, sy = Math.sin(a) * rr, sz = 3 * (1 - t) + 1.5;
                const pts = Array.from({ length: 5 }).map((_, p) => { const aa = a + (p / 5) * Math.PI * 2; return `${sx + Math.cos(aa) * sz},${sy + Math.sin(aa) * sz}`; }).join(" ");
                return <polygon key={`s${k}`} points={pts} fill="#ff2d78" />;
              })}
            </g>
          );
        })}
        {flashes.map((f) => (
          <text key={`f${f.id}`} className={styles.flashNum} x={f.x} y={f.y} fontSize={f.size} textAnchor="middle">
            {f.val}
          </text>
        ))}
        </g>
      </svg>
    </div>
    {boxPop && (
      <img className={styles.cardBox} src="/card-pack-box.svg" alt="" aria-hidden="true" />
    )}
    </>
  );
}
