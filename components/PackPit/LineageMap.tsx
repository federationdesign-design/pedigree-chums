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
const CARD = 82; // card + frame + image size (reduced 25% so more rows fit)
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
}: {
  breed: { name: string; image: string; x: number; y: number; angle: number };
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
  useEffect(() => setPinned(new Map()), [breed.name]);
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
  const magnifyHold = (id: string) => { if (zoomTimer.current) { window.clearTimeout(zoomTimer.current); zoomTimer.current = null; } setZoomOff({ x: 0, y: 0 }); setZoomedId(id); setInfoHover(id); setPctHover(id); }; // patch_hoverfix_v1: info+pct open with zoom
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
  const [flashes, setFlashes] = useState<{ id: number; x: number; y: number; val: number; size: number; neg?: boolean }[]>([]);
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number; s: number; born: number }[]>([]);
  const [seen, setSeen] = useState<Set<string>>(new Set()); // circles tapped at least once, recoloured blue
  const fxId = useRef(0);
  const scoredRef = useRef<Set<string>>(new Set());
  const [autoArmed, setAutoArmed] = useState(false); // the auto-collect shortcut arms 5s in, while circles are still yellow
  const [autoExposed, setAutoExposed] = useState<Set<string>>(new Set()); // nodes auto revealed; their leaf names stay hidden to cut clutter
  const [penalty, setPenalty] = useState<number | null>(null); // animation key while the white -1000 floats up
  const [idleHint, setIdleHint] = useState(false);
  const [showTapHint, setShowTapHint] = useState(false); // pulse the first ring of circles after 1s of no interaction
  const interacted = useRef(false);
  useEffect(() => {
    setAutoArmed(false); setPenalty(null);
    const t = setTimeout(() => setAutoArmed(true), 0); // arm immediately on open
    return () => clearTimeout(t);
  }, [breed.name]);
  useEffect(() => {
    setIdleHint(false); interacted.current = false;
    const t = setTimeout(() => { if (!interacted.current) setIdleHint(true); }, 1000);
    return () => clearTimeout(t);
  }, [breed.name]);

  const flashNum = (x: number, y: number, val: number, size: number) => {
    const id = (fxId.current += 1);
    const isNeg = val < 0;
    const isBig = val >= 400; // green for big positive rewards
    const flashSize = isNeg ? size * 1.8 : isBig ? size * 1.4 : size;
    setFlashes((f) => [...f, { id, x, y, val, size: flashSize, neg: isNeg, big: isBig }]);
    onScore?.(val);
    window.setTimeout(() => setFlashes((f) => f.filter((n) => n.id !== id)), isNeg ? 1200 : isBig ? 900 : 650);
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
    setShowRemove(false);
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
  const isDraggingCardRef = useRef(false); // synchronous flag -- state updates are async and miss the onMouseEnter window
  const placedAtRef = useRef<Map<string, number>>(new Map()); // cardId -> timestamp when placed in frame
  useEffect(() => {
    if (totalNodes > 0 && seen.size >= totalNodes) {
      const t = setTimeout(() => setShowRemove(true), 1000); // hold the green button back one second after the last circle turns blue
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
    if (rootPos) { root._x = rootPos.x; root._y = rootPos.y; }
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
    if (packed) return; // Done state: the grid is fixed, only the main card moves
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

  const tagW = breed.name.length * 9.5 + 28;
  const clip = "lm-clip-root";

  // The empty frames the player drags each collected card into: a row of living up
  // top, the long-gone below. Positions are screen coords, rendered pan-fixed as
  // sx - pan.x so they stay put while the tree pans behind them.
  const F_LEFT = isMobile ? 52 : 96;
  const F_COL = isMobile ? 92 : 112, F_ROW = isMobile ? 92 : 112; // tighter pitch on phones to match the 15% smaller cards
  const fCols = Math.max(2, Math.min(7, Math.floor((vp.w - 120) / F_COL)));
  const MCOLS = 4; // phones: one continuous grid, four frames wide before it wraps
  const chumTop = isMobile ? 170 : 240; // rows sit clear of the top-left chrome (and the section headers on desktop); mobile lifted 20px so the deepest breeds fit before Collect
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
  const cardFrame = new Map<string, { sx: number; sy: number }>();
  filled.forEach((cardId, frameId) => { const f = frames.find((x) => x.id === frameId); if (f) cardFrame.set(cardId, { sx: f.sx, sy: f.sy }); });
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
  const framesDone = frameTotal > 0 && filled.size >= frameTotal; // every dropped frame filled
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
    // Auto = reveal all + pack into grid + collect -- full sequence with penalty
    setOpen(() => { const s = new Set<string>(["0"]); allNodes.forEach((n) => { if (n.hasKids) s.add(n.id); }); return s; });
    setSeen(() => new Set(allNodes.map((n) => n.id)));
    setAutoExposed(() => { const s = new Set<string>(); allNodes.forEach((n) => { if (!picked.has(n.id)) s.add(n.id); }); return s; });
    const imgNodes = allNodes.filter((n) => n.hasImg && !picked.has(n.id));
    const revealMs = imgNodes.length * 45;
    imgNodes.forEach((n, i) => { window.setTimeout(() => setPicked((prev) => { const s = new Set(prev); s.add(n.id); return s; }), i * 45); });
    allNodes.forEach((n) => scoredRef.current.add(n.id));
    const ap = currentScore < 500 ? -500 : currentScore < 2000 ? -1000 : currentScore < 5000 ? -2500 : -5000;
    onScore?.(ap);
    const pk = (fxId.current += 1);
    setPenalty(pk);
    window.setTimeout(() => setPenalty((cur) => (cur === pk ? null : cur)), 1000);
    setAutoArmed(false);
    // After cards pop out, pack them then collect
    window.setTimeout(() => {
      doPack(undefined, undefined, 0); // pack with no score award (Auto already penalised)
      window.setTimeout(() => { startRemove(); }, 900); // collect after pack animation
    }, revealMs + 300);
  };
  // Double-clicking the root card walks the tree open one generation at a time,
  // then once everything is exposed folds it back deepest-first. Rings only: any
  // cards already pulled out stay put. Auto-revealed nodes score +50 each, less
  // than a manual tap (125/250) so hand-exploration stays the rewarding route.
  const revealStep = () => {
    const frontier = shown.filter((n) => n.children && n.children.length && !open.has(n._id));
    if (frontier.length) {
      setOpen((prev) => { const s = new Set(prev); frontier.forEach((n) => s.add(n._id)); return s; });
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
      setSeen((prev) => {
        const s = new Set(prev);
        // Only the opened node itself turns blue. Its children stay yellow --
        // they haven't been tapped or popped yet, even though they're now visible.
        frontier.forEach((n) => s.add(n._id));
        return s;
      });
      pops.forEach((p) => flashNum(p.x, p.y, -50, FLASH_SIZE)); // -50 per auto-revealed node
      interacted.current = true; setIdleHint(false); setShowTapHint(false); try { localStorage.setItem("pc-lm-hint", "1"); } catch {}
      return;
    }
    // nothing left to reveal: if any shown node still hasn't popped its ancestor
    // card, pop them all (a staggered ripple, +50 each) before any collapse begins.
    const toPop = shown.filter((n) => n._parent && n.img && !picked.has(n._id));
    if (toPop.length) {
      setSeen((prev) => { const s = new Set(prev); toPop.forEach((n) => s.add(n._id)); return s; }); // turns popped nodes blue, like a manual tap
      toPop.forEach((n, i) => {
        window.setTimeout(() => setPicked((prev) => { const s = new Set(prev); s.add(n._id); return s; }), i * 45);
        if (!scoredRef.current.has(n._id)) { scoredRef.current.add(n._id); flashNum(n._x, n._y - 8, -50, FLASH_SIZE); } // -50 per collapse-reveal
      });
      interacted.current = true; setIdleHint(false);
      return;
    }
    // fully open: auto-place all unplaced images into their correct frames
    // Only place the top-of-stack card per image -- duplicates stack visually on top
    // Place top-of-stack cards into unfilled frames, then stack duplicates on top
    const unplaced = pickCards.filter((c) => !placedSet.has(c.id) && !packed);
    if (unplaced.length === 0) return;
    unplaced.forEach((c, i) => {
      // Find an unfilled frame first, then fall back to any frame with matching image
      const target = frames.find((f) => f.img === c.img && !filled.has(f.id))
        ?? frames.find((f) => f.img === c.img)
        ?? frames.find((f) => !filled.has(f.id)); // last resort: any empty frame
      if (!target) return;
      window.setTimeout(() => {
        // bubble trail: emit 4 bubbles staggered toward the target frame
        for (let b = 0; b < 4; b++) {
          window.setTimeout(() => {
            const bid = puffSeq.current++;
            setBubbles((bubs) => [...bubs, { id: bid, sx: target.sx, sy: target.sy }]);
            window.setTimeout(() => setBubbles((bubs) => bubs.filter((x) => x.id !== bid)), 620);
          }, b * 60);
        }
        setFilled((m) => { const x = new Map(m); for (const [fid, cid] of x) if (cid === c.id) x.delete(fid); x.set(target.id, c.id); return x; }); placedAtRef.current.set(c.id, Date.now());
        setDragPos((m) => { if (!m.has(c.id)) return m; const x = new Map(m); x.delete(c.id); return x; });
        flashNum(target.sx - pan.x, target.sy - pan.y - CW / 2, -10, FLASH_SIZE); // auto-place costs 10
        const pid = puffSeq.current++;
        setPuffs((p) => [...p, { id: pid, sx: target.sx, sy: target.sy }]);
        window.setTimeout(() => setPuffs((p) => p.filter((x) => x.id !== pid)), 480);
      }, i * 80);
    });
  };

  const doPack = (fx?: number, fy?: number, award: number = 600) => {
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
    // after cards settle, auto-open the first chum's lineage
    const firstChum = chum[0];
    if (firstChum) {
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent("pc:pack-complete", { detail: { name: firstChum.name } }));
      }, 600); // give cards time to land
    }
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
    const circles = vis.slice(0, 60).map((n) => {
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
    const rx = rootPos ? rootPos.x : cx, ry = rootPos ? rootPos.y : cy; // peels off and drags, but only after the grid is full
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
          // hop only while frames still need filling
          if (!framesDone && !packed) {
            setPan((prev) => ({
              x: prev.x + 28 + Math.random() * 12,
              y: prev.y - 18 - Math.random() * 8,
            }));
          }
          revealStep();
        }}
        onPointerDown={(e) => {
          if (!canDragRoot) return; // pinned to the tree until the grid is settled (all frames filled or packed)
          e.stopPropagation();
          try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch {}
          rootDrag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: rx, oy: ry, moved: false };
        }}
        onPointerMove={(e) => {
          const d = rootDrag.current; if (!d || e.pointerId !== d.id) return;
          const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
          if (!d.moved && Math.hypot(dx, dy) > 3) d.moved = true;
          if (d.moved) setRootPos({ x: d.ox + dx, y: d.oy + dy });
        }}
        onPointerUp={(e) => { const d = rootDrag.current; if (d && e.pointerId === d.id) { try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch {} rootDrag.current = null; } }}
        onPointerCancel={() => { rootDrag.current = null; }}
      >
        <clipPath id={clip}>
          <rect x={-ROOT} y={-ROOT} width={ROOT * 2} height={ROOT * 2} rx={20} />
        </clipPath>
        {/* front face: dog image */}
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
        {/* the root card carries no status dot; only the ancestor cards show one */}
      </g>
      <g className={styles.rootHit} transform={`translate(${rx},${ry + ROOT + 26})`} style={{ opacity: groupFade }} onClick={(e) => e.stopPropagation()}>
        <rect className={styles.tag} x={-tagW / 2} y={-16} width={tagW} height={32} rx={16} />
        <text className={styles.tagText} textAnchor="middle" dominantBaseline="central">
          {breed.name}
        </text>
        {/* the 3-D Collect button sits on top; it orders the pack into the grid */}
        {/* Learn button -- blue -- auto-reveals tree ring by ring (was mislabelled, called doPack) */}
        {!packed && !collecting && !removing ? (
          <g
            className={styles.removeBtn}
            transform={`translate(0,62)`}
            onClick={(e) => { e.stopPropagation(); revealStep(); }}
            onPointerDown={(e) => e.stopPropagation()}
            role="button"
            aria-label="Auto-reveal the family tree"
          >
            <g className={styles.chumPop}>
              <rect x={-100} y={-26} width={200} height={68} rx={34} className={styles.compBase} />
              <g className={styles.chumTop}>
                <rect x={-100} y={-34} width={200} height={68} rx={34} className={styles.compPill} />
                <rect x={-88} y={-28} width={176} height={22} rx={12} className={styles.chumGloss} />
                <text className={styles.compText} textAnchor="middle" dominantBaseline="central" y={5}>Learn</text>
              </g>
            </g>
          </g>
        ) : null}
        {/* Collect button -- green -- skips packing, collects immediately */}
        {!collecting ? (
          <g
            className={styles.removeBtn}
            transform={`translate(0,${!packed ? 138 : 62})`}
            onClick={(e) => { e.stopPropagation(); flashNum(rx, ry + ROOT + 88, 750, FLASH_SIZE); startRemove(); }}
            onPointerDown={(e) => e.stopPropagation()}
            role="button"
            aria-label="Collect this chum"
          >
            <g className={styles.chumPop}>
              <rect x={-100} y={-26} width={200} height={68} rx={34} className={styles.chumBase} />
              <g className={removing ? styles.chumTopDown : styles.chumTop}>
                <rect x={-100} y={-34} width={200} height={68} rx={34} className={styles.chumPill} />
                <rect x={-88} y={-28} width={176} height={22} rx={12} className={styles.chumGloss} />
                <text className={styles.chumText} textAnchor="middle" dominantBaseline="central" y={5}>Collect</text>
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
        <div className={styles.packHead} style={{ left: F_LEFT - CW / 2, top: extinctTop - 90 }}>These dogs have had their days</div>
      )}
      {showPack && (
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
        <div className={styles.packHead} style={{ left: packLabels.extinct.x, top: packLabels.extinct.y }}>These dogs have had their days</div>
      )}
      <svg className={styles.svg} viewBox={`${-pan.x} ${-pan.y} ${vp.w} ${vp.h}`} width={vp.w} height={vp.h} xmlns="http://www.w3.org/2000/svg">
        <g style={removing ? { pointerEvents: "none" } : undefined}>
        {hasTree ? (
          <>
            <g style={{ opacity: removing ? 0 : 1, transition: "opacity 0.12s ease-out" }}>
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
                const isInstructions = breed.name === "Instructions";
                const r = radius(isInstructions ? 25 : share); // fixed radius for Instructions nodes
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
                      const baseVal = hasKids ? 200 : 400;
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
                    <circle className={`${styles.disc} ${hasKids && !isOpen ? styles.has : ""} ${idleHint && !seen.has(n._id) && (n._parent as Node)?._id === "0" ? styles.hint : ""}`.trim()} r={r} style={seen.has(n._id) ? { fill: "#0c5b92" } : isInstructions ? { stroke: "none" } : undefined} />
                    {isInstructions && n.img ? (() => {
                      // Show step icon inside circle with padding, no stroke
                      const pad = r * 0.2;
                      const sz = (r - pad) * 2;
                      return (
                        <>
                          <clipPath id={`instr-clip-${n._id}`}>
                            <circle r={r - pad} />
                          </clipPath>
                          <image
                            href={n.img}
                            x={-(r - pad)}
                            y={-(r - pad)}
                            width={sz}
                            height={sz}
                            clipPath={`url(#instr-clip-${n._id})`}
                            preserveAspectRatio="xMidYMid meet"
                          />
                        </>
                      );
                    })() : (
                      <text className={styles.pct} textAnchor="middle" dominantBaseline="central" fontSize={Math.max(13, r * 0.5)} style={seen.has(n._id) ? { fill: "#ffffff" } : undefined}>
                        {`${share}%`}
                      </text>
                    )}
                    {(hasKids || !autoExposed.has(n._id)) ? (() => {
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
                    {hasKids && !isOpen ? (
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
                    rx={15}
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
                        style={{ fill: wrongDog?.frameId === f.id ? "#ffffff" : "#ffd23e", font: `700 ${wrongDog?.frameId === f.id ? 9 : (() => { const wc = (dragName || "").split(" ").length; return wc <= 2 ? 9 : 8; })()}px Montserrat, system-ui, sans-serif`, pointerEvents: "none" }}
                      >
                        {wrongDog?.frameId === f.id ? (
                          <>
                            <tspan x={f.sx - pan.x} dy={-10}>WRONG</tspan>
                            <tspan x={f.sx - pan.x} dy={22}>DOG</tspan>
                          </>
                        ) : (() => {
                          const words = (dragName || "").split(" ");
                          let lines: string[] = [dragName || ""];
                          if (words.length > 1) {
                            let bestDiff = Infinity;
                            for (let sp = 1; sp < words.length; sp++) {
                              const l1 = words.slice(0, sp).join(" "), l2 = words.slice(sp).join(" ");
                              const diff = Math.abs(l1.length - l2.length);
                              if (diff < bestDiff) { bestDiff = diff; lines = [l1, l2]; }
                            }
                          }
                          const fs = lines.length === 1 ? 9 : 8;
                          const lineH = fs * 1.4;
                          const startY = lines.length === 1 ? 0 : -lineH / 2;
                          return lines.map((l, i) => (
                            <tspan key={i} x={f.sx - pan.x} dy={i === 0 ? startY : lineH}>{l}</tspan>
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
              const clipId = `lm-pick-${c.id}`;
              const packScale = 1; // the zoom is now a draggable overlay, not an in-place scale /* zoom-overlay */
              const ci = collecting && collectRef.current ? collectRef.current.cards.get(c.id) : null;
              const cxf = ci ? collectXf(c.cardX, c.cardY, ci.spin, cardDeg) : null; // tumble to the corner with the main card
              return (
                <g
                  key={`pick-${c.id}`}
                  className={(placedSet.has(c.id) || packed) && !PACK_BREEDS.has(c.name) ? styles.rootHit : `${styles.rootHit} ${styles.grab}`} /* zoom-cursor: fixed images get the magnifier cursor, loose cards grab */
                  transform={(() => {
                    const crx = c.cardX - CW / 2, cry = c.cardY - CW / 2; // top-left corner: the zoom pivot, so it grows down-right /* zoom-topleft */
                    const zoom = `translate(${crx},${cry}) scale(${packScale}) translate(${-crx},${-cry})`; // identity when packScale === 1
                    const underneath = packed && isDupImg(c.img) && !isTopOfStack(c); // a card with others on top of it
                    const fan = underneath ? (((stackOrder.get(c.id) ?? 0) % 2) ? 1 : -1) * (2 + ((stackOrder.get(c.id) ?? 0) % 2)) : 0; // small alternating splay
                    return cxf
                      ? `${cxf.transform} ${zoom}`
                      : `translate(${c.cardX},${c.cardY}) rotate(${cardDeg + fan}) translate(${-c.cardX},${-c.cardY}) ${zoom}`;
                  })()}
                  style={{ ...(cxf ? { opacity: cxf.opacity } : packed ? { pointerEvents: "none" as const, ...(isDupImg(c.img) && !isTopOfStack(c) && !PACK_BREEDS.has(c.name) ? { filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))" } : {}) } : (placedSet.has(c.id) && !PACK_BREEDS.has(c.name)) ? { cursor: "zoom-in" } : {}), ...((placedSet.has(c.id) || packed) && !PACK_BREEDS.has(c.name) ? { pointerEvents: "all" as const } : {}) }}
                  onMouseEnter={() => { /* frame hover magnify removed */ }}
                  onMouseLeave={() => { /* frame hover magnify removed */ }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!(placedSet.has(c.id) || packed) || PACK_BREEDS.has(c.name)) return;
                    const placedAt = placedAtRef.current.get(c.id);
                    if (placedAt && Date.now() - placedAt < 1000) return; // 1s cooldown after placement
                    setZoomedId((z) => (z === c.id ? null : c.id));
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
                        setFilled((m) => { const x = new Map(m); for (const [fid, cid] of x) if (cid === c.id) x.delete(fid); x.set(target.id, c.id); return x; }); placedAtRef.current.set(c.id, Date.now());
                        setDragPos((m) => { if (!m.has(c.id)) return m; const x = new Map(m); x.delete(c.id); return x; });
                      } else {
                        setStacked((m) => { const x = new Map(m); const arr = x.get(target.id) ? [...x.get(target.id)!] : []; if (!arr.includes(c.id)) arr.push(c.id); x.set(target.id, arr); return x; });
                        setDragPos((m) => { if (!m.has(c.id)) return m; const x = new Map(m); x.delete(c.id); return x; });
                      }
                      flashNum(target.sx - pan.x, target.sy - pan.y - CW / 2, 50, FLASH_SIZE); // +50 for the double-click shortcut (drag is worth more)
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
                    isDraggingCardRef.current = true; setDragXY({ x: e.clientX, y: e.clientY });
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
                          setFilled((m) => { const x = new Map(m); for (const [fid, cid] of x) if (cid === c.id) x.delete(fid); x.set(hit.id, c.id); return x; }); placedAtRef.current.set(c.id, Date.now());
                          setDragPos((m) => { if (!m.has(c.id)) return m; const x = new Map(m); x.delete(c.id); return x; }); // the frame position takes over
                          flashNum(hit.sx - pan.x, hit.sy - pan.y - CW / 2, 150, FLASH_SIZE); // +150 emanates from the frame
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
                          // no penalty for wrong frame drop (was -5)
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
                    isDraggingCardRef.current = false; setDragXY(null);
                  }}
                  onPointerCancel={() => { cardDrag.current = null; setDragCat(null); setDragImg(null); isDraggingCardRef.current = false; setDragXY(null); }}
                >
                  <g className={styles.pickWobble}>
                  <clipPath id={clipId}>
                    <rect x={c.cardX - CW / 2} y={c.cardY - CW / 2} width={CW} height={CW} rx={15} />
                  </clipPath>
                  <image
                        href={encodeURI(bust(c.img))}
                        x={c.cardX - CW / 2}
                        y={c.cardY - CW / 2}
                        width={CW}
                        height={CW}
                        clipPath={`url(#${clipId})`}
                        preserveAspectRatio="xMidYMid slice"
                      />
                  <rect
                    x={c.cardX - CW / 2}
                    y={c.cardY - CW / 2}
                    width={CW}
                    height={CW}
                    rx={15}
                    vectorEffect="non-scaling-stroke"
                    className={isDupImg(c.img) && !isTopOfStack(c) && !PACK_BREEDS.has(c.name) ? `${styles.pickCard} ${styles.pickCardStack}` : styles.pickCard} /* chum-fix */
                  />
                  {isTopOfStack(c) && zoomedId !== c.id && !PACK_BREEDS.has(c.name) && (() => {
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
                  {(placedSet.has(c.id) || packed) && zoomedId !== c.id && !PACK_BREEDS.has(c.name) && (() => {
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
                    const wasAdjusted = c.share !== c.mix; // adjusted cards get a * in the pill
                    return (
                      <g
                        style={{ cursor: "pointer" }}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); setPctHover((h) => (h === c.id ? null : c.id)); }}
                      >
                        <rect x={pillRight - pw} y={py} width={pw} height={ph} rx={ph / 2} style={{ fill: "rgba(0,0,0,0.001)", pointerEvents: "all" }} />
                        <rect className={styles.mixPill} x={pillRight - pw} y={py} width={pw} height={ph} rx={ph / 2} style={{ filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.45))", pointerEvents: "none" }} />
                        <text className={styles.mixText} textAnchor="end" x={pillRight - 6} y={py + ph / 2 + 1} dominantBaseline="central">
                          {(c.mix < 1 ? "<1%" : `${rolledMix(c.id, c.mix)}%`) + (wasAdjusted ? "*" : "")}
                        </text>
                      </g>
                    );
                  })()}
                  {isTopOfStack(c) && (placedSet.has(c.id) || packed) && zoomedId !== c.id && !PACK_BREEDS.has(c.name) && (breedInfo[c.name] || c.note) ? (() => {
                    const ix = c.cardX + CW / 2, iy = c.cardY - CW / 2; // top-right corner
                    return (
                      <g
                        style={{ cursor: "pointer" }}
                        transform={`translate(${ix},${iy}) scale(0.9) translate(${-ix},${-iy})`}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          const opening = infoHover !== c.id;
                          setInfoHover((h) => (h === c.id ? null : c.id)); // tap to toggle, works on touch and mouse
                          if (opening && !infoSeen.current.has(c.id)) {
                            infoSeen.current.add(c.id);
                            flashNum(ix, iy, 25, FLASH_SIZE); // +25 the first time this card's info is exposed, white and small like the rest
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
            {!packed && !collecting && frames.map((f) => {
              const ids = stacked.get(f.id);
              if (!ids || !ids.length || !filled.has(f.id)) return null;
              // each duplicate cascades down and to the right of the last, sitting on top of the fixed primary so the newest is fully visible
              return ids.map((sid, i) => {
                const off = (i + 1) * 7;
                const sx = f.sx - pan.x + off * 0.55, sy = f.sy - pan.y + off * 0.55;
                const stackTilt = (i % 2 ? 1 : -1) * (5 + (i % 3) * 2); // fan each card so the pile is visible
                const sClip = `lm-stack-${f.id}-${i}`;
                return (
                  <g key={`stk-${sid}`} transform={`rotate(${(cardDeg + stackTilt).toFixed(2)} ${sx} ${sy})`} style={{ pointerEvents: "none", filter: "drop-shadow(0 3px 3px rgba(0,0,0,0.32))" }}>
                    <clipPath id={sClip}>
                      <rect x={sx - CW / 2} y={sy - CW / 2} width={CW} height={CW} rx={15} />
                    </clipPath>
                    <image href={encodeURI(bust(f.img))} x={sx - CW / 2} y={sy - CW / 2} width={CW} height={CW} clipPath={`url(#${sClip})`} preserveAspectRatio="xMidYMid slice" />
                    <rect x={sx - CW / 2} y={sy - CW / 2} width={CW} height={CW} rx={15} className={`${styles.pickCard} ${styles.pickCardStack}`} />
                  </g>
                );
              });
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
        {/* flashes rendered in fixed overlay below for correct z-order */}
        </g>
      </svg>
      {/* flash number overlay - above all SVG content */}
      {flashes.length > 0 && (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 200 }}>
          <svg width="100%" height="100%">
            {flashes.map((f) => (
              <text key={`f${f.id}`}
                className={f.neg ? styles.flashNeg : (f as any).big ? styles.flashBig : styles.flashNum}
                x={f.x + pan.x} y={f.y + pan.y} fontSize={f.size} textAnchor="middle"
                style={f.neg ? { fill: "#ff2d4f", fontFamily: "'Luckiest Guy', system-ui", fontWeight: 700 } : (f as any).big ? { fill: "#22c55e", fontFamily: "'Luckiest Guy', system-ui", fontWeight: 700 } : undefined}>
                {f.val > 0 ? `+${f.val}` : f.val}
              </text>
            ))}
          </svg>
        </div>
      )}
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
              position: "fixed", left, top, maxWidth: 190, zIndex: 100, pointerEvents: "auto", /* patch_bits_v1: hoverable so it self-dismisses */
              background: "rgba(10, 58, 87, 0.92)", color: "#ffffff",
              font: "500 11px/1.4 Montserrat, system-ui, sans-serif", padding: "7px 10px",
              borderRadius: "8px", boxShadow: "0 4px 12px rgba(10, 58, 87, 0.35)",
            }}
          >
            {text}
          </div>
        );
      })()}
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
        // if zoom open for same card, sit right of zoomed image; otherwise below card
        const zoomOpenPct = zoomedId === c.id;
        const zoomSizePct = CW * 3;
        const left = zoomOpenPct ? c.cardX - CW / 2 + pan.x + zoomOff.x + zoomSizePct + 10 : c.cardX - CW / 2 + pan.x;
        const top = zoomOpenPct ? c.cardY - CW / 2 + pan.y + zoomOff.y + zoomSizePct / 2 : c.cardY + CW / 2 + 6 + pan.y;
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
    {boxPop && (
      <img className={styles.cardBox} src="/card-pack-box.svg" alt="" aria-hidden="true" />
    )}
    {showAuto && (
      <div className={styles.autoWrap} onClick={autoCollect} onPointerDown={(e) => e.stopPropagation()} role="button" aria-label="Auto Find">
        <div className={styles.autoPop} style={{ position: "relative" }}>
          <img className={styles.autoBtn} src="/auto-icon-redux.svg" alt="Auto Find" />
          <div className={styles.autoCost}>
            {currentScore < 500 ? "-500" : currentScore < 2000 ? "-1,000" : currentScore < 5000 ? "-2,500" : "-5,000"}
          </div>
        </div>
      </div>
    )}
    {penalty !== null && <div key={penalty} className={styles.autoPenalty}>{currentScore < 500 ? "-500" : currentScore < 2000 ? "-1,000" : currentScore < 5000 ? "-2,500" : "-5,000"}</div>}
    </>
  );
}
