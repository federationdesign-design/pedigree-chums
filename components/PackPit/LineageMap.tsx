"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getLineage, type LineageNode } from "../../data/lineage";
import { fireConfetti } from "../../lib/confetti";
import ReadingProgress from "../ReadingProgress/ReadingProgress";
import { bust } from "../../data/imgVersion";
/* The influence model, so the badges on the frames print the SAME figure the
   ancestry card does. See the note on breedMix's `norm` below. */
import { ancestralInfluence } from "../../data/lineageArchive";
import { ukBreeds } from "../../data/uk-breeds";
import { breeds } from "../../data/breeds";
import { isHiddenCopyOf } from "../../data/lineageShape";
import { packArt } from "../../data/packArt"; // resolveLineageName moved in there with it
import { breedInfo } from "../../data/breedInfo";
import { splitName } from "./splitName";
import styles from "./LineageMap.module.css";
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
  "Old scenting Hounds": "extinct",
  "Old English Black and Tan Terrier": "extinct",
  "White English Terrier": "extinct",
  "Old English White Terrier": "extinct",
  "English White Terrier": "extinct",
};
/* DIAGNOSTIC: item 8, a re-picked-up card refused by its frame (9 Sept 2026).
   Behind ?dropdebug=1 only. Nothing is created and nothing is logged without
   the flag. REMOVE ONCE ITEM 8 IS FIXED. */
let DROP_DBG: HTMLDivElement | null = null;
let DROP_DBG_N = 0;
const DROP_DBG_LINES: string[] = [];
const dImg = (s: string) => (s || "").split("/").pop() || "-";
function dropLog(s: string) {
  if (!DROP_DBG) return;
  DROP_DBG_LINES.push(s);
  while (DROP_DBG_LINES.length > 6) DROP_DBG_LINES.shift();
  DROP_DBG.textContent = DROP_DBG_LINES.join("\n");
}

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
/* FIVE TIERS, 16 SEPTEMBER 2026 (owner's palette). The cuts and the reasoning
   behind them live with rarityTier in BreedTree.tsx; this is only the look.

   WHAT MOVED. RARE was orange and is now royal blue; orange moves up to the new
   COMMON; yellow moves up to the new VERY COMMON. So a dog that used to wear
   yellow at 7 trees now needs 50.

   EVERY fg IS THE CONTRAST-SAFE CHOICE, MEASURED, NOT PICKED. Ratios against this
   palette: purple 9.93:1 on white, royal blue 7.56:1 on white, green 9.26:1 on
   black, orange 7.37:1 on black, yellow 17.39:1 on black. The alternatives fail:
   white on yellow is 1.21:1 and white on orange 2.85:1, which is the same
   unreadable pair that had to be reversed on the done band on 10 September. Do
   not "tidy" these to one colour. */
/* EXPORTED, 18 September 2026 (owner). The mini pit's chain fills an available
   twin with its breed's rarity colour, and copying five hexes into BreedTree
   would be two tables that drift. RING_FRAC is exported for the same reason and
   in the same spirit: one source, read from both sides.
   `fg` matters as much as `bg` to any consumer. It is the ink measured against
   that background, and it is the reason the pair can be used anywhere: white on
   the purple and the royal blue, black on the green, the orange and the yellow. */
