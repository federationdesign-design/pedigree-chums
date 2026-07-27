"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { hierarchy, pack, packSiblings, packEnclose, type HierarchyCircularNode } from "d3-hierarchy";
import { interpolateZoom } from "d3-interpolate";
import type { LineageNode } from "../../data/lineage";
import { nodeStatus, TAG_STYLE, type BreedTag } from "../BreedTreeMap/BreedTreeMap";
import { descendantPackBreeds, ancestryBreakdown, ancestorShareOf } from "../../data/lineageArchive";
import TrainingCard from "../TrainingCard/TrainingCard";
import trainingDifficulty from "../../data/trainingDifficulty";
import { ICONS } from "../CardDock/CardDock";
import { bust } from "../../data/imgVersion";
import { breedInfo } from "../../data/breedInfo";
import breedTraits from "../../data/breed-info.json";
import styles from "./BreedTree.module.css";
import LineageMap from "../PackPit/LineageMap";
import type { LevelTheme } from "../../data/levelThemes";
import BritainMessage from "../PackPit/BritainMessage";

// Reference-info marker on the learn-box portrait: the same red/amber/green
// status the main pit shows, plus a plain label for the generation line.
const STATUS_LABEL: Record<BreedTag, string> = {
  extinct: "Extinct", trending: "Trending", popular: "Popular", endangered: "Endangered", "in-decline": "In decline",
};
const genLabel = (d: number) =>
  d <= 0 ? "the breed itself" : d === 1 ? "parent" : d === 2 ? "grandparent" : `${"great-".repeat(d - 2)}grandparent`;

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
// Mini pit only: the difficulty slider sets how big the dog circles are before
// the round starts. Bigger circles means less room in the pit and a faster game
// over, so size IS the difficulty. Three points are pinned:
//   level 5  the packing signed off as MINI_FILL 0.85, unchanged
//   level 0  a quarter smaller again than the old easiest setting
//   level 10 the widest circle spans the full width of the pit
// The top end is measured off the widest top-level circle rather than the
// cluster's bounding box, because that is the thing the eye reads as "as big as
// it goes", and it is the body that has to fit between the pit walls.
// Mobile only: above 640px the layout does not run relayoutMobile, so the size
// has nowhere to land and the slider stays hidden.
const DIFF_DEFAULT = 5;
const DIFF_EASY = 0.525; // level 0, against the base packing
const DIFF_MID = 0.85; // level 5, the approved default
// The docked view zooms out to 1.21x the frame, so the visible pit is this much
// wider than SIZE. DIFF_INSET holds back enough for the 5px stroke and the pit
// walls, which sit 4 svg units inside the stage edges.
const DIFF_SPAN = 1.21;
const DIFF_INSET = 16;
// level: null outside the mini pit, where the packing is used untouched.
function diffScale(base: number, wide: number, level: number | null): number {
  if (level === null) return base;
  const l = Math.min(Math.max(level, 0), 10);
  const mid = base * DIFF_MID;
  if (l <= 5) return base * (DIFF_EASY + (l / 5) * (DIFF_MID - DIFF_EASY));
  return mid + ((l - 5) / 5) * (Math.max(wide, mid) - mid);
}
// START runs at this multiple of the GAME OVER flash ramp. 1 matches it exactly.
const START_SCALE = 2;
// Where the two words sit, as a fraction of the FULL stage height measured from
// the centre line, which is the same convention the viewBox uses: 0.5 is the
// bottom edge. START at 0.38 puts it 88% down, using most of the dead space that
// was sitting under it, while leaving room for the ground band and the shake and
// slow-motion buttons. LEARN comes down from 20% to 38%.
const WORD_START_Y = 0.41; // 91% down
const WORD_LEARN_Y = 0.24; // 26% down
// How far the circle cluster drops from centre, as a fraction of the frame
// height. Clamped at runtime by whatever slack the packing leaves.
const CLUSTER_DROP = 0.05;
// Toys ported from the main pit. Sizes come off the same unit the main pit uses,
// BIG = 84 * SCALE, so a ball here is the same ball there. The drop beats run
// from the moment the first dog circle touches the floor.
const TOY_BALL_SRC = "/tennis-ball.svg";
const TOY_FLAG_SRC = "/uk-icon.jpg";
const TOY_BALL_DELAY = 3000; // ball, after the first circle lands
const TOY_FLAG_GAP = 3000; // flag, after the ball
const TOY_FLAG_HITS = 8; // main pit maxHits
// Medieval props, dropped together one second after the flag. Neither does
// anything when tapped; they are there to be picked up and shoved about. The
// rock is the heavy one: dense, dead on the bounce and high friction, so it
// lands with a thump and stays. The stick is light and skitters.
const TOY_STICK_SRC = "/stick.svg";
const TOY_ROCK_SRC = "/rock.svg";
const TOY_PROP_GAP = 1000; // the two sticks, after the flag
const TOY_ROCK_GAP = 500; // rock, after the sticks, so it lands on its own beat
// artwork proportions, so the bodies match what is drawn
const STICK_ASPECT = 1368 / 299.7;
const ROCK_ASPECT = 756.3 / 659.2;
// Used-up toys stay gone for the rest of the session: the flag once its message
// has been read, the ball once the player has thrown it out of the pit. Session
// scope, so a fresh visit starts clean. Swap to localStorage to make it forever.
const TOY_FLAG_SEEN_KEY = "pc-minipit-flag-seen";
const TOY_BALL_GONE_KEY = "pc-minipit-ball-gone";
const TOY_STICK_GONE_KEY = "pc-minipit-stick-gone";
const TOY_STICK_BIG_GONE_KEY = "pc-minipit-stickbig-gone";
const TOY_ROCK_GONE_KEY = "pc-minipit-rock-gone";
// stickBig is the same artwork half again as large, so the pair reads as two
// sticks of different sizes rather than one drawn twice
type ToyKind = "ball" | "flag" | "stick" | "stickBig" | "rock";
const TOY_SRC: Record<ToyKind, string> = {
  ball: TOY_BALL_SRC, flag: TOY_FLAG_SRC, stick: TOY_STICK_SRC,
  stickBig: TOY_STICK_SRC, rock: TOY_ROCK_SRC,
};
// every prop except the flag leaves for good once it is thrown clear of the pit
const TOY_GONE_KEY: Record<ToyKind, string> = {
  ball: TOY_BALL_GONE_KEY, flag: TOY_FLAG_SEEN_KEY,
  stick: TOY_STICK_GONE_KEY, stickBig: TOY_STICK_BIG_GONE_KEY,
  rock: TOY_ROCK_GONE_KEY,
};
function toyRetired(key: string): boolean {
  try { return sessionStorage.getItem(key) === "1"; } catch { return false; }
}
function retireToy(key: string) {
  try { sessionStorage.setItem(key, "1"); } catch { /* private mode */ }
}
// Level themes: how much of the ground strip shows, as a fraction of the strip's
// own height. 1 shows the art exactly as drawn, its bottom edge on the bottom of
// the stage. Every pixel of visible ground is a pixel of pit height given up, so
// this is the dial to turn if the pit starts filling too fast.
const LEVEL_FLOOR_SHOW = 1;
// The level background and the LEARN wash are two halves of one split screen.
// The wash is a slab tilted by this much, pushed off toward the top right; the
// level fills everything on the other side of that slab's leading edge. Both
// numbers are the wash's own, so the two edges are the same line by
// construction rather than by eye.
const WASH_DEG = 18;
const WASH_PEEK_X = 0.46; // .learnWashPeek translate3d(46%, ...)
const WASH_INSET = 2.2; // .learnWash inset: -60% -> 2.2 viewports wide
const TITLE_DY = -42;
const TITLE_ANGLE = -10;
type Node = HierarchyCircularNode<LineageNode>;

// Breed titles are fitted to the circle they belong to. The name is wrapped
// across 1 to LABEL_MAX_LINES balanced lines and every option is measured; the
// wrap that allows the largest type while keeping all four corners of the text
// block inside the circle wins. A very long name therefore takes a third or
// fourth line instead of spilling over the rim.
const LABEL_MAX_LINES = 4;
const LABEL_CHAR_W = 0.62; // fallback glyph width in ems, before the font loads
const LABEL_LINE_H = 1.05; // line height in ems, matches the tspan dy
const LABEL_CAP_H = 0.8; // ink above the first baseline, in ems
const LABEL_DESC = 0.28; // ink below the last baseline, in ems
// Keep the block inside this fraction of the radius. Raised from 0.9: names are
// meant to fill the circle and touching the rim is fine, so only a thin margin
// is held back to stop ink crossing the stroke itself.
const LABEL_SAFE = 0.95;

// Real glyph widths, not a flat per-character average. Luckiest Guy caps run
// from about 0.57em (BRITISH) to 0.73em (BANDOGS), so an average either
// overflows the wide names or wastes size on the narrow ones. Canvas measures
// whatever font is actually painting, at font-size 1em, cached per string.
let labelCanvas: HTMLCanvasElement | null = null;
const labelWidths = new Map<string, number>();
function measureEm(line: string, font: string | null): number {
  if (!font) return line.length * LABEL_CHAR_W;
  const key = font + "|" + line;
  const hit = labelWidths.get(key);
  if (hit !== undefined) return hit;
  let w = line.length * LABEL_CHAR_W;
  try {
    labelCanvas = labelCanvas ?? document.createElement("canvas");
    const ctx = labelCanvas.getContext("2d");
    if (ctx) {
      const probe = 100;
      ctx.font = `${probe}px ${font}`;
      const m = ctx.measureText(line).width / probe;
      if (m > 0) w = m;
    }
  } catch {
    /* no canvas: the average stands in */
  }
  labelWidths.set(key, w);
  return w;
}
// Steve: names two point sizes larger than the fitted size. Single tunable.
const TITLE_BOOST = 2;
// How much of the pit's width settled bodies must block, at the top zone, for
// the round to be over. A fraction rather than a head count, because a mini pit
// tree often holds only two or three circles. Two bodies is the floor, so one
// wide circle resting high cannot end a round on its own.
const PIT_FULL_COVER = 0.72;
// The yellow percentage badge, drawn and collided at this radius. Doubled from
// 46: they were easy to lose against the circles, on the start screen and in
// the pit alike.
const BADGE_DRAW_R = 92;

// Split words into exactly n lines as evenly as the word lengths allow.
// Returns null when n lines are not reachable (a single long word can force
// fewer lines than asked for).
function balancedWrap(words: string[], n: number): string[] | null {
  if (n === 1) return [words.join(" ")];
  if (words.length < n) return null;
  const total = words.join(" ").length;
  for (let target = Math.ceil(total / n); target <= total; target++) {
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const next = cur ? cur + " " + w : w;
      if (cur && next.length > target) {
        lines.push(cur);
        cur = w;
      } else cur = next;
    }
    if (cur) lines.push(cur);
    if (lines.length === n) return lines;
    if (lines.length < n) return null;
  }
  return null;
}

// First baseline for an n-line block: 1 and 2 line labels keep their historic
// anchor exactly, 3 and 4 line labels lift so the block stays balanced.
function labelFirstY(n: number, fs: number): number {
  return TITLE_DY - Math.max(0, (n - 2) / 2) * LABEL_LINE_H * fs;
}

// Does the rotated text block sit inside a circle of radius r? Corners are
// rotated about (0, TITLE_DY), exactly as the rendered <text> is.
function labelFits(widthEm: number, n: number, fs: number, r: number): boolean {
  const halfW = (widthEm * fs) / 2;
  const y0 = labelFirstY(n, fs);
  const top = y0 - LABEL_CAP_H * fs;
  const bot = y0 + (n - 1) * LABEL_LINE_H * fs + LABEL_DESC * fs;
  const cos = Math.cos((TITLE_ANGLE * Math.PI) / 180);
  const sin = Math.sin((TITLE_ANGLE * Math.PI) / 180);
  const lim = r * LABEL_SAFE;
  for (const x of [-halfW, halfW]) {
    for (const y of [top, bot]) {
      const dy = y - TITLE_DY;
      const rx = x * cos - dy * sin;
      const ry = x * sin + dy * cos + TITLE_DY;
      if (Math.hypot(rx, ry) > lim) return false;
    }
  }
  return true;
}

