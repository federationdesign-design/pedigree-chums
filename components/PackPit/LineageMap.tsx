"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getLineage, type LineageNode } from "../../data/lineage";
import { bust } from "../../data/imgVersion";
import { ukBreeds } from "../../data/uk-breeds";
import { breeds } from "../../data/breeds";
import { breedInfo } from "../../data/breedInfo";
import { splitName } from "./splitName";
import styles from "./LineageMap.module.css";
import { fireConfetti } from "../../lib/confetti";
import TileZoom from "../TileZoom/TileZoom";

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
  // Mini pit only. True when this node overlaps its parent, which means there
  // is no daylight between them and therefore no line worth drawing.
  _tucked?: boolean;
  _dir: number; // outward direction this node sits at, so its own children fan away
};

// Collect the ids of every node shallower than `depth`, so seeding the `open`
// set with them reveals the tree down to `depth` levels. A node renders its
// children only when its id is in `open` (see the layout walk), so opening every
// node above the target depth is exactly a depth-first pre-expansion, using the
// pit's own mechanism. Added 2026-08-22 for /chums2 (initialDepth prop).
function openIdsToDepth(node: Node | null, depth: number): Set<string> {
  if (!node || depth < 1) return new Set(["0"]);
  const s = new Set<string>();
  const walk = (n: Node, d: number) => {
    if (d >= depth) return;
    if (n._id) s.add(n._id);
    (n.children as Node[] | undefined)?.forEach((c) => walk(c, d + 1));
  };
  walk(node, 0);
  return s.size ? s : new Set(["0"]);
}

// Single child on the first ring of the circular layer: angle from horizontal,
// and which way it leans (1 right, -1 left). Two numbers, nothing else uses them.
const SOLO_DEG = 33;
const SOLO_SIDE = 1;
// How far inside the screen edge the walls sit, in px. 0 puts them on the glass,
// so the node may sit flush against the very edge and still be fully visible.
const WALL_PAD = 0;
// half-size of the dog card at the centre of the fan
const ROOT = 58;
const INSTR_NAMES = new Set(["Deal the cards","Head outside","Spot real dogs","Match to your chum","Find more chums","Most chums wins"]);
// Rarity band across the bottom of a lifted circle. bg is the band, fg the text.
// Dataset-wide rarity bands (fewest trees = rarest). Black carries the two light
// bands (yellow COMMON, green UNCOMMON); white the two dark ones (purple EXTREMELY
// RARE, orange RARE). White on the orange band is a deliberate call: its contrast
// is low but kept on request, and the label is large Luckiest Guy.
const RARITY_BAND: Record<"extremelyRare" | "rare" | "uncommon" | "common", { bg: string; fg: string; label: string }> = {
  extremelyRare: { bg: "#4d2e91", fg: "#ffffff", label: "EXTREMELY RARE" }, // purple
  rare:          { bg: "#f47421", fg: "#ffffff", label: "RARE" },           // orange
  uncommon:      { bg: "#5dbf86", fg: "#000000", label: "UNCOMMON" },       // green
  common:        { bg: "#fcee23", fg: "#000000", label: "COMMON" },         // yellow
};
// How long the rarity ring takes to draw itself on around the lifted circle, and
// how long it waits first. The lift's own fade is 0.2s, so the draw holds back
// that long and only then travels, letting the card arrive before the ring
// sweeps. Slow enough to watch it travel round, not a flash. Dial both here.
const RARITY_DRAW = "0.9s";
const RARITY_DRAW_DELAY = "0.2s";
// The rarity band slides up from below the circle to arrive as the ring closes.
// Ring closes at RARITY_DRAW_DELAY + RARITY_DRAW = 0.2 + 0.9 = 1.1s, so the 0.45s
// band waits 0.65s and the two finish together. If you re-dial the ring, move
// BAND_SLIDE_DELAY with it (delay = ring close - BAND_SLIDE_DUR) so they still
// land as one.
const BAND_SLIDE_DUR = "0.45s";
const BAND_SLIDE_DELAY = "0.65s";
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
// The coloured rarity band's tilt (degrees), shared by the dog name above it so
// the two sit on one axis. One dial: change it here and both rotate together.
const RARITY_TILT = -26;

/* SOLO DOGS SHOW THEIR NAME, NOT THEIR PICTURE.

   A dog with no ancestors of its own is handed a synthetic child by BreedTree:
   itself, copied, purely so this layer has something to reveal. That meant the
   card popping out of the big circle was the same photo in the same coloured
   ring, only smaller, which said nothing. It is now the dog's NAME, drawn the
   way the pit draws a word: Luckiest Guy in white over a navy halo.

   This is not a rare case. Of the 221 circles that drop into the pit across all
   96 levels, 108 are solo. Twenty-seven levels are entirely solo.

   ONE WORD PER LINE, by owner ruling, and the measurement agrees. The circle
   labels in BreedTree balance their words across up to four lines and keep
   whichever allows the biggest type. Inside a CARD that loses, because a card is
   a circle 67px across on a phone and a narrow line fits a circle better than a
   wide one even when there are more of them. "Poodle and Barbet water dogs"
   reads at 11.1px broken per word against 8.9px balanced.

   Across all 63 distinct solo names at 67px: worst 8.3px, median 11.8px. */
const SOLO_LINE_H = 0.95;
/* THE WORD IS NOT IN THE CARD. THE WORD IS THE CARD.

   First attempt fitted the name inside the round card, which meant a 67px
   circle on a phone and 8 to 12px type. Steve's Photoshop comparison settled it
   in one message: no small circle at all, and the text as tall as that circle
   was, free to run as wide as it needs.

   Measured off his mockup against the current screen:
     the small card ring was     198 x 204px
     his text block is           304 x 226px
   So the block is 111% of the card's HEIGHT and 154% of its width. Height is
   therefore the rule and width is whatever falls out, which is what he said.

   Height is the whole budget, so the type is simply the budget divided by the
   line count. One word per line, so a six word name gets half the type a three
   word one does. That is the cost of breaking per word and it is his call. */
const SOLO_TILT_DEG = 15;   // leans DOWN to the right, the opposite way to the circle labels
function soloWordFit(name: string, H: number): { lines: string[]; fs: number } {
  const lines = name.split(/\s+/).filter(Boolean);
  return { lines, fs: H / (lines.length * SOLO_LINE_H) };
}

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
// The size of a percentage circle, and therefore of the bomb that replaces one,
// since a main pit bomb IS a percentage circle and differs only in how it is
// drawn. Exported so the mini pit uses this exact curve rather than a copy that
// can drift. Nothing about the behaviour changes.
// Mini pit only. The nodes were drawn at the main pit's size, which reads too
// large once they are tucked onto the big circle rather than strung out on
// lines, and larger than the chip the same dog drops as. One dial, applied
// through nodeR below so the layout, the drawing, the card offsets and the
// scatter all agree. 1 is the main pit's size.
const PIT_NODE_SCALE = 0.78;
export function radius(share: number) {
  return Math.max(21, 5 * Math.sqrt(share));
}
// The node name pill's drawn width, matching the pit pill exactly (7.4 per char,
// +14 padding, +10 for a second line, floored at 44). One definition so the
// placement that spaces siblings on it and the render that draws it cannot drift.
// Takes the already-split lines so the caller pays for splitName once.
function nodePillWidth(lines: string[]): number {
  return Math.max(44, Math.max(...lines.map((l) => l.length)) * 7.4 + 14 + (lines.length > 1 ? 10 : 0));
}

/* ONE RING RULE, FOR THE PIT AND FOR THE LAYER A DOG IS LIFTED ONTO.

   There were two, and they disagreed. In the pit a ring has always been a
   FRACTION of its own circle's radius, so it scales with the difficulty slider,
   the zoom and everything else. On this layer every ring was a flat pixel
   count: 5 for a child, 11 for the big card, neither reading the radius.

   Audited on a 390px phone. At difficulty 5 a small circle's ring went from 9%
   of its radius in the pit to 20% once lifted, more than doubling. A depth-2
   child went the other way, from 19% to 17% while its radius nearly halved, so
   the ring came out at 0.48x. Same tap, opposite results, and the 31% viewport
   cap made the big card's case worse by shrinking the circle while the 11px
   stayed put.

   The table below is the pit's own, moved here because BreedTree already
   imports from this file and the reverse would be a circular import. Depth is
   the PIT's depth: this layer's root is the pit's depth-1 dog, so a node here
   is one deeper than it looks.

   ONE DELIBERATE DIFFERENCE. The pit tapers this table by up to a tenth above
   difficulty 5, because at that size the stroke is what reads as heavy. That
   taper is not applied here: it would mean threading the difficulty through as
   a prop for a change of at most 10%, only at the top of the slider. If it ever
   matters, that is the one thing to add.

   HIERARCHY RULE, Steve's decision. A ring may never be thicker than the ring
   of the circle it sits inside, so this table must only ever descend. It used
   to jump 0.09 -> 0.19 at depth 2: that 0.19 existed so a nested circle did not
   read thin beside the yellow percentage chip next to it, which wears about
   0.19 of its own radius. The hierarchy rule wins over that chip-matching, so
   depth 2 and below are now thinner than depth 1 and thinner than each other. A
   nested circle now reads lighter than the chip beside it, which is the
   accepted cost. The fallback stays 0.145 on purpose: ringFrac(0) returns it,
   and that IS the root circle's own ring in BreedTree (depth 0, the biggest
   circle, heaviest line), which this change must not touch. So do not read the
   fallback as a table entry. It is the CLAMP in strokeWidthFor and in the draw
   below, not the table, that guarantees no ring is ever thicker than its
   parent's at any depth, whatever the table or the fallback say. */
