"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getLineage, type LineageNode } from "../../data/lineage";
import { bust } from "../../data/imgVersion";
import { ukBreeds } from "../../data/uk-breeds";
import { breeds } from "../../data/breeds";
import { breedInfo } from "../../data/breedInfo";
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
// living breeds whose short tree-card name does not match the uk breed list
// (e.g. node "Labrador" vs list "Labrador Retriever", and "Poodle" is absent),
// so without this they fall through to no tag and wrongly show the red gone-dot
const LIVING_STATUS: Record<string, BreedTag> = {
  "Labrador": "popular",
  "Poodle": "popular",
};
// Every real, currently-bred breed we know of, by normalised name. A tree node
// matching one of these is a living breed even if its short card name is absent
// from the history list, so it must not fall through to the red gone-dot.
const LIVING_NAMES = new Set<string>(
  [...ukBreeds.map((b) => b.name), ...breeds.map((b) => b.name)].map((s) => s.toLowerCase().trim())
);
// Work out a breed's state from its note, falling back to the history tag list.
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
  if (LIVING_NAMES.has(key)) return "popular"; // a real living breed, just not in the history list
  return null;
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
const INSTR_NAMES = new Set(["Deal the cards","Head outside","Spot real dogs","Match to your chum","Find more chums","Most chums wins"]);
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
const CARD = 74; // card + frame + image size (reduced 10% further)
const PACK_BREEDS = new Set(breeds.map((b) => b.name)); // the 54 dogs in the card pack the site is about
const PACK_IMG = new Map(breeds.map((b) => [b.name, b.image])); // pack breed -> its square cartoon card art
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
  currentScore = 0,
  tree,
  circular = false,
  rootRadius,
}: {
  breed: { name: string; image: string; x: number; y: number; angle: number };
  tree?: LineageNode;
  circular?: boolean;
  rootRadius?: number;
  onClose: () => void;
  onRemove?: (name: string) => void;
  onScatter?: (data: {
    circles: { x: number; y: number; r: number; share: number; name: string }[];
    rods: { x1: number; y1: number; x2: number; y2: number; lit: boolean }[];
    pills: { x: number; y: number; w: number; name: string }[];
  }) => void;
  onScore?: (v: number) => void;
  currentScore?: number;
}) {
  const [vp, setVp] = useState({ w: 1280, h: 800 });
  const [rootGone, setRootGone] = useState(false);
  const confettiRef = useRef<((opts: Record<string, unknown>) => void) | null>(null);
  useEffect(() => {
    if (!circular) return;
    const w = window as unknown as Record<string, unknown>;
    if (typeof w["confetti"] === "function") { confettiRef.current = w["confetti"] as (o: Record<string, unknown>) => void; return; }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js";
    script.onload = () => { confettiRef.current = w["confetti"] as (o: Record<string, unknown>) => void; };
    document.head.appendChild(script);
  }, [circular]);
  // Preload all images for instruction cards so they appear instantly when tapped
  useEffect(() => {
    if (!INSTR_NAMES.has(breed.name)) return;
    const root = getLineage(breed.name);
    if (!root) return;
    const imgs: string[] = [];
    const collect = (n: any) => { if (n.img) imgs.push(n.img); if (n.children) n.children.forEach(collect); };
    collect(root);
    imgs.forEach((src) => { const img = new window.Image(); img.src = encodeURI(bust(src)); });
  }, [breed.name]);
  useEffect(() => {
    const f = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);

  const root = useMemo(() => {
    const t = tree ?? getLineage(breed.name);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breed.name, tree]);

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
  // Mobile only: the pack grid lays each section out as one long horizontal strip
  // and the player swipes it left/right. gridX is that scroll offset (0 .. minGridXRef).
  const isMobile = vp.w <= 768;
  const CW = isMobile ? Math.round(CARD * 0.85) : CARD; // frames + picture cards run 15% smaller on phones
  const [gridX, setGridX] = useState(0);
  useEffect(() => setGridX(0), [breed.name]);
  const gridDrag = useRef<{ id: number; sx: number; gx: number; moved: boolean } | null>(null);
  const minGridXRef = useRef(0);
  const startGridDrag = (e: React.PointerEvent) => {
    suppressClick.current = true; // a touch on the strip never closes the overlay
    gridDrag.current = { id: e.pointerId, sx: e.clientX, gx: gridX, moved: false };
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch {}
  };
  const moveGridDrag = (e: React.PointerEvent) => {
    const d = gridDrag.current;
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.sx;
    if (!d.moved && Math.abs(dx) > 6) d.moved = true;
    if (d.moved) { suppressClick.current = true; setGridX(Math.max(minGridXRef.current, Math.min(0, d.gx + dx))); }
  };
  const endGridDrag = (e: React.PointerEvent) => {
    const d = gridDrag.current;
    if (d && e.pointerId === d.id) { try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch {} gridDrag.current = null; }
  };

  // custom drop positions for popped-out progenitor cards; drag to reposition,
  // they stay where dropped until the breed changes or the map closes
  const [dragPos, setDragPos] = useState<Map<string, { x: number; y: number }>>(new Map());
  useEffect(() => setDragPos(new Map()), [breed.name]);
  const cardDrag = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);
  // the main square card peels off and drags like an ancestor card, but only once every frame is filled
  const [rootPos, setRootPos] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => setRootPos(null), [breed.name]);
  const rootDrag = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);

  // a dragged card becomes "pinned": snapshot its art so it survives its branch
  // closing, and keep showing it at its dropped spot until breed change / close
  const [pinned, setPinned] = useState<Map<string, { img: string; name: string; note: string; share: number; mix: number; status: BreedTag | null }>>(new Map());
  useEffect(() => { setPinned(new Map()); }, [breed.name]);
  // which collected card is showing its info label right now (toggled by tapping its i)
  const [infoHover, setInfoHover] = useState<string | null>(null);
  const [pctHover, setPctHover] = useState<string | null>(null); // which card's % explainer box is open
  const pctTimer = useRef<number | null>(null); // closes the % box a beat after the cursor leaves /* pct-close */
  const pctClose = () => { if (pctTimer.current) window.clearTimeout(pctTimer.current); pctTimer.current = window.setTimeout(() => { setPctHover(null); pctTimer.current = null; }, 600); };
  const pctKeep = () => { if (pctTimer.current) { window.clearTimeout(pctTimer.current); pctTimer.current = null; } };
  useEffect(() => setPctHover(null), [breed.name]);
  const infoSeen = useRef<Set<string>>(new Set()); // cards whose info tooltip has already paid out its +2, so it pays once
  useEffect(() => setInfoHover(null), [breed.name]);
  // hold-to-magnify: which collected card is enlarged right now, and the release timer
  const [zoomedId, setZoomedId] = useState<string | null>(null);
  const [zoomOff, setZoomOff] = useState<{ x: number; y: number }>({ x: 0, y: 0 }); // drag offset of the enlarged image /* zoom-overlay */
  const zoomDrag = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number } | null>(null);
  const zoomTimer = useRef<number | null>(null);
  useEffect(() => setZoomedId(null), [breed.name]);
  // closeAll: ensure only one overlay is open at a time
  const closeAll = () => { setInfoHover(null); setPctHover(null); setZoomedId(null); if (zoomTimer.current) { window.clearTimeout(zoomTimer.current); zoomTimer.current = null; } };
  const magnifyHold = (id: string) => { closeAll(); setZoomOff({ x: 0, y: 0 }); setZoomedId(id); setInfoHover(id); };
  const magnifyRelease = () => { if (zoomTimer.current) window.clearTimeout(zoomTimer.current); zoomTimer.current = window.setTimeout(() => { setZoomedId(null); setInfoHover(null); zoomTimer.current = null; }, 2000); }; // stays big 2s, then shrinks; patch_hoverfix_v1: info closes with zoom

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
  const [packLabels, setPackLabels] = useState<{ chum: { x: number; y: number } | null; alive: { x: number; y: number } | null; extinct: { x: number; y: number } | null }>({ chum: null, alive: null, extinct: null });
  const [packHidden, setPackHidden] = useState<Set<string>>(new Set()); // duplicate ancestors folded out of the pack
  const [collecting, setCollecting] = useState(false); // my chum tapped: every card tumbles into the bottom-left
  const [boxPop, setBoxPop] = useState(false); // the card-pack box flourish on collect
  const [collectT, setCollectT] = useState(0); // 0..1 progress of that tumble
  const collectRef = useRef<{ cards: Map<string, { x: number; y: number; spin: number }>; rootSpin: number } | null>(null);
  useEffect(() => { setPacked(false); setPackLabels({ chum: null, alive: null, extinct: null }); setPackHidden(new Set()); setCollecting(false); setCollectT(0); setBoxPop(false); collectRef.current = null; }, [breed.name]);
  // little white numbers that flash up when a node or the chum button is tapped
  const [flashes, setFlashes] = useState<{ id: number; x: number; y: number; val: number; size: number }[]>([]);
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number; s: number; born: number }[]>([]);
  const [seen, setSeen] = useState<Set<string>>(new Set()); // circles tapped at least once, recoloured blue
  const fxId = useRef(0);
  const scoredRef = useRef<Set<string>>(new Set());
  const [autoArmed, setAutoArmed] = useState(false); // the auto-collect shortcut arms 5s in, while circles are still yellow
  const [autoExposed, setAutoExposed] = useState<Set<string>>(new Set()); // nodes auto revealed; their leaf names stay hidden to cut clutter
  const [penalty, setPenalty] = useState<number | null>(null); // animation key while the white -1000 floats up
  const [idleHint, setIdleHint] = useState(false); // pulse the first ring of circles after 1s of no interaction
  const interacted = useRef(false);
  useEffect(() => {
    setAutoArmed(false); setPenalty(null);
    const t = setTimeout(() => setAutoArmed(true), 5000);
    return () => clearTimeout(t);
  }, [breed.name]);
  useEffect(() => {
    setIdleHint(false); interacted.current = false;
    const t = setTimeout(() => { if (!interacted.current) setIdleHint(true); }, 1000);
    return () => clearTimeout(t);
  }, [breed.name]);
  // 2-minute idle flip attractor - loops until the user interacts

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
  const rollStart = useRef<Map<string, number>>(new Map()); // card id -> first time its pill appeared /* pct-roll */
  const rolledMix = (id: string, mix: number) => {
    if (mix < 1) return mix; // <1% has nothing to roll
    let t0 = rollStart.current.get(id);
    if (t0 == null) { t0 = performance.now(); rollStart.current.set(id, t0); }
    const p = Math.min(1, (performance.now() - t0) / 700); // 0.7s
    const eased = 1 - Math.pow(1 - p, 3); // ease-out
    return Math.round(mix * eased);
  };
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
    setShowRemove(true); // show green button immediately for all cards
    setRemoving(false);
    const t = setTimeout(() => setShowRemove(true), 30000); // auto-show the green button after 30s
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
  // every non-root node in the whole tree, open branch or not, so auto-collect can
  // reach the circles still tucked inside unopened branches
  const allNodes = useMemo(() => {
    const out: { id: string; hasKids: boolean; hasImg: boolean }[] = [];
    const walk = (n: Node) => (n.children as Node[] | undefined)?.forEach((k) => {
      out.push({ id: k._id, hasKids: !!(k.children && k.children.length), hasImg: !!k.img });
      walk(k);
    });
    if (root) walk(root);
    return out;
  }, [root]);
  // Every unique image-bearing ancestor, split into the living and the long-gone.
  // These define how many empty frames the player drags each collected card into.
  const frameSlots = useMemo(() => {
    const seenImg = new Set<string>();
    const all: { name: string; img: string; status: BreedTag | null }[] = [];
    const walk = (n: Node) => (n.children as Node[] | undefined)?.forEach((k) => {
      if (k.img && !seenImg.has(k.img)) { seenImg.add(k.img); all.push({ name: k.name, img: PACK_IMG.get(k.name) ?? k.img, status: nodeStatus(k.name, k.note) }); }
      walk(k);
    });
    if (root) walk(root);
    const chum = all.filter((s) => PACK_BREEDS.has(s.name)); // ancestors that are themselves one of the 54 pack dogs
    const rest = all.filter((s) => !PACK_BREEDS.has(s.name));
    return { chum, alive: rest.filter((s) => isAlive(s.status)), extinct: rest.filter((s) => !isAlive(s.status)) };
  }, [root]);

  // how many times each image appears across the whole tree; >1 means the breed is a
  // duplicate, so its frame becomes a stack the extra copies can be dropped onto
  const dupTotal = useMemo(() => {
    const m = new Map<string, number>();
    const walk = (n: Node) => (n.children as Node[] | undefined)?.forEach((k) => {
      if (k.img) { const img = PACK_IMG.get(k.name) ?? k.img; m.set(img, (m.get(img) ?? 0) + 1); }
      walk(k);
    });
    if (root) walk(root);
    return m;
  }, [root]);
  // Stage 1: genetic-mix model. Walk the whole tree; each appearance of a breed
  // contributes its cumulative share (leaves / root leaves, which already honours
  // non-binary splits). Sum a breed's appearances, then normalise so every breed
  // totals 100% across the whole dog. /* breedMix */
  const breedMix = useMemo(() => {
    type App = { depth: number; pct: number };
    const apps = new Map<string, App[]>(); // breed key -> appearances
    const rootLeaves = root ? root._leaves : 0;
    const walk = (n: Node, depth: number) => {
      (n.children as Node[] | undefined)?.forEach((k) => {
        if (k.img && rootLeaves > 0) {
          const key = PACK_IMG.get(k.name) ?? k.img;
          const pct = (k._leaves / rootLeaves) * 100; // cumulative contribution of this appearance
          const a = apps.get(key) || []; a.push({ depth, pct }); apps.set(key, a);
        }
        walk(k, depth + 1);
      });
    };
    if (root) walk(root, 1); // root's direct children are 1 generation back
    // raw sum per breed
    const sums = new Map<string, number>();
    apps.forEach((list, key) => sums.set(key, list.reduce((s, a) => s + a.pct, 0)));
    const total = [...sums.values()].reduce((s, v) => s + v, 0); // normalisation denominator
    const out = new Map<string, { apps: App[]; sum: number; norm: number }>();
    apps.forEach((list, key) => {
      const sum = sums.get(key) || 0;
      const norm = total > 0 ? (sum / total) * 100 : 0;
      out.set(key, { apps: [...list].sort((a, b) => a.depth - b.depth), sum, norm });
    });
    return out;
  }, [root]);
  // top-3 breeds by share get a click-score multiplier when first tapped /* top3-mult */
  const topBonus = useMemo(() => {
    const ranked = [...breedMix.entries()].sort((a, b) => b[1].norm - a[1].norm);
    const m = new Map<string, number>();
    [1.3, 1.2, 1.1].forEach((mult, i) => { if (ranked[i]) m.set(ranked[i][0], mult); });
    return m;
  }, [breedMix]);
  // (Stage 1 console diagnostic removed) /* mix-box */
  const [filled, setFilled] = useState<Map<string, string>>(new Map()); // frameId -> the card id dropped into it
  useEffect(() => setFilled(new Map()), [breed.name]);
  const [stacked, setStacked] = useState<Map<string, string[]>>(new Map()); // frameId -> extra duplicate cards piled on top of the primary
  useEffect(() => setStacked(new Map()), [breed.name]);
  const [dragCat, setDragCat] = useState<"chum" | "alive" | "extinct" | null>(null); // category of the card being dragged, to light matching frames
  const [dragImg, setDragImg] = useState<string | null>(null); // artwork of the card being dragged, to light its one assigned frame
  const [dragName, setDragName] = useState<string | null>(null); // name of the card being dragged, shown on its lit target frame /* pickup-name */
  const [shakeFrame, setShakeFrame] = useState<string | null>(null); // frame doing the "no" head-shake on a wrong drop
  const [wrongDog, setWrongDog] = useState<{ frameId: string; x: number; y: number } | null>(null); // flash "Wrong dog" on bad drop
  const [correctFlash, setCorrectFlash] = useState<string | null>(null); // frameId of the correct frame to flash yellow on wrong drop
  const [puffs, setPuffs] = useState<{ id: number; sx: number; sy: number }[]>([]); // smoke poofs as a card lands in its frame
  const puffSeq = useRef(0);
  const [bubbles, setBubbles] = useState<{ id: number; sx: number; sy: number }[]>([]); // blue bubble trail as a card glides to its frame
  const bubbleSeq = useRef(0);
  const [dragXY, setDragXY] = useState<{ x: number; y: number } | null>(null); // live pointer while dragging a card, for the proximity glow
  useEffect(() => {
    if (totalNodes > 0 && seen.size >= totalNodes) {
      const t = setTimeout(() => setShowRemove(true), 0); // show immediately when all nodes are seen
      return () => clearTimeout(t);
    }
  }, [seen, totalNodes]);

  const base = lean(breed.angle || 0);
  const cardLean = Math.max(-CARD_TILT, Math.min(CARD_TILT, base)); // breed cards tilt at most 2 degrees
  const cardDeg = -(cardLean * 180) / Math.PI; // the exact tilt every popped card uses; frames match it
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
      let center = depth === 0 ? -Math.PI / 2 + base : n._dir;
      if (cnt === 1 && depth > 0 && INSTR_NAMES.has(breed.name)) { center = n._dir + (Math.PI * 0.30); } // gentle curl for instructional
      else if (cnt === 1 && depth > 0) { const side = depth % 2 === 1 ? 1 : -1; center = n._dir + side * (Math.PI * 0.38); }
      const dist = depth === 0 ? RING1 : (INSTR_NAMES.has(breed.name) ? RSTEP * 1.2 : RSTEP);
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
    if (packed) return; // Done state: the grid is fixed, only the main card moves
    if (canDragRoot) return; // all frames filled: only root card drag moves the tree
    suppressClick.current = false;
    setInfoHover(null); // a tap on empty space dismisses any open info label
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
    // tap-to-close disabled: the family tree closes only via the X button, so a
    // stray tap can't wipe out a built tree (and can't swallow the root card's
    // double-click). A plain tap still just clears any open info label.
    if (suppressClick.current) { suppressClick.current = false; return; }
    setInfoHover(null);
  };

  // long names wrap to a second line: the pill grows in depth, the corner
  // radius stays fixed so the capsule shape never changes
  const splitName = (nm: string): string[] => {
    if (nm.length <= 16) return [nm];
    const mid = Math.floor(nm.length / 2);
    let best = -1;
    for (let i = 0; i < nm.length; i++) if (nm[i] === " " && (best === -1 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
    return best === -1 ? [nm] : [nm.slice(0, best), nm.slice(best + 1)];
  };
  const tagLines = circular ? splitName(breed.name) : [breed.name];
  const tagW = Math.max(...tagLines.map((l) => l.length)) * 9.5 + 28;
  const tagH = tagLines.length > 1 ? 60 : 32;
  const clip = "lm-clip-root";

  // The empty frames the player drags each collected card into: a row of living up
  // top, the long-gone below. Positions are screen coords, rendered pan-fixed as
  // sx - pan.x so they stay put while the tree pans behind them.
  const F_LEFT = isMobile ? 52 : 96;
  const F_COL = circular ? CW + 3 : isMobile ? 92 : 112, F_ROW = circular ? CW + 3 : isMobile ? 92 : 112; // mini pit: 3px gutter; else tighter pitch on phones to match the 15% smaller cards
  const fCols = Math.max(2, Math.min(7, Math.floor((vp.w - 120) / F_COL)));
  const MCOLS = 4; // phones: one continuous grid, four frames wide before it wraps
  const chumTop = circular ? (isMobile ? 118 : 168) : isMobile ? 170 : 240; // mini pit: rows ride high under the title; else clear of the top-left chrome (and desktop section headers)
  const frames: { id: string; cat: "chum" | "alive" | "extinct"; img: string; sx: number; sy: number }[] = [];
  let aliveTop = chumTop, extinctTop = chumTop; // only the desktop section headers use these
  if (isMobile) {
    // chum, then alive, then extinct, flowing as one continuous bunch with no separators
    const all = [
      ...frameSlots.chum.map((s, i) => ({ id: `fc${i}`, cat: "chum" as const, img: s.img })),
      ...frameSlots.alive.map((s, i) => ({ id: `fa${i}`, cat: "alive" as const, img: s.img })),
      ...frameSlots.extinct.map((s, i) => ({ id: `fe${i}`, cat: "extinct" as const, img: s.img })),
    ];
    all.forEach((f, g) => frames.push({ ...f, sx: F_LEFT + (g % MCOLS) * F_COL + gridX, sy: chumTop + Math.floor(g / MCOLS) * F_ROW }));
  } else {
    frameSlots.chum.forEach((s, i) => frames.push({ id: `fc${i}`, cat: "chum", img: s.img, sx: F_LEFT + (i % fCols) * F_COL, sy: chumTop + Math.floor(i / fCols) * F_ROW }));
    aliveTop = chumTop + (frameSlots.chum.length ? Math.ceil(frameSlots.chum.length / fCols) * F_ROW + 72 : 0);
    frameSlots.alive.forEach((s, i) => frames.push({ id: `fa${i}`, cat: "alive", img: s.img, sx: F_LEFT + (i % fCols) * F_COL, sy: aliveTop + Math.floor(i / fCols) * F_ROW }));
    extinctTop = aliveTop + (frameSlots.alive.length ? Math.ceil(frameSlots.alive.length / fCols) * F_ROW + 72 : 0);
    frameSlots.extinct.forEach((s, i) => frames.push({ id: `fe${i}`, cat: "extinct", img: s.img, sx: F_LEFT + (i % fCols) * F_COL, sy: extinctTop + Math.floor(i / fCols) * F_ROW }));
  }
  // horizontal nudge only if the 4-wide grid overflows a narrow phone (otherwise it sits still)
  const gridRight = F_LEFT + (MCOLS - 1) * F_COL + CW / 2;
  minGridXRef.current = isMobile ? Math.min(0, vp.w - gridRight - 16) : 0;
  const frameTotal = frames.length;
  // where each filled card should sit: its frame's screen centre, kept pan-fixed
  // cardFrame: placed card screen positions -- memoised so pan changes don't shift them
  const cardFrame = useMemo(() => {
    const m = new Map<string, { sx: number; sy: number }>();
    filled.forEach((cardId, frameId) => { const f = frames.find((x) => x.id === frameId); if (f) m.set(cardId, { sx: f.sx, sy: f.sy }); });
    return m;
  }, [filled, frames]); // eslint-disable-line react-hooks/exhaustive-deps
  const placedSet = new Set(filled.values()); // cards sitting in a frame: fixed, not draggable
  const stackedIds = new Set<string>();
  stacked.forEach((ids) => ids.forEach((id) => stackedIds.add(id))); // duplicate cards absorbed into a stack, hidden as loose cards
  const isDupImg = (img: string) => (dupTotal.get(img) ?? 0) > 1; // breed appears more than once: its frame is a stack target

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
      const name = live?.name ?? snap?.name ?? "";
      const rawImg = (live?.img ?? snap?.img) as string;
      const img = PACK_IMG.get(name) ?? rawImg; // pack breeds flip to their square cartoon card
      const share = live ? Math.round((live._leaves / (live._parent as Node)._leaves) * 100) : snap?.share ?? 0;
      // cumulative share of the whole breed: a node's leaves over the root's leaves,
      // which is the product of every parent share down the chain
      const mix = live ? (root ? Math.round((live._leaves / root._leaves) * 100) : share) : (snap?.mix ?? snap?.share ?? 0);
      const status = live ? nodeStatus(live.name, live.note) : snap?.status ?? null;
      const note = live?.note ?? snap?.note ?? "";
      const r = radius(share);
      const d = r + 10 + CW / 2;
      const baseX = live ? live._x + Math.cos(live._dir) * d : 0;
      const baseY = live ? live._y + Math.sin(live._dir) * d : 0;
      const pos = dragPos.get(id);
      const ff = cardFrame.get(id);
      const cardX = ff ? ff.sx - pan.x : (pos ? pos.x : baseX);
      const cardY = ff ? ff.sy - pan.y : (pos ? pos.y : baseY);
      return { id, img, name, note, share, mix, status, cardX, cardY };
    })
    .filter((c) => c.img);
  // images successfully placed in a frame -- turns their node green
  const placedImgs = new Set(pickCards.filter((c) => placedSet.has(c.id)).map((c) => c.img));
  // Duplicate cards of one breed stack at the same spot; only the top of each
  // stack (the last in order) shows its status dot, % pill and info icon.
  const topByImg = new Map<string, string>();
  // the front of a stack is the last card of that image that actually renders
  // (skip folded-out duplicates and absorbed cards), so its pill always shows /* top-visible */
  pickCards.forEach((c) => {
    if (packed && packHidden.has(c.id)) return;
    if (stackedIds.has(c.id)) return;
    topByImg.set(c.img, c.id);
  });
  const isTopOfStack = (c: { id: string; img: string }) => topByImg.get(c.img) === c.id;
  // order cards within each image group so the underneath ones can fan slightly /* stack-pack */
  const stackOrder = new Map<string, number>();
  { const byImg = new Map<string, string[]>();
    pickCards.forEach((c) => { const a = byImg.get(c.img) || []; a.push(c.id); byImg.set(c.img, a); });
    byImg.forEach((ids) => ids.forEach((id, i) => stackOrder.set(id, i))); }

  // The "Complete Ancestor Pack" cleanup. Once half the tree has been opened the
  // clipboard icon appears; tapping it gathers every open card to the top left,
  // split into the living and the long-gone, and awards a one-off 400 points.
  const PACK_LEFT = 96, PACK_COL = 112, PACK_ROW = 112; // reduced 25% with the cards
  const showPack = packed || (totalNodes > 0 && seen.size >= 1); // appears the moment a node is opened or Auto is used
  // icon fades in with progress: half-transparent at 50% opened, fully white at 100%
  const packProgress = totalNodes > 0 ? Math.max(0.5, Math.min(1, seen.size / totalNodes)) : 0.5;
  const allBlue = totalNodes > 0 && seen.size >= totalNodes; // every circle ticked
  const framesDone = frameTotal > 0 && filled.size >= frameTotal;
  // Mini pit levels: every frame filled means this circle is fully learnt.
  // No collect step: poof the card and its nodes out of existence, remove the
  // circle from the pit, and close, exactly like the instructional finish.
  const circularDoneRef = useRef(false);
  const [scattered, setScattered] = useState(false);
  // Mini pit: the tag pill (and on Complete, every node and rod) tips into the
  // pit as live physics objects, main-pit style. Positions are CURRENT layer
  // positions in client px; the pit gives pills a hit limit once they land.
  const circR = circular && rootRadius ? Math.max(40, Math.min(220, rootRadius)) : ROOT;
  const emitCircularScatter = (includeNodes: boolean) => {
    const pills = [{ x: breed.x + pan.x, y: breed.y + pan.y - circR - 96, w: tagW, name: breed.name }];
    if (!includeNodes) { onScatter?.({ circles: [], rods: [], pills }); return; }
    const vis = shown.filter((n) => n._parent);
    const shareOf = (n: Node) => Math.round((n._leaves / (n._parent as Node)._leaves) * 100);
    const circles = vis.slice(0, 60).map((n) => {
      const share = shareOf(n);
      return { x: n._x + pan.x, y: n._y + pan.y, r: radius(share), share, name: n.name };
    });
    const rods = vis.slice(0, 70).map((n) => {
      const p = n._parent as Node;
      return { x1: p._x + pan.x, y1: p._y + pan.y, x2: n._x + pan.x, y2: n._y + pan.y, lit: open.has(n._id) };
    });
    onScatter?.({ circles, rods, pills });
  };
  // Green Complete pressed: at the very same instant the layer stops drawing
  // the tree and everything drops into the pit - zero-lag handover.
  const circularComplete = () => {
    if (circularDoneRef.current) return;
    circularDoneRef.current = true;
    emitCircularScatter(true);
    setScattered(true);
    burstAt(breed.x, breed.y, circR * 1.33);
    setRootGone(true);
    confettiRef.current?.({
      particleCount: 150,
      spread: 100,
      origin: { x: (breed.x + pan.x) / vp.w, y: (breed.y + pan.y) / vp.h },
      colors: ["#ffe227", "#ffffff", "#22c55e", "#ff6b6b"],
      startVelocity: 45,
    });
    window.setTimeout(() => { onRemove?.(breed.name); onClose(); }, 900);
  };
  useEffect(() => {
    if (!INSTR_NAMES.has(breed.name) || !framesDone) return;
    const t = window.setTimeout(() => { onRemove?.(breed.name); window.setTimeout(() => onClose(), 400); }, 2000);
    return () => window.clearTimeout(t);
  }, [framesDone, breed.name]); // eslint-disable-line react-hooks/exhaustive-deps
  // the main square card peels off once the grid is settled, whether by filling every frame
  // or by hitting Collect (which packs early, leaving framesDone false but the grid laid out)
  const canDragRoot = (framesDone || packed) && !collecting;
  const collectShowing = allBlue && !packed && !collecting && !framesDone; // the blue Collect button is on screen
  const complete = allBlue || packed; // swap to the green-tick icon and make it the obvious button
  // Auto-collect: the shortcut shows once armed (5s) while yellow circles remain.
  // One tap opens every branch, turns all circles blue and pops all cards out, the
  // same as tapping each one, but it costs a flat 1000 off the running total.
  const showAuto = autoArmed && totalNodes > 0 && seen.size < totalNodes && !packed && !collecting && !removing;
  const autoCollect = () => {
    setOpen(() => { const s = new Set<string>(["0"]); allNodes.forEach((n) => { if (n.hasKids) s.add(n.id); }); return s; });
    setAutoExposed(() => { const s = new Set<string>(); allNodes.forEach((n) => { if (!picked.has(n.id)) s.add(n.id); }); return s; });
    const imgNodes = allNodes.filter((n) => n.hasImg && !picked.has(n.id));
    // Ripple: each node turns blue and its card pops at the same moment
    allNodes.forEach((n, i) => {
      window.setTimeout(() => setSeen((prev) => { const s = new Set(prev); s.add(n.id); return s; }), i * 45);
    });
    imgNodes.forEach((n, i) => { window.setTimeout(() => setPicked((prev) => { const s = new Set(prev); s.add(n.id); return s; }), i * 45); });
    allNodes.forEach((n) => scoredRef.current.add(n.id));
    onScore?.(-2500); // the shortcut costs 2500
    const pk = (fxId.current += 1);
    setPenalty(pk);
    window.setTimeout(() => setPenalty((cur) => (cur === pk ? null : cur)), 1000);
    setAutoArmed(false);
  };
  // Double-clicking the root card walks the tree open one generation at a time,
  // then once everything is exposed folds it back deepest-first. Rings only: any
  // cards already pulled out stay put. Auto-revealed nodes score +50 each, less
  // than a manual tap (125/250) so hand-exploration stays the rewarding route.
  const revealStep = () => {
    // For instructional cards: show first child icon on first double-click
    if (INSTR_NAMES.has(breed.name)) {
      const firstUnpicked = shown.filter((n) => n.img && !picked.has(n._id) && n._parent);
      if (firstUnpicked.length > 0) {
        const n = firstUnpicked[0];
        const sh = n._parent ? Math.round((n._leaves / (n._parent as Node)._leaves) * 100) : 50;
        const rr = radius(sh), dd = rr + 10 + CW / 2;
        const px1 = n._x + Math.cos(n._dir ?? 0) * dd, py1 = n._y + Math.sin(n._dir ?? 0) * dd;
        setPicked((prev) => { const s = new Set(prev); s.add(n._id); return s; });
        setPinned((m) => { const x = new Map(m); x.set(n._id, { img: n.img as string, name: n.name, note: n.note ?? "", share: sh, mix: sh, status: null }); return x; });
        setDragPos((m) => { const x = new Map(m); x.set(n._id, { x: px1, y: py1 }); return x; });
        interacted.current = true; setIdleHint(false);
        return;
      }
    }
    const frontier = shown.filter((n) => n.children && n.children.length && !open.has(n._id));
    if (frontier.length) {
      const toOpen = INSTR_NAMES.has(breed.name) ? [frontier[0]] : frontier;
      setOpen((prev) => { const s = new Set(prev); toOpen.forEach((n) => s.add(n._id)); return s; });
      const pops: { x: number; y: number }[] = [];
      frontier.forEach((n) => {
        const kids = n.children as Node[];
        kids.forEach((k, ci) => {
          if (!scoredRef.current.has(k._id)) {
            scoredRef.current.add(k._id);
            pops.push({ x: n._x + (ci - (kids.length - 1) / 2) * 14, y: n._y - 8 }); // a +50 pops around the expanding parent
          }
        });
      });
      setSeen((prev) => { const s = new Set(prev); toOpen.forEach((n) => s.add(n._id)); return s; });
      pops.forEach((p) => flashNum(p.x, p.y, -100, FLASH_SIZE));
      // Instructional cards: show pick-card icon for each newly revealed child immediately
      if (INSTR_NAMES.has(breed.name)) {
        const newKids = toOpen.flatMap((n) => (n.children as Node[]) || []).filter((k) => k.img && !picked.has(k._id));
        newKids.forEach((n, i) => {
          window.setTimeout(() => {
            setPicked((prev) => { const s = new Set(prev); s.add(n._id); return s; });
            const sh = n._parent ? Math.round((n._leaves / (n._parent as Node)._leaves) * 100) : 50;
            const rr = radius(sh), dd = rr + 10 + CW / 2;
            const px1 = n._x + Math.cos(n._dir) * dd, py1 = n._y + Math.sin(n._dir) * dd;
            setPinned((m) => { const x = new Map(m); x.set(n._id, { img: n.img as string, name: n.name, note: n.note, share: sh, mix: sh, status: nodeStatus(n.name, n.note) }); return x; });
            setDragPos((m) => { const x = new Map(m); x.set(n._id, { x: px1, y: py1 }); return x; });
          }, i * 80);
        });
      }
      interacted.current = true; setIdleHint(false);
      return;
    }
    // nothing left to reveal: if any shown node still hasn't popped its ancestor
    // card, pop them all (a staggered ripple, +50 each) before any collapse begins.
    const toPop = shown.filter((n) => n._parent && n.img && !picked.has(n._id));
    if (toPop.length) {
      setSeen((prev) => { const s = new Set(prev); toPop.forEach((n) => s.add(n._id)); return s; });
      toPop.forEach((n, i) => {
        window.setTimeout(() => setPicked((prev) => { const s = new Set(prev); s.add(n._id); return s; }), i * 45);
        if (!scoredRef.current.has(n._id)) { scoredRef.current.add(n._id); flashNum(n._x, n._y - 8, -100, FLASH_SIZE); }
        if (INSTR_NAMES.has(breed.name) && n.img && n._parent) {
          const sh = Math.round((n._leaves / (n._parent as Node)._leaves) * 100);
          const rr = radius(sh), dd = rr + 10 + CW / 2;
          const INSTR_OFFSETS: Record<number,{dx:number;dy:number}> = {1:{dx:-50,dy:-5},2:{dx:25,dy:-5},3:{dx:-50,dy:-5},4:{dx:25,dy:-5}};
          const iOff = INSTR_OFFSETS[n.value as number] ?? {dx:0,dy:0};
          const px1 = n._x + Math.cos(n._dir) * dd + iOff.dx, py1 = n._y + Math.sin(n._dir) * dd + iOff.dy;
          setPinned((m) => { const x = new Map(m); x.set(n._id, { img: n.img as string, name: n.name, note: n.note, share: sh, mix: root ? Math.round((n._leaves / root._leaves) * 100) : sh, status: nodeStatus(n.name, n.note) }); return x; });
          setDragPos((m) => { const x = new Map(m); x.set(n._id, { x: px1, y: py1 }); return x; });
        }
      });
      interacted.current = true; setIdleHint(false);
      return;
    }
    // fully open: auto-place all unplaced cards into their frames with bubble animation
    const unplaced = pickCards.filter((c) => !placedSet.has(c.id) && !packed && !stackedIds.has(c.id));
    if (unplaced.length > 0) {
      // Track claimed frame IDs locally so duplicate-breed cards don't all race to the same empty frame
      const claimedFilled = new Map(filled); // snapshot: frameId -> cardId
      const claimedStacked = new Map(stacked); // snapshot: frameId -> cardIds[]
      unplaced.forEach((c, i) => {
        // Find target using local snapshot so each card claims a unique slot
        const emptyTarget = frames.find((f) => f.img === c.img && !claimedFilled.has(f.id));
        const stackTarget = emptyTarget ?? frames.find((f) => f.img === c.img);
        const target = stackTarget;
        const isDup = !emptyTarget && !!stackTarget;
        if (!target) return;
        // Claim the slot immediately in local snapshot
        if (isDup) {
          const arr = claimedStacked.get(target.id) ? [...claimedStacked.get(target.id)!] : [];
          arr.push(c.id);
          claimedStacked.set(target.id, arr);
        } else {
          claimedFilled.set(target.id, c.id);
        }
        window.setTimeout(() => {
          setPinned((m) => { if (m.has(c.id)) return m; const x = new Map(m); x.set(c.id, { img: c.img, name: c.name, note: c.note, share: c.share, mix: c.mix, status: c.status }); return x; });
          const sx0 = c.cardX, sy0 = c.cardY;
          const ex = target.sx - pan.x, ey = target.sy - pan.y;
          let lastBub = 0;
          tween(460, (t) => {
            const e2 = 1 - Math.pow(1 - t, 3);
            const gx = sx0 + (ex - sx0) * e2, gy = sy0 + (ey - sy0) * e2;
            setDragPos((m) => { const x = new Map(m); x.set(c.id, { x: gx, y: gy }); return x; });
            if (t - lastBub > 0.03 && t < 0.95) {
              lastBub = t;
              const bid = bubbleSeq.current++;
              setBubbles((b) => [...b, { id: bid, sx: gx + pan.x + (Math.random() - 0.5) * 14, sy: gy + pan.y + (Math.random() - 0.5) * 14 }]);
              window.setTimeout(() => setBubbles((b) => b.filter((x) => x.id !== bid)), 620);
            }
          }, () => {
            if (isDup) {
              setStacked((m) => { const x = new Map(m); const arr = x.get(target.id) ? [...x.get(target.id)!] : []; if (!arr.includes(c.id)) arr.push(c.id); x.set(target.id, arr); return x; });
            } else {
              setFilled((m) => { const x = new Map(m); for (const [fid, cid] of x) if (cid === c.id) x.delete(fid); x.set(target.id, c.id); return x; });
            }
            setDragPos((m) => { if (!m.has(c.id)) return m; const x = new Map(m); x.delete(c.id); return x; });
            flashNum(target.sx - pan.x, target.sy - pan.y - CW / 2, -50, FLASH_SIZE);
            const pid = puffSeq.current++;
            setPuffs((p) => [...p, { id: pid, sx: target.sx, sy: target.sy }]);
            window.setTimeout(() => setPuffs((p) => p.filter((x) => x.id !== pid)), 480);
          });
        }, i * 80);
      });
      return;
    }
    // all placed: fold the deepest ring back
    const openIds = [...open].filter((id) => id !== "0");
    if (!openIds.length) return;
    const deepest = openIds.filter((id) => {
      const node = shown.find((n) => n._id === id);
      if (!node || !node.children) return true;
      return !(node.children as Node[]).some((k) => open.has(k._id));
    });
    setOpen((prev) => { const s = new Set(prev); deepest.forEach((id) => s.delete(id)); return s; });
  };

  const doPack = (fx?: number, fy?: number, award: number = 400) => {
    if (packed) return;
    // One card per ancestor: the same forebear is often bred in several times, so
    // fold the repeats out and keep only the first of each in the pack.
    const seenKey = new Map<string, string>(); // key -> the primary card id holding that slot
    const hidden = new Set<string>();
    const uniq: typeof pickCards = [];
    const dups: { c: (typeof pickCards)[number]; primaryId: string; n: number }[] = [];
    const dupCount = new Map<string, number>();
    for (const c of pickCards) {
      const key = c.img || c.name; // fold by artwork: the same forebear under two spellings is one card
      if (seenKey.has(key)) {
        const n = (dupCount.get(key) || 0) + 1; dupCount.set(key, n);
        dups.push({ c, primaryId: seenKey.get(key)!, n }); // a duplicate: it will stack on its primary instead of vanishing
        continue;
      }
      seenKey.set(key, c.id);
      uniq.push(c);
    }
    const chum: typeof pickCards = [], alive: typeof pickCards = [], extinct: typeof pickCards = [];
    for (const c of uniq) (PACK_BREEDS.has(c.name) ? chum : isAlive(c.status) ? alive : extinct).push(c);
    // as many columns as comfortably fit the screen, so a deep tree's cards stay on screen
    const targets = new Map<string, { x: number; y: number }>();
    const labels: { chum: { x: number; y: number } | null; alive: { x: number; y: number } | null; extinct: { x: number; y: number } | null } = { chum: null, alive: null, extinct: null };
    if (isMobile) {
      // mirror the live frame grid: one continuous 4-wide bunch (chum, then alive, then extinct), no labels
      const ordered = [...chum, ...alive, ...extinct];
      ordered.forEach((c, g) => {
        const sx = F_LEFT + (g % MCOLS) * F_COL + gridX;
        const sy = chumTop + Math.floor(g / MCOLS) * F_ROW;
        targets.set(c.id, { x: sx - pan.x, y: sy - pan.y });
      });
    } else {
      const cols = Math.max(2, Math.min(6, Math.floor((vp.w - 120) / PACK_COL)));
      const place = (arr: typeof pickCards, top: number) => {
        arr.forEach((c, i) => {
          const sx = PACK_LEFT + (i % cols) * PACK_COL;
          const sy = top + Math.floor(i / cols) * PACK_ROW;
          targets.set(c.id, { x: sx - pan.x, y: sy - pan.y }); // screen target, stored in user coords
        });
        return top + Math.ceil(arr.length / cols) * PACK_ROW;
      };
      let y = 150;
      // header sits 40px higher than the card row so it clears the cancel buttons
      if (chum.length) { labels.chum = { x: PACK_LEFT - CW / 2, y: y - 40 }; y = place(chum, y + 64) + 8; }
      if (alive.length) { labels.alive = { x: PACK_LEFT - CW / 2, y: y - 40 }; y = place(alive, y + 64) + 8; }
      if (extinct.length) { labels.extinct = { x: PACK_LEFT - CW / 2, y: y - 30 }; place(extinct, y + 64); }
    }
    // where each card sits right now, so we can glide it from there to its slot
    // duplicates glide onto their primary's slot, stacked with a small cascade, instead of vanishing
    dups.forEach(({ c, primaryId, n }) => { if (PACK_BREEDS.has(c.name)) { hidden.add(c.id); return; } const pg = targets.get(primaryId); if (pg) targets.set(c.id, { x: pg.x + n * 11, y: pg.y + n * 11 }); }); /* chum-dedup + stack-stroke: a pack breed shows once; ancestors cascade enough to peek */
    const starts = new Map<string, { x: number; y: number }>();
    uniq.forEach((c) => starts.set(c.id, { x: c.cardX, y: c.cardY }));
    dups.forEach(({ c }) => starts.set(c.id, { x: c.cardX, y: c.cardY }));
    setPackLabels(labels);
    setPackHidden(hidden);
    setPacked(true);
    if (award) flashNum(fx ?? (160 - pan.x), fy ?? (96 - pan.y), award, FLASH_SIZE); // one-off award, fed into the pit total
    tween(460, (t) => {
      const e = 1 - Math.pow(1 - t, 3); // ease out
      setDragPos((prev) => {
        const m = new Map(prev);
        [...uniq, ...dups.map((d) => d.c)].forEach((c) => {
          const s = starts.get(c.id), g = targets.get(c.id);
          if (s && g) m.set(c.id, { x: s.x + (g.x - s.x) * e, y: s.y + (g.y - s.y) * e });
        });
        return m;
      });
    }, () => {
      setDragPos((prev) => { const m = new Map(prev); targets.forEach((g, id) => m.set(id, g)); return m; });
      uniq.forEach((c, i) => { const g = targets.get(c.id); if (g) window.setTimeout(() => flashNum(g.x, g.y - CW / 2, 100, FLASH_SIZE), i * 55); }); // a +100 pops from each card just after it lands
    });
  };

  // fully exposed = every branch that has children is open, nothing left to unfold
  const canRemove = showRemove && !removing;

  const startRemove = () => {
    if (removing) return;
    // Instructions cards: reveal all nodes, auto-place cards, poof root card, then close
    if (INSTR_NAMES.has(breed.name)) {
      // Step 1: reveal all unopened nodes immediately
      const allNodeIds = shown.map((n) => n._id);
      setOpen(new Set(allNodeIds.map(String)));
      // Step 2: poof the root card with 3 smoke balls, then remove and close
      burstAt(breed.x, breed.y, ROOT * 1.5);
      for (let i = 0; i < 3; i++) {
        const pid = puffSeq.current++;
        const ox = (Math.random() - 0.5) * ROOT * 1.2, oy = (Math.random() - 0.5) * ROOT * 1.2;
        setPuffs((p) => [...p, { id: pid, sx: breed.x + pan.x + ox, sy: breed.y + pan.y + oy }]);
        window.setTimeout(() => setPuffs((p) => p.filter((x) => x.id !== pid)), 480);
      }
      window.setTimeout(() => { onRemove?.(breed.name); onClose(); }, 500);
      return;
    }
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
    // hand the percentage circles straight to the pit so they drop in the instant the button is
    // hit; they fall from each node's spot in the family tree, and the connecting rods and the
    // blue name pills tip in with them. Node coords are user coords, so add the pan for the screen.
    const vis = shown.filter((n) => n._parent);
    const shareOf = (n: Node) => Math.round((n._leaves / (n._parent as Node)._leaves) * 100);
    const circles = INSTR_NAMES.has(breed.name) ? [] : vis.slice(0, 60).map((n) => {
      const share = shareOf(n);
      return { x: n._x + pan.x, y: n._y + pan.y, r: radius(share), share, name: n.name };
    });
    const rods = vis.slice(0, 70).map((n) => {
      const p = n._parent as Node;
      return { x1: p._x + pan.x, y1: p._y + pan.y, x2: n._x + pan.x, y2: n._y + pan.y, lit: open.has(n._id) };
    });
    const pills = vis
      .filter((n) => (n.children && n.children.length) || !autoExposed.has(n._id))
      .slice(0, 50)
      .map((n) => ({ x: n._x + pan.x, y: n._y - radius(shareOf(n)) - 13 + pan.y, w: n.name.length * 7.4 + 22, name: n.name }));
    onScatter?.({ circles, rods, pills });
    tween(520, (t) => setCollectT(t), () => {
      burstAt(50 - pan.x, vp.h - 133 - pan.y, ROOT * 1.5); // dot explosion centred on the bottom-left tally number
      // hold a beat so the bottom-left pack box can finish its pop before the overlay closes
      window.setTimeout(() => { onClose(); }, 680);
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
    if (rootGone) return null;
    const R = circular && rootRadius ? Math.max(40, Math.min(220, rootRadius)) : ROOT;
    const rx = cx, ry = cy; // root card stays in SVG content space; pan moves the whole tree including it
    const baseDeg = (cardLean * 180) / Math.PI;
    const rootXf = collecting && collectRef.current
      ? collectXf(rx, ry, collectRef.current.rootSpin, baseDeg)
      : { transform: `translate(${rx},${ry}) rotate(${baseDeg})`, opacity: 1 };
    const groupFade = collecting ? Math.max(0, 1 - collectT * 1.6) : 1;
    return (
    <>
      <g
        className={canDragRoot ? `${styles.rootHit} ${styles.grab}` : styles.rootHit}
        transform={rootXf.transform}
        style={{ opacity: rootXf.opacity }}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (allBlue && !packed && !collecting) {
            burstAt(rx, ry, ROOT * 0.9); doPack(rx, ry, 500);
          } else {
            // hop whole tree right+up away from the frames grid while frames still need filling
            if (!framesDone && !packed) {
              setPan((prev) => ({
                x: prev.x + 28 + Math.random() * 12,
                y: prev.y - 18 - Math.random() * 8,
              }));
            }
            revealStep();
          }
        }}
        onPointerDown={(e) => {
          if (!canDragRoot) return;
          e.stopPropagation();
          try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch {}
          // store both root start and pan start so we can update both in sync
          rootDrag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y, moved: false };
        }}
        onPointerMove={(e) => {
          const d = rootDrag.current; if (!d || e.pointerId !== d.id) return;
          const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
          if (!d.moved && Math.hypot(dx, dy) > 3) d.moved = true;
          if (d.moved) setPan({ x: d.ox + dx, y: d.oy + dy });
        }}
        onPointerUp={(e) => { const d = rootDrag.current; if (d && e.pointerId === d.id) { try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch {} rootDrag.current = null; } }}
        onPointerCancel={() => { rootDrag.current = null; }}
      >
                {INSTR_NAMES.has(breed.name) ? (() => {
          const IW = Math.round(128 * 1.33), IH = Math.round(IW * 1.36);
          const BORDER = Math.round(IW * 0.03), FOOTER = Math.round(IH * 0.18), RADIUS = IW * 0.1;
          const illoH = IH - FOOTER - BORDER * 2, illoW = IW - BORDER * 2;
          const INSTR_LABELS: Record<string,string> = {"Deal the cards":"DEAL THE CARDS","Head outside":"HEAD OUTSIDE","Spot real dogs":"SPOT REAL DOGS","Match to your chum":"MATCH YOUR CHUM","Find more chums":"FIND MORE CHUMS","Most chums wins":"MOST CHUMS WINS"};
          const caption = INSTR_LABELS[breed.name] ?? breed.name.toUpperCase();
          const fs = Math.max(10, Math.round(FOOTER * 0.32));
          return (<>
            <rect x={-IW/2} y={-IH/2} width={IW} height={IH} rx={RADIUS} fill="#ffed00" />
            <clipPath id={clip}><rect x={-IW/2+BORDER} y={-IH/2+BORDER} width={illoW} height={illoH} rx={RADIUS*0.7} /></clipPath>
            {breed.image && <image href={bust(breed.image)} x={-IW/2+BORDER} y={-IH/2+BORDER} width={illoW} height={illoH} clipPath={`url(#${clip})`} preserveAspectRatio="xMidYMid slice" />}
            <text x={0} y={IH/2-FOOTER/2} textAnchor="middle" dominantBaseline="central" style={{fill:"#0a3a57",fontFamily:'"Luckiest Guy",system-ui,sans-serif',fontSize:fs,fontWeight:400}}>{caption}</text>
          </>);
        })() : (<>
          <clipPath id={clip}><rect x={-R} y={-R} width={R*2} height={R*2} rx={circular ? R : 20} /></clipPath>
          <rect x={-R-5} y={-R-5} width={R*2+10} height={R*2+10} rx={circular ? R + 5 : 24} className={styles.rootCard} />
          {breed.image ? <image href={bust(breed.image)} x={-R} y={-R} width={R*2} height={R*2} clipPath={`url(#${clip})`} preserveAspectRatio="xMidYMid slice" /> : null}
        </>)}
        {/* the root card carries no status dot; only the ancestor cards show one */}
      </g>
      <g className={styles.rootHit} transform={`translate(${rx},${circular ? ry - R : ry + ROOT + 26})`} style={{ opacity: groupFade }} onClick={(e) => e.stopPropagation()}>
        {!INSTR_NAMES.has(breed.name) && (<g transform={circular ? `translate(0,${-(80 + tagH / 2)})` : undefined}><rect className={styles.tag} x={-tagW/2} y={-tagH/2} width={tagW} height={tagH} rx={16} />{tagLines.map((ln, li) => (<text key={li} className={styles.tagText} textAnchor="middle" dominantBaseline="central" y={tagLines.length > 1 ? (li === 0 ? -13 : 13) : 0}>{ln}</text>))}</g>)}
        {/* the 3-D Collect button sits on top; it orders the pack into the grid */}
        {/* Blue Learn button - on ALL cards including instructional */}
        {!packed && !collecting && !framesDone ? (() => {
          // Count ALL remaining revealStep clicks:
          // phase 1: each frontier layer to open
          // phase 2: expose images (toPop)
          // phase 3: place images into frames (unplaced)
          const instrFirstUnpicked = INSTR_NAMES.has(breed.name)
            ? shown.filter((n) => n.img && !picked.has(n._id) && n._parent)
            : [];
          const frontierNodes = shown.filter((n) => n.children && (n.children as Node[]).length && !open.has(n._id));
          const toPopNodes = shown.filter((n) => n._parent && n.img && !picked.has(n._id));
          const unplacedCards = pickCards.filter((c) => !placedSet.has(c.id) && !packed && !stackedIds.has(c.id));
          // Each frontier layer = 1 click; toPop phase = 1 click if needed; unplaced phase = 1 click if needed
          const instrIconClicks = INSTR_NAMES.has(breed.name) ? instrFirstUnpicked.length : 0;
          const frontierClicks = frontierNodes.length > 0 ? (INSTR_NAMES.has(breed.name) ? frontierNodes.length : 1) : 0;
          const toPopClick = toPopNodes.length > 0 ? 1 : 0; // always count if images to expose
          const unplacedClick = unplacedCards.length > 0 ? 1 : 0; // always count if cards to place
          const stepsLeft = instrIconClicks + frontierClicks + toPopClick + unplacedClick;
          return (
          <g
            className={styles.removeBtn}
            transform={`translate(0,${circular ? -18 : 62})`}
            onClick={(e) => { e.stopPropagation(); revealStep(); }}
            onPointerDown={(e) => e.stopPropagation()}
            role="button"
            aria-label="Learn"
          >
            <g className={styles.chumPop}>
              <rect x={-100} y={-26} width={200} height={68} rx={34} className={styles.compBase} />
              <g className={styles.chumTop}>
                <rect x={-100} y={-34} width={200} height={68} rx={34} className={styles.compPill} />
                <rect x={-88} y={-28} width={176} height={22} rx={12} className={styles.chumGloss} />
                <text className={styles.compText} textAnchor="middle" dominantBaseline="central" y={5}>Learn</text>
              </g>
            </g>
            {stepsLeft > 0 && (
              <text
                x={108}
                y={5}
                textAnchor="start"
                dominantBaseline="central"
                style={{ fontFamily: '"Luckiest Guy", system-ui, sans-serif', fontSize: 14, fill: "#ffffff", pointerEvents: "none" }}
              >{`x${stepsLeft} more`}</text>
            )}
          </g>
          );
        })() : null}
        {/* Mini pit: green Complete replaces Learn once every frame is filled */}
        {circular && framesDone && !rootGone && !scattered ? (
          <g
            className={styles.removeBtn}
            transform={`translate(0,-18)`}
            onClick={(e) => { e.stopPropagation(); circularComplete(); }}
            role="button"
            aria-label="Complete"
          >
            <g className={styles.chumPop}>
              <rect x={-100} y={-26} width={200} height={68} rx={34} className={styles.chumBase} />
              <g className={styles.chumTop}>
                <rect x={-100} y={-34} width={200} height={68} rx={34} className={styles.chumPill} />
                <rect x={-88} y={-28} width={176} height={22} rx={12} className={styles.chumGloss} />
                <text className={styles.chumText} textAnchor="middle" dominantBaseline="central" y={5}>Complete</text>
              </g>
            </g>
          </g>
        ) : null}
        {/* Green button - Complete/skip for instructional, Pack chum for dog cards */}
        {!circular && (canRemove || removing || INSTR_NAMES.has(breed.name)) && !packed && !collecting ? (
          <g
            className={styles.removeBtn}
            transform={`translate(0,${INSTR_NAMES.has(breed.name) ? 150 : (!packed && !collecting && !framesDone ? 138 : 62)})`}
            onClick={(e) => { e.stopPropagation(); flashNum(rx, ry + ROOT + 88, 500, FLASH_SIZE); startRemove(); }}
            role="button"
            aria-label={INSTR_NAMES.has(breed.name) ? "Complete" : "Choose as pack chum"}
          >
            <g className={styles.chumPop}>
              <rect x={-100} y={-26} width={200} height={68} rx={34} className={styles.chumBase} />
              <g className={removing ? styles.chumTopDown : styles.chumTop}>
                <rect x={-100} y={-34} width={200} height={68} rx={34} className={styles.chumPill} />
                <rect x={-88} y={-28} width={176} height={22} rx={12} className={styles.chumGloss} />
                <text className={styles.chumText} textAnchor="middle" dominantBaseline="central" y={5}>{INSTR_NAMES.has(breed.name) ? "Complete" : "Collect"}</text>
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
      className={`${styles.overlay}${circular ? " " + styles.overlayStrong : ""}`}
      onClick={closeIfTap}
      onPointerDown={onPanDown}
      onPointerMove={onPanMove}
      onPointerUp={onPanUp}
      onPointerCancel={onPanUp}
    >
      <button type="button" className={styles.close} onClick={() => { if (circular && !circularDoneRef.current) emitCircularScatter(false); onClose(); }} aria-label="Close">
        &times;
      </button>
      {totalNodes > 0 && frameTotal === 0 && !packed && !collecting && (() => {
        const prog = Math.min(1, seen.size / totalNodes); // 0 (none turned) -> 1 (all turned)
        const dotBg = `hsl(${212 - prog * 87}, ${72 + prog * 13}%, ${44 + prog * 3}%)`; // blue -> bright green
        return (
          <div className={styles.dotCount} style={{ background: dotBg }} aria-label={`${seen.size} of ${totalNodes} circles turned`}>
            {seen.size}/{totalNodes}
          </div>
        );
      })()}
      {frameTotal > 0 && !packed && !collecting && (
        <div className={styles.frameCount} aria-label={`${filled.size} of ${frameTotal} frames filled`}>
          {filled.size}/{frameTotal}
        </div>
      )}
      {frameTotal > 0 && !packed && !collecting && frameSlots.chum.length > 0 && (
        <div className={styles.packHead} style={{ left: F_LEFT - CW / 2, top: chumTop - 90 }}>A Pedigree Chum</div>
      )}
      {frameTotal > 0 && !packed && !collecting && frameSlots.alive.length > 0 && (
        <div className={styles.packHead} style={{ left: F_LEFT - CW / 2, top: aliveTop - 90 }}>Alive and kicking</div>
      )}
      {frameTotal > 0 && !packed && !collecting && frameSlots.extinct.length > 0 && (
        <div className={styles.packHead} style={{ left: F_LEFT - CW / 2, top: extinctTop - 90 }}>{INSTR_NAMES.has(breed.name) ? "How it works" : "These dogs have had their days"}</div>
      )}
      {showPack && !circular && !INSTR_NAMES.has(breed.name) && (
        <button
          type="button"
          className={`${styles.packBtn} ${packed ? styles.packDone : ""} ${allBlue && !packed ? styles.packReady : ""}`.trim()}
          style={{ opacity: packed ? 1 : packProgress }}
          onClick={(e) => { e.stopPropagation(); doPack(); }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={packed ? "Ancestor pack complete" : complete ? "Collect the ancestor pack" : "Collect the ancestor pack"}
        >
          <img className={styles.packIcon} src={(framesDone || packed) ? "/checklist-icon-complete.svg" : "/checklist-icon.svg"} alt="" aria-hidden="true" />
          <span className={styles.packText}>{packed ? "Done!" : "Collect Ancestor Pack"}</span>
        </button>
      )}
      {packed && packLabels.chum && (
        <div className={styles.packHead} style={{ left: packLabels.chum.x, top: packLabels.chum.y }}>A Pedigree Chum</div>
      )}
      {packed && packLabels.alive && (
        <div className={styles.packHead} style={{ left: packLabels.alive.x, top: packLabels.alive.y }}>Alive and kicking</div>
      )}
      {packed && packLabels.extinct && (
        <div className={styles.packHead} style={{ left: packLabels.extinct.x, top: packLabels.extinct.y }}>{INSTR_NAMES.has(breed.name) ? "How it works" : "These dogs have had their days"}</div>
      )}
      <svg className={styles.svg} viewBox={`${-pan.x} ${-pan.y} ${vp.w} ${vp.h}`} width={vp.w} height={vp.h} xmlns="http://www.w3.org/2000/svg">
        <g style={removing ? { pointerEvents: "none" } : undefined}>
        {hasTree ? (
          <>
            <g style={{ opacity: removing || scattered ? 0 : 1, display: scattered ? "none" : undefined, transition: "opacity 0.12s ease-out" }}>
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
                    style={allBlue ? { pointerEvents: "none" } : undefined}
                    onMouseEnter={() => { if (!drag.current?.moved) follow(n); }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (suppressClick.current) { suppressClick.current = false; return; }
                      interacted.current = true; setIdleHint(false); // any tap stops the first-ring hint
                      burstAt(n._x, n._y, r * 1.33); // pink starburst, 33% over the circle radius, exactly as the pit
                      const firstHit = !scoredRef.current.has(n._id);
                      if (firstHit) scoredRef.current.add(n._id);
                      setSeen((s) => { if (s.has(n._id)) return s; const x = new Set(s); x.add(n._id); return x; }); // first tap turns it blue
                      const baseVal = hasKids ? 125 : 250;
                      const mult = topBonus.get(PACK_IMG.get(n.name) ?? (n.img as string)) ?? 1; // top-3 breeds score more
                      flashNum(n._x, n._y - r, firstHit ? Math.round(baseVal * mult) : 0, FLASH_SIZE); // only the first tap on a node scores; later taps read 0
                      follow(n);
                      // a card placed in a frame is protected: a node click won't remove it
                      if (placedSet.has(n._id) || cardFrame.has(n._id)) { return; }
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
                        const rr = radius(sh), dd = rr + 10 + CW / 2;
                        const px = n._x + Math.cos(n._dir) * dd, py = n._y + Math.sin(n._dir) * dd;
                        setPinned((m) => { const x = new Map(m); x.set(n._id, { img: n.img as string, name: n.name, note: n.note, share: sh, mix: root ? Math.round((n._leaves / root._leaves) * 100) : sh, status: nodeStatus(n.name, n.note) }); return x; });
                        setDragPos((m) => { const x = new Map(m); x.set(n._id, { x: px, y: py }); return x; });
                      }
                    }}
                  >
                    <circle className={`${styles.disc} ${hasKids && !isOpen ? styles.has : ""} ${idleHint && !seen.has(n._id) && (n._parent as Node)?._id === "0" ? styles.hint : ""}`.trim()} r={r} style={(n.img && (placedImgs.has(n.img as string) || packed)) ? { fill: "#22c55e" } : seen.has(n._id) ? { fill: "#0c5b92" } : undefined} />
                    <text className={styles.pct} textAnchor="middle" dominantBaseline="central"
                      fontSize={INSTR_NAMES.has(breed.name) ? Math.max(13, r * 0.75) : Math.max(13, r * 0.5)}
                      style={(n.img && (placedImgs.has(n.img as string) || packed)) || seen.has(n._id) ? {fill:"#ffffff",...(INSTR_NAMES.has(breed.name)?{fontFamily:'"Luckiest Guy",system-ui,sans-serif',fontWeight:400}:{})} : INSTR_NAMES.has(breed.name)?{fontFamily:'"Luckiest Guy",system-ui,sans-serif',fontWeight:400}:undefined}>
                      {INSTR_NAMES.has(breed.name) ? (n.value ?? "") : `${share}%`}
                    </text>
                    {(hasKids || !autoExposed.has(n._id)) && !(circular && n.name === breed.name) ? (() => {
                      const nmW = n.name.length * 7.4 + 22; // pill hugs the name
                      const nmY = -r - 13;
                      return (
                        <g>
                          <rect className={styles.nmPill} x={-nmW / 2} y={nmY - 11} width={nmW} height={22} rx={11} />
                          <text className={styles.nm} textAnchor="middle" dominantBaseline="central" y={nmY}>
                            {n.name}
                          </text>
                        </g>
                      );
                    })() : null}
                    {hasKids && !isOpen && !INSTR_NAMES.has(breed.name) ? (
                      <text className={styles.plus} textAnchor="middle" y={r + 15}>
                        + {countProgenitors(n)} inside
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </g>
            {!packed && !collecting && frames.map((f, fi) => {
              const filledHere = filled.has(f.id);
              // a duplicate is being held when the dragged image already fills some frame
              const dupDrag = dragImg != null && frames.some((ff) => ff.img === dragImg && filled.has(ff.id));
              const wobbleHere = dragImg != null && dragImg === f.img && filledHere; // this filled frame matches the held duplicate: jiggle in welcome
              const dimHere = dupDrag && filledHere && dragImg !== f.img; // the other filled frames step back so the match stands out
              const lit = dragImg === f.img && !filledHere; // only this card's own box lights up
              let glow: { filter?: string; animationDelay?: string } | undefined = { animationDelay: `${(fi % 6) * 0.28}s` }; // ripple the idle hop
              if (lit && dragXY) {
                const g = Math.max(0, Math.min(1, 1 - Math.hypot(dragXY.x - f.sx, dragXY.y - f.sy) / 240)); // 0 far, 1 right on top
                if (g > 0.02) glow = { ...glow, filter: `drop-shadow(0 0 ${(4 + g * 22).toFixed(1)}px rgba(255, 210, 62, ${(0.25 + g * 0.6).toFixed(2)}))` };
              }
              return (
                <g
                  key={f.id}
                  transform={`rotate(${cardDeg.toFixed(2)} ${f.sx - pan.x} ${f.sy - pan.y})`}
                  onPointerDown={isMobile ? (e) => { e.stopPropagation(); startGridDrag(e); } : undefined}
                  onPointerMove={isMobile ? moveGridDrag : undefined}
                  onPointerUp={isMobile ? endGridDrag : undefined}
                  onPointerCancel={isMobile ? endGridDrag : undefined}
                  style={isMobile ? { touchAction: "none", pointerEvents: "auto" } : undefined}
                >
                  <rect
                    className={`${styles.frame} ${lit || correctFlash === f.id ? styles.frameLit : ""} ${filledHere ? styles.frameFilled : ""} ${shakeFrame === f.id ? styles.frameShake : ""} ${wobbleHere ? styles.frameExpect : ""} ${dimHere ? styles.frameDim : ""}`.trim()}
                    style={glow}
                    x={f.sx - pan.x - CW / 2}
                    y={f.sy - pan.y - CW / 2}
                    width={CW}
                    height={CW}
                    rx={circular ? CW / 2 : 15}
                  />
                  {(lit && dragName || wrongDog?.frameId === f.id) && ( /* pickup-name: label inside frame, clipped */
                    <>
                      <clipPath id={`lbl-clip-${f.id}`}>
                        <rect x={f.sx - pan.x - CW / 2 + 4} y={f.sy - pan.y - CW / 2 + 4} width={CW - 8} height={CW - 8} />
                      </clipPath>
                      <text
                        x={f.sx - pan.x}
                        y={f.sy - pan.y + 5}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        clipPath={`url(#lbl-clip-${f.id})`}
                        style={{ fill: wrongDog?.frameId === f.id ? "#ffffff" : "#ffd23e", font: `700 ${wrongDog?.frameId === f.id ? 18 : 14}px ${wrongDog?.frameId === f.id ? "'Luckiest Guy', " : ""}Montserrat, system-ui, sans-serif`, pointerEvents: "none" }}
                      >
                        {wrongDog?.frameId === f.id ? (
                          <>
                            <tspan x={f.sx - pan.x} dy={-10}>WRONG</tspan>
                            <tspan x={f.sx - pan.x} dy={22}>DOG</tspan>
                          </>
                        ) : (() => {
                          // split breed name into words, up to 3 lines
                          const words = (dragName || "").split(" ");
                          const lineH = 14;
                          const startY = words.length === 1 ? 0 : words.length === 2 ? -lineH / 2 : -lineH;
                          return words.map((w, i) => (
                            <tspan key={i} x={f.sx - pan.x} dy={i === 0 ? startY : lineH}>{w}</tspan>
                          ));
                        })()}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
            {!packed && !collecting && bubbles.map((b) => (
              <circle key={b.id} className={styles.bubble} cx={b.sx - pan.x} cy={b.sy - pan.y} r={7} style={{ pointerEvents: "none" }} />
            ))}
            {!packed && !collecting && puffs.map((p) => (
              <g key={p.id} className={styles.puff} transform={`translate(${p.sx - pan.x},${p.sy - pan.y})`} style={{ pointerEvents: "none" }}>
                {[
                  { cx: 0, cy: 2, r: 24, tx: 0, ty: -6, d: 0 },     // central billow
                  { cx: -20, cy: 8, r: 18, tx: -58, ty: -2, d: 0 }, // shoved out left
                  { cx: 20, cy: 8, r: 18, tx: 58, ty: -2, d: 0 },   // shoved out right
                  { cx: -14, cy: 14, r: 15, tx: -42, ty: 26, d: 0 }, // dust skidding down-left
                  { cx: 14, cy: 14, r: 15, tx: 42, ty: 26, d: 0 },   // dust skidding down-right
                  { cx: -8, cy: -14, r: 16, tx: -22, ty: -40, d: 0 }, // up-left
                  { cx: 8, cy: -14, r: 16, tx: 22, ty: -40, d: 0 },   // up-right
                  { cx: 0, cy: 16, r: 13, tx: 0, ty: 34, d: 0 },      // straight down along the table
                ].map((q, i) => (
                  <circle key={i} className={styles.puffP} cx={q.cx} cy={q.cy} r={q.r} style={{ ["--tx" as string]: `${q.tx}px`, ["--ty" as string]: `${q.ty}px`, animationDelay: `${q.d}ms` }} />
                ))}
              </g>
            ))}
            {pickCards.map((c) => { /* stable card order: the zoom is a separate overlay, so no reordering (which used to remount + re-wobble every card) */
              if (packed && packHidden.has(c.id)) return null; // folded-out duplicate
              if (stackedIds.has(c.id)) return null; // absorbed into a frame's stack
              if (cardFrame.has(c.id) && !collectRef.current) return null; // placed cards rendered as fixed HTML outside SVG
              const clipId = `lm-pick-${c.id}`;
              const packScale = 1; // the zoom is now a draggable overlay, not an in-place scale /* zoom-overlay */
              const ci = collecting && collectRef.current ? collectRef.current.cards.get(c.id) : null;
              const cxf = ci ? collectXf(c.cardX, c.cardY, ci.spin, cardDeg) : null; // tumble to the corner with the main card
              return (
                <g
                  key={`pick-${c.id}`}
                  className={(placedSet.has(c.id) || packed) && !PACK_BREEDS.has(c.name) ? styles.rootHit : `${styles.rootHit} ${styles.grab}`} /* zoom-cursor: fixed images get the magnifier cursor, loose cards grab */
                  transform={(() => {

                    const crx = c.cardX - CW / 2, cry = c.cardY - CW / 2;
                    const zoom = `translate(${crx},${cry}) scale(${packScale}) translate(${-crx},${-cry})`;
                    const underneath = packed && isDupImg(c.img) && !isTopOfStack(c);
                    const fan = underneath ? (((stackOrder.get(c.id) ?? 0) % 2) ? 1 : -1) * (2 + ((stackOrder.get(c.id) ?? 0) % 2)) : 0;
                    return cxf
                      ? `${cxf.transform} ${zoom}`
                      : `translate(${c.cardX},${c.cardY}) rotate(${cardDeg + fan}) translate(${-c.cardX},${-c.cardY}) ${zoom}`;
                  })()}
                  style={{ ...(cxf ? { opacity: cxf.opacity } : packed ? { pointerEvents: "none" as const, ...(isDupImg(c.img) && !isTopOfStack(c) && !PACK_BREEDS.has(c.name) ? { filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))" } : {}) } : (placedSet.has(c.id) && !PACK_BREEDS.has(c.name)) ? { cursor: "zoom-in" } : {}), ...((placedSet.has(c.id) || packed) && !PACK_BREEDS.has(c.name) ? { pointerEvents: "all" as const } : {}) }}

                  onClick={(e) => {
                    e.stopPropagation();
                    // zoom only via magnifying glass icon, not direct click
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (packed || placedSet.has(c.id)) return; // already framed, or in pack mode
                    const empty = frames.find((f) => f.img === c.img && !filled.has(f.id));
                    const target = empty || frames.find((f) => f.img === c.img && filled.get(f.id) !== c.id);
                    if (!target) return; // no matching frame for this dog
                    // pin first so the card outlives any branch closing while it glides
                    setPinned((m) => { if (m.has(c.id)) return m; const x = new Map(m); x.set(c.id, { img: c.img, name: c.name, note: c.note, share: c.share, mix: c.mix, status: c.status }); return x; });
                    const sx0 = c.cardX, sy0 = c.cardY;                    // start: the card's home, in content space
                    const ex = target.sx - pan.x, ey = target.sy - pan.y;  // end: the frame, converted to content space
                    let lastBub = 0;
                    tween(460, (t) => {
                      const e2 = 1 - Math.pow(1 - t, 3);                   // ease-out glide
                      const gx = sx0 + (ex - sx0) * e2, gy = sy0 + (ey - sy0) * e2;
                      setDragPos((m) => { const x = new Map(m); x.set(c.id, { x: gx, y: gy }); return x; });
                      if (t - lastBub > 0.12 && t < 0.95) {               // drop a bubble every so often along the path
                        lastBub = t;
                        const bid = bubbleSeq.current++;
                        setBubbles((b) => [...b, { id: bid, sx: gx + pan.x + (Math.random() - 0.5) * 14, sy: gy + pan.y + (Math.random() - 0.5) * 14 }]);
                        window.setTimeout(() => setBubbles((b) => b.filter((x) => x.id !== bid)), 620);
                      }
                    }, () => {
                      if (empty) {
                        setFilled((m) => { const x = new Map(m); for (const [fid, cid] of x) if (cid === c.id) x.delete(fid); x.set(target.id, c.id); return x; });
                        setDragPos((m) => { if (!m.has(c.id)) return m; const x = new Map(m); x.delete(c.id); return x; });
                      } else {
                        setStacked((m) => { const x = new Map(m); const arr = x.get(target.id) ? [...x.get(target.id)!] : []; if (!arr.includes(c.id)) arr.push(c.id); x.set(target.id, arr); return x; });
                        setDragPos((m) => { if (!m.has(c.id)) return m; const x = new Map(m); x.delete(c.id); return x; });
                      }
                      flashNum(target.sx - pan.x, target.sy - pan.y - CW / 2, 5, FLASH_SIZE); // +5 for the double-click shortcut (drag is worth more)
                      const pid = puffSeq.current++;
                      setPuffs((p) => [...p, { id: pid, sx: target.sx, sy: target.sy }]);
                      window.setTimeout(() => setPuffs((p) => p.filter((x) => x.id !== pid)), 480);
                    });
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    if (placedSet.has(c.id)) { if (isMobile) startGridDrag(e); return; } // framed: fixed, not draggable; drives the grid scroll on mobile
                    try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch {}
                    cardDrag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: c.cardX, oy: c.cardY, moved: false };
                    setDragCat(PACK_BREEDS.has(c.name) ? "chum" : isAlive(c.status) ? "alive" : "extinct"); // light up the matching frames
                    setDragImg(c.img);
                    setDragName(c.name); /* pickup-name */
                    setDragXY({ x: e.clientX, y: e.clientY });
                  }}
                  onPointerMove={(e) => {
                    if (placedSet.has(c.id)) { if (isMobile) moveGridDrag(e); return; }
                    const cd = cardDrag.current;
                    if (!cd || e.pointerId !== cd.id) return;
                    const dx = e.clientX - cd.sx, dy = e.clientY - cd.sy;
                    if (!cd.moved && Math.hypot(dx, dy) > 3) cd.moved = true;
                    if (cd.moved) {
                      suppressClick.current = true;
                      setDragXY({ x: e.clientX, y: e.clientY });
                      setDragPos((m) => {
                        const next = new Map(m);
                        next.set(c.id, { x: cd.ox + dx, y: cd.oy + dy });
                        return next;
                      });
                      // snapshot once so the card outlives its branch closing
                      setPinned((m) => {
                        if (m.has(c.id)) return m;
                        const next = new Map(m);
                        next.set(c.id, { img: c.img, name: c.name, note: c.note, share: c.share, mix: c.mix, status: c.status });
                        return next;
                      });
                    }
                  }}
                  onPointerUp={(e) => {
                    if (placedSet.has(c.id)) { if (isMobile) endGridDrag(e); return; }
                    const cd = cardDrag.current;
                    if (cd && e.pointerId === cd.id) {
                      try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch {}
                      if (cd.moved) {
                        const hit = frames.find((f) => Math.abs(e.clientX - f.sx) <= CW / 2 && Math.abs(e.clientY - f.sy) <= CW / 2);
                        if (hit && hit.img === c.img && !filled.has(hit.id)) {
                          // first copy of this breed: it fills the frame (+100)
                          setFilled((m) => { const x = new Map(m); for (const [fid, cid] of x) if (cid === c.id) x.delete(fid); x.set(hit.id, c.id); return x; });
                          setDragPos((m) => { if (!m.has(c.id)) return m; const x = new Map(m); x.delete(c.id); return x; }); // the frame position takes over
                          flashNum(hit.sx - pan.x, hit.sy - pan.y - CW / 2, 100, FLASH_SIZE); // +100 emanates from the frame
                          const pid = puffSeq.current++; // smoke poof where it lands
                          setPuffs((p) => [...p, { id: pid, sx: hit.sx, sy: hit.sy }]);
                          window.setTimeout(() => setPuffs((p) => p.filter((x) => x.id !== pid)), 480);
                        } else if (hit && hit.img === c.img && filled.get(hit.id) !== c.id) {
                          // a duplicate dropped onto an already-filled matching frame: stack it on top (+500)
                          setStacked((m) => { const x = new Map(m); const arr = x.get(hit.id) ? [...x.get(hit.id)!] : []; if (!arr.includes(c.id)) arr.push(c.id); x.set(hit.id, arr); return x; });
                          setDragPos((m) => { if (!m.has(c.id)) return m; const x = new Map(m); x.delete(c.id); return x; });
                          flashNum(hit.sx - pan.x, hit.sy - pan.y - CW / 2, 500, FLASH_SIZE); // every duplicate placed is worth 500
                          const pid = puffSeq.current++;
                          setPuffs((p) => [...p, { id: pid, sx: hit.sx, sy: hit.sy }]);
                          window.setTimeout(() => setPuffs((p) => p.filter((x) => x.id !== pid)), 480);
                        } else if (hit && hit.img !== c.img) {
                          setShakeFrame(hit.id);
                          window.setTimeout(() => setShakeFrame((s) => (s === hit.id ? null : s)), 460);
                          // wrong dog: flash label on frame, subtract 5 points, flash correct frame
                          flashNum(hit.sx - pan.x, hit.sy - pan.y - CW / 2, -5, FLASH_SIZE);
                          setWrongDog({ frameId: hit.id, x: hit.sx - pan.x, y: hit.sy - pan.y });
                          window.setTimeout(() => setWrongDog((w) => w?.frameId === hit.id ? null : w), 800);
                          const correctFrame = frames.find((f) => f.img === c.img && !filled.has(f.id));
                          if (correctFrame) { setCorrectFlash(correctFrame.id); window.setTimeout(() => setCorrectFlash((cf) => cf === correctFrame.id ? null : cf), 800); }
                          // a wrong box repels: bump the card just outside its edge, in the
                          // direction it came from, rather than flinging it back to the start
                          let dx = e.clientX - hit.sx, dy = e.clientY - hit.sy;
                          let len = Math.hypot(dx, dy);
                          if (len < 6) { dx = 0; dy = 1; len = 1; } // dropped dead-centre: spit it out the bottom
                          const push = CW * 0.95 + 14; // frame centre to card centre, just clear of the edge
                          const ox2 = hit.sx + (dx / len) * push, oy2 = hit.sy + (dy / len) * push;
                          setDragPos((m) => { const x = new Map(m); x.set(c.id, { x: ox2 - pan.x, y: oy2 - pan.y }); return x; });
                        }
                      }
                      cardDrag.current = null;
                    }
                    setDragCat(null);
                    setDragImg(null);
                    setDragName(null); /* pickup-name */
                    setDragXY(null);
                  }}
                  onPointerCancel={() => { cardDrag.current = null; setDragCat(null); setDragImg(null); setDragXY(null); }}
                >
                  <g className={styles.pickWobble}>
                  {(() => { const p = INSTR_NAMES.has(breed.name) ? CW*0.20 : 0; return (<><clipPath id={clipId}><rect x={c.cardX-CW/2+p} y={c.cardY-CW/2+p} width={CW-p*2} height={CW-p*2} rx={circular ? (CW-p*2)/2 : 15} /></clipPath><image href={encodeURI(bust(c.img))} x={c.cardX-CW/2+p} y={c.cardY-CW/2+p} width={CW-p*2} height={CW-p*2} clipPath={`url(#${clipId})`} preserveAspectRatio={INSTR_NAMES.has(breed.name)?"xMidYMid meet":"xMidYMid slice"} /></>); })()}
                  {!INSTR_NAMES.has(breed.name) && <rect x={c.cardX-CW/2} y={c.cardY-CW/2} width={CW} height={CW} rx={circular ? CW/2 : 15} vectorEffect="non-scaling-stroke" className={isDupImg(c.img) && !isTopOfStack(c) && !PACK_BREEDS.has(c.name) ? `${styles.pickCard} ${styles.pickCardStack}` : styles.pickCard} />}
                  {INSTR_NAMES.has(breed.name) && placedSet.has(c.id) && (() => { const words = c.name.split(" "); let l1="",l2=""; const mc=Math.floor(CW/7.5); for(const w of words){if((l1+(l1?" ":"")+w).length<=mc)l1+=(l1?" ":"")+w;else l2+=(l2?" ":"")+w;} const ls={fill:"#ffffff",fontFamily:'"Luckiest Guy",system-ui,sans-serif',fontSize:12,fontWeight:400,pointerEvents:"none" as const}; const by1=c.cardY+CW/2+48; const by2=c.cardY+CW/2+40; return l2?(<text x={c.cardX} textAnchor="middle" style={ls}><tspan x={c.cardX} y={by2}>{l1}</tspan><tspan x={c.cardX} dy={20}>{l2}</tspan></text>):(<text x={c.cardX} y={by1} textAnchor="middle" dominantBaseline="central" style={ls}>{l1}</text>); })()}
                  {isTopOfStack(c) && zoomedId !== c.id && !PACK_BREEDS.has(c.name) && !INSTR_NAMES.has(breed.name) && (() => {
                    const ts = TAG_STYLE[c.status ?? "extinct"]; // no tag means old stock, counted as gone, so red
                    const dx = c.cardX - CW / 2, dy = c.cardY - CW / 2; // top-left corner, protruding like the close button
                    return (
                      <circle cx={dx} cy={dy} r={6} style={{ fill: ts.bg, stroke: "#ffffff", strokeWidth: 1.5, pointerEvents: "none" }}>
                        <title>{ts.label}</title>
                      </circle>
                    );
                  })()}
                  {!packed && !placedSet.has(c.id) && (() => {
                    const ccx = c.cardX - CW / 2, ccy = c.cardY + CW / 2; // bottom-left corner, on loose cards only (placed cards show the magnifier)
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
                  {(placedSet.has(c.id) || packed) && zoomedId !== c.id && !PACK_BREEDS.has(c.name) && !INSTR_NAMES.has(breed.name) && (() => {
                    const mx = c.cardX - CW / 2 + 15, my = c.cardY + CW / 2 - 13; // inside the box, bottom-left (nudged +4 right, 2 up)
                    return (
                      <g
                        style={{ cursor: "zoom-in" }}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); setZoomedId((z) => (z === c.id ? null : c.id)); }}
                        role="button"
                        aria-label="Magnify"
                      >
                        <circle cx={mx} cy={my} r={11} style={{ fill: "rgba(0,0,0,0.001)", pointerEvents: "all" }} />
                        <circle cx={mx - 1.4} cy={my - 1.4} r={4.2} style={{ fill: "none", stroke: "#ffffff", strokeWidth: 1.8, pointerEvents: "none" }} />
                        <path d={`M ${mx + 1.9} ${my + 1.9} l 4 4`} stroke="#ffffff" strokeWidth={2} strokeLinecap="round" style={{ pointerEvents: "none" }} />
                      </g>
                    );
                  })()}
                  {packed && (isTopOfStack(c) || PACK_BREEDS.has(c.name)) && zoomedId !== c.id && (() => { /* chum-fix: chums always show their pill */
                    const pw = 50, ph = 24, py = c.cardY + CW / 2 - ph / 2 - 2; // pill near the foot of the card (nudged down)
                    const pillRight = c.cardX + CW / 2 + 1; // right-aligned to the card, nudged 5px left
                    // ADJ* tag overlapping the badge's top-right, only when the figure was actually adjusted
                    const pillMix = breedMix.get(c.img)?.norm ?? c.mix; // use fully normalised figure from breedMix
                    const wasAdjusted = c.share !== pillMix; // adjusted cards get a * in the pill
                    return (
                      <g
                        style={{ cursor: "pointer" }}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); if (pctHover === c.id) { setPctHover(null); } else { closeAll(); setPctHover(c.id); } }}
                      >
                        <rect x={pillRight - pw} y={py} width={pw} height={ph} rx={ph / 2} style={{ fill: "rgba(0,0,0,0.001)", pointerEvents: "all" }} />
                        <rect className={styles.mixPill} x={pillRight - pw} y={py} width={pw} height={ph} rx={ph / 2} style={{ filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.45))", pointerEvents: "none" }} />
                        <text className={styles.mixText} textAnchor="end" x={pillRight - 6} y={py + ph / 2 + 1} dominantBaseline="central">
                          {(pillMix < 1 ? "<1%" : `${rolledMix(c.id, pillMix)}%`) + (wasAdjusted ? "*" : "")}
                        </text>
                      </g>
                    );
                  })()}
                  {isTopOfStack(c) && (placedSet.has(c.id) || packed) && zoomedId !== c.id && !PACK_BREEDS.has(c.name) && !INSTR_NAMES.has(breed.name) && (breedInfo[c.name] || c.note) ? (() => {
                    const ix = c.cardX + CW / 2, iy = c.cardY - CW / 2; // top-right corner
                    return (
                      <g
                        style={{ cursor: "pointer" }}
                        transform={`translate(${ix},${iy}) scale(0.9) translate(${-ix},${-iy})`}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          const opening = infoHover !== c.id;
                          if (infoHover === c.id) { setInfoHover(null); } else { closeAll(); setInfoHover(c.id); } // tap to toggle, works on touch and mouse
                          if (opening && !infoSeen.current.has(c.id)) {
                            infoSeen.current.add(c.id);
                            flashNum(ix, iy, 2, FLASH_SIZE); // +2 the first time this card's info is exposed, white and small like the rest
                          }
                        }}
                      >
                        <circle cx={ix} cy={iy} r={18} style={{ fill: "rgba(0,0,0,0.001)", pointerEvents: "all" }} />
                        <circle cx={ix} cy={iy} r={12} style={{ fill: "var(--blue-deep)", stroke: "#ffffff", strokeWidth: 2 }} />
                        <text x={ix} y={iy + 0.5} textAnchor="middle" dominantBaseline="central" style={{ fill: "#ffffff", font: "italic 700 14px Georgia, serif", pointerEvents: "none" }}>i</text>
                      </g>
                    );
                  })() : null}
                  </g>
                </g>
              );
            })}
{/* stacked duplicate cards rendered as fixed HTML below */}
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
        {wrongDog && (
          <text
            key={wrongDog.frameId}
            x={wrongDog.x}
            y={wrongDog.y}
            textAnchor="middle"
            style={{ fontFamily: "var(--font-display, 'Luckiest Guy', system-ui)", fontSize: `${Math.round(CW * 0.22)}px`, fill: "#ff2d4f", pointerEvents: "none" }}
            className={styles.wrongDogFlash}
          >
            Wrong dog
          </text>
        )}
        {flashes.map((f) => (
          <text key={`f${f.id}`} className={styles.flashNum} x={f.x} y={f.y} fontSize={f.size} textAnchor="middle">
            {f.val}
          </text>
        ))}
        </g>
      </svg>
      {infoHover && (() => {
        const c = pickCards.find((x) => x.id === infoHover);
        const text = c ? (breedInfo[c.name] || c.note) : null;
        if (!c || !text) return null;
        // if zoom is open for same card, sit right of the zoomed image; otherwise right of the card
        const zoomOpen = zoomedId === c.id;
        const zoomSize = CW * 3;
        const left = zoomOpen ? c.cardX - CW / 2 + pan.x + zoomOff.x + zoomSize + 10 : c.cardX + CW / 2 + 14 + pan.x;
        const top = zoomOpen ? c.cardY - CW / 2 + pan.y + zoomOff.y : c.cardY - CW / 2 - 6 + pan.y;
        return (
          <div
            onMouseLeave={() => setInfoHover(null)}
            style={{
              position: "fixed", left, top, maxWidth: 190, zIndex: 100, pointerEvents: "auto",
              background: "rgba(10, 58, 87, 0.92)", color: "#ffffff",
              font: "500 11px/1.4 Montserrat, system-ui, sans-serif", padding: "7px 10px",
              borderRadius: "8px", boxShadow: "0 4px 12px rgba(10, 58, 87, 0.35)",
            }}
          >
            <div style={{ fontFamily: "'Luckiest Guy', system-ui", fontSize: "13px", marginBottom: "4px", color: "var(--yellow, #ffd23e)" }}>{c.name}</div>
            {text}
          </div>
        );
      })()}
      {/* Stacked duplicate cards as fixed HTML -- immune to pan */}
      {!packed && !collecting && frames.map((f) => {
        const ids = stacked.get(f.id);
        if (!ids || !ids.length || !filled.has(f.id)) return null;
        return ids.map((sid, i) => {
          const off = (i + 1) * 7;
          const stackTilt = (i % 2 ? 1 : -1) * (5 + (i % 3) * 2);
          const left = f.sx - CW / 2 + off * 0.55;
          const top = f.sy - CW / 2 + off * 0.55;
          return (
            <div
              key={`stk-html-${sid}`}
              style={{
                position: "fixed", left, top, width: CW, height: CW,
                borderRadius: 15, overflow: "hidden",
                transform: `rotate(${(cardDeg + stackTilt).toFixed(2)}deg)`,
                transformOrigin: "center",
                pointerEvents: "none",
                zIndex: 63 + i,
                boxShadow: "0 3px 3px rgba(0,0,0,0.32)",
                userSelect: "none",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={encodeURI(bust(f.img))} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: 15, border: "3px solid rgba(255,255,255,0.3)", pointerEvents: "none" }} />
            </div>
          );
        });
      })}
      {/* Placed cards rendered as position:fixed HTML -- completely immune to SVG pan */}
      {pickCards.filter((c) => cardFrame.has(c.id) && !collectRef.current && !stackedIds.has(c.id)).map((c) => {
        const ff2 = cardFrame.get(c.id)!;
        const left = ff2.sx - CW / 2;
        const top = ff2.sy - CW / 2;
        return (
          <div
            key={`placed-${c.id}`}
            draggable={false}
            style={{
              position: "fixed", left, top, width: CW, height: CW,
              borderRadius: 15, overflow: "visible",
              transform: `rotate(${cardDeg}deg)`,
              transformOrigin: "center",
              pointerEvents: "all",
              cursor: !PACK_BREEDS.has(c.name) ? "zoom-in" : "default",
              zIndex: 62,
              boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
              userSelect: "none",
              touchAction: "none",
              outline: "3px solid var(--yellow, #ffd23e)",
              outlineOffset: "-1px",
            }}
            onClick={(e) => { e.stopPropagation(); }}
            onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); if (isMobile) startGridDrag(e); }}
            onPointerMove={(e) => { e.stopPropagation(); if (isMobile) moveGridDrag(e); }}
            onPointerUp={(e) => { e.stopPropagation(); if (isMobile) endGridDrag(e); }}
            onPointerCancel={(e) => { e.stopPropagation(); if (isMobile) endGridDrag(e); }}
          >
            <div style={{ width: "100%", height: "100%", borderRadius: 13, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: INSTR_NAMES.has(breed.name) ? "rgba(10,58,87,0.08)" : "transparent" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={encodeURI(bust(c.img))}
                alt={c.name}
                draggable={false}
                style={{ width: INSTR_NAMES.has(breed.name) ? "65%" : "100%", height: INSTR_NAMES.has(breed.name) ? "65%" : "100%", objectFit: INSTR_NAMES.has(breed.name) ? "contain" : "cover", display: "block" }}
              />
            </div>
            {INSTR_NAMES.has(breed.name) && (
              <div style={{ position: "absolute", bottom: -20, left: 0, right: 0, textAlign: "center", fontFamily: "'Luckiest Guy', system-ui, sans-serif", fontSize: 10, color: "#ffffff", pointerEvents: "none", lineHeight: 1.2 }}>
                {c.name}
              </div>
            )}
            {/* magnify icon bottom-left */}
            {isTopOfStack(c) && !PACK_BREEDS.has(c.name) && !INSTR_NAMES.has(breed.name) && (
              <button
                style={{ position: "absolute", left: 4, bottom: 4, width: 28, height: 28, border: "none", borderRadius: 8, background: "rgba(10,58,87,0.75)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, zIndex: 65 }}
                onClick={(e) => { e.stopPropagation(); magnifyHold(c.id); }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg>
              </button>
            )}
            {/* status dot top-left */}
            {isTopOfStack(c) && !PACK_BREEDS.has(c.name) && !INSTR_NAMES.has(breed.name) && (() => {
              const ts = TAG_STYLE[c.status ?? "extinct"];
              return (
                <div title={ts.label} style={{ position: "absolute", left: -4, top: -4, width: 12, height: 12, borderRadius: "50%", background: ts.bg, border: "1.5px solid #fff", pointerEvents: "none" }} />
              );
            })()}
            {/* info icon top-right */}
            {isTopOfStack(c) && !INSTR_NAMES.has(breed.name) && (breedInfo[c.name] || c.note) && (
              <button
                style={{ position: "absolute", right: -14, top: -14, width: 28, height: 28, border: "2px solid #fff", borderRadius: "50%", background: "var(--blue-deep, #0c5b92)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, fontStyle: "italic", fontWeight: 700, fontSize: 14, fontFamily: "Georgia, serif", zIndex: 65 }}
                onClick={(e) => { e.stopPropagation(); if (infoHover === c.id) { setInfoHover(null); } else { closeAll(); setInfoHover(c.id); } }}
                onPointerDown={(e) => e.stopPropagation()}
              >i</button>
            )}
            {/* % pill bottom-right */}
            {isTopOfStack(c) && !INSTR_NAMES.has(breed.name) && (() => {
              const pillMix = breedMix.get(c.img)?.norm ?? c.mix;
              const pillTxt = pillMix < 1 ? "<1%*" : `${Math.round(pillMix)}%${c.share !== pillMix ? "*" : ""}`;
              return (
                <div
                  onClick={(e) => { e.stopPropagation(); if (pctHover === c.id) { setPctHover(null); } else { closeAll(); setPctHover(c.id); } }}
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{ position: "absolute", right: -2, bottom: -14, background: "rgba(10,58,87,0.85)", color: "#ffd23e", borderRadius: 12, padding: "2px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "Montserrat, system-ui", zIndex: 65 }}
                >
                  {pillTxt}
                </div>
              );
            })()}
          </div>
        );
      })}
      {zoomedId && (() => {
        const c = pickCards.find((x) => x.id === zoomedId);
        if (!c) return null;
        const big = CW * 3; // 3x enlarged
        // start at the card's on-screen top-left, then grow down-right, plus any drag offset
        const left = c.cardX - CW / 2 + pan.x + zoomOff.x;
        const top = c.cardY - CW / 2 + pan.y + zoomOff.y;
        return (
          <img
            src={encodeURI(bust(c.img))}
            alt={c.name}
            draggable={false}
            onMouseEnter={() => { if (zoomTimer.current) { window.clearTimeout(zoomTimer.current); zoomTimer.current = null; } }}
            onMouseLeave={() => { if (!zoomDrag.current) magnifyRelease(); }}
            onPointerDown={(e) => { e.stopPropagation(); try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch {} zoomDrag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: zoomOff.x, oy: zoomOff.y }; if (zoomTimer.current) { window.clearTimeout(zoomTimer.current); zoomTimer.current = null; } }}
            onPointerMove={(e) => { const d = zoomDrag.current; if (!d || e.pointerId !== d.id) return; setZoomOff({ x: d.ox + (e.clientX - d.sx), y: d.oy + (e.clientY - d.sy) }); }}
            onPointerUp={(e) => { const d = zoomDrag.current; if (d && e.pointerId === d.id) { try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch {} zoomDrag.current = null; magnifyRelease(); } }}
            onPointerCancel={() => { zoomDrag.current = null; magnifyRelease(); }}
            style={{
              position: "fixed", left, top, width: big, height: big, zIndex: 120,
              objectFit: "cover", borderRadius: 18, border: "5px solid var(--blue-deep)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.45)", cursor: "grab", touchAction: "none", userSelect: "none",
            }}
          />
        );
      })()}
      {pctHover && (() => {
        const c = pickCards.find((x) => x.id === pctHover);
        if (!c) return null;
        const left = c.cardX - CW / 2 + pan.x;
        const top = c.cardY + CW / 2 + 6 + pan.y;
        const info = breedMix.get(c.img);
        const genLabel = (d: number) => {
          if (d <= 0) return "the breed itself";
          if (d === 1) return "parent";
          if (d === 2) return "grandparent";
          const greats = d - 2;
          return `${"great-".repeat(greats)}grandparent`;
        };
        const TITLES = [
          "Our best guess, not hard science.",
          "An educated guess, not gospel.",
          "Informed estimate, not exact science.",
          "Our reckoning, not the final word.",
          "A considered guess, not cold fact.",
          "Best judgement, not laboratory proof.",
          "Our read on it, not a certainty.",
          "A fair estimate, not a fixed figure.",
          "Studied guesswork, not hard data.",
          "Our interpretation, not established fact.",
        ];
        const ti = Math.abs([...c.id].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) | 0, 7)) % TITLES.length;
        const pctTxt = (v: number) => (v < 1 ? "<1%" : `${Math.round(v)}%`);
        const apps = info ? info.apps : [];
        const sum = info ? info.sum : c.mix;
        const norm = info ? info.norm : c.mix;
        const multi = apps.length > 1;
        return (
          <div
            onMouseEnter={pctKeep}
            onMouseLeave={pctClose}
            style={{
              position: "fixed", left, top, maxWidth: 288, zIndex: 100, pointerEvents: "auto", /* pct-close: hoverable so it can self-dismiss */
              background: "rgba(10, 58, 87, 0.92)", color: "#ffffff",
              font: "500 11px/1.45 Montserrat, system-ui, sans-serif", padding: "9px 12px",
              borderRadius: "8px", boxShadow: "0 4px 12px rgba(10, 58, 87, 0.35)",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: "#ffd23e", marginBottom: 1 }}>{c.name}</div> {/* pct-name */}
            <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.15, marginBottom: 6 }}>
              {pctTxt(norm)} of your chum
            </div>
            {apps.length > 0 && (
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                {apps.map((a, i) => (
                  <div key={i}>As {genLabel(a.depth)}: {pctTxt(a.pct)}</div>
                ))}
                {multi && (
                  <div style={{ marginTop: 2 }}>Combined: {apps.map((a) => pctTxt(a.pct)).join(" + ")} = {pctTxt(sum)}</div>
                )}
                <div style={{ marginTop: 2 }}>Share of your chum: {pctTxt(norm)}</div>
              </div>
            )}
            <div style={{ fontWeight: 700, marginBottom: 3 }}>{TITLES[ti]}</div>
            <div style={{ opacity: 0.92 }}>These figures come from history and old breeding records, our viewpoint, not proven fact. (Though DNA reading can now trace bloodlines back with real precision, even reviving lost breeds.)</div>
          </div>
        );
      })()}
    </div>
    {boxPop && !circular && (
      <img className={styles.cardBox} src="/card-pack-box.svg" alt="" aria-hidden="true" />
    )}
    {showAuto && !circular && (
      <div className={styles.autoWrap} onClick={autoCollect} onPointerDown={(e) => e.stopPropagation()} role="button" aria-label="Auto Find">
        <div className={styles.autoPop}>
          <img className={styles.autoBtn} src="/auto-icon-redux.svg" alt="Auto Find" />
        </div>
      </div>
    )}
    {penalty !== null && <div key={penalty} className={styles.autoPenalty}>-2500</div>}
    </>
  );
}