export const RARITY_BAND: Record<"extremelyRare" | "rare" | "uncommon" | "common" | "veryCommon", { bg: string; fg: string; label: string }> = {
  extremelyRare: { bg: "#4d2e91", fg: "#ffffff", label: "EXTREMELY RARE" }, // purple
  rare:          { bg: "#2547c4", fg: "#ffffff", label: "RARE" },           // royal blue
  uncommon:      { bg: "#5dbf86", fg: "#000000", label: "UNCOMMON" },       // green
  common:        { bg: "#f47421", fg: "#000000", label: "COMMON" },         // orange
  /* #fcee23 -> #ffd23e, 18 September 2026 (owner). The lemon becomes the site's
     own --yellow, so the top tier sits in the palette rather than beside it.
     ALL FIVE READERS MOVE TOGETHER and that is intended, audited before the
     change: the lifted circle's crisp rarity ring and its three glow bands, the
     rarity band under the lifted card, seenFill on every node tapped on the
     lifted layer, and in the mini pit an available twin's fill and the ink its
     mark takes from fg. The lifted layer's dominant colour changes with it,
     because seenFill is most of the tree on a very common dog.
     BLACK STAYS AS fg: measured 14.54:1 on the new colour against 17.39 on the
     old, so the label is still comfortably readable.
     The dog chain path moved OFF #ffd23e in the commit beside this one, or it
     would have been drawn in exactly the colour of the circles it joins. */
  veryCommon:    { bg: "#ffd23e", fg: "#000000", label: "VERY COMMON" },    // site yellow
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
/* ROOT + 96 -> ROOT + 72, the first ring 25% shorter, 16 September 2026 (owner:
   the connectors coming off the central chum card are too long). Only the 96 is
   cut: ROOT is the card's own radius and the ring has to clear it.

   THE 72 IS BROKEN OUT, 18 September 2026 (owner), because the lift needs the
   same DAYLIGHT round a different card. RING1 is built from ROOT, the default
   root radius, but the lifted layer draws its root at liftR, which is computed
   per screen and is far larger: 85 against ROOT's 58 on a 390 phone. So the
   first ring was placed 130 out from a card whose own radius was 85, and the
   ring's nodes sat BEHIND the card with only their percentage badges peeking out
   above it, which read as badges floating with nothing under them.
   RING1_GAP is the clearance, RING1 is the default card plus it, and the walk
   adds it to liftR instead when the layer is the lift. */
const RING1_GAP = 72;
const RING1 = ROOT + RING1_GAP;
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
/* A QUARTER OFF, ON THE LIFTED LAYER ONLY (owner, 18 September 2026). The cards
   and the frames they sit in read too large when a dog is lifted out of the pit.

   SCOPED BY `circular`, which is the lifted layer's own flag, so the chum tree
   (`strongBg`) and the main pit both keep the figures they have today.

   DESKTOP ONLY, and that is the owner's call rather than an oversight. On a
   phone the card is not this number: the grid picks a column count and then
   GROWS the card to fill the row, so CARD only sets a floor there and shrinking
   it changes nothing unless the column count moves, which is deliberately left
   alone. On desktop the card IS this number, so the quarter lands.

   One number to nudge. */
const LIFT_CARD_SCALE = 0.75;
/* THE OVERLAY'S OWN SCALE, AND ITS INVERSE (owner, 19 September 2026: the small info
   card on the lifted layer is too small).

   WHY THE TWO INFO BOXES READ SMALL. The overlay carries transform: scale(0.8) whenever
   (circular || strongBg) && !bounded, and a transform shrinks every descendant. Both
   boxes sit inside it, so their declared 12px was landing at 9.6px on screen while the
   learn area's .cNote, which is outside any scaled element, was a true 12px. They were
   raised from 11 to 12 on 16 September to match that card and still came out a fifth
   short, because the NUMBER was never the problem.

   THE CHEAP FIX, KNOWINGLY. The frame grid below already inverts this same 0.8 for its
   coordinates, and records that the clean fix is to take the element out of the scaled
   overlay. This is the same cheap trade applied to type: a figure passed through liftPx
   LANDS at the size it names.

   IT IS CONDITIONAL, AND IT HAS TO BE. When `bounded` is set the overlay carries no
   transform, so pre-compensating there would make the boxes a quarter too BIG. The
   guard is the same expression as the style it inverts; if one moves, move both. */
const LIFT_OVERLAY_SCALE = 0.8;
const PACK_BREEDS = new Set(breeds.map((b) => b.name)); // the 54 dogs in the card pack the site is about
/* PACK_IMG AND packArt MOVED OUT, 19 September 2026 (owner). They now live in
   data/packArt.ts, unchanged, so BreedTree can run the same lookup: it does not
   import data/breeds at all and was painting sixteen of the fifty-four pack dogs
   from the lineage record's historical picture. Nothing about this file's own
   behaviour changes; every call site below reads the identical function. The alias
   note that used to sit here has moved with it. */
// every white flash number is this small, fixed size, matching the pit; it never
// scales with the circle that was tapped
const FLASH_SIZE = 15;
// the popped breed cards lean only slightly, capped at this angle (2 degrees)
const CARD_TILT = (2 * Math.PI) / 180;
// The coloured rarity band's tilt (degrees), shared by the dog name above it so
// the two sit on one axis. One dial: change it here and both rotate together.
const RARITY_TILT = -26;
/* TAP OUTSIDE A LIFTED CIRCLE TO CLOSE IT (owner, 18 September 2026), as a SECOND
   way out beside the back button, which stays: it is the only discoverable exit,
   the only one that works when the grid covers the backdrop, and the only one a
   keyboard or a screen reader can reach.

   IT WAS NEVER BUILT HERE. closeIfTap below carried "tap-to-close disabled" and
   the reason, that a stray tap could wipe out a built tree. These two figures are
   the answer to that: 6px of movement and 350ms, the same pair the pit's own
   tap-to-open uses, so a hesitant press or a drag that ends on empty floor is not
   a dismissal. */
const TAP_CLOSE_SLOP = 6;
const TAP_CLOSE_MS = 350;

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
/* 0.78 -> 0.663, a further 15% off, 16 September 2026 (owner: make the family
   tree diagram 15% smaller again, leaving the frames, the images, the main dog
   card and the buttons at their current size).

   THIS IS THE ONE DIAL FOR THAT. It feeds nodeR and nothing else, and nodeR sets
   the node radii, where the connectors start and end, and the ring weight through
   clampedRingW. The cards use CW, the root card uses ROOT and the frames have
   their own geometry, so none of them follow this number. That is exactly the
   split the owner asked for.

   The tree also draws tighter, not just smaller: the layout packs on these radii,
   so the gaps close with the circles. */
/* 0.78 -> 0.663 -> 0.564 -> 0.479 -> 0.407, four cuts of 15% on 16 September 2026
   (owner), leaving the nodes at 52% of the size they were that morning.

   STILL THE SINGLE DIAL for the nodes, the connectors and the pills: it feeds
   nodeR and nothing else, and the cards, the root card and the frames all use
   their own constants, so none of them follow it. The tree also draws tighter
   rather than only smaller, because the layout packs on these radii.

   WORTH KNOWING BEFORE A FIFTH CUT: radius() floors at 21 before this scale is
   applied, so a small circle is already at 21 * 0.407 = 8.5px and the ring on it
   is a flat 4.8. Below about 0.3 the ring is thicker than the circle is wide and
   the nodes stop reading as circles at all. */
const PIT_NODE_SCALE = 0.659;
/* HOW MUCH BIGGER THAN ITS NODE A POP-OUT CARD IS DRAWN (owner, 18 September
   2026: the node's ring still shows behind the card).

   THE CARD WAS 71.3% OF THE NODE'S RADIUS, at every share. cardScale mapped the
   largest node to CW, but CW/2 is 23.5 against that node's radius of 32.95, so
   the card was always the smaller of the two and the ring showed all the way
   round. Not a corner problem: on the lift the card's rx is CW/2 on a square of
   side CW, so it is drawn as a CIRCLE, not a rounded square, and its corners
   never had to reach anywhere.

   THE RING IS THE SECOND HALF, and that half was right. .disc strokes on the
   node's radius, so it extends OUTWARD by half its width. At depth 1 the ring is
   9% of nodeR, so the node's visual outer radius is nodeR * 1.045; depths 2 and 3
   are 1.041 and 1.0375, so depth 1 is the worst case and covering it covers all.

   1.045 IS THE COVER, and this constant is the margin on top of it, so the two
   reasons stay separate: if a card ever peeks again, nudge this, not the 1.045. */
const CARD_COVER_MARGIN = 1.04;
/* THE CARD'S FOOTPRINT AS A MULTIPLE OF ITS NODE'S RADIUS, the ring's outward
   half plus the margin. Named because TWO things need it now: the card's own
   scale, and the name pill, which has to sit clear of the card rather than clear
   of the node. See PILL_CARD_GAP. */
const CARD_COVER = 1.045 * CARD_COVER_MARGIN;
/* How far above the card's rim the pill's own rim sits. Because the pill is
   placed against the CARD's footprint and its own half-height, this gap is the
   clearance at every node size AND at one line or two, where the old fixed
   -r - 13 gave a one-line pill a margin that shrank as nodes grew and left a
   two-line pill behind the card at every size. */
const PILL_CARD_GAP = 6;
/* The scale the node name pill is DRAWN at. Named because two places need it: the
   <g> that draws it on the tree, and scatterPills, which has to send the pit the
   drawn width rather than the raw one. */
const PIT_PILL_SCALE = 0.683;
export function radius(share: number) {
  return Math.max(21, 5 * Math.sqrt(share));
}
/* The node name pill's drawn width: 7.4 per character, padding, +10 for a second
   line, floored at 44. One definition, so the placement that spaces siblings on it
   and the render that draws it cannot drift. Takes the already-split lines so the
   caller pays for splitName once.

   PADDING 14 -> 28, 16 September 2026 (owner: the text reaches the edge of the
   pill). That 14 was 7px a side, which at the 0.594 the pill is drawn at came to
   about 4 real pixels: enough to look like a mistake on a long name. 28 gives 14 a
   side, around 8 drawn, and the floor rises with it so a short name keeps its shape.

   THIS IS NOT THE PLACE TO CHANGE THE PILL'S SIZE. The scale on the <g> does that,
   and it multiplies this; the two are separate on purpose, so padding can be tuned
   without moving every sibling apart. */
function nodePillWidth(lines: string[]): number {
  return Math.max(58, Math.max(...lines.map((l) => l.length)) * 7.4 + 28 + (lines.length > 1 ? 10 : 0));
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
  tierOf,
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
  rarityTier?: "extremelyRare" | "rare" | "uncommon" | "common" | "veryCommon";
  /* THE TIER OF ANY BREED BY NAME, for the cards (owner, 18 September 2026).
     rarityTier above is the LIFTED DOG's tier, one value for the whole layer. The
     pop-out cards are that dog's ancestors and each is its own breed, so each has
     its own tier, and this file cannot work one out: rarityTier() lives in
     BreedTree and BreedTree already imports this file, so importing it back would
     be circular. The caller holds both halves and passes the function down.
     Optional, and every caller that does not supply it falls back to the level's
     own tier, then to ringColor, so nothing else changes. */
  tierOf?: (name: string) => "extremelyRare" | "rare" | "uncommon" | "common" | "veryCommon";
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
  // onNodeClick (added 2026-08-23; rect 2026-08-27): bounded only. In bounded mode
  // the node click first runs the pit's expand for that node, then fires this with
  // the clicked node's breed name AND its on-screen rect (viewport px), so the host
  // (/chums2) can open THAT ancestor's pack popout directly below the node. Ignored
  // when bounded is false, so the pit is unchanged.
  onNodeClick?: (name: string, rect: { x: number; y: number; w: number; h: number }) => void;
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
  /* WAS ringFrac(1) FOR EVERY LIFT, 2 September 2026 (owner), and that is why the
     ring read so much heavier on the card than on the circle it came from: entry
     1 is the THICKEST in the table, 0.09, while a depth-3 circle in the pit wears
     0.075 and a depth-5 one 0.065. Every lift got the depth-1 weight regardless.

     The caller now sends the fraction the circle actually had, worked out from
     the pit's own stroke rather than looked up again, so the difficulty trim and
     the hierarchy clamp come with it. ringFrac(1) stays as the fallback for any
     caller that does not send one.

     IT ALSO SIZES THE CARD, through the (2 + frac) budget below, so a thinner
     ring buys a slightly larger picture. That is a couple of pixels and it is the
     correct direction. */
  /* ONE WEIGHT FOR EVERY LIFT, 9 Sept 2026 (owner): "the thinner is the ideal
     version that we should be going for".

     THIS REVERSES THE 2 SEPTEMBER RULE ABOVE, deliberately. Carrying the pit's
     own ring across meant the drawn line varied dog by dog: the lift FLOORS a
     small circle up to the minimum card while the ring came over at a fixed
     pixel width, so a small dog blown up read thin and a big dog read heavy.
     The note above calls that consequence intended. On the device it reads as
     an inconsistency, so it goes.

     0.065 is the thinnest entry in RING_FRAC, the weight a depth-5 circle wears
     in the pit, so nothing gets heavier than it is today. It is a fraction of
     the LIFTED radius, so it follows the card at any screen size, and it sizes
     the card through the (2 + frac) budget below exactly as before.

     The ringWidthFrac and ringWidthPx props that carried the pit's weight are
     gone with it, along with the two lines in BreedTree that passed them. The
     learnCard fields behind those two lines are left in place, unread, so this
     can be put back by restoring the props alone. */
  const LIFT_RING_FRAC = 0.065;
  const liftRingFrac = LIFT_RING_FRAC;
  // Floor the tapped radius up to the 250-wide minimum, then cap by the share so
  // a narrow viewport never exceeds its own maximum card (176 at 390). Both the
  // floor and the share divide the same (2 + frac) width budget.
  const liftFloorR = 250 / (2 + liftRingFrac);
  const liftShareR = (vp.w * LIFT_MAX_SHARE) / (2 + liftRingFrac);
  const liftR = circular && rootRadius
    ? Math.min(liftShareR, Math.max(liftFloorR, rootRadius))
    : ROOT;
  /* THE RING IS DRAWN AT THE PIT'S OWN PIXEL WIDTH when the caller sends one,
     2 September 2026 (owner): "exactly the same as the pit ring, not increased".

     A FRACTION IS NOT ENOUGH, which is what the previous pass got wrong. liftR is
     FLOORED up for a small circle, so the card can be larger than the circle it
     came from, and the same fraction of a larger radius is a wider line. Matching
     the pixels is the only way the ring is unchanged.

     The fraction still sizes the CARD through the (2 + frac) budget above, so the
     picture is unaffected; only the drawn width changes.

     A CONSEQUENCE, and it is the intended one: on a floored-up card the ring will
     read as PROPORTIONALLY thinner than it did in the pit, because the picture
     grew and the line did not. The outer glow around it is separate and will
     still make the whole thing look larger than the line itself. */
  const liftRingW = circular && ringColor ? liftR * liftRingFrac : 5;
  // The Learn/Complete button is a fixed 200x68. On a small card that swamps
  // the picture, so it scales WITH the card: width 1.8 * R (~151px on a 390
  // phone, tuned up from 1.4 by eye on the device), capped at
  // 200, and NO minimum, a small button on a small card being correct. The cap
  // means desktop sits at 200 (was 192 at the old 0.9 multiplier, an accepted
  // 8px). Applied as one scale() on the button group; the rim offset scales with
  // it so the button keeps the same overlap on the rim at any size.
  const learnBtnScale = circular ? Math.min(1, (1.8 * liftR) / 200) : 1;
  /* THE LEARN BUTTON PRESSES, 9 Sept 2026 (owner), item 11. The green Collect
     button already had this: .chumTopDown drops the top of the pill onto its
     base. Learn never used it, so a button you press three or four times a
     level gave no feedback at all.
     Driven off pointerdown with a timed release rather than held until
     pointerup, so a fast tap still shows the whole movement. */
  /* NO PRESSED LOOK AND NO WAIT (owner, 18 September 2026). This button used to
     sink 8px on press and refuse the next press until its step had settled.

     WHAT WENT WITH IT. `learnDown` and the .chumTopDown class that moved it,
     `learnBusy`, which made revealStep return early while a step was running,
     the 130ms release that followed the step's own state landing, and the 6
     SECOND GUARD, whose whole job was to put the button back up if a step never
     reported: a failsafe for the pressed look, never for the work.

     WHAT OVERLAPPING PRESSES DO NOW. Every press runs a step. A step reads the
     current open, picked and packed state and advances one rung from it, so
     presses cannot corrupt anything or run the same rung twice; they can only
     advance faster than the animations, which reads as the layer hurrying rather
     than as a fault. The slowest step, the pack-out, is the one where that is
     most visible.

     The auto button keeps its own press, which is CSS and has no timer. */
  const [rootGone, setRootGone] = useState(false);
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
    /* IT NO LONGER COLLAPSES (owner, 18 September 2026), matching BreedTree, where
       the whole reasoning is written out beside the pack pass.

       IN ONE LINE: a single-child wrapper was deleted because in the PIT's pack its
       one child fills it completely. That is a layout problem, and it is now solved
       in the layout. It cost 68 ancestors, and 329 once the 19 August duplicate-child
       device is removed.

       THIS LAYER NEEDS NO SOLO_CHILD_K. Children here sit on a ring AROUND their
       parent rather than nested inside it, so a lone child is simply one circle on
       that ring and never fills anything. It is changed only so the learn area and
       the pit draw the same tree; letting one collapse and not the other would put
       a dog in the diagram that the lift does not have. */
    const collapse = (n: Node): Node => ({ ...n, children: ((n.children as Node[] | undefined) ?? []).map(collapse) });
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
  /* THE GRID FILLS THE WIDTH, AND THE CARD IS DERIVED FROM IT, 16 September 2026
     (owner: six columns with a 10px gutter, reaching both edges, six only where
     six fits).

     WHAT WAS WRONG. The cap here still divided by FIVE while the grid had gone to
     six columns, so the cards were sized for a five-wide layout, came out too
     small for the space, and the gutter collapsed to absorb the difference. That
     is the tight gutter and the empty right-hand strip in one fault.

     THE ORDER MATTERS, and it is: columns, then gutter, then card.
       1. Take the MOST columns that fit at the base card size with a minimum 6px
          gutter. Six on a tablet, five on most phones, four on a 320.
       2. Widen the gutter towards 10 with whatever slack is left, never below 6.
       3. Give the card the rest, so the grid reaches both edges exactly.

     WHY THE GUTTER FLEXES BEFORE THE COLUMN COUNT. A flat 10px gutter costs more
     than it gains on a small phone: five 61px cards plus four 10px gutters is
     345px against 332px available on a 360, so a strict 10 would have dropped that
     screen to four columns. Letting it fall to 6 keeps the fifth.

     THE CARD NEVER SHRINKS, only grows: 61 on a 360, 64 on a 390, 115 on a 768.
     That was the owner's condition, and it matters because CW drives the frames,
     the picture cards, the drop targets and the corner adornments alike. */
  const F_EDGE = 14;   // the grid's margin at each side
  /* HOW MANY FRAMES THIS DOG WILL PRODUCE, counted here rather than from `frames`
     because that is built much further down and CW has to know before it can cap
     itself by height. One frame per DISTINCT picture, the same rule the grid uses,
     so the two cannot disagree. */
  const frameCountEst = useMemo(() => {
    const imgs = new Set<string>();
    const w = (n: Node) => (n.children as Node[] | undefined)?.forEach((k) => { if (k.img) imgs.add(k.img as string); w(k); });
    if (root) w(root as Node);
    return imgs.size;
  }, [root]);
  const F_GUT_MIN = 6;
  const F_GUT_WANT = 10;  // the gutter the card is chosen against
  const F_GUT_MAX = 24;   // the widest it may grow to soak up a height-capped card
  /* THE GRID IS DERIVED ONCE NOW, AND READ TWICE (owner, 18 September 2026).

     WHAT WAS WRONG. This ladder was written twice, here and again in fitCols
     below, with a comment on each insisting the two must agree exactly. They did,
     but only because nobody had touched one without the other, and this commit
     had to touch both. One function, called for whatever ladder is wanted.

     `floorW` IS THE SMALLEST A CARD MAY BE SQUEEZED TO, and it is what the fit
     test asks about, so raising the ladder and lowering the floor are the same
     move. It was always `base`, the card's own natural size, which is why the
     card could only ever grow.

     Returns null off the phone grid, where CW comes from its own branches. */
  const GRID_BASE_W = Math.round(CARD * 0.85 * 0.95);
  /* EIGHT COLUMNS ON THE LIFTED LAYER (owner, 18 September 2026). The quarter off
     the card landed on DESKTOP ONLY, because a phone does not take CARD as its
     card size: the grid picks a column count and then grows the card to fill the
     row, so shrinking CARD changed nothing there. The column count is the only
     dial that moves a phone card, so it is the one that moves.

     SCOPED BY `circular`, the lifted layer's own flag. The chum tree (strongBg)
     and the main pit keep the 6/5/4 ladder and the figures they have today.

     THE FLOOR IS THE SAME QUARTER, base * LIFT_CARD_SCALE, rather than a new
     magic number: the lifted card is allowed down to three quarters of its
     natural size and no further, which is exactly what desktop already does. */
  const LIFT_MAX_COLS = 8;
  const LIFT_FLOOR_W = Math.round(GRID_BASE_W * LIFT_CARD_SCALE);
  /* Type inside the scaled overlay is written at the size it should LAND at and divided
     by that scale. See LIFT_OVERLAY_SCALE. The factor is 1 when nothing scales. */
  const liftK = (circular || strongBg) && !bounded ? 1 / LIFT_OVERLAY_SCALE : 1;
  const liftPx = (px: number) => `${+(px * liftK).toFixed(2)}px`;
  const gridFor = (maxCols: number, floorW: number) => {
    if (!isMobile || !(circular || strongBg)) return null;
    /* DIVIDED BY THE LAYER'S SCALE, 16 September 2026 (owner: the grid still
       leaves about 15% of the width unused).

       THE UNITS WERE THE FAULT. The grid is laid out in UNSCALED coordinates
       and the whole layer is then drawn at LIFT_K, 0.8 on the lift and the
       chum tree. Sizing the columns in screen pixels therefore produced a
       grid that rendered at 80% of the width it was calculated for, which is
       exactly the strip left over on the right.

       LIFT_K is declared much further down, after the layout it feeds, so its
       condition is repeated here rather than the constant moved. The two must
       stay in step: (circular || strongBg) && !bounded. */
    const k = (circular || strongBg) && !bounded ? 0.8 : 1;
    const avail = (vp.w - 2 * F_EDGE) / k; // in the units the grid is laid out in
    const fits = (n: number) => n * floorW + (n - 1) * F_GUT_MIN <= avail;
    let cols = 4;
    for (let n = maxCols; n > 4; n--) if (fits(n)) { cols = n; break; }
    const gut = Math.max(F_GUT_MIN, Math.min(F_GUT_WANT, Math.floor((avail - cols * floorW) / Math.max(1, cols - 1))));
    const byWidth = Math.max(floorW, Math.floor((avail - (cols - 1) * gut) / cols));
    /* CAPPED BY HEIGHT TOO, 16 September 2026 (owner: on the deepest dogs the
       bottom rows run off the page).

       THE CARD WAS DERIVED FROM WIDTH ALONE, so nothing in it knew how many
       rows it would produce or how tall the screen was. On a 768 tablet that
       gave a 145px card and nine rows for the Jackapoo's 52 frames: 1,116px
       of grid against about 764px of room. The wider the device, the worse
       it got, which is why it was never seen on a phone.

       THE BUDGET. The grid starts around 91px down, below the counters, and
       has to finish clear of the chum card, the Learn and Collect buttons and
       the progress bar along the foot. F_VERT_RESERVE is that furniture,
       measured off the layout rather than guessed: the card is about 150 tall
       with its name, the two buttons about 130 between them, and the bar 36.

       Divided by k because everything here is in the layer's own units while
       the screen is not, the same correction the width uses.

       NEVER BELOW `floorW`. A phone already fits, so the cap must not bite
       there; it only ever pulls a tablet's oversized card back down. More
       columns means fewer rows, so it bites less at eight than it did at six. */
    const rows = Math.max(1, Math.ceil(Math.max(1, frameCountEst) / cols));
    /* THE ONE FIGURE IN HERE THAT IS AN ESTIMATE. The furniture below the grid
       is drawn from several places and cannot be measured at this point in
       the render, so 280 is the chum card, the two buttons and the progress
       bar added up from their own constants. If the grid still runs long or
       stops short on a device, THIS is the number to change; everything
       around it is derived. */
    const F_VERT_RESERVE = 280;
    const availH = Math.max(0, vp.h - 91 - F_VERT_RESERVE) / k;
    const byHeight = Math.floor(availH / rows) - gut;
    return { cols, gut, cw: Math.max(floorW, Math.min(byWidth, byHeight)) };
  };
  /* THE LIVE GRID, and the grid the TYPE is measured against. The second is the
     ladder as it stood before the lift went to eight, so the card comes down and
     the wording does not, which is what desktop already does through CW_TYPE. */
  const gridNow = circular ? gridFor(LIFT_MAX_COLS, LIFT_FLOOR_W) : gridFor(6, GRID_BASE_W);
  const gridType = gridFor(6, GRID_BASE_W);
  const CW = isMobile
    // The phone grid: the card the derivation above settled on, columns then
    // gutter then card, capped by height.
    ? circular || strongBg
      ? gridNow!.cw
      : Math.round(CARD * 0.85)
    // Desktop: the card IS this figure, so the lifted layer's quarter is taken
    // here and nowhere else. See LIFT_CARD_SCALE. The phone branches above are
    // untouched, along with the column count they choose.
    : Math.round(CARD * (circular ? LIFT_CARD_SCALE : 1));
  /* THE CARD'S TYPE DOES NOT COME DOWN WITH THE CARD (owner, 18 September 2026).
     The lifted layer's card is a quarter smaller, and anything sized from CW
     would have shrunk with it. Type and labels are read, not drawn to scale, so
     they hold the size they had: this is the card width BEFORE the lift's
     quarter, and it is what the wording is measured against. Everywhere the card
     itself is drawn still uses CW.

     AND THE SAME ON THE PHONE, 18 September 2026, with the eight-column ladder.
     On a phone CW is not CARD at all, it is whatever the grid derives, so
     dividing the LIVE CW would have let the type follow the card down from 67 to
     47. It is measured against `gridType` instead: the card the OLD 6/5/4 ladder
     would have produced on this screen, so the wording is exactly the size it is
     today and only the card has moved. */
  const CW_TYPE = isMobile && (circular || strongBg) && gridType
    ? Math.round(gridType.cw / (circular ? LIFT_CARD_SCALE : 1))
    : Math.round(CW / (circular ? LIFT_CARD_SCALE : 1));
  /* ONE SOURCE, 18 September 2026 (owner). This used to repeat the whole ladder
     with a comment warning that the two derivations must agree exactly. It now
     reads the very same object CW was built from, so they cannot disagree at
     all. 0 off the phone grid, as before. */
  const fitCols = gridNow?.cols ?? 0;
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
  /* DIAGNOSTIC item 6: ?cornerdebug=1 measures the pit's own close square
     against this component's back button, so the corner can be SET from real
     numbers rather than guessed. The file history says two guesses at this went
     the wrong way. Polls twice a second because the square is redrawn every
     frame by the physics loop. REMOVE ONCE THE CORNER IS SET. */
  useEffect(() => {
    let d: HTMLDivElement | null = null;
    let t = 0;
    try {
      if (new URLSearchParams(window.location.search).get("cornerdebug") !== "1") return;
      d = document.createElement("div");
      d.style.cssText =
        "position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#000;color:#0f0;" +
        "font:11px/1.4 monospace;padding:6px 8px;pointer-events:none;white-space:pre-wrap";
      d.textContent = "corner debug: looking for the pit square";
      document.body.appendChild(d);
      const el = d;
      const tick = () => {
        const sq = document.querySelector('[data-ui-square="close"]') as SVGGraphicsElement | null;
        const btn = document.querySelector('button[aria-label="Back"]') as HTMLElement | null;
        if (!sq || !btn) { el.textContent = `waiting: square=${sq ? "yes" : "NO"} button=${btn ? "yes" : "NO"}`; return; }
        const s = sq.getBoundingClientRect(), b = btn.getBoundingClientRect();
        const vw = window.innerWidth;
        el.textContent =
          `vw ${Math.round(vw)} vh ${Math.round(window.innerHeight)}\n` +
          `square top ${s.top.toFixed(1)} right ${(vw - s.right).toFixed(1)} w ${s.width.toFixed(1)} h ${s.height.toFixed(1)}\n` +
          `button top ${b.top.toFixed(1)} right ${(vw - b.right).toFixed(1)} w ${b.width.toFixed(1)} h ${b.height.toFixed(1)}\n` +
          `SET top ${s.top.toFixed(1)}px right ${(vw - s.right).toFixed(1)}px size ${s.width.toFixed(1)}px`;
      };
      tick();
      t = window.setInterval(tick, 500);
    } catch {}
    return () => { try { if (t) window.clearInterval(t); if (d) d.remove(); } catch {} };
  }, []);
  /* DIAGNOSTIC item 8: the ?dropdebug=1 readout. Built imperatively, like the
     swipe debug bar in BreedTree, so no render of this component can clear it.
     REMOVE ONCE ITEM 8 IS FIXED. */
  useEffect(() => {
    let d: HTMLDivElement | null = null;
    try {
      if (new URLSearchParams(window.location.search).get("dropdebug") !== "1") return;
      d = document.createElement("div");
      d.style.cssText =
        "position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#000;color:#0f0;" +
        "font:10px/1.3 monospace;padding:5px 7px;pointer-events:none;white-space:pre-wrap";
      d.textContent = "drop debug ready: pick a card up";
      document.body.appendChild(d);
      DROP_DBG = d;
      DROP_DBG_LINES.length = 0;
    } catch {}
    return () => { try { if (d) d.remove(); } catch {} DROP_DBG = null; };
  }, []);
  // which collected card is showing its info label right now (toggled by tapping its i)
  // Every node radius in this component goes through here, so the mini pit's
  // smaller nodes cannot get out of step between layout and drawing.
  /* THE SCALE NOW REACHES THE CHUM TREE LAYER TOO, 16 September 2026 (owner: the
     nodes are not getting smaller however far the dial is turned).

     THIS WAS THE WHOLE PROBLEM. The scale was applied only when `circular` is
     true, which is the PIT LIFT. The chum tree layer is strongBg && !circular, so
     it used a scale of 1 and ignored the constant entirely. Four cuts of 15% that
     day all landed on the lift and none of them touched the layer being looked at.

     liftOrChum covers both, so PIT_NODE_SCALE now does on the chum tree what it
     always did on the lift. The MAIN PIT is still scale 1, which is correct: it
     draws the circles at full size and was never in scope.

     EXPECT A JUMP. The layer is going straight from 1 to 0.407, so the nodes drop
     to two fifths at once rather than by the 15% steps that appeared to do
     nothing. If that overshoots, this constant is finally the right dial to turn. */
  const liftOrChum = circular || strongBg;
  /* THE SHRINKING IS A PHONE MEASURE, 16 September 2026 (owner: put the desktop
     nodes back to normal size).

     PIT_NODE_SCALE and the spacing that follows it were cut four times in one day to
     fit a tree on a phone. They were never gated on width, so a desktop got the same
     0.659 and the same tightened connectors, which is why the nodes read as small
     there. isMobile is the gate the frame grid already uses for the same reason.

     Desktop returns to 1: full-size nodes, full RSTEP, full NODE_POKE. Nothing about
     the phone changes. */
  const nodeScaleK = liftOrChum && isMobile ? PIT_NODE_SCALE : 1;
  const nodeR = (share: number) => radius(share) * nodeScaleK;
  // The ring a node draws, HARD-CLAMPED so it is never thicker than the ring of
  // the circle it sits inside (the hierarchy rule). Recursive: each node caps to
  // its parent's already-clamped ring, so the cap holds all the way up the tree.
  // On this layer a child can be physically bigger than its parent, because a
  // radius is a share of leaves and not a nesting, so unlike the pit this
  // genuinely bites. The root's own ring is liftRingW, the real width of the big
  // card, so the rule is absolute at the root too rather than assumed away.
  /* FLAT WEIGHT ON EVERY NODE RING IN THE LEARN AREA, 16 September 2026 (owner).

     WHAT IT REPLACES, on this layer only. The ring was a FRACTION of each circle's
     own radius, from RING_FRAC, thinning by depth and clamped so a nested ring
     could never out-thicken its parent. That gave a different weight on every
     circle, which is what read as inconsistent: a big circle wore a thick ring and
     a small one a hairline.

     TWO RULES GO WITH IT, and both were deliberate, so this is recorded rather
     than quietly dropped. The fraction meant the ring scaled with the difficulty
     slider and the zoom, replacing a flat pixel count that was audited on a 390px
     phone and rejected. And the clamp enforced the owner's hierarchy rule, that a
     ring may never be thicker than the ring of the circle it sits inside. Neither
     survives a flat weight, by definition.

     4.8 IS THE CARDS' OWN FIGURE, set the same day on .pickCard, so the rings and
     the exposed images now read as one line weight across the layer.

     THE PIT LIFT AND THE MAIN PIT KEEP THE OLD RULE. strongBg && !circular is the
     chum tree layer alone, and neither of the others was asked for. */
  const FLAT_RING_W = 4.8;
  const clampedRingW = (n: Node): number => {
    const p = n._parent;
    if (!p) return liftRingW;
    if (strongBg && !circular) return FLAT_RING_W;
    let pd = 1;
    for (let a: Node | null = p; a; a = a._parent) pd += 1;
    const raw = nodeR(Math.round((n._leaves / p._leaves) * 100)) * ringFrac(pd);
    return Math.min(raw, clampedRingW(p));
  };
  /* ---- PILLS ON DEMAND, ON THE LIFT (owner, 18 September 2026) --------------
     WHICH node is showing its name, or null. One at a time, never several.

     WHY NO STANDING NAMES HERE. Measured: on a 390 phone the rings sit 60.7
     screen px apart on this layer, and "Old hunting dogs of the Celts" is 28
     characters, which nodePillWidth makes 235 layout units, 129 screen px once
     PIT_PILL_SCALE and LIFT_K are applied. A third of the screen for one name
     against 60.7px of gap. NO placement rule fits that, radial or parked above,
     which is why the four-candidate scorer was deleted, why the radial version
     that replaced it overlapped too, and why chasing a better rule was dropped.
     Taking the names off the resting screen removes the problem rather than
     laying it out around.

     ONE AT A TIME, and that is the whole safety property: a single pill cannot
     collide with another pill, so the entire class of fault goes rather than
     being reduced. It can still cross a badge or the root card, which the owner
     will judge separately now the names are out of the picture.

     THE LIFT ONLY. The learn area (strongBg) and the chum pages keep their
     standing names: they anchor the root at a fixed point with 542px of room
     above it, so their names fit and always did.

     THE BADGES ARE UNTOUCHED. Circles and percentages stay visible at rest. */
  const [namedNode, setNamedNode] = useState<string | null>(null);
  /* WHERE AND WHEN THE PRESS LANDED, for the tap-outside close. Kept apart from
     `drag`, which onPanDown abandons early when the grid is packed or the root is
     draggable: in those states drag.current is never set, so suppressClick never
     fires and the tap would have had no guards at all. This one is written before
     any of those returns. */
  const tapRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const [infoHover, setInfoHover] = useState<string | null>(null);
  const [pctHover, setPctHover] = useState<string | null>(null); // which card's % explainer box is open
  const pctTimer = useRef<number | null>(null); // closes the % box a beat after the cursor leaves /* pct-close */
  const pctClose = () => { if (pctTimer.current) window.clearTimeout(pctTimer.current); pctTimer.current = window.setTimeout(() => { setPctHover(null); pctTimer.current = null; }, 600); };
  const pctKeep = () => { if (pctTimer.current) { window.clearTimeout(pctTimer.current); pctTimer.current = null; } };
  /* THE % EXPLAINER'S OWN SIZE, measured after it renders rather than guessed.
     It has to be clamped to the screen, and its height depends on how many
     generations the breed lists, which is not knowable up front: maxWidth is 288
     but the box can be anywhere from about 120 to 500 tall. So it is drawn once,
     measured, and the clamp applies on the render after that. The first frame is
     drawn with the raw anchor, which is what it always did. */
  const pctBoxRef = useRef<HTMLDivElement>(null);
  const [pctSize, setPctSize] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    /* Measured in a rAF, not synchronously. Two reasons and both matter: the box
       has to have been laid out before it can be measured, and a synchronous
       setState inside an effect is a lint error in this file's config. */
    const id = requestAnimationFrame(() => {
      if (!pctHover) { setPctSize(null); return; }
      const el = pctBoxRef.current;
      if (!el) return;
      /* offsetWidth/offsetHeight, NOT getBoundingClientRect. The overlay carries a
         0.8 scale on the lift layers and the rect reports the SCALED size, while
         `left` and `top` below are written in the overlay's own unscaled space.
         The offset pair is unscaled, so the two agree with no correction. */
      setPctSize({ w: el.offsetWidth, h: el.offsetHeight });
    });
    return () => cancelAnimationFrame(id);
  }, [pctHover]);
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
  const [packed, setPacked] = useState(false);
  // The effect that released the pressed look when a step landed went with the
  // pressed look itself, 18 September 2026. See the note above learnDown's grave.
 // the ancestor pack has been ordered into its two columns
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
  /* THE AUTO SHORTCUT IS THERE FROM THE START, 16 September 2026 (owner: remove
     the delay, it should appear straight away). It used to arm 5s in, on the idea
     that a shortcut should not be offered before the player has tried. Initial
     state is true now and the timer below is gone; showAuto still hides it once
     every circle is seen, or while packing, collecting or removing, so it
     disappears when there is nothing left to shortcut. */
  /* WHAT AUTO CHARGES. Two flat figures, one per place, and NO PER-NODE CURVE
     ANYWHERE (owner, 18 September 2026).

     WHY NOT PER NODE, and this is the part to read before anyone adds one. AUTO
     does not pay for the nodes it opens: it calls setSeen and setPicked directly,
     never flashNum, which is the only route to onScore, and it then marks every
     node in scoredRef so they cannot be earned by hand afterwards either. So
     pressing AUTO already costs the player 500 A NODE in forfeited earnings. A
     per-node charge on top would be billing them twice for the same nodes, and it
     scales with exactly the thing they have already given up.

     THE FEE IS THEREFORE SMALL ON PURPOSE. The forfeit IS the price; this is a
     token on top so the shortcut is not free.

     TWO CONSTANTS, NOT ONE FORMULA. The learn area gets a whole tree, median 36
     nodes; a lifted circle gets one circle's subtree, median 1 and p95 19. One
     shared figure would be tuned for a 36-node tree and charged to a 1-node lift.
     500 is the learn area's, tuned deliberately on 16 September and left alone.

     250 IS THE LIFT'S, and half is the right half. On the commonest lift, a leaf
     at one node, the fee is half that node's own value, so AUTO on a leaf costs
     250 plus the 500 forfeited against the 500 tapping it would have paid: a clear
     but small loss for saving one tap. By p95, 19 nodes, the fee is 2.6% of the
     9,500 forfeited and on the biggest lift 0.24%, which is the design working:
     past the smallest trees the forfeit is the only cost that matters. */
  const AUTO_COST = 500;      // the learn area, a whole tree
  const AUTO_COST_LIFT = 250; // the play area's lift, one circle's subtree
  const [autoArmed, setAutoArmed] = useState(true);
  const [autoExposed, setAutoExposed] = useState<Set<string>>(new Set()); // nodes auto revealed; their leaf names stay hidden to cut clutter
  /* THE FLOATING CHARGE, and it now carries the FIGURE as well as the key.

     IT WAS LYING. The div was hard-coded "-2500" while autoCollect charged 500:
     the cost was cut on 16 September 2026 and the label it prints was not, so the
     player has been told a number five times what they were actually charged ever
     since. A literal in the markup cannot follow a cost that changes, so the
     charge itself rides in the state and the label prints what was taken. `v` is
     the signed value handed to onScore, so the two cannot disagree again. */
  const [penalty, setPenalty] = useState<{ k: number; v: number } | null>(null);
  const [idleHint, setIdleHint] = useState(false); // pulse the first ring of circles after 1s of no interaction
  const interacted = useRef(false);
  useEffect(() => {
    // Was: arm after 5s. Now armed from the start, so this only clears the penalty
    // flash when the lifted dog changes.
    setAutoArmed(true); setPenalty(null);
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
  /* HOW LONG A BURST LIVES, named because something else now has to wait for it.
     It was a literal inside burstAt alone. circularComplete holds the overlay open
     for exactly this long so the starburst finishes before the layer unmounts, and
     a second literal there would have been one edit away from a burst cut off
     mid-flight. One figure, two readers. */
  const BURST_LIFE_MS = 450;
  const burstAt = (x: number, y: number, s: number) => {
    const id = (fxId.current += 1);
    setBursts((b) => [...b, { id, x, y, s, born: performance.now() }]);
    window.setTimeout(() => setBursts((b) => b.filter((n) => n.id !== id)), BURST_LIFE_MS);
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
  /* WHICH NODES ARE COPIES AND ARE NOT DRAWN (owner, 18 September 2026).

     This file has never known about echoes or duplicate siblings, so it drew both:
     two identical Ancient Molossers in the learn area, and the empty rings in the
     Turnspit diagram. BreedTree has hidden them since the Celtic Heeler level. The
     rule now lives in data/lineageShape.ts and both files read it.

     BUILT ONCE PER TREE, as a set of _id, and applied at the RENDER ONLY. The nodes
     stay in `shown` and in the layout, exactly as BreedTree leaves them in the pack:
     the surviving circle keeps its size, its position and its share, and the copy's
     place is simply empty. Filtering them out of the layout instead would move the
     survivor, which is the one thing this must not do.

     INSTRUCTION TREES ARE EXEMPT, and they had to be. `Head outside` is a root whose
     only child is an echo of itself, and that echo carries go-outside-icon.svg. It is
     the single image in the whole archive carried only by a hidden node, so hiding it
     would delete the one frame those levels have. Six trees, gated by name. */
  const hiddenIds = useMemo(() => {
    const out = new Set<string>();
    if (!root || INSTR_NAMES.has(breed.name)) return out;
    const walkH = (n: Node) => {
      const kids = (n.children as Node[] | undefined) ?? [];
      kids.forEach((c, i) => {
        if (isHiddenCopyOf(c, kids.slice(0, i), n.name)) out.add(c._id);
        walkH(c);
      });
    };
    walkH(root);
    return out;
  }, [root, breed.name]);

  /* HIDDEN COPIES ARE NOT IN HERE, and that is the point (18 September 2026).
     autoCollect opens, sees and POPS A CARD for every entry, so leaving them in
     would pull 1,324 cards out of circles the player cannot see. Everything keyed
     off this list follows for free: totalNodes, showAuto's "everything seen" test
     and scoredRef. */
  const allNodes = useMemo(() => {
    const out: { id: string; hasKids: boolean; hasImg: boolean }[] = [];
    const walk = (n: Node) => (n.children as Node[] | undefined)?.forEach((k) => {
      if (!hiddenIds.has(k._id)) out.push({ id: k._id, hasKids: !!(k.children && k.children.length), hasImg: !!k.img });
      walk(k);
    });
    if (root) walk(root);
    return out;
  }, [root, hiddenIds]);
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
      if (k.img && !seenImg.has(k.img)) { seenImg.add(k.img); all.push({ name: k.name, img: packArt(k.name) ?? k.img, status: nodeStatus(k.name, k.note) }); }
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
      if (k.img) { const img = packArt(k.name) ?? k.img; m.set(img, (m.get(img) ?? 0) + 1); }
      walk(k);
    });
    if (root) walk(root);
    return m;
  }, [root]);
  // Stage 1: genetic-mix model. Walk the whole tree; each appearance of a breed
  // contributes its cumulative share (leaves / root leaves, which already honours
  // non-binary splits). Sum a breed's appearances, then normalise so every breed
  // totals 100% across the whole dog. /* breedMix */
  /* The influence percentages for this dog, by name, so breedMix can print the same
     figures the ancestry card does. Memoised on the breed alone: it is the whole
     tree's arithmetic and does not change as circles open. */
  const influenceByName = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of ancestralInfluence(breed.name)) m.set(r.name, r.pct);
    return m;
  }, [breed.name]);
  const breedMix = useMemo(() => {
    /* EACH APPEARANCE REMEMBERS WHICH SIDE OF THE FAMILY IT CAME DOWN,
       15 September 2026 (owner). The info box used to print one line per
       appearance, every one labelled only by generation, so a dog reached 32
       times gave 32 lines reading "As great-great-great-great-grandparent: <1%".
       That told the reader how far back it was and never which dog it came
       through, which is the thing the picture cannot show them.

       The branch is the DEPTH-1 ancestor the path descends from, so the box can
       group by it: "from Fox Terrier: 9%", "from Old English White Terrier: 6%".
       Measured on the Jack Russell in the owner's screenshot, that turns 32
       lines into 2, and the two still add to the headline figure. */
    // `name` added 16 September 2026: the influence lookup is keyed by name while
    // this map is keyed by image, so each appearance has to carry its own.
    type App = { depth: number; pct: number; branch: string; name: string };
    const apps = new Map<string, App[]>(); // breed key -> appearances
    const rootLeaves = root ? root._leaves : 0;
    const walk = (n: Node, depth: number, branch: string) => {
      (n.children as Node[] | undefined)?.forEach((k) => {
        // at depth 1 the child IS the branch; deeper down it inherits it
        const br = depth === 1 ? k.name : branch;
        if (k.img && rootLeaves > 0) {
          const key = packArt(k.name) ?? k.img;
          const pct = (k._leaves / rootLeaves) * 100; // cumulative contribution of this appearance
          const a = apps.get(key) || []; a.push({ depth, pct, branch: br, name: k.name }); apps.set(key, a);
        }
        walk(k, depth + 1, br);
      });
    };
    if (root) walk(root, 1, ""); // root's direct children are 1 generation back
    // raw sum per breed
    const sums = new Map<string, number>();
    apps.forEach((list, key) => sums.set(key, list.reduce((s, a) => s + a.pct, 0)));
    const total = [...sums.values()].reduce((s, v) => s + v, 0); // normalisation denominator
    const out = new Map<string, { apps: App[]; sum: number; norm: number }>();
    apps.forEach((list, key) => {
      const sum = sums.get(key) || 0;
      /* `norm` IS THE INFLUENCE FIGURE NOW, 16 September 2026 (owner: the ancestry
         card and the frame badges give contradictory percentages).

         WHAT IT WAS. Each ancestor's raw share divided by the SUM of every
         ancestor's share. On the Greyhound that sum is 160%, because ancestors nest
         and their shares overlap, so the badges read 46/38/17 while the ancestry
         card, which moved onto ancestralInfluence, read 45/40/15. Two models, two
         answers, on the same screen.

         That normalisation is the exact fault the percentage brief was written
         about: the denominator is not a total, so a dog's printed figure moves
         depending on how much of its own ancestry happens to be in the tree.

         The influence figure is keyed by NAME and this map is keyed by IMAGE, so
         the lookup goes through the appearance list's own name. Anything the model
         does not carry falls back to the old arithmetic rather than printing zero,
         which is what a dog with no image or no appearances would otherwise get. */
      const infl = influenceByName.get(list[0]?.name ?? "");
      const norm = infl !== undefined ? infl : (total > 0 ? (sum / total) * 100 : 0);
      out.set(key, { apps: [...list].sort((a, b) => a.depth - b.depth), sum, norm });
    });
    return out;
    // influenceByName is memoised on breed.name alone, so it is stable for as long
    // as root is; listing it keeps the rule satisfied without adding a recompute.
  }, [root, influenceByName]);
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
  /* WHICH card is in hand, 16 September 2026 (owner: the loose pile hides the
     frame you are aiming at). dragImg and dragName cannot tell two copies of the
     same dog apart, and the card being dragged is the one card that must stay
     visible while the rest fade, so it is tracked by id. */
  const [dragCardId, setDragCardId] = useState<string | null>(null);
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
      // BOUNDED (/chums2): lay out the WHOLE tree every render, regardless of `open`.
      // The layout is deterministic per node (parent + fixed slot), so every node gets
      // its final, stable position from the first render; the fitBox then fits the full
      // tree and never re-fits as branches open (the "no shifting" rule). `open` still
      // gates which nodes actually RENDER (see the two filters in the SVG), so branches
      // still reveal progressively and ACCUMULATE. The pit path is unchanged.
      const kids = (bounded || open.has(n._id)) && n.children && n.children.length ? (n.children as Node[]) : null;
      if (!kids) return;
      const cnt = kids.length;
      const spread = circular ? (depth === 0 ? SPREAD1 : Math.PI * 0.42) : depth === 0 ? SPREAD1 : SPREADN;
      // RSTEP scaled with the nodes on the lift and the chum tree, see NODE_POKE
      // below. RING1 is the root's own first ring and is left alone: it is
      // measured off ROOT, the card, which does not shrink.
      const rstep = RSTEP * (liftOrChum && isMobile ? PIT_NODE_SCALE * 0.9 : 1); // the same 0.9 as SPACING_K below
      /* THE FIRST RING CLEARS THE CARD IT COMES OFF, whichever card that is
         (owner, 18 September 2026). RING1 is ROOT + RING1_GAP and ROOT is the
         DEFAULT root radius, so it is right for every mode except the lift, whose
         root is liftR and is much bigger. The lift takes the same gap measured
         from its own card. liftR is declared well above this walk, so it is in
         scope here; RING1 is untouched and every other mode keeps it.

         WHAT IT MOVES. Only ring 1. Every deeper generation is placed relative to
         its PARENT, rOf(n) + rOf(k) + NODE_POKE on the clock path, so the tree
         translates outward rigidly rather than being compressed: the spacing
         between generations is unchanged. On a 390 phone the shift is
         liftR + 72 - 130, which is 27 layout units, 21.6 screen px. */
      const ring1 = circular ? liftR + RING1_GAP : RING1;
      const dist = depth === 0 ? ring1 : (INSTR_NAMES.has(breed.name) ? rstep * 1.2 : rstep);
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
      /* THE CLOCK FACE IS THE ROOT'S ONLY, FROM DEPTH 1 THE FAN FOLLOWS _dir,
         15 September 2026 (owner: the nodes still overlay each other awkwardly,
         though a proper fan clock layout does appear sometimes).

         WHAT WAS WRONG. This read `circular ? -Math.PI / 2 : ...`, so EVERY
         circular node at EVERY depth fanned its children straight up, regardless
         of where that node actually sat. On the first ring that is fine: there is
         one parent and the whole top semicircle is free. With two branches open,
         both push their children into the same upward corridor and they land on
         each other. That is why it looks clean when only one branch is open and a
         mess as soon as it is not.

         _dir is the direction the node itself sits at, so its children now fan
         AWAY from the centre and branches separate by construction. This is
         option A from the 10 September handover, which was agreed and never
         applied; what went in instead was the clock face, recorded there as
         option B and not agreed.

         THE ROOT NO LONGER KEEPS THE CLOCK FACE, 18 September 2026 (owner), and
         the note that said it did is replaced here rather than left to mislead.
         The clock put two first-layer branches 72 degrees apart in the top
         semicircle, and since each then fans 36 either side, exactly half that
         gap, the two met at depth 2 and interleaved below it. The LEARN AREA has
         never had that problem because it derives its first fan from SPREAD1, 270
         degrees, which puts two children 135 apart pointing away from each other.
         Depth 0 now uses that same derivation. Compared side by side in
         .scratch/learn-layout.png and .scratch/lift-overlap.png.

         THE TWO THINGS THE CLOCK WAS PROTECTING BOTH SURVIVE, checked rather than
         assumed:
           THE HOVER BUG, a child spawning straight up under the pointer as the
           parent opens. An even fan puts nothing at the centre; an ODD one does,
           so odd counts are rotated by half a step. Nothing sits at offset 0.
           CLEARING THE CARD. That was never the angles' doing: d2 is
           rOf(parent) + rOf(child) + NODE_POKE, measured from the root's own
           radius, so a first-layer child clears liftR EQUALLY AT EVERY ANGLE.
           Left and right clear exactly as well as up-left and up-right.

         AND THE LEARN BUTTON IS CLEAR, measured at the first ring's 109.5 units:
           2 children  (-101,-42) (101,-42)
           3 children  (-77,-77) (77,-77) (77,77)
           4 children  (-107,21) (-61,-91) (61,-91) (107,21)
         against a button box of x +/-76.5 and y 112 to 170. The lowest node any
         of these produces is at y 77, still 35 above the button's top edge.

         THE SLOT TABLE IS NOT DELETED. It still governs every depth BELOW the
         first, measured from the node's own direction. Only depth 0 changed.

         KNOWN: this does not fix convergence on its own, it moves it one
         generation deeper. Two branches 135 apart clear at depth 2, but their
         inner children are then 63 apart and a 36 fan on each overlaps by 9
         degrees at depth 3. The fix for that is a fan that narrows with depth,
         parked pending the owner looking at this first.

         KNOWN AND ACCEPTED: a deep child can now sit below the horizontal, which
         the clock face was partly written to avoid. That guarantee only ever
         mattered around the card itself. */
      let center = circular ? (depth === 0 ? -Math.PI / 2 : n._dir) : depth === 0 ? -Math.PI / 2 + base : n._dir;
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
      /* THE GAP FOLLOWS THE NODES NOW, 16 September 2026 (owner: the nodes got
         smaller but the connectors stayed the same length).

         rOf already scales with PIT_NODE_SCALE, but the daylight added to it did
         not: NODE_POKE was a flat 18 whatever the circles measured, so as the
         nodes shrank the gap became the dominant part of the distance and the
         tree stayed as spread out as ever. Scaling it keeps the same proportion
         of daylight to circle at any node size.

         THE SAME APPLIES TO RSTEP on the non-clock path below, which is a flat
         128. It is scaled at its use site for the same reason. */
      /* A SECOND DIAL FOR THE SPACING, 16 September 2026 (owner: nodes 10% smaller
         AND connectors 10% shorter). The two had become one control: the daylight
         and the ring step both scale with PIT_NODE_SCALE, so shrinking the nodes
         already shortened the connectors by the same 10%. SPACING_K takes the
         further 10% the owner asked for, and keeps the two separately tunable from
         here on. */
      const SPACING_K = 0.9;
      const NODE_POKE = 18 * (liftOrChum && isMobile ? PIT_NODE_SCALE * SPACING_K : 1);
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
        /* Depth 0 takes its ANGLES from the learn area's derived fan; everything
           below keeps the slot table. The distance and the tuck still read `clock`,
           so a first-layer child is placed exactly as far out as before and only
           its direction has moved. */
        const firstFan = clock && depth === 0;
        // Odd counts are rotated half a step so nothing sits straight up: see the
        // hover bug in the note above.
        const oddShift = firstFan && cnt % 2 === 1 ? step / 2 : 0;
        const a = firstFan ? center + (i - (cnt - 1) / 2) * step + oddShift : clock ? center + slots[i] : center + (i - (cnt - 1) / 2) * step;
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
    // SCALE IS SET ONCE, at mount, from the INITIAL depth-2 visible set, and never
    // changes: no grow, no re-fit on a click (the pit never rescales on a node click
    // either). `shown` carries the whole deterministic layout; here we frame only the
    // nodes visible at initialDepth (root, plus nodes whose parent is open at that
    // depth). Anything the user later reveals simply OVERDRAWS beyond this frame (the
    // page allows free overdraw). `open` is deliberately NOT read, so no expand can
    // change the frame: boundsOf(initOpen) is identical on every render.
    // D74 #1: the FRAME is fixed at the DEPTH-2 set (the signed-off resting size),
    // regardless of initialDepth. initialDepth (now 4) pre-expands deeper levels for the
    // RENDER, but those depth 3-4 nodes just overdraw beyond this depth-2 frame (like the
    // anti-diagram right-shift). Framing the depth-4 set is what shrank the tree.
    const FRAME_DEPTH = 2;
    const initOpen = openIdsToDepth(root, FRAME_DEPTH);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of shown) {
      if (n._parent && !initOpen.has((n._parent as Node)._id)) continue; // outside the depth-2 set
      minX = Math.min(minX, n._x); minY = Math.min(minY, n._y);
      maxX = Math.max(maxX, n._x); maxY = Math.max(maxY, n._y);
    }
    if (!isFinite(minX)) return null;
    const PAD = 120; // clears the largest node circle plus its name pill
    minX -= PAD; minY -= PAD; maxX += PAD; maxY += PAD;
    let w = maxX - minX, h = maxY - minY;
    // Grow the shorter axis to the container's aspect so meet-fit fills it and
    // centres the tree rather than leaving one axis heavily letterboxed.
    const aspect = vp.w / Math.max(1, vp.h);
    if (w / h < aspect) { const nw = h * aspect; minX -= (nw - w) / 2; w = nw; }
    else { const nh = w / aspect; minY -= (nh - h) / 2; h = nh; }
    return { x: minX, y: minY, w, h };
  }, [bounded, shown, vp.w, vp.h, root]); // D74 #1: frame is depth-2 fixed, initialDepth no longer read here

  // D73 #4: the bounded tree must NEVER overlay the circular diagram to its LEFT. It
  // lays out the WHOLE tree, so its leftmost node can sit left of the frozen fit frame
  // and overdraw into the diagram zone. Shift the CONTENT RIGHT (position only - the
  // scale/fitBox.w is untouched, per the mount-once rule) so the full tree's leftmost
  // extent sits at the region's left edge, which is already right of the diagram zone +
  // gutter. Computed from the FULL layout, so it is STABLE - expanding reveals nodes at
  // fixed positions, no per-click shift. Applied to the viewBox x below.
  const treeShiftX = useMemo(() => {
    if (!bounded || !fitBox || shown.length === 0) return 0;
    let minX = Infinity;
    for (const n of shown) if (n._x < minX) minX = n._x;
    return Math.max(0, fitBox.x - (minX - 120)); // 120 = the fitBox PAD (circle + name pill)
  }, [bounded, fitBox, shown]);

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
    // Before every early return below: see tapRef.
    tapRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
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
  const closeIfTap = (e: React.MouseEvent) => {
    // A pan that moved past 6px already set this, on the paths where onPanDown
    // ran to completion. The tap's own guards below cover the paths where it
    // did not.
    if (suppressClick.current) { suppressClick.current = false; return; }
    setInfoHover(null);
    const t = tapRef.current;
    tapRef.current = null;
    /* THE LIFTED LAYER ONLY. The chum tree keeps its X-button-only rule: the
       comment this replaces recorded that a stray tap there could wipe out a
       tree the player had spent a level building, and nothing about that has
       changed. A lifted circle has nothing to lose by closing. */
    if (!circular || !t) return;
    /* OUTSIDE MEANS THE BACKDROP ITSELF. e.target is the svg only when the tap
       landed on genuinely empty ground: any drawn thing, a card, a node, the root
       card, a button, a counter AND AN EMPTY FRAME CELL, is a descendant and is
       therefore inside. That is a stricter test than a geometric one and it needs
       no coordinates, which matters because this layer is drawn at LIFT_K and the
       frames are positioned pan-fixed, so a geometric test would have to unscale
       and un-pan to be right. */
    if (e.target !== e.currentTarget) return;
    if (performance.now() - t.t >= TAP_CLOSE_MS) return;
    if (Math.hypot(e.clientX - t.x, e.clientY - t.y) >= TAP_CLOSE_SLOP) return;
    /* THE SAME onClose THE BACK BUTTON CALLS, deliberately and not a teardown of
       its own. That handler clears `held` so the circle falls back into the pit
       and SPENDS a dog chain waiting on it; a second path that skipped it would
       leave the chain pointing at a circle that is back in play. */
    onClose?.();
  };

  // long names wrap to a second line via the shared splitName (see ./splitName):
  // the pill grows in depth, the corner radius stays fixed so the shape holds.
  const tagLines = circular ? splitName(breed.name) : [breed.name];
  const tagW = Math.max(...tagLines.map((l) => l.length)) * 9.5 + 28 + (tagLines.length > 1 ? 14 : 0);
  const tagH = tagLines.length > 1 ? 60 : 32;
  /* pillPlacement IS DELETED, 18 September 2026 (owner), with the standing names
     it existed to arrange. It placed each lifted node's pill radially along the
     node's own slot direction, and before that a four-candidate scorer weighed
     the card, the nodes, the pills, the connectors and the viewport. Both were
     attempts to fit 129px of name into a 60.7px gap, which no rule can do. With
     one name on screen at a time there is nothing to arrange: the pill sits above
     its node, as it does in every other mode.

     WALL_PAD goes with its only remaining reader here. Its other user, the
     single-child wall swing above, still compares layout units against screen
     pixels and is flagged in that block rather than changed. */
  /* PRE-COMPENSATING FOR THE LAYER'S 0.8 SCALE, 2 September 2026 (owner).

     THE PROBLEM. The overlay carries transform: scale(0.8), and a scale
     multiplies the distance from the element's CENTRE, not from its edge. So
     every coordinate near an edge is pulled a tenth of the viewport inwards: the
     frame grid was written to start 14px from the left and was landing at 52.6,
     and the rows were written at 111 and were landing far lower.

     THE FIX, AND WHAT IT COSTS. These two helpers invert the scale, so a value
     passed through them LANDS where it is written. That is why F_LEFT now comes
     out NEGATIVE on a phone: to appear 31.6 from the edge, the column has to
     start about 12px off screen before the scale pulls it back in. The number
     looks wrong in isolation and is correct on screen.

     IT IS TIED TO THE 0.8. Change the overlay's scale and every figure derived
     from these is wrong, silently, because nothing here can see that transform.
     The clean fix is to take the frames out of the scaled element the way the
     back button and the counters were; this is the cheap one, chosen knowingly.

     Identity off the lift, so the main pit and the chums2 tree are untouched. */
  const LIFT_K = (circular || strongBg) && !bounded ? 0.8 : 1;
  const unscaleX = (x: number) => vp.w / 2 + (x - vp.w / 2) / LIFT_K;
  const unscaleY = (y: number) => vp.h / 2 + (y - vp.h / 2) / LIFT_K;
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
  /* 5 -> 6 ACROSS, 16 September 2026 (owner). fitCol below already divides the
     available width by MCOLS - 1, so the columns narrow to suit on their own and
     nothing else has to be re-measured; F_COL's own floor of CW + 6 stops them
     overlapping if the screen is too narrow to hold six. */
  /* THE COLUMN COUNT COMES FROM THE FIT NOW, 16 September 2026 (owner). It was a
     flat 6, and before that a flat 5, neither of which asked whether six would
     actually fit. fitCols answers that with the same three rules CW is derived
     from, so the grid and the cards cannot disagree: six on a tablet, five on most
     phones, four on a 320. */
  const MCOLS = fiveUp ? fitCols : 4; // phones: one continuous grid, this many wide before it wraps
  // F_EDGE moved up beside F_GUT_MIN, 16 September 2026: CW's derivation reads it,
  // and CW is declared far earlier. One definition, used by both.
  // LIFT_K, unscaleX and unscaleY are declared a little above, where the deleted
  // pillPlacement used to sit. Everything below still reads them unchanged.
  /* The level's own profile portrait sits at --pit-axis less half of --tp:
     51.8 - 20.16 = 31.6 on a phone. The frame column's LEFT EDGE lines up with
     it, so F_LEFT, which is the first column's CENTRE, is that plus half a card. */
  // PORTRAIT_LEFT is gone, 16 September 2026: the grid anchored to the level
  // portrait's left edge, and now anchors to the screen margin the column widths
  // are calculated from. Nothing else read it.
  /* 20px LEFT on the lifted layers, 16 September 2026 (owner). The nudge is inside
     unscaleX's result rather than applied to it, so it is a true 20 screen pixels
     whatever the layer's scale. */
  /* FROM THE SCREEN'S OWN MARGIN, 16 September 2026 (owner). It started at the
     level portrait's left edge, which is where the old narrower grid was anchored;
     with the columns now sized to fill the width, the grid has to begin at the same
     F_EDGE its width was calculated from or it runs off the right. unscaleX puts
     that screen position back into the layout's own coordinates. */
  const F_LEFT_BASE = fiveUp ? unscaleX(F_EDGE) + CW / 2 : isMobile ? 52 : 96;
  // On a circle the rim at 45 degrees sits this far in from the bounding box, so
  // corner adornments tuck against the edge instead of floating outside it.
  const RIM_IN = (CW / 2) * (1 - Math.SQRT1_2);
  // the widest pitch that still lands the last column inside the right margin,
  // never tighter than a 6px gutter and never looser than 76
  // fitCol is gone, 16 September 2026: it divided the leftover width between the
  // columns, which is the job CW's own derivation now does. Nothing read it after
  // F_COL stopped clamping against it.
  /* CARD PLUS GUTTER, 16 September 2026 (owner), rather than a cap of 76 and a
     floor of CW + 6. CW is now sized so the columns reach both edges, so the pitch
     is simply the card plus the gutter it was derived with; the old min/max pair
     fought that and produced the collapsed gutter. */
  const F_COL = fiveUp
    /* THE GUTTER TAKES THE LEFTOVER, UP TO A POINT, 16 September 2026 (owner: an
       awkward gap down the right side, only on the dogs with a huge number of
       frames).

       WHY ONLY THOSE. F_GUT_WANT was a ceiling of 10. When the card is sized by
       width alone it fills the row and there is no leftover, so the ceiling never
       showed, which is why every shallow dog looked right. The height cap added the
       same day pulls the card BELOW its width-filling size on a deep dog, 67 down to
       61 on a 390 screen, and the freed 29px had nowhere to go: it pooled on the
       right.

       F_GUT_MAX, NOT NO CEILING AT ALL. Removing the cap outright was the first fix
       and it was wrong: on a 768 tablet the Jackapoo's gutter went to 89px, trading
       one gap for five. 24 fills a phone exactly, 17 on a 390 and 20 on a 430, and
       stops the tablet case spreading. Whatever is still over after that is centred
       by F_LEFT below rather than left on one side. */
    ? CW + Math.max(F_GUT_MIN, Math.min(F_GUT_MAX, Math.floor(((vp.w - 2 * F_EDGE) / LIFT_K - MCOLS * CW) / Math.max(1, MCOLS - 1))))
    : circular ? CW + 3 : isMobile ? 92 : 112;
  /* CENTRED WHEN THE ROW CANNOT FILL, 16 September 2026 (owner). Once the gutter has
     taken what it can, up to F_GUT_MAX, any remaining slack is split evenly instead
     of sitting on the right. On a phone that is a pixel or none; on a tablet holding
     a height-capped deep dog it is the 130px each side that stops the grid hugging
     the left edge. Declared here rather than with F_LEFT_BASE because it needs
     F_COL, which needs CW. */
  const F_SLACK = fiveUp
    ? Math.max(0, ((vp.w - 2 * F_EDGE) / LIFT_K - (MCOLS * CW + (MCOLS - 1) * (F_COL - CW))) / 2)
    : 0;
  const F_LEFT = F_LEFT_BASE + F_SLACK;
  const F_ROW = fiveUp ? F_COL : circular ? CW + 3 : isMobile ? 92 : 112;
  const fCols = Math.max(2, Math.min(7, Math.floor((vp.w - 120) / F_COL)));
  // Tucked under the X/XX counter, which sits at top 26 and is about 32 tall.
  // 111 is unchanged as the INTENDED top; unscaleY is what makes it land there
  // again now the layer is scaled. See the note by F_LEFT.
  /* 20px UP, 16 September 2026 (owner): the intended top goes 111 -> 91, inside
     unscaleY for the same reason as F_LEFT above. The frame counter moved up and
     left earlier the same day, so the grid is following it rather than crowding
     it. */
  const chumTop = fiveUp ? unscaleY(91) : circular ? (isMobile ? 118 : 168) : isMobile ? 170 : 240; // 96, down 15 to clear the top-right button
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
      const img = packArt(name) ?? rawImg; // pack breeds flip to their square cartoon card
      const share = live ? Math.round((live._leaves / (live._parent as Node)._leaves) * 100) : snap?.share ?? 0;
      // cumulative share of the whole breed: a node's leaves over the root's leaves,
      // which is the product of every parent share down the chain
      const mix = live ? (root ? Math.round((live._leaves / root._leaves) * 100) : share) : (snap?.mix ?? snap?.share ?? 0);
      const status = live ? nodeStatus(live.name, live.note) : snap?.status ?? null;
      const note = live?.note ?? snap?.note ?? "";
      /* THE CARD SITS ON ITS NODE (owner, 18 September 2026), centred exactly,
         rather than springing out beside it.

         WHAT IT WAS. `d` was nodeR(share) + 10 + CW/2, pushed along the node's own
         slot direction _dir, so the card's near edge landed ten pixels off the
         node's rim. Deliberate, and the whole design of the element: the node was
         the source and the card the thing you carried, kept clear so the node
         stayed readable underneath. On the clock layout _dir points outward from
         the parent, which is why every card read as sitting up and to one side of
         the disc it belonged to.

         THE SOLO BRANCH GOES WITH IT. soloOff was liftR * 0.72 and existed for one
         reason, that a dog with no node to pop from would otherwise "hide dead
         centre". Centring is now what is wanted, so that reasoning is dead and the
         solo card centres on the big circle like every other card centres on its
         node.

         TWO COSTS, BOTH ACCEPTED BY THE OWNER RATHER THAN OVERLOOKED:
           THE PERCENTAGE IS COVERED on every picked node. The cards are drawn
           after the nodes, so a centred card covers its node's disc, ring and %
           together, and on a very common dog that is most of the tree.
           IT IS NOT LOST TO THE PLAYER, AND THIS IS THE REASON THE COST IS
           ACCEPTABLE: the figure is on screen BEFORE the card appears, which is
           the whole time the player is reading the tree and deciding what to
           open, and it is on screen AGAIN when the chip drops into the pit. The
           card covers it only for the span between those two, when the thing in
           hand is the portrait rather than the share. Do not revert this on the
           grounds that a number went missing: it did not, it is bracketed.
           THE BIGGEST NODES ARE NOT COVERED. CW is grid-derived, 47 on a 390
           phone, so a half-width of 23.5 against a node radius that runs from 13.8
           at the floor to about 33 at full share. It engulfs the small ones and
           sits inside the large ones, leaving a rim of disc showing round a square
           portrait. Making it always cover would mean sizing the card from the
           node rather than the grid, and CW also sizes the frames it drops into.

         dragPos and cardFrame still override below, so dragging and framing are
         untouched. */
      const baseX = soloLeaf ? breed.x : live ? live._x : 0;
      const baseY = soloLeaf ? breed.y : live ? live._y : 0;
      const pos = dragPos.get(id);
      /* THE CARD IS THE SIZE OF THE NODE IT CAME FROM (owner, 18 September 2026),
         scaled so the largest possible node maps to CW and everything below it
         comes down in proportion.

         NO FLOOR AND NO CLAMP, chosen rather than overlooked. nodeR bottoms out at
         radius()'s own floor of 21, which is 13.84 after PIT_NODE_SCALE on a
         phone, against 32.95 at full share. So on a 390 phone the SMALLEST CARD IS
         ABOUT 20px and every share at or below 10% draws at exactly that, because
         they all sit on radius()'s floor. 20px is half a fingertip and well under
         the usual 44px touch target; the owner has taken that deliberately, on the
         grounds that a 10% dog giving a tiny card is the point.

         IT GROWS TO THE FRAME ON LANDING, so this only ever describes a loose
         card: see cardScale at the draw site. */
      /* Sized to COVER the node rather than to match it: its radius, plus the half
         of the ring that sits outside it, plus CARD_COVER_MARGIN. Expressed as a
         scale because the whole card group is drawn at CW and scaled as one; see
         the draw site. A framed card is still exactly CW. */
      const cardScale = live ? ((2 * nodeR(share) * CARD_COVER) / CW) : 1;
      const ff = cardFrame.get(id);
      const cardX = ff ? ff.sx - pan.x : (pos ? pos.x : baseX);
      const cardY = ff ? ff.sy - pan.y : (pos ? pos.y : baseY);
      /* THE RING WEIGHT OF THE NODE THIS CARD CAME OUT OF, item 12, 9 Sept
         2026 (owner). .pickCard is a flat stroke-width 5; the circle it popped
         from carries clampedRingW, the pit's fraction-of-radius rule with the
         hierarchy clamp already applied. Measured here, where the live node is
         already in hand, rather than at the draw site. A pinned card whose
         branch has closed has no node left to measure and keeps the flat 5. */
      let ringW: number | null = null;
      if (live) {
        // Depth for the RING_FRAC table: the node's own generation in this tree.
        let pd = 1;
        for (let a: Node | null = live._parent as Node | null; a; a = a._parent as Node | null) pd += 1;
        // The node's raw ring, the same expression clampedRingW starts from. The
        // hierarchy clamp is deliberately NOT applied: it exists so a ring is
        // never thicker than the ring of the circle it sits INSIDE, and a card
        // in your hand sits inside nothing.
        ringW = nodeR(share) * ringFrac(pd);
      }
      return { id, img, name, note, share, mix, status, cardX, cardY, ringW, cardScale };
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
  /* EVERY COPY OF THIS PICTURE IS HOME, 16 September 2026 (owner: a card should turn
     green only once all of its duplicates are placed too, not on the first one).

     dupTotal is how many cards carry this image. Counting how many of them are in a
     frame, stacked on one, or folded out by the pack tells us whether the dog is
     finished. A single-appearance dog reaches this the moment it lands, which is the
     owner's "if there's only one image then they go instantly green".

     A SET BUILT ONCE, not a function called per card. The per-card version walked
     pickCards for every card drawn, and eslint's purity rule followed the new call
     path into tween's performance.now and raised this file's error count. One pass
     over the cards costs less and keeps the baseline. */
  const imagesAllHome = (() => {
    /* CORRECTED 16 September 2026, same day: this counted against c.img while
       dupTotal is keyed by PACK_IMG.get(name) ?? img, the pack artwork wherever a
       dog has one. For every pack breed the two keys differ, so the lookup returned
       nothing, `n >= 0` was never satisfied for the right image and not one card
       went green. The counting key now matches dupTotal's exactly.

       isDupImg and the stacking logic use c.img directly and are unaffected: they
       ask whether THIS picture repeats, not how many of a dog exist. */
    const keyOf = (c: { name: string; img: string }) => packArt(c.name) ?? c.img;
    const home = new Map<string, number>();
    for (const c of pickCards) {
      if (placedSet.has(c.id) || stackedIds.has(c.id) || packHidden.has(c.id)) {
        const k = keyOf(c);
        home.set(k, (home.get(k) ?? 0) + 1);
      }
    }
    const done = new Set<string>();
    for (const [img, n] of home) { const total = dupTotal.get(img) ?? 0; if (total > 0 && n >= total) done.add(img); }
    return done;
  })();
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
  /* THE ONE FLAG THE RING STACK READS (owner, 18 September 2026).

     WHY IT EXISTS. Three separate elements are drawn on top of one another at the
     lifted circle's rim, and all three have independently needed to know that the
     dog is finished. They were fixed one at a time, a week apart, each time
     because the one above it was still writing its own colour and burying the
     one below:
       1. the root card's ring, which has read the pair since 16 September
       2. the crisp rarity ring, fixed on 18 September, which is six pixels wider
          and had been covering layer 1 since the rarity work shipped
       3. the progress arc, fixed in this commit, which is the SAME radius and
          width as layer 2 and had been covering both since 9 September
     Audited at the same time: those three are the whole stack. rootRingW appears
     nowhere else, and the only other hard-coded colour in the region belongs to
     the instruction card's inner rect, which is not on this ring.

     SO THE NEXT ELEMENT ADDED HERE HAS ONE OBVIOUS THING TO READ instead of a
     hex to hard-code, which is the only way this stops happening. `packed` is in
     it because packing the cards away is the other way to finish, and a layer
     that took framesDone alone would disagree with the two that do not. */
  const doneRing = framesDone || packed;
  /* THE TREE STEPS BACK ONCE EVERY FRAME IS FILLED, 16 September 2026 (owner:
     after all the images are placed and the Learn button has gone, fade the tree
     nodes out and leave the central chum square, so the framed images and their
     icons are what the player is looking at).

     framesDone is the game's own "every frame filled" flag, declared further
     down and used for the Collect button, so this reads the same condition the
     Learn button disappears on rather than inventing a second one.

     SAME GATE AS dragFocus: strongBg && !circular is the chum tree layer alone.
     The pit lift and the main pit share this component and neither was asked for.

     It rides the group that dragFocus already fades, so it inherits the 0.12s
     DRAG_FADE and the pointerEvents none with it, which matters: an invisible
     tree that still swallowed taps would block the frames underneath. */
  /* CORRECTED 16 September 2026 (owner: the tree disappears before all the images
     are placed).

     framesDone only asks whether every FRAME is filled, and a frame is one per
     distinct picture. A dog that appears several times has one frame and several
     cards, and the duplicates are stacked on the filled frame rather than framed
     themselves. So on a level with duplicates the tree vanished with cards still
     in hand.

     EVERY CARD ACCOUNTED FOR is the real condition: each pickCard is either in a
     frame (placedSet), stacked on one (stackedIds) or hidden as a pack duplicate
     (packHidden). When none are left loose, there is nothing more to place. */
  const cardsAllPlaced =
    pickCards.length > 0 &&
    pickCards.every((c) => placedSet.has(c.id) || stackedIds.has(c.id) || packHidden.has(c.id));
  const treeDone = strongBg && !circular && framesDone && cardsAllPlaced;

  /* THE RUNNING-DOG PROGRESS BAR, 16 September 2026 (owner: a bar along the bottom
     showing how much has been exposed and placed, like the Argos article's).

     NOT A NEW COMPONENT. ReadingProgress is the Argos bar, and it already takes a
     controlled `progress` percentage and an `active` flag for the walk cycle,
     exactly as PressCarousel drives it from a carousel position. This feeds it from
     the layer's own state instead of scroll.

     BOTH HALVES OF THE JOB, WEIGHTED EVENLY. Exposing circles and placing cards are
     the two things the player does, and one can be finished while the other has not
     started, so the bar is their mean rather than either alone. A level with no
     frames falls back to the circles, or an empty denominator would read as done.

     THE DOG RUNS WHILE THERE IS WORK LEFT, and stands still once the bar is full.
     PressCarousel runs its dog for a beat after each move using a state flag and a
     450ms timer; that pattern needs setState inside an effect, and this file's
     eslint baseline is held at its current count, so the derived version is used
     instead. It costs the little pause between actions and gains no new lint. */
  /* CORRECTED 16 September 2026 (owner: the bar reaches the end before the
     duplicates are placed).

     THE PLACEMENT HALF COUNTED FRAMES, filled.size / frameTotal, and there is one
     frame per DISTINCT picture. A dog reached by several routes has one frame and
     several cards, and the duplicates stack onto that already-filled frame, so the
     frame counter reads full with a pile still in hand. On the Doberman that is 20
     frames against 51 cards.

     IT COUNTS CARDS NOW, and against the total the tree WILL produce rather than
     the cards popped so far: allNodes carries hasImg for every node in the whole
     tree, open branch or not, so the denominator does not grow under the player as
     they expose more. Counting only the cards on screen would have the bar hit 100
     early for a second reason. The numerator is the same test cardsAllPlaced uses,
     so the bar and the tree fade agree on what finished means. */
  const totalCards = useMemo(() => allNodes.filter((n) => n.hasImg).length, [allNodes]);
  const cardsDone = pickCards.filter((c) => placedSet.has(c.id) || stackedIds.has(c.id) || packHidden.has(c.id)).length;
  const exposedFrac = totalNodes > 0 ? Math.min(1, seen.size / totalNodes) : 1;
  const placedFrac = totalCards > 0 ? Math.min(1, cardsDone / totalCards) : exposedFrac;
  const learnProgress = Math.round(((exposedFrac + placedFrac) / 2) * 100);
  const dogRunning = learnProgress < 100;
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
        /* THE WIDTH IS SENT AT THE SIZE IT IS DRAWN, 16 September 2026 (owner: the
           pills that drop into the pit are about 40% bigger than the ones on the
           family tree).

           nodePillWidth is the UNSCALED width. The tree then draws the pill inside a
           group at PIT_PILL_SCALE, but the pit takes this number literally and builds
           a body from it, so the pill grew by 1 / 0.683, about 46%, on the way across.
           Scaling it here means the pill that lands is the pill that left. */
        return { x: n._x + pan.x, y: n._y - nodeR(share) - 13 + pan.y, w: nodePillWidth(splitName(n.name)) * PIT_PILL_SCALE, name: n.name };
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
  /* Green Complete pressed: the layer stops drawing the tree and everything drops
     into the pit.

     THE HANDOVER WAS NEVER ZERO-LAG, AND THIS NOTE USED TO SAY IT WAS (owner,
     18 September 2026). The scatter, the burst and the big circle going were
     always immediate, so the layer LOOKED handed over at once. The removal was
     not: onRemove and onClose sat together on a single 900ms setTimeout, so the
     circle the player opened stayed in the pit, a real owned body, for most of a
     second after the button was pressed. The 900 appears to be what the confetti
     needed, and the confetti was deleted on 31 August 2026 while its timer was
     not: the only thing left on that side with a duration of its own is the
     starburst, at BURST_LIFE_MS, half of it.

     THE TWO ARE SPLIT NOW. onRemove fires on the press, synchronously, which is
     what takes the circle out of the pit and carries the rest of the step with it:
     the chain closing its other circles, the chips dropping from the opened
     circle's bridge, and the round-won test that has to come after both. Only
     onClose still waits, and only for the burst.

     WHAT THAT CHANGES, recorded because it was accepted rather than missed: the
     round-won test can now fire up to BURST_LIFE_MS before the overlay unmounts,
     so a win screen may appear under a lifted layer that is still on top. The
     owner has it to look at. The fallbacks, if it reads badly, are to close on the
     press as well and lose the starburst, or to fire the burst through the pit's
     own fx layer, which survives the close. */
  const circularComplete = () => {
    if (circularDoneRef.current) return;
    circularDoneRef.current = true;
    emitCircularScatter(true);
    setScattered(true);
    burstAt(breed.x, breed.y, circR * 1.33);
    setRootGone(true);
    // THE CIRCLE GOES ON THE PRESS. Before the close, and in the same order it
    // always ran in: the scatter above has already landed its chips and rods.
    onRemove?.(breed.name);
    /* CONFETTI REMOVED 31 August 2026 (Steve). 150 particles on a fixed
       full-screen canvas for about two seconds. This one was worse than the
       LineageModal burst because this overlay opens OVER A LIVE ROUND, so it
       took frames from the pit while the pit was still running. See the fuller
       note in LineageModal.tsx. */
    // The overlay holds only for the starburst it just fired, nothing more.
    window.setTimeout(() => { onClose(); }, BURST_LIFE_MS);
  };
  // Solo dog: there is no node to turn green and no Complete button to press,
  // so landing the image in its frame IS the completion. circularComplete does
  // the rest, which is what the green button has always called: scatter into the
  // pit, burst the big circle, remove and close. (Confetti removed, 31 Aug 2026.)
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
  /* Bumped by the stall guard in autoCollect so the finishing effect below re-runs
     even when `picked` never changes. The ref beside it says WHY it re-ran: the
     tick alone cannot, because it only ever counts up, so testing it against zero
     would disable the popping check for every AUTO after the first. */
  const [autoPlaceTick, setAutoPlaceTick] = useState(0);
  const autoForceRef = useRef(false);
  const autoCollect = () => {
    /* THE BRANCHES UNFOLD IN A WAVE, 16 September 2026 (owner: AUTO opens every
       layer in one go and should ripple out a rung at a time, like the images
       already do).

       WHAT IT WAS. One setOpen call added every branch at once, so the whole tree
       appeared in a single frame while the circles turning blue and the cards
       popping rippled behind it at 45ms apart. The wave was already here; the
       unfolding was not part of it.

       BY DEPTH, NOT BY INDEX. The nodes are walked in tree order, so an index
       ripple would open a deep branch before its neighbour's parent. Grouping by
       depth opens a whole rung together and the next rung 90ms later, which is the
       wave the owner is describing, and a rung cannot arrive before the rung it
       hangs off.

       90ms against the 45ms used below on purpose: the rungs are few and the nodes
       many, so the same step would make the unfolding outrun the ripple. */
    const depthOf = new Map<string, number>();
    const markDepth = (n: Node, d: number) => (n.children as Node[] | undefined)?.forEach((k) => { depthOf.set(k._id, d); markDepth(k, d + 1); });
    if (root) markDepth(root, 1);
    const branchIds = allNodes.filter((n) => n.hasKids).map((n) => n.id);
    const rungs = [...new Set(branchIds.map((id) => depthOf.get(id) ?? 1))].sort((a, b) => a - b);
    setOpen(new Set<string>(["0"]));
    rungs.forEach((d, i) => {
      window.setTimeout(() => setOpen((prev) => {
        const s = new Set(prev);
        branchIds.forEach((id) => { if ((depthOf.get(id) ?? 1) === d) s.add(id); });
        return s;
      }), i * 90);
    });
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
    /* THE SEQUENCE CANNOT STALL WAITING FOR A CHANGE THAT NEVER COMES,
       16 September 2026 (owner: AUTO sometimes stops part-way and the Learn and
       Collect have to be pressed by hand).

       THE DEAD END. autoPlaceRef is a flag, and the only thing that acts on it is
       an effect keyed on `picked`. If every image node is ALREADY picked when AUTO
       is pressed, which happens whenever the player has popped the cards by hand
       first, imgNodes is empty, not one setPicked runs, `picked` never changes, the
       effect never fires and the flag sits true for the rest of the round. AUTO
       looks like it did nothing and the buttons have to be used manually.

       TWO GUARDS. If there is nothing left to pop, the placement is run directly on
       the next tick rather than flagged. And a backstop timer, sized to the ripple
       plus a margin, runs it anyway if the effect has not: 45ms a node is 10
       seconds on a 229-node dog, so the wait is derived rather than a flat number.
       Both check the flag before acting, so whichever gets there first wins and the
       other does nothing. */
    autoPlaceRef.current = true;
    autoForceRef.current = false; // a fresh run waits for the ripple again
    const rippleMs = allNodes.length * 45;
    // Both guards nudge the SAME effect that already finishes the sequence rather
    // than calling the placement themselves: one caller, one place to reason about.
    // Nothing to pop means fire on the next tick; otherwise wait out the ripple.
    window.setTimeout(() => { autoForceRef.current = true; setAutoPlaceTick((t) => t + 1); }, imgNodes.length === 0 ? 0 : rippleMs + 600);
    /* WAS -2500, 16 September 2026 (owner). The whole learn-area scale was
       rebalanced that day to reward thoroughness: awards now run into the tens of
       thousands on a deep dog, so a 2500 penalty read as ruinous.
       Charged ONCE, into a local, so the score and the label are the same number
       by construction rather than by two places agreeing. */
    const charge = -(circular ? AUTO_COST_LIFT : AUTO_COST);
    onScore?.(charge);
    const pk = (fxId.current += 1);
    setPenalty({ k: pk, v: charge });
    window.setTimeout(() => setPenalty((cur) => (cur && cur.k === pk ? null : cur)), 1000);
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
          flashNum(target.sx - pan.x, target.sy - pan.y - CW / 2, -5, FLASH_SIZE /* 16 Sept 2026 (owner), learn-area rebalance: see the table at the top of the flashNum group. */);
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
    // The backstop tick means "stop waiting", so it overrides the popping check;
    // without that, a node that never pops would hold the sequence open for ever.
    const stillPopping = allNodes.some((n) => n.hasImg && !picked.has(n.id));
    if (stillPopping && !autoForceRef.current) return;
    autoForceRef.current = false;
    autoPlaceRef.current = false;
    placeAllUnplaced();
    /* AND ON THE PLAY LIFT, AUTO FINISHES THE JOB (owner, 18 September 2026).

       PLAY AREA ONLY. `circular` is the lift; the learn area keeps what it had, so
       AUTO there still leaves Complete to the player. One flag, no second path.

       AT THE END OF THE RIPPLE, NOT AT THE PRESS, and that is the whole reason it
       is here rather than inside autoCollect. circularComplete does not check
       whether anything is open or placed: it scatters WHATEVER STATE THE TREE IS
       IN. Fired on the press you would get a tap and then the pit, with no wave, no
       cards and no reveal, which is a skip rather than a shortcut. Here it runs
       after placeAllUnplaced on the same beat the placement already waited for, so
       the wave plays out, the cards land in their frames, and then it completes:
       about 2.4 seconds on a forty node dog, which reads as watching it done for
       you.

       NOTHING IN circularComplete ASSUMES A HUMAN PRESS. It takes no event and
       reads no pointer state, circularDoneRef guards re-entry, and the solo leaf
       path has been calling it from a setTimeout since it was written.

       THE FLARE AND THE CHAIN ARE UNAFFECTED. The 250ms completion flare fires in
       BreedTree before the lift ever opens, so it is upstream of this. The chain
       closing its other circles hangs off onRemove, which circularComplete calls
       synchronously, so it behaves identically whichever pressed it.

       THE CONSEQUENCE, CHOSEN KNOWINGLY AND NOT OVERLOOKED. autoArmed resets on
       every new lift, so ONE TAP PER LIFT MEANS ONE TAP PER CIRCLE: a twenty circle
       level is twenty taps to clear. The owner has played it and wants it. If it
       ever needs capping the lever is autoArmed, arming once per level or once
       every few lifts, NOT the cost: AUTO already forfeits 500 a node in earnings
       it never pays, so raising AUTO_COST_LIFT would bill the deep dogs twice. */
    if (circular) circularComplete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked, autoPlaceTick]);

  // Double-clicking the root card walks the tree open one generation at a time,
  // then once everything is exposed folds it back deepest-first. Rings only: any
  // cards already pulled out stay put. Auto-revealed nodes score +50 each, less
  // than a manual tap (125/250) so hand-exploration stays the rewarding route.
  const revealStep = () => {
    // NO LONGER REFUSED WHILE A STEP RUNS (owner, 18 September 2026): the wait
    // before the button could be pressed again has gone with its pressed look.
    // Each call advances one rung from the CURRENT open, picked and packed
    // state, so pressing through an animation hurries the layer along rather
    // than repeating or corrupting a step.
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
      pops.forEach((p) => flashNum(p.x, p.y, -10, FLASH_SIZE) /* 16 Sept 2026 (owner), learn-area rebalance: see the table at the top of the flashNum group. */);
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
    // /chums2 (hideLeafImages, D73 #5): images NEVER appear in this hosting. The single
    // -click path is gated (further down), but this double-click revealStep writes
    // `picked` directly in the toPop block below, which pops image cards - the escape.
    // Once the tree is fully expanded, a further double-click is simply a no-op here (no
    // reveal, no place, no collapse), so the tree stays label-only at every interaction.
    if (hideLeafImages) { interacted.current = true; setIdleHint(false); return; }
    // nothing left to reveal: if any shown node still hasn't popped its ancestor
    // card, pop them all (a staggered ripple, +50 each) before any collapse begins.
    const toPop = shown.filter((n) => n._parent && n.img && !picked.has(n._id));
    if (toPop.length) {
      setSeen((prev) => { const s = new Set(prev); toPop.forEach((n) => s.add(n._id)); return s; });
      toPop.forEach((n, i) => {
        window.setTimeout(() => setPicked((prev) => { const s = new Set(prev); s.add(n._id); return s; }), i * 45);
        if (!scoredRef.current.has(n._id)) { scoredRef.current.add(n._id); flashNum(n._x, n._y - 8, -10, FLASH_SIZE /* 16 Sept 2026 (owner), learn-area rebalance: see the table at the top of the flashNum group. */); }
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
      uniq.forEach((c, i) => { const g = targets.get(c.id); if (g) window.setTimeout(() => flashNum(g.x, g.y - CW / 2, 250, FLASH_SIZE), i * 55 /* 16 Sept 2026 (owner), learn-area rebalance: see the table at the top of the flashNum group. */); }); // a +100 pops from each card just after it lands
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
    /* CONFETTI ON THE COLLECT, 16 September 2026 (owner). The site's own
       fireConfetti, the same one the hidden-games counter uses, so there is one
       burst in the codebase rather than a second implementation. Fired from the
       card's own position, converted to the viewport fractions it expects.
       prefers-reduced-motion is honoured at the call site by contract, hence the
       guard. */
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      fireConfetti({ particleCount: 90, spread: 120, startVelocity: 44, origin: { x: (breed.x + pan.x) / vp.w, y: (breed.y + pan.y) / vp.h } });
    }
    /* THE RAIL GREENS ON LANDING, NOT ON PRESS, 16 September 2026 (owner: the card
       should spin and fall first, and the rail card only go green when it lands).

       onRemove is what turns the rail card green, and it fired here, before the
       tumble had even started. On the CHUM TREE LAYER it is now deferred to the end
       of the flight instead.

       THE PIT KEEPS THE OLD ORDER. The comment it carried is a real constraint:
       the card has to leave the pit before the circles fall, or it is still there
       when they land on it. strongBg && !circular is the chum tree layer alone, so
       the pit is untouched. */
    const deferCollect = strongBg && !circular;
    if (!deferCollect) onRemove?.(breed.name); // pop the card out of the pit first, so it goes before the circles fall
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
      // The chum tree layer's collect lands here: the card has finished its tumble
      // into the corner, so this is the moment the rail card should go green.
      if (deferCollect) onRemove?.(breed.name);
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
            /* GREEN ONCE EVERY CIRCLE IS FRAMED, 16 September 2026 (owner: the ring
               goes back to its rarity yellow when the level is done, and should go
               green).

               THE LIFT KEEPS THE RING IT WORE IN THE PIT, which is RING_PALETTE by
               depth: on the owner's Southern Hound that is #fff200, the depth-1
               yellow, applied inline here and therefore beating anything the
               stylesheet says. That is correct while there is work left, because the
               ring is how the player finds the dog they lifted.

               Once the frames are full it means nothing, and green is what this game
               says for finished everywhere else: the Collect button, the filled
               frame, the placed card's outline, the full progress bar. packed counts
               too, since packing the cards away is the other way to finish.

               Both fill and stroke change: the fill is the ring band behind the
               picture, so leaving it yellow would draw a yellow halo inside a green
               rim. */
            style={circular && ringColor ? { fill: doneRing ? "#22c55e" : ringColor, stroke: doneRing ? "#22c55e" : ringColor } : undefined} />
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
            /* GREEN WINS ONCE THE CIRCLE IS READY (owner, 18 September 2026).

               THE GREEN RING HAD NEVER BEEN VISIBLE ON THE LIFT. The root card's
               own ring goes green on framesDone, a few lines above, and this crisp
               rarity ring is drawn LAST, on top, at the same centre line and six
               pixels wider, so it did not overlap the green ring, it buried it.
               rarityTier is always set on the lift, so the gate above is always
               true and the green was always covered.

               ONE EXPRESSION IS THE WHOLE FIX, because `hex` feeds both this ring
               and, through lighten(), the three glow bands, so the rim light turns
               green with it rather than bleeding yellow round a green ring.
               Re-ordering the layers was the alternative and is worse: the extra
               six pixels would show as a coloured fringe outside the green.

               framesDone || packed, matching the ring underneath exactly. Packing
               the cards away is the other way to finish and the two rings
               disagreeing on that would be this same bug again.

               WHAT IT COSTS. This ring is the rarity signal on the lift, so the
               tier stops being shown at the moment the dog is ready. Accepted by
               the owner: the rarity band under the card still carries the tier,
               and ready is the more urgent message. */
            const hex = doneRing ? "#22c55e" : RARITY_BAND[rarityTier].bg;
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
              /* LEMON WHILE IT FILLS, GREEN WHEN IT IS FULL (owner, 18 September
                 2026). The note this replaces said the done state reads as the
                 pit's learnt colour rather than a green of its own, and then
                 observed the thing that made it a bug: "At 100% this ring covers
                 the lifted circle's own rim, so it is what you actually see round
                 a finished dog." It is the TOP of the stack, so its lemon was
                 burying the green of both layers underneath and sweeping it away
                 as the arc drew on. That is what the owner saw: green at 2/2,
                 then a yellow arc round it, then fully yellow.

                 THE FILL IS THE DOG'S OWN TIER COLOUR NOW (owner, 18 September
                 2026), not a flat lemon, read the same way the rarity band and the
                 crisp ring read it so the three cannot disagree about a tier. The
                 arc is already inside the rarityTier gate, so there is no null
                 case to carry.

                 doneRing IS STILL THE OUTER TEST, so green still wins the moment
                 the last frame lands, and this element is still the top of the
                 ring stack, so nothing is painted over that green. The tier colour
                 only ever appears on the false branch.

                 MEASURED WARNING, ACCEPTED BY THE OWNER. The lift wash composites
                 to about #0d5a87 at its centre and #083d62 at its edge over the
                 pit navy, and the five tiers measure against those:
                   extremely rare #4d2e91  1.34 / 1.14   was 8.21 on the lemon
                   rare           #2547c4  1.02 / 1.50   was 6.25
                   uncommon       #5dbf86  3.27 / 5.00
                   common         #f47421  2.60 / 3.97
                   very common    #ffd23e  5.14 / 7.84
                 On RARE and EXTREMELY RARE the arc is effectively invisible
                 against the backdrop, and those are the tiers a player most wants
                 to see; the lemon it replaces read at 6.25 and 8.21 there, which is
                 why it was chosen. Very common measures 1.19 against the old lemon
                 so that tier looks unchanged, which was expected.
                 IF THE TWO RAREST READ BADLY, lighten those fills for this use the
                 way the glow bands just above already do with lighten(). Do not
                 revert to the flat lemon: that loses the tier everywhere to fix
                 two cases. */
              stroke={doneRing ? "#22c55e" : RARITY_BAND[rarityTier].bg}
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
            /* TWO LIMITS, AND THEY GOVERN DIFFERENT TIERS (owner, 18 September
               2026, measured on a 390 phone where R is 85 and the chord 140.1).

               THE CAP, 0.22 -> 0.208, one point down. It bound FOUR of the five
               tiers at 18.7px: rare, common, uncommon and very common all drew at
               exactly the same size whatever their length, because their width fit
               came out above it. They now draw at 17.7.

               THE WIDTH CONSTANT, 0.6 -> 0.68, and this is what EXTREMELY RARE
               needed. It is the only tier the fit governs rather than the cap, at
               15.3px, so taking a point off the cap would have done nothing for
               it. 0.6 em a character is too generous for Luckiest Guy, a wide
               display face whose caps average nearer 0.68, which is why the fit
               said 15.3 would sit inside the chord when it does not. Extremely
               rare now comes out at 13.5 and very common at 17.2, which is under
               the new cap, so it becomes width-fitted too.

               THE COMPLETE BUTTON OVERLAPS THE LABEL. KNOWN, MEASURED AND
               ACCEPTED (owner, 18 September 2026). Written down so nobody spends
               an afternoon rediscovering it.

               THE GEOMETRY, on a 390 phone where R is 85:
                 the label's centre lands at (21.1, 43.2), which is already BELOW
                 the button, whose visible bottom is at +37.2 (the chumBase rect
                 runs to +42 local, not the chumPill's +34: an earlier note of
                 mine said +31.1 and was wrong)
                 the baseline then RISES TO THE RIGHT AT 26 DEGREES, RARITY_TILT,
                 and climbs back into the button's box after only 13.8 UNITS of
                 half-width
                 the button's box is x +/-76.5, y -21.0 to +37.2

               SO NO READABLE FONT SIZE CLEARS IT. That 13.8 units is the entire
               budget and every tier shares it whatever its length: at 0.68 em a
               character it buys about four letters. To clear the box, RARE would
               need 10.1px, COMMON 6.8, UNCOMMON 5.1, VERY COMMON 3.7 and
               EXTREMELY RARE 2.9, against a floor of 9 in this very expression.
               Four of the five would be a smudge.

               STILL ACCEPTED AS OF 18 SEPTEMBER, after a reversal that was
               reversed again. Two changes were considered and measured:
                 THE LABEL ONE POINT SMALLER. Shipped, for its own sake, and it
                 clears nothing: see the note on the cap above.
                 RAISING THE BAND BY 5 UNITS. NOT shipped, because it goes the
                 wrong way. The label already sits BELOW the button, its centre at
                 y 43.2 against the button's bottom at 37.19, so raising moves it
                 INTO the box: the half-width budget falls from 13.8 to 3.6.
               What would actually clear it is a DROP of about 19 units, labelY
               from R*0.566 to about R*0.788, which puts the band 79% of the way
               down the radius and narrows the chord from 140.1 to 104.6, taking
               EXTREMELY RARE from 13.5 to about 10.1 against the floor of 9 in the
               same expression. Declined as a worse trade than the overlap.

               THE THREE THINGS THAT WOULD FIX IT, all declined by the owner as
               changes to a signed-off layout: move the Complete button, push
               labelY down while doneRing is true, or cut the tilt (flat clears by
               10.9 with no size change at all, and anything at 8 degrees or less
               clears). The overlap stays. Do not shrink the label to dodge it. */
            /* THE CAP COMES DOWN ONE MORE POINT, 0.208 -> 0.196, 18 September
               2026 (owner), 17.68 to 16.68 on a 390 phone. Wanted for its own
               sake: the text reads a little smaller.

               IT CLEARS NOTHING, and that is measured rather than hoped. The cap
               only binds the SHORT labels: a width-fitted one has a half-width of
               0.46 * chord whatever its character count, so EXTREMELY RARE does
               not move at all and stays at 13.5. Per tier, half-width before and
               after: RARE 24.0 -> 22.7, COMMON 36.1 -> 34.0, UNCOMMON 48.1 ->
               45.3, VERY COMMON 64.5 -> 62.3, EXTREMELY RARE 64.5 unchanged. The
               budget before the label enters the Complete button's box is 13.8, so
               every tier still crosses it. See the accepted-overlap note below. */
            const fs = Math.max(9, Math.min(R * 0.196, (chord * 0.92) / (0.68 * band.label.length)));
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
                    {/* At 100% (every frame filled) the band flips to the done-green,
                        which is now the RING'S OWN #22c55e (owner, 9 Sept 2026). It was
                        a softer #69d176, on the reasoning that a large fill wants a
                        gentler green than a thin ring. On the device the two read as
                        two different greens on one circle, which is worse than either
                        being slightly off on its own. One green now, shared with the
                        ring above and with the placed-node fill at :2574.
                        THE LABEL WENT WHITE ON REQUEST EARLIER TODAY AND HAS HAD TO
                        COME BACK. White on #22c55e was 2.2:1, poor but visible. On
                        #ffed00 it is 1.21:1, which is not a contrast problem, it is
                        an invisible label. Navy on this lemon is 9.89:1. The same
                        measurement and the same conclusion are already written up
                        against the pit's own learnt chip in BreedTree, where the
                        ring and the figure had to move to navy for exactly this
                        reason when that chip went lemon on 31 Aug. .bandFill eases
                        the swap. */}
                    {/* GREEN WHEN THE DOG IS DONE, 18 September 2026 (owner), the
                        same #22c55e the three ring layers take and from the same
                        doneRing flag, so the card and its rim finish together.
                        `packed` comes with the flag, which the band did not read
                        before: packing the cards away is the other way to finish
                        and a band that took framesDone alone would disagree with
                        the rim it sits under.

                        IT ALREADY CHANGED ON COMPLETION and the owner could not
                        see it. The done colour was #ffed00 lemon, and since very
                        common became #ffd23e that is two nearly identical yellows,
                        so on the top tier the band appeared to keep its rarity
                        colour. The same trap the ring fell into twice: the fix was
                        invisible because the symptom matched the bug.

                        THE INK IS CHOSEN PER STATE, 18 September 2026 (owner),
                        after a full audit rather than another one-at-a-time fix.

                        THIS LABEL HAS BEEN FLIPPED THREE TIMES: navy, then white,
                        then white again, each time on how ONE tier looked. Every
                        flip broke the tiers nobody was looking at. ALL TWELVE
                        PAIRS ARE MEASURED HERE SO IT IS NOT FLIPPED A FOURTH.

                          state            bg        white   black
                          extremely rare   #4d2e91    9.93    2.12
                          rare             #2547c4    7.56    2.78
                          uncommon         #5dbf86    2.27    9.26
                          common           #f47421    2.85    7.37
                          very common      #ffd23e    1.44   14.54
                          done green       #22c55e    2.28    9.22

                        WORST CASE BY RULE: white everywhere 1.44, black
                        everywhere 2.12, INK PER STATE 7.37. Per state is more
                        than three times better than either flat rule and is the
                        only one that passes AA on all six. Its worst pair is black
                        on the common orange at 7.37, and five of the six clear AAA.

                        SO THE FIVE TIERS TAKE band.fg, which is what RARITY_BAND
                        always held and what these numbers vindicate: white on the
                        two dark tiers, black on the other three. The done green is
                        the only state the table did not already answer, and black
                        at 9.22 against white's 2.28 answers it.

                        THE FILLS ARE NOT DARKENED, and that was the other route.
                        To carry white they would need uncommon 32% darker,
                        common 23%, very common 45% (#ffd23e to #8c7322, which stops
                        being yellow at all) and the done green 31%. But bg drives
                        five things, and only this one wants dark: the crisp rarity
                        ring, its glow bands, seenFill, the twins in the pit and the
                        progress arc all sit on dark grounds and want the fills
                        LIGHTER. One element against three, and the ink is free. */}
                    <rect className={styles.bandFill} x={-R * 1.6} y={bandTop} width={R * 3.2} height={R * 1.6} style={{ fill: doneRing ? "#22c55e" : band.bg }} />
                    <text className={styles.bandFill} x={labelX} y={labelY} textAnchor="middle" dominantBaseline="central" style={{ fontFamily: '"Luckiest Guy", system-ui, sans-serif', fontSize: fs, fontWeight: 400, fill: doneRing ? "#000000" : band.fg }}>{band.label}</text>
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
          /* THE STEP COUNT IS GONE WITH ITS LABEL, 16 September 2026 (owner: the
             progress bar says the same thing now).

             WHAT IT WAS. Twelve lines working out how many more presses of this
             button were left: one per frontier layer to open, one for the images
             still to expose, one for the cards still to place. It existed only to
             print "x N more" beside the button, and both copies of that label have
             gone, so nothing read it.

             IT WAS ALSO A DIFFERENT MEASURE from the bar's. It counted BUTTON
             PRESSES, so a level with fifty cards still to place read "x1 more".
             The bar counts circles exposed and cards placed, which is the thing the
             owner actually wanted shown. Keeping both would have meant two numbers
             disagreeing about the same progress.

             The git history has the arithmetic if it is ever wanted back. */
          return (
          <g
            className={styles.removeBtn}
            transform={`translate(0,${circular ? 4 * learnBtnScale + 2 : 62}) scale(${circular ? learnBtnScale : 1})`}
            /* The press still stops here so it cannot reach the layer behind,
               but it no longer moves the button or starts a timer. */
            onClick={(e) => { e.stopPropagation(); revealStep(); }}
            onPointerDown={(e) => { e.stopPropagation(); }}
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
                {/* THE "x N more" LABEL IS GONE, 16 September 2026 (owner: the
                    progress bar says the same thing now).

                    BOTH COPIES WENT, this one inside the pill on the lifted layers
                    and the one beside the button in the main pit below. The figure
                    it printed was stepsLeft, a count of button presses remaining,
                    which is a different measure from the bar's: the bar counts
                    circles exposed and cards placed. Two numbers for the same
                    progress, and the owner has chosen the bar.

                    stepsLeft itself stays. It is still computed above and nothing
                    else reads it, but the whole block it lives in is the button's
                    own arithmetic and removing it would mean unpicking that. It is
                    the hook to bring the label back. */}
              </g>
            </g>
            {/* the main pit's copy of the same label, removed with it */}
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
            /* COLLECTING THE CHUM IS 1,000, raised from 500 on 15 September 2026
               (owner). It is the act the whole round is for, and at 500 it was
               worth the same as stacking one duplicate card on a filled frame.

               It rides the same path as every other award here: flashNum calls
               onScore, which is BreedTree's onScore, which is addScore in
               LineageModal. That path is ungated, so this builds the running
               total from inside the learn area exactly as a pit award does. Only
               the per-second drain pauses while the learn layer is open.

               LineageMap is rendered by BOTH pits, so this figure changes in the
               main pit and the mini pit together. */
            /* THE COLLECT AWARD IS MULTIPLIED BY THE WORK DONE, 16 September 2026
               (owner: collecting paid the same flat 1000 whether the player had
               placed every card or none of them).

               1000 x 0.1 per frame filled, so five filled pays 500 and fifty pays
               5,000. collectMult is read AT THE MOMENT OF THE PRESS, from filled,
               which is the live set behind the x/y counter on screen. That is the
               owner's second point: pressing Collect part-way through AUTO's run
               now pays for the frames filled so far, not the frames that would
               eventually be filled.

               FILLED FRAMES, NOT CARDS PLACED. A level has one frame per distinct
               picture and often many more cards, so counting cards would pay
               several times over for one dog. Frames is also the number the player
               can see in the counter, so the multiplier is checkable on screen.

               A BASE OF 1,000 UNDER IT, 16 September 2026 (owner: collecting with
               nothing placed should pay 1,000). The earlier 1000 x 0.1 x frames paid
               a hard ZERO for a bare collect, which the owner has now set at 1,000.

               1000 + 100 A FRAME, NOT A FLOOR OF 1,000. A plain floor would pay the
               same 1,000 whether nothing was placed or all ten frames were filled on
               any level of ten frames or fewer, which is most of the game: it would
               have reinstated exactly the problem the multiplier was added to fix.
               This way the bare collect pays the 1,000 asked for and every frame
               still adds on top, so placing always beats not placing.

               Celtic Hound 2 frames pays 1,200, the Beagle 12 pays 2,200, the
               Doberman 20 pays 3,000, the Jackapoo 51 pays 6,100. */
            onClick={(e) => { e.stopPropagation(); flashNum(rx, ry + ROOT + 88, 1000 + 100 * filled.size, FLASH_SIZE); startRemove(); }}
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
    {/* The lift's wash, OUTSIDE the scaled overlay. See .liftWash for why it
        cannot live on the overlay any more. */}
    {circular && !bounded && <div className={styles.liftWash} aria-hidden="true" />}
    {strongBg && !circular && !bounded && <div className={styles.chumWash} aria-hidden="true" />}
    {/* ============ THE CHROME, OUTSIDE THE SCALED OVERLAY ============
        The back button and the two counters are `position: fixed` and pinned to
        the screen corners, and they used to live inside the overlay below. That
        element now carries a scale(0.8), and a transform scales its children
        about the element's CENTRE, so anything pinned to a corner was pulled a
        tenth of the viewport inwards and shrank with everything else. That is
        why the back button drifted off the corner and the frame counter left the
        top left.

        Moved out rather than counter-scaled: a counter-scale would restore the
        SIZE and leave the position wrong, because the offset comes from the
        distance to the centre, not from the element's own box.

        Nothing else changes. All three are fixed, so their own top/left/right
        values now resolve against the viewport as they were always written to.
        ================================================================ */}
        {/* BACK, not close. A play triangle facing left: it takes you back a layer
            rather than dismissing anything.
            closeCircular is now applied for the chum family tree too, not only the
            pit lift. Without it that screen fell back to .close, which is 52px
            with no border, against the pit's 100.8 with a 5px navy stroke: the
            size and the missing stroke line were both this. */}
        {/* Bounded (/chums2) has no back button: the page's own CloseX closes the
            tree and rails its reopen icon. */}
        {/* THE SCORE, IN THE CORNER THE BACK BUTTON LEFT, 16 September 2026 (owner).

            currentScore was a prop NOTHING rendered: it had been threaded into this
            component and never used, so there was no score element here to reveal.
            This is it, built to match .frameCount on the other side of the screen,
            the same navy pill and the same type, mirrored to the right.

            LOCALE-FORMATTED, because the learn-area rebalance the same day pushed
            a thorough player past 200,000 on a deep dog and an unseparated six
            figures is unreadable.

            This layer only, the same gate as the button it replaces. */}
        {/* The Argos bar, driven by this layer rather than by scroll. Rendered as a
            sibling of the overlay like the score and the counter, so the layer's own
            0.8 scale cannot shrink it. */}
        {/* ON THE LIFT TOO, 16 September 2026 (owner: the play area's lifted circles
            should have the progress bar as well). liftOrChum is the pair, the same
            gate the node scale uses. The main pit is still excluded: it has no
            frames to fill and its own chrome along the bottom.

            THE SCRIM IS THE LEARN AREA'S ALONE, 16 September 2026 (owner: the play
            area's background is not busy, so it can go there and must stay here).
            strongBg is the chum tree layer, where every node and card is exposed over
            artwork and the dog would be lost without it; the lift, circular, sits on
            plain pit blue and needs nothing. Everything else about the bar is shared,
            so only that one prop is gated. */}
        {liftOrChum && !bounded && (
          <ReadingProgress progress={learnProgress} active={dogRunning} runOffEnds backdrop={strongBg && !circular} />
        )}
        {strongBg && !circular && !bounded && (
          <div className={styles.chumScore} aria-label={`Score ${currentScore}`}>
            {currentScore.toLocaleString()}
          </div>
        )}
        {/* NO BACK BUTTON ON THE CHUM TREE LAYER, 16 September 2026 (owner: remove
            it and let the score show there instead). strongBg && !circular is that
            layer alone; the pit lift and the main pit keep theirs. The layer is
            still closed by its own Collect and Learn buttons and by the rail. */}
        {!bounded && !(strongBg && !circular) && (
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
        {/* THE FRAME COUNTER SITS ON THE FRAMES, not on a number of its own.

            It is the count FOR that grid, so it is placed from the grid: the top
            of the first row, less the counter's own height, less a gap. It has
            been a flat 26 and then a flat 66, and both times it read as belonging
            to whatever else happened to be near it, which was the level portrait.

            THE FRAMES ARE INSIDE THE 0.8 SCALE AND THIS IS NOT, so chumTop has to
            be run back THROUGH the scale to find where the row actually lands.
            That is unscaleY's conversion in the other direction. Change the
            overlay's scale and this follows it.

            36 is the counter's own height, 24px type at 1.1 plus 5px of padding
            each side. 10 is the gap. The floor of 58 keeps it clear of the level
            portrait, whose bottom edge is at 52.3, on a screen short enough for
            the two to argue. */}
        {frameTotal > 0 && !packed && !collecting && (
          <div
            className={styles.frameCount}
            /* UP 20px, 9 Sept 2026 (owner), item 13, in two passes of 10: at
               46 it sat on the top row of frames.

               THE FLOOR WAS THE THING PINNING IT, found 16 September 2026 from the
               owner's DOM sample, which showed an inline top of exactly 58. The
               measured position was BELOW the floor, so Math.max was returning 58
               every time and the counter never moved. Two edits to the stylesheet
               that week did nothing for the same reason: an inline style beats a
               class, and both the base rule and the 640px rule were being
               overridden.

               THE FLOOR IS NOW 8. Its old job was to clear the level portrait,
               whose bottom edge is 52.3, but the owner now wants the counter to
               sit OVER that portrait rather than below it, so clearing it is no
               longer the requirement. 8 keeps it off the very top edge.

               The measured expression is untouched: where the frame row sits low
               enough, the counter still rides above it as before. */
            /* THE TOP, IN ONE PLACE. Three moves on 16 September 2026, all the
               owner's: -66 to -116 (up 50), then the floor 8 to 18 and the offset
               to -106 (down 10), and now up 10 again, so the floor goes 18 -> 8 and
               the offset -106 -> -116. Both numbers move together every time,
               because whichever is larger is the one that governs: the measured
               expression on a tall screen, the floor on a short one. */
            style={{ top: Math.max(8, vp.h / 2 + LIFT_K * (chumTop - vp.h / 2) - 116) }}
            aria-label={`${filled.size} of ${frameTotal} frames filled`}
          >
            {filled.size}/{frameTotal}
          </div>
        )}
        {/* THE SECOND COUNTER, 16 September 2026 (owner: one counter for the frames
            and a second for every image that has to be placed).

            THE TWO COUNT DIFFERENT THINGS. The first is frames filled, one frame per
            DISTINCT picture. This is CARDS, one per appearance, so a dog reached by
            two routes shows once in the first and twice in this one. On the Irish
            Wolfhound that is 5 against 6; on the Doberman 20 against 51.

            SAME NUMBERS THE PROGRESS BAR USES, cardsDone and totalCards, so the two
            cannot drift apart. totalCards counts the whole tree rather than the
            cards popped so far, so this reads x/6 from the start rather than
            climbing as branches open.

            SAME TOP, SET FROM THE SAME EXPRESSION, so the pair stay level whatever
            the measured position or the floor decides. Only the left differs, in the
            stylesheet. */}
        {totalCards > 0 && !packed && !collecting && (
          <div
            className={styles.cardCount}
            style={{ top: Math.max(8, vp.h / 2 + LIFT_K * (chumTop - vp.h / 2) - 116) }}
            aria-label={`${cardsDone} of ${totalCards} images placed`}
          >
            {cardsDone}/{totalCards}
          </div>
        )}
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
      /* 20% SMALLER ON THE LIFTED LAYER, 2 September 2026 (owner): frames,
         buttons, the dog card, nodes, name pills and connectors, all together.

         ONE TRANSFORM RATHER THAN TWENTY CONSTANTS, and that is forced rather
         than lazy. This layer is drawn in TWO technologies: the diagram is SVG
         and the placed frames are HTML with a z-index, which the note by the
         lifted root explains. Shrinking the SVG's own constants or its viewBox
         would have taken the diagram down and left the frames at full size, and
         the two would no longer line up.

         Hit testing follows for free. A CSS transform is reported by both
         getBoundingClientRect and getScreenCTM, which are what the pan, the drag
         and the frame drop all read, so nothing needs a matching adjustment.

         BOTH LIFT LAYERS, not just circular. This first shipped as circular only
         and nothing looked any smaller: circular is the dog lifted OUT OF THE
         PIT, while the screen with the frames, the tree and the "x more" button
         on a chum like the Beagle is the CHUM'S OWN family tree, which BreedTree
         passes with `strongBg` and circular false. Two instances, two flags.

         THE MAIN PIT IS NOT AFFECTED. PackPit's own LineageMap passes neither
         flag, and strongBg is set nowhere but BreedTree, so this reaches the two
         lift layers and nothing else. `bounded` is the chums2 display tree and is
         excluded outright: it fits its viewBox to its container, so a scale there
         would be undone by the refit.

         NOT 3D. The handover records that perspective, backface-visibility and
         transform-style anywhere in this tree break the SVG stacking. A plain 2D
         scale is not on that list and does not create a 3D context. */
      style={(circular || strongBg) && !bounded ? { transform: "scale(0.8)", transformOrigin: "50% 50%" } : undefined}
      onClick={closeIfTap}
      onPointerDown={onPanDown}
      onPointerMove={onPanMove}
      onPointerUp={onPanUp}
      onPointerCancel={onPanUp}
    >
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
      <svg className={`${styles.svg}${bounded ? " " + styles.svgBounded : ""}`} viewBox={fitBox ? `${fitBox.x - treeShiftX - pan.x} ${fitBox.y - pan.y} ${fitBox.w} ${fitBox.h}` : `${-pan.x} ${-pan.y} ${vp.w} ${vp.h}`} width={vp.w} height={vp.h} xmlns="http://www.w3.org/2000/svg">
        <g style={removing ? { pointerEvents: "none" } : undefined}>
        {hasTree ? (
          <>
            {/* TWO SPEEDS, 16 September 2026 (owner: the tree snaps out rather than
               fading). DRAG_FADE is 0.12s, which is right for the drag focus, where
               the scenery has to be out of the way before the card moves. On the
               completion fade it reads as a snap, so that case gets its own 0.7s. */}
            <g style={{ opacity: removing || scattered || dragFocus || treeDone ? 0 : 1, display: scattered ? "none" : undefined, transition: treeDone && !dragFocus && !removing && !scattered ? "opacity 0.7s ease" : DRAG_FADE, pointerEvents: dragFocus || treeDone ? "none" : undefined }}>
            {/* A solo dog's card pops out of the big circle, so the circle has
                to be painted first or it covers the card. Every other dog keeps
                the original order, with the root drawn last. */}
            {soloLeaf && rootCard(breed.x, breed.y)}
            {shown
              // BOUNDED: full tree is laid out, so gate the drawn edges to nodes whose
              // parent is expanded (accumulating `open`). `!bounded ||` makes this a
              // no-op for the pit, whose `shown` already contains only open-parent nodes.
              .filter((n) => n._parent && !soloLeaf && !n._tucked && !hiddenIds.has(n._id) && (!bounded || open.has((n._parent as Node)._id)))
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
              // BOUNDED: same visibility gate as the edges - render only nodes whose
              // parent is expanded. No-op for the pit (see the edge filter above).
              .filter((n) => n._parent && !soloLeaf && !hiddenIds.has(n._id) && (!bounded || open.has((n._parent as Node)._id)))
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
                    /* TOUCHED, and it has to mean one thing on two devices.
                       POINTER ENTER shows the name and POINTER LEAVE takes it
                       away, which is hover on a desktop and is also raised on a
                       touch tap in every engine this ships on. POINTER DOWN shows
                       it too, because a touch that lands without moving cannot be
                       relied on to raise enter first, and it is what makes a press
                       and hold read the name on a phone. POINTER UP does NOT hide
                       it: on a phone leave arrives when the finger goes elsewhere,
                       and hiding on release would make a tap flash the name and
                       lose it before it could be read.
                       Only the lift asks for any of this; every other mode keeps
                       its standing pill and these handlers do nothing there. */
                    onPointerEnter={circular ? () => setNamedNode(n._id) : undefined}
                    onPointerDown={circular ? () => setNamedNode(n._id) : undefined}
                    onPointerLeave={circular ? () => setNamedNode((cur) => (cur === n._id ? null : cur)) : undefined}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (suppressClick.current) { suppressClick.current = false; return; }
                      // BOUNDED (/chums2): a node is not a game tap, but it must do
                      // TWO things on one click: (1) run the pit's own expand for this
                      // node so its deeper level opens (nodes with nothing deeper skip
                      // this), then (2) hand the node's on-screen rect up so the host can
                      // open THAT ancestor's pack popout directly BELOW the node. No
                      // score/pick runs. The rect is read before follow() re-renders.
                      if (bounded) {
                        const g = e.currentTarget as SVGGElement;
                        const rect = g.getBoundingClientRect();
                        // ACCUMULATE, do not focus-switch: add this node to `open` so its
                        // children reveal, keeping every previously opened branch open
                        // (follow() would rebuild a fresh path-only set and collapse the
                        // rest). Nothing is ever removed, so clicking through every node
                        // exposes the whole tree at once. The full-tree layout means no
                        // re-fit. Then hand the rect up for the popup (rect read first).
                        if (n.children && n.children.length) {
                          setOpen((prev) => { const s = new Set(prev); s.add(n._id); return s; });
                        }
                        onNodeClick?.(n.name, { x: rect.left, y: rect.top, w: rect.width, h: rect.height });
                        return;
                      }
                      interacted.current = true; setIdleHint(false); // any tap stops the first-ring hint
                      burstAt(n._x, n._y, r * 1.33); // pink starburst, 33% over the circle radius, exactly as the pit
                      const firstHit = !scoredRef.current.has(n._id);
                      if (firstHit) scoredRef.current.add(n._id);
                      setSeen((s) => { if (s.has(n._id)) return s; const x = new Set(s); x.add(n._id); return x; }); // first tap turns it blue
                      const baseVal = 500; /* WAS hasKids ? 125 : 250, 16 September 2026 (owner).
                        A circle with children and one without now pay the same: the owner's
                        rebalance rewards opening ANY circle equally, so a deep branch is not
                        worth less per tap than a leaf. The top-three multiplier still applies
                        on top. */
                      const mult = topBonus.get(packArt(n.name) ?? (n.img as string)) ?? 1; // top-3 breeds score more
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
                      /* PLACED IS THE PIT'S YELLOW, 9 Sept 2026 (owner), item 9.
                         It was #22c55e. Two things follow and both are deliberate.
                         .disc's own default fill is already var(--yellow), so a
                         placed node and an untouched one are now the same colour;
                         only a SEEN one still reads different, in blue. If the
                         placed state needs to stand apart again it has to be by
                         something other than fill.
                         And the % on it goes back to navy. White is what a placed
                         node used to wear on green, and white on yellow is 1.6:1,
                         which is unreadable. See the text style below. */
                      const placedHere = !!n.img && (placedImgs.has(n.img as string) || packed);
                      /* AND THE LEMON, NOT --yellow, 9 Sept 2026 (owner). #ffed00
                         is the colour a learnt chip already wears once it drops
                         into the pit (BreedTree, the badge disc). Using the pit
                         furniture yellow here left the same dog two shades apart
                         between the two screens. */
                      /* A SEEN NODE WEARS THE RARITY COLOUR, 15 September 2026
                         (owner). It was a flat #0c5b92, which had nothing to do
                         with the dog being learnt. It now takes the bg of the
                         same RARITY_BAND entry the lifted card's band is drawn
                         from, so the opened nodes and the band read as one set.

                         THE TEXT COLOUR HAS TO FOLLOW IT. The % on a seen node
                         was hard-coded white, which worked on one dark blue and
                         nothing else. Common is #fcee23 and white on that is
                         about 1.1:1, the same unreadable case that had to be
                         reversed on the done band on 10 September. RARITY_BAND
                         already carries the fg the band uses, so the pair is
                         taken from there rather than picked again here.

                         Falls back to the old blue when no tier is supplied,
                         which is every caller outside the pit lift. */
                      const seenFill = rarityTier ? RARITY_BAND[rarityTier].bg : "#0c5b92";
                      const fill = placedHere ? "#ffed00" : seen.has(n._id) ? seenFill : undefined;
                      const st: React.CSSProperties = {
                        ...(fill ? { fill } : null),
                        // clamped so a nested ring can never out-thicken its parent
                        ...(circular ? { ["--ring" as string]: `${clampedRingW(n).toFixed(2)}px` } : null),
                      };
                      return <circle className={`${styles.disc} ${circular ? styles.discPit : ""} ${hasKids && !isOpen ? styles.has : ""} ${idleHint && !seen.has(n._id) && (n._parent as Node)?._id === "0" ? styles.hint : ""}`.trim()} r={r} style={Object.keys(st).length ? st : undefined} />;
                    })()}
                    <text className={styles.pct} textAnchor="middle" dominantBaseline="central"
                      /* THE FIGURE SCALES WITH ITS CIRCLE, AND KEEPS ITS PADDING,
                         16 September 2026 (owner: the % text stays a standard size
                         so on a node under 25% it touches the edges).

                         THE FLOOR WAS THE FAULT. Math.max(13, ...) meant every
                         small node drew 13px type however small the circle got, and
                         after the node scale was cut the small circles are around
                         15px across, so the text was wider than the disc.

                         TWO LIMITS, WHICHEVER IS SMALLER. r * 0.55 is the old
                         proportion, and the second is a width fit: the label is
                         share plus a percent sign, and at roughly 0.58em a
                         character it has to sit inside the disc less the 4.8 ring
                         and a tenth of the radius as padding on each side. So a
                         one-digit share can use more of its circle than "100%" can,
                         which is why the cap is per label rather than flat.

                         The lift and the chum tree only. The main pit and the
                         instruction cards keep their floors: their circles are full
                         size, so a floor never bites there. */
                      fontSize={(() => {
                        if (INSTR_NAMES.has(breed.name)) return Math.max(13, r * 0.75);
                        if (!liftOrChum) return Math.max(13, r * (circular ? 0.625 : 0.5));
                        const label = `${share}%`;
                        const inner = Math.max(1, r - 4.8 - r * 0.1); // half-width left after ring and padding
                        return Math.max(5, Math.min(r * 0.55, (inner * 2) / (label.length * 0.58)));
                      })()}
                      /* White only on the blue SEEN fill now. A placed node is
                         yellow (item 9 above), and white on yellow cannot be read,
                         so it keeps the default navy. */
                      style={(!(n.img && (placedImgs.has(n.img as string) || packed)) && seen.has(n._id)) ? {fill:(rarityTier ? RARITY_BAND[rarityTier].fg : "#ffffff"),...(INSTR_NAMES.has(breed.name)?{fontFamily:'"Luckiest Guy",system-ui,sans-serif',fontWeight:400}:{})} : INSTR_NAMES.has(breed.name)?{fontFamily:'"Luckiest Guy",system-ui,sans-serif',fontWeight:400}:undefined}>
                      {INSTR_NAMES.has(breed.name) ? (n.value ?? "") : `${share}%`}
                    </text>
                    {/* ON THE LIFT THE PILL IS ON DEMAND: drawn only for the node
                        being touched, and nothing at rest. Every other mode keeps
                        its standing name, so this gate is the only difference.
                        See namedNode for the measurement behind it. */}
                    {(hasKids || !autoExposed.has(n._id)) && !(circular && n.name === breed.name) && (!circular || namedNode === n._id) ? (() => {
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
                      /* ONE POSITION FOR EVERY MODE NOW, 18 September 2026. The
                         lift used to read a radial offset out of pillPlacement,
                         which is deleted with this: with one name on screen at a
                         time there is nothing to place AROUND, so the clearest
                         spot is simply above the node like everywhere else. That
                         also retires the viewport nudge, which was the last user
                         of WALL_PAD's pill case and was itself comparing layout
                         units against screen pixels until this week. */
                      const pcx = 0;
                      /* CLEAR OF THE CARD, NOT OF THE NODE. It was -r - 13, written
                         when the card sat BESIDE the node; the card is centred on
                         it now and reaches r * CARD_COVER, so 13 was no longer
                         clearance and never scaled. Measured against the card's
                         footprint plus the pill's own half-height, so the gap is
                         PILL_CARD_GAP at every node size and at one line or two. */
                      const pcy = -(r * CARD_COVER + PILL_CARD_GAP + (nmH / 2) * PIT_PILL_SCALE);
                      return (
                        /* 10% SMALLER, 2 September 2026 (owner).

                           SCALED, not re-measured. The box, the corner radius and
                           the TEXT all have to come down together, and the text is
                           sized by a CSS class rather than by a number here, so
                           shrinking nmW and nmH alone would have left the words at
                           full size and overflowing their own pill. One transform
                           takes the lot.

                           nodePillWidth is deliberately NOT touched. The placement
                           pass spaces siblings on it and the pit pill uses the same
                           formula, so it stays the shared measurement and this is
                           purely what gets drawn. Sibling spacing is now 10% more
                           generous than the pills need, which reads as air rather
                           than as a fault. */
                        /* 0.9 -> 0.54, 40% smaller, 16 September 2026 (owner). The whole
                           pill is scaled rather than its type, so the rounded box, its
                           padding and the two-line offset all come down together and
                           nothing has to be re-measured. */
                        /* 0.54 -> 0.594, the pill and its name 10% bigger,
                           16 September 2026 (owner). The whole group is scaled, so the
                           box, its padding and the two-line offset move together. */
                        /* 0.594 -> 0.683, the pill and its name 15% bigger,
                           16 September 2026 (owner). The whole group is scaled, so the
                           box, its padding and the two-line offset move together. */
                        <g transform={`translate(${pcx},${pcy}) scale(${PIT_PILL_SCALE})`}>
                          <rect className={styles.nmPill} x={-nmW / 2} y={-nmH / 2} width={nmW} height={nmH} rx={nmH / 2} />
                          {nmLines.map((ln, li) => (
                            <text key={li} className={styles.nm} textAnchor="middle" dominantBaseline="central"
                              x={0} y={nmLines.length > 1 ? (li === 0 ? -8 : 8) : 0}>
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
                      {/* THE CLIP IS FOR "WRONG DOG" ONLY NOW, 16 September 2026
                          (owner: the breed name is too small to read, move it below
                          the frame and make it bigger).

                          It boxed the label inside the frame, which is what forced
                          the name down to 8px in the first place: a long name had to
                          fit a 60px square. The name now sits BELOW the frame and is
                          not clipped, so it can be read. WRONG DOG still belongs
                          inside the frame, so it keeps the clip. */}
                      <clipPath id={`lbl-clip-${f.id}`}>
                        <rect x={f.sx - pan.x - CW / 2 + 4} y={f.sy - pan.y - CW / 2 + 4} width={CW - 8} height={CW - 8} />
                      </clipPath>
                      <text
                        x={f.sx - pan.x}
                        /* THE NAME MOVED, WRONG DOG DID NOT, 9 Sept 2026 (owner).
                           One text element draws both labels, so the +5 that
                           optically centred them was shared. The name is up
                           10px in two passes of 5; WRONG DOG keeps the original
                           baseline throughout. */
                        /* BELOW THE FRAME FOR THE NAME, 16 September 2026 (owner).
                           CW / 2 clears the frame's own edge and 12 is the gap under
                           it. WRONG DOG is unchanged, still centred in the frame on
                           the baseline it has had since 9 September. */
                        /* 12 -> 27, down a further 15, 16 September 2026 (owner: it
                           touches the frame's bottom edge). WRONG DOG is unchanged. */
                        y={f.sy - pan.y + (wrongDog?.frameId === f.id ? 5 : CW / 2 + 27)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        {...(wrongDog?.frameId === f.id ? { clipPath: `url(#lbl-clip-${f.id})` } : null)}
                        /* SIZED DOWN TWICE, 9 Sept 2026 (owner), item 7. The
                           breed name went 14 to 12 to 10 to 8, WRONG DOG 18 to 16 to 13 to 10,
                           both on the owner reading them on the device. The line height
                           below follows the name down, or a two word breed would
                           keep its old gap and read as loose. */
                        /* 8 -> 11, the owner's three points, 16 September 2026. It
                           was cut to 8 on 9 September only because the label had to
                           fit inside the frame; out from under the clip it can carry
                           a readable size. WRONG DOG stays at 10. */
                        /* WHITE, NO OUTLINE, 11 -> 13, 16 September 2026 (owner).
                           The navy outline was added the same day so yellow could be
                           read over artwork; white carries itself, and the owner has
                           seen it in place. WRONG DOG keeps its 10px. */
                        style={{ fill: "#ffffff", font: `700 ${wrongDog?.frameId === f.id ? 10 : 13}px ${wrongDog?.frameId === f.id ? "'Luckiest Guy', " : ""}Montserrat, system-ui, sans-serif`, pointerEvents: "none" }}
                      >
                        {wrongDog?.frameId === f.id ? (
                          <>
                            <tspan x={f.sx - pan.x} dy={-10}>WRONG</tspan>
                            <tspan x={f.sx - pan.x} dy={22}>DOG</tspan>
                          </>
                        ) : (() => {
                          // split breed name into words, up to 3 lines
                          const words = (dragName || "").split(" ");
                          const lineH = 13; // follows the font size above
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
                  /* THE LOOSE PILE STANDS ASIDE WHILE A CARD IS IN HAND,
                     16 September 2026 (owner: dragging on a phone, the other cards
                     cover the frame you are aiming at and the lit outline is barely
                     visible).

                     THIS REVERSES A RECORDED DECISION. The drag focus note says the
                     loose cards stay because they are the pile you are working
                     through and hiding them would hide the job. That holds on a
                     desktop with room to spare; on a phone with fifty cards it is
                     the pile that hides the target. The owner has seen both and
                     chosen the target.

                     The card in hand keeps its opacity, which is why dragCardId
                     exists: two copies of the same dog share an image and a name, so
                     neither could pick out the one being moved. Placed and stacked
                     cards are untouched, so the board you have already built stays
                     on screen. */
                  style={{ ...(dragFocus && dragCardId !== c.id && !placedSet.has(c.id) && !stackedIds.has(c.id) ? { opacity: 0, pointerEvents: "none" as const, transition: DRAG_FADE } : {}), ...(cxf ? { opacity: cxf.opacity } : packed ? { pointerEvents: "none" as const, ...(isDupImg(c.img) && !isTopOfStack(c) && !PACK_BREEDS.has(c.name) ? { filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))" } : {}) } : (placedSet.has(c.id) && !PACK_BREEDS.has(c.name)) ? { cursor: "zoom-in" } : {}), ...((placedSet.has(c.id) || packed) && !PACK_BREEDS.has(c.name) ? { pointerEvents: "all" as const } : {}) }}

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
                      flashNum(target.sx - pan.x, target.sy - pan.y - CW / 2, 250, FLASH_SIZE /* 16 Sept 2026 (owner), learn-area rebalance: see the table at the top of the flashNum group. */); // +5 for the double-click shortcut (drag is worth more)
                      const pid = puffSeq.current++;
                      setPuffs((p) => [...p, { id: pid, sx: target.sx, sy: target.sy }]);
                      window.setTimeout(() => setPuffs((p) => p.filter((x) => x.id !== pid)), 480);
                    });
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    // DIAGNOSTIC item 8: proves this element received the press, and on which drag. REMOVE ONCE FIXED.
                    if (DROP_DBG) dropLog(`DOWN#${++DROP_DBG_N} ${c.name} img ${dImg(c.img)} placed=${placedSet.has(c.id)} live=${liveById.has(c.id)} pinned=${pinned.has(c.id)} cdLeftOver=${cardDrag.current ? "YES" : "no"} supp=${suppressClick.current} ptr ${Math.round(e.clientX)},${Math.round(e.clientY)} card ${Math.round(c.cardX)},${Math.round(c.cardY)}`);
                    if (placedSet.has(c.id)) { if (isMobile) startGridDrag(e); return; } // framed: fixed, not draggable; drives the grid scroll on mobile
                    try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch {}
                    cardDrag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: c.cardX, oy: c.cardY, moved: false };
                    setDragCat(PACK_BREEDS.has(c.name) ? "chum" : isAlive(c.status) ? "alive" : "extinct"); // light up the matching frames
                    setDragImg(c.img);
                    setDragCardId(c.id);
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
                    /* DIAGNOSTIC item 8. REMOVE ONCE FIXED. Answers the three
                       remaining suspects in one readout: whether a hit was
                       found, hit.img against c.img, whether that frame was
                       already filled, and whether cardDrag survived. It also
                       reports the CARD centre against every frame for this dog,
                       because the accept test is run on the POINTER position,
                       not on the card. */
                    if (DROP_DBG) {
                      const cdd = cardDrag.current;
                      const ccx = (cdd ? cdd.ox + (e.clientX - cdd.sx) : c.cardX) + pan.x;
                      const ccy = (cdd ? cdd.oy + (e.clientY - cdd.sy) : c.cardY) + pan.y;
                      const ptrHit = frames.find((f) => Math.abs(e.clientX - f.sx) <= CW / 2 && Math.abs(e.clientY - f.sy) <= CW / 2);
                      const cardHit = frames.find((f) => Math.abs(ccx - f.sx) <= CW / 2 && Math.abs(ccy - f.sy) <= CW / 2);
                      const mine = frames
                        .filter((f) => f.img === c.img)
                        .map((f) => `${f.id}${filled.has(f.id) ? "[full]" : "[open]"} ptr ${Math.round(e.clientX - f.sx)},${Math.round(e.clientY - f.sy)} card ${Math.round(ccx - f.sx)},${Math.round(ccy - f.sy)}`)
                        .join("  ");
                      dropLog(
                        `UP#${DROP_DBG_N} ${c.name} cd=${cdd ? (e.pointerId === cdd.id ? "match" : "ID MISMATCH") : "NULL"} moved=${cdd ? cdd.moved : "-"} supp=${suppressClick.current}\n` +
                        `  ptrHit=${ptrHit ? `${ptrHit.id} img ${dImg(ptrHit.img)} vs ${dImg(c.img)} same=${ptrHit.img === c.img} filled=${filled.has(ptrHit.id)}` : "none"}\n` +
                        `  cardHit=${cardHit ? cardHit.id : "none"}  half=${Math.round(CW / 2)}px\n` +
                        `  own frames: ${mine || "none for this dog"}`
                      );
                    }
                    const cd = cardDrag.current;
                    if (cd && e.pointerId === cd.id) {
                      try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch {}
                      if (cd.moved) {
                        /* THE DROP IS TESTED ON THE CARD, NOT THE FINGER (9 Sept 2026).
                           It used to compare e.clientX/Y against the frame, so a
                           card sitting squarely in its frame was refused whenever
                           the grip was more than half a card off centre. That is
                           why a re-picked-up card was rejected: the second grip
                           sits wherever you catch it, and the readout showed the
                           card 11px from the frame centre while the finger was 35px
                           away, five past the 30px half. cardCx/cardCy are the card
                           centre in SCREEN space, which is what the player is aiming
                           and what they can see. Do not put the pointer test back. */
                        const cardCx = cd.ox + (e.clientX - cd.sx) + pan.x;
                        const cardCy = cd.oy + (e.clientY - cd.sy) + pan.y;
                        const hit = frames.find((f) => Math.abs(cardCx - f.sx) <= CW / 2 && Math.abs(cardCy - f.sy) <= CW / 2);
                        if (hit && hit.img === c.img && !filled.has(hit.id)) {
                          // first copy of this breed: it fills the frame (+100)
                          setFilled((m) => { const x = new Map(m); for (const [fid, cid] of x) if (cid === c.id) x.delete(fid); x.set(hit.id, c.id); return x; });
                          setDragPos((m) => { if (!m.has(c.id)) return m; const x = new Map(m); x.delete(c.id); return x; }); // the frame position takes over
                          flashNum(hit.sx - pan.x, hit.sy - pan.y - CW / 2, 250, FLASH_SIZE /* 16 Sept 2026 (owner), learn-area rebalance: see the table at the top of the flashNum group. */); // +100 emanates from the frame
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
                          flashNum(hit.sx - pan.x, hit.sy - pan.y - CW / 2, -1, FLASH_SIZE /* 16 Sept 2026 (owner), learn-area rebalance: see the table at the top of the flashNum group. */);
                          setWrongDog({ frameId: hit.id, x: hit.sx - pan.x, y: hit.sy - pan.y });
                          window.setTimeout(() => setWrongDog((w) => w?.frameId === hit.id ? null : w), 800);
                          const correctFrame = frames.find((f) => f.img === c.img && !filled.has(f.id));
                          if (correctFrame) { setCorrectFlash(correctFrame.id); window.setTimeout(() => setCorrectFlash((cf) => cf === correctFrame.id ? null : cf), 800); }
                          // a wrong box repels: bump the card just outside its edge, in the
                          // direction it came from, rather than flinging it back to the start
                          // direction off the card centre too, so the bump follows the
                          // card out rather than wherever the finger happened to sit
                          let dx = cardCx - hit.sx, dy = cardCy - hit.sy;
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
                    setDragImg(null); setDragCardId(null);
                    setDragName(null); /* pickup-name */
                    setDragXY(null);
                  }}
                  onPointerCancel={() => { if (DROP_DBG) dropLog(`CANCEL#${DROP_DBG_N} ${c.name}`); /* DIAGNOSTIC item 8, REMOVE ONCE FIXED */ cardDrag.current = null; setDragCat(null); setDragImg(null); setDragCardId(null); setDragXY(null); }}
                  /* THE CARD ALSO NAMES ITS NODE. The node's own hover handlers
                     cannot fire once a card is on it: cards are rendered after the
                     nodes, so they paint on top, and this group carries drag
                     handlers, which makes it hit-testable without needing any
                     pointer-events rule. Before the card was centred it sat beside
                     the node and the node was clear; centring it took the hover.
                     c.id IS the node's _id, the same key namedNode is compared
                     against, because cardIds is built from picked and pinned.
                     enter and leave do not interfere with pointerdown, so the card
                     stays fully draggable. */
                  onPointerEnter={circular ? () => setNamedNode(c.id) : undefined}
                  onPointerLeave={circular ? () => setNamedNode((cur) => (cur === c.id ? null : cur)) : undefined}
                >
                  {/* THE WHOLE CARD SCALES AS ONE. Every child still measures
                      itself against CW, so the image, the rim, the clip, the grab
                      square and every corner adornment come down together and
                      nothing has to be re-derived. Scaled about the card's own
                      centre, so cardX and cardY still mean what they meant.

                      A FRAMED CARD IS ALWAYS 1: the moment it lands it fills its
                      frame, and the transition below is the 150ms grow. A snap
                      from a fifth of the frame to all of it reads as a glitch.

                      vectorEffect on the rim is non-scaling-stroke, so a tiny card
                      keeps a full-weight outline rather than a hairline. */}
                  <g
                    style={{
                      /* THE LIFT ONLY. It was not gated when it went in, which is
                         the one gate every other change to this file carries: the
                         SIZE was computed inside pickCards, which is shared by all
                         three callers, and the gate was put on the card's STATE,
                         placed or stacked, rather than on the layer. So the learn
                         area's chum tree scaled its cards too and every image there
                         came out smaller. `circular` restores its uniform CW. */
                      transform: `scale(${!circular || placedSet.has(c.id) || stackedIds.has(c.id) ? 1 : c.cardScale})`,
                      transformOrigin: `${c.cardX}px ${c.cardY}px`,
                      transition: "transform 150ms ease",
                    }}
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
                  {!INSTR_NAMES.has(breed.name) && !isSelfCard(c.name) && <rect x={c.cardX-CW/2} y={c.cardY-CW/2} width={CW} height={CW} rx={circular ? CW/2 : 15} vectorEffect="non-scaling-stroke" /* THREE STATES ON THE CARD'S OWN RIM, 16 September 2026 (owner). White while it is
   loose and being dragged, YELLOW once it is in a frame but copies of it are still
   out, GREEN when every copy is home. A dog that appears once goes straight from
   white to green, because the first placement is also the last.

   THE LEARN AREA IS WHERE THIS BELONGS. An earlier pass put the green on the HTML
   ring in the placed-card block, which is the PIT LIFT's, so the pit went green and
   this layer never changed. This rect is what the learn area actually draws. */
className={[
                    styles.pickCard,
                    isDupImg(c.img) && !isTopOfStack(c) && !PACK_BREEDS.has(c.name) ? styles.pickCardStack : "",
                    (placedSet.has(c.id) || stackedIds.has(c.id)) ? (imagesAllHome.has(packArt(c.name) ?? c.img) ? styles.pickCardDone : styles.pickCardWaiting) : "",
                  ].filter(Boolean).join(" ")}
                    /* THE RIM IS THE RARITY COLOUR NOW (owner, 18 September 2026).
                       It was ringColor, the lifted dog's own ring colour from the
                       diagram, so that a card said where it came from. The level's
                       tier says something the player cannot otherwise see on a card,
                       and where it came from is already obvious from the node it now
                       sits centred on.

                       IT IS THE CARD'S OWN TIER, not the level's. Each card is its
                       own breed, so each rim says something the player cannot see
                       anywhere else on that card. This file cannot work a tier out
                       for itself, because rarityTier() lives in BreedTree and
                       BreedTree already imports this file, so the caller passes the
                       function down as tierOf. Falls back to the level's tier and
                       then to ringColor where no function is supplied, so the main
                       pit and the learn area are untouched.

                       READ THE SAME WAY as the rarity band, the two rings and the
                       progress arc, so all five agree about a tier.

                       IT DOES NOT FOLLOW doneRing, deliberately, unlike those four.
                       They sit on the lifted CIRCLE, which is the thing that
                       completes. A card is a different object with its own done
                       state, .pickCardDone, driven by imagesAllHome per image rather
                       than by the level, and two meanings of "done" on one rim would
                       be worse than none.

                       THE TWO DARK TIERS ARE INVISIBLE AGAINST THE WASH AND THAT IS
                       ACCEPTED (owner). Measured against the lift wash, which
                       composites to about #0d5a87 at centre and #083d62 at edge:
                         rare           #2547c4   1.02 / 1.50
                         extremely rare #4d2e91   1.34 / 1.14
                         uncommon       #5dbf86   3.27 / 5.00
                         common         #f47421   2.60 / 3.97
                         very common    #ffd23e   5.14 / 7.84
                       The white it replaces read 9.24 and 11.1 on those two. Against
                       the card's own PHOTOGRAPH no number can be given, because a
                       photograph has no single luminance, and the rim is 2.4px.
                       lighten(), a few hundred lines above in the rarity ring block,
                       is the fix if it ever matters: it keeps the hue and lifts the
                       colour off the wash. Do not rediscover this.

                       KNOWN AND UNCHANGED: this inline style applies whenever the
                       layer is circular, so it also overrides .pickCardWaiting and
                       .pickCardDone, which therefore do not show on the lift. That
                       is pre-existing, it was true of ringColor too, and restoring
                       them would be a behaviour change nobody asked for. Flagged
                       rather than fixed.

                       Weight still comes from the node itself. vectorEffect is
                       non-scaling-stroke on this rect, so the number is screen
                       pixels and the two are comparable. */
                    style={circular ? (() => {
                      const cardTier = tierOf ? tierOf(c.name) : rarityTier;
                      const rim = cardTier ? RARITY_BAND[cardTier].bg : ringColor;
                      return { ...(rim ? { stroke: rim } : null), ...(c.ringW != null ? { strokeWidth: c.ringW } : null) };
                    })() : undefined} />}
                  {INSTR_NAMES.has(breed.name) && placedSet.has(c.id) && (() => { const words = c.name.split(" "); let l1="",l2=""; const mc=Math.floor(CW_TYPE/7.5); for(const w of words){if((l1+(l1?" ":"")+w).length<=mc)l1+=(l1?" ":"")+w;else l2+=(l2?" ":"")+w;} const ls={fill:"#ffffff",fontFamily:'"Luckiest Guy",system-ui,sans-serif',fontSize:12,fontWeight:400,pointerEvents:"none" as const}; const by1=c.cardY+CW/2+48; const by2=c.cardY+CW/2+40; return l2?(<text x={c.cardX} textAnchor="middle" style={ls}><tspan x={c.cardX} y={by2}>{l1}</tspan><tspan x={c.cardX} dy={20}>{l2}</tspan></text>):(<text x={c.cardX} y={by1} textAnchor="middle" dominantBaseline="central" style={ls}>{l1}</text>); })()}
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
                  {/* STACKED SPARES CARRY THE SAME CHROME, 16 September 2026 (owner:
                      a spare should work just like every other image).

                      THE GATE WAS placedSet ONLY. A dog reached by two routes makes
                      two cards and ONE frame, so the second card is dropped onto the
                      filled frame and stacks there: it is finished, but it is not in
                      placedSet, so it showed no info badge and no share while its
                      twin beside it showed both. Two identical pictures, one looking
                      broken. On the Doberman that is the Greyhound, reached directly
                      and again through Manchester Terrier and Whippet.

                      stackedIds is the set of cards absorbed into a stack, so adding
                      it covers exactly those and nothing else. They are the same dog
                      as the card in the frame, so the same badge and the same share
                      are the correct values, not an approximation. */}
                  {(placedSet.has(c.id) || stackedIds.has(c.id) || packed) && zoomedId !== c.id && !PACK_BREEDS.has(c.name) && !INSTR_NAMES.has(breed.name) && (() => {
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
                            flashNum(ix, iy, 250, FLASH_SIZE /* 16 Sept 2026 (owner), learn-area rebalance: see the table at the top of the flashNum group. */); // +2 the first time this card's info is exposed, white and small like the rest
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
            style={{ fontFamily: "var(--font-display, 'Luckiest Guy', system-ui)", fontSize: `${Math.round(CW_TYPE * 0.22)}px`, fill: "#ff2d4f", pointerEvents: "none" }}
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
              /* 11px ON SCREEN, 19 September 2026 (owner: match the learn area's blue
                 card). Written as the size it LANDS at and divided by the overlay's
                 scale: see LIFT_OVERLAY_SCALE, which is why the 12 this used to carry
                 was reading as 9.6.

                 THIS IS THE SECOND BOX, the note that opens off a card's own info
                 badge. It sets its own font shorthand three hundred lines from the
                 percentage box, which is how the two drifted apart before. Both now
                 land on the same figure as .cNote in BreedTree.module.css; if that
                 moves, all three move. The 1.45 leading is unchanged. */
              font: `500 ${liftPx(11)}/1.45 Montserrat, system-ui, sans-serif`, padding: "7px 10px",
              borderRadius: "8px", boxShadow: "0 4px 12px rgba(10, 58, 87, 0.35)",
            }}
          >
            <div style={{ fontFamily: "'Luckiest Guy', system-ui", fontSize: liftPx(12.48), marginBottom: "4px", color: "var(--yellow, #ffd23e)" }}>{c.name}</div>
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
        /* A DUPLICATE OF THIS DOG IS IN HAND, 9 Sept 2026 (owner). An empty
           frame lights up yellow to show where a card goes, but once a frame is
           filled the mini pit hides the frame entirely (see the opacity 0 on
           .frameFilled above), because the placed card lays its own ring on top.
           So the one place a duplicate can be dropped had no signal at all. The
           placed card's own ring carries it instead: white normally, yellow
           while a matching card is being dragged. */
        const dupInHand = circular && dragImg != null && dragImg === c.img;
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
              /* GREEN ONCE IT IS PLACED, 16 September 2026 (owner: the frames were
                 meant to go green and are still showing yellow).

                 THE FRAME'S GREEN WAS NEVER THE THING ON SCREEN. .frameFilled does
                 turn the hole green, but the mini pit hides the frame entirely once
                 it is filled and the placed card lays THIS ring on top of it. So the
                 colour a player sees when a card lands is decided here, and it was
                 white, with yellow while a matching duplicate was in hand.

                 #22c55e is the same green the frame, the Collect button and the
                 collected rail card use, so "this one is done" reads one colour
                 wherever it appears.

                 THE DUPLICATE STATE KEEPS ITS YELLOW, deliberately. It does not mean
                 "placed", it means "another one of these can go here", which is the
                 aiming colour everywhere else in the game. */
              boxShadow: circular
                ? dupInHand
                  ? "0 0 0 3px var(--yellow, #ffd23e), 0 0 14px 4px rgba(255, 210, 62, 0.6), 0 2px 8px rgba(0,0,0,0.25)"
                  : "0 0 0 3px #22c55e, 0 2px 8px rgba(0,0,0,0.25)"
                : "0 2px 8px rgba(0,0,0,0.25)",
              // box-shadow only: the card is positioned with left/top and a
              // blanket transition would make it slide instead of jump
              // box-shadow AND outline: the outline is the ring the player sees on a
              // placed card in the learn area, so it transitions too.
              transition: "box-shadow 140ms ease, outline-color 200ms ease",
              userSelect: "none",
              touchAction: "none",
              /* THIS IS THE RING, 16 September 2026 (owner: the placed images are
                 still yellow).

                 THE ONE THAT WAS ON SCREEN ALL ALONG. Three passes changed the wrong
                 thing: first the frame's stroke, then the box-shadow on this element,
                 then the SVG rect underneath. All three are drawn, but this HTML card
                 sits on top of the lot with overflow hidden, and THIS hard-coded
                 yellow outline is the rim the eye actually sees. The owner's DOM
                 sample is what found it.

                 It now carries the same three states as the rect below it, from the
                 same imagesAllHome set, so they cannot disagree: yellow while copies
                 of this picture are still out, green once every one is home. The pit
                 lift keeps "none" and its own box-shadow ring, which patch 124 already
                 turned green. */
              outline: circular
                ? "none"
                : `3px solid ${imagesAllHome.has(packArt(c.name) ?? c.img) ? "#22c55e" : "var(--yellow, #ffd23e)"}`,
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
            {/* ALL FOUR CORNER MARKERS SIT INSIDE THE CARD, 19 September 2026 (owner).

               WHAT WAS WRONG. Three of the four hung outside their card: the status dot
               at left/top -4, the info button at right/top -14, the percentage pill at
               right -2. Only the magnify was already inside, at left 4 bottom 4.

               THE OVERLAP. Card N's info button is 28px wide at right -14, so it is
               centred exactly on the card's top-right corner and needs 14px of gutter.
               Card N+1's dot claims 4px to the left of its own edge. That is 18px of
               demand against a gutter of 6 to 10 (F_GUT_MIN and F_GUT_WANT), so the two
               collided on every card pair in every row.

               WHY NOT A WIDER GUTTER, which was the other option. The gutter is not a
               setting, it is leftover space: gut = max(6, min(F_GUT_WANT, floor((avail -
               cols * floorW) / (cols - 1)))). Raising F_GUT_WANT to 18 costs 6 to 7px of
               card width at every size, about 10% at 390, and STILL fails below 390: at
               380 the card is already on its 60px floor and the gutter clamps to 16, at
               360 to 11. It would have left the fault on the narrowest phones.

               AND IT FIXES THE WHITE CROSS FOR FREE. Each card carries transform:
               rotate(cardDeg), and a transform creates a stacking context, so the info
               button's zIndex 65 only ranked it inside its own card. The overhang sat in
               the neighbour's box, and the neighbour, being later in the DOM, painted its
               rim over it: that is the cross through the "i". Nothing overhangs now, so no
               neighbour's box contains these markers and nothing can paint over them. The
               card's own background and border paint before its positioned children, so
               its own frame cannot cross them either.

               THE INSET IS 4, matching the magnify exactly. Checked against the card's
               15px corner radius: a 28px disc at inset 4 sits fully inside the arc.

               NON-CIRCULAR ONLY. The circular branch places these off RIM_IN on the
               lifted layer and is untouched. */}
            {/* status dot top-left, inside */}
            {isTopOfStack(c) && !PACK_BREEDS.has(c.name) && !INSTR_NAMES.has(breed.name) && (() => {
              const ts = TAG_STYLE[c.status ?? "extinct"];
              return (
                <div title={ts.label} style={{ position: "absolute", left: circular ? RIM_IN - 6 : 4, top: circular ? RIM_IN - 6 : 4, width: 12, height: 12, borderRadius: "50%", background: ts.bg, border: "1.5px solid #fff", pointerEvents: "none" }} />
              );
            })()}
            {/* info icon top-right, inside: see the corner-marker note above */}
            {isTopOfStack(c) && !INSTR_NAMES.has(breed.name) && (breedInfo[c.name] || c.note) && (
              <button
                style={{ position: "absolute", right: circular ? RIM_IN - 14 : 4, top: circular ? RIM_IN - 14 : 4, width: 28, height: 28, border: "2px solid #fff", borderRadius: "50%", background: "var(--blue-deep, #0c5b92)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, fontStyle: "italic", fontWeight: 700, fontSize: 14, fontFamily: "Georgia, serif", zIndex: 65 }}
                onClick={(e) => { e.stopPropagation(); if (infoHover === c.id) { setInfoHover(null); } else { closeAll(); setInfoHover(c.id); } }}
                onPointerDown={(e) => e.stopPropagation()}
              >i</button>
            )}
            {/* % pill bottom-right, inside. bottom stays 2 rather than the magnify's 4: only
                the horizontal edge was asked for, and the pill is shorter than the buttons. */}
            {isTopOfStack(c) && !INSTR_NAMES.has(breed.name) && (() => {
              const pillMix = breedMix.get(c.img)?.norm ?? c.mix;
              const pillTxt = pillMix < 1 ? "<1%*" : `${Math.round(pillMix)}%${c.share !== pillMix ? "*" : ""}`;
              return (
                <div
                  onClick={(e) => { e.stopPropagation(); if (pctHover === c.id) { setPctHover(null); } else { closeAll(); setPctHover(c.id); } }}
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{ position: "absolute", ...(circular ? { left: "50%", transform: "translateX(-50%)", bottom: -12 } : { right: 4, bottom: 2 }), background: "var(--navy, #0a3a57)", color: "#ffd23e", borderRadius: 12, padding: "2px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "Montserrat, system-ui", zIndex: 64, boxShadow: "0 1px 4px rgba(0,0,0,0.35)" }}
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
        /* CLAMPED TO THE SCREEN, 2 September 2026 (owner).

           It used to be exactly the two lines below with nothing after them: the
           panel was pinned to the card's left edge, dropped 6px under it, and
           rendered with no check against the viewport at all. A card in the
           right-hand column therefore always ran off the side, and a tall panel
           on a low card always ran off the bottom. It has been that way from the
           start; the 20% shrink simply moved more cards near the edges.

           BOTH AXES, and the vertical one FLIPS rather than clamps: sliding a
           panel up until it fits would cover the card it belongs to, so when
           there is no room below it is placed above instead, and only clamped if
           it fits neither way.

           pctSize is null on the very first frame, before the box has been
           measured, so the raw anchor is used exactly as before and the clamp
           takes effect on the next render. */
        const M = 8;                       // keep-off margin from every edge
        const bw = pctSize?.w ?? 288;      // 288 is the maxWidth set below
        const bh = pctSize?.h ?? 0;
        let left = c.cardX - CW / 2 + pan.x;
        let top = c.cardY + CW / 2 + 6 + pan.y;
        if (pctSize) {
          left = Math.max(M, Math.min(left, vp.w - bw - M));
          if (top + bh > vp.h - M) {
            const above = c.cardY - CW / 2 - 6 - bh + pan.y;
            top = above >= M ? above : Math.max(M, vp.h - bh - M);
          }
        }
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
        /* ONE LINE PER SIDE OF THE FAMILY, NOT PER APPEARANCE, 15 September 2026
           (owner). See the comment on breedMix. A dog reached 32 times used to
           give 32 lines, all reading the same generation label, which told the
           reader nothing about the route. Grouped by the depth-1 branch it came
           through, the same case gives two lines that name the dogs and still
           add to the headline figure.

           genLabel is kept and still used for the single-appearance case, where
           the generation IS the useful fact and there is no route to disambiguate. */
        const routes = (() => {
          const m = new Map<string, number>();
          for (const a of apps) m.set(a.branch, (m.get(a.branch) ?? 0) + a.pct);
          return [...m.entries()].sort((x, y) => y[1] - x[1]);
        })();
        const multi = routes.length > 1;
        return (
          <div
            ref={pctBoxRef}
            onMouseEnter={pctKeep}
            onMouseLeave={pctClose}
            style={{
              position: bounded ? "absolute" : "fixed", left, top, maxWidth: 288, zIndex: 100, pointerEvents: "auto", /* pct-close: hoverable so it can self-dismiss */
              background: "rgba(10, 58, 87, 0.92)", color: "#ffffff",
              /* 11px ON SCREEN, 19 September 2026 (owner), matching the learn area's
                 blue card. Written as the size it LANDS at and divided by the overlay's
                 scale: see LIFT_OVERLAY_SCALE. The 12 this used to carry was reading as
                 9.6, which is why raising the number on 16 September did not close the
                 gap. The two boxes still share no code, so if either moves, move both. */
              font: `500 ${liftPx(11)}/1.45 Montserrat, system-ui, sans-serif`, padding: "9px 12px",
              borderRadius: "8px", boxShadow: "0 4px 12px rgba(10, 58, 87, 0.35)",
            }}
          >
            <div style={{ fontSize: liftPx(12.48), fontWeight: 700, color: "#ffd23e", marginBottom: 1 }}>{c.name}</div> {/* pct-name */}
            <div style={{ fontSize: liftPx(18), fontWeight: 800, lineHeight: 1.15, marginBottom: 6 }}>
              {pctTxt(norm)} of your chum
            </div>
            {apps.length > 0 && (
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                {apps.length === 1
                  ? <div>As {genLabel(apps[0].depth)}: {pctTxt(apps[0].pct)}</div>
                  : routes.map(([branch, pct], i) => (
                      <div key={i}>from {branch}: {pctTxt(pct)}</div>
                    ))}
                {multi && (
                  <div style={{ marginTop: 2 }}>Combined: {routes.map(([, p]) => pctTxt(p)).join(" + ")} = {pctTxt(sum)}</div>
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
          viewBox={fitBox ? `${fitBox.x - treeShiftX - pan.x} ${fitBox.y - pan.y} ${fitBox.w} ${fitBox.h}` : `${-pan.x} ${-pan.y} ${vp.w} ${vp.h}`}
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
    {/* ON THE LIFT TOO, 18 September 2026 (owner). The !circular that used to sit
        in this gate is gone: nothing in autoCollect ever needed the learn area, it
        touches only this component's own state and the placement step Complete
        already uses.

        AND IT SITS IN THE SAME PLACE IN BOTH, bottom right, on the SHAKE button's
        spot. It went in under BACK for one commit on the belief that the shake
        button was live behind the play lift and would be pressed through. IT IS
        NOT, and the source says so plainly:

          BreedTree.tsx recomputes `busy = !!dogChainBreedRef.current ||
          learnOpenRef.current` every frame and reports it through onPitBusy;
          learnOpenRef mirrors learnNode, so it is true for the whole lift.
          LineageModal takes that into pitBusy and puts .pitCtlAway on BOTH the
          shake and the slow motion buttons, and .pitCtlAway is
          `opacity: 0; pointer-events: none`.

        pointer-events: none is the half that settles it: the button is not merely
        faded, it cannot take a press at all. So the position is free and the
        conflict never existed. .autoWrapLift is deleted rather than left behind,
        because a spare position class is the kind of thing that gets re-applied by
        accident. */}
    {showAuto && !bounded && (
      <div className={styles.autoWrap} onClick={autoCollect} onPointerDown={(e) => e.stopPropagation()} role="button" aria-label="Auto Find">
        <div className={styles.autoPop}>
          <img className={styles.autoBtn} src="/auto-icon-redux.svg" alt="Auto Find" />
        </div>
      </div>
    )}
    {penalty !== null && <div key={penalty.k} className={styles.autoPenalty}>{penalty.v}</div>}
    </>
  );
}