export const RING_FRAC = [0.09, 0.082, 0.075, 0.07, 0.065];
export function ringFrac(pitDepth: number): number {
  return RING_FRAC[pitDepth - 1] ?? 0.145;
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
  soloLeaf = false,
  rootRadius,
  ringColor,
  rarityTier,
  strongBg = false,
  initialDepth,
  bounded = false,
  hideLeafImages = false,
  onNodeClick,
}: {
  breed: { name: string; image: string; x: number; y: number; angle: number };
  tree?: LineageNode;
  circular?: boolean;
  // A dog with no ancestors is handed a synthetic child by BreedTree: itself,
  // drawn again, so this layer has something to reveal. Rendering that as a node
  // on a connector claims the dog descends from itself, so when this is set the
  // node and its rod are skipped and the reveal comes straight out of the big
  // circle. Placement then finishes the round on its own, with no green button.
  soloLeaf?: boolean;
  rootRadius?: number;
  // Mini pit only: the ring the lifted dog wore in the pit, carried through so
  // the circle looks like the one just picked up. Without it the card keeps its
  // own yellow stroke over a blue fill, which reads as two thin rings.
  ringColor?: string;
  // Mini pit only: the rarity tier of the lifted dog, drawn as a coloured band
  // across the bottom of the circle. Set for every lifted dog (common included).
  rarityTier?: "extremelyRare" | "rare" | "uncommon" | "common";
  // The heavier wash. It used to ride on `circular`, which was fine while the
  // only caller wanting it also wanted round cards. The chum family tree wants
  // the main pit's rectangular card AND the mini pit's darker background, so the
  // two are separated. The main pit passes neither and is unchanged.
  strongBg?: boolean;
  onClose: () => void;
  onRemove?: (name: string) => void;
  onScatter?: (data: {
    /* `green` says this node had been placed in a frame, so it was drawn green
       rather than yellow. Carried across so the chip lands in the pit wearing
       the colour it wore a moment before. */
    circles: { x: number; y: number; r: number; share: number; name: string; green?: boolean }[];
    rods: { x1: number; y1: number; x2: number; y2: number; lit: boolean }[];
    pills: { x: number; y: number; w: number; name: string }[];
    big?: { x: number; y: number; r: number; name: string };
  }) => void;
  onScore?: (v: number) => void;
  currentScore?: number;
  // Pre-expand the tree to this many levels on mount, via the same `open` set
  // the pit already uses (no second expansion system). Default undefined leaves
  // the pit behaviour unchanged (open = just the root). Added 2026-08-22 for the
  // /chums2 family tree, which wants depth 2 at rest (brief 5.8).
  initialDepth?: number;
  // bounded (added 2026-08-23): render inline inside a positioned page region
  // instead of the position:fixed inset:0 viewport overlay. Default false keeps
  // the pit lift and every game path byte-identical. When true: .overlay and the
  // SVG become position:absolute, `vp` is measured from the container (not the
  // window), and the four inline position:fixed HTML blocks become absolute, so
  // the whole tree is container-relative. The host passes breed.x/y as
  // container-local coords and gives the region position:relative + a size.
  bounded?: boolean;
  // hideLeafImages (added 2026-08-23): suppress revealing breed IMAGE tiles when
  // a node is clicked; the deepest nodes stay labelled % circles. Expansion,
  // scoring and the seen/blue recolour are untouched. Used by /chums2 (the
  // ancestor pack already shows those images). Default false = pit unchanged.
  hideLeafImages?: boolean;
  // onNodeClick (added 2026-08-23): bounded only. Fires with the clicked node's
  // breed name instead of running the game tap (follow/score/pick), so the host
  // (/chums2) can open THAT ancestor's pack popouts, matched by name. Ignored
  // when bounded is false, so the pit is unchanged.
  onNodeClick?: (name: string) => void;
}) {
  // TEMP rarity-band instrumentation: does the tier prop reach the lifted card?
  if (typeof window !== "undefined" && circular) console.log("[rarity-band] LineageMap boundary:", { breed: breed?.name, rarityTier, soloLeaf });
  // Read the real viewport on the FIRST render, not a placeholder. This card is
  // sized as a share of vp.w, so a stale default would size the first painted
  // frame for the wrong screen: at the old { w: 1280 } a 390px phone drew the
  // card near full width, then snapped down once the effect measured. This
  // component only ever mounts client-side (gated behind activeBreed), so window
  // exists here; the 1280 fallback is for a server render that never happens.
  // In bounded mode `vp` is the container size (measured below); seed with a
  // reasonable box until the layout effect measures. Otherwise the window.
  const overlayRef = useRef<HTMLDivElement>(null);
  const [vp, setVp] = useState(() =>
    bounded
      ? { w: 900, h: 520 }
      : {
          w: typeof window !== "undefined" ? window.innerWidth : 1280,
          h: typeof window !== "undefined" ? window.innerHeight : 800,
        }
  );

  /* THE SIZE OF THE DOG LIFTED OUT OF THE PIT.

     BreedTree measures the circle in real screen pixels at the moment it is
     tapped and hands that over as rootRadius. There is no growth on top: the
     card is the circle, at the size it was. The only thing added is the ring,
     11px drawn centred, so the object you see is 5.5px wider than the radius.

     The old ceiling was a flat 220px and that was the whole problem. An
     absolute pixel figure cannot serve screens that differ by four times.
     Audited across every level, three difficulty settings, phone and desktop,
     1326 lifts in all: 68% hit that ceiling, and on tablet and desktop it was
     every single one. The raw radius reaches 658px at the default difficulty on
     a 1440 desktop and 1145px at the hardest, so everything large was pinned to
     the same 220 and came out identical. Meanwhile the SAME 220 was 94% of a
     390px phone at the default difficulty and overflowed it at 116% by the top
     of the slider.

     Now a share of the viewport instead, measured as the DIAMETER including the
     ring. One number cannot serve a phone: at the desktop share a 390px screen
     gave a 121px card, too small for the Learn button to sit on, so the share
     RAMPS with viewport width, easing from the phone value at 390 to the desktop
     value by 1440 and holding it above. A smooth interpolation, not a breakpoint.

     DESKTOP REDUCED 0.31 -> 0.21 (2026-08-12). The desktop lift read about a
     third too big: on desktop every dog clamps to this cap, so the cap IS the
     size, and 0.21 brings 1440 from 446px to 302px. The PHONE END IS DELIBERATELY
     HELD at 0.45 (176px at 390): on a phone the share cap sits BELOW the 250px
     readability floor, so the cap is the binding size and there is no floor to
     catch a smaller card. That is why the ramp is 0.21 + 0.24*(...) rather than
     one scaled number: the +0.24 keeps 390 at 0.45 while the base drops to 0.21.

     A 250px-wide floor now sits UNDER the min(rootRadius) cap, so tapping a
     small circle still lifts a usable card rather than a tiny one. The floor is
     a radius of 250 / (2 + frac) = 119.6, the 250 measured as the diameter
     including the ring, the same way the share is. It is itself capped by the
     share, so a phone lifts a small card up to its 176 maximum and no further,
     never past the viewport share. The old 40px floor is gone: it never bound
     once across the 1326-lift audit. */
  const LIFT_MAX_SHARE = 0.21 + 0.24 * (1 - Math.min(1, Math.max(0, (vp.w - 390) / 1050)));
  /* The ring is a share of the radius now, so it cannot be subtracted before the
     radius is known. Solved the other way instead: the object is 2R wide plus
     one ring, and the ring is R * frac, so the whole thing is R * (2 + frac).
     Divide the budget by that and the total still lands on 31% exactly. */
  const liftRingFrac = ringFrac(1);
  // Floor the tapped radius up to the 250-wide minimum, then cap by the share so
  // a narrow viewport never exceeds its own maximum card (176 at 390). Both the
  // floor and the share divide the same (2 + frac) width budget.
  const liftFloorR = 250 / (2 + liftRingFrac);
  const liftShareR = (vp.w * LIFT_MAX_SHARE) / (2 + liftRingFrac);
  const liftR = circular && rootRadius
    ? Math.min(liftShareR, Math.max(liftFloorR, rootRadius))
    : ROOT;
  const liftRingW = circular && ringColor ? liftR * liftRingFrac : 5;
  // The Learn/Complete button is a fixed 200x68. On a small card that swamps
  // the picture, so it scales WITH the card: width 1.8 * R (~151px on a 390
  // phone, tuned up from 1.4 by eye on the device), capped at
  // 200, and NO minimum, a small button on a small card being correct. The cap
  // means desktop sits at 200 (was 192 at the old 0.9 multiplier, an accepted
  // 8px). Applied as one scale() on the button group; the rim offset scales with
  // it so the button keeps the same overlap on the rim at any size.
  const learnBtnScale = circular ? Math.min(1, (1.8 * liftR) / 200) : 1;
  const [rootGone, setRootGone] = useState(false);
  // Confetti comes from the vendored lib/confetti (no external CDN script).
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
  // useLayoutEffect, not useEffect: any correction (a resize, or a belt-and-
  // braces re-measure) lands before the browser paints rather than a frame
  // after. With the lazy init above this is mostly redundant on mount, but it is
  // cheap insurance and safe here because the component never renders on the
  // server, so useLayoutEffect raises no SSR warning.
  useLayoutEffect(() => {
    if (bounded) {
      const el = overlayRef.current;
      if (!el) return;
      const measure = () => setVp({ w: el.clientWidth, h: el.clientHeight });
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }
    const f = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, [bounded]);

  const root = useMemo(() => {
    const t = tree ?? getLineage(breed.name);
    if (!t) return null;
    const r = JSON.parse(JSON.stringify(t)) as Node;
    // KEEP-CHILD COLLAPSE, RENDERER ONLY. expandNode leaves every grafted node
    // valueless (data/lineage.ts, `value: undefined`), so a single-child ancestor
    // is a redundant wrapper: its one child fills it completely and it only
    // restates that child. In 132 of 178 such wrappers the child IS the trail-
    // completing card (Earth Dog, Otterhound, Ancient Mastiff, Shepherd's Dog),
    // and in 53 trees it is the ONLY route to that card. So we draw the CHILD and
    // drop the wrapper. Keep-PARENT was rejected on the numbers: it hides those
    // cards, the whole point of the Tudor trail, and if it ever reached the data
    // it breaks the era count from 1 to 14. This is display only; getLineage and
    // the failure measurement are untouched. A CHAIN collapses all the way to the
    // card in one pass via the recursion below (Welsh Terrier: Old fell terriers
    // -> Old English Black and Tan Terrier -> Earth Dog draws straight to Earth
    // Dog). Do NOT move this into expandNode and do NOT switch it to keep-parent:
    // the intervening-stock argument does not survive the 132/178 and 53-tree count.
    const collapse = (n: Node): Node => {
      const kids = ((n.children as Node[] | undefined) ?? []).map(collapse);
      if (n.value === undefined && kids.length === 1) return kids[0]; // wrapper: keep the child
      return { ...n, children: kids };
    };
    if (r.children) r.children = (r.children as Node[]).map(collapse);
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

  // the open set is the single line currently being followed (root..node).
  // With initialDepth set, it is pre-seeded to that many levels instead (default
  // stays the root only, so the pit is unchanged). See openIdsToDepth.
  const [open, setOpen] = useState<Set<string>>(() => (initialDepth ? openIdsToDepth(root, initialDepth) : new Set(["0"])));
  useEffect(() => setOpen(initialDepth ? openIdsToDepth(root, initialDepth) : new Set(["0"])), [breed.name, initialDepth, root]);
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
  // 15% smaller on phones, and a further 5% in the mini pit, where five frames
  // have to sit across a screen that used to hold four. Done here rather than in
  // a second variable because CW drives the frames, the picture cards, the drop
  // targets and the corner adornments alike: shrinking only the grid would leave
  // the cards the wrong size for the holes they drop into.
  const CW = isMobile
    ? circular || strongBg
      // 5% down, then capped so five ALWAYS fit: 14px of margin each side and a
      // 6px gutter between. A 320 screen cannot hold five 60px frames at all, so
      // without this cap the last column simply falls off the right.
      ? Math.min(Math.round(CARD * 0.85 * 0.95), Math.floor((vp.w - 28 - 24) / 5))
      : Math.round(CARD * 0.85)
    : CARD;
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
  // Every node radius in this component goes through here, so the mini pit's
  // smaller nodes cannot get out of step between layout and drawing.
  const nodeR = (share: number) => radius(share) * (circular ? PIT_NODE_SCALE : 1);
  // The ring a node draws, HARD-CLAMPED so it is never thicker than the ring of
  // the circle it sits inside (the hierarchy rule). Recursive: each node caps to
  // its parent's already-clamped ring, so the cap holds all the way up the tree.
  // On this layer a child can be physically bigger than its parent, because a
  // radius is a share of leaves and not a nesting, so unlike the pit this
  // genuinely bites. The root's own ring is liftRingW, the real width of the big
  // card, so the rule is absolute at the root too rather than assumed away.
  const clampedRingW = (n: Node): number => {
    const p = n._parent;
    if (!p) return liftRingW;
    let pd = 1;
    for (let a: Node | null = p; a; a = a._parent) pd += 1;
    const raw = nodeR(Math.round((n._leaves / p._leaves) * 100)) * ringFrac(pd);
    return Math.min(raw, clampedRingW(p));
  };
  const [infoHover, setInfoHover] = useState<string | null>(null);
  const [pctHover, setPctHover] = useState<string | null>(null); // which card's % explainer box is open
  const pctTimer = useRef<number | null>(null); // closes the % box a beat after the cursor leaves /* pct-close */
  const pctClose = () => { if (pctTimer.current) window.clearTimeout(pctTimer.current); pctTimer.current = window.setTimeout(() => { setPctHover(null); pctTimer.current = null; }, 600); };
  const pctKeep = () => { if (pctTimer.current) { window.clearTimeout(pctTimer.current); pctTimer.current = null; } };
  useEffect(() => setPctHover(null), [breed.name]);
  const infoSeen = useRef<Set<string>>(new Set()); // cards whose info tooltip has already paid out its +2, so it pays once
  useEffect(() => setInfoHover(null), [breed.name]);
  // hold-to-magnify: which collected card is enlarged right now. The enlarged
  // image + its description panel, the drag offset and the 2s auto-close now
  // live in the shared TileZoom component (components/TileZoom/TileZoom.tsx),
  // rendered below; this file keeps only which card is open.
  const [zoomedId, setZoomedId] = useState<string | null>(null);
  useEffect(() => setZoomedId(null), [breed.name]);
  // closeAll: ensure only one overlay is open at a time
  const closeAll = () => { setInfoHover(null); setPctHover(null); setZoomedId(null); };
  const magnifyHold = (id: string) => { closeAll(); setZoomedId(id); setInfoHover(id); };

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
  // circles tapped at least once, recoloured blue. With initialDepth set, the
  // pre-expanded nodes (root + shallower levels) start "seen" so depth-1 renders
  // as the dark named nodes and only the depth-2 frontier stays yellow dashed
  // (matches the /chums2 concept). Pit unchanged (no initialDepth).
  const [seen, setSeen] = useState<Set<string>>(() => (initialDepth ? openIdsToDepth(root, initialDepth) : new Set()));
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
    // Bounded (display) mode has no ancestor-pack collection game, so no frames:
    // this removes the frame slots, the frames counter and the pack section
    // headings ("Alive and kicking" etc.), which are all gated on frameTotal > 0.
    if (bounded) return { chum: [], alive: [], extinct: [] };
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
  }, [root, bounded]);

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
  /* DRAG FOCUS. While a card is in hand the scenery steps out of the way so the
     only two things on screen are the card and the one box it belongs in: the
     family tree, the root chum card, the Learn and Collect buttons and every
     frame but the lit one all go to zero.

     The loose cards stay, by decision. They are the pile you are working
     through, so hiding them would hide the job.

     CHUM FAMILY TREE ONLY. Everything here shares one svg with the pit lift and
     the main pit, and neither of those was asked for. `strongBg` is set by the
     chum tree call site alone and `circular` by the pit lift, so the pair of
     them is the gate. Declared above rootCard because rootCard reads it. */
  const dragFocus = strongBg && !circular && dragImg != null;
  const DRAG_FADE = "opacity 0.12s ease-out";
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
    // MINI PIT: the whole tree rides 75px higher, card and nodes together.
    //
    // Moving the card alone would have broken it: the percentage nodes are laid
    // out around this point and tuck onto the card's rim, so shifting one without
    // the other separates them. Lifting the root lifts everything hung off it,
    // which also clears the Complete button off the bottom of the card.
    root._y = breed.y - (circular || strongBg ? 75 : 0);
    root._dir = -Math.PI / 2 + base;
    list.push(root);
    const walk = (n: Node, depth: number) => {
      const kids = open.has(n._id) && n.children && n.children.length ? (n.children as Node[]) : null;
      if (!kids) return;
      const cnt = kids.length;
      const spread = circular ? Math.PI * 0.42 : depth === 0 ? SPREAD1 : SPREADN;
      const dist = depth === 0 ? RING1 : (INSTR_NAMES.has(breed.name) ? RSTEP * 1.2 : RSTEP);
      // mini pit: the connector is aware of both circles' real sizes - the
      // child clears the parent's EDGE by 50px whatever size either circle is
      const rOf = (nd: Node): number => {
        const p = nd._parent;
        // Place the children around the radius the root is actually DRAWN at,
        // liftR, so a floored small card cannot bury its own ancestors and an
        // enlarged one cannot leave a gap. liftR already folds in the floor, the
        // share cap and the rootRadius, so the old min(220)/max(40) clamp of the
        // raw tapped radius is subsumed. (The mini pit uses dist, not this.)
        if (!p) return liftR;
        return nodeR(Math.round((nd._leaves / Math.max(1, p._leaves)) * 100));
      };
      let center = circular ? -Math.PI / 2 : depth === 0 ? -Math.PI / 2 + base : n._dir;
      // A lone child on the first ring has no fan spread to offset it, so it used
      // to sit dead vertical above the dog. Lean it out on the diagonal instead.
      // SOLO_DEG is measured from horizontal, the way the connector reads on
      // screen: 90 is the old vertical, 33 is the diagonal.
      if (circular && depth === 0 && cnt === 1) {
        const rad = (SOLO_DEG * Math.PI) / 180;
        center = SOLO_SIDE > 0 ? -rad : -(Math.PI - rad);
        // Walls down both sides of the layer. The node cannot pass them, so when
        // the diagonal would push it off the edge the arm swings up toward
        // vertical until the whole node, name pill included, clears the wall.
        const kid = kids[0];
        const reach = rOf(n) + rOf(kid) + 50;
        const half = Math.max(rOf(kid), (kid.name.length * 7.4 + 22) / 2);
        const vw = typeof window !== "undefined" ? window.innerWidth : 0;
        if (vw > 0) {
          const clears = (ang: number) => {
            const cx = n._x + Math.cos(ang) * reach;
            return cx - half >= WALL_PAD && cx + half <= vw - WALL_PAD;
          };
          const upright = -Math.PI / 2; // straight up
          const stepR = (2 * Math.PI) / 180;
          let a = center;
          for (let i = 0; i < 60 && !clears(a); i++) {
            if (Math.abs(a - upright) <= stepR) { a = upright; break; }
            a += a > upright ? -stepR : stepR; // swing toward vertical, never past it
          }
          center = a;
        }
      }
      if (cnt === 1 && depth > 0 && INSTR_NAMES.has(breed.name)) { center = n._dir + (Math.PI * 0.30); } // gentle curl for instructional
      else if (cnt === 1 && depth > 0) { const side = depth % 2 === 1 ? 1 : -1; center = n._dir + side * (Math.PI * 0.38); }
      // CLOCK FACE (the lift, 2+ children). Instead of a widening fan tucked onto
      // the parent's rim, each child sits on a FIXED clock slot in the top
      // semicircle, just OUTSIDE the parent's edge. Two things fall out of that:
      // no node ever sits under the card or its Learn button (every slot is at or
      // above the horizontal; 9 and 3 o'clock sit exactly on it and still clear
      // the button below), and no node overlaps the parent, so the card painted
      // on top can no longer cover a child. That overlap was the hover bug.
      //
      // shoulderD / NODE_POKE survive for the SINGLE-CHILD path only: one child
      // still springs from the rim and reads like the solo card, with no line.
      const kidR = Math.max(...kids.map((k) => rOf(k)), 1);
      const NODE_POKE = 18;
      const shoulderD = rOf(n) + kidR * 0.2 + NODE_POKE;
      const step = spread / Math.max(cnt, 2); // non-circular fan only
      const ringD = shoulderD;                // single-child radius
      // Slot angles are offsets from straight up (center). 2 and 3 children BOTH
      // use a no-zero split with the innermost pair at -36/+36: a 72deg gap centred
      // on the vertical, so no child spawns straight up under the pointer as the
      // parent opens. A slot at 0 (the old 3-child middle) dropped a fresh circle
      // onto the vertical approach and stole the hover, which is why the bug bit at
      // 3+. The -36/+36 pair clears the corridor by ~7 to 9px even on a node with
      // two large children (the old 2-child +/-30 left just 0.9px, luck not
      // clearance). 3's third child sits out at -72. 4 keeps the clock hours
      // 9/11/1/3; its +/-30 inner pair rides a longer radius and clears by ~10px.
      // Beyond 4 (never reached) they spread evenly, 9 to 3.
      const SLOT_OFF: Record<number, number[]> = {
        2: [-Math.PI / 5, Math.PI / 5],
        3: [-2 * Math.PI / 5, -Math.PI / 5, Math.PI / 5],
        4: [-Math.PI / 2, -Math.PI / 6, Math.PI / 6, Math.PI / 2],
      };
      const slots = SLOT_OFF[cnt] ??
        Array.from({ length: cnt }, (_, i) => -Math.PI / 2 + (i * Math.PI) / Math.max(cnt - 1, 1));
      kids.forEach((k, i) => {
        const clock = circular && cnt >= 2;
        const a = clock ? center + slots[i] : center + (i - (cnt - 1) / 2) * step;
        // clock: the node sits just outside the parent edge (NODE_POKE daylight),
        // so it never tucks under the card. Single child keeps the shoulder tuck;
        // the big pit keeps its own ring (dist).
        const d2 = clock ? rOf(n) + rOf(k) + NODE_POKE : circular ? ringD : dist;
        // Deliberate: every clock node is _tucked = false, so it always draws a
        // connector. Before, a line appeared only once the ring was pushed past
        // the edge; now there is always the NODE_POKE gap to justify one, so a
        // short line on every clock child is correct, not a side effect. The
        // single child can still tuck (no line), keeping its springs-from-rim look.
        if (circular) k._tucked = clock ? false : ringD <= rOf(n) + rOf(k);
        k._x = n._x + Math.cos(a) * d2;
        k._y = n._y + Math.sin(a) * d2;
        k._dir = a;
        list.push(k);
        walk(k, depth + 1);
      });
    };
    walk(root, 0);
    return list;
  }, [root, open, breed.x, breed.y, base]);

  // BOUNDED ONLY. The tree is laid out at pit scale (fixed RING1/RSTEP fanning up
  // 270deg), which the fullscreen pit has room for but a 1100x660 inline box does
  // not: the top of the fan runs off the container edge and clips the outer
  // depth-2 nodes. So instead of the 1:1 viewBox the pit uses, fit the viewBox to
  // the actual content bounds (every shown node, padded for its circle and name
  // pill) and let the SVG scale it to meet the box. Every depth-2 node is then on
  // screen on load. The pit path (bounded=false) is untouched.
  const fitBox = useMemo(() => {
    if (!bounded || shown.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of shown) {
      minX = Math.min(minX, n._x);
      minY = Math.min(minY, n._y);
      maxX = Math.max(maxX, n._x);
      maxY = Math.max(maxY, n._y);
    }
    const PAD = 120; // clears the largest node circle plus its name pill
    minX -= PAD; minY -= PAD; maxX += PAD; maxY += PAD;
    let w = maxX - minX, h = maxY - minY;
    // Grow the shorter axis to the container's aspect so meet-fit fills it and
    // centres the tree rather than leaving one axis heavily letterboxed.
    const aspect = vp.w / Math.max(1, vp.h);
    if (w / h < aspect) { const nw = h * aspect; minX -= (nw - w) / 2; w = nw; }
    else { const nh = w / aspect; minY -= (nh - h) / 2; h = nh; }
    return { x: minX, y: minY, w, h };
  }, [bounded, shown, vp.w, vp.h]);

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

  // long names wrap to a second line via the shared splitName (see ./splitName):
  // the pill grows in depth, the corner radius stays fixed so the shape holds.
  const tagLines = circular ? splitName(breed.name) : [breed.name];
  const tagW = Math.max(...tagLines.map((l) => l.length)) * 9.5 + 28 + (tagLines.length > 1 ? 14 : 0);
  const tagH = tagLines.length > 1 ? 60 : 32;
  // CHANGE 2, now the clock face: each node's pill sits just outside its node and
  // points STRAIGHT AWAY FROM CENTRE along the node's slot direction (_dir). The
  // old four-candidate scorer (card / nodes / pills / connectors / viewport) is
  // gone: with slots 60deg apart in the top semicircle a radial pill cannot reach
  // the card (it points away from it) and neighbours diverge instead of colliding.
  const pillPlacement = useMemo(() => {
    const place = new Map<string, { ox: number; oy: number }>();
    if (!circular) return place;
    const vw = typeof window !== "undefined" ? window.innerWidth : 0;
    const withPill = shown.filter((n) =>
      !!n._parent && !soloLeaf &&
      (!!(n.children && n.children.length) || !autoExposed.has(n._id)) &&
      n.name !== breed.name
    );
    const GAP = 4;
    for (const n of withPill) {
      const share = Math.round((n._leaves / (n._parent as Node)._leaves) * 100);
      const lines = splitName(n.name);
      const r = nodeR(share), w = nodePillWidth(lines), h = lines.length > 1 ? 40 : 22;
      // reach clears the node radius, the GAP, and the pill's own half-extent in
      // the slot direction, so the near edge lands GAP px off the node at any angle.
      const dir = n._dir;
      const reach = r + GAP + Math.abs(Math.cos(dir)) * (w / 2) + Math.abs(Math.sin(dir)) * (h / 2);
      let ox = Math.cos(dir) * reach;
      const oy = Math.sin(dir) * reach;
      // EDGE PROTECTION, and now the ONLY one: the wall clamp is deleted, so this
      // single nudge is all that keeps a pill on screen. It MOVES the pill sideways
      // (shifts ox), it never shortens the pill and never pulls the node off its
      // slot. The case that tests it is 3 o'clock on a 390 phone: a ~150px pill
      // pointing straight right slides left until its right edge clears the wall,
      // slipping back over its own node, readable. That is the old ruling, an
      // overlap you can read beats a pill you cannot see.
      if (vw > 0) {
        const pl = n._x + ox - w / 2, pr = n._x + ox + w / 2;
        if (pr > vw - WALL_PAD) ox -= pr - (vw - WALL_PAD);
        else if (pl < WALL_PAD) ox += WALL_PAD - pl;
      }
      place.set(n._id, { ox, oy });
    }
    return place;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, circular, soloLeaf, breed.x, breed.y, breed.name, autoExposed, liftR]);
  const clip = "lm-clip-root";
  // Mini pit, a dog with a tree: the root card and the Complete button inside it
  // are drawn in a second svg on top of the placed cards. Lifting the cards down
  // instead would have hidden the very pictures the player just placed.
  const liftRoot = circular || strongBg;

  // The empty frames the player drags each collected card into: a row of living up
  // top, the long-gone below. Positions are screen coords, rendered pan-fixed as
  // sx - pan.x so they stay put while the tree pans behind them.
  // MINI PIT, PHONE: five frames across instead of four.
  //
  // Three dogs carry more than 28 ancestors, and at four across on a 92 pitch
  // those ran off the bottom of a phone. The frame comes down 5%, the gutter
  // closes up, and the pitch is FITTED to the viewport rather than fixed,
  // because a fixed pitch that suits a 390 screen overflows a 320 one and small
  // screens are the entire point of this.
  const fiveUp = (circular || strongBg) && isMobile;
  const MCOLS = fiveUp ? 5 : 4; // phones: one continuous grid, this many wide before it wraps
  const F_EDGE = 14;
  const F_LEFT = fiveUp ? F_EDGE + CW / 2 : isMobile ? 52 : 96;
  // On a circle the rim at 45 degrees sits this far in from the bounding box, so
  // corner adornments tuck against the edge instead of floating outside it.
  const RIM_IN = (CW / 2) * (1 - Math.SQRT1_2);
  // the widest pitch that still lands the last column inside the right margin,
  // never tighter than a 6px gutter and never looser than 76
  const fitCol = MCOLS > 1 ? (vp.w - 2 * F_EDGE - CW) / (MCOLS - 1) : CW;
  const F_COL = fiveUp
    ? Math.max(CW + 6, Math.min(76, fitCol))
    : circular ? CW + 3 : isMobile ? 92 : 112;
  const F_ROW = fiveUp ? F_COL : circular ? CW + 3 : isMobile ? 92 : 112;
  const fCols = Math.max(2, Math.min(7, Math.floor((vp.w - 120) / F_COL)));
  // Tucked under the X/XX counter, which sits at top 26 and is about 32 tall.
  const chumTop = fiveUp ? 111 : circular ? (isMobile ? 118 : 168) : isMobile ? 170 : 240; // 96, down 15 to clear the top-right button
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
      const r = nodeR(share);
      const d = r + 10 + CW / 2;
      // A solo dog has no node to pop from: the node was a duplicate of itself
      // and is no longer drawn. Popping from its coordinates throws the card out
      // to wherever that invisible node sat, which is a long way from the dog.
      // For these dogs the card comes out of the big circle itself.
      // A solo dog has no node to pop from. The card springs out of the big
      // circle's top-right shoulder, offset by that circle's own radius so it
      // sits clear whatever size the dog is, rather than hiding dead centre.
      // circR is declared further down, so use the same expression it does:
      // the dog's own radius, clamped, falling back to ROOT off the mini pit
      const bigR = liftR;
      const soloOff = bigR * 0.72;
      const baseX = soloLeaf ? breed.x + soloOff : live ? live._x + Math.cos(live._dir) * d : 0;
      const baseY = soloLeaf ? breed.y - soloOff : live ? live._y + Math.sin(live._dir) * d : 0;
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
  // The Learn button rides the circle's bottom rim. If circle+button would sit
  // off-screen (or under the top chrome), the whole assembly hops into view:
  // the pit's pct-circle hop, verbatim shape (300ms, -sin(t*PI)*A*(1-t)),
  // landing with the heavy-book dust poof.
  useEffect(() => {
    if (!circular) return;
    const BTN_CLEAR = 58; // button overlaps the rim; just its lower half + margin
    const M = 10;
    const vh = typeof window !== "undefined" ? window.innerHeight : vp.h;
    const cyNow = breed.y + pan.y;
    const bottomOver = cyNow + circR + BTN_CLEAR - (vh - M);
    const topOver = (M + 96) - (cyNow - circR);
    const dy = bottomOver > 0 ? bottomOver : topOver > 0 ? -topOver : 0;
    if (!dy) return;
    const oy = pan.y;
    const A = Math.max(14, Math.min(44, Math.abs(dy) * 0.18));
    const t0 = performance.now();
    let raf = 0;
    const stepA = (now: number) => {
      const t = Math.min(1, (now - t0) / 300);
      setPan((p) => ({ ...p, y: oy - dy * t - Math.sin(t * Math.PI) * A * (1 - t) }));
      if (t < 1) { raf = requestAnimationFrame(stepA); return; }
      const pid = puffSeq.current++;
      setPuffs((p) => [...p, { id: pid, sx: breed.x + pan.x, sy: breed.y + oy - dy + circR }]);
      window.setTimeout(() => setPuffs((p) => p.filter((x) => x.id !== pid)), 480);
    };
    raf = requestAnimationFrame(stepA);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [circular]);
  const [scattered, setScattered] = useState(false);
  // Mini pit: on Complete the tag pill, every node circle and its rod, AND every
  // node's own name pill tip into the pit as live physics objects, main-pit
  // style. Positions are CURRENT layer positions in client px; the pit gives
  // pills a hit limit once they land.
  const circR = liftR;
  // The child node pills for a scatter: every visible non-root node that carries
  // a pill on the layer, at its live pit position, drawn at the canonical
  // nodePillWidth (the one width the layer itself uses). Shared by both scatter
  // paths so a node tips into the pit as the SAME pill it showed. Capped at 50;
  // only the two biggest trees (Irish Setter 62, Golden Retriever 54) come near
  // it. The pit ignores w and re-measures from the name, so w is belt-and-braces.
  const scatterPills = () =>
    shown
      .filter((n) => n._parent)
      .filter((n) => (n.children && n.children.length) || !autoExposed.has(n._id))
      .slice(0, 50)
      .map((n) => {
        const share = Math.round((n._leaves / (n._parent as Node)._leaves) * 100);
        return { x: n._x + pan.x, y: n._y - nodeR(share) - 13 + pan.y, w: nodePillWidth(splitName(n.name)), name: n.name };
      });
  const emitCircularScatter = (includeNodes: boolean) => {
    const pills = [{ x: breed.x + pan.x, y: breed.y + pan.y + circR, w: tagW, name: breed.name }];
    if (!includeNodes) { onScatter?.({ circles: [], rods: [], pills }); return; }
    const vis = shown.filter((n) => n._parent);
    const shareOf = (n: Node) => Math.round((n._leaves / (n._parent as Node)._leaves) * 100);
    const circles = vis.slice(0, 60).map((n) => {
      const share = shareOf(n);
      // Same test the node's own fill uses, so the chip cannot disagree with it.
      const green = !!n.img && (placedImgs.has(n.img as string) || packed);
      return { x: n._x + pan.x, y: n._y + pan.y, r: nodeR(share), share, name: n.name, green };
    });
    const rods = vis.slice(0, 70).map((n) => {
      const p = n._parent as Node;
      return { x1: p._x + pan.x, y1: p._y + pan.y, x2: n._x + pan.x, y2: n._y + pan.y, lit: open.has(n._id) };
    });
    // A solo dog leaves a full-size circle behind. It has to come from where the
    // big circle actually sits, which is breed.x plus the pan, the same point
    // burstAt uses. Spawning from the unpanned figure puts it up where the node
    // centre used to be, which is not where the dog was.
    const big = soloLeaf
      ? { x: breed.x + pan.x, y: breed.y + pan.y, r: circR, name: breed.name }
      : undefined;
    // The child pills join the card's tag pill. Skipped for a solo dog, whose
    // only "child" is a synthetic copy of itself and would just double the tag.
    if (!soloLeaf) pills.push(...scatterPills());
    onScatter?.({ circles: soloLeaf ? [] : circles, rods: soloLeaf ? [] : rods, pills, big });
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
    fireConfetti({
      particleCount: 150,
      spread: 100,
      origin: { x: (breed.x + pan.x) / vp.w, y: (breed.y + pan.y) / vp.h },
      startVelocity: 45,
    });
    window.setTimeout(() => { onRemove?.(breed.name); onClose(); }, 900);
  };
  // Solo dog: there is no node to turn green and no Complete button to press,
  // so landing the image in its frame IS the completion. circularComplete does
  // the rest, which is what the green button has always called: scatter into the
  // pit, burst the big circle, confetti, remove and close.
  useEffect(() => {
    if (!soloLeaf || !circular || !framesDone) return;
    const t = window.setTimeout(() => circularComplete(), 420); // let the frame settle first
    return () => window.clearTimeout(t);
  }, [soloLeaf, circular, framesDone]); // eslint-disable-line react-hooks/exhaustive-deps

  // A solo dog's synthetic child is opened on arrival, so the first double-click
  // pops the card straight out of the big circle rather than spending a step
  // revealing a node that is never drawn.
  useEffect(() => {
    if (!soloLeaf || !circular || !root) return;
    setOpen((prev) => { const s = new Set(prev); s.add(root._id); return s; });
  }, [soloLeaf, circular, root]); // eslint-disable-line react-hooks/exhaustive-deps

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
  /* Set when AUTO has popped everything and the cards still need placing. */
  const autoPlaceRef = useRef(false);
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
    /* AND THEN PLACE THEM. Auto used to stop at popping every card out, leaving
       the last step, dropping each one into its frame, to be done by hand. It
       now finishes the job.
       It has to wait: the cards pop on a stagger, so the placement runs after
       the last of them, and it is flagged rather than called directly because
       the routine reads pickCards and placedSet, which are only correct once
       React has rendered the new picked set. The effect below does it. */
    autoPlaceRef.current = true;
    onScore?.(-2500); // the shortcut costs 2500
    const pk = (fxId.current += 1);
    setPenalty(pk);
    window.setTimeout(() => setPenalty((cur) => (cur === pk ? null : cur)), 1000);
    setAutoArmed(false);
  };
  /* Placing every loose card into its frame. It was written inline inside
     revealStep, as the last thing the blue button does once the tree is fully
     open. AUTO now finishes with the same step, so it is a function rather than
     two copies that would drift.
     Returns true if it had anything to place. */
  const placeAllUnplaced = (): boolean => {
    const unplaced = pickCards.filter((c) => !placedSet.has(c.id) && !packed && !stackedIds.has(c.id));
    if (unplaced.length === 0) return false;
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
    return true;
  };

  /* Below placeAllUnplaced on purpose: it calls it, and a const declared later
     in the same scope cannot be reached from above it. */
  useEffect(() => {
    if (!autoPlaceRef.current) return;
    // Wait until every image node has actually popped: the stagger is 45ms a
    // node, so an early run would place the first few and leave the rest loose.
    const stillPopping = allNodes.some((n) => n.hasImg && !picked.has(n.id));
    if (stillPopping) return;
    autoPlaceRef.current = false;
    placeAllUnplaced();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked]);

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
        const rr = nodeR(sh), dd = rr + 10 + CW / 2;
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
            const rr = nodeR(sh), dd = rr + 10 + CW / 2;
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
          const rr = nodeR(sh), dd = rr + 10 + CW / 2;
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
    // fully open: every loose card goes into its frame
    if (placeAllUnplaced()) return;
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
      // Same test the node's own fill uses, so the chip cannot disagree with it.
      const green = !!n.img && (placedImgs.has(n.img as string) || packed);
      return { x: n._x + pan.x, y: n._y + pan.y, r: nodeR(share), share, name: n.name, green };
    });
    const rods = vis.slice(0, 70).map((n) => {
      const p = n._parent as Node;
      return { x1: p._x + pan.x, y1: p._y + pan.y, x2: n._x + pan.x, y2: n._y + pan.y, lit: open.has(n._id) };
    });
    const pills = scatterPills();
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
    const R = liftR;
    // One band, not a stroke over a contrasting fill. Heavier in the mini pit so
    // it carries the weight the pit's own rings have.
    const rootRingW = liftRingW;
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
        style={{ opacity: dragFocus ? 0 : rootXf.opacity, transition: DRAG_FADE, pointerEvents: dragFocus ? "none" : undefined }}
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
          <rect
            x={-R-rootRingW} y={-R-rootRingW}
            width={R*2+rootRingW*2} height={R*2+rootRingW*2}
            rx={circular ? R + rootRingW : 24}
            className={styles.rootCard}
            style={circular && ringColor ? { fill: ringColor, stroke: ringColor } : undefined} />
          {breed.image ? <image href={bust(breed.image)} x={-R} y={-R} width={R*2} height={R*2} clipPath={`url(#${clip})`} preserveAspectRatio="xMidYMid slice" /> : null}
          {/* Rarity ring + OUTWARD glow. The crisp ring is drawn LAST, on top, in the
              tier colour. Behind it sit three blurred bands OFFSET OUTWARD so each one's
              inner edge meets the ring's outer edge and it blooms only outward; the
              crisp ring covers the blur's small inward spill, so nothing bleeds over the
              image. (A centred version glowed both ways; hiding it behind the image
              buried the bright core; this offset keeps the core and throws the glow
              out.) The glow LIGHTENS toward white for every tier now, because a glow
              adds light and the old darkening read as a solid black shadow, and it FADES
              in opacity outward for a soft graduated falloff. All layers carry
              .rarityRing, so they trace on together from six o'clock on the RARITY_DRAW
              sweep (McLaren-line technique), no pulse. Keyed per dog. Reworked 14 Aug 2026. */}
          {rarityTier ? (() => {
            // ---- GLOW DIALS (three outward bands, back -> front) ----
            const GLOW_WIDTHS = [0.2, 0.13, 0.07];  // how far each band reaches PAST the ring, as a fraction of the ring's OWN width (widest ~20%): a rim light, not a halo. Raise for more reach, lower to tighten further.
            const GLOW_OPACITY = [0.3, 0.55, 0.85]; // faint at the outer edge -> strong at the ring: the falloff
            const GLOW_TINT = [0.55, 0.38, 0.2];    // how far each band lightens toward white (0..1); the back band is lightest
            const GLOW_BLUR = 2;                    // shared feGaussianBlur stdDeviation, px (viewBox is 1:1). Raise it for a softer falloff.
            const ringW = rootRingW + 6;            // the crisp ring's own width
            const r0 = R + rootRingW / 2;           // the ring's radius
            const ringOuter = r0 + ringW / 2;       // ...its outer edge, where the glow starts
            const hex = RARITY_BAND[rarityTier].bg;
            const nHex = parseInt(hex.slice(1), 16);
            const cr = (nHex >> 16) & 255, cg = (nHex >> 8) & 255, cb = nHex & 255;
            const toHex = (r: number, g: number, b: number) => `#${((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1)}`;
            const lighten = (t: number) => toHex(cr + (255 - cr) * t, cg + (255 - cg) * t, cb + (255 - cb) * t);
            const blurId = "lm-glow-blur";
            return (
              <>
                <defs>
                  <filter id={blurId} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation={GLOW_BLUR} />
                  </filter>
                </defs>
                {/* Three outward bands, widest/faintest first (furthest back). */}
                {GLOW_WIDTHS.map((w, i) => {
                  const bandW = ringW * w;
                  return (
                    <circle
                      key={`glow${i}-${breed.name}`}
                      cx={0}
                      cy={0}
                      r={ringOuter + bandW / 2}
                      fill="none"
                      stroke={lighten(GLOW_TINT[i])}
                      strokeWidth={bandW}
                      strokeLinecap="round"
                      pathLength={1}
                      transform="rotate(90)"
                      opacity={GLOW_OPACITY[i]}
                      filter={`url(#${blurId})`}
                      className={styles.rarityRing}
                      style={{ ["--rarity-draw" as string]: RARITY_DRAW, ["--rarity-delay" as string]: RARITY_DRAW_DELAY }}
                    />
                  );
                })}
                {/* The crisp ring itself, on top, tier colour. */}
                <circle
                  key={`glowtop-${breed.name}`}
                  cx={0}
                  cy={0}
                  r={r0}
                  fill="none"
                  stroke={hex}
                  strokeWidth={ringW}
                  strokeLinecap="round"
                  pathLength={1}
                  transform="rotate(90)"
                  className={styles.rarityRing}
                  style={{ ["--rarity-draw" as string]: RARITY_DRAW, ["--rarity-delay" as string]: RARITY_DRAW_DELAY }}
                />
              </>
            );
          })() : null}
          {/* Green progress arc: the SAME band, start point and reveal trick as the
              rarity ring, laid over it so filling frames turn a slice of the ring
              #22c55e, the app's "placed" green (the one a framed node goes, :2029).
              It shows filled.size/frameTotal of the loop from six o'clock via the
              same pathLength-1 + dashoffset, so ring and arc read as one. --green-off
              is 1 - progress (1 hides it, 0 closes the loop to full green). Rendered
              hidden from the start (even at zero filled) so it is there to transition
              as the first card lands. It grows with a transition per landing, and on
              a re-lift with frames already filled it draws on sharing the rarity
              ring's 0.2s delay and 0.9s sweep, so the lift replays cleanly. Keyed on
              the dog, like the rarity ring, so that draw-on remounts per lift. */}
          {rarityTier && frameTotal > 0 ? (
            <circle
              key={`green-${breed.name}`}
              cx={0}
              cy={0}
              r={R + rootRingW / 2}
              fill="none"
              stroke="#22c55e"
              strokeWidth={rootRingW + 6}
              strokeLinecap="round"
              pathLength={1}
              transform="rotate(90)"
              className={styles.progressRing}
              style={{ ["--green-off" as string]: `${1 - filled.size / frameTotal}`, ["--rarity-draw" as string]: RARITY_DRAW, ["--rarity-delay" as string]: RARITY_DRAW_DELAY }}
            />
          ) : null}
          {/* Rarity band: a coloured strip across the bottom of the circle, on the
              artwork just above the Learn button. Clipped to the same circle so it
              never spills past the rim, but its top edge is a straight DIAGONAL
              chord (jaunty, right side higher), not a level segment. The label sits
              on a straight baseline tilted to match. Stays as long as the card is up. */}
          {rarityTier ? (() => {
            const band = RARITY_BAND[rarityTier];
            const TILT = RARITY_TILT;             // shared with the dog name (see RARITY_TILT); steeper negative rides the right side higher (jauntier)
            const bandTop = R * 0.40;             // top edge of the wedge (chord); LOWER value lifts the band up
            // Label position knobs, fractions of R so they scale with the circle.
            // (In the tilted frame: labelX runs mostly left/right, labelY up/down.)
            const labelX = R * 0;                 // + moves the word RIGHT, - left
            const labelY = R * 0.566;             // + moves the word DOWN, - up
            // Fit-to-chord at the WORD's line (narrower than the top of the wedge),
            // so a long label never runs past the rim on the small phone card.
            const chord = 2 * Math.sqrt(Math.max(0, R * R - labelY * labelY));
            const fs = Math.max(9, Math.min(R * 0.22, (chord * 0.92) / (0.6 * band.label.length)));
            // rect and text share one rotate(): the rect's top edge becomes the
            // diagonal chord, the text baseline tilts with it. The rect is drawn
            // oversized so the tilt never exposes a corner; the circle clip cuts it.
            return (
              <g clipPath={`url(#${clip})`} style={{ pointerEvents: "none" }}>
                {/* The slide group carries the CSS translate ONLY; the tilt stays
                    on the inner group, because a CSS transform here would override
                    that rotate attribute. Sitting inside the clip, the band rises
                    up from below and the circle rim reveals it entering. --band-slide
                    is R so it starts a full radius below, clipped out of sight. */}
                <g
                  className={styles.bandSlide}
                  style={{ ["--band-slide" as string]: `${R}px`, ["--band-dur" as string]: BAND_SLIDE_DUR, ["--band-delay" as string]: BAND_SLIDE_DELAY }}
                >
                  <g transform={`rotate(${TILT})`}>
                    {/* At 100% (every frame filled) the band flips to the done-green
                        #69d176, softer than the ring's #22c55e by design (a large fill
                        wants the gentler green; the thin ring stays saturated). The
                        ring owns partial progress; this is the done state. The label
                        flips to navy because white (RARE/ROOT fg) on #69d176 is ~1.9:1,
                        unreadable; navy on it is ~7:1. .bandFill eases the swap. */}
                    <rect className={styles.bandFill} x={-R * 1.6} y={bandTop} width={R * 3.2} height={R * 1.6} style={{ fill: framesDone ? "#69d176" : band.bg }} />
                    <text className={styles.bandFill} x={labelX} y={labelY} textAnchor="middle" dominantBaseline="central" style={{ fontFamily: '"Luckiest Guy", system-ui, sans-serif', fontSize: fs, fontWeight: 400, fill: framesDone ? "var(--navy, #0a3a57)" : band.fg }}>{band.label}</text>
                  </g>
                </g>
              </g>
            );
          })() : null}
          {/* Dog name on the image, above the rarity band. Luckiest Guy, white with
              a black outline. The band's top edge is a -26deg diagonal that rides UP
              to about y = -0.05R near the right rim, so the lowest line's baseline is
              held at NAME_BOTTOM and extra lines stack UPWARD into the open top of
              the image. 0.9em leading reads looser than the number on Luckiest Guy
              (the ink sits high in the em box), so two lines still breathe. Fit-to-
              width so a long name never runs past the rim. NAME_BOTTOM is the knob:
              less negative drops it toward the band. Added 14 August 2026. */}
          {circular && breed.image ? (() => {
            const lines = splitName(breed.name);            // 1-2 lines
            const longest = Math.max(1, ...lines.map((l) => l.length));
            const NAME_BOTTOM = -R * 0.34;                  // baseline of the lowest line; a fraction of R (was -R*0.2) so the up-move reads the same on phone and desktop
            const nameFs = Math.max(12, Math.min(R * 0.384, (R * 1.8) / (0.6 * longest))); // +20% on every term (cap 0.32->0.384, fit 1.5->1.8, floor 10->12)
            const lineH = nameFs * 0.9;                     // 0.9em leading, per the mock
            return (
              // Tilted onto the band's axis (shared RARITY_TILT), rotated about the
              // circle CENTRE not the name's anchor: the rim is a circle, so rotating
              // about its centre keeps every point the same distance from the rim and
              // the horizontal fit is preserved (rotation adds no overflow).
              <g transform={`rotate(${RARITY_TILT})`}>
              <text
                textAnchor="middle"
                style={{
                  fontFamily: '"Luckiest Guy", system-ui, sans-serif',
                  // BUG FIX: fontSize was absent, so the text rendered at the inherited
                  // default while the gap lineH (nameFs * 0.9) scaled with R. A 2-line
                  // name like "Ancient Molossers" then read ~2.5em leading on a big
                  // circle. Tying the font to nameFs makes the leading a true 0.9em on
                  // every name and circle size (and lets the +20% above actually show).
                  fontSize: `${nameFs}px`,
                  fontWeight: 400,
                  fill: "#ffffff",
                  stroke: "#000000",
                  strokeWidth: Math.max(2, nameFs * 0.14),
                  paintOrder: "stroke",
                  strokeLinejoin: "round",
                  pointerEvents: "none",
                }}
              >
                {lines.map((ln, i) => (
                  <tspan key={i} x={0} y={NAME_BOTTOM - (lines.length - 1 - i) * lineH}>{ln}</tspan>
                ))}
              </text>
              </g>
            );
          })() : null}
        </>)}
        {/* the root card carries no status dot; only the ancestor cards show one */}
      </g>
      <g className={styles.rootHit} transform={`translate(${rx},${circular ? ry + R : ry + ROOT + 26})`} style={{ opacity: dragFocus ? 0 : groupFade, transition: DRAG_FADE, pointerEvents: dragFocus ? "none" : undefined }} onClick={(e) => e.stopPropagation()}>
        {!INSTR_NAMES.has(breed.name) && !circular && (<g transform={undefined}><rect className={styles.tag} x={-tagW/2} y={-tagH/2} width={tagW} height={tagH} rx={tagH / 2} />{tagLines.map((ln, li) => (<text key={li} className={styles.tagText} textAnchor="middle" dominantBaseline="central" y={tagLines.length > 1 ? (li === 0 ? -13 : 13) : 0}>{ln}</text>))}</g>)}
        {/* the 3-D Collect button sits on top; it orders the pack into the grid */}
        {/* Blue Learn button - on ALL cards including instructional. Off in
            bounded (/chums2): the display tree has no learn/collect game. */}
        {!bounded && !packed && !collecting && !framesDone ? (() => {
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
          // Placing follows exposing, always. Counting only the cards that
          // already exist meant the placement click was invisible until the
          // images had popped, so two clicks read as "x1" and then "x1" again.
          // In the mini pit, count the placement step as soon as we know there
          // is something to expose. Left alone in the main pit, which has not
          // been asked for and shows longer chains.
          const unplacedClick = unplacedCards.length > 0 || (circular && toPopNodes.length > 0) ? 1 : 0;
          const stepsLeft = instrIconClicks + frontierClicks + toPopClick + unplacedClick;
          return (
          <g
            className={styles.removeBtn}
            transform={`translate(0,${circular ? 4 * learnBtnScale + 2 : 62}) scale(${circular ? learnBtnScale : 1})`}
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
                {/* Mini pit: the counter sits INSIDE the pill, bottom right. It
                    used to hang off the right-hand side at x=108, which ran
                    clean off the screen whenever the lifted dog sat near the
                    right edge. Same size, same style, just brought inside, and
                    inside chumTop so it presses down with the button. */}
                {circular && stepsLeft > 0 && (
                  <text
                    x={88}
                    y={23}
                    textAnchor="end"
                    dominantBaseline="central"
                    style={{ fontFamily: '"Luckiest Guy", system-ui, sans-serif', fontSize: 14, fill: "#ffffff", pointerEvents: "none" }}
                  >{`x${stepsLeft} more`}</text>
                )}
              </g>
            </g>
            {!circular && stepsLeft > 0 && (
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
            transform={`translate(0,${4 * learnBtnScale + 2}) scale(${learnBtnScale})`}
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
        {/* Green button - Complete/skip for instructional, Pack chum ("Collect")
            for dog cards. Off in bounded (/chums2): the display tree has no
            collect game. */}
        {!bounded && !circular && (canRemove || removing || INSTR_NAMES.has(breed.name)) && !packed && !collecting ? (
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

  // Built ONCE. It is needed either in the main svg or in the lifted layer above
  // the cards, never both, and rootCard reads refs: calling it twice would add a
  // second read during render for no gain.
  /* A CARD THAT IS THE SAME DOG AS THE BIG CIRCLE SHOWS ITS NAME, NOT ITS
     PICTURE. Any other card keeps its picture: a real ancestor is a different
     animal, and the picture IS the thing you are matching.

     Owner's rule, and it is sharper than the one this started as. The code has
     two separate reasons for a card to repeat the big circle, and they look
     identical on screen:

       1. A SOLO dog. It has no ancestors at all, so BreedTree hands this layer
          a synthetic child: the dog itself, copied, purely so there is
          something to reveal.
       2. An ECHO child. A node whose name repeats its parent's, which BreedTree
          calls "the same dog carrying on: this line, crossed with the one other
          dog beside it". Here the layer exposes two cards and only one of them
          is a different animal.

     The first version of this only caught case 1, so a two parent dog still
     showed its own photograph twice. Matching on the NAME catches both, and it
     is already the test used a few hundred lines down to suppress the name pill
     on exactly these nodes. Pit lift only: the main pit and the chum tree were
     not asked for. */
  const isSelfCard = (name: string) => circular && name === breed.name;
  const treeRoot = soloLeaf ? null : rootCard(breed.x, breed.y - (liftRoot ? 75 : 0));

  return (
    <>
    <div
      ref={overlayRef}
      // BACKGROUND: the chum family tree is back on the faint brand wash.
      //
      // It wore overlayStrong and then a hue-shifted overlayAlt, both added while
      // the two near-identical layers needed telling apart during testing. That
      // job is done, so it returns to .overlay's light blue gradient and the
      // heavy wash is left to the pit lift, where the pit behind it needs
      // covering. The alt colour has moved to the game over screen.
      //
      // strongBg stays as a prop. It is no longer only about the background: it
      // now marks "this is the mini pit" for the lifted root, the five-across
      // frames, the smaller nodes, the back button's size and the hidden pack
      // header. Removing it here would quietly undo all five.
      className={`${styles.overlay}${bounded ? " " + styles.overlayBounded : ""}${circular ? " " + styles.overlayStrong : ""}${strongBg && !circular && !bounded ? " " + styles.overlayChum : ""}${dragFocus ? " " + styles.overlayFocus : ""}`}
      onClick={closeIfTap}
      onPointerDown={onPanDown}
      onPointerMove={onPanMove}
      onPointerUp={onPanUp}
      onPointerCancel={onPanUp}
    >
      {/* BACK, not close. A play triangle facing left: it takes you back a layer
          rather than dismissing anything.
          closeCircular is now applied for the chum family tree too, not only the
          pit lift. Without it that screen fell back to .close, which is 52px
          with no border, against the pit's 100.8 with a 5px navy stroke: the
          size and the missing stroke line were both this. */}
      {/* Bounded (/chums2) has no back button: the page's own CloseX closes the
          tree and rails its reopen icon. */}
      {!bounded && (
      <button
        type="button"
        className={liftRoot ? `${styles.close} ${styles.closeCircular}` : styles.close}
        onClick={onClose}
        aria-label="Back"
      >
        {liftRoot ? (
          <svg className={styles.backGlyph} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              d="M17 4 L7 12 L17 20 Z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <>&times;</>
        )}
      </button>
      )}
      {!bounded && totalNodes > 0 && frameTotal === 0 && !packed && !collecting && (() => {
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
      {/* Hidden in the mini pit, both uses of it. The clipboard and its
          "Collect Ancestor Pack" label sat over the frames and read as a second
          instruction beside the green Collect, which is the one that actually
          finishes a dog here. The X/XX count above is a separate element and is
          untouched.
          NOTE: this button is also the ONLY way to reach the packed two-column
          view, so that view is now unreachable in the mini pit. `circular`
          already excluded the pit lift; `strongBg` adds the chum family tree. */}
      {showPack && !circular && !strongBg && !INSTR_NAMES.has(breed.name) && (
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
      <svg className={`${styles.svg}${bounded ? " " + styles.svgBounded : ""}`} viewBox={fitBox ? `${fitBox.x - pan.x} ${fitBox.y - pan.y} ${fitBox.w} ${fitBox.h}` : `${-pan.x} ${-pan.y} ${vp.w} ${vp.h}`} width={vp.w} height={vp.h} xmlns="http://www.w3.org/2000/svg">
        <g style={removing ? { pointerEvents: "none" } : undefined}>
        {hasTree ? (
          <>
            <g style={{ opacity: removing || scattered || dragFocus ? 0 : 1, display: scattered ? "none" : undefined, transition: DRAG_FADE, pointerEvents: dragFocus ? "none" : undefined }}>
            {/* A solo dog's card pops out of the big circle, so the circle has
                to be painted first or it covers the card. Every other dog keeps
                the original order, with the root drawn last. */}
            {soloLeaf && rootCard(breed.x, breed.y)}
            {shown
              .filter((n) => n._parent && !soloLeaf && !n._tucked)
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
              .filter((n) => n._parent && !soloLeaf)
              .map((n) => {
                const hasKids = !!(n.children && n.children.length);
                const isOpen = open.has(n._id) && hasKids;
                const share = Math.round((n._leaves / (n._parent as Node)._leaves) * 100);
                const r = nodeR(share);
                return (
                  <g
                    key={n._id}
                    className={styles.node}
                    transform={`translate(${n._x},${n._y})`}
                    style={allBlue ? { pointerEvents: "none" } : undefined}
                    onMouseEnter={() => { if (!bounded && !drag.current?.moved) follow(n); }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (suppressClick.current) { suppressClick.current = false; return; }
                      // BOUNDED (/chums2): a node is not a game tap. Clicking it asks
                      // the host to open THAT ancestor's pack popouts (enlarge + info),
                      // matched by name. A node with no matching frame does nothing.
                      // No follow/score/pick runs, so the tree stays fully expanded.
                      if (bounded) { onNodeClick?.(n.name); return; }
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
                      // /chums2 (hideLeafImages): expansion, scoring and the blue
                      // recolour above still run, but never reveal a breed IMAGE
                      // tile; the node stays a labelled % circle.
                      if (hideLeafImages) return;
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
                        const rr = nodeR(sh), dd = rr + 10 + CW / 2;
                        const px = n._x + Math.cos(n._dir) * dd, py = n._y + Math.sin(n._dir) * dd;
                        setPinned((m) => { const x = new Map(m); x.set(n._id, { img: n.img as string, name: n.name, note: n.note, share: sh, mix: root ? Math.round((n._leaves / root._leaves) * 100) : sh, status: nodeStatus(n.name, n.note) }); return x; });
                        setDragPos((m) => { const x = new Map(m); x.set(n._id, { x: px, y: py }); return x; });
                      }
                    }}
                  >
                    {(() => {
                      /* --ring carries the computed width into the stylesheet so
                         the hover rule can still thicken it. An inline
                         stroke-width would win outright and kill the hover.
                         Only set in the pit lift: the main pit and the chum
                         tree keep the flat CSS numbers they were signed off on,
                         because neither was asked for. */
                      const fill = (n.img && (placedImgs.has(n.img as string) || packed)) ? "#22c55e" : seen.has(n._id) ? "#0c5b92" : undefined;
                      const st: React.CSSProperties = {
                        ...(fill ? { fill } : null),
                        // clamped so a nested ring can never out-thicken its parent
                        ...(circular ? { ["--ring" as string]: `${clampedRingW(n).toFixed(2)}px` } : null),
                      };
                      return <circle className={`${styles.disc} ${circular ? styles.discPit : ""} ${hasKids && !isOpen ? styles.has : ""} ${idleHint && !seen.has(n._id) && (n._parent as Node)?._id === "0" ? styles.hint : ""}`.trim()} r={r} style={Object.keys(st).length ? st : undefined} />;
                    })()}
                    <text className={styles.pct} textAnchor="middle" dominantBaseline="central"
                      fontSize={INSTR_NAMES.has(breed.name) ? Math.max(13, r * 0.75) : Math.max(13, r * (circular ? 0.625 : 0.5))}
                      style={(n.img && (placedImgs.has(n.img as string) || packed)) || seen.has(n._id) ? {fill:"#ffffff",...(INSTR_NAMES.has(breed.name)?{fontFamily:'"Luckiest Guy",system-ui,sans-serif',fontWeight:400}:{})} : INSTR_NAMES.has(breed.name)?{fontFamily:'"Luckiest Guy",system-ui,sans-serif',fontWeight:400}:undefined}>
                      {INSTR_NAMES.has(breed.name) ? (n.value ?? "") : `${share}%`}
                    </text>
                    {(hasKids || !autoExposed.has(n._id)) && !(circular && n.name === breed.name) ? (() => {
                      // The pill is drawn at nodePillWidth, the SAME width the
                      // placement spaces siblings on, so the picture and the spacing
                      // can never drift. It matches the pit pill exactly. (The root
                      // TAG pill stays 9.5/+28, it is the card's own name.)
                      const nmLines = splitName(n.name);
                      const nmW = nodePillWidth(nmLines);
                      const nmH = nmLines.length > 1 ? 40 : 22;
                      // CHANGE 2: sit the pill where the placement pass put it, the
                      // clearest of four touching sides on the lift. Off the lift
                      // (main pit / chum card) the pill sits ABOVE the circle at nmY.
                      // REVERTED 14 Aug 2026: commit 93638c46e (5 Aug) moved nmY from
                      // -r - 13 to -r + 22, which dropped the pill from ABOVE the circle
                      // to INSIDE its top, so in the main pit it read as sitting ON the
                      // node. Restored to -r - 13 (clear above the node). Do NOT
                      // re-apply -r + 22 thinking the above-circle spot is a drift.
                      const nmY = -r - 13;
                      const off = circular ? pillPlacement.get(n._id) : undefined;
                      const pcx = off ? off.ox : 0;
                      const pcy = off ? off.oy : nmY;
                      return (
                        <g>
                          <rect className={styles.nmPill} x={pcx - nmW / 2} y={pcy - nmH / 2} width={nmW} height={nmH} rx={nmH / 2} />
                          {nmLines.map((ln, li) => (
                            <text key={li} className={styles.nm} textAnchor="middle" dominantBaseline="central"
                              x={pcx} y={nmLines.length > 1 ? (li === 0 ? pcy - 8 : pcy + 8) : pcy}>
                              {ln}
                            </text>
                          ))}
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
                  /* Unlit frames fade out under drag focus. `wobbleHere` is kept
                     visible on purpose: it is the filled frame greeting a
                     duplicate, and it is never `lit`, so a literal reading would
                     have left a duplicate drop with nothing on screen at all.
                     Opacity only, no pointer-events change: the drop is hit
                     tested geometrically against clientX/clientY, not by the DOM,
                     so a faded frame still accepts a card. */
                  style={{
                    ...(isMobile ? { touchAction: "none" as const, pointerEvents: "auto" as const } : {}),
                    ...(dragFocus && !lit && !wobbleHere ? { opacity: 0 } : {}),
                    transition: DRAG_FADE,
                  }}
                >
                  <rect
                    className={`${styles.frame} ${lit || correctFlash === f.id ? styles.frameLit : ""} ${filledHere ? styles.frameFilled : ""} ${shakeFrame === f.id ? styles.frameShake : ""} ${wobbleHere ? styles.frameExpect : ""} ${dimHere ? styles.frameDim : ""}`.trim()}
                    /* TWO RINGS, and each was right on its own.
                       .frameFilled turns the dotted hole into a solid YELLOW
                       ring and leaves it at full opacity. The placed card then
                       lays its own WHITE ring on top, deliberately white because
                       yellow is the pit's colour and read as pit furniture over
                       the learning view. Nobody had looked at the two together.
                       The card covers the hole completely once it lands, so in
                       the pit lift the frame steps aside and the card's own ring
                       is the only one. The main pit and the chum tree are
                       untouched: there the card's ring is yellow too and the
                       two sit on top of each other as one. */
                    style={circular && filledHere ? { ...glow, opacity: 0 } : glow}
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
                  {isSelfCard(c.name) ? (() => {
                    // The block is as tall as the card was, and as wide as it likes.
                    const f = soloWordFit(c.name, CW);
                    const y0 = -((f.lines.length - 1) * SOLO_LINE_H * f.fs) / 2;
                    return (
                      <>
                      {/* The word draws with pointerEvents:none and carries no ring
                          rect or image, so on its own it gives the shared cardDrag
                          handlers nothing to catch: the pointerdown falls through to
                          the overlay's onPanDown and you pan the whole circle instead
                          of lifting the card. This invisible square is the card's grab
                          surface, the same rgba(0,0,0,0.001) + pointerEvents:all trick
                          the corner buttons use, so the existing handlers on the group
                          fire. Sized to the card footprint (CW), so it intercepts only
                          the word's own area, never the empty space you pan by. A self
                          card only exists for a solo dog, which always has exactly one
                          matching frame, so there is nowhere it can be picked up with
                          nothing to drop it into. Added 14 August 2026. */}
                      <rect x={c.cardX - CW / 2} y={c.cardY - CW / 2} width={CW} height={CW} style={{ fill: "rgba(0,0,0,0.001)", pointerEvents: "all" }} />
                      <text x={c.cardX} y={c.cardY} textAnchor="middle" dominantBaseline="central"
                        transform={`rotate(${SOLO_TILT_DEG} ${c.cardX} ${c.cardY})`}
                        style={{
                          fill: "#ffffff",
                          stroke: "var(--navy, #0a3a57)",
                          // The pit's own expression, so the two read as the same object.
                          strokeWidth: Math.max(2, f.fs * 0.16),
                          paintOrder: "stroke",
                          strokeLinejoin: "round",
                          fontFamily: "var(--font-display), 'Luckiest Guy', system-ui, sans-serif",
                          fontSize: `${f.fs}px`,
                          pointerEvents: "none",
                          userSelect: "none",
                        }}>
                        {f.lines.map((ln, li) => (
                          <tspan key={li} x={c.cardX} y={c.cardY + y0 + li * SOLO_LINE_H * f.fs}>{ln}</tspan>
                        ))}
                      </text>
                      </>
                    );
                  })() : (() => { const p = INSTR_NAMES.has(breed.name) ? CW*0.20 : 0; return (<><clipPath id={clipId}><rect x={c.cardX-CW/2+p} y={c.cardY-CW/2+p} width={CW-p*2} height={CW-p*2} rx={circular ? (CW-p*2)/2 : 15} /></clipPath><image href={encodeURI(bust(c.img))} x={c.cardX-CW/2+p} y={c.cardY-CW/2+p} width={CW-p*2} height={CW-p*2} clipPath={`url(#${clipId})`} preserveAspectRatio={INSTR_NAMES.has(breed.name)?"xMidYMid meet":"xMidYMid slice"} /></>); })()}
                  {/* No ring on a self card. The word IS the object, exactly as
                      it is in the pit, so a circle round it would be the small
                      card coming back. */}
                  {!INSTR_NAMES.has(breed.name) && !isSelfCard(c.name) && <rect x={c.cardX-CW/2} y={c.cardY-CW/2} width={CW} height={CW} rx={circular ? CW/2 : 15} vectorEffect="non-scaling-stroke" className={isDupImg(c.img) && !isTopOfStack(c) && !PACK_BREEDS.has(c.name) ? `${styles.pickCard} ${styles.pickCardStack}` : styles.pickCard}
                    /* Mini pit: a circle that popped out of a dog wears that
                       dog's ring colour, so it is obvious where it came from.
                       The main pit keeps its own blue and white scheme. */
                    style={circular && ringColor ? { stroke: ringColor } : undefined} />}
                  {INSTR_NAMES.has(breed.name) && placedSet.has(c.id) && (() => { const words = c.name.split(" "); let l1="",l2=""; const mc=Math.floor(CW/7.5); for(const w of words){if((l1+(l1?" ":"")+w).length<=mc)l1+=(l1?" ":"")+w;else l2+=(l2?" ":"")+w;} const ls={fill:"#ffffff",fontFamily:'"Luckiest Guy",system-ui,sans-serif',fontSize:12,fontWeight:400,pointerEvents:"none" as const}; const by1=c.cardY+CW/2+48; const by2=c.cardY+CW/2+40; return l2?(<text x={c.cardX} textAnchor="middle" style={ls}><tspan x={c.cardX} y={by2}>{l1}</tspan><tspan x={c.cardX} dy={20}>{l2}</tspan></text>):(<text x={c.cardX} y={by1} textAnchor="middle" dominantBaseline="central" style={ls}>{l1}</text>); })()}
                  {/* The status dot is reference information, so it belongs to
                      the learning side. The mini pit is a game: no dot there. */}
                  {!circular && isTopOfStack(c) && zoomedId !== c.id && !PACK_BREEDS.has(c.name) && !INSTR_NAMES.has(breed.name) && (() => {
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
                        style={{ cursor: "pointer", display: circular ? "none" : undefined }}
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
                  {/* Once a card is home in its frame the picture is the point,
                      so in the mini pit the percentage comes off it. */}
                  {!(circular && placedSet.has(c.id)) && packed && (isTopOfStack(c) || PACK_BREEDS.has(c.name)) && zoomedId !== c.id && (() => { /* chum-fix: chums always show their pill */
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
                        {!circular && <rect className={styles.mixPill} x={pillRight - pw} y={py} width={pw} height={ph} rx={ph / 2} style={{ filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.45))", pointerEvents: "none" }} />}
                        <text className={styles.mixText} textAnchor="end" x={pillRight - 6} y={py + ph / 2 + 1} dominantBaseline="central">
                          {(pillMix < 1 ? "<1%" : `${rolledMix(c.id, pillMix)}%`) + (wasAdjusted ? "*" : "")}
                        </text>
                      </g>
                    );
                  })()}
                  {!(circular && placedSet.has(c.id)) && isTopOfStack(c) && (placedSet.has(c.id) || packed) && zoomedId !== c.id && !PACK_BREEDS.has(c.name) && !INSTR_NAMES.has(breed.name) && (breedInfo[c.name] || c.note) ? (() => {
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
            {/* In the mini pit this is drawn in its own layer above the cards
                instead, see liftRoot below. The placed cards are HTML with a
                z-index and this svg has none, so drawn here the dog card and its
                Complete button end up buried under the collection. */}
            {!soloLeaf && !liftRoot && treeRoot}
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
      {infoHover && infoHover !== zoomedId && (() => {
        const c = pickCards.find((x) => x.id === infoHover);
        const text = c ? (breedInfo[c.name] || c.note) : null;
        if (!c || !text) return null;
        // Sits to the RIGHT of the card (the zoomed-image case now renders inside
        // TileZoom, so this only handles the plain "i" info panel).
        // Cards near the right edge had nowhere to put it: the panel is fixed
        // and 190 wide, and nothing checked whether that would land off screen,
        // so the text was squeezed against the edge and clipped. If it will not
        // fit to the right it now goes BELOW the card instead, and is clamped
        // into the viewport either way.
        const PANEL_W = 219, EDGE = 8, GAP = 14; // 190, up 15% by request
        // Clamp against the container in bounded mode, the viewport otherwise.
        const vw = bounded ? vp.w : (typeof window === "undefined" ? 1024 : window.innerWidth);
        const vh = bounded ? vp.h : (typeof window === "undefined" ? 768 : window.innerHeight);
        const rightLeft = c.cardX + CW / 2 + GAP + pan.x;
        const fitsRight = rightLeft + PANEL_W <= vw - EDGE;
        const cardLeft = c.cardX - CW / 2 + pan.x;
        const cardBottom = c.cardY + CW / 2 + pan.y;
        const left = fitsRight
          ? rightLeft
          : Math.max(EDGE, Math.min(vw - EDGE - PANEL_W, cardLeft));
        const topRaw = fitsRight
          ? c.cardY - CW / 2 - 6 + pan.y
          : cardBottom + GAP;
        // and never start below the fold, whichever side it ended up on
        const top = Math.max(EDGE, Math.min(topRaw, vh - 120));
        return (
          <div
            onMouseLeave={() => setInfoHover(null)}
            style={{
              position: bounded ? "absolute" : "fixed", left, top, maxWidth: PANEL_W, zIndex: 100, pointerEvents: "auto",
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
                position: bounded ? "absolute" : "fixed", left, top, width: CW, height: CW,
                borderRadius: circular ? "50%" : 15, overflow: "hidden",
                transform: `rotate(${(cardDeg + stackTilt).toFixed(2)}deg)`,
                transformOrigin: "center",
                pointerEvents: "none",
                // BEHIND the primary card, which sits at 62, not on top of it.
                //
                // These were at 63 + i, so a stacked frame's duplicates covered
                // the primary's percentage pill, its info badge and its
                // magnifier. The pill was never missing: it was underneath.
                // Raising the pill could not fix it either, because the card
                // carries its own z-index and therefore its own stacking
                // context, so a child can never climb out past 62.
                //
                // Behind also reads better: the primary stays whole and the
                // duplicates fan out from under it, which is what a pile of
                // cards actually looks like.
                zIndex: 61 - i,
                boxShadow: "0 3px 3px rgba(0,0,0,0.32)",
                userSelect: "none",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={encodeURI(bust(f.img))} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: circular ? "50%" : 15, border: "3px solid rgba(255,255,255,0.3)", pointerEvents: "none" }} />
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
              position: bounded ? "absolute" : "fixed", left, top, width: CW, height: CW,
              borderRadius: circular ? "50%" : 15, overflow: "visible",
              transform: `rotate(${cardDeg}deg)`,
              transformOrigin: "center",
              pointerEvents: "all",
              cursor: !PACK_BREEDS.has(c.name) ? "zoom-in" : "default",
              zIndex: 62,
              // circular: the yellow ring rides as a box-shadow spread rather than
              // an outline, because box-shadow always follows border-radius
              // white in the learn layer: yellow is the pit's colour and it read as
              // pit furniture sitting on top of the learning view
              boxShadow: circular
                ? "0 0 0 3px #ffffff, 0 2px 8px rgba(0,0,0,0.25)"
                : "0 2px 8px rgba(0,0,0,0.25)",
              userSelect: "none",
              touchAction: "none",
              outline: circular ? "none" : "3px solid var(--yellow, #ffd23e)",
              outlineOffset: "-1px",
            }}
            onClick={(e) => { e.stopPropagation(); }}
            onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); if (isMobile) startGridDrag(e); }}
            onPointerMove={(e) => { e.stopPropagation(); if (isMobile) moveGridDrag(e); }}
            onPointerUp={(e) => { e.stopPropagation(); if (isMobile) endGridDrag(e); }}
            onPointerCancel={(e) => { e.stopPropagation(); if (isMobile) endGridDrag(e); }}
          >
            <div style={{ width: "100%", height: "100%", borderRadius: circular ? "50%" : 13, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: INSTR_NAMES.has(breed.name) ? "rgba(10,58,87,0.08)" : "transparent" }}>
              {/* PLACED CARDS ALWAYS SHOW THE PICTURE, solo dogs included.
                  The word is how a solo dog reads while it is loose and in your
                  hand: big, tilted, no circle round it. Once it is home the
                  round card is back, so the frame reads as a filled slot and
                  the grid stays a grid of dogs. Owner ruling. */}
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
            {!circular && isTopOfStack(c) && !PACK_BREEDS.has(c.name) && !INSTR_NAMES.has(breed.name) && (
              <button
                style={{ position: "absolute", left: 4, bottom: 4, width: 28, height: 28, border: "none", borderRadius: 8, background: "transparent", filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.85))", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, zIndex: 65 }}
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
                <div title={ts.label} style={{ position: "absolute", left: circular ? RIM_IN - 6 : -4, top: circular ? RIM_IN - 6 : -4, width: 12, height: 12, borderRadius: "50%", background: ts.bg, border: "1.5px solid #fff", pointerEvents: "none" }} />
              );
            })()}
            {/* info icon top-right */}
            {isTopOfStack(c) && !INSTR_NAMES.has(breed.name) && (breedInfo[c.name] || c.note) && (
              <button
                style={{ position: "absolute", right: circular ? RIM_IN - 14 : -14, top: circular ? RIM_IN - 14 : -14, width: 28, height: 28, border: "2px solid #fff", borderRadius: "50%", background: "var(--blue-deep, #0c5b92)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, fontStyle: "italic", fontWeight: 700, fontSize: 14, fontFamily: "Georgia, serif", zIndex: 65 }}
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
                  style={{ position: "absolute", ...(circular ? { left: "50%", transform: "translateX(-50%)", bottom: -12 } : { right: -2, bottom: 2 }), background: "var(--navy, #0a3a57)", color: "#ffd23e", borderRadius: 12, padding: "2px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "Montserrat, system-ui", zIndex: 64, boxShadow: "0 1px 4px rgba(0,0,0,0.35)" }}
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
        // The enlarged image + its description panel, drag and 2s auto-close are
        // the shared TileZoom. Anchor is this card's on-screen top-left + size.
        return (
          <TileZoom
            key={c.id}
            open={{
              img: bust(c.img),
              name: c.name,
              description: (breedInfo[c.name] || c.note || "") as string,
              anchor: { x: c.cardX - CW / 2 + pan.x, y: c.cardY - CW / 2 + pan.y, size: CW },
            }}
            onClose={() => { setZoomedId(null); setInfoHover(null); }}
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
              position: bounded ? "absolute" : "fixed", left, top, maxWidth: 288, zIndex: 100, pointerEvents: "auto", /* pct-close: hoverable so it can self-dismiss */
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
      {/* THE LIFTED ROOT. A second svg over the top, same viewBox and same pan,
          carrying only the dog card and the Complete button that lives inside
          it. This is why: the placed cards are HTML with a z-index and the main
          svg has none, so anything drawn there sits underneath them. Pushing the
          cards down instead would have hidden the pictures the player just
          placed, which is worse. pointer-events stays none on the layer itself,
          so only the buttons inside it take a press. */}
      {liftRoot && hasTree && !soloLeaf && (
        <svg
          className={`${styles.svg} ${styles.svgTop}${bounded ? " " + styles.svgBounded : ""}`}
          viewBox={fitBox ? `${fitBox.x - pan.x} ${fitBox.y - pan.y} ${fitBox.w} ${fitBox.h}` : `${-pan.x} ${-pan.y} ${vp.w} ${vp.h}`}
          width={vp.w}
          height={vp.h}
          xmlns="http://www.w3.org/2000/svg"
        >
          {treeRoot}
        </svg>
      )}
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