function fitLabel(name: string, r: number, capFs: number, font: string | null): { lines: string[]; fs: number } {
  const words = name.split(/\s+/).filter(Boolean);
  const maxN = Math.min(LABEL_MAX_LINES, Math.max(1, words.length));
  let best = { lines: [name], fs: 0 };
  for (let n = 1; n <= maxN; n++) {
    const lines = balancedWrap(words, n);
    if (!lines) continue;
    const widthEm = Math.max(...lines.map((l) => measureEm(l, font)));
    let lo = 6;
    let hi = capFs;
    for (let it = 0; it < 26; it++) {
      const mid = (lo + hi) / 2;
      if (labelFits(widthEm, n, mid, r)) lo = mid;
      else hi = mid;
    }
    if (lo > best.fs) best = { lines, fs: lo };
  }
  return best;
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

// How much of the available stage the mobile masonry fills. The mini pit runs at
// 0.85 so the circles sit 15% smaller; the breed page keeps the full fill.
function relayoutMobile(nodes: Node[], aspect: number, level: number | null = null) {
  const root = nodes[0];
  const kids = root.children ?? [];
  const n = kids.length;
  if (n < 1) return;
  const FW = SIZE;
  const FH = SIZE / Math.min(Math.max(aspect, 0.42), 0.95);
  const ox = root.x, oy = root.y;
  const pts = nodes.map((d) => ({ d, x: d.x - ox, y: d.y - oy }));
  if (n === 1) {
    const s = diffScale(
      Math.min(FW * 0.5, FH * 0.46) / kids[0].r,
      (FW * DIFF_SPAN - DIFF_INSET) / (2 * kids[0].r),
      level
    );
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
  const rMax = Math.max(...d1.map((p) => p.d.r));
  const scale = diffScale(
    Math.min((FH - M) / bh, (FW * 1.12) / bw),
    (FW * DIFF_SPAN - DIFF_INSET) / (2 * rMax),
    level
  );
  // The cluster used to sit dead centre, which left the lower third of the pit
  // empty. Drop it toward the words, but never further than the slack actually
  // available: at the hardest difficulty the pack already fills the height, so
  // the shift has to give way rather than push circles through the floor.
  const halfH = FH / 2;
  const wantDrop = FH * CLUSTER_DROP;
  const bottomAfter = (maxY - cy) * scale;
  const slack = Math.max(0, halfH - M / 2 - bottomAfter);
  const drop = Math.min(wantDrop, slack);
  pts.forEach((p) => {
    p.d.x = (p.x - cx) * scale;
    p.d.y = (p.y - cy) * scale + drop;
    p.d.r = p.d.r * scale;
  });
  root.x = 0;
  root.y = 0;
  root.r = FW / (2 * PAD);
}

function LearnDragCard({
  className,
  style,
  ariaLabel,
  icon,
  title,
  titleWhite,
  subtitle,
  onClose,
  closeLabel,
  children,
}: {
  className: string;
  style?: React.CSSProperties;
  ariaLabel: string;
  icon?: React.ReactNode;
  title: React.ReactNode;
  titleWhite?: boolean;
  subtitle?: string;
  onClose: () => void;
  closeLabel: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ sx: number; sy: number; bx: number; by: number } | null>(null);
  const off = useRef({ x: 0, y: 0 });
  const down = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button, a")) return;
    drag.current = { sx: e.clientX, sy: e.clientY, bx: off.current.x, by: off.current.y };
    ref.current?.setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    if (!drag.current) return;
    off.current = {
      x: drag.current.bx + (e.clientX - drag.current.sx),
      y: drag.current.by + (e.clientY - drag.current.sy),
    };
    if (ref.current) ref.current.style.transform = `translate3d(${off.current.x}px, ${off.current.y}px, 0)`;
  };
  const up = () => {
    drag.current = null;
  };
  return (
    <div
      ref={ref}
      className={className}
      style={style}
      role="group"
      aria-label={ariaLabel}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
    >
      <div className={styles.cardHead}>
        {icon ? <span className={styles.cardIcon}>{icon}</span> : null}
        <span className={styles.cardHeadText}>
          <span className={`${styles.cardTitle}${titleWhite ? " " + styles.cardTitleWhite : ""}`}>{title}</span>
          {subtitle ? <span className={styles.cardSub}>{subtitle}</span> : null}
        </span>
        <button type="button" className={styles.ancClose} onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label={closeLabel}>
          <svg viewBox="0 0 32 32" aria-hidden="true" style={{ width: 12, height: 12 }}>
            <line x1="7" y1="7" x2="25" y2="25" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <line x1="25" y1="7" x2="7" y2="25" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {children}
    </div>
  );
}

// The temperament card body: a Pros/Cons toggle over white bullet text. Only
// the active toggle is coloured, and as an outline (green pros, red cons), not
// a filled block. Keyed per chum so it always reopens on Pros.
function TemperamentBody({ pros, cons }: { pros: string[]; cons: string[] }) {
  const [tab, setTab] = useState<"pros" | "cons">("pros");
  const items = tab === "pros" ? pros : cons;
  return (
    <>
      <div className={styles.tempTabs}>
        <button
          type="button"
          className={`${styles.tempTab} ${styles.tempTabPro}${tab === "pros" ? " " + styles.tempTabOn : ""}`}
          onClick={() => setTab("pros")}
          aria-pressed={tab === "pros"}
        >
          Pros
        </button>
        <button
          type="button"
          className={`${styles.tempTab} ${styles.tempTabCon}${tab === "cons" ? " " + styles.tempTabOn : ""}`}
          onClick={() => setTab("cons")}
          aria-pressed={tab === "cons"}
        >
          Cons
        </button>
      </div>
      <ul className={styles.tempList}>
        {items.map((it) => (
          <li key={it} className={styles.tempItem}>{it}</li>
        ))}
      </ul>
    </>
  );
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
  onShownImageChange,
  onShownStatusChange,
  hideCaption = false,
  onCaptionClose,
  onScore,
  registerShake,
  registerSlowmo,
  onToggleCaption,
  onPitClose,
  onRoundWon,
  onPitFull,
  rootNote,
  levelTheme = null,
  onStartedChange,
  onLearningChange,
  onRelativeTap,
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
  onShownImageChange?: (img: string | null) => void;
  onShownStatusChange?: (tag: BreedTag | null) => void;
  hideCaption?: boolean;
  onCaptionClose?: () => void;
  onScore?: (v: number) => void;
  registerShake?: (fn: () => void) => void;
  registerSlowmo?: (fn: () => void) => void;
  onToggleCaption?: () => void;
  onPitClose?: () => void;
  onRoundWon?: () => void;
  onPitFull?: () => void;
  rootNote?: string;
  levelTheme?: LevelTheme | null;
  onStartedChange?: (started: boolean) => void;
  onLearningChange?: (learning: boolean) => void;
  onRelativeTap?: (slug: string, name: string) => void;
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [aspect, setAspect] = useState(1);
  // Freeze the stage aspect used for the mobile layout after the first measure.
  // Drilling into a circle changes the breadcrumb/caption height, which resizes
  // the stage; if the layout tracked that, it would re-pack and replay its
  // entrance on every click. Capturing it once keeps the circles steady.
  const [layoutAspect, setLayoutAspect] = useState<number | null>(null);
  const aspectKey = isMobile ? layoutAspect ?? 0.55 : 1;
  // Difficulty: 10 hardest at the top of the slider, 0 easiest at the bottom.
  // Start-screen control only, and it resets to the default every time the pit
  // is opened (LineageModal remounts this component on its runKey).
  const [level, setLevel] = useState(DIFF_DEFAULT);
  // Set the instant before a difficulty change, and consumed by the entrance
  // effect so that re-pack resizes in place rather than replaying the drop-in.
  const resizeOnlyRef = useRef(false);
  const levelRef = useRef(DIFF_DEFAULT);
  const diffRef = useRef<HTMLDivElement>(null);
  const diffDragRef = useRef(false);
  function applyLevel(next: number) {
    const l = Math.min(Math.max(Math.round(next), 0), 10);
    if (l === levelRef.current) return;
    levelRef.current = l;
    resizeOnlyRef.current = true;
    setLevel(l);
  }
  // The track runs 0 at the bottom to 10 at the top, so invert the pointer's
  // offset within it. Snaps to whole levels.
  function setLevelFromY(clientY: number) {
    const el = diffRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    applyLevel((1 - (clientY - r.top) / Math.max(r.height, 1)) * 10);
  }
  const nodes = useMemo<Node[]>(() => {
    const h = hierarchy<LineageNode>(root)
      .sum((d) => d.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    const ns = pack<LineageNode>().size([SIZE, SIZE]).padding(8)(h).descendants();
    normalizeTop(ns);
    if (isMobile) relayoutMobile(ns, aspectKey, dockAside ? level : null);
    return ns;
  }, [root, isMobile, aspectKey, dockAside, level]);

  // capture the stage aspect for the layout exactly once, on the first valid read.
  // "Valid" has to mean actually measured: aspect starts at 1, and freezing that
  // placeholder clamped the layout to 0.85 instead of the real ~0.45, packing the
  // circles roughly half size. Which one you got was a race between the
  // ResizeObserver's first callback and the isMobile flip, so a cold first open
  // looked right and every reopen came back shrunk.
  const measuredRef = useRef(false);
  useEffect(() => {
    if (isMobile && layoutAspect === null && measuredRef.current && aspect > 0.2 && aspect < 3) {
      setLayoutAspect(Math.min(Math.max(Math.round(aspect * 20) / 20, 0.42), 0.85));
    }
  }, [isMobile, aspect, layoutAspect]);

  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  // Measure the stage synchronously on mount, before any passive effect runs, so
  // the frozen layout aspect is always a real reading.
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (w > 0 && h > 0) {
      measuredRef.current = true;
      setAspect(w / h);
    }
  }, []);
  const circlesRef = useRef<SVGGElement>(null);
  const labelsRef = useRef<SVGGElement>(null);
  const isMobileRef = useRef(false);
  isMobileRef.current = isMobile;
  const viewRef = useRef<View>([nodes[0].x, nodes[0].y, nodes[0].r * 2 * (isMobile ? PAD : ZOOM_PAD)]);
  const focusRef = useRef<Node>(nodes[0]);
  const rafRef = useRef<number>(0);

  const [focus, setFocus] = useState<Node>(nodes[0]);
  const [hovered, setHovered] = useState<Node | null>(null);
  const [boxAlt, setBoxAlt] = useState(false); // flips each time the shown circle changes, for the alternating box colour
  const [railSide, setRailSide] = useState<"left" | "right">("right"); // side the related-dogs rail sits, flipped when the box is dragged across
  const [entered, setEntered] = useState(false);
  const [falling, setFalling] = useState(false);
  const [dropped, setDropped] = useState(false);
  // The main pit sizes every toy off BIG = 84 * SCALE, and its menu square off
  // BIG * 1.2, where SCALE drops to 0.67 below 768px. The mini pit used a flat
  // 84px, so its squares came out 24% too big on mobile and 17% too small on
  // desktop. Mirror the main pit's own rule so the two can never drift.
  const [pitScale, setPitScale] = useState(1);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = () => setPitScale(mq.matches ? 0.67 : 1);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  // The pit is inert until START is pressed. Nothing falls on a timer.
  const [started, setStarted] = useState(false);
  // Inert means inert: on the start screen the circles do not take clicks, do
  // not highlight on hover and cannot be drilled into. Only START, LEARN and
  // the close X answer. LEARN counts as having chosen, so the layer behind it
  // behaves normally.
  useEffect(() => { onStartedChange?.(started); }, [started, onStartedChange]);
  // which of the two words the pointer is over, for their hover state
  const [wordHover, setWordHover] = useState<"start" | "learn" | null>(null);
  // mirrored into a ref for the pointer handler, which is bound once
  const wordHoverRef = useRef(false);
  // LEARN mode: the pit stays inert, the blue box is open, and a pink wash lies
  // over everything. learnPeek is the desktop hover preview of that wash.
  const [learning, setLearning] = useState(false);
  useEffect(() => { onLearningChange?.(learning); }, [learning, onLearningChange]);
  const [learnPeek, setLearnPeek] = useState(false);
  const frozen = dockAside && gravity && !started && !learning;
  // Desktop hover preview of the level background, the same courtesy LEARN gets.
  const [startPeek, setStartPeek] = useState(false);
  // Hovering the learn PLAY button previews the play scene behind the pit.
  const [playPeek, setPlayPeek] = useState(false);
  // Learn rail: the pack dog whose Ancestry card is open below the box.
  const [ancestryFor, setAncestryFor] = useState<{ name: string; slug: string; note?: string; image?: string } | null>(null);
  const [ancHidden, setAncHidden] = useState(false);
  const [trainHidden, setTrainHidden] = useState(false);
  const [tempHidden, setTempHidden] = useState(false);
  const [ancPos, setAncPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const [trainPos, setTrainPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const [tempPos, setTempPos] = useState<{ left: number; top: number; width: number } | null>(null);
  // The blue box can be picked up and moved, the same as the cards on a chum
  // page. It rides on a transform offset rather than left/top, so it cannot
  // disturb the docked layout underneath, and it snaps home each time it opens.
  const asideRef = useRef<HTMLDivElement>(null);
  const asideOff = useRef({ x: 0, y: 0 });
  const asideDrag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  useEffect(() => {
    if (!hideCaption) return; // closed: forget where it was left
    asideOff.current = { x: 0, y: 0 };
    if (asideRef.current) asideRef.current.style.transform = "";
  }, [hideCaption]);
  const asideDown = (e: React.PointerEvent) => {
    if (!dockAside) return;
    const t = e.target as HTMLElement;
    if (t.closest("button, a, input, select, textarea")) return; // let the close X work
    const el = asideRef.current;
    if (!el) return;
    e.preventDefault();
    asideDrag.current = { sx: e.clientX, sy: e.clientY, ox: asideOff.current.x, oy: asideOff.current.y };
    try { el.setPointerCapture(e.pointerId); } catch { /* no capture available */ }
  };
  const asideMove = (e: React.PointerEvent) => {
    const d = asideDrag.current;
    const el = asideRef.current;
    if (!d || !el) return;
    asideOff.current = { x: d.ox + (e.clientX - d.sx), y: d.oy + (e.clientY - d.sy) };
    el.style.transform = `translate(${asideOff.current.x}px, ${asideOff.current.y}px)`;
  };
  const asideUp = () => {
    asideDrag.current = null;
    const el = asideRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      // Put the rail on the side with more room: box in the right half of
      // the screen sends the cards left, and the other way round.
      setRailSide(r.left + r.width / 2 > window.innerWidth / 2 ? "left" : "right");
    }
  };
  // Held null until the display face is painting, so the first (server-matched)
  // render uses the flat average and only the measured pass uses canvas.
  const [labelFont, setLabelFont] = useState<string | null>(null);
  useEffect(() => {
    const read = () => {
      const v = getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim();
      setLabelFont(`${v || "system-ui"}, system-ui, sans-serif`);
    };
    if (document.fonts?.ready) document.fonts.ready.then(read, read);
    else read();
  }, []);
  // Scattered pit props. A badge is the small yellow percentage disc; a solo
  // dog leaves behind a full-size blank circle wearing its breed name instead.
  // Both ride the same bodies, hit counting and inert state: only the radius,
  // the face and the charge count differ.
  type BadgeItem = { pct: number; r: number; label?: string };
  const [badgePcts, setBadgePcts] = useState<BadgeItem[]>([]);
  // rods and name pills scattered in from the learn layer, pit-style props:
  // sizes are view units frozen at the drop; dead ones keep their slot so the
  // render children stay index-aligned with the bridge lists
  const [rodList, setRodList] = useState<{ len: number; h: number; lit: boolean }[]>([]);
  const [deadRods, setDeadRods] = useState<Set<number>>(new Set());
  const [pillList, setPillList] = useState<{ lines: string[]; w: number; h: number; rx: number }[]>([]);
  const [deadPills, setDeadPills] = useState<Set<number>>(new Set());
  const [toyList, setToyList] = useState<{ kind: ToyKind; size: number; h: number; src: string }[]>([]);
  const [deadToys, setDeadToys] = useState<Set<number>>(new Set());
  const [britainOpen, setBritainOpen] = useState(false);
  const killToyRef = useRef<((idx: number) => void) | null>(null);
  const throwWatchRef = useRef<((pr: any) => void) | null>(null);
  const checkEscapeRef = useRef<(() => void) | null>(null);
  const flagIdxRef = useRef<number | null>(null);
  useEffect(() => {
    if (!dockAside) return;
    setBadgePcts(
      nodes
        .filter((n) => n.depth === 1)
        .map((n) => ({ pct: n.parent ? Math.round(((n.value ?? 0) / (n.parent.value || 1)) * 100) : 0, r: BADGE_DRAW_R })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, dockAside]);
  const [learnNode, setLearnNode] = useState<Node | null>(null);
  const [learnCard, setLearnCard] = useState<{ name: string; image: string; x: number; y: number; angle: number; r: number } | null>(null);
  const removedNodesRef = useRef<Set<Node>>(new Set());
  const spawnBadgeRef = useRef<((x: number, y: number, r: number, pct: number, opts?: { r?: number; label?: string; charges?: number }) => void) | null>(null);
  const spawnRodRef = useRef<((x1: number, y1: number, x2: number, y2: number, lit: boolean) => void) | null>(null);
  const spawnPillRef = useRef<((x: number, y: number, w: number, name: string) => void) | null>(null);
  type PropBody = { x: number; y: number; vx: number; vy: number; a: number; idx: number; hits: number; maxHits: number; dead?: boolean; lastKnock?: number; mb?: any };
  const rodBodiesRef = useRef<PropBody[]>([]);
  const toyBodiesRef = useRef<PropBody[]>([]);
  const toysGRef = useRef<SVGGElement>(null);
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
  type BadgeBody = { x: number; y: number; vx: number; vy: number; r: number; pct: number; idx: number; held?: boolean };
  const badgeBodiesRef = useRef<BadgeBody[] | null>(null);
  const badgesRef = useRef<SVGGElement>(null);
  const fxRef = useRef<SVGGElement>(null);
  // Drag support: badges can be picked up and flung, like
  // objects in the main pit. Circles stay click-to-zoom only. The sim exposes
  // a wake() so a drag can restart physics after everything has settled.
  const wakeRef = useRef<(() => void) | null>(null);
  // Slow motion. The fixed-timestep driver feeds Engine.update, which applies
  // engine.timing.timeScale itself, so a quarter speed toggle is all it takes.
  const slowmoRef = useRef<(() => void) | null>(null);
  const simRunningRef = useRef(false);
  const matterCleanupRef = useRef<(() => void) | null>(null);
  const chainRef = useRef<((ox: number, oy: number) => number) | null>(null);
  const [deadBadges, setDeadBadges] = useState<Set<number>>(new Set());
  const [descGone, setDescGone] = useState(false);
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
  // Without a theme the pit keeps the main pit's rule: floor at the very bottom
  // of the container, nothing hovers. With a theme the ground strip is real art
  // with a real surface, so the floor is reserved up to the LOWEST point of that
  // surface and the stepped slabs take it from there.
  //
  // Everything is derived from the stage width, so the art and the physics scale
  // together and cannot drift apart. bandVU is the strip's on-screen height in
  // svg units; pxVU converts a css pixel into svg units at the current size.
  const pxVU = () => {
    const st = stageRef.current;
    const w = st ? st.clientWidth : 0;
    if (!w) return 1;
    const asp = w / Math.max(st!.clientHeight, 1);
    return (asp >= 1 ? SIZE * asp : SIZE) / w;
  };
  const floorBandVU = () => {
    const st = stageRef.current;
    if (!levelTheme || !st) return 0;
    return st.clientWidth * pxVU() / levelTheme.floorAspect;
  };
  // How far the strip's bottom edge sits below the stage bottom, in css px. The
  // deepest point of the drawn surface lands exactly LEVEL_FLOOR_LIFT above the
  // stage bottom, and the rest of the art hangs off the screen below it.
  const floorArtBottomPx = () => {
    const st = stageRef.current;
    if (!levelTheme || !st) return 0;
    const bandPx = st.clientWidth / levelTheme.floorAspect;
    return -bandPx * (1 - LEVEL_FLOOR_SHOW);
  };
  // the deepest point of the drawn surface, in css px above the stage bottom
  const floorLiftPx = () => {
    const st = stageRef.current;
    if (!levelTheme || !st) return 0;
    const bandPx = st.clientWidth / levelTheme.floorAspect;
    return bandPx * (LEVEL_FLOOR_SHOW - Math.max(...levelTheme.floorProfile));
  };
  const floorReserveVU = () => (levelTheme ? floorLiftPx() * pxVU() : 0);

  // The split. The wash is a slab 2.2 viewports wide, centred, pushed right by
  // WASH_PEEK_X of its own width and then rotated. Its leading edge is therefore
  // a known line, and the level background is simply everything on the far side
  // of it. Rather than slide a second slab in and hope the two meet, the level
  // sits still and a clip cuts it along that same line, so the seam is exact at
  // any screen size and the artwork is correctly framed the whole way through.
  //
  // shift slides the cut along its own normal: positive clears the level off the
  // bottom left, 0 is the seam, negative carries it past the seam to full cover.
  const seamClip = (shift: number) => {
    const vw = typeof window === "undefined" ? 390 : window.innerWidth;
    const vh = typeof window === "undefined" ? 844 : window.innerHeight;
    const rad = (-WASH_DEG * Math.PI) / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    const W = WASH_INSET * vw;
    // the slab's leading edge, taken through the same rotation the wash uses
    const ex = (0.5 - WASH_PEEK_X) * -W;
    const px0 = vw / 2 + cos * ex;
    const py0 = vh / 2 + sin * ex;
    // along the edge, and the normal pointing into the level's half
    const ax = -sin, ay = cos;
    const nx = -cos, ny = -sin;
    const far = 2 * (vw + vh);
    const ox = px0 + nx * shift, oy = py0 + ny * shift;
    // px, not %: percentages in a polygon resolve against each axis separately,
    // which shears the line the moment the viewport is not square
    const pt = (t: number, u: number) =>
      `${Math.round(ox + ax * t + nx * u)}px ${Math.round(oy + ay * t + ny * u)}px`;
    return `polygon(${pt(-far, 0)}, ${pt(far, 0)}, ${pt(far, far)}, ${pt(-far, far)})`;
  };
  // Which side of the seam a screen point falls on. Positive is the lower-left
  // half, which belongs to PLAY; negative is the upper-right half, LEARN's.
  const seamSide = (cx: number, cy: number): number => {
    const vw = typeof window === "undefined" ? 390 : window.innerWidth;
    const vh = typeof window === "undefined" ? 844 : window.innerHeight;
    const rad = (-WASH_DEG * Math.PI) / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    const W = WASH_INSET * vw;
    const ex = (0.5 - WASH_PEEK_X) * -W;
    const px0 = vw / 2 + cos * ex;
    const py0 = vh / 2 + sin * ex;
    const ax = -sin, ay = cos; // along the seam
    // cross product of the seam direction with the point, so the sign tells us
    // which side it lies on
    return ax * (cy - py0) - ay * (cx - px0);
  };
  const SEAM_OFF = () => (typeof window === "undefined" ? 900 : window.innerWidth + window.innerHeight);

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
      if ((body as any)?.mb?.circleRadius) throwWatchRef.current?.(body); // toy released
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
    const base = widths[d.depth - 1] ?? 2.4;
    // The mini pit draws its rings four times heavier than the chum page, so a
    // small, simple lineage reads boldly. (These circles are leaves, not
    // single-child, which is why the earlier per-child rule never showed.)
    return dockAside ? base * 4 : base;
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
    for (const [listRef, gRef] of [[rodBodiesRef, rodsGRef], [pillBodiesRef, pillsGRef], [toyBodiesRef, toysGRef]] as const) {
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
    // while the view flies in, and everything returns as the view pulls back.
    // Nothing auto-drops any more: exploring before the drop simply hides the
    // START button, and it comes back when the view returns to the full pit.
    focusRef.current = d;
    setFocus(d);
    onActiveChange?.(d !== nodes[0]);
    let target: View = [d.x, d.y, dockAside && d !== nodes[0] ? d.r * 2 : d.r * 2 * (isMobileRef.current ? PAD : ZOOM_PAD) * (dockAside && d === nodes[0] ? 1.21 : 1)];
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

  // The lift is split out so a tap that arrives from the drag handler can use it
  // too. That tap fires after React has recycled its event, so currentTarget is
  // already null by then: the element has to be captured up front and passed in.
  function liftToLearn(el: Element | null, d: Node): boolean {
    if (!fellRef.current || !el) return false;
    const pb = pitBodiesRef.current;
    const body = pb?.owned.has(d) ? pb.find(d) : undefined;
    if (!body) return false;
    body.held = true;
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
    return true;
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
    if (dockAside) { setAncestryFor(null); setAncHidden(true); setTrainHidden(true); setTempHidden(true); }
    if (focusRef.current !== d) {
      zoom(d);
      // Clicking a circle to zoom in also opens the info box if it was closed.
      if (dockAside && hideCaption && d !== nodes[0]) onToggleCaption?.();
    } else if (d.parent) zoom(d.parent);
  }
  function onBackground() {
    if (focusRef.current !== nodes[0]) { zoom(nodes[0]); return; }
    // Once the round is running a stray tap on the background must not throw the
    // player out. A missed grab at a circle lands here, and losing a round that
    // way is miserable. Route it through the same confirmation the close X uses.
    if (started && onPitClose) { onPitClose(); return; }
    // LEARN never sets started, so without this a stray tap on the pit
    // background (exposed around the floating blue box, e.g. a near-miss on
    // the box's close X) would fall through to onClose and drop the player
    // out of the whole game. In LEARN the close X is the deliberate way out,
    // so a background tap does nothing.
    if (learning) return;
    onClose?.();
  }

  useEffect(() => {
    focusRef.current = nodes[0];
    setFocus(nodes[0]);
    setReady(true);

    const v: View = clampRootView([nodes[0].x, nodes[0].y, nodes[0].r * 2 * (isMobile ? PAD : ZOOM_PAD) * (dockAside ? 1.21 : 1)]);
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // A difficulty change re-packs the circles, which lands here as a fresh
    // nodes array. Replaying the 700ms staggered entrance on every step of the
    // slider would be unusable, and START is gated on `entered` so it would
    // blink out each time. Resize in place instead: the pack is real, so the
    // physics still reads the true radii when START is pressed.
    if (reduce || resizeOnlyRef.current) {
      resizeOnlyRef.current = false;
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

  // Closing the blue box used to be the way out of LEARN. It is not any more:
  // the corner X is the single exit everywhere, on the start screen, in play and
  // in learn alike. Shutting the box now leaves you in learn with the box down,
  // a state that did not previously exist, and the info square lives in it.

  // Let the shell mirror the hovered/focused breed (title + pill text).
  useEffect(() => {
    const sh = (hovered ?? focus) as Node;
    onShownChange?.(sh.data.name);
    const shImg = sh === nodes[0] ? (rootImage ?? sh.data.img) : sh.data.img;
    onShownImageChange?.(shImg ? bust(shImg) : null);
    const shNote = sh === nodes[0] ? (rootNote ?? sh.data.note ?? "") : (sh.data.note ?? "");
    onShownStatusChange?.(nodeStatus(sh.data.name, shNote));
    setBoxAlt((v) => !v);
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
      const BADGE_R = BADGE_DRAW_R / k;
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
      // Flat pit: one slab. Themed pit: the drawn ground is uneven, so the floor
      // is a run of stepped slabs following its surface. Stepped rectangles, not
      // a vertex body: the main pit tried fromVertices for its jagged floor and
      // it came out ragged (commit 770173e), and statics cost nothing anyway.
      // Every slab carries kind "floor" so the toy beats, which run from the
      // first floor contact, behave exactly as before.
      const floorParts: any[] = [];
      const floorSlabs: any[] = [];
      if (levelTheme) {
        const prof = levelTheme.floorProfile;
        const deepest = Math.max(...prof);
        const bandVU = floorBandVU();
        const stepPx = wPx / prof.length;
        for (let i = 0; i < prof.length; i++) {
          // how far this sample sits above the deepest point of the surface
          const riseVU = bandVU * (deepest - prof[i]);
          const py = pxFromWorld(xL, yF - riseVU / k).y;
          const slab = Bodies.rectangle(
            pL.x + stepPx * (i + 0.5),
            py + T / 2,
            stepPx + 2, // overlap so a body cannot catch between two slabs
            T,
            { isStatic: true, restitution: 0.4 }
          );
          slab.plugin = { kind: "floor" };
          floorSlabs.push(slab);
        }
        // One compound static, not 24 loose ones. Separate overlapping statics
        // each resolve their own contact, so a ball straddling a seam gets two
        // corrective impulses and an upward throw can be cancelled outright.
        // As parts of one body the seams stop existing.
        const ground = MBody.create({ parts: floorSlabs, isStatic: true, restitution: 0.4 });
        ground.plugin = { kind: "floor" };
        floorParts.push(ground);
        // aprons past the walls, so nothing squeezes out at the corners
        for (const sx of [pL.x - T / 2, pR.x + T / 2]) {
          const apron = Bodies.rectangle(sx, pL.y + T / 2, T, T, { isStatic: true, restitution: 0.4 });
          apron.plugin = { kind: "floor" };
          floorParts.push(apron);
        }
      } else {
        const flat = Bodies.rectangle(pL.x + wPx / 2, pL.y + T / 2, wPx + T * 2, T, { isStatic: true, restitution: 0.4 });
        flat.plugin = { kind: "floor" };
        floorParts.push(flat);
      }
      const wallL = Bodies.rectangle(pL.x - T / 2, sideC, T, sideH, { isStatic: true, restitution: 0.35 });
      const wallR = Bodies.rectangle(pR.x + T / 2, sideC, T, sideH, { isStatic: true, restitution: 0.35 });
      wallL.plugin = { kind: "wall" }; wallR.plugin = { kind: "wall" };
      Composite.add(world, [...floorParts, wallL, wallR]);

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
            setBadgePcts((l) => [...l, { pct: bb.pct, r: BADGE_DRAW_R }]);
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
        (kind === "rod" ? setDeadRods : kind === "toy" ? setDeadToys : setDeadPills)((prev) => new Set(prev).add(pr.idx));
      };
      // ROUND WON chain: every remaining prop explodes nearest-first from the
      // final circle's resting spot, 90ms apart (the bomb's chain, mini-pit cut)
      chainRef.current = (ox: number, oy: number) => {
        const targets: { x: number; y: number; go: () => void }[] = [];
        for (const b of all) {
          if (b.n || !b.mb || !b.mbIn || b.held) continue;
          targets.push({ x: b.x, y: b.y, go: () => { poofAt(b.x, b.y, performance.now()); Composite.remove(world, b.mb); b.mbIn = false; setDeadBadges((p) => new Set(p).add(b.idx)); } });
        }
        for (const [list, kind] of [[rodBodiesRef.current, "rod"], [pillBodiesRef.current, "pill"], [toyBodiesRef.current, "toy"]] as any[]) {
          for (const pr of list) if (!pr.dead && pr.mb) targets.push({ x: pr.x, y: pr.y, go: () => killProp(pr, kind, performance.now()) });
        }
        const du = (uiBodiesRef.current as any[] | null)?.find((u) => u.kind === "desc");
        if (du && du.mb) targets.push({ x: du.x, y: du.y, go: () => { poofAt(du.x, du.y, performance.now()); Composite.remove(world, du.mb); setDescGone(true); } });
        targets.sort((a, b2) => Math.hypot(a.x - ox, a.y - oy) - Math.hypot(b2.x - ox, b2.y - oy));
        targets.forEach((t, i) => window.setTimeout(t.go, i * 90));
        wake();
        return targets.length * 90;
      };
      // ---- toys: tennis ball and Union Jack, main pit physics verbatim ----
      const BIGT = 84 * (window.matchMedia("(max-width: 768px)").matches ? 0.67 : 1);
      const toyTimers: number[] = [];
      const spawnToy = (kind: ToyKind) => {
        // the flag never returns once its message has been read; the ball never
        // returns once the player has thrown it clear of the pit
        if (toyRetired(TOY_GONE_KEY[kind])) return;
        const isNarrow = window.matchMedia("(max-width: 768px)").matches;
        const ballDia = BIGT * 2.25 * (isNarrow ? 0.9 : 1);
        // rock reads at the ball's size, stick a little longer than the ball is
        // wide so it looks throwable rather than like a twig
        const dia =
          kind === "ball" ? ballDia
          : kind === "rock" ? ballDia
          : kind === "stick" ? ballDia * 1.6
          : kind === "stickBig" ? ballDia * 1.6 * 1.5
          : BIGT * 0.6 * 2;
        const hgt = kind === "stick" || kind === "stickBig" ? dia / STICK_ASPECT : kind === "rock" ? dia / ROCK_ASPECT : dia;
        const r = dia / 2;
        // ball drops anywhere across the pit, flag comes in at 70% like the pit
        const px = kind === "flag"
          ? pL.x + wPx * 0.7
          : pL.x + r + 20 + Math.random() * Math.max(1, wPx - dia - 40);
        // Spawn ABOVE the visible top so the toy is already falling when it
        // enters, exactly as the main pit does. Take the top edge from the stage
        // rectangle, not from the viewBox mapping: the viewBox can reach well
        // past the visible stage, which was launching the ball ~590px up instead
        // of the pit's 60 to 120.
        const stageTopPx = st ? st.getBoundingClientRect().top : 0;
        const py = kind === "flag"
          ? stageTopPx - r                             // pit: y = -ujR
          : stageTopPx - (60 + Math.random() * 60);    // pit: y = -60 - rand*60
        const w2 = worldFromPx(px, py);
        const idx = toyBodiesRef.current.length;
        const pr: any = { x: w2.x, y: w2.y, vx: 0, vy: 0, a: 0, idx, hits: 0, maxHits: kind === "flag" ? TOY_FLAG_HITS : 9999, mb: null, toyKind: kind };
        const opts =
          kind === "ball" ? { restitution: 0.97, friction: 0.05, frictionAir: 0.003, density: 0.0006 } // pit: super bouncy
          : kind === "rock" ? { restitution: 0.12, friction: 0.75, frictionStatic: 1.2, frictionAir: 0.006, density: 0.02 }
          : kind === "stick" ? { restitution: 0.35, friction: 0.35, frictionAir: 0.004, density: 0.002 }
          : { restitution: 0.5, friction: 0.3, frictionAir: 0.004, density: 0.006 };
        // A long thin body needs a real rectangle or it spins like a propeller.
        // Chamfered, so it reads as a rounded stick and cannot catch on a corner.
        // The rock is a seven-sided polygon rather than a circle: a circle would
        // roll away down the sloped ground, and a rock should sit where it lands.
        const isStick = kind === "stick" || kind === "stickBig";
        const startAngle = isStick ? (Math.random() - 0.5) * 0.8 : 0;
        // The stick is a tapered, kinked branch, not a sausage: traced from the
        // artwork it is thin at the left tip, fat through the middle where the
        // side branch juts down, and slimmer along the right arm. A single
        // capsule the size of the bounding box left 10 to 24px of air depending
        // where it landed. Three chamfered sections follow the real shape.
        // Each entry is [start, end, thickness] as fractions of the sprite.
        const STICK_PARTS: [number, number, number][] = [
          [0.00, 0.06, 0.26], // the thin left tip
          [0.04, 0.50, 0.70], // left and middle, thickest, carries the branch
          [0.46, 1.00, 0.50], // the right arm
        ];
        // The rock's shell follows the artwork's own proportions. Building it
        // from r, which comes off the width, made a body as tall as the rock is
        // wide, and the drawing is 13% shorter than that. It floated.
        const rockRx = dia / 2, rockRy = hgt / 2;
        const mb =
          isStick
            ? (() => {
                const parts = STICK_PARTS.map(([a, b2, th]) => {
                  const w = (b2 - a) * dia;
                  const cx = px + (a + b2) / 2 * dia - dia / 2;
                  const h2 = Math.max(4, th * hgt);
                  return Bodies.rectangle(cx, py, w, h2, { ...opts, chamfer: { radius: Math.min(h2, w) / 2 } });
                });
                const body = MBody.create({ parts, ...opts });
                MBody.setAngle(body, startAngle);
                return body;
              })()
            : kind === "rock"
              ? Bodies.polygon(px, py, 7, r, { ...opts, chamfer: { radius: r * 0.12 } })
              : Bodies.circle(px, py, r, opts);
        // fromVertices is avoided deliberately: it produced a ragged body when
        // it was tried on the pit floor. A plain polygon squashed to the
        // artwork's own proportions is predictable and does the same job.
        if (kind === "rock" && rockRy > 0 && rockRx > 0) MBody.scale(mb, 1, rockRy / rockRx);
        mb.plugin = { prop: pr, kind: "toy" };
        pr.mb = mb;
        Composite.add(world, mb);
        // the pit gives the flag a throw and lets the ball simply drop
        if (kind === "flag") MBody.setVelocity(mb, { x: (Math.random() - 0.5) * 3, y: 3 });
        if (kind === "stick") pr.a = startAngle;
        toyBodiesRef.current.push(pr);
        if (kind === "flag") flagIdxRef.current = idx;
        setToyList((l) => [...l, { kind, size: dia * fxScale, h: hgt * fxScale, src: TOY_SRC[kind] }]);
        wake();
      };
      // Tennis ball escape, ported from the main pit: a ball RELEASED with real
      // upward speed and then leaving the top of the stage is gone for good.
      // A ball merely bounced upward by physics comes back down as normal.
      let thrownBall: any = null;
      throwWatchRef.current = (pr: any) => {
        // the flag leaves by having its message read, badges are not in scope
        if (pr?.toyKind !== "ball" && pr?.toyKind !== "stick" && pr?.toyKind !== "rock") return;
        if (pr.mb && pr.mb.velocity.y < -4) thrownBall = pr; // pit threshold
        else if (thrownBall === pr) thrownBall = null;
      };
      checkEscapeRef.current = () => {
        const pr: any = thrownBall;
        if (!pr || pr.dead || !pr.mb) { thrownBall = null; return; }
        const stageTop = st ? st.getBoundingClientRect().top : 0;
        // circleRadius is undefined on the stick and the rock, so fall back to
        // the body's own half-height
        const reach = pr.mb.circleRadius ?? (pr.mb.bounds.max.y - pr.mb.bounds.min.y) / 2;
        if (pr.mb.position.y < stageTop - reach) {
          thrownBall = null;
          retireToy(TOY_GONE_KEY[pr.toyKind as ToyKind]);
          killProp(pr, "toy", performance.now());
        }
      };
      killToyRef.current = (idx: number) => {
        const pr = toyBodiesRef.current[idx];
        if (pr && !pr.dead) killProp(pr, "toy", performance.now());
      };
      const armToys = () => {
        if (toyTimers.length) return; // first landing only
        toyTimers.push(window.setTimeout(() => spawnToy("ball"), TOY_BALL_DELAY));
        toyTimers.push(window.setTimeout(() => spawnToy("flag"), TOY_BALL_DELAY + TOY_FLAG_GAP));
        const propsAt = TOY_BALL_DELAY + TOY_FLAG_GAP + TOY_PROP_GAP;
        // both sticks together, then the rock half a second later so it gets
        // its own thump rather than landing under them
        toyTimers.push(window.setTimeout(() => spawnToy("stick"), propsAt));
        toyTimers.push(window.setTimeout(() => spawnToy("stickBig"), propsAt));
        toyTimers.push(window.setTimeout(() => spawnToy("rock"), propsAt + TOY_ROCK_GAP));
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
      // opts is how the solo-dog circle arrives: its own radius, its breed name
      // in place of a percentage, and a lower charge count because a circle that
      // size gets struck far more often than a badge does.
      spawnBadgeRef.current = (
        sx: number,
        sy: number,
        rPx: number,
        pctVal: number,
        opts?: { r?: number; label?: string; charges?: number }
      ) => {
        // client px in, which is the physics space itself now
        const bl = badgeBodiesRef.current;
        if (!bl) return;
        const w = worldFromPx(sx, sy);
        const rDraw = opts?.r ?? BADGE_DRAW_R;
        const nb: Body = { n: null, x: w.x, y: w.y, vx: 0, vy: 0, r: rDraw / kD, pct: pctVal, idx: bl.length, lastFx: 0, popped: true, a: 0, va: 0, ia: 0, iva: 0, charges: opts?.charges ?? 20 };
        bl.push(nb);
        all.push(nb);
        const mb = mkCircle(nb, "badge", BADGE_OPTS);
        MBody.setVelocity(mb, { x: (Math.random() - 0.5) * 3, y: 3 }); // pit scatter contract, verbatim
        setBadgePcts((l) => [...l, { pct: pctVal, r: rDraw, label: opts?.label }]);
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
          // the first thing to reach the floor is always a dog circle, because
          // nothing else is in the pit yet: that is the beat the toys run from
          if (pa.kind === "floor" || pb2.kind === "floor") armToys();
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
            // Toys never take collision damage. Rods and pills wear out from
            // knocks, but in the main pit the flag only ever counts TAPS, and
            // the ball never expires at all. Left as it was, a well-knocked
            // Union Jack poofed at random before anyone could read it.
            if (P.kind === "toy") continue;
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
        checkEscapeRef.current?.();
        for (const list of [rodBodiesRef.current, pillBodiesRef.current, toyBodiesRef.current]) {
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
          // "Full" used to mean five settled bodies reaching the top zone, a
          // count borrowed from the main pit, which always holds dozens of
          // cards. Half the mini pit trees have two or three circles, so the pit
          // could be visibly stuffed while the count sat at 2 and the round
          // never ended: the top of the difficulty slider did nothing on those
          // trees, because the game could not see it had run out of room.
          //
          // Occupancy is what full actually means. Take every settled body whose
          // top reaches the zone, merge their horizontal spans so two circles
          // side by side are not counted twice, and compare against the width
          // between the pit walls. Tree size stops mattering.
          const spans: [number, number][] = [];
          let inZone = 0;
          for (const b of all) {
            if (b.held) continue;
            if (Math.hypot(b.vx, b.vy) > worldH * 0.03) continue;
            if (b.y - b.r < zoneY) { inZone++; spans.push([b.x - b.r, b.x + b.r]); }
          }
          let covered = 0;
          if (spans.length) {
            spans.sort((p1, p2) => p1[0] - p2[0]);
            let cs = spans[0][0], ce = spans[0][1];
            for (let si = 1; si < spans.length; si++) {
              const [s2, e2] = spans[si];
              if (s2 > ce) { covered += ce - cs; cs = s2; ce = e2; }
              else if (e2 > ce) ce = e2;
            }
            covered += ce - cs;
          }
          // the real distance between the walls, not the viewBox, which reaches
          // well past the visible stage
          const pitW = (xR - xL) || 1;
          const blocked = spans.length > 0 && covered / pitW >= PIT_FULL_COVER;
          if (blocked || inZone >= 5) {
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
        for (const list of [rodBodiesRef.current, pillBodiesRef.current, toyBodiesRef.current]) {
          for (const pr of list) if (!pr.dead && pr.mb) MBody.setVelocity(pr.mb, { x: (Math.random() - 0.5) * 16, y: -(7 + Math.random() * 12) });
        }
        wake();
      };
      wakeRef.current = wake;
      slowmoRef.current = () => {
        engine.timing.timeScale = engine.timing.timeScale === 1 ? 0.25 : 1;
        wake(); // a settled pit still needs to be woken to show the change
      };
      matterCleanupRef.current = () => {
        Events.off(engine, "collisionStart", onCollide);
        for (const t of toyTimers) window.clearTimeout(t);
        for (const t of ghostTimers) window.clearTimeout(t);
        Composite.clear(engine.world, false);
        Engine.clear(engine);
      };
      wake();
    };
    runFallRef.current = doFall;
    registerSlowmo?.(() => slowmoRef.current?.());
    registerShake?.(() => {
      // a shake also starts the round, so the button never blocks the pit
      if (!fellRef.current) { setLearnPeek(false); setStartPeek(false); setStarted(true); runFallRef.current?.(); }
      shakeInnerRef.current?.();
    });
    // No timer: the circles hang until the visitor presses START.
    return () => { cancelAnimationFrame(fallRafRef.current); matterCleanupRef.current?.(); matterCleanupRef.current = null; };
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
      if (w > 0 && h > 0) { measuredRef.current = true; setAspect(w / h); }
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
  // Share of the whole chum (root value), the pill's headline figure, as
  // opposed to shownShare which is the share within the immediate parent.
  const shownNorm =
    shown.parent && (nodes[0].value ?? 0) > 0
      ? Math.round(((shown.value ?? 0) / (nodes[0].value || 1)) * 100)
      : null;
  // The level dog's living/extinct status, for the marker on its portrait.
  const rootTag = nodeStatus(nodes[0].data.name, rootNote ?? nodes[0].data.note ?? "");
  const headTag = ancestryFor ? nodeStatus(ancestryFor.name, ancestryFor.note ?? "") : rootTag;
  // The related-dogs rail follows the shown circle: each ancestor has its own
  // set of pack descendants (an uneven split), so it changes as you hover.
  const railDogs = useMemo(() => {
    // Dogs shared with the other big circle(s) sit first; dogs unique to this
    // circle drop to the bottom, so switching circles only churns the tail.
    const others = nodes.filter((n) => n.depth === 1 && n.data.name !== shown.data.name).map((n) => n.data.name);
    const sharedSlugs = new Set(others.length ? descendantPackBreeds(others).map((b) => b.slug) : []);
    const shownDogs = descendantPackBreeds([shown.data.name]);
    const shared = shownDogs.filter((b) => sharedSlugs.has(b.slug));
    const unique = shownDogs.filter((b) => !sharedSlugs.has(b.slug));
    return [...shared, ...unique].map((b) => ({ name: b.name, slug: b.slug, image: b.image, note: b.character }));
  }, [shown, nodes]);
  // Rail with enter/exit animation: dogs that drop out of the list stay mounted
  // for one beat with a "leaving" flag so they can play the pop in reverse.
  const [renderRail, setRenderRail] = useState<Array<{ name: string; slug: string; image: string; note: string; leaving?: boolean }>>(() => railDogs);
  useEffect(() => {
    setRenderRail((prev) => {
      const next = new Set(railDogs.map((d) => d.slug));
      const leaving = prev.filter((p) => !p.leaving && !next.has(p.slug)).map((p) => ({ ...p, leaving: true }));
      return [...railDogs.map((d) => ({ ...d })), ...leaving];
    });
  }, [railDogs]);
  useEffect(() => {
    if (!renderRail.some((p) => p.leaving)) return;
    const t = window.setTimeout(() => setRenderRail((prev) => prev.filter((p) => !p.leaving)), 340);
    return () => window.clearTimeout(t);
  }, [renderRail]);
  // That dog's ancestry breakdown, the same figures as its own page.
  const ancestryRows = useMemo(
    () => (ancestryFor ? ancestryBreakdown(ancestryFor.name) : []),
    [ancestryFor],
  );
  // That dog's pros and cons, for the temperament card. Keyed by breed name.
  const chumTraits = useMemo(
    () =>
      ancestryFor
        ? (breedTraits as Record<string, { pros: string[]; cons: string[] }>)[
            ancestryFor.name
          ] ?? null
        : null,
    [ancestryFor],
  );
  // Close the card when the hovered circle changes or the round begins.
  useEffect(() => { setAncestryFor(null); }, [learning]);
  // A card opens next to the main box: to its right if there is room, else its
  // left, cascaded a little per card so two do not land dead on top of each other.
  const cardSpot = (index: number) => {
    const r = asideRef.current?.getBoundingClientRect();
    const vw = typeof window === "undefined" ? 390 : window.innerWidth;
    const vh = typeof window === "undefined" ? 844 : window.innerHeight;
    // Same width as the main blue box (the docked caption is 80% of the aside).
    const boxW = r ? r.width * 0.8 : Math.min(vw * 0.6, 300);
    const boxLeft = r ? r.left + r.width * 0.1 : vw * 0.2;
    const boxRight = boxLeft + boxW;
    const boxTop = r ? r.top : 60;
    const cardW = boxW;
    const gap = 12;
    let left = boxRight + gap + index * 22;
    if (left + cardW > vw - 8) left = boxLeft - cardW - gap - index * 22;
    if (left < 8) left = Math.max(8, vw - cardW - 8);
    // Always below the 25% mark of the page; free to bleed off the bottom.
    const top = Math.max(Math.round(vh * 0.25), Math.round(boxTop + index * 44));
    return { left: Math.round(left), top, width: Math.round(cardW) };
  };
  // While a circle is hovered, hide the circles nested inside it so its own
  // image comes clear to the front instead of being covered by its progenitors.
  // Moving onto one of those inner circles re-hovers it and brings it back.
  const buriedSet = hovered && !dropped ? new Set(hovered.descendants()) : null;

  return (
    <div
      className={`${styles.tree}${fill ? " " + styles.treeFill : ""}`}
      ref={wrapRef}
      style={fill ? undefined : { width: size, height: size }}
      // The whole half of the screen is the hover target, not just the word.
      // Move the pointer anywhere in the upper-right half and LEARN previews;
      // anywhere in the lower-left half and PLAY does. The split is the same
      // seam the two overlays share, so what you hover is exactly what you get.
      onPointerMove={
        dockAside && gravity && !started && !learning
          ? (e) => {
              if (e.pointerType === "touch") return; // a tap is not a hover
              // A word beats the half it sits in. The words are enormous: at
              // desktop PLAY is wider than the screen, so its centre lands on the
              // far side of the seam and hovering the middle of PLAY previewed
              // LEARN. A ref rather than the wordHover state, because this
              // handler is bound once and would read a stale value.
              if (wordHoverRef.current) return;
              const play = seamSide(e.clientX, e.clientY) > 0;
              setStartPeek(play);
              setLearnPeek(!play);
            }
          : undefined
      }
      onPointerLeave={
        dockAside && gravity && !started && !learning
          ? () => { setStartPeek(false); setLearnPeek(false); }
          : undefined
      }
    >
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
                  stroke={hidden ? "none" : dockAside && d !== nodes[0] && d === shown ? "#ffffff" : strokeByDepth ? ["#ffd23e", "#0a3a57", "#5cc4ee", "#ffffff"][(d.depth - 1 + 4) % 4] : stroke}
                  strokeWidth={hidden ? 0 : strokeWidthFor(d)}
                  style={{
                    cursor: hidden ? "default" : "pointer",
                    pointerEvents: hidden ? "none" : "auto",
                    opacity: buried ? 0 : undefined,
                  }}
                  onMouseEnter={hidden || frozen ? undefined : () => setHovered(d)}
                  onMouseLeave={hidden || frozen ? undefined : (e) => {
                    // Ignore the mouseleave the blue box triggers when its own
                    // growth (name, share and note appearing on hover) expands
                    // down over the very circle being pointed at. Without this the
                    // box covers the circle, fires leave, collapses back to the
                    // focused circle, and cannot reopen because the pointer has not
                    // moved. A real move to another circle or empty space still has
                    // a relatedTarget outside the aside, so it clears as before.
                    const rt = e.relatedTarget as Element | null;
                    if (rt && asideRef.current?.contains(rt)) return;
                    setHovered((h) => (h === d ? null : h));
                  }}
                  onClick={
                    frozen
                      ? (e) => e.stopPropagation() // swallow it: falling through would close the pit
                      : disableZoom
                        ? undefined
                        : (e) => { if (!fellRef.current) onCircle(e, d); else e.stopPropagation(); }
                  }
                  // Once they have dropped, the dogs are physics bodies like
                  // everything else in the pit, so they can be picked up and
                  // shoved about. A press that does not travel is still a tap
                  // and still lifts the dog to the learn layer.
                  onPointerDown={
                    frozen || hidden || disableZoom
                      ? undefined
                      : (e) => {
                          // fellRef is a ref, so it cannot be read at render
                          // time: the component does not re-render when the
                          // drop finishes, and the handler would be frozen as
                          // undefined for ever. Check it here instead.
                          if (!fellRef.current) return;
                          const body = pitBodiesRef.current?.owned.has(d)
                            ? pitBodiesRef.current.find(d)
                            : undefined;
                          // held lifts the body out of the physics world, so the
                          // drag can place it directly. Without this the sim
                          // writes the old position back every frame and the dog
                          // does not move at all. Released on pointer up, which
                          // drops it back in wherever it was let go.
                          if (body) body.held = true;
                          const release = () => {
                            if (body) body.held = false;
                            wakeRef.current?.();
                            window.removeEventListener("pointerup", release);
                            window.removeEventListener("pointercancel", release);
                          };
                          window.addEventListener("pointerup", release);
                          window.addEventListener("pointercancel", release);
                          // captured now: by the time the tap callback runs,
                          // React has recycled the event and currentTarget is
                          // null, which threw and left the layer unopened
                          const el = e.currentTarget as SVGCircleElement;
                          startDrag(e, body as never, () => {
                            if (body) body.held = false;
                            liftToLearn(el, d);
                          });
                        }
                  }
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
                    (() => {
                      // Contain the label in its own circle. On mobile zoomTo
                      // scales the whole label group by ls, so the fit has to be
                      // done against the radius that scale leaves behind
                      // (r * k / ls); without that the type came out about a
                      // third too large and long names ran over the rim.
                      const vL = viewRef.current;
                      const kL = SIZE / vL[2];
                      const ls = isMobile ? Math.max(0.4, Math.min(1.25, (d.r * kL) / 250)) : 1;
                      const rFit = isMobile ? (d.r * kL) / ls : d.r;
                      // the ceiling the fitter may grow to. Raised with
                      // LABEL_SAFE so short names are not capped before they
                      // reach the rim.
                      const cap = isMobile ? 132 : 44;
                      const fit = fitLabel(d.data.name.toUpperCase(), rFit, cap, labelFont);
                      const lines = fit.lines;
                      const fs = Math.max(10, Math.min(cap, fit.fs + TITLE_BOOST));
                      return (
                        <text
                          x={0}
                          y={labelFirstY(lines.length, fs)}
                          transform={`rotate(${TITLE_ANGLE} 0 ${TITLE_DY})`}
                          style={{ fill: d === hovered ? "var(--yellow, #ffd23e)" : "#ffffff", fontFamily: "var(--font-display), system-ui, sans-serif", fontSize: `${fs}px`, letterSpacing: "0.5px" }}
                        >
                          {lines.map((line, li) => (
                            <tspan key={li} x={0} dy={li === 0 ? 0 : "1.05em"}>{line}</tspan>
                          ))}
                        </text>
                      );
                    })()
                  )}
                  {pct !== null && !(dockAside && d.depth === 1) && !learning && (
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
          {/* The badges are laid out from viewRef, which only reaches its final
              value when the drop-in entrance calls zoomTo at the end. Showing
              them before that put every chip at the wrong scale and origin (up
              and to the left), then snapped it to the rim. They now fade in with
              the labels, already at their resting spot on the lower-right rim,
              which is exactly where the physics bodies spawn. */}
          <g ref={badgesRef} style={{ display: dockAside && !learning ? "inline" : "none", opacity: entered ? 1 : 0, transition: "opacity 0.3s ease" }} textAnchor="middle">
            {badgePcts.map((item, i) => {
              const v = viewRef.current;
              const kk = SIZE / v[2];
              const b = badgeBodiesRef.current?.[i];
              const d1n = nodes.filter((n) => n.depth === 1)[i];
              const bx = b ? b.x : d1n ? d1n.x + d1n.r * 0.707 : v[0];
              const by = b ? b.y : d1n ? d1n.y + d1n.r * 0.707 : v[1] - 99999;
              const st2 = stageRef.current;
              const upp2 = st2 ? (aspect >= 1 ? SIZE : SIZE / Math.max(aspect, 0.01)) / Math.max(st2.clientHeight, 1) : 1;
              const inert = inertBadges.has(i);
              if (deadBadges.has(i)) return <g key={i} style={{ display: "none" }} />;
              return (
              <g key={i} transform={`translate(${(bx - v[0]) * kk},${(by - v[1]) * kk})`}
                style={{ cursor: inert ? "default" : "grab", pointerEvents: inert ? "none" : "auto", userSelect: "none" }}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={inert ? undefined : (e) => {
                  // Lift the badge out of the sim while dragging, like the dog
                  // circles: without this it keeps falling in the physics world
                  // behind your finger and snaps to that spot when you let go.
                  const body = badgeBodiesRef.current?.[i];
                  if (body) body.held = true;
                  const release = () => {
                    if (body) body.held = false;
                    wakeRef.current?.();
                    window.removeEventListener("pointerup", release);
                    window.removeEventListener("pointercancel", release);
                  };
                  window.addEventListener("pointerup", release);
                  window.addEventListener("pointercancel", release);
                  startDrag(e, body);
                }}>
                <circle cx={0} cy={0} r={item.r} style={{ fill: inert ? "#0c5b92" : item.label ? "#5cc4ee" : "#ffd23e", stroke: "#0a3a57", strokeWidth: (item.label ? 6 : 3) * upp2 }} />
                {!inert && (item.label ? (
                  // solo dog circle: the breed name it wore before the round
                  // started, measured by the same fitter the pit circles use
                  (() => {
                    const lab = fitLabel(item.label, item.r, item.r * 0.34, labelFont);
                    const top = -((lab.lines.length - 1) * lab.fs * 1.02) / 2;
                    return (
                      <text x={0} y={0} dominantBaseline="central" style={{ fill: "#ffffff", fontFamily: "var(--font-display), system-ui, sans-serif", fontSize: `${lab.fs}px`, pointerEvents: "none", userSelect: "none" }}>
                        {lab.lines.map((ln, li) => (
                          <tspan key={li} x={0} y={top + li * lab.fs * 1.02}>{ln}</tspan>
                        ))}
                      </text>
                    );
                  })()
                ) : (
                  <text x={0} y={0} dominantBaseline="central" style={{ fill: "#0a3a57", fontFamily: "Montserrat, var(--font-body), system-ui, sans-serif", fontWeight: 800, fontSize: `${item.r * 0.7}px`, pointerEvents: "none", userSelect: "none" }}>
                    {`${item.pct}%`}
                  </text>
                ))}
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
          {/* Toys: tennis ball and Union Jack. Same bodies as the main pit,
              drawn as SVG here because the mini pit has no canvas. A tap on the
              flag opens the Britain popup, the same one the main pit uses. */}
          <g ref={toysGRef} style={{ display: dockAside ? "inline" : "none" }}>
            {toyList.map((ty, i2) => {
              const pr = toyBodiesRef.current[i2];
              const v2 = viewRef.current;
              const kk2 = SIZE / v2[2];
              const dead = deadToys.has(i2);
              const half = ty.size / 2;
              return (
                <g key={i2} transform={pr ? `translate(${(pr.x - v2[0]) * kk2},${(pr.y - v2[1]) * kk2}) rotate(${pr.a * 57.2958})` : undefined}
                  style={{ display: dead ? "none" : undefined, cursor: "grab", pointerEvents: dead ? "none" : "auto", userSelect: "none" }}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => startDrag(e, toyBodiesRef.current[i2], ty.kind === "flag" ? () => { retireToy(TOY_FLAG_SEEN_KEY); setBritainOpen(true); } : undefined)}>
                  {ty.kind === "flag" ? (
                    <>
                      <clipPath id={`bt-toy-${i2}`}><circle cx={0} cy={0} r={half} /></clipPath>
                      <image href={ty.src} x={-half} y={-half} width={ty.size} height={ty.size}
                        clipPath={`url(#bt-toy-${i2})`} preserveAspectRatio="xMidYMid slice" />
                      <circle cx={0} cy={0} r={half} style={{ fill: "none", stroke: "#ffffff", strokeWidth: ty.size * 0.06 }} />
                    </>
                  ) : (
                    <image href={ty.src} x={-half} y={-ty.h / 2} width={ty.size} height={ty.h} />
                  )}
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
                    <text key={li} x={0} y={pl.lines.length > 1 ? (li === 0 ? -pl.rx * 0.6 : pl.rx * 0.6) : 0} dominantBaseline="central"
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
            const uSz = 84 * pitScale * 1.2 * upp; // main pit: BIG * 1.2
            const m = 16 * upp;
            const vbWr = aspect >= 1 ? SIZE * aspect : SIZE;
            const vbHr = aspect >= 1 ? SIZE : SIZE / aspect;
            const xMinR = aspect >= 1 ? -vbWr * shift : -vbWr / 2;
            const ub = uiBodiesRef.current;
            // The close X is always there, the single way out. The info square
            // belongs to learn and nowhere else: it is how you get the blue box
            // back once you have closed it. It stays out of the start screen and
            // out of play, where reading is not what you are doing.
            const kinds = (learning && hideCaption
              ? ["close", "desc"]
              : ["close"]) as readonly ("close" | "desc")[];
            const defs: { kind: "close" | "desc"; wx: number; wy: number; a: number }[] = kinds.map((kind, idx) => {
              const b = ub?.find((u) => u.kind === kind);
              return {
                kind,
                wx: b ? b.x : v[0] + (xMinR + vbWr - m - uSz / 2) / kk,
                wy: b ? b.y : v[1] + (-vbHr / 2 + m + uSz / 2 + idx * (uSz + 14 * upp)) / kk,
                a: b ? b.a : 0,
              };
            });
            const half = uSz / 2;
            const iconStroke = Math.max(4 * upp, uSz * 0.1); // main pit icon weight
            return defs.map((d) => (
              <g key={d.kind} ref={d.kind === "close" ? uiCloseRef : uiDescRef}
                role="button"
                aria-label={d.kind === "close" ? "Close the pit" : "Breed information"}
                transform={`translate(${(d.wx - v[0]) * kk},${(d.wy - v[1]) * kk}) rotate(${d.a * 57.2958})`}
                style={{
                  cursor: "pointer",
                  // the info square and the blue box are one on/off pair: while
                  // the box is open the square leaves the pit, and it drops back
                  // in the moment the box is closed
                  pointerEvents: d.kind === "desc" && (descGone || !hideCaption) ? "none" : "auto",
                  display: d.kind === "desc" && (descGone || !hideCaption) ? "none" : undefined,
                }}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => {
                  const b = uiBodiesRef.current?.find((u) => u.kind === d.kind);
                  const act = d.kind === "close" ? onPitClose : onToggleCaption;
                  startDrag(e, b && !b.fixed ? b : null, act);
                }}>
                <rect x={-half} y={-half} width={uSz} height={uSz} rx={uSz * 0.3}
                  style={{ fill: "var(--yellow, #ffd23e)", stroke: "var(--navy, #0a3a57)", strokeWidth: 5 * upp }} />
                {d.kind === "close" ? (
                  <g stroke="var(--navy, #0a3a57)" strokeWidth={iconStroke} strokeLinecap="round">
                    <line x1={-half * 0.34} y1={-half * 0.34} x2={half * 0.34} y2={half * 0.34} />
                    <line x1={half * 0.34} y1={-half * 0.34} x2={-half * 0.34} y2={half * 0.34} />
                  </g>
                ) : (
                  <g stroke="var(--navy, #0a3a57)" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round"
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

          {/* START: the pit hangs still until this is pressed. Screen-space
              sized like the other in-pit UI objects, centred over the stage,
              and hidden while the visitor is zoomed into a circle. */}
          {dockAside && gravity && entered && !started && !learning && focus.depth === 0 && (() => {
            const st = stageRef.current;
            const upp = st ? (aspect >= 1 ? SIZE : SIZE / Math.max(aspect, 0.01)) / Math.max(st.clientHeight, 1) : 1;
            // same size ramp as the GAME OVER / ROUND WON flash: clamp(3.4rem, 12vw, 8rem)
            const stW = st ? st.clientWidth : 390;
            // the words measure about 3.17x their font size across, so cap the
            // size to keep them inside the stage on a narrow phone
            const fs = Math.min(Math.min(Math.max(54.4, stW * 0.12), 128) * START_SCALE, (stW * 0.92) / 3.17);
            const vbWc = aspect >= 1 ? SIZE * aspect : SIZE;
            const vbHc = aspect >= 1 ? SIZE : SIZE / aspect;
            const xMinC = aspect >= 1 ? -vbWc * shift : -vbWc / 2;
            const m = 18 * upp; // side margin
            const hitW = fs * 5.2 * upp;
            const hitH = fs * 1.6 * upp;
            // LEARN sits right and high, START sits left and low. Both were
            // pulled toward the middle, which left roughly a third of the stage
            // empty beneath START. They now sit lower and use the room: START
            // near the foot of the pit, LEARN a little above centre.
            const words: { key: "learn" | "start"; label: string; x: number; y: number; anchor: "start" | "end" }[] = [
              { key: "learn", label: "LEARN", x: xMinC + vbWc - m, y: -vbHc * WORD_LEARN_Y, anchor: "end" },
              { key: "start", label: "PLAY", x: xMinC + m, y: vbHc * WORD_START_Y, anchor: "start" },
            ];
            return words.map((w) => (
              <g
                key={w.key}
                className={styles.startBtn}
                role="button"
                aria-label={w.key === "start" ? "Play" : "Learn about these breeds"}
                tabIndex={0}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => {
                  wordHoverRef.current = true;
                  setWordHover(w.key);
                  if (w.key === "learn") setLearnPeek(true);
                  else setStartPeek(true);
                }}
                onMouseLeave={() => {
                  wordHoverRef.current = false;
                  setWordHover((h) => (h === w.key ? null : h));
                  if (w.key === "learn") setLearnPeek(false);
                  else setStartPeek(false);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (w.key === "start") {
                    setLearnPeek(false);
                    setStartPeek(false);
                    setStarted(true);
                    runFallRef.current?.();
                    return;
                  }
                  // LEARN never arms the pit. The wash slides in and the blue box
                  // opens; on touch this doubles as the reveal, since there is no
                  // hover to preview it with.
                  setLearnPeek(false);
                  setLearning(true);
                  if (hideCaption) onToggleCaption?.();
                }}
              >
                {/* invisible hit area, so the tap target is not just the glyphs */}
                <rect
                  x={w.anchor === "end" ? w.x - hitW : w.x}
                  y={w.y - hitH / 2}
                  width={hitW}
                  height={hitH}
                  fill="transparent"
                />
                <text x={w.x} y={w.y} textAnchor={w.anchor} dominantBaseline="central"
                  style={{
                    fill: w.key === "learn" ? "var(--yellow, #ffd23e)" : "#003cff",
                    fontFamily: "var(--font-display), system-ui, sans-serif",
                    fontSize: `${fs * upp * (wordHover === w.key ? 1.08 : 1)}px`,
                    letterSpacing: `${2 * upp}px`,
                    filter:
                      wordHover === w.key
                        ? "drop-shadow(0 6px 26px rgba(0,0,0,0.85))"
                        : "drop-shadow(0 4px 40px rgba(0,0,0,0.6))",
                    transition: "font-size 160ms ease, filter 160ms ease",
                    pointerEvents: "none",
                    userSelect: "none",
                  }}>
                  {w.label}
                </text>
              </g>
            ));
          })()}
        </svg>
      </div>

      {/* Difficulty: start-screen only, down the left, 10 hardest at the top.
          The root-view gate is `focus.depth === 0`, not `focus === nodes[0]`:
          a re-pack hands back a new node array, so identity is briefly stale
          and the control would unmount mid-drag and drop the pointer capture.
          Hand-rolled rather than an <input type="range"> so the vertical
          orientation does not depend on writing-mode support, which only landed
          in Safari 17.4, and so the thumb can carry the pit's own yellow square
          look. Mobile only: the fill has no effect on the desktop layout. */}
      {dockAside && gravity && isMobile && entered && !started && !learning && focus.depth === 0 && (
        <div
          className={styles.diff}
          style={(() => {
            // The track runs from just under the top edge down to the cap of the
            // S in START, so it uses the full height rather than a guessed 52%.
            // START's glyph top is worked out with the same numbers the word
            // itself uses, so the two stay together if either is retuned.
            const st = stageRef.current;
            const stW = st ? st.clientWidth : 390;
            const fs = Math.min(Math.min(Math.max(54.4, stW * 0.12), 128) * START_SCALE, (stW * 0.92) / 3.17);
            const vbHc = aspect >= 1 ? SIZE : SIZE / aspect;
            const topFrac = 0.045; // plus a 100px nudge below, applied in css units
            // 1.24 is the glyph half-height as a multiple of fs/vbHc, measured
            // off the rendered word rather than assumed: Luckiest Guy at this
            // scale sits taller in its box than a nominal 0.62 would suggest.
            const startTopFrac = 0.5 + WORD_START_Y - (fs / vbHc) * 1.24;
            // nudged 20px down, and the track shortens by the same so its foot
            // stays on the cap of the P
            return {
              top: `calc(${topFrac * 100}% + 100px)`,
              height: `calc(${Math.max(18, (startTopFrac - topFrac) * 100)}% - 100px)`,
            };
          })()}
        >
          <div
            ref={diffRef}
            className={styles.diffTrack}
            role="slider"
            tabIndex={0}
            aria-label="Difficulty"
            aria-valuemin={0}
            aria-valuemax={10}
            aria-valuenow={level}
            onPointerDown={(e) => {
              e.stopPropagation();
              (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
              diffDragRef.current = true;
              setLevelFromY(e.clientY);
            }}
            onPointerMove={(e) => {
              if (!diffDragRef.current) return;
              setLevelFromY(e.clientY);
            }}
            onPointerUp={(e) => {
              diffDragRef.current = false;
              try { (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId); } catch { /* already gone */ }
            }}
            onPointerCancel={() => { diffDragRef.current = false; }}
            onKeyDown={(e) => {
              const step = e.key === "ArrowUp" || e.key === "ArrowRight" ? 1 : e.key === "ArrowDown" || e.key === "ArrowLeft" ? -1 : 0;
              if (!step) return;
              e.preventDefault();
              applyLevel(levelRef.current + step);
            }}
          >
            <div className={styles.diffThumb} style={{ bottom: `${level * 10}%` }} />
          </div>
        </div>
      )}

      {/* The level background. It waits off the bottom-left, tilted, and slides
          up into place on START, borrowing the wash's motion. It sits at
          z-index 0, below the stage at 1, so the circles, labels and in-pit
          buttons stay on top of it and nothing is tinted or blended. */}
      {dockAside && gravity && levelTheme && (
        <div
          aria-hidden="true"
          className={`${styles.level}${learning && !started ? " " + styles.levelSlow : ""}`}
          style={{ clipPath: seamClip(started || (learning && playPeek) ? -SEAM_OFF() : startPeek ? 0 : SEAM_OFF()) }}
        >
          <div
            className={styles.levelSky}
            style={{ background: `linear-gradient(${levelTheme.sky[0]}, ${levelTheme.sky[1]})` }}
          />
          <img className={styles.levelBg} src={levelTheme.bg} alt="" draggable={false} />
          <img
            className={styles.levelFloor}
            src={levelTheme.floor}
            alt=""
            draggable={false}
            style={{ bottom: `${floorArtBottomPx()}px` }}
          />
        </div>
      )}

      {/* the tiled icon rides under the pink, appearing with it */}
      {dockAside && gravity && (
        <div
          aria-hidden="true"
          // learn only, never the hover preview: on the start screen the peek is a
          // glimpse of the pink, and the artwork underneath it made the two
          // overlays read as one busy thing
          className={`${styles.learnPattern}${!started && learning ? " " + styles.learnPatternOn : ""}`}
        />
      )}

      {dockAside && gravity && (
        <div
          aria-hidden="true"
          className={`${styles.learnWash}${!started && learning ? " " + styles.learnWashOn : !started && learnPeek ? " " + styles.learnWashPeek : ""}`}
        />
      )}
      {/* Big PLAY in the bottom-left of the learn area: jump straight from
          reading into the round. */}
      {dockAside && gravity && learning && (
        <button
          type="button"
          className={styles.learnPlay}
          onMouseEnter={() => setPlayPeek(true)}
          onMouseLeave={() => setPlayPeek(false)}
          onClick={() => {
            setLearnPeek(false);
            setStartPeek(false);
            setPlayPeek(false);
            setLearning(false);
            setStarted(true);
            runFallRef.current?.();
          }}
          aria-label="Play"
        >
          PLAY
        </button>
      )}
      {britainOpen && (
        <BritainMessage
          onDismiss={() => {
            setBritainOpen(false);
            // the tick poofs the flag, exactly as it does in the main pit, and
            // a flag whose message has been read does not come back next round
            retireToy(TOY_FLAG_SEEN_KEY);
            if (flagIdxRef.current !== null) killToyRef.current?.(flagIdxRef.current);
          }}
        />
      )}
      {/* A dog with no ancestors of its own gets the synthetic child seen in the
          tree prop below: the same dog drawn a second time, purely so the layer
          has something to reveal. Drawing that as a node with a connector says
          the dog descends from itself. soloLeaf tells the layer to skip the node
          entirely and reveal straight out of the big circle instead. */}
      {learnNode && learnCard && (
        <LineageMap
          breed={learnCard}
          tree={
            learnNode.data.children && learnNode.data.children.length > 0
              ? learnNode.data
              : { ...learnNode.data, children: [{ ...learnNode.data, children: undefined }] }
          }
          circular
          soloLeaf={!(learnNode.data.children && learnNode.data.children.length > 0)}
          rootRadius={learnCard.r}
          currentScore={0}
          onScore={onScore}
          onRemove={(name) => {
            // learnt: the circle leaves the pit for good
            if (learnNode && name === learnNode.data.name) {
              removedNodesRef.current.add(learnNode);
              const owned = pitBodiesRef.current?.owned;
              if (owned && [...owned].every((n) => removedNodesRef.current.has(n))) {
                const fb = pitBodiesRef.current?.find(learnNode);
                window.setTimeout(() => {
                  const total = chainRef.current ? chainRef.current(fb?.x ?? 0, fb?.y ?? 0) : 0;
                  window.setTimeout(() => onRoundWon?.(), total + 420); // flash lands after the chain
                }, 700);
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
            // A solo dog leaves a full-size blank circle wearing its breed name.
            // The layer sends the position because only the layer knows its pan,
            // and without that it lands where the old node centre used to be
            // rather than where the dog actually was. Twelve hits rather than a
            // badge's twenty, since a circle that size is struck far more often.
            if (data.big) {
              spawnBadgeRef.current?.(data.big.x, data.big.y, 0, 0, {
                r: data.big.r,
                label: data.big.name,
                charges: 12,
              });
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
      <div
        ref={asideRef}
        className={`${styles.aside}${dockAside ? " " + styles.asideDocked : ""}`}
        style={{ position: "relative", display: hideCaption ? "none" : undefined }}
        onPointerDown={dockAside ? asideDown : undefined}
        onPointerMove={dockAside ? asideMove : undefined}
        onPointerUp={dockAside ? asideUp : undefined}
        onPointerCancel={dockAside ? asideUp : undefined}
      >
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

        <div className={styles.caption} style={{ position: "relative", background: boxAlt ? "#09344e" : "#093049" }}>
          {onCaptionClose && (
            <button type="button" onClick={onCaptionClose} aria-label="Close description" className={styles.captionClose}>
              <svg viewBox="0 0 32 32" aria-hidden="true" style={{ width: 14, height: 14 }}>
                <line x1="7" y1="7" x2="25" y2="25" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                <line x1="25" y1="7" x2="7" y2="25" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </button>
          )}
          {/* Mini pit only: the dog whose tree is open, as a round portrait at the
              head of the box, with its name beside it. The chum page keeps its
              text-only caption. */}
          {dockAside && (rootImage ?? nodes[0].data.img) && (
            <div className={styles.cHead}>
              <span className={styles.cPortraitWrap}>
                <img
                  className={styles.cPortrait}
                  src={bust((rootImage ?? nodes[0].data.img) as string)}
                  alt={nodes[0].data.name}
                  draggable={false}
                />
                {rootTag && (
                  <span
                    className={styles.cStatus}
                    style={{ background: TAG_STYLE[rootTag].bg }}
                    title={STATUS_LABEL[rootTag]}
                    aria-label={STATUS_LABEL[rootTag]}
                  />
                )}
              </span>
              <span className={styles.cHeadText}>
                <span className={styles.cHeadName}>{nodes[0].data.name}</span>
                {/* The relation line sits directly under the level dog's name (the
                    card title), naming the link to the selected circle. Absent at
                    root, since then there is nothing selected to relate to. */}
                {(ancestryFor || shown !== nodes[0]) && (
                  <span className={styles.cRelated}>is related to:</span>
                )}
              </span>
            </div>
          )}
          <span className={styles.cName}>{ancestryFor ? ancestryFor.name : shown.data.name}</span>
          {!ancestryFor && shownShare !== null && shown.parent && !learning && (
            <span className={styles.cShare}>
              {shownShare}% of {shown.parent.data.name}
            </span>
          )}
          <p className={styles.cNote}>
            {ancestryFor ? ancestryFor.note : breedInfo[shown.data.name] || (shown.depth === 0 && rootNote ? rootNote : shown.data.note)}
            {/* the mini pit drops the "keep digging" prompt: in LEARN mode the
                circles are the whole point, so the nudge is noise */}
            {!dockAside && shown.children ? " Tap a circle inside to keep digging." : ""}
          </p>
          {/* The share pill from the main pit, reproduced below the write-up:
              the breed's share of this whole dog, its share in the role it sits
              in, and the same best-guess caveat. Only when a circle is picked. */}
          {!ancestryFor && dockAside && shown.parent && shownNorm !== null && (
            <div className={styles.cBreak}>
              <div className={styles.cBreakBig}>{shownNorm < 1 ? "<1%" : `${shownNorm}%`} of this dog</div>
              <div className={styles.cBreakRow}>As {genLabel(shown.depth)}: {shownShare === null ? "" : shownShare < 1 ? "<1%" : `${shownShare}%`}</div>
              <div className={styles.cBreakRow}>Share of this dog: {shownNorm < 1 ? "<1%" : `${shownNorm}%`}</div>
              <div className={styles.cBreakTitle}>Our best guess, not hard science.</div>
              <div className={styles.cBreakNote}>These figures come from history and old breeding records, our viewpoint, not proven fact. (Though DNA reading can now trace bloodlines back with real precision, even reviving lost breeds.)</div>
            </div>
          )}
          {/* Chum picked: how much of that pack dog traces to the level circle
              currently shown, from its own ancestry breakdown. */}
          {ancestryFor && dockAside && shown !== nodes[0] && (() => {
            const share = ancestorShareOf(ancestryFor.name, shown.data.name);
            return share !== null ? (
              <div className={styles.cBreak}>
                <div className={styles.cBreakBig}>{ancestryFor.name} is {share < 1 ? "<1%" : `${share}%`} {shown.data.name}</div>
                <div className={styles.cBreakTitle}>Our best guess, not hard science.</div>
                <div className={styles.cBreakNote}>These figures come from history and old breeding records, our viewpoint, not proven fact. (Though DNA reading can now trace bloodlines back with real precision, even reviving lost breeds.)</div>
              </div>
            ) : null;
          })()}
          {/* Related pack dogs, part of the box: they open and close with it
              and ride along when it is dragged. The 54-pack breeds that descend
              from this level's ancestors, as square cards down one side. */}
          {dockAside && !hideCaption && renderRail.length > 0 && (
            <div
              className={`${styles.relRail} ${railSide === "left" ? styles.relRailLeft : styles.relRailRight}`}
              style={{ gridTemplateRows: `repeat(${renderRail.length > 9 ? Math.ceil(renderRail.length / 2) : renderRail.length}, auto)` }}
              aria-label="Pack dogs from this lineage"
            >
              {renderRail.map((r, i) => (
                <button
                  key={r.slug}
                  type="button"
                  className={`${styles.relCard}${r.leaving ? " " + styles.relCardLeaving : ""}`}
                  style={{ animationDelay: `${i * 55}ms` }}
                  aria-pressed={ancestryFor?.slug === r.slug}
                  onClick={() => { if (ancestryFor?.slug === r.slug) { setAncestryFor(null); return; } if (!ancestryFor) { setAncHidden(true); setTrainHidden(true); setTempHidden(true); } setAncestryFor({ name: r.name, slug: r.slug, note: r.note, image: r.image }); }}
                  title={r.name}
                  aria-label={`View ${r.name}`}
                >
                  <img src={bust(r.image)} alt="" draggable={false} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {dockAside && ancestryFor && !ancHidden && ancestryRows.length > 0 && (
        <LearnDragCard
          className={styles.ancCard}
          style={ancPos ? { left: ancPos.left, top: ancPos.top, width: ancPos.width, right: "auto", bottom: "auto" } : undefined}
          ariaLabel={`Ancestry of ${ancestryFor.name}`}
          icon={ICONS.ancestry}
          title={ancestryFor.name}
          titleWhite
          onClose={() => setAncHidden(true)}
          closeLabel="Close ancestry"
        >
          {ancestryRows.map((a) => (
            <div key={a.name} className={styles.ancRow} title={a.name}>
              <span className={styles.ancName}>{a.name}</span>
              <span className={styles.ancBarWrap}>
                <span className={styles.ancBar} style={{ width: `${a.pct}%` }} />
              </span>
              <span className={styles.ancPct}>{a.pct}%</span>
            </div>
          ))}
        </LearnDragCard>
      )}
      {dockAside && ancestryFor && !trainHidden && trainingDifficulty[ancestryFor.slug] && (
        <LearnDragCard
          className={styles.trainCard}
          style={trainPos ? { left: trainPos.left, top: trainPos.top, right: "auto", bottom: "auto" } : undefined}
          ariaLabel={`Training for ${ancestryFor.name}`}
          icon={ICONS.training}
          title={<>Training <span className={styles.cardTitleName}>{ancestryFor.name}</span></>}
          onClose={() => setTrainHidden(true)}
          closeLabel="Close training"
        >
          <TrainingCard data={trainingDifficulty[ancestryFor.slug]} compact />
        </LearnDragCard>
      )}
      {dockAside && ancestryFor && !tempHidden && chumTraits && (
        <LearnDragCard
          className={styles.tempCard}
          style={tempPos ? { left: tempPos.left, top: tempPos.top, width: tempPos.width, right: "auto", bottom: "auto" } : undefined}
          ariaLabel={`Temperament of ${ancestryFor.name}`}
          icon={ICONS.infoBox}
          title={<>Temperament <span className={styles.cardTitleName}>{ancestryFor.name}</span></>}
          onClose={() => setTempHidden(true)}
          closeLabel="Close temperament"
        >
          <TemperamentBody key={ancestryFor.slug} pros={chumTraits.pros ?? []} cons={chumTraits.cons ?? []} />
        </LearnDragCard>
      )}
      {dockAside && ancestryFor && (ancHidden || trainHidden || tempHidden) && (
        <div className={styles.learnDock}>
          {ancHidden && ancestryRows.length > 0 && (
            <button type="button" className={styles.learnDockBtn} onClick={() => { setAncPos(cardSpot(0)); setAncHidden(false); }} aria-label="Reopen ancestry" title="Ancestry">
              <span className={styles.learnDockIcon}>{ICONS.ancestry}</span>
            </button>
          )}
          {trainHidden && trainingDifficulty[ancestryFor.slug] && (
            <button type="button" className={styles.learnDockBtn} onClick={() => { setTrainPos(cardSpot(1)); setTrainHidden(false); }} aria-label="Reopen training" title="Training">
              <span className={styles.learnDockIcon}>{ICONS.training}</span>
            </button>
          )}
          {tempHidden && chumTraits && (
            <button type="button" className={styles.learnDockBtn} onClick={() => { setTempPos(cardSpot(2)); setTempHidden(false); }} aria-label="Reopen temperament" title="Temperament">
              <span className={styles.learnDockIcon}>{ICONS.infoBox}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
