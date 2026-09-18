"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { hierarchy, pack, packSiblings, packEnclose, type HierarchyCircularNode } from "d3-hierarchy";
import { ringFrac, RARITY_BAND } from "../PackPit/LineageMap";
import { createPitEffects } from "../PackPit/pitEffects";
import { splitName } from "../PackPit/splitName";
import { interpolateZoom } from "d3-interpolate";
import type { LineageNode } from "../../data/lineage";
import { nodeStatus, TAG_STYLE, type BreedTag } from "../BreedTreeMap/BreedTreeMap";
import { descendantPackBreeds, ancestryFullList, ancestorShareOf, ancestorAppearancesOf, treesContaining } from "../../data/lineageArchive";
import { subtreeSig, isEchoName } from "../../data/lineageShape";
import { fireConfetti } from "../../lib/confetti";
import TrainingCard from "../TrainingCard/TrainingCard";
import { CONSENT_KEY } from "../../lib/consent";
import trainingDifficulty from "../../data/trainingDifficulty";
import { ICONS } from "../CardDock/CardDock";
import { bust } from "../../data/imgVersion";
import { breedInfo, breedInfoLong } from "../../data/breedInfo";
import breedTraits from "../../data/breed-info.json";
import styles from "./BreedTree.module.css";
/* The pit's own stylesheet, imported so the learn area's collect flourish IS the
   pit's rather than a lookalike. Only the .tally* rules are used from it; see the
   note in BreedTree.module.css. */
import pitStyles from "../PackPit/PackPit.module.css";
/* The chum tree layer's own stylesheet, for .cardBox. Same reason as the tally
   above: the box in the learn area should BE the pit's box, not a second one that
   drifts away from it. */
import mapStyles from "../PackPit/LineageMap.module.css";
import { BRAIN_PATH, BRAIN_ARTBOARD } from "../icons/brain";
import LineageMap from "../PackPit/LineageMap";
import { propsFor, mobilePropsForLevel, type LevelTheme } from "../../data/levelThemes";
import BritainMessage from "../PackPit/BritainMessage";

// Reference-info marker on the learn-box portrait: the same red/amber/green
// status the main pit shows, plus a plain label for the generation line.
const STATUS_LABEL: Record<BreedTag, string> = {
  extinct: "Extinct", trending: "Trending", popular: "Popular", endangered: "Endangered", "in-decline": "In decline",
};
const genLabel = (d: number) =>
  d <= 0 ? "the breed itself" : d === 1 ? "parent" : d === 2 ? "grandparent" : `${"great-".repeat(d - 2)}grandparent`;

// The one copy of the small print under the share figures. Folded away by
// default and opened by the "..." below.
const FIGURES_NOTE =
  "These figures come from history and old breeding records, our viewpoint, not proven fact. (Though DNA reading can now trace bloodlines back with real precision, even reviving lost breeds.)";

// The small print, folded behind a "...". It carries its own open state and is
// mounted with a key that changes whenever the box opens or the circle or chum
// changes, so it is always folded again on the way in rather than remembering.
//
// THE GLYPH: "..." WHEN CLOSED, A RINGED MINUS WHEN OPEN, 16 September 2026
// (owner). It was "..." throughout, then briefly + and minus; the owner has taken
// the plus back and kept the minus, which is the pairing that reads best: dots say
// "there is more", the ringed minus says "put it away". The minus is U+2212, the
// real minus sign rather than a hyphen, which sits short and thin at this size.
// Three buttons carry a glyph, two closed and one open; only the open one takes
// the ring, through .cNoteMinus.
function BreakNote() {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        type="button"
        className={styles.cNoteDots}
        onClick={() => setOpen(true)}
        aria-expanded={false}
        aria-label="Show how these figures were worked out"
      >
        ...
      </button>
    );
  }
  return (
    <div className={styles.cBreakNote}>
      {FIGURES_NOTE}{" "}
      <button
        type="button"
        className={`${styles.cNoteDots} ${styles.cNoteMinus}`}
        onClick={() => setOpen(false)}
        aria-expanded={true}
        aria-label="Hide how these figures were worked out"
      >
        −
      </button>
    </div>
  );
}

// PHONE ONLY: everything from the dividing line down, folded behind a "...".
// Added 31 Aug 2026 together with dropping the sheet's max-height and scroll. The
// box now sizes to its content, so the write-up has to be allowed to show in full
// and the figures block has to be allowed to get out of the way. The divider still
// draws while folded, so the "..." reads as "there is more under this line".
// Mount it with a key that changes with the shown dog, like BreakNote, so it folds
// again every time rather than remembering.
function BreakFold({ folded, children }: { folded: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  if (!folded || open) return <>{children}</>;
  return (
    <div className={styles.cBreak}>
      <button
        type="button"
        className={styles.cNoteDots}
        onClick={() => setOpen(true)}
        aria-expanded={false}
        aria-label="Show the influence figures"
      >
        ...
      </button>
    </div>
  );
}

// A small pie of one share, drawn at the same diameter as the head portrait.
// Yellow slice on navy. A share under 1% still gets a visible sliver rather
// than nothing: the wedge is floored at about two degrees.
function SharePie({ pct }: { pct: number }) {
  const p = Math.max(0.56, Math.min(100, pct));
  const full = p >= 99.9;
  const a = (p / 100) * Math.PI * 2 - Math.PI / 2;
  const x = 16 + 16 * Math.cos(a);
  const y = 16 + 16 * Math.sin(a);
  const large = p > 50 ? 1 : 0;
  return (
    <svg className={styles.cPie} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <circle cx="16" cy="16" r="16" fill="#0a3a57" />
      {full ? (
        <circle cx="16" cy="16" r="16" fill="#ffd23e" />
      ) : (
        <path d={`M16 16 L16 0 A16 16 0 ${large} 1 ${x.toFixed(2)} ${y.toFixed(2)} Z`} fill="#ffd23e" />
      )}
      <circle cx="16" cy="16" r="15" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="2" />
    </svg>
  );
}

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
// Breed-title placement on each circle, relative to its label anchor.
// TITLE_DY_FRAC sets how far UP the circle the block sits and TITLE_DX_FRAC how far
// RIGHT, each as a fraction of the radius; TITLE_ANGLE tilts it (negative leans the
// text up to the right). labelFits accounts for all three. Tweak to taste.
// Mini pit only: the difficulty slider sets how big the dog circles are before
// the round starts. Bigger circles means less room in the pit and a faster game
// over, so size IS the difficulty. Three points are pinned:
//   level 5  the packing signed off as MINI_FILL 0.85, unchanged
//   level 0  raised to 0.5 from 0.4 (was a quarter), so the deepest circles read
//   level 10 the widest circle spans the full width of the pit
// The top end is measured off the widest top-level circle rather than the
// cluster's bounding box, because that is the thing the eye reads as "as big as
// it goes", and it is the body that has to fit between the pit walls.
// Mobile only: above 640px the layout does not run relayoutMobile, so the size
// has nowhere to land and the slider stays hidden.
/* 5 -> 9 on 9 Sept 2026 (owner). Only the STARTING point moves; the slider still
   runs 0 to 10 and every stop behaves as it did. */
const DIFF_DEFAULT = 9;

/* THE DIFFICULTY NOW CARRIES BETWEEN LEVELS, 9 Sept 2026 (owner).
   It used to reset on every level because LineageModal is keyed on the level and
   remounts BreedTree, taking this component's state with it. So a reader who set
   the slider once had to set it again on the next dog, which the new swipe made
   painfully obvious.
   sessionStorage rather than lifting the state up to BreedStrip: the value has to
   survive a REMOUNT, not merely a re-render, and it is one number owned by the
   control that sets it. Lifting it would have put a pit concern into the history
   page and threaded a prop through LineageModal for no gain.
   sessionStorage, not localStorage, deliberately: it is a setting for this
   sitting, not a preference to remember for ever. Closing the tab forgets it and
   the next visit starts at the default again.
   Wrapped because both calls throw outright in Safari private mode. */
const DIFF_KEY = "pc-mini-pit-difficulty";
function readDiff(): number {
  try {
    const v = sessionStorage.getItem(DIFF_KEY);
    if (v === null) return DIFF_DEFAULT;
    const n = Number(v);
    // Anything out of range or unparseable falls back rather than packing the
    // pit at a nonsense size.
    return Number.isFinite(n) && n >= 0 && n <= 10 ? Math.round(n) : DIFF_DEFAULT;
  } catch { return DIFF_DEFAULT; }
}
function writeDiff(n: number) {
  try { sessionStorage.setItem(DIFF_KEY, String(n)); } catch { /* private mode */ }
}
// The three stops, as a fraction of a PIT-FULL cluster. 10 fills the pit, 5 is
// half of it, 0 about half now too (raised from a quarter). Two straight
// segments, so 5 lands exactly on its own
// number rather than somewhere between the ends.
// RAISED 0.4 -> 0.5 (a quarter larger, ratio 1.25) so difficulty 0 is readable:
// at 0.4 the deepest circles on levels like Golden Retriever and Irish Setter
// drew about 20px, under a finger target and too small to read. diffScale
// multiplies the WHOLE cluster by this, so every circle grows by the same 1.25
// and the nesting is preserved: the root is fixed at FW/(2*PAD) and a uniform
// scale cannot make a ring out-thicken its parent. The cost, accepted, is that
// difficulty 0 feels easier and fuller. Nothing else reads this; only diffScale.
const DIFF_STOP_0 = 0.5;
// 0.575, raised 15% from 0.50 by eye. The chips follow on their own: a badge
// radius is BADGE_FRAC of each dog's own drawn radius, so growing the circles
// grows their badges with them.
const DIFF_STOP_5 = 0.575;
// 1: the top of the slider is the literal full pit width. `fit`, which this
// multiplies, is already the scale at which the cluster spans wall to wall WITH
// its rings allowed for, so 1 is flush rather than overflowing.
//
// It was 0.92, held back because a cluster at full width sat tight against the
// walls once the ring and the tilt were in. That 8% is what showed as a gap
// down each side at level 10. Tilt can still carry a circle a little past the
// line, which is the trade for filling the width.
const DIFF_STOP_10 = 1;
/* DIFFICULTY 0 DROPS SMALLER, 14 September 2026 (owner: "when on the 0 level
   difficulty, the circles that drop in are 25% smaller").

   ONLY THE DROP, NOT THE DIAGRAM. DIFF_STOP_0 was deliberately not touched: it
   was raised 0.4 -> 0.5 on 9 September because at 0.4 the deepest circles on
   Golden Retriever and Irish Setter drew about 20px, under a finger target and
   too small to read. Cutting the stop by a quarter would land at 0.375, below
   the value already rejected, and would shrink the pre-round diagram with it.
   This applies the quarter at the drop instead, so the circles you read before
   the round are the size they have always been.

   IT MUTATES ch.r, WHICH IS ALSO THE DRAWN RADIUS. A freed circle's picture is
   drawn from the node's own r in the render, not from the physics body, so
   shrinking only the body would give a small collider inside a full-size
   picture. popChildren already mutates ch.r for exactly this reason and relies
   on the same re-render. The chips follow by themselves: badgeDrawForNode is a
   fraction of ch.r, which keeps the owner ruling that a badge is sized off its
   own dog.

   THE WEAKSET IS THE COMPOUNDING GUARD. The drop effect re-runs on `gravity`
   and `entered` as well as on `nodes`, so without this a second run would
   shrink an already shrunk circle to 56%. popChildren guards the same hazard
   with b.popped. Keyed on the node object, so a rebuild of the `nodes` memo,
   which is what a change of difficulty or level causes, starts clean. */
const DROP_SHRINK_0 = 0.75;
const DROP_SHRUNK = new WeakSet<object>();
// The docked view zooms out to 1.21x the frame, so the visible pit is this much
// wider than SIZE. DIFF_INSET holds back enough for the 5px stroke and the pit
// walls, which sit 4 svg units inside the stage edges.
const DIFF_SPAN = 1.21;
// Where the drawn ground surface sits, in view units above the bottom of the
// stage. Measured off the ancient-medieval strip: floorAspect 567.5/57.6 gives
// a band 1/9.852 of the stage width tall, and its deepest sample is 0.1043 down
// that band, so the surface lands 9.1% of the stage width up from the bottom.
// Every level shares one floor, so this is a constant rather than something
// relayoutMobile has to read from a theme it cannot see. If the floor moves
// when the backgrounds change, this is the one line to update.
const DIFF_FLOOR_VU = (SIZE / (567.5 / 57.6)) * (1 - 0.1043);
// Clear air under the cluster on the start and learn screens, as a fraction of
// the view height. Without it a pit-full cluster rests ON the floor and pressing
// PLAY is a settle rather than a drop. This is the dial for how far things fall.
const DIFF_DROP = 0.04;
// Half the depth-1 ring, as a fraction of the circle's radius. An SVG stroke is
// drawn CENTRED on the path, so half of it lives outside the radius. At level 10
// the ring is 0.09 of a very large radius, and that overhang is what was putting
// the widest circle a hair past the wall. The fit now allows for it.
const DIFF_RING = 0.045;
// Level 10 wears a slightly finer ring. At that size the stroke is the thing
// that reads as heavy. Tapers in from level 5, so nothing at or below the
// default changes. 0.1 is a tenth thinner at the top of the slider.
const DIFF_STROKE_TRIM = 0.1;
// Two circles stack dead vertically, which reads as a snowman. A small tilt
// breaks that up. The PAIR only: three and four circle packs are already
// irregular, and tilting them would cost size for nothing.
//
// It is close to free up to about 3 degrees, because the smaller circle stays
// inside the bigger one's shadow. Past that the cluster gets wider and, since
// the fit is width-only, everything shrinks to compensate: 5 degrees costs 3%,
// 10 costs 11%. This is purely how the start and learn screens look, because
// pressing PLAY scatters them anyway.
const DIFF_TILT_DEG = 12.5;
// How far the default pit view is pulled back beyond DIFF_SPAN. The pit walls
// are derived from the view, so widening the view widens the pit in world terms
// while the packed circles keep their radii: the circles get smaller inside the
// same on-screen pit. One dial, used everywhere the pit resets to its default
// view, so the start screen, the round and the PLAY reset can never disagree.
// 1 leaves things exactly as they were. Raise it to shrink the circles.
const PIT_SHRINK = 2.1;
const PIT_SPAN = DIFF_SPAN * PIT_SHRINK;
// displayOnly (static /chums2 diagram) resting view: superseded 2026-09-03. The fixed
// DISPLAY_SPAN factor (a single view width) could not hold the gutters as the pack
// width varies per breed, so the resting frame is now a per-breed content-aware fit
// derived from the pack's real bounding box (see displayRestView / D57). Game paths
// still use PIT_SPAN, untouched.
const DIFF_INSET = 16;
// `fit` is the largest scale at which the whole cluster still fits the pit, both
// axes, whatever the circle count. Level 10 IS that, so the hardest setting
// means the same thing on a two-circle tree and a four-circle one.
//
// This used to measure the pit as DIFF_SPAN, 1.21, when the view actually pulls
// back to PIT_SPAN, 2.541. It was never updated when PIT_SHRINK landed, so
// level 10 was measuring against a pit 2.1 times narrower than the real one and
// came out 2.1x too small on the two-circle levels, which are 64% of them.
//
// The tuning hooks ?d0= ?d5= ?d10= ?tilt= and ?bc= have been removed. They
// existed so a number could be judged live instead of costing a patch and a
// deploy each time, and they have now done that job: the tilt was compared at
// 12.5 against 6.25 and 12.5 kept, and the easy end of the slider was compared
// at 0.25, 0.40 and 0.55 and settled at 0.40. The three constants below are read
// directly. ?toys=reset stays, on purpose.
// level: null outside the mini pit, where the packing is used untouched.
function diffScale(base: number, fit: number, level: number | null): number {
  if (level === null) return base;
  const l = Math.min(Math.max(level, 0), 10);
  const f =
    l <= 5
      ? DIFF_STOP_0 + (l / 5) * (DIFF_STOP_5 - DIFF_STOP_0)
      : DIFF_STOP_5 + ((l - 5) / 5) * (DIFF_STOP_10 - DIFF_STOP_5);
  return fit * f;
}
// The pit itself, in the packed units relayoutMobile works in. After the
// relayout the root radius is FW / (2 * PAD), so the view width is exactly
// FW * PIT_SPAN and the walls sit DIFF_INSET inside that.
// The pit has THREE sides. There is no ceiling, so height never limits how big
// the circles may be: a cluster too tall for the view simply runs off the top,
// and on a two-circle level that is the only way the circles reach the full pit
// width. Height decides one thing only, where the cluster rests.
const pitBox = (FW: number, FH: number) => ({
  w: (FW - DIFF_INSET) * PIT_SPAN,
  // where the BOTTOM of the cluster sits: the floor, less the air it falls
  // through, measured from the middle of the view downward
  restY: (FH / 2 - DIFF_FLOOR_VU - FH * DIFF_DROP) * PIT_SPAN,
});
// START runs at this multiple of the GAME OVER flash ramp. 1 matches it exactly.
const START_SCALE = 2;
// Where the two words sit, as a fraction of the FULL stage height measured from
// the centre line, which is the same convention the viewBox uses: 0.5 is the
// bottom edge. START at 0.38 puts it 88% down, using most of the dead space that
// was sitting under it, while leaving room for the ground band and the shake and
// slow-motion buttons. LEARN comes down from 20% to 38%.
const WORD_START_Y = 0.41; // 91% down
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
// The cookie policy panel, the main pit's own prop. It falls in, and a tap opens
// the notice that CookieBanner already renders above the pit, so there is one
// notice and one consent rather than a second implementation.
const TOY_COOKIES_SRC = "/cookies-policy.svg";
const COOKIES_ASPECT = 672.6 / 266; // the artwork's own viewBox, it is wide
const TOY_COOKIES_DELAY = 2000;     // the main pit drops it at 0:02.0
const TOY_COOKIES_SEEN_KEY = "pc-minipit-cookies-seen";
// Consent lives in localStorage and is permanent, so the panel never falls for
// someone who has already answered. NOTE: the main pit reads a DIFFERENT key,
// "pc-cookies". That mismatch is a real bug and is logged, not fixed here.
const COOKIE_CONSENT_KEY = CONSENT_KEY;
function cookieConsentGiven(): boolean {
  try { return !!localStorage.getItem(COOKIE_CONSENT_KEY); } catch { return false; }
}
// The bone, brought over from the main pit. Its artboard is 205 x 100, and the
// body it needs is a COMPOUND one: two end lobes and a shaft. A single capsule
// the size of the bounding box leaves air above and below the shaft, which is
// exactly the fault the stick's own three-part body was built to avoid.
const TOY_BONE_SRC = "/big-bone.svg";
const BONE_ASPECT = 205 / 100;
const TOY_BONE_GONE_KEY = "pc-minipit-bone-gone";
/* THE SECOND BONE, worn for a moment when the fuse fires. The main pit has this
   artwork and a cross-fade for it (PackPit.tsx:1756): hold it at full strength
   for a second, then fade back to the plain bone over 1.5 seconds.

   IT IS ON A DEAD PATH THERE. `fuseAt`, the flag that drives that cross-fade,
   is set in exactly one place, PackPit.tsx:1974, which sits inside onArrowFuse,
   and onArrowFuse is commented out at line 1986. So the main pit's LIVE fuse,
   onFuseMagnet, swaps nothing at all today. Wired up properly here. */
const TOY_BONE_OHYEA_SRC = "/big-bone-ohyea.svg";
const BONE_OHYEA_HOLD = 1000;  // full strength, main pit's 1s
const BONE_OHYEA_FADE = 1500;  // then back to the plain bone, main pit's 1.5s
// Dropped after the rock and before the chums, so it lands on a floor that has
// something on it rather than into an empty pit.
const TOY_BONE_GAP = 900;
/* The dog bowl, ported from the main pit (PackPit.tsx:364 and 392 to 405).
   Steve's call, 31 August 2026: FURNITURE. The main pit's bowl carries
   `isBowl: true` and a `bowlScored` Set and scores anything that lands in it.
   None of that comes across. This one is something to knock about and drop
   things into, and it scores nothing.

   A COMPOUND BODY, exactly like the bone above and for the same reason, only
   more so: a single rectangle would be a closed box and objects would sit on
   the lid instead of falling inside. The four parts are a floor, a centre bump
   and two angled walls, taken from the main pit's own figures against its
   1031.7 x 316.8 artboard.

   The 80 degree drop angle is the main pit's too. It arrives tipped almost onto
   its rim rather than flat, so it topples as it settles. */
const TOY_BOWL_SRC = "/dog-bowl-2.svg";
const BOWL_ASPECT = 3.22;
const BOWL_VB_W = 1031.7;
const BOWL_VB_H = 316.8;
const BOWL_DROP_DEG = 80;
const TOY_BOWL_GONE_KEY = "pc-minipit-bowl-gone";
/* The share of the pit floor a settled bowl may take. Was 0.7; raised to 0.805
   on 31 August 2026 at the owner's request, which is exactly 15% larger. Still
   leaves a bowl clear of both walls with room to be shoved about, rather than
   wedged between them: about 34px each side on a 360 phone and 39px on a 414.
   See the clamp in spawnToy for why this exists at all. */
const BOWL_PIT_FRACTION = 0.8855; // was 0.805, 10% bigger (owner, 2 Sept 2026)
/* ---- The breakable logo, stage 1 -------------------------------------------
   The Pedigree Chums mark, ported from the main pit (PackPit.tsx:536 to 560).
   It sits fixed near the top of the pit, the pack and the toys bounce off it,
   every knock sinks and tilts it a notch, and on the fifth it gives way and
   tumbles into the pile. That whole mechanic ALREADY EXISTS here for the navy
   corner squares, so stage 1 adds a body and nothing else.

   Owner's call, 31 August 2026: DESKTOP AND MOBILE. Note the main pit's own
   comment ends "Desktop only.", so this is a deliberate change of intent.

   NOT DONE HERE, on purpose: the six-stage art swap and the dropped pieces.
   The main pit paints those on a canvas through `plugin.img`; this pit is SVG
   and both have to be rebuilt as SVG nodes. Stages 2 and 3.

   THE WIDTH IS CLAMPED, same as the bowl and for the same reason. The main
   pit's LOGO_W is BIG * 6.8, which on mobile is about 383px against a pit
   about 380px wide, so unclamped it would be wider than the pit it hangs in. */
const LOGO_SRC = "/PC-logo.svg";
const LOGO_ASPECT = 595.3 / 356.5; // the artwork's own viewBox
const LOGO_BIG_MULT = 6.8;         // PackPit's LOGO_W = BIG * 6.8
/* The collider is smaller than the drawing: the mark sits in about 85% of the
   box across and 70% down it, so a corner of empty space does not take hits.
   PackPit line 548. */
const LOGO_BODY_W = 0.85;
const LOGO_BODY_H = 0.7;
/* THE SIX STAGES OF DAMAGE, stage 2 of the logo job (31 August 2026).
   Index 0 is the art after the FIRST hit, so the list is read as
   LOGO_STAGE_SRC[hits - 1] and an unhit logo keeps LOGO_SRC. Five entries for
   five hits, the same files and the same order the main pit uses in its own
   LOGO_STAGES (PackPit.tsx:564).

   THE PIECES ARE NOT DROPPED YET. Each of these files is the logo MINUS the
   elements that came off, and the main pit also spawns those elements as real
   bodies at their true spots. That is stage 3, and it is the part that still
   needs the canvas work rebuilding as SVG nodes. Here the elements simply
   vanish from the artwork. */
const LOGO_STAGE_SRC = [
  "/PC-logo-2nd-hit.svg",
  "/PC-logo-3rd-hit.svg",
  "/PC-logo-4th-hit.svg",
  "/PC-logo-5th-hit.svg",
  "/PC-logo-6th-hit.svg",
];
/* The artwork for a given hit count. One function, used by BOTH the per-frame
   writer and the React render, so the two can never disagree: a re-render
   triggered by anything else would otherwise snap the logo back to undamaged. */
function logoArtFor(hits: number): string {
  if (hits <= 0) return LOGO_SRC;
  return LOGO_STAGE_SRC[Math.min(hits, LOGO_STAGE_SRC.length) - 1];
}
/* ---- Logo stage 3: the pieces that come off ---------------------------------
   Each damaged artwork above is the logo MINUS some elements. This is those
   elements, spawned as real tumbling bodies at their spots on the logo, the
   same five sets the main pit drops (PackPit.tsx:609 to 652).

   SIZES ARE FRACTIONS OF THE DRAWN LOGO, not fixed pixels. The main pit sizes
   its pieces off BIG while its logo is BIG * 6.8, so the ratio is what matters:
   ours is clamped to the pit width and a piece has to shrink with it or a dot
   would be a third of the logo on a phone. Each `frac` below is the main pit's
   own size divided by BIG * 6.8. */
const LOGO_PIECES = [
  { src: "/why-dot-for-logofall.svg",         ar: 19.7 / 19.6, frac: 0.45 / 6.8 },
  { src: "/yellow-dot-for-logofall.svg",      ar: 19.7 / 19.6, frac: 0.45 / 6.8 },
  { src: "/shouts-for-logofall.svg",          ar: 69 / 71.4,   frac: 0.8 / 6.8 },
  { src: "/poofs-for-logofall.svg",           ar: 50.6 / 64.5, frac: 0.75 / 6.8 },
  { src: "/tagline-dot-for-logofall.svg",     ar: 174.1 / 23.9, frac: 2.0 / 6.8 },
];
/* THE SPOT BOX IS NOT THE ARTWORK'S SHAPE, and this is deliberate.
   Spots below are fractions of the logo's half extents, -1 at the left or top
   edge and +1 at the right or bottom. The main pit derives that box from
   150/64, its STALE fallback aspect, and not from the artwork's real 595.3 by
   356.5. Every spot was then tuned by eye against that box, so reproducing what
   the main pit actually looks like means copying the same figure rather than
   correcting it. Change it and all thirty spots move. */
const LOGO_SPOT_ASPECT = 150 / 64;
/* Seven white dots, hit one. The last is 40% smaller. [fx, fy, scale] */
const LOGO_SPOTS_DOTS: [number, number, number][] = [
  [0.6, -0.9, 1], [-0.94, -0.76, 1], [-0.7, -0.4, 1], [0.56, -0.3, 1],
  [-0.74, 0.1, 1], [-0.74, 0.7, 1], [0.6, 0.84, 0.6],
];
/* Three yellow dots, hit two: bottom left, top right, bottom right. */
const LOGO_SPOTS_YELLOW: [number, number][] = [[-0.7, 0.7], [0.7, -0.7], [0.7, 0.7]];
/* Four corners, hit three. Each carries a DYAD, two shouts splayed 33 degrees
   apart, the base angle pointing out from the centre. */
const LOGO_SPOTS_SHOUTS: [number, number, number][] = [
  [-0.8, -0.8, 225], [0.8, -0.8, 315], [0.8, 0.8, 45], [-0.8, 0.8, 135],
];
const LOGO_SHOUT_SPLAY = 16.5; // half of the 33 degrees
/* Hit four: one poof per side, out from the central axis. The main pit's 100px
   against a 571px logo, kept as a fraction so it scales with the clamp. */
const LOGO_POOF_OUT = 100 / (84 * 6.8);
/* Everything in the pit and every piece share this negative collision group, so
   pieces pass through the logo they came off and through each other, while
   still colliding with dogs, chips and toys. The main pit does the same job
   with a category and a mask; a group is two fewer moving parts and cannot be
   got the wrong way round. */
const LOGO_GROUP = -7;
/* ---- WHY THE MOUSE CONSTRAINT HAS ITS OWN CATEGORY --------------------------
   Matter's MouseConstraint keeps the LAST body whose vertices contain the
   pointer, not the first: the outer loop in MouseConstraint.js has no break, so
   a body added later to the world beats one added earlier. Chum cards arrive at
   9.0s, the bone at 8.4s, so a card lands ON the bone and wins every hit test.
   A chum is not in MC_KINDS, so onStartDrag then cancels the grab outright and
   the bone underneath never gets a look in. The same was true of anything the
   flood buried: sticks, the bowl, the logo pieces.

   The cure is to make a chum card invisible to the POINTER while leaving its
   physics alone. The constraint gets its own collision category and the cards
   carry a mask with that bit cleared, so Matter skips them in the search and
   finds whatever is underneath. Everything else in the pit is the default
   category 0x0001, which both still accept, so nothing about how a card
   collides changes.

   The cards are still collected: that is a double tap on the SVG node, React
   and not Matter, and it never went through the constraint. */
const MC_CAT = 0x0002;
const CHUM_MASK = 0xFFFFFFFF & ~MC_CAT;
/* Share of the pit width the drawn logo may take. Was 0.7; owner's call on
   31 August 2026, no more than 60% of the screen. The pit runs wall to wall
   with only a few pixels of margin, so its width and the screen's are the same
   figure for this purpose. */
const LOGO_PIT_FRACTION = 0.6;
/* THE LOGO COMES DOWN A TENTH, AND THE PIT BONE IS TIED TO IT (owner,
   18 September 2026).

   The two bones on screen were different sizes: the pit's thrown bone and the
   bone the PEDIGREE CHUMS logo is drawn inside. Measured on a 390 phone the
   logo's bone was about 230px across and the pit's about 191px.

   ONE SHRINK, APPLIED ONCE. LOGO_SHRINK multiplies the logo's drawn width
   wherever that lands, so both branches of its clamp come down together: the
   main pit's own figure on a wide screen and the share of the pit on a narrow
   one.

   THE PIT BONE IS NOT GIVEN A NUMBER. It is sized from the logo's width at the
   moment the logo is sized, so the two track each other on every screen and
   cannot drift apart again. LOGO_BONE_FRAC is the only measurement involved:
   the bone silhouette is 584.1 of the logo artwork's 595.3 across, taken from
   PC-bone.svg, which is that silhouette on the logo's own canvas. The pit bone's
   own artwork fills its canvas edge to edge, 400.7 of 400.2 measured, so its
   drawn width IS its bone's width and needs no allowance. */
const LOGO_SHRINK = 0.9;
const LOGO_BONE_FRAC = 584.1 / 595.3;
/* AND THEN THE ONE NUMBER TO NUDGE (owner, 18 September 2026). Matched to the
   silhouette alone, the pit bone came out about a third too big by eye, and the
   reason is that the logo's bone is not read as a bone: it holds the words, so
   it reads as a sign the shape of a bone. The pit's bone is a bone and nothing
   else, so it has to be smaller than the silhouette to look the same size.

   THEY ARE STILL TIED. This scales the figure taken from the logo rather than
   replacing it, so moving the logo still moves the bone and the two can never
   drift apart. This is the only number to touch if the bone still looks wrong:
   lower it to shrink the bone, raise it towards 1 to grow it.

   0.75 TO 0.56, 18 September 2026 (owner, on the device: still about 25% too
   big). 0.56 is 0.75 less a quarter. The tie is untouched, and nothing else
   moved with it. */
const PIT_BONE_MATCH = 0.56;
/* ---- Era props -------------------------------------------------------------
   Objects that belong to one era rather than to the pit as a whole. They take
   the place of the stick, big stick and rock in the props slot, and an era with
   no set of its own keeps those three.

   PNG WITH ALPHA, NOT SVG. A toy is drawn with an SVG <image href>, which takes
   any format: the flag has been a JPEG since the beginning. What matters is
   transparency, or the object lands as a white box. Aspects are the artwork's
   own trimmed dimensions. */
const TOY_NEWSPAPER_SRC = "/toy-newspaper.png";
const TOY_NEWSPAPER_ASPECT = 560 / 247;
const TOY_FORK_SRC = "/toy-fork.png";
const TOY_FORK_ASPECT = 420 / 596;
const TOY_SHOE_SRC = "/toy-shoe.png";
const TOY_SHOE_ASPECT = 520 / 343;
/* Drawn WIDTH in px, and the angle each drops at. Flat pixels on purpose: these
   two are sized against the pit itself rather than against the ball like every
   other prop, because near-vertical they are read as height, not width.
   86 and 94 degrees sit either side of upright, so the pair leans apart.
   Rotated, a 400px newspaper is only 176px across and a 500px shoe 330px, which
   is what lets them be this big in a pit about 390px wide. */
/* Which props wait and land INTO the flood of dogs rather than before it, so
   some of the pack is already down and the rest comes in on top of them. Add or
   remove a kind here, or empty the list to send them all in together as before.

   THE BOWL JOINED THE SHOE, 31 August 2026, owner's call: a bowl is worth
   having while the dogs are still raining down, not sitting on an empty floor
   waiting for them. It lands at the flood's halfway point, which is what
   `floodMid` is, so roughly half the pack is already down and the rest comes in
   around and into it. Moving it to the START of the flood would put more dogs
   in the bowl but would land it while it is still toppling from its 80 degree
   drop: use `chumsAt` in place of `floodMid` if that turns out to be wanted.

   This also supersedes the earlier "leave the bowl on the props beat" call from
   the same session. It no longer lands at 7.0s or 7.5s at all. */
const PROPS_IN_FLOOD: string[] = ["shoe", "bowl"];

const TOY_NEWSPAPER_W = 400;
const TOY_NEWSPAPER_DEG = 86;
const TOY_SHOE_W = 500;
const TOY_SHOE_DEG = 94;

const TOY_NEWSPAPER_GONE_KEY = "pc-minipit-newspaper-gone";
const TOY_FORK_GONE_KEY = "pc-minipit-fork-gone";
const TOY_SHOE_GONE_KEY = "pc-minipit-shoe-gone";

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
// The pink ball. The yellow one is gone the first time it leaves the pit; this
// one takes three throws to lose, and loses its colour on the way out. The
// count rides in sessionStorage beside the other toy state, so it survives
// between levels but resets on a fresh visit.
const TOY_BALL_PINK_GONE_KEY = "pc-minipit-ballpink-gone";
const TOY_BALL_PINK_THROWS_KEY = "pc-minipit-ballpink-throws";
const BALL_PINK_LIVES = 3;
const BALL_PINK_GAP = 1400;   // after the yellow ball, so they arrive separately
const BALL_PINK_BACK = 900;   // pause before it is tipped back in
// Pink first, then the pink drains out of it: same hue, less and less of it,
// until the third throw leaves it almost grey.
const BALL_PINK_FILTER = [
  "hue-rotate(252deg) saturate(1.55)",
  "hue-rotate(252deg) saturate(0.6)",
  "hue-rotate(252deg) saturate(0.2)",
];
// The level's chums pour in after the rock. They are scenery, not toys: they
// cannot be grabbed, opened or scored, and they are props rather than pit
// bodies, so they never count toward the pit-full loss. Size mirrors the learn
// rail thumbnail, clamp(38px, 7.5vw, 56px), but 33% larger: see CHUM_MIN below.
const CHUM_GAP = 600;       // after the rock, so the rock keeps its own beat
const CHUM_STAGGER = 85;    // ms between each, so they cascade rather than clump
// 33% up on clamp(38px, 7.5vw, 56px) by request.
//
// ALL THREE had to move, not just the vw. On a 390px phone 390 * 0.075 is 29,
// which the minimum floors to 38, so the chums drop at CHUM_MIN on every phone
// and raising only the vw would have changed nothing on the device this is
// tested on.
//
// This deliberately breaks the match with the learn rail thumbnail, which stays
// at clamp(38px, 7.5vw, 56px). They used to be the same size so they read as the
// same object; the pit ones are now half a step bigger than their rail card.
const CHUM_MIN = 51;
const CHUM_MAX = 75;
const CHUM_VW = 0.1;
// The main pit sizes every card off its breed's size band, PackPit.tsx line 22:
// small 57.5, medium 62.5, large 72.5, giant 82.5, used as a half-width. Those
// are the ratios, reproduced here against medium so the figure above stays the
// size a medium dog drops at and only the other three bands move around it.
// Giant lands at 1.32 times medium and 1.44 times small, which is the main pit's
// real spread, not a new one invented for the mini pit.
// Stretched from the main pit's own spread, which runs 1 : 1.09 : 1.26 : 1.43
// from small to giant, out to a flat 1 : 1.2 : 1.6 : 2 so a giant is exactly
// twice a small. Medium stays the anchor at 1, so CHUM_VW above is still the
// size a medium dog drops at. The mini pit therefore reads BIGGER at the top
// end than the main pit does, which was the call.
const CHUM_BAND: Record<string, number> = { small: 5 / 6, medium: 1, large: 4 / 3, giant: 5 / 3 };
/* THE RING PALETTE, one copy, read by both the ring and the fill.

   It lived inline in strokeColorFor until 2 September 2026, when the pit's
   circles started playing imageless and their FILL had to become the same colour
   as their ring. Having fillFor call strokeColorFor would have been the obvious
   move and it is the wrong one here: it breaks an existing memo and the React
   Compiler bails out of the whole component, which shows up as a new lint error
   rather than as anything visible.

   Module scope, so neither function reads the other and there is still only one
   place to change a colour.

   IT CYCLES every four depths: depth 5 is entry 1 again, 6 is entry 2. So these
   four have to stay legible against each other as well as against a photograph.
   Depths 1 and 2 are both yellow and 3 and 4 are both blue, which is the owner's
   scheme; a child ring sitting inside its parent will read as the same colour. */
/* DEPTH 3 LIFTED, #009fe0 -> #1ab0f0, 18 September 2026 (owner). It measured
   4.01:1 against the pit's navy fill, the only entry under 4.5 and a failure that
   predates every recent change; it is 4.85 now. Nothing else moves.
   THE FOUR bt-qmark-* FILTERS FOLLOW AUTOMATICALLY: they are generated from this
   very array with RING_PALETTE.map, so the ring and the mark cannot drift apart.
   The warning on those filters asks for them to be moved together and this is how
   that is honoured, by their being derived rather than typed out twice. */
const RING_PALETTE = ["#fff200", "#ffdf00", "#1ab0f0", "#36b8ff"];
/* THE PIT MARK, 2 September 2026 (owner). A circle in the live pit shows this
   instead of its photograph; the picture is what you get for lifting it out.

   REFERENCED, NOT INLINED. It first shipped with the path geometry pasted into
   this file, which meant every redraw needed a code change. It now loads the file
   directly, so replacing the asset is the whole job.

   THE COLOUR COMES FROM A FILTER, and it has to. An <image> paints whatever the
   file paints and cannot be recoloured with `fill`, so bt-qmark-navy in the defs
   maps every pixel's RGB to navy and leaves alpha alone. That works whatever
   colour the artwork is drawn in, which is the point when the file is meant to be
   swapped without anyone reading it first.

   THE BOX IS SQUARE AND THE ART NEED NOT BE. dogfacequestion.svg is 813.7 x
   463.5, so `meet` fits it by width and centres it vertically. A future file of
   any shape lands correctly without a code change; the only cost is that a very
   wide file uses less of the box's height. */
const QMARK_VB = 720;
const QMARK_SRC = "/dogfacequestion.svg";
/* THE TAPPED FACE, worn by a circle that is
   actually HELD in a chain, in place of the resting mark. Not by a glowing twin
   and not by every circle of the chain's breed: those keep the ordinary mark,
   turned white, which is the signal that they COULD join. This one says a circle
   IS joined, alongside the white mark and the white outline it already wears.

   IT DROPS STRAIGHT IN. Same 813.7 by 463.5 canvas as the resting mark, so it
   lands at the same size and position with no geometry to change, and the swap
   is one href.

   NOTHING IN IT FIGHTS THE WHITE. The artwork is black and nothing else: four
   filled paths with no fill of their own, so they paint the default black, and
   one open path stroked black at 12 units for the mouth. The recolour filter
   maps every pixel's RGB and leaves alpha alone, and it runs after the artwork
   is painted, so the stroke is recoloured with the fills and the whole face
   comes out white with its holes intact.

   The underscore in the filename is deliberate: the file arrived with a space
   in it, which is trouble in a URL. */
const QMARK_TAPPED_SRC = "/dogfacequestion_tapped.svg";
// stickBig is the same artwork half again as large, so the pair reads as two
// sticks of different sizes rather than one drawn twice
type ToyKind = "ball" | "flag" | "stick" | "stickBig" | "rock" | "ballPink" | "cookies" | "bone"
  | "newspaper" | "fork" | "shoe" | "bowl";
/* The props slot: the three objects that arrive together part way through the
   drop. A theme can replace them, which is how an era gets its own things to
   knock about. */
export const DEFAULT_PROPS: ToyKind[] = ["stick", "stickBig"]; // rock removed 2026-08-12 (no more rocks). NB: THEMES_ENABLED is false, so this default is the ONLY prop set in play on every level.
/* Which side the first prop falls on. Flipped every time a pit arms its props,
   so a reader playing several levels does not watch the same object land in the
   same corner every time. Module scope, so it survives a pit remounting. */
let propStartLeft = true;
const TOY_SRC: Record<ToyKind, string> = {
  ball: TOY_BALL_SRC, flag: TOY_FLAG_SRC, stick: TOY_STICK_SRC,
  stickBig: TOY_STICK_SRC, rock: TOY_ROCK_SRC, ballPink: TOY_BALL_SRC,
  cookies: TOY_COOKIES_SRC,
  bone: TOY_BONE_SRC,
  newspaper: TOY_NEWSPAPER_SRC, fork: TOY_FORK_SRC, shoe: TOY_SHOE_SRC,
  bowl: TOY_BOWL_SRC,
};
// every prop except the flag leaves for good once it is thrown clear of the pit
const TOY_GONE_KEY: Record<ToyKind, string> = {
  ball: TOY_BALL_GONE_KEY, flag: TOY_FLAG_SEEN_KEY,
  stick: TOY_STICK_GONE_KEY, stickBig: TOY_STICK_BIG_GONE_KEY,
  rock: TOY_ROCK_GONE_KEY, ballPink: TOY_BALL_PINK_GONE_KEY,
  cookies: TOY_COOKIES_SEEN_KEY,
  bone: TOY_BONE_GONE_KEY,
  newspaper: TOY_NEWSPAPER_GONE_KEY, fork: TOY_FORK_GONE_KEY, shoe: TOY_SHOE_GONE_KEY,
  bowl: TOY_BOWL_GONE_KEY,
};
function toyRetired(key: string): boolean {
  try { return sessionStorage.getItem(key) === "1"; } catch { return false; }
}
function retireToy(key: string) {
  try { sessionStorage.setItem(key, "1"); } catch { /* private mode */ }
}

/* ---- Retiring for an ERA rather than for the session ----------------------
   The balls come back when the reader reaches a new era. Throwing one clear
   costs you it for the rest of that era's levels and no longer, which keeps the
   loss meaningful without spending the toy for the whole visit.

   The era string is the value rather than a flag, so the check is simply "was
   it retired in the era I am in now". Nothing has to be cleared on the way out
   of an era: arriving somewhere else makes the old entry stop matching. */
function toyRetiredInEra(key: string, era?: string): boolean {
  try { return !!era && sessionStorage.getItem(key) === era; } catch { return false; }
}
function retireToyForEra(key: string, era?: string) {
  try { if (era) sessionStorage.setItem(key, era); } catch { /* private mode */ }
}
/* EMPTIED, 2 September 2026 (owner): "if thrown out they should not return on
   future levels". The two balls were the only members. They now retire for the
   session like everything else, so a ball thrown clear on level one is gone for
   level two and for every level after it.

   THIS REVERSES the rule written in the block above, that the balls come back on
   reaching a new era. The machinery is left in place and working, so putting
   that back is this array and nothing else.

   The pink ball's throw counter already lives in sessionStorage and is no longer
   cleared behind its own gone flag, so its three lives are now three across the
   whole session rather than three per round. */
const ERA_SCOPED_TOYS: string[] = [];

/* ---- Retiring for GOOD ----------------------------------------------------
   The flag carries a message, and once it has been read there is nothing left
   to say. Session storage put it back on the next visit, which meant showing
   the same notice to the same reader over and over.

   Local storage, so it survives the tab closing. This is the same treatment the
   cookie panel already gets, and for the same reason: it is a thing answered
   once, not a toy. */
function toyRetiredForever(key: string): boolean {
  try { return localStorage.getItem(key) === "1"; } catch { return false; }
}
function retireToyForever(key: string) {
  try { localStorage.setItem(key, "1"); } catch { /* private mode */ }
}
const PERMANENT_TOYS: string[] = ["flag"];

/* GIVE THE TOYS BACK, 2 September 2026 (owner).

   THE RULE IS PROGRESS, NOT TIME. A thrown ball is spent for the rest of the
   level you are on and for every level after it, because clearing a level is
   progress and you spent the ball getting there. FAILING a level is not progress,
   so a retry hands the set back, and so does a fresh run after a game over.

   That is the third scope this has had, and the first two were both wrong in the
   same direction. Per MOUNT gave the toys back on every level and every retry,
   which made throwing one out meaningless. Per SESSION kept them gone across a
   game over and out to the end of the tab, which was further than "future
   levels" ever meant.

   Exported so the page can call it from the two places that already mean "start
   again": onStartOver, the retry, and onResetRun, the fresh run. The key names
   stay private to this file.

   THE FLAG IS NOT INCLUDED. It lives in localStorage and is retired for good,
   because it carries a message that only needs reading once and starting again
   does not make it unread. The pink ball's throw counter IS included, or the ball
   would return already drained of colour and die on its next throw. */
export function resetToys() {
  try {
    for (const k of Object.values(TOY_GONE_KEY)) sessionStorage.removeItem(k);
    sessionStorage.removeItem(TOY_BALL_PINK_THROWS_KEY);
  } catch { /* private mode */ }
}
// ?toys=reset un-retires every toy on load, so a testing session does not have
// to reach for the browser console. sessionStorage is per tab and survives a
// reload, so once you have thrown the ball clear or read the flag's message
// they are gone for that tab until this clears them.
// Kept deliberately after the other test rigs were removed: it is harmless and
// saves a console visit every time the pit is worked on.





// A run of dogs is an open chain, so two is a chain. Its own figure rather than
// CHAIN_MIN_CARDS, which is the CARDS' loop minimum and means something else.
const DOG_CHAIN_MIN = 2;
/* THE CHAIN'S PULL, as a fraction of the CANDIDATE'S OWN radius outside its rim
   (owner, 18 September 2026). A circle joins when the finger comes within
   r * (1 + DOG_CHAIN_MAGNET) of its centre, so the finger no longer has to be
   on the circle at all.

   A FRACTION, NOT A FLAT NUMBER, because pit circles vary enormously and a flat
   halo would be a generous pull on a small one and a rounding error on a big
   one. Scaled to the candidate, the pull feels the same relative to whatever you
   are reaching for: a 20px circle gains 12px of halo, a 60px one gains 36px.

   FLOORED AT CHAIN_SAMPLE_PX. The sweep only tests every 12 client px, so a halo
   thinner than that would be stepped straight over and the pull would be a
   lottery. The floor is applied in the candidate's own space: see nearAt.

   CIRCLES ONLY, AND THAT IS NOT AN OVERSIGHT. The chum cards must TOUCH to
   chain (CHAIN_TOUCH_SLACK), and a card that does not touch the one before it
   KILLS the chain. A magnet there would pull a card in and then lose the player
   everything they had: they would feel the pull and be punished for it. The
   circles have DOG_CHAIN_SLACK of Infinity, no touching rule at all, which is
   exactly why the pull is free here. ChainKind.magnet is left undefined on CARD
   so the cards can opt in later if that rule ever changes. */
const DOG_CHAIN_MAGNET = 0.6;
/* DOG CIRCLES DO NOT HAVE TO TOUCH (owner, 18 September 2026). Any circle of the
   breed can start a chain and any circle of the breed can join it, wherever it
   sits in the pit. The chum cards are untouched and still must touch.

   THIS IS THE KIND'S SLACK, not a second rule: the shared gesture measures every
   link against ChainKind.slack in all four places it asks (the join, the live
   strain check, the release judgement and the circuit close), so Infinity here
   means "no gap is ever too wide" and nothing else has to know about it.

   WHAT BOUNDS A CHAIN, since the gap no longer does. REVISED 18 September 2026,
   after the owner played it: the wrong-breed circle used to head this list and
   killed the chain, which meant a chain still could not cross a packed pit. It
   refuses now (see blockKills on the DOG kind) and has left the list entirely.
   In the order they bite:
     1. THE PATH MAY NOT CROSS ITSELF, measured centre to centre between the
        circles, not along the finger's path. With links this long it is the
        hard one, and it kills.
     2. THE POOL: the same breed, in the pit, not already removed. A chain can
        never hold more circles than the breed has duplicates.
     3. A circle already in the chain, re-entered, kills it.
     4. The finger must actually pass over each circle: the sweep samples every
        CHAIN_SAMPLE_PX and joins what is under the sample, so the route is
        still drawn, not chosen.
     5. The join clock, chainAllowanceMs. It binds on the FIRST link, which has
        the base allowance and the whole pit to cross; after that it grows by
        CHAIN_JOIN_BONUS_MS a link and stops binding. */
const DOG_CHAIN_SLACK = Infinity;
/* HOW FAR THE FINGER MUST TRAVEL BEFORE A PRESS BECOMES A CHAIN, in client px,
   measured from the press point (owner, 18 September 2026).

   WHY IT EXISTS. Under DOG_CHAIN_SLACK almost every circle on a duplicate-heavy
   level is a starter. A starter press used to disarm the mouse constraint on the
   spot, which is precisely what stopped anything being dragged on Scottish
   Terrier. Nothing is disarmed at the press now: the drag arms exactly as it
   always did, and only a movement past this figure hands the pointer over. A
   short movement stays a drag; a longer one becomes a chain.

   IT MUST STAY ABOVE 8. The circle's own tap-to-open ignores a press that moved
   8px or more (see the tapUp listener on the circle, which also wants under
   350ms). Keeping this above that means a press can never be both a chain and a
   tap: by the time the chain takes the pointer, the tap has already ruled itself
   out. Below 8 and letting go of a short chain would open the learn layer as
   well. 14 leaves a little room either side of that floor and is still a short
   flick on a phone.

   TUNE IT HERE and nowhere else: the gesture reads the kind's armPx, which is
   this for circles and 0 for chum cards, whose press claims the gate outright as
   it always has. */
const DOG_CHAIN_ARM_PX = 14;
/* THE DOG PATH IS ONE LEMON LINE (owner, 18 September 2026, replacing the navy
   casing that was here, with the cost stated and chosen).

   WHAT A FLAT LINE IS UP AGAINST, and it has not changed: the path crosses five
   rarity tier fills, the pit's navy ground, the held circle's sky blue and the
   percentage chips, luminance 0.038 to 0.65. An exhaustive scan of the RGB cube
   against those eight puts the best possible worst case at 1.76, and that is pure
   BLACK, which is 1.76 on the pit floor itself, where most of a path lives.
   White bottoms out at 1.21, lemon at 1.00, the pink it once was at 1.22.

   SO THIS FIGHT CANNOT BE WON AND IS NO LONGER BEING FOUGHT. The casing won it by
   carrying a second tone; the owner has chosen the single line instead, knowing
   what it costs:
     lemon on the pit floor              9.89
     lemon on a held circle's sky blue   1.64
     lemon on a very-common twin         1.19
     lemon on a percentage chip          1.00, the same hex as CHIP_FILL, so the
                                         path VANISHES COMPLETELY over a chip
   That last line is the accepted cost, not a fault to fix.

   DO NOT FLIP THE HUE LOOKING FOR A WAY OUT. It has already been yellow, pink and
   yellow again chasing this, and the scan above says there is nowhere better to
   go. White is the only colour that beats lemon on every one of the eight, and
   white is the CHUM chain's line: taking it would cost the glance that tells the
   two kinds of chain apart. If the vanishing ever has to stop, the answer is the
   casing again, not another hue.

   THE CHUM CARDS ARE UNCHANGED, a plain white line, as they always were. */
const DOG_CHAIN_COLOUR = "#ffed00";
/* A CIRCLE WITH NO TWIN IN THE PIT FILLS BLACK, FROM THE DROP (owner,
   18 September 2026, replacing the light blue it wore for a day).

   THE HEX IS #0b1220, NOT PURE BLACK. It is the site's own night ground, the
   Superpower page's --sp-ground, so it is a value the project already stands
   behind rather than a new one, and it reads as very dark navy rather than as
   absence. Pure black measures within a point of it on every pair below; the
   choice is the look, not the numbers.

   ITS INK IS WHITE, the inverse of what the light fill took. 18.72:1.

   WHY THIS IS MORE THAN A FILL SWAP. Every overlay that crosses a circle had to
   be re-inked when the fill went light, because no single colour reads on both a
   dark fill and a light one: to clear 4.5 on navy needs luminance 0.3450 or
   above, and on the light blue 0.0676 or below, and the floor is above the
   ceiling. Going back to a dark fill puts all of them back on white. Measured on
   #0b1220:
     white ring, mark and label   18.72   (was navy at 6.03 on the light fill)
     the chain path and its sparks 15.48  (was 1.64, effectively invisible)
     the site yellow of a hover   12.96   (was 1.37)
   NOTHING FAILS, and the lemon path is the quiet win: it used to disappear over
   a light single and now reads at 15.48.

   IT DOES NOT LOOK LIKE A HOLE, which was the worry. A dark disc on the pit's
   blue would, with no rim; this one carries a WHITE ring at 18.72 against its own
   fill and 9.44 against the background, which is a stronger edge than any other
   circle in the pit has. It reads as the most present object on screen, which is
   the right weight for "this breed has no twin left".

   AGAINST ITS NEIGHBOURS, and the one weak figure is harmless. fillFor gives every
   ordinary circle its own RING_PALETTE colour, so a single sits among yellow and
   blue discs: 16.01, 14.09, 7.59 and 8.43. It is 9.44 against the pit's sky blue
   and 3.95 against the deeper blue. It is only 1.57 against the pit navy, and
   NO PIT CIRCLE IS NAVY: that colour appears as the label halo and the logo, never
   as a disc beside this one.

   THE CHAIN PATH STILL DOES NOT SWITCH, because one stroke crosses every fill and
   the ground at once. See DOG_CHAIN_COLOUR for what that costs. It simply happens
   to read far better on this fill than on the last one.

   THE TWIN GLOW NEEDS NOTHING, and its known edge case is GONE with the light
   fill: a chain breed losing its last duplicate mid-chain used to turn that circle
   light and drop the glow to 1.98 against it. On black the glow reads throughout. */
const DOG_SINGLE_FILL = "#0b1220";
const DOG_SINGLE_INK = "#ffffff";
/* HOW LONG THE FILL TAKES TO CHANGE. The answer is LIVE (see dogHasTwin), so a
   circle changes as a consequence of a DIFFERENT circle being collected. An
   instant flip on a circle the player never touched reads as a glitch; 150ms
   reads as a response. It softens the paint, never the timing of the answer. */
const DOG_FILL_FADE_MS = 150;
/* THE FILL A HELD CIRCLE TAKES (owner, 18 September 2026), alongside its white
   outline and its tapped face. A pit circle is filled with the site's navy,
   #0a3a57, which fillFor returns for every circle once the pit is live; this is
   --blue-sky from globals.css, the site's own light blue, written as a hex here
   because it is set on an SVG element from script, where a var() would not
   resolve. One name to change if another blue is wanted. */
const DOG_CHAIN_FILL = "#5cc4ee";
/* AN AVAILABLE TWIN WEARS ITS BREED'S RARITY COLOUR (owner, 18 September 2026).
   A circle of the chain's breed that is NOT yet held fills with the very colour
   its rarity tag uses, so where you can connect is obvious AND says something
   about what you are connecting.

   IT HAD A FLAT YELLOW FOR A DAY, DOG_CHAIN_TWIN_FILL, and a flat navy ink,
   DOG_CHAIN_TWIN_INK. Both are gone: there is no single fill any more, so there
   can be no single ink either.

   THE COLOURS COME FROM RARITY_BAND, exported from LineageMap rather than copied
   here, because five hexes in two files is two tables that drift. `bg` is the
   fill and `fg` is the ink, and the pair is already measured for exactly this
   job:
     extremely rare  #4d2e91 purple       white ink   9.93:1
     rare            #2547c4 royal blue   white ink   7.56:1
     uncommon        #5dbf86 green        black ink   9.26:1
     common          #f47421 orange       black ink   7.37:1
     very common     #fcee23 yellow       black ink  17.39:1

   NAVY IS DROPPED FOR TWINS, and that is measured rather than a preference. Navy
   against those five is 1.20, 1.58, 5.28, 4.20 and 9.91. It fails outright on
   the purple and the royal blue, worse than the white-on-light-blue pair that was
   rejected on the held circle and worse than the white-on-yellow this whole
   sequence was started to fix. A HELD circle keeps navy on sky blue: that pair
   is 8.9:1 and was never in question.

   THE TIER IS A FUNCTION OF THE NAME ALONE, rarityTier(treesContaining(name)),
   so every twin in a chain is guaranteed the same colour by construction rather
   than by luck: they are the same breed, so they are the same tier.

   A NAME THE ARCHIVE DOES NOT KNOW counts as 0 trees and falls through to
   extremely rare, so nothing is ever left unfilled. The cost is that an unknown
   name reads as purple. That is pre-existing, it is what the rarity tag already
   does, and it means a purple twin is not proof of rarity. */
/* AND HOW MUCH HEAVIER AN AVAILABLE TWIN'S RING IS (owner, 18 September 2026),
   on top of the yellow fill and the navy ink. A multiplier rather than a width,
   because a pit ring is a FRACTION OF ITS OWN RADIUS, not a flat number: see
   strokeWidthFor. A flat figure would read correctly on one circle and wrong on
   every other size, and would not follow the difficulty slider or the zoom.

   HELD CIRCLES ARE NOT TOUCHED. They are already said by the sky blue fill and
   the tapped face, and thickening them too would leave the two states with
   nothing to tell them apart but hue.

   The fifth of the chain's colours and weights, all five in a row here, one line
   each to nudge. */
const DOG_CHAIN_TWIN_STROKE_K = 2;
/* ONE LEMON LINE, THE CASING DELETED (owner, 18 September 2026, with the cost
   stated and chosen). The path and a held circle's rim are a single stroke of
   DOG_CHAIN_COLOUR, like the chum chain's single white line, and the navy under
   both is gone from the code rather than switched off.

   WHAT IT COSTS, measured and accepted: the lemon is the same hex as CHIP_FILL,
   so over a percentage chip the path measures 1.00 and DISAPPEARS COMPLETELY. It
   is 1.19 over a very-common twin and 1.64 over a held circle's sky blue. On the
   pit floor, where most of a path lives, it is 9.89.

   AND NO SINGLE COLOUR FIXES IT. An exhaustive scan of the RGB cube against the
   eight fills a path crosses puts the best possible worst case at 1.76, which is
   pure black, and black is 1.76 on the pit floor itself. There is nothing to
   swap to, so do not go looking: the choice is one line that sometimes vanishes
   or two tones that never do, and one line is what was asked for.

   DELETED, NOT HIDDEN, and that is deliberate. The ghost path came from a group
   that was half-removed; the casing group, its ChainKind field, its paint
   parameter, the collapse's copy of it and the held rim's outer stroke all went
   together. */
const HELD_RIM_K = 1;
/* HOW WIDE THE CHAIN'S CHIPS SCATTER, in client px, from the single point they
   all drop at (owner, 18 September 2026). A chain's chips used to appear where
   each closed circle stood, which read as several separate piles across the pit
   rather than as one payout. They now all come from the circle the player
   opened, and this is the only thing stopping them landing exactly on top of one
   another: each chip takes a random angle and a radius of sqrt(random) times
   this, which fills a disc evenly rather than bunching at the centre.

   22 is about two chips across. Wide enough that the solver is not asked to
   separate a stack of six coincident bodies on the first step, tight enough that
   six chips still read as one burst from one place. */
const DOG_CHAIN_CHIP_SPREAD_PX = 22;
/* Two circles, as a share of the larger diameter, so CHAIN_TOUCH_SLACK means the
   same for dogs as it does for cards. `h` is the radius here, and the angle is
   not read: a circle has no corners to turn. */
function chainCircleGapShare(A: ChainSq, B: ChainSq): number {
  const gap = Math.hypot(B.x - A.x, B.y - A.y) - A.h - B.h;
  return gap / (Math.max(A.h, B.h) * 2);
}
// Finger path sampling step in client px. Well under a card, so a fast swipe
// cannot jump clean over one between two pointer events.
const CHAIN_SAMPLE_PX = 12;
// How far apart two drawn cards may sit and still count as touching, as a share
// of the larger card's side. Resting cards meet within the solver's slop, not
// exactly, so zero would reject pairs that are visibly in contact.
const CHAIN_TOUCH_SLACK = 0.06;
/* LIVE BREAKS. Every link in the chain is re-tested against CHAIN_TOUCH_SLACK on
   every frame, because the pit keeps stepping and cards drift. A link that goes
   over it turns grey at once, STRAINED, and heals if the cards close up again.
   One that stays over for CHAIN_BREAK_GRACE_MS BREAKS: that link turns red with a
   gap at its middle, where the two cards should meet, and the chain is DEAD from
   that moment. Nothing more can join, the rest of the line greys and the live
   segment to the finger goes. Release still just clears. The grace is the same
   figure as CHUM_FLOOR_GRACE_MS and for the same reason: the solver parts
   resting bodies for the odd frame, and a chain must not die of that. */
const CHAIN_BREAK_GRACE_MS = 120;
/* THE CIRCUIT (owner, 17 September 2026). A chain only scores as a CLOSED LOOP.
   Once it holds CHAIN_MIN_CARDS or more, the first card is the one card that may
   be entered again, and only as the closing move: that closing link must touch
   and must not cross the path, like any other. The loop closes the moment the
   finger enters the first card. Nothing more joins after that, and the closing
   link is re-tested every frame with the rest. Ring only: the cards on the loop
   are collected, cards inside it are not.

   RELEASE. A chain of two or more is judged on the spot, with no grace. It must
   be closed, no link may have broken, every link (the closing one included)
   must be within CHAIN_TOUCH_SLACK, and no card may have been taken some other
   way meanwhile. Valid: every card goes through collectChum and the multiplier
   bonus is scored on top. Invalid, open or broken: nothing clears and nothing
   scores, but the path COLLAPSES, snapping at every link and falling away over
   CHAIN_COLLAPSE_MS, with a low falling tone, so a failed chain never looks like
   a missed gesture. A single card is a tap, not a chain, and ends silently. */
const CHAIN_MIN_CARDS = 3; // two cards cannot form a loop
/* THE TAP IS BACK, AND UNCONDITIONAL (owner, 18 September 2026). For a day the
   closed circuit was the only way to collect, with the tap unlocked only once
   the pit was down to its last few cards, and every remaining card breathing
   yellow to say so. Both are gone: one press arms a card and the next takes it,
   at any number of cards left, exactly as it always did. The circuit is a second
   way to clear, not the only one. A press that turns into a chain still cancels
   its collect, which is chainHeldCollectRef and is untouched. */
const CHAIN_MULT_STEP = 0.1; // each chum in the chain adds this to a multiplier starting at 1
/* PAID PER CONNECTION (owner, 18 September 2026), the moment one card joins to
   the next, flashed where the join happened like every other award. The closing
   link is a connection and pays too, so a closed loop of four cards pays four.
   It is NOT part of the multiplier, which still applies to the collect value of
   a cleared loop and nothing else.

   THE ONE THING A FAILED CHAIN KEEPS. Every other part of a failure pays
   nothing, but these are banked as they are made, so a chain that dies has
   still paid for the connections the player actually made. Deliberate. */
const CHAIN_JOIN_POINTS = 10;
/* THE JOIN NUMBER IS OUTLINED, NOT RECOLOURED (owner, 18 September 2026).

   A join number always lands ON a circle, never on bare floor, and no flat ink
   can read on every circle the pit holds. White measures 11.96 on the pit navy
   but 1.98 on a held circle's sky blue and 1.44 on the very-common yellow: to
   clear 4.5 on the navy an ink needs luminance at or above 0.3450, and to clear
   it on the sky blue at or below 0.0676. The floor sits above the ceiling, so
   there is no such colour. Same proof as the two pit fills.

   SO IT TAKES A CASING, exactly as the chain path does: a navy stroke behind a
   white core, painted stroke-first so the core keeps its full weight.
     white core on the navy casing          11.96
     navy casing on a held circle           6.03
     navy casing on the very-common yellow  8.28
     navy casing on a percentage chip       9.89
   On purple and royal blue twins the casing all but vanishes (1.20 and 1.58),
   and it does not matter: there the WHITE CORE is doing the work, at 9.93 and
   7.56 against those same fills. On the pit floor the casing disappears into
   the navy and the core reads at 11.96, which is what it always did. Every
   ground the number can land on is covered by one of the two. */
const FX_NUM_CASING = "#0a3a57";
const FX_NUM_CASING_K = 3;     // casing width, in the same units as the 15px type
/* THE JOIN SPARK. A connection throws a short burst of streaks in the chain's
   own colour out of the circle it just reached, so a join is felt as well as
   counted. It grows with the chain, because a twelfth link should feel like
   more than a second one, and is then CAPPED HARD.

   WHY THE CAP IS NOT NEGOTIABLE. Each spark is an SVG element created, stepped
   and removed. Uncapped growth on a long chain puts 20 on the twelfth link,
   around 160 over the chain and perhaps 60 to 80 alive at once. 20 is the
   ceiling the owner set and the reason it exists. */
/* TWICE AS INTENSE, AND STEEPER (owner, 18 September 2026). The burst was modest
   and grew gently; by the sixth connection it should be engulfing the circle.

   WHAT THE NUMBERS DO NOW. n = min(SPARK_MAX, round(SPARK_BASE + links * SPARK_STEP)):
     1st connection    13
     2nd               18
     3rd               23
     4th               28
     5th               33
     6th               38, which is the burst the owner asked to be large
     7th and after     40, the cap
   The base doubles from 4 to 8, the step goes 1.5 to 5, and the cap doubles from
   20 to 40 so the sixth can actually reach the figure the step implies: at the old
   cap everything from the third connection on would have looked identical.

   SPARK_GROW_K IS THE OTHER HALF OF "ENGULFING". The count alone makes a denser
   burst in the same small area; this is the speed and length multiplier, doubled
   from 0.06, so by the sixth connection the streaks reach 1.72 times as far as the
   first connection's instead of 1.36.

   THE FINAL CONNECTION IS UNAFFECTED BY THE STEEPENING and still throws the base,
   now 8 rather than 4: see SPARK_FINAL_LINKS. It is twice what it was, but it is
   still a fifth of what the sixth connection throws, so the completion flare keeps
   its moment. */
/* STEPPED UP AGAIN (owner, 18 September 2026: the sixth connection should feel
   like an event). Four dials move, and only one of them is the COUNT, because the
   count was the wrong one to reach for:

     COUNT makes the burst DENSER in the same small area. It was already at 38 of
     a 40 cap by the sixth, so raising it further mostly overlaps streaks with each
     other and reads as a blob rather than as more energy. It moves, but least.

     SPARK_GROW_K makes the burst BIGGER: it multiplies both the speed and the
     streak length, so it is the dial actually doing the engulfing.

     SPARK_WIDTH_K is new and costs NOTHING. Every streak was a flat 1.6 wide
     whatever the chain had reached; thickening them with the chain doubles the ink
     on screen without creating one extra element.

   n = min(SPARK_MAX, round(SPARK_BASE + links * SPARK_STEP)), so the cap now lands
   exactly on the sixth connection rather than biting at the third:
     1st  16 sparks, reach 1.2, width 1.8
     3rd  32 sparks, reach 1.6, width 2.3
     6th  56 sparks, reach 2.2, width 2.9
   Element cost: peak alive goes from about 176 to about 246. Against a blast's
   ~1,400 poof circles the combined worst case moves about 5%, so the bomb remains
   the term that would cost frames, not this. */
const SPARK_MAX = 56;          // hard cap, reached exactly at the sixth connection
const SPARK_BASE = 8;          // the first connection, and the completing one
const SPARK_STEP = 8;          // more per link after it
const SPARK_GROW_K = 0.2;      // how much further a later link throws, per link
const SPARK_WIDTH_K = 0.14;    // and how much thicker, per link. Free: no new elements
const SPARK_LIFE_MS = 340;
/* THE LAST CONNECTION THROWS WHAT THE FIRST ONE DID (owner, 18 September 2026).

   THE CLASH. Sparks grow with the chain, so the connection that COMPLETES it was
   throwing the most: up to SPARK_MAX of them, in DOG_CHAIN_COLOUR, out of exactly
   the dot the completion flare is trying to swell. Lemon streaks over a lemon dot
   is not a contrast problem that can be tuned, it is the same ink twice, and the
   flare loses.

   IT IS CUT BY PASSING 0 LINKS rather than by a second count, so the final
   connection throws SPARK_BASE and a `grow` of 1: the same short burst the FIRST
   connection of any chain throws. That is the figure because it is the one already
   in the file meaning "a connection happened, minimally", it needs no new number
   to keep in step with SPARK_BASE, and it still says a link was made rather than
   going silent, which would read as the chain breaking. */
const SPARK_FINAL_LINKS = 0;
/* THE COMPLETION FLARE (owner, 18 September 2026). Auto-complete fired the lift
   the instant the last twin was held, with nothing between the join and a new
   screen, which read as the game skipping a beat. The chain now holds for
   CHAIN_FLARE_MS while the dot on the completing circle swells and the glow
   comes up, then opens as before.

   ONE HARD SWELL AND SETTLE, NOT A PULSE. At 250ms a sine pulse gets through
   under half a cycle and reads as a single swell anyway; two swells would need
   about 360ms. The owner chose 250 and the swell, so the attack is loaded to the
   front (t to the power CHAIN_FLARE_ATTACK before the sine) to hit hard and
   settle slowly, rather than easing in and out evenly.

   THE HOLD IS MEASURED FROM THE JOIN, not from the sparks finishing. A spark can
   live SPARK_LIFE_MS times 1.3, about 440ms, and waiting for that would make the
   delay itself the thing the player notices. They are separated by cutting the
   sparks instead: see SPARK_FINAL_LINKS.

   THE GLOW FIGURES ARE THE RESTING ONES, NAMED. They were literals inside paint;
   the flare interpolates from them to the flare pair on the same envelope as the
   dot, so the line, the blur and the dot all swell together. */
const CHAIN_FLARE_MS = 250;
const CHAIN_FLARE_DOT_K = 2;      // unit * 0.22 becomes unit * 0.44 at the peak
const CHAIN_FLARE_ATTACK = 0.45;  // below 1 loads the swell to the front
/* THE GLOW GROWS WITH THE CHAIN (owner, 18 September 2026, and the dial wanted
   most). It was FLAT: 0.5 and 0.2 for the whole chain however long it got, and it
   only ever moved during the completion flare. So every bit of the chain's
   intensity lived in flashes at the join and none of it in the line itself.

   It now ramps from the resting pair to the full pair across CHAIN_GLOW_RAMP
   connections, so the WHOLE LINE brightens as the chain is built. That is what
   makes a sixth connection feel like an event rather than a bigger sparkle: it is
   continuous, and it is still there between the bursts.

   THE FLARE INTERPOLATES FROM WHEREVER THE CHAIN HAS REACHED, not from the resting
   0.5 it used to assume. A chain six links long is already at 0.9 when it
   completes, so flaring "up" to 0.8 would have dimmed it. chainGlow() is the one
   place the ramp is computed and both the live path and the flare read it. */
const CHAIN_GLOW_W = 0.5;         // the resting glow copy's width, a share of unit
const CHAIN_GLOW_BLUR = 0.2;      // the resting blur, same units
const CHAIN_GLOW_FULL_W = 0.9;    // where the ramp arrives
const CHAIN_GLOW_FULL_BLUR = 0.32;
const CHAIN_GLOW_RAMP = 6;        // connections to get there
const chainGlow = (links: number) => {
  const t = Math.min(1, Math.max(0, links) / CHAIN_GLOW_RAMP);
  return {
    w: CHAIN_GLOW_W + (CHAIN_GLOW_FULL_W - CHAIN_GLOW_W) * t,
    blur: CHAIN_GLOW_BLUR + (CHAIN_GLOW_FULL_BLUR - CHAIN_GLOW_BLUR) * t,
  };
};
/* THE FLARE HAS TO CLEAR THE RAMP'S CEILING, and this is the figure that had to
   move for it (18 September 2026). It was 0.8 and 0.35, chosen when the chain's
   own glow was FLAT at 0.5: a step up from anywhere. With the ramp reaching 0.9
   and 0.32 by the sixth connection, 0.8 is BELOW where a long chain already sits,
   so the swell would have gone nowhere on exactly the chains it matters most on.
   Set above CHAIN_GLOW_FULL_W and CHAIN_GLOW_FULL_BLUR, and it must stay above
   them: if the ramp's ceiling is ever raised, raise these with it. */
const CHAIN_FLARE_GLOW_W = 1.3;
const CHAIN_FLARE_GLOW_BLUR = 0.5;
/* THE FULL SWEEP BONUS (owner, 18 September 2026). Taking EVERY live circle of
   a breed pays on top of the connections.

   IT IS A BONUS, NOT A RULE. A chain of any length still clears: the strict
   version, where missing one circle failed the whole chain, was measured and
   rejected. 102 of the 166 lineage trees hold a breed with four or more copies
   and one holds 74, so a worked pit would have punished the player for a state
   they did not choose, hardest on the stock ancestors they meet most.

   WHY 10 A CIRCLE. A sweep of N already pays CHAIN_JOIN_POINTS * (N-1) in
   connections, so a flat 10 * N roughly doubles the chain and stays in the round
   units already flashing on screen. A 3 sweep goes 20 to 50, a 6 sweep 50 to 110.

   WHY IT STARTS AT 3. Most pits hold pairs: at the first pop layer the worst
   breed has exactly two copies in 67 of the 166 trees. Paying at 2 would pay a
   bonus for the default case rather than for a sweep. */
const CHAIN_SWEEP_MIN = 3;
const CHAIN_SWEEP_POINTS = CHAIN_JOIN_POINTS; // 10 a circle, deliberately the same unit
const CHAIN_COLLAPSE_MS = 450;
/* THE JOIN CLOCK. Time from joining one card to joining the next, the clock
   starting on every join, the first card included. Run out and the chain dies
   where it stands, with the collapse and the tone a break gets. Closing the
   circuit stops the clock for good: a closed loop waits as long as the player
   likes before letting go.

   IT GROWS WITH THE CHAIN (owner, 18 September 2026). 500ms, then a second, and
   now an allowance that lengthens with every connection made: the base for the
   first link, and a second more for each one after it. So the first link has
   1.5s, the second 2.5s, the third 3.5s, and so on.

   NO CAP, deliberately. A long chain becomes effectively untimed, which is the
   point: the clock is there to stop a chain being left half made, not to rush a
   player who is clearly in the middle of one.

   Both kinds of chain read this, so a chain of anything else is timed the same
   way without a second set of figures. */
const CHAIN_JOIN_BASE_MS = 1500;
const CHAIN_JOIN_BONUS_MS = 1000;
// The allowance for the next join, given how many connections are already made.
const chainAllowanceMs = (connections: number) =>
  CHAIN_JOIN_BASE_MS + CHAIN_JOIN_BONUS_MS * Math.max(0, connections);
type ChainSq = { x: number; y: number; a: number; h: number };
/* Separating axis test for two rotated squares (centre, angle in radians, half
   side). Returns the largest gap along any of the four axes: zero or less means
   they overlap or touch. */
function chainSquareGap(A: ChainSq, B: ChainSq): number {
  const dx = B.x - A.x, dy = B.y - A.y;
  const reach = (S: ChainSq, ux: number, uy: number) => {
    const c = Math.cos(S.a), s = Math.sin(S.a);
    return S.h * (Math.abs(c * ux + s * uy) + Math.abs(-s * ux + c * uy));
  };
  let gap = -Infinity;
  for (const ang of [A.a, A.a + Math.PI / 2, B.a, B.a + Math.PI / 2]) {
    const ux = Math.cos(ang), uy = Math.sin(ang);
    gap = Math.max(gap, Math.abs(dx * ux + dy * uy) - reach(A, ux, uy) - reach(B, ux, uy));
  }
  return gap;
}
// True only for a proper crossing. Segments that merely share an end point, or
// touch end to side, do not count.
function chainSegmentsCross(p1: ChainSq, p2: ChainSq, p3: ChainSq, p4: ChainSq): boolean {
  const o = (a: ChainSq, b: ChainSq, c: ChainSq) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const d1 = o(p3, p4, p1), d2 = o(p3, p4, p2), d3 = o(p1, p2, p3), d4 = o(p1, p2, p4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

/* ============================ REMOVE BEFORE LAUNCH ==========================
   ?floorbox=1 : the level floor width diagnostic, 2 September 2026.

   THE QUESTION. The wooden floor stops short of both screen edges on a real
   iPhone. Two reasoned fixes have now failed, so this measures instead of
   guessing a third time.

   WHAT WAS ALREADY RULED OUT, so nobody repeats it:
     the asset  ancient-floor.svg rasterises wood edge to edge across its whole
                viewBox. No transparent margin
     the clip   seamClip's polygon runs 2 * (vw + vh) past the frame, so it
                cannot trim a few px off a side
     siblings   .levelSky is inset -40% and .levelBg is min-width 100% centred,
                and neither shows a gap
     100vw      .levelFloor was switched to left 50% / width 100vw /
                margin-left -50vw and the gap SURVIVED it, which is the fact
                that makes every remaining theory suspect

   HOW TO READ IT. The panel prints the widths that must agree. Whichever line
   disagrees with `innerWidth` is the culprit:
     innerWidth / visualViewport   the two viewport measures iOS reports
     .level rect                   the floor's parent
     .levelFloor rect              the floor box itself
     img natural / client          the SVG's intrinsic size against its used one
   If the floor rect is full width but the WOOD is not, the asset lies about its
   own aspect and the fix is in the file, not the CSS.

   Strip this, the two refs, the effect and the panel once the question closes.
   ========================================================================== */
function floorBoxOn() {
  if (typeof window === "undefined") return false;
  return window.location.search.indexOf("floorbox=1") > -1;
}

function resetToysIfAsked() {
  if (typeof window === "undefined") return;
  if (window.location.search.indexOf("toys=reset") < 0) return;
  try {
    for (const k of Object.values(TOY_GONE_KEY)) sessionStorage.removeItem(k);
    // The permanent ones live in localStorage, so clearing the session leaves
    // them retired. Without this, ?toys=reset could never bring the flag back
    // and it would look like the reset was broken.
    for (const k of PERMANENT_TOYS) localStorage.removeItem(TOY_GONE_KEY[k as ToyKind]);
    sessionStorage.removeItem(TOY_BALL_PINK_THROWS_KEY);
    // the cookie panel is gated on consent, which is localStorage and permanent,
    // so clearing only the toy key would leave it shut and the reset look broken
    localStorage.removeItem(COOKIE_CONSENT_KEY);
  } catch { /* private mode */ }
}
function pinkThrows(): number {
  try { return Number(sessionStorage.getItem(TOY_BALL_PINK_THROWS_KEY) || "0") || 0; } catch { return 0; }
}
function setPinkThrows(n: number) {
  try { sessionStorage.setItem(TOY_BALL_PINK_THROWS_KEY, String(n)); } catch { /* private mode */ }
}
// Level floors: the deepest point of every era's drawn ground must sit the SAME
// height above the stage bottom, so no era eats more of the play area than the
// next. That height is a fraction of the stage WIDTH, set here. Each theme's show
// value (how much of its strip is drawn; the rest hangs off the bottom of the
// screen, cropped by design) is DERIVED from this target and the theme's own
// floorAspect and floorProfile max, so a new era lands on the same line with no
// hand-tuned number. Turn this dial to give the pit more or less height.
//
// The value is ancient-medieval's own floor fraction, the line its show of 1
// produced. Measurements round it to 0.0909; kept exact here so ancient does not
// move. floorShow() (by the floor helpers) does the per-theme derivation.
const LEVEL_FLOOR_TARGET = 0.0909116;
// Warn ONCE per era whose floor band cannot reach the target line. floorShow()
// runs every render, so an unguarded console.warn flooded the console every frame
// (and shipped to production). Theme objects are module singletons, so keying the
// set on the theme itself gives exactly one warning the first time each bad era is
// seen, then silence, without losing the diagnostic.
const warnedFloorEras = new WeakSet<LevelTheme>();
// The level background and the LEARN wash are two halves of one split screen.
// The wash is a slab tilted by this much, pushed off toward the top right; the
// level fills everything on the other side of that slab's leading edge. Both
// numbers are the wash's own, so the two edges are the same line by
// construction rather than by eye.
const WASH_DEG = 18;
/* THESE TWO ARE NOT WASH CONSTANTS ANY MORE, 9 Sept 2026. The .learnWash element
   they were named after has been removed, but seamClip still uses both to place
   the LEVEL background's diagonal edge, which is on screen every round. The
   original comments are kept so the numbers can still be traced to the geometry
   they came from. Do not delete them chasing the wash. */
const WASH_PEEK_X = 0.46; // was .learnWashPeek translate3d(46%, ...)
const WASH_INSET = 2.2; // was .learnWash inset: -60% -> 2.2 viewports wide
// 42 was a flat number, and that was the bug. The label block anchored 42 units
// above centre WHATEVER the circle's size, so as the tree goes deeper and the
// radii shrink the anchor drifts further off centre: 10% of the radius at the
// root, 33% by depth 2, 60% by depth 3, and past the rim by depth 4. Two
// symptoms, one cause. The text looked misaligned a little more at every step,
// and because labelFits measures the rotated corners FROM this anchor, the room
// it had collapsed, so the fitter shrank the type or gave up.
//
// A fraction of the radius, UNCAPPED (2026-08-12): the label block is now pulled
// to the TOP of the circle rather than sitting near the middle. 0.5 puts the
// first baseline half a radius above centre, and dropping the old -42px cap keeps
// it climbing on big circles too. Paired with the halved label size and the
// tighter LABEL_LINE_H below, so the smaller block still clears the rim up here.
// Was -min(42, 0.18r), which deliberately held labels near their middle;
// superseded on purpose, do not restore it thinking the top placement is a drift.
const TITLE_DY_FRAC = 0.65; // was 0.55; +0.1 = a scaled 10px UP at reference radius 100, proportional on other circles (14 August 2026)
// Horizontal companion to TITLE_DY_FRAC: shift the block sideways by this fraction
// of the radius. Positive is RIGHT, negative is LEFT. New 2026-08-12; there was no
// horizontal offset before (the block was centred at x=0). labelFits adds it too,
// so a label pushed toward the rim is shrunk or dropped rather than spilling over
// it, and it follows this sign automatically.
// FLIPPED TO THE LEFT, 15 September 2026 (owner: move the text so it sits on the
// left of the centre point rather than the right). Same distance, mirrored, so
// nothing about the fit or the size changes. TITLE_ANGLE is untouched, so the
// block still leans the same way; if the lean now reads wrong against the new
// side, that constant is the one to move, not this one.
const TITLE_DX_FRAC = -0.2; // was 0.2 (right), and 0.1 before that
function titleDy(r: number): number {
  return -Math.max(0, r) * TITLE_DY_FRAC;
}
const TITLE_ANGLE = 4; // was 1 (was -5); +3 more degrees clockwise (14 August 2026). Learn circle labels only.
// chums2 stroke-only diagram (2026-08-23): the centred name (no photo now) takes a
// small LEFT nudge and a slight counter-rotation, in place of the game's right-shifted
// +4deg arc. DX is a fraction of the fit radius (negative = left), ROT is degrees. Both
// tunable, both displayOnly-gated at the label draw.
const DISPLAY_LABEL_DX = -0.08;
const DISPLAY_LABEL_ROT_DEG = -3;
type Node = HierarchyCircularNode<LineageNode>;

// A circle whose name repeats its parent's is not a second animal. It is the
// same dog carrying on: this line, crossed with the one other dog beside it.
// The parent circle already stands for that dog, so drawing its name again
// inside itself says the same thing twice, which is what made the Celtic Heeler
// level read wrong.
//
// It stays in the tree rather than being deleted from the data. That matters:
// the pack sizes every parent from its children, so removing one would make its
// only sibling swell from half the parent's radius to 0.95 of it, and it would
// also drop out of the chum rail index. Left in and merely not drawn, the sizes,
// the badge percentages and the rail are all untouched, and what you see is one
// half-size circle inside its parent, which reads as "this dog, plus the one
// other dog". The empty half IS the parent.
//
// 19 August 2026: an experiment to DRAW both circles was reverted, and the
// eleven ROOT-level self-repeats were removed from the data (each level now
// carries its own name on the outer ring, so those did not need drawing at all).
// The echoes that remain are the deeper sub-ring self-duplicates, which keep an
// intermediate stock name visible one or more rings down; those stay hidden.
//
// It is skipped in two places and only two: the drawing, and the pop that turns
// children into physics bodies.
function isEcho(d: Node): boolean {
  return !!d.parent && isEchoName(d.data.name, d.parent.data.name);
}

/* THE SAME FAULT, THE OTHER RELATIONSHIP (owner, 18 September 2026).

   isEcho asks CHILD AGAINST PARENT. It cannot see a pair like Ancient Molossers'
   two `Old Mastiffs of the East`, because those repeat EACH OTHER, not their
   parent. Same dog drawn twice side by side, same name, same picture, 50% and 50%,
   and the existing predicate was written for only one of the two shapes.

   IT IS NOT RARE. Twenty distinct duplicate-sibling patterns across the archive,
   the largest reaching 37 trees and 138 occurrences. Ancient Molossers is 23 trees.

   ONLY AN IDENTICAL COPY IS HIDDEN, and that is the whole rule: same name AND the
   same subtree, values included. Two of the twenty carry copies whose VALUES
   differ (Old British ratting Terriers > Earth Dog, and Cairn Terrier > Skye
   Terrier stock). Those are not copies, they are two contributions of different
   weight that happen to share a name, and hiding one would either lose its share
   or require summing it into the other. Summing would MOVE A PERCENTAGE, which is
   the one guarantee that makes hiding safe at all, and it would do so across 138
   occurrences. So they stay drawn, and the signature below is what decides.

   THE FIRST ONE STAYS. Hidden means the second and any after it.

   THE SIGNATURE IS CACHED ON THE RAW NODE, in a WeakMap, because this is asked
   inside render and physics loops. Each raw LineageNode is walked once, ever. */
/* THE SIGNATURE AND THE ECHO RULE MOVED OUT, to data/lineageShape.ts, so
   LineageMap reads the same ones (18 September 2026). They lived here for a day
   and that day produced five faults from the two files disagreeing about what a
   copy is. What stays here is only the d3 shape of the question: these take a
   HierarchyCircularNode and the shared module takes raw LineageNodes. */
function isDupSibling(d: Node): boolean {
  const p = d.parent;
  if (!p || !p.children) return false;
  const i = p.children.indexOf(d);
  if (i <= 0) return false; // the first copy is the one that is drawn
  const sig = subtreeSig(d.data);
  for (let j = 0; j < i; j++) if (subtreeSig(p.children[j].data) === sig) return true;
  return false;
}
/* WHAT THE REST OF THE FILE SHOULD ASK. A circle the player never sees must also
   never be a body, never be counted as a breed in the pit, never drop a chip and
   never let a chain start on it. Both predicates mean exactly that, so every site
   that used to ask isEcho asks this instead. The one exception is ?spindiag=1,
   which names the two separately because telling them apart is its job. */
function isHiddenCopy(d: Node): boolean {
  return isEcho(d) || isDupSibling(d);
}

/* WHAT IS LIVE IN THE PIT, BY BREED, ASKED IN ONE PLACE (owner, 18 September
   2026).

   THREE THINGS READ THIS and they must never disagree: the chain's startable
   rule (a chain needs a twin), the resting single-circle fill (chSingle, which
   says "this breed has no other copy in the pit"), and the full sweep bonus (has
   the chain taken every live circle of the breed). They used to be two separate
   walks of the same set with the same filters, agreeing by construction rather
   than by sharing code, which is one careless edit away from the rule and the
   colours saying different things.

   THE FILTER IS THE PART THAT MATTERS: the owned set, less the hidden root, less
   the echoes (a circle named after its own parent), less anything already
   removed. pitCountable is that filter and nothing else may re-spell it.

   MODULE SCOPE ON PURPOSE. As a closure in the component these wanted to be a
   dependency of the chain effect, which is bound once and must stay that way, so
   they take what they read as arguments instead and cannot capture anything
   stale.

   THE ANSWER IS LIVE, AND THAT IS THE POINT. See the long note on dogHasTwin: a
   breed drops to one the moment its last duplicate is collected, and a pit
   converges on uniqueness as it is played. Do not cache it, do not freeze it. */
function pitCountable(n: Node, removed: Set<Node>): boolean {
  return n.depth !== 0 && !isHiddenCopy(n) && !removed.has(n);
}
function liveBreedNodesIn(owned: Set<Node> | undefined, removed: Set<Node>, name: string): Node[] {
  if (!owned) return [];
  const out: Node[] = [];
  for (const o of owned) if (o.data.name === name && pitCountable(o, removed)) out.push(o);
  return out;
}

// Rarity tiers, keyed to how many distinct lineage TREES the dog appears in
// across the WHOLE dataset (see treesContaining). Dataset-wide, not per level, so
// the same dog reads the same tier wherever it is lifted. Fewest trees = rarest:
// a modern terminal breed sits in one tree; an ancient ancestor threads through
// many. Every collected circle carries a band.
/* FIVE TIERS, RE-CUT 16 SEPTEMBER 2026 (owner). The count is treesContaining:
   how many of the 160 lineage trees a dog turns up in.

   WHY THE OLD FOUR WERE WRONG. Counts run 1 to 96 and "common" started at 7, so
   Old hunting dogs of the Celts at 96 wore the same badge as a dog in 7. The top
   band swallowed nine tenths of the range. Measured across all 251 names, the old
   cuts gave common 28%, uncommon 10%, rare 20%, extremely rare 42%: the rarest
   tier was the biggest and uncommon was a three-wide squeeze.

   THE NEW CUTS, AND WHAT THEY PRODUCE (251 names):
     50+    VERY COMMON       14 names,  6%
     11-49  COMMON            40 names, 16%
     7-10   UNCOMMON          17 names,  7%
     3-6    RARE              38 names, 15%
     1-2    EXTREMELY RARE   142 names, 57%
   COMMON now outnumbers UNCOMMON, which is what the owner asked for.

   THE PYRAMID IS NOT INVERTED, THOUGH THE NAME COUNTS LOOK LIKE IT. Counting the
   10,106 circles a player can actually meet across all trees rather than distinct
   names, the top tier is 72% of them and the bottom two are 5% between them.
   Seventeen dogs account for three quarters of everything on screen. A trading
   card set works the same way: more distinct rares exist than commons, and you
   pull commons constantly because each is printed thousands of times.

   WHY EXTREMELY RARE IS STILL THE BIGGEST BAND, AND CANNOT NOT BE. 105 of the 251
   names appear in exactly ONE tree, so any band containing 1 starts at 42% before
   it includes anything else. That is the shape of the data, not the choice of
   numbers. The cause is that the metric rewards being well CONNECTED: a dead end
   with no parents sits in one tree, and the moment it is given ancestry it
   inherits the reach of everything above it. The rough water dogs went from
   unreachable to 34 trees by gaining one parent. Fixing that means changing the
   metric, weighting by share rather than counting trees, and it was parked until
   the ancestry work settles. Expect this pile to keep thinning on its own
   meanwhile, which is why these cuts will want another look later. */
type RarityTier = "extremelyRare" | "rare" | "uncommon" | "common" | "veryCommon";
function rarityTier(count: number): RarityTier {
  if (count >= 50) return "veryCommon";   // 50+   VERY COMMON     (yellow)
  if (count >= 11) return "common";       // 11-49 COMMON          (orange)
  if (count >= 7) return "uncommon";      // 7-10  UNCOMMON        (green)
  if (count >= 3) return "rare";          // 3-6   RARE            (royal blue)
  return "extremelyRare";                 // 1-2   EXTREMELY RARE  (purple)
}

// Breed titles are fitted to the circle they belong to. The name is wrapped
// across 1 to LABEL_MAX_LINES balanced lines and every option is measured; the
// wrap that allows the largest type while keeping all four corners of the text
// block inside the circle wins. A very long name therefore takes a third or
// fourth line instead of spilling over the rim.
/* How much a lone child shrinks. See the pack pass in `nodes` for the whole
   reasoning, including why it is then pushed to one side.

   0.62 -> 0.75 -> 0.5 (owner, 19 September 2026), and 0.5 is not a taste figure. It
   is the one value at which a lone child is geometrically IDENTICAL to the shape the
   19 August device produces, which is the look signed off on Ancient Mastiff: Dogs of
   the Alan Horsemen offset inside Alaunt War Dogs.

   THE TWO WERE DIFFERENT SHAPES. The device gives a node two equal children; pack
   places them tangent to each other, so with padding P the parent's radius is 2r + P
   and each child sits r from the centre. A lone child starts at R - P instead, so
   matching it means halving: (R - P) / 2 is exactly the device's r. Hence 0.5, and
   nothing else. 0.75 was reasoned from "the crescent does the work" without checking
   it against the shape already agreed.

   DO NOT RAISE IT without measuring against a device pair. The two paths have to
   stay indistinguishable, because the device removal turns every one of those pairs
   into a lone child. */
const SOLO_CHILD_K = 0.5;
const LABEL_MAX_LINES = 4;
const LABEL_CHAR_W = 0.62; // fallback glyph width in ems, before the font loads
// Line height in ems for every label inside a circle, and the single source
// for it: the fitter reads it and both renderers now interpolate it, so the
// drawn spacing and the spacing the fitter measured can never drift apart.
// Tightening this also lets the fitter find a larger type size, because the
// same words now occupy a shorter block, so multi-line names grow a little.
const LABEL_LINE_H = 0.7; // baseline-to-baseline in ems (0.9 -> 0.6 -> 0.7, Steve's tuned value). Shared by circle labels, badge labels and pit words.
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
// How much larger a name is drawn in the pit than it was inside its circle. It
// has no ring or picture around it any more, so a little more weight is fair.
// Only in the pit: lift it out and it goes back to the circle it always was.
//
// 1.3, then 1.95, now 1.05. The audit is why. Difficulty does not touch this
// number at all: it resizes the CIRCLES, and a name is fitted to its circle, so
// the word follows. Level 5 to level 10 grows a circle's radius 74%, and at 1.95
// that carried the widest word to 103% of the stage on Bulldog and 110% on Jack
// Russell. A word wider than the pit cannot fit however it tumbles.
//
// At 1.05 nothing overflows at any difficulty: the widest case falls to 59%.
// Measured on Border Collie, Bulldog and Jack Russell across all eleven slider
// positions, by running the real fitter against the real layout.
//
// The trade, honestly: this puts the pit word within 5% of the size the label
// was inside its circle, which is the situation the constant was raised to fix
// in the first place. 1.3 is the middle if that reads too quiet.
const PIT_WORD_SCALE = 2.268; // 1.05 -> 0.84 -> 0.756 -> 2.268 (3x bigger, 14 August 2026). Play-area pit words only; separate from the learn labels' size factor. Pure multiplier applied AFTER the fit at line 3307, so nothing caps it.
// A constant lean added to each pit word's LIVE tumble angle, in degrees (negative =
// counter-clockwise). It rides the physics rotation, so it is imperceptible while a
// word spins and reads as a fixed lean once the word settles. Play words only.
const PIT_WORD_ANGLE = -3;
// The pop as the circles go. Starts at nothing, overshoots to 115%, settles.
// Timed off the drop rather than off each body, so the names arrive together.
const WORD_POP_MS = 380;
// How much of the pit's width settled bodies must block, at the top zone, for
// the round to be over. A fraction rather than a head count, because a mini pit
// tree often holds only two or three circles. Two bodies is the floor, so one
// wide circle resting high cannot end a round on its own.
// Fraction of the pit's width that settled circles must cover to count as full.
// Divided by PIT_SHRINK because widening the view widens the pit in world terms
// while the circles keep their radii: without this, the same physical heap
// covers proportionally less and a level would become much harder to lose.
const PIT_FULL_COVER = 0.72 / PIT_SHRINK;
/* HOW HIGH THE HEAP HAS TO REACH before it counts as full, in px from the top of
   the stage. A settled body is "in the zone" once its TOP edge crosses this line.

   150 -> 90, 2 September 2026 (owner): the line moves UP the screen, so the pile
   has to build higher before the occupancy test can fire, and a round lasts
   longer. Lower the number to make the round longer still; raise it to end
   rounds sooner.

   IT IS ONLY ONE OF THE TWO TRIGGERS, and usually the loser. The other is the
   first chum card touching the FLOOR, which has no threshold and no dwell, and
   the chums arrive last, so on most levels that fires before the heap ever
   reaches this line. If rounds still end sooner than you want, that trigger is
   the thing to change, not this number.

   It was an inline literal inside computeFull. Named here so it sits with the
   other pit constants and is a one-line tune from now on. */
const PIT_FULL_ZONE_PX = 90;
/* NO PIT-FULL COUNTDOWN FOR THE FIRST 20 SECONDS OF A LEVEL (owner,
   18 September 2026).

   THE CLOCK STARTS AT THE LANDING, NOT AT THE ROUND. armToys() fires on the
   first body to touch the floor, which is the moment the drop arrives and the
   beat every toy already times off, so the grace runs from there: a slow drop
   does not eat into it. It is ALSO seeded beside fullClock when the sim starts,
   so a level where nothing ever reaches the floor still gets its 20 seconds
   rather than none.

   IT REUSES cdGraceRef, the 2.5s post-rescue grace, because both say exactly the
   same thing: the countdown may not begin before this timestamp. Both trigger
   paths already consult it, the occupancy poll in checkFull and the
   chum-hits-floor branch in the collision listener, so nothing new had to be
   threaded through either. cancelCountdown's 2.5s cannot shorten this one: a
   cancel can only happen after a countdown started, which needs the grace to
   have expired first.

   THE POLL'S OWN 4s SETTLE-IN STAYS. It is a different guard for a different
   reason (a pit that has not come to rest yet) and 20s dominates it. */
const PIT_FULL_GRACE_MS = 30000;
/* AND A BONUS FOR A BUSIER DIAGRAM (owner, 18 September 2026). A level with more
   to work through gets longer before the countdown may start.

   WHAT COUNTS AS A CIRCLE: depth 1 and depth 2, echoes excluded. That is what the
   START SCREEN DRAWS, the big dogs and the one ring nested inside each of them,
   which is the diagram the player is looking at when they press PLAY. Checked
   against Ancient Mastiff, which draws 2 and 2 and counts 4.

   THE TWO ALTERNATIVES WERE MEASURED AND REJECTED. Depth-1 dogs alone tops out at
   FOUR across all 166 trees, so the bonus would never exceed 5 seconds and the
   owner's own ten-circle example could not happen. Every non-hidden node in the
   tree runs to 323 on Lucas Terrier, which at this rate would be twenty minutes
   of immunity. Depth 1 and 2 is the only count that matches both the screen and
   the intent.

   THE FIRST TWO EARN NOTHING, so the floor is the flat 30 seconds: almost every
   level has at least two, and paying for them would just be raising the base.

   THE RATE IS 2.5 SECONDS, chosen over the 5 the owner also offered. Across the
   166 trees the count runs 0 to 16, median 6. At 2.5 the median level gets 40
   seconds and the busiest, Irish Setter at 16, gets 65. At 5 those become 50 and
   100, and a hundred seconds of immunity is most of a round. One constant to
   change if the longer end is wanted after all. */
const PIT_FULL_GRACE_FREE = 2;
const PIT_FULL_GRACE_PER_CIRCLE_MS = 2500;
function pitFullGraceMs(ns: Node[]): number {
  let n = 0;
  for (const d of ns) if (d.depth > 0 && d.depth <= 2 && !isHiddenCopy(d)) n++;
  return PIT_FULL_GRACE_MS + Math.max(0, n - PIT_FULL_GRACE_FREE) * PIT_FULL_GRACE_PER_CIRCLE_MS;
}
/* THE ONE YELLOW EVERY LIVE PERCENTAGE CHIP WEARS (owner, 18 September 2026,
   seen on Kerry Blue Terrier: two different yellows side by side in one pit).

   WHAT WAS HAPPENING. The chip fill read `item.green ? "#ffed00" : "#ffd23e"`,
   two hexes written into the render. `green` means the chip's picture had
   already been placed on the layer it scattered from, and only ONE of the five
   spawn routes ever sets it: the learn-layer scatter. The initial seed,
   popChildren twice over, dogClose and the solo leaf all leave it false. So a
   pit holding chips from a completed learn layer AND from the drop showed both
   colours at once, which read as a fault rather than as a state.

   ONE SOURCE NOW. Every live chip is lemon, from here, and the render carries no
   chip hex at all. #ffed00 is the lemon rolled out across the reveal card, the
   shortlist bar, the knockout round and the superpower pages.

   WHAT `green` STILL DOES, because this does not retire it: the charge count
   (20 against 10), the bond rule that only lets like stick to like, and the
   INERT colour, where a spent learnt chip goes white and every other spent chip
   goes blue. That last one is now the only place the flag shows on screen, so
   two chips that look identical alive can still die different colours. Flagged
   to the owner, left alone deliberately. */
const CHIP_FILL = "#ffed00";
/* HOW MANY KNOCKS A SCATTERED PROP TAKES before it goes. Two things carry it,
   the name PILLS and the RODS, and until now it was an inline 2 written twice
   with nothing tying them together.

   THE PILLS ARE HALVED, 18 September 2026 (owner): 2 to 1, so one knock kills a
   navy name pill. The rods keep 2 and have their own figure now, so halving one
   can never quietly halve the other.

   NOT the chips, which carry `charges` (10, or 20 once learnt), and NOT the
   bombs, which take BOMB_HITS. Three different counters on three different
   objects, named apart here so the next person does not have to work that out
   from the call sites. */
const PILL_HITS = 1;
const ROD_HITS = 2;
// The yellow percentage badge, drawn and collided at this radius. Doubled from
// 46: they were easy to lose against the circles, on the start screen and in
// the pit alike.
// J17: a scattered percentage badge has this chance of arriving as a bomb.
// The main pit's own figure, PackPit.tsx scatterRef, where a comment records it
// was raised from 1 in 35 for better chain reactions.
// 2 September 2026 (owner): 20 -> 16, a wildcard in every sixteen. Both roll
// sites read this one constant, the scatter and the pop, so they cannot drift.
const BOMB_ODDS = 16;
// The fuse is 2.5 seconds, half the main pit's five. Five is not a magic number
// there, it is a divisor in four places, and all four are halved together here
// or the sparks peak after the blast, or fizz at full doing nothing:
//   1. the intensity ramp, held * 5 over 5000ms becomes held * 10 over the same
//      window, so it still reaches full exactly as the fuse runs out
//   2. one hit per whole second becomes one hit per half second
//   3. the vibration step doubles, so it reaches the same peak in half the time
//   4. clicks step by whole hits, so a click is now worth twice as much
const BOMB_HITS = 5;          // hits to detonate
const BOMB_FUSE_MS = 2500;    // the whole fuse
const BOMB_TICK_MS = BOMB_FUSE_MS / BOMB_HITS; // one hit per half second held
// The blast is tuned for the main pit, whose cards are far bigger than a mini
// pit chip, so a straight copy reads as an overreaction. ONE dial: it scales
// every size handed to the shared effects, and the flat constants inside them.
// 1 is main pit size. Lower is smaller.
const FX_SCALE = 0.7;
/* How far the chain reaches, in hops. The chain is a flood fill: everything
   touching the bomb goes, then everything touching those, and so on.

   UNLIMITED AGAIN, 18 September 2026 (owner). THE HISTORY MATTERS, so nobody
   puts the cap back without knowing what they are undoing:

     IT WAS UNLIMITED ORIGINALLY, and it was capped at 2 because one bomb took
     the entire connected mass of chips and in a crowded pit they are all in
     contact, so a single bomb cleared the floor. That was a true observation and
     the cap was the right call AT THE TIME.

     IT IS LIFTED because a bomb that propagates through a cluster is now what is
     wanted: the blast should follow touching chips as far as they go and stop at
     the edge of the cluster, not at an arbitrary distance from the bomb. Owner's
     call, made knowing it can clear a packed floor. That is the feature.

     THREE THINGS MAKE IT PLAYABLE, and lifting the cap without them is what
     would make it unplayable rather than exciting. All three went in with it:
       1. ONLY CHIPS CONDUCT. Rods and pills are destroyed when the fill reaches
          them but pass nothing on. A rod's radOf is half its LONGEST side, so a
          long rod linked everything within about 100px of its centre to
          everything else within 100px of it: a superconductor that would have
          carried the blast across the pit whether or not any chips touched.
       2. THE SLACK CAME DOWN, 10px to BOMB_TOUCH_SLACK_PX. A flat tolerance is
          a per-hop gap-jumping budget once the hops are unlimited.
       3. THE DEATHS ARE BATCHED AND THE STAGGER IS CAPPED. See
          BOMB_CHAIN_MAX_MS.

   The dial is kept rather than deleted, so a future cap is one number away. */
const BOMB_CHAIN_HOPS = Infinity;
// A circle that comes OUT of another circle grows a third as it enters the pit.
// The pack sizes a dog's children as a share of it, so each generation is a
// fraction of the last, and by the third or fourth the circles are too small to
// read, worst of all at the easy end of the slider where everything starts
// small already. Applied once, at the moment of popping, and to the d3 node
// rather than only the physics body: the drawn radius, the ring weight, the
// ring inset and the label fitter all read d.r, so growing anything less than
// all of them would put the picture out of step with the collisions.
const POP_GROW = 1.5;
// And a floor, in screen pixels across. Growth alone can never win: each
// generation is a share of the last, so the shrinking compounds and any
// multiplier is beaten one level further down. A floor ends it. 50 across is
// about the smallest circle worth aiming a finger at.
const POP_MIN_PX = 50;
const BOMB_BURST_MS = 180;    // the squash-and-snap before the blast fires
const BOMB_CHAIN_MS = 25;     // gap between each WAVE of the chain going up
/* THE WHOLE CHAIN'S BUDGET, 18 September 2026 (owner), and the reason a full
   pit does not take ten seconds to blow up.

   WHAT WAS WRONG. One object went up every BOMB_CHAIN_MS, so the chain lasted
   chain.length * 25ms with nothing able to interrupt it: 40 chips 1s, 120 chips
   3s, 200 chips 5s, 400 chips 10s. At two hops a chain was short and it never
   showed. Unlimited, it is the whole connected cluster.

   THE CHAIN GOES UP IN WAVES, at most BOMB_CHAIN_MAX_MS / BOMB_CHAIN_MS of
   them, which is 48. A chain of 48 or fewer is ONE OBJECT PER WAVE and behaves
   exactly as it always did, 25ms apart, so nothing about the ordinary blast has
   changed. A longer one shares the same 48 waves out between more objects: 200
   chips is 48 waves of about 4, 400 is 48 waves of about 8, and either way it is
   over in 1.2 seconds.

   THE RIPPLE SURVIVES because `chain` is built hop by hop, so consecutive
   indices are at the same distance from the bomb and a wave is a ring, not a
   scatter.

   1200ms is the figure to tune. Lower and a big blast snaps; higher and it
   starts to feel like waiting. The round-won sweep is 45ms a step for reference,
   and the burst before the blast is BOMB_BURST_MS. */
const BOMB_CHAIN_MAX_MS = 1200;
/* HOW MUCH DAYLIGHT STILL COUNTS AS TOUCHING, in px, in the blast's flood fill.
   It was a flat 10, which existed because the solver parts resting bodies by a
   little and a chain must not miss two chips that are visibly in contact.

   10 TO 3, 18 September 2026 (owner), with the hop cap. At two hops a flat
   tolerance is applied twice and is harmless. At unlimited hops it is a
   per-hop budget for crossing empty space: 10px a hop over thirty hops is 300px
   of gaps jumped, in a pit about 390px across, so chips plainly not touching
   would have chained. 3px is still well above the separation the solver actually
   leaves between resting bodies, and it caps the budget at a third of what it
   was.

   FLAT, NOT PROPORTIONAL, deliberately. A share of the radii would have been the
   tidier rule, and is what the swipe chain uses (CHAIN_TOUCH_SLACK), but radOf
   returns half the LONGEST side for a rectangle, so a proportional slack would
   hand every rod and pill an enormous tolerance for being reached. Flat cannot
   do that. */
const BOMB_TOUCH_SLACK_PX = 3;
// ROUND WON sweep: the gap between each remaining prop popping, nearest-first.
// Halved from 90 on 19 August 2026 because the sweep read as slow. The chain's
// returned duration is targets.length * this, so the two must stay in step.
const WON_CHAIN_STEP_MS = 45;
const rollBomb = () => Math.random() < 1 / BOMB_ODDS;
// Owner ruling (badge sizing): every badge is BADGE_FRAC of ITS OWN dog's drawn
// radius (nodeR * k), so a big circle carries a big disc and a deep small one a
// small disc, each proportional to the dog it labels. One guard only: if that disc
// would be too small to read it shows NOTHING (returns 0, render + spawn skip it)
// rather than clamping up to a floor, because a floor-sized disc stuck on a tiny dog
// reads as noise. The cutoff is BADGE_FLOOR_PX on-screen px (the % text is 0.7 of
// the radius, so below this the number stops reading), converted to viewBox units
// per device by the stage short side (badgeFloorVb). Physics radius stays coupled
// (rDraw / k), so a smaller disc also collides smaller.
/* 0.25 -> 0.20, 2 September 2026 (owner): the pit's yellow badges read far larger
   than the same dog's chip on the lift.

   THE TWO WERE NEVER THE SAME FORMULA. A pit badge is a fraction of ITS OWN
   CIRCLE's radius; a lift chip is max(21, 5 * sqrt(share)) * 0.78, an absolute
   size from the share. They only ever looked close by coincidence, and the gap
   opened up when the lift layer took its 20% scale: the chips came down and the
   badges did not. 0.20 is 0.25 less that same fifth, which closes it again.

   IT IS STILL A COINCIDENCE, not a shared rule. Change PIT_NODE_SCALE or the
   lift's scale and the two drift apart again with nothing to catch it.

   WATCH THE FLOOR. badgeDrawForNode drops a badge to nothing rather than clamping
   it up once it falls under BADGE_FLOOR_PX, so shrinking every badge by a fifth
   makes the smallest ones disappear at a slightly larger circle than before. That
   is the existing rule working, not a new fault. */
// BADGE_FRAC was 0.20, the fraction of its dog's radius a chip took. Gone with
// badgeDrawForNode and the ruling above: every chip is CHIP_R_PX now.
/* THE OWNER RULING ABOVE IS REVERSED (owner, 18 September 2026). EVERY CHIP IS ONE
   SIZE, wherever it spawns from and whatever dog it came out of. The note above is
   left standing rather than deleted, because its reasoning was sound for the tree
   it was written against and the measurement that overturned it is specific.

   WHAT THE MEASUREMENT SHOWED. ?chipdebug=1 on Soft-Coated Wheaten Terrier, a
   378px stage: seven different shares all reported EXACTLY 5.0px and one reported
   10.2px. 5.0px is not a chip figure at all. It is POP_MIN_PX: a circle cannot be
   smaller than 25px radius, 0.20 of that is 10.05 viewBox units, and at ctm.a
   0.4974 that is 5.0px. Seven shares were identical because seven DOGS were all
   clamped to the minimum circle size.

   SO THE SIZE CARRIED NO INFORMATION. "Proportional to the dog it labels" stops
   being true the moment most dogs sit on the floor, which on any deep evenly-split
   tree is most of them. It was not saying "this dog is big", it was saying "this
   dog is as small as a dog is allowed to be", for almost every chip on screen.

   AND THEY WERE BELOW THE LEGIBILITY CUTOFF. BADGE_FLOOR_PX is 11px, the size at
   which the % text stops reading. Those chips were at 5.0. The guard that was meant
   to drop an unreadable badge to nothing never fired, because the badge was sized
   from a radius that had already been clamped up.

   IN CLIENT PIXELS, NOT VIEWBOX UNITS, so a chip is the same on a 378px stage and a
   1200px one. Converted once per spawn site through fxScale, which is user units
   per client px. */
const CHIP_R_PX = 12;
/* 13.5 -> 11, 9 Sept 2026 (owner).
   Not a taste change. The enclosing-circle fit landed earlier the same day made
   every multi-circle cluster smaller, because a constant circle in a portrait
   frame is bound by the width. A badge is BADGE_FRAC of its OWN dog's radius,
   so smaller circles meant smaller badges, and this floor drops a badge to
   NOTHING rather than clamping it up. Whole levels lost their percentages.
   Measured across all 149 multi-circle levels under the new fit:
     13.5px  234/353 badges,  89 levels missing at least one
     11px    272/353 badges,  59 levels missing at least one
      9px    291/353 badges,  48 levels missing at least one
   11 was chosen over 9 on purpose. The floor exists so an unreadable number is
   not shown at all, and each step down buys fewer badges than the one before
   while making the smallest ones harder to read. 11 recovers the biggest single
   jump, 11 points, for the least cost.
   IT DOES NOT RECOVER EVERYTHING, and it cannot: a badge on a genuinely tiny
   circle has nowhere legible to go. If more are wanted, the honest lever is
   RING_FILL in relayoutMobile, which makes the circles themselves bigger, not
   this. */
/* THE FLOOR IS OFF, 9 Sept 2026 (owner). Everything above is the reasoning
   that put it at 11, and it was sound while the aim was legibility. The aim has
   changed: "I do not mind that they cannot be understood or read, I am doing
   this so I can get some extra debris into the pit."

   AND IT WAS NEVER SAVING ANYTHING. A chip under the floor was still created,
   still given a physics body, still collided and still counted toward the pit
   filling. Only the drawing was skipped. Measured on Scottish Terrier with
   ?badgedebug=1: badges 10, drawn 2, hidden 8. Eight live objects the player
   could not see. Showing them adds no bodies and no load, because the load was
   already being paid.

   BADGE_FLOOR_PX stays at 11 and badgeFloorVb still computes it, because the
   readout reports against it and it is one line to put back. Nothing applies it
   any more. */
const BADGE_FLOOR_PX = 11;
// badgeDrawForNode was here. It sized a chip from its dog and is gone with the
// ruling above: see CHIP_R_PX for what replaced it and the measurement that did it.

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
function labelFirstY(n: number, fs: number, r: number): number {
  return titleDy(r) - Math.max(0, (n - 2) / 2) * LABEL_LINE_H * fs;
}

// Does the rotated text block sit inside a circle of radius r? Corners are
// rotated about (dxR, titleDy(r)) and shifted sideways by dxR, exactly as the
// rendered <text> is, so a block pushed toward either rim is failed here.
// dxR carries the sign of TITLE_DX_FRAC, which went negative (left) on
// 15 September 2026, so this check followed the move without changing.
function labelFits(widthEm: number, n: number, fs: number, r: number): boolean {
  const halfW = (widthEm * fs) / 2;
  const dxR = TITLE_DX_FRAC * r;
  const dyR = titleDy(r);
  const y0 = labelFirstY(n, fs, r);
  const top = y0 - LABEL_CAP_H * fs;
  const bot = y0 + (n - 1) * LABEL_LINE_H * fs + LABEL_DESC * fs;
  const cos = Math.cos((TITLE_ANGLE * Math.PI) / 180);
  const sin = Math.sin((TITLE_ANGLE * Math.PI) / 180);
  const lim = r * LABEL_SAFE;
  for (const x of [-halfW, halfW]) {
    for (const y of [top, bot]) {
      const dy = y - dyR;
      const rx = x * cos - dy * sin + dxR;
      const ry = x * sin + dy * cos + dyR;
      if (Math.hypot(rx, ry) > lim) return false;
    }
  }
  return true;
}

function fitLabel(name: string, r: number, capFs: number, font: string | null): { lines: string[]; fs: number; fits: boolean } {
  const words = name.split(/\s+/).filter(Boolean);
  const maxN = Math.min(LABEL_MAX_LINES, Math.max(1, words.length));
  // `fits` stays false until an arrangement actually sits inside the circle. If
  // none ever does, the name cannot fit at any size the fitter will draw, and
  // the in-circle callers draw NOTHING rather than let their Math.max(10, ...)
  // floor force a spilling label. `lines`/`fs` still carry the best wrap even
  // then, so the pit-words body, shaped off the same fit, keeps a real shape.
  let best = { lines: [name], fs: 0, fits: false };
  // A tie in fitted size means two line counts fit at the very same type size.
  // Prefer MORE lines: a tall narrow block sits inside a round circle where one
  // long line spills out the sides. A fitting arrangement always beats a
  // non-fitting one, so a name that fits on fewer lines is never dropped for a
  // taller arrangement that does not. FS_EPS keeps the line preference to TRUE
  // ties, so a name that genuinely fits larger on fewer lines is left as it is.
  const FS_EPS = 0.05;
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
    // The search never tested the lo = 6 floor, so if nothing bigger fit, lo is
    // still 6 and only labelFits can say whether even that fits. lo > 6 means a
    // size passed the search, so it fits by construction.
    const fits = lo > 6 || labelFits(widthEm, n, lo, r);
    const better =
      fits === best.fits
        ? lo > best.fs + FS_EPS || (lo > best.fs - FS_EPS && lines.length > best.lines.length)
        : fits;
    if (better) best = { lines, fs: lo, fits };
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

// Time-tunnel resolve dials (used only when holdEntrance is set). RING_LEAD is how
// far the tunnel's clearing rings lead before the cluster ring starts to grow;
// DROP_DELAY is the gap between the ring growing and the dogs falling (raise it if
// ring and dogs landing together reads busy). RING_GROW is how long the ring takes
// to bloom into place; RING_START_SCALE is its size at the vanishing point, as a
// fraction of its real size.
const RING_LEAD_MS = 300;      // dial 1: how far ahead the tunnel rings lead
const DROP_DELAY_MS = 250;     // dial 2: ring-grow to dogs-falling gap
const RING_GROW_MS = 650;
const RING_START_SCALE = 0.08;
const MARKER_FADE_MS = 500;    // the connector line fades in over this, once the ring has grown

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
function relayoutMobile(nodes: Node[], aspect: number, level: number | null = null, sizeMul = 1, displayOnly = false) {
  const root = nodes[0];
  const kids = root.children ?? [];
  const n = kids.length;
  if (n < 1) return;
  const FW = SIZE;
  const FH = SIZE / Math.min(Math.max(aspect, 0.42), 0.95);
  const ox = root.x, oy = root.y;
  const pts = nodes.map((d) => ({ d, x: d.x - ox, y: d.y - oy }));
  if (n === 1) {
    const pit = pitBox(FW, FH);
    const s = diffScale(
      Math.min(FW * 0.5, FH * 0.46) / kids[0].r,
      pit.w / (2 * kids[0].r * (1 + DIFF_RING)),
      level
    ) * sizeMul;
    // sat on the floor gap, free to run off the top
    const shift1 = level === null ? 0 : pit.restY - kids[0].r * s;
    pts.forEach((p) => {
      p.d.x = p.x * s;
      p.d.y = p.y * s + shift1;
      p.d.r = p.d.r * s;
    });
    root.x = 0; root.y = 0; root.r = FW / (2 * PAD);
    return;
  }
  const d1 = pts.filter((p) => p.d.depth === 1);
  const w0 = Math.max(...d1.map((p) => p.x)) - Math.min(...d1.map((p) => p.x));
  const h0 = Math.max(...d1.map((p) => p.y)) - Math.min(...d1.map((p) => p.y));
  // Normally turn a WIDE cluster on its side so the long axis runs down the portrait.
  // chums2 #4: a TWO-circle pack must instead sit side by side in a ROW, so force it
  // WIDE - rotate only when it is currently taller than wide (h0 > w0). Three-plus
  // circles are untouched (wantTwoRow is false). displayOnly-gated.
  const wantTwoRow = displayOnly && n === 2;
  if (wantTwoRow ? h0 > w0 : w0 > h0) pts.forEach((p) => { const t = p.x; p.x = p.y; p.y = -t; });
  // and then lean the pair off vertical. A rigid rotation of the whole cloud, so every
  // nested circle keeps its place inside its parent. The bounding box below is measured
  // after this, so the fit already allows for it. Skipped for the chums2 two-row pack,
  // which must stay level (horizontal), not leaned onto a diagonal.
  if (level !== null && n === 2 && DIFF_TILT_DEG && !wantTwoRow) {
    const t = (DIFF_TILT_DEG * Math.PI) / 180, cs = Math.cos(t), sn = Math.sin(t);
    pts.forEach((p) => {
      const nx = p.x * cs - p.y * sn;
      p.y = p.x * sn + p.y * cs;
      p.x = nx;
    });
  }
  const minX = Math.min(...d1.map((p) => p.x - p.d.r));
  const maxX = Math.max(...d1.map((p) => p.x + p.d.r));
  const minY = Math.min(...d1.map((p) => p.y - p.d.r));
  const maxY = Math.max(...d1.map((p) => p.y + p.d.r));
  const bw = maxX - minX, bh = maxY - minY;
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const M = 20;
  // fill the height, but cap how far circles may spill past the side edges
  // The whole cluster against the whole pit, not the widest circle against the
  // width. The old rule ignored the vertical, which is why the same slider
  // position filled 80% of the pit on a two-circle level and 43% on a four.
  const pit = pitBox(FW, FH);
  /* FIT BY THE ENCLOSING CIRCLE, 9 Sept 2026 (owner), pit only.
     The dashed ring is drawn from packEnclose over the depth-1 circles, but the
     layout used to fit their BOUNDING BOX. A box and a circle do not scale
     together: the circumscribing circle of a tall narrow pack is large relative
     to its box, and of a compact clump is small. So the ring came out a
     different size on every level, which only became obvious once swiping made
     levels easy to compare side by side.
     Fitting the same circle the ring is drawn from makes the ring a controlled
     quantity rather than a by-product, so it is identical on every level at a
     given difficulty setting, and centred.
     THE PRICE, and it is real: the frame is portrait, so the circle is bound by
     the WIDTH. A tall two-circle pack used to fill the height and now has to fit
     the width instead, so those levels get visibly smaller circles. That is the
     honest cost of a constant circle in a tall frame and it was accepted.
     RING_FILL is the dial. It is the enclosing radius as a fraction of the frame
     width, so 0.45 makes the ring 90% of the width. */
  const RING_FILL = 0.45;
  const enc2 = packEnclose(d1.map((p) => ({ x: p.x, y: p.y, r: p.d.r })));
  // Pit only. level === null is a chum page, which keeps the old box fit.
  const useCircle = level !== null && !!enc2 && enc2.r > 0;
  const encR = enc2 && enc2.r > 0 ? enc2.r : Math.max(bw, bh) / 2;
  const scale = (useCircle
    ? diffScale(
        (FW * RING_FILL) / encR,
        // The same wall cap as below, but measured on the enclosing circle's
        // diameter rather than the box width, so the hardest difficulty cannot
        // push the ring through the sides.
        pit.w / (2 * encR * (1 + DIFF_RING)),
        level
      )
    : diffScale(
        Math.min((FH - M) / bh, (FW * 1.12) / bw),
        // width only, since the pit has no ceiling, and the widest circle's ring
        // has to fit between the walls as well as the circle itself
        pit.w / (bw * (1 + DIFF_RING)),
        level
      )) * sizeMul;
  // Centre on the CIRCLE, not the box. A pack whose box centre and circle centre
  // differ would otherwise sit off-centre inside its own ring.
  const fitCx = useCircle && enc2 ? enc2.x : cx;
  const fitCy = useCircle && enc2 ? enc2.y : cy;
  // The cluster used to sit dead centre, which left the lower third of the pit
  // empty. Drop it toward the words, but never further than the slack actually
  // available: at the hardest difficulty the pack already fills the height, so
  // the shift has to give way rather than push circles through the floor.
  // Measured on whichever shape did the fitting, so the floor rule below keeps
  // working: for the circle fit the lowest point is the radius, not the box.
  const bottomAfter = useCircle ? encR * scale : (maxY - cy) * scale;
  // In the pit the cluster hangs off the FLOOR, not the centre: its bottom sits
  // on the drop gap and whatever will not fit runs off the top, which is free.
  // Off the pit, on a chum page, the old centred-and-nudged-down rule stands.
  let drop: number;
  if (level === null) {
    const halfH = FH / 2;
    const slack = Math.max(0, halfH - M / 2 - bottomAfter);
    drop = Math.min(FH * CLUSTER_DROP, slack);
  } else {
    // The pair reads as ONE object, and that object is centred on the screen.
    // It only moves at all when centring would drop it through the floor gap,
    // and then only far enough to sit on it: hence min(0, ...), never positive.
    // So the easy settings sit dead centre and only the hardest is pushed up.
    drop = Math.min(0, pit.restY - bottomAfter);
  }
  pts.forEach((p) => {
    p.d.x = (p.x - fitCx) * scale;
    p.d.y = (p.y - fitCy) * scale + drop;
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
/* THE TAB IS THE PARENT'S NOW, 16 September 2026 (owner: the toggle should persist
   from chum to chum, because switching it back on every dog makes comparing them
   impossible).

   WHY IT RESET. The tab was local state here AND this component is rendered with
   key={ancestryFor.slug}, so picking a different chum remounted it and the state
   went back to its initial value every time. Lifting it to BreedTree survives the
   remount; the key can stay, since there is no longer any state inside to lose.

   It also defaults to "cons" now, per the same request. */
function TemperamentBody({ pros, cons, tab, setTab }: { pros: string[]; cons: string[]; tab: "pros" | "cons"; setTab: (t: "pros" | "cons") => void }) {
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

/* A fresh collect flight for one chum card. Out here rather than inside
   collectChum because the React compiler lint reads a function in the component
   body as render code and flags the clock and the random spin as impure. The
   values and the order they are drawn in are unchanged. */
function newChumFlight() {
  return {
    t0: performance.now(),
    spin: (Math.random() < 0.5 ? -1 : 1) * (200 + Math.random() * 160),
    tx: 0, ty: 0, got: false,
  };
}

export default function BreedTree({
  root,
  rootImage,
  rootLabel,
  onActiveChange,
  onCircleCount,
  onPitBusy,
  onClose,
  centred = false,
  size = 760,
  levelNo,
  collectedChums,
  onChumCollected,
  onChumsDropped,
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
  onShownPathChange,
  hideCaption = false,
  onCaptionClose,
  onScore,
  currentScore = 0,
  levelCompleted = false,
  registerShake,
  registerSlowmo,
  onToggleCaption,
  onPitClose,
  onBackToStart,
  onNavPrev,
  onNavNext,
  onNavPrevEra,
  onNavNextEra,
  onRoundWon,
  onPitFull,
  rootNote,
  levelTheme = null,
  era,
  levelName,
  onStartedChange,
  onLearningChange,
  onRelativeTap,
  startInLearn = false,
  startImmediately = false,
  onRestartLevel,
  playLabel = "PLAY",
  onPlayPressed,
  onBackToLearn,
  holdEntrance = false,
  resolve = false,
  portraitAnchor = null,
  // displayOnly (added 2026-08-22, /chums2 v2 desktop): render the diagram as a
  // static display only. It suppresses the two game affordances that leak into
  // the centred learn view without the `gravity` prop, the corner close-X square
  // and the caption aside. Default false, so every game code path is unchanged
  // when it is not passed. See chums2 DECISIONS D7.
  displayOnly = false,
  // hideCircleImages (chums2 diagram, 2026-08-30): render every node circle as a
  // plain FILLED circle (fillFor's depth palette) with no breed photo at any depth,
  // for a traditional diagram look. Strokes, labels and % badges are unchanged. This
  // is a separate, page-scoped switch, NOT the accessibility HIDE_IMAGES mechanism.
  // Default false, so the mini pit, main pit and every other hosting are byte-identical.
  hideCircleImages = false,
  // highlightName (chums2 diagram, 2026-08-23, page-scoped): the ancestor name
  // currently hovered on the ancestor-pack grid. Its matching circle(s) render as a
  // solid YELLOW fill + yellow stroke in place of the photo, reverting when null.
  // Game hostings never pass it (undefined -> no highlight), so they are unchanged.
  highlightName = null,
  // onCircleHover (chums2 diagram, 2026-08-23, page-scoped): fires with a circle's
  // ancestor name on hover-IN and null on hover-OUT, so the page can mirror the hover
  // to that ancestor's pack popouts. Game never passes it, so it is inert there.
  onCircleHover,
}: {
  root: LineageNode;
  rootImage?: string;
  // Display-mode only: the breed page passes the breed name so the root node,
  // otherwise an unlabelled SVG shape, carries an accessible name via <title>.
  // The game never passes it, so the game render is unchanged.
  rootLabel?: string;
  onActiveChange?: (active: boolean) => void;
  onClose?: () => void;
  centred?: boolean;
  size?: number;
  // Chums collected on THIS level, by name, and the callback that adds one.
  // Per level by decision: the set lives in LineageModal, which already
  // unmounts between levels, so there is no storage and nothing to reset.
  // Zero-based campaign level, shown bottom right on the start screen as two
  // digits. Passed down from BreedStrip, which owns the level list.
  levelNo?: number;
  collectedChums?: Set<string>;
  onChumCollected?: (name: string) => void;
  /* How many cards the flood actually tipped in, reported once when it runs.
     The win screen needs a denominator and this is the only place that knows
     it: the level list is filtered by what has already been taken, so nothing
     downstream can count the pack for itself. */
  onChumsDropped?: (n: number) => void;
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
  /* THE TITLE LADDER. The three callbacks above describe one circle. This one
     describes the whole line down to it, root first, so the shell can stack a
     portrait per step instead of a single "you are here".
     Emitted from the same effect and on the same trigger, so it can never
     disagree with them. d3 gives the chain for free: every circle is a
     hierarchy node and already knows its own ancestors. */
  onShownPathChange?: (path: { name: string; img: string | null; status: BreedTag | null }[]) => void;
  hideCaption?: boolean;
  onCaptionClose?: () => void;
  /* THE DOG CIRCLE COUNTER, 18 September 2026 (owner). Collected out of the
     total that has been in the pit, for the shell to show under the lives.

     IT COUNTS COMPLETIONS, 18 September 2026 (owner), and counts DOWN. It used
     to count what the pit DREW, which included a held circle, so the number fell
     the instant a dog was picked up and climbed back if the player backed out.
     A lifted circle now holds its place until the dog is finished.

     WHAT THE DIAGNOSTIC IS NOW, and the history matters because the old one is
     gone. This counter was built when the round-won test still read
     owned.every(removed) and ignored `held`, while the counter read removed OR
     held: the two disagreed, so a stuck held node made the counter full while the
     test stayed false, and that gap was the signal. Option B then made the win
     test exclude `held` as well, at which point the two became the same condition
     inverted and the signal quietly stopped existing. It had been dead for
     several commits.
     Counting completions brings back a sharper one:
       COUNTER ABOVE ZERO WHEN THE ROUND IS WON means a circle left the pit and
       was never completed, which is the stuck-node signature after option B.
       COUNTER AT ZERO AND THE ROUND CARRIES ON means everything was completed
       but the win test did not fire, or fired and was swallowed.
     Either way ?windiag=1 names the nodes.

     Fired only when either number CHANGES, the same written-on-change pattern
     the chain outline uses, so a still pit costs nothing. */
  /* THE PIT IS BUSY WITH A GESTURE, so the shell can take its own controls out of
     the way (owner, 18 September 2026). True while a dog chain is being drawn, or
     while a circle is up on the learn layer.

     IT IS DERIVED EVERY FRAME, NOT TOGGLED ON EVENTS, and that is the whole
     safety argument. A stuck hidden state would leave the slow motion and shake
     controls gone for the rest of the round, so there is deliberately no "hide"
     and "show" pair to get out of step: the frame writer recomputes the answer
     from live state on every frame of a live round and reports only when it
     CHANGES. There is no end route to miss, because no end route is hooked.

     Every way a chain ends does clear dogChainBreedRef in any case, through
     ChainKind.over: killChain calls it for the join clock, a wrong circle, a
     re-entered circle and a crossed path, end() calls it for a release, a cancel,
     a blur and a stale chain, and the effect's own teardown clears the ref
     outright. But this does not depend on that list being complete. */
  onPitBusy?: (busy: boolean) => void;
  onCircleCount?: (left: number, total: number) => void;
  onScore?: (v: number) => void;
  /* The live score, so the chum tree layer can show it. One-way in: BreedTree
     never sets it, it only passes it through. */
  currentScore?: number;
  /* This level is already finished. Swaps the start-screen portrait for a green
     tick and hides PLAY, since there is nothing left to start. See BreedStrip. */
  levelCompleted?: boolean;
  registerShake?: (fn: () => void) => void;
  registerSlowmo?: (fn: () => void) => void;
  onToggleCaption?: () => void;
  onPitClose?: () => void;
  /* The pit menu's green rewind: back to THIS level's start screen. Owned by
     the host, because it costs a life and remounts the round. */
  onBackToStart?: () => void;
  /* START SCREEN LEVEL NAVIGATION, added 2 Sept 2026.
     The pit does NOT own the campaign. Its own `level` state is the difficulty
     slider, 0 to 10. The ordered list of dogs lives two components up in
     BreedStrip (`levelList`), so the pit can only ASK to be moved; it reports a
     swipe and the strip decides what that means.
     Pure navigation by decision: no streak, no lives, no score. These must never
     be wired to onNextLevel, which pays a life every third call. */
  onNavPrev?: () => void;
  onNavNext?: () => void;
  onNavPrevEra?: () => void;
  onNavNextEra?: () => void;
  onRoundWon?: () => void;
  onPitFull?: () => void;
  rootNote?: string;
  levelTheme?: LevelTheme | null;
  /* Which era this level belongs to. Used to scope a retired toy: the balls
     come back when the reader reaches a different era. */
  era?: string;
  /* The dog this level is built on. Only used to look up a per-level prop set,
     so one level can carry fewer objects than the rest of its era. */
  levelName?: string;
  onStartedChange?: (started: boolean) => void;
  onLearningChange?: (learning: boolean) => void;
  onRelativeTap?: (slug: string, name: string) => void;
  // Mount straight into the LEARN area instead of the bare start screen. Used
  // when a round is restarted by the in-pit learn button: the player asked for
  // learn, so they land in learn rather than back on START / LEARN.
  startInLearn?: boolean;
  /* STRAIGHT INTO A LIVE ROUND, 9 Sept 2026 (owner). The pit normally remounts
     on its start screen and waits for PLAY. The green pit-menu square restarts
     the level instead, which means the dogs must drop without a press. The host
     sets this on the remount it makes for that square, and clears it again for
     every other remount, or every level would arm itself. */
  startImmediately?: boolean;
  /* The pit menu's green square: restart THIS level. Owned by the host, because
     it costs a life and remounts the round, exactly like onBackToStart. */
  onRestartLevel?: () => void;
  // The word on the big learn PLAY button. Becomes "PLAY AGAIN" once the run
  // is out of lives, since that press restarts the whole run.
  playLabel?: string;
  // Fires on the learn PLAY button before the drop, so the host can reset a
  // spent run (lives and score) first.
  onPlayPressed?: () => void;
  // Back to the learn area from a live round. Given, a third square joins the
  // pit's top-right stack under the close X. Leaving costs a life, so the host
  // decides what that means; the pit only reports the press.
  onBackToLearn?: () => void;
  // The time-tunnel transition holds the drop-in and keeps the cluster ring small
  // until `resolve` flips, then grows the ring and drops the dogs. When
  // holdEntrance is false (reduced motion, no tunnel) the pit enters normally.
  holdEntrance?: boolean;
  resolve?: boolean;
  // The top-left level portrait's live screen position (centre + radius, client px),
  // measured and published by LineageModal so the cluster connector points at the
  // real image on every width instead of a fixed viewBox fraction. Mapped into
  // viewBox units here with the SVG's own getScreenCTM.
  portraitAnchor?: { cx: number; cy: number; rad: number } | null;
  // See the destructure above (added 2026-08-22).
  displayOnly?: boolean;
  // See the destructure above (added 2026-08-30).
  hideCircleImages?: boolean;
  // See the destructure above (added 2026-08-23).
  highlightName?: string | null;
  onCircleHover?: (name: string | null) => void;
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
  // Start-screen control only. It no longer resets when the pit reopens: the
  // value is read back from sessionStorage (see readDiff), so it carries from
  // one level to the next.
  // Read in a lazy initialiser so it runs once per mount and never during a
  // server render, where there is no sessionStorage at all.
  const [level, setLevel] = useState(() => readDiff());
  // Set the instant before a difficulty change, and consumed by the entrance
  // effect so that re-pack resizes in place rather than replaying the drop-in.
  const resizeOnlyRef = useRef(false);
  // Seeded from the same place as the state above, or the first re-pack would
  // use the default while the slider showed the stored value.
  const levelRef = useRef(readDiff());
  const diffRef = useRef<HTMLDivElement>(null);
  // The drag flag is a ref so the pointer handlers can read it, but the thumb
  // has to re-render to grow, so it needs state as well.
  const [diffDragging, setDiffDragging] = useState(false);
  const diffDragRef = useRef(false);
  function applyLevel(next: number) {
    const l = Math.min(Math.max(Math.round(next), 0), 10);
    if (l === levelRef.current) return;
    levelRef.current = l;
    resizeOnlyRef.current = true;
    writeDiff(l); // so the next level opens where this one was left
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
    // KEEP-CHILD COLLAPSE, RENDERER ONLY. The same pass the lift runs
    // (LineageMap.tsx). expandNode leaves every grafted node valueless
    // (data/lineage.ts, `value: undefined`), so a single-child ancestor is a
    // redundant wrapper: in the pack its one child fills it completely and it
    // only restates that child. In 132 of 178 such wrappers the child IS the
    // trail-completing card (Earth Dog, Otterhound, Ancient Mastiff, Shepherd's
    // Dog), and keep-PARENT was rejected on the numbers: it hides those cards,
    // the whole point of the Tudor trail, and if it ever reached the data it
    // breaks the era count from 1 to 14. This is display only: `root`,
    // getLineage and the failure measurement are untouched. A CHAIN collapses
    // straight to the card in one post-order pass (Welsh Terrier: Old fell
    // terriers -> Old English Black and Tan Terrier -> Earth Dog draws straight
    // to Earth Dog, both stacked wrappers gone). Do NOT move this into
    // expandNode and do NOT switch it to keep-parent.
    /* AND IT NO LONGER COLLAPSES AT ALL (owner, 18 September 2026). The note above
       is left standing because its reasoning still holds and its warning still
       applies: this must not move into expandNode, and it must not become
       keep-PARENT, which would hide the trail-completing card in 132 of 178 cases.

       DRAWING BOTH IS NEITHER. The child stays visible; it is simply nested inside
       the ancestor it came from, which is what the ancestor is for. The objection
       recorded above was to HIDING the card, and nothing here hides it.

       WHY IT HAD TO GO. A single-child wrapper was deleted because "in the pack its
       one child fills it completely", which is a LAYOUT problem being solved by
       throwing away a dog. It cost 68 ancestors today, and 329 once the 19 August
       duplicate-child device is removed, including every node a one-line lineage
       attach creates: Old black-and-tan Setters, Setter, Black and Tan Terrier, the
       fell terriers and the Pug all become single-child nodes the moment their
       ancestry is written.

       THE LAYOUT IS FIXED WHERE THE LAYOUT IS, in the pack pass below: see
       SOLO_CHILD_K. These two changes only make sense together, and shipping this
       one alone leaves 68 ancestors drawn as an 8px hairline round a circle that
       fills them, which is worse than deleting them. */
    const collapse = (n: LineageNode): LineageNode => ({ ...n, children: (n.children ?? []).map(collapse) });
    const collapsed: LineageNode = { ...root, children: (root.children ?? []).map(collapse) };
    const h = hierarchy<LineageNode>(collapsed)
      .sum((d) => d.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    // padding: 8px inset between nested circles in every game hosting. For the
    // /chums2 static diagram (displayOnly) the nested circles sit FLUSH (0), so a
    // parent and its children read as one solid nest with no gap ring. (chums2 #4.)
    // Named because the lone-child pass below has to reproduce the gap pack leaves
    // between two children, and a second literal would drift from this one.
    const PACK_PAD = displayOnly ? 0 : 8;
    const ns = pack<LineageNode>().size([SIZE, SIZE]).padding(PACK_PAD)(h).descendants();
    /* A LONE CHILD MUST NOT FILL ITS PARENT (owner, 18 September 2026).

       THE PROBLEM. d3.pack sizes a parent from its children, so a node with ONE
       child gets `parent r = child r + padding`. The child fills everything but the
       8px ring and the ancestor reads as a hairline round a circle that is
       effectively the same dog. That is what the 19 August "display device" was
       working around, by writing the child into the data TWICE so two circles would
       pack side by side. A layout problem solved in the data, which then got
       grafted: 36% of every node drawn today is an identical copy of a sibling.

       THE FIX, WHERE IT BELONGS. After the pack, any node with exactly one child has
       that child's whole subtree scaled about the parent's centre. The child then
       draws as a circle inside a visible annulus, reading roughly like a 38% share.
       Pure geometry: no node is added, removed or reweighted, and every share, badge
       and card is untouched. The same shape of post-pass as the displayOnly rotation
       a few lines below.

       IT COMPOUNDS ON A CHAIN, deliberately. descendants() is pre-order, so an outer
       node scales its subtree and an inner single-child node then scales again about
       its own moved centre: a two-deep chain lands at K squared, about 0.38. That is
       the case to judge the figure on, not a lone wrapper. If the inner circle reads
       too small, this wants a floor rather than a flat multiplier.

       TUNE HERE. 0.62 is a starting figure, not a measured one. */
    {
      /* AND IT IS PUSHED TO ONE SIDE, NOT LEFT IN THE MIDDLE (owner, 18 September
         2026, on seeing Cairn Terrier).

         SHRINKING ALONE GAVE THE WRONG SHAPE, and it could not have given any other.
         pack puts a lone child AT ITS PARENT'S CENTRE, so scaling about that centre
         leaves it there whatever the factor: a ring with a disc floating in it, which
         reads as a target rather than as a dog inside its ancestor. Only the size
         changed and the size was never the problem.

         WHAT NESTLED MEANS, TAKEN FROM PACK ITSELF. Give a parent TWO equal children
         and pack gives each r = R/2 with its centre R/2 out, so each child's rim
         TOUCHES the parent's rim and each leaves a crescent. That is why the
         19 August duplicate device looked right: not the count, the offset. So a lone
         child is placed the same way, centre at R - r, tangent inside the rim.

         OUTWARD FROM THE DIAGRAM'S CENTRE, so the crescent falls on the inner side
         where the eye is already travelling, and a subtree leans away from the middle
         rather than into its siblings. A node sitting exactly at the centre has no
         direction to take, so it falls back to straight down.

         THE PARENT'S NAME IS COVERED, AND THAT IS NOT NEW. Labels are interleaved
         with circles, so any nested child paints over its parent's label already; the
         crescent is what makes the parent readable as a ring, not the text. See
         labelBuried for the hover case, which is untouched.

         CHAINS TAKE THE SAME DIRECTION, deliberately, as the first thing to judge
         rather than the cleverest. An inner node is offset from its already-moved
         position, so a chain leans consistently outward. Curly-Coated Retriever is
         the level to look at: four wrappers from depth 2. If it drifts, alternating
         or rotating per depth is the next thing to try. */
      const cx = SIZE / 2, cy = SIZE / 2;
      for (const p of ns) {
        const kids = p.children;
        if (!kids || kids.length !== 1) continue;
        const c = kids[0];
        const nr = c.r * SOLO_CHILD_K;
        /* THE PADDING GOES IN THE GAP, NOT INTO THE CHILD (owner, 19 September
           2026). This was p.r - nr, which puts the child's rim exactly on the
           parent's. A device pair does not do that: pack leaves P between the two
           children, so the visible one's rim ends up P inside the parent's. Measured
           on Alaunt War Dogs the gap was 7.31 against 0.00 here, which is the whole
           of the remaining difference between the two shapes. Subtracting P closes
           it, and at K 0.5 the result is offset == radius, which is what two tangent
           equal circles give. */
        const off = Math.max(0, p.r - nr - PACK_PAD); // the device's own rim gap
        let ux = p.x - cx, uy = p.y - cy;
        const len = Math.hypot(ux, uy);
        if (len < 1e-6) { ux = 0; uy = 1; } else { ux /= len; uy /= len; }
        const dx = ux * off, dy = uy * off;
        for (const d of c.descendants()) {
          d.x = p.x + (d.x - p.x) * SOLO_CHILD_K + dx;
          d.y = p.y + (d.y - p.y) * SOLO_CHILD_K + dy;
          d.r *= SOLO_CHILD_K;
        }
      }
    }
    normalizeTop(ns);
    if (isMobile || dockAside) relayoutMobile(ns, aspectKey, dockAside ? level : null, isMobile ? 1 : 0.6, displayOnly);
    // /chums2 (displayOnly) OFF-CENTRE inner circles (chums2 #2, revised): d3 pack +
    // the relayout leave a parent's child cluster on the parent's vertical centreline,
    // over its name label. A leftward shift did not clear it (the pair re-centred), so
    // instead ROTATE each depth-1 parent's whole nested subtree about the PARENT centre
    // by a fixed angle: a rigid rotation keeps the nest's shape but tips the pair
    // diagonally off the vertical axis, exposing the label. Runs AFTER relayoutMobile.
    // Gated on displayOnly, so every game hosting is byte-identical. Angle is tunable.
    if (displayOnly) {
      const DISPLAY_INNER_ROT_DEG = 35; // tip the nested cluster this far off vertical
      const a = (DISPLAY_INNER_ROT_DEG * Math.PI) / 180, cs = Math.cos(a), sn = Math.sin(a);
      for (const p of ns) {
        if (p.depth !== 1) continue;
        for (const kid of p.descendants()) {
          if (kid === p) continue;
          const dx = kid.x - p.x, dy = kid.y - p.y;
          kid.x = p.x + dx * cs - dy * sn;
          kid.y = p.y + dx * sn + dy * cs;
        }
      }
    }
    return ns;
  }, [root, isMobile, aspectKey, dockAside, level, displayOnly]);

  // Rarity band: per-level count of each dog among the CIRCLES that drop (nodes,
  // echo-excluded, root excluded, so it matches what a player sees). The band is
  // painted across the bottom of the lifted circle by LineageMap and stays while
  // the card is up, so there is no flash state, timer or per-name dedup here: the
  // tier and count are just handed to the card for the lifted dog. See rarityTier.
  // Rarity is dataset-wide now (treesContaining), so there is no per-level count
  // map here any more: the lifted dog's tier is the same wherever it is met.

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
  // chums2 hover punch-out band (D75, reinstated): a single evenodd path behind the
  // circles filling the hovered ancestor's EXPOSED band (children punched to background).
  // Its geometry is written imperatively from the LIVE painted view (viewRef) in an
  // effect, so it aligns with the circles exactly.
  const hlPathRef = useRef<SVGPathElement>(null);
  const isMobileRef = useRef(false);
  isMobileRef.current = isMobile;
  // displayOnly RESTING FRAME (D57): a CONTENT-AWARE contain fit derived from the
  // pack's REAL bounding box, replacing the fixed DISPLAY_SPAN/PACK_PULL that could
  // not hold the gutters as the pack width varies per breed. The pack's LEFT edge maps
  // to the stage's left edge (CSS sets that to box right + --gutter-diagram), and the
  // pack scales UP to fill the stage: its right edge reaches the stage right (= tree
  // left - --gutter-tree) when width binds, else it fills the stage height minus a
  // margin, whichever binds first. So gutter 4 holds for every breed and the pack fills
  // the zone instead of floating. Uses only the pack bbox + the stage aspect (the
  // absolute stage px cancel out of the world->screen scale), so it touches no ref and
  // is safe in the useRef seeds below and re-run in the mount effect.
  const displayRestView = (): View => {
    const vis = nodes.filter((d) => !(d.depth === 0 || isHiddenCopy(d)));
    if (vis.length === 0) return [nodes[0].x, nodes[0].y, nodes[0].r * 2 * (isMobile ? PAD : ZOOM_PAD)];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const d of vis) {
      if (d.x - d.r < minX) minX = d.x - d.r;
      if (d.x + d.r > maxX) maxX = d.x + d.r;
      if (d.y - d.r < minY) minY = d.y - d.r;
      if (d.y + d.r > maxY) maxY = d.y + d.r;
    }
    const bboxW = maxX - minX, bboxH = maxY - minY;
    const A = aspect;                    // stage aspect, same value the viewBox uses
    const WWperW = A >= 1 ? A : 1;       // world WIDTH shown per unit of view-width w
    const WHperW = A >= 1 ? 1 : 1 / A;   // world HEIGHT shown per unit of view-width w
    const m = 0.03;                      // vertical breathing margin (height-bound case)
    // The pack is height-bound, so to render it 15% LARGER at rest we shrink the fitted
    // view-width by the same factor (equivalent to trimming the vertical margin past 0):
    // the pack then overfills the stage height by ~8% and spills a few px past top and
    // bottom, which the page draws freely (overdraw). (D66 item 3.)
    const DISPLAY_FILL = 1.15;
    // Contain fit: the larger view-width wins (smaller pack that still fits both axes).
    const w = Math.max(bboxW / WWperW, bboxH / ((1 - 2 * m) * WHperW)) / DISPLAY_FILL;
    const cx = minX + (w * WWperW) / 2;  // left-align: pack left edge at the stage left
    // TOP-align, not centre (D67 #1): the view maps cy to the vertical CENTRE of the
    // stage, and the visible world-height is H = WHperW * w. Placing the pack top (minY)
    // a margin below the top of the visible band => cy = minY + H*(0.5 - m). A height
    // -bound (tall) pack has H ~ bboxH/(1-2m), for which this lands ~where centring did
    // (barely affected); a short two-circle row rises so its top sits on the zone top
    // (the intro-box top line) instead of floating low with dead space above it.
    const H = WHperW * w;
    const cy = minY + H * (0.5 - m);
    return [cx, cy, w];
  };
  // Seed the view with the SETTLED pit fit, not a placeholder. On the start screen
  // dockAside widens the root view by PIT_SPAN, and clampRootView only shifts y and
  // never the width, so this expression is the exact settled width the first render
  // paints with. Without the PIT_SPAN factor the first render held the pre-pit view
  // (~2.5x too small a width, so k ~2.5x too big): the ring came in oversized until
  // the drop finished, and the pre-drop % badges, sized in an effect that only
  // re-ran on [nodes, dockAside], stayed oversized until the slider forced a
  // re-pack. Same class as the LineageMap lift-card viewport seed.
  const viewRef = useRef<View>(displayOnly ? displayRestView() : [nodes[0].x, nodes[0].y, nodes[0].r * 2 * (isMobile ? PAD : ZOOM_PAD) * (dockAside ? PIT_SPAN : 1)]);
  // The width of the full-pit view, kept so a ring can be drawn at the weight it
  // has when you are zoomed out. Seeded with the same expression as viewRef and
  // rewritten by every site that returns the view to the root.
  const homeWRef = useRef<number>(displayOnly ? displayRestView()[2] : nodes[0].r * 2 * (isMobile ? PAD : ZOOM_PAD) * (dockAside ? PIT_SPAN : 1));
  const focusRef = useRef<Node>(nodes[0]);
  const rafRef = useRef<number>(0);

  const [focus, setFocus] = useState<Node>(nodes[0]);
  const [hovered, setHovered] = useState<Node | null>(null);

  /* ── PUSH AND PULL, start screen only ────────────────────────────────────
     A circle can be dragged with a thumb and springs back when let go.
     It writes a translate onto the node's own wrapper <g> and onto every
     descendant's, the same wrapper-offset trick the collision knock uses: zoomTo
     positions the circle and the label INSIDE each wrapper, so the wrapper
     itself is free to carry an offset and nothing fights over it. */
  const PULL_SNAP_MS = 170;      // the way back, quick enough to read as a snap
  const PULL_MAX_R = 0.9;        // how far it can be dragged, as a share of its own radius
  type PullState = {
    node: Node;
    els: number[];
    // The dog's own yellow chip, so it travels with it. Chips are not inside the
    // circle's wrapper, they live in their own group, so they are moved by
    // rewriting their transform from a base position captured at the grab. On
    // the start screen nothing else writes to them, and the base is restored on
    // release, so there is nothing to fight over.
    chip: { i: number; bx: number; by: number } | null;
    sx: number; sy: number;      // where the finger went down, in client px
    ox: number; oy: number;      // current offset, world units
    max: number;                 // this circle's own pull limit
    perPx: number;               // world units per client pixel, frozen at grab
    moved: boolean;
    raf: number | null;
  };
  const pullRef = useRef<PullState | null>(null);
  // Double tap opens learn, but only once something has actually been pulled.
  // Until then a double tap is just two taps, so nobody is thrown into the learn
  // area before they have touched the diagram at all.
  const pulledEverRef = useRef(false);
  const lastTapRef = useRef(0);
  // Which circle was tapped last and when, so a second quick tap on the SAME
  // one zooms. Tracking the node as well as the clock matters: two quick taps on
  // two different circles is not a double tap.
  const zoomTapRef = useRef<{ n: Node | null; t: number }>({ n: null, t: 0 });
  // Bumped when a zoom or a pan has settled, purely to force one more render so
  // anything measured from viewRef during render is measured against the view
  // that is actually on screen.
  const [, setViewTick] = useState(0);
  // The cluster marker is React-rendered from viewRef at the two flight renders
  // (setFocus at the start, setViewTick at the end), so mounting it mid-flight put
  // it at the wrong, pre-flight size and it snapped on arrival. This flag hides it
  // while a zoom flight animates and shows it only once the view has settled.
  const [flighting, setFlighting] = useState(false);

  /* ── PAN, zoomed in only ─────────────────────────────────────────────────
     At the root the whole tree already fits, so panning there would only let
     someone push it off screen for nothing. Zoomed in there is more tree than
     view, and this is how you reach the rest of it.
     It moves viewRef directly rather than animating: a pan should track the
     finger, not chase it. */
  const panRef = useRef<{ x: number; y: number; vx: number; vy: number; per: number; moved: boolean } | null>(null);
  /* 8px, the SAME figure onBackground uses to tell a tap from a drag. At 6 a
     seven pixel movement panned and then also read as a background tap, which
     zooms out to the root: you would pan a little and be thrown back to the top. */
  const PAN_SLOP = 8;
  const panBounds = (v: View): View => {
    // Never further than the root's own circle plus a screen's worth of margin,
    // so the tree can always be found again.
    const root = nodes[0];
    const lim = root.r + v[2] * 0.5;
    return [
      Math.max(root.x - lim, Math.min(root.x + lim, v[0])),
      Math.max(root.y - lim, Math.min(root.y + lim, v[1])),
      v[2],
    ];
  };

  /* ── KNOCKS ──────────────────────────────────────────────────────────────
     A pulled circle shoves its neighbours. Each shoved circle springs back on
     its own, so several can be moving at once and none waits for the others.
     There is no physics engine on this screen, which is what `frozen` means, so
     this is a spring per circle rather than a solver: displacement, a restoring
     force toward home, and damping. */
  // Tuned rather than guessed: at 0.16 and 0.76 a shoved circle overshot by 29%
  // and rang for half a second, which reads as a bounce. These give a 3%
  // overshoot settling in about 280ms, which is the slow knock you get between
  // two heavy balls: it starts, thinks better of it, and comes back.
  const KNOCK_K = 0.22;        // pull toward home
  const KNOCK_DAMP = 0.55;     // how quickly it stops arguing with itself
  const KNOCK_REST = 0.35;     // world units below which it is home
  const KNOCK_POINTS = 1;      // a nudge is worth almost nothing, by design
  /* What learning a circle costs, charged when it leaves the pit. The figure is
     the main pit's, LineageMap.tsx, so the two games price the same shortcut
     the same way. Negative on purpose: it is spent, not earned. */
  const LEARN_COST = -2500;
  /* An IMPULSE, not just an overlap correction. Resolving the overlap alone was
     invisible: the spring cancelled the shove on the frame it was applied, so
     the neighbour sat about eight units from home and never travelled. Contact
     now hands it velocity, which is what makes it move off and come back. */
  const KNOCK_IMPULSE = 1.6;
  const KNOCK_VMAX = 26;       // so a fast drag cannot fire one across the pit
  /* How far the pair must SEPARATE before another contact can score.
     Without this a knocked circle scores again on every oscillation as it
     settles: it rings back through contact, the flag clears, and it scores
     again. A double tap next to a still-settling neighbour was collecting
     about fifteen points that way. */
  const KNOCK_REARM = 10;
  type Knock = { els: number[]; chip: { i: number; bx: number; by: number } | null; ox: number; oy: number; vx: number; vy: number; hit: boolean };
  const knocksRef = useRef<Map<number, Knock>>(new Map());
  const knockRafRef = useRef<number | null>(null);

  const paintOffset = (els: number[], chip: { i: number; bx: number; by: number } | null, ox: number, oy: number) => {
    const cg = circlesRef.current;
    const v = viewRef.current;
    const k = SIZE / v[2];
    if (cg) {
      for (const j of els) {
        const w = cg.children[j] as SVGGElement | undefined;
        if (w) w.setAttribute("transform", ox === 0 && oy === 0 ? "" : `translate(${ox * k},${oy * k})`);
      }
    }
    if (chip) {
      const el = badgesRef.current?.children[chip.i] as SVGGElement | undefined;
      if (el) el.setAttribute("transform", `translate(${(chip.bx - v[0] + ox) * k},${(chip.by - v[1] + oy) * k}) rotate(0)`);
    }
  };

  /* A white number, rising and fading, the same treatment the pit gives a
     collision. The pit's own numAt lives inside its physics loop and cannot be
     reached from here, so this is the same effect written to stand alone. */
  const knockNum = (x: number, y: number, val: number) => {
    const fx = fxRef.current;
    if (!fx) return;
    const v = viewRef.current;
    const k = SIZE / v[2];
    const el = document.createElementNS("http://www.w3.org/2000/svg", "text");
    el.textContent = String(val);
    el.setAttribute("text-anchor", "middle");
    el.style.fontFamily = "var(--font-pct), system-ui, sans-serif";
    // Bigger than the pit's 15: a knock is one number on a still screen, not one
    // of dozens flying about, so it has to carry on its own.
    el.style.fontSize = `${26 * Math.max(1, k)}px`;
    el.style.fill = "#ffffff";
    // The pit's numbers land on a busy floor; these land on a photograph, so
    // they need an edge to stay legible.
    el.style.paintOrder = "stroke";
    el.style.stroke = "rgba(10,58,87,0.55)";
    el.style.strokeWidth = "3px";
    el.style.pointerEvents = "none";
    // Placed before it is attached. Without this it renders once at the middle
    // of the view and jumps to the contact point on the next frame.
    el.setAttribute("x", String((x - v[0]) * k));
    el.setAttribute("y", String((y - v[1]) * k - 22));
    fx.appendChild(el);
    let t0 = -1;
    const LIFE = 650;
    const tick = (now: number) => {
      if (t0 < 0) t0 = now;
      const t = Math.min(1, (now - t0) / LIFE);
      const vv = viewRef.current;
      const kk = SIZE / vv[2];
      el.setAttribute("x", String((x - vv[0]) * kk));
      el.setAttribute("y", String((y - vv[1]) * kk - (22 + t * 34)));
      el.style.opacity = String(1 - t);
      if (t < 1) requestAnimationFrame(tick);
      else el.remove();
    };
    requestAnimationFrame(tick);
  };


  /* The contact test, used by BOTH the drag and the way home.
     It only ran during the drag before, so a circle let go could never bump
     anything on its way back. The circles rest 7.8 units apart on Celtic Hound,
     so a return that merely reaches home never touches: the snap overshoots
     slightly, which is what carries it into its neighbour. */
  const knockAgainst = (d: Node, ox: number, oy: number) => {
    const cxD = d.x + ox, cyD = d.y + oy;
    const sibs = (d.parent?.children ?? []).filter((n) => n !== d);
    for (const n of sibs) {
      const ni = nodes.indexOf(n);
      if (ni < 0) continue;
      let kn = knocksRef.current.get(ni);
      if (!kn) {
        // Which badge belongs to this circle. By identity now, not by position
        // in the dog list. See badgeSrcRef.
        const ci2 = badgeSrcRef.current.indexOf(n);
        kn = {
          els: n.descendants().map((x) => nodes.indexOf(x)).filter((j) => j >= 0),
          chip: ci2 >= 0 ? { i: ci2, bx: n.x - n.r * 0.707, by: n.y + n.r * 0.707 } : null,
          ox: 0, oy: 0, vx: 0, vy: 0, hit: false,
        };
        knocksRef.current.set(ni, kn);
      }
      const gx = (n.x + kn.ox) - cxD, gy = (n.y + kn.oy) - cyD;
      const dist = Math.hypot(gx, gy) || 0.0001;
      const min = d.r + n.r;
      if (dist >= min) {
        // Clear apart, so the next touch is a genuinely new one.
        if (dist > min + KNOCK_REARM) kn.hit = false;
        continue;
      }
      const push = min - dist;
      kn.ox += (gx / dist) * push;
      kn.oy += (gy / dist) * push;
      kn.vx += (gx / dist) * push * KNOCK_IMPULSE;
      kn.vy += (gy / dist) * push * KNOCK_IMPULSE;
      const sp = Math.hypot(kn.vx, kn.vy);
      if (sp > KNOCK_VMAX) { kn.vx = (kn.vx / sp) * KNOCK_VMAX; kn.vy = (kn.vy / sp) * KNOCK_VMAX; }
      if (!kn.hit) {
        kn.hit = true;
        knockNum(cxD + (gx / dist) * d.r, cyD + (gy / dist) * d.r, KNOCK_POINTS);
        onScore?.(KNOCK_POINTS);
      }
      if (knockRafRef.current === null) knockRafRef.current = requestAnimationFrame(knockStep);
    }
  };

  const knockStep = () => {
    const map = knocksRef.current;
    let alive = false;
    for (const [, kn] of map) {
      kn.vx = (kn.vx - kn.ox * KNOCK_K) * KNOCK_DAMP;
      kn.vy = (kn.vy - kn.oy * KNOCK_K) * KNOCK_DAMP;
      kn.ox += kn.vx;
      kn.oy += kn.vy;
      if (Math.hypot(kn.ox, kn.oy) < KNOCK_REST && Math.hypot(kn.vx, kn.vy) < KNOCK_REST) {
        // hit is NOT cleared here. Coming to rest is not the same as being
        // clear of the other circle, and clearing it here is what let a
        // settling neighbour score over and over.
        kn.ox = 0; kn.oy = 0; kn.vx = 0; kn.vy = 0;
        paintOffset(kn.els, kn.chip, 0, 0);
      } else {
        alive = true;
        paintOffset(kn.els, kn.chip, kn.ox, kn.oy);
      }
    }
    knockRafRef.current = alive ? requestAnimationFrame(knockStep) : null;
  };

  const pullPaint = (pl: PullState, ox: number, oy: number) => {
    const cg = circlesRef.current;
    const v = viewRef.current;
    const k = SIZE / v[2];
    if (cg) {
      for (const j of pl.els) {
        const w = cg.children[j] as SVGGElement | undefined;
        if (w) w.setAttribute("transform", ox === 0 && oy === 0 ? "" : `translate(${ox * k},${oy * k})`);
      }
    }
    if (pl.chip) {
      const bg = badgesRef.current;
      const el = bg?.children[pl.chip.i] as SVGGElement | undefined;
      if (el) {
        el.setAttribute(
          "transform",
          `translate(${(pl.chip.bx - v[0] + ox) * k},${(pl.chip.by - v[1] + oy) * k}) rotate(0)`
        );
      }
    }
  };

  /* Rubber band: the first millimetre moves nearly one to one, and it stiffens
     the further it goes, stopping at max. A straight multiplier felt slack and a
     hard clamp felt broken; this gives resistance you can feel. */
  const pullEase = (d: number, max: number) =>
    max * (1 - Math.exp(-Math.abs(d) / max)) * Math.sign(d);

  const pullRelease = () => {
    const pl = pullRef.current;
    if (!pl) return;
    const fromX = pl.ox, fromY = pl.oy;
    // The clock comes from requestAnimationFrame's own argument, not from
    // performance.now(). This is a plain function in the component body, and the
    // compiler reads a call like that as render work: it is one of the recurring
    // lint traps in this file.
    let t0 = -1;
    const step = (now: number) => {
      const cur = pullRef.current;
      if (!cur) return;
      if (t0 < 0) t0 = now;
      const t = Math.min(1, (now - t0) / PULL_SNAP_MS);
      // ease out cubic: fast off the mark, settling rather than stopping dead
      // OVERSHOOT, ease out back. A plain ease out stopped dead at home, and
      // home is 7.8 units clear of the neighbour, so a released circle could
      // never touch anything. This carries it about a tenth of its travel past
      // home, which is what bumps the circle it was pulled away from.
      const c1 = 1.70158, c3 = c1 + 1;
      const e = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
      cur.ox = fromX * (1 - e);
      cur.oy = fromY * (1 - e);
      pullPaint(cur, cur.ox, cur.oy);
      // Only if it actually travelled. A tap releases from zero, so there is
      // nothing coming home and nothing to bump.
      if (fromX !== 0 || fromY !== 0) knockAgainst(cur.node, cur.ox, cur.oy);
      if (t < 1) { cur.raf = requestAnimationFrame(step); return; }
      pullPaint(cur, 0, 0);
      pullRef.current = null;
    };
    pl.raf = requestAnimationFrame(step);
  };

  const [boxAlt, setBoxAlt] = useState(false); // flips each time the shown circle changes, for the alternating box colour
  const [railSide, setRailSide] = useState<"left" | "right">("right"); // side the related-dogs rail sits, flipped when the box is dragged across
  const [entered, setEntered] = useState(false);
  // The drop-in runs once this is armed. Without the tunnel (holdEntrance false) it
  // is armed from the start, so the pit enters as it always did. With the tunnel it
  // stays false until the resolve signal, then a timer arms it so the dogs fall
  // after the cluster ring has begun to grow (RING_LEAD + DROP_DELAY).
  const [dropArmed, setDropArmed] = useState(!holdEntrance);
  useEffect(() => {
    if (!holdEntrance || !resolve || dropArmed) return;
    const id = window.setTimeout(() => setDropArmed(true), RING_LEAD_MS + DROP_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [holdEntrance, resolve, dropArmed]);
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
  const [learning, setLearning] = useState(startInLearn);
  useEffect(() => { onLearningChange?.(learning); }, [learning, onLearningChange]);
  /* The VALUE is no longer read anywhere: it existed to drive the magenta learn
     wash, which was removed on 9 Sept 2026. The SETTER is still called from
     eleven places (hover, start, teardown), so the state stays and only the
     unused binding goes. If the wash ever comes back, restore the name here and
     nothing else has to change. */
  const [, setLearnPeek] = useState(false);
  const frozen = dockAside && gravity && !started && !learning;
  // Desktop hover preview of the level background, the same courtesy LEARN gets.
  const [startPeek, setStartPeek] = useState(false);
  // Hovering the learn PLAY button previews the play scene behind the pit.
  const [playPeek, setPlayPeek] = useState(false);
  // Item 5: the instruction line next to the play button, driven by whatever the
  // pointer is over. Blank when nothing is hovered (and on touch, where there is
  // no hover at all).
  const [hoverHint, setHoverHint] = useState("");
  // Learn rail: the pack dog whose Ancestry card is open below the box.
  const [ancestryFor, setAncestryFor] = useState<{ name: string; slug: string; note?: string; image?: string } | null>(null);
  const [ancHidden, setAncHidden] = useState(false);
  const [trainHidden, setTrainHidden] = useState(false);
  const [tempHidden, setTempHidden] = useState(false);
  /* CONS FIRST, AND IT STICKS, 16 September 2026 (owner). Held here rather than
     inside TemperamentBody because that component is keyed on the chum's slug and
     remounts on every pick, which is what kept resetting the toggle. */
  const [tempTab, setTempTab] = useState<"pros" | "cons">("cons");
  const [ancPos, setAncPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const [trainPos, setTrainPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const [tempPos, setTempPos] = useState<{ left: number; top: number; width: number } | null>(null);
  // The blue box can be picked up and moved, the same as the cards on a chum
  // page. It rides on a transform offset rather than left/top, so it cannot
  // disturb the docked layout underneath, and it snaps home each time it opens.
  const asideRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const asideOff = useRef({ x: 0, y: 0 });
  const asideDrag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  /* MOBILE DRAG, added 31 Aug 2026. The phone sheet could not be moved at all: the
     handlers below were gated `!isMobile`.

     It cannot reuse the desktop path. That one writes a TRANSFORM, and the chum rail
     is a DOM CHILD of this box using `position: fixed`. A transformed ancestor
     becomes the containing block for a fixed descendant, so the first drag would tear
     the rail off the screen and hand it to the box, where `overflow-y: auto` would
     clip it. That is why the CSS said "not draggable on a phone".

     So the phone drag writes inline LEFT and BOTTOM in pixels instead. No transform,
     no containing block, and the rail carries on ignoring the box. It only works
     because .asideSheet now carries an explicit `width`; with the old left/right
     inset pair, setting `left` alone would have stretched it.

     Held in state rather than a ref because the inline style has to survive a
     re-render, and this box re-renders on every hover in the pit behind it. */
  const [sheetPos, setSheetPos] = useState<{ left: number; bottom: number } | null>(null);
  const sheetDrag = useRef<{ sx: number; sy: number; ol: number; ob: number; w: number; h: number } | null>(null);
  // The WHOLE box is the handle. It was the head row only, because the box scrolled
  // its write-up and on a touch screen a drag and a scroll are the same gesture, so
  // one had to own it. The sheet no longer scrolls (max-height and overflow are gone,
  // the figures block folds behind a "..." instead), so there is no scroll left to
  // protect and the box drags from anywhere, as it does on desktop.
  // Presses on the chum rail never arrive here: railDown stops propagation itself.
  const sheetDown = (e: React.PointerEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest("button, a, input, select, textarea")) return;
    const el = asideRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    e.preventDefault();
    e.stopPropagation();
    sheetDrag.current = {
      sx: e.clientX, sy: e.clientY,
      ol: r.left, ob: window.innerHeight - r.bottom,
      w: r.width, h: r.height,
    };
    try { el.setPointerCapture(e.pointerId); } catch { /* no capture available */ }
  };
  const sheetMove = (e: React.PointerEvent) => {
    const d = sheetDrag.current;
    if (!d) return;
    // Clamped so it can never be shoved fully off screen and stranded. 24px of the
    // box has to stay in view on every edge.
    const KEEP = 24;
    const maxL = window.innerWidth - KEEP;
    const maxB = window.innerHeight - KEEP;
    const left = Math.min(maxL, Math.max(KEEP - d.w, d.ol + (e.clientX - d.sx)));
    const bottom = Math.min(maxB, Math.max(KEEP - d.h, d.ob - (e.clientY - d.sy)));
    setSheetPos({ left, bottom });
  };
  const sheetUp = (e: React.PointerEvent) => {
    sheetDrag.current = null;
    try { asideRef.current?.releasePointerCapture(e.pointerId); } catch { /* already gone */ }
  };
  // The rail lives inside the box's element, so a press on it used to bubble to
  // the box's own drag and carry both away together. It now has its own, which
  // pins it to the screen and leaves the box exactly where it is.
  const railDrag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const railMovedRef = useRef(false);
  const railDown = (e: React.PointerEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest("button, a, input, select, textarea")) return; // a card is still a card
    const el = railRef.current;
    if (!el) return;
    e.stopPropagation(); // the box must not hear this
    e.preventDefault();
    const r = el.getBoundingClientRect();
    railDrag.current = { sx: e.clientX, sy: e.clientY, ox: r.left, oy: r.top };
    railMovedRef.current = true;
    try { el.setPointerCapture(e.pointerId); } catch { /* no capture available */ }
  };
  const railMove = (e: React.PointerEvent) => {
    const d = railDrag.current;
    if (!d) return;
    e.stopPropagation();
    setRailPin({ left: Math.round(d.ox + (e.clientX - d.sx)), top: Math.round(d.oy + (e.clientY - d.sy)) });
  };
  const railUp = (e: React.PointerEvent) => {
    if (!railDrag.current) return;
    e.stopPropagation();
    railDrag.current = null;
  };
  // The difficulty slider is now offered in LEARN as well as on the start
  // screen. focus.depth === 0 is doing real work here: it means the slider is
  // simply absent while you are zoomed into a circle, which removes the worst
  // of the risk. A level change re-packs and resets focus to the root, so being
  // zoomed and touching the slider would have thrown you out of the circle you
  // were reading. It cannot happen, because there is nothing to touch.
  const showDiff = dockAside && gravity && entered && !started && focus.depth === 0;

  /* ---- START SCREEN SWIPE NAVIGATION (2 Sept 2026) -----------------------
     Right for the next dog, left for the previous, down for the first dog of
     the next era, up for the first dog of the last era. The pit only reports
     the gesture; BreedStrip owns the list and decides where it lands.

     WHY CAPTURE PHASE. startDrag calls stopPropagation on every circle, toy,
     rod and pill, so a listener on the bubble path would never hear a swipe
     that began on top of a dog. The owner asked for the swipe to work
     ANYWHERE, so these are bound with `capture: true` and run before the
     target's own handler, which cannot silence them.

     WHY IT DOES NOT NEED TO CANCEL THE CIRCLE DRAG. It was going to have to,
     and that was the expensive part of this job. It turns out not to: a level
     change re-packs the whole tree and hands back a brand new node array, so
     any dog the swipe happened to fling is thrown away with the old level. The
     drag can run to completion and be discarded. Nothing to unwind.

     A FLICK, NOT A DRAG, so that shoving the dogs about still works. All three
     have to hold: at least SWIPE_MIN px travelled, inside SWIPE_MS, and the
     dominant axis at least SWIPE_BIAS times the other. A slow deliberate drag
     across the pit fails the time test and moves the dog only. */
  const SWIPE_MIN = 70;    // px of travel
  const SWIPE_MS = 500;    // within this long
  const SWIPE_BIAS = 1.6;  // dominant axis versus the other
  const swipeRef = useRef<{ x: number; y: number; t: number } | null>(null);
  // Held in a ref so the listeners can stay bound once instead of rebinding on
  // every hover in the pit behind them.
  const navRef = useRef({ prev: onNavPrev, next: onNavNext, prevEra: onNavPrevEra, nextEra: onNavNextEra, on: false });
  // Start screen only. Not mid-round, not zoomed into a circle, not in learn:
  // in learn a swipe is how you move the info box and the chum rail.
  const navOn = dockAside && gravity && entered && !started && !learning && focus.depth === 0;
  // Refreshed in an effect, not assigned during render. The file already carries
  // 14 "Cannot access refs during render" errors from the older pattern; this
  // one does not add a fifteenth. No dependency array on purpose: it is the
  // latest-value ref pattern, and the listeners below read it on a gesture, long
  // after any render has committed.
  useEffect(() => {
    navRef.current.prev = onNavPrev;
    navRef.current.next = onNavNext;
    navRef.current.prevEra = onNavPrevEra;
    navRef.current.nextEra = onNavNextEra;
    navRef.current.on = navOn;
  });

  useEffect(() => {
    /* BOUND TO THE DOCUMENT, NOT THE STAGE (9 Sept 2026).
       The first cut bound these to stageRef.current inside an effect with []
       dependencies. On a phone that ref was still null when the effect ran, so
       it returned early and, having no dependencies, never ran again. Nothing
       was ever bound and no gesture could fire. The debug bar was built after
       that same early return, which is why not even the bar appeared.
       The document is always there, so there is nothing to be null. Capture
       phase still does the real work: startDrag calls stopPropagation on every
       circle, toy and pill, so a bubble-phase listener would never hear a swipe
       that began on a dog, and the owner asked for it to work anywhere. */
    const down = (e: PointerEvent) => {
      /* Controls keep their own gestures. The difficulty slider in particular
         is a vertical drag on the start screen, which is exactly the shape of
         an era swipe, so a press starting there must never be read as one. */
      const t = e.target as HTMLElement | null;
      if (t?.closest?.('button, a, input, select, textarea, [role="slider"]')) { swipeRef.current = null; return; }
      if (!navRef.current.on) { swipeRef.current = null; return; }
      swipeRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    };
    const up = (e: PointerEvent) => {
      const p = swipeRef.current;
      swipeRef.current = null;
      if (!p || !navRef.current.on) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      const ax = Math.abs(dx), ay = Math.abs(dy);
      if (performance.now() - p.t > SWIPE_MS) return;          // too slow: a drag
      if (Math.max(ax, ay) < SWIPE_MIN) return;                 // too short: a tap
      const n = navRef.current;
      /* HORIZONTAL AXIS FLIPPED 9 Sept 2026, on testing. It first shipped as
         "finger moves right, go to the next dog", read literally off the D-pad,
         where the RIGHT arrow is NEXT. On a real screen that is backwards: a
         swipe is a grab at the content, not a press of the arrow, so pulling the
         content rightwards drags the PREVIOUS dog into view and the level number
         went down. This is the carousel convention and it is what everything
         else on a phone does.
         The BUTTONS are unaffected and keep their arrow meanings. A right arrow
         still goes forwards; only the drag is inverted against it, which is what
         people expect from the two.
         VERTICAL IS UNTOUCHED and still reads DOWN for the next era. Flagged to
         the owner as possibly wanting the same flip; not changed without asking,
         because only the horizontal was reported wrong.
         To flip either axis, swap the pair on its line. */
      if (ax >= ay * SWIPE_BIAS) (dx > 0 ? n.prev : n.next)?.();
      /* VERTICAL INVERTED 9 Sept 2026 (owner), to match the horizontal flip made
         earlier the same day. Both axes now follow the CONTENT, not the arrow:
         dragging downward pulls the previous era into view, exactly as dragging
         rightward pulls the previous dog in.
         The D-pad is deliberately the opposite and stays that way. Pressing a
         down arrow means "go forward"; dragging a page down means "go back". */
      else if (ay >= ax * SWIPE_BIAS) (dy > 0 ? n.prevEra : n.nextEra)?.();
      // Neither axis dominant: a diagonal smear, deliberately ignored.
    };
    /* Belt and braces with the touch-action fix in LineageModal. If the browser
       still manages to claim a gesture somewhere, judge it on what it had
       travelled by the time it was cancelled rather than binning it outright.
       Same thresholds, so a cancelled tap still cannot navigate. */
    const cancel = (e: PointerEvent) => { up(e); };
    document.addEventListener("pointerdown", down, { capture: true });
    document.addEventListener("pointerup", up, { capture: true });
    document.addEventListener("pointercancel", cancel, { capture: true });
    return () => {
      document.removeEventListener("pointerdown", down, { capture: true } as EventListenerOptions);
      document.removeEventListener("pointerup", up, { capture: true } as EventListenerOptions);
      document.removeEventListener("pointercancel", cancel, { capture: true } as EventListenerOptions);
    };
  }, []);
  // LEARN ONLY: the top-right square goes back to the level's start screen, the
  // one with LEARN and PLAY on it. No confirmation, by request: nothing is at
  // stake in learn, so a prompt would only be in the way. The pit keeps its X and
  // its paused menu, because there a stray tap can cost you a round.
  //
  // It is setLearning(false) without setStarted(true), which is exactly what the
  // PLAY button does minus starting the round, so the view reset below is copied
  // from there rather than reinvented: a zoomed-in focus left behind would make
  // the start screen open inside one circle.
  /* THE AUTO START, paired with startImmediately above.
     Read once on mount, because the host remounts the whole pit to restart a
     level. It is fired from inside the simulation effect, at the moment the
     fall is registered, rather than from an effect of its own: a mount effect
     runs before the sim has assigned runFallRef, so there would be nothing to
     call. See the arm block beside runFallRef. */
  const autoStartRef = useRef(startImmediately);
  const backToStartScreen = () => {
    setHovered(null);
    setHoverHint("");
    setAncestryFor(null);
    setAncHidden(true);
    setTrainHidden(true);
    setTempHidden(true);
    setChumTree(null);
    cancelAnimationFrame(rafRef.current);
    setFlighting(false); // an interrupted flight must not leave the marker stranded hidden
    focusRef.current = nodes[0];
    setFocus(nodes[0]);
    const rootV = clampRootView(displayOnly ? displayRestView() : [nodes[0].x, nodes[0].y, nodes[0].r * 2 * (isMobileRef.current ? PAD : ZOOM_PAD) * (dockAside ? PIT_SPAN : 1)]);
    homeWRef.current = rootV[2];
    zoomTo(rootV);
    if (!hideCaption) onToggleCaption?.();
    setLearning(false);
  };
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
      // the screen sends the cards left, and the other way round. "Left" is
      // only allowed if the gap to the screen edge can actually hold the rail,
      // otherwise the cards hang off the page.
      const railW = railRef.current?.getBoundingClientRect().width ?? 0;
      const roomLeft = r.left > railW + 20;
      setRailSide(roomLeft && r.left + r.width / 2 > window.innerWidth / 2 ? "left" : "right");
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
  // `green` is a chip that was already learnt on the layer it came from. It
  // keeps that colour in the pit rather than reverting to the yellow a fresh
  // chip wears.
  /* STAGE 1 OF "EVERY % CIRCLE DROPS", 9 Sept 2026. THE INDEX SPLIT.

     THE PROBLEM. A badge had no identity. Badge 3 meant "the third top-level
     dog's badge", and five separate places found a badge by counting along
     `nodes.filter(n => n.depth === 1)`. That list is also the falling dog
     bodies and the word fits, so it cannot be widened without turning every
     nested circle into its own falling dog, which is a different game.

     THE SPLIT. `src` is the circle a badge came from, carried by the badge
     itself. Nothing counts into the dog list any more. Stage 2 can then seed
     badges from deeper nodes by changing the seed alone.

     TWO HOMES, ON PURPOSE. The render needs it during render, so it rides in
     BadgeItem state. The knock and the pull need it from a handler, where
     state would be stale, so badgeSrcRef mirrors it. They are written in the
     same places and in the same order, so they cannot drift; if you add a
     badge, write both.

     THIS STAGE IS MEANT TO BE INVISIBLE. The badges are still seeded from the
     same depth-1 circles as before. Nothing on screen should move. */
  type BadgeItem = { pct: number; r: number; label?: string; bomb?: boolean; green?: boolean; src?: Node | null };
  const [badgePcts, setBadgePcts] = useState<BadgeItem[]>([]);
  const badgeSrcRef = useRef<(Node | null)[]>([]);
  /* THE ONE RULE for which circles carry a badge. Stage 2 widens THIS and
     nothing else. Both callers are inside effects, the seed and the drop, and
     they must always agree or the badge list and the badge bodies stop lining
     up. It is deliberately still depth 1. */
  const badgeSourceNodes = (all: Node[]) => all.filter((n) => n.depth === 1);
  // rods and name pills scattered in from the learn layer, pit-style props:
  // sizes are view units frozen at the drop; dead ones keep their slot so the
  // render children stay index-aligned with the bridge lists
  const [rodList, setRodList] = useState<{ len: number; h: number; lit: boolean }[]>([]);
  const [logoPieceList, setLogoPieceList] = useState<{ src: string; w: number; h: number }[]>([]);
  const [deadRods, setDeadRods] = useState<Set<number>>(new Set());
  const [pillList, setPillList] = useState<{ lines: string[]; w: number; h: number; unit: number }[]>([]);
  const [deadPills, setDeadPills] = useState<Set<number>>(new Set());
  const [toyList, setToyList] = useState<{ kind: ToyKind; size: number; h: number; src: string; filter?: string }[]>([]);
  const [chumList, setChumList] = useState<{ image: string; size: number; name: string }[]>([]);
  const [deadToys, setDeadToys] = useState<Set<number>>(new Set());
  /* The bone's fuse moment: the index of the toy wearing the second artwork,
     and when it started. Null the rest of the time. State rather than a ref
     because the swap is a RENDER, unlike the logo's damage stages which are
     written by the per-frame loop: this happens once, not every hit. */
  const [boneFuse, setBoneFuse] = useState<{ idx: number; at: number } | null>(null);
  /* THE APPROACH SWAP. The bone wears its second face while it is within the
     magnet's reach, before anything has joined, and drops back to the plain
     bone if you pull away. Owner asked for this from the start: "a 2nd bone svg
     that appears when the 2 objects are close to each other".

     It doubles as the only cue that the fuse is armed, which a snap distance
     this tight badly needs: without it you cannot tell a near miss from being
     nowhere near.

     Holds the toy index, or null. Set from the magnet, which runs every physics
     step, so it is written ONLY when the answer changes. */
  const [boneNear, setBoneNear] = useState<number | null>(null);
  /* Flipped one frame AFTER boneFuse is set, so the opacity actually
     transitions. Setting a node's starting opacity and its target in the same
     render gives the browser nothing to animate between and it would snap. */
  const [boneOhYeaGone, setBoneOhYeaGone] = useState(false);
  useEffect(() => {
    if (!boneFuse) return;
    /* NOTHING IS SET SYNCHRONOUSLY HERE. Resetting the flag inside the effect
       body is a setState-during-effect, which this file's eslint config counts
       as an error, and the baseline is not to be added to. The reset happens
       where the fuse is fired instead, and both writes below are inside
       callbacks, so they land on a later tick. */
    const raf = requestAnimationFrame(() => setBoneOhYeaGone(true));
    // Long enough for the hold and the fade, then the node stops being rendered
    // at all rather than sitting there at zero opacity for the rest of the round.
    const t = window.setTimeout(() => { setBoneFuse(null); setBoneOhYeaGone(false); }, BONE_OHYEA_HOLD + BONE_OHYEA_FADE + 200);
    return () => { cancelAnimationFrame(raf); window.clearTimeout(t); };
  }, [boneFuse]);
  const [britainOpen, setBritainOpen] = useState(false);
  const killToyRef = useRef<((idx: number) => void) | null>(null);
  const throwWatchRef = useRef<((pr: any) => void) | null>(null);
  const checkEscapeRef = useRef<(() => void) | null>(null);
  const flagIdxRef = useRef<number | null>(null);
  // The legibility floor in viewBox units: BADGE_FLOOR_PX drawn px, converted by
  // the stage's short side so it is the same on-screen size on any device. Below
  // this a badge shows nothing rather than clamping up (see badgeDrawForNode).
  /* CHIP_R_PX in viewBox units, the same conversion badgeFloorVb uses. The sim
     effect has fxScale and uses that; this one is outside it and reads the stage,
     which is why it is a function and not a constant. Called once per badge pass,
     not per chip. */
  const chipRVb = () => {
    const st = stageRef.current;
    const short = st ? Math.min(st.clientWidth, st.clientHeight) : SIZE;
    return (CHIP_R_PX * SIZE) / short;
  };
  const badgeFloorVb = () => {
    const st = stageRef.current;
    const short = st ? Math.min(st.clientWidth, st.clientHeight) : SIZE;
    return (BADGE_FLOOR_PX * SIZE) / short;
  };
  /* DIAGNOSTIC, ?badgedebug=1, 9 Sept 2026. REMOVE ONCE ANSWERED.
     Two readings of the code disagreed about whether a popped circle's chip is
     created and hidden, or never created at all. This counts the live badge
     list instead of arguing. It polls rather than logging at the spawn, so the
     total climbs as circles pop. Nothing is created and nothing runs without
     the flag. Placed here because it calls badgeFloorVb, declared above. */
  /* ---- ?spindiag=1 : WHY THE PIT WILL NOT SETTLE -----------------------------
     Owner, 18 September 2026: once chips go inert and start joining, they move
     constantly, score a point per movement, and sometimes spin faster and faster
     without stopping. This measures it rather than reasoning at it.

     THE ONE NUMBER THAT SETTLES IT IS dKE. Total kinetic energy of every
     non-static body, sampled twice a second, and the CHANGE since the last
     sample. A pit with nothing being dragged can only lose energy: gravity does
     work on the way down and friction takes it back. If dKE is repeatedly
     POSITIVE while `drag` reads none, something is putting energy in, and the
     rest of the line says what.

     WHAT EACH COLUMN IS FOR:
       pts/s    the 1-point collision award, counted at the award itself, so the
                scoring rate is measured and not inferred
       awake    matter's own sleeping flag. enableSleeping IS on, so a pit that
                will not settle should show these falling to zero. Bonded chips
                are expected to stay awake: see the bond block.
       bonds    live bond constraints in the world
       inert    chips in the state that bonds
       KE/dKE   see above, in px^2/step^2 times mass, so it is comparable with
                itself and nothing else
       sumW     total |angular velocity| across the pit
       maxW     the fastest spinner, with its kind, its bond count and its speed,
                which is the runaway the owner is describing

     The sampler runs inside the sim, where the world and the bond table are in
     scope, and writes finished lines into a ref. The effect below only prints
     them. Nothing is computed and no counter is incremented unless the flag is
     on. */
  /* ---- ?windiag=1 : WHY THE ROUND WILL NOT END --------------------------------
     Owner, 18 September 2026: every dog circle cleared, pit empty apart from
     chips, toys and bombs, and the round did not end. Intermittent.

     WHAT THE ROUND-WON TEST ACTUALLY ASKS. One line, in the learn layer's
     onRemove: every node in pitBodiesRef.owned is in removedNodesRef. `owned` is
     nodes that were GIVEN A BODY, and nothing is ever deleted from it, so the
     test is really "has every node that ever had a body been removed". A single
     node that gets a body and then becomes unclearable blocks the round for the
     rest of the level, and nothing on screen says which one.

     SO THIS LISTS THE BLOCKERS, and for each one the things that would explain
     why the player cannot see it: its drawn radius, whether its circle is
     display none or transparent, whether it still has a body, and whether that
     body is HELD, which takes it out of the world and hides the circle.

     Polls, like the other readouts. Nothing is created without the flag. */
  useEffect(() => {
    let d: HTMLDivElement | null = null;
    let t = 0;
    try {
      if (new URLSearchParams(window.location.search).get("windiag") !== "1") return;
      d = document.createElement("div");
      d.style.cssText =
        "position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#000;color:#f6f;" +
        "font:11px/1.4 monospace;padding:6px 8px;pointer-events:none;white-space:pre-wrap";
      d.textContent = "win diag: start a round";
      document.body.appendChild(d);
      const el = d;
      const tick = () => {
        const pb = pitBodiesRef.current;
        if (!pb) { el.textContent = "win diag: no pit yet"; return; }
        const owned = [...pb.owned];
        const rem = removedNodesRef.current;
        const blocking = owned.filter((n) => !rem.has(n));
        /* Read off the NODE and its body, never off nodesRef or the circle
           elements. Reading either of those from an effect makes the lint rule
           react-hooks/immutability flag the place they are written, which would
           put a diagnostic's cost on production code. Everything needed is here
           anyway: held with a body is the lifted-and-never-returned signature,
           no body at all is a node that was given one and lost it, and depth 1
           is a word rather than a circle. */
        const rows = blocking.slice(0, 10).map((n) => {
          const body = pb.find(n) as { held?: boolean } | undefined;
          const why = !body ? "NO BODY" : body.held ? "HELD (out of the world, circle hidden)" : "in play";
          return `d${n.depth} r=${n.r.toFixed(1)} ${why}  ${n.data.name}`;
        });
        el.textContent =
          `owned ${owned.length}  removed ${rem.size}  BLOCKING ${blocking.length}` +
          (blocking.length === 0 ? "   <-- the test would pass: the win never ran or was swallowed" : "") +
          (rows.length ? "\n" + rows.join("\n") : "");
      };
      tick();
      t = window.setInterval(tick, 500);
    } catch {}
    return () => { try { if (t) window.clearInterval(t); if (d) d.remove(); } catch {} };
  }, []);
  const spinDiagRef = useRef<string[]>([]);
  /* THE LAST CHAIN DEATH, written by the chain effect and read by the sim effect's
     sampler. A ref rather than a local because the two live in DIFFERENT effects:
     spinLastBlast can be a local inside the sim effect because detonate is in there
     with it, and killChain is not. Behind the flag at the write, so a normal round
     never touches it. */
  const spinLastChainRef = useRef("");
  // The flag itself, read once. The sim effect computes its own copy because it is
  // in scope there; the chain effect is a different effect and needs this.
  const spinOnRef = useRef(false);
  useEffect(() => {
    try { spinOnRef.current = new URLSearchParams(window.location.search).get("spindiag") === "1"; }
    catch { spinOnRef.current = false; }
  }, []);
  useEffect(() => {
    let d: HTMLDivElement | null = null;
    let t = 0;
    try {
      if (new URLSearchParams(window.location.search).get("spindiag") !== "1") return;
      d = document.createElement("div");
      d.style.cssText =
        "position:fixed;left:0;right:0;top:0;z-index:99999;background:#000;color:#ff0;" +
        "font:11px/1.4 monospace;padding:6px 8px;pointer-events:none;white-space:pre-wrap";
      d.textContent = "spin diag: start a round";
      document.body.appendChild(d);
      const el = d;
      const tick = () => {
        const lines = spinDiagRef.current;
        el.textContent = lines.length ? lines.join("\n") : "spin diag: no sim running";
      };
      tick();
      t = window.setInterval(tick, 250);
    } catch {}
    return () => { try { if (t) window.clearInterval(t); if (d) d.remove(); } catch {} };
  }, []);
  useEffect(() => {
    let d: HTMLDivElement | null = null;
    let t = 0;
    try {
      if (new URLSearchParams(window.location.search).get("badgedebug") !== "1") return;
      d = document.createElement("div");
      d.style.cssText =
        "position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#000;color:#0f0;" +
        "font:11px/1.4 monospace;padding:6px 8px;pointer-events:none;white-space:pre-wrap";
      d.textContent = "badge debug: start a round";
      document.body.appendChild(d);
      const el = d;
      const tick = () => {
        const bl = badgeBodiesRef.current;
        if (!bl || !bl.length) { el.textContent = "no badges yet (round not started)"; return; }
        const rs = bl.map((b) => b.rDraw ?? 0);
        const drawn = rs.filter((r) => r > 0).length;
        el.textContent =
          `badges ${bl.length}  drawn ${drawn}  hidden ${bl.length - drawn}\n` +
          `rDraw min ${Math.min(...rs).toFixed(2)}  max ${Math.max(...rs).toFixed(2)}  floor ${badgeFloorVb().toFixed(2)} (viewBox units)`;
        // NOT reading badgeSrcRef here on purpose: a read from this effect makes
        // the compiler treat its assignment in the seed as a write to a frozen
        // value, which costs an eslint error for a line that is only a nicety.
      };
      tick();
      t = window.setInterval(tick, 500);
    } catch {}
    return () => { try { if (t) window.clearInterval(t); if (d) d.remove(); } catch {} };
  }, []);
  /* DIAGNOSTIC, ?chipdebug=1, 15 September 2026. REMOVE ONCE ANSWERED.
     The question: are the yellow % chips bigger in the pit than the circles they
     came from on the lifted layer, and by how much. Two patches have guessed at
     the conversion and both were wrong, and screenshots taken at two different
     view zooms cannot separate a wrong chip size from a different zoom.

     This measures instead. A chip's rDraw is in SVG user units, so multiplying by
     the LIVE screen CTM gives its real radius in CSS px on the glass right now.
     The lifted layer drew the same circle at nodeR(share), which is
     radius(share) * PIT_NODE_SCALE. radius is imported here as pctRadius; the
     0.78 is PIT_NODE_SCALE, which LineageMap does not export, so it is written
     out with its source named rather than plumbed through for a diagnostic.

     The ratio at the end is the answer. 1.00 means they match and the fault is
     elsewhere. Anything else is the factor to correct by, and it is arithmetic
     from there rather than another reading of the code.

     Polls, like ?badgedebug=1, so the numbers follow the live zoom. Nothing is
     created and nothing runs without the flag. Deliberately does NOT read
     badgeSrcRef: see the note in the badgedebug block above, a read from an
     effect costs an eslint error. So native pit chips are listed too, and a
     scattered one is identified by its share. */
  useEffect(() => {
    let d: HTMLDivElement | null = null;
    let t = 0;
    try {
      if (new URLSearchParams(window.location.search).get("chipdebug") !== "1") return;
      d = document.createElement("div");
      d.style.cssText =
        "position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#000;color:#0ff;" +
        "font:11px/1.4 monospace;padding:6px 8px;pointer-events:none;white-space:pre-wrap";
      d.textContent = "chip debug: start a round";
      document.body.appendChild(d);
      const el = d;
      const tick = () => {
        const bl = badgeBodiesRef.current;
        if (!bl || !bl.length) { el.textContent = "no chips yet (round not started)"; return; }
        const st = stageRef.current;
        /* CORRECTED 15 September 2026. This was document.querySelector("svg"),
           which returns the FIRST svg in the document and is not the stage, so
           ctm.a came back as exactly 1.000 in both the pit and the lifted layer.
           Two views at different zooms cannot both be 1, which is how the wrong
           element gave itself away. The pit px column was therefore rDraw in user
           units, not pixels, and could not be compared with the lifted figure.
           doFall gets the stage the same way, via stageRef. */
        const svgEl = st ? st.querySelector("svg") : null;
        const ctm = svgEl ? (svgEl as SVGSVGElement).getScreenCTM() : null;
        const a = ctm && ctm.a ? ctm.a : 0;
        const vb = svgEl ? (svgEl as SVGSVGElement).getAttribute("viewBox") : null;
        // one line per distinct share, so a pile of chips stays readable
        const seen = new Map<number, { px: number; n: number }>();
        for (const b of bl) {
          const r = b.rDraw ?? 0;
          if (!r) continue;
          const cur = seen.get(b.pct);
          if (cur) cur.n += 1; else seen.set(b.pct, { px: r * a, n: 1 });
        }
        const rows = [...seen.entries()].sort((x, y) => y[0] - x[0]).slice(0, 8).map(([pct, v]) => {
          const lifted = Math.max(21, 5 * Math.sqrt(pct)) * 0.78;
          return `${String(pct).padStart(3)}%  pit ${v.px.toFixed(1)}px  lifted ${lifted.toFixed(1)}px  ratio ${(v.px / lifted).toFixed(2)}  x${v.n}`;
        });
        el.textContent = `chips ${bl.length}  ctm.a ${a.toFixed(4)}  svg ${svgEl ? "stage" : "MISSING"}  viewBox ${vb ?? "none"}\n` + rows.join("\n");
      };
      tick();
      t = window.setInterval(tick, 500);
    } catch {}
    return () => { try { if (t) window.clearInterval(t); if (d) d.remove(); } catch {} };
  }, []);
  useEffect(() => {
    if (!dockAside) return;

    /* THE ONE PLACE THAT DECIDES WHICH CIRCLES CARRY A BADGE. Stage 2 widens
       this filter and nothing else, because nothing else counts into the dog
       list any more. It is deliberately still depth 1 here. */
    const badgeNodes = badgeSourceNodes(nodes);
    badgeSrcRef.current = badgeNodes.slice();
    // One layout read for the whole pass, not one per badge: chipRVb measures the
    // stage, and every chip is the same size anyway.
    const chipR = chipRVb();
    setBadgePcts(
      badgeNodes.map((n) => {
        const pct = n.parent ? Math.round(((n.value ?? 0) / (n.parent.value || 1)) * 100) : 0;
        return { pct, r: chipR, src: n };
      }),
    );
    // k reads only viewRef.current[2], the view WIDTH, and the corrected seed above makes that width exact at
    // mount: clampRootView only shifts y, never the width, so the one number k depends on never needed the
    // measured stage (which is unavailable at the useRef initialiser). That seed is what sizes the first-load
    // badges right, killing the PIT_SPAN-too-big flash that used to persist until the slider forced a re-pack.
    // `entered` is then the genuine net for the settle paths the seed cannot precompute: a resize-only refit,
    // or any zoomTo(v) that lands on a width the analytic seed did not. It flips true only AFTER zoomTo(v) has
    // fitted the cluster, so viewRef.current is the settled view by the time this effect re-runs against it.
  }, [nodes, dockAside, entered]);
  // The rail outlives the info box. It is closed only by its own X, and comes
  // back whenever the box is reopened, so the two cycle together.
  const [railHidden, setRailHidden] = useState(false);
  // Where the rail stood when the box closed. Its normal position is measured
  // off the box, so once the box is hidden that anchor shifts and the rail
  // jumps. Pinning it to the screen at the coordinates it already had keeps it
  // exactly where the user last saw it.
  const [railPin, setRailPin] = useState<{ top: number; left: number } | null>(null);
  // The box starts shut now, so the first run of the effect below is the load
  // state, not the user closing anything. There is no position they have seen
  // to preserve, so the rail takes its home instead. This flips the moment the
  // box is opened for the first time, after which closing pins as it always did.
  const boxEverShownRef = useRef(false);
  /* THE RAIL IS NO LONGER TETHERED TO THE BOX. Owner ruling.

     It used to be tied three ways, all of them here or in the className below:
     it was positioned off the box's own element while the box was open, the box
     closing measured it and pinned it to fixed coordinates, and the box opening
     cleared that pin to drag it back to the box's side.

     None of that remains. The rail now takes its own screen position always,
     and the only thing that moves it is the user dragging it. All this effect
     still does is forget the box's drag offset when the box shuts, which was
     always about the box and never about the rail. */
  useEffect(() => {
    if (!hideCaption) {
      boxEverShownRef.current = true;
      setRailHidden(false);
      return;
    }
    asideOff.current = { x: 0, y: 0 }; // closed: forget where it was left
    if (asideRef.current) asideRef.current.style.transform = "";
    setSheetPos(null); // same for the phone sheet: reopening snaps it home
  }, [hideCaption]);

  // Item 13, the chum family tree. A rail dog lifted onto its own layer, the
  // same LineageMap the pit lift already uses, fed from the card it grew out of.
  // No tree prop: LineageMap falls back to getLineage(breed.name) on its own, so
  // this needs no new import and no second copy of the lookup.
  // Reference only, by decision: no onScore and no onRemove, so opening one
  // cannot collect a dog or change the round.
  const [chumTree, setChumTree] = useState<{ name: string; image: string; x: number; y: number; angle: number } | null>(null);
  // A collected card shows nothing but a tick, so its name has to be reachable.
  // Tap toggles it; hover shows it too, in CSS, behind (hover: hover).
  const [namedChum, setNamedChum] = useState<string | null>(null);
  /* The card-pack box that pops up in the bottom-left corner as a chum lands there.
     The pit has its own; this is the learn area's, using the same artwork and the
     same corner, so a collect looks the same wherever it happens. */
  const [chumBoxPop, setChumBoxPop] = useState(false);
  /* The running chum tally, shown big and white over the box as one lands. Null when
     nothing has just been collected. */
  const [chumPop, setChumPop] = useState<number | null>(null);
  const [learnNode, setLearnNode] = useState<Node | null>(null);
  // Mirrored for the frame writer, which cannot read state safely. See onPitBusy.
  useEffect(() => { learnOpenRef.current = !!learnNode; }, [learnNode]);
  const [learnCard, setLearnCard] = useState<{ name: string; image: string; x: number; y: number; angle: number; r: number; ring: string; ringFrac: number; ringPx: number } | null>(null);
  const removedNodesRef = useRef<Set<Node>>(new Set());
  const spawnBadgeRef = useRef<((x: number, y: number, r: number, pct: number, opts?: { r?: number; label?: string; charges?: number; green?: boolean; noBomb?: boolean }) => void) | null>(null);
  const spawnRodRef = useRef<((x1: number, y1: number, x2: number, y2: number, lit: boolean) => void) | null>(null);
  const spawnPillRef = useRef<((x: number, y: number, w: number, name: string) => void) | null>(null);
  // `toyKind` is only set on entries in toyBodiesRef, which is why it is
  // optional: rods, pills, chums and logo pieces share this shape and have no
  // kind of their own. The fuse reads it to find the bone.
  type PropBody = { x: number; y: number; vx: number; vy: number; a: number; idx: number; hits: number; maxHits: number; dead?: boolean; lastKnock?: number; mb?: any; onFloor?: boolean; floorLostAt?: number; toyKind?: string };
  const rodBodiesRef = useRef<PropBody[]>([]);
  /* Logo pieces. Its own list rather than joining the toys, because a piece has
     no kind, no retire key, no hit limit and cannot be thrown out of the pit.
     Same three-part shape as the rods: bodies in a ref, drawn sizes in state,
     one container the frame loop indexes by idx. */
  const logoPieceBodiesRef = useRef<PropBody[]>([]);
  const logoPiecesGRef = useRef<SVGGElement>(null);
  const toyBodiesRef = useRef<PropBody[]>([]);
  const toysGRef = useRef<SVGGElement>(null);
  const chumsGRef = useRef<SVGGElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chumBodiesRef = useRef<any[]>([]);
  // REMOVE BEFORE LAUNCH, ?floorbox=1. See floorBoxOn() above.
  const levelLayerRef = useRef<HTMLDivElement>(null);
  const levelFloorRef = useRef<HTMLImageElement>(null);
  const [floorDiag, setFloorDiag] = useState<string | null>(null);
  // The swipe chain's path layer inside the pit SVG, written directly each frame.
  const chainGRef = useRef<SVGGElement>(null);
  /* THE SWIPE WINS OVER THE COLLECT (owner,
     17 September 2026). A second press on an armed card collects it on the
     PRESS, before anyone can know whether a swipe follows. Under the chain flag,
     when that press also opened the chum gate, the collect is parked here by
     card index and the chain settles it on release: a chain that joined a second
     card cancels it and the card stays armed; a release that never got past the
     first card collects exactly as the tap did. Off the flag this is never set.
     The collect itself is called through a latest-value ref, because the chain's
     listeners are bound once and collectChum is a new function every render. */
  const chainHeldCollectRef = useRef<number | null>(null);
  const chainTapCollectRef = useRef<((i: number) => void) | null>(null);
  /* SCORING AND CLEARING A CHAIN.
     chainClearRef clears a valid chain through collectChum, card by card, and is
     refreshed every render like chainTapCollectRef, so the collectChum it calls
     always closes over the current chumList. chainBonusRef is set inside the sim,
     where numAt and CHUM_COLLECT_POINTS live: it flashes the chain's multiplier
     bonus at the last card and scores it through the same onScore every collect
     uses, so the running total and the milestone celebration see it. */
  /* See dogChainOn() above.
     nodesRef  the packed nodes as a ref, because the chain's listeners are bound
               once and must never read state
     breed     the breed of the chain being drawn, or null. The frame writer
               turns the question mark yellow on every circle holding it
     chain     the chain REMEMBERED from release until completion, which can be a
               minute later. Cleared when it is honoured, when the player backs
               out of the layer without completing, and when the pit is torn down
     takeover  the drag lets go and the chain takes the pointer, mid press, once
               the finger has moved past DOG_CHAIN_ARM_PX
     open      lifts a circle into the layer, the same call the tap makes
     close     a circle leaves the pit: its body is held out of the world and it
               poofs where it stood */
  const nodesRef = useRef<Node[]>([]);
  const dogChainBreedRef = useRef<string | null>(null);
  /* The circles IN the chain being drawn. The
     breed above says which circles to highlight; this says which are actually
     held, and the frame writer turns their outlines white while they are. Held
     by node, like the remembered chain, so a re-pack cannot mix them up. */
  const dogChainNodesRef = useRef<Set<Node>>(new Set());
  // The layer that carries the twin glow: one blurred ring per circle that has
  // another of its breed touching it. See the note where it is written.
  const twinGlowGRef = useRef<SVGGElement>(null);
  const dogChainRef = useRef<{ opened: Node; others: Node[] } | null>(null);
  /* THE HANDOVER, which replaced dogStarterAtRef.
     Called from the chain's own pointermove, once and only once,
     at the moment the press stops being a drag and becomes a chain. It lives
     inside the sim because everything it has to settle lives there: the mouse,
     the flick buffer and the pressed bomb. Returns false if the press was not
     ours to take, and the chain is dropped rather than drawn on a pointer
     something else is already holding. See the note where it is written. */
  const dogChainTakeoverRef = useRef<((pointerId: number) => boolean) | null>(null);
  const dogOpenRef = useRef<((i: number) => boolean) | null>(null);
  const dogCloseRef = useRef<((n: Node, from?: { x: number; y: number }) => void) | null>(null);
  // The last pair reported by the counter, so the callback fires on a CHANGE and
  // not sixty times a second. See onCircleCount for what the numbers mean.
  const circleCountRef = useRef<{ left: number; tot: number }>({ left: -1, tot: -1 });
  // The last busy answer reported, and whether a circle is up on the learn layer.
  // learnNode is state and the frame writer holds an older closure, so the effect
  // below mirrors it into a ref the writer can read safely. See onPitBusy.
  const pitBusyRef = useRef<boolean | null>(null);
  const learnOpenRef = useRef(false);
  // The removed set is a ref, so closing circles changes nothing React can see.
  // This is the nudge that gets them off the screen.
  const [, setDogChainClosed] = useState(0);
  const chainClearRef = useRef<((cards: number[]) => void) | null>(null);
  const chainBonusRef = useRef<((cards: number[]) => { sum: number; mult: number; bonus: number }) | null>(null);
  // Pays CHAIN_JOIN_POINTS at the card just joined. Set inside the sim beside
  // the other scoring refs, because numAt lives there.
  /* TAKES A POINT, NOT AN INDEX (owner, 18 September 2026). It used to take the
     joined card's index and look it up in chumBodiesRef, which is the CHUM CARD
     array: a dog chain passed a circle index into it, so the flash either landed
     on an unrelated chum card or, past the end of that array, did not appear at
     all. Both kinds now hand over world coordinates, taken from the kind's own
     at(), plus the colour the sparks should wear and how many connections the
     chain has made. See ChainKind.at. */
  const chainJoinScoreRef = useRef<((x: number, y: number, colour: string, links: number) => void) | null>(null);
  // Pays the full sweep bonus at a point. See CHAIN_SWEEP_POINTS.
  const chainSweepScoreRef = useRef<((x: number, y: number, val: number) => void) | null>(null);
  // Filled by an effect below. The spawn runs several seconds after the drop,
  // so it is always populated by the time it is read.
  const chumImagesRef = useRef<{ image: string; band: string; name: string }[]>([]);
  /* DOUBLE TAP ON A FLOOD CARD, ON ITS OWN AND NOWHERE NEAR THE SHARED RULE.

     Every other object in the pit is judged by one rule: press, and if the
     finger stays still and lifts quickly it was a tap, otherwise a drag. Adding
     "is a second tap coming" to that rule would put a wait on EVERY tap in the
     pit, including opening a dog circle, and would make a slow drag start
     reading as a tap.

     So the cards keep their own count instead. Nothing above knows about it,
     the shared rule is not touched, and the worst case if this is wrong is that
     a card does not collect. */
  /* ARMED, THEN TAKEN. The card's edge is the state.

     White at rest. One tap arms it and turns it yellow. A second tap on the
     SAME card turns it green and collects it. Only one card is ever armed, so
     tapping another moves the arming across rather than leaving a trail of
     yellow behind you.

     This replaces a 340ms double tap. The timing was invisible: a card had a
     third of a second to be tapped again and nothing on screen said so. The
     gesture is still two taps and it is still entirely the cards' own, nowhere
     near the pit's shared press-and-move rule, which is the thing that must not
     be touched. */
  const [armedChum, setArmedChum] = useState<number | null>(null);
  /* The card taken most recently. The flight itself lives in a ref, because it
     writes the DOM directly rather than re-rendering thirty times, so the green
     needs its own piece of state to render from. */
  const [takenChum, setTakenChum] = useState<number | null>(null);
  // Mirrors of the two card states so the per-frame chum paint can read them
  // without a render, the usual reason a ref shadows state in this file. The
  // floor state itself lives on the body (pr.onFloor), set by the collision
  // handlers below.
  const armedChumRef = useRef<number | null>(null);
  const takenChumRef = useRef<number | null>(null);
  useEffect(() => { armedChumRef.current = armedChum; takenChumRef.current = takenChum; }, [armedChum, takenChum]);
  // How long the outline stays red after the last floor contact. The solver
  // separates a resting body for the odd frame, which would flicker the edge;
  // this rides over that. Reported to Steve rather than added silently.
  const CHUM_FLOOR_GRACE_MS = 120;
  /* Takes a body out of the physics world. The world itself only exists inside
     the sim effect, so the handler outside cannot reach it directly. This is
     the same pattern killToyRef and spawnBadgeRef already use. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const removeChumBodyRef = useRef<((mb: any) => void) | null>(null);
  /* SCORING A CHUM COLLECTED FROM THE PIT, 15 September 2026 (owner: the score
     only went up on the green button, not on double-clicking the chum cards).

     It did not go up at all. The double-click handler called onChumCollected and
     flashCorner and nothing else, so a player could clear every chum out of the
     pit and finish on the same score they started the round with. The counter
     moved, which is what made it look like it was working.

     Routed through a ref for the same reason killToyRef and spawnBadgeRef are:
     numAt lives inside doFall, where the fx layer and the world transform are,
     and the collect handler is out in the render. numAt already calls onScore,
     so this scores AND flashes the number where the card was, like every other
     award in the pit. */
  const chumScoreRef = useRef<((i: number) => void) | null>(null);
  // Set inside the sim effect; called from the chum-collect handler so a rescue
  // is evaluated the INSTANT a chum is taken, not up to one 400ms poll later.
  // That immediacy is what lets a clear with half a second of "Oh no" left count.
  const tryCancelRef = useRef<(() => void) | null>(null);
  // How long the green shows before the card leaves, so the state is readable.
  const CHUM_TAKE_MS = 140;
  // Cards taken out of the flood, by index, so the card can go the instant it
  // is collected rather than waiting for the level list to be rebuilt.
  const [chumGone, setChumGone] = useState<Set<number>>(new Set());
  /* Every card index collectChum has ever taken in this flood, written the
     moment it is taken and never removed. The in-flight map forgets a card when
     it lands and chumGone only catches up on the next render, so this is the one
     record that still says "taken" after landing, with no render in between.
     Reset with chumGone when the flood is torn down. */
  const chumTakenRef = useRef<Set<number>>(new Set());
  /* THE COLLECT FLIGHT, ported from the main pit's collectXf.

     A collected card does not blink out. It tumbles into the bottom-left
     corner, shrinking and fading, and only then leaves the list. Same 520ms and
     the same curved fall: x slides to the corner while y accelerates, so it
     arcs instead of travelling in a straight line.

     The target is measured off the tally itself on the first frame of each
     flight, so it stays right if the number is resized later, and it is
     converted through the SVG's own screen matrix because the cards are drawn
     in viewBox units, not pixels. That conversion is what keeps it correct
     under pan and zoom. */
  const CHUM_FLY_MS = 520;
  const tallyRef = useRef<HTMLDivElement>(null);
  /* THE CORNER IS A FLASH, NOT A FIXTURE. The box and the number show for one
     collect, fade, and leave. The next double tap brings them back with the new
     total. Counted up per collect rather than read off the count itself, so two
     cards taken in quick succession each get their own showing. */
  const CORNER_HOLD_MS = 1600;
  const [cornerShot, setCornerShot] = useState(0);
  const cornerTimerRef = useRef<number | null>(null);
  const flashCorner = () => {
    if (cornerTimerRef.current != null) window.clearTimeout(cornerTimerRef.current);
    setCornerShot((n) => n + 1);
    cornerTimerRef.current = window.setTimeout(() => { setCornerShot(0); cornerTimerRef.current = null; }, CORNER_HOLD_MS);
  };
  const chumFlyRef = useRef<Map<number, { t0: number; spin: number; tx: number; ty: number; got: boolean }>>(new Map());
  const chumFlyRaf = useRef<number | null>(null);
  const chumFlyTarget = () => {
    const st = stageRef.current;
    const svg = st ? st.querySelector("svg") : null;
    if (!svg) return null;
    const ctm = (svg as SVGSVGElement).getScreenCTM();
    if (!ctm) return null;
    const r = tallyRef.current ? tallyRef.current.getBoundingClientRect() : null;
    // The big number sits on the bottom-left of its own square, so aim at that
    // and not at the middle of what is mostly empty space.
    const cx = r ? r.left + r.width * 0.3 : 60;
    const cy = r ? r.bottom - r.height * 0.3 : window.innerHeight - 60;
    const inv = ctm.inverse();
    // `real` says the tally was actually on screen to measure. The first collect
    // mounts it in the same render that starts the flight, so the first frame
    // can arrive a beat early; the caller waits rather than locking on to the
    // fallback corner.
    return { x: inv.a * cx + inv.c * cy + inv.e, y: inv.b * cx + inv.d * cy + inv.f, real: !!r };
  };
  const stepChumFly = (now: number) => {
    const m = chumFlyRef.current;
    const gg = chumsGRef.current;
    if (!m.size || !gg) { chumFlyRaf.current = null; return; }
    // Measured once per frame for the whole batch, not once per card.
    const tgt = chumFlyTarget();
    const v2 = viewRef.current;
    const kk2 = SIZE / v2[2];
    const landed: number[] = [];
    m.forEach((f, i) => {
      const pr = chumBodiesRef.current[i];
      const el = gg.children[i] as SVGGElement | undefined;
      if (!pr || !el) { landed.push(i); return; }
      const t = Math.min(1, (now - f.t0) / CHUM_FLY_MS);
      // Locked once, so the card flies a smooth arc instead of chasing a target
      // that moves as the number grows a digit.
      if (tgt && !f.got && (tgt.real || t > 0.25)) { f.tx = tgt.x; f.ty = tgt.y; f.got = true; }
      // Its body is out of the world, so this start point is frozen. The view
      // is read fresh, so a zoom mid-flight moves the card with everything else.
      const sx = (pr.x - v2[0]) * kk2, sy = (pr.y - v2[1]) * kk2;
      const tx = f.got ? f.tx : sx, ty = f.got ? f.ty : sy;
      const x = sx + (tx - sx) * t;         // x slides toward the corner
      const y = sy + (ty - sy) * (t * t);   // y accelerates, a curved fall
      const sc = Math.max(0.04, 1 - t);     // shrinks into the tally
      el.setAttribute("transform", `translate(${x},${y}) rotate(${pr.a * 57.2958 + f.spin * t}) scale(${sc})`);
      el.style.opacity = t > 0.72 ? String(Math.max(0, (1 - t) / 0.28)) : "1";
      if (t >= 1) landed.push(i);
    });
    landed.forEach((i) => {
      m.delete(i);
      const el = gg.children[i] as SVGGElement | undefined;
      if (el) el.style.opacity = "";
    });
    if (landed.length) setChumGone((g) => { const s = new Set(g); landed.forEach((i) => s.add(i)); return s; });
    chumFlyRaf.current = m.size ? requestAnimationFrame(stepChumFly) : null;
  };
  // The loop owns a frame handle, so it has to be given back on unmount.
  useEffect(() => () => {
    if (chumFlyRaf.current != null) cancelAnimationFrame(chumFlyRaf.current);
    if (cornerTimerRef.current != null) window.clearTimeout(cornerTimerRef.current);
  }, []);
  /* COLLECTS ONE CHUM CARD, BY INDEX. Lifted out of the card's own
     press handler so that one route takes a card, whatever asked for it. The
     arming and the yellow and green edge stay with the tap: they are that
     gesture's state, not part of taking the card.

     SAFE TO CALL FOR SEVERAL CARDS IN A ROW. Each card is scored, leaves the
     world and joins the flight map on its own. The flight loop is started once,
     by whichever delay fires first, and flies the whole map as one batch. A card
     already in flight is skipped, so the same index twice scores once.

     A CARD THAT HAS ALREADY LANDED IS NOW GUARDED TOO (17 September 2026, for
     the swipe chain). The in-flight check only holds for the 520ms of the
     flight: stepChumFly deletes a card from the flight map when it lands, and
     chumGone only catches up on the next render. Called again in that gap or
     after, this used to score the card a second time (another collect), report it
     through onChumCollected again, flash the corner and fly an invisible card.
     chumTakenRef records every card taken, synchronously and for good, so a
     second call for any card already taken does nothing. The tap never reached
     this, because a landed card is display none with pointer events off, so
     the tap is unchanged.

     IT READS chumList FROM THE RENDER IT WAS CREATED IN. collectChum is a new
     function on every render and closes over that render's chumList, which is
     where the card's name for onChumCollected comes from. The tap is safe,
     because its handler is rebuilt every render. A listener bound ONCE (a
     document or window listener in an effect with [] dependencies, the way the
     start screen swipe is bound) keeps the collectChum from its first render,
     and so a chumList that may still be empty: every card is then scored and
     flown but never counted as collected. Call it through a latest-value ref,
     the pattern navRef uses, or rebind the listener when chumList changes. A
     landed check that reads chumGone from the same stale closure has the same
     problem. stepChumFly does not: it reads only refs and a functional
     setChumGone, so an old copy of it flies cards correctly. */
  const collectChum = (i: number) => {
    // Already on its way, or already landed, so leave it alone.
    if (chumFlyRef.current.has(i) || chumTakenRef.current.has(i)) return;
    chumTakenRef.current.add(i);
    // Out of the physics world first, so nothing can knock a
    // card that is already on its way to being collected.
    const b = chumBodiesRef.current[i];
    // CLEAR onFloor BEFORE removing the body. Removing it from the
    // world does NOT fire collisionEnd, so onFloor would stay true
    // and anyChumOnFloor() would never see the floor empty: the
    // rescue would never fire and the whole feature would look
    // broken. Clear it, drop the body, then re-test the countdown.
    if (b) { b.onFloor = false; b.floorLostAt = 0; }
    // Scored BEFORE the body goes, so the number flashes at the
    // card rather than wherever the bridge was last written.
    chumScoreRef.current?.(i);
    if (b?.mb) { try { removeChumBodyRef.current?.(b.mb); } catch { /* already gone */ } }
    tryCancelRef.current?.();
    // Off it goes to the corner. It leaves the list when it
    // lands, not now, so the flight has something to draw.
    chumFlyRef.current.set(i, newChumFlight());
    window.setTimeout(() => {
      if (chumFlyRaf.current == null) chumFlyRaf.current = requestAnimationFrame(stepChumFly);
    }, CHUM_TAKE_MS);
    // Counted straight away, so the box pops and the number
    // climbs as the card sets off, not when it lands.
    const cm = chumList[i];
    if (cm) onChumCollected?.(cm.name);
    flashCorner();
  };
  // The tap's own collect, the same three
  // calls as the card handler, refreshed every render (the navRef pattern) so
  // the chain's once-bound listeners never call a stale collectChum.
  useEffect(() => {
    chainTapCollectRef.current = (i: number) => {
      setArmedChum(null);
      setTakenChum(i);
      collectChum(i);
    };
    // A valid chain: every card through the one collect route. A card armed
    // for a tap goes with its chain, so its yellow edge is cleared.
    chainClearRef.current = (cards: number[]) => {
      if (armedChumRef.current != null && cards.includes(armedChumRef.current)) setArmedChum(null);
      for (const i of cards) collectChum(i);
    };
    /* Is the tap allowed right now? Off the chain flag it always is, and the
       pit behaves as it always has. Under the flag it unlocks only for the last
       few cards. Refreshed every render, and read by the card's press handler
       and by the frame writer, neither of which can read state directly. */
  });
  // The cookie panel's two answers. They are pit objects, not UI: they squeeze
  // out of the panel, tumble, can be dragged and barge like anything else.
  const btnBodiesRef = useRef<PropBody[]>([]);
  const btnsGRef = useRef<SVGGElement>(null);
  const [btnList, setBtnList] = useState<{ label: string; w: number; h: number; tone: string; sw: number }[]>([]);
  const [deadBtns, setDeadBtns] = useState<Set<number>>(new Set());
  const cookieBtnsRef = useRef<((px: number, py: number) => void) | null>(null);
  const cookieAnswerRef = useRef<((i: number, accept: boolean) => void) | null>(null);
  // Which toy slot the cookie panel took, so answering can clear it away.
  const cookiesIdxRef = useRef<number | null>(null);
  // Removes the panel and both buttons. Held as a ref because the sim owns the
  // bodies and the listener below lives out here.
  const cookieClearRef = useRef<(() => void) | null>(null);
  const pillBodiesRef = useRef<PropBody[]>([]);
  const rodsGRef = useRef<SVGGElement>(null);
  const pillsGRef = useRef<SVGGElement>(null);
  const [inertBadges, setInertBadges] = useState<Set<number>>(new Set());
  /* `find` RETURNS ENOUGH TO TAKE A BODY OUT, not just to read where it is
     (18 September 2026). mb, mbIn and blown were left off this shape while the
     only callers wanted coordinates; dogClose now removes the body itself rather
     than flagging it for the step loop, so it needs the handle and the two flags
     the loop reads. Same object either way, only the declared surface widened. */
  const pitBodiesRef = useRef<{ find: (n: Node) => { x: number; y: number; vx: number; vy: number; held?: boolean; mb?: object; mbIn?: boolean; blown?: boolean } | undefined; owned: Set<Node> } | null>(null);
  // Each dropped name's real drawn box, measured off the DOM at drop time and
  // converted into world units. Measured rather than derived: the label sits
  // inside a group that zoomTo has already scaled, and its text block is offset
  // from the group origin by titleDy(r), so both the size and the centre have to
  // come from getBBox rather than from the constants.
  // The pit words get a group of their own, positioned straight off their
  // bodies, exactly the way the chips and the name pills already work.
  //
  // The first two attempts reused the packed label that lives inside each
  // circle's wrapper. Both failed, because that element is owned by React and
  // can hide itself six different ways: `visible`, `display`, `opacity`,
  // `entered`, `buriedSet` and `overlaid`, and its transform is fought over by
  // React and zoomTo. Measuring it with getBBox failed too, since getBBox
  // returns zeros on a display:none element. A separate group answers to
  // nothing but the physics.
  const wordsGRef = useRef<SVGGElement | null>(null);
  const wordBodiesRef = useRef<{ x: number; y: number; a: number; n: Node | null; held?: boolean }[]>([]);
  const [wordList, setWordList] = useState<{ lines: string[]; fs: number }[]>([]);
  const wordPopAtRef = useRef<number>(0);
  // Whether the last press came from a finger. Touch has no hover, so this flag
  // keeps the tap path and the mouse-hover path apart: browsers fire a synthetic
  // mouseenter on tap, which would set hovered before the click landed and make
  // the first tap behave like the second.
  const touchRef = useRef(false);
  // The pit-full wash. Zero when the countdown starts, a tenth more with every
  // second it counts down, solid on nought.
  const [fullAlpha, setFullAlpha] = useState(0);
  const runFallRef = useRef<(() => void) | null>(null);
  const fullTriggeredRef = useRef(false);
  // FLOOR RESCUE, a DELIBERATE REVERSAL (Steve, 2026-08-12). This countdown used
  // to be split in two by a `floorTriggeredRef`: a pit-full count could be called
  // off by emptying the pit, but a floor-triggered one (a chum landed) was made
  // permanent, on the reasoning that "a chum landing cannot be undone". That was
  // reversed on purpose: collecting every chum off the floor now cancels the
  // countdown like any other, and if the count already reached zero the "Oh no"
  // is replaced by a "Phew!" beat (see cancelCountdown/playPhew). There is no
  // floor/pit-full distinction any more and no `floorTriggeredRef`. Do NOT
  // reintroduce it thinking the rescue is a regression: it is the intended design.
  // The pit-full countdown, ported from the main pit: huge sequential digits
  // 10 to 0 over the stage, a pause on 0, then GAME OVER hands to the shell.
  // The handles have to leave this function to be cancellable at all. Before,
  // `tick` was a local and the element was a local, so nothing outside could
  // ever stop it: once the pit read as full the round was over even if you then
  // cleared the floor. The main pit does not work that way, and this is its rule.
  const cdTickRef = useRef<number | null>(null);
  const cdElRef = useRef<HTMLDivElement | null>(null);
  // The centre set of digits. Mobile only, and torn down everywhere the corner
  // set is, or a cancelled countdown would leave a number sitting on the pit.
  const cdMidElRef = useRef<HTMLDivElement | null>(null);
  // Post-zero timers, split out of runCountdown so a RESCUE can stop them: the
  // 1.2s hold on "0", the 1.4s "Oh no" before the hand-off, and the Phew beat's
  // own two timers. cdPostZeroRef records that the count has reached zero, which
  // is what makes a rescue play "Phew!" rather than just clearing the digits.
  const cdHoldRef = useRef<number | null>(null);
  const cdOverRef = useRef<number | null>(null);
  const cdPhewRef = useRef<number[]>([]);
  const cdPostZeroRef = useRef(false);
  const cdGraceRef = useRef(0);
  // Set the moment the round is handed back to the shell. The occupancy poll
  // in the sim effect deliberately outlives the physics loop, so without this
  // it would carry on testing a pit whose round is already over.
  const pitEndedRef = useRef(false);
  // Handle for the occupancy poll. A ref rather than a local because the
  // effect's cleanup sits outside the block the sim is built in.
  const fullPollRef = useRef(0);
  /* THE ROUND IS OVER. STOP THE CLOCK.

     `pitEndedRef` used to be set only when the pit-full countdown itself
     handed over. Winning left it false, so the occupancy poll, which
     deliberately outlives the physics loop, carried on testing a pit whose
     round was already decided. A chum card resting on the floor would then
     start a fresh countdown UNDER the win screen and hand back GAME OVER ten
     seconds later.

     A floor-triggered countdown was once even harder to stop (see the reversal
     note by the removed `floorTriggeredRef` above); that distinction is gone.
     This is still the one place that ends the round, takes down whatever is on
     screen, and clears the countdown state. */
  // Clear every countdown timer: the ticking interval, the two post-zero timeouts
  // (the "0" hold and the "Oh no" hand-off) and the Phew beat's two timers. Used
  // by endPitRound, by cancelCountdown, and defensively at the top of runCountdown.
  const clearCdTimers = () => {
    if (cdTickRef.current !== null) { window.clearInterval(cdTickRef.current); cdTickRef.current = null; }
    if (cdHoldRef.current !== null) { window.clearTimeout(cdHoldRef.current); cdHoldRef.current = null; }
    if (cdOverRef.current !== null) { window.clearTimeout(cdOverRef.current); cdOverRef.current = null; }
    for (const t of cdPhewRef.current) window.clearTimeout(t);
    cdPhewRef.current = [];
  };
  const endPitRound = () => {
    pitEndedRef.current = true;
    clearCdTimers();
    if (cdElRef.current) { cdElRef.current.remove(); cdElRef.current = null; }
    if (cdMidElRef.current) { cdMidElRef.current.remove(); cdMidElRef.current = null; }
    cdPostZeroRef.current = false;
    setFullAlpha(0);
    fullTriggeredRef.current = false;
  };
  // PHEW! A rescue that lands after the count already reached zero. The countdown
  // element is reused so it reads as the SAME beat resolving, not a new screen:
  // the word becomes "Phew!" and the danger wash recedes to nothing. "Oh no..."
  // trails off because bad news arrives; relief is a release, so "Phew!" gets the
  // exclamation and the wash lets go. The element is pointer-events none and play
  // is already live the moment the flags reset, so this is a non-blocking flourish
  // over a running pit. Its own two timers live in cdPhewRef so a fresh countdown
  // (or teardown) can clear them.
  const playPhew = (el: HTMLDivElement) => {
    el.textContent = "Phew!";
    // Centre and size it like "Oh no...", in case the rescue was caught during the
    // "0" hold when the corner digits are still top-right on mobile.
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
    el.style.padding = "0";
    el.style.textAlign = "center";
    el.style.fontSize = "clamp(6.8rem, 24vw, 16rem)";
    el.style.textShadow = "0 4px 40px rgba(0,0,0,0.6)";
    el.style.lineHeight = "1";
    el.style.transition = "background 0.35s ease";
    el.style.background = "transparent"; // the danger wash recedes
    const t1 = window.setTimeout(() => {
      el.style.transition = "opacity 0.3s ease";
      el.style.opacity = "0";
    }, 900);
    const t2 = window.setTimeout(() => {
      el.remove();
      if (cdElRef.current === el) cdElRef.current = null;
    }, 1200);
    cdPhewRef.current = [t1, t2];
  };
  // Call the countdown off: stop every timer, then either play the Phew beat (the
  // count had reached zero) or just clear the digits (mid-count, silent, exactly
  // as the pit-full cancel always did). Resets the trigger and opens the 2.5s
  // grace so a chum already mid-air cannot restart it the instant a Phew lands.
  const cancelCountdown = (now: number) => {
    clearCdTimers();
    const el = cdElRef.current;
    if (cdMidElRef.current) { cdMidElRef.current.remove(); cdMidElRef.current = null; }
    if (cdPostZeroRef.current && el) {
      playPhew(el); // el lives on through the Phew, which owns its own removal
    } else if (el) {
      el.remove(); cdElRef.current = null;
    }
    cdPostZeroRef.current = false;
    setFullAlpha(0);
    fullTriggeredRef.current = false;
    cdGraceRef.current = now + 2500;
  };
  const runCountdown = () => {
    // Guarded at the source, not at each caller. The floor collision starts a
    // countdown directly and never consulted the poll, so a guard on the poll
    // alone would have left that path open.
    if (pitEndedRef.current) return;
    // Defensive: a fresh count always starts clean, tearing down any leftover
    // digits or an in-flight Phew (the 2.5s grace normally prevents the overlap).
    clearCdTimers();
    if (cdElRef.current) { cdElRef.current.remove(); cdElRef.current = null; }
    if (cdMidElRef.current) { cdMidElRef.current.remove(); cdMidElRef.current = null; }
    cdPostZeroRef.current = false;
    const st = stageRef.current;
    if (!st) { pitEndedRef.current = true; onPitFull?.(); return; }
    const el = document.createElement("div");
    // MOBILE: top right, out of the middle of the pit, so the digits do not sit
    // over the thing you are trying to play. Desktop keeps the centre, where
    // there is room for them.
    //
    // The top-right corner already holds the back square and the brain, 67.5
    // each with 18 of margin, so the digits are dropped below both rather than
    // laid over them. That is why the top inset is 180 and not 18.
    const cdMobile = isMobileRef.current;
    el.style.cssText =
      "position:absolute;inset:0;z-index:200;display:flex;font-family:var(--font-display,'Luckiest Guy',system-ui);color:#fff;pointer-events:none;text-shadow:0 4px 40px rgba(0,0,0,0.6);" +
      (cdMobile
        // The top-right CORNER, over the close square, as asked. It was 180px
        // down because I placed it below the pit's own squares from their
        // measurements rather than from what is actually on screen.
        // 8px down, not 18: the in-pit squares moved 15 up and about 24 right on
        // 1 September, and the digits stayed where they were, so they sat low
        // against the title and the portrait. This puts them back on that line.
        ? "align-items:flex-start;justify-content:flex-end;padding:8px 18px 0 0;font-size:clamp(3.4rem,13vw,7rem);"
        : "align-items:center;justify-content:center;font-size:clamp(5rem,18vw,12rem);");
    st.appendChild(el);
    /* A SECOND SET OF DIGITS, IN THE MIDDLE. The corner pair keeps the count
       clear of the play; this one puts it where the reader is actually looking.
       Two elements driven by ONE ticker, so they cannot disagree.
       Mobile only: on desktop the corner set is already centred and a second
       would land exactly on top of it. Held back and behind, so it reads as an
       echo of the corner rather than competing with it. */
    const elMid = cdMobile ? document.createElement("div") : null;
    if (elMid) {
      elMid.style.cssText =
        "position:absolute;inset:0;z-index:199;display:flex;align-items:center;justify-content:center;" +
        "font-family:var(--font-display,'Luckiest Guy',system-ui);color:#fff;pointer-events:none;" +
        "text-shadow:0 4px 40px rgba(0,0,0,0.6);opacity:0.5;font-size:clamp(6rem,34vw,16rem);";
      st.appendChild(elMid);
    }
    const steps = ["10","9","8","7","6","5","4","3","2","1","0"];
    let i = 0;
    el.textContent = steps[i];
    if (elMid) elMid.textContent = steps[i];
    setFullAlpha(0);
    cdElRef.current = el;
    cdMidElRef.current = elMid;
    const tick = window.setInterval(() => {
      i++;
      if (i < steps.length) {
        el.textContent = steps[i];
        if (cdMidElRef.current) cdMidElRef.current.textContent = steps[i];
        setFullAlpha(i / 10);
        return;
      }
      window.clearInterval(tick);
      cdTickRef.current = null;
      // The count has reached zero: a rescue from here on plays "Phew!" rather
      // than silently clearing the digits. Still fully rescuable until onPitFull.
      cdPostZeroRef.current = true;
      // hold on 0, then "Oh no", then hand over (all cancellable via the refs)
      cdHoldRef.current = window.setTimeout(() => {
        cdHoldRef.current = null;
        // Torn down under us (rescued, or the round ended): stop.
        if (cdElRef.current !== el) return;
        // "Oh no..." rather than GAME OVER: the shell's own screen says that a
        // moment later, and saying it twice made the first one look like a bug.
        // Sized and shadowed to match .endFlash on that screen, so the two read
        // as one beat rather than two different treatments.
        // MATCHED TO THE GAME OVER TEXT, figure for figure, from .endFlash plus
        // its inline size override: centred, clamp(6.8rem, 24vw, 16rem), a 0.6
        // shadow and a line-height of 1. No rotation, which I had wrong before.
        //
        // The container is re-centred here too. On mobile the digits sit in the
        // top-right corner, and this word must not: it is the same beat as the
        // shell's own screen and belongs in the same place on it.
        el.textContent = "Oh no...";
        el.style.alignItems = "center";
        /* The corner set re-centres itself to say this, so the middle set has
           to go or there would be two things in the same place. */
        if (cdMidElRef.current) { cdMidElRef.current.remove(); cdMidElRef.current = null; }
        el.style.justifyContent = "center";
        el.style.padding = "0";
        el.style.textAlign = "center";
        el.style.fontSize = "clamp(6.8rem, 24vw, 16rem)";
        el.style.textShadow = "0 4px 40px rgba(0,0,0,0.6)";
        el.style.lineHeight = "1";
        // The game over screen's own wash at HALF strength, so the two read as
        // one build rather than two screens: this one comes up at 50%, then the
        // shell's fades in over it to full. Its alphas are 0.62 and 0.86 there.
        el.style.background =
          "radial-gradient(120% 120% at 50% 40%, rgba(15,65,165,0.31), rgba(8,34,100,0.43))";
        el.style.transition = "background 0.35s ease";
        cdOverRef.current = window.setTimeout(() => {
          cdOverRef.current = null;
          el.remove(); cdElRef.current = null;
          if (cdMidElRef.current) { cdMidElRef.current.remove(); cdMidElRef.current = null; }
          cdPostZeroRef.current = false;
          pitEndedRef.current = true; onPitFull?.();
        }, 1400);
      }, 1200);
    }, 1000);
    cdTickRef.current = tick;
  };
  // Kill any countdown timer if the component unmounts mid-count (e.g. the modal
  // closes): without this the "Oh no" hand-off could fire onPitFull after teardown.
  useEffect(() => () => clearCdTimers(), []);
  const shakeInnerRef = useRef<(() => void) | null>(null);
  const fellRef = useRef(false);
  const fallRafRef = useRef(0);
  // The render-side view of a badge body. J17 adds the fuse fields, which the
  // rattle in zoomTo reads: rDraw is the chip's own drawn radius, so the shake
  // is always a fraction of the chip rather than a flat pixel count.
  type BadgeBody = { x: number; y: number; vx: number; vy: number; r: number; pct: number; idx: number; a: number; held?: boolean; bomb?: boolean; blown?: boolean; bursting?: number; rDraw?: number; hits?: number; heldSince?: number; heldHits?: number; clickPending?: boolean; green?: boolean };
  const badgeBodiesRef = useRef<BadgeBody[] | null>(null);
  const badgesRef = useRef<SVGGElement>(null);
  const fxRef = useRef<SVGGElement>(null);
  // J17 stage 1: the canvas effects layer. The canvas overlays the SVG exactly
  // and is re-registered with the live view every frame, so anything drawn in
  // world coordinates stays locked to its circle through pan and zoom.
  const fxCanvasRef = useRef<HTMLCanvasElement>(null);
  // Runs before the toy timers, which do not start until a circle lands.
  useEffect(() => {
    resetToysIfAsked();
    /* THE PER MOUNT WIPE IS GONE, 2 September 2026 (owner).

       It used to clear every entry in TOY_GONE_KEY here. This component remounts
       for every level AND every retry, so that line handed back a full set of
       toys on each one. Throwing a ball clear cost you it until the end of that
       round and no longer, which is why they kept coming back.

       It also quietly killed the era scoping. toyRetiredInEra compares the stored
       era against the current one, and the stored value was deleted before the
       next level could ever read it, so that comparison could never be true.

       It was added because a tester reloading a working tab kept coming up short
       of half the props and read it as the toys being broken. ?toys=reset already
       solves that, without costing the rule its meaning.

       The cookie panel was never cleared here and still is not. It is gated on
       consent, which is localStorage and permanent. */
  }, []);
  /* PRELOAD THE DAMAGED LOGO ARTWORK. Swapping an <image> href to a file the
     browser has never fetched leaves the logo blank for a frame or two, and a
     hit is exactly the moment you are looking at it. Five small SVGs, fetched
     once when the component mounts and then served from cache.
     The main pit does the same thing for the same reason, and additionally
     force-decodes; an <img> here is enough, because these are vectors and there
     is no large bitmap to decode. */
  useEffect(() => {
    for (const src of [...LOGO_STAGE_SRC, ...LOGO_PIECES.map((d) => d.src), TOY_BONE_OHYEA_SRC]) {
      const im = new window.Image();
      im.src = src;
    }
  }, []);
  // Consent arrives as an event whichever way it was given, so the pit clears
  // its cookie objects from one place rather than from each button.
  useEffect(() => {
    const done = () => cookieClearRef.current?.();
    window.addEventListener("pc:cookies-accepted", done);
    window.addEventListener("pc:cookies-rejected", done);
    return () => {
      window.removeEventListener("pc:cookies-accepted", done);
      window.removeEventListener("pc:cookies-rejected", done);
    };
  }, []);
  // J10b stage 2: lets a tap drop the mouse constraint before liftToLearn sets
  // held, so Matter is never left pulling a body that the sim has just taken
  // out of the world.
  // The logo's drawn width, measured when the logo is built and read when the
  // pit's bone is spawned, so the two bones are one size. See LOGO_BONE_FRAC.
  const logoWpxRef = useRef(0);
  const mcReleaseRef = useRef<(() => void) | null>(null);
  /* THE CHUM GATE, 17 September 2026 (owner, option A of the swipe chain).
     The pointerId of a press that landed on a chum card, or null. While it is
     set the mouse constraint is never armed, so Matter never searches for a
     body and never fires startdrag: nothing can be grabbed and no bomb fuse can
     light for the whole of that gesture. The stage's onDown opens it and only
     the same pointer's release closes it. A component ref rather than a local in
     the physics setup, and cleared again when that setup is torn down. */
  const chumGateRef = useRef<number | null>(null);
  // The bomb currently under the pointer, so the fuse burns while it is held.
  const pressedBombRef = useRef<unknown>(null);
  // Drop-time pixels per world unit, published by the sim below. Effects are
  // authored in pit pixels, so dividing a pixel constant by this turns it into
  // world units: a blast keeps its intended size at the default view and grows
  // with the circle when you zoom in, instead of being pinned to the screen.
  const fxPxPerWorldRef = useRef<number>(0);
  // The blast effects, shared with the main pit. Created by the sim, drawn by
  // the canvas layer, which is why they meet through refs.
  const fxKitRef = useRef<ReturnType<typeof createPitEffects> | null>(null);
  // px -> world, using the sim's frozen drop-time transform. The canvas layer
  // needs it to draw in pit pixels, which is the space every routine is tuned in
  // and the space Matter bodies already live in.
  const fxFromPxRef = useRef<((px: number, py: number) => { x: number; y: number }) | null>(null);
  // Starts the effects loop. It stops itself once nothing is left to draw, so a
  // settled pit costs nothing.
  const fxKickRef = useRef<(() => void) | null>(null);
  // Drag support: badges can be picked up and flung, like
  // objects in the main pit. Circles stay click-to-zoom only. The sim exposes
  // a wake() so a drag can restart physics after everything has settled.
  const wakeRef = useRef<(() => void) | null>(null);
  /* THE PIT STOPS WHILE A CIRCLE IS LIFTED (owner, 18 September 2026).

     WHY. The lift covers the pit completely, so every frame the sim draws while it
     is open is work nobody can see. It is not free work either: AUTO on a 40 node
     dog schedules about 80 separate timers, each its own task, so React cannot
     batch them and the lift re-renders roughly 110 times over 2.4 seconds. The pit
     shares that main thread and visibly stutters through it.

     A REF, NOT THE STATE. The sim effect is bound once and holds an older closure,
     so reading learnNode there would be a frame or two stale. Every other decision
     in that loop reads a ref for the same reason.

     THE LOOP DOES NOT SLEEP ON ITS OWN DURING A ROUND. The settle-and-stop path at
     the loop's tail is gated on the round having ENDED, so `roundLive` keeps it
     running unconditionally while the pit is playable. This is therefore a new
     state rather than a reuse of that sleep, and it borrows its machinery. */
  const liftPausedRef = useRef(false);
  useEffect(() => {
    const was = liftPausedRef.current;
    liftPausedRef.current = !!learnNode;
    // Resuming restarts the loop. wake() refuses while the flag is up, so this has
    // to come after it is lowered, which it does.
    if (was && !learnNode) wakeRef.current?.();
  }, [learnNode]);
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
  // "logo" joined them on 31 August 2026. It is not a button: it is the
  // Pedigree Chums mark, sitting fixed at the top of the pit, taking the same
  // knocks and giving way on the fifth exactly as the squares do. Stage 1 is
  // the BODY only. No art swap through the six damaged stages and no dropped
  // pieces; those are stages 2 and 3, and both need the SVG equivalents of the
  // main pit's canvas work.
  type UiKind = "close" | "desc" | "learn" | "leave" | "restart" | "logo";
  // w and h are the DRAWN size in world units, and only the logo carries them:
  // every other UI object is a square and its `half` says everything. They live
  // on the body rather than being recomputed in the render, because the sim and
  // the render already size the squares by two different formulas and a third
  // copy of that mistake is not wanted.
  type UiBody = { x: number; y: number; vx: number; vy: number; r: number; half: number; a: number; va: number; fixed: boolean; hits: number; kind: UiKind; mb?: unknown; mbIn?: boolean; id?: number; spawned?: boolean; w?: number; h?: number; art?: string };
  const uiBodiesRef = useRef<UiBody[] | null>(null);
  // THE PIT-MENU PILE-UP. Every tap of the corner X during a round drops another
  // red-leave + green-restart PAIR into the pit, up to 8; they never leave, and
  // using one is how you get out. This id-keyed list replaces the pitMenu boolean
  // (removed once its readers below are rewired): each pair owns its own DOM node,
  // where the old single leave/restart refs would clobber at eight. The pile
  // clears on level change for free, since LineageModal remounts this on runKey.
  const PIT_PAIR_CAP = 8;
  const [pitPairs, setPitPairs] = useState<number[]>([]);
  const pitPairSeqRef = useRef(0);
  const pitPairsRef = useRef<number[]>([]);
  useEffect(() => { pitPairsRef.current = pitPairs; }, [pitPairs]);
  // Set inside the sim effect, where the Matter world lives, so a tap can spawn a
  // pair of bodies straight into the LIVE world (nothing else here does that yet).
  const spawnPairRef = useRef<((id: number) => void) | null>(null);
  // One container for all the spawned pair squares; the per-frame loop positions
  // each by index into its children, the badges pattern, since a single ref per
  // kind cannot hold eight leave squares.
  const pairsGRef = useRef<SVGGElement>(null);
  const uiCloseRef = useRef<SVGGElement>(null);
  const uiDescRef = useRef<SVGGElement>(null);
  const uiLearnRef = useRef<SVGGElement>(null);
  // Picks the element for a UI square. Three of them now, so the old two-way
  // ternary would have quietly handed "learn" the description square.
  const uiLeaveRef = useRef<SVGGElement>(null);
  const uiRestartRef = useRef<SVGGElement>(null);
  const uiLogoRef = useRef<SVGGElement>(null);
  const uiRefFor = (k: UiKind) =>
    k === "close" ? uiCloseRef : k === "desc" ? uiDescRef : k === "learn" ? uiLearnRef : k === "leave" ? uiLeaveRef : k === "logo" ? uiLogoRef : uiRestartRef;
  const pressRef = useRef<{ x: number; y: number; t: number } | null>(null);
  // Where and when a press on the pit background began, so a drag can be told
  // apart from a tap. Read by onBackground.
  const bgPressRef = useRef<{ x: number; y: number; t: number } | null>(null);
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
  // How much of this theme's strip is drawn, derived so its deepest point lands
  // on LEVEL_FLOOR_TARGET of the stage width, the same line for every era. From
  // floorLiftPx = bandPx*(show - profileMax) and bandPx = width/floorAspect, the
  // show that puts floorLiftPx at width*target is target*floorAspect + profileMax.
  // Clamped to 1: a band too short to reach the line would have to draw more than
  // its whole height, which is impossible, so it is drawn full and its floor sits
  // low. Not silent: it warns, so a future era that cannot reach is noticed.
  const floorShow = () => {
    if (!levelTheme) return 1;
    const raw = LEVEL_FLOOR_TARGET * levelTheme.floorAspect + Math.max(...levelTheme.floorProfile);
    if (raw > 1 && !warnedFloorEras.has(levelTheme)) {
      warnedFloorEras.add(levelTheme);
      console.warn(`[minipit] floor band too short for this era: show ${raw.toFixed(3)} clamped to 1, floor will sit below the target line`);
    }
    return Math.min(1, raw);
  };
  // How far the strip's bottom edge sits below the stage bottom, in css px. The
  // deepest point of the drawn surface lands on the target line above the stage
  // bottom, and the rest of the art hangs off the screen below it, cropped.
  const floorArtBottomPx = () => {
    const st = stageRef.current;
    if (!levelTheme || !st) return 0;
    const bandPx = st.clientWidth / levelTheme.floorAspect;
    return -bandPx * (1 - floorShow());
  };
  // the deepest point of the drawn surface, in css px above the stage bottom
  const floorLiftPx = () => {
    const st = stageRef.current;
    if (!levelTheme || !st) return 0;
    const bandPx = st.clientWidth / levelTheme.floorAspect;
    return bandPx * (floorShow() - Math.max(...levelTheme.floorProfile));
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
    // hideCircleImages: report NO image for every circle, so the single image funnel
    // (the pattern def, hasImg/tint, and the circle fill) all fall through to the
    // solid fillFor colour. Traditional diagram look, no photos at any depth.
    if (hideCircleImages) return undefined;
    /* NO PICTURES ONCE THE PIT IS LIVE, 2 September 2026 (owner). The circles
       drop and are played as plain coloured discs; the photograph is what you get
       for lifting one out onto the learn layer, where it is framed.

       `dropped` is the flag rather than `started` or `falling`: it is set in the
       same breath as the drop begins (see setDropped, "names disappear, physics
       badges appear"), so the pictures go at the moment the circles start to
       fall and not a beat before or after.

       THE START SCREEN AND THE LEARN AREA ARE UNTOUCHED. Both are read before
       the drop, so dropped is false and the photographs show as they always did.

       THE LIFTED CARD IS UNAFFECTED, and that is by construction rather than by
       luck: setLearnCard reads d.data.img DIRECTLY at both of its call sites, not
       through this function, so the card carries its picture out of a pit that is
       showing none. If that ever changes to read nodeImg, this rule would blank
       the lifted card too. */
    if (dropped) return undefined;
    return d.depth === 0 ? rootImage ?? d.data.img : d.data.img;
  }
  function fillFor(d: Node): string {
    /* IN THE LIVE PIT A CIRCLE IS FILLED WITH ITS OWN RING COLOUR,
       2 September 2026 (owner). The circles now play imageless, and the three
       colours below were only ever a backing behind a photograph, so a pit full
       of them read as pale and unrelated to the rings.

       It reads RING_PALETTE directly rather than calling strokeColorFor. Same
       colours, but calling that function from here breaks an existing memo and
       the React Compiler bails out of the component.

       IT TAKES THE BASE COLOUR, NOT THE HOVER LIFT, and that is deliberate. The
       ring lifts 10% toward white for the circle you are reading while the fill
       stays put, so the ring reappears exactly where you need to see it. Give the
       fill the lift too and every circle becomes a flat disc at all times.

       Gated on `dropped`, the same flag that hides the pictures, so the start
       screen and the learn area keep the pale backing they have always had. */
    /* SWAPPED, 2 September 2026 (owner). The pit circle wore its depth colour as
       the FILL and navy as the ring; it now wears navy as the fill and its depth
       colour as the ring, which is the ring it has everywhere else.
       strokeColorFor no longer overrides for the pit at all, so the two are back
       to one rule: depth decides the outline, and the inside is navy. */
    if (dropped && strokeByDepth && d.depth > 0) return "#0a3a57";
    return d.depth === 0 ? "#0a3a57" : d.depth === 1 ? "#1f8fd0" : "#bfe3f7";
  }
  // Thinner stroke the deeper (smaller) the circle, so the ring never
  // overpowers a tiny image several levels down: 5, 4, 3, then finer still.
  // The ring colour a circle wears in the pit. Pulled out of the render so the
  // learn layer can carry the very same colour through when a dog is lifted,
  // rather than inventing its own.
  // Lift a ring colour for the circle the player is reading: the SAME hue,
  // mixed a fixed fraction toward white. Mixing toward an achromatic point
  // keeps the hue angle exactly and only raises lightness, so the ring reads
  // as "lighter" without shifting colour or width. 0.4 was chosen so the lift
  // shows on the hard case: navy over a dark photograph.
  function liftStroke(hex: string): string {
    /* 0.4 -> 0.1, 2 September 2026 (owner). The lift is now a tenth of the way
       to white rather than four tenths.

       IT IS NEARLY INVISIBLE ON THREE OF THE FOUR, and that is measured rather
       than an opinion: depth 1 moves #fff200 -> #fff31a, depth 2 #ffdf00 ->
       #ffe21a, depth 4 #000000 -> #1a1a1a. Only depth 3's blue shows a change
       you would notice. 0.4 was chosen because a smaller lift did not read on
       the hard case, a ring over a dark photograph. Raising this one number is
       the whole fix if the hover stops reading. */
    const t = 0.1;
    const up = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16))
      .map((v) => Math.round(v + (255 - v) * t));
    return "#" + up.map((v) => v.toString(16).padStart(2, "0")).join("");
  }
  function strokeColorFor(d: Node): string {
    if (strokeByDepth) {
      /* THE RING PALETTE, replaced 2 September 2026 (owner). Was
         #ffd23e yellow / #0a3a57 navy / #5cc4ee blue-sky / #ffffff white.

         The table CYCLES: depth 5 is entry 1 again, 6 is entry 2, and so on, so
         these four have to stay legible against each other as well as against a
         photograph.

         NOTE DEPTHS 1 AND 2 ARE BOTH YELLOW, #fff200 and #ffdf00, and differ
         only in the green channel, 242 against 223. A child ring sitting inside
         its parent will read as the same colour. The old table put navy at
         depth 2 for exactly that reason. Recorded as the owner's call, not an
         oversight to be quietly corrected.

         Depth 4 was #000000 for one commit and is now #36b8ff, a lighter blue.

         NOTE DEPTHS 3 AND 4 ARE NOW BOTH BLUE, #009fe0 and #36b8ff. The same
         caution as the pair above: adjacent depths that share a hue read as one
         colour where one circle sits inside the other. Two yellows then two
         blues is the owner's scheme, recorded as chosen. */
      const base = RING_PALETTE[(d.depth - 1 + 4) % 4];
      /* THE PIT NO LONGER OVERRIDES THIS. It briefly did: while the circles were
         FILLED with their depth colour, a ring at that same colour vanished into
         its own disc, so every pit ring was forced to navy. The fill and the ring
         have since swapped (see fillFor), navy is now the inside, and the ring is
         free to be the depth colour again in the pit as it is everywhere else. */
      // The circle the player is reading keeps its DEPTH colour, so it can
      // never collide with a same-depth sibling. It is lifted in BRIGHTNESS
      // only: same hue, same width, just lighter.
      if (dockAside && d !== nodes[0] && d === shown) return liftStroke(base);
      return base;
    }
    return stroke;
  }
  function strokeWidthFor(d: Node): number {
    // A ring is a FRACTION OF ITS OWN RADIUS, not a fixed number. Two things
    // resize a circle: the view zoom, and the difficulty slider, which rescales
    // the radii directly. A flat width tracked neither, so a circle could halve
    // while its ring stayed put and the border fell out of ratio with the
    // picture. Tied to d.r it follows both, exactly as the badges do.
    // Fractions keep the old 5 / 4 / 3 / 2.6 / 2.4 relationship between depths.
    const frac = [0.09, 0.072, 0.054, 0.047, 0.043];
    // The mini pit's own table lives in LineageMap as RING_FRAC, read through
    // ringFrac, so the pit and the layer a dog is lifted onto cannot disagree.
    // It once put 0.19 at depth 2 so a nested circle did not read thin beside
    // the yellow % chip, which wears about 0.19 of its own radius. That is over:
    // the HIERARCHY RULE (a ring may never be thicker than its parent's) now
    // wins, so RING_FRAC descends from depth 1 and the clamp below enforces it
    // whatever the table says. Depth 1 stays 0.09; a nested circle now reads
    // lighter than the chip beside it, the accepted cost. ringFrac(0) is not a
    // table entry, it returns the 0.145 fallback and that is the ROOT circle's
    // own ring here, deliberately untouched. See RING_FRAC for the full note.
    let base = (dockAside ? ringFrac(d.depth) : frac[d.depth - 1] ?? 0.043);
    // The ring still grows and shrinks with the circle, which is the part that
    // works. This only shaves the top of the slider, where the circles are so
    // large that the same fraction reads as a much heavier line.
    if (dockAside && level > 5) base *= 1 - ((Math.min(level, 10) - 5) / 5) * DIFF_STROKE_TRIM;
    // The mini pit draws its rings four times heavier than the chum page, so a
    // small, simple lineage reads boldly.
    // The chum page is a quarter of the weight; the mini pit table above is
    // already absolute, so it is used as it stands.
    const width = d.r * (dockAside ? base : base / 4);
    // HIERARCHY CLAMP: a ring is never thicker than the ring of the circle it
    // sits inside. Recursive, so the cap holds all the way up the tree, reading
    // the parent's own already-clamped width. The root (d.parent null) has
    // nothing outside it and keeps its own width. A guard, not a reshaper: here
    // the pack nests every child inside its parent, so a child radius is always
    // smaller and with the descending table the clamp never bites in the pit; it
    // exists so no future table edit can put a child ring above its parent's.
    return d.parent ? Math.min(width, strokeWidthFor(d.parent)) : width;
  }

  // A zoom multiplies every world unit by k, rings included, so flying into a
  // circle scales its ring on screen in step with the circle: the ring stays the
  // same FRACTION of its own radius at every zoom. The mini pit once pinned its
  // rings to the k of the FULL-PIT view instead, holding them at a constant pixel
  // width across zoom. That was asked for at the time, but it is now reversed by
  // decision: a deep zoom made the ring read thin against its circle. The mini
  // pit now scales like the chum page and everything else.
  function strokeK(v: View): number {
    return SIZE / v[2];
  }

  // Rings on NESTED circles are drawn inside their own radius rather than
  // straddling it. SVG has no stroke alignment, so the only way to inset one is
  // to shrink the drawn radius by half the ring.
  //
  // Measured by running the real pack for the Celtic Heeler level, not guessed:
  // a depth-2 circle's rim sits 7.31 units inside its parent's rim, while its
  // centred ring hung 7.83 units past that rim. So it painted over 8.4 of the
  // parent's 15.8 unit ring, a little over half of it, which is why the yellow
  // measured 9px beside a nested circle and 19px everywhere else. Inset, the
  // ring stops 7.31 short of the parent and the overlap falls to 0.6 units.
  //
  // Opening up pack().padding() was the other half of the plan and turned out
  // to be unnecessary: it would have had to roughly double to 17 to clear a
  // centred ring, which would have pushed the nested circles a long way apart.
  // Depth 1 keeps its centred ring. It is the outer silhouette, nothing sits
  // outside it to be spoiled, and leaving it alone keeps the level's shape
  // exactly as signed off.
  function ringInset(d: Node, v: View): number {
    // Mini pit only. The chum breed pages share this component and were never
    // meant to change: their rings are a quarter weight, so insetting shrank a
    // depth-2 circle by 0.9% of its radius and deeper ones by less. Invisible,
    // but unasked for, and it moved a surface that was already signed off.
    return dockAside && d.depth >= 2 ? (strokeWidthFor(d) * strokeK(v)) / 2 : 0;
  }
  function drawR(d: Node, v: View, k: number): number {
    return Math.max(0.5, d.r * k - ringInset(d, v));
  }

  // `now` is the sim's frame time, passed in rather than read here: calling
  // performance.now() inside this function is flagged as impure render work.
  // Zero means no animation this call, which is right for every caller that is
  // not the physics loop.
  function zoomTo(v: View, now = 0) {
    const k = SIZE / v[2];
    viewRef.current = v;
    // The pit words, straight off their bodies. Same shape as the chip loop
    // below: translate to the body, rotate to its angle, and nothing else can
    // reach them.
    {
      const wg = wordsGRef.current;
      const wb = wordBodiesRef.current;
      if (wg && wb.length) {
        for (let i2 = 0; i2 < wb.length; i2++) {
          const el = wg.children[i2] as SVGGElement | undefined;
          if (!el) continue;
          const b = wb[i2];
          // A word follows its dog out of the pit. Lifting sets held, and
          // collecting adds the node to removedNodes and leaves held set, so the
          // two together cover both: hidden while it is up on the layer above,
          // and gone for good once it has been learnt. Without this a collected
          // name stayed lying in the pit with no body under it. Read off the
          // body rather than off React state, because the physics loop holds an
          // older closure and would see a stale learnNode.
          const wn = b.n;
          const wGone = b.held || (!!wn && removedNodesRef.current.has(wn));
          el.setAttribute("display", wGone ? "none" : "inline");
          if (wGone) continue;
          // The pop. `now` is zero on every caller that is not the physics
          // loop, and a zero there would freeze the words at nothing, so no
          // clock means full size.
          let sc = 1;
          if (now && wordPopAtRef.current) {
            const t = (now - wordPopAtRef.current) / WORD_POP_MS;
            if (t < 1) sc = t < 0.6 ? (t / 0.6) * 1.15 : 1.15 - 0.15 * ((t - 0.6) / 0.4);
          }
          el.setAttribute(
            "transform",
            `translate(${(b.x - v[0]) * k},${(b.y - v[1]) * k}) rotate(${b.a * 57.2958 + PIT_WORD_ANGLE})${sc !== 1 ? ` scale(${sc})` : ""}`
          );
        }
      }
    }
    const cg = circlesRef.current;
    const bb = badgeBodiesRef.current;
    if (bb) {
      const bg = badgesRef.current;
      for (const b of bb) {
        const el = bg?.children[b.idx] as SVGGElement | undefined;
        if (!el) continue;
        let rot = b.a * 57.2958, ox = 0;
        // A lit bomb rattles harder the longer it is held, furious by the last
        // half second. Straight from the main pit, with the two fives halved.
        // The shake offset is a fraction of the chip's OWN drawn radius, never a
        // flat pixel count, or a small chip would judder further than a big one.
        let sc = 1;
        // Anticipation: before it goes, the bomb squashes a touch then snaps
        // about 20% bigger, so it reads as a burst rather than blinking out.
        if (b.bursting && now) {
          const bt = (now - b.bursting) / BOMB_BURST_MS;
          sc = bt < 0.35 ? 1 - 0.1 * (bt / 0.35) : 0.9 + 0.3 * Math.min(1, (bt - 0.35) / 0.65);
        }
        if (b.bomb && !b.blown && !b.bursting && now) {
          const now2 = now;
          const hh = b.hits || 0;
          const heldF = b.heldSince ? Math.min(1, (now2 - b.heldSince) / BOMB_FUSE_MS) : 0;
          const inten = Math.max(hh, heldF * BOMB_HITS * 2);
          if (inten > 0) {
            const amp = 0.06 * inten, sp = Math.max(6, 28 - inten * 5);
            rot += Math.sin(now2 / sp) * amp * 57.2958;
            ox = Math.sin(now2 / (sp * 0.6)) * inten * 0.045 * (b.rDraw ?? 0);
          }
        }
        el.setAttribute("transform", `translate(${(b.x - v[0]) * k + ox},${(b.y - v[1]) * k}) rotate(${rot})${sc !== 1 ? ` scale(${sc})` : ""}`);
      }
    }
    const ub = uiBodiesRef.current;
    if (ub) {
      // The corner three keep their single refs; the spawned pairs are addressed
      // by INDEX into pairsGRef (the badges pattern), in the order the render lays
      // them out: each tap pushes leave then restart, and the render flatMaps
      // pitPairs to [leave, restart], so this counter and the children line up.
      const pg = pairsGRef.current;
      let pairIdx = 0;
      for (const u of ub) {
        const el = u.spawned ? (pg?.children[pairIdx++] as SVGGElement | undefined) : uiRefFor(u.kind).current;
        if (el) el.setAttribute("transform", `translate(${(u.x - v[0]) * k},${(u.y - v[1]) * k}) rotate(${u.a * 57.2958})`);
        /* THE LOGO'S DAMAGE STAGE. A hit does not set React state, so the
           render cannot know about it: the art is swapped here instead, in the
           same loop that already moves the thing. Written only when the count
           has actually changed, because re-setting an href every frame makes
           the browser reload the file and the logo flickers. */
        if (el && u.kind === "logo") {
          const want = logoArtFor(u.hits);
          if (u.art !== want) {
            const im = el.querySelector("[data-logo-art]") as SVGImageElement | null;
            if (im) { im.setAttribute("href", want); u.art = want; }
          }
        }
      }
    }
    for (const [listRef, gRef] of [[rodBodiesRef, rodsGRef], [pillBodiesRef, pillsGRef], [toyBodiesRef, toysGRef], [chumBodiesRef, chumsGRef], [btnBodiesRef, btnsGRef], [logoPieceBodiesRef, logoPiecesGRef]] as const) {
      const list = (listRef as typeof rodBodiesRef).current;
      const gg = (gRef as typeof rodsGRef).current;
      // A collected chum card is flying to the corner under its own animation.
      // Its transform belongs to that flight until it lands, so this writer
      // steps over it rather than snapping it back to its frozen body.
      const flying = gRef === chumsGRef ? chumFlyRef.current : null;
      if (list && gg) for (const pr of list) {
        if (flying && flying.has(pr.idx)) continue;
        const el = gg.children[pr.idx] as SVGGElement | undefined;
        if (el) el.setAttribute("transform", `translate(${(pr.x - v[0]) * k},${(pr.y - v[1]) * k}) rotate(${pr.a * 57.2958})`);
        // A logo piece is rendered hidden so it cannot be seen at the origin
        // for the frame before this loop first places it. This is that reveal.
        if (el && gRef === logoPiecesGRef && el.style.visibility) el.style.visibility = "";
        // The chum outline is a STATE, driven here off the physics flag rather
        // than a per-frame React render. Priority, highest first: taken (green),
        // armed (yellow), resting on the floor (red), else white. The grace
        // clears a lifted card only after CHUM_FLOOR_GRACE_MS with no contact.
        if (el && gRef === chumsGRef) {
          if (pr.floorLostAt && now - pr.floorLostAt > CHUM_FLOOR_GRACE_MS) { pr.onFloor = false; pr.floorLostAt = 0; }
          const edge = el.querySelector("[data-chum-edge]") as SVGRectElement | null;
          if (edge) edge.style.stroke =
            takenChumRef.current === pr.idx ? "#22c55e"
            : armedChumRef.current === pr.idx ? "var(--yellow, #ffd23e)"
            : pr.onFloor ? "#ef4444" : "#ffffff";
        }
      }
    }
    /* HOW MANY OF EACH BREED ARE IN THE PIT, counted ONCE for the whole frame.
       The obvious way to ask "has this circle a twin" is dogHasTwin, which walks
       the pit per circle; done for every node every frame that is O(n squared),
       so the frame builds one map instead and each node reads it in O(1).

       IT IS THE SAME QUESTION dogHasTwin ASKS, and deliberately the same rule:
       in the pit, not removed, and neither the hidden root nor an echo, since
       neither is a duplicate of anything. A depth-1 dog is counted even though the
       pit draws it as a word, because the chain counts it too and the two must not
       disagree about whether a breed has a twin.

       LIVE, AND THAT IS THE POINT: see the note on dogHasTwin. A breed drops to
       one the moment its last duplicate is collected, and the survivor changes
       colour. */
    const pitBreedCount = new Map<string, number>();
    if (fellRef.current) {
      const ownedB = pitBodiesRef.current?.owned;
      if (ownedB) for (const o of ownedB) {
        if (!pitCountable(o, removedNodesRef.current)) continue; // the one filter: see liveBreedNodesIn
        pitBreedCount.set(o.data.name, (pitBreedCount.get(o.data.name) ?? 0) + 1);
      }
    }
    nodes.forEach((d, i) => {
      const tx = (d.x - v[0]) * k;
      const ty = (d.y - v[1]) * k;
      // one <g> per node: [0] is the circle, [1] is its label
      const wrap = cg?.children[i] as SVGGElement | undefined;
      // In the pit a dog is its NAME. The circle stands down and the label
      // takes the body's place, its angle and the 30% size, spinning about its
      // own middle rather than orbiting its anchor.
      // Once the pit is live a level dog IS its name, drawn in its own group
      // below, so the circle stands down. Keyed off depth alone: no lookup, no
      // way for it to half-apply.
      const isWordNode = fellRef.current && d.depth === 1;
      const c = wrap?.children[0] as SVGCircleElement | undefined;
      /* A CIRCLE IN THE CHAIN IS INVERTED:
         light blue where it was navy, and navy where its outline was. It wore a
         white outline for a day and there was almost nothing to read against the
         light blue fill. Its own depth colour comes back the moment the chain
         ends, because this only ever sets an inline stroke and fill and then
         clears them again. Written on the change alone, tracked on the element,
         so a still pit costs nothing. The question mark does the same below. */
      /* THREE STATES, THE SAME THREE THE MARK HAS. Held in the chain, of the
         chain's breed but not yet held, or neither. Hoisted out of the block
         below because the stroke WIDTH needs them too, and that is written on
         its own line further down. */
      /* MAY THIS CIRCLE BE PAINTED AT ALL (owner, 18 September 2026).

         THE FAULT IT FIXES. Every inline fill below was written without asking
         whether the circle was visible, and an inline STYLE beats a presentation
         ATTRIBUTE. A circle the render hides with fill="none" was therefore made
         visible by being painted: on Ancient Mastiff the echo children of the
         depth-1 words Ancient Molossers and Alaunt war dogs turned into pale blue
         discs nested against their own parents. An echo is skipped by
         pitBreedCount but was NOT skipped here, so it read the count for its
         PARENT'S name, found one, and painted itself as a single circle.

         THE THREE WAYS A CIRCLE HIDES, all covered here and each for its own
         reason:
           display none  a depth-1 word node, which the pit draws as its NAME.
                         Taken from isWordNode rather than from the attribute,
                         because the attribute is written further down this same
                         function and would still hold LAST frame's answer here.
                         isWordNode is what that line writes, so this is the same
                         authority, one step earlier.
           fill none     the render's `hidden` state: the root at depth 0 and
                         every echo. Read off the element, because React owns it
                         and an inline style never changes it, so the test stays
                         true however often the circle is painted.
           opacity 0     a collected or lifted dog. Also React's, also read off
                         the element.

         IT GATES ALL THREE STATES, not just the one that caused the fault. A
         circle that may not be painted is not held, not a twin and not single, so
         it takes no fill, no ink, no doubled twin ring and no held rim. Gating
         only chSingle would have left the same bug reachable through a chain.

         AND IT CLEARS RATHER THAN SKIPS. Forcing the three states false makes the
         dataset key fall to "0", which is the branch that writes the empty string
         back, so a circle painted in error before this landed loses that colour
         on the next frame instead of keeping it for the round.

         showQ BELOW READS THE SAME FLAG, so the mark and the fill can never
         disagree about whether a circle is there to be decorated. It was already
         testing these three; this is that test, hoisted and shared. */
      const paintable =
        !isWordNode &&
        c?.getAttribute("fill") !== "none" &&
        c?.style.opacity !== "0";
      const chHeld = paintable && dogChainNodesRef.current.has(d);
      const chTwin = paintable && !chHeld && !!dogChainBreedRef.current && d.data.name === dogChainBreedRef.current;
      /* THE FOURTH STATE, and the only one that is true at rest: a circle whose
         breed has no other copy in the pit. See DOG_SINGLE_FILL. It ranks BELOW
         the two chain states, because while a chain lives what a circle is doing
         in that chain is the more urgent thing to say, and a single circle can
         never be in one anyway: a chain needs a twin. */
      const chSingle = paintable && !chHeld && !chTwin && fellRef.current && (pitBreedCount.get(d.data.name) ?? 0) === 1;
      if (c) {
        /* The mark has read all three states since the chain shipped; the ring
           only read the first, so a highlighted twin kept its own outline. Both
           states are now filled and inked: a held circle from DOG_CHAIN_FILL and
           DOG_CHAIN_COLOUR, an available twin from its own RARITY_BAND entry.
           One key, still written only when the answer CHANGES and still tracked
           on the element, so a still pit costs nothing. */
        /* THE TIER RIDES IN THE KEY, so a twin whose rarity somehow differed from
           the last one written would be re-inked. It cannot today, since every
           twin in a chain is the same breed and the tier is a function of the
           name, but the key is what guarantees the element and the state agree
           and it costs one string to keep that true. Looked up only for a twin,
           which is a handful of circles while a chain lives and none otherwise. */
        const band = chTwin ? RARITY_BAND[rarityTier(treesContaining(d.data.name))] : null;
        const want = chHeld ? "held" : band ? `twin:${band.bg}` : chSingle ? "single" : "0";
        if (c.dataset.chained !== want) {
          c.dataset.chained = want;
          // The fade belongs to the fill and the ring, not to anything else, and
          // it is set here so it exists for the first write as well as the rest.
          c.style.transition = `fill ${DOG_FILL_FADE_MS}ms ease, stroke ${DOG_FILL_FADE_MS}ms ease`;
          // A held circle's rim IS the chain's line, one stroke of the same lemon.
          // It was navy (DOG_CHAIN_INK) under a second lemon ring; both are gone.
          c.style.stroke = chHeld ? DOG_CHAIN_COLOUR : band ? band.fg : chSingle ? DOG_SINGLE_INK : "";
          /* AND BOTH STATES ARE FILLED NOW. A held circle goes sky blue, and an
             available twin goes YELLOW, so the two things the chain has to say,
             "this one is in" and "this one is where you can go next", are both
             said by the fill rather than one of them by a ring alone.
             Safe to set: a circle in the live pit shows no photograph, because
             the pictures go the moment the drop begins (see nodeImg), so every
             pit circle is a plain disc of fillFor's navy and there is no image
             here to cover. Both are cleared the same way the stroke is, by
             writing the empty string, so a circle's own colour returns with the
             chain's end and nothing has to remember what it used to be. */
          c.style.fill = chHeld ? DOG_CHAIN_FILL : band ? band.bg : chSingle ? DOG_SINGLE_FILL : "";
          /* THE LABEL INVERTS WITH THE DISC. White reads 11.96 on the dark fill
             and 1.98 on the light one, so it cannot stay put: on a light circle it
             takes the same navy the ring does, 6.03. The empty string returns it
             to whatever the render set, which is white, or the yellow of a hover.
             lbl is children[1] of the same wrapper; the mark is children[2] and is
             handled by its own filter below. */
          const lbl = wrap?.children[1] as SVGTextElement | undefined;
          if (lbl) lbl.style.fill = chSingle ? DOG_SINGLE_INK : "";
        }
      }
      if (c) {
        c.setAttribute("display", isWordNode ? "none" : "inline");
        c.setAttribute("transform", `translate(${tx},${ty})`);
        c.setAttribute("r", String(drawR(d, v, k)));
        // The radius is scaled by the view but the stroke was not, so a circle
        // drawn small kept a full-size ring and read as heavy. Scale both.
        /* AN AVAILABLE TWIN WEARS DOG_CHAIN_TWIN_STROKE_K TIMES ITS OWN WEIGHT.
           Written HERE, on the line that already runs every frame, rather than as
           an inline style on the change alone like the colours: the base width
           carries strokeK, which moves with the view, so an inline value set once
           would go stale the moment the pit zoomed and, being a style, would beat
           this attribute and freeze the ring. Multiplying here costs nothing and
           tracks the zoom, the difficulty slider and the hierarchy clamp on its
           own, and it returns to the normal weight on the first frame after the
           chain ends because chTwin is false by then. */
        c.setAttribute("stroke-width", String(strokeWidthFor(d) * strokeK(v) * (chTwin ? DOG_CHAIN_TWIN_STROKE_K : chHeld ? HELD_RIM_K : 1)));
        /* THE FOURTH CHILD HAS GONE with the casing. It was the lemon ring drawn
           inside a widened navy rim; the rim is one lemon stroke now, written on
           the circle itself two lines above, so there is nothing to draw on top of
           and children[3] no longer exists. [0], [1] and [2] are unmoved. */
      }
      /* THE QUESTION MARK follows its circle. Shown only once the pit is live and
         only where a circle is actually drawn, so a depth-1 dog, which the pit
         draws as its NAME rather than as a circle, never gets one.

         fellRef, not the `dropped` React state: this writer runs inside the
         physics loop, which holds an older closure, so state read here can be a
         frame or two stale. Every other decision in this function reads the ref
         for the same reason.

         Sized at 0.9 of the circle's RADIUS across, which is 45% of the disc, and
         centred on the artboard's own 360,360 rather than on 0,0. The scale is
         recomputed each frame from drawR, so the mark tracks the view zoom and
         the difficulty slider exactly as the circle does. */
      const q = wrap?.children[2] as SVGGElement | undefined;
      if (q) {
        /* IT NEVER SHOWED, and this is why. The group is rendered with an inline
           STYLE of display none, and this line set the display ATTRIBUTE. CSS
           beats presentation attributes, so the attribute was overridden on every
           frame and the mark stayed hidden from the moment it shipped. Writing
           q.style.display is the fix: same property, same cascade level.

           It also hides with a LIFTED OR COLLECTED dog. That circle is taken out
           of view with opacity 0 rather than display none (see heldHidden on the
           circle), so checking display alone left the mark floating over an empty
           space where the dog used to be. */
        /* TWO MORE CIRCLES THAT MUST NOT CARRY ONE, both found on the first
           build where the mark actually appeared:

           THE ROOT, depth 0. It is the level's own dog, it is not a thing you
           lift, and in the pit it has no visible disc, so its mark hung in the
           middle of an empty screen.

           ANY CIRCLE DRAWN fill="none". That is the `hidden` state in the render,
           used for a circle that is present in the tree but not meant to be seen.
           Same symptom, a mark floating over nothing.

           Both are read off the circle rather than recomputed here, so this
           cannot drift from what the render decided. */
        // The three visibility tests this used to spell out are now `paintable`
        // above, shared with the fill writer so the two cannot drift. The depth
        // test stays here: the root is caught by fill="none" anyway, but the mark
        // has its own reason to say so, and it is cheap.
        const showQ = fellRef.current && d.depth > 0 && paintable;
        q.style.display = showQ ? "inline" : "none";
        if (showQ) {
          /* 0.9 -> 1.4 of the RADIUS, so the box is 70% of the disc across.
             The old artwork was a tall narrow question mark and filled its square
             box; the dog face is 813.7 x 463.5, so `meet` fits it by WIDTH and it
             would have read tiny at the old figure. One number if it wants
             changing. */
          const sc = (drawR(d, v, k) * 1.4) / QMARK_VB;
          q.setAttribute("transform", `translate(${tx},${ty}) scale(${sc}) translate(${-QMARK_VB / 2},${-QMARK_VB / 2})`);
        }
        /* THE MARK IS THE HIGHLIGHT. While a
           dog chain is being drawn, every circle holding its breed turns its
           question mark white, so the player can see where to drag next. The
           dog's photograph is never touched.
           Written only when the answer CHANGES, tracked on the element itself,
           so this costs nothing on the frames where nothing is happening. */
        const qi = q.firstElementChild;
        if (qi) {
          const want = dogChainBreedRef.current && d.data.name === dogChainBreedRef.current ? "1" : "0";
          /* THREE STATES, ONE ATTRIBUTE. A circle HELD in the chain draws its
             mark in navy, to read against the light blue it is now filled with.
             An available twin takes the ink its RARITY_BAND entry names, which is
             white on the purple and the royal blue and black on the green, the
             orange and the yellow: the mark follows the fill rather than being
             chosen again here, so the two can never disagree. Everything else
             wears its own depth colour. */
          const held = dogChainNodesRef.current.has(d);
          const twinBand = !held && want === "1" ? RARITY_BAND[rarityTier(treesContaining(d.data.name))] : null;
          /* AND THE MARK INVERTS WITH THE DISC TOO. bt-qmark-ink IS navy as a
             colour matrix, which is exactly DOG_SINGLE_INK, so a single circle
             takes the same filter a held one does: both sit on a light fill and
             both need the dark mark. The four depth filters are for the dark
             fill only, where they measure 10.23, 9.00, 4.85 and 5.39; on the
             light fill they would have been 1.70, 1.49, 1.50 and 1.12. */
          /* chSingle TAKES "hi", THE WHITE FILTER, not "ink". "ink" is the navy
             one and it was right only while a single circle was filled light; on
             #0b1220 navy measures 1.57 and the face would vanish. A HELD circle
             keeps "ink", because its fill is still the sky blue DOG_CHAIN_FILL.
             The two used to share a branch and no longer can. */
          const ink = held ? "ink" : chSingle ? "hi" : twinBand ? (twinBand.fg === "#ffffff" ? "hi" : "black") : `${(d.depth - 1 + 4) % 4}`;
          if (q.dataset.hi !== ink) {
            q.dataset.hi = ink;
            qi.setAttribute("filter", `url(#bt-qmark-${ink})`);
          }
          /* THE TAPPED FACE, FOR BOTH CHAIN STATES (owner, 18 September 2026).
             It was the held circle's alone, saying "this one is in" against the
             ordinary mark's "this one could join". Now every circle the chain
             touches wears it, held or merely available, so the whole breed reads
             as awake for as long as the chain lives and goes back to the ordinary
             mark the moment it ends.

             SO THE MARK NO LONGER TELLS HELD FROM AVAILABLE, and three things
             still do, which was checked before this shipped rather than assumed:
               THE FILL. Held is sky blue #5cc4ee; available is the tier colour.
               Measured against the sky: purple 5.00, royal blue 3.81, green 1.14,
               orange 1.44, yellow 1.37. The two blues separate on LUMINANCE, the
               royal being plainly darker, and the other three on HUE, since green,
               orange and yellow are nothing like a light blue whatever the
               luminance says. Every tier is told apart by one or the other.
               THE RING. An available twin wears DOG_CHAIN_TWIN_STROKE_K, twice
               its own weight; a held circle wears its normal weight.
               THE INK. Held is navy; available takes its band's fg, which is
               white on the purple and the royal blue and black on the rest.
             Three signals against one lost, and the weakest fill pair still has a
             double-weight ring and a different coloured mark on it. Enough. */
          const tap = held || twinBand ? "1" : "0";
          if (q.dataset.tapped !== tap) {
            q.dataset.tapped = tap;
            qi.setAttribute("href", tap === "1" ? QMARK_TAPPED_SRC : QMARK_SRC);
          }
        }
      }
      const l = wrap?.children[1] as SVGGElement | undefined;
      if (l) {
        if (d === focusRef.current) {
          // The focused circle's own label sits at its centre.
          l.setAttribute("transform", "translate(0,0)");
        } else {
          const childR = d.r * k;
          {
            // Circles touch and vary in size, so the label sits centred on its
            // circle and scales with it: small circle, small label.
            //
            // DESKTOP USES THIS TOO now. It used to have its own branch that put
            // the label ABOVE or BELOW the circle, `ty - childR - 70`, clamped
            // into the canvas. That is why desktop names sat outside their
            // circles and ran across the top of the stage.
            //
            // Worth recording, because it was attacked twice from the wrong end:
            // two earlier commits raised the fitter's font cap from 44 to 132 and
            // both were reverted. The cap was never the cause. The fitter picks
            // four lines that fit inside the circle on desktop already; the
            // label was simply being positioned somewhere else afterwards.
            const ls = Math.max(0.4, Math.min(1.25, childR / 250));
            l.setAttribute("transform", `translate(${tx},${ty}) scale(${ls})`);
            /* A label should stay the same fraction of its circle at every zoom.
               Drawn size is fs * ls, and it wants to track d.r * k, so when k or
               ls move away from what the fit assumed, the difference is a plain
               multiply: no refitting, no re-render, and it holds every frame of
               the flight rather than snapping at the end. */
            const t = l.firstElementChild as SVGTextElement | null;
            const f0 = t ? Number(t.dataset.fs) : NaN;
            const k0 = t ? Number(t.dataset.kfit) : NaN;
            const l0 = t ? Number(t.dataset.lsfit) : NaN;
            if (t && f0 > 0 && k0 > 0 && l0 > 0) {
              t.style.fontSize = `${f0 * ((k * l0) / (k0 * ls))}px`;
            }
          }
        }
      }
    });
    /*        THE GLOW BELONGS TO A LIVE CHAIN AND TO NOTHING ELSE (owner,
       18 September 2026). It is a RESPONSE TO A PRESS, not a standing hint.

       THE RESTING GLOW IS GONE. For a day every circle of a breed with a
       duplicate anywhere in the pit wore a white ring from the moment the pit
       dropped, saying "a chain could start here". On a duplicate-heavy level
       that was nearly every circle, which is no information at all, and it was
       shipped knowing so on the understanding it would be looked at on the
       device. It has been. At rest NOTHING glows.

       SO THE TWO-STATE VERSION COLLAPSES TO ONE, and this is why the code below
       is so much shorter than it was. Three things went with the resting state
       rather than being left behind as dead branches:
         - the per-ring COLOUR. There was white at rest and yellow in a chain;
           there is only the chain's own DOG_CHAIN_COLOUR now, so the stroke goes
           back to being set once when the ring is made.
         - "EVERY OTHER BREED GOES DARK". Confirmed irrelevant, exactly as the
           owner said: nothing is lit to begin with, so there is nothing to
           darken. What was a rule about other breeds is now simply a test for
           the chain's own.
         - the BY-BREED GROUPING and its "a breed needs two to start a chain"
           guard. Both existed to answer "which breeds could start a chain",
           which is no longer a question anything asks. One pass, one name test.

       HELD CIRCLES GLOW TOO, AND ALWAYS DID. A circle joined into the chain is
       still in the pit and still of the chain's breed, so it was never excluded
       and nothing here had to change to light it. Its sky blue fill and navy ink
       are untouched, and it wears the same single yellow ring every other circle
       of the breed wears, so nothing is stacked.

       ONE RING PER CIRCLE. The highlight is not a layer over something else, it
       is the only ring there is.

       IT IS THE CHAIN'S GLOW, NOT A SECOND ONE: the same bt-chain-glow filter
       the path's own glow group uses. A blurred copy of the ring is drawn on a
       layer BEHIND the circles, exactly as the path draws a blurred copy of its
       line under the crisp one, so the picture inside the circle is untouched.

       RE-ASKED EVERY FRAME, because circles pop and are collected while a chain
       is being drawn. One pass over the pit's own circles, and only while a
       chain lives: with no chain there is no pass at all. */
    /* ---- THE DOG CIRCLE COUNTER ------------------------------------------
       Counted here because this writer already runs once a frame with the pit's
       own refs in hand, and refs are what the removal routes write: nothing
       re-renders when a circle leaves, so a React-side count could not see it.

       WHAT IS COUNTED. Every node that has had a body this round, minus the ones
       the pit is no longer drawing. A node is NOT drawn if it has been removed,
       by any route at all since every route ends in removedNodes, or if its body
       is HELD, which takes it out of the world and hides the circle: that is the
       one lifted to the learn layer, and it comes back if the player backs out.
       The root and the echoes are not circles the player clears, so neither is
       counted on either side.

       IT DOES NOT READ THE ROUND-WON TEST'S ANSWER, on purpose. See the note on
       the onCircleCount prop: a full counter over a running round is the whole
       diagnostic.

       THE find() IS ONLY ASKED ABOUT CIRCLES STILL IN PLAY, which shrinks as the
       round goes on, and the whole block is skipped until the pit is live. */
    if (fellRef.current) {
      const ownedC = pitBodiesRef.current?.owned;
      if (ownedC) {
        /* COMPLETED ONLY, 18 September 2026 (owner). It used to count a circle as
           gone the moment its body left the pit, which included `held`, so the
           number dropped the instant you picked a dog up and came back if you
           backed out of the learn layer. It holds now until the dog is actually
           finished.

           removedNodes IS EXACTLY THAT SET. Its two call sites are both in the
           learn layer's onRemove: the circle the player completed, and each
           circle a dog chain closes behind it. Nothing else adds to it, so
           counting it is counting completions.

           AND IT IS THE ONLY WAY OUT TODAY. A bomb never destroys a circle, the
           escape net teleports rather than removes, and backing out clears `held`
           and puts the circle back. So a circle leaving by some other route still
           coming off the count is a CONTRACT rather than code: any future route
           that takes a circle out of play must add it to removedNodes, which is
           the same contract the round-won test already depends on. If one is
           added that does not, the counter and the win test break together rather
           than drifting apart, which is the safer failure.

           IT ALSO DROPS THE find() PER CIRCLE, which was the only per-frame cost
           in this block and was O(n) inside an O(n) loop. */
        let tot = 0, done = 0;
        for (const o of ownedC) {
          if (o.depth === 0 || isHiddenCopy(o)) continue;
          tot++;
          if (removedNodesRef.current.has(o)) done++;
        }
        const left = tot - done;
        const prev = circleCountRef.current;
        if (prev.left !== left || prev.tot !== tot) {
          circleCountRef.current = { left, tot };
          onCircleCount?.(left, tot);
        }
      }
      /* IS THE PIT BUSY WITH A GESTURE. Recomputed here, every frame, from the
         live refs rather than toggled by any of the routes that start or end a
         chain: see onPitBusy for why that matters. Reported only on a change, so
         a still pit costs one comparison. */
      const busy = !!dogChainBreedRef.current || learnOpenRef.current;
      if (pitBusyRef.current !== busy) {
        pitBusyRef.current = busy;
        onPitBusy?.(busy);
      }
    }
    const tg = twinGlowGRef.current;
    if (tg) {
      // The breed of the chain being drawn, or null. With no chain there is
      // nothing to light, so the pit is not even walked.
      const glowBreed = dogChainBreedRef.current;
      const owned = glowBreed ? pitBodiesRef.current?.owned : null;
      const rings: { x: number; y: number; r: number; w: number }[] = [];
      if (owned) {
        for (const o of owned) {
          if (o.data.name !== glowBreed) continue;
          if (o.depth === 0 || isHiddenCopy(o) || removedNodesRef.current.has(o)) continue;
          /* A WORD CIRCLE HAS NO DISC TO GLOW BEHIND (owner, 18 September 2026,
             seen on "Celtic Hound" and "Old hunting dogs of the Celts").

             WHAT IT LOOKED LIKE. A bare white ring round the name, rather than
             the halo the glow is. The glow is a blurred copy of the circle's own
             ring, drawn on a layer BEHIND the circles, so on an ordinary dog the
             disc covers everything inside the rim and only the outside shows. A
             depth-1 dog in a live pit IS its name: the frame writer sets its
             circle to display none and draws a word in its place, see isWordNode
             just above. Nothing was covering the ring, so all of it showed.

             It is the SAME test, written the same way, so the two cannot drift:
             a circle the pit does not draw does not glow. */
          if (fellRef.current && o.depth === 1) continue;
          rings.push({ x: (o.x - v[0]) * k, y: (o.y - v[1]) * k, r: drawR(o, v, k), w: strokeWidthFor(o) * strokeK(v) });
        }
      }
      while (tg.children.length > rings.length) tg.lastChild?.remove();
      while (tg.children.length < rings.length) {
        const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        el.style.fill = "none";
        // One colour now, the chain's own, so it is set once here rather than
        // written every frame as it was when the ring had a resting state.
        el.style.stroke = DOG_CHAIN_COLOUR;
        tg.appendChild(el);
      }
      rings.forEach((rg, ri) => {
        const el = tg.children[ri] as SVGCircleElement;
        el.setAttribute("cx", String(rg.x));
        el.setAttribute("cy", String(rg.y));
        el.setAttribute("r", String(rg.r));
        el.style.strokeWidth = String(Math.max(1, rg.w * 2.2));
      });
    }
  }

  function zoom(d: Node) {
    // the pit stays live through a zoom: physics keeps running underneath
    // while the view flies in, and everything returns as the view pulls back.
    // Nothing auto-drops any more: exploring before the drop simply hides the
    // START button, and it comes back when the view returns to the full pit.
    focusRef.current = d;
    setFocus(d);
    /* Zooming always brings the rail back. Its X used to be a one-way door for
       the rest of the session, and going into a circle is exactly the moment
       you want to see which pack dogs come out of it. The cards mount fresh, so
       they play their own relPop and it arrives with a pop rather than a fade. */
    setRailHidden(false);
    onActiveChange?.(d !== nodes[0]);
    let target: View = displayOnly && d === nodes[0] ? displayRestView() : [d.x, d.y, dockAside && d !== nodes[0] ? d.r * 2 * (isMobileRef.current ? PAD : ZOOM_PAD) : d.r * 2 * (isMobileRef.current ? PAD : ZOOM_PAD) * (dockAside && d === nodes[0] ? PIT_SPAN : 1)];
    if (d === nodes[0]) target = clampRootView(target);
    if (d === nodes[0]) homeWRef.current = target[2];
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    cancelAnimationFrame(rafRef.current);
    if (reduce) {
      zoomTo(target);
      // Same refit as the animated path below, for the same reason.
      setFlighting(false);
      setViewTick((n) => n + 1);
      return;
    }
    const interp = interpolateZoom(viewRef.current, target);
    const dur = 720;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      zoomTo(interp(t) as View);
      if (t < 1) { rafRef.current = requestAnimationFrame(step); return; }
      // REFIT THE LABELS. Their size is worked out during render from
      // viewRef.current, and the only render in this whole journey is the
      // setFocus above, which runs before the flight has started. So the labels
      // were sized for the view being LEFT and kept that size on arrival: zoom
      // into a small circle and back out and every name came back too big for
      // its circle. One more render once the view has actually settled.
      setFlighting(false); // flight settled: let the cluster marker mount at the final size
      setViewTick((n) => n + 1);
    };
    setFlighting(true); // flight starting: hide the cluster marker until it settles
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
      // The circle's own size, not the word's. In the pit the tapped element is
      // the name, so its width is a name's width and reading the rect would
      // hand the next layer a card as wide as the longest breed name. The pit
      // froze pixels-per-world at drop time, so the true radius is that.
      r: fellRef.current && d.depth === 1 ? d.r * (fxPxPerWorldRef.current || 1) : cr.width / 2,
      ring: strokeColorFor(d), // the lifted dog keeps the ring it wore in the pit
      /* AND ITS WEIGHT, not just its colour, 2 September 2026 (owner). The lift
         used to draw every ring at ringFrac(1), the thickest entry in the table,
         so a deep circle's thin ring came back heavy on the card.
         strokeWidthFor returns a width in world units and the pit draws every
         ring as a fraction of its own radius, so dividing by d.r recovers that
         fraction exactly. Taken from the live value rather than looked up again,
         so the difficulty trim and the hierarchy clamp ride along with it. */
      ringFrac: strokeWidthFor(d) / Math.max(d.r, 0.0001),
      /* AND THE SAME WEIGHT IN PIXELS, 2 September 2026 (owner). The fraction
         above is not enough on its own: the lift FLOORS a small circle up to a
         minimum card, and a fraction of a bigger radius is a bigger ring, so a
         small dog still came back with a heavier line than it had in the pit.

         This is the pit's drawn width in real pixels: the fraction multiplied by
         the same circle radius the `r` field above uses. Written out again rather
         than reusing `r`, because an object literal cannot read its own field. If
         that radius expression changes, change it in BOTH places. */
      ringPx:
        (strokeWidthFor(d) / Math.max(d.r, 0.0001)) *
        (fellRef.current && d.depth === 1 ? d.r * (fxPxPerWorldRef.current || 1) : cr.width / 2),
    });
    setLearnNode(d);
    return true;
  }

  /* The nodes and the lift, as refs, for the
     chain's once-bound listeners. liftToLearn is the tap's own call, and the
     mouse constraint is let go first exactly as the tap does, so Matter is never
     left pulling a body the sim has just taken out of the world.
     Refreshed every render, and AFTER liftToLearn on purpose: assigning it in
     the earlier effect read the function before its declaration. */
  useEffect(() => {
    nodesRef.current = nodes;
    dogOpenRef.current = (i: number) => {
      const n = nodesRef.current[i];
      const wrap = circlesRef.current?.children[i] as SVGGElement | undefined;
      const el = wrap?.children[0] as SVGCircleElement | undefined;
      if (!n || !el) return false;
      mcReleaseRef.current?.();
      return liftToLearn(el, n);
    };
  });

  function onCircle(e: React.MouseEvent, d: Node) {
    e.stopPropagation();
    // A drag ends in a click. Without this, letting go after pushing a circle
    // around would also open it.
    if (pullRef.current?.moved) return;
    // START SCREEN. The circles are the diagram, not a doorway: they are pushed
    // and pulled by the pointer handlers above and spring back.
    //
    // A DOUBLE TAP opens the learn area, and only once something has actually
    // been pulled. Until then two taps are just two taps, so nobody is thrown
    // into learn before they have touched the diagram at all. A drag ends in a
    // tap too, so a tap that moved is ignored here rather than counted.
    if (dockAside && gravity && entered && !started && !learning && focusRef.current === nodes[0]) {
      if (pullRef.current?.moved) return;
      const now = e.timeStamp;
      const quick = now - lastTapRef.current < 320;
      lastTapRef.current = quick ? 0 : now;
      if (quick && pulledEverRef.current) {
        setLearnPeek(false);
        setStartPeek(false);
        setLearning(true);
      }
      return;
    }
    // TOUCH: a DOUBLE tap zooms in. A single tap does what a hover does on a
    // mouse, which is come loose and show you what is inside.
    //
    // It used to be tap-to-preview then tap-again-to-enter, with no time limit,
    // so a second tap minutes later still went in. Now the two taps have to be
    // quick, which leaves a single tap free to preview and to push the circle
    // about without ever walking you somewhere you did not mean to go.
    // EVERY circle, not just the children of the one you are in. The gate used
    // to be `d.parent === focusRef.current`, so a sibling fell past this branch
    // and zoomed on a SINGLE tap while a child needed two. Nobody saw it while
    // siblings were off screen; the moment panning lets you reach them it would
    // read as a bug.
    if (
      touchRef.current &&
      dockAside &&
      !dropped &&
      !frozen &&
      d !== focusRef.current
    ) {
      const now = e.timeStamp;
      const quick = zoomTapRef.current.n === d && now - zoomTapRef.current.t < 320;
      zoomTapRef.current = quick ? { n: null, t: 0 } : { n: d, t: now };
      if (!quick) {
        setHovered(d);
        return;
      }
    }
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
          // The circle's own size, not the word's. In the pit the tapped element is
      // the name, so its width is a name's width and reading the rect would
      // hand the next layer a card as wide as the longest breed name. The pit
      // froze pixels-per-world at drop time, so the true radius is that.
      r: fellRef.current && d.depth === 1 ? d.r * (fxPxPerWorldRef.current || 1) : cr.width / 2,
          ring: strokeColorFor(d), // the lifted dog keeps the ring it wore in the pit
          // ...and its weight. See the note at the other lift site.
          ringFrac: strokeWidthFor(d) / Math.max(d.r, 0.0001),
          // ...and in pixels. See the note at the other lift site.
          ringPx:
            (strokeWidthFor(d) / Math.max(d.r, 0.0001)) *
            (fellRef.current && d.depth === 1 ? d.r * (fxPxPerWorldRef.current || 1) : cr.width / 2),
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
      // The info box no longer opens itself here. Zooming in used to force it
      // open, which covered the thing you had just gone in to look at. It stays
      // behind its own icon and opens when asked for.
    } else if (d.parent) zoom(d.parent);
  }
  function onBackground(e?: { clientX: number; clientY: number; timeStamp: number }) {
    // A drag that STARTED on the background is not a tap on the background.
    // Since the MouseConstraint landed, a missed grab is common: you press just
    // outside a chip, haul the pointer across the pit, let go, and the browser
    // fires a click on the SVG. Every one of those opened the leave-game
    // confirmation. Same 350ms and 8px rule as every other tap in the pit.
    const p = bgPressRef.current;
    bgPressRef.current = null;
    // timeStamp, not performance.now(): both events share the same clock, and
    // calling performance.now() here counts as impure render work.
    if (e && p && (e.timeStamp - p.t >= 350 || Math.hypot(e.clientX - p.x, e.clientY - p.y) >= 8)) return;
    if (focusRef.current !== nodes[0]) { zoom(nodes[0]); return; }
    // Once the round is running a tap on the background does NOTHING. It used to
    // route to the leave-game confirmation, which still meant a missed grab at a
    // chip could pull you out of a round you were winning. The close X is the
    // only way out of a live pit.
    if (started) return;
    // LEARN never sets started, so without this a stray tap on the pit
    // background (exposed around the floating blue box, e.g. a near-miss on
    // the box's close X) would fall through to onClose and drop the player
    // out of the whole game. In LEARN the close X is the deliberate way out,
    // so a background tap does nothing.
    if (learning) { setHovered(null); return; }
    // Start screen: the X is the only way out. A tap on the blue background
    // used to close the pit outright, which is a harsh exit for a mis-tap and
    // inconsistent with the round and LEARN, both of which already ignore it.
    // Other uses of BreedTree, such as the chum page dialog, keep the old
    // behaviour: this only applies to the pit.
    if (dockAside && gravity) return;
    onClose?.();
  }

  useEffect(() => {
    focusRef.current = nodes[0];
    setFocus(nodes[0]);
    setReady(true);

    const v: View = clampRootView(displayOnly ? displayRestView() : [nodes[0].x, nodes[0].y, nodes[0].r * 2 * (isMobile ? PAD : ZOOM_PAD) * (dockAside ? PIT_SPAN : 1)]);
    homeWRef.current = v[2];
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // A difficulty change re-packs the circles, which lands here as a fresh
    // nodes array. Replaying the 700ms staggered entrance on every step of the
    // slider would be unusable, and START is gated on `entered` so it would
    // blink out each time. Resize in place instead: the pack is real, so the
    // physics still reads the true radii when START is pressed.
    // displayOnly (chums2 static diagram): no drop/entrance choreography - the circles
    // must appear settled at their resting positions immediately, the same settle-in
    // -place path prefers-reduced-motion and a resize-only re-pack already take. Game
    // hostings (displayOnly false) keep the staggered drop-in below.
    // MOBILE, 31 Aug 2026: no drop-in. The staggered entrance below runs for
    // 700ms plus 45ms per circle, and `entered` is false throughout, which holds
    // back the difficulty slider, the circle names, the badges, PLAY, LEARN and the
    // level number. On a phone that reads as a broken half-drawn screen rather than
    // as choreography. Worse, zoomTo(v) only runs when the drop FINISHES, so for
    // that whole time the dashed cluster ring is drawn from a stale viewRef and
    // comes in oversized (the same class of bug the stroke-width comment below
    // describes).
    // This joins the settle-in-place branch rather than getting its own, because
    // that branch is exactly the behaviour wanted and has shipped to every
    // reduced-motion user since the entrance was written.
    // Read through the ref, not the isMobile state, so the effect keeps its
    // [nodes, dropArmed] deps; the ref is assigned during render, so it is current
    // by the time this runs. To drop the entrance on DESKTOP too, delete the
    // isMobileRef term.
    if (reduce || resizeOnlyRef.current || displayOnly || isMobileRef.current) {
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
    // Held for the tunnel: the drop-in is armed by the resolve signal, not by
    // mount. Until then, sit every circle above the pit and run no tween, so the
    // dogs are ready to fall the instant the ring begins to grow. entered stays
    // false, so PLAY and the labels stay down behind the tunnel.
    if (!dropArmed) {
      const cgHold = circlesRef.current;
      const kHold = SIZE / v[2];
      nodes.forEach((d, i) => {
        const c = (cgHold?.children[i] as SVGGElement | undefined)?.children[0] as SVGCircleElement | undefined;
        if (!c) return;
        const tx = (d.x - v[0]) * kHold;
        const ty = (d.y - v[1]) * kHold;
        c.setAttribute("transform", `translate(${tx},${ty - SIZE * 1.3})`);
        c.setAttribute("r", String(drawR(d, v, kHold)));
        c.setAttribute("stroke-width", String(strokeWidthFor(d) * strokeK(v)));
      });
      return () => cancelAnimationFrame(rafRef.current);
    }
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
        const c = (cg?.children[i] as SVGGElement | undefined)?.children[0] as SVGCircleElement | undefined;
        if (!c) return;
        const tx = (d.x - v[0]) * k;
        const ty = (d.y - v[1]) * k;
        const lt = Math.max(0, Math.min(1, (elapsed - i * stagger) / dur));
        const drop = (1 - easeOutBounce(lt)) * dropFrom;
        c.setAttribute("transform", `translate(${tx},${ty - drop})`);
        c.setAttribute("r", String(drawR(d, v, k)));
        // The ring has to be scaled by the SAME k as the radius. The entrance
        // set the radius and left the stroke to whatever React had rendered,
        // and React sizes it from viewRef, which at mount still holds the
        // pre-pit view with no PIT_SPAN in it. So the ring came in PIT_SPAN
        // times too heavy, about 2.5x, and only snapped right when the drop
        // finished and zoomTo ran.
        c.setAttribute("stroke-width", String(strokeWidthFor(d) * strokeK(v)));
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
  }, [nodes, dropArmed]);

  // displayOnly (D57): keep the resting frame fitted to the pack as the stage aspect
  // settles after mount (the layout effect measures it just after the first paint) and
  // on resize. The shared mount effect keys on [nodes, dropArmed], NOT aspect, so this
  // dedicated pass is what guarantees the content fit runs with the REAL aspect (and
  // re-fits on resize). Gated on displayOnly; it never touches game paths. It fires only
  // on aspect/nodes changes, not on a drill-in, so zoom is unaffected.
  useEffect(() => {
    if (!displayOnly) return;
    const v = clampRootView(displayRestView());
    homeWRef.current = v[2];
    focusRef.current = nodes[0];
    zoomTo(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayOnly, aspect, nodes]);

  // chums2 hover PUNCH-OUT band (D75, reinstated): write the highlight path's geometry
  // from the LIVE painted view (viewRef, read in an EFFECT not during render) so it lines
  // up with the imperatively-painted circles. Fires on the hovered ancestor (highlightName)
  // and whenever the fit re-runs. Outer circle + each non-echo direct child as evenodd
  // subpaths => the child discs punch out. Empty `d` clears it. displayOnly + prop-gated.
  useEffect(() => {
    const p = hlPathRef.current;
    if (!p) return;
    if (!displayOnly || !highlightName) { p.setAttribute("d", ""); return; }
    const v = viewRef.current, kk = SIZE / v[2];
    const disc = (cx: number, cy: number, r: number) =>
      `M ${cx - r},${cy} a ${r},${r} 0 1,0 ${2 * r},0 a ${r},${r} 0 1,0 ${-2 * r},0 Z`;
    let dd = "";
    for (const d of nodes) {
      if (d.depth === 0 || isHiddenCopy(d) || d.data.name !== highlightName) continue;
      dd += disc((d.x - v[0]) * kk, (d.y - v[1]) * kk, d.r * kk);
      for (const kid of d.children ?? []) if (!isHiddenCopy(kid)) dd += " " + disc((kid.x - v[0]) * kk, (kid.y - v[1]) * kk, kid.r * kk);
    }
    p.setAttribute("d", dd);
  }, [displayOnly, highlightName, nodes, aspect]);

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
    /* Root first, which is the order it is read in. The root step takes the
       level's own image and note, exactly as the single-circle callbacks above
       do, so the top of the ladder matches the title that was already there. */
    onShownPathChange?.(
      (sh.ancestors() as Node[]).reverse().map((n) => {
        const isRoot = n === nodes[0];
        const img = isRoot ? (rootImage ?? n.data.img) : n.data.img;
        const note = isRoot ? (rootNote ?? n.data.note ?? "") : (n.data.note ?? "");
        return { name: n.data.name, img: img ? bust(img) : null, status: nodeStatus(n.data.name, note) };
      }),
    );
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
      const { Engine, Bodies, Body: MBody, Composite, Constraint, Events, Mouse, MouseConstraint, Sleeping } = Matter;
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
      // Every chip in the pit is this radius, in viewBox units: see CHIP_R_PX.
      const chipR = CHIP_R_PX * fxScale;
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
      /* THE SMALLEST A DOG CIRCLE MAY BE, as a world radius, named ONCE and read
         by every route that puts a circle into the pit (owner, 18 September 2026).

         WHY IT IS HERE AND NOT INSIDE popChildren. It used to be a local
         expression in popChildren, which was the only route that created circles
         when it was written. The drop was later changed to free a level dog's
         children immediately, and that path grew its own body creation, copying
         popChildren's burst velocity and its ghost grouping but NOT its floor. So
         a low-share child of a level dog went into the pit at whatever the pack
         made it, and at level 0 with a further quarter taken off by
         DROP_SHRINK_0. A few pixels across, indistinguishable from the debris.

         WHY THAT BLOCKED THE ROUND. Nothing can clear a circle that small. All
         three routes that take one need the pointer on the disc: the chain
         through elementsFromPoint, the drag through matter's own hit test, and
         tap-to-open through the circle's own handler within 8px. A finger patch
         is about 40px. And a bomb cannot help, because the blast's kill pool is
         badges, rods and pills and never circles. So it stayed in `owned`
         forever and the round-won test could never pass. See ?windiag=1.

         IT FLOORS THE NODE, NOT THE BODY, and that is deliberate: nb.r is taken
         from ch.r and mkCircle reads b.r, so flooring the node carries the
         drawn radius, the physics body, the ring weight, the ring inset and the
         label fitter together. Flooring only the body would give a circle you
         can hit but cannot see, which is worse than the bug.

         IT IS A DROP-TIME GUARANTEE. pxPerWorld is the frozen drop-time
         transform, so this is 25 screen px at the zoom the pit started at, not
         at every later zoom. */
      const minCircleR = POP_MIN_PX / 2 / pxPerWorld;
      fxPxPerWorldRef.current = pxPerWorld; // J17: the effects layer's pixel-to-world scale
      fxFromPxRef.current = worldFromPx;
      const fx = createPitEffects(FX_SCALE);
      fxKitRef.current = fx;
      const stagePxH = worldH * pxPerWorld;
      // old world-units-per-second speeds (in worldH multiples) -> px per 16.66ms step
      const vps = (x: number) => (stagePxH * x) / 60;

      type Body = { n: Node | null; x: number; y: number; vx: number; vy: number; r: number; pct: number; idx: number; lastFx: number; popped: boolean; a: number; va: number; ia: number; iva: number; held?: boolean; charges?: number; lastKnock?: number; inert?: boolean; mb?: any; mbIn?: boolean; bomb?: boolean; blown?: boolean; bursting?: number; fuseCur?: number; rDraw?: number; hits?: number; heldSince?: number; heldHits?: number; clickPending?: boolean; green?: boolean };
      const d1 = nodes.filter((n) => n.depth === 1);
      const pctOf = (n: Node) => (n.parent ? Math.round(((n.value ?? 0) / (n.parent.value || 1)) * 100) : 0);
      const bodies: Body[] = d1.map((n, i) => ({ n, x: n.x, y: n.y, vx: 0, vy: 0, r: n.r, pct: pctOf(n), idx: i, lastFx: 0, popped: false, a: 0, va: 0, ia: 0, iva: 0 }));
      if (bodies.length === 0) { setFalling(false); return; }
      // ---- the words ----
      // Sized by the SAME fitter the circles use, so a name is the size it was
      // inside its circle, then 30% up because it has no ring or picture around
      // it any more. Derived rather than measured off the DOM: the fitter is the
      // thing that decided the size in the first place, so asking it directly
      // cannot disagree with what was drawn.
      const wordFits = d1.map((n) => {
        // Owner review: desktop takes the mobile fitter width, so the name
        // wraps into short lines and sits inside its circle rather than
        // running wide across the top of the stage.
        const fit = fitLabel(n.data.name.toUpperCase(), n.r * k * LABEL_SAFE, 132, labelFont);
        const fs = Math.max(10, fit.fs + TITLE_BOOST) * PIT_WORD_SCALE;
        const wv = Math.max(...fit.lines.map((l) => measureEm(l, labelFont))) * fs;
        const hv = fit.lines.length * fs * LABEL_LINE_H;
        return { lines: fit.lines, fs, wv, hv };
      });
      setWordList(wordFits.map((f) => ({ lines: f.lines, fs: f.fs })));
      wordBodiesRef.current = bodies;
      wordPopAtRef.current = performance.now();
      // yellow % badges become small bodies, spawned at each circle's lower-right rim.
      // Every badge is the flat fixed radius (badgeFloorVb); a circle whose drawn
      // radius (n.r * k) is smaller than that disc gets no badge (badgeDrawForNode
      // returns 0), so a badge never swallows its own dog.
      /* NOT d1. The badges come from their own list now, so widening it in
         stage 2 cannot turn a nested circle into a falling dog. Today it
         returns the same circles d1 does, which is why this stage is
         invisible. See badgeSourceNodes. */
      const badgeNodes = badgeSourceNodes(nodes);
      badgeSrcRef.current = badgeNodes.slice();
      const badges: Body[] = badgeNodes.map((n, i) => ({
        // bottom LEFT of the circle: the right side is where the level's own
        // furniture sits, and a badge there crowded it
        n: null, x: n.x - n.r * 0.707, y: n.y + n.r * 0.707, vx: 0, vy: 0,
        r: chipR / k, rDraw: chipR, pct: pctOf(n), idx: i, lastFx: 0, popped: true, a: 0, va: 0, ia: 0, iva: 0, charges: 10, green: false,
      }));
      badgeBodiesRef.current = badges;

      // ---- Matter world ----
      /* SLEEPING IS ON (2026-08-31). A settled body stops being solved until
         something touches it. Measured headless at 46 bodies, this cuts
         Engine.update cost by about 68% over the first ten seconds of a round
         and about 88% over thirty, because most of the pit is at rest for most
         of a round. Nothing else in this file changes: the fixed-timestep loop
         already parks itself after twelve still frames, so this is about the
         cost of the frames BEFORE the pit settles, which are the expensive
         ones.
         To revert, set this back to Engine.create(). Leave wakeBody and its
         call sites in place: they are correct either way. */
      const engine = Engine.create({ enableSleeping: true });
      engine.gravity.y = 1; // pit verbatim
      const world = engine.world;
      /* THE CATCH, and the reason wakeBody exists. Matter wakes a body by
         itself on a collision, on a constraint (so MouseConstraint is covered)
         and when a force is applied (so the blast is covered). It does NOT wake
         on setPosition, setVelocity, setAngularVelocity, setAngle or setStatic.
         Measured 2026-08-31: a sleeping body given setPosition stays exactly
         where it was and never falls, and one given setVelocity reports the new
         speed while not moving at all. Every place in this file that drives a
         body by hand therefore wakes it first. */
      const wakeBody = (mb: unknown) => { if (mb) Sleeping.set(mb as never, false); };
      const CIRCLE_OPTS = { restitution: 0.78, friction: 0.1, frictionAir: 0.01, density: 0.001 }; // tennis-ball lively floor bounce
      // The freed dog circles use these instead of CIRCLE_OPTS. Job A frees every
      // circle at the drop, up to about 50 a level where it used to be 2 to 4, and
      // a round body with friction 0.1 and no frictionStatic rolls almost forever,
      // so the pit never fully settles. These give a circle the rock's "sit where
      // it lands" behaviour: less bounce, real friction, a static-friction floor so
      // a circle at rest stays put, and a little more air drag. The word bodies are
      // rectangles and settle fine, so they keep CIRCLE_OPTS. Starting values, one
      // place to tune.
      const FREED_CIRCLE_OPTS = { restitution: 0.35, friction: 0.5, frictionStatic: 1.0, frictionAir: 0.015, density: 0.001 };
      const BADGE_OPTS = { restitution: 0.65, friction: 0.1, frictionAir: 0.01, density: 0.001 };
      const mkCircle = (b: Body, kind: string, opts: any) => {
        const p = pxFromWorld(b.x, b.y);
        const mb = Bodies.circle(p.x, p.y, Math.max(2, b.r * pxPerWorld), opts);
        mb.plugin = { bridge: b, kind };
        b.mb = mb; b.mbIn = true;
        Composite.add(world, mb);
        return mb;
      };
      // A dog is its NAME in the pit, so its body is the box that name draws
      // in, not a circle. The chips are untouched and stay circles.
      // opts mirrors mkCircle's shape without borrowing its `any`: a small local
      // type, because a bare `any` here is a lint error in this file.
      type BodyOpts = { restitution: number; friction: number; frictionAir: number; density: number };
      const mkWord = (b: Body, opts: BodyOpts) => {
        const p = pxFromWorld(b.x, b.y);
        // view units -> world -> px, the same two hops the rest of the pit uses
        const f = wordFits[b.idx];
        /* The name gets a body its own size. It used to be floored to at least
           the dog's circle diameter, from when the word body had to stand in for
           the circle as well: at PIT_WORD_SCALE 1.05 a name is shorter than its
           circle is wide, so an un-floored box left the circle hanging below it
           and sinking through the floor. That floor was always the stop-gap.
           The circle now has its own free body, freed at the drop, so nothing
           has to stand in for anything and the floor has no job. The name
           collides as the rectangle it actually is. Still at least 8px, so a
           very short name cannot make a degenerate body. */
        const wpx = Math.max(8, ((f ? f.wv : b.r * 2 * k) / k) * pxPerWorld);
        const hpx = Math.max(8, ((f ? f.hv : b.r * k) / k) * pxPerWorld);
        const mb = Bodies.rectangle(p.x, p.y, wpx, hpx, { ...opts, chamfer: { radius: Math.min(wpx, hpx) * 0.18 } });
        mb.plugin = { bridge: b, kind: "circle" };
        b.mb = mb; b.mbIn = true;
        Composite.add(world, mb);
        return mb;
      };
      for (const b of bodies) mkWord(b, CIRCLE_OPTS);
      for (const b of badges) mkCircle(b, "badge", BADGE_OPTS);
      // The opening shove: up and out, the first name one way and the next the
      // other, with a spin so they arrive already tumbling rather than dropping
      // dead straight. Alternating by index rather than by position, so a level
      // with three or four names still fans instead of all leaning one way.
      bodies.forEach((b, i) => {
        if (!b.mb) return;
        const dir = i % 2 === 0 ? -1 : 1;
        MBody.setVelocity(b.mb, { x: dir * vps(0.22), y: -vps(0.3) });
        MBody.setAngularVelocity(b.mb, dir * 0.05);
      });
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
        /* THE SQUARES ARE SPACED BY WHAT IS DRAWN, NOT BY THE BODY SLOT.
           Measured 1 September 2026, after a 4px gap changed almost nothing.
           This file sizes the same square twice and the two disagree:

             body slot  84 * uppW              (here)
             drawn      84 * pitScale * 1.2 * upp   (the render)

           `upp` and `uppW` are the same conversion, screen px to SVG units, so
           the two differ purely by pitScale * 1.2. Wherever that is under 1 the
           drawn square is smaller than its slot and the difference shows up as
           empty space, on top of whatever gap was asked for. Stacking the second
           square at 1.5 slots was therefore never putting it one square down.

           Centre to centre is now one DRAWN square plus the gap, so UI_GAP means
           what it says. 8% of the square matches the spacing between the two
           yellow icons Steve sent as the reference.

           NOT FIXING THE UNDERLYING SPLIT. Making the render drop its own 1.2
           would resize all four squares, and the close X is a control people are
           used to. Only the spacing is corrected here. */
        /* 25% OFF THE DRAWN SQUARE, 2 September 2026 (owner), to match the PLAY
           and LEARN squares on the start screen.

           THE BODY SLOT IS NOT TOUCHED. It stays 84 * uppW, which is the split
           the block above documents and explicitly declines to fix. Only what is
           painted comes down, so nothing about the physics changes.

           UI_INSET is half the width lost. Without it the square would appear to
           drift away from the corner by that amount on both axes, because it
           shrinks around a centre that has not moved, and the top and right
           margins were measured off two screenshots last session. Adding it back
           into the nudges keeps those measured margins exactly as they are. */
        const UI_DRAWN_FULL = 84 * pitScale * 1.2 * uppW;
        const UI_SHRINK = 0.75;
        const UI_DRAWN = UI_DRAWN_FULL * UI_SHRINK;
        const UI_INSET = (UI_DRAWN_FULL - UI_DRAWN) / 2;
        const UI_GAP = UI_DRAWN * 0.08;
        /* NUDGE, 1 September 2026 (owner): the yellow in-pit squares sat a
           touch inside and below the red X on the start screen, so 5px left and
           5px up brings the two edges into line.

           WHY A NUDGE AND NOT A NEW MARGIN. The squares are laid out on an
           84 * uppW slot but DRAWN at 84 * pitScale * 1.2, the same split
           documented at UI_DRAWN below. So the visible edge is not the body
           edge, and the margin `m` cannot be corrected without either moving
           every other thing that uses it or resizing the squares. This offsets
           the finished result instead, which is what was actually measured
           against the start screen.

           Applied to the whole column so the X and the brain move together. */
        /* MEASURED, not nudged again. Two guesses went the wrong way, so the two
           screenshots were compared instead, each normalised against the
           square's OWN drawn width so the different capture sizes cancel out:

             red X, start screen : right margin 0.27 x the square
             yellow X, pit       : right margin 0.54 x the square

           So it sat about a quarter of a square too far in, and the correction
           is a FRACTION OF THE SQUARE rather than a pixel count. That matters:
           the squares are drawn at 84 * pitScale * 1.2 while their slot is 84,
           so a fixed offset that looks right on one phone is wrong on another.

           The vertical measured close after the earlier move, 2.4% from the top
           against the red X's 2.7%, so the 15px up is kept as it is.

           BETTER FIX, NOT AVAILABLE: reuse the start screen X's own rule. Its
           caption "BACK TO MAIN PAGE" appears nowhere in this repo, so whatever
           draws it was never found. If it turns up, a shared anchor beats this. */
        // Plus a further 5 by eye after the measurement landed close but a touch
        // shy. Kept as its own term rather than folded into the 0.27, so the
        // measured part and the taste part stay legible.
        /* The 0.27 reads UI_DRAWN_FULL, not UI_DRAWN. It was measured against the
           square at its old size, so scaling it with the shrink would move the
           column and throw away the measurement. UI_INSET is the separate term
           that puts the smaller square back on the same visible corner. */
        const UI_NUDGE_X = -15 * uppW + UI_DRAWN_FULL * 0.27 + 5 * uppW + UI_INSET; // right, into the corner
        const UI_NUDGE_Y = -15 * uppW - UI_INSET; // negative is up, measured as close enough
        /* THE COLLISION SIZE, CORRECTED 2 September 2026 (owner).

           THE BUG. On 2 September the DRAWN square came down 25% and the body
           deliberately did not, on the grounds that the two were already out of
           step and that split was documented as not-to-be-fixed. That was wrong
           once the gap grew this wide. These bodies are CIRCLES of radius
           uSz/2 * 1.1, and uSz is the untouched 84 slot, so on a phone a 50.6px
           square was pushing everything away with a 92px circle: a 20px halo of
           nothing all the way round, and round, so cards could not tuck into the
           corners either. Visible on screen as an even empty frame around the X
           and the brain, which is exactly how it was spotted.

           UI_HIT_R ties the circle to UI_DRAWN, which already carries the 0.75,
           so the body follows the artwork from here on. `half` is left on uSz:
           it is the rest of the pit's idea of this object's slot, used for
           placement and for the drag maths, and changing it would move every
           square that has just been positioned by measurement.

           1.1 is kept. It is the main pit's own margin, so the circle sits a
           touch outside the square rather than inside its corners. */
        const UI_HIT_R = (UI_DRAWN / 2) * 1.1 / k;
        const ux = v[0] + (xMinF + vbWf - m - uSz / 2 + UI_NUDGE_X) / k;
        uiBodiesRef.current = [
          { x: ux, y: v[1] + (-vbHf / 2 + m + uSz / 2 + UI_NUDGE_Y) / k, vx: 0, vy: 0, r: UI_HIT_R, half: uSz / 2, a: 0, va: 0, fixed: true, hits: 0, kind: "close" },
          /* BESIDE THE CLOSE X, NOT UNDER IT, 2 September 2026 (owner).
             UI_GAP is the space between the two. It was 14, then 4 (owner,
             1 September: "back to right below the X"), and 4 is kept now that
             they sit side by side so the pair still reads as one unit.

             THE OFFSET MOVED FROM y TO x AND CHANGED SIGN. It was
             + UI_DRAWN + UI_GAP on y, which stacked downward because y grows
             down the screen. On x it has to be NEGATIVE: these squares are
             anchored to the RIGHT edge, so the second one goes to the LEFT of
             the first or it walks off screen.

             The desc and learn squares share this slot, only one of them showing
             at a time, so they carry the same figures and must be changed
             together. */
          /* THE TWO SQUARES SPLIT, 2 September 2026 (owner). They used to share one
             slot, so moving the info "i" beside the close X took the brain with
             it. They are different buttons on different screens and now sit
             differently:
               desc  the info "i", BESIDE the X, to its left
               learn the brain, BELOW the X, where it was before today
             Only one of the two is on screen at a time, so they can occupy
             different places without ever colliding. */
          { x: ux - (UI_DRAWN + UI_GAP) / k, y: v[1] + (-vbHf / 2 + m + uSz / 2 + UI_NUDGE_Y) / k, vx: 0, vy: 0, r: UI_HIT_R, half: uSz / 2, a: 0, va: 0, fixed: true, hits: 0, kind: "desc" },
          { x: ux, y: v[1] + (-vbHf / 2 + m + uSz / 2 + UI_DRAWN + UI_GAP + UI_NUDGE_Y) / k, vx: 0, vy: 0, r: UI_HIT_R, half: uSz / 2, a: 0, va: 0, fixed: true, hits: 0, kind: "learn" },
          /* THE LOGO. Top CENTRE, not the top-right corner the three squares
             share, and 20% down the stage like the main pit's own placement.
             Its drawn width is the main pit's figure clamped to the pit, so a
             narrow phone gets one that fits between the walls. */
          (() => {
            // LOGO_SHRINK is the owner's tenth off, applied to whichever branch
            // of the clamp wins, and logoWpxRef is what the pit's bone is sized
            // from: see LOGO_BONE_FRAC.
            const lwPx = Math.min(84 * uppW * LOGO_BIG_MULT, ((pR.x - pL.x) * uppW) * LOGO_PIT_FRACTION) * LOGO_SHRINK;
            logoWpxRef.current = lwPx;
            const lhPx = lwPx / LOGO_ASPECT;
            return {
              x: v[0] + (xMinF + vbWf / 2) / k,
              y: v[1] + (-vbHf / 2 + vbHf * 0.2) / k,
              vx: 0, vy: 0,
              // `r` is only used for the circle bodies; the logo carries w and h
              // and the body creation below branches on them.
              r: (lhPx / 2) / k, half: lhPx / 2,
              a: 0, va: 0, fixed: true, hits: 0, kind: "logo" as UiKind,
              w: lwPx / k, h: lhPx / k,
            };
          })(),
          // The leave/restart squares are no longer built here. They are spawned
          // as PAIRS into the live world by spawnPairRef, one pair per corner-X
          // tap, so they pile up instead of toggling a single pair in and out.
        ];
        // Spawn one red-leave + green-restart pair into the LIVE world at the
        // corner-X anchor, with the same sideways nudge the old open-the-menu
        // drop used. Loose (fixed:false), so they fall and tumble like any freed
        // body. Set here so it closes over uSz/k/v and the world/Bodies in scope.
        spawnPairRef.current = (id: number) => {
          const list = uiBodiesRef.current;
          if (!list) return;
          const anchor = list.find((z) => z.kind === "close");
          const ax = anchor ? anchor.x : ux, ay = anchor ? anchor.y : v[1];
          const mk = (kind: UiKind, vx: number, av: number): UiBody => {
            const u: UiBody = { x: ax, y: ay, vx: 0, vy: 0, r: UI_HIT_R, half: uSz / 2, a: 0, va: 0, fixed: false, hits: 5, kind, id, spawned: true };
            const p = pxFromWorld(u.x, u.y);
            const um = Bodies.circle(p.x, p.y, Math.max(2, u.r * pxPerWorld), { restitution: 0.3, frictionAir: 0.012, density: 0.0012 });
            um.plugin = { ui: u };
            u.mb = um;
            u.mbIn = true;
            Composite.add(world, um);
            MBody.setVelocity(um, { x: vx, y: 2.4 });
            MBody.setAngularVelocity(um, av);
            return u;
          };
          list.push(mk("leave", -3.2, -0.12), mk("restart", -1.1, 0.12));
        };
      }
      /* THE PIECES THAT COME OFF THE LOGO. Called from the hit block with the
         zero-based hit index, so 0 is the first strike.

         Positions are worked out in the logo's own frame and then ROTATED BY
         ITS CURRENT ANGLE, so a spot tracks the artwork as it sinks and tips.
         Straight from the main pit's `at()` helper, PackPit.tsx:602.

         Pieces fall under gravity alone: no velocity, no spin. They arrive
         where they were drawn and drop off, which is what makes it read as
         something breaking rather than something being fired out.

         NOT DONE, and it is the only piece of the main pit's choreography
         missing: the shouts HANG for 350ms on a hinge constraint and swing
         before releasing. Four hinges, four timers, and a `disposed` guard so a
         level change cannot leave one behind. Worth its own stage. */
      const dropLogoPieces = (u: { x: number; y: number; a: number; w?: number; h?: number }, hitIndex: number) => {
        const def = LOGO_PIECES[Math.min(hitIndex, LOGO_PIECES.length - 1)];
        if (!def || !u.w) return;
        const lwPx = u.w * pxPerWorld;
        const HALF_W = lwPx / 2;
        const HALF_H = (lwPx / LOGO_SPOT_ASPECT) / 2;
        const c = pxFromWorld(u.x, u.y);
        const ca = Math.cos(u.a), sa = Math.sin(u.a);
        const at = (fx: number, fy: number, outX = 0, outY = 0) => {
          const ox = fx * HALF_W + outX, oy = fy * HALF_H + outY;
          return { x: c.x + ox * ca - oy * sa, y: c.y + ox * sa + oy * ca };
        };
        const spawn = (x: number, y: number, scale: number, angleDeg: number) => {
          const pw = lwPx * def.frac * scale, ph = pw / def.ar;
          const idx = logoPieceBodiesRef.current.length;
          const w2 = worldFromPx(x, y);
          const pr: PropBody = { x: w2.x, y: w2.y, vx: 0, vy: 0, a: (angleDeg * Math.PI) / 180, idx, hits: 0, maxHits: 9999 };
          const mb = Bodies.rectangle(x, y, Math.max(2, pw), Math.max(2, ph), {
            angle: (angleDeg * Math.PI) / 180,
            chamfer: { radius: Math.min(pw, ph) * 0.18 },
            restitution: 0.45, friction: 0.4, frictionAir: 0.01, density: 0.0009,
            collisionFilter: { group: LOGO_GROUP },
          });
          mb.plugin = { prop: pr, kind: "logopiece" };
          pr.mb = mb;
          Composite.add(world, mb);
          logoPieceBodiesRef.current.push(pr);
          setLogoPieceList((l) => [...l, { src: def.src, w: pw * fxScale, h: ph * fxScale }]);
        };
        if (hitIndex === 0) {
          for (const [fx, fy, sc] of LOGO_SPOTS_DOTS) { const p = at(fx, fy); spawn(p.x, p.y, 0.5 * sc, 0); }
        } else if (hitIndex === 1) {
          for (const [fx, fy] of LOGO_SPOTS_YELLOW) { const p = at(fx, fy); spawn(p.x, p.y, 0.5, 0); }
        } else if (hitIndex === 2) {
          for (const [fx, fy, base] of LOGO_SPOTS_SHOUTS) {
            const p = at(fx, fy);
            spawn(p.x, p.y, 1, base - LOGO_SHOUT_SPLAY);
            spawn(p.x, p.y, 1, base + LOGO_SHOUT_SPLAY);
          }
        } else if (hitIndex === 3) {
          const out = lwPx * LOGO_POOF_OUT;
          for (const p of [at(0, -1, 0, -out), at(0, 1, 0, out), at(-1, 0, -out, 0), at(1, 0, out, 0)]) spawn(p.x, p.y, 1, 0);
        } else {
          const p = at(0, 0, 0, HALF_H * 0.2);
          spawn(p.x, p.y, 1, 0);
        }
        wake();
      };
      const uiBodies = uiBodiesRef.current;
      /* Which squares belong to the pit menu rather than the corner. Their
         bodies are built like any other, but they are held out of the world
         until the menu opens: a body outside the world collides with nothing,
         which is exactly what an off-screen control should do. */
      const isMenuKind = (k: string) => k === "leave" || k === "restart";
      for (const u of uiBodies as any[]) {
        const p = pxFromWorld(u.x, u.y);
        /* Every UI object here is a circle except the logo, which is a wide
           rectangle. Its collider is inset to the artwork's own bounds, the
           main pit's 85% by 70%, so the empty corners of the box do not take
           hits that the drawing never touches. */
        const um = u.kind === "logo" && u.w && u.h
          ? Bodies.rectangle(
              p.x, p.y,
              Math.max(2, u.w * LOGO_BODY_W * pxPerWorld),
              Math.max(2, u.h * LOGO_BODY_H * pxPerWorld),
              { isStatic: u.fixed, restitution: 0.3, frictionAir: 0.012, density: 0.0012, collisionFilter: { group: LOGO_GROUP } },
            )
          : Bodies.circle(p.x, p.y, Math.max(2, u.r * pxPerWorld), { isStatic: u.fixed, restitution: 0.3, frictionAir: 0.012, density: 0.0012 });
        um.plugin = { ui: u };
        u.mb = um;
        u.mbIn = !isMenuKind(u.kind);
        if (u.mbIn) Composite.add(world, um);
      }

      const all = bodies.concat(badges);
      // nodes that have their own body: their subtrees no longer ride a parent
      const owned = new Set<Node>(bodies.map((b) => b.n as Node));

      // ghost immunity: freshly freed bodies share a negative collision group
      // with their parent so a drop-time or pop-time overlap resolves without an
      // explosion; cleared on a 650ms timer. popChildren uses it too. Declared
      // here because the drop below is now its first caller.
      let ghostSeq = 1;
      const ghostTimers: number[] = [];
      const ghost = (mbs: any[]) => {
        const g = -(ghostSeq++);
        for (const m of mbs) m.collisionFilter.group = g;
        ghostTimers.push(window.setTimeout(() => {
          for (const m of mbs) if (m.collisionFilter.group === g) m.collisionFilter.group = 0;
        }, 650));
      };

      // ---- the dog's own circles, freed at the drop -----------------------
      // A level dog IS its name. Its circles used to cling to the name: static,
      // sensor, pinned in the word's collision group and teleported onto it
      // every frame. That is gone. Each circle now drops as an ordinary dynamic
      // body at its packed position and is a pit object from the start, so it is
      // draggable and it shoves and is shoved like anything else.
      //
      // A name and its circles are placed overlapping on purpose, so the word
      // and its freed circles get temporary mutual immunity (ghost) for that
      // overlap to resolve without the old rocket motor, plus a small outward
      // burst so they spread the way popChildren's circles do.
      //
      // Everything else the old cling loop did stays: each child is registered
      // in `owned`, pushed to `all`, given its yellow % chip (deliberately in no
      // shared group, so its own dog can knock it about), and the word is marked
      // popped so popChildren early-returns and cannot double the circles.
      for (const b of bodies) {
        if (!b.n || !b.mb) continue;
        const kids = (b.n.children ?? []).filter((ch) => !isHiddenCopy(ch));
        if (!kids.length) { b.popped = true; continue; }
        const wmb = b.mb; // narrowed and stable for the closure below
        // the word plus everything freed under it, immune to each other briefly
        const newMbs = [wmb];
        kids.forEach((ch) => {
          // See DROP_SHRINK_0. Done before the body and the chip are sized, so
          // both follow from one number.
          if (level === 0 && !DROP_SHRUNK.has(ch)) { DROP_SHRUNK.add(ch); ch.r *= DROP_SHRINK_0; }
          /* AND THEN THE FLOOR, which this route never had. SHRINK FIRST, FLOOR
             SECOND, never the other way about: flooring first would let level 0's
             quarter come straight back off the floor itself. See minCircleR. */
          ch.r = Math.max(ch.r, minCircleR);
          const nb: Body = { n: ch, x: ch.x, y: ch.y, vx: 0, vy: 0, r: ch.r, pct: pctOf(ch), idx: -1, lastFx: 0, popped: false, a: 0, va: 0, ia: 0, iva: 0 };
          owned.add(ch);
          all.push(nb);
          const cmb = mkCircle(nb, "circle", FREED_CIRCLE_OPTS);
          // a small upward-outward burst, the same recipe popChildren uses
          MBody.setVelocity(cmb, {
            x: wmb.velocity.x * 0.4 + (Math.random() - 0.5) * vps(0.7),
            y: wmb.velocity.y * 0.3 - vps(0.45 + Math.random() * 0.35),
          });
          MBody.setAngularVelocity(cmb, (Math.random() - 0.5) * 0.8 / 60);
          newMbs.push(cmb);
          // The child's own percentage chip, spawned here at the drop. It used
          // to be made by popChildren, which no longer runs for a level dog now
          // that its children are out from the start, so without this the chips
          // would simply stop existing. It falls free and is NOT in any shared
          // group, so everything including its own dog can knock it about.
          const bl = badgeBodiesRef.current;
          if (bl) {
            const kidBomb = rollBomb();
            const kb: Body = {
              n: null, x: ch.x - ch.r * 0.6, y: ch.y + ch.r * 0.6, vx: 0, vy: 0,
              r: chipR / k, rDraw: chipR,
              pct: pctOf(ch), idx: bl.length, lastFx: 0, popped: true,
              a: 0, va: 0, ia: 0, iva: 0, charges: 10, green: false, bomb: kidBomb,
            };
            bl.push(kb);
            all.push(kb);
            const mbb = mkCircle(kb, "badge", BADGE_OPTS);
            MBody.setVelocity(mbb, { x: cmb.velocity.x * 0.8 + (Math.random() - 0.5) * vps(0.3), y: cmb.velocity.y * 0.8 });
            newMbs.push(mbb);
            // Both homes, same order. See badgeSrcRef.
            badgeSrcRef.current.push(ch);
            setBadgePcts((l) => [...l, { pct: kb.pct, r: chipR, bomb: kidBomb, src: ch }]);
          }
        });
        // resolve the deliberate word/circle overlap without an explosion
        if (newMbs.length > 1) ghost(newMbs);
        b.popped = true; // its children are already out, so a knock cannot pop it
      }

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

      // First solid hit pops a circle's direct children out as their own
      // bodies (their subtrees riding along), inheriting some momentum plus
      // an upward-outward burst; each child brings its yellow % badge.
      const popChildren = (b: Body) => {
        if (!b.n || b.popped) return;
        b.popped = true;
        const newMbs: any[] = b.mb ? [b.mb] : [];
        for (const ch of b.n.children ?? []) {
          if (isHiddenCopy(ch)) continue;
          // Grown once, then floored. b.popped guards popChildren against a
          // second run, so this cannot compound down a deep tree. The floor is
          // given in screen pixels and converted here, because the packed radii
          // are world units and the difficulty slider changes what a world unit
          // is worth: a fixed world figure would be the wrong size at one end of
          // the slider or the other.
          // The same floor the drop uses, read from the one name rather than
          // written out again here, which is how the drop came to be without it.
          ch.r = Math.max(ch.r * POP_GROW, minCircleR);
          const nb: Body = { n: ch, x: ch.x, y: ch.y, vx: 0, vy: 0, r: ch.r, pct: pctOf(ch), idx: -1, lastFx: 0, popped: false, a: 0, va: 0, ia: 0, iva: 0 };
          owned.add(ch);
          all.push(nb);
          const mb = mkCircle(nb, "circle", FREED_CIRCLE_OPTS);
          MBody.setVelocity(mb, {
            x: (b.mb ? b.mb.velocity.x * 0.4 : 0) + (Math.random() - 0.5) * vps(0.7),
            y: (b.mb ? b.mb.velocity.y * 0.3 : 0) - vps(0.45 + Math.random() * 0.35),
          });
          MBody.setAngularVelocity(mb, (Math.random() - 0.5) * 0.8 / 60);
          newMbs.push(mb);
          const bl = badgeBodiesRef.current;
          if (bl) {
            // Opening a dog circle is the mini pit's commonest chip source, so
            // the roll belongs here as much as in the scatter. Without it a bomb
            // only ever arrives from the lineage layer and stays rare.
            const popBomb = rollBomb();
            const bb: Body = { n: null, x: ch.x - ch.r * 0.6, y: ch.y + ch.r * 0.6, vx: 0, vy: 0, r: chipR / k, rDraw: chipR, pct: pctOf(ch), idx: bl.length, lastFx: 0, popped: true, a: 0, va: 0, ia: 0, iva: 0, charges: 10, green: false, bomb: popBomb };
            bl.push(bb);
            all.push(bb);
            const mbb = mkCircle(bb, "badge", BADGE_OPTS);
            MBody.setVelocity(mbb, { x: mb.velocity.x * 0.8 + (Math.random() - 0.5) * vps(0.3), y: mb.velocity.y * 0.8 });
            newMbs.push(mbb);
            badgeSrcRef.current.push(ch);
            setBadgePcts((l) => [...l, { pct: bb.pct, r: chipR, bomb: popBomb, src: ch }]);
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
      // final circle's resting spot, WON_CHAIN_STEP_MS apart (the bomb's chain,
      // mini-pit cut)
      chainRef.current = (ox: number, oy: number) => {
        const targets: { x: number; y: number; go: () => void }[] = [];
        for (const b of all) {
          if (b.n || !b.mb || !b.mbIn || b.held) continue;
          /* `blown` IS NOT OPTIONAL HERE (owner, 18 September 2026). This killed a
             chip by removing the body, clearing mbIn and hiding the sprite, and
             never set `blown`. The physics loop re-adds anything matching
             `!held && !mbIn && !blown` (see the block by wakeBody), so every chip
             this chain took was put straight back into the world on the very next
             step: invisible, solid, and holding its space open for the rest of the
             round. detonate and killChained both set it for exactly this reason
             and this one path did not. */
          targets.push({ x: b.x, y: b.y, go: () => { poofAt(b.x, b.y, performance.now()); Composite.remove(world, b.mb); b.mbIn = false; b.blown = true; setDeadBadges((p) => new Set(p).add(b.idx)); } });
        }
        for (const [list, kind] of [[rodBodiesRef.current, "rod"], [pillBodiesRef.current, "pill"], [toyBodiesRef.current, "toy"]] as any[]) {
          for (const pr of list) if (!pr.dead && pr.mb) targets.push({ x: pr.x, y: pr.y, go: () => killProp(pr, kind, performance.now()) });
        }
        const du = (uiBodiesRef.current as any[] | null)?.find((u) => u.kind === "desc");
        if (du && du.mb) targets.push({ x: du.x, y: du.y, go: () => { poofAt(du.x, du.y, performance.now()); Composite.remove(world, du.mb); setDescGone(true); } });
        targets.sort((a, b2) => Math.hypot(a.x - ox, a.y - oy) - Math.hypot(b2.x - ox, b2.y - oy));
        targets.forEach((t, i) => window.setTimeout(t.go, i * WON_CHAIN_STEP_MS));
        wake();
        return targets.length * WON_CHAIN_STEP_MS;
      };
      // ---- toys: tennis ball and Union Jack, main pit physics verbatim ----
      const BIGT = 84 * (window.matchMedia("(max-width: 768px)").matches ? 0.67 : 1);
      const toyTimers: number[] = [];
      // The chum flood. Every pack dog this level's circles produce, tipped in
      // from well above the stage at scattered positions, angles and spins so
      // they arrive as a shower rather than a column. Inert throughout.
      const spawnChums = () => {
        const imgs = chumImagesRef.current;
        if (!imgs.length) return;
        onChumsDropped?.(imgs.length);
        const vw = typeof window !== "undefined" ? window.innerWidth : 390;
        // The medium dog's size. Every other band is a multiple of it, so a
        // giant drops in noticeably bigger than a terrier, exactly as in the
        // main pit. Clamped before the band is applied, so the bands keep
        // their ratios instead of being flattened by the ceiling.
        const diaMed = Math.max(CHUM_MIN, Math.min(CHUM_MAX, vw * CHUM_VW));
        const stageTopPx = st ? st.getBoundingClientRect().top : 0;
        imgs.forEach(({ image, band, name: chumName }, i) => {
          const dia = diaMed * (CHUM_BAND[band] ?? 1);
          const r = dia / 2;
          toyTimers.push(window.setTimeout(() => {
            const px = pL.x + r + 8 + Math.random() * Math.max(1, wPx - dia - 16);
            // far higher than the toys' 60 to 120, so they are already moving
            // fast when they enter and the pit floods rather than fills
            const py = stageTopPx - (260 + Math.random() * 560);
            const w2 = worldFromPx(px, py);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pr: any = { x: w2.x, y: w2.y, vx: 0, vy: 0, a: 0, idx: chumBodiesRef.current.length, hits: 0, maxHits: 9999, mb: null, chum: true, onFloor: false, floorLostAt: 0 };
            const mb = Bodies.rectangle(px, py, dia, dia, {
              chamfer: { radius: dia * 0.22 },
              restitution: 0.4, friction: 0.3, frictionAir: 0.006, density: 0.0012,
              angle: (Math.random() - 0.5) * 1.4,
              // See MC_CAT above: a card must not steal the grab from whatever
              // it landed on. Physics unchanged, pointer only.
              collisionFilter: { mask: CHUM_MASK },
            });
            MBody.setVelocity(mb, { x: (Math.random() - 0.5) * 7, y: 2 + Math.random() * 3 });
            MBody.setAngularVelocity(mb, (Math.random() - 0.5) * 0.3);
            mb.plugin = { prop: pr, kind: "chum" };
            pr.mb = mb;
            Composite.add(world, mb);
            chumBodiesRef.current.push(pr);
            setChumList((l) => [...l, { image, size: dia * fxScale, name: chumName }]);
            wake();
          }, i * CHUM_STAGGER));
        });
      };
      /* `side` is -1 for the left half of the pit and 1 for the right. Only the
         era props pass it; everything else keeps its own placement. */
      const spawnToy = (kind: ToyKind, side?: -1 | 1) => {
        // the flag never returns once its message has been read; the ball never
        // returns once the player has thrown it clear of the pit
        /* Three scopes now: gone for good, gone for this era, gone for this
           visit. Read in that order, most permanent first. */
        if (PERMANENT_TOYS.includes(kind)
          ? toyRetiredForever(TOY_GONE_KEY[kind])
          : ERA_SCOPED_TOYS.includes(kind)
            ? toyRetiredInEra(TOY_GONE_KEY[kind], era)
            : toyRetired(TOY_GONE_KEY[kind])) return;
        // answered once, gone for good, so the pit never nags
        if (kind === "cookies" && cookieConsentGiven()) return;
        const isNarrow = window.matchMedia("(max-width: 768px)").matches;
        const ballDia = BIGT * 2.25 * (isNarrow ? 0.9 : 1);
        // rock reads at the ball's size, stick a little longer than the ball is
        // wide so it looks throwable rather than like a twig
        const dia =
          kind === "ball" || kind === "ballPink" ? ballDia
          : kind === "rock" ? ballDia
          : kind === "stick" ? ballDia * 1.6
          : kind === "stickBig" ? ballDia * 1.6 * 1.5
          : kind === "cookies" ? BIGT * 3.2
          /* THE BONE IS SIZED FROM THE LOGO'S BONE (owner, 18 September 2026),
             so the two track each other. It is taken from the logo's own drawn
             width rather than given a figure of its own, which is what keeps
             them together on every screen, then scaled by PIT_BONE_MATCH,
             because the logo's bone carries the words and reads bigger than a
             plain bone of the same width: see LOGO_BONE_FRAC and PIT_BONE_MATCH.
             The fallback is the old ballDia * 1.68 and is there for safety
             alone: the logo is sized when the pit is built and the toys arrive
             on timers seconds later, so it has always been measured by now. */
          : kind === "bone" ? (logoWpxRef.current > 0 ? logoWpxRef.current * LOGO_BONE_FRAC * PIT_BONE_MATCH : ballDia * 1.68)
          // Era props. The newspaper is a long roll so it takes the stick's
          // length; the fork and the shoe are hand-sized, so they read at the
          // ball's width like the rock does.
          : kind === "newspaper" ? TOY_NEWSPAPER_W
          : kind === "fork" ? ballDia * 1.15
          : kind === "shoe" ? TOY_SHOE_W
          // The bowl takes the main pit's own multiplier off the same unit,
          // PackPit.tsx:364, including its 0.85 mobile reduction.
          //
          // BUT IT IS CLAMPED TO THE PIT, and that clamp is the important half.
          // The main pit is a full-width canvas. This one is only as wide as
          // the walls, which on a phone is the viewport: about 380 to 414px.
          // BIGT * 9.38 * 0.85 comes out at about 449px on mobile, so the
          // unclamped bowl is WIDER THAN THE PIT IT FALLS INTO and its rims
          // foul both walls. Steve reported exactly that, 31 August 2026.
          //
          // BOWL_PIT_FRACTION is the share of the floor a settled bowl is
          // allowed to take. Whichever is smaller wins, so a wide desktop pit
          // still gets the main pit's size and a phone gets one that fits.
          : kind === "bowl" ? Math.min(BIGT * 9.38 * (isNarrow ? 0.85 : 1), wPx * BOWL_PIT_FRACTION)
          : BIGT * 0.6 * 2;
        const hgt = kind === "stick" || kind === "stickBig" ? dia / STICK_ASPECT : kind === "rock" ? dia / ROCK_ASPECT : kind === "cookies" ? dia / COOKIES_ASPECT : kind === "bone" ? dia / BONE_ASPECT
          : kind === "newspaper" ? dia / TOY_NEWSPAPER_ASPECT
          : kind === "fork" ? dia / TOY_FORK_ASPECT
          : kind === "shoe" ? dia / TOY_SHOE_ASPECT
          : kind === "bowl" ? dia / BOWL_ASPECT
          : dia;
        const r = dia / 2;
        // ball drops anywhere across the pit, flag comes in at 70% like the pit
        /* THE FOOTPRINT, NOT THE WIDTH. Turned near upright these two are far
           narrower than they are long, so placing them by `dia` would treat a
           400px newspaper as 400px of floor and shove it into one spot. What
           they actually occupy across the pit is the OTHER dimension. */
        const upright = kind === "newspaper" || kind === "shoe";
        const foot = upright ? hgt : dia;
        const px = kind === "flag"
          ? pL.x + wPx * 0.7
          : side
            ? (() => {
                // Half the pit each, so two props can never share a side.
                const half = Math.max(foot + 20, wPx / 2);
                const lo = side < 0 ? pL.x : pL.x + wPx - half;
                return lo + foot / 2 + 10 + Math.random() * Math.max(1, half - foot - 20);
              })()
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
          kind === "ball" || kind === "ballPink" ? { restitution: 0.85, friction: 0.05, frictionStatic: 0.4, frictionAir: 0.003, density: 0.0006 } // bouncy, but SETTLES: restitution 0.85 is what kills the freeze (was 0.97, never reached 12 still frames, froze the pit at 30s, see handover 17). frictionStatic 0.8 -> 0.4 (2026-08-12) so a resting ball is easier to flick: 0.8 gripped the launch. Settle re-checked in a headless Matter sim, 2.7-7.1s to still at 0.4, identical to 0.8, so no freeze; if it ever returns do NOT lower this further, raise frictionAir to 0.006 instead.
          : kind === "rock" ? { restitution: 0.12, friction: 0.75, frictionStatic: 1.2, frictionAir: 0.006, density: 0.02 }
          : kind === "cookies" ? { restitution: 0.3, friction: 0.4, frictionAir: 0.012, density: 0.004 } // the main pit's own panel figures
          : kind === "stick" ? { restitution: 0.35, friction: 0.35, frictionAir: 0.004, density: 0.002 }
          // the main pit's own bone figures, PackPit line 405
          : kind === "bone" ? { restitution: 0.3, friction: 0.3, frictionAir: 0.012, density: 0.0008 }
          // A rolled newspaper and a wooden-soled shoe land dead and stay put.
          // The fork is lighter and skitters a little, so it keeps some bounce.
          // Newspaper halved to 0.002 and shoe doubled to 0.016: rolled paper
          // should be light enough to be shoved about, a wooden-soled shoe
          // should not. They are now eight times apart rather than two.
          : kind === "newspaper" ? { restitution: 0.16, friction: 0.6, frictionStatic: 1.0, frictionAir: 0.008, density: 0.002 }
          : kind === "shoe" ? { restitution: 0.14, friction: 0.7, frictionStatic: 1.1, frictionAir: 0.008, density: 0.016 }
          : kind === "fork" ? { restitution: 0.32, friction: 0.4, frictionAir: 0.005, density: 0.003 }
          // The main pit's own bowl figures, PackPit line 397. frictionAir 0.012
          // rides on the compound body itself, below, exactly as it does there.
          : kind === "bowl" ? { restitution: 0.3, friction: 0.3, density: 0.006 }
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
            : kind === "bone"
              ? (() => {
                  // Two end lobes and a shaft, the main pit's construction
                  // scaled to this pit's pixels. Its artboard is 205 x 100 with
                  // the lobes centred at x 25 and 180, radius 38, and a shaft
                  // 130 x 28 through the middle: PackPit lines 406 to 412.
                  const k4 = dia / 205;
                  const lobe = 38 * k4;
                  const parts = [
                    Bodies.circle(px + (25 - 102.5) * k4, py, lobe, opts),
                    Bodies.circle(px + (180 - 102.5) * k4, py, lobe, opts),
                    Bodies.rectangle(px, py, 130 * k4, 28 * k4, { ...opts, chamfer: { radius: 14 * k4 } }),
                  ];
                  const body = MBody.create({ parts, ...opts });
                  MBody.setAngle(body, (Math.random() - 0.5) * 0.6);
                  /* THE BONE SHARES THE LOGO'S GROUP, SO THE TWO PASS THROUGH
                     EACH OTHER. Without this the fuse cannot close, and it is
                     not a tuning problem: the snap distance is measured CENTRE
                     TO CENTRE, but collision holds the two apart by roughly half
                     the logo's collider plus half the bone's. On an iPhone XR
                     that is about 95px against a 37px snap. Impossible.

                     It looked mobile-only because desktop has a much larger
                     snap, about 86px, and a drag constraint can shove one body
                     that far into another before the solver pushes back. The
                     bug was always here.

                     The main pit does exactly this and says why, PackPit.tsx:541:
                     "logo + bones share this negative group so they pass through
                     each other (to fuse)".

                     A negative group only affects pairs INSIDE it, so the bone
                     still collides with dogs, chips, chums and every other toy.
                     KNOWN TRADE-OFF: LOGO_GROUP also holds the logo's dropped
                     pieces, so the bone now passes through those too. They are
                     small debris and it is not worth a second group to keep. */
                  body.collisionFilter = { ...(body.collisionFilter || {}), group: LOGO_GROUP };
                  return body;
                })()
            : kind === "bowl"
              ? (() => {
                  /* THE COMPOUND BOWL, PackPit.tsx:392 to 405 scaled to this
                     pit's pixels. Four parts against the artwork's own
                     1031.7 x 316.8 artboard: a floor, a centre bump and two
                     walls leaning in at 0.349 radians, which is 20 degrees.

                     A PLAIN RECTANGLE WOULD BE A CLOSED BOX. Objects would rest
                     on top of the bowl instead of falling into it, which is the
                     whole point of the object. */
                  const bk = dia / BOWL_VB_W;
                  const bcx = BOWL_VB_W / 2, bcy = BOWL_VB_H / 2;
                  const bR = (vx: number, vy: number, w: number, h: number) =>
                    Bodies.rectangle(px + (vx - bcx) * bk, py + (vy - bcy) * bk, w * bk, h * bk, opts);
                  const parts = [
                    bR(515, 295, 820, 30),  // floor
                    bR(515, 265, 120, 80),  // centre bump
                    Bodies.rectangle(px + (90 - bcx) * bk, py + (150 - bcy) * bk, 18 * bk, 230 * bk, { ...opts, angle: 0.349 }),
                    Bodies.rectangle(px + (940 - bcx) * bk, py + (150 - bcy) * bk, 18 * bk, 230 * bk, { ...opts, angle: -0.349 }),
                  ];
                  const body = MBody.create({ parts, ...opts, frictionAir: 0.012 });
                  MBody.setAngle(body, (BOWL_DROP_DEG * Math.PI) / 180);
                  return body;
                })()
            : kind === "rock"
              ? Bodies.polygon(px, py, 7, r, { ...opts, chamfer: { radius: r * 0.12 } })
              : kind === "cookies"
                ? Bodies.rectangle(px, py, dia, hgt, { ...opts, chamfer: { radius: hgt * 0.16 } })
              /* The era props are all oblongs rather than balls, so each gets a
                 chamfered rectangle at its own drawn proportions. A circle would
                 roll a newspaper down the slope like a barrel, and it would put
                 a fork's body miles outside its handle. */
              : kind === "newspaper" || kind === "fork" || kind === "shoe"
                ? (() => {
                    const b = Bodies.rectangle(px, py, dia, hgt, { ...opts, chamfer: { radius: Math.min(dia, hgt) * 0.22 } });
                    /* The newspaper and the shoe drop near upright, a few
                       degrees either side of vertical so the pair leans apart.
                       The fork keeps a random tilt: it is small enough that a
                       fixed angle would read as a repeat. */
                    const deg =
                      kind === "newspaper" ? TOY_NEWSPAPER_DEG
                      : kind === "shoe" ? TOY_SHOE_DEG
                      : null;
                    MBody.setAngle(b, deg === null ? (Math.random() - 0.5) * 0.9 : (deg * Math.PI) / 180);
                    return b;
                  })()
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
        if (kind === "cookies") cookiesIdxRef.current = idx;
        setToyList((l) => [...l, {
          kind, size: dia * fxScale, h: hgt * fxScale, src: TOY_SRC[kind],
          filter: kind === "ballPink"
            ? BALL_PINK_FILTER[Math.min(pinkThrows(), BALL_PINK_FILTER.length - 1)]
            : undefined,
        }]);
        wake();
      };
      // Tennis ball escape, ported from the main pit: a ball RELEASED with real
      // upward speed and then leaving the top of the stage is gone for good.
      // A ball merely bounced upward by physics comes back down as normal.
      let thrownBall: any = null;
      throwWatchRef.current = (pr: any) => {
        // the flag leaves by having its message read, badges are not in scope
        if (pr?.toyKind !== "ball" && pr?.toyKind !== "stick" && pr?.toyKind !== "rock" && pr?.toyKind !== "ballPink") return;
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
          if (pr.toyKind === "ballPink") {
            // Three lives, not one. Each throw drains more colour out of it, and
            // it is tipped back in a beat later until the last one.
            const spent = pinkThrows() + 1;
            setPinkThrows(spent);
            killProp(pr, "toy", performance.now());
            /* retireToyForEra -> retireToy, 2 September 2026. This line does NOT
               go through ERA_SCOPED_TOYS, so emptying that array would have left
               it writing an era string while the spawn guard below had switched
               to looking for "1". The two would never have matched and the pink
               ball would have returned for ever. */
            if (spent >= BALL_PINK_LIVES) retireToy(TOY_BALL_PINK_GONE_KEY);
            else toyTimers.push(window.setTimeout(() => spawnToy("ballPink"), BALL_PINK_BACK));
            return;
          }
          if (ERA_SCOPED_TOYS.includes(pr.toyKind)) retireToyForEra(TOY_GONE_KEY[pr.toyKind as ToyKind], era);
          else retireToy(TOY_GONE_KEY[pr.toyKind as ToyKind]);
          killProp(pr, "toy", performance.now());
        }
      };
      /* COLLECTING A CARD WAKES THE PILE, 14 Sept 2026 (owner: the space a
         collected card leaves is not filled, see the two screenshots).

         WHAT WAS WRONG. This was `Composite.remove` and nothing else. Matter
         does not notify a body's contacts when the body under them is taken
         out of the world, and `enableSleeping` means everything resting on a
         collected card is asleep. A sleeping body is skipped by the solver
         entirely, so the cards above hung exactly where they were and the gap
         stayed open. Late in a level it left a shelf of cards sitting on
         nothing.

         This is NOT the 9 September freeze. That was the rAF loop parking
         mid-round and is fixed; the loop is running throughout. This is per
         body sleeping, which is a different mechanism and the right one to
         keep.

         WHY EVERY BODY AND NOT JUST THE NEIGHBOURS. A card is often held up
         through a chain of two or three others, so a radius around the removed
         one misses exactly the case the screenshots show. Waking the lot
         cannot miss, and it costs a burst of about two seconds before the pit
         settles and sleeps again: measured headless at 30 bodies, 0.069ms per
         step awake against 0.019ms asleep.

         `wake()` is declared further down this same scope and is called here
         only at runtime, from the card's pointer handler, long after doFall
         has finished. It covers the case where the round has already ended and
         the loop has wound itself down. */
      /* CHUM_COLLECT_POINTS used to match the learn area's "Choose as pack chum"
         button at 1000. REBASED TO 750, 18 September 2026 (owner). The green
         button in LineageMap is NOT changed with it: that component is rendered
         by both pits, so its 1000 plus 100 a frame is the main pit's figure too
         and is the owner's call on its own. The position comes from the bridge,
         which still holds the card's last world coordinates after its body
         leaves the world, so it flashes where the card actually was.
         The chain multiplier reads this constant, so it follows on its own. */
      const CHUM_COLLECT_POINTS = 750;
      chumScoreRef.current = (i: number) => {
        const b = chumBodiesRef.current[i];
        if (!b) return;
        numAt(b.x, b.y, CHUM_COLLECT_POINTS, performance.now());
      };
      /* THE CHAIN MULTIPLIER. Each chum in
         the chain adds CHAIN_MULT_STEP to a multiplier that starts at 1, and it
         applies to the summed value of the chain's chums. collectChum has
         already scored each card its own CHUM_COLLECT_POINTS, so this scores
         only the difference, once, flashed at the last card. */
      /* A circle leaves the pit: its body is
         held, which is what takes it out of the physics world on the next step,
         and it poofs where it stood so it does not simply blink away. The caller
         adds it to the removed set, which is what hides the circle itself. The
         same pair the learn completion has always used. */
      dogCloseRef.current = (n, from) => {
        /* IT GIVES UP ITS BADGES ON THE WAY OUT (owner, 18 September 2026). A
           closed circle used to leave nothing behind, so a chain paid in chips
           only for the one circle the player opened. Now every circle in the
           chain drops the chips it would have dropped had it been opened.

           THE RULE IS popChildren's OWN, copied rather than invented: one chip
           per non-echo child, carrying that child's share. A LEAF has no
           children and would drop nothing at all, which would make the case this
           feature exists for pay the least, so a leaf drops one chip carrying
           its own share instead.

           THEY ALL DROP FROM ONE POINT (owner, 18 September 2026). `from` is the
           circle the player OPENED, passed in by the chain, so a chain pays out
           as one burst from the place the player chose rather than as several
           piles where each closed circle happened to be standing. The number of
           chips is unchanged; only where they appear has moved.

           WITHOUT `from` a circle still drops where it stands. That is the
           fallback if the opened circle cannot be located, and it is what any
           future non-chain caller gets.

           THE POOF DOES NOT MOVE WITH THEM. That is this circle leaving the pit,
           and it belongs where the circle was.

           spawnBadge takes client pixels, which is what pxFromWorld is for. */
        const src = from ?? { x: n.x, y: n.y };
        const p = pxFromWorld(src.x, src.y);
        /* A LITTLE SPREAD, or six chips would spawn as one stack and the solver
           would have to blow them apart on the first step. A random angle with a
           sqrt(random) radius fills the disc evenly instead of bunching at the
           middle. Fresh per chip, so two circles closing into the same point
           still read as one scatter rather than two rings. */
        const at = () => {
          const a2 = Math.random() * Math.PI * 2;
          const rad = DOG_CHAIN_CHIP_SPREAD_PX * Math.sqrt(Math.random());
          return { x: p.x + Math.cos(a2) * rad, y: p.y + Math.sin(a2) * rad };
        };
        const kids = (n.children ?? []).filter((ch) => !isHiddenCopy(ch));
        if (kids.length) {
          for (const ch of kids) { const q = at(); spawnBadgeRef.current?.(q.x, q.y, chipR, pctOf(ch)); }
        } else {
          const q = at();
          spawnBadgeRef.current?.(q.x, q.y, chipR, pctOf(n));
        }
        /* IT TAKES THE BODY OUT ITSELF (owner, 18 September 2026), rather than
           setting a flag and waiting for a tick that may not come.

           WHAT IT USED TO DO. `b.held = true` and `wake()`, leaving the removal to
           the step loop's `if (b.held && b.mbIn)` branch on the next tick. Three
           things can eat that tick, and one of them is new: the pause added for the
           lift refuses wake() outright, and onRemove fires on the Complete press
           while the lift is STILL UP, so a chain's closed circles sat marked and
           solid for the whole 450ms before onClose. The removal is not something to
           request; it is something to do.

           SO IT IS DONE HERE, the way killChained and the round-won chain already
           do it: Composite.remove, mbIn false, on the spot.

           AND `blown` GOES WITH IT, for the reason pc-1228 exists. The step loop
           re-adds anything matching `!held && !mbIn && !blown`, so a circle whose
           held flag is ever cleared would be put straight back into the world,
           invisible and solid. blown is the one flag that branch cannot argue with.

           THE FLAGS STAY TOO. `held` is still set because other things read it
           (the frame writer's heldHidden, the occupancy test's `held` skip), and
           setting it costs nothing now that the removal no longer depends on it. */
        const b = pitBodiesRef.current?.find(n);
        if (b) {
          b.held = true;
          b.blown = true; // see above: the re-add branch must never take it back
          if (b.mb && b.mbIn) { Composite.remove(world, b.mb); b.mbIn = false; }
        } else if (spinOnRef.current) {
          /* THE ONE SILENT FAILURE, NOW AUDIBLE. `find` is an identity match on the
             node; if it misses, nothing was ever marked and nothing removed, and
             the circle is hidden by removedNodes while its body stays in the pit
             for the rest of the round. There was no else at all here. */
          spinLastChainRef.current = `CLOSE found no body for ${n.data.name}`;
        }
        poofAt(n.x, n.y, performance.now());
        wake();
      };
      // One connection made, paid on the spot and flashed at the card it
      // reached. The bridge holds that card's live world position.
      // The sweep bonus, flashed where the chain started. Its own hook because it
      // carries a value: the join hook always pays CHAIN_JOIN_POINTS.
      chainSweepScoreRef.current = (x: number, y: number, val: number) => {
        numAt(x, y, val, performance.now(), true); // lands on the chain's first circle
      };
      chainJoinScoreRef.current = (x: number, y: number, colour: string, links: number) => {
        const now2 = performance.now();
        numAt(x, y, CHAIN_JOIN_POINTS, now2, true); // a join always lands on a circle
        sparkAt(x, y, colour, links, now2);
      };
      chainBonusRef.current = (cards: number[]) => {
        const sum = cards.length * CHUM_COLLECT_POINTS;
        const mult = 1 + CHAIN_MULT_STEP * cards.length;
        const bonus = Math.round(sum * mult) - sum;
        const b = chumBodiesRef.current[cards[cards.length - 1]];
        if (b && bonus > 0) numAt(b.x, b.y, bonus, performance.now());
        return { sum, mult, bonus };
      };
      removeChumBodyRef.current = (mb) => {
        Composite.remove(world, mb);
        for (const o of Composite.allBodies(world) as { isStatic?: boolean }[]) {
          if (!o.isStatic) wakeBody(o);
        }
        wake();
      };
      killToyRef.current = (idx: number) => {
        const pr = toyBodiesRef.current[idx];
        if (pr && !pr.dead) killProp(pr, "toy", performance.now());
      };
      const armToys = () => {
        if (toyTimers.length) return; // first landing only
        // THE DROP HAS ARRIVED, so the countdown's grace runs from here rather
        // than from the round starting: see PIT_FULL_GRACE_MS. Behind the same
        // first-landing guard as the toys, so it is set once per level.
        cdGraceRef.current = performance.now() + pitFullGraceMs(nodes);
        toyTimers.push(window.setTimeout(() => spawnToy("cookies"), TOY_COOKIES_DELAY));
        // Both tennis balls drop on EVERY level now (2026-08-12). The old
        // first-seven-levels `hideBalls` gate and its no-balls re-timing were
        // removed entirely (see the handover note on the reversal). Ball at
        // TOY_BALL_DELAY, pink after it, and the flag/props time off the ball as
        // they always did with the balls present.
        toyTimers.push(window.setTimeout(() => spawnToy("ball"), TOY_BALL_DELAY));
        toyTimers.push(window.setTimeout(() => spawnToy("ballPink"), TOY_BALL_DELAY + BALL_PINK_GAP));
        const flagAt = TOY_BALL_DELAY + TOY_FLAG_GAP;
        toyTimers.push(window.setTimeout(() => spawnToy("flag"), flagAt));
        const propsAt = flagAt + TOY_PROP_GAP;
        /* THE PROPS SLOT, from the level's theme. An era with no set of its own
           gets the stick, big stick and rock, which is what every era had.
           The first two arrive together and the rest follow at the rock's gap,
           so a set of any length keeps the original rhythm: a pair thumps in,
           then the stragglers land one after another rather than in a heap. */
        /* Most specific wins: this level's own set, then the era's, then the
           pit's default. propsFor does that walk and, unlike levelThemeFor, it
           is NOT gated on THEMES_ENABLED, so a level can have its own toys
           without its backdrop, floor and sky coming back with them. See the
           note above propsFor in data/levelThemes.ts. */
        /* THE MOBILE TABLE WINS. Below 768px a level's toys come from the
           owner's per-level list; above it, nothing changes and the era sets
           apply as before. mobilePropsForLevel takes a ONE BASED level, and
           levelNo is zero based (the pit paints "00" for the first level), so
           the one is added here and nowhere else.
           `??` and not `||`: an empty array from the table means deliberately
           no props, and must not fall through to the default. */
        const narrowPit = window.matchMedia("(max-width: 768px)").matches;
        const mobileSet = narrowPit && levelNo !== undefined ? mobilePropsForLevel(levelNo + 1) : null;
        const themed = propsFor(era, levelName);
        const props: ToyKind[] =
          (mobileSet as ToyKind[] | null) ??
          (themed?.length ? (themed as ToyKind[]) : DEFAULT_PROPS);
        /* SIDES ALTERNATE, AND THE FIRST SIDE ALTERNATES TOO. Each prop lands on
           the opposite side to the one before it, so two can never come down
           together in the same corner, and the whole sequence starts on the
           other side next time a pit arms. */
        const firstLeft = propStartLeft;
        propStartLeft = !propStartLeft;
        /* THE FLOOD'S MIDDLE, worked out rather than guessed. The dogs start at
           chumsAt and arrive one every CHUM_STAGGER, so the halfway point is the
           count times the stagger, halved. A level with more dogs floods for
           longer and the prop waits longer to suit, which a fixed delay could
           never do. If the images are not counted yet, it falls back to the
           front of the flood rather than landing at some invented time. */
        // The rock's beat: the reference for both the flood and the bone.
        const rockAt = propsAt + TOY_ROCK_GAP;
        // The flood is derived from the ROCK's beat (the reference at rockAt),
        // landing at 9.0s (rock 7.5 + bone 0.9 + chum 0.6); the bone lands just
        // before it. rockAt is now only a timing anchor: with rock out of
        // DEFAULT_PROPS nothing spawns on that beat, but the rhythm is unchanged.
        const chumsAt = rockAt + TOY_BONE_GAP + CHUM_GAP;
        const boneAt = rockAt + TOY_BONE_GAP;
        const floodMid = chumsAt + ((chumImagesRef.current?.length ?? 0) * CHUM_STAGGER) / 2;
        props.forEach((kind: ToyKind, i: number) => {
          const at =
            PROPS_IN_FLOOD.includes(kind) ? floodMid
            : i < 2 ? propsAt
            : propsAt + TOY_ROCK_GAP * (i - 1);
          const left = i % 2 === 0 ? firstLeft : !firstLeft;
          toyTimers.push(window.setTimeout(() => spawnToy(kind, left ? -1 : 1), at));
        });
        toyTimers.push(window.setTimeout(() => spawnToy("bone"), boneAt));
        toyTimers.push(window.setTimeout(spawnChums, chumsAt));
      };
      spawnRodRef.current = (x1: number, y1: number, x2: number, y2: number, lit: boolean) => {
        const lenPx = Math.max(10, Math.hypot(x2 - x1, y2 - y1));
        const ang = Math.atan2(y2 - y1, x2 - x1);
        const w = worldFromPx((x1 + x2) / 2, (y1 + y2) / 2);
        const pr = { x: w.x, y: w.y, vx: 0, vy: 0, a: ang, idx: rodBodiesRef.current.length, hits: 0, maxHits: ROD_HITS, mb: null as any };
        const mb = Bodies.rectangle((x1 + x2) / 2, (y1 + y2) / 2, lenPx, 8, { chamfer: { radius: 4 }, restitution: 0.4, friction: 0.1, frictionAir: 0.01, density: 0.001, angle: ang });
        mb.plugin = { prop: pr, kind: "rod" };
        pr.mb = mb;
        Composite.add(world, mb);
        MBody.setVelocity(mb, { x: (Math.random() - 0.5) * 3, y: 3 }); // pit scatter contract
        rodBodiesRef.current.push(pr);
        setRodList((l) => [...l, { len: lenPx * fxScale, h: 8 * fxScale, lit }]);
        wake();
      };
      // Tapping the cookie panel squeezes an Accept and a Reject out of it, which
      // is the main pit's sequence. Reject is added first so Accept, added last,
      // renders in front of it.
      cookieBtnsRef.current = (px: number, py: number) => {
        if (btnBodiesRef.current.length) return; // one pair only
        const mk = (label: string, tone: string, grow: number, vx: number) => {
          const rw = BIGT * 2.6 * grow, rh = BIGT * 1.0 * grow;
          const w = worldFromPx(px, py);
          const pr: PropBody = { x: w.x, y: w.y, vx: 0, vy: 0, a: 0, idx: btnBodiesRef.current.length, hits: 0, maxHits: 9999 };
          const mb = Bodies.rectangle(px, py, rw, rh, { chamfer: { radius: rh * 0.34 }, restitution: 0.25, friction: 0.4, frictionAir: 0.012, density: 0.004 });
          mb.plugin = { prop: pr, kind: "btn" };
          pr.mb = mb;
          Composite.add(world, mb);
          MBody.setVelocity(mb, { x: vx, y: -9 }); // pops up and apart
          MBody.setAngularVelocity(mb, (Math.random() - 0.5) * 0.4);
          btnBodiesRef.current.push(pr);
          // The main pit's keyline is a flat 5 canvas px, not a fraction of the
          // button, so it converts through the same px-to-svg scale the sizes do.
          setBtnList((l) => [...l, { label, tone, w: rw * fxScale, h: rh * fxScale, sw: 5 * fxScale }]);
        };
        mk("Reject", "#d64545", 1, 2 + Math.random() * 4);
        mk("Accept", "#4ade80", 1.33, -2 - Math.random() * 4); // the main pit makes Accept 33% larger
        wake();
      };
      cookieAnswerRef.current = (i: number, accept: boolean) => {
        const pr = btnBodiesRef.current[i];
        if (!pr?.mb) return;
        const now2 = performance.now();
        const bx = pr.mb.position.x, by = pr.mb.position.y;
        const sz = Math.max(pr.mb.bounds.max.y - pr.mb.bounds.min.y, 20) * (accept ? 1.7 : 1.6);
        fx.pushBurst({ x: bx, y: by, s: sz, born: now2, life: accept ? 480 : 460, colour: accept ? "#ff2d78" : "#0c5b92", rot: 0 });
        fx.pushBurst({ x: bx, y: by, s: sz * 0.66, born: now2, life: accept ? 480 : 460, colour: accept ? "#ffd23e" : "#9a9a9a", rot: 18 });
        fxKickRef.current?.();
        if (accept) numAt(pr.x, pr.y, 2000, now2); // the main pit's reward for saying yes
        try { localStorage.setItem(COOKIE_CONSENT_KEY, accept ? "accepted" : "declined"); } catch { /* private mode */ }
        window.dispatchEvent(new Event(accept ? "pc:cookies-accepted" : "pc:cookies-rejected"));
        cookieClearRef.current?.();
      };
      // The question has been answered, so everything asking it leaves: both
      // buttons AND the panel they came out of. The panel used to stay sitting
      // in the pit, because retiring a toy only stops it coming back next time.
      // Routed through a ref so it fires whichever way consent arrived, the pit
      // buttons or the notice itself.
      cookieClearRef.current = () => {
        const gone = new Set<number>();
        btnBodiesRef.current.forEach((b, j) => {
          if (!b?.mb) return;
          Composite.remove(world, b.mb);
          gone.add(j);
        });
        if (gone.size) setDeadBtns((p) => new Set([...p, ...gone]));
        const ci = cookiesIdxRef.current;
        if (ci !== null) { cookiesIdxRef.current = null; killToyRef.current?.(ci); }
        wake();
      };
      spawnPillRef.current = (sx: number, sy: number, wPx: number, name: string) => {
        const w = worldFromPx(sx, sy);
        // wrap long names: pill grows in depth, corner radius stays 13px so the
        // capsule shape never changes; width hugs the longest line at 12px text.
        // Padding is DELIBERATE and tuned tight: +14px on the width (7 each side,
        // down from +22 / 11) and 22 / 40px height (down from 26 / 46), so the
        // pill hugs its text. The max(44) floor and the +10 two-line extra are
        // kept on purpose. Both pw and ph feed the physics body (Bodies.rectangle
        // below) AND the drawn rect (via setPillList), so never re-tune one number
        // without the other, or the collision shape and the picture drift apart.
        const lines = splitName(name);
        /* THE PIT PILL MATCHES THE LIFTED ONE, 2 September 2026 (owner).

           They were never different by design: LineageMap's nodePillWidth is the
           SAME formula, max(44, len * 7.4 + 14 + 10 if wrapped), with the same
           40 / 22 heights. The pit only looked bigger because the whole lifted
           layer carries a scale(0.8), so a pit pill was drawn 1.25 times the
           lifted one.

           0.72 is that 0.8 times the 0.9 the lifted pill has just taken, so the
           two now come out the same size on screen. IF EITHER OF THOSE TWO
           NUMBERS MOVES, this one has to move with it.

           0.72 TO 0.612, 18 September 2026 (owner: the pit pill reads about 15%
           too big against the lifted one). 0.72 less 15%.

           THE TWO DO NOT SHARE A CONSTANT, and that is the first thing to know
           before touching either. They are two formulas with two scales:
             LIFTED  nodePillWidth = max(58, len*7.4 + 28 + (2 lines ? 10 : 0)),
                     drawn inside a group at PIT_PILL_SCALE 0.683, and the whole
                     layer is then drawn at LIFT_K 0.8. So on screen it is
                     nodePillWidth * 0.5464.
             PIT     this one, re-measured from the name rather than taken from
                     the scatter's `w`: max(44, len*7.4 + 14 + (2 lines ? 10 : 0))
                     times PILL_K. fxScale converts to svg units and cancels
                     against the stage transform, so PILL_K's product IS the
                     on-screen width in client px.
           Changing PILL_K therefore cannot move the lifted pill, and nothing
           here reads PIT_PILL_SCALE.

           WHY 0.72 NO LONGER MATCHED. The note above was calibrated against a
           0.9 the lifted pill has since left behind: PIT_PILL_SCALE is 0.683
           now, so 0.683 * 0.8 is 0.5464 against this 0.72.

           WHAT IT LANDS ON, measured rather than estimated. A 14 character name
           on one line: lifted 71.9px on screen, pit 84.7 at 0.72, which is 18%
           over and matches the owner's eye; at 0.612 the pit is 72.0, parity.

           THE RATIO IS NOT FLAT, because the two formulas add 14 and 28. The pit
           runs 11% over at 8 characters, 18% at 14 and 24% at 30, so one
           multiplier cannot match every length. 15% lands parity at about 13
           characters, a little under on long names and a little over on short.

           THE HEIGHT IS A SEPARATE STORY. Both use the same 40 or 22, so their
           ratio is purely the two scales, 0.72 against 0.5464, a flat 32% over.
           15% leaves it about 12% proud. Exact parity on BOTH would be a PILL_K
           of 0.5464, a 24% cut, which is not what was asked for and is recorded
           here rather than taken.

           `unit` reads PILL_K too, so the text comes down with the pill and
           cannot overflow it. */
        const PILL_K = 0.612;
        const pw = Math.max(44, Math.max(...lines.map((l) => l.length)) * 7.4 + 14 + (lines.length > 1 ? 10 : 0)) * PILL_K;
        const ph = (lines.length > 1 ? 40 : 22) * PILL_K;
        const pr = { x: w.x, y: w.y, vx: 0, vy: 0, a: 0, idx: pillBodiesRef.current.length, hits: 0, maxHits: PILL_HITS, mb: null as any };
        const mb = Bodies.rectangle(sx, sy, pw, ph, { chamfer: { radius: ph / 2 }, restitution: 0.3, friction: 0.1, frictionAir: 0.012, density: 0.0012 });
        mb.plugin = { prop: pr, kind: "pill" };
        pr.mb = mb;
        Composite.add(world, mb);
        MBody.setVelocity(mb, { x: (Math.random() - 0.5) * 3, y: 3 });
        pillBodiesRef.current.push(pr);
        // `unit` is the pill's text-sizing base (13px scaled), used below for the
        // stroke width, the two-line text offset and the font size. It is NOT the
        // corner radius: the drawn rect rounds by pl.h / 2 (a full capsule), so
        // this number never touches the corners despite its old name `rx`.
        // `unit` carries PILL_K too, or the text would stay full size inside a
        // pill that has shrunk and immediately overflow it.
        setPillList((l) => [...l, { lines, w: pw * fxScale, h: ph * fxScale, unit: 13 * PILL_K * fxScale }]);
        wake();
      };
      // opts is how a chip says it is not the plain pit-sized one: its own
      // radius, a breed name in place of a percentage, its own charge count, the
      // learnt lemon fill, or noBomb to stand outside the bomb roll.
      spawnBadgeRef.current = (
        sx: number,
        sy: number,
        rPx: number,
        pctVal: number,
        opts?: { r?: number; label?: string; charges?: number; green?: boolean; noBomb?: boolean }
      ) => {
        // client px in, which is the physics space itself now
        const bl = badgeBodiesRef.current;
        if (!bl) return;
        const w = worldFromPx(sx, sy);
        // A solo dog circle (opts.label) brings its own full radius. A percentage
        // chip is sized off the PIT'S dog scale, not the small card chip it arrived
        // on (opts.r): pitPer is the pit's drawn badge radius per unit of the share
        // curve, read from the live depth-1 dogs (n.r * kD, viewBox), so a chip of
        // share s lands at the badge a native pit dog of that share would carry.
        // All in viewBox units, the same space as chipFloor, so the cutoff compares
        // like for like; shows nothing only if even that pit-sized disc is under it.
        /* shareOf, pitD1, pitPer and chipBadge were here: the average-depth-1-dog
           size a chip took when it arrived with no radius. Gone with CHIP_R_PX. */
        /* THE CHIP KEEPS THE SIZE IT HAD ON THE LIFTED LAYER, 15 September 2026
           (owner). REVERTED the same day to the plain drop-time conversion.

           WHAT c.r ACTUALLY IS. LineageMap sends r: nodeR(share), which is
           radius(share) * PIT_NODE_SCALE, so max(21, 5*sqrt(share)) * 0.78. A
           constant derived from the share alone, in CSS px, that never moves with
           any zoom. A 50% circle is always 27.6px on the lifted layer.

           WHY THE LIVE-ZOOM VERSION WAS TAKEN OUT. It multiplied c.r by the ratio
           of the live viewBox to the drop-time one. But doFall runs at the start
           of the round, just after zoomTo(rootV), so fxScale is ALREADY the
           conversion at the pit's resting zoom, which is the view the pit plays
           at. At the moment of the scatter the view is zoomed in on the lifted
           card, so that ratio was above 1 and pushed the chip up.

           NOT YET PROVEN. Two attempts at this have been wrong and screenshots
           taken at two different zooms cannot separate a wrong chip size from a
           different view. See the ?chipdebug=1 readout, which prints the chip's
           real on-screen radius against the 27.6px the lifted layer drew.

           chipBadge still stands for a chip that arrives with no radius of its
           own, which is the popped and seeded path. */
        /* THE CHIP KEEPS THE SIZE IT HAD ON THE LIFTED LAYER, 15 September 2026
           (owner). Third attempt, and this one is an inference from measurement
           rather than from reading the render.

           THE EVIDENCE. ?chipdebug=1 printed ctm.a 0.5566 and the same viewBox in
           BOTH the lifted state and the pit, so the stage does not zoom between
           them and every earlier explanation resting on a zoom difference was
           wrong. Its ratio column came out flat across shares: 0.77, 0.77, 0.78
           on three different shares in the first run. A constant across shares
           means one multiplier is missing, not a curve gone wrong. Measured off
           the owner's screenshots, normalised for image width, the 50% disc is
           about 20px on the lifted layer and about 26 in the pit, a ratio of 1.28.
           1 / 0.78 is 1.282.

           WHAT 0.78 IS. PIT_NODE_SCALE in LineageMap. nodeR applies it so that,
           in its own words, the layout, the drawing, the card offsets and the
           scatter all agree. The lifted layer draws its circles shrunk by it. The
           pit does not, so the same circle lands at full size here.

           SO THIS IS A SHRINK, NOT A GROW. Nothing was ever adding size at the
           drop. The lifted layer was subtracting it and the pit was not.

           NOT PROVEN. The diagnostic still cannot read the drawn radius, because
           the chips render inside a transformed group its conversion skips. If
           this is wrong, the next step is measuring the circle with
           getBoundingClientRect rather than converting anything.

           LineageMap does not export PIT_NODE_SCALE, so the value is written out
           with its source named rather than plumbed through. If that dial ever
           moves, this moves with it. */
        /* ONE SIZE, WHATEVER ARRIVED (owner, 18 September 2026). The three branches
           here sized a chip from three different things: a lifted card's own radius,
           an average depth-1 dog via pctRadius, or nothing at all. dogClose came in
           through the last of those and had its carefully computed radius discarded.
           All of them are now the one constant. Only opts.label is untouched: that
           is a solo DOG CIRCLE arriving with its full radius, not a chip. */
        const rDraw = opts?.label ? (opts?.r ?? 0) : CHIP_R_PX * fxScale;
        /* TWO CHIPS STAND OUTSIDE THE BOMB ROLL. A labelled circle, because it is
           a whole breed rather than a chip, and any caller that asks for noBomb.
           The solo leaf uses the second: it now drops an ordinary percentage
           chip, so the label no longer speaks for it, but it is still never a
           bomb. */
        const isBomb = !opts?.label && !opts?.noBomb && rollBomb();
        const nb: Body = { n: null, x: w.x, y: w.y, vx: 0, vy: 0, rDraw, r: rDraw / kD, pct: pctVal, idx: bl.length, lastFx: 0, popped: true, a: 0, va: 0, ia: 0, iva: 0, charges: opts?.charges ?? (opts?.green ? 20 : 10), green: opts?.green, bomb: isBomb };
        bl.push(nb);
        all.push(nb);
        const mb = mkCircle(nb, "badge", BADGE_OPTS);
        MBody.setVelocity(mb, { x: (Math.random() - 0.5) * 3, y: 3 }); // pit scatter contract, verbatim
        /* A chip scattered in from the learn layer has no circle in this pit to
           come from, so its slot is null. The slot still has to exist or the two
           lists stop lining up. */
        badgeSrcRef.current.push(null);
        setBadgePcts((l) => [...l, { pct: pctVal, r: rDraw, label: opts?.label, bomb: isBomb, green: opts?.green }]);
        wake();
      };

      // little white numbers that flash up on a hit, copied from PackPit:
      // 650ms life, alpha 1-t, rising 22 + t*34, weight 400, --font-pct
      const numbers: { el: SVGTextElement; x: number; y: number; born: number }[] = [];
      const pctFont = (getComputedStyle(document.documentElement).getPropertyValue("--font-pct").trim() || "Montserrat");
      /* `cased` IS OPT-IN, AND IT DEFAULTS TO OFF (owner, 18 September 2026).

         WHAT WENT WRONG IN 1230. The casing was written straight into numAt, so
         every caller took it: the blast's 250, the 12 a chip, the 2000 for
         accepting the cookies, the chum collect, the fuse. None of them needed
         it. They land on the pit floor, where plain white already reads 11.96,
         and the owner had not asked for their style to be touched.

         THE SIZE NEVER MOVED. fontSize is 15 * fxScale now exactly as it was.
         What changed was WEIGHT: an SVG stroke is centred on the glyph outline,
         so a 3px casing laid about 1.5px of extra ink on every edge and the
         numbers read heavier and therefore larger. Taking the stroke off puts
         them back precisely, with nothing else to restore.

         ONLY THE CHAIN PASSES TRUE, because only the chain's numbers land on a
         circle rather than on the floor. */
      const numAt = (x: number, y: number, val: number, now: number, cased = false) => {
        const fx = fxRef.current;
        if (!fx) return;
        const el = document.createElementNS("http://www.w3.org/2000/svg", "text");
        el.textContent = String(val);
        el.setAttribute("text-anchor", "middle");
        el.style.fontFamily = pctFont + ", system-ui, sans-serif";
        el.style.fontWeight = "400";
        el.style.fontSize = `${15 * fxScale}px`;
        el.style.fill = "#ffffff";
        if (cased) {
          // Painted BEFORE the fill so the white core keeps its full weight
          // rather than being eaten from both sides. See FX_NUM_CASING.
          el.style.stroke = FX_NUM_CASING;
          el.style.strokeWidth = `${FX_NUM_CASING_K * fxScale}px`;
          el.style.strokeLinejoin = "round";
          el.setAttribute("paint-order", "stroke");
        }
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
      /* THE FUSE GOO, the main pit's recipe INCLUDING THE PAINT.
         Spawn is PackPit.tsx:1039, paint is PackPit.tsx:2065, and the paint is
         the half that makes it read as goo rather than as nine dots:

           - a RADIAL GRADIENT, not a flat circle. Opaque white at the centre,
             70% at 0.6 of the radius, transparent at the rim, so each blob has
             a soft edge.
           - it SWELLS then closes: 0.6 + sin(t * PI) * 0.8, so it reaches about
             1.4 times its size halfway through and shrinks back.
           - alpha (1 - t) * 0.9, so it never starts fully solid.
           - drawn ADDITIVELY. The canvas uses globalCompositeOperation
             "lighter"; the SVG equivalent is mix-blend-mode: screen on the
             group. This is the important one: nine overlapping soft blobs
             reinforcing each other is what merges them into one moving mass.

         My first attempt ported the spawn and left the paint, which gave nine
         hard-edged circles fading linearly at a fixed size. Same positions,
         same timing, nothing like the same effect.

         It cannot ride on `parts` above: that loop has one fixed radius and a
         straight fade, and cannot express a swell or a blend mode. Hence its
         own list and its own step in drawNumbers. */
      type Goo = { el: SVGCircleElement; x: number; y: number; s: number; born: number; life: number };
      const goo: Goo[] = [];
      let gooLayer: SVGGElement | null = null;
      const GOO_GRAD_ID = "bt-goo-grad";
      const ensureGooLayer = (): SVGGElement | null => {
        const fx = fxRef.current;
        if (!fx) return null;
        if (gooLayer && gooLayer.isConnected) return gooLayer;
        const NS = "http://www.w3.org/2000/svg";
        // One gradient, shared by every blob, built once and left in place.
        if (!fx.querySelector(`#${GOO_GRAD_ID}`)) {
          const defs = document.createElementNS(NS, "defs");
          const grad = document.createElementNS(NS, "radialGradient");
          grad.setAttribute("id", GOO_GRAD_ID);
          for (const [off, op] of [["0", "1"], ["0.6", "0.7"], ["1", "0"]] as [string, string][]) {
            const stop = document.createElementNS(NS, "stop");
            stop.setAttribute("offset", off);
            stop.setAttribute("stop-color", "#ffffff");
            stop.setAttribute("stop-opacity", op);
            grad.appendChild(stop);
          }
          defs.appendChild(grad);
          fx.appendChild(defs);
        }
        gooLayer = document.createElementNS(NS, "g");
        gooLayer.style.mixBlendMode = "screen"; // the canvas's "lighter"
        gooLayer.style.pointerEvents = "none";
        fx.appendChild(gooLayer);
        return gooLayer;
      };
      const gooAt = (x: number, y: number, now: number, rPx: number) => {
        const layer = ensureGooLayer();
        if (!layer) return;
        const rWorld = rPx / pxPerWorld;
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * Math.PI * 2;
          const off = i === 0 ? 0 : rWorld * (0.25 + Math.random() * 0.5);
          const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          el.setAttribute("fill", `url(#${GOO_GRAD_ID})`);
          el.style.pointerEvents = "none";
          layer.appendChild(el);
          goo.push({
            el,
            x: x + Math.cos(a) * off,
            y: y + Math.sin(a) * off,
            s: rPx * (0.5 + Math.random() * 0.5) * fxScale,
            born: now + i * 12, // the stagger, verbatim
            life: 620,
          });
        }
      };
      const stepGoo = (now: number, view: View) => {
        if (goo.length === 0) return;
        const kk = SIZE / view[2];
        for (let i = goo.length - 1; i >= 0; i--) {
          const g = goo[i];
          const t = (now - g.born) / g.life;
          if (t < 0) { g.el.style.opacity = "0"; continue; } // not born yet
          if (t >= 1) { g.el.remove(); goo.splice(i, 1); continue; }
          const swell = 0.6 + Math.sin(Math.min(t, 1) * Math.PI) * 0.8;
          g.el.setAttribute("r", String(g.s * swell));
          g.el.setAttribute("cx", String((g.x - view[0]) * kk));
          g.el.setAttribute("cy", String((g.y - view[1]) * kk));
          g.el.style.opacity = String((1 - t) * 0.9);
        }
        // The layer is only there to carry the blend mode, so it goes with them.
        if (goo.length === 0 && gooLayer) { gooLayer.remove(); gooLayer = null; }
      };
      const drawNumbers = (now: number, view: View) => {
        const kk = SIZE / view[2];
        stepGoo(now, view);
        stepSparks(now, view);
        for (let i = parts.length - 1; i >= 0; i--) {
          const pp = parts[i];
          const t = (now - pp.born) / pp.life;
          if (t >= 1) { pp.el.remove(); parts.splice(i, 1); continue; }
          // A part may be born in the FUTURE. The goo staggers its blobs 12ms
          // apart, and without this they would all show at once at full
          // strength, because a negative t reads as an opacity above 1.
          if (t < 0) {
            pp.el.setAttribute("cx", String((pp.x - view[0]) * kk));
            pp.el.setAttribute("cy", String((pp.y - view[1]) * kk));
            pp.el.style.opacity = "0";
            continue;
          }
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
      /* THE SPARKS RIDE THEIR OWN LIST, not `parts` above. That loop is circles:
         one radius, one straight fade, cx/cy per frame. A streak needs two ends,
         a length that shortens as it dies and a direction taken from its own
         travel, so it gets its own array and its own step, exactly as the goo
         does and for the same reason. */
      type Spark = { el: SVGLineElement; x: number; y: number; vx: number; vy: number; len: number; born: number; life: number };
      const sparks: Spark[] = [];
      const sparkAt = (x: number, y: number, colour: string, links: number, now2: number) => {
        const fx2 = fxRef.current;
        if (!fx2) return;
        // Grows with the chain, then stops dead at the cap. See SPARK_MAX.
        const n = Math.min(SPARK_MAX, Math.round(SPARK_BASE + links * SPARK_STEP));
        // A later link also throws a little further and a little longer, so the
        // burst reads as building even after the COUNT has hit its ceiling.
        const grow = 1 + Math.min(links, 12) * SPARK_GROW_K;
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2;
          const sp = (0.6 + Math.random() * 1.8) * 60 * fxScale * grow;
          const el = document.createElementNS("http://www.w3.org/2000/svg", "line");
          el.setAttribute("stroke", colour);
          // Thickens with the chain, not flat: see SPARK_WIDTH_K.
          el.setAttribute("stroke-width", String(1.6 * (1 + Math.min(links, 12) * SPARK_WIDTH_K) * fxScale));
          el.setAttribute("stroke-linecap", "round");
          el.style.pointerEvents = "none";
          fx2.appendChild(el);
          sparks.push({
            el, x, y,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp - 20 * fxScale, // a shade upward, like the poof
            len: (4 + Math.random() * 5) * fxScale * grow,
            born: now2,
            life: SPARK_LIFE_MS * (0.7 + Math.random() * 0.6),
          });
        }
      };
      const stepSparks = (now: number, view: View) => {
        if (sparks.length === 0) return;
        const kk = SIZE / view[2];
        for (let i = sparks.length - 1; i >= 0; i--) {
          const sk = sparks[i];
          const t = (now - sk.born) / sk.life;
          if (t >= 1) { sk.el.remove(); sparks.splice(i, 1); continue; }
          sk.x += sk.vx / 60;
          sk.y += sk.vy / 60;
          sk.vy += 3.2 * fxScale; // a little weight, so they arc rather than fly flat
          const px2 = (sk.x - view[0]) * kk, py2 = (sk.y - view[1]) * kk;
          const sp = Math.hypot(sk.vx, sk.vy) || 1;
          // The streak lies along its own travel and shortens as it dies, so it
          // reads as motion rather than as a scatter of sticks.
          const len = sk.len * (1 - t);
          sk.el.setAttribute("x1", String(px2));
          sk.el.setAttribute("y1", String(py2));
          sk.el.setAttribute("x2", String(px2 - (sk.vx / sp) * len));
          sk.el.setAttribute("y2", String(py2 - (sk.vy / sp) * len));
          sk.el.style.opacity = String(1 - t);
        }
      };
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
      /* ---- ITEM 17: INERT CHIPS TURN STICKY AND JOIN ON CONTACT ------------
         Owner, 14 Sept 2026. Spec settled the same day: inert sticks to inert
         ONLY. A live chip, a dog circle, a toy or a chum is never welded into a
         dead lump, because a live object glued into one cannot be played.

         BONDS ARE REAL MATTER CONSTRAINTS. Matter has no weld, so a pair is
         held by one distance constraint at the rest length the two chips were
         at when they touched. Rotation is deliberately not locked: that needs a
         second offset constraint per pair and doubles the solver work for a
         clump of discs nobody can see spin.

         THE CAP IS 3. Uncapped, a pile of 30 chips made 57 bonds in a headless
         run of this engine. Capped at 2 the chips string out into snakes 525px
         wide instead of clumping, which does not read as sticking at all.
         3 measured closest to the unbonded pile shape at half the bond count.

         THE COST, MEASURED HEADLESS AT 30 CHIPS. A bonded body never sleeps:
         Constraint.postSolveAll wakes anything a constraint pushes on, and
         Constraint.solve has no zero impulse early out, so this is structural
         in matter-js and no stiffness or damping setting avoids it. 0.230ms per
         Engine.update against 0.019ms for the same pile asleep. Accepted by the
         owner with that number in front of him. If it reads as too warm on a
         long session, the escape hatch is BOND_CAP, then parking a settled
         clump static, not tuning the numbers below.

         EVERY REMOVAL MUST CALL dropBonds. Composite.remove takes the body out
         and LEAVES the constraint behind, still referencing it, still solved
         every step. The surviving partner would then be tethered to an
         invisible drifting point. Call sites: killChained, detonate, and the
         escape net, which teleports rather than removes and would otherwise
         snap the partner across the pit. */
      const BOND_CAP = 3;
      const BOND_STIFFNESS = 0.7;
      const BOND_DAMPING = 0.2;
      /* ---- A BOND DOES NOT LAST (owner, 18 September 2026, measured) ----------
         THE READING THAT SETTLED IT, from ?spindiag=1 on a settled pit with
         nothing being dragged:

           pts/s 88.0  bodies 204  awake 161  asleep 43
           chips 128 (inert 109)  bonds 138  KE 31.721  dKE -13.197
           sumW 5.646  maxW 0.3989 on badge #103 bonds 3 spd 2.82

         dKE is firmly NEGATIVE, so nothing is adding energy: the pit sheds 42% of
         its kinetic energy in half a second and is still sitting at 31.7, because
         gravity keeps re-feeding it as the solver pulls bodies out of resting
         contact and they fall back. The clump is not being pushed. It is simply
         never allowed to settle, exactly as the note above predicts.

         WHY A LIFETIME AND NOT A STILLNESS TEST. Releasing a clump once it goes
         still was the obvious fix and it is the wrong one: the worst body was at
         2.82px a step with an angular velocity of 0.4, which is a crawl, not a
         jitter. A threshold low enough to mean "settled" would very likely never
         fire. The bonds prevent the stillness that would release the bonds, and a
         stillness trigger cannot break a deadlock whose symptom is the absence of
         stillness.

         WHY A LIFETIME IS ENOUGH. A bond's only job is to make chips stick WHILE
         THEY ARE MOVING. Once the pile has arranged itself, contact and gravity
         hold the shape, and the bond adds nothing that can be seen: bonds render
         invisible. It costs the one thing that matters, which is sleep.

         SO A BOND IS CUT 2500ms AFTER IT IS MADE, swept twice a second, and the
         chips become ordinary resting discs that enableSleeping can put away. It
         always fires, needs no group tracking, and at rest the bond count tends
         to zero on its own.

         IT RE-BONDS BY ITSELF. Disturb the pile and contacts begin again, which
         is what joinChips listens for, so a clump that is knocked apart sticks
         again with a fresh 2500ms. Nothing has to remember to re-arm it.

         BOND_CAP STAYS AT 3, deliberately. One bond is enough to stop a body
         sleeping, so the cap was never the cause: dropping it to 2 would have
         saved about a fifth of the solver work and changed nothing about the
         never-sleeps property. With bonds expiring, the cap only governs the
         brief moving phase, where 3 is already the measured-best figure.

         WHAT TO WATCH. A chip held at an odd angle by a bond alone can slip when
         the bond is cut. Discs piled under gravity should hold, so the tell is a
         clump that visibly SLUMPS or spreads about two and a half seconds after
         it forms, or a readout showing bonds at zero while KE stays high, which
         would mean the pile is re-arranging rather than settling. If that shows,
         the answer is a longer BOND_LIFE_MS, not a return to permanent bonds. */
      const BOND_LIFE_MS = 2500;
      const BOND_SWEEP_MS = 500;
      let bondSweptAt = 0;
      type Bond = { c: unknown; a: number; b: number; key: string; at: number };
      const bondsOf = new Map<number, Bond[]>();
      const bondedPairs = new Set<string>();
      const bondKey = (ia: number, ib: number) => (ia < ib ? `${ia}:${ib}` : `${ib}:${ia}`);
      const canBond = (x: Body) =>
        !x.n && x.inert && !x.bomb && !x.blown && !!x.mb && x.mbIn === true;
      const joinChips = (x: Body, y: Body) => {
        if (x === y || !canBond(x) || !canBond(y)) return;
        /* LIKE STICKS TO LIKE, 14 Sept 2026 (owner: blue and white were joining
           and should form two separate groups). The two inert fills are drawn
           off `green`: a learnt chip goes inert WHITE, every other chip goes
           inert BLUE. Reading the same flag here means the groups on the floor
           always match the groups on screen, with no second source of truth.
           A blue and a white chip still collide and bounce off each other as
           before. Only the bond is refused. */
        if (!!x.green !== !!y.green) return;
        const key = bondKey(x.idx, y.idx);
        if (bondedPairs.has(key)) return;
        if ((bondsOf.get(x.idx)?.length ?? 0) >= BOND_CAP) return;
        if ((bondsOf.get(y.idx)?.length ?? 0) >= BOND_CAP) return;
        const len = Math.hypot(x.mb.position.x - y.mb.position.x, x.mb.position.y - y.mb.position.y);
        if (!len) return; // dead centre on each other, no direction to hold
        const c = Constraint.create({
          bodyA: x.mb, bodyB: y.mb, length: len,
          stiffness: BOND_STIFFNESS, damping: BOND_DAMPING,
          render: { visible: false },
        });
        // ?nobonds=1 keeps every book below and skips only this: see the flag.
        if (!noBondsOn) Composite.add(world, c);
        if (spinDiagOn) spinMade++;
        const rec: Bond = { c, a: x.idx, b: y.idx, key, at: performance.now() };
        bondedPairs.add(key);
        for (const id of [x.idx, y.idx]) {
          const list = bondsOf.get(id);
          if (list) list.push(rec); else bondsOf.set(id, [rec]);
        }
      };
      /* ONE BOND, CUT. dropBonds below is every bond on one chip, which is what a
         death or a teleport needs; an expiry needs a single record, so the
         teardown lives here and both callers use it. The constraint leaving the
         world is the part that must never be skipped: Composite.remove on the
         BODY leaves the constraint behind, still referencing it and still solved
         every step. Both ends are unhooked, so bondsOf can never keep a record
         the other side has already dropped. */
      const releaseBond = (rec: Bond) => {
        // A no-op under ?nobonds=1, where the constraint was never added: matter
        // filters its list, so removing something absent costs nothing.
        Composite.remove(world, rec.c);
        if (spinDiagOn) spinCut++;
        bondedPairs.delete(rec.key);
        for (const id of [rec.a, rec.b]) {
          const ol = bondsOf.get(id);
          if (!ol) continue;
          const kept = ol.filter((z) => z.key !== rec.key);
          if (kept.length) bondsOf.set(id, kept); else bondsOf.delete(id);
        }
      };
      const dropBonds = (idx: number) => {
        const list = bondsOf.get(idx);
        if (!list) return;
        // Copied, because releaseBond edits the very list being walked.
        for (const rec of [...list]) releaseBond(rec);
        bondsOf.delete(idx);
      };
      /* THE SWEEP. Twice a second, over each bond once rather than once per end,
         which is what `seen` is for: every record sits in TWO lists in bondsOf.
         Cutting is deferred until after the walk so releaseBond is never editing
         the maps the walk is reading. */
      const expireBonds = (now2: number) => {
        if (now2 - bondSweptAt < BOND_SWEEP_MS) return;
        bondSweptAt = now2;
        const seen = new Set<string>();
        const stale: Bond[] = [];
        for (const list of bondsOf.values()) {
          for (const rec of list) {
            if (seen.has(rec.key)) continue;
            seen.add(rec.key);
            if (now2 - rec.at >= BOND_LIFE_MS) stale.push(rec);
          }
        }
        for (const rec of stale) releaseBond(rec);
      };
      /* THE MOMENT A CHIP GOES INERT IT LOOKS AROUND. collisionStart only fires
         when a contact BEGINS, so two chips already resting against each other
         when one of them dies would never bond: the contact started while it
         was still live. This is a one-off sweep at the instant of death, over
         the chips only, with the same touching test the bomb chain uses. */
      const bondOnDeath = (b: Body) => {
        if (!canBond(b)) return;
        const reach = b.r * pxPerWorld;
        for (const o of Composite.allBodies(world) as { isStatic?: boolean; circleRadius?: number; position: { x: number; y: number }; plugin?: { kind?: string; bridge?: Body } }[]) {
          if (o.isStatic || o.plugin?.kind !== "badge") continue;
          const ob = o.plugin.bridge;
          if (!ob || ob === b || !canBond(ob)) continue;
          const gap = Math.hypot(b.mb.position.x - o.position.x, b.mb.position.y - o.position.y);
          if (gap <= reach + (o.circleRadius ?? 0) + 4) joinChips(b, ob);
        }
      };
      // spend is how many of the 20 charges one knock costs. The rock is the
      // heavy one, so it counts for ten ordinary knocks.
      const ROCK_KNOCK = 10;
      const knockBadge = (b: Body, rv: number, now2: number, spend = 1) => {
        // J17: a bomb is outside the charge system, exactly as in the main pit,
        // where onPctHit skips any body with plugin.bomb. Without this a bomb
        // spends its twenty charges, goes inert and the badge group is given
        // pointerEvents none, so it keeps the sprite but stops responding.
        // Object knocks feed the fuse instead, from stage 4.
        if (b.bomb) return;
        if (b.n || b.inert || b.charges === undefined) return; // badges only
        if (rv < 5) return; // pit onPctHit verbatim: a real knock, not a nudge
        if (b.lastKnock && now2 - b.lastKnock < 600) return;
        b.lastKnock = now2;
        b.charges -= spend;
        if (b.charges <= 0) {
          b.inert = true;
          poofAt(b.x, b.y, now2);
          setInertBadges((prev) => new Set(prev).add(b.idx));
          bondOnDeath(b);
        }
      };

      // A hit is a click, or one half second of holding. The last one detonates.
      // Stage 3 ends in a placeholder poof; stage 4 replaces it with the real
      // blast, the shockwave and the chain.
      const hitBomb = (b: Body) => {
        if (!b.bomb || b.blown) return;
        b.hits = (b.hits || 0) + 1;
        if (b.mb) fx.burstAt(b.mb.position.x, b.mb.position.y, radOf(b.mb) * 1.1 * FX_SCALE);
        fxKickRef.current?.();
        wake();
        if ((b.hits || 0) < BOMB_HITS) return;
        detonate(b, pressedBombRef.current === b);
      };
      // Matter itself is untyped here (the pit convention), so this is the shape
      // the blast actually touches. Typed rather than any, to keep the lint
      // baseline where it is.
      type MB = {
        position: { x: number; y: number };
        velocity: { x: number; y: number };
        bounds: { min: { x: number; y: number }; max: { x: number; y: number } };
        circleRadius?: number;
        mass?: number;
        isStatic?: boolean;
        plugin?: { kind?: string; bridge?: Body; prop?: { dead?: boolean; toyKind?: string } };
      };
      // The px radius of any body, circle or not. Rods and pills are rectangles
      // and have no circleRadius, so fall back to the larger half-extent.
      const radOf = (mb: MB) =>
        mb?.circleRadius ?? Math.max(mb.bounds.max.x - mb.bounds.min.x, mb.bounds.max.y - mb.bounds.min.y) / 2;
      /* `deadOut` COLLECTS THE CHIPS THAT DIED rather than each one setting React
         state for itself (18 September 2026, owner). One setDeadBadges per chip
         copied the whole Set and re-rendered the whole badge map, so a chain of n
         chips cost n renders and O(n squared) allocation. With the hop cap lifted
         n is the whole cluster. The caller flushes the array once per wave, so a
         400 chip chain costs 48 state updates instead of 400. Nothing else about
         the kill has changed: the body still leaves the world here, the bonds
         still drop before it goes, and the poof is still per chip. */
      const killChained = (mb: MB, now2: number, deadOut: number[]) => {
        const p = mb.plugin || {};
        if (p.kind === "badge") {
          const br = p.bridge;
          if (!br || br.blown) return 0;
          br.blown = true;
          dropBonds(br.idx); // before the body goes: see the bond block above
          poofAt(br.x, br.y, now2);
          if (br.mb && br.mbIn) { Composite.remove(world, br.mb); br.mbIn = false; }
          deadOut.push(br.idx);
          return 12; // flat score per chip, the main pit's figure
        }
        if (p.kind === "rod" || p.kind === "pill") {
          const pr = p.prop;
          if (!pr || pr.dead) return 0;
          killProp(pr, p.kind, now2);
        }
        return 0;
      };
      // Detonation, ported from the main pit. A contact chain takes out only what
      // is actually touching the bomb, then what touches that, and so on, so
      // anything cut off by a gap is spared. Everything else in range is shoved.
      // The pop-art blast itself is stage 5, on the canvas.
      const detonate = (b: Body, wasHeld: boolean) => {
        if (b.blown) return;
        b.blown = true;
        b.bursting = performance.now();
        if (pressedBombRef.current === b) pressedBombRef.current = null;
        const bombMb = b.mb as MB;
        if (!bombMb) return;
        const bx = bombMb.position.x, by = bombMb.position.y;
        const bsz = radOf(bombMb) * (1 + (b.pct || 0) / 25); // a bigger figure, a bigger boom
        wake();
        toyTimers.push(window.setTimeout(() => {
          const now2 = performance.now();
          fx.pushBoom(bx, by, bsz * 2.2 * FX_SCALE); // the pop-art comic blast
          fxKickRef.current?.();
          numAt(b.x, b.y, 250, now2);
          if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(wasHeld ? [25, 20, 200] : [20, 15, 120]);
          if (b.mbIn) { dropBonds(b.idx); Composite.remove(world, bombMb); b.mbIn = false; }
          setDeadBadges((q) => new Set(q).add(b.idx));
          const live = (Composite.allBodies(world) as MB[]).filter((o) => !o.isStatic && o !== bombMb);
          const touch = (m1: MB, m2: MB) =>
            Math.hypot(m1.position.x - m2.position.x, m1.position.y - m2.position.y) <= radOf(m1) + radOf(m2) + BOMB_TOUCH_SLACK_PX;
          // What the fill can DESTROY. Unchanged: live chips that are not
          // themselves bombs, plus rods and pills.
          const pool = live.filter((o) => {
            const k2 = o.plugin?.kind;
            if (k2 === "badge") return !o.plugin?.bridge?.bomb && !o.plugin?.bridge?.blown;
            return k2 === "rod" || k2 === "pill";
          });
          /* WHAT THE FILL CAN CONDUCT THROUGH: chips, and only chips
             (18 September 2026, owner). A rod or a pill that the fill reaches is
             destroyed with everything else, but the chain stops there and does
             not spread out of it.

             WHY. radOf is half the LONGEST side for a rectangle, and touch()
             compares centre distance against the sum of the radii, so a 200px rod
             reads as a 100px disc: it would have linked anything within 100px of
             its centre to anything else within 100px of it. At two hops that
             leaked a little. Unlimited, it is a superconductor, and the blast
             would have crossed the pit whether or not any chips were touching,
             which is the opposite of following a cluster. */
          const conducts = (o: MB) => o.plugin?.kind === "badge";
          const claimed = new Set<MB>();
          let frontier = pool.filter((o) => touch(o, bombMb));
          frontier.forEach((o) => claimed.add(o));
          const chain: MB[] = [];
          let hops = 0;
          while (frontier.length) {
            chain.push(...frontier);
            hops += 1;
            if (hops >= BOMB_CHAIN_HOPS) break;
            // Only the chips in this ring pass the blast on. A ring of nothing
            // but rods and pills is the end of the chain.
            const prev = frontier.filter(conducts);
            if (!prev.length) break;
            frontier = pool.filter((o) => !claimed.has(o) && prev.some((f) => touch(f, o)));
            frontier.forEach((o) => claimed.add(o));
          }
          /* THE CHAIN GOES UP IN WAVES, not one object per tick. See
             BOMB_CHAIN_MAX_MS: at most 48 of them, so a chain of 48 or fewer is
             one object per wave and is exactly what it always was, and a longer
             one shares the same 48 waves out and is still over in 1.2 seconds.
             `chain` is built hop by hop, so a wave is a ring at one distance from
             the bomb rather than a scatter, and the ripple survives the
             compression. */
          const maxWaves = Math.max(1, Math.ceil(BOMB_CHAIN_MAX_MS / BOMB_CHAIN_MS));
          const waveCount = Math.min(chain.length, maxWaves);
          /* ?spindiag=1 : THE BLAST'S OWN NUMBERS, to settle whether a big bomb
             takes a shorter chain or merely compresses a longer one into the same
             48 waves. pct and bsz say how big the bomb was, chain says how much
             it took, waves and per say how it will play out. Written here rather
             than sampled, because a blast is an event and the sampler runs on its
             own clock. Costs one string per detonation and only with the flag. */
          if (spinDiagOn) {
            const per = (chain.length / Math.max(1, waveCount)).toFixed(1);
            spinLastBlast = `BLAST pct ${b.pct || 0}  bsz ${bsz.toFixed(1)}  chain ${chain.length}  waves ${waveCount}  per wave ${per}  ms ${(waveCount * BOMB_CHAIN_MS)}`;
          }
          const waves: MB[][] = Array.from({ length: waveCount }, () => []);
          chain.forEach((o, i) => { waves[Math.floor((i * waveCount) / chain.length)].push(o); });
          waves.forEach((group, w) => {
            toyTimers.push(window.setTimeout(() => {
              const t2 = performance.now();
              // One array for the whole wave, flushed to React once below.
              const dead: number[] = [];
              for (const o of group) {
                fx.explodeAt(o.position.x, o.position.y, radOf(o) * (1 + (o.plugin?.bridge?.pct || 0) / 25) * FX_SCALE);
                const val = killChained(o, t2, dead);
                if (val) {
                  const w2 = worldFromPx(o.position.x, o.position.y);
                  numAt(w2.x, w2.y, val, t2);
                }
              }
              // ONE state update a wave, however many chips went in it, and none
              // at all for a wave that took only rods and pills.
              if (dead.length) setDeadBadges((q) => { const n2 = new Set(q); for (const idx of dead) n2.add(idx); return n2; });
              // Once a wave rather than once an object: it is a screen kick, and
              // firing it eight times in the same millisecond said nothing extra.
              fxKickRef.current?.();
              wake();
            }, BOMB_CHAIN_MS * (w + 1)));
          });
          /* A BOMB CALLS THE PIT-FULL COUNTDOWN OFF (owner, 18 September 2026).

             WHEN, AND WHY NOT AT THE DETONATION. At the moment a bomb goes off not
             one chip has left the world: the waves above remove them over up to
             BOMB_CHAIN_MAX_MS. Cancelling there would promise relief before any
             space existed. This fires after the LAST wave, on the same clock the
             waves use, so the count goes when the room appears.

             EVERY BOMB, EVEN ONE THAT CLEARS NOTHING. Deliberate, and the
             alternative was considered and rejected: gating on computeFull() after
             the chain sounds more honest and produces a rule the player cannot see,
             "why did that bomb not help". A bomb is something they spent and chose.
             A blast that touches nothing has waveCount 0, so this fires at once,
             which is also right.

             STOP ONLY, NO NEW GRACE. cancelCountdown puts its usual 2.5s on
             cdGraceRef and nothing more, so the pit becomes eligible again straight
             after. Restarting PIT_FULL_GRACE_MS would hand a tap 30 to 65 seconds
             of immunity; that grace is a level-start concession, not a reward.

             STRAIGHT TO cancelCountdown, NOT THROUGH checkFull, which would put the
             4s settle-in and the grace guard in front of it and swallow the cancel.
             The chum-collect rescue (tryCancelRef) bypasses them for the same
             reason.

             GUARDED ON A COUNTDOWN ACTUALLY RUNNING, which is not the same as the
             unconditional above: with none running there is nothing to stop, and
             calling in anyway would put 2.5s of grace down for no reason.

             NOT INDEFINITELY AVOIDABLE. Each cancel buys 2.5s plus the count's own
             10s restarting. Bombs roll at 1 / BOMB_ODDS and come from the same pops
             that fill the pit, so stalling costs ground: the supply is coupled to
             the problem. */
          toyTimers.push(window.setTimeout(() => {
            if (!fullTriggeredRef.current) return;
            cancelCountdown(performance.now());
          }, waveCount * BOMB_CHAIN_MS));
          // Shockwave, plus bomb triggers bomb on three tiers: touching goes at
          // once, near takes two hits, far takes one and only if already lit.
          const SHOVE_R = bsz * 5.5;
          // The blast came straight from the main pit, where the cards are far
          // heavier and a shove that size reads as a thump. In the mini pit the
          // same figure cleared the whole floor. Cut to a sixth. The reach is
          // unchanged: it was the force that was wrong, not how far it carried.
          const SHOVE_F = 0.171 * radOf(bombMb); // 0.19, down a tenth by request
          for (const o of live) {
            if (claimed.has(o)) continue;
            const dx = o.position.x - bx, dy = o.position.y - by;
            const dist = Math.hypot(dx, dy) || 1;
            const br2 = o.plugin?.bridge;
            if (br2?.bomb && !br2.blown) {
              const rr = radOf(o) + radOf(bombMb);
              if (dist <= rr + 5) toyTimers.push(window.setTimeout(() => { if (!br2.blown) detonate(br2, false); }, 80));
              else if (dist <= bsz * 2.5) toyTimers.push(window.setTimeout(() => { if (!br2.blown) { hitBomb(br2); if (!br2.blown) hitBomb(br2); } }, 120));
              else if (dist <= SHOVE_R && (br2.hits || 0) >= 1) toyTimers.push(window.setTimeout(() => { if (!br2.blown) hitBomb(br2); }, 160));
              continue; // a bomb is never shoved, only triggered
            }
            if (o.plugin?.kind === "badge") continue; // chips are chained or spared, never pushed
            if (dist > SHOVE_R) continue;
            const fall = 1 - dist / SHOVE_R;
            const k2 = o.plugin?.kind;
            // WEIGHT NOW COUNTS, and this replaces the rock's hand-written
            // divisor with something general.
            //
            // The line below multiplies the force by the object's own mass,
            // which CANCELS the mass, since force is mass times acceleration.
            // Every object was therefore accelerated identically however heavy,
            // which is why the rock flew like a chip and the logs sailed. The
            // term stays, because the rest of the tuning is built on it, and the
            // weight is divided back out here.
            //
            // The bomb is its own reference: a bomb and a chip are the same
            // size, so `mass relative to the bomb` is a fair read of how heavy a
            // thing is without hard-coding a figure per prop. Capped at 12 so
            // nothing becomes completely immovable.
            const heavy = Math.max(1, Math.min(12, (o.mass || 1) / (bombMb.mass || 1)));
            const mult = (k2 === "rod" || k2 === "pill" ? 0.80 : k2 === "circle" ? 0.10 : 0.15) / heavy;
            const mag = SHOVE_F * fall * fall * (o.mass || 1) * mult;
            MBody.applyForce(o, o.position, { x: (dx / dist) * mag, y: (dy / dist) * mag - mag * 0.25 });
            MBody.setAngularVelocity(o, (Math.random() - 0.5) * 0.31 * (fall + 0.2));
            // The ceilings matter more than the force: they decide the worst
            // case, which is what threw things off the top of the screen. 40 and
            // -20 are the main pit's, on bodies several times the mass.
            const spd = Math.hypot(o.velocity.x, o.velocity.y);
            // The ceilings carry the weight too, on a square root so a heavy
            // thing is slowed rather than pinned. These are what actually decide
            // how far anything travels, so leaving them flat would have undone
            // most of the work above.
            const slow = Math.sqrt(heavy);
            const cap = 16 / slow;
            if (spd > cap) { const sc2 = cap / spd; MBody.setVelocity(o, { x: o.velocity.x * sc2, y: o.velocity.y * sc2 }); }
            const upCap = 9 / slow;
            if (o.velocity.y < -upCap) MBody.setVelocity(o, { x: o.velocity.x, y: -upCap });
          }
          wake();
        }, BOMB_BURST_MS));
      };
      // Burns the fuse of whichever bomb is being held: one hit per half second,
      // and a rattle in the hand that grows on the same halved step.
      const burnFuse = (now2: number) => {
        const b = pressedBombRef.current as Body | null;
        if (!b || !b.bomb || b.blown || !b.heldSince) return;
        const due = Math.floor((now2 - b.heldSince) / BOMB_TICK_MS);
        while ((b.heldHits || 0) < due && pressedBombRef.current === b && !b.blown) {
          b.clickPending = false; // a sustained hold, not a quick click
          b.heldHits = (b.heldHits || 0) + 1;
          hitBomb(b);
          if (!b.blown && typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(14 + (b.heldHits || 0) * 24);
          }
        }
      };
      /* ?spindiag=1. Read once per round rather than per frame, and every
         counter and every sample below is behind it, so the flag costs nothing
         when it is off. See the block beside spinDiagRef. */
      const spinDiagOn = (() => {
        try { return new URLSearchParams(window.location.search).get("spindiag") === "1"; } catch { return false; }
      })();
      let spinScored = 0;      // 1-point collision awards since the last sample
      let spinMade = 0;        // bonds created since the last sample
      let spinCut = 0;         // bonds released since the last sample
      /* THE LAST BLAST, for ?spindiag=1. Written at the moment of detonation and
         left standing until the next one, so a bomb can be set off and the line
         read at leisure. See the note where it is written. */
      let spinLastBlast = "";
      let spinLastKE = 0;      // total kinetic energy at the last sample
      let spinLastAt = 0;      // when that sample was taken
      /* ?nobonds=1 : THE ONE VARIABLE, ISOLATED (owner, 18 September 2026).

         WHAT IT IS FOR. Measured on a worked level, waited well past still and
         with nothing touched, the pit holds KE between 12 and 25 and will not
         fall: it gains energy, sheds it and gains again, with 171 of 204 bodies
         awake. A pit with zero inert chips sleeps perfectly at KE 0.000. Two
         candidates: matter's CONSTRAINT solver, or its contact solver with 150
         overlapping discs.

         READING THE DEPENDENCY RATHER THAN GUESSING, in matter-js 0.19:
           Resolver.postSolvePosition moves position AND positionPrev by the same
           impulse, under the comment "move the body without changing velocity",
           so overlap resolution cannot inject energy.
           Constraint.solve moves position by the full force and touches
           positionPrev only by the much smaller damping term, and matter derives
           velocity as (position - positionPrev), so a distance constraint WRITES
           VELOCITY every time it corrects a length.
           Constraint.postSolveAll then calls Sleeping.set(body, false) with no
           condition beyond a non-zero cached impulse, which is why enableSleeping
           cannot beat it, and Constraint._warming 0.4 carries that impulse on for
           several steps after the push stops.

         SO THIS FLAG SKIPS ONE LINE, the Composite.add that puts the constraint
         in the world, and changes nothing else: the pair is still recorded, still
         capped, still counted, still swept and still expired, so every column on
         the readout means exactly what it meant before. If KE collapses and the
         bodies sleep, the constraints are the source and it is proved on the
         device rather than argued from the source of a dependency. If KE stays
         between 12 and 25, the bonds are innocent and it is the contact solver.

         WITH THE FLAG OFF NOTHING ABOUT THE PIT CHANGES. */
      const noBondsOn = (() => {
        try { return new URLSearchParams(window.location.search).get("nobonds") === "1"; } catch { return false; }
      })();
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
          // A CHUM ON THE FLOOR STARTS THE COUNTDOWN.
          //
          // The chums arrive late, after the dogs, the chips and every prop, so
          // by the time one reaches the floor the pit has genuinely run out of
          // things to land on. No dwell time and no counting: the first one is
          // the signal, which is what was asked for.
          //
          // The floor bodies were already tagged kind "floor" and the chums
          // kind "chum", and this listener already existed, so this is the whole
          // change rather than the start of one.
          // The 2.5s grace (cdGraceRef) applies here too now: after a rescue, a
          // chum already mid-air must not restart the count the instant a Phew
          // lands, or the rescue feels meaningless.
          if (!fullTriggeredRef.current && now > cdGraceRef.current) {
            const chumHitFloor =
              (pa.kind === "chum" && pb2.kind === "floor") ||
              (pb2.kind === "chum" && pa.kind === "floor");
            if (chumHitFloor) {
              fullTriggeredRef.current = true;
              runCountdown();
            }
          }
          const nrm = pair.collision.normal;
          const rv = Math.abs((B.velocity.x - A.velocity.x) * nrm.x + (B.velocity.y - A.velocity.y) * nrm.y);
          let flashed = false;
          const hitSide = (P: any, otherMb: any) => {
            const b: Body | undefined = P.bridge;
            if (!b || b.held) return;
            /* A DEAD CHIP PAYS NOTHING (owner, 18 September 2026, measured).
               ?spindiag=1 on a settled pit with nothing being dragged read
               88.0 points a second. 128 chips less 109 inert leaves 19 live ones,
               and 19 times the 220ms FX_COOLDOWN is a ceiling of 86.4 a second, so
               every live chip was pinned at its maximum, permanently, for nothing
               the player did. The knocks were coming from a clump of inert chips
               that never settles.

               THE SCORING GUARD ONLY EVER ASKED ABOUT THE BODY BEING PAID, never
               about what hit it, so a live chip being nudged by dead matter read
               exactly like a live chip being hit in play.

               SECOND GUARD ON PURPOSE. The bond lifetime removes most of these
               collisions by letting the clump sleep, and this commit is built
               anyway: two independent causes deserve two independent guards, and
               this one still holds the moment the pile is disturbed.

               ONLY THE AWARD. popChildren and knockBadge below are untouched, so
               a dead chip still pushes things about and still spends charges;
               it just does not pay for doing it. Live chip hitting live chip
               scores exactly as before. */
            const deadPartner = otherMb?.plugin?.kind === "badge" && !!otherMb?.plugin?.bridge?.inert;
            if (!flashed && !b.inert && !deadPartner && rv > FX_MIN_PS && now - b.lastFx > FX_COOLDOWN) {
              const c = (pair.collision.supports && pair.collision.supports[0]) || (b.mb ? b.mb.position : null);
              if (c) {
                const w = worldFromPx(c.x, c.y);
                /* FLAT 1 PER HIT, 9 Sept 2026 (owner). This used to award
                   `b.pct`, the circle's own share, so a 50% chip paid 50 points
                   on every impact. With dozens of collisions a second in a full
                   pit, scores ran to 333,000 and the number stopped meaning
                   anything.
                   Flat, not scaled: the owner chose a fixed 1 over pct/10, so a
                   big ancestor is worth no more per bounce than a small one. If
                   share should influence reward again, do it on the POP rather
                   than here, where idle jostling earns it.
                   Only this site changed. The other four numAt calls are events,
                   not collisions: 2000 for accepting cookies, 250 at the blast,
                   the variable at the word pop, and FUSE_POINTS. Those are now
                   worth far more relative to a hit, which is the point. */
                numAt(w.x, w.y, 1, now);
                if (spinDiagOn) spinScored++; // counted AT the award, not inferred
                b.lastFx = now;
                flashed = true;
              }
            }
            if (rv > FX_MIN_PS * 0.6) popChildren(b);
            // statics do not count, pit rule
            if (!otherMb.isStatic) {
              const rock = otherMb.plugin?.prop?.toyKind === "rock";
              knockBadge(b, rv, now, rock ? ROCK_KNOCK : 1);
            }
          };
          hitSide(pa, B);
          hitSide(pb2, A);
          // ITEM 17. Two dead chips touching stick together. Inert to inert
          // only, so nothing playable is ever welded in. See the bond block.
          if (pa.kind === "badge" && pb2.kind === "badge" && pa.bridge && pb2.bridge) {
            joinChips(pa.bridge, pb2.bridge);
          }
          for (const [P, other] of [[pa, B], [pb2, A]] as any[]) {
            const pr = P.prop;
            if (!pr || pr.dead || other.isStatic || rv < 5) continue;
            // Toys never take collision damage. Rods and pills wear out from
            // knocks, but in the main pit the flag only ever counts TAPS, and
            // the ball never expires at all. Left as it was, a well-knocked
            // Union Jack poofed at random before anyone could read it.
            if (P.kind === "toy" || P.kind === "chum") continue;
            if (pr.lastKnock && now - pr.lastKnock < 600) continue;
            pr.lastKnock = now;
            pr.hits += 1;
            if (pr.hits >= pr.maxHits) killProp(pr, P.kind, now);
          }
          for (const [P] of [[pa], [pb2]] as any[]) {
            if (P.ui && P.ui.fixed && rv > FX_MIN_PS * 0.3) {
              const u = P.ui;
              u.hits += 1;
              // The logo sheds its removed elements as real bodies. Everything
              // below this line is the squares' behaviour, unchanged, and the
              // logo goes through it too.
              if (u.kind === "logo") dropLogoPieces(u, u.hits - 1);
              if (u.hits >= 5) {
                u.fixed = false;
                wakeBody(u.mb); // a fixed square is static, and a static body sleeps
                MBody.setStatic(u.mb, false);
                MBody.setAngularVelocity(u.mb, (Math.random() - 0.5) * 2 / 60);
              } else {
                u.y += 12 * uppW; // sink a notch and tip
                u.a += 0.09;
                wakeBody(u.mb);
                MBody.setPosition(u.mb, pxFromWorld(u.x, u.y));
                MBody.setAngle(u.mb, u.a);
              }
            }
          }
        }
      };
      Events.on(engine, "collisionStart", onCollide);

      // RED WHILE RESTING ON THE FLOOR. A per-chum onFloor flag, kept live off
      // the very same "chum"/"floor" tags the countdown already uses, not a new
      // detector. collisionActive refreshes it every frame a card is in contact;
      // collisionEnd marks the instant it lifts. The paint loop turns the marker
      // back to white only after CHUM_FLOOR_GRACE_MS, so a one-frame solver
      // separation does not flicker the edge. Not latched: off the floor, white.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const onFloorActive = (ev: any) => {
        for (const pair of ev.pairs) {
          const pa = pair.bodyA.plugin || {}, pb = pair.bodyB.plugin || {};
          const pr = pa.kind === "chum" && pb.kind === "floor" ? pa.prop
            : pb.kind === "chum" && pa.kind === "floor" ? pb.prop : null;
          if (pr) { pr.onFloor = true; pr.floorLostAt = 0; }
        }
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const onFloorEnd = (ev: any) => {
        for (const pair of ev.pairs) {
          const pa = pair.bodyA.plugin || {}, pb = pair.bodyB.plugin || {};
          const pr = pa.kind === "chum" && pb.kind === "floor" ? pa.prop
            : pb.kind === "chum" && pa.kind === "floor" ? pb.prop : null;
          if (pr && pr.onFloor) pr.floorLostAt = performance.now();
        }
      };
      Events.on(engine, "collisionActive", onFloorActive);
      Events.on(engine, "collisionEnd", onFloorEnd);

      // ---- fixed-timestep loop (same clock discipline as the main pit):
      // accumulate real time, step in exact 16.66ms slices, settle-aware ----
      const STEP = 1000 / 60, MAX_ACC = 100;
      let acc = 0;
      let lastT: number | null = null;
      let started = performance.now();
      // The physics loop's own clock is reset by every wake, so it cannot be
      // used to hold the settle-in window open: anything nudged in the pit
      // would restart the four seconds and the poll below would almost never
      // be allowed to run. This one is set once per level and never reset.
      const fullClock = performance.now();
      // The level's grace floor. Re-set at the landing by armToys, which is the
      // fairer start; this seeds it so a level whose drop never reaches the floor
      // is still covered. Set here rather than in a mount effect so it resets with
      // the level, on a retry as on a new one: this effect re-runs for each.
      cdGraceRef.current = fullClock + pitFullGraceMs(nodes);
      pitEndedRef.current = false; // fresh sim, the poll is live again
      let stillFrames = 0;
      const SETTLE_PS = vps(0.012);
      // pit-full: settled bodies whose tops reach the spawn zone, pit-style.
      //
      // LIFTED OUT OF THE PHYSICS LOOP. This used to sit inside step(), which
      // exits once everything has settled: exactly the state a full pit ends
      // in. So a pit that filled and came to rest was never tested and the
      // countdown never started, and a pit that was cleared and came to rest
      // was never re-tested, so the digits kept running. Both halves of the
      // test needed a caller that is not tied to motion. It now has two: the
      // loop, unchanged, and the poll below.
      const anyChumOnFloor = () => chumBodiesRef.current.some((c) => c.onFloor);
      // Occupancy: is the pit "full"? Split out of checkFull so the 400ms poll AND
      // the immediate rescue check (tryCancelRef, fired the moment a chum is
      // collected) read the exact same answer.
      const computeFull = (): boolean => {
        const zoneY = v[1] + (-vbHf / 2 + PIT_FULL_ZONE_PX * uppW) / k;
        // "Full" used to mean five settled bodies reaching the top zone, a count
        // borrowed from the main pit, which always holds dozens of cards. Half the
        // mini pit trees have two or three circles, so the pit could be visibly
        // stuffed while the count sat at 2 and the round never ended. Occupancy is
        // what full actually means: take every settled body whose top reaches the
        // zone, merge their horizontal spans so two circles side by side are not
        // counted twice, and compare against the width between the pit walls.
        const spans: [number, number][] = [];
        // (the `inZone` counter went with the `>= 5` rule below)
        const occupy = (x: number, y: number, r: number, vx: number, vy: number, held?: boolean) => {
          if (held) return;
          if (Math.hypot(vx, vy) > worldH * 0.03) return;
          if (y - r < zoneY) { spans.push([x - r, x + r]); }
        };
        for (const b of all) occupy(b.x, b.y, b.r, b.vx, b.vy, b.held);
        // The CHUM CARDS count too: `all` is only the level's own dogs and chips,
        // and the chums live in their own list, so without this a pit stuffed with
        // chum cards never reached the threshold. Their body is a square of side
        // `dia`; half of that is the radius the span wants, recovered from the
        // drawn size the same way everything else here is.
        for (const c of chumBodiesRef.current) {
          const cr = ((c.mb?.bounds?.max?.x ?? 0) - (c.mb?.bounds?.min?.x ?? 0)) / 2 / pxPerWorld;
          if (cr > 0) occupy(c.x, c.y, cr, c.vx, c.vy, c.held);
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
        // the real distance between the walls, not the viewBox, which reaches well
        // past the visible stage
        const pitW = (xR - xL) || 1;
        const blocked = spans.length > 0 && covered / pitW >= PIT_FULL_COVER;
        /* `|| inZone >= 5` DELETED, 9 Sept 2026 (owner). It was the OLD rule,
           a count borrowed from the main pit, and the comment at the top of this
           function says occupancy replaced it. It was never removed, so it sat
           beside the new test as an OR and quietly overrode it: any five settled
           objects near the top made the pit "full", badges and toys included, so
           the countdown started on a nearly empty pit and, before the freeze fix,
           could not be called off again.
           Coverage alone decides now, which is what the function claims to do. */
        return blocked;
      };
      const checkFull = (now: number) => {
        /* THE POLL IS NOT ON THE rAF, so pausing the sim does not pause this: it
           re-arms itself on its own 400ms timer and would go on testing occupancy
           behind the lift. Without this a player could come back from reading a
           learn layer into a countdown that started while they were in it, which
           they never saw begin. Guarded inside checkFull rather than at the poll,
           so the loop's own call is covered by the same line. */
        if (liftPausedRef.current) return;
        if (now - fullClock < 4000 || now <= cdGraceRef.current) return;
        const full = computeFull();
        if (full && !fullTriggeredRef.current) {
          fullTriggeredRef.current = true;
          runCountdown();
        } else if (!full && fullTriggeredRef.current && !anyChumOnFloor()) {
          // ROOM AGAIN and no chum left on the floor, so the countdown is called
          // off. The floor trigger used to be exempt from this (see the reversal
          // note by the removed floorTriggeredRef); collecting the chums off the
          // floor now cancels it too, with the Phew beat if the count hit zero.
          cancelCountdown(now);
        }
      };
      // The rescue check, fired straight from the chum-collect handler so it lands
      // the instant the last floor chum is taken, not up to one poll (400ms) later
      // (that immediacy is what makes a clear with half a second of "Oh no" left
      // count). Bypasses the settle-in/grace guard on purpose: fullTriggeredRef
      // already gates it and a rescue should never be held back.
      tryCancelRef.current = () => {
        if (!fullTriggeredRef.current) return;
        const now = performance.now();
        if (!computeFull() && !anyChumOnFloor()) cancelCountdown(now);
      };
      const step = (nowRaf: number) => {
        /* PAUSED: stop dead, draw nothing, schedule nothing. NOT the tail's
           stop-and-tear-down path below, which clears the flashing numbers and
           drops `falling`: this is a freeze, and everything has to be exactly
           where it was when the lift closes. Bodies cannot drift while stopped
           because Engine.update is the only thing that integrates them, and
           Matter's own per-body sleeping is untouched by our not calling it. */
        if (liftPausedRef.current) { simRunningRef.current = false; return; }
        const now = performance.now();
        /* THE RESUME'S ONE REAL HAZARD, and it is already handled. lastT is nulled
           by wake() before this runs again, so the first frame back does not do
           `acc += nowRaf - lastT` across the whole pause, which is the drift or
           explode case. Even if that were missed, acc is clamped to MAX_ACC below,
           so the engine could advance at most six steps rather than six hundred.
           That clamp is why pausing here is safe where pausing physics generally
           is not. */
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
            wakeBody(db.mb); // grabbing a settled body must not leave it asleep
            MBody.setPosition(db.mb, pxFromWorld(db.x, db.y));
            MBody.setVelocity(db.mb, { x: (db.vx * pxPerWorld) / 60, y: (db.vy * pxPerWorld) / 60 });
          }
          Engine.update(engine, STEP);
          acc -= STEP;
          stepped++;
        }
        // A bond is cut 2500ms after it is made, so a settled clump stops being
        // held awake by its own constraints. See the bond block.
        expireBonds(nowRaf);
        // ESCAPE NET. Anything that ends up below the floor is put back.
        //
        // Objects have been seen passing through the floor and continuing down,
        // usually while moving fast. It should not be possible: the floor slabs
        // are 600 thick, the opening shoves are about 3px per step, and the blast
        // is capped at 16, so a body would need to travel 600px in one step to
        // tunnel. The only bodies that pass through anything are the clinging
        // circles, and they are static while they are sensors, so they cannot
        // fall. I could not find the cause by reading.
        //
        // So rather than keep hunting a rare path, the failure is made
        // recoverable. Below the floor's midline means it has escaped, whatever
        // the reason, and it is returned to the top of the pit with its motion
        // cleared. A player sees an object come back rather than vanish, which is
        // the difference between a quirk and a lost round.
        {
          const escapeY = pL.y + T * 0.5;
          for (const mb of Composite.allBodies(world) as { isStatic?: boolean; position: { x: number; y: number }; plugin?: { kind?: string; bridge?: Body } }[]) {
            if (mb.isStatic) continue;
            if (mb.position.y <= escapeY) continue;
            // A bond survives a teleport and would snap its partner across the
            // pit, so an escaping chip is cut loose first. See the bond block.
            if (mb.plugin?.kind === "badge" && mb.plugin.bridge) dropBonds(mb.plugin.bridge.idx);
            const backX = pL.x + 30 + Math.random() * Math.max(1, wPx - 60);
            wakeBody(mb); // or it hangs where it was put and never falls back
            MBody.setPosition(mb as never, { x: backX, y: pTop.y - 40 });
            MBody.setVelocity(mb as never, { x: 0, y: 0 });
            MBody.setAngularVelocity(mb as never, 0);
          }
        }
        const dt = Math.max(0.004, Math.min(0.032, (stepped * STEP) / 1000 || 0.0166));
        // held bodies leave the world; released ones drop back in where lifted
        for (const b of all) {
          if (!b.mb) continue;
          if (b.held && b.mbIn) {
            // Lifted: a word's circles are already free pit objects since the
            // drop, so there is nothing to cut loose here. The word just leaves
            // the world; its circles carry on under their own physics.
            Composite.remove(world, b.mb); b.mbIn = false;
          }
          else if (!b.held && !b.mbIn && !b.blown) {
            // A blown bomb, or a chip killed in a bomb chain, has left the world
            // for good and its sprite is hidden (deadBadges). It must NOT be
            // dropped back in, or the invisible body sits there as a dead-space
            // obstacle that objects fall around. detonate and killChained both
            // set `blown`, so this one guard covers both. Inert badges never set
            // `blown`, so they still keep their bodies here, which is correct.
            wakeBody(b.mb); // released asleep, it would freeze in mid air
            MBody.setPosition(b.mb, pxFromWorld(b.x, b.y));
            MBody.setVelocity(b.mb, { x: 0, y: 0 });
            Composite.add(world, b.mb);
            b.mbIn = true;
          }
        }
        /* ---- ?spindiag=1 SAMPLER. Twice a second, from inside the sim, where
           the world and the bond table are in scope. Everything here is behind
           the flag. See the block beside spinDiagRef for what the columns are
           for and which one settles the question. */
        if (spinDiagOn && nowRaf - spinLastAt >= 500) {
          const elapsed = spinLastAt ? (nowRaf - spinLastAt) / 1000 : 0;
          type DB = { isStatic?: boolean; isSleeping?: boolean; mass?: number; angularVelocity?: number; velocity: { x: number; y: number }; plugin?: { kind?: string; bridge?: Body } };
          const bods = (Composite.allBodies(world) as DB[]).filter((o) => !o.isStatic);
          let ke = 0, sumW = 0, awake = 0, maxW = 0;
          let worst: DB | null = null;
          for (const o of bods) {
            const sp2 = o.velocity.x * o.velocity.x + o.velocity.y * o.velocity.y;
            ke += 0.5 * (o.mass || 0) * sp2;
            const w2 = Math.abs(o.angularVelocity || 0);
            sumW += w2;
            if (!o.isSleeping) awake++;
            if (w2 > maxW) { maxW = w2; worst = o; }
          }
          const chips = bods.filter((o) => o.plugin?.kind === "badge");
          const inert = chips.filter((o) => o.plugin?.bridge?.inert).length;
          /* GHOSTS, and the column that settles the held-open space. A chip whose
             bridge says `blown` but whose body is still in the world is invisible
             and solid: killChained sets blown BEFORE it removes, so a non-zero
             reading means a removal was skipped and that chip is holding its space
             open. It should always be 0.

             READ IT BESIDE `asleep`. If ghost is 0 after a blast and the space is
             still held, nothing leaked: the pit around the hole is asleep and
             never falls in, because removing a body does not wake its neighbours.
             The two readings tell those apart, which no other column does. */
          const ghost = chips.filter((o) => o.plugin?.bridge?.blown).length;
          /* AND THE SAME QUESTION FOR CIRCLES, which `ghost` above could not see
             (owner, 18 September 2026). It filters kind "badge" and tests `blown`;
             a dog circle is kind "circle" and a chain-closed one never sets blown,
             it sets `held`. So the counter was blind to exactly the case being
             chased: circles closed by a chain, gone from the screen, still holding
             their space open.

             WHAT COUNTS AS A GHOST CIRCLE. A body still in the world whose bridge
             says `held`, or whose NODE is in removedNodes. Either is enough: held
             means the step loop was told to take it out and has not, removed means
             the drawing has already hidden it. Both should be zero the moment the
             sim has had one tick.

             READING IT. Non-zero for a few hundred ms after a chain completes is
             the PAUSE holding the removal back, which is expected and self-heals.
             Non-zero and STAYING non-zero is the other fault: dogClose's
             `if (b) b.held = true` found no body, so nothing was ever marked. The
             `no body` count beside it separates those two without a second run. */
          const circs = bods.filter((o) => o.plugin?.kind === "circle");
          const gcirc = circs.filter((o) => {
            const br = o.plugin?.bridge;
            return !!br && (!!br.held || (!!br.n && removedNodesRef.current.has(br.n)));
          }).length;
          const bonds = bondedPairs.size;
          const wIdx = worst?.plugin?.bridge?.idx;
          const wBonds = wIdx === undefined ? 0 : (bondsOf.get(wIdx)?.length ?? 0);
          const wSpd = worst ? Math.hypot(worst.velocity.x, worst.velocity.y) : 0;
          const dKE = spinLastAt ? ke - spinLastKE : 0;
          const per = (n: number) => (elapsed ? (n / elapsed).toFixed(1) : "-");
          /* EVERY CIRCLE CARRYING AN INLINE FILL, with the three things the
             paintable gate tests, so the element painting itself pale blue on the
             Ancient Mastiff drop can be NAMED rather than guessed at.

             WHY THESE FOUR COLUMNS. paintable is `!isWordNode && fill !== "none"
             && opacity !== "0"`, and isWordNode is `fellRef && depth === 1`. So
             depth says whether the word rule should have hidden it, ECHO says
             whether the render should have given it fill="none", disp is what the
             writer actually wrote, and `fill` is the attribute the gate reads. One
             of those four will disagree with what the code says it should be, and
             that is the fault.

             `key` is the dataset value the fill writer keys on, which says WHICH
             state painted it: held, twin, single or 0.

             Reading el.style.fill is an inline-style property access, not a layout
             read, so this costs nothing even at eight rows twice a second. Capped
             at 8 so the line stays readable on a phone. Behind the flag. */
          let inked = "INK none";
          {
            const cg2 = circlesRef.current;
            const nds = nodesRef.current;
            if (cg2) {
              const rows: string[] = [];
              for (let i2 = 0; i2 < cg2.children.length && rows.length < 8; i2++) {
                const el2 = (cg2.children[i2] as SVGGElement)?.children[0] as SVGCircleElement | undefined;
                if (!el2 || !el2.style.fill) continue;
                const nd = nds[i2];
                rows.push(
                  `#${i2} ${(nd?.data.name ?? "?").slice(0, 10)} d${nd?.depth ?? "?"}${nd && isEcho(nd) ? " ECHO" : nd && isDupSibling(nd) ? " DUP" : ""}` +
                  ` disp ${el2.getAttribute("display") ?? "-"} fill ${el2.getAttribute("fill") ?? "-"}` +
                  ` -> ${el2.style.fill} key ${el2.dataset.chained ?? "-"}`,
                );
              }
              if (rows.length) inked = `INK ${rows.length}: ${rows.join("   |   ")}`;
            }
          }
          spinDiagRef.current = [
            `pts/s ${per(spinScored)}  drag ${dragRef.current ? "YES" : "none"}  bodies ${bods.length}  awake ${awake}  asleep ${bods.length - awake}${noBondsOn ? "   ?nobonds=1 NO CONSTRAINTS IN WORLD" : ""}`,
            /* made/s and cut/s turn the re-bonding into a number. A steady bond
               count can mean the sweep is not running OR that pairs are being
               re-made as fast as it cuts them, and only these two tell those
               apart: made near zero is a stalled sweep, made and cut both high
               and roughly equal is the churn. */
            `chips ${chips.length} (inert ${inert})  ghost ${ghost}  circles ${circs.length} ghostC ${gcirc}${ghost || gcirc ? "  <-- INVISIBLE BODIES LEFT IN WORLD" : ""}  bonds ${bonds} (made/s ${per(spinMade)} cut/s ${per(spinCut)})  KE ${ke.toFixed(3)}  dKE ${dKE >= 0 ? "+" : ""}${dKE.toFixed(3)}${dKE > 0 && !dragRef.current ? "  <-- ENERGY IN" : ""}`,
            `sumW ${sumW.toFixed(3)}  maxW ${maxW.toFixed(4)} on ${worst?.plugin?.kind ?? "?"}${wIdx === undefined ? "" : ` #${wIdx}`} bonds ${wBonds} spd ${wSpd.toFixed(2)}`,
            /* THE CHAIN'S OWN STATE, for a leaked twin (owner, 18 September 2026:
               a yellow circle at rest with no chain running). An available twin
               takes its fill from RARITY_BAND and its tapped face from the same
               condition, and both hang on dogChainBreedRef being set. If `breed`
               names a dog while no chain is being drawn, the ref is leaking and
               that is the fault; if it is none, the yellow is something else and
               this rules the chain out. `held` is the node set that goes with it,
               so the two can be seen to agree. */
            `chain breed ${dogChainBreedRef.current ?? "none"}  held ${dogChainNodesRef.current.size}`,
            inked,
            // The last chain death and the last detonation, each standing until the
            // next. Empty before the first of either.
            spinLastChainRef.current || "CHAIN none yet",
            spinLastBlast || "BLAST none yet",
          ];
          spinMade = 0;
          spinCut = 0;
          spinScored = 0;
          spinLastKE = ke;
          spinLastAt = nowRaf;
        }
        let still = !dragRef.current;
        for (const b of all) {
          // A held body is out of the physics world, so there is nothing to read
          // back from Matter. Everything BELOW still has to run: skipping the
          // whole body here meant the node was never moved to the dragged
          // position, so the circle you can see stayed put and only jumped to
          // your finger when you let go. The drag was invisible.
          if (b.mb && b.mbIn && !isDragged(b) && !b.held) {
            const w = worldFromPx(b.mb.position.x, b.mb.position.y);
            b.x = w.x; b.y = w.y;
            b.a = b.mb.angle; // badges tumble with the physics, like the dogs
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
        burnFuse(now);
        // The fuse fizzes from hit 2, building toward each stage. The ease is
        // doubled against the main pit's 0.05 because this fuse is half as long,
        // so it still reaches each stage before the next hit lands.
        for (const fb of all) {
          if (!fb.bomb || fb.blown || !fb.mb || !fb.mbIn) continue;
          const fh = fb.hits || 0;
          if (fh < fx.FUSE_LIGHT_AT) continue;
          const fTarget = [0, 0, 0.16, 0.4, 0.68, 1][Math.min(fh, BOMB_HITS)];
          fb.fuseCur = (fb.fuseCur || 0) + (fTarget - (fb.fuseCur || 0)) * 0.1;
          if (fb.fuseCur < 0.03) continue;
          // the wick sits at the top right of the sprite, which is drawn 2.4
          // radii wide, so the offset is a fraction of the bomb's own radius
          const fr = radOf(fb.mb);
          const fRattle = fh >= 3 ? fb.fuseCur * 3 : 0;
          const fjx = fRattle ? (Math.random() - 0.5) * fRattle : 0;
          const fjy = fRattle ? (Math.random() - 0.5) * fRattle : 0;
          fx.emitFuseSparks(fb.mb.position.x + fr * 0.77 + fjx, fb.mb.position.y - fr * 0.96 + fjy, fb.fuseCur);
        }
        if (!fx.idle()) fxKickRef.current?.();
        checkEscapeRef.current?.();
        for (const list of [rodBodiesRef.current, pillBodiesRef.current, toyBodiesRef.current, chumBodiesRef.current, logoPieceBodiesRef.current]) {
          for (const pr of list) {
            if (pr.dead || !pr.mb) continue;
            if (!isDragged(pr)) {
              const w = worldFromPx(pr.mb.position.x, pr.mb.position.y);
              pr.x = w.x; pr.y = w.y; pr.a = pr.mb.angle;
              pr.vx = (pr.mb.velocity.x * 60) / pxPerWorld;
              pr.vy = (pr.mb.velocity.y * 60) / pxPerWorld;
            } else {
              wakeBody(pr.mb);
              MBody.setPosition(pr.mb, pxFromWorld(pr.x, pr.y));
              MBody.setVelocity(pr.mb, { x: (pr.vx * pxPerWorld) / 60, y: (pr.vy * pxPerWorld) / 60 });
            }
            if (pr.mb.speed > SETTLE_PS) still = false;
          }
        }
        const uis = uiBodiesRef.current as any[] | null;
        if (uis) for (const u of uis) {
          if (u.mbIn === false) continue;
          if (!u.fixed && u.mb) {
            if (!isDragged(u)) {
              const w = worldFromPx(u.mb.position.x, u.mb.position.y);
              u.x = w.x; u.y = w.y; u.a = u.mb.angle;
              u.vx = (u.mb.velocity.x * 60) / pxPerWorld;
              u.vy = (u.mb.velocity.y * 60) / pxPerWorld;
            } else {
              wakeBody(u.mb);
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
        zoomTo(viewRef.current, now);
        drawNumbers(now, viewRef.current);
        checkFull(now);
        stillFrames = still ? stillFrames + 1 : 0;
        /* THE LOOP NO LONGER STOPS MID-ROUND, 9 Sept 2026 (owner: "solve the
           freeze first").

           WHAT WAS WRONG. This bail ended the rAF loop after 12 still frames,
           about a fifth of a second of everything being at rest, with a hard 30
           second cap on top. Only wake() restarted it, and wake() has just five
           callers in the whole file: three inside startDrag and two on the
           scatter path. Collecting a chum does not call it. Nor does a bomb
           blowing, a badge going inert, or anything else that changes the world
           mid-round. So the pit stopped and stayed stopped, and shake was the
           only way back, because shake drags.
           It was not only a visual freeze. computeFull reads the BRIDGE
           coordinates (b.x, b.y, b.vx, b.vy), which this loop is what updates.
           With the loop stopped they froze at their last values, so the pit-full
           test kept answering from a world that no longer existed and the
           countdown carried on over a pit the player had already cleared.

           WHY IT IS SAFE TO REMOVE. Two idle mechanisms were running and this is
           the older one. `enableSleeping: true` was added to the engine on 1
           September, AFTER this bail was written, and does the same job properly:
           a sleeping body costs almost nothing to step and wakes on force rather
           than needing something to remember to call wake(). Keeping both meant
           the redundant one silently froze the game.

           WHAT IS KEPT. Once the round has ended, the original expression runs
           verbatim, still frames and 30 second cap included, so the loop still
           winds down when there is nothing to play. And the effect's cleanup
           cancels the rAF on unmount either way, so nothing runs on past the pit.

           THE ALTERNATIVES, both rejected: adding wake() to every mutation site
           (precise, but one missed site is a fresh freeze), and letting the 400ms
           poll wake it (a safety net that still leaves 400ms of stale world). */
        const roundLive = !pitEndedRef.current;
        if (roundLive || ((stillFrames < 12 || numbers.length > 0) && now - started < 30000)) {
          fallRafRef.current = requestAnimationFrame(step);
        } else {
          simRunningRef.current = false;
          numbers.forEach((n) => n.el.remove());
          numbers.length = 0;
          setFalling(false);
        }
      };
      const wake = () => {
        /* THE GOTCHA THIS GUARD IS FOR. toyTimers fire spawnToy, which calls wake,
           so a tennis ball arriving mid-lift would restart the sim behind the
           overlay and undo the pause. Checked here rather than only at the loop's
           tail, because every caller comes through this one door. */
        if (liftPausedRef.current) return;
        if (simRunningRef.current) return;
        simRunningRef.current = true;
        lastT = null;
        started = performance.now(); // fresh time budget each wake
        fallRafRef.current = requestAnimationFrame(step);
      };
      // The second caller for checkFull, and the reason the bug is fixed. It
      // re-arms itself on a timer and is not tied to motion, which is the main
      // pit's own answer to the same problem: `scheduleIdleCheck` in
      // PackPit.tsx. 400ms is fast enough that the digits appear promptly on a
      // pit that has just come to rest, and cheap enough to leave running.
      const FULL_POLL_MS = 400;
      const fullPoll = () => {
        if (pitEndedRef.current) return; // round handed to the shell, stop
        checkFull(performance.now());
        fullPollRef.current = window.setTimeout(fullPoll, FULL_POLL_MS);
      };
      window.clearTimeout(fullPollRef.current);
      fullPollRef.current = window.setTimeout(fullPoll, FULL_POLL_MS);
      // Shake: pit-style jolt of everything in the mini pit (pit velocities, verbatim px/step).
      shakeInnerRef.current = () => {
        // A shake almost always lands on a pit that has come to rest, which is
        // exactly the state where every body is asleep, so each one is woken
        // before it is jolted or the jolt does nothing at all.
        for (const b of all) if (b.mb && b.mbIn && !b.held) {
          wakeBody(b.mb);
          MBody.setVelocity(b.mb, { x: (Math.random() - 0.5) * 18, y: -(8 + Math.random() * 14) });
        }
        const uu = uiBodiesRef.current as any[] | null;
        if (uu) for (const u of uu) if (!u.fixed && u.mb) {
          wakeBody(u.mb);
          MBody.setVelocity(u.mb, { x: (Math.random() - 0.5) * 16, y: -(7 + Math.random() * 12) });
        }
        for (const list of [rodBodiesRef.current, pillBodiesRef.current, toyBodiesRef.current, chumBodiesRef.current, logoPieceBodiesRef.current]) {
          for (const pr of list) if (!pr.dead && pr.mb) { wakeBody(pr.mb); MBody.setVelocity(pr.mb, { x: (Math.random() - 0.5) * 16, y: -(7 + Math.random() * 12) }); }
        }
        wake();
      };
      wakeRef.current = wake;
      slowmoRef.current = () => {
        engine.timing.timeScale = engine.timing.timeScale === 1 ? 0.25 : 1;
        wake(); // a settled pit still needs to be woken to show the change
      };
      // ---- J10b stage 1: Matter's own MouseConstraint, badges only --------
      // The mini pit lifted a dragged body OUT of the world: startDrag sets
      // held, and the sim then runs Composite.remove on it. A body outside the
      // world collides with nothing, which is why a dragged object floats over
      // everything instead of barging it. The main pit keeps the body in the
      // world and pulls it with a constraint. This is that, ported.
      //
      // The mapping has to be two steps, because the two spaces move
      // independently:
      //   client px -> world     via the LIVE screen CTM and the LIVE view
      //   world     -> phys px   via the FROZEN drop-time CT
      // Either transform on its own breaks the moment the pit is zoomed.
      //
      let mcTeardown: (() => void) | null = null;
      if (Mouse && MouseConstraint && st) {
        // A detached element, so Matter's own listeners can never fire. The
        // position is driven by hand below, in physics pixels.
        const mouse = Mouse.create(document.createElement("div"));
        const mc = MouseConstraint.create(engine, {
          mouse,
          // Its own category, so a body can opt out of being grabbed without
          // opting out of colliding. See MC_CAT.
          collisionFilter: { category: MC_CAT, mask: 0xFFFFFFFF, group: 0 },
          constraint: { stiffness: 0.2, render: { visible: false } },
        });
        Composite.add(world, mc);
          // Release-velocity throw. FLICK_SCALE tunes it (1.0 = pointer speed);
        // FLICK_FLOOR is the tap floor in Matter px/step. flickBuf is the pointer
        // path in physics px, read on release to set the toy's velocity.
        const FLICK_SCALE = 1.0;
        const FLICK_FLOOR = 3;
        const flickBuf: { t: number; x: number; y: number }[] = [];
        // Stage 1 grabs badges only. Everything else keeps the old path, so the
        // two systems can never fight over the same body.
        // Stage 1 was badges only. Stage 2 adds the dog circles, which is the
        // object this whole job exists for. Rods, pills, toys and the UI
        // squares still run the old path, so the two never share a body.
        // Stage 3 adds the pit props. The in-pit UI squares, close X and
        // brain, are deliberately NOT here: they are controls, and a control
        // that can be dragged into the pack is a worse control. The chum
        // scenery is out too, since it was never draggable.
        const MC_KINDS = new Set(["badge", "circle", "rod", "pill", "toy", "btn"]);
        /* THE FALLEN LOGO IS DRAGGABLE, the others are not (owner, 31 Aug 2026:
           "I want to pick up and move it around, just like the main pit").

           It is not in MC_KINDS because the UI bodies carry `plugin.ui` and no
           `plugin.kind` at all, so they can never match that set. The test is on
           the object itself instead.

           `fixed === false` is the whole gate. While the logo is still perched
           it is a STATIC body, and Matter's MouseConstraint does not skip static
           bodies: it would happily take the grab and then move nothing, which
           would feel exactly like the pit being broken. Once the fifth knock
           frees it, it is a normal body and behaves like one.

           The close X, the brain and the description square stay undraggable.
           The comment above still stands for them: a control you can drag into
           the pack is a worse control. */
        const onStartDrag = (ev: { body?: { plugin?: { kind?: string; ui?: { kind?: string; fixed?: boolean } } } }) => {
          const pl = ev?.body?.plugin;
          if (pl?.ui?.kind === "logo" && pl.ui.fixed === false) return;
          if (!MC_KINDS.has(pl?.kind ?? "")) { mc.constraint.bodyB = null; mc.body = null; }
        };
        // A thrown toy retires itself once it is clear of the pit. The old path
        // fired this from startDrag's pointer up; the constraint has its own
        // release event, so it hangs off that instead.
        const onEndDrag = (ev: { body?: { circleRadius?: number; plugin?: { prop?: unknown; kind?: string } } }) => {
          const b = ev?.body;
          if (b && b.plugin?.kind === "toy") {
            const n = flickBuf.length;
            if (n >= 2) {
              const last = flickBuf[n - 1];
              let old = flickBuf[0];
              for (let i = n - 1; i >= 0; i--) { if (last.t - flickBuf[i].t >= 60) { old = flickBuf[i]; break; } }
              const dt = (last.t - old.t) / 1000;
              if (dt > 0) {
                const vx = (((last.x - old.x) / dt) / 60) * FLICK_SCALE;
                const vy = (((last.y - old.y) / dt) / 60) * FLICK_SCALE;
                if (Math.hypot(vx, vy) >= FLICK_FLOOR) { wakeBody(b); MBody.setVelocity(b as never, { x: vx, y: vy }); }
              }
            }
          }
          const prop = b?.plugin?.prop;
          if (prop && b?.circleRadius) throwWatchRef.current?.(prop);
        };
        Events.on(mc, "enddrag", onEndDrag);
        mcReleaseRef.current = () => { mc.constraint.bodyB = null; mc.body = null; mouse.button = -1; };

        /* ---- THE LOGO AND BONE FUSE ----------------------------------------
           Ported from the main pit's onFuseMagnet, PackPit.tsx:1018. Owner
           asked for it once the logo destruction was done, and it is.

           IT CANNOT FIRE UNTIL THE LOGO HAS FALLEN. The main pit bails while
           its logo is still static; here the same test is `fixed`, which the
           hit block clears on the fifth knock. So the sequence is: knock the
           logo five times, it tumbles into the pile, and only then will a bone
           dragged onto it fuse.

           ONE DIRECTION, NOT TWO. The main pit lets you drag either the logo or
           the bone. Here only the bone is draggable: MC_KINDS above does not
           include the UI bodies, and the logo is rendered with pointer events
           off so it can never swallow a tap meant for a dog. Dragging the bone
           is the whole interaction.

           Distances are the main pit's own figures in the same space, client
           pixels, so they are copied verbatim. They are TIGHT: 40px to feel the
           pull and 12px to snap. If it turns out to be fiddly on a phone, this
           pair is what to open up, not the pull strength. */
        /* DISTANCES SCALE WITH THE LOGO, they are not fixed pixels.
           The main pit's 40px magnet and 12px snap were copied verbatim and did
           not work: they are CENTRE TO CENTRE, and against a 229px logo and a
           180px bone the two can overlap completely with their centres still
           about 150px apart, so the magnet never switched on. Proven on a real
           phone with a temporary grab readout, which showed the bone being
           held correctly while nothing happened.

           Half the logo's width to feel the pull, 15% to snap. On a 390 phone
           that is about 115px and 34px, against 40 and 12. */
        const FUSE_MAGNET_FRAC = 0.5;
        const FUSE_SNAP_FRAC = 0.15;
        const FUSE_PULL = 0.00005;
        const FUSE_POINTS = 2000;
        let fused = false;
        let nearWas = false; // last armed state, so the swap is not re-set every step
        /* DISARM ON EVERY WAY OUT. The magnet returns early whenever nothing
           useful is held, and letting go of the bone is exactly that case.
           Without this the second artwork would stay on for the rest of the
           round the moment you released while in range. */
        const disarm = () => { if (nearWas) { nearWas = false; setBoneNear(null); } };
        const onFuseMagnet = () => {
          if (fused) return;
          const lu = uiBodiesRef.current?.find((u) => u.kind === "logo") as (UiBody & { mb?: { position: { x: number; y: number }; mass: number } }) | undefined;
          // still fixed means it has not been knocked loose yet
          if (!lu || lu.fixed || !lu.mb || lu.mbIn === false || !lu.w) { disarm(); return; }
          const bonePr = toyBodiesRef.current.find((t) => t.toyKind === "bone" && !t.dead && t.mb);
          if (!bonePr?.mb) { disarm(); return; }
          const logoB = lu.mb;
          const boneB = bonePr.mb as { position: { x: number; y: number }; mass: number };
          /* EITHER DIRECTION, like the main pit. Whichever of the two you are
             holding, the OTHER one is pulled towards it. Before the logo became
             draggable this only worked one way. */
          const held = mc.body as unknown;
          const heldIsBone = held === bonePr.mb;
          const heldIsLogo = held === logoB;
          if (!heldIsBone && !heldIsLogo) { disarm(); return; }
          const puller = heldIsBone ? boneB : logoB;
          const pulled = heldIsBone ? logoB : boneB;
          const lwPx = lu.w * pxPerWorld;
          const magnet = lwPx * FUSE_MAGNET_FRAC;
          const snap = lwPx * FUSE_SNAP_FRAC;
          const tx = puller.position.x - pulled.position.x, ty = puller.position.y - pulled.position.y;
          const dist = Math.hypot(tx, ty);
          // Armed or not, written only on a change: this runs every step.
          const nearNow = dist <= magnet;
          if (nearNow !== nearWas) {
            nearWas = nearNow;
            const bi = toyBodiesRef.current.findIndex((t) => t === bonePr);
            setBoneNear(nearNow && bi >= 0 ? bi : null);
          }
          if (dist > magnet || dist < 1) return;
          const f = FUSE_PULL * (magnet - dist);
          MBody.applyForce(pulled as never, pulled.position, { x: (tx / dist) * f * pulled.mass, y: (ty / dist) * f * pulled.mass });
          if (dist > snap) return;
          fused = true;
          // The BONE always ends up on the logo, whichever one was being held,
          // so the join looks the same either way. The main pit's own order.
          MBody.setPosition(boneB as never, { x: logoB.position.x, y: logoB.position.y });
          MBody.setVelocity(boneB as never, { x: 0, y: 0 });
          MBody.setAngularVelocity(boneB as never, 0);
          mcReleaseRef.current?.(); // let go, or the constraint drags it away again
          const w = worldFromPx(logoB.position.x, logoB.position.y);
          const now = performance.now();
          /* The main pit's goo is nine soft blobs on a canvas. No canvas here,
             so this is the pit's own pop, three times for nine white circles. */
          /* R is the larger of the two objects' half-sizes, and "size" there is
             the SMALLER side, since the main pit takes min(w, h) / 2. Both the
             logo and the bone are wider than they are tall, so both half-sizes
             are half a height. The logo is the bigger of the two in every case,
             so its height decides it. */
          gooAt(w.x, w.y, now, ((lu.h ?? 0) * pxPerWorld) / 2);
          numAt(w.x, w.y, FUSE_POINTS, now);
          {
            const bIdx = toyBodiesRef.current.findIndex((t) => t === bonePr);
            if (bIdx >= 0) { setBoneOhYeaGone(false); setBoneFuse({ idx: bIdx, at: now }); }
            nearWas = false;
            setBoneNear(null); // the fuse fade takes over from the approach swap
          }
          // The logo has become part of the bone, so its body leaves the world
          // and its artwork leaves the screen.
          Composite.remove(world, logoB as never);
          lu.mbIn = false;
          const lg = uiLogoRef.current;
          if (lg) lg.style.display = "none";
          wake();
        };
        Events.on(engine, "beforeUpdate", onFuseMagnet);
        // ---- J17 stage 3: the fuse ------------------------------------------
        // Pressing a bomb lights it. The constraint already hit-tests in physics
        // space, so this hangs off its own drag events rather than a second set
        // of pointer handlers that could disagree about what was pressed.
        type DragEv = { body?: { plugin?: { bridge?: Body } } };
        Events.on(mc, "startdrag", (ev: DragEv) => {
          const br = ev?.body?.plugin?.bridge;
          if (!br?.bomb || br.blown) return;
          br.heldSince = performance.now();
          br.heldHits = 0;
          br.clickPending = true; // a quick release still counts as one hit
          pressedBombRef.current = br;
          wake();
        });
        Events.on(mc, "enddrag", (ev: DragEv) => {
          const br = ev?.body?.plugin?.bridge;
          if (!br?.bomb) return;
          if (br.clickPending && !br.blown) hitBomb(br);
          br.heldSince = 0; br.heldHits = 0; br.clickPending = false;
          if (pressedBombRef.current === br) pressedBombRef.current = null;
        });
        Events.on(mc, "startdrag", onStartDrag);
        const setPos = (cx: number, cy: number) => {
          const sv = svgEl as SVGSVGElement | null;
          if (!sv) return;
          const ctmNow = sv.getScreenCTM();
          if (!ctmNow) return;
          const pt = sv.createSVGPoint();
          pt.x = cx; pt.y = cy;
          const sp = pt.matrixTransform(ctmNow.inverse());
          const vNow = viewRef.current;
          const kNow = SIZE / vNow[2];
          const p = pxFromWorld(vNow[0] + sp.x / kNow, vNow[1] + sp.y / kNow);
          // Mutated in place, never replaced: Matter holds this same object as
          // the constraint's anchor point, so a fresh object would detach it.
          mouse.position.x = p.x;
          mouse.position.y = p.y;
        };
        const onDown = (e: PointerEvent) => {
          /* STALE GATE FIRST. A primary press means no other pointer is down,
             so any gate still set is left over from a release that never
             arrived: clear it, and a lost release costs one gesture at most. A
             second finger is never primary, so it cannot clear a live gate. */
          if (e.isPrimary) chumGateRef.current = null;
          // Another finger holds the gate open: this press arms nothing.
          if (chumGateRef.current != null) return;
          /* A PRESS ON A CHUM CARD OPENS THE GATE and does not arm the button.
             KNOWN COST, accepted: the cards are invisible to the constraint (see
             MC_CAT), so a press on a card used to grab the bone or dog lying
             underneath it. It no longer does. The card's own tap is React and
             never came through here, so collecting is untouched. */
          const tgt = e.target as globalThis.Node | null;
          if (tgt && chumsGRef.current?.contains(tgt)) {
            chumGateRef.current = e.pointerId;
            return;
          }
          /* A DOG CIRCLE NO LONGER TAKES THE GATE AT THE PRESS, 18 September
             2026 (owner). It used to: a circle that could start a chain was
             refused to the constraint outright, so the two gestures could not
             fight over one press. With the touching rule gone almost every
             circle on a duplicate-heavy level is a starter, so that rule would
             have made almost nothing draggable, which is exactly how Scottish
             Terrier broke before.

             EVERY CIRCLE ARMS THE DRAG NOW, and the chain takes the pointer off
             it later, through dogChainTakeoverRef, only once the finger has
             actually travelled DOG_CHAIN_ARM_PX. Nothing is decided here. */
          setPos(e.clientX, e.clientY);
          mouse.button = 0;
          flickBuf.length = 0;
          flickBuf.push({ t: performance.now(), x: mouse.position.x, y: mouse.position.y });
          wake();
        };
        /* THE HANDOVER: the drag lets go, mid press, and the chain takes the
           pointer. Called from the chain's own pointermove the moment the finger
           passes DOG_CHAIN_ARM_PX, and never otherwise.

           THE THREE THINGS IT HAS TO SETTLE FIRST, in this order, because
           releasing the constraint runs enddrag and enddrag reads all of them.
           The constraint grabs whatever body lies under the press point IN
           PHYSICS SPACE, which is not necessarily the dog circle whose element
           was pressed: a chip, a bomb, a toy or the bone may be the thing
           actually being carried.

             A BOMB. startdrag set clickPending, and enddrag turns that into a
             free hitBomb. A chain that happens to start over a bomb must not
             detonate a hit, so the pending click is dropped before the release.

             A TOY. enddrag reads flickBuf and can throw what it was holding.
             DOG_CHAIN_ARM_PX of travel across a few frames is quite enough to
             register as a flick, so the buffer is emptied and the n >= 2 guard
             in onEndDrag fails.

             THE BUTTON, NEVER mcReleaseRef. mcReleaseRef clears the constraint
             by hand and skips enddrag altogether, which is what leaves a held
             bomb's fuse burning (see the note on onUp). mouse.button = -1 is the
             release that runs the whole teardown, one engine step later, which
             is why the sim is woken: asleep, it would never take that step and
             the body would stay attached to a pointer the chain now owns.

           THE CARRIED BODY'S VELOCITY IS LEFT ALONE. It has been pulled up to
           DOG_CHAIN_ARM_PX and it falls back carrying whatever the constraint
           gave it, which is a few pixels' worth. Zeroing it would read as the
           body freezing in mid air, which is worse than the drift. */
        dogChainTakeoverRef.current = (pointerId: number) => {
          // Another press already holds the gate: this one is not ours to take.
          if (chumGateRef.current != null) return false;
          // The ref is untyped, like every other reader of it: see the fuse.
          const br = pressedBombRef.current as Body | null;
          if (br) br.clickPending = false;
          flickBuf.length = 0;
          mouse.button = -1;
          chumGateRef.current = pointerId;
          wake();
          return true;
        };
        const onMove = (e: PointerEvent) => {
          if (mouse.button === 0) {
            setPos(e.clientX, e.clientY);
            const t = performance.now();
            flickBuf.push({ t, x: mouse.position.x, y: mouse.position.y });
            while (flickBuf.length > 1 && t - flickBuf[0].t > 120) flickBuf.shift();
            wake();
          }
        };
        const onUp = (e: PointerEvent) => {
          // Only the pointer that opened the gate may close it.
          if (chumGateRef.current === e.pointerId) chumGateRef.current = null;
          // Release always goes through the button, never mcReleaseRef: that
          // skips enddrag and leaves a held bomb's fuse burning.
          mouse.button = -1;
        };
        // A release the window never hears (focus lost, tab hidden) must not
        // leave the gate shut. Flag only: the button is left as it was.
        const clearGate = () => { chumGateRef.current = null; };
        st.addEventListener("pointerdown", onDown);
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
        window.addEventListener("blur", clearGate);
        document.addEventListener("visibilitychange", clearGate);
        mcTeardown = () => {
          mcReleaseRef.current = null;
          // It closes over this world's mouse and flick buffer, so it must not
          // outlive them.
          dogChainTakeoverRef.current = null;
          chumGateRef.current = null;
          window.removeEventListener("blur", clearGate);
          document.removeEventListener("visibilitychange", clearGate);
          Events.off(mc, "startdrag", onStartDrag);
          Events.off(mc, "enddrag", onEndDrag);
          // The fuse rides on the ENGINE, not the constraint, so it has to come
          // off here too: without this a level change leaves a listener holding
          // the old world's bodies alive.
          Events.off(engine, "beforeUpdate", onFuseMagnet);
          st.removeEventListener("pointerdown", onDown);
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          window.removeEventListener("pointercancel", onUp);
        };
      }
      matterCleanupRef.current = () => {
        mcTeardown?.();
        Events.off(engine, "collisionStart", onCollide);
        Events.off(engine, "collisionActive", onFloorActive);
        Events.off(engine, "collisionEnd", onFloorEnd);
        for (const t of toyTimers) window.clearTimeout(t);
        for (const t of ghostTimers) window.clearTimeout(t);
        chumBodiesRef.current = [];
        setChumList([]);
        // Indices are per flood, so a new one must not inherit the old holes.
        setChumGone(new Set());
        chumTakenRef.current = new Set();
        // A remembered chain belongs to the
        // pit that made it: a level change must not leave one waiting on a
        // circle that no longer exists.
        dogChainRef.current = null;
        dogChainBreedRef.current = null;
        dogChainNodesRef.current = new Set();
        if (chumFlyRaf.current != null) { cancelAnimationFrame(chumFlyRaf.current); chumFlyRaf.current = null; }
        chumFlyRef.current = new Map();
        setArmedChum(null);
        setTakenChum(null);
        Composite.clear(engine.world, false);
        Engine.clear(engine);
      };
      wake();
    };
    runFallRef.current = doFall;
    /* ARM THE PIT, 9 Sept 2026 (owner), the green pit-menu square's restart.
       doFall is called directly rather than through the ref, and the flag is
       cleared first, so this can only ever fire once per mount. Everything else
       here is exactly what the PLAY button does. */
    if (autoStartRef.current) {
      autoStartRef.current = false;
      setLearnPeek(false);
      setStartPeek(false);
      if (!hideCaption) onToggleCaption?.();
      onPlayPressed?.();
      setLearning(false);
      setStarted(true);
      doFall();
    }
    registerSlowmo?.(() => slowmoRef.current?.());
    registerShake?.(() => {
      // a shake also starts the round, so the button never blocks the pit
      if (!fellRef.current) { setLearnPeek(false); setStartPeek(false); setStarted(true); runFallRef.current?.(); }
      shakeInnerRef.current?.();
    });
    // No timer: the circles hang until the visitor presses START.
    return () => { cancelAnimationFrame(fallRafRef.current); window.clearTimeout(fullPollRef.current); matterCleanupRef.current?.(); matterCleanupRef.current = null; };
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

  // ---- J17 stage 1: the canvas effects layer ------------------------------
  // The canvas sits on top of the SVG, fills the same box and never takes a
  // pointer. Registration is the whole job: the SVG has its own viewBox and the
  // pit pans and zooms inside it, so the canvas has to be told where world
  // space is on every frame or an effect drifts off the circle it belongs to.
  //
  // Two transforms compose:
  //   world -> svg user units   (x - v[0]) * k, live, changes every frame
  //   svg   -> client px        getScreenCTM(), only changes on layout
  //
  // The CTM is cached and refreshed on resize and scroll rather than read per
  // frame, because reading it forces a layout and the sim already writes to the
  // DOM on every tick. The live half is just viewRef, which costs nothing.
  //
  // The loop only runs when there is something to draw. It stands down as soon
  // as the last effect dies and is kicked awake by the next emission, so a
  // settled pit costs nothing.
  useEffect(() => {
    const cv = fxCanvasRef.current;
    const st = stageRef.current;
    if (!cv || !st) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    let box: { a: number; b: number; c: number; d: number; e: number; f: number } | null = null;
    let dpr = 1;

    // The canvas and the SVG are both inset:0 on the stage, so they are the same
    // rectangle and the SVG's screen transform applies to the canvas unchanged
    // once the canvas origin is subtracted.
    const remeasure = () => {
      const svg = st.querySelector("svg") as SVGSVGElement | null;
      const r = cv.getBoundingClientRect();
      const ctm = svg ? svg.getScreenCTM() : null;
      if (!ctm || !r.width || !r.height) { box = null; return; }
      box = { a: ctm.a, b: ctm.b, c: ctm.c, d: ctm.d, e: ctm.e - r.left, f: ctm.f - r.top };
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pw = Math.round(r.width * dpr), ph = Math.round(r.height * dpr);
      if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
    };

    remeasure();
    const ro = new ResizeObserver(remeasure);
    ro.observe(st);
    window.addEventListener("scroll", remeasure, true);
    window.addEventListener("resize", remeasure);

    let raf = 0;
    let painted = false;

    const frame = () => {
      const kit = fxKitRef.current;
      const busy = kit ? !kit.idle() : false;
      if (!busy) {
        // one last clear, then stand down until something is emitted
        if (painted) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); painted = false; }
        raf = 0;
        return;
      }
      painted = true;
      raf = requestAnimationFrame(frame);
      if (!box) { remeasure(); return; }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      const v = viewRef.current;
      const k = SIZE / v[2];
      // world -> device px in one matrix, so every draw call below is written in
      // plain world coordinates and needs no conversion of its own
      const A = box.a * k, B = box.b * k, C = box.c * k, D = box.d * k;
      const E = box.a * -v[0] * k + box.c * -v[1] * k + box.e;
      const F = box.b * -v[0] * k + box.d * -v[1] * k + box.f;
      ctx.setTransform(dpr * A, dpr * B, dpr * C, dpr * D, dpr * E, dpr * F);
      // The blast routines are tuned in pit pixels, so hand them a transform
      // where one unit is one pit pixel. Derived by mapping three points rather
      // than assuming the two transforms are pure scale-and-translate.
      const wfp = fxFromPxRef.current;
      const kit2 = fxKitRef.current;
      if (wfp && kit2) {
        const w2d = (w: { x: number; y: number }) => ({ x: dpr * (A * w.x + C * w.y + E), y: dpr * (B * w.x + D * w.y + F) });
        const o = w2d(wfp(0, 0)), ex = w2d(wfp(1, 0)), ey = w2d(wfp(0, 1));
        ctx.save();
        ctx.setTransform(ex.x - o.x, ex.y - o.y, ey.x - o.x, ey.y - o.y, o.x, o.y);
        kit2.draw(ctx, performance.now());
        ctx.restore();
      }
    };
    fxKickRef.current = () => { if (!raf) raf = requestAnimationFrame(frame); };

    return () => {
      cancelAnimationFrame(raf);
      fxKickRef.current = null;
      ro.disconnect();
      window.removeEventListener("scroll", remeasure, true);
      window.removeEventListener("resize", remeasure);
    };
  }, [nodes]);

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
  // chums2 (D74 #2): breed PHOTOS appear ONLY inside a zoomed circle. At rest (focus is
  // the root) every circle is stroke-only; once the user zooms into a circle (focus is
  // not the root) AND the pointer is within that subtree (hovered in imgZoomSet), the
  // focused circle and its visible descendants show their photos. Leaving the circle
  // (hovered null / outside) or zooming out reverts to stroke-only. displayOnly only.
  const imgZoomSet = displayOnly && focus !== nodes[0] ? new Set(focus.descendants()) : null;
  const imgZoomOn = !!imgZoomSet && !!hovered && imgZoomSet.has(hovered);
  // Hovering shows the short write-up; clicking into a circle shows the extended
  // one. hovered is non-null only while the pointer is over a circle, so a null
  // hovered with shown back on focus means the user has clicked in, not pointed.
  const isFocused = hovered === null && shown === focus;
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
  // The box header now follows the shown circle, mirroring the page-top title:
  // its image and its living/extinct status, updated as you hover.
  const shownHeadImg = shown === nodes[0] ? (rootImage ?? nodes[0].data.img) : shown.data.img;
  const shownTag = nodeStatus(shown.data.name, shown === nodes[0] ? (rootNote ?? nodes[0].data.note ?? "") : (shown.data.note ?? ""));
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
      // A zero-chum node clears the rail AT ONCE, no exit animation. Without this
      // the previous node's cards would animate out on top of it, reading as if
      // this node owned them (a 12-chum parent's dogs flashing on a zero-chum
      // child). No cards to leave means no flash, so the empty rail reads as
      // intentional. Deep ancestors legitimately have zero chums, see lineageArchive.
      if (!railDogs.length) return [];
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

  /* THE VIEWPORT CLAMP, run on every change rather than only when the box shut.

     Declared HERE, below renderRail, not up with the other rail state: a const
     cannot be read from above where it is declared and tsc caught it.
     It rides on a transform, NOT on railPin, and that is the whole point. A pin
     is permanent: one deep circle with fourteen chums in it would shove the rail
     somewhere legal and leave it there for the rest of the session. A transform
     is measured fresh each time, so `nat` below recovers the position the rail
     WOULD have without it, and the offset falls back to zero the moment the rail
     fits on its own. Nothing sticks.

     .relRail carries no transform of its own, so this cannot fight an animation.
     The cards inside it do animate, which is why the observer watches the rail
     element and not a card. */
  const [railNudge, setRailNudge] = useState({ dx: 0, dy: 0 });
  /* MEASURED BEFORE THE PAINT, NOT AFTER, 16 September 2026 (owner: the rail keeps
     moving around for a split second before it settles, worst while scrolling).

     WHY IT JUMPED. The rail is a DOM child of the main blue box, so it starts each
     render wherever that box puts it, and this clamp then measures it and nudges
     it into place. As a useEffect that ran AFTER the browser had painted, so every
     re-render showed one frame of the rail sitting in the box's position before the
     correction landed. Scrolling re-renders constantly, which is why it was worst
     there.

     useLayoutEffect runs after the DOM is updated and BEFORE the paint, so the
     measure and the nudge happen in the same frame and the intermediate position is
     never drawn. Same code, same measurements: only the timing changes.

     The ResizeObserver and the resize listener still fire asynchronously, which is
     correct. Those are real changes to the rail's size, not the render flash. */
  useLayoutEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const fit = () => {
      const node = railRef.current;
      if (!node) return;
      const r = node.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const pad = 8;
      const natL = r.left - railNudge.dx;
      const natT = r.top - railNudge.dy;
      const dx = Math.max(pad, Math.min(natL, Math.max(pad, window.innerWidth - r.width - pad))) - natL;
      const dy = Math.max(pad, Math.min(natT, Math.max(pad, window.innerHeight - r.height - pad))) - natT;
      if (Math.abs(dx - railNudge.dx) < 0.5 && Math.abs(dy - railNudge.dy) < 0.5) return;
      setRailNudge({ dx: Math.round(dx), dy: Math.round(dy) });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    window.addEventListener("resize", fit);
    return () => { ro.disconnect(); window.removeEventListener("resize", fit); };
    // renderRail, railHidden and focus are triggers rather than reads: the rail
    // changes size with its contents, reappears when it is un-hidden, and a zoom
    // is where this was noticed. No disable needed, the list is complete.
  }, [renderRail, railHidden, railNudge, focus]);
  // Every pack dog this level produces, across EVERY circle in it, not just the
  // hovered one and not just the big ones. This is the flood's cast: the true
  // union of the rail lists, so it is a subset of the 54, never all of them.
  //
  // It used to filter depth === 1, which quietly cut the flood to the two outer
  // circles. On Celtic Heeler that meant 3 dogs fell instead of 17, because
  // "Old hunting dogs of the Celts" carries 14 of them on its own and sits at
  // depth 2. The comment here already claimed this was the union of the rail
  // lists; the rail follows nested circles, so now it actually is.
  const levelChums = useMemo(() => {
    const names = [...new Set(nodes.filter((n) => n.depth > 0).map((n) => n.data.name))];
    if (!names.length) return [] as { image: string; band: string; name: string }[];
    return descendantPackBreeds(names)
      .filter((b) => !!b.image && !collectedChums?.has(b.name))
      // The NAME rides along now. It was dropped here, which is why a card in
      // the flood could not say what it was when it was collected. The tally is
      // keyed by name and the filter above already reads it, so it was the one
      // piece missing between a card on the floor and a chum in the set.
      .map((b) => ({ image: b.image, band: b.sizeBand as string, name: b.name }));
  }, [nodes, collectedChums]);
  useEffect(() => { chumImagesRef.current = levelChums; }, [levelChums]);
  /* ===================== REMOVE BEFORE LAUNCH, ?floorbox=1 ====================
     Re-measures on every resize and orientation change, because an iPhone's
     reported width moves as the browser chrome collapses and that is one of the
     things under suspicion here. */
  useEffect(() => {
    if (!floorBoxOn()) return;
    const read = () => {
      const lv = levelLayerRef.current;
      const fl = levelFloorRef.current;
      const vv = window.visualViewport;
      const r = (n: number | undefined) => (n === undefined ? "-" : Math.round(n * 10) / 10);
      setFloorDiag([
        `innerWidth      ${r(window.innerWidth)}`,
        `visualViewport  ${r(vv?.width)}`,
        `docEl client    ${r(document.documentElement.clientWidth)}`,
        `.level    x/w   ${r(lv?.getBoundingClientRect().left)} / ${r(lv?.getBoundingClientRect().width)}`,
        `.levelFloor x/w ${r(fl?.getBoundingClientRect().left)} / ${r(fl?.getBoundingClientRect().width)}`,
        `img natural w   ${r(fl?.naturalWidth)}`,
        `img client  w   ${r(fl?.clientWidth)}`,
        `img offset  w   ${r(fl?.offsetWidth)}`,
        `img css     w   ${fl ? getComputedStyle(fl).width : "-"}`,
        `.level css  w   ${lv ? getComputedStyle(lv).width : "-"}`,
        `dpr             ${r(window.devicePixelRatio)}`,
      ].join("\n"));
    };
    /* POLLED, NOT A SINGLE SHOT. The first version of this read once at 300ms and
       every element line came back "-": the .level layer is gated on
       dockAside && gravity && levelTheme and had not mounted yet, so both refs
       were still null and the readout measured nothing.
       Four times a second, giving up after 40 tries, so it cannot poll for ever
       if the layer never appears. */
    let tries = 0;
    const id = window.setInterval(() => {
      read();
      if (++tries > 40) window.clearInterval(id);
    }, 250);
    window.addEventListener("resize", read);
    window.visualViewport?.addEventListener("resize", read);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("resize", read);
      window.visualViewport?.removeEventListener("resize", read);
    };
  }, []);
  /*      The swipe chain gesture.
     Everything here reads refs, never state, so binding once is safe: this is
     the stale-closure trap noted on collectChum, avoided rather than risked. */
  useEffect(() => {
    type Chain = {
      id: number; pending: boolean; cards: number[]; px: number; py: number; fx: number; fy: number;
      // What this chain is made of. See ChainKind below.
      kind: ChainKind;
      // Link index (cards[s] to cards[s + 1]) -> when it first went over the
      // slack and its gap now, as a share of a card side. Healthy links are absent.
      strain: Map<number, { since: number; share: number }>;
      // Set once, never cleared: the link that broke and the gap that broke it.
      dead: { link: number; a: number; b: number; share: number } | null;
      // The finger re-entered the first card and the loop closed. Link
      // cards.length - 1 is then the closing link, last card back to first.
      closed: boolean;
      // Refreshed every frame: closing from the last card would be legal now.
      canClose: boolean;
      // When the last card joined, which is what the join clock counts from.
      lastJoin: number;
      /* WHERE THE PRESS LANDED, while it is still undecided. Set only for a kind
         with an armPx, and cleared the moment the finger travels that far and
         the chain takes the pointer off the drag. While it is set the chain is
         inert: it joins nothing, draws nothing and its join clock has not
         started, so a press held still for a minute is still just a press. */
      hold: { x: number; y: number } | null;
    };
    // Links in the chain, and the two cards at each end of link s. A closed
    // loop has one link more than cards minus one: the closing link wraps.
    const linkCount = (ch: Chain) => (ch.closed ? ch.cards.length : ch.cards.length - 1);
    const linkEnds = (ch: Chain, s: number): [number, number] => [ch.cards[s], ch.cards[(s + 1) % ch.cards.length]];
    let chain: Chain | null = null;
    let raf: number | null = null;

    // The card under a client point, by the browser's own hit test. Topmost
    // chum card wins; anything that is not a card is looked straight through.
    const cardAt = (cx: number, cy: number): number | null => {
      const gg = chumsGRef.current;
      if (!gg) return null;
      for (const hit of document.elementsFromPoint(cx, cy)) {
        if (hit === gg || !gg.contains(hit)) continue;
        let c: globalThis.Node | null = hit;
        while (c && c.parentNode !== gg) c = c.parentNode;
        const i = c ? Array.prototype.indexOf.call(gg.children, c) : -1;
        if (i >= 0) return i;
      }
      return null;
    };
    // A card as drawn: the frame writer's own centre and angle, and the size
    // read off the card's edge rect, in pit SVG units.
    const geo = (i: number): ChainSq | null => {
      const pr = chumBodiesRef.current[i];
      const edge = chumsGRef.current?.children[i]?.querySelector("[data-chum-edge]");
      const side = edge ? parseFloat(edge.getAttribute("width") || "0") : 0;
      if (!pr || !side) return null;
      const v = viewRef.current;
      const k = SIZE / v[2];
      return { x: (pr.x - v[0]) * k, y: (pr.y - v[1]) * k, a: pr.a, h: side / 2 };
    };
    /* ONE GESTURE, A KIND PER THING IT CHAINS (18 September 2026).

       Everything else in this effect is the gesture itself and knows nothing
       about what is being chained: the finger sweep and its sampling, the join
       clock, the crossing test, the per frame link test, the strain and break
       states, the kill rules, the collapse, the tone, the drawing and the panel.

       A kind supplies only the parts that differ: how to tell whether a press
       belongs to it, what lies under a point, the shape of one of its things,
       how far apart two of them are, whether one can be chained just now, any
       rule of its own for joining, whether it must close a circuit, and what a
       valid release does. Adding a chain of something else is one of these and
       no changes here.

       gapShare is the separation between two things as a SHARE OF THEIR SIZE, so
       CHAIN_TOUCH_SLACK means the same thing whatever shape they are. */
    type ChainKind = {
      key: string;
      colour: string;                                     // the path's own colour
      circuit: boolean;                                   // must close a loop to pay
      minCards: number;                                   // fewest that can pay
      owns: (t: globalThis.Node) => boolean;              // is this press ours
      idAt: (cx: number, cy: number) => number | null;    // what is under a point
      geo: (i: number) => ChainSq | null;                 // where and how big
      /* WHERE A THING IS, IN WORLD COORDINATES, or null if it has gone. geo()
         above cannot answer this: it returns SCREEN geometry for the path, so it
         moves with the zoom. The join flash and its sparks are drawn in the fx
         layer, which is world space, and each kind keeps its position in a
         different place: a chum card in chumBodiesRef, a dog circle on its node.
         One method, so the score hook does not have to know which. */
      at: (i: number) => { x: number; y: number } | null;
      /* HOW FAR THIS KIND PULLS, as a share of the candidate's radius, or
         undefined for a kind that pulls not at all. See DOG_CHAIN_MAGNET. */
      magnet?: number;
      /* WHAT THE PULL FINDS, when the hit test found nothing. Given the chain so
         it can refuse to name anything the rules would then punish: see the note
         on DOG's own. Undefined for a kind with no magnet. */
      nearAt?: (ch: Chain, cx: number, cy: number) => number | null;
      gapShare: (a: ChainSq, b: ChainSq) => number;       // gap as a share of size
      /* HOW WIDE A GAP THIS KIND'S LINKS MAY HOLD, as a share of size, and the
         one place the touching rule lives. Every test reads it: the join, the
         per-frame strain check, the release judgement and the circuit close. The
         cards keep CHAIN_TOUCH_SLACK; the circles take DOG_CHAIN_SLACK, which is
         Infinity, so they do not have to touch at all. */
      slack: number;
      /* HOW FAR THE FINGER MUST TRAVEL before a press of this kind becomes a
         chain, in client px. 0 means the press is the chain, which is the chum
         cards: their press claims the gate outright and no body underneath is
         ever grabbed. The circles take DOG_CHAIN_ARM_PX, so the drag arms first
         and the chain takes the pointer off it only once the finger has moved.
         See the constant, and dogChainTakeoverRef for the handover itself. */
      armPx: number;
      busy: (i: number) => boolean;                       // in flight, cannot join
      taken: (i: number) => boolean;                      // gone since it joined
      startable: (i: number) => boolean;                  // may open a chain
      joinBlock: (ch: Chain, i: number) => string | null; // the kind's own rule
      /* WHAT THE KIND'S OWN RULE MEANS WHEN IT SAYS NO. True and the chain dies
         where it stands, which is the cards. False and the thing under the
         finger is simply not joined: the chain carries on, unharmed, and the
         finger can keep going. Only joinBlock is softened by this. The shared
         rules are not: re-entering a circle already in the chain and crossing
         the path both still kill, for every kind. */
      blockKills: boolean;
      /* DOES A LINK CROSSING THE PATH KILL THIS KIND (owner, 18 September 2026).

         The chum cards keep it, and it is half of what their circuit means: a loop
         that crosses itself is not a loop the player drew round anything, so the
         rule is the shape rule and it stays exactly as it is.

         The circles do not. A dog chain reaches across a packed pit with no
         touching rule at all (DOG_CHAIN_SLACK) and a magnet that pulls circles in
         from beyond the finger, so a long run over a cluster crossed its own path
         constantly and died for a shape nobody was trying to draw. It is scoped
         here for the same reason slack and blockKills are: one field, both kinds,
         no branch on the kind's key.

         closeBlock's own crossing test is NOT gated, and does not need to be: it
         returns early for a kind that does not close, and the circles are an open
         run. Gating it would be dead code pretending to be a rule. */
      crossKills: boolean;
      /* HAS THIS CHAIN TAKEN EVERY LIVE CIRCLE OF ITS BREED? Undefined for a
         kind that has no such idea, which is the chum cards: their circuit is
         untouched by every part of this. A kind that answers true is COMPLETED
         ON THE SPOT, without waiting for the finger to lift: see completeChain. */
      sweptAll?: (ch: Chain) => boolean;
      settle: (ch: Chain) => string;                      // a valid release
      first?: (i: number) => void;                        // the chain's first thing
      joined?: (i: number) => void;                       // one more thing joined
      over?: () => void;                                  // the chain is gone
      // A press that finds nothing under it cannot start this kind. The cards
      // start on the press itself and do not care; the circles must not, or a
      // press the hit test misses would take the gate and refuse a drag.
      needsHit?: boolean;
    };
    const CARD: ChainKind = {
      key: "chum card",
      colour: "#ffffff",
      circuit: true,
      minCards: CHAIN_MIN_CARDS,
      owns: (t) => !!chumsGRef.current?.contains(t),
      idAt: cardAt,
      geo,
      // The card's own bridge, which holds its live world position whatever the
      // physics has done with it.
      at: (i) => { const b = chumBodiesRef.current[i]; return b ? { x: b.x, y: b.y } : null; },
      gapShare: (a, b) => chainSquareGap(a, b) / (Math.max(a.h, b.h) * 2),
      slack: CHAIN_TOUCH_SLACK, // cards touch, exactly as they always have
      armPx: 0, // a card's press IS the chain: it takes the gate on the spot
      busy: (i) => chumFlyRef.current.has(i),
      taken: (i) => chumTakenRef.current.has(i),
      startable: () => true,
      joinBlock: () => null, // touching and no crossing is the whole rule
      blockKills: true, // the cards are unchanged: a wrong card kills the chain
      crossKills: true, // and so does a link across the path: the loop is the point
      settle: (ch) => {
        const cards = [...ch.cards];
        chainClearRef.current?.(cards);
        const r = chainBonusRef.current?.(cards);
        return r
          ? `CLEARED, circuit closed, ${cards.length} cards: ${r.sum} x${r.mult.toFixed(1)} = ${r.sum + r.bonus} (bonus ${r.bonus})`
          : `CLEARED, circuit closed, ${cards.length} cards`;
      },
    };
    /* The dog circles, as a kind. Everything
       it does not name here it gets from the gesture: the sweep, the clock, the
       crossing test, the breaks, the kills, the collapse, the tone and the path.

       IT READS REFS, NEVER STATE. nodesRef is the packed nodes, the owned set is
       the live pit and the removed set is what has gone, all of them refs, so
       these listeners can stay bound once. */
    /* CLIENT PIXELS INTO THE PATH'S OWN SPACE, and the matrix cached for a frame.

       geo() answers in the pit's user units and a pointer event arrives in client
       px, so the magnet has to cross between them. draw() already does this with
       getScreenCTM for the finger's live end, but getScreenCTM FORCES LAYOUT and
       the sweep can call this a dozen times inside a single pointermove. Reading
       it once a frame costs what draw() already costs and no more.

       `perPx` comes out of the same matrix and is what the CHAIN_SAMPLE_PX floor
       is measured in, so the floor means the same thing at every zoom. */
    let ctmAt = 0;
    let ctmInv: DOMMatrix | null = null;
    let ctmPerPx = 1;
    const toUser = (cx: number, cy: number): { x: number; y: number } | null => {
      const g = chainGRef.current;
      const sv = g?.ownerSVGElement;
      if (!g || !sv) return null;
      const now = performance.now();
      if (!ctmInv || now - ctmAt > 16) {
        const m = g.getScreenCTM();
        if (!m) return null;
        ctmInv = m.inverse();
        ctmPerPx = Math.hypot(ctmInv.a, ctmInv.b) || 1;
        ctmAt = now;
      }
      const pt = sv.createSVGPoint();
      pt.x = cx; pt.y = cy;
      const q = pt.matrixTransform(ctmInv);
      return { x: q.x, y: q.y };
    };
    const circleAt = (cx: number, cy: number): number | null => {
      const cg = circlesRef.current;
      if (!cg) return null;
      for (const hit of document.elementsFromPoint(cx, cy)) {
        if (hit === cg || !cg.contains(hit)) continue;
        let c: globalThis.Node | null = hit;
        while (c && c.parentNode !== cg) c = c.parentNode;
        const i = c ? Array.prototype.indexOf.call(cg.children, c) : -1;
        if (i >= 0) return i;
      }
      return null;
    };
    const dogNode = (i: number): Node | null => nodesRef.current[i] ?? null;
    // In the pit and still there: owned by the physics and not removed.
    const dogInPit = (n: Node | null): n is Node =>
      !!n && !!pitBodiesRef.current?.owned.has(n) && !removedNodesRef.current.has(n);
    /* Is there another circle of this breed in the pit at all? Asked at the
       moment of the press and never cached: circles pop and go constantly. The
       hidden root and echoes (a circle named after its own parent) are not
       duplicates, so neither is counted.

       NO GEOMETRY, 18 September 2026 (owner). This used to ask whether a twin
       was TOUCHING, because a join asked the same. A join no longer asks it, so
       neither does this: the two are still the same question, which is the
       property that matters. See DOG_CHAIN_SLACK. */
    /* THIS ANSWER IS LIVE, AND THAT IS THE POINT (owner, 18 September 2026).

       It reads the owned set less removedNodes, so a breed with two circles is a
       twin pair until one is collected, at which moment the survivor BECOMES
       UNIQUE. A pit converges on uniqueness as it is played, so this changes
       constantly through a round.

       ANYTHING SHOWING "IS THIS UNIQUE" AT REST THEREFORE FLIPS MID-ROUND, and a
       circle will change appearance as a consequence of a DIFFERENT circle being
       collected. That was considered as a fault and ruled the other way: THE
       COLOUR MUST ALWAYS BE TRUE. A signal that was frozen at the drop would go
       on claiming a circle has a twin after the twin has gone, which is worse
       than a change the player did not directly cause.

       SO DO NOT FREEZE IT, and do not treat the flip as a bug to be smoothed
       away. It is given a short fade rather than an instant cut, because the
       change is information and an instant flip on an untouched circle reads as a
       glitch, but the timing of the answer is not softened, only its paint.

       Asking it per PRESS, which is what the chain does, has none of this to
       think about: the answer only has to be true at the moment it is asked. */
    // ONE WALK, SHARED WITH chSingle AND THE SWEEP BONUS: see liveBreedNodesIn.
    // n itself is countable, so "has a twin" is a live count above one.
    const liveBreed = (name: string) =>
      liveBreedNodesIn(pitBodiesRef.current?.owned, removedNodesRef.current, name);
    const dogHasTwin = (n: Node): boolean => liveBreed(n.data.name).length > 1;
    /* Named rather than inline, because the magnet measures with the SAME numbers
       the path and the crossing test use. Two spellings of a circle's geometry is
       how the two would quietly drift apart. */
    const dogGeo = (i: number): ChainSq | null => {
      const n = dogNode(i);
      if (!dogInPit(n)) return null;
      const v = viewRef.current;
      const k = SIZE / v[2];
      // `h` is the radius, and a circle has no angle worth reading.
      return { x: (n.x - v[0]) * k, y: (n.y - v[1]) * k, a: 0, h: n.r * k };
    };
    const DOG: ChainKind = {
      key: "dog circle",
      colour: DOG_CHAIN_COLOUR,
      circuit: false, // an open run, never a loop and never a lasso
      minCards: DOG_CHAIN_MIN,
      owns: (t) => !!circlesRef.current?.contains(t),
      idAt: circleAt,
      geo: dogGeo,
      gapShare: chainCircleGapShare,
      // A circle IS its node, so the node carries the position. Null once it has
      // left the pit, which is what dogInPit already answers everywhere else.
      at: (i) => { const n = dogNode(i); return dogInPit(n) ? { x: n.x, y: n.y } : null; },
      magnet: DOG_CHAIN_MAGNET,
      /* NEAREST EDGE, NOT NEAREST CENTRE. Nearest centre systematically favours
         big circles: a 60px circle whose rim is 50px away has a nearer CENTRE
         than a 20px circle whose rim is 20px away, so the big one would win even
         when the finger is plainly closer to the small one. `gap` is distance to
         the rim, which is what the eye is judging, and it falls out of the same
         measurement the halo needs anyway.

         IT NAMES ONLY WHAT WOULD ACTUALLY JOIN, and that is the part to keep:

           A circle ALREADY IN THE CHAIN is skipped. Re-entering one kills the
           chain, and a kill must stay something the player DID: an exact hit
           still kills, as it always has, but a near miss they never made must
           never take the round off them.

           A circle of the WRONG BREED is skipped. It would only refuse, so the
           outcome would be the same, but it would have STOLEN the sample from a
           right-breed circle that was also in range. The finger passing freely
           over other breeds is the whole point of the reach.

           AN EMPTY CHAIN pulls nothing. The first circle is the one PRESSED
           (needsHit), and a chain that opened on a circle the player did not
           choose is worse than one that did not open.

         Everything else is left to joinAt exactly as before: the crossing test,
         the join clock and the settle all run on whatever index comes back, so
         the pull cannot smuggle a circle past a rule. */
      nearAt: (ch, cx, cy) => {
        const cards = ch.cards;
        if (!cards.length) return null;
        const first = dogNode(cards[0]);
        if (!first) return null;
        const u = toUser(cx, cy);
        if (!u) return null;
        const floor = CHAIN_SAMPLE_PX * ctmPerPx; // the sampling step, in user units
        const nodes = nodesRef.current;
        let best = -1, bestGap = Infinity;
        for (let i = 0; i < nodes.length; i++) {
          if (cards.includes(i)) continue;               // a pull must never kill
          const n = nodes[i];
          if (!n || n.data.name !== first.data.name) continue; // never steal the sample
          const q = dogGeo(i);
          if (!q) continue;                              // gone from the pit
          const gap = Math.hypot(u.x - q.x, u.y - q.y) - q.h;
          if (gap >= bestGap) continue;
          if (gap > Math.max(q.h * DOG_CHAIN_MAGNET, floor)) continue;
          bestGap = gap; best = i;
        }
        return best >= 0 ? best : null;
      },
      slack: DOG_CHAIN_SLACK, // no touching rule at all: see the constant
      armPx: DOG_CHAIN_ARM_PX, // a short movement is a drag, a longer one a chain
      busy: (i) => !dogInPit(dogNode(i)),
      taken: (i) => !dogInPit(dogNode(i)),
      /* DUPLICATES ONLY, AND NOTHING ELSE (18 September 2026, owner). A one-off
         dog cannot begin a chain, which is the whole rule: a chain is for a pit
         holding the same breed several times over.

         THE TOUCHING CONDITION HAS GONE WITH THE JOIN'S. For a day a starter
         also needed a twin touching it, so that what could start a chain and
         what could join one were the same question. They still are: a join now
         asks only for the breed, so this asks only for the breed too.

         THE DRAG. Making almost every circle on a duplicate-heavy level a
         starter is exactly what broke dragging on Scottish Terrier before, when
         a starter press disarmed the mouse constraint outright. It no longer
         does: the press arms the drag as it always did and only a movement past
         DOG_CHAIN_ARM_PX hands the pointer to the chain. That is the commit
         that follows this one, and this rule leans on it. */
      startable: (i) => {
        const n = dogNode(i);
        if (!dogInPit(n) || n.depth === 0 || isHiddenCopy(n)) return false;
        return dogHasTwin(n);
      },
      joinBlock: (ch, i) => {
        const first = dogNode(ch.cards[0]), n = dogNode(i);
        if (!first || !n) return "a circle went missing";
        if (n.data.name !== first.data.name) return `WRONG BREED, #${i} is ${n.data.name}, not ${first.data.name}`;
        return null;
      },
      /* A WRONG BREED REFUSES, IT DOES NOT KILL (owner, 18 September 2026,
         confirmed on the device).

         WHAT WAS WRONG. Dropping the touching rule was supposed to let a chain
         reach across the pit and did not, because the wrong-breed circle killed
         it. The pit is packed and the sweep samples the finger's path every
         CHAIN_SAMPLE_PX, so any reach worth the name crossed a circle of some
         other breed within a few pixels of leaving the first one and the chain
         died at once. Free links and a kill on everything between them cannot
         both be true.

         SO THE FINGER PASSES FREELY over other breeds on its way to the next
         twin. They are simply not joined. Nothing about them is remembered and
         the chain is not marked in any way.

         A CIRCLE THAT WENT MISSING refuses too, and that is deliberate rather
         than incidental: it is how the rest of the gesture already treats a
         circle that has left, busy() and a null geo() both refuse, and judge()
         catches a vanished card at release, where the chain is settled anyway.

         WHAT STILL KILLS a dog chain, unchanged: re-entering a circle already in
         it, and a link that crosses the path. Both are shared rules, neither is
         this kind's own, and neither is touched here. The chum cards are not
         touched at all. */
      blockKills: false,
      crossKills: false, // an open run over a packed pit may cross itself freely
      /* THE FIRST CIRCLE OPENS, and only that one. The others stay where they
         are until it is completed, which is what closes them: see dogChainRef
         and the block in the layer's onRemove. The chain is remembered by NODE,
         not by index, because a pop re-packs the tree and the indices move. */
      /* SURVIVORS ONLY, AND ASKED PER JOIN, NOT PER FRAME. A bomb that kills a
         twin while the chain is being drawn shrinks the target; the player is
         never failed for a circle that died after they passed it, because there
         is no failure here at all, only a bonus that becomes reachable. */
      sweptAll: (ch) => {
        const first = dogNode(ch.cards[0]);
        if (!first) return false;
        const live = liveBreed(first.data.name);
        if (live.length < DOG_CHAIN_MIN) return false;
        const held = new Set(ch.cards.map(dogNode).filter(dogInPit));
        return live.every((n) => held.has(n));
      },
      /* THE LAST CIRCLE OPENS, NOT THE FIRST (owner, 18 September 2026).

         WHY IT CHANGED. Auto-complete fires the chain the instant the last twin
         is held, and the lift then jumped back to the circle the gesture STARTED
         on, which is nowhere near the finger. The lift now comes out of the
         circle under the finger at the moment it fires.

         IT APPLIES TO A PLAIN RELEASE TOO, deliberately. On a release the last
         joined circle is ALSO where the finger is, so one rule serves both: the
         lift comes from where you are, never from where you were. Having the
         sweep lift from one end and a release from the other would be two rules
         for one gesture.

         NOTHING IS LOST BY IT. Every circle in a dog chain is the same breed by
         the join rule, so which one opens changes nothing the player sees on the
         learn layer. It changes only where the lift flies from and, through the
         bridge, where the chips drop back to. */
      settle: (ch) => {
        const at = ch.cards[ch.cards.length - 1];
        const opened = dogNode(at);
        const others = ch.cards.slice(0, -1).map(dogNode).filter(dogInPit);
        if (!opened) return "the first circle went missing, nothing opened";
        /* MEASURED BEFORE THE OPEN, not after: dogOpen takes the first circle out
           of the pit, so asking afterwards would be counting a set the chain has
           already changed. See CHAIN_SWEEP_POINTS for the figure and the floor. */
        const live = liveBreed(opened.data.name);
        const held = new Set([opened, ...others]);
        const swept = live.length >= CHAIN_SWEEP_MIN && live.every((n) => held.has(n));
        const ok = dogOpenRef.current?.(at) ?? false;
        if (!ok) return `could not open #${at}, ${opened.data.name}`;
        if (swept) chainSweepScoreRef.current?.(opened.x, opened.y, live.length * CHAIN_SWEEP_POINTS);
        dogChainRef.current = { opened, others };
        return `OPENED ${opened.data.name}, ${others.length} more waiting on it${swept ? `, SWEPT all ${live.length} for ${live.length * CHAIN_SWEEP_POINTS}` : ""}`;
      },
      // The highlight follows the chain: every circle of this breed turns its
      // question mark yellow while the chain lives, and back when it is gone.
      /* The breed drives the question marks, the node set drives the outlines.
         Both are cleared when the chain ends, so every circle goes back to the
         mark and the stroke colour it had. */
      first: (i) => {
        const n = dogNode(i);
        dogChainBreedRef.current = n?.data.name ?? null;
        dogChainNodesRef.current = new Set(n ? [n] : []);
      },
      joined: (i) => {
        const n = dogNode(i);
        if (n) dogChainNodesRef.current.add(n);
      },
      over: () => {
        dogChainBreedRef.current = null;
        dogChainNodesRef.current = new Set();
      },
      needsHit: true,
    };
    const KINDS: ChainKind[] = [CARD, DOG];
    /* THE GATE NO LONGER ASKS ANYTHING AT THE PRESS, so the ref it used to ask,
       dogStarterAtRef, has gone with it. A starter circle is now grabbed by the
       constraint like any other and only gives the pointer up once the finger
       has moved: see dogChainTakeoverRef and DOG_CHAIN_ARM_PX. */
    // Why the last card could not close the loop back to the first right now,
    // or null if it could. The same touching and crossing tests as any join.
    const closeBlock = (ch: Chain): string | null => {
      const cards = ch.cards;
      const K = ch.kind;
      if (!K.circuit) return "this chain does not close";
      if (ch.closed || ch.dead) return "no longer open";
      if (cards.length < K.minCards) return `a loop needs ${K.minCards} cards`;
      const first = cards[0], last = cards[cards.length - 1];
      const a = K.geo(last), b = K.geo(first);
      if (!a || !b) return "could not be measured";
      const share = K.gapShare(a, b);
      if (share > K.slack) return `#${last} not touching #${first}, gap ${Math.round(share * 100)}%`;
      // Segment 0 starts at the first card and the last segment ends at the last
      // card; the crossing test ignores a shared end, so testing both is safe.
      for (let s = 0; s < cards.length - 1; s++) {
        const p = K.geo(cards[s]), q = K.geo(cards[s + 1]);
        if (p && q && chainSegmentsCross(p, q, a, b)) return "the closing link would cross the path";
      }
      return null;
    };
    const joinAt = (ch: Chain, cx: number, cy: number) => {
      if (ch.dead || ch.closed) return; // broken or complete: nothing more joins
      const K = ch.kind;
      /* AN EXACT HIT FIRST, A PULL SECOND. Where the finger is genuinely on a
         circle nothing has changed at all: the hit test answers and the magnet is
         never consulted. The pull only speaks for a sample that found nothing,
         which is why it can be added without disturbing a single existing
         gesture. See ChainKind.nearAt. */
      const i = K.idAt(cx, cy) ?? K.nearAt?.(ch, cx, cy) ?? null;
      if (i == null) return;
      const cards = ch.cards;
      const last = cards[cards.length - 1];
      if (i === last) return;
      // The first card again: the closing move, and the only repeat allowed.
      if (K.circuit && i === cards[0] && cards.length > 1) {
        const why = closeBlock(ch);
        /* A closing move that is illegal kills the chain, exactly as any other
           wrong card does. The one exception is a chain still too short to be a
           loop: doubling back onto the first card of a two card chain is not a
           wrong card, it is a gesture that has not gone anywhere yet, so that
           one only refuses. */
        if (why && cards.length < K.minCards) return; // too short to be a loop: refuse, do not kill
        if (why) { killChain(ch, `illegal close: ${why}`); return; } // an illegal close kills, like any wrong card
        ch.closed = true;
        ch.canClose = false;
        // The closing link is a connection, paid at the card it closed on. A
        // closed loop has cards.length connections, not one fewer.
        { const q = K.at(i); if (q) chainJoinScoreRef.current?.(q.x, q.y, K.colour, cards.length); }
        return;
      }
      // A card already in the chain, and not the first: the chain dies. It used
      // to refuse and carry on.
      if (cards.includes(i)) { killChain(ch, `RE-ENTERED #${i}, already at position ${cards.indexOf(i)}`); return; } // already in the chain
      if (K.busy(i)) return; // being collected: not a wrong card, just not available
      if (last === undefined) {
        cards.push(i);
        ch.lastJoin = performance.now();
        K.first?.(i); // the kind may want to know what it started on
        return;
      }
      /* The kind's own rule, if it has one, before the shared geometry. What a
         no means is the kind's too: the cards die on it, the circles simply do
         not join and the finger carries on over. See blockKills. */
      const own = K.joinBlock(ch, i);
      if (own) { if (K.blockKills) killChain(ch, `own rule: ${own}`); return; }
      const a = K.geo(last), b = K.geo(i);
      if (!a || !b) return;
      const share = K.gapShare(a, b);
      // A card that does not touch the one before it: the chain dies. It used
      // to refuse and carry on, which read as the gesture being ignored.
      // A kind whose slack is Infinity never reaches this, by design.
      if (share > K.slack) {
        killChain(ch, `NOT TOUCHING #${last}-#${i}, gap ${Math.round(share * 100)}% over slack ${K.slack}`); // a stray card, not touching the one before it
        return;
      }
      // Every earlier segment except the last one, which ends where this starts.
      // Skipped whole for a kind that may cross: see ChainKind.crossKills. The
      // re-entry kill above is NOT part of this and still applies to both kinds.
      if (K.crossKills) {
        for (let s = 0; s < cards.length - 2; s++) {
          const p = K.geo(cards[s]), q = K.geo(cards[s + 1]);
          if (p && q && chainSegmentsCross(p, q, a, b)) { killChain(ch, `CROSSED the path, link #${cards[s]}-#${cards[s + 1]}`); return; } // it would cross the path
        }
      }
      cards.push(i);
      ch.lastJoin = performance.now(); // the join clock restarts on every card
      K.joined?.(i); // the kind may want to know what is now held
      /* ASKED BEFORE THE SPARKS FIRE, not after, because the answer changes how
         many of them there are: the connection that completes a chain throws the
         first connection's burst instead of the largest. See SPARK_FINAL_LINKS. */
      const swept = !!K.sweptAll?.(ch);
      // The connection just made, paid now and kept whatever becomes of the
      // chain. The first card is not a connection and pays nothing. After the
      // push, cards.length - 1 is the number of connections so far.
      { const q = K.at(i); if (q) chainJoinScoreRef.current?.(q.x, q.y, K.colour, swept ? SPARK_FINAL_LINKS : cards.length - 1); }
      /* EVERY LIVE CIRCLE OF THE BREED IS NOW HELD, so there is nothing left to
         join and nothing to wait for: the chain completes here rather than on the
         release. sweep() already re-checks `chain` after every sample, so a chain
         ending mid-gesture is a path this code already supports.

         THE FIRING WAS THE ONLY FEEDBACK and that is what read as confusing, so
         the completion now flares before it lifts: see CHAIN_FLARE_MS. */
      if (swept) completeChain(ch);
    };
    const sweep = (ch: Chain, cx: number, cy: number) => {
      const dx = cx - ch.px, dy = cy - ch.py;
      const n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / CHAIN_SAMPLE_PX));
      for (let s = 1; s <= n; s++) {
        joinAt(ch, ch.px + (dx * s) / n, ch.py + (dy * s) / n);
        // A sample can now kill the chain outright, and the rest of the finger's
        // path belongs to no chain at all.
        if (!chain) { ch.px = cx; ch.py = cy; return; }
      }
      ch.px = cx; ch.py = cy;
    };
    /* EVERY GROUP THE PATH IS DRAWN INTO, NAMED ONCE (owner, 18 September 2026).

       THE GHOST PATH. The path was three groups until the casing made it four, and
       this function's own early return emptied three of them BY HAND. A successful
       collect sets chain = null and calls draw(), which cleared the glow, the core
       and the dots and LEFT THE CASING ON SCREEN: a navy line in the shape of the
       chain the player drew, for the rest of the level.

       ONLY ON A SUCCESS, which is the opposite of what you would guess. A failed
       chain goes through the collapse, and that finishes on paint([], [], 0, ...)
       with no casing colour, which empties the casing group properly. So the one
       path that cleared up after itself was the failure.

       THE FAULT WAS NOT THE CASING. It was a list of group names written out twice
       with the fourth added to only one copy. There is ONE list now and clearPath
       walks it, so a fifth group cannot be half-added again. */
    /* LANDED UNDER ONE COMMIT WITH THE LIGHT-BLUE FILL, 76476552. They were built
       as two and were meant to be pushed as two; the paste-able applied both
       patches before it reached the commit, so the commit took the whole tree.
       If you are reading 76476552 looking for the casing fix, the fill work
       (DOG_SINGLE_FILL, chSingle, pitBreedCount) is in the same commit and is a
       separate change with its own reasoning below. */
    const CHAIN_GROUPS = ["glow", "core", "dots"] as const;
    const clearPath = () => {
      const g = chainGRef.current;
      if (!g) return;
      for (const nm of CHAIN_GROUPS) g.querySelector(`[data-chain=${nm}]`)?.replaceChildren();
    };
    const draw = () => {
      const g = chainGRef.current;
      if (!g) return;
      const glow = g.querySelector("[data-chain=glow]");
      const core = g.querySelector("[data-chain=core]");
      const dots = g.querySelector("[data-chain=dots]");
      if (!glow || !core || !dots) return;
      if (!chain || chain.pending || !chain.cards.length) {
        clearPath();
        return;
      }
      /* WHITE THROUGHOUT (owner, 18 September 2026). The path carries no colour
         at all: every state is said with WEIGHT and GLOW instead, so the line
         reads as one material that brightens, thickens, dims or thins.
           open link      the resting state, and the headroom for the rest
           can close      the whole line brightens and thickens, and the first
                          card's dot swells and pulses, marking the target ahead
                          of the finger: the loop shuts the instant the finger
                          reaches it, so there is no hovering moment to use
           closed         brighter and heavier again, and the finger's line goes
           straining      that link alone dims and thins
           dead           the whole path dims and thins, and the broken link is
                          still cut open at its middle
         The dimming, thinning and fading are the ones that were already there,
         with the colour taken out. The card edges are NOT touched by any of
         this: green taken, yellow armed, red on the floor and the breathing
         yellow of the tap unlock all stay exactly as they are. */
      const DIM_O = 0.4, DIM_W = 0.6;     // strained, dead, run down
      const OPEN_O = 0.85, OPEN_W = 1;    // a live open link
      const READY_O = 1, READY_W = 1.35;  // the loop could close from here
      const CLOSED_O = 1, CLOSED_W = 1.6; // the loop is closed
      const dead = chain.dead;
      const liveO = dead ? DIM_O : chain.closed ? CLOSED_O : chain.canClose ? READY_O : OPEN_O;
      const liveW = dead ? DIM_W : chain.closed ? CLOSED_W : chain.canClose ? READY_W : OPEN_W;
      // Index aligned with chain.cards; link s runs from cps[s] to the next,
      // wrapping to the first card for the closing link.
      const cps = chain.cards.map((i) => chain?.kind.geo(i) ?? null);
      const unit = cps.find((q) => q)?.h ?? 0;
      type Seg = { x1: number; y1: number; x2: number; y2: number; w: number; o: number };
      const segs: Seg[] = [];
      for (let s = 0; s < linkCount(chain); s++) {
        const p = cps[s], q = cps[(s + 1) % cps.length];
        if (!p || !q) continue;
        if (dead && dead.link === s) {
          // The point of failure, cut open at the middle, which is where the two
          // cards should have been touching.
          const len = Math.hypot(q.x - p.x, q.y - p.y) || 1;
          const ux = (q.x - p.x) / len, uy = (q.y - p.y) / len;
          const half = Math.min(len * 0.3, unit * 0.6);
          const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
          segs.push({ x1: p.x, y1: p.y, x2: mx - ux * half, y2: my - uy * half, w: DIM_W, o: DIM_O });
          segs.push({ x1: mx + ux * half, y1: my + uy * half, x2: q.x, y2: q.y, w: DIM_W, o: DIM_O });
        } else {
          const strained = !dead && chain.strain.has(s);
          segs.push({ x1: p.x, y1: p.y, x2: q.x, y2: q.y, w: strained ? DIM_W : liveW, o: strained ? DIM_O : liveO });
        }
      }
      // The live end of the line is the finger itself, while the chain is open.
      const lastP = [...cps].reverse().find((q) => q);
      const sv = g.ownerSVGElement;
      const ctm = g.getScreenCTM();
      if (!dead && !chain.closed && lastP && sv && ctm) {
        const p = sv.createSVGPoint();
        p.x = chain.fx; p.y = chain.fy;
        const w = p.matrixTransform(ctm.inverse());
        segs.push({ x1: lastP.x, y1: lastP.y, x2: w.x, y2: w.y, w: liveW, o: liveO });
      }
      const n = cps.length;
      const now = performance.now();
      const pulse = 1.7 + 0.3 * Math.sin(now / 90);
      /* THE JOIN CLOCK IS STILL THE LAST DOT: the card you have just landed on
         shrinks as its time runs down, and now DIMS towards the end instead of
         going red. The dot was chosen over the line because that is where the
         finger is and where the next card has to come from. */
      // The allowance grows with the chain, so the dot always shows the whole of
      // whatever this join is worth, however long that has become.
      const allow = chainAllowanceMs(chain.cards.length - 1);
      const run = chain.closed || chain.dead ? 0 : Math.min(1, (now - chain.lastJoin) / allow);
      const dotList = cps.map((q, d) => q
        ? {
            x: q.x, y: q.y,
            o: dead ? DIM_O
              : chain?.canClose && d === 0 ? READY_O
              : d === n - 1 ? liveO - (liveO - DIM_O) * run
              : liveO,
            r: chain?.canClose && d === 0 ? pulse : d === n - 1 ? 1 - 0.45 * run : 1,
          }
        : null);
      // The glow now grows with the chain: see chainGlow. Connections, not cards,
      // so a one-circle chain sits at the resting pair.
      { const g2 = chainGlow(chain.cards.length - 1); paint(segs, dotList, unit, chain.kind.colour, g2.w, g2.blur); }
    };
    // Writes lines and dots into the path layer. Shared by the live chain and
    // the collapse, so the two can never be drawn two different ways. The colour
    // belongs to the kind: white for chum cards, and a chain of something else
    // brings its own.
    const paint = (
      // One colour throughout, the kind's own. `w` scales the stroke weight and
      // `o` its opacity: between them they carry every state, which is why the
      // chum card path can say everything it needs to in white alone.
      segs: { x1: number; y1: number; x2: number; y2: number; w?: number; o?: number }[],
      dotList: ({ x: number; y: number; r?: number; o?: number } | null)[],
      unit: number,
      col: string,
      // The glow's width and blur, as shares of unit. Defaulted to the resting
      // pair so every existing caller is unchanged; the flare raises both.
      glowW: number = CHAIN_GLOW_W,
      glowBlur: number = CHAIN_GLOW_BLUR,
    ) => {
      const g = chainGRef.current;
      const glow = g?.querySelector("[data-chain=glow]");
      const core = g?.querySelector("[data-chain=core]");
      const blur = g?.querySelector("[data-chain=blur]");
      const dots = g?.querySelector("[data-chain=dots]");
      if (!glow || !core || !dots) return;
      const lay = (grp: Element, width: number) => {
        while (grp.children.length > segs.length) grp.lastChild?.remove();
        while (grp.children.length < segs.length) {
          const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
          l.style.strokeLinecap = "round";
          grp.appendChild(l);
        }
        segs.forEach((sg, j) => {
          const l = grp.children[j] as SVGLineElement;
          l.setAttribute("x1", String(sg.x1)); l.setAttribute("y1", String(sg.y1));
          l.setAttribute("x2", String(sg.x2)); l.setAttribute("y2", String(sg.y2));
          l.style.stroke = col;
          l.style.strokeWidth = String(width * (sg.w ?? 1));
          l.style.opacity = String(sg.o ?? 1);
        });
      };
      lay(glow, unit * glowW);
      lay(core, unit * 0.14);
      blur?.setAttribute("stdDeviation", String(unit * glowBlur));
      const n = dotList.length;
      while (dots.children.length > n) dots.lastChild?.remove();
      while (dots.children.length < n) dots.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "circle"));
      for (let d = 0; d < n; d++) {
        const c = dots.children[d] as SVGCircleElement;
        const q = dotList[d];
        if (!q) { c.setAttribute("r", "0"); continue; }
        c.setAttribute("cx", String(q.x));
        c.setAttribute("cy", String(q.y));
        c.setAttribute("r", String(unit * 0.22 * (q.r ?? 1)));
        c.style.fill = col;
        c.style.opacity = String(q.o ?? 1);
      }
    };
    /* THE COLLAPSE. A failed chain's last shape, snapped open at every link,
       falling and fading over CHAIN_COLLAPSE_MS. Each half link drifts its own
       way so it reads as the chain coming apart, not the path sliding off. */
    type Collapse = {
      t0: number; unit: number; col: string;
      pieces: { x1: number; y1: number; x2: number; y2: number; drift: number }[];
      dots: { x: number; y: number; drift: number }[];
    };
    let collapse: Collapse | null = null;
    /* THE FLARE. A completed chain's last shape, held still while the dot on the
       circle that completed it swells, then handed on. Its own object beside the
       collapse and for the same reason: `chain` is already null by the time it
       draws, so it cannot ride on the live path.

       `done` is what happens when it ends, which is the settle and the kind's own
       teardown. Carrying it here is what lets completeChain kill the gesture on
       the spot and still open the learn layer 250ms later. */
    type Flare = {
      t0: number; unit: number; col: string;
      // Where the chain's own glow had reached when it completed. The flare swells
      // UP FROM THIS, not from the resting pair: a six link chain is already at the
      // full ramp, and flaring to a fixed 0.8 would have dimmed it.
      fromW: number; fromBlur: number;
      segs: { x1: number; y1: number; x2: number; y2: number }[];
      dots: { x: number; y: number }[];
      at: number;        // which dot swells: the circle that completed the chain
      done: () => void;
    };
    let flare: Flare | null = null;
    const startFlare = (ch: Chain, done: () => void) => {
      const cps = ch.cards.map((i) => ch.kind.geo(i));
      const unit = cps.find((q) => q)?.h ?? 0;
      const segs: Flare["segs"] = [];
      for (let s2 = 0; s2 < cps.length - 1; s2++) {
        const p = cps[s2], q = cps[s2 + 1];
        if (p && q) segs.push({ x1: p.x, y1: p.y, x2: q.x, y2: q.y });
      }
      const dots = cps.flatMap((q) => (q ? [{ x: q.x, y: q.y }] : []));
      const g2 = chainGlow(ch.cards.length - 1);
      flare = { t0: performance.now(), unit, col: ch.kind.colour, segs, dots, at: dots.length - 1, done, fromW: g2.w, fromBlur: g2.blur };
    };
    // Paints one flare frame. False once it is over, having cleared the layer and
    // run `done`, which is the lift.
    const drawFlare = (now: number): boolean => {
      if (!flare) return false;
      const f = flare;
      const t = Math.min(1, (now - f.t0) / CHAIN_FLARE_MS);
      if (t >= 1) {
        flare = null;
        paint([], [], 0, "#ffffff");
        f.done();
        return false;
      }
      // One swell, loaded to the front by the attack exponent: see CHAIN_FLARE_MS.
      const swell = Math.sin(Math.pow(t, CHAIN_FLARE_ATTACK) * Math.PI);
      const dotK = 1 + (CHAIN_FLARE_DOT_K - 1) * swell;
      paint(
        f.segs,
        f.dots.map((d, i2) => ({ x: d.x, y: d.y, r: i2 === f.at ? dotK : 1 })),
        f.unit,
        f.col,
        // From where the chain got to, up to the flare pair, and never downwards:
        // a long chain can already be above the flare's own figures.
        f.fromW + Math.max(0, CHAIN_FLARE_GLOW_W - f.fromW) * swell,
        f.fromBlur + Math.max(0, CHAIN_FLARE_GLOW_BLUR - f.fromBlur) * swell,
      );
      return true;
    };
    // The chain is gone by the time this is drawn, so its shape, its size and
    // its colour are all taken here. `loop` adds the closing link, last card
    // back to first.
    const startCollapse = (ch: Chain) => {
      const cards = ch.cards;
      const loop = ch.closed;
      const geo = ch.kind.geo;
      const cps = cards.map((i) => geo(i));
      const unit = cps.find((q) => q)?.h ?? 0;
      const pieces: Collapse["pieces"] = [];
      for (let s = 0; s < (loop ? cps.length : cps.length - 1); s++) {
        const p = cps[s], q = cps[(s + 1) % cps.length];
        if (!p || !q) continue;
        const len = Math.hypot(q.x - p.x, q.y - p.y) || 1;
        const ux = (q.x - p.x) / len, uy = (q.y - p.y) / len;
        const half = Math.min(len * 0.12, unit * 0.3);
        const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
        pieces.push({ x1: p.x, y1: p.y, x2: mx - ux * half, y2: my - uy * half, drift: Math.random() * 2 - 1 });
        pieces.push({ x1: mx + ux * half, y1: my + uy * half, x2: q.x, y2: q.y, drift: Math.random() * 2 - 1 });
      }
      const dotsArr = cps.flatMap((q) => (q ? [{ x: q.x, y: q.y, drift: Math.random() * 2 - 1 }] : []));
      collapse = { t0: performance.now(), unit, col: ch.kind.colour, pieces, dots: dotsArr };
    };
    // Paints one collapse frame. False once it is over, having cleared the layer.
    const drawCollapse = (now: number): boolean => {
      const g = chainGRef.current;
      if (!collapse || !g) return false;
      const t = Math.min(1, (now - collapse.t0) / CHAIN_COLLAPSE_MS);
      if (t >= 1) {
        collapse = null;
        g.style.opacity = "";
        paint([], [], 0, "#ffffff");
        return false;
      }
      const u = collapse.unit;
      const fall = u * 8 * t * t;
      // The chain's own colour, thinned. The falling and the fade are unchanged:
      // the group's own opacity still carries them.
      paint(
        collapse.pieces.map((p) => ({ x1: p.x1 + p.drift * u * 1.5 * t, y1: p.y1 + fall, x2: p.x2 + p.drift * u * 1.5 * t, y2: p.y2 + fall, w: 0.6 })),
        collapse.dots.map((d) => ({ x: d.x + d.drift * u * t, y: d.y + fall })),
        u,
        collapse.col,
      );
      g.style.opacity = String(1 - t);
      return true;
    };
    // Why a released chain may not clear, or null if it may. No grace here.
    // A broken link is reported ahead of an open circuit: it is the real cause.
    const judge = (ch: Chain): string | null => {
      const K = ch.kind;
      if (ch.dead) return `BROKEN LINK #${ch.dead.a}-#${ch.dead.b}, gap ${Math.round(ch.dead.share * 100)}%`;
      if (K.circuit && !ch.closed) return `OPEN, circuit not closed (${ch.cards.length} cards)`;
      if (ch.cards.length < K.minCards) return `TOO SHORT, ${ch.cards.length} of ${K.minCards}`;
      for (const i of ch.cards) {
        if (K.busy(i) || K.taken(i)) return `#${i} was already taken`;
      }
      for (let s = 0; s < linkCount(ch); s++) {
        const [ai, bi] = linkEnds(ch, s);
        const a = K.geo(ai), b = K.geo(bi);
        if (!a || !b) return `#${!a ? ai : bi} could not be measured`;
        const share = K.gapShare(a, b);
        if (share > K.slack) return `BROKEN LINK #${ai}-#${bi}, gap ${Math.round(share * 100)}% at release`;
      }
      return null;
    };
    /* Kills a chain where it stands, mid gesture: the collapse right now,
       rather than the quiet wait for release a broken link gets. Used by the
       join clock, and by the rules that end a chain outright. The caller is
       inside the frame loop or a pointer move, so the running frame request
       carries the collapse; nothing is scheduled here. */
    const killChain = (ch: Chain, why: string) => {
      /* WHY IT DIED, RECORDED (owner, 18 September 2026). A chain that dies
         mid-gesture collapses over CHAIN_COLLAPSE_MS and looks EXACTLY THE SAME
         whatever killed it, and killChain took no reason at all, so nothing
         anywhere said which rule had fired. On a long chain that is a lot of
         motion in under half a second and no information in any of it.

         Standing until the next one, exactly as spinLastBlast does: a death is an
         event and the sampler runs on its own clock. Costs one string per death
         and only with the flag. `end()` already carried a reason for a RELEASE,
         which is the other half of the same question and is recorded beside it. */
      if (spinOnRef.current) spinLastChainRef.current = `CHAIN died: ${why}  after ${ch.cards.length} circles`;
      startCollapse(ch);
      const held = chainHeldCollectRef.current;
      // a parked collect dies with the chain: the card stays armed
      if (held != null) chainHeldCollectRef.current = null;
      ch.kind.over?.();
      chain = null;
    };
    /* COMPLETES A CHAIN WHERE IT STANDS, with the finger still down (owner,
       18 September 2026). Everything a release does, minus the things that only
       make sense once the gesture has ended.

       WHY NOT CALL end("released"). end keys its whole body off that string and
       would also run the parked-collect branch with the finger still on the
       glass. Nothing else in end assumes the pointer is up, only that the CHAIN
       is over, which is exactly the part taken here.

       WHAT HAPPENS TO THE FINGER. chain = null makes move() return on its first
       line, so nothing more joins and no path is drawn. A second chain cannot
       start from the same press: down() is the only place a chain is made and it
       needs a fresh pointerdown. The chum gate stays open until the real
       pointerup clears it, and that is correct: an open gate is what stops the
       sim treating the continuing drag as a new grab. The real up() then finds
       chain already null and does nothing.

       NOTHING IS SCHEDULED HERE, same as killChain: the caller is inside the
       frame loop or a pointer move and the running frame request carries the
       collapse or the redraw. */
    const completeChain = (ch: Chain) => {
      const fail = judge(ch);
      // A chain that cleared takes the parked card with it, exactly as a release
      // that cleared does.
      chainHeldCollectRef.current = null;
      /* THE GESTURE DIES HERE, WHATEVER FOLLOWS. chain = null on this line and not
         at the end of the flare, so move() returns on its first line for the whole
         hold: no sweep, no join, no path. A new chain still needs a fresh
         pointerdown, which a finger already down cannot produce. The flare draws
         from its own snapshot, so nothing depends on the chain still existing. */
      if (fail) {
        startCollapse(ch);
        ch.kind.over?.();
        chain = null;
        return;
      }
      // The lift waits for the flare; the kind's teardown waits with it, or the
      // held circles would lose their rims halfway through their own moment.
      startFlare(ch, () => { ch.kind.settle(ch); ch.kind.over?.(); });
      chain = null;
    };
    // Every existing link, every frame. Only the chain's own cards are measured.
    const checkLinks = (ch: Chain, now: number) => {
      if (ch.dead || ch.cards.length < 2) return;
      // The closing link too, once the loop is closed.
      for (let s = 0; s < linkCount(ch); s++) {
        const [ai, bi] = linkEnds(ch, s);
        const a = ch.kind.geo(ai), b = ch.kind.geo(bi);
        if (!a || !b) continue;
        const share = ch.kind.gapShare(a, b);
        // A kind with no touching rule can never strain and can never break:
        // every share is inside an infinite slack, so every link stays healthy.
        if (share <= ch.kind.slack) { ch.strain.delete(s); continue; }
        const st = ch.strain.get(s);
        if (!st) { ch.strain.set(s, { since: now, share }); continue; }
        st.share = share;
        if (now - st.since >= CHAIN_BREAK_GRACE_MS) {
          ch.dead = { link: s, a: ai, b: bi, share };
          ch.strain.clear();
          return;
        }
      }
    };
    const end = (why: string) => {
      const ch = chain;
      const n = ch?.cards.length ?? 0;
      // Only a real release of a real chain is judged. A cancel, a blur or a
      // stale end is not the player's doing, so it just clears, silently.
      // A single card is a tap, never a chain. Two or more is judged, and a two
      // card chain can only ever fail: it cannot close.
      const isTap = n < 2;
      if (ch && why === "released" && !isTap) {
        const fail = judge(ch);
        // The other half of the same question: a chain that died at the RELEASE
        // rather than mid-gesture. Same line, so one reading covers both.
        if (spinOnRef.current) spinLastChainRef.current = fail
          ? `CHAIN failed at release: ${fail}  after ${n} circles`
          : `CHAIN cleared on release, ${n} circles`;
        if (fail) {
          startCollapse(ch);
        } else {
          // What a valid release does belongs to the kind: cards clear and score,
          // and another kind will do something else entirely.
          ch.kind.settle(ch);
        }
      }
      // A parked collect (see chainHeldCollectRef) goes ahead only on a clean
      // release that never joined a second card, as the tap always did. A chain
      // that cleared took the card with it. A failed chain, a cancel, a blur or a
      // stale end all leave the card armed. Deliberately not CHAIN_MIN_CARDS:
      // that is the loop minimum, and a two card chain is not a tap.
      const held = chainHeldCollectRef.current;
      if (held != null) {
        chainHeldCollectRef.current = null;
        if (why === "released" && isTap) chainTapCollectRef.current?.(held);
        // a chain that cleared took the card with it; anything else leaves it armed
      }
      ch?.kind.over?.();
      chain = null;
      if (raf != null) { cancelAnimationFrame(raf); raf = null; }
      if (collapse) raf = requestAnimationFrame(tick);
      else draw();
    };
    const tick = () => {
      raf = null;
      if (!chain) {
        const now2 = performance.now();
        // The flare first: a completed chain holds before anything else can run.
        if (drawFlare(now2) || drawCollapse(now2)) raf = requestAnimationFrame(tick);
        else draw();
        return;
      }
      if (chain.pending) {
        /* STILL UNDECIDED. A kind with an armPx holds here, frame after frame,
           until the finger travels far enough for move() to hand the pointer
           over. Nothing below runs: no card joins, the path draws nothing (draw
           bails on a pending chain) and the join clock has not started, because
           it counts from the first join and there has not been one. */
        if (chain.hold) { raf = requestAnimationFrame(tick); return; }
        // After dispatch, so the stage's onDown has had its say.
        if (chumGateRef.current !== chain.id) { chain = null; draw(); return; } // the gate did not open for this press
        chain.pending = false;
        const fx = chain.fx, fy = chain.fy;
        joinAt(chain, chain.px, chain.py);
        sweep(chain, fx, fy);
      }
      const now = performance.now();
      // THE JOIN CLOCK. Open chains only: a closed loop has stopped it.
      const idle = now - chain.lastJoin;
      const allow = chainAllowanceMs(chain.cards.length - 1);
      if (!chain.closed && !chain.dead && chain.cards.length && idle > allow) {
        killChain(chain, `JOIN CLOCK ran out, idle ${Math.round(idle)}ms of ${Math.round(allow)}`); // the join clock ran out
        raf = requestAnimationFrame(tick);
        return;
      }
      checkLinks(chain, now);
      // Cards drift, so whether the loop could close is re-asked every frame.
      chain.canClose = closeBlock(chain) === null;
      draw();
      raf = requestAnimationFrame(tick);
    };
    const down = (e: PointerEvent) => {
      // Mirrors the gate: a primary press means nothing else is down.
      if (chain && e.isPrimary) end("stale chain");
      if (chain) return; // one chain at a time, a second finger is ignored
      const t = e.target as globalThis.Node | null;
      if (!t) return;
      // Whichever kind owns this press, if its flag is on and the thing pressed
      // is allowed to open a chain. First match wins; there is only ever one.
      let kind: ChainKind | null = null;
      for (const k of KINDS) {
        if (!k.owns(t)) continue;
        const i0 = k.idAt(e.clientX, e.clientY);
        if (i0 == null && k.needsHit) continue;
        if (i0 != null && !k.startable(i0)) continue;
        kind = k;
        break;
      }
      if (!kind) return;
      // A new chain cuts short any collapse still falling.
      if (collapse) {
        collapse = null;
        if (chainGRef.current) chainGRef.current.style.opacity = "";
        paint([], [], 0, "#ffffff");
      }
      chain = { id: e.pointerId, kind, pending: true, cards: [], px: e.clientX, py: e.clientY, fx: e.clientX, fy: e.clientY, strain: new Map(), dead: null, closed: false, canClose: false, lastJoin: performance.now(), hold: kind.armPx > 0 ? { x: e.clientX, y: e.clientY } : null };
      if (raf == null) raf = requestAnimationFrame(tick);
    };
    const move = (e: PointerEvent) => {
      if (!chain || e.pointerId !== chain.id) return;
      chain.fx = e.clientX; chain.fy = e.clientY;
      /* THE PRESS DECIDES HERE. Under the kind's armPx this is still a drag and
         the constraint keeps the pointer, so nothing happens at all. At or past
         it the chain asks the sim to let go, and the first circle joined is the
         one that was PRESSED, not the one the finger has reached: px and py are
         still the press point, and the pending block in tick joins there before
         sweeping up to the finger.

         A REFUSED HANDOVER DROPS THE CHAIN rather than drawing one on a pointer
         something else is holding. It can only happen if another press took the
         gate meanwhile, which is a second finger. */
      if (chain.hold) {
        if (Math.hypot(e.clientX - chain.hold.x, e.clientY - chain.hold.y) < chain.kind.armPx) return;
        if (!dogChainTakeoverRef.current?.(chain.id)) { chain = null; return; }
        chain.hold = null;
        return; // tick resolves the pending chain on the very next frame
      }
      if (!chain.pending) sweep(chain, e.clientX, e.clientY);
    };
    const up = (e: PointerEvent) => { if (chain && e.pointerId === chain.id) end("released"); };
    const cancel = (e: PointerEvent) => { if (chain && e.pointerId === chain.id) end("cancelled"); };
    const lost = () => { if (chain) end("lost (blur or hidden)"); };
    const opts = { capture: true } as const;
    document.addEventListener("pointerdown", down, opts);
    document.addEventListener("pointermove", move, opts);
    document.addEventListener("pointerup", up, opts);
    document.addEventListener("pointercancel", cancel, opts);
    window.addEventListener("blur", lost);
    document.addEventListener("visibilitychange", lost);
    return () => {
      document.removeEventListener("pointerdown", down, opts);
      document.removeEventListener("pointermove", move, opts);
      document.removeEventListener("pointerup", up, opts);
      document.removeEventListener("pointercancel", cancel, opts);
      window.removeEventListener("blur", lost);
      document.removeEventListener("visibilitychange", lost);
      if (raf != null) cancelAnimationFrame(raf);
      chain = null;
      collapse = null;
      dogChainBreedRef.current = null;
      dogChainNodesRef.current = new Set();
    };
  }, []);
  // The running total for the corner. It lives in LineageModal, which is keyed
  // per level and remounts, so it starts each level at nothing.
  const chumsCollected = collectedChums?.size ?? 0;
  // That dog's ancestry breakdown, the same figures as its own page.
  const ancestryRows = useMemo(
    /* THE FULL LIST, NOT THE TOP EIGHT, 16 September 2026 (owner). The card showed
       8 rows on the overlapping raw-share model while the ancestor pack showed
       every ancestor on the influence model: on the Jackapoo, 8 rows adding to
       295% against 51 adding to 100. Same measure and same length now, and the
       card scrolls. See the note on ancestryFullList. */
    () => (ancestryFor ? ancestryFullList(ancestryFor.name) : []),
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
  // The level-dog info box opens on entering the learn area, so the level dog's
  // card is there without a tap and then follows whatever circle you look at.
  // Only when it is currently shut, so a manual close inside learn is respected.
  useEffect(() => {
    if (learning && hideCaption) onToggleCaption?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learning]);
  // A card opens next to the main box: to its right if there is room, else its
  // left, cascaded a little per card so two do not land dead on top of each other.
  /* cardSpot IS GONE, 16 September 2026 (owner: the card positions should match
     the stylesheet).

     WHAT IT DID AND WHY IT HAD TO GO. It measured the main box and the rail with
     getBoundingClientRect at the moment a card opened and returned a left, top
     and width, which were applied INLINE. Inline style beats a stylesheet, so
     every position rule on .ancCard, .tempCard and .trainCard was dead in
     practice: the cards opened below the box, two per row, wherever the
     measurement put them, and the owner's placements this afternoon had no
     effect in play.

     The three setters now pass null, which is the state the style prop already
     treated as "use the stylesheet". Nothing else read these positions: the drag
     is handled inside LearnDragCard through its own transform, so a card still
     drags and still stays where it is dropped.

     WHAT IS LOST. The cards no longer dodge the rail or each other at runtime.
     They sit where the CSS says at every screen size, which is the point, so any
     overlap is now a fixed number to change rather than a measurement to chase.
     The ancestry card also loses its measured width and takes the stylesheet's
     min(88vw, 330px) instead. */
  // (Removed 14 Aug 2026: the temperament box no longer force-opens on chum
  // select -- that was the wrong behaviour. It is being replaced by the level-dog
  // info box: one box, open on entering the level, staying open while you
  // interact, its content following whatever circle you are looking at. Built
  // separately. Do not re-add the ancestryFor auto-open.)
  // While a circle is hovered, GHOST the circles nested inside it: their image
  // fades to a hollow dashed ring (see .ghost), so you can always see what is
  // nested inside without it covering the parent's own picture. A ghosted circle
  // KEEPS its hit area, so moving onto one re-hovers it and it comes back solid.
  // It must not lose pointer-events, or the pointer could never reach a nested
  // circle once its parent was hovered and every click would land on the parent.
  // Applies to EVERY hovered circle, the big first-ring ones included: the old
  // first-ring carve-out was there for the hover unlock, which is now gone.
  const buriedSet = hovered && !dropped ? new Set(hovered.descendants()) : null;
  // Mini pit LEARN only: every circle nested inside the focused one carries its
  // name, not just the first ring. The chum pages keep the single ring they
  // have always had, and PLAY is untouched.
  const deepLabels = dockAside && !dropped;
  const labelSet = deepLabels ? new Set(focus.descendants()) : null;

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
              // Dragging the difficulty slider is not hovering the pit. The
              // slider sits low on the left, which is PLAY's half, so every
              // drag was sliding the level background in behind it.
              if (diffDragRef.current) return;
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
      {/* stageReserved REMOVED 31 Aug 2026. It used to shrink the stage while the
          mobile info box was up so the two never overlapped. But relayoutMobile
          centres the cluster on the STAGE (see the `drop` rule, level !== null),
          so a shrunk stage centred the circles in the top 45% of the phone, which
          put the zoom and drag focus off the middle of the screen. The pit now
          keeps the full height and the box floats over it by design. Do not
          re-add the class without moving the centring off the stage rect first. */}
      {/* THE BROWSER'S OWN DRAG IS NOT WELCOME HERE (18 September 2026).

          WHAT WAS HAPPENING, mouse only. The pit draws real SVG <image>
          elements for the chum cards and the toys, and a picture is something
          the browser will happily drag by itself. Nothing in the pit's press
          paths prevents the default, by design: the dog circles say so in as
          many words, because the press has to reach the stage listener that
          feeds Matter. So a mouse press on a card started a NATIVE drag, with a
          translucent ghost of the pit following the cursor.

          AND IT TOOK THE POINTER WITH IT. Once a native drag begins the browser
          owns the pointer, our stream stops and a cancel arrives, so the swipe
          chain never swept and never drew. One cause, both symptoms: the ghost,
          and a card chain that worked on a phone and not with a mouse.

          THE GUARD IS ONE EVENT. dragstart bubbles, so this catches a drag
          starting on any picture in the pit and refuses it. preventDefault on
          POINTERDOWN would also have worked and is deliberately not used: it
          suppresses the compatibility mouse events, which is a far bigger blast
          radius than this needs. The other half of the same problem, dragging a
          text selection, is handled by user-select in .stage.

          Touch never had either problem: native drag and selection drag are
          mouse behaviours, and touch-action on .stage is the touch equivalent
          and has been there all along. */}
      <div
        className={`${styles.stage}${dockAside ? " " + styles.stageDocked : ""}`}
        ref={stageRef}
        onDragStart={(e) => e.preventDefault()}
      >
        <svg
          viewBox={viewBox}
          // Records the press only. No stopPropagation: the stage listener above
          // still has to see it to feed Matter's mouse.
          onPointerDown={(ev) => {
            // Every press in the pit passes through here, circles included,
            // because nothing below stops propagation. It is the one place that
            // reliably sees the pointer type before any tap is acted on.
            touchRef.current = ev.pointerType === "touch";
            bgPressRef.current = { x: ev.clientX, y: ev.clientY, t: ev.timeStamp };
            // Arm a pan. Zoomed in only, and never once the round has dropped,
            // where the pit owns the pointer.
            if (dockAside && !dropped && !disableZoom && focusRef.current !== nodes[0]) {
              const st = stageRef.current;
              const vbH = aspect >= 1 ? SIZE : SIZE / aspect;
              const uppL = vbH / Math.max(st ? st.clientHeight : 1, 1);
              const v = viewRef.current;
              panRef.current = {
                x: ev.clientX, y: ev.clientY, vx: v[0], vy: v[1],
                // World units per client pixel, frozen at the press, the same
                // conversion the pull uses: view units per px divided by the
                // world-to-view scale.
                per: uppL / (SIZE / v[2]),
                moved: false,
              };
            } else {
              panRef.current = null;
            }
          }}
          onPointerMove={(ev) => {
            const pn = panRef.current;
            if (!pn) return;
            const dx = ev.clientX - pn.x, dy = ev.clientY - pn.y;
            if (!pn.moved && Math.hypot(dx, dy) < PAN_SLOP) return;
            pn.moved = true;
            // Dragging right moves the view left, so the tree follows the finger.
            const v = viewRef.current;
            viewRef.current = panBounds([pn.vx - dx * pn.per, pn.vy - dy * pn.per, v[2]]);
            zoomTo(viewRef.current);
          }}
          onPointerUp={() => {
            const panned = panRef.current?.moved;
            panRef.current = null;
            if (panned) setViewTick((n) => n + 1);
          }}
          onPointerCancel={() => { panRef.current = null; }}
          onClick={disableZoom ? undefined : onBackground}
          // Zoomed in, a click on the background goes back to the top, so say
          // so. At the top it does nothing in LEARN, so it keeps the plain arrow
          // rather than promising a zoom that will not happen.
          className={!disableZoom && !dropped && !frozen && focus !== nodes[0] ? styles.curZoomOut : undefined}
          // displayOnly (chums2 static diagram): force the pack svg's overflow VISIBLE
          // inline, so no CSS cascade can leave the UA-default overflow:hidden in place
          // and clip a zoomed circle to the (small) stage rectangle. Inline so it is
          // guaranteed for this hosting; game paths (displayOnly false) are unchanged.
          style={displayOnly ? { opacity: ready ? 1 : 0, overflow: "visible" } : { opacity: ready ? 1 : 0 }}
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
            {/* THE MARK'S COLOUR. An <image> paints whatever its file paints and
                ignores `fill`, so the tint is done here: the matrix throws away
                the source RGB and writes navy 10/58/87 as constants, while the
                last row passes ALPHA straight through. The shape is preserved
                exactly and the colour is ours.
                The three values are 10/255, 58/255 and 87/255 to three places. */}
            {/* THE MARK'S COLOUR, ONE FILTER PER DEPTH. It was a single navy
                filter, which stopped working the moment the fill became navy: a
                navy mark on a navy disc is an invisible mark. It now takes the
                circle's own RING colour, so a pit circle is two colours rather
                than three and the mark reads as part of its own edge.

                An <image> paints what its file paints and ignores `fill`, so the
                colour has to come from a matrix: the source RGB is thrown away and
                the constants are written in, while the last row passes ALPHA
                straight through, preserving the artwork's shape exactly.

                colorInterpolationFilters sRGB IS LOAD BEARING. Filters run in
                linearRGB by default, so these constants would be read as LINEAR
                and converted up on output, coming out visibly lighter than asked
                for. The file's two other tint filters both carry it.

                THE FOUR ENTRIES ARE RING_PALETTE, as fractions of 255. If that
                array changes, these change with it: there is no way to feed a JS
                array into a filter matrix without generating the elements, and
                generating four filters inside `defs` for a value that changes
                once a year is not worth the indirection. */}
            {RING_PALETTE.map((hex, qi) => (
              <filter key={qi} id={`bt-qmark-${qi}`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
                <feColorMatrix
                  type="matrix"
                  values={`0 0 0 0 ${(parseInt(hex.slice(1, 3), 16) / 255).toFixed(3)} 0 0 0 0 ${(parseInt(hex.slice(3, 5), 16) / 255).toFixed(3)} 0 0 0 0 ${(parseInt(hex.slice(5, 7), 16) / 255).toFixed(3)} 0 0 0 1 0`}
                />
              </filter>
            ))}
            {/* The fifth question mark filter,
                for a circle holding the breed of the chain being drawn. White,
                like the path, changed from the site yellow on 18 September 2026.
                Same shape as the four above it, one colour. */}
            <filter id="bt-qmark-hi" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
              <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0" />
            </filter>
            {/* The sixth, for a circle HELD in
                the chain: DOG_CHAIN_INK, the navy the circle used to fill with,
                so the face reads against the light blue it is filled with now.
                The fractions are that hex over 255, and they are written out
                because a filter matrix cannot take a variable. */}
            <filter id="bt-qmark-ink" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
              <feColorMatrix type="matrix" values="0 0 0 0 0.039 0 0 0 0 0.227 0 0 0 0 0.341 0 0 0 1 0" />
            </filter>
            {/* BLACK, for a twin filled with a light rarity colour. bt-qmark-hi
                is the white one and takes the dark three; between them they cover
                RARITY_BAND's own fg, which is the ink already measured against
                each of those five backgrounds. Every channel to 0, the exact
                opposite of hi's every channel to 1. */}
            <filter id="bt-qmark-black" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" />
            </filter>
            {nodes.map((d, i) =>
              nodeImg(d) ? (
                <pattern key={i} id={`bt-img-${i}`} patternContentUnits="objectBoundingBox" width="1" height="1">
                  <image href={encodeURI(bust(nodeImg(d) as string))} width="1" height="1" preserveAspectRatio="xMidYMid slice" />
                </pattern>
              ) : null
            )}
          </defs>

          {/* CLUSTER MARKER, decoration only. A dashed white ring around
              the cluster and a dashed line reaching to the level portrait at top
              left, saying these dogs belong to this level. Shown whenever the
              whole cluster is in view and no round is running: the start screen
              AND the root of the learn area (dockAside && gravity && !started &&
              focus.depth === 0). The focus.depth === 0 is load-bearing: learn
              lets you zoom into a single dog, which recentres and rescales the
              view, and without it the ring would balloon around the now offscreen
              full cluster. It unmounts the instant a round starts or you dive
              into a dog, and mounts again at the root view. It is a SIBLING
              of the circles group, never a child: zoomTo and the drop-in index
              circlesRef.current.children by position, so an extra child there
              would shift every node. Sized with packEnclose over the depth-1
              circles, the smallest circle that holds the whole cluster, taken
              from the live packed positions so it follows every difficulty and
              level re-pack and the start-screen drop. Not nodes[0]: relayoutMobile
              pins the hidden root to the frame centre, which is not the visible
              envelope. pointer-events none, and because it unmounts rather than
              resting at opacity 0 it can never gate content. White only, dash in
              keeping with the other dashed elements. The portrait lives in
              LineageModal above this SVG, so the line anchors to a fixed top-left
              point rather than measuring across components, enough for a mark.
              The live view is read below, the same access the circles make for
              their stroke weight: the floor clamp in clampRootView shifts the
              view's y at runtime, so a constant would misplace the ring on the
              hard levels where the cluster is pushed up off the floor. */}
          {/* eslint-disable-next-line react-hooks/refs */}
          {dockAside && gravity && !started && focus.depth === 0 && !flighting && (() => {
            const outer = nodes.filter((d) => d.depth === 1);
            if (!outer.length) return null;
            const enc = packEnclose(outer.map((d) => ({ x: d.x, y: d.y, r: d.r })));
            if (!enc) return null;
            const v = viewRef.current;
            const k = SIZE / v[2];
            const cx = (enc.x - v[0]) * k;
            const cy = (enc.y - v[1]) * k;
            const R = enc.r * k * 1.02; // a hair outside the outermost circles
            const swRing = Math.max(8, R * 0.048); // ring weight, matched to the line
            const swLine = Math.max(8, R * 0.048); // line weight
            // Both dashes come off their OWN stroke so they scale with weight, and
            // both draw with butt caps (the SVG default): round caps at 8px added
            // half the width to each dash end and closed the gaps into blobs. 2.2
            // dash, 1.6 gap reads as a proper dashed line rather than lozenges.
            // Kept as two pairs although identical right now, so ring and line can
            // still be tuned apart; collapse to one pair if they never diverge.
            const dashRing = `${swRing * 2.2} ${swRing * 1.6}`;
            const dashLine = `${swLine * 2.2} ${swLine * 1.6}`;
            // WHERE THE LINE POINTS. Prefer the live portrait: LineageModal measures
            // the top-left level portrait and hands down its screen centre + radius,
            // and we map that into viewBox units with the SVG's own getScreenCTM (the
            // same registration the pointer path uses), so the line points at the real
            // image on every width. If the measure or CTM is not ready (first paint),
            // fall back to the old fixed top-left fraction and draw no arrowhead, so
            // the mark is never blank.
            let target: { x: number; y: number; rad: number } | null = null;
            if (portraitAnchor) {
              const svgEl = stageRef.current?.querySelector("svg") as SVGSVGElement | null;
              const ctm = svgEl ? svgEl.getScreenCTM() : null;
              if (ctm && ctm.a && ctm.d) {
                // The viewBox mapping has no rotation or skew, so screen -> viewBox is
                // just (px - translate) / scale on each axis.
                target = {
                  x: (portraitAnchor.cx - ctm.e) / ctm.a,
                  y: (portraitAnchor.cy - ctm.f) / ctm.d,
                  rad: portraitAnchor.rad / ctm.a,
                };
              }
            }
            const aimX = target ? target.x : xMin + vbW * 0.07;
            const aimY = target ? target.y : -vbH / 2 + vbH * 0.09;
            const dx = aimX - cx, dy = aimY - cy;
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len, uy = dy / len;
            const sx = cx + ux * R, sy = cy + uy * R; // start: the ring edge, cluster side
            // ARROW_GAP: how far short of the portrait the arrow TIP stops, measured
            // from the portrait's EDGE in viewBox units, so it can never overlap the
            // image. Dial here. The arrowhead is sized from the line weight so it reads
            // as the same weight, in the site's solid-white-triangle style (.railCue).
            const ARROW_GAP = swLine * 2;
            const AH_LEN = swLine * 3;    // arrowhead tip-to-base length
            const AH_HALF = swLine * 1.8; // half the arrowhead base width
            const tipX = target ? target.x - ux * (target.rad + ARROW_GAP) : sx;
            const tipY = target ? target.y - uy * (target.rad + ARROW_GAP) : sy;
            const baseX = tipX - ux * AH_LEN, baseY = tipY - uy * AH_LEN; // arrowhead base centre
            const perpX = -uy, perpY = ux;
            // The line and arrowhead make no sense mid-tunnel, so they stay invisible
            // while the ring grows and fade in once it has landed.
            const revealStyle = {
              opacity: holdEntrance && !resolve ? 0 : 1,
              transition: `opacity ${MARKER_FADE_MS}ms ease ${RING_LEAD_MS + RING_GROW_MS}ms`,
            } as const;
            return (
              <g
                pointerEvents="none"
                aria-hidden="true"
                style={{
                  // Grow-into-place resolve: while the tunnel holds, the ring sits
                  // tiny at its own centre (the vanishing point); on the resolve
                  // signal it blooms to full size over RING_GROW, after leading by
                  // RING_LEAD. transform-box view-box puts the origin in SVG units.
                  // Off the resolve path (reduced motion, no tunnel) it is full at
                  // once.
                  transformBox: "view-box",
                  transformOrigin: `${cx}px ${cy}px`,
                  transform: holdEntrance && !resolve ? `scale(${RING_START_SCALE})` : "none",
                  transition: `transform ${RING_GROW_MS}ms cubic-bezier(0.2, 0.7, 0.3, 1) ${RING_LEAD_MS}ms`,
                }}
              >
                {target ? (
                  <>
                    <line
                      x1={sx} y1={sy} x2={baseX} y2={baseY}
                      stroke="#ffffff" strokeWidth={swLine} strokeDasharray={dashLine}
                      style={revealStyle}
                    />
                    <polygon
                      points={`${tipX},${tipY} ${baseX + perpX * AH_HALF},${baseY + perpY * AH_HALF} ${baseX - perpX * AH_HALF},${baseY - perpY * AH_HALF}`}
                      fill="#ffffff"
                      style={revealStyle}
                    />
                  </>
                ) : (
                  <line
                    x1={aimX} y1={aimY} x2={sx} y2={sy}
                    stroke="#ffffff" strokeWidth={swLine} strokeDasharray={dashLine}
                    style={revealStyle}
                  />
                )}
                <circle cx={cx} cy={cy} r={R} fill="none" stroke="#ffffff" strokeWidth={swRing} strokeDasharray={dashRing} />
              </g>
            );
          })()}

          {/* Circles and their names are interleaved, one node at a time:
              circle, its label, next circle, its label. They used to be two
              separate groups, all circles then all labels, which put EVERY name
              in front of EVERY circle, so a nested circle's name floated over
              the circle drawn on top of it. Paint order is array order, so
              interleaving makes a name obey exactly the same stacking as the
              circle it belongs to. zoomTo, the drop-in entrance and
              liftToLearn all index this group and now read
              children[i].children[0] for the circle, [1] for the label. */}
          {/* chums2 hover PUNCH-OUT band (D75): the tile-hover yellow fills only the
              hovered circle's exposed band, punching the child discs out to background.
              Drawn BEHIND the stroke-only circles: the transparent parent shows this
              yellow, the child holes show through, the strokes stay on top. `d` is set
              imperatively from the live view (effect above). An image-showing circle (in
              a zoom) fills opaque over it, so zoom-images win; the band shows at rest. */}
          <g pointerEvents="none" aria-hidden="true">
            <path ref={hlPathRef} fillRule="evenodd" fill="var(--yellow, #ffd23e)" />
          </g>
          {/* The twin glow, written by the
              frame writer: one blurred ring per circle that has another of its
              breed touching it. BEHIND the circles, so the glow shows outside
              their rims and no photograph is dimmed, and it never takes a
              pointer, or it would answer the hit test in a circle's place.
              It carries the swipe chain's own filter, not a second one. */}
          <g ref={twinGlowGRef} filter="url(#bt-chain-glow)" style={{ pointerEvents: "none" }} />
          <g ref={circlesRef}>
            {nodes.map((d, i) => {
              // The outer breed circle (root) is hidden so only the ancestor
              // circles inside it show. It stays in the DOM (rendered invisible
              // and non-interactive) so the index alignment used by zoomTo holds.
              const hidden = d.depth === 0 || isHiddenCopy(d);
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
              const tintCls = hasImg && tinted ? `${styles.imgCircle} ${tintClass}`.trim() : "";
              // The pointer says what the click will do, which is the only clue
              // a desktop user gets. onCircle zooms IN unless this circle is
              // already the focus, in which case it goes back UP. Once the round
              // has dropped, a click lifts the dog to the learn card instead, so
              // it stays a plain pointer there.
              // frozen is the start screen. onClick already swallows the press
              // there, so a magnifier would be promising a zoom that cannot
              // happen. Same reason dropped and disableZoom are excluded.
              // Colour is the second signal, on top of the plus and minus, and
              // it is about DEPTH, not about whether you happen to be zoomed:
              //   white   the big circles, the first ring you are looking at
              //   yellow  a circle nested inside one of those
              // so the pointer tells you whether you are about to go one level
              // down or two. The minus only ever appears on the circle you are
              // already inside, or on the background while zoomed in, so it is
              // yellow in its own class and needs no test here.
              const curCls = hidden || disableZoom || dropped || frozen
                ? ""
                : d === focus && d.parent
                  ? styles.curZoomOut
                  : d.parent === focus
                    ? styles.curZoomIn
                    : styles.curZoomInOn;
              const cls = `${tintCls} ${curCls}`.trim() || undefined;
              const heldHidden = (!!learnNode && (d === learnNode || (learnNode.descendants().includes(d) && !pitBodiesRef.current?.owned.has(d)))) || removedNodesRef.current.has(d);
              // Ghost the nest under a hovered circle: hollow dashed ring, hit area
              // kept so moving onto one re-hovers it. heldHidden (collected or
              // lifted) stays fully hidden and is never ghosted.
              const ghosted = !!buriedSet && d !== hovered && buriedSet.has(d) && !heldHidden;
              // chums2 #4: the stroke-only rings read heavy without the photo fill,
              // so trim the stroke 20% for displayOnly. Game hostings unchanged.
              // chums2: displayOnly rings are trimmed 20% (stroke-only reads heavy), then
              // the OUTERMOST (depth-1) rings are boosted 25% so they frame the pack more
              // strongly than the nested ones (D72 #3). Nested depths keep their weight.
              const sw = hidden ? 0 : strokeWidthFor(d) * strokeK(viewRef.current) * (displayOnly ? 0.8 : 1) * (displayOnly && d.depth === 1 ? 1.25 : 1);
              // chums2 #1: an ancestor-pack tile is being hovered and THIS circle is
              // that ancestor (matched by name). Paint it solid yellow (fill + stroke)
              // in place of its photo. displayOnly-gated + prop-gated, so game is inert.
              const isHi = displayOnly && !hidden && !!highlightName && d.data.name === highlightName;
              // chums2 #2 (D72): the outline goes yellow on hover from EITHER trigger - a
              // pack tile (isHi, matched by name) or the diagram circle itself (d ===
              // hovered). This replaces the old label-yellow feedback (labels are hidden).
              const hovYellow = isHi || (displayOnly && !hidden && d === hovered);
              const circleCls = ghosted
                ? `${styles.btCircle} ${styles.ghost} ${curCls}`.trim()
                : `${styles.btCircle} ${cls ?? ""}`.trim();
              const circleEl = (
                <circle
                  data-n={i}
                  className={circleCls}
                  // chums2 displayOnly circle fill, three coexisting states (D75):
                  // (b) inside a zoomed + hovered subtree -> the PHOTO (bt-img pattern),
                  //     which fills opaque and thus WINS over the band behind it;
                  // (c) otherwise -> "transparent" (not "none", so the whole disc still
                  //     HIT-TESTS for hover) - and at rest a tile-hover shows the yellow
                  // (a) exposed BAND through it, drawn by the punch-out path BEHIND the
                  //     circles (above). The yellow OUTLINE (stroke) shows on hover too.
                  /* THE PICTURE AND THE COLOUR ARE THE SAME SLOT, AND THEY ARE
                     MUTUALLY EXCLUSIVE. Read the ternary: a circle takes EITHER
                     the image pattern OR fillFor's colour. The photograph is not
                     drawn on top of a coloured disc, it IS the disc.

                     WHY THAT MATTERS FAR BEYOND THIS LINE (recorded 18 September
                     2026, after the owner considered restoring pictures to the
                     live pit and then declined). The chain says THREE things with
                     fill, and all three work only because a pit circle is a flat
                     coloured disc with nothing in it:
                       held circle        DOG_CHAIN_FILL, sky blue
                       available twin     its RARITY_BAND tier colour
                       everything else    fillFor's navy
                     Those are set as inline styles, which beat this attribute, so
                     with pictures on they would still win and a held circle would
                     simply LOSE ITS DOG. Restoring photographs therefore does not
                     cost a fill, it RETIRES THE FILL AS A SIGNALLING CHANNEL and
                     takes the chain's three states with it. They would have to
                     move to the ring and the glow, which sit outside the disc.

                     IT ALSO RETIRES THE MEASUREMENTS. Every ratio the chain
                     colours were chosen against is a ratio against a flat navy
                     disc: navy on sky 6.03, white label on navy 11.96, the four
                     depth rings on navy 10.23, 9.00, 4.01 and 5.39, the pink path
                     on navy 3.45. A PHOTOGRAPH HAS NO SINGLE LUMINANCE, so none of
                     those can be restated; rings and marks over pictures need an
                     outline or a scrim, which is a design decision rather than a
                     value.

                     AND THE MARK LOSES ITS JOB. It exists because there is no
                     photograph, see the note on QMARK_SRC. With one, it would be
                     sitting on a dog's face saying nothing.

                     THE 2 SEPTEMBER RULING STANDS, reaffirmed by the owner on 18
                     September: the photograph is what you get for lifting a circle
                     out onto the learn layer. Anyone proposing it again should
                     know it is a redesign of the chain's colour system, not a flag
                     in nodeImg. */
                  fill={hidden ? "none" : displayOnly ? (imgZoomOn && imgZoomSet?.has(d) && hasImg ? `url(#bt-img-${i})` : "transparent") : nodeImg(d) ? `url(#bt-img-${i})` : fillFor(d)}
                  // displayOnly (chums2 diagram): every circle outline is WHITE at
                  // every depth, in place of the yellow/navy/blue depth strokes. Only
                  // the node circle stroke here; hidden circles keep "none". Gated on
                  // displayOnly so game hostings keep strokeColorFor's colours.
                  stroke={hidden ? "none" : hovYellow ? "var(--yellow, #ffd23e)" : displayOnly ? "#ffffff" : strokeColorFor(d)}
                  strokeWidth={sw}
                  // Dashes proportional to the ring's own width, so they read the
                  // same at every zoom. The fade to and from this state is pure CSS
                  // (.btCircle transition); only the dash pattern is set here.
                  strokeDasharray={ghosted ? `${sw * 1.8} ${sw * 1.2}` : undefined}
                  style={{
                    // Inline would beat the cursor class, so only the two cases
                    // that have no class of their own are set here.
                    cursor: hidden ? "default" : curCls ? undefined : "pointer",
                    // An invisible circle must not take the press. Collected
                    // dogs stay in the DOM at opacity 0, and since J2 they stay
                    // for the rest of the level, so they were littering the pit
                    // with grabbers you could not see.
                    // heldHidden, not ghosted: a collected or lifted dog must
                    // not take the press, but a ghosted circle under a hovered
                    // parent must, or you can never reach it.
                    pointerEvents: hidden || heldHidden ? "none" : "auto",
                    opacity: heldHidden ? 0 : undefined,
                  }}
                  onPointerMove={(e) => {
                    const pl = pullRef.current;
                    if (!pl) return;
                    const dx = (e.clientX - pl.sx) * pl.perPx;
                    const dy = (e.clientY - pl.sy) * pl.perPx;
                    // 8px, the same threshold every other tap in the pit uses.
                    // At 4 a perfectly ordinary tap on a phone counted as a
                    // drag, and onCircle then swallowed it: the double tap was
                    // being thrown away before it could reach the learn area.
                    if (!pl.moved && Math.hypot(e.clientX - pl.sx, e.clientY - pl.sy) > 8) {
                      pl.moved = true;
                      // Double tap only opens learn once something has been
                      // pulled, so this is the moment that unlocks it.
                      pulledEverRef.current = true;
                    }
                    pl.ox = pullEase(dx, pl.max);
                    pl.oy = pullEase(dy, pl.max);
                    pullPaint(pl, pl.ox, pl.oy);

                    // Only siblings: a circle inside this one is already
                    // travelling with it, and its parent is the thing it lives
                    // in, so neither is something to collide with.
                    knockAgainst(d, pl.ox, pl.oy);
                  }}
                  onPointerUp={(e) => {
                    if (!pullRef.current) return;
                    try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch { /* none held */ }
                    pullRelease();
                  }}
                  onPointerCancel={() => { if (pullRef.current) pullRelease(); }}
                  onMouseEnter={hidden || frozen ? undefined : () => {
                    if (touchRef.current) return; // touch drives this from the tap
                    setHovered(d);
                    setHoverHint(`tap to learn more about ${d.data.name}`);
                    onCircleHover?.(d.data.name); // chums2 #2: mirror to the pack popouts
                  }}
                  onMouseLeave={hidden || frozen ? undefined : (e) => {
                    // Ignore the mouseleave the blue box triggers when its own
                    // growth (name, share and note appearing on hover) expands
                    // down over the very circle being pointed at. Without this the
                    // box covers the circle, fires leave, collapses back to the
                    // focused circle, and cannot reopen because the pointer has not
                    // moved. A real move to another circle or empty space still has
                    // a relatedTarget outside the aside, so it clears as before.
                    const rt = e.relatedTarget as Element | null;
                    // Guard the TYPE, not just truthiness. relatedTarget can be a
                    // non-Node (the window when the pointer leaves the document), and
                    // Node.contains() THROWS on a non-Node argument. The old
                    // `rt && ...contains(rt)` let that through, and the throw aborted
                    // this handler BEFORE the setHovered(null) below, so `hovered`
                    // stayed latched on the parent circle. That is why the first hover
                    // on an inner circle failed and the second worked, and why going
                    // out to the parent and back in "fixed" it. Four days read as
                    // geometry; it was this one line. (getAttribute below is already
                    // guarded for the same non-Node case.)
                    if (rt instanceof Node && asideRef.current?.contains(rt)) return;
                    // The circles inside this one are SIBLINGS in the SVG, not
                    // descendants, so moving onto one fires a real mouseleave
                    // here. Ignore it, or the hover would clear the moment you
                    // moved onto a nested circle to read it.
                    const ri = rt?.getAttribute?.("data-n");
                    if (ri !== null && ri !== undefined) {
                      const rn = nodes[Number(ri)];
                      if (rn && rn !== d && d.descendants().includes(rn)) return;
                    }
                    setHovered((h) => (h === d ? null : h));
                    setHoverHint((s) => (s.startsWith("tap to learn more about") ? "" : s));
                    onCircleHover?.(null); // chums2 #2: hover-out closes the pack preview
                  }}
                  onClick={
                    // `frozen` used to swallow this outright, and frozen is
                    // exactly the start screen, so onCircle was never reached
                    // there: the double tap had nothing to open the learn area
                    // with. It still must not fall through to the background,
                    // which would close the pit, so the click is stopped either
                    // way and onCircle decides what it means.
                    disableZoom
                      ? (e) => e.stopPropagation()
                      : (e) => { e.stopPropagation(); if (!fellRef.current) onCircle(e, d); }
                  }
                  // Once they have dropped, the dogs are physics bodies like
                  // everything else in the pit, so they can be picked up and
                  // shoved about. A press that does not travel is still a tap
                  // and still lifts the dog to the learn layer.
                  onPointerDown={
                    // `frozen` is NOT in this gate, and that is the whole reason
                    // push and pull did nothing: frozen is
                    // `dockAside && gravity && !started && !learning`, which is
                    // exactly the start screen, so the handler was undefined in
                    // the one place the pull needs it.
                    // Attaching it there is safe: the pull branch returns, and
                    // everything after it is behind `if (!fellRef.current)`,
                    // which is false until the round drops.
                    hidden || disableZoom
                      ? undefined
                      : (e) => {
                          // START SCREEN: grab it. The circle can be pushed and
                          // pulled and springs back when let go. Handled before
                          // the fellRef guard below, which exists for the round.
                          // Also in the learn area, by request: the same push and
                          // pull, and a tap still goes in. A tap that moved is
                          // ignored by onCircle, so dragging cannot open a dog by
                          // accident on the way back up.
                          if (dockAside && gravity && entered && !started && focusRef.current === nodes[0]) {
                            const st = stageRef.current;
                            const vbH = aspect >= 1 ? SIZE : SIZE / aspect;
                            const uppL = vbH / Math.max(st ? st.clientHeight : 1, 1);
                            const kL = SIZE / viewRef.current[2];
                            const prev = pullRef.current;
                            if (prev?.raf !== null && prev?.raf !== undefined) cancelAnimationFrame(prev.raf);
                            // The chip belongs to a depth-1 dog. Dragging a
                            // deeper circle moves no chip, which is right: the
                            // chip is its parent's and the parent is not moving.
                            // By identity, not by position in the dog list.
                            const ci = badgeSrcRef.current.indexOf(d);
                            pullRef.current = {
                              node: d,
                              els: d.descendants().map((x) => nodes.indexOf(x)).filter((j) => j >= 0),
                              chip: ci >= 0 ? { i: ci, bx: d.x - d.r * 0.707, by: d.y + d.r * 0.707 } : null,
                              sx: e.clientX,
                              sy: e.clientY,
                              ox: 0,
                              oy: 0,
                              max: d.r * PULL_MAX_R,
                              // frozen at the grab: the view does not move while
                              // a finger is down, and reading it every frame
                              // would make the circle drift under the thumb
                              perPx: uppL / kL,
                              moved: false,
                              raf: null,
                            };
                            try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* no capture */ }
                            e.stopPropagation();
                            return;
                          }
                          // fellRef is a ref, so it cannot be read at render
                          // time: the component does not re-render when the
                          // drop finishes, and the handler would be frozen as
                          // undefined for ever. Check it here instead.
                          if (!fellRef.current) return;
                          // The pit draws nested circles, so the middle of a dog
                          // is covered by its own children. Those children have
                          // no body until the dog pops open, so a press there
                          // used to find nothing and do nothing: no drag, and no
                          // lift either, because liftToLearn also needs a body.
                          // Walk up to the nearest circle that IS one. That makes
                          // the whole visible dog grabbable, the way a main-pit
                          // card is grabbable anywhere on it.
                          const pb = pitBodiesRef.current;
                          let target: Node | null = d;
                          while (target && !pb?.owned.has(target)) target = target.parent;
                          const liftNode = target ?? d;
                          // captured now: by the time the tap callback runs,
                          // React has recycled the event and currentTarget is
                          // null, which threw and left the layer unopened.
                          // The lift is placed from the circle's own rect, so it
                          // has to be the ancestor's element, not the child that
                          // happened to catch the press.
                          const li = nodes.indexOf(liftNode);
                          const el = ((circlesRef.current?.children[li] as SVGGElement | undefined)
                            ?.children[0] as SVGCircleElement | undefined)
                            ?? (e.currentTarget as SVGCircleElement);
                          // Matter owns the drag. Two things must NOT happen
                          // here: held, which would pull the body out of the
                          // world and leave the constraint with nothing to hold,
                          // and stopPropagation, because the press has to reach
                          // the stage listener that feeds the mouse. All that is
                          // left is the tap.
                          const p0 = { x: e.clientX, y: e.clientY, t: performance.now() };
                          const tapUp = (ev: PointerEvent) => {
                            window.removeEventListener("pointerup", tapUp);
                            window.removeEventListener("pointercancel", tapUp);
                            if (performance.now() - p0.t >= 350) return;
                            if (Math.hypot(ev.clientX - p0.x, ev.clientY - p0.y) >= 8) return;
                            mcReleaseRef.current?.(); // let go before the lift freezes the body
                            liftToLearn(el, liftNode);
                          };
                          window.addEventListener("pointerup", tapUp);
                          window.addEventListener("pointercancel", tapUp);
                        }
                  }
                >
                  {i === 0 && rootLabel ? <title>{rootLabel}</title> : null}
                </circle>
              );
              const isChild = d.parent === focus;
              // Every circle inside the focused one, however deep, not just the
              // first ring. Falls back to the first ring off the mini pit.
              const isInside = labelSet ? d !== focus && labelSet.has(d) : isChild;
              // When zoomed right into a single circle that has nothing inside
              // it, show that circle's own share centred within it.
              const isLeafFocus = d === focus && !!d.parent && !d.children;
              // A circle hidden under a hovered parent takes its name down with
              // it. Without this the circles vanish and the words stay floating
              // over nothing.
              const labelBuried = !!buriedSet && d !== hovered && buriedSet.has(d);
              // TRUE OCCLUSION. An ancestor's name used to be stood down
              // entirely while you pointed at a circle inside it, because the
              // labels were once all drawn in one group above all the circles,
              // so hiding was the only way to stop a name floating over the
              // thing you were reading.
              //
              // The interleave changed that. Each node is now one <g> holding
              // its circle and then its label, and descendants() hands parents
              // back before children, so the hovered circle is ALREADY painted
              // above its ancestors' labels. Standing the name down as well is
              // what stopped the occlusion being real: the part of the name that
              // reaches outside the hovered circle should still be readable, and
              // only the part behind it should disappear.
              //
              // The doc has this down as D3 W3, needing the hovered circle
              // redrawn above the labels with its own transform feed. That work
              // is already done, by the interleave.

              // A name belongs to a circle. If the circle is not drawn, and an
              // echo circle is not, the name goes with it. Without this the
              // repeated names stayed floating over the parent they belong to.
              // chums2 #1 (D72): HIDE the circle name labels entirely on the diagram -
              // they collide into an unreadable stack, and the names now surface via the
              // hover ensemble instead, so no information is lost. displayOnly-gated.
              const visible = (isInside || isLeafFocus) && !labelBuried && !hidden && !displayOnly;
              const pct = d.parent ? Math.round((d.value ?? 0) / (d.parent.value || 1) * 100) : null;
              const labelEl = (
                <g
                  textAnchor="middle"
                  style={{
                    display: visible ? "inline" : "none",
                    // These five used to live on the single labels group. That
                    // group is gone, so each label carries them itself.
                    fontFamily: "var(--font-body), system-ui, sans-serif",
                    opacity: hideLabels ? 0 : entered ? 1 : 0,
                    transition: "opacity 0.3s ease",
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                >
                  {/* 19 August 2026: a depth-0 root-ring label was added here and
                      removed the same day. It named the level on the outer ring
                      back when a single child filled the ring, but the two-circle
                      display device (data/lineage.ts) now names every level
                      through its own circles, so the label was redundant. Parked
                      on the top rim it also collided with the packing: on tight
                      levels like Old Highland terriers it ran behind the top
                      circle and was cut off mid-word. Its rim transform in the rAF
                      was removed with it. */}
                  {isInside && !(dropped && d.depth === 1) && (
                    (() => {
                      // Contain the label in its own circle. On mobile zoomTo
                      // scales the whole label group by ls, so the fit has to be
                      // done against the radius that scale leaves behind
                      // (r * k / ls); without that the type came out about a
                      // third too large and long names ran over the rim.
                      const vL = viewRef.current;
                      const kL = SIZE / vL[2];
                      // No longer gated on isMobile: zoomTo scales EVERY label
                      // group by ls now, so the fit has to allow for it on both.
                      // Leaving this at 1 on desktop was half the mismatch.
                      const ls = Math.max(0.4, Math.min(1.25, (d.r * kL) / 250));
                      // Fit inside the ring's INNER EDGE, not to the packed
                      // radius and not merely to the drawn one. A ring eats into
                      // the picture from the rim inwards, so anything fitted
                      // further out can land on it. Two terms, because the two
                      // depths wear their rings differently: a first-ring circle
                      // is drawn centred, so its ink starts half a stroke inside
                      // d.r, while a nested one is already inset by half a
                      // stroke and its ink starts a full stroke in. Adding the
                      // inset to half the stroke gives the right answer for
                      // both. Both are screen pixels, so both are divided by the
                      // live k to come back into the fitter's world units.
                      const ringPx = strokeWidthFor(d) * strokeK(vL);
                      const clearWorld = (ringInset(d, vL) + ringPx / 2) / kL;
                      const rDrawn = Math.max(1, d.r - clearWorld);
                      // Screen units on both now. Desktop fitted against the
                      // WORLD radius while the text was drawn in a group scaled
                      // to screen, so the two disagreed by a factor of k.
                      const rFit = (rDrawn * kL) / ls;
                      // the ceiling the fitter may grow to. Raised with
                      // LABEL_SAFE so short names are not capped before they
                      // reach the rim.
                      // 132 on both, because both now fit in screen units. 44
                      // belonged to the old world-unit desktop path and would
                      // clamp the type hard in this space.
                      const cap = 132;
                      const fit = fitLabel(d.data.name.toUpperCase(), rFit, cap, labelFont);
                      // A name that will not fit its circle is not drawn at all:
                      // the circle keeps its picture and ring, and the name comes
                      // back on zoom in, where the larger fit radius lets it fit.
                      // A spilling label is worse than no label.
                      const lines = fit.lines;
                      // HALVED (2026-08-12): draw at 50% of the fitted size, and
                      // RE-TEST the fit at that halved size so names that spilled at
                      // full size now show if they fit small. Gating on fit.fits
                      // (the full-size result) would keep the old, smaller set and
                      // make the halving pointless.
                      const fs = Math.max(10, Math.min(cap, fit.fs + TITLE_BOOST)) * 0.8984375; // 0.78125 +15% (14 August 2026); 0.5 -> 0.625 -> 0.78125 -> 0.8984375. The fit is RE-TESTED at this size below, so a few more names that fit smaller may now drop.
                      const widthEm = Math.max(...lines.map((l) => measureEm(l, labelFont)));
                      if (!labelFits(widthEm, lines.length, fs, rFit)) return null;
                      // Rightward shift, matched to labelFits' dxR so the draw and
                      // the fit agree; the block also rotates about this new centre.
                      // chums2 #5/#2: with the photos gone the NAME is the content and
                      // must sit inside the ring, so displayOnly drops the game's big
                      // right shift + arc for a small LEFT nudge (DISPLAY_LABEL_DX) and a
                      // slight counter-rotation (DISPLAY_LABEL_ROT_DEG), both tunable.
                      const dx = displayOnly ? DISPLAY_LABEL_DX * rFit : TITLE_DX_FRAC * rFit;
                      return (
                        <text
                          x={dx}
                          /* What this size was fitted against, so zoomTo can keep
                             it right while the view moves. The fit is only redone
                             on a render, and a zoom renders once at the START of
                             the flight, so without this the type stays the size
                             it was in the view being left for the whole 720ms
                             and only snaps back on arrival. */
                          data-fs={fs}
                          data-kfit={kL}
                          data-lsfit={ls}
                          y={labelFirstY(lines.length, fs, rFit)}
                          transform={`rotate(${displayOnly ? DISPLAY_LABEL_ROT_DEG : TITLE_ANGLE} ${dx} ${titleDy(rFit)})`}
                          style={{
                            // The hovered circle's NAME goes yellow in the game. On the
                            // /chums2 diagram the hover feedback is the yellow BAND fill
                            // (punch-out) instead, so the label must keep its normal white
                            // - gate the yellow off for displayOnly. (D70 #2.)
                            fill: d === hovered && !displayOnly ? "var(--yellow, #ffd23e)" : "#ffffff",
                            fontFamily: "var(--font-display), system-ui, sans-serif",
                            fontSize: `${fs}px`,
                            letterSpacing: "0.5px",
                            // Paint order already puts a nested name in front of
                            // the name of the circle it sits in: d3 hands the
                            // nodes back shallowest first, so the deeper label is
                            // drawn last. White on white just does not read as
                            // in front. A black halo cuts a name cleanly out of
                            // whatever is behind it. It goes on the first ring
                            // too now, by request, so the big names and the
                            // nested ones read as one family. paint-order lays
                            // the stroke down first and the fill over it, so the
                            // weight sits outside the letterform rather than
                            // eating into it. The chum pages pass hideLabels, so
                            // the first-ring change does not reach them.
                            ...(isInside
                              ? {
                                  stroke: "#000000",
                                  strokeWidth: Math.max(2, fs * 0.16),
                                  strokeLinejoin: "round" as const,
                                  paintOrder: "stroke" as const,
                                }
                              : null),
                          }}
                        >
                          {lines.map((line, li) => (
                            <tspan key={li} x={dx} dy={li === 0 ? 0 : `${LABEL_LINE_H}em`}>{line}</tspan>
                          ))}
                        </text>
                      );
                    })()
                  )}
                  {/* The drawn share disc. The mini pit does not use it at all
                      now: the first ring never did, and the circles nested
                      inside were still showing one on the start screen. In the
                      pit the share is carried by the physics chips that scatter
                      on the drop, so a second static copy on the start screen
                      was saying the same thing twice. The chum pages keep it. */}
                  {pct !== null && !dockAside && !learning && (
                    <g>
                      <circle cx={0} cy={50} r={46} style={{ fill: "#ffd23e", stroke: "#0a3a57", strokeWidth: 3 }} />
                      <text x={0} y={50} dominantBaseline="central" style={{ fill: "#0a3a57", fontFamily: "Montserrat, var(--font-body), system-ui, sans-serif", fontWeight: 800, fontSize: `${46 * 0.7}px` }}>
                        {`${pct}%`}
                      </text>
                    </g>
                  )}
                </g>
              );
              /* THE QUESTION MARK, children[2] of the node group.

                 APPENDED AFTER THE LABEL ON PURPOSE. The per-frame writer
                 addresses this group by index, children[0] the circle and
                 children[1] the label, so anything inserted BEFORE them would
                 silently move the circle and the label onto each other's
                 transforms. Added last, both keep their index.

                 Born hidden with no transform. The writer decides every frame
                 whether it shows and where it sits, and a mark drawn before that
                 first pass would flash at the origin. */
              const qmarkEl = (
                <g data-qmark style={{ display: "none", pointerEvents: "none" }} aria-hidden="true">
                  <image href={QMARK_SRC} width={QMARK_VB} height={QMARK_VB}
                    preserveAspectRatio="xMidYMid meet"
                    filter={`url(#bt-qmark-${(d.depth - 1 + 4) % 4})`} />
                </g>
              );
              return (
                <g key={i}>
                  {circleEl}
                  {labelEl}
                  {qmarkEl}
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
          <g ref={badgesRef} style={{ display: dockAside && !learning && !displayOnly ? "inline" : "none", opacity: entered ? 1 : 0, transition: "opacity 0.3s ease" }} textAnchor="middle">
            {badgePcts.map((item, i) => {
              const v = viewRef.current;
              const kk = SIZE / v[2];
              const b = badgeBodiesRef.current?.[i];
              // The circle this badge came from, carried by the badge. This used
              // to be nodes.filter(depth === 1)[i], which is the coupling stage 1
              // exists to remove. Used only before the bodies exist, to park the
              // badge on its circle's rim.
              const d1n = item.src ?? null;
              const bx = b ? b.x : d1n ? d1n.x - d1n.r * 0.707 : v[0];
              const by = b ? b.y : d1n ? d1n.y + d1n.r * 0.707 : v[1] - 99999;
              const inert = inertBadges.has(i);
              if (deadBadges.has(i)) return <g key={i} style={{ display: "none" }} />;
              if (item.r <= 0) return <g key={i} style={{ display: "none" }} />; // dog below the legibility floor: no badge
              return (
              <g key={i} transform={`translate(${(bx - v[0]) * kk},${(by - v[1]) * kk}) rotate(${(b ? b.a : 0) * 57.2958})`}
                style={{ cursor: inert ? "default" : "grab", pointerEvents: inert ? "none" : "auto", userSelect: "none" }}
                onClick={(e) => e.stopPropagation()}
>
                {/* J17 stage 2: a bomb wears the main pit's sprite in place of
                    the yellow disc, sized the same way the pit sizes it: a box
                    of 2.4 radii with the aspect ratio preserved inside it. The
                    transparent circle underneath keeps the grab area identical
                    to a badge's, so drag, tap and hit-testing are unchanged.
                    It keeps the sprite when the badge goes inert, because a
                    bomb turning into a blue disc reads as broken. Stage 3
                    replaces the charge counting with the fuse. */}
                {item.bomb ? (
                  <>
                    {/* The sprite is drawn 2.4 radii wide, so the ball you aim
                        at is bigger than the body under it. The grab area
                        matches what you can see rather than the physics radius,
                        which matters most for the press and hold that burns the
                        fuse. */}
                    <circle cx={0} cy={0} r={item.r * 1.13} style={{ fill: "transparent", pointerEvents: "all" }} />
                    <image
                      href="/bomb.svg"
                      x={-item.r * 1.2}
                      y={-item.r * 1.2}
                      width={item.r * 2.4}
                      height={item.r * 2.4}
                      preserveAspectRatio="xMidYMid meet"
                      style={{ pointerEvents: "none" }}
                    />
                  </>
                ) : (
                /* The outline is a fraction of the radius, so a chip keeps the same
                   ring-to-disc proportion at every difficulty stop. A fixed
                   pixel width was tried and rejected: it reads correctly on the
                   small level-0 chips and thins out badly as they grow. The
                   fractions are calibrated so a level-0 chip is unchanged, by
                   measuring the ring off the level-0 screen: 5 * upp against a
                   radius of about 41 to 46 units, which is 0.19. The label
                   variant keeps the same 18% extra it always had. */
                /* THE LEARNT CHIP IS LEMON NOW, NOT GREEN (31 Aug 2026, Steve),
                   matching the #ffed00 rolled out across the reveal card, the
                   shortlist bar, the knockout round and the superpower pages.

                   THE RING AND THE FIGURE HAD TO MOVE WITH IT. Both were white,
                   which only ever worked because the disc underneath was green.
                   Measured against #ffed00: white is 1.21:1, invisible. Navy
                   #0a3a57 is 9.89:1. The old note directly below said as much
                   about the yellow chips, that white on yellow would not be
                   readable, and it was right.

                   Both are navy now, which is what every other badge in the pit
                   already used, so the `item.green` branch on the stroke and on
                   the text is gone rather than recoloured. */
                /* A learnt badge still goes inert WHITE, not the blue every
                   other badge uses, so a spent one reads as a distinct dead
                   token. The ring no longer needs to switch to navy on going
                   inert, because it is navy in both states now. Ordinary
                   badges keep the blue inert fill (white on white would
                   disappear). */
                <circle cx={0} cy={0} r={item.r} style={{ fill: inert ? (item.green ? "#ffffff" : "#0c5b92") : item.label ? "#5cc4ee" : CHIP_FILL, stroke: "#0a3a57", /* THE % BADGE'S RIM MATCHES THE NODE IT CAME FROM, 9 Sept 2026
                     (owner). It was a flat 0.19 of its own radius. ringFrac(1) is
                     0.09, the weight a first-generation circle wears on the lifted
                     screen, read from the shared RING_FRAC table rather than typed
                     in again, so the two cannot drift.
                     The labelled solo-dog circle keeps its 0.225: it is a different
                     object, it was not asked about, and it carries a name rather
                     than a figure. */
                  strokeWidth: item.r * (item.label ? 0.225 : ringFrac(1)) }} />
                )}
                {!item.bomb && !inert && (item.label ? (
                  // solo dog circle: the breed name it wore before the round
                  // started, measured by the same fitter the pit circles use
                  (() => {
                    const lab = fitLabel(item.label, item.r, item.r * 0.34, labelFont);
                    // Same rule as the pit circles: a name that will not fit is
                    // not drawn, the disc stands on its own rather than spilling.
                    if (!lab.fits) return null;
                    const top = -((lab.lines.length - 1) * lab.fs * LABEL_LINE_H) / 2;
                    return (
                      <text x={0} y={0} dominantBaseline="central" style={{ fill: "#ffffff", fontFamily: "var(--font-display), system-ui, sans-serif", fontSize: `${lab.fs}px`, pointerEvents: "none", userSelect: "none" }}>
                        {lab.lines.map((ln, li) => (
                          <tspan key={li} x={0} y={top + li * lab.fs * LABEL_LINE_H}>{ln}</tspan>
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

          {/* The elements knocked off the logo. Debris, so pointer events are
              off: they must never take a tap meant for a dog behind them. The
              frame loop positions each by index into this container, which is
              why the order here is the order they were spawned in. */}
          <g ref={logoPiecesGRef} style={{ display: dockAside ? "inline" : "none", pointerEvents: "none" }} aria-hidden="true">
            {/* NO TRANSFORM AND NO REF READ HERE. The rods and toys above work
                out their own opening position by reading their bodies during
                render, which this file's eslint config counts as an error; the
                baseline is what it is, but nothing new should join it. A piece
                is therefore born HIDDEN at the origin and the per-frame loop,
                which was going to move it on the very next frame anyway, both
                places it and reveals it. */}
            {logoPieceList.map((lp, i2) => (
              <g key={i2} style={{ visibility: "hidden" }}>
                <image href={lp.src} x={-lp.w / 2} y={-lp.h / 2} width={lp.w} height={lp.h} preserveAspectRatio="xMidYMid meet" />
              </g>
            ))}
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
                  >
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
                  onPointerDown={ty.kind !== "flag" && ty.kind !== "cookies" ? undefined : (e) => {
                    // Matter owns the drag. Only the taps are left, on the same
                    // thresholds the old path used: under 350ms and under 8px of
                    // travel. Both props read their message and then retire.
                    const isCookies = ty.kind === "cookies";
                    const p0 = { x: e.clientX, y: e.clientY, t: performance.now() };
                    const tapUp = (ev: PointerEvent) => {
                      window.removeEventListener("pointerup", tapUp);
                      window.removeEventListener("pointercancel", tapUp);
                      if (performance.now() - p0.t >= 350) return;
                      if (Math.hypot(ev.clientX - p0.x, ev.clientY - p0.y) >= 8) return;
                      mcReleaseRef.current?.();
                      if (isCookies) {
                        retireToy(TOY_COOKIES_SEEN_KEY);
                        // the notice CookieBanner already renders above the pit
                        window.dispatchEvent(new Event("pc:open-cookies"));
                        const cb = toyBodiesRef.current[i2]?.mb;
                        if (cb) cookieBtnsRef.current?.(cb.position.x, cb.position.y);
                      } else {
                        retireToyForever(TOY_FLAG_SEEN_KEY);
                        setBritainOpen(true);
                      }
                    };
                    window.addEventListener("pointerup", tapUp);
                    window.addEventListener("pointercancel", tapUp);
                  }}>
                  {ty.kind === "flag" ? (
                    <>
                      <clipPath id={`bt-toy-${i2}`}><circle cx={0} cy={0} r={half} /></clipPath>
                      <image href={ty.src} x={-half} y={-half} width={ty.size} height={ty.size}
                        clipPath={`url(#bt-toy-${i2})`} preserveAspectRatio="xMidYMid slice" />
                      <circle cx={0} cy={0} r={half} style={{ fill: "none", stroke: "#ffffff", strokeWidth: ty.size * 0.06 }} />
                    </>
                  ) : (
                    /* THE FUSED BONE. Two nodes rather than one swapped href,
                       because a cross-fade needs both artworks on screen at
                       once. The plain bone sits underneath at full strength and
                       the second one fades out over it, which is the same
                       result the main pit gets by drawing twice with alpha,
                       without needing a canvas. Outside the fuse the second
                       node is simply not rendered. */
                    <>
                      <image href={ty.src} x={-half} y={-ty.h / 2} width={ty.size} height={ty.h}
                        style={ty.filter ? { filter: ty.filter } : undefined} />
                      {(boneFuse?.idx === i2 || boneNear === i2) && (
                        <image href={TOY_BONE_OHYEA_SRC} x={-half} y={-ty.h / 2} width={ty.size} height={ty.h}
                          style={boneFuse?.idx === i2 ? {
                            // AFTER the snap: held at full strength, then faded.
                            // The delay does the holding, so the browser owns
                            // the timing and nothing has to tick.
                            opacity: boneOhYeaGone ? 0 : 1,
                            transition: `opacity ${BONE_OHYEA_FADE}ms linear ${BONE_OHYEA_HOLD}ms`,
                          } : {
                            // BEFORE it: simply on while in range. A short fade
                            // in, none out, so arming reads as a response and
                            // leaving the range snaps back without a lag that
                            // would lie about whether you are still armed.
                            opacity: 1,
                            transition: "opacity 120ms linear",
                          }} />
                      )}
                    </>
                  )}
                </g>
              );
            })}
          </g>
          {/* The chum flood. pointerEvents none on the whole group, so none of
              them can be grabbed, tapped or opened: they are scenery. */}
          {/* THE FLOOD IS NO LONGER SCENERY. The group used to carry
              pointerEvents none so nothing here could be touched at all. The
              cards now take a double tap to collect, and only that: they are
              still not draggable and they still do not open anything, so the
              pit's own press-and-move rule is untouched by them. */}
          <g ref={chumsGRef} style={{ display: dockAside ? "inline" : "none" }}>
            {chumList.map((cm, i2) => {
              const pr = chumBodiesRef.current[i2];
              const v2 = viewRef.current;
              const kk2 = SIZE / v2[2];
              const half = cm.size / 2;
              const rx = cm.size * 0.22;
              /* A COLLECTED CARD IS HIDDEN, NEVER UNMOUNTED. Every prop group
                 in this pit is addressed by position: the physics writer sets
                 gg.children[pr.idx]. Removing one element would shift every
                 card after it onto the wrong body, which is how the toys and
                 the pills already work: they hide, they do not go. */
              const collected = chumGone.has(i2);
              return (
                <g key={i2} transform={pr ? `translate(${(pr.x - v2[0]) * kk2},${(pr.y - v2[1]) * kk2}) rotate(${pr.a * 57.2958})` : undefined}
                  style={{ display: collected ? "none" : undefined, cursor: "pointer", pointerEvents: collected ? "none" : "auto" }}
                  onPointerDown={(e) => {
                    // Its own gesture, its own bookkeeping. Nothing here calls
                    // startDrag, so the card cannot be dragged and cannot take
                    // a press away from anything that can.
                    e.stopPropagation();
                    // Already on its way, so leave it alone.
                    if (chumFlyRef.current.has(i2)) return;
                    // First tap on this card: arm it, and disarm any other.
                    if (armedChum !== i2) { setArmedChum(i2); return; }
                    // This press may start a
                    // swipe chain, so the chain decides on release. See
                    // chainHeldCollectRef. Off the flag, nothing here changes.
                    if (chumGateRef.current === e.pointerId) { chainHeldCollectRef.current = i2; return; }
                    // Second tap on the armed card: taken.
                    setArmedChum(null);
                    setTakenChum(i2);
                    collectChum(i2);
                  }}
                >
                  <clipPath id={`bt-chum-${i2}`}>
                    <rect x={-half} y={-half} width={cm.size} height={cm.size} rx={rx} />
                  </clipPath>
                  <rect x={-half} y={-half} width={cm.size} height={cm.size} rx={rx} style={{ fill: "#ffffff" }} />
                  <image href={encodeURI(bust(cm.image))} x={-half} y={-half} width={cm.size} height={cm.size}
                    preserveAspectRatio="xMidYMid slice" clipPath={`url(#bt-chum-${i2})`} />
                  {/* THE EDGE IS THE STATE. White at rest, yellow armed, green
                      taken. An SVG stroke is centred on the edge, so half of it
                      sits inside the image whatever colour it is: the card reads
                      at the same size in all three. */}
                  <rect x={-half} y={-half} width={cm.size} height={cm.size} rx={rx}
                    data-chum-edge
                    style={{
                      fill: "none",
                      stroke: takenChum === i2 ? "#22c55e" : armedChum === i2 ? "var(--yellow, #ffd23e)" : "#ffffff",
                      strokeWidth: Math.max(2, cm.size * 0.055),
                      transition: "stroke 0.12s ease",
                    }} />
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
                  >
                  {/* NO OUTLINE, 2 September 2026 (owner). It wore a white stroke
                      here and none on the lifted layer, and the lifted one is the
                      reference. The navy fill and the drop shadow are what the
                      lift uses, so the two now read as the same object. */}
                  <rect x={-pl.w / 2} y={-pl.h / 2} width={pl.w} height={pl.h} rx={pl.h / 2}
                    style={{ fill: "#0a3a57" }} />
                  {pl.lines.map((ln, li) => (
                    <text key={li} x={0} y={pl.lines.length > 1 ? (li === 0 ? -pl.unit * 0.6 : pl.unit * 0.6) : 0} dominantBaseline="central"
                      style={{ fill: "#ffffff", fontFamily: "Montserrat, var(--font-body), system-ui, sans-serif", fontWeight: 700, fontSize: `${pl.unit * 0.92}px`, pointerEvents: "none", userSelect: "none" }}>
                      {ln}
                    </text>
                  ))}
                </g>
              );
            })}
          </g>

          {/* The cookie panel's Accept and Reject. Pit objects: they tumble,
              can be dragged, and a tap answers the notice. */}
          {/* The level's dogs, as their names, once the pit is live. Their own
              group so nothing that governs the packed labels can touch them.
              Luckiest Guy in white over a navy halo, paint-order stroke, the
              same treatment a name wears inside its circle. */}
          <g ref={wordsGRef} textAnchor="middle" style={{ display: dropped ? "inline" : "none" }}>
            {wordList.map((w, i2) => (
              <g
                key={i2}
                // The word IS the object now, so it takes the tap. pointerEvents
                // none was copied from the label styling, where a name must
                // never intercept a tap meant for its circle. Here there is no
                // circle behind it, so the tap fell through to the background
                // and offered to leave the game.
                style={{ pointerEvents: "auto", userSelect: "none", cursor: "grab" }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  const wn = wordBodiesRef.current[i2]?.n;
                  if (wn) liftToLearn(e.currentTarget as Element, wn);
                }}
              >
                <text
                  x={0}
                  y={0}
                  dominantBaseline="central"
                  style={{
                    fill: "#ffffff",
                    stroke: "#0a3a57",
                    strokeWidth: Math.max(2, w.fs * 0.16),
                    paintOrder: "stroke",
                    strokeLinejoin: "round",
                    fontFamily: "var(--font-display), system-ui, sans-serif",
                    fontSize: `${w.fs}px`,
                  }}
                >
                  {w.lines.map((ln, li) => (
                    <tspan key={li} x={0} y={-((w.lines.length - 1) * w.fs * LABEL_LINE_H) / 2 + li * w.fs * LABEL_LINE_H}>{ln}</tspan>
                  ))}
                </text>
              </g>
            ))}
          </g>

          <g ref={btnsGRef} style={{ display: dockAside ? "inline" : "none" }} textAnchor="middle">
            {btnList.map((bt, i2) => {
              const pr = btnBodiesRef.current[i2];
              const v2 = viewRef.current;
              const kk2 = SIZE / v2[2];
              const dead = deadBtns.has(i2);
              const accept = bt.label === "Accept";
              return (
                <g key={i2} transform={pr ? `translate(${(pr.x - v2[0]) * kk2},${(pr.y - v2[1]) * kk2}) rotate(${pr.a * 57.2958})` : undefined}
                  style={{ display: dead ? "none" : undefined, cursor: "grab", pointerEvents: dead ? "none" : "auto", userSelect: "none" }}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => {
                    // Matter owns the drag, so only the tap lives here, on the
                    // same thresholds as every other tap in the pit.
                    const p0 = { x: e.clientX, y: e.clientY, t: performance.now() };
                    const tapUp = (ev: PointerEvent) => {
                      window.removeEventListener("pointerup", tapUp);
                      window.removeEventListener("pointercancel", tapUp);
                      if (performance.now() - p0.t >= 350) return;
                      if (Math.hypot(ev.clientX - p0.x, ev.clientY - p0.y) >= 8) return;
                      mcReleaseRef.current?.();
                      cookieAnswerRef.current?.(i2, accept);
                    };
                    window.addEventListener("pointerup", tapUp);
                    window.addEventListener("pointercancel", tapUp);
                  }}>
                  {/* Matched line for line to the main pit's own drawing of
                      these two, PackPit drawBall, the cookieaccept branch:
                      corner radius 0.34 of the height, a flat 5px navy keyline,
                      Luckiest Guy at half the height, white on the red Reject
                      and navy on the green Accept, and the label nudged down by
                      0.05 of the height so it sits optically centred. */}
                  <rect x={-bt.w / 2} y={-bt.h / 2} width={bt.w} height={bt.h} rx={bt.h * 0.34}
                    style={{ fill: bt.tone, stroke: "#0a3a57", strokeWidth: bt.sw }} />
                  <text x={0} y={bt.h * 0.05} dominantBaseline="central"
                    style={{ fill: accept ? "#0a3a57" : "#ffffff", fontFamily: "var(--font-display), system-ui, sans-serif", fontSize: `${bt.h * 0.5}px`, pointerEvents: "none", userSelect: "none" }}>
                    {bt.label}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Collision number flashes, appended imperatively by the sim. */}
          <g ref={fxRef} style={{ pointerEvents: "none" }} />

          {/* In-pit buttons: close X and description toggle. Navy rounded
              squares with a yellow stroke; fixed top-right until knocked
              loose, always tappable. */}
          {dockAside && !displayOnly && (() => {
            const v = viewRef.current;
            const kk = SIZE / v[2];
            const st = stageRef.current;
            const upp = st ? (aspect >= 1 ? SIZE : SIZE / Math.max(aspect, 0.01)) / Math.max(st.clientHeight, 1) : 1;
            // 25% off, 2 September 2026 (owner), matching the start screen's PLAY
            // and LEARN. This is the DRAWN size only; the bodies keep their 84
            // slot. The same 0.75 is applied to UI_DRAWN where the bodies are
            // built, so the spacing between the X and the square under it stays
            // proportional. The two must be changed together.
            const uSz = 84 * pitScale * 1.2 * upp * 0.75; // main pit: BIG * 1.2
            const m = 16 * upp;
            const vbWr = aspect >= 1 ? SIZE * aspect : SIZE;
            const vbHr = aspect >= 1 ? SIZE : SIZE / aspect;
            const xMinR = aspect >= 1 ? -vbWr * shift : -vbWr / 2;
            const ub = uiBodiesRef.current;
            // The close X is always there, the single way out. The info square
            // belongs to learn and nowhere else: it is how you get the blue box
            // back once you have closed it. It stays out of the start screen and
            // out of play, where reading is not what you are doing.
            // During a round the second square is the way back to learn. It
            // takes the description square's slot, which is safe because that
            // one only ever appears in learn.
            /* The corner set, plus the two menu squares while the menu is
               open. The menu only exists during a round: on the start screen
               and in learn the X already closes or goes back outright, so
               there is nothing to warn about. */
            const kinds = ([
              ...(started && onBackToLearn
                ? ["close", "learn"]
                : learning && hideCaption
                ? ["close", "desc"]
                : ["close"]),
            ]) as readonly UiKind[];
            const defs: { kind: UiKind; wx: number; wy: number; a: number }[] = kinds.map((kind) => {
              const b = ub?.find((u) => u.kind === kind);
              return {
                kind,
                /* THE FALLBACK, used only for the frame or two before the bodies
                   exist. It stacked DOWNWARD off idx while the bodies now sit
                   SIDE BY SIDE, so it is moved onto x to match. Left unfixed it
                   would have shown the second square below the X and then jumped
                   it sideways, which reads as a glitch rather than a layout. */
                /* The fallback, used for the frame or two before the bodies exist.
                   It matches the split above: desc goes left of the X, learn goes
                   below it. Keyed off the KIND, not off idx, because the two no
                   longer share a direction. */
                wx: b ? b.x : v[0] + (xMinR + vbWr - m - uSz / 2 - (kind === "desc" ? uSz + 14 * upp : 0)) / kk,
                wy: b ? b.y : v[1] + (-vbHr / 2 + m + uSz / 2 + (kind === "learn" ? uSz + 14 * upp : 0)) / kk,
                a: b ? b.a : 0,
              };
            });
            const half = uSz / 2;
            const iconStroke = Math.max(4 * upp, uSz * 0.1); // main pit icon weight
            // A spawned pair square: same rect + glyph the corner squares wore,
            // but keyed per instance and positioned by the frame loop via the
            // pairsGRef container. Any leave leaves, any restart rewinds; there
            // is no dismiss, so the pile only grows (up to the cap) until you use
            // one, or the level changes and the whole component remounts.
            const pairSquare = (id: number, kind: "leave" | "restart") => (
              <g key={`${kind}${id}`} role="button"
                /* THE TWO SQUARES SWAPPED PURPOSE, 9 Sept 2026 (owner).
                   Red was leave the pit for the main page and green was back to
                   the start screen. Red now goes to the start screen and green
                   restarts the level outright. The main page is still reachable
                   from the corner square on the start screen itself, which is
                   the only place a close really closes anything. */
                aria-label={kind === "leave" ? "Back to the start screen" : "Restart this level"}
                style={{ cursor: "pointer" }}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => {
                  const b = uiBodiesRef.current?.find((u) => u.id === id && u.kind === kind);
                  startDrag(e, b && !b.fixed ? b : null, kind === "leave" ? () => onBackToStart?.() : () => onRestartLevel?.());
                }}>
                <rect x={-half} y={-half} width={uSz} height={uSz} rx={uSz * 0.3}
                  style={{ fill: kind === "leave" ? "#ef4444" : "#22c55e", stroke: "var(--navy, #0a3a57)", strokeWidth: 5 * upp }} />
                {kind === "leave" ? (
                  <g stroke="#ffffff" strokeWidth={iconStroke} strokeLinecap="round">
                    <line x1={-half * 0.34} y1={-half * 0.34} x2={half * 0.34} y2={half * 0.34} />
                    <line x1={half * 0.34} y1={-half * 0.34} x2={-half * 0.34} y2={half * 0.34} />
                  </g>
                ) : (
                  <g fill="#ffffff">
                    <path d={`M${half * 0.04},${-half * 0.42} L${-half * 0.44},0 L${half * 0.04},${half * 0.42} Z`} />
                    <path d={`M${half * 0.52},${-half * 0.42} L${half * 0.04},0 L${half * 0.52},${half * 0.42} Z`} />
                  </g>
                )}
              </g>
            );
            return (<>
              {/* THE LOGO. Its own node, not a member of `defs`: every entry
                  there is a button with a hover hint, an aria-label and a tap
                  action, and the logo is none of those. It is decoration that
                  happens to be solid.
                  Positioned by the same per-frame loop as the squares, through
                  uiRefFor("logo"), so it sinks, tilts and tumbles with no extra
                  writer. Sized from the body itself rather than recomputed here,
                  since the sim and this block already size the squares by two
                  different formulas.
                  pointerEvents none: it must never swallow a tap meant for a
                  dog behind it. */}
              {started && (() => {
                const lb = ub?.find((u) => u.kind === "logo");
                if (!lb || !lb.w || !lb.h) return null;
                const lw = lb.w * kk, lh = lb.h * kk;
                return (
                  <g ref={uiLogoRef} style={{ pointerEvents: "none" }} aria-hidden="true"
                    transform={`translate(${(lb.x - v[0]) * kk},${(lb.y - v[1]) * kk}) rotate(${lb.a * 57.2958})`}>
                    {/* data-logo-art is how the per-frame writer finds this
                        node. href is derived from the hit count here as well,
                        so a re-render caused by anything else cannot snap a
                        damaged logo back to its undamaged art. */}
                    <image data-logo-art href={logoArtFor(lb.hits)} x={-lw / 2} y={-lh / 2} width={lw} height={lh} preserveAspectRatio="xMidYMid meet" />
                  </g>
                );
              })()}
              {defs.map((d) => (
              <g key={d.kind} ref={uiRefFor(d.kind)}
                /* A stable hook for measuring this square from outside. Two of
                   these squares share the aria-label "Back to the start screen",
                   so the label cannot pick one out. Used by ?cornerdebug=1. */
                data-ui-square={d.kind}
                role="button"
                onMouseEnter={() => setHoverHint(
                  d.kind === "desc" ? "open the info box"
                    : started ? ""
                    : learning ? "back to the start screen"
                    : "back to main page"
                )}
                onMouseLeave={() => setHoverHint("")}
                aria-label={
                  d.kind === "close"
                    ? (learning ? "Back to the start screen" : started ? "Pit menu" : "Close the pit")
                    : d.kind === "leave"
                    ? "Leave the game"
                    : d.kind === "restart"
                    ? "Back to the start screen"
                    : d.kind === "learn"
                    ? "Back to the learn area"
                    : "Breed information"
                }
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
                  /* THE CORNER X DROPS A PAIR DURING A ROUND. Each tap spawns
                     another red-leave + green-restart pair into the pit, up to
                     the cap; they never leave, so using one is how you get out.
                     Outside a round it still closes or goes back outright. */
                  const act =
                    d.kind === "close"
                      ? (learning
                          ? backToStartScreen
                          : started
                          ? () => {
                              // The spawn must be OUTSIDE the state updater: React
                              // can run an updater more than once (StrictMode does
                              // in dev), and each extra run would spawn a body the
                              // cap never counted. Decide from the ref, spawn once,
                              // then a PURE setPitPairs. The ref is bumped here too
                              // so a second synchronous tap counts before the sync
                              // effect catches up from state.
                              if (pitPairsRef.current.length >= PIT_PAIR_CAP) return;
                              const id = pitPairSeqRef.current++;
                              spawnPairRef.current?.(id);
                              pitPairsRef.current = [...pitPairsRef.current, id];
                              setPitPairs((p) => [...p, id]);
                            }
                          : onPitClose)
                      : d.kind === "learn"
                      ? onBackToLearn
                      : onToggleCaption;
                  startDrag(e, b && !b.fixed ? b : null, act);
                }}>
                <rect x={-half} y={-half} width={uSz} height={uSz} rx={uSz * 0.3}
                  style={{
                    /* The two menu squares carry their own colour so the choice
                       reads before the glyph does: red leaves, green goes back.
                       Everything else stays the pit's yellow. */
                    fill:
                      d.kind === "leave" ? "#ef4444"
                        : d.kind === "restart" ? "#22c55e"
                        /* Back-out actions read red: the close square is red both
                           on the START SCREEN (where it closes to the main page)
                           and in LEARN (where it goes back to the start screen),
                           each with a white border and glyph. During a round it
                           stays the pit's yellow, because there it opens the menu
                           rather than backing out. */
                        : d.kind === "close" && (learning || !started) ? "#ef4444"
                        : "var(--yellow, #ffd23e)",
                    stroke: d.kind === "close" && (learning || !started) ? "#ffffff" : "var(--navy, #0a3a57)",
                    strokeWidth: 5 * upp,
                  }} />
                {d.kind === "leave" ? (
                  // White on red, the same X the corner uses.
                  <g stroke="#ffffff" strokeWidth={iconStroke} strokeLinecap="round">
                    <line x1={-half * 0.34} y1={-half * 0.34} x2={half * 0.34} y2={half * 0.34} />
                    <line x1={half * 0.34} y1={-half * 0.34} x2={-half * 0.34} y2={half * 0.34} />
                  </g>
                ) : d.kind === "restart" ? (
                  // Rewind, two triangles, matching the pause menu's green
                  // button so the action is recognisable from the old menu.
                  <g fill="#ffffff">
                    <path d={`M${half * 0.04},${-half * 0.42} L${-half * 0.44},0 L${half * 0.04},${half * 0.42} Z`} />
                    <path d={`M${half * 0.52},${-half * 0.42} L${half * 0.04},0 L${half * 0.52},${half * 0.42} Z`} />
                  </g>
                ) : d.kind === "close" ? (
                  learning ? (
                    // A play triangle facing left: in learn this square goes
                    // back rather than closing anything, so an X would be a lie.
                    <path
                      d={`M${half * 0.30},${-half * 0.40} L${-half * 0.34},0 L${half * 0.30},${half * 0.40} Z`}
                      fill="#ffffff"
                      stroke="#ffffff"
                      strokeWidth={iconStroke * 0.8}
                      strokeLinejoin="round"
                    />
                  ) : started ? (
                    /* A HAMBURGER DURING A ROUND, 9 Sept 2026 (owner). Mid-round
                       this square is not a close button: each tap drops a red
                       leave and a green restart into the pit, and its own
                       aria-label already says "Pit menu". The X was describing
                       something it stopped doing.
                       PLAY ONLY, deliberately. On the start screen the same
                       square really does close the pit, so it keeps the red X;
                       a hamburger there would promise a menu that does not
                       exist. To make it a hamburger everywhere, drop the
                       `started ?` split and delete the X branch below.
                       Three bars on the same 0.34 half-width as the X's arms, so
                       it reads at the same weight and optical size. */
                    <g stroke="var(--navy, #0a3a57)" strokeWidth={iconStroke} strokeLinecap="round">
                      <line x1={-half * 0.34} y1={-half * 0.30} x2={half * 0.34} y2={-half * 0.30} />
                      <line x1={-half * 0.34} y1={0} x2={half * 0.34} y2={0} />
                      <line x1={-half * 0.34} y1={half * 0.30} x2={half * 0.34} y2={half * 0.30} />
                    </g>
                  ) : (
                    <g stroke="#ffffff" strokeWidth={iconStroke} strokeLinecap="round">
                      <line x1={-half * 0.34} y1={-half * 0.34} x2={half * 0.34} y2={half * 0.34} />
                      <line x1={half * 0.34} y1={-half * 0.34} x2={-half * 0.34} y2={half * 0.34} />
                    </g>
                  )
                ) : d.kind === "learn" ? (
                  // The dock's brain, filled navy like every other pit icon.
                  // Its artboard is 217.1 x 215.6, so it is scaled to the
                  // square and centred on its own middle, not on 0,0.
                  <g fill="var(--navy, #0a3a57)"
                    transform={`scale(${(uSz * 0.62) / 217.1}) translate(-108.55,-107.8)`}>
                    <path d={BRAIN_PATH}/>
                  </g>
                ) : (
                  /* THE INFO SQUARE. Was an org-chart glyph, three boxes joined
                     by a stem, which read as "family tree" while the square's own
                     aria-label has always said "Breed information" and its action
                     opens the info box. 2 September 2026 (owner): a plain letter
                     i in a ring, which says what the button does.

                     DRAWN, NOT SET AS TEXT. A <text> i would depend on whichever
                     font had loaded and would sit on a baseline that shifts with
                     it; two rounded strokes and a ring cannot drift. The dot is a
                     zero-length line with a round cap, which is how the rest of
                     the pit's icons draw a dot.

                     Same scale(uSz / 44) and translate(-12,-12) as the glyph it
                     replaces, so it is a 24 unit artboard centred in the square
                     exactly as before. */
                  <g stroke="var(--navy, #0a3a57)" fill="none" strokeLinecap="round" strokeLinejoin="round"
                    transform={`scale(${uSz / 44}) translate(-12,-12)`}>
                    <circle cx="12" cy="12" r="9.2" strokeWidth={1.8} />
                    <line x1="12" y1="7.4" x2="12" y2="7.4" strokeWidth={2.6} />
                    <line x1="12" y1="11" x2="12" y2="16.8" strokeWidth={2.6} />
                  </g>
                )}
                {/* Start-screen only: the two-line caption under the red close
                    square. Forced to two lines by request. Gone the instant PLAY
                    sets `started`, so it never rides a moving square. */}
                {d.kind === "close" && !learning && !started ? (
                  <text
                    className={styles.autoLabel}
                    x={0}
                    // 18 Aug 2026: nudged down another 10px (18 to 28), stacking
                    // on the earlier 10px move in e984ef95.
                    // 31 Aug 2026, MOBILE ONLY: 28 back down to 14. Desktop keeps
                    // 28 and is not touched by any of the three mobile values here.
                    y={half + (isMobile ? 14 : 28) * upp}
                    textAnchor="middle"
                    dominantBaseline="text-before-edge"
                    // MOBILE ONLY: 24 to 16 (a third smaller, by request), which
                    // also stops "main page" clipping the right edge: the square's
                    // centre is only about 50px from it, and the line was ~125px
                    // wide. Stroke 2 to 3 and forced to true black; .autoLabel's
                    // navy stays on desktop. paint-order is stroke, so the fill
                    // covers half the width and 3 reads as a 1.5px outline.
                    /* 25% off with the square, 2 September 2026: 16 -> 12 and
                       24 -> 18, stroke 3 -> 2.25 and 2 -> 1.5. THIS IS THE SAME
                       MISS AS THE PLAY AND LEARN WORDS. Those were flat numbers
                       too, stayed at full size when their squares shrank, and had
                       to be corrected in a second pass. A caption is read against
                       the thing it labels, so it moves with it.
                       For the record, the UI_DRAWN comment says this caption
                       "appears nowhere in this repo". It is right here. */
                    style={{
                      fontSize: `${(isMobile ? 12 : 18) * upp}px`,
                      strokeWidth: `${(isMobile ? 2.25 : 1.5) * upp}px`,
                      stroke: isMobile ? "#000000" : undefined,
                    }}
                  >
                    {/* "back to main page" -> "back", 2 September 2026 (owner).
                        One tspan, not two: the second carried a dy of 1.05em and
                        with nothing under it that line would have reserved space
                        for a row that is no longer there. */}
                    <tspan x={0}>back</tspan>
                  </text>
                ) : null}
              </g>
            ))}<g ref={pairsGRef}>{pitPairs.flatMap((id) => [pairSquare(id, "leave"), pairSquare(id, "restart")])}</g></>);
          })()}

          {/* START: the pit hangs still until this is pressed. Screen-space
              sized like the other in-pit UI objects, centred over the stage,
              and hidden while the visitor is zoomed into a circle. */}
          {dockAside && gravity && entered && !started && !learning && focus.depth === 0 && (() => {
            const st = stageRef.current;
            const upp = st ? (aspect >= 1 ? SIZE : SIZE / Math.max(aspect, 0.01)) / Math.max(st.clientHeight, 1) : 1;
            // Both controls are squares now, so nothing here measures a word.
            const vbWc = aspect >= 1 ? SIZE * aspect : SIZE;
            const vbHc = aspect >= 1 ? SIZE : SIZE / aspect;
            const xMinC = aspect >= 1 ? -vbWc * shift : -vbWc / 2;
            const m = 18 * upp; // side margin
            // LEARN sits right and high, START sits left and low. Both were
            // pulled toward the middle, which left roughly a third of the stage
            // empty beneath START. They now sit lower and use the room: START
            // near the foot of the pit, LEARN a little above centre.
            // BOTH ARE SQUARES NOW, side by side at the foot.
            // LEARN was a word anchored to the right edge, high up, and it
            // carried an invisible tap rect of fs * 5.2 by fs * 1.6: on a 460px
            // phone that is 287 x 88, sixty per cent of the screen width, lying
            // across the diagram. Taps meant for the dogs underneath it were
            // being taken by the word.
            /* 25% OFF, 2 September 2026 (owner). The gap is left at 16 on
               purpose: it is a fixed separation between two controls, not a
               part of either one, and scaling it too would pull the pair in
               tighter than a straight shrink.

               CORRECTION, same day. This comment used to claim the CAPTION came
               down with the square. IT DOES NOT. The hit rect, the drawn square
               and the glyph all read SQ, but the "play" and "learn" words below
               are a flat `24 * upp` and were left at full size, so the words
               ended up 66px tall against a 90px square. Measured off a
               screenshot. The words carry their own 0.75 now, further down. */
            const SQ = 84 * pitScale * 1.2 * upp * 0.75;
            const SQ_GAP = 16 * upp;
            /* DOWN 10px, 2 September 2026 (owner), to use the room the 25%
               shrink left underneath.
               MEASURED, not picked: the squares came down 16.9 CSS px and shrank
               around their centre, so the bottom edge rose 8.4. Ten puts it back
               where it was with a little over. The floor strip starts about 20px
               below the old bottom edge, so 16 is the ceiling here before the
               squares touch it.
               The captions ride on w.y, so "play" and "learn" come down with the
               squares and the gap between the two is untouched.
               The LEVEL NUMBER does not move: it carries its own +20 and sits on
               a line you have already signed off. The two are now 10 apart rather
               than 20. */
            const ROW_DROP = 10 * upp;
            /* NO PLAY ON A FINISHED LEVEL, 16 September 2026 (owner). Filtered out
               of the words array rather than hidden in the render, so LEARN keeps
               its own x: that is xMinC + m + SQ + SQ_GAP, an absolute position
               rather than one measured from PLAY, so it does not slide left into
               the gap. The level stays readable and re-learnable; only the round
               is gone. */
            type Word = { key: "learn" | "start"; label: string; x: number; y: number; anchor: "start" | "end" };
            const words: Word[] = ([
              { key: "start", label: "PLAY", x: xMinC + m, y: vbHc * WORD_START_Y + ROW_DROP, anchor: "start" },
              { key: "learn", label: "LEARN", x: xMinC + m + SQ + SQ_GAP, y: vbHc * WORD_START_Y + ROW_DROP, anchor: "start" },
            ] as Word[]).filter((w) => !(levelCompleted && w.key === "start"));
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
                  setHoverHint(w.key === "learn" ? "learn about these dogs" : "start playing");
                  if (w.key === "learn") setLearnPeek(true);
                  else setStartPeek(true);
                }}
                onMouseLeave={() => {
                  wordHoverRef.current = false;
                  setWordHover((h) => (h === w.key ? null : h));
                  setHoverHint("");
                  if (w.key === "learn") setLearnPeek(false);
                  else setStartPeek(false);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setHoverHint("");
                  if (w.key === "start") {
                    setLearnPeek(false);
                    setStartPeek(false);
                    setStarted(true);
                    runFallRef.current?.();
                    return;
                  }
                  // LEARN never arms the pit. The wash slides in and the pit is
                  // all there is to look at.
                  setLearnPeek(false);
                  setLearning(true);
                  // The blue box no longer opens itself here. Learn now starts
                  // clean and the box lives behind the info square, which is
                  // rendered exactly when learning && hideCaption.
                }}
              >
                {/* invisible hit area, so the tap target is not just the glyphs */}
                <rect x={w.x} y={w.y - SQ / 2} width={SQ} height={SQ} fill="transparent" />
                {(() => {
                  // ONE SQUARE EACH, matched: the same box as the close X, the
                  // info square and the learn PLAY. uSz = 84 * pitScale * 1.2,
                  // rx 0.3 of it, a 5px rim. Those figures are CSS pixels there
                  // and this is drawn in svg units, so each is multiplied by upp.
                  const S = SQ;
                  const rim = 5 * upp;
                  const cx = w.x + S / 2, cy = w.y;
                  const hv = wordHover === w.key ? 1.06 : 1;
                  const isPlay = w.key === "start";
                  const gh = S * 0.34, gw = S * 0.30;
                  return (
                    <g transform={`translate(${cx},${cy}) scale(${hv}) translate(${-cx},${-cy})`}>
                      {/* Green for go with a white rim, yellow for learn with a
                          navy one. The learn square now matches the pit's own
                          corner set, which is yellow on navy, so the brain reads
                          the same here as it does inside the pit. PLAY keeps
                          white: on green a navy rim goes muddy. */}
                      <rect x={w.x} y={cy - S / 2} width={S} height={S} rx={S * 0.3}
                        fill={isPlay ? "#22c55e" : "var(--yellow, #ffd23e)"}
                        stroke={isPlay ? "#ffffff" : "var(--navy, #0a3a57)"} strokeWidth={rim} />
                      {isPlay ? (
                        <path
                          d={`M${cx - gw * 0.3},${cy - gh / 2} L${cx + gw * 0.7},${cy} L${cx - gw * 0.3},${cy + gh / 2} Z`}
                          fill="#ffffff" stroke="#ffffff"
                          strokeWidth={S * 0.07} strokeLinejoin="round"
                        />
                      ) : (
                        // The pit's own brain, imported rather than redrawn, so
                        // the two cannot drift apart. Its artboard is 217.1 wide,
                        // so it scales by S * 0.52 / 217.1 and translates by its
                        // own centre to sit in the middle of the square.
                        <g transform={`translate(${cx},${cy}) scale(${(S * 0.52) / BRAIN_ARTBOARD.w}) translate(${-BRAIN_ARTBOARD.cx},${-BRAIN_ARTBOARD.cy})`}>
                          <path d={BRAIN_PATH} fill="var(--navy, #0a3a57)" />
                        </g>
                      )}
                    </g>
                  );
                })()}
                {/* Start-screen caption BELOW the square, 2 September 2026
                    (owner). It was above.
                    TWO THINGS CHANGED TOGETHER and both are needed: the offset
                    flips from minus to plus, and the baseline rule flips from
                    text-after-edge to text-before-edge. The baseline decides
                    which edge of the type box lands on y, so moving the offset
                    alone would have left the words overlapping the square.
                    It renders only in this block (gated !started), so it is gone
                    the instant PLAY arms the pit; nothing tracks a moving body. */}
                <text
                  className={styles.autoLabel}
                  x={w.x + SQ / 2}
                  y={w.y + SQ / 2 + 8 * upp}
                  textAnchor="middle"
                  dominantBaseline="text-before-edge"
                  // 31 Aug 2026, MOBILE ONLY: stroke 2 to 4 and forced to true
                  // black. .autoLabel sets paint-order: stroke, so the fill
                  // paints over half the width and 4 reads as a 2px outline.
                  // Desktop keeps the 2px navy it has now.
                  //
                  /* ONE SIZE FOR ALL THREE CAPTIONS, 2 September 2026 (owner).
                     "play" and "learn" were 18 flat while "back" was 12 on a
                     phone and 18 on desktop, so they never matched. All three now
                     read 12 / 18, and the stroke reads 2.25 / 1.5 with them.
                     THE FIGURES ARE DUPLICATED at the back caption above. If one
                     moves, both move, or the mismatch is straight back. */
                  style={{
                    fontSize: `${(isMobile ? 12 : 18) * upp}px`,
                    strokeWidth: `${(isMobile ? 2.25 : 1.5) * upp}px`,
                    stroke: isMobile ? "#000000" : undefined,
                  }}
                >
                  {w.key === "start" ? "play" : "learn"}
                </text>
              </g>
            ));
          })()}
          {/* THE LEVEL NUMBER. Bottom right, on the same line as PLAY and at the
              same size as LEARN, so the three read as one row. Black with a white
              outline: the inverse of LEARN, which is white with a black one.
              Zero-padded to two digits and no word, by request. */}
          {dockAside && gravity && entered && !started && !learning && focus.depth === 0 && levelNo !== undefined && (() => {
            const st = stageRef.current;
            const stW = st ? st.clientWidth : 390;
            const upp = (aspect >= 1 ? SIZE : SIZE / Math.max(aspect, 0.01)) / Math.max(st ? st.clientHeight : 844, 1);
            // Owner review: the LEARN word is half the size of START.
            // 10% OFF, 2 September 2026 (owner): the trailing 0.5 becomes 0.45.
            // NOTE the comment above is now out of date by request: the number no
            // longer matches LEARN, which came down 25% in the same pass.
            const fsL = Math.min(Math.min(Math.max(54.4, stW * 0.12), 128) * START_SCALE, (stW * 0.92) / 3.17) * 0.45;
            const vbWc = aspect >= 1 ? SIZE * aspect : SIZE;
            const vbHc = aspect >= 1 ? SIZE : SIZE / aspect;
            const xMinC = -vbWc / 2;
            // the old 18px side margin went with the move to the top line
            return (
              <text
                /* MOVED TO THE TOP LINE, 9 Sept 2026 (owner's mockup). It used
                   to sit bottom right at the end of the PLAY/LEARN row, which is
                   exactly where the new D-pad now goes; the two cannot share
                   that corner.
                   It now sits on the same line as the red corner square, just to
                   its left. The square is 67.5px with a 16px margin, so its left
                   edge is 83.5px in from the right; 14px of air, the same gap the
                   corner squares stack with, puts this text's right edge at 97.5.
                   Vertically it centres on the square: 16px margin plus half of
                   67.5 is 49.75px down from the top.
                   Both figures are in px times upp, never bare, because this is
                   drawn in svg units and upp is the conversion. */
                x={xMinC + vbWc - 97.5 * upp}
                /* CLEAR OF THE TOP EDGE, 16 September 2026 (owner: the level number
                   runs off screen on the desktop).

                   THE ORIGIN WAS NEVER WRONG. -vbHc / 2 is the viewBox's own top and
                   matches the real vbH exactly. The clearance was: 49.75 * upp put the
                   BASELINE 28.7px below the top edge on the owner's desktop, and with
                   dominantBaseline central a 123px glyph reaches about 61px above its
                   baseline. So the digits were cut off by the edge, which reads as the
                   number running off screen.

                   Half the font plus the stroke that outlines it is the real minimum,
                   and the old 49.75 * upp still wins wherever it is the larger, so
                   every narrower viewport is unchanged. */
                y={-vbHc / 2 + Math.max(49.75 * upp, (fsL * upp) / 2 + 9 * upp + 6 * upp)}
                textAnchor="end"
                dominantBaseline="central"
                style={{
                  fill: "#000000",
                  stroke: "#ffffff",
                  strokeWidth: `${9 * upp}px`, // 4, then 7, now 9: two rounds of +3 and +2
                  paintOrder: "stroke",
                  strokeLinejoin: "round",
                  fontFamily: "var(--font-display), system-ui, sans-serif",
                  fontSize: `${fsL * upp}px`,
                  letterSpacing: `${2 * upp}px`,
                  pointerEvents: "none",
                  userSelect: "none",
                }}
                aria-label={`Level ${levelNo}`}
              >
                {String(levelNo).padStart(2, "0")}
              </text>
            );
          })()}
          {/* Item 5: the hover instruction, next to the play button. Shows on the
              start screen and in the learn area, at the root view; blank when
              nothing is hovered (and on touch, where there is no hover). White
              Luckiest Guy via .autoLabel, sized up. Anchored right of the play
              row (one square in learn, two on the start screen). */}
          {dockAside && gravity && entered && focus.depth === 0 && ((!started && !learning) || learning) && (() => {
            // REVERSED 31 Aug 2026: the static phone line is gone. Anchored left
            // of two squares it needed about 270px from x=185 on a 390px stage, so
            // it ran off the right edge, and it drew on the same y as the level
            // number so the two sat on top of each other. It also repeated the
            // "play" caption above the green square. Mobile draws nothing here now.
            // Desktop keeps the live hover hint, untouched. Do not restore the
            // isMobile fallback without solving the width and the level number.
            if (isMobile) return null;
            const text = hoverHint;
            if (!text) return null;
            const st = stageRef.current;
            const upp = st ? (aspect >= 1 ? SIZE : SIZE / Math.max(aspect, 0.01)) / Math.max(st.clientHeight, 1) : 1;
            const vbWc = aspect >= 1 ? SIZE * aspect : SIZE;
            const vbHc = aspect >= 1 ? SIZE : SIZE / aspect;
            const xMinC = aspect >= 1 ? -vbWc * shift : -vbWc / 2;
            const m = 18 * upp;
            /* This is a SECOND copy of the start screen's square size, used only
               to park the hint to the right of the row. It carries the same 0.75
               the block above does, or the hint would float in the gap the
               smaller buttons left behind. The learn area's PLAY is a DOM button
               (.learnPlay) at its own size and is not affected by the 0.75, so
               the learn branch below still lines up. */
            const SQ = 84 * pitScale * 1.2 * upp * 0.75;
            const SQ_GAP = 16 * upp;
            const x = xMinC + m + (learning ? 1 : 2) * (SQ + SQ_GAP);
            // Beside the play button: the start PLAY sits at WORD_START_Y, but the
            // learn PLAY is the DOM .learnPlay pinned bottom 3%, near the foot, so
            // in learn we drop to that line (button centre = half viewport, up 3%,
            // up half a square) instead of floating above it.
            const y = learning ? vbHc / 2 - 0.03 * vbHc - SQ / 2 : vbHc * WORD_START_Y;
            // Match the profile name (.title) EXACTLY: its own CSS size formula in
            // px, then scaled to view units by upp. Above 640px it is
            // min(clamp(0.832rem, 2vw, 1.808rem), --tp / 2.15) with
            // --tp = clamp(44.8px, 8.8vw, 62.4px); at or below 640px the phone
            // clamp. rem = 16. If .title's rule changes, change this to match.
            const winW = typeof window !== "undefined" ? window.innerWidth : 390;
            const vw = winW / 100;
            // 2 September 2026: --tp came down 10% and .title 25%, so this
            // mirror carries the same new figures. The phone branch is dead
            // (this hint returns null on mobile) but is kept in step anyway, so
            // the next person to read it is not misled.
            const tp = Math.min(Math.max(40.32, 7.92 * vw), 56.16);
            const titleFs = winW <= 640
              ? Math.min(Math.max(0.675 * 16, 3.75 * vw), 1.2 * 16)
              : Math.min(Math.min(Math.max(0.624 * 16, 1.5 * vw), 1.356 * 16), tp / 2.15);
            // Two lines when the hint carries a breed name: "tap to learn more
            // about" on line one, the name on line two. The static "start
            // playing" has no name, so it stays a single line.
            const NAME_PREFIX = "tap to learn more about";
            const hasName = text.startsWith(NAME_PREFIX) && text.length > NAME_PREFIX.length;
            const line1 = hasName ? NAME_PREFIX : text;
            const line2 = hasName ? text.slice(NAME_PREFIX.length).trim() : null;
            return (
              <text
                className={styles.autoLabel}
                x={x}
                y={y}
                textAnchor="start"
                dominantBaseline="central"
                // Black, no outline (this line only; the start-screen captions keep
                // .autoLabel's white + navy stroke). Inline fill/stroke win over the class.
                // CONTRAST (on record, no fallback by request 14 Aug 2026): ~13:1 over the
                // blue body gradient where this line sits, but a DARK themed level
                // background could drop it below AA. If dark themes spread, revisit.
                // REVERSED 18 Aug 2026: the no-outline decision is undone. Black on the
                // dark wood band was hard to read, and this line is the static "start
                // playing" on touch, so it affected phone users by default. Black fill
                // kept, but a white stroke added so it reads over both the blue sky and
                // the dark wood band. strokeWidth matches the start-screen captions'
                // 24-font-to-2-stroke ratio; .autoLabel already sets paint-order stroke
                // and stroke-linejoin round.
                // REVERSED AGAIN 18 Aug 2026: the outline is flipped to white fill with
                // a black stroke, and the size is doubled again (1.12 to 2.24) for
                // legibility. strokeWidth still carries the same 12:1 ratio.
                // LINE SPACING: Luckiest Guy's visible cap height is about 0.6 of the
                // em, so a dy of 1.05em reads as roughly 1.4 line spacing against the
                // ink; 0.67em is the value that reads as about 0.9.
                style={{ fontSize: `${titleFs * 2.24 * upp}px`, fill: "#ffffff", stroke: "#000000", strokeWidth: (titleFs * 2.24 * upp) / 12 }}
              >
                <tspan x={x}>{line1}</tspan>
                {line2 !== null ? <tspan x={x} dy="0.67em">{line2}</tspan> : null}
              </text>
            );
          })()}
          {/* The swipe chain path. Last in
              the pit SVG so it draws over every card, a direct child of the SVG
              like the chum cards so both share one coordinate space, and never
              takes a pointer, or the hit test that finds the card under the
              finger would find the line instead. Empty until a chain draws. The
              blur region is in user space: an object bounding box region is
              zero tall on a level line, which would switch the glow off. */}
          <g ref={chainGRef} style={{ pointerEvents: "none" }}>
            <defs>
              <filter id="bt-chain-glow" filterUnits="userSpaceOnUse" x={-5000} y={-5000} width={10000} height={10000}>
                <feGaussianBlur data-chain="blur" stdDeviation={4} />
              </filter>
            </defs>
            {/* One line per link rather than a single polyline, so each link can
                carry its own state: white, grey while strained, red and cut
                open where it broke. The glow group blurs a copy of the same
                lines. */}
            <g data-chain="glow" filter="url(#bt-chain-glow)" />
            <g data-chain="core" />
            <g data-chain="dots" />
          </g>
        </svg>
        {/* J17: the canvas effects layer, above the SVG, never takes a pointer.
            displayOnly (chums2 static diagram) omits it: it is a raster bitmap sized
            to the stage rect, so any effect it paints for a zoomed circle is hard-cut
            at the stage's bottom edge (a flat line overflow:visible cannot lift, since
            it is a bitmap, not svg content). The static diagram needs no fx, so drop
            it here; game paths (displayOnly false) keep it unchanged. */}
        {!displayOnly && <canvas ref={fxCanvasRef} className={styles.fxCanvas} aria-hidden="true" />}
      </div>

      {/* Difficulty: start-screen only, down the left, 10 hardest at the top.
          The root-view gate is `focus.depth === 0`, not `focus === nodes[0]`:
          a re-pack hands back a new node array, so identity is briefly stale
          and the control would unmount mid-drag and drop the pointer capture.
          Hand-rolled rather than an <input type="range"> so the vertical
          orientation does not depend on writing-mode support, which only landed
          in Safari 17.4, and so the thumb can carry the pit's own yellow square
          look. Mobile only: the fill has no effect on the desktop layout. */}
      {showDiff && (
        <div
          className={styles.diff}
          style={(() => {
            // Re-anchored (14 Aug 2026): the track hangs a gap below the top-left
            // PROFILE image and its foot stops a gap above the PLAY button; the
            // height is whatever is left between them. The profile position is the
            // live one LineageModal publishes (portraitAnchor, screen px), turned
            // into stage px with the stage's own rect. On a short screen the TOP gap
            // gives first, so the slider keeps a usable MIN_H and its 50px clearance.
            const st = stageRef.current;
            const vbHc = aspect >= 1 ? SIZE : SIZE / aspect;
            const stH = st ? st.clientHeight : 844;
            const uppS = (aspect >= 1 ? SIZE : SIZE / Math.max(aspect, 0.01)) / Math.max(stH, 1);
            /* PLAY'S REAL SIZE AND PLACE, corrected 2 September 2026.
               This read 84 * pitScale * 1.2 and had been STALE since the start
               screen's squares came down 25% earlier the same day, so the slider
               was measuring its clearance against a button that no longer exists
               at that size. The 0.75 and the ROW_DROP below are the same two
               figures the start block uses; all three have to move together. */
            const btnHalf = (84 * pitScale * 1.2 * uppS * 0.75) / 2;
            const ROW_DROP_S = 10 * uppS; // the start row's own 10px drop
            const startTopFrac = 0.5 + WORD_START_Y + (ROW_DROP_S - btnHalf) / vbHc; // PLAY button top, fraction of the stage
            const playTop = startTopFrac * stH;                       // ...in stage px
            // ---- SLIDER LENGTH DIALS ----
            const TOP_GAP = Math.min(200, Math.max(90, 0.22 * (typeof window !== "undefined" ? window.innerHeight : 844))); // clamp(90px, 22vh, 200px): profile-bottom -> slider-top
            /* 50 -> 14, 2 September 2026 (owner): the slider sits much closer to
               PLAY. 14 is the gap the pit's own squares stack with, so the track
               now rests the same distance off the button as the buttons rest off
               each other. Then 14 -> 4 the same evening, another 10px down.
               50 was set when the start-screen CAPTION sat ABOVE the square and
               the gap had to clear a word as well as the button. The captions
               moved below the squares earlier today, so that clearance is now
               protecting nothing. */
            const BOTTOM_GAP = 4;    // slider-bottom -> PLAY-top
            const MIN_H = 60;        // usable slider length; the TOP gap gives on a short screen to hold this. HALVED with the track below
            const rect = st ? st.getBoundingClientRect() : null;
            // Profile-image bottom in stage px; falls back to the old top area until
            // the measure lands.
            const portraitBottom = (portraitAnchor && rect) ? (portraitAnchor.cy + portraitAnchor.rad - rect.top) : 0.045 * stH;
            let top = portraitBottom + TOP_GAP;
            const bottom = playTop - BOTTOM_GAP;
            /* HALF LENGTH, 2 September 2026 (owner).
               IT SHORTENS FROM THE TOP, not the bottom: `bottom` is PLAY's top
               less the 50px clearance, and that clearance is the thing the whole
               block exists to protect. Taking the length off the top keeps the
               foot exactly where it was and simply starts the track lower. */
            let height = (bottom - top) * 0.5;
            top = bottom - height;
            if (height < MIN_H) { height = MIN_H; top = bottom - MIN_H; } // short screen: hold the foot + min height, compress the top gap
            return { top: `${Math.max(0, top)}px`, height: `${Math.max(0, height)}px` };
          })()}
        >
          <div
            ref={diffRef}
            className={styles.diffTrack}
            role="slider"
            tabIndex={0}
            aria-label="Difficulty"
            onMouseEnter={() => setHoverHint("drag to change difficulty")}
            onMouseLeave={() => setHoverHint("")}
            aria-valuemin={0}
            aria-valuemax={10}
            aria-valuenow={level}
            onPointerDown={(e) => {
              e.stopPropagation();
              (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
              diffDragRef.current = true;
              setDiffDragging(true);
              // Clear any preview the pointer raised on its way to the slider.
              setStartPeek(false);
              // Two things have to let go before a re-pack, now the slider can
              // be reached from LEARN.
              //
              // hovered holds a NODE, and a re-pack hands back a whole new
              // array, so the old one would linger as a dog no longer in the
              // tree, driving the box header and the label rules from a ghost.
              //
              // Done here rather than in applyLevel: that is a plain function in
              // the component body, so the compiler reads calls like these as
              // render work. A pointer handler is unambiguously not.
              setHovered(null);
              setLearnPeek(false);
              setLevelFromY(e.clientY);
            }}
            onPointerMove={(e) => {
              if (!diffDragRef.current) return;
              setLevelFromY(e.clientY);
            }}
            onPointerUp={(e) => {
              diffDragRef.current = false;
              setDiffDragging(false);
              try { (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId); } catch { /* already gone */ }
            }}
            onPointerCancel={() => { diffDragRef.current = false; setDiffDragging(false); }}
            onKeyDown={(e) => {
              const step = e.key === "ArrowUp" || e.key === "ArrowRight" ? 1 : e.key === "ArrowDown" || e.key === "ArrowLeft" ? -1 : 0;
              if (!step) return;
              e.preventDefault();
              applyLevel(levelRef.current + step);
            }}
          >
            {/* Everything below the thumb reads as filled, in navy against the
                track's lighter blue, so the level is legible at a glance. */}
            <div className={styles.diffFill} style={{ height: `${level * 10}%` }} />
            <div
              className={`${styles.diffThumb}${diffDragging ? " " + styles.diffThumbBig : ""}`}
              style={{ bottom: `${level * 10}%` }}
            />
          </div>
        </div>
      )}

      {/* THE START SCREEN D-PAD (9 Sept 2026). The same four moves as the swipe,
          for anyone who would rather press than flick, and the only way to reach
          them with a keyboard or a screen reader.
          DOM buttons, not drawn in the svg. Every other in-pit square is a
          physics body that can be knocked loose, which is a lot of machinery for
          a control that only ever needs a tap. It follows the zoom-out button
          instead, which is already DOM and already matched to PLAY.
          Rendered HERE, at root level beside the slider, and NOT inside the info
          box: the chum rail and the zoom-out live in there and were being
          clipped to it, which is a trap worth not walking into twice.
          ARROWS POINT THE WAY THEY GO. Right is next, down is the next era. That
          is deliberately the opposite of the swipe, which follows the content.
          Pressing an arrow and dragging a page are different mental models and
          both are right in their own terms.
          NO VISIBLE LABELS, 9 Sept 2026 (owner), trying it on the arrows alone.
          LAST ERA, PREVIOUS, NEXT and NEXT ERA used to sit above and below. The
          .navLabel rules are still in the stylesheet, unused, so restoring them
          is four spans and no styling work.
          The aria-labels below are NOT decoration now: with the text gone they
          are the only thing naming these controls to a screen reader, so do not
          simplify them away. */}
      {navOn && (onNavPrev || onNavNext || onNavPrevEra || onNavNextEra) && (
        <div className={styles.navPad} role="group" aria-label="Move between levels">
          <button
            type="button"
            className={`${styles.navBtn} ${styles.navUp}`}
            onClick={() => onNavPrevEra?.()}
            disabled={!onNavPrevEra}
            aria-label="First dog of the last era"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5 L21 17 L3 17 Z" fill="currentColor" /></svg>
          </button>
          <button
            type="button"
            className={`${styles.navBtn} ${styles.navLeft}`}
            onClick={() => onNavPrev?.()}
            disabled={!onNavPrev}
            aria-label="Previous dog"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 3 L17 21 L5 12 Z" fill="currentColor" /></svg>
          </button>
          <button
            type="button"
            className={`${styles.navBtn} ${styles.navRight}`}
            onClick={() => onNavNext?.()}
            disabled={!onNavNext}
            aria-label="Next dog"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3 L7 21 L19 12 Z" fill="currentColor" /></svg>
          </button>
          <button
            type="button"
            className={`${styles.navBtn} ${styles.navDown}`}
            onClick={() => onNavNextEra?.()}
            disabled={!onNavNextEra}
            aria-label="First dog of the next era"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19 L3 7 L21 7 Z" fill="currentColor" /></svg>
          </button>
        </div>
      )}

      {/* The level background. It waits off the bottom-left, tilted, and slides
          up into place on START, borrowing the wash's motion. It sits at
          z-index 0, below the stage at 1, so the circles, labels and in-pit
          buttons stay on top of it and nothing is tinted or blended. */}
      {dockAside && gravity && levelTheme && (
        <div
          aria-hidden="true"
          ref={levelLayerRef}
          className={`${styles.level}${learning && !started ? " " + styles.levelSlow : ""}`}
          style={{ clipPath: seamClip(started || (learning && playPeek) ? -SEAM_OFF() : startPeek ? 0 : SEAM_OFF()) }}
        >
          <div
            className={styles.levelSky}
            style={{ background: `linear-gradient(${levelTheme.sky[0]}, ${levelTheme.sky[1]})` }}
          />
          <img className={styles.levelBg} src={levelTheme.bg} alt="" draggable={false} />
          {/* The pit-full wash. Placed HERE on purpose: these three are all
              position absolute with no z-index, so DOM order is the stack. Sky,
              then the level picture, then this, then the floor. It therefore
              covers the sky and the picture and never the floor, and the whole
              .level layer sits below the stage, so the words, chips and cards
              stay clear of it too. Different from the main pit, which snaps its
              pattern on at 90% full with no fade. */}
          <div className={styles.levelPaws} style={{ opacity: fullAlpha }} />
          <img
            ref={levelFloorRef}
            className={styles.levelFloor}
            src={levelTheme.floor}
            alt=""
            draggable={false}
            /* REMOVE BEFORE LAUNCH, ?floorbox=1: a magenta outline on the IMG BOX.
               THIS IS THE WHOLE TEST, and it beats the numbers.
                 outline full width, wood inset -> the SVG is not painting to its
                   own viewBox edges in Safari, and the fix is in the asset
                 outline inset too -> it is layout, and the numbers above say
                   which box is short */
            style={{
              bottom: `${floorArtBottomPx()}px`,
              ...(floorDiag ? { outline: "2px solid #ff00ff", outlineOffset: "-2px" } : null),
            }}
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

      {/* THE MAGENTA LEARN WASH IS GONE, 9 Sept 2026 (owner). It was a slab of
          the era's wash colour, blended over the pit with mix-blend-mode:
          overlay, that slid in behind the learn area.
          Removed by decision, not because it was broken: it spent a day looking
          like a flat pink rectangle, which turned out to be a stacking context
          created by a fill-forwards animation elsewhere. That was fixed first,
          and the wash was then removed on its own merits.
          `levelTheme.wash` is left in the data untouched, so restoring this is
          re-adding the element and its three CSS rules, with nothing to re-derive.
          WHAT MUST NOT GO WITH IT: WASH_PEEK_X and WASH_INSET stay. They read
          like wash constants and are not; seamClip uses them to place the LEVEL
          background's diagonal, which is still very much on screen. */}
      {/* The white-to-yellow word sweep has gone with the word. The level
          background behind it still slides in on hover, driven by the same
          playPeek and the same seamClip a few blocks above. */}
      {/* Big PLAY in the bottom-left of the learn area: jump straight from
          reading into the round. */}
      {dockAside && gravity && learning && (
        <button
          type="button"
          className={`${styles.learnPlay} ${styles.learnDockBtn} ${styles.learnPlayBtn}`}
          onMouseEnter={() => { setPlayPeek(true); setHoverHint("start playing"); }}
          onMouseLeave={() => { setPlayPeek(false); setHoverHint(""); }}
          onFocus={() => setPlayPeek(true)}
          onBlur={() => setPlayPeek(false)}
          onClick={() => {
            setLearnPeek(false);
            setStartPeek(false);
            setPlayPeek(false);
            setHoverHint("");
            // Reset any learn-area zoom back to the full pit before the round
            // starts. Otherwise the drop routine sees a zoomed-in focus, bails
            // out, and the round begins stuck inside one circle.
            cancelAnimationFrame(rafRef.current);
            focusRef.current = nodes[0];
            setFocus(nodes[0]);
            const rootV = clampRootView(displayOnly ? displayRestView() : [nodes[0].x, nodes[0].y, nodes[0].r * 2 * (isMobileRef.current ? PAD : ZOOM_PAD) * (dockAside ? PIT_SPAN : 1)]);
            homeWRef.current = rootV[2];
            zoomTo(rootV);
            // Hide the open info box as the round begins.
            if (!hideCaption) onToggleCaption?.();
            // A spent run is reset by the host before anything drops, so the
            // fresh round starts with its lives and score already restored.
            onPlayPressed?.();
            setLearning(false);
            setStarted(true);
            runFallRef.current?.();
          }}
          aria-label={playLabel}
        >
          {/* ONE SIZE, SET IN ONE PLACE, 15 September 2026 (owner: the play icon
              changes size and stroke weight between screens and needs uniforming
              with the other icons on that row).

              WHAT THIS REPLACES. PLAY was the only button on the row that drew
              its own square: an inline SVG carrying VIS, RIM and the radius in
              TypeScript, duplicating figures that also live in the stylesheet.
              The comment on it warned of exactly that, saying the two numbers
              live in the stylesheet as well and must be changed together, and
              they had already drifted apart once on 2 September. They had drifted
              again, by about 18% on a phone.

              It is now a .learnDockBtn, the same element the other four use, so
              the size, the rim weight and the corner radius come from one rule at
              each breakpoint and cannot drift. .learnPlayBtn carries only what is
              genuinely different about PLAY: the green fill and the white rim.

              The triangle is a .learnDockIcon, so it takes the same 0.55 of the
              button the other icons do, and its own stroke went with the old
              artboard. It has none now, which is why the weight stops changing. */}
          {/* THE SAME TRIANGLE THE START SCREEN DRAWS, 16 September 2026 (owner:
              the white icon is smaller in the learn area and needs to match).

              WHY IT WAS SMALLER. The start screen's PLAY is an SVG ui-square, not
              this button, so the two glyphs were drawn by different code. Its
              triangle is gw = S * 0.30 wide and gh = S * 0.34 tall with a
              S * 0.07 round-join stroke, measured off the square's own size. This
              one was a 24-unit path inside an icon box set to 0.55 of the button,
              which worked out at about 0.20 of the button wide against 0.37. Near
              enough half.

              THE VIEWBOX IS 100 UNITS AND THE BOX IS THE BUTTON'S OUTER SIZE, so
              one unit is one percent of the square and the figures below are the
              start screen's own, unconverted: cx and cy 50, half-width 9 back and
              21 forward, half-height 17, stroke 7. Change them there and change
              them here. */}
          <span className={styles.learnDockIcon}>
            <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
              <path d="M41,33 L71,50 L41,67 Z" fill="#ffffff" stroke="#ffffff" strokeWidth={7} strokeLinejoin="round" />
            </svg>
          </span>
        </button>
      )}
      {britainOpen && (
        <BritainMessage
          onDismiss={() => {
            setBritainOpen(false);
            // the tick poofs the flag, exactly as it does in the main pit, and
            // a flag whose message has been read does not come back next round
            retireToyForever(TOY_FLAG_SEEN_KEY);
            if (flagIdxRef.current !== null) killToyRef.current?.(flagIdxRef.current);
          }}
        />
      )}
      {/* A dog with no ancestors of its own gets the synthetic child seen in the
          tree prop below: the same dog drawn a second time, purely so the layer
          has something to reveal. Drawing that as a node with a connector says
          the dog descends from itself. soloLeaf tells the layer to skip the node
          entirely and reveal straight out of the big circle instead. */}
      {/* THE CORNER, ported whole from the main pit: the card-pack box and the
          big white tally. Both are keyed on the count, so both replay their pop
          on every collect. The number sits above the box, the way it does in
          the main pit, so the count stays readable.

          Display only, deliberately. In the main pit the chip is a button that
          opens the My Chums dock. A tappable thing sat over the pit floor could
          take a press from an object underneath it, which is not a trade worth
          making for a number. Shown in the pit only, not in the learn area. */}
      {dockAside && dropped && cornerShot > 0 && chumsCollected > 0 && (
        // eslint-disable-next-line @next/next/no-img-element -- a fixed-size decorative SVG, next/image buys nothing here
        <img key={`chumbox-${cornerShot}`} className={styles.cardBox} src="/card-pack-box.svg" alt="" aria-hidden="true" />
      )}
      {dockAside && dropped && cornerShot > 0 && chumsCollected > 0 && (
        <div
          ref={tallyRef}
          key={`chumtally-${cornerShot}`}
          className={styles.tally}
          aria-live="polite"
          aria-label={`${chumsCollected} chums collected`}
        >
          <div className={styles.tallyChip}>
            <svg className={styles.tallyBurst} viewBox="-60 -60 120 120" aria-hidden="true">
              {Array.from({ length: 16 }).map((_, i) => {
                const a = (i / 16) * Math.PI * 2, r1 = 24, r2 = i % 2 === 0 ? 52 : 38;
                return <line key={i} x1={Math.cos(a) * r1} y1={Math.sin(a) * r1} x2={Math.cos(a) * r2} y2={Math.sin(a) * r2} stroke="#ff2d78" strokeWidth={3.5} strokeLinecap="round" />;
              })}
              {Array.from({ length: 5 }).map((_, i) => {
                const a = (i / 5) * Math.PI * 2 + 0.4, rr = 46;
                return <circle key={`s${i}`} cx={Math.cos(a) * rr} cy={Math.sin(a) * rr} r={4.5} fill="#ff5d97" />;
              })}
            </svg>
            <span className={styles.tallyNum}>{chumsCollected}</span>
            <span className={styles.tallyPlusOne} aria-hidden="true">+1</span>
          </div>
        </div>
      )}
      {/* The chum's own family tree, drawn the way the MAIN PIT draws one: no
          circular flag. That single flag is what carries the rectangular card,
          the name pill under it, the green Collect button, the flight into the
          corner and the big number, so all of that comes across for free.
          onScore, onRemove and onScatter are all optional and all left off, so
          the number flashes and the card flies but nothing is collected, nothing
          leaves the pit and the round is untouched. Reference only, as agreed. */}
      {dockAside && chumTree && (
        /* onScore WAS MISSING HERE, 16 September 2026 (owner: chums collected in
           the learn area do not affect my score).

           This layer's green "Choose as pack chum" button calls flashNum, which
           calls onScore. Every other LineageMap in this file is given one; this
           instance was not, so the call went nowhere and the collect recorded the
           chum through onRemove while awarding nothing. Twenty collected in the
           learn area came to 0 rather than 20,000.

           Nothing else was wrong: pressing PLAY out of the learn area does not
           reset the score, so nothing was being lost on the way. There was
           nothing being added. */
        <LineageMap
          breed={chumTree}
          strongBg
          currentScore={currentScore}
          onScore={onScore}
          onRemove={(n) => onChumCollected?.(n)}
          onClose={() => setChumTree(null)}
        />
      )}
      {learnNode && learnCard && (
        <LineageMap
          breed={learnCard}
          tree={
            learnNode.data.children && learnNode.data.children.length > 0
              ? learnNode.data
              : { ...learnNode.data, children: [{ ...learnNode.data, children: undefined }] }
          }
          circular
          ringColor={learnCard.ring}
          // Rarity band across the lifted circle: tier from the lifted dog's
          // in-pit appearance count. Every dog gets one (common is not silent).
          rarityTier={rarityTier(treesContaining(learnNode.data.name))}
          soloLeaf={!(learnNode.data.children && learnNode.data.children.length > 0)}
          rootRadius={learnCard.r}
          currentScore={0}
          onScore={onScore}
          onRemove={(name) => {
            // learnt: the circle leaves the pit for good
            if (learnNode && name === learnNode.data.name) {
              /* THE SHORTCUT COST, 31 August 2026 (Steve). Mirrors the main
                 pit, where LineageMap charges the same 2500 the moment AUTO is
                 committed.

                 CHARGED HERE, ON COMPLETION, NOT ON OPENING. Lifting a circle
                 into learn is free: a reader who opens one, looks, and backs
                 out has taken no shortcut and pays nothing. This line is the
                 moment the shortcut actually pays off, because the circle
                 leaves the pit for good rather than having to be knocked out.

                 It also settles a comment that had been wrong for a while.
                 LineageModal.tsx says the score can dip mid-play because the
                 learn shortcut costs points. Until now it did not. It does. */
              /* A SOLO LEAF IS NOT CHARGED (owner, 18 September 2026).

                 WHY. Measured on Old hill and bearded Collies: completing a leaf
                 dog cost the 2500 and paid NOTHING back. A leaf has no Complete
                 button to award through, its completion runs the scatter and the
                 close and never calls the award at all, and it scattered no chips
                 either, so there was no delayed income to come. A score of about
                 1285 went to -1215 on one completion. Charging a shortcut that
                 saves the player nothing is the part that was wrong.

                 THE SAME TEST THE LAYER IS GIVEN, and it has to be: soloLeaf is
                 handed to LineageMap two lines below from this very expression,
                 so the dog that is charged and the dog the layer treats as solo
                 can never be two different answers.

                 A DOG WITH A TREE STILL PAYS THE FULL 2500, untouched, and this
                 is the play area's own handler: the learn area's chum tree has
                 its own onRemove and never charged anything. */
              const soloLeafDog = !(learnNode.data.children && learnNode.data.children.length > 0);
              if (!soloLeafDog) onScore?.(LEARN_COST);
              removedNodesRef.current.add(learnNode);
              /* COMPLETING THE OPENED CIRCLE
                 CLOSES THE REST OF ITS CHAIN. This is the moment the chain was
                 remembered for: the player drew through a run of one breed, this
                 one opened, and finishing it settles all of them.

                 EVERY CIRCLE IS CHECKED FIRST. Minutes can pass in the layer, and
                 in that time one of them may have been knocked out, collected or
                 removed some other way, so each is only closed if it is still in
                 the pit and not already gone.

                 The chain is spent either way: honoured here, and dropped in
                 onClose if the player backs out without completing.

                 BEFORE the round-won test below, deliberately: closing these can
                 empty the pit, and that test is what notices. */
              const dc = dogChainRef.current;
              if (dc && dc.opened === learnNode) {
                dogChainRef.current = null;
                const pit = pitBodiesRef.current?.owned;
                /* EVERY CHIP IN THE CHAIN DROPS FROM THE CIRCLE THAT OPENED
                   (owner, 18 September 2026), so a chain reads as one payout from
                   a single place rather than as several piles scattered across the
                   pit.

                   THAT IS NOW THE LAST CIRCLE, not the first. See DOG.settle: the
                   lift comes out of the circle under the finger when the chain
                   fires, and the chips drop back to the same spot. This block did
                   not have to change for it, because it has always read
                   dc.opened rather than picking an end for itself.

                   WHICH POSITION, AND WHY. The opened circle's BRIDGE, not its
                   node and not a position captured at the press. The bridge is
                   the object the sim keeps beside each body, and the step loop
                   stops updating it once `held` is set, which liftToLearn does
                   at the instant the chain settles and the circle goes up to the
                   layer. So its coordinates are already frozen at exactly the
                   moment the player's chain opened it, and they survive the body
                   leaving the world. Reading the NODE instead would be wrong:
                   the node is moved by moveSubtree and by the re-pack, and by
                   the time a player finishes in the learn layer, which can be
                   minutes, it is nowhere useful.

                   It is the same handle and the same reason the round-won flash
                   uses `pitBodiesRef.find(learnNode)` a few lines below, and the
                   same one the chum collect flash uses for a card whose body has
                   gone.

                   NO BRIDGE, NO CHANGE: each circle falls back to dropping where
                   it stands, which is what it did before this. */
                const ob = pitBodiesRef.current?.find(dc.opened);
                const from = ob ? { x: ob.x, y: ob.y } : undefined;
                let shut = 0;
                for (const other of dc.others) {
                  if (!pit?.has(other) || removedNodesRef.current.has(other)) continue;
                  removedNodesRef.current.add(other);
                  dogCloseRef.current?.(other, from);
                  shut++;
                }
                // The removed set is a ref, so nothing above would re-render.
                if (shut) setDogChainClosed((c) => c + 1);
              }
              /* THE ROUND ENDS WHEN THERE IS NOTHING LEFT THE PLAYER CAN DO
                 (owner, 18 September 2026), not when every node that ever had a
                 body has been removed.

                 WHAT THE OLD TEST ASKED, and why it could hang. `owned` is every
                 node GIVEN A BODY this round and nothing ever deletes from it:
                 popChildren adds, the drop adds, there is no owned.delete in the
                 file. So "every owned node is in removedNodes" really asked
                 whether every node that ever existed had been collected, and one
                 node that could never be collected blocked the round for good.
                 That is what a circle below the size floor did, and what
                 ?windiag=1 was built to name.

                 THE TEST IS POSITIVE NOW: is anything still CLEARABLE. Clearable
                 is in the pit, not already removed, not held out of the world,
                 and a real circle rather than the root or an echo. Nothing else
                 reads this, so `owned` is left exactly as it is and dogInPit,
                 startable, the twin glow, the counter and heldHidden all keep the
                 answer they have today. The alternative was pruning `owned` at
                 every non-removal exit, which is the same fault rebuilt: one
                 missed call site and the round hangs again, silently.

                 NO SIZE TEST HERE, deliberately. minCircleR guarantees size at
                 every route a circle enters the pit, and a second size rule in
                 the win condition would be a second place for the floor to
                 disagree with itself.

                 THE FLOOR MUST STAY. This is a safety net over a pit whose
                 circles are already reachable, not a replacement for making them
                 reachable. Take the floor out and this quietly ends rounds with
                 circles still on screen that the player was never able to take,
                 which is a worse failure than a round that will not end, because
                 a hung round is visible and this would not be.

                 IT STAYS SELF-DIAGNOSING. The circle counter reads what the pit
                 DRAWS and this reads what is still CLEARABLE, so when the two
                 disagree the difference is exactly the stuck nodes and windiag
                 names them. Pruning `owned` would have made the two agree by
                 construction and taken the diagnostic away. */
              const owned = pitBodiesRef.current?.owned;
              const clearable = owned
                ? [...owned].filter((n) => {
                    if (removedNodesRef.current.has(n)) return false;
                    if (n.depth === 0 || isHiddenCopy(n)) return false;
                    const ob = pitBodiesRef.current?.find(n) as { held?: boolean } | undefined;
                    return !ob?.held;
                  })
                : null;
              if (clearable && clearable.length === 0) {
                const fb = pitBodiesRef.current?.find(learnNode);
                window.setTimeout(() => {
                  const total = chainRef.current ? chainRef.current(fb?.x ?? 0, fb?.y ?? 0) : 0;
                  // Freeze first. Any countdown in flight comes down, and none
                  // can start, before the screen is handed to the shell.
                  endPitRound();
                  window.setTimeout(() => onRoundWon?.(), total + 420); // flash lands after the chain
                }, 700);
              }
            }
          }}
          onScatter={(data) => {
            // the learnt % circles, their rods and the name pill tip into the
            // pit as live objects at the very instant the layer drops them
            for (const c of data.circles ?? []) {
              /* THE SIZE AND THE COLOUR IT HAD ON SCREEN.

                 c.r is the radius the node had on the learn layer a moment earlier,
                 in client px. It rides through as opts.r and spawnBadge lands the
                 chip at that node radius, converted to pit units, so a circle drops
                 at the size it just looked. REVISED 15 September 2026: this was
                 green only, and yellow circles were re-sized to the pit-dog chip
                 scale on the way down, which read as a third bigger. Both colours
                 now keep their on-layer size. */
              spawnBadgeRef.current?.(c.x, c.y, c.r, Math.round(c.share), { r: c.r, green: c.green });
            }
            /* THE SOLO DOG'S OWN CIRCLE (owner, 18 September 2026). A leaf has no
               nodes to scatter, so the layer sends its ONE full-size circle as
               `big` instead. This handler looped over circles, rods and pills and
               had no branch for it, so a leaf completion dropped nothing at all
               into the pit: measured as "layer scattered 0 circles".

               IT DROPS A PLAIN PERCENTAGE CHIP, 18 September 2026 (owner). The
               first version sent the breed name through as a label, which is
               spawnBadge's full-radius path, so a leaf put a giant named circle
               into the pit and read as a bug. No label and no opts.r now, which
               is spawnBadge's chipBadge sizing: the badge a native pit dog of
               that share would carry. That is the SAME path dogCloseRef uses for
               the rest of a chain, so the circle the player opened and the
               circles the chain closes behind it all drop the one kind of chip.

               `b.r`, the layer's full circle radius, is deliberately not passed:
               it is the size of the card's big circle, not of a chip, and it is
               what made this read wrong. Only b.x and b.y are wanted, so the chip
               lands where the dog stood.

               IT IS STILL NEVER A BOMB, now said outright through noBomb rather
               than falling out of the label, which has gone.

               ITS VALUE IS THE DOG'S OWN SHARE OF ITS PARENT, the same figure
               every other chip carries and the same formula the sim's pctOf and
               the layer's own shareOf use, so a solo dog is worth what it was
               worth in the tree it came out of. */
            if (data.big && learnNode) {
              const b = data.big;
              const share = Math.round(((learnNode.value ?? 0) / (learnNode.parent?.value || 1)) * 100);
              spawnBadgeRef.current?.(b.x, b.y, b.r, share, { noBomb: true });
            }
            for (const rd of data.rods ?? []) {
              spawnRodRef.current?.(rd.x1, rd.y1, rd.x2, rd.y2, !!rd.lit);
            }
            for (const pl of data.pills ?? []) {
              spawnPillRef.current?.(pl.x, pl.y, pl.w, pl.name);
            }
            // A collected dog does NOT come back. It used to return as a
            // full-size blank circle wearing its breed name, which meant the pit
            // stayed just as full however much you completed. Now it is simply
            // gone, so the pit empties as the big circles are worked through and
            // finishing a level actually clears the floor.
            wakeRef.current?.();
          }}
          onClose={() => {
            const pb = pitBodiesRef.current;
            const body = learnNode ? pb?.find(learnNode) : undefined;
            if (body && learnNode && !removedNodesRef.current.has(learnNode)) {
              body.held = false; // falls back in from where it was lifted
            }
            // Backed out without completing,
            // so the chain is SPENT: the others stay in the pit and nothing
            // closes. Drawing another chain is the way to try again.
            if (dogChainRef.current && dogChainRef.current.opened === learnNode) dogChainRef.current = null;
            setLearnNode(null);
            setLearnCard(null);
            wakeRef.current?.();
          }}
        />
      )}
      <div
        ref={asideRef}
        className={`${styles.aside}${dockAside ? " " + styles.asideDocked : ""}${dockAside && isMobile ? " " + styles.asideSheet : ""}`}
        // visibility, not display. The rail is a descendant positioned off this
        // element's edge, so collapsing it would leave the rail with nothing to
        // hang off. Hidden this way the box keeps its box, the rail keeps its
        // anchor, and the rail turns itself visible again below.
        //
        // POSITION, 31 Aug 2026. This inline "relative" used to be unconditional
        // and it BEAT .asideSheet's "position: fixed", because an inline style
        // wins over any class. With the box back in flow, the 640px block's
        // "order: -1" on .aside put it FIRST in the column flex, which is why the
        // mobile info box drew across the top of the pit instead of sitting in the
        // band .stageReserved had already cleared for it at the foot.
        // The rail no longer needs this element as an anchor either: it defaults
        // to .relRailHome, its own fixed screen slot (see the note at the rail
        // below). So on the mobile sheet the class is allowed to win. Desktop
        // keeps the inline relative exactly as it was.
        style={{
          position: dockAside && isMobile ? undefined : "relative",
          visibility: hideCaption || displayOnly ? "hidden" : undefined,
          // Only once it has actually been dragged; until then the CSS owns the
          // load position, so the 48px / 60px in .asideSheet stay the single source.
          ...(dockAside && isMobile && sheetPos
            ? { left: `${sheetPos.left}px`, bottom: `${sheetPos.bottom}px` }
            : null),
        }}
        onPointerDown={dockAside ? (isMobile ? sheetDown : asideDown) : undefined}
        onPointerMove={dockAside ? (isMobile ? sheetMove : asideMove) : undefined}
        onPointerUp={dockAside ? (isMobile ? sheetUp : asideUp) : undefined}
        onPointerCancel={dockAside ? (isMobile ? sheetUp : asideUp) : undefined}
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
          {dockAside && shownHeadImg && (
            <div className={styles.cHead}>
              <span className={styles.cPortraitWrap}>
                <img
                  className={styles.cPortrait}
                  src={bust(shownHeadImg as string)}
                  alt={shown.data.name}
                  draggable={false}
                />
                {shownTag && (
                  <span
                    className={styles.cStatus}
                    style={{ background: TAG_STYLE[shownTag].bg }}
                    title={STATUS_LABEL[shownTag]}
                    aria-label={STATUS_LABEL[shownTag]}
                  />
                )}
              </span>
              <span className={styles.cHeadText}>
                <span className={styles.cHeadName}>{shown.data.name}</span>
                {/* REMOVED 9 Sept 2026: the "is related to:" line went with the
                    chum name and write-up below. The header now names the
                    hovered circle and stops there. */}
              </span>
            </div>
          )}
          {/* THE CHUM NAME AND ITS WRITE-UP ARE GONE, 9 Sept 2026, owner's call.
              With a chum picked, this box used to open with the chum name in
              yellow and its character note, and only then reach the percentage.
              The percentage sentence and the pie are the reason the box is open,
              so they lead now.
              Deleted rather than hidden: the same name was already in the header
              above AND in the percentage sentence below, so it was said three
              times. The write-up still has a home on the chum's own page.
              Only the chum branch changed. With no chum picked the box is
              untouched and still leads with the circle's own note. */}
          {!ancestryFor && shownShare !== null && shown.parent && !learning && (
            <span className={styles.cShare}>
              {shownShare}% of {shown.parent.data.name}
            </span>
          )}
          {/* THE LEVEL DOG'S WRITE-UP HOLDS WHILE A RAIL CHUM IS PICKED,
              16 September 2026 (owner: picking a chum before touching the circle
              diagram leaves the box with no content, and the level dog's original
              text should stay).

              WHAT THIS REPLACES. The whole paragraph was gated behind
              `ancestryFor ? null : ...`, so the moment a rail card was selected the
              box emptied. The reason given was that the chum branch had nothing to
              say here and an empty <p> left a blank first line, which was true of
              the empty paragraph but threw the level dog's text out with it.

              It now falls back rather than blanking: if the picked chum has nothing
              of its own, the box keeps showing what it was showing, which is the
              level dog's write-up. `shown` is still the circle the box is built
              from, so nothing else in the box has to change. */}
          <p className={styles.cNote}>
            {(isFocused && breedInfoLong[shown.data.name]) || breedInfo[shown.data.name] || (shown.depth === 0 && rootNote ? rootNote : shown.data.note)}
            {/* the mini pit drops the "keep digging" prompt: in LEARN mode the
                circles are the whole point, so the nudge is noise */}
            {!dockAside && shown.children ? " Tap a circle inside to keep digging." : ""}
          </p>
          {/* The share pill from the main pit, reproduced below the write-up:
              the breed's share of this whole dog, its share in the role it sits
              in, and the same best-guess caveat. Only when a circle is picked. */}
          {!ancestryFor && dockAside && shown.parent && shownNorm !== null && (
            <BreakFold folded={isMobile} key={`fold|${hideCaption ? "shut" : "open"}|${shown.data.name}`}>
              <div className={styles.cBreak}>
                <div className={styles.cBreakBig}>{shownNorm < 1 ? "<1%" : `${shownNorm}%`} historical influence</div>
                <div className={styles.cBreakRow}>As {genLabel(shown.depth)}: {shownShare === null ? "" : shownShare < 1 ? "<1%" : `${shownShare}%`}</div>
                <div className={styles.cBreakRow}>Share of this dog: {shownNorm < 1 ? "<1%" : `${shownNorm}%`}</div>
                <div className={styles.cBreakTitle}>Our best guess, not hard science.</div>
                <BreakNote key={`${hideCaption ? "shut" : "open"}|${shown.data.name}`} />
              </div>
            </BreakFold>
          )}
          {/* Chum picked: how much of that pack dog traces to the level circle
              currently shown, from its own ancestry breakdown. */}
          {ancestryFor && dockAside && shown !== nodes[0] && (() => {
            const share = ancestorShareOf(ancestryFor.name, shown.data.name);
            /* THE WORKING BEHIND THE HEADLINE, added 9 Sept 2026 (owner), to
               match the breakdown the LineageMap popout already shows.
               One line per time this ancestor turns up in the chum's tree, then
               the sum when there is more than one.
               These CANNOT disagree with the percentage above them:
               ancestorAppearancesOf is the same walk as ancestorShareOf with the
               detail kept instead of discarded. Checked against live data, e.g.
               Beagle under Ancient eastern sighthounds reads 6% + 5% = 11%,
               which is the 11% in the headline.
               There is no separate "share of your chum" line, unlike the
               LineageMap version. That popout normalises across every breed, so
               its sum and its share are two different numbers. Here they are the
               same number, and printing it twice would just look like an error. */
            const apps = share !== null ? ancestorAppearancesOf(ancestryFor.name, shown.data.name) : [];
            const pct = (n: number) => (n < 1 ? "<1%" : `${n}%`);
            return share !== null ? (
                <div className={styles.cBreak}>
                  {/* NO FOLD ON THE CHUM VIEW, 9 Sept 2026 (owner). BreakFold was
                  wrapped round this on 31 Aug to stop the box growing without
                  limit once its max-height and scrollbar were removed. It has
                  since stopped earning that: the chum's own name and write-up
                  came out of this box on 9 Sept, so what is left is the
                  percentage, the working and the disclaimer, and all of it is
                  what the reader opened the box to see.
                  It was also fighting the reader. It defaults to closed AND was
                  mounted with a key naming the chum, so it re-folded on every
                  single tap in the rail. Two taps to read each dog.
                  Removing the wrapper is the whole fix. It cannot be "defaulted
                  to open" instead: BreakFold has no control to close it again,
                  so open is a one-way door and the component would be dead code
                  pretending to be a toggle.
                  THE OTHER BRANCH KEEPS ITS FOLD. With no chum picked the box
                  still carries the circle's full write-up above these figures,
                  which is the long case the fold was written for. */}

                  <div className={styles.cBreakBigRow}>
                    <div className={styles.cBreakBig}>
                      {ancestryFor.name} is <span className={styles.cPct}>{pct(share)}</span> {shown.data.name}
                    </div>
                    <SharePie pct={share} />
                  </div>
                  {/* ONE LINE PER SIDE OF THE FAMILY, NOT PER APPEARANCE,
                      16 September 2026 (owner: this area should make it easier to
                      understand, not harder). A Border Collie reached forty times
                      by Old hunting dogs of the Celts gave forty lines, every one
                      reading the same generation label, which told the reader
                      nothing about the route. Grouped by the depth-1 branch it
                      came through, the same case gives a handful of lines that
                      name the dogs and still add to the headline figure.

                      genLabel survives for the single-appearance case, where the
                      generation IS the useful fact and there is no route to
                      disambiguate. The main pit's own copy was changed the same
                      way on 15 September; this is the last of the two. */}
                  {apps.length > 0 && (() => {
                    const m = new Map<string, number>();
                    for (const a of apps) m.set(a.branch, (m.get(a.branch) ?? 0) + a.pct);
                    const routes = [...m.entries()].sort((x, y) => y[1] - x[1]);
                    return (
                      <div className={styles.cBreakWorking}>
                        {apps.length === 1
                          ? <div className={styles.cBreakRow}>As {genLabel(apps[0].depth)}: <span className={styles.cBreakPct}>{pct(apps[0].pct)}</span></div>
                          : routes.map(([branch, p], i) => (
                              <div key={i} className={styles.cBreakRow}>from {branch}: <span className={styles.cBreakPct}>{pct(p)}</span></div>
                            ))}
                        {routes.length > 1 && (
                          /* Every figure on this line is wrapped too, not just the total,
                             so the sum reads the same as the rows above it. */
                          <div className={styles.cBreakRow}>
                            Combined: {routes.map(([, p], i) => (
                              <span key={i}>{i > 0 ? " + " : ""}<span className={styles.cBreakPct}>{pct(p)}</span></span>
                            ))} = <span className={styles.cBreakPct}>{pct(share)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  {/* The disclaimer stays, below the working, by request. */}
                  <div className={styles.cBreakTitle}>Our best guess, not hard science.</div>
                  <BreakNote key={`${hideCaption ? "shut" : "open"}|${ancestryFor.name}|${shown.data.name}`} />
                </div>
            ) : null;
          })()}
          {/* Related pack dogs, part of the box: they open and close with it
              and ride along when it is dragged. The 54-pack breeds that descend
              from this level's ancestors, as square cards down one side. */}
          {/* ZOOM OUT, bottom right, only while zoomed in.
              A tap on the background already does this, but since the background
              also pans there is no longer anything on screen saying so. This is
              the visible way back out. Mobile only, by request: on desktop the
              cursor already turns to a zoom-out over the background. */}
          {dockAside && learning && !dropped && focus !== nodes[0] && (
            <button
              type="button"
              className={styles.zoomOutBtn}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); zoom(nodes[0]); }}
              aria-label="Zoom out"
              title="Zoom out"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"
                fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10.5" cy="10.5" r="6.5" />
                <line x1="7.5" y1="10.5" x2="13.5" y2="10.5" />
                <line x1="15.5" y1="15.5" x2="21" y2="21" />
              </svg>
            </button>
          )}

          {dockAside && learning && !railHidden && renderRail.length > 0 && (
            <div
              ref={railRef}
              onPointerDown={railDown}
              onPointerMove={railMove}
              onPointerUp={railUp}
              onPointerCancel={railUp}
              className={`${styles.relRail} ${
                // Was `hideCaption && !railPin`, which is what tied the rail's
                // position to the box. Its own screen slot is now the default
                // and the box has no say in it.
                !railPin
                  // No slider nudge any more: the rail starts on the right and
                  // the slider is on the left, so they cannot meet.
                  ? styles.relRailHome
                  : railSide === "left"
                  ? styles.relRailLeft
                  : styles.relRailRight
              }`}
              style={{
                /* ROWS CAPPED AT 10, 2 September 2026 (owner). It used to be half
                   the list, which meant the rail grew in HEIGHT for ever and
                   never past two columns: grid-auto-flow is column, so the row
                   count decides everything.

                   MEASURED, worst case first. The busiest circles are St Hubert
                   Hound and Old scenting hounds at 24 chums each, and nothing in
                   the dataset exceeds that: 263 possible circles checked, 19 of
                   them past 9. At 24 the old rule gave 2 columns of 12, a box
                   108 x 568 whose foot landed at y 660 on a 402px phone, ON TOP
                   of the bottom button row which starts at 614. Capping the rows
                   gives 3 columns, a box 154 x 476, foot at 568. Wider, but 46px
                   clear of the row, and the two no longer share a band so the
                   width costs nothing.

                   THE POINT IS THE CEILING, not today's numbers. The pack is 54
                   dogs. If new ancestry is authored above more than about 26 of
                   them, the old rule ran the rail off the top and bottom of the
                   screen with nothing to catch it. Now it grows sideways.

                   10 -> 14 ON 16 SEPTEMBER 2026 (owner), so every rail is two
                   columns and none is three.

                   RE-MEASURED THE SAME DAY, because the September figures above
                   are out of date: the busiest circle is now Old hunting dogs of
                   the Celts at 27 chums, not the 24 recorded above, and the count
                   rose because of the ancestry connected that day. 251 circles
                   checked, 32 past 9, 26 past 10, 17 past 14, none past 28.

                   SO 14 IS TWO COLUMNS FOR EVERYTHING, AND THE MARGIN IS ONE DOG.
                   14 rows over two columns tops out at 28 against a worst case of
                   27. Connect ancestry above two more pack dogs on that circle and
                   it is three columns again. The number to raise is this one; the
                   height cost is a row of about 46px per step. */
                /* EVEN COLUMNS, AND COUNTED WITHOUT THE LEAVERS, 16 September 2026 (owner).

                   TWO CHANGES IN ONE LINE. First, rows are half the list rounded up rather
                   than filling the first column to the cap: four dogs give two and two,
                   twenty give ten and ten. Math.min(14, n) stacked four in one column and
                   split twenty as 14 and 6.

                   Second, the LEAVERS ARE NOT COUNTED. That is the three-column flash the
                   owner caught while hovering the bottom left icon: renderRail holds
                   departing cards for 340ms so they can animate out, so during a swap it
                   carries the new list PLUS the old one's leavers. Halving that briefly
                   asked for more rows than the rail has room for and the overflow spilled
                   into a third column until the timer cleared. The hover was not the
                   cause; it was re-rendering while a swap was in flight. Counting only the
                   cards that are staying keeps the row count on the list the player ends
                   up with, and the leavers fade out of the columns they were already in.

                   The 14 stays as the ceiling and only bites past 28, which nothing
                   reaches: the busiest circle is Old hunting dogs of the Celts at 27.
                   Math.max(1, ...) keeps a single-chum rail from asking for zero rows. */
                gridTemplateRows: `repeat(${Math.max(1, Math.min(14, Math.ceil(renderRail.filter((r) => !r.leaving).length / 2)))}, auto)`,
                visibility: "visible", // shows through even when the box is hidden
                ...(railPin
                  ? { position: "fixed" as const, top: railPin.top, left: railPin.left, right: "auto" }
                  : null),
                // Applied last so it rides on top of either position. Zero
                // whenever the rail already fits, which is nearly always.
                ...(railNudge.dx || railNudge.dy
                  ? { transform: `translate(${railNudge.dx}px, ${railNudge.dy}px)` }
                  : null),
              }}
              aria-label="Pack dogs from this lineage"
            >
              {/* Only once the box is shut: until then the box's own X is the
                  obvious way out, and two Xs together is noise. */}
              {hideCaption && (
                <button
                  type="button"
                  className={styles.railClose}
                  onClick={(e) => { e.stopPropagation(); setRailHidden(true); }}
                  onPointerDown={(e) => e.stopPropagation()}
                  aria-label="Close the dog list"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <line x1="7" y1="7" x2="17" y2="17" />
                    <line x1="17" y1="7" x2="7" y2="17" />
                  </svg>
                </button>
              )}
              {renderRail.map((r, i) => (
                <button
                  key={r.slug}
                  type="button"
                  className={`${styles.relCard}${r.leaving ? " " + styles.relCardLeaving : ""}${ancestryFor?.slug === r.slug ? " " + styles.relCardOn : ""}${collectedChums?.has(r.name) ? " " + styles.relCardDone : ""}`}
                  style={{ animationDelay: `${i * 55}ms` }}
                  aria-pressed={ancestryFor?.slug === r.slug}
                  onMouseEnter={() => setHoverHint(`learn about ${r.name}`)}
                  onMouseLeave={() => setHoverHint("")}
                  onClick={() => {
                    // Collected: the picture is gone and a tick is in its place,
                    // so a tap has nothing left to select. It toggles the name
                    // instead, which is the only thing still worth reading.
                    if (collectedChums?.has(r.name)) { setNamedChum((n) => (n === r.slug ? null : r.slug)); return; }
                    if (ancestryFor?.slug === r.slug) { setAncestryFor(null); return; }
                    if (!ancestryFor) { setAncHidden(true); setTrainHidden(true); setTempHidden(true); }
                    setAncestryFor({ name: r.name, slug: r.slug, note: r.note, image: r.image });
                  }}
                  title={r.name}
                  aria-label={collectedChums?.has(r.name) ? `${r.name}, collected` : `View ${r.name}`}
                >
                  {collectedChums?.has(r.name) ? (
                    <>
                      <svg className={styles.relCardTick} viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4 12.5 L9.5 18 L20 6.5" fill="none" stroke="#ffffff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className={`${styles.relCardName}${namedChum === r.slug ? " " + styles.relCardNameOn : ""}`}>{r.name}</span>
                    </>
                  ) : (
                    <img src={bust(r.image)} alt="" draggable={false} />
                  )}
                  {/* The "i" lives on the SELECTED card only. A badge on all
                      seventeen would be about 14px, under a fingertip, and would
                      fight the tap that picks the dog. The picked card is
                      already enlarged, so there is room. A span rather than a
                      button because it sits inside one; the press is stopped
                      here so the card does not deselect underneath it. */}
                  {/* GONE ONCE THE CHUM IS COLLECTED, 16 September 2026 (owner: the
                      "i" persists after a collect and lets the dog be collected a
                      second time).

                      The badge only checked whether the card was SELECTED. A
                      collected card stayed selectable, so the "i" stayed, the
                      layer reopened and its green Collect button was still live,
                      which paid out again. The quick-collect tick beside it
                      already hid itself on the same condition; this brings the two
                      into line, and closing the only door into the layer is what
                      makes the collect a one-time affair. */}
                  {ancestryFor?.slug === r.slug && !collectedChums?.has(r.name) && (
                    <span
                      className={styles.relCardInfo}
                      role="button"
                      tabIndex={0}
                      aria-label={`Family tree for ${r.name}`}
                      onMouseEnter={() => setHoverHint("see the family tree")}
                      onMouseLeave={() => setHoverHint("")}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Not grown from the card. The rail lives in the top
                        // left corner, so a card that size in that spot put the
                        // whole tree up against two edges. It opens centred and
                        // three quarters down instead, which is where the main
                        // pit puts its own card and leaves room for the tree to
                        // fan up and out of it.
                        setChumTree({
                          name: r.name,
                          image: r.image,
                          x: window.innerWidth / 2,
                          y: window.innerHeight * 0.75,
                          angle: 0,
                        });
                      }}
                    >
                      i
                    </span>
                  )}
                  {/* QUICK COLLECT, 16 September 2026 (owner: a shortcut past the
                      layer, doing what the green collect button does).

                      SAME TWO EFFECTS AS THAT BUTTON, deliberately: onChumCollected
                      to record the chum, and onScore with a figure priced under
                      the layer's own flashNum award. The two were the same 1000
                      until 18 September 2026; the shortcut is now 500 and the pit
                      collect 750, while the layer's green button is unchanged.

                      Sits beside the "i" on the SELECTED card only, for the reason
                      given there: a badge on every card would be about 14px and
                      would fight the tap that picks the dog. Hidden once the chum
                      is collected, because the card then carries the tick instead
                      and there is nothing left to collect. The press is stopped so
                      the card underneath does not deselect. */}
                  {ancestryFor?.slug === r.slug && !collectedChums?.has(r.name) && (
                    <span
                      className={styles.relCardGrab}
                      role="button"
                      tabIndex={0}
                      aria-label={`Collect ${r.name}`}
                      onMouseEnter={() => setHoverHint(`collect ${r.name}`)}
                      onMouseLeave={() => setHoverHint("")}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        /* CONFETTI, 16 September 2026 (owner). The same fireConfetti
                           the collect button uses, so the shortcut and the long way
                           celebrate the same way. Fired from the tick's own position
                           rather than the screen centre, so it reads as coming from
                           the card the player pressed. This route has no tumble
                           animation, so the card greens immediately; only the
                           layer's own collect waits for its flight to land. */
                        /* THE WHOLE COLLECT, NOT JUST THE TALLY, 16 September 2026
                           (owner: start the confetti from the middle of the chum
                           card, fly the card to the bottom left like the pit's own
                           chum does, and pop the card box up down there).

                           THE CONFETTI CAME FROM THE TICK. e.currentTarget is the
                           28px badge, so the burst started from its corner rather
                           than from the card. It now reads the CARD's rect, which is
                           the tick's offsetParent, so the middle of the artwork is
                           the origin.

                           THE FLIGHT IS A CSS ANIMATION ON THE CARD, driven by two
                           custom properties measured here: how far the card has to
                           travel to reach the corner the pit drops its chums into.
                           Measured rather than fixed, because the card's position
                           depends on where it sits in the rail and how far the rail
                           has been nudged.

                           THE CHUM IS RECORDED WHEN IT LANDS, not on the press, so
                           the card turns green at the end of the flight. That is the
                           same rule the layer's own Collect follows. 620ms matches
                           the animation below; if one changes, change both. */
                        const tick = e.currentTarget as HTMLElement;
                        const card = (tick.offsetParent as HTMLElement) ?? tick;
                        const b = card.getBoundingClientRect();
                        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                          fireConfetti({ particleCount: 60, spread: 110, startVelocity: 38, origin: { x: (b.left + b.width / 2) / window.innerWidth, y: (b.top + b.height / 2) / window.innerHeight } });
                        }
                        const toX = 56 - (b.left + b.width / 2);
                        const toY = (window.innerHeight - 96) - (b.top + b.height / 2);
                        card.style.setProperty("--fly-x", `${Math.round(toX)}px`);
                        card.style.setProperty("--fly-y", `${Math.round(toY)}px`);
                        card.classList.add(styles.relCardFly);
                        setChumBoxPop(true);
                        /* The pit answers a collect with a big white tally and a
                           burst of sparks under the box. The learn area had the box
                           and the confetti but neither of those, so a collect here
                           read as quieter than the same act in the pit. Both are
                           built below rather than imported: the pit's own versions
                           are drawn inside LineageMap's svg, and this is HTML. */
                        setChumPop(chumsCollected + 1);
                        window.setTimeout(() => setChumPop(null), 1400);
                        window.setTimeout(() => setChumBoxPop(false), 1400);
                        window.setTimeout(() => {
                          card.classList.remove(styles.relCardFly);
                          card.style.removeProperty("--fly-x");
                          card.style.removeProperty("--fly-y");
                          onChumCollected?.(r.name);
                        }, 620);
                        return;
                        /* 500, HALF THE GREEN BUTTON'S 1000, 16 September 2026
                           (owner). The shortcut and the long way used to pay the
                           same; the owner's rebalance prices the shortcut lower,
                           as the auto-place shortcut is priced against placing by
                           hand. */
                        /* 500 -> 750, 16 September 2026 (owner). The shortcut is
                           priced below the long way on purpose, as the auto-place is,
                           and the green Collect was rebased the same day to
                           1000 + 100 a frame, so this sits under it on every level of
                           three frames or more. */
                        /* 750 -> 500, 18 September 2026 (owner), alongside the pit
                           collect dropping from 1000 to 750, so the shortcut stays
                           the cheaper of the two ways. */
                        onScore?.(500);
                      }}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4 12.5 L9.5 18 L20 6.5" fill="none" stroke="#ffffff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* THE PIT'S TALLY, VERBATIM, 16 September 2026 (owner). Markup and classes are
          PackPit's own, down to the 16 spokes and 5 dots of the burst and the two
          pink hexes, so a collect in the learn area is the same object as a collect
          in the pit rather than an imitation of one. The `key` is what replays it:
          the pit re-keys on its own count for the same reason. */}
      {chumPop !== null && (
        <div className={pitStyles.tally} key={chumPop} aria-live="polite" aria-label={`${chumPop} chums collected`}>
          <button type="button" className={pitStyles.tallyChip} aria-label="Chums collected">
            <svg className={pitStyles.tallyBurst} viewBox="-60 -60 120 120" aria-hidden="true">
              {Array.from({ length: 16 }).map((_, i) => {
                const a = (i / 16) * Math.PI * 2, r1 = 24, r2 = i % 2 === 0 ? 52 : 38;
                return <line key={i} x1={Math.cos(a) * r1} y1={Math.sin(a) * r1} x2={Math.cos(a) * r2} y2={Math.sin(a) * r2} stroke="#ff2d78" strokeWidth={3.5} strokeLinecap="round" />;
              })}
              {Array.from({ length: 5 }).map((_, i) => {
                const a = (i / 5) * Math.PI * 2 + 0.4, rr = 46;
                return <circle key={`s${i}`} cx={Math.cos(a) * rr} cy={Math.sin(a) * rr} r={4.5} fill="#ff5d97" />;
              })}
            </svg>
            <span className={pitStyles.tallyNum}>{chumPop}</span>
            <span className={pitStyles.tallyPlusOne} aria-hidden="true">+1</span>
          </button>
        </div>
      )}
      {chumBoxPop && (
        /* A plain <img>, matching the pit's own .cardBox, which uses the same file
           the same way. next/image is not wanted here: this is a decorative SVG
           that appears for a second and is gone, so the loader and the layout box
           it brings buy nothing. The rule is silenced rather than the file's
           warning count raised. */
        // eslint-disable-next-line @next/next/no-img-element
        <img className={mapStyles.cardBox} src="/card-pack-box.svg" alt="" aria-hidden="true" />
      )}
      {dockAside && ancestryFor && !ancHidden && ancestryRows.length > 0 && (
        <LearnDragCard
          className={styles.ancCard}
          style={ancPos ? { left: ancPos.left, top: ancPos.top, width: ancPos.width, right: "auto", bottom: "auto" } : undefined}
          ariaLabel={`Ancestry of ${ancestryFor.name}`}
          /* NO ICON IN THE TITLE, 16 September 2026 (owner: leave just the card
             titles). LearnDragCard's icon prop is optional and its head renders
             nothing without one, so dropping the prop is the whole change; the
             three ICONS entries stay in use on the dock buttons that reopen these
             cards, which is where they still earn their place. */
          title={"Ancestry"}  /* was the dog name; the three card titles now read Ancestry, Training, Temperament */
          titleWhite
          onClose={() => setAncHidden(true)}
          closeLabel="Close ancestry"
        >
          {/* The rows scroll inside a capped box, see .ancScroll. The card itself
              keeps its size whatever the lineage length. */}
          <div className={styles.ancScroll}>
          {ancestryRows.map((a) => (
            /* THE BAR IS GONE, 16 September 2026 (owner: the middle percentage
               bar is always blank and we can show the full name instead).

               IT WAS NOT BLANK, it was redundant. .ancBar carried width: {pct}%,
               so at 55% it drew 31px of yellow in a 56px track 6px tall, right
               beside the figure it restated. Small enough to read as empty and
               worth nothing next to the number.

               Dropping it frees 64px, the 56px track plus its 8px gap, and the
               name column takes all of it. That is what was clipping "Otterh..."
               and "Old Eu...". .ancBarWrap and .ancBar stay in the stylesheet,
               unused, so putting it back is one line here. */
            <div key={a.name} className={styles.ancRow} title={a.name}>
              <span className={styles.ancName}>{a.name}</span>
              {/* "<0.1%" RATHER THAN "0.0%", 16 September 2026 (owner). pct is
                  apportioned in whole tenths so the column totals exactly 100.0, and
                  on a 52-ancestor dog like the Jackapoo the smallest get none. The
                  dog is still in the tree, so the honest reading is "less than a
                  tenth", not "none". exact is the unrounded share and is what tells
                  the two apart. The family tree badges say "<1%" for the same reason
                  at their own precision. */}
              <span className={styles.ancPct}>{a.pct < 0.05 && a.exact > 0 ? "<0.1%" : `${a.pct.toFixed(1)}%`}</span>
            </div>
          ))}
          </div>
        </LearnDragCard>
      )}
      {dockAside && ancestryFor && !trainHidden && trainingDifficulty[ancestryFor.slug] && (
        <LearnDragCard
          className={styles.trainCard}
          style={trainPos ? { left: trainPos.left, top: trainPos.top, right: "auto", bottom: "auto" } : undefined}
          ariaLabel={`Training for ${ancestryFor.name}`}
          title={"Training"}  /* the dog name is gone, 16 Sept 2026 (owner): the card sits beside the dog it describes, so repeating it in every title was noise. cardTitleName is unused now. */
          onClose={() => setTrainHidden(true)}
          closeLabel="Close training"
        >
          <TrainingCard data={trainingDifficulty[ancestryFor.slug]} compact />
        </LearnDragCard>
      )}
      {dockAside && ancestryFor && !tempHidden && chumTraits && (
        <LearnDragCard
          className={styles.tempCard}
          style={tempPos ? { left: tempPos.left, top: tempPos.top, right: "auto", bottom: "auto" } : undefined}
          ariaLabel={`Temperament of ${ancestryFor.name}`}
          title={"Temperament"}  /* the dog name is gone, 16 Sept 2026 (owner): the card sits beside the dog it describes, so repeating it in every title was noise. cardTitleName is unused now. */
          onClose={() => setTempHidden(true)}
          closeLabel="Close temperament"
        >
          <TemperamentBody key={ancestryFor.slug} pros={chumTraits.pros ?? []} cons={chumTraits.cons ?? []} tab={tempTab} setTab={setTempTab} />
        </LearnDragCard>
      )}
      {dockAside && ancestryFor && (ancHidden || trainHidden || tempHidden) && (
        /* A horizontal row running left from the back square. Position and size
           (desktop line vs phone one-line-down, and the 768px size breakpoint)
           all live in .learnDock; nothing here tracks a moving body. */
        <div className={styles.learnDock}>
          {ancHidden && ancestryRows.length > 0 && (
            <button type="button" className={styles.learnDockBtn} onMouseEnter={() => setHoverHint("open ancestry")} onMouseLeave={() => setHoverHint("")} onClick={() => { setAncPos(null); setAncHidden(false); }} aria-label="Reopen ancestry" title="Ancestry">
              <span className={styles.learnDockIcon}>{ICONS.ancestry}</span>
            </button>
          )}
          {trainHidden && trainingDifficulty[ancestryFor.slug] && (
            <button type="button" className={styles.learnDockBtn} onMouseEnter={() => setHoverHint("open training")} onMouseLeave={() => setHoverHint("")} onClick={() => { setTrainPos(null); setTrainHidden(false); }} aria-label="Reopen training" title="Training">
              <span className={styles.learnDockIcon}>{ICONS.training}</span>
            </button>
          )}
          {tempHidden && chumTraits && (
            <button type="button" className={styles.learnDockBtn} onMouseEnter={() => setHoverHint("open temperament")} onMouseLeave={() => setHoverHint("")} onClick={() => { setTempPos(null); setTempHidden(false); }} aria-label="Reopen temperament" title="Temperament">
              <span className={styles.learnDockIcon}>{ICONS.infoBox}</span>
            </button>
          )}
        </div>
      )}
      {/* ==================== REMOVE BEFORE LAUNCH, ?floorbox=1 ====================
          LAST NODE IN THE TREE and z-index 99999, deliberately. The chumbox panel
          was placed mid-tree and never appeared on the phone, so this one is put
          where nothing can paint over it. */}
      {floorDiag && (
        <div style={{
          position: "fixed", top: 6, left: 6, zIndex: 99999, pointerEvents: "none",
          background: "rgba(0,0,0,0.82)", color: "#0f0", padding: "6px 8px",
          font: "11px/1.35 ui-monospace, monospace", borderRadius: 6, whiteSpace: "pre",
        }}>{floorDiag}</div>
      )}
    </div>
  );
}
