"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { hierarchy, pack, packSiblings, packEnclose, type HierarchyCircularNode } from "d3-hierarchy";
import { radius as pctRadius, ringFrac } from "../PackPit/LineageMap";
import { createPitEffects } from "../PackPit/pitEffects";
import { splitName } from "../PackPit/splitName";
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
import { BRAIN_PATH, BRAIN_ARTBOARD } from "../icons/brain";
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

// The one copy of the small print under the share figures. Folded away by
// default and opened by the "..." below.
const FIGURES_NOTE =
  "These figures come from history and old breeding records, our viewpoint, not proven fact. (Though DNA reading can now trace bloodlines back with real precision, even reviving lost breeds.)";

// The small print, folded behind a "...". It carries its own open state and is
// mounted with a key that changes whenever the box opens or the circle or chum
// changes, so it is always folded again on the way in rather than remembering.
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
        className={styles.cNoteDots}
        onClick={() => setOpen(false)}
        aria-expanded={true}
        aria-label="Hide how these figures were worked out"
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
// Breed-title placement on each circle, relative to its label anchor. TITLE_DY
// moves it up (more negative) or down toward the circle; TITLE_ANGLE tilts it
// (negative leans the text up to the right). Tweak these two to taste.
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
const DIFF_DEFAULT = 5;
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
// radius is a fraction of the mean circle radius, so growing the circles grows
// them too. That only holds up to about 0.61, where BADGE_MAX_R takes over and
// the chips stop tracking.
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
const COOKIE_CONSENT_KEY = "pc-cookie-consent";
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
// Dropped after the rock and before the chums, so it lands on a floor that has
// something on it rather than into an empty pit.
const TOY_BONE_GAP = 900;
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
/* Which prop waits and lands INTO the flood of dogs rather than before it, so
   some of the pack is already down and the rest comes in on top of it. One word
   to move it to another prop, or "" to send them all in together as before. */
const PROP_IN_FLOOD: string = "shoe";

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
// stickBig is the same artwork half again as large, so the pair reads as two
// sticks of different sizes rather than one drawn twice
type ToyKind = "ball" | "flag" | "stick" | "stickBig" | "rock" | "ballPink" | "cookies" | "bone"
  | "newspaper" | "fork" | "shoe";
/* The props slot: the three objects that arrive together part way through the
   drop. A theme can replace them, which is how an era gets its own things to
   knock about. */
export const DEFAULT_PROPS: ToyKind[] = ["stick", "stickBig", "rock"];
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
};
// every prop except the flag leaves for good once it is thrown clear of the pit
const TOY_GONE_KEY: Record<ToyKind, string> = {
  ball: TOY_BALL_GONE_KEY, flag: TOY_FLAG_SEEN_KEY,
  stick: TOY_STICK_GONE_KEY, stickBig: TOY_STICK_BIG_GONE_KEY,
  rock: TOY_ROCK_GONE_KEY, ballPink: TOY_BALL_PINK_GONE_KEY,
  cookies: TOY_COOKIES_SEEN_KEY,
  bone: TOY_BONE_GONE_KEY,
  newspaper: TOY_NEWSPAPER_GONE_KEY, fork: TOY_FORK_GONE_KEY, shoe: TOY_SHOE_GONE_KEY,
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
/* The two balls, and only these, retire per era. Everything else is spent for
   the session as it always was. */
const ERA_SCOPED_TOYS: string[] = ["ball", "ballPink"];

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
// ?toys=reset un-retires every toy on load, so a testing session does not have
// to reach for the browser console. sessionStorage is per tab and survives a
// reload, so once you have thrown the ball clear or read the flag's message
// they are gone for that tab until this clears them.
// Kept deliberately after the other test rigs were removed: it is harmless and
// saves a console visit every time the pit is worked on.
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
// The level background and the LEARN wash are two halves of one split screen.
// The wash is a slab tilted by this much, pushed off toward the top right; the
// level fills everything on the other side of that slab's leading edge. Both
// numbers are the wash's own, so the two edges are the same line by
// construction rather than by eye.
const WASH_DEG = 18;
const WASH_PEEK_X = 0.46; // .learnWashPeek translate3d(46%, ...)
const WASH_INSET = 2.2; // .learnWash inset: -60% -> 2.2 viewports wide
// 42 was a flat number, and that was the bug. The label block anchored 42 units
// above centre WHATEVER the circle's size, so as the tree goes deeper and the
// radii shrink the anchor drifts further off centre: 10% of the radius at the
// root, 33% by depth 2, 60% by depth 3, and past the rim by depth 4. Two
// symptoms, one cause. The text looked misaligned a little more at every step,
// and because labelFits measures the rotated corners FROM this anchor, the room
// it had collapsed, so the fitter shrank the type or gave up.
//
// Now capped as a fraction of the radius. 0.18 is the share the depth-1 circles
// already had, so the level's own circles and the root are untouched to the
// pixel, and only the smaller ones are pulled back toward their middle.
const TITLE_DY = -42;
const TITLE_DY_FRAC = 0.18;
function titleDy(r: number): number {
  return -Math.min(-TITLE_DY, Math.max(0, r) * TITLE_DY_FRAC);
}
const TITLE_ANGLE = -10;
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
// It is skipped in three places and only three: the drawing, the pop that turns
// children into physics bodies, and the hover unlock.
function isEcho(d: Node): boolean {
  return !!d.parent && d.data.name === d.parent.data.name;
}

// Breed titles are fitted to the circle they belong to. The name is wrapped
// across 1 to LABEL_MAX_LINES balanced lines and every option is measured; the
// wrap that allows the largest type while keeping all four corners of the text
// block inside the circle wins. A very long name therefore takes a third or
// fourth line instead of spilling over the rim.
const LABEL_MAX_LINES = 4;
const LABEL_CHAR_W = 0.62; // fallback glyph width in ems, before the font loads
// Line height in ems for every label inside a circle, and the single source
// for it: the fitter reads it and both renderers now interpolate it, so the
// drawn spacing and the spacing the fitter measured can never drift apart.
// Tightening this also lets the fitter find a larger type size, because the
// same words now occupy a shorter block, so multi-line names grow a little.
const LABEL_LINE_H = 0.9;
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
const PIT_WORD_SCALE = 1.05;
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
// The yellow percentage badge, drawn and collided at this radius. Doubled from
// 46: they were easy to lose against the circles, on the start screen and in
// the pit alike.
// J17: a scattered percentage badge has this chance of arriving as a bomb.
// The main pit's own figure, PackPit.tsx scatterRef, where a comment records it
// was raised from 1 in 35 for better chain reactions.
const BOMB_ODDS = 20;
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
// How far the chain reaches, in hops. The chain is a flood fill: everything
// touching the bomb goes, then everything touching those, and so on. Unlimited,
// which is what it was, that means one bomb takes the entire connected mass of
// chips, and in a crowded pit they are all in contact. So a single bomb cleared
// the floor. Two hops is the bomb's neighbours and theirs, which still reads as
// a chain reaction and still scales with how packed the pit is, without turning
// every bomb into a full clear.
const BOMB_CHAIN_HOPS = 2;
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
const BOMB_CHAIN_MS = 25;     // gap between each object going up in the chain
// A percentage chip is sized by its own figure, on the MAIN PIT'S OWN CURVE.
// pctRadius is the very function the main pit uses, imported rather than
// copied, so the two can never drift apart.
//
// The main pit floors at 21px, which is why every share up to about 17% comes
// out the same size there. That flat bottom is deliberate and is kept.
//
// The curve is in the main pit's pixels, so it is normalised against the share
// below and multiplied by the pit's own badge size. BADGE_SHARE_REF is the
// share that keeps exactly the size the mini pit draws for everything today,
// so the middle of the range does not move and only the ends do.
const rollBomb = () => Math.random() < 1 / BOMB_ODDS;
const BADGE_SHARE_REF = 25;
const badgeRFor = (pct: number, base: number) => base * (pctRadius(pct || 0) / pctRadius(BADGE_SHARE_REF));
const BADGE_DRAW_R = 92;
// A badge belongs to its circle, so it has to scale with it. BADGE_DRAW_R was a
// flat 92 in SVG units while the circles are sized by the packing, the level
// slider and PIT_SHRINK, so shrinking the circles left the badges behind and
// they read as oversized. This is the badge radius as a fraction of the circle
// radius it sits on, taken from the proportion the pit had before the shrink.
// Halved from 0.55 by request: the badges read as almost the same size as the
// circle they belong to, which made the pair look like two circles rather than
// a circle wearing a tag.
// The chip radius as a fraction of the DRAWN circle radius, which is what the
// eye actually compares. It has to be against the drawn one: a circle is drawn
// at d.r * k while a chip is drawn at its raw radius with no k, so a fraction
// taken against the unconverted mean came out PIT_SPAN times too big, 0.7 of
// the circle instead of the 0.275 it claimed. BADGE_MAX_R then clamped it at
// the top of the slider and hid the fault, which is why maximum looked right
// and the default did not.
//
// 0.36, down from 0.44 by eye. ?bc= overrides it live.
const BADGE_OF_CIRCLE = 0.27; // was 0.36, pulled back 25% by request
// The chips are trimmed at the top of the slider, like the rings. Tapers in
// from level 5, so nothing at or below the default changes. 0.25 is a quarter
// smaller at 10.
//
// NOTE this is applied AFTER the clamp below, not before. By level 10 the raw
// figure is around 211 and BADGE_MAX_R has already pulled it back to 140, so a
// trim applied first would be swallowed by the clamp and do nothing at all.
const BADGE_TRIM = 0.25;
const BADGE_MIN_R = 26;
const BADGE_MAX_R = 140;

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
// rotated about (0, titleDy(r)), exactly as the rendered <text> is.
function labelFits(widthEm: number, n: number, fs: number, r: number): boolean {
  const halfW = (widthEm * fs) / 2;
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
      const rx = x * cos - dy * sin;
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
function relayoutMobile(nodes: Node[], aspect: number, level: number | null = null, sizeMul = 1) {
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
  // turn a wide cluster on its side so the long axis runs down the portrait
  if (w0 > h0) pts.forEach((p) => { const t = p.x; p.x = p.y; p.y = -t; });
  // and then lean the pair off vertical. A rigid rotation of the whole cloud,
  // so every nested circle keeps its place inside its parent. The bounding box
  // below is measured after this, so the fit already allows for it.
  if (level !== null && n === 2 && DIFF_TILT_DEG) {
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
  const scale = diffScale(
    Math.min((FH - M) / bh, (FW * 1.12) / bw),
    // width only, since the pit has no ceiling, and the widest circle's ring
    // has to fit between the walls as well as the circle itself
    pit.w / (bw * (1 + DIFF_RING)),
    level
  ) * sizeMul;
  // The cluster used to sit dead centre, which left the lower third of the pit
  // empty. Drop it toward the words, but never further than the slack actually
  // available: at the hardest difficulty the pack already fills the height, so
  // the shift has to give way rather than push circles through the floor.
  const bottomAfter = (maxY - cy) * scale;
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
  registerShake,
  registerSlowmo,
  onToggleCaption,
  onPitClose,
  onBackToStart,
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
  playLabel = "PLAY",
  onPlayPressed,
  onBackToLearn,
}: {
  root: LineageNode;
  rootImage?: string;
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
  onScore?: (v: number) => void;
  registerShake?: (fn: () => void) => void;
  registerSlowmo?: (fn: () => void) => void;
  onToggleCaption?: () => void;
  onPitClose?: () => void;
  /* The pit menu's green rewind: back to THIS level's start screen. Owned by
     the host, because it costs a life and remounts the round. */
  onBackToStart?: () => void;
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
  // The drag flag is a ref so the pointer handlers can read it, but the thumb
  // has to re-render to grow, so it needs state as well.
  const [diffDragging, setDiffDragging] = useState(false);
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
    const collapse = (n: LineageNode): LineageNode => {
      const kids = (n.children ?? []).map(collapse);
      if (n.value === undefined && kids.length === 1) return kids[0]; // wrapper: keep the child
      return { ...n, children: kids };
    };
    const collapsed: LineageNode = { ...root, children: (root.children ?? []).map(collapse) };
    const h = hierarchy<LineageNode>(collapsed)
      .sum((d) => d.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    const ns = pack<LineageNode>().size([SIZE, SIZE]).padding(8)(h).descendants();
    normalizeTop(ns);
    if (isMobile || dockAside) relayoutMobile(ns, aspectKey, dockAside ? level : null, isMobile ? 1 : 0.6);
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
  const isMobileRef = useRef(false);
  isMobileRef.current = isMobile;
  const viewRef = useRef<View>([nodes[0].x, nodes[0].y, nodes[0].r * 2 * (isMobile ? PAD : ZOOM_PAD)]);
  // The width of the full-pit view, kept so a ring can be drawn at the weight it
  // has when you are zoomed out. Seeded with the same expression as viewRef and
  // rewritten by every site that returns the view to the root.
  const homeWRef = useRef<number>(nodes[0].r * 2 * (isMobile ? PAD : ZOOM_PAD));
  const focusRef = useRef<Node>(nodes[0]);
  const rafRef = useRef<number>(0);

  const [focus, setFocus] = useState<Node>(nodes[0]);
  const [hovered, setHovered] = useState<Node | null>(null);

  // ---- C1: the hover unlock ----------------------------------------------
  // Pointer over one of the big circles and the circles inside it come loose:
  // they fall, bounce off the inside of the ring they live in, and shove each
  // other aside. Move off and they go home.
  //
  // The one rule that keeps this safe: it writes OFFSETS ONLY. Nothing here
  // touches d.x or d.y, so the packed layout is never disturbed and PLAY always
  // drops from it. The offset goes on the wrapper <g>, which zoomTo never
  // writes to (it writes to the circle and the label inside), so the two
  // transforms compose instead of fighting.
  //
  // The sim runs in WORLD units, the same currency as d.x, d.y and d.r, and is
  // converted to view units only at the moment of painting. That way a zoom
  // changes nothing about the physics.
  // Tuned against a harness that builds the REAL tree, runs the real pack, then
  // applies relayoutMobile's 90 degree turn and its tilt, and only then picks a
  // DEPTH-1 circle as the parent. All three of those matter: the root is hidden
  // so the circles you hover are depth 1, and gravity is not rotation
  // invariant, so measuring the unrotated layout gives the wrong answer.
  // At these numbers: overlap 0.000 to 0.016 units, escape under 0.07 on a
  // ~190 unit parent, apart in 0.45s, settled by 3.8s. Do not change one
  // without re-running that harness.
  const UNLOCK_G = 5.0;        // gravity, in parent radii per second squared
  const UNLOCK_BOUNCE = 0.28;  // how much of the closing speed comes back
  const UNLOCK_DRAG = 1.3;     // air, per second
  const UNLOCK_RIM = 0.85;     // rub along the inside of the ring
  const UNLOCK_POP = 0.45;     // opening shove outwards, in parent radii/sec
  // The sideways fan. On most levels the circles are stacked one above the
  // other, and a purely outward pop is straight up and straight down, so they
  // land on top of each other and take nearly two seconds to roll apart. The
  // fan shoves the higher one one way and the lower one the other, which is
  // what actually slides a stack apart. Measured: two-circle levels come apart
  // in 0.45s with this, against 1.88s without.
  const UNLOCK_SIDE = 1.3;     // in parent radii per second, at full lean
  const UNLOCK_ITER = 12;      // constraint passes per frame
  const UNLOCK_HOME_MS = 260;  // the trip back
  const UNLOCK_REST = 0.0006;  // moved less than this fraction of R counts as still
  // `els` is every wrapper index this circle drags with it: its own, then each
  // of its descendants. Circles are one flat list of sibling <g>s, not nested,
  // so moving a parent's wrapper does nothing to the circles drawn inside it.
  // Without this the outer circle came loose and left its own contents standing
  // exactly where they were. `i` is kept because the fan and the collision pass
  // still key off the circle itself.
  type UnlockKid = { n: Node; i: number; els: number[]; ox: number; oy: number; px: number; py: number; vx: number; vy: number };
  type UnlockState = {
    parent: Node;
    kids: UnlockKid[];
    inside: Set<Node>;
    raf: number | null;
    last: number;
    still: number;
    home: number | null; // timestamp the trip home began
    from: { ox: number; oy: number }[];
  };
  const unlockRef = useRef<UnlockState | null>(null);

  /* ── PUSH AND PULL, start screen only ────────────────────────────────────
     A circle can be dragged with a thumb and springs back when let go.
     It writes a translate onto the node's own wrapper <g> and onto every
     descendant's, which is exactly how the hover unlock moves things: zoomTo
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
        const d1s2 = nodes.filter((x) => x.depth === 1);
        const ci2 = d1s2.indexOf(n);
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
  // Paint the current offsets. View units, so it survives any zoom.
  const unlockPaint = () => {
    const u = unlockRef.current;
    const cg = circlesRef.current;
    if (!u || !cg) return;
    const k = SIZE / viewRef.current[2];
    for (const kd of u.kids) {
      for (const j of kd.els) {
        const w = cg.children[j] as SVGGElement | undefined;
        if (w) w.setAttribute("transform", `translate(${kd.ox * k},${kd.oy * k})`);
      }
    }
  };
  const unlockStop = () => {
    const u = unlockRef.current;
    if (!u) return;
    if (u.raf !== null) cancelAnimationFrame(u.raf);
    const cg = circlesRef.current;
    if (cg) {
      for (const kd of u.kids) {
        for (const j of kd.els) {
          const w = cg.children[j] as SVGGElement | undefined;
          if (w) w.removeAttribute("transform");
        }
      }
    }
    unlockRef.current = null;
  };

  // One frame. dt is real seconds, clamped so a background tab does not launch
  // everything through the ring on the way back.
  const unlockStep = (dt: number) => {
    const u = unlockRef.current;
    if (!u) return;
    const P = u.parent;
    const damp = Math.max(0, 1 - UNLOCK_DRAG * dt);
    for (const kd of u.kids) {
      kd.px = kd.ox; kd.py = kd.oy;
      kd.vy += UNLOCK_G * P.r * dt;
      kd.vx *= damp;
      kd.vy *= damp;
      kd.ox += kd.vx * dt;
      kd.oy += kd.vy * dt;
    }
    // Relaxation. Containment first and collisions last, so the frame ENDS
    // with the circles separated: the other way round, the ring pushes a
    // circle straight back into its neighbour and you see them overlap.
    // Twelve passes is what it took to get overlap to zero on all four level
    // shapes. Velocity is only answered on the first pass; the rest are pure
    // position repair.
    for (let it = 0; it < UNLOCK_ITER; it++) {
      for (const kd of u.kids) {
        const cx = kd.n.x + kd.ox - P.x;
        const cy = kd.n.y + kd.oy - P.y;
        const maxD = P.r - kd.n.r;
        const d = Math.hypot(cx, cy);
        if (d > maxD && d > 0) {
          const nx = cx / d, ny = cy / d;
          kd.ox -= (d - maxD) * nx;
          kd.oy -= (d - maxD) * ny;
          if (it === 0) {
            const vn = kd.vx * nx + kd.vy * ny;
            if (vn > 0) {
              kd.vx -= (1 + UNLOCK_BOUNCE) * vn * nx;
              kd.vy -= (1 + UNLOCK_BOUNCE) * vn * ny;
            }
            kd.vx *= UNLOCK_RIM;
            kd.vy *= UNLOCK_RIM;
          }
        }
      }
      // Never more than four circles, so the naive pair loop is the right one.
      // The overlap is split evenly: there is no mass model here, and a big
      // circle shunting a small one across the ring reads wrong.
      for (let a = 0; a < u.kids.length; a++) {
        for (let b = a + 1; b < u.kids.length; b++) {
          const A = u.kids[a], B = u.kids[b];
          const dx = (B.n.x + B.ox) - (A.n.x + A.ox);
          const dy = (B.n.y + B.oy) - (A.n.y + A.oy);
          const d = Math.hypot(dx, dy);
          const min = A.n.r + B.n.r;
          if (d >= min || d === 0) continue;
          const nx = dx / d, ny = dy / d, push = (min - d) / 2;
          A.ox -= nx * push; A.oy -= ny * push;
          B.ox += nx * push; B.oy += ny * push;
          if (it === 0) {
            const rvn = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
            if (rvn < 0) {
              const j2 = -(1 + UNLOCK_BOUNCE) * rvn / 2;
              A.vx -= j2 * nx; A.vy -= j2 * ny;
              B.vx += j2 * nx; B.vy += j2 * ny;
            }
          }
        }
      }
    }
    // Rest is measured on POSITION, not speed. Gravity re-adds speed every
    // single frame, so a speed test can never read zero and the loop would run
    // forever behind a still picture.
    let moved = 0;
    for (const kd of u.kids) moved = Math.max(moved, Math.hypot(kd.ox - kd.px, kd.oy - kd.py));
    u.still = moved < UNLOCK_REST * P.r ? u.still + dt : 0;
  };
  // The trip home. Ease the offsets back to zero, then drop them entirely.
  const unlockHomeStep = (now: number) => {
    const u = unlockRef.current;
    if (!u || u.home === null) return false;
    const t = Math.min(1, (now - u.home) / UNLOCK_HOME_MS);
    const e = 1 - Math.pow(1 - t, 3);
    u.kids.forEach((kd, idx) => {
      kd.ox = u.from[idx].ox * (1 - e);
      kd.oy = u.from[idx].oy * (1 - e);
    });
    return t >= 1;
  };
  const unlockFrame = (now: number) => {
    const u = unlockRef.current;
    if (!u) return;
    const dt = Math.max(0.001, Math.min(0.032, (now - u.last) / 1000));
    u.last = now;
    if (u.home !== null) {
      const done = unlockHomeStep(now);
      unlockPaint();
      if (done) { unlockStop(); return; }
    } else {
      unlockStep(dt);
      unlockPaint();
      if (u.still > 0.4) { u.raf = null; return; } // asleep, not stopped
    }
    u.raf = requestAnimationFrame(unlockFrame);
  };

  const [boxAlt, setBoxAlt] = useState(false); // flips each time the shown circle changes, for the alternating box colour
  const [railSide, setRailSide] = useState<"left" | "right">("right"); // side the related-dogs rail sits, flipped when the box is dragged across
  const [entered, setEntered] = useState(false);
  const [falling, setFalling] = useState(false);
  const [dropped, setDropped] = useState(false);

  // Start when the pointer lands on a big circle that has something inside it,
  // send them home when it leaves. Refs and rAF only, no state, so this cannot
  // cause a render and cannot fight the zoom.
  useEffect(() => {
    const u = unlockRef.current;
    // Pointing at one of the circles that popped out still counts as being in
    // the parent. Without this, moving onto a nested circle to read it made the
    // effect think the hover had left, sent everything home under the pointer,
    // and dropped it back on the parent, which started the whole thing again.
    const insideCurrent =
      !!u && u.home === null && !!hovered && hovered !== u.parent && u.inside.has(hovered);
    const live =
      dockAside && !dropped && !!hovered &&
      ((hovered.parent === focus && !!hovered.children?.length) || insideCurrent);
    if (!live) {
      // already home or heading there
      if (u && u.home === null) {
        u.home = performance.now();
        u.last = u.home;
        u.from = u.kids.map((kd) => ({ ox: kd.ox, oy: kd.oy }));
        if (u.raf === null) u.raf = requestAnimationFrame(unlockFrame);
      }
      return;
    }
    // Reading one of the circles inside: leave the unlock exactly as it is.
    // Starting a fresh one on the nested circle would be wrong, and stopping
    // this one would throw everything home.
    if (insideCurrent) return;
    if (u && u.parent === hovered) {
      // came back before it finished going home: pick it up where it is
      if (u.home !== null) {
        u.home = null;
        u.still = 0;
        u.last = performance.now();
        if (u.raf === null) u.raf = requestAnimationFrame(unlockFrame);
      }
      return;
    }
    unlockStop();
    const P = hovered as Node;
    // Ranked by height, so the fan below knows which one is on top.
    const shownKids = (P.children ?? []).filter((n) => !isEcho(n));
    const byHeight = [...shownKids].sort((a, b) => a.y - b.y);
    const mid = (byHeight.length - 1) / 2;
    const kids = shownKids.map((n) => {
      // Two shoves. Outward, along the line from the parent centre through this
      // circle's own centre. And sideways, the fan: the highest circle goes one
      // way and the lowest the other, scaled by how far off the middle it is,
      // so three and four child levels spread rather than needing a rule each.
      const dx = n.x - P.x, dy = n.y - P.y;
      const len = Math.hypot(dx, dy) || 1;
      const sp = UNLOCK_POP * P.r;
      const lean = byHeight.length < 2 ? 0 : (byHeight.indexOf(n) - mid) / Math.max(mid, 0.5);
      return {
        n,
        i: nodes.indexOf(n),
        // itself first, then everything nested inside it, so the whole dog
        // travels as one piece
        els: n.descendants().map((x) => nodes.indexOf(x)).filter((j) => j >= 0),
        ox: 0,
        oy: 0,
        px: 0,
        py: 0,
        vx: (dx / len) * sp - lean * UNLOCK_SIDE * P.r,
        vy: (dy / len) * sp - sp * 0.35, // a touch of lift, so it reads as a hop
      };
    }).filter((kd) => kd.i >= 0);
    if (!kids.length) return;
    unlockRef.current = {
      parent: P,
      kids,
      inside: new Set(P.descendants()),
      raf: null,
      last: performance.now(),
      still: 0,
      home: null,
      from: [],
    };
    unlockRef.current.raf = requestAnimationFrame(unlockFrame);
    // unlockFrame only ever reads refs, so re-running on it would restart the
    // sim on every render for nothing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hovered, focus, dockAside, dropped, nodes]);
  // Never leave a loop running behind us.
  useEffect(() => () => unlockStop(), []);

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
  const railRef = useRef<HTMLDivElement>(null);
  const asideOff = useRef({ x: 0, y: 0 });
  const asideDrag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
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
  // LEARN ONLY: the top-right square goes back to the level's start screen, the
  // one with LEARN and PLAY on it. No confirmation, by request: nothing is at
  // stake in learn, so a prompt would only be in the way. The pit keeps its X and
  // its paused menu, because there a stray tap can cost you a round.
  //
  // It is setLearning(false) without setStarted(true), which is exactly what the
  // PLAY button does minus starting the round, so the view reset below is copied
  // from there rather than reinvented: a zoomed-in focus left behind would make
  // the start screen open inside one circle.
  const backToStartScreen = () => {
    unlockStop();
    setHovered(null);
    setAncestryFor(null);
    setAncHidden(true);
    setTrainHidden(true);
    setTempHidden(true);
    setChumTree(null);
    cancelAnimationFrame(rafRef.current);
    focusRef.current = nodes[0];
    setFocus(nodes[0]);
    const rootV = clampRootView([nodes[0].x, nodes[0].y, nodes[0].r * 2 * (isMobileRef.current ? PAD : ZOOM_PAD) * (dockAside ? PIT_SPAN : 1)]);
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
  type BadgeItem = { pct: number; r: number; label?: string; bomb?: boolean; green?: boolean };
  const [badgePcts, setBadgePcts] = useState<BadgeItem[]>([]);
  // rods and name pills scattered in from the learn layer, pit-style props:
  // sizes are view units frozen at the drop; dead ones keep their slot so the
  // render children stay index-aligned with the bridge lists
  const [rodList, setRodList] = useState<{ len: number; h: number; lit: boolean }[]>([]);
  const [deadRods, setDeadRods] = useState<Set<number>>(new Set());
  const [pillList, setPillList] = useState<{ lines: string[]; w: number; h: number; unit: number }[]>([]);
  const [deadPills, setDeadPills] = useState<Set<number>>(new Set());
  const [toyList, setToyList] = useState<{ kind: ToyKind; size: number; h: number; src: string; filter?: string }[]>([]);
  const [chumList, setChumList] = useState<{ image: string; size: number; name: string }[]>([]);
  const [deadToys, setDeadToys] = useState<Set<number>>(new Set());
  const [britainOpen, setBritainOpen] = useState(false);
  const killToyRef = useRef<((idx: number) => void) | null>(null);
  const throwWatchRef = useRef<((pr: any) => void) | null>(null);
  const checkEscapeRef = useRef<(() => void) | null>(null);
  const flagIdxRef = useRef<number | null>(null);
  // The drawn badge radius for this layout. Mean of the depth-1 circles, so a
  // level with uneven circles gets one consistent badge size rather than a
  // different one per dog.
  const badgeDrawR = useMemo(() => {
    const d1 = nodes.filter((n) => n.depth === 1);
    if (!d1.length) return BADGE_DRAW_R;
    const mean = d1.reduce((acc, n) => acc + n.r, 0) / d1.length;
    // into the space the chip is drawn in, before the fraction means anything
    const drawn = (dockAside ? mean / PIT_SPAN : mean) * BADGE_OF_CIRCLE;
    const r = Math.max(BADGE_MIN_R, Math.min(BADGE_MAX_R, drawn));
    if (!dockAside || level <= 5) return r;
    return r * (1 - ((Math.min(level, 10) - 5) / 5) * BADGE_TRIM);
  }, [nodes, dockAside, level]);
  const badgeDrawRRef = useRef(badgeDrawR);
  useEffect(() => { badgeDrawRRef.current = badgeDrawR; }, [badgeDrawR]);
  useEffect(() => {
    if (!dockAside) return;
    setBadgePcts(
      nodes
        .filter((n) => n.depth === 1)
        .map((n) => {
          const pct = n.parent ? Math.round(((n.value ?? 0) / (n.parent.value || 1)) * 100) : 0;
          return { pct, r: badgeRFor(pct, badgeDrawR) };
        }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, dockAside, badgeDrawR]);
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
  const [learnNode, setLearnNode] = useState<Node | null>(null);
  const [learnCard, setLearnCard] = useState<{ name: string; image: string; x: number; y: number; angle: number; r: number; ring: string } | null>(null);
  const removedNodesRef = useRef<Set<Node>>(new Set());
  const spawnBadgeRef = useRef<((x: number, y: number, r: number, pct: number, opts?: { r?: number; label?: string; charges?: number; green?: boolean }) => void) | null>(null);
  const spawnRodRef = useRef<((x1: number, y1: number, x2: number, y2: number, lit: boolean) => void) | null>(null);
  const spawnPillRef = useRef<((x: number, y: number, w: number, name: string) => void) | null>(null);
  type PropBody = { x: number; y: number; vx: number; vy: number; a: number; idx: number; hits: number; maxHits: number; dead?: boolean; lastKnock?: number; mb?: any; onFloor?: boolean; floorLostAt?: number };
  const rodBodiesRef = useRef<PropBody[]>([]);
  const toyBodiesRef = useRef<PropBody[]>([]);
  const toysGRef = useRef<SVGGElement>(null);
  const chumsGRef = useRef<SVGGElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chumBodiesRef = useRef<any[]>([]);
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
  // How long the green shows before the card leaves, so the state is readable.
  const CHUM_TAKE_MS = 140;
  // Cards taken out of the flood, by index, so the card can go the instant it
  // is collected rather than waiting for the level list to be rebuilt.
  const [chumGone, setChumGone] = useState<Set<number>>(new Set());
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
  const pitBodiesRef = useRef<{ find: (n: Node) => { x: number; y: number; vx: number; vy: number; held?: boolean } | undefined; owned: Set<Node> } | null>(null);
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
  // Whether the last press came from a finger. Touch has no hover, so the whole
  // unlock was invisible on a phone. It now runs off a first tap instead, and
  // this flag keeps the two paths apart: browsers fire a synthetic mouseenter on
  // tap, which would set hovered before the click landed and make the first tap
  // behave like the second, skipping the pop entirely.
  const touchRef = useRef(false);
  // The pit-full wash. Zero when the countdown starts, a tenth more with every
  // second it counts down, solid on nought.
  const [fullAlpha, setFullAlpha] = useState(0);
  const runFallRef = useRef<(() => void) | null>(null);
  const fullTriggeredRef = useRef(false);
  // Set when the countdown was started by a CHUM REACHING THE FLOOR rather than
  // by the pit filling. The two need different endings: a full pit can be
  // emptied, so that countdown is called off, but a chum has already landed and
  // no amount of tidying undoes it. Without this flag the occupancy check would
  // see room in the pit a frame later and cancel a countdown that should stand.
  const floorTriggeredRef = useRef(false);
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

     Worse, a floor-triggered countdown sets `floorTriggeredRef`, which exists
     to stop the pit emptying from calling it off. So once started it could not
     be cancelled by anything. Hence this: one place that ends the round, takes
     down whatever is on screen, and clears both flags. */
  const endPitRound = () => {
    pitEndedRef.current = true;
    if (cdTickRef.current !== null) { window.clearInterval(cdTickRef.current); cdTickRef.current = null; }
    if (cdElRef.current) { cdElRef.current.remove(); cdElRef.current = null; }
    if (cdMidElRef.current) { cdMidElRef.current.remove(); cdMidElRef.current = null; }
    setFullAlpha(0);
    fullTriggeredRef.current = false;
    floorTriggeredRef.current = false;
  };
  const runCountdown = () => {
    // Guarded at the source, not at each caller. The floor collision starts a
    // countdown directly and never consulted the poll, so a guard on the poll
    // alone would have left that path open.
    if (pitEndedRef.current) return;
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
        ? "align-items:flex-start;justify-content:flex-end;padding:18px 18px 0 0;font-size:clamp(3.4rem,13vw,7rem);"
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
      // hold on 0, then GAME OVER, then hand over
      window.setTimeout(() => {
        // Past the point of rescue: nought has landed, so stop listening.
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
        window.setTimeout(() => {
          el.remove(); cdElRef.current = null;
          if (cdMidElRef.current) { cdMidElRef.current.remove(); cdMidElRef.current = null; }
          pitEndedRef.current = true; onPitFull?.();
        }, 1400);
      }, 1200);
    }, 1000);
    cdTickRef.current = tick;
  };
  const shakeInnerRef = useRef<(() => void) | null>(null);
  const fellRef = useRef(false);
  const fallRafRef = useRef(0);
  // The render-side view of a badge body. J17 adds the fuse fields, which the
  // rattle in zoomTo reads: rDraw is the chip's own drawn radius, so the shake
  // is always a fraction of the chip rather than a flat pixel count.
  type BadgeBody = { x: number; y: number; vx: number; vy: number; r: number; pct: number; idx: number; a: number; held?: boolean; bomb?: boolean; blown?: boolean; bursting?: number; rDraw?: number; hits?: number; heldSince?: number; heldHits?: number; clickPending?: boolean };
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
    // TOY RETIREMENT IS PER ROUND, not per tab.
    //
    // It used to live in sessionStorage for the life of the tab, so once you had
    // thrown the ball clear or read the flag's message they were gone until you
    // opened a new tab or remembered ?toys=reset. That is defensible for a
    // player and miserable for anyone testing: every reload of a working tab
    // came up short of half its props, which read as the toys being broken.
    //
    // This component remounts for every level and every retry, so clearing here
    // means a fresh round always brings a full set, while a single round still
    // spends them: throw the ball out and it stays out until the round ends.
    //
    // The cookie panel is NOT cleared here on purpose. It is gated on consent,
    // which is localStorage and permanent, because answering it once is meant to
    // count for good. To see that one again you have to clear site data.
    try { for (const k of Object.values(TOY_GONE_KEY)) sessionStorage.removeItem(k); } catch { /* private mode */ }
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
  const mcReleaseRef = useRef<(() => void) | null>(null);
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
  type UiKind = "close" | "desc" | "learn" | "leave" | "restart";
  type UiBody = { x: number; y: number; vx: number; vy: number; r: number; half: number; a: number; va: number; fixed: boolean; hits: number; kind: UiKind; mb?: unknown; mbIn?: boolean; id?: number; spawned?: boolean };
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
  const uiRefFor = (k: UiKind) =>
    k === "close" ? uiCloseRef : k === "desc" ? uiDescRef : k === "learn" ? uiLearnRef : k === "leave" ? uiLeaveRef : uiRestartRef;
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
    if (raw > 1) console.warn(`[minipit] floor band too short for this era: show ${raw.toFixed(3)} clamped to 1, floor will sit below the target line`);
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
    return d.depth === 0 ? rootImage ?? d.data.img : d.data.img;
  }
  function fillFor(d: Node): string {
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
    const t = 0.4;
    const up = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16))
      .map((v) => Math.round(v + (255 - v) * t));
    return "#" + up.map((v) => v.toString(16).padStart(2, "0")).join("");
  }
  function strokeColorFor(d: Node): string {
    if (strokeByDepth) {
      const base = ["#ffd23e", "#0a3a57", "#5cc4ee", "#ffffff"][(d.depth - 1 + 4) % 4];
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
            `translate(${(b.x - v[0]) * k},${(b.y - v[1]) * k}) rotate(${b.a * 57.2958})${sc !== 1 ? ` scale(${sc})` : ""}`
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
      }
    }
    for (const [listRef, gRef] of [[rodBodiesRef, rodsGRef], [pillBodiesRef, pillsGRef], [toyBodiesRef, toysGRef], [chumBodiesRef, chumsGRef], [btnBodiesRef, btnsGRef]] as const) {
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
      if (c) {
        c.setAttribute("display", isWordNode ? "none" : "inline");
        c.setAttribute("transform", `translate(${tx},${ty})`);
        c.setAttribute("r", String(drawR(d, v, k)));
        // The radius is scaled by the view but the stroke was not, so a circle
        // drawn small kept a full-size ring and read as heavy. Scale both.
        c.setAttribute("stroke-width", String(strokeWidthFor(d) * strokeK(v)));
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
    let target: View = [d.x, d.y, dockAside && d !== nodes[0] ? d.r * 2 : d.r * 2 * (isMobileRef.current ? PAD : ZOOM_PAD) * (dockAside && d === nodes[0] ? PIT_SPAN : 1)];
    if (d === nodes[0]) target = clampRootView(target);
    if (d === nodes[0]) homeWRef.current = target[2];
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    cancelAnimationFrame(rafRef.current);
    if (reduce) {
      zoomTo(target);
      // Same refit as the animated path below, for the same reason.
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
      setViewTick((n) => n + 1);
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
      // The circle's own size, not the word's. In the pit the tapped element is
      // the name, so its width is a name's width and reading the rect would
      // hand the next layer a card as wide as the longest breed name. The pit
      // froze pixels-per-world at drop time, so the true radius is that.
      r: fellRef.current && d.depth === 1 ? d.r * (fxPxPerWorldRef.current || 1) : cr.width / 2,
      ring: strokeColorFor(d), // the lifted dog keeps the ring it wore in the pit
    });
    setLearnNode(d);
    return true;
  }

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
    // A circle that has come loose is not where the layout says it is, and
    // zoom() reads d.x and d.y. Put everything back first, or clicking a
    // fallen circle flies the view to its packed position.
    unlockStop();
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

    const v: View = clampRootView([nodes[0].x, nodes[0].y, nodes[0].r * 2 * (isMobile ? PAD : ZOOM_PAD) * (dockAside ? PIT_SPAN : 1)]);
    homeWRef.current = v[2];
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
      const { Engine, Bodies, Body: MBody, Composite, Events, Mouse, MouseConstraint } = Matter;
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
      fxPxPerWorldRef.current = pxPerWorld; // J17: the effects layer's pixel-to-world scale
      fxFromPxRef.current = worldFromPx;
      const fx = createPitEffects(FX_SCALE);
      fxKitRef.current = fx;
      const stagePxH = worldH * pxPerWorld;
      // old world-units-per-second speeds (in worldH multiples) -> px per 16.66ms step
      const vps = (x: number) => (stagePxH * x) / 60;

      type Body = { n: Node | null; x: number; y: number; vx: number; vy: number; r: number; pct: number; idx: number; lastFx: number; popped: boolean; a: number; va: number; ia: number; iva: number; held?: boolean; charges?: number; lastKnock?: number; inert?: boolean; mb?: any; mbIn?: boolean; bomb?: boolean; blown?: boolean; bursting?: number; fuseCur?: number; rDraw?: number; hits?: number; heldSince?: number; heldHits?: number; clickPending?: boolean };
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
      // yellow % badges become small bodies, spawned at each circle's lower-right rim
      const BADGE_R = badgeDrawRRef.current / k;
      const badges: Body[] = d1.map((n, i) => ({
        // bottom LEFT of the circle: the right side is where the level's own
        // furniture sits, and a badge there crowded it
        n: null, x: n.x - n.r * 0.707, y: n.y + n.r * 0.707, vx: 0, vy: 0,
        r: badgeRFor(pctOf(n), BADGE_R), rDraw: badgeRFor(pctOf(n), badgeDrawRRef.current), pct: pctOf(n), idx: i, lastFx: 0, popped: true, a: 0, va: 0, ia: 0, iva: 0, charges: 20,
      }));
      badgeBodiesRef.current = badges;

      // ---- Matter world ----
      const engine = Engine.create();
      engine.gravity.y = 1; // pit verbatim
      const world = engine.world;
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
      const BADGE_OPTS = { restitution: 0.48, friction: 0.1, frictionAir: 0.01, density: 0.001 };
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
        const ux = v[0] + (xMinF + vbWf - m - uSz / 2) / k;
        uiBodiesRef.current = [
          { x: ux, y: v[1] + (-vbHf / 2 + m + uSz / 2) / k, vx: 0, vy: 0, r: (uSz / 2) * 1.1 / k, half: uSz / 2, a: 0, va: 0, fixed: true, hits: 0, kind: "close" },
          { x: ux, y: v[1] + (-vbHf / 2 + m + uSz * 1.5 + 14 * uppW) / k, vx: 0, vy: 0, r: (uSz / 2) * 1.1 / k, half: uSz / 2, a: 0, va: 0, fixed: true, hits: 0, kind: "desc" },
          { x: ux, y: v[1] + (-vbHf / 2 + m + uSz * 1.5 + 14 * uppW) / k, vx: 0, vy: 0, r: (uSz / 2) * 1.1 / k, half: uSz / 2, a: 0, va: 0, fixed: true, hits: 0, kind: "learn" },
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
            const u: UiBody = { x: ax, y: ay, vx: 0, vy: 0, r: (uSz / 2) * 1.1 / k, half: uSz / 2, a: 0, va: 0, fixed: false, hits: 5, kind, id, spawned: true };
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
      const uiBodies = uiBodiesRef.current;
      /* Which squares belong to the pit menu rather than the corner. Their
         bodies are built like any other, but they are held out of the world
         until the menu opens: a body outside the world collides with nothing,
         which is exactly what an off-screen control should do. */
      const isMenuKind = (k: string) => k === "leave" || k === "restart";
      for (const u of uiBodies as any[]) {
        const p = pxFromWorld(u.x, u.y);
        const um = Bodies.circle(p.x, p.y, Math.max(2, u.r * pxPerWorld), { isStatic: u.fixed, restitution: 0.3, frictionAir: 0.012, density: 0.0012 });
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
        const kids = (b.n.children ?? []).filter((ch) => !isEcho(ch));
        if (!kids.length) { b.popped = true; continue; }
        const wmb = b.mb; // narrowed and stable for the closure below
        // the word plus everything freed under it, immune to each other briefly
        const newMbs = [wmb];
        kids.forEach((ch) => {
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
              r: badgeRFor(pctOf(ch), BADGE_R), rDraw: badgeRFor(pctOf(ch), badgeDrawRRef.current),
              pct: pctOf(ch), idx: bl.length, lastFx: 0, popped: true,
              a: 0, va: 0, ia: 0, iva: 0, charges: 20, bomb: kidBomb,
            };
            bl.push(kb);
            all.push(kb);
            const mbb = mkCircle(kb, "badge", BADGE_OPTS);
            MBody.setVelocity(mbb, { x: cmb.velocity.x * 0.8 + (Math.random() - 0.5) * vps(0.3), y: cmb.velocity.y * 0.8 });
            newMbs.push(mbb);
            setBadgePcts((l) => [...l, { pct: kb.pct, r: badgeRFor(kb.pct, badgeDrawRRef.current), bomb: kidBomb }]);
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
          if (isEcho(ch)) continue;
          // Grown once, then floored. b.popped guards popChildren against a
          // second run, so this cannot compound down a deep tree. The floor is
          // given in screen pixels and converted here, because the packed radii
          // are world units and the difficulty slider changes what a world unit
          // is worth: a fixed world figure would be the wrong size at one end of
          // the slider or the other.
          ch.r = Math.max(ch.r * POP_GROW, POP_MIN_PX / 2 / pxPerWorld);
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
            const bb: Body = { n: null, x: ch.x - ch.r * 0.6, y: ch.y + ch.r * 0.6, vx: 0, vy: 0, r: badgeRFor(pctOf(ch), BADGE_R), rDraw: badgeRFor(pctOf(ch), badgeDrawRRef.current), pct: pctOf(ch), idx: bl.length, lastFx: 0, popped: true, a: 0, va: 0, ia: 0, iva: 0, charges: 20, bomb: popBomb };
            bl.push(bb);
            all.push(bb);
            const mbb = mkCircle(bb, "badge", BADGE_OPTS);
            MBody.setVelocity(mbb, { x: mb.velocity.x * 0.8 + (Math.random() - 0.5) * vps(0.3), y: mb.velocity.y * 0.8 });
            newMbs.push(mbb);
            setBadgePcts((l) => [...l, { pct: bb.pct, r: badgeRFor(bb.pct, badgeDrawRRef.current), bomb: popBomb }]);
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
          // the bone reads at the stick's width: both are elongated props, and
          // its 2.05 aspect makes it twice the stick's depth, so it lands as a
          // substantial object rather than a twig
          : kind === "bone" ? ballDia * 1.6
          // Era props. The newspaper is a long roll so it takes the stick's
          // length; the fork and the shoe are hand-sized, so they read at the
          // ball's width like the rock does.
          : kind === "newspaper" ? TOY_NEWSPAPER_W
          : kind === "fork" ? ballDia * 1.15
          : kind === "shoe" ? TOY_SHOE_W
          : BIGT * 0.6 * 2;
        const hgt = kind === "stick" || kind === "stickBig" ? dia / STICK_ASPECT : kind === "rock" ? dia / ROCK_ASPECT : kind === "cookies" ? dia / COOKIES_ASPECT : kind === "bone" ? dia / BONE_ASPECT
          : kind === "newspaper" ? dia / TOY_NEWSPAPER_ASPECT
          : kind === "fork" ? dia / TOY_FORK_ASPECT
          : kind === "shoe" ? dia / TOY_SHOE_ASPECT
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
          kind === "ball" || kind === "ballPink" ? { restitution: 0.97, friction: 0.05, frictionAir: 0.003, density: 0.0006 } // pit: super bouncy
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
            if (spent >= BALL_PINK_LIVES) retireToyForEra(TOY_BALL_PINK_GONE_KEY, era);
            else toyTimers.push(window.setTimeout(() => spawnToy("ballPink"), BALL_PINK_BACK));
            return;
          }
          if (ERA_SCOPED_TOYS.includes(pr.toyKind)) retireToyForEra(TOY_GONE_KEY[pr.toyKind as ToyKind], era);
          else retireToy(TOY_GONE_KEY[pr.toyKind as ToyKind]);
          killProp(pr, "toy", performance.now());
        }
      };
      removeChumBodyRef.current = (mb) => { Composite.remove(world, mb); };
      killToyRef.current = (idx: number) => {
        const pr = toyBodiesRef.current[idx];
        if (pr && !pr.dead) killProp(pr, "toy", performance.now());
      };
      const armToys = () => {
        if (toyTimers.length) return; // first landing only
        toyTimers.push(window.setTimeout(() => spawnToy("cookies"), TOY_COOKIES_DELAY));
        // Both tennis balls are hidden on the first seven levels. levelNo is the
        // 0-based findIndex into the play-card list (BreedStrip), so the on-screen
        // levels 1 to 7 are levelNo 0 to 6 here. NOT `level`, which in this file is
        // the difficulty slider. TOY_BALL_DELAY is left alone: the flag and the era
        // props are timed off it, so skipping the balls shifts nothing else. With
        // no pink ball spawned its return path (BALL_PINK_BACK, above) never runs,
        // because that only fires for a pink body that was thrown out the top.
        const hideBalls = levelNo !== undefined && levelNo <= 6;
        if (!hideBalls) {
          toyTimers.push(window.setTimeout(() => spawnToy("ball"), TOY_BALL_DELAY));
          toyTimers.push(window.setTimeout(() => spawnToy("ballPink"), TOY_BALL_DELAY + BALL_PINK_GAP));
        }
        // With the balls hidden, everything after cookies is pulled earlier to
        // close the ~3s the two balls left, and the bone moves to AFTER the flood
        // (see below). Cookies is untouched at 2.0s. The rock keeps its 0.5s gap
        // after the sticks (TOY_ROCK_GAP) in both cases; the flag and stick times
        // are what differ.
        const NOBALLS_FLAG_AT = 3000;    // flag lands at 3.0s, in the balls' old slot
        const NOBALLS_STICKS_AT = 4300;  // the two sticks at 4.3s
        const flagAt = hideBalls ? NOBALLS_FLAG_AT : TOY_BALL_DELAY + TOY_FLAG_GAP;
        toyTimers.push(window.setTimeout(() => spawnToy("flag"), flagAt));
        const propsAt = hideBalls ? NOBALLS_STICKS_AT : flagAt + TOY_PROP_GAP;
        /* THE PROPS SLOT, from the level's theme. An era with no set of its own
           gets the stick, big stick and rock, which is what every era had.
           The first two arrive together and the rest follow at the rock's gap,
           so a set of any length keeps the original rhythm: a pair thumps in,
           then the stragglers land one after another rather than in a heap. */
        /* Most specific wins: this level's own set, then the era's, then the
           pit's default three. */
        const byLevel = levelName ? levelTheme?.propsByLevel?.[levelName] : undefined;
        const props: ToyKind[] = byLevel?.length
          ? (byLevel as ToyKind[])
          : levelTheme?.props?.length
            ? (levelTheme.props as ToyKind[])
            : DEFAULT_PROPS;
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
        // The flood is derived from the ROCK, not the bone, because the bone is no
        // longer always before it. With balls this still lands at 9.0s (rock 7.5 +
        // bone 0.9 + chum 0.6). With balls hidden the flood arrives on the SAME
        // beat as the rock, deliberately.
        const chumsAt = hideBalls ? rockAt : rockAt + TOY_BONE_GAP + CHUM_GAP;
        // Bone: before the flood with balls, at its old 8.4s. With balls hidden it
        // moves to 1.5s AFTER the flood, at 6.3s.
        const NOBALLS_BONE_AFTER_FLOOD = 1500;
        const boneAt = hideBalls ? chumsAt + NOBALLS_BONE_AFTER_FLOOD : rockAt + TOY_BONE_GAP;
        const floodMid = chumsAt + ((chumImagesRef.current?.length ?? 0) * CHUM_STAGGER) / 2;
        props.forEach((kind: ToyKind, i: number) => {
          const at =
            kind === PROP_IN_FLOOD ? floodMid
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
        const pw = Math.max(44, Math.max(...lines.map((l) => l.length)) * 7.4 + 14 + (lines.length > 1 ? 10 : 0));
        const ph = lines.length > 1 ? 40 : 22;
        const pr = { x: w.x, y: w.y, vx: 0, vy: 0, a: 0, idx: pillBodiesRef.current.length, hits: 0, maxHits: 2, mb: null as any };
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
        setPillList((l) => [...l, { lines, w: pw * fxScale, h: ph * fxScale, unit: 13 * fxScale }]);
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
        opts?: { r?: number; label?: string; charges?: number; green?: boolean }
      ) => {
        // client px in, which is the physics space itself now
        const bl = badgeBodiesRef.current;
        if (!bl) return;
        const w = worldFromPx(sx, sy);
        // A solo dog circle brings its own radius. Everything else is a
        // percentage chip and is sized by its figure, bombs included: in the
        // main pit a bomb IS a percentage circle and only its sprite differs.
        const rDraw = opts?.r ?? badgeRFor(pctVal, badgeDrawRRef.current);
        // A solo dog circle arrives through this same call carrying a label,
        // and that one is never a bomb: it is a whole breed, not a chip.
        const isBomb = !opts?.label && rollBomb();
        const nb: Body = { n: null, x: w.x, y: w.y, vx: 0, vy: 0, rDraw, r: rDraw / kD, pct: pctVal, idx: bl.length, lastFx: 0, popped: true, a: 0, va: 0, ia: 0, iva: 0, charges: opts?.charges ?? 20, bomb: isBomb };
        bl.push(nb);
        all.push(nb);
        const mb = mkCircle(nb, "badge", BADGE_OPTS);
        MBody.setVelocity(mb, { x: (Math.random() - 0.5) * 3, y: 3 }); // pit scatter contract, verbatim
        setBadgePcts((l) => [...l, { pct: pctVal, r: rDraw, label: opts?.label, bomb: isBomb, green: opts?.green }]);
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
      const killChained = (mb: MB, now2: number) => {
        const p = mb.plugin || {};
        if (p.kind === "badge") {
          const br = p.bridge;
          if (!br || br.blown) return 0;
          br.blown = true;
          poofAt(br.x, br.y, now2);
          if (br.mb && br.mbIn) { Composite.remove(world, br.mb); br.mbIn = false; }
          setDeadBadges((q) => new Set(q).add(br.idx));
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
          if (b.mbIn) { Composite.remove(world, bombMb); b.mbIn = false; }
          setDeadBadges((q) => new Set(q).add(b.idx));
          const live = (Composite.allBodies(world) as MB[]).filter((o) => !o.isStatic && o !== bombMb);
          const touch = (m1: MB, m2: MB) =>
            Math.hypot(m1.position.x - m2.position.x, m1.position.y - m2.position.y) <= radOf(m1) + radOf(m2) + 10;
          const pool = live.filter((o) => {
            const k2 = o.plugin?.kind;
            if (k2 === "badge") return !o.plugin?.bridge?.bomb && !o.plugin?.bridge?.blown;
            return k2 === "rod" || k2 === "pill";
          });
          const claimed = new Set<MB>();
          let frontier = pool.filter((o) => touch(o, bombMb));
          frontier.forEach((o) => claimed.add(o));
          const chain: MB[] = [];
          let hops = 0;
          while (frontier.length) {
            chain.push(...frontier);
            hops += 1;
            if (hops >= BOMB_CHAIN_HOPS) break;
            const prev = frontier;
            frontier = pool.filter((o) => !claimed.has(o) && prev.some((f) => touch(f, o)));
            frontier.forEach((o) => claimed.add(o));
          }
          chain.forEach((o, i) => {
            toyTimers.push(window.setTimeout(() => {
              const t2 = performance.now();
              fx.explodeAt(o.position.x, o.position.y, radOf(o) * (1 + (o.plugin?.bridge?.pct || 0) / 25) * FX_SCALE);
              fxKickRef.current?.();
              const val = killChained(o, t2);
              if (val) {
                const w2 = worldFromPx(o.position.x, o.position.y);
                numAt(w2.x, w2.y, val, t2);
              }
              wake();
            }, BOMB_CHAIN_MS * (i + 1)));
          });
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
          if (!fullTriggeredRef.current) {
            const chumHitFloor =
              (pa.kind === "chum" && pb2.kind === "floor") ||
              (pb2.kind === "chum" && pa.kind === "floor");
            if (chumHitFloor) {
              fullTriggeredRef.current = true;
              floorTriggeredRef.current = true;
              runCountdown();
            }
          }
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
            // statics do not count, pit rule
            if (!otherMb.isStatic) {
              const rock = otherMb.plugin?.prop?.toyKind === "rock";
              knockBadge(b, rv, now, rock ? ROCK_KNOCK : 1);
            }
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
      const checkFull = (now: number) => {
        if (now - fullClock < 4000 || now <= cdGraceRef.current) return;
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
        const occupy = (x: number, y: number, r: number, vx: number, vy: number, held?: boolean) => {
          if (held) return;
          if (Math.hypot(vx, vy) > worldH * 0.03) return;
          if (y - r < zoneY) { inZone++; spans.push([x - r, x + r]); }
        };
        for (const b of all) occupy(b.x, b.y, b.r, b.vx, b.vy, b.held);
        // The CHUM CARDS count too. They never did, because `all` is only the
        // level's own dogs and their chips, and the chums live in their own
        // list. On a two-circle level that left the test looking at four
        // objects while the screen filled with seventeen chum cards, so a pit
        // that was visibly stuffed never reached the threshold and the
        // countdown never started. Their body is a square of side `dia`, so
        // half of that is the radius the span wants. Their world radius is
        // recovered from the drawn size the same way everything else here is.
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
        // the real distance between the walls, not the viewBox, which reaches
        // well past the visible stage
        const pitW = (xR - xL) || 1;
        const blocked = spans.length > 0 && covered / pitW >= PIT_FULL_COVER;
        const full = blocked || inZone >= 5;
        if (full && !fullTriggeredRef.current) {
          fullTriggeredRef.current = true;
          runCountdown();
        } else if (!full && fullTriggeredRef.current && !floorTriggeredRef.current) {
          // ROOM AGAIN, so the countdown is called off mid-count, exactly as
          // the main pit does it: collect the dogs or throw the toys out and
          // the digits go away.
          //
          // Written out here rather than as a helper on purpose. A plain
          // function in the COMPONENT BODY that touches refs and setState
          // reads as render work to the compiler. This is safe because it
          // lives inside the sim effect, not the body, and is only ever
          // reached from the loop or the poll, both of which are effects.
          if (cdTickRef.current !== null) { window.clearInterval(cdTickRef.current); cdTickRef.current = null; }
          if (cdElRef.current) { cdElRef.current.remove(); cdElRef.current = null; }
          if (cdMidElRef.current) { cdMidElRef.current.remove(); cdMidElRef.current = null; }
          setFullAlpha(0);
          fullTriggeredRef.current = false;
          // Paired with the flag above: this branch only runs for a pit-full
          // countdown, but clearing both keeps the two in step if the cancel
          // ever gets another caller.
          floorTriggeredRef.current = false;
          // The same 2.5s grace the main pit allows, so clearing one object
          // cannot leave the digits flickering on and off at the threshold.
          cdGraceRef.current = now + 2500;
        }
      };
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
          for (const mb of Composite.allBodies(world) as { isStatic?: boolean; position: { x: number; y: number } }[]) {
            if (mb.isStatic) continue;
            if (mb.position.y <= escapeY) continue;
            const backX = pL.x + 30 + Math.random() * Math.max(1, wPx - 60);
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
          else if (!b.held && !b.mbIn) {
            MBody.setPosition(b.mb, pxFromWorld(b.x, b.y));
            MBody.setVelocity(b.mb, { x: 0, y: 0 });
            Composite.add(world, b.mb);
            b.mbIn = true;
          }
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
        for (const list of [rodBodiesRef.current, pillBodiesRef.current, toyBodiesRef.current, chumBodiesRef.current]) {
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
          if (u.mbIn === false) continue;
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
        zoomTo(viewRef.current, now);
        drawNumbers(now, viewRef.current);
        checkFull(now);
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
        for (const b of all) if (b.mb && b.mbIn && !b.held) {
          MBody.setVelocity(b.mb, { x: (Math.random() - 0.5) * 18, y: -(8 + Math.random() * 14) });
        }
        const uu = uiBodiesRef.current as any[] | null;
        if (uu) for (const u of uu) if (!u.fixed && u.mb) {
          MBody.setVelocity(u.mb, { x: (Math.random() - 0.5) * 16, y: -(7 + Math.random() * 12) });
        }
        for (const list of [rodBodiesRef.current, pillBodiesRef.current, toyBodiesRef.current, chumBodiesRef.current]) {
          for (const pr of list) if (!pr.dead && pr.mb) MBody.setVelocity(pr.mb, { x: (Math.random() - 0.5) * 16, y: -(7 + Math.random() * 12) });
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
        const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, render: { visible: false } } });
        Composite.add(world, mc);
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
        const onStartDrag = (ev: { body?: { plugin?: { kind?: string } } }) => {
          if (!MC_KINDS.has(ev?.body?.plugin?.kind ?? "")) { mc.constraint.bodyB = null; mc.body = null; }
        };
        // A thrown toy retires itself once it is clear of the pit. The old path
        // fired this from startDrag's pointer up; the constraint has its own
        // release event, so it hangs off that instead.
        const onEndDrag = (ev: { body?: { circleRadius?: number; plugin?: { prop?: unknown } } }) => {
          const prop = ev?.body?.plugin?.prop;
          if (prop && ev.body?.circleRadius) throwWatchRef.current?.(prop);
        };
        Events.on(mc, "enddrag", onEndDrag);
        mcReleaseRef.current = () => { mc.constraint.bodyB = null; mc.body = null; mouse.button = -1; };
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
        const onDown = (e: PointerEvent) => { setPos(e.clientX, e.clientY); mouse.button = 0; wake(); };
        const onMove = (e: PointerEvent) => { if (mouse.button === 0) { setPos(e.clientX, e.clientY); wake(); } };
        const onUp = () => { mouse.button = -1; };
        st.addEventListener("pointerdown", onDown);
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
        mcTeardown = () => {
          mcReleaseRef.current = null;
          Events.off(mc, "startdrag", onStartDrag);
          Events.off(mc, "enddrag", onEndDrag);
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
  useEffect(() => {
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
  // The running total for the corner. It lives in LineageModal, which is keyed
  // per level and remounts, so it starts each level at nothing.
  const chumsCollected = collectedChums?.size ?? 0;
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
    const GAP = 10;
    // Each card's natural max width, so placement matches what actually renders.
    const widths = [Math.min(vw * 0.88, 330), Math.min(vw * 0.92, 218), Math.min(vw * 0.92, 218)];
    let cardW = Math.round(widths[index] ?? 218);
    if (!r) return { left: 8, top: Math.round(vh * 0.28), width: cardW };
    // Cards open BELOW the main box so they never cover it, and stay clear of
    // the pack rail so they never cover that either, with GAP px of breathing
    // room from both. Each card cascades down a little from the last.
    const rail = railRef.current?.getBoundingClientRect();
    let left = Math.round(r.left);
    if (rail && rail.width > 0) {
      if (rail.left >= r.right - 1) {
        // Rail on the right: keep the card's right edge left of it.
        const maxRight = rail.left - GAP;
        cardW = Math.min(cardW, Math.round(maxRight - 8));
        if (left + cardW > maxRight) left = Math.round(maxRight - cardW);
      } else if (rail.right <= r.left + 1) {
        // Rail on the left: start the card to the right of it.
        left = Math.max(left, Math.round(rail.right + GAP));
      }
    }
    // Two per row where the screen allows it, so a second card opens BESIDE the
    // first rather than 40px down and on top of it. That 40px cascade was the
    // whole reason they buried each other.
    const perRow = vw >= 2 * 180 + 3 * GAP ? 2 : 1;
    if (perRow === 2) cardW = Math.min(cardW, Math.floor((vw - 3 * GAP) / 2));
    const col = index % perRow;
    const row = Math.floor(index / perRow);
    left = left + col * (cardW + GAP);
    if (left + cardW > vw - 8) {
      cardW = Math.min(cardW, vw - 16);
      left = Math.max(8, vw - 8 - cardW);
    }
    if (left < 8) left = 8;
    // ROW_H is an estimate, not a measurement: cardSpot runs at open time,
    // before the card exists, so its real height cannot be read. Measuring it
    // would mean opening, measuring and moving, which flickers. 210 is the
    // tallest of the three at its widest.
    const ROW_H = 210;
    let top = Math.round(r.bottom + GAP + row * (ROW_H + GAP));
    // Never start a card below the screen. This is what put them off the bottom:
    // the top was taken off the info box, which sits low, with nothing checking
    // the result was still visible.
    const MIN_VISIBLE = 150;
    top = Math.min(top, Math.max(8, vh - MIN_VISIBLE));
    return { left, top, width: cardW };
  };
  // While a circle is hovered, hide the circles nested inside it so its own
  // image comes clear to the front instead of being covered by its progenitors.
  // Moving onto one of those inner circles re-hovers it and brings it back:
  // a buried circle goes to opacity 0 but KEEPS its hit area, which is what
  // makes that return trip possible. It used to lose pointer-events too, so the
  // pointer could never reach a nested circle once its parent was hovered, and
  // every click landed on the parent instead. On an already-focused parent that
  // reads as a zoom out, which is what a nest of children looked like.
  // Not for a first-ring circle in the mini pit. Hovering one of those is about
  // to mean "come loose and move", so hiding what is inside it is the opposite
  // of what we want. Deeper circles keep the old behaviour: hover one and the
  // circles nested in it get out of the way of its own image.
  // Keyed on parent === focus rather than depth === 1, so it still means "the
  // big circles you are looking at" after you have zoomed into one.
  const firstRingHover = !!hovered && dockAside && hovered.parent === focus;
  const buriedSet = hovered && !dropped && !firstRingHover ? new Set(hovered.descendants()) : null;
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
      <div className={`${styles.stage}${dockAside ? " " + styles.stageDocked : ""}`} ref={stageRef}>
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
          {dockAside && gravity && !started && focus.depth === 0 && (() => {
            const outer = nodes.filter((d) => d.depth === 1);
            if (!outer.length) return null;
            const enc = packEnclose(outer.map((d) => ({ x: d.x, y: d.y, r: d.r })));
            if (!enc) return null;
            const v = viewRef.current;
            const k = SIZE / v[2];
            const cx = (enc.x - v[0]) * k;
            const cy = (enc.y - v[1]) * k;
            const R = enc.r * k * 1.02; // a hair outside the outermost circles
            const swRing = Math.max(2, R * 0.012); // ring weight, tune on its own
            const swLine = Math.max(8, R * 0.048); // line weight, 4x the ring's slope
            const dash = `${R * 0.05} ${R * 0.045}`; // ring dash, R-derived, left as is
            // Line dash off its OWN stroke so it scales with the 4x weight. Butt
            // caps below, not round: round caps at 8px added half the width to
            // each dash end and closed the gaps into blobs. 2.2 dash, 1.6 gap
            // reads as a proper dashed line rather than a row of lozenges.
            const dashLine = `${swLine * 2.2} ${swLine * 1.6}`;
            // The portrait sits near the top-left corner of the pit; anchor there.
            const ax = xMin + vbW * 0.07;
            const ay = -vbH / 2 + vbH * 0.09;
            const dx = ax - cx, dy = ay - cy;
            const len = Math.hypot(dx, dy) || 1;
            const ex = cx + (dx / len) * R;
            const ey = cy + (dy / len) * R;
            return (
              <g pointerEvents="none" aria-hidden="true">
                <line x1={ax} y1={ay} x2={ex} y2={ey} stroke="#ffffff" strokeWidth={swLine} strokeDasharray={dashLine} />
                <circle cx={cx} cy={cy} r={R} fill="none" stroke="#ffffff" strokeWidth={swRing} strokeDasharray={dash} />
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
          <g ref={circlesRef}>
            {nodes.map((d, i) => {
              // The outer breed circle (root) is hidden so only the ancestor
              // circles inside it show. It stays in the DOM (rendered invisible
              // and non-interactive) so the index alignment used by zoomTo holds.
              const hidden = d.depth === 0 || isEcho(d);
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
              const buried = (!!buriedSet && d !== hovered && buriedSet.has(d)) || heldHidden;
              const circleEl = (
                <circle
                  data-n={i}
                  className={cls}
                  fill={hidden ? "none" : nodeImg(d) ? `url(#bt-img-${i})` : fillFor(d)}
                  stroke={hidden ? "none" : strokeColorFor(d)}
                  strokeWidth={hidden ? 0 : strokeWidthFor(d) * strokeK(viewRef.current)}
                  style={{
                    // Inline would beat the cursor class, so only the two cases
                    // that have no class of their own are set here.
                    cursor: hidden ? "default" : curCls ? undefined : "pointer",
                    // An invisible circle must not take the press. Collected
                    // dogs stay in the DOM at opacity 0, and since J2 they stay
                    // for the rest of the level, so they were littering the pit
                    // with grabbers you could not see.
                    // heldHidden, not buried: a collected or lifted dog must
                    // not take the press, but a circle buried under a hovered
                    // parent must, or you can never reach it.
                    pointerEvents: hidden || heldHidden ? "none" : "auto",
                    opacity: buried ? 0 : undefined,
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

                    // Latched: while a big circle is unlocked, the circles
                    // tumbling inside it must not steal the hover. One of them
                    // sliding under a still pointer would end the hover on the
                    // parent, send everything home, put the pointer back over
                    // the parent, and start it again. That is an endless loop.
                    // The latch only holds WHILE they are moving. u.raf goes
                    // null once the sim reports rest, and nothing can drift
                    // under a still pointer after that, so a deliberate move
                    // onto a nested circle has to be let through. Without the
                    // raf test the title and the rail stayed stuck on the
                    // parent no matter which circle inside it you pointed at.
                    const u = unlockRef.current;
                    if (u && u.raf !== null && d !== u.parent && u.inside.has(d)) return;
                    setHovered(d);
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
                    if (rt && asideRef.current?.contains(rt)) return;
                    // The circles inside this one are SIBLINGS in the SVG, not
                    // descendants, so moving onto one fires a real mouseleave
                    // here. Ignore it, or the unlock stops the moment anything
                    // drifts under the pointer.
                    const ri = rt?.getAttribute?.("data-n");
                    if (ri !== null && ri !== undefined) {
                      const rn = nodes[Number(ri)];
                      if (rn && rn !== d && d.descendants().includes(rn)) return;
                    }
                    setHovered((h) => (h === d ? null : h));
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
                            const d1s = nodes.filter((n) => n.depth === 1);
                            const ci = d1s.indexOf(d);
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
                />
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
              const visible = (isInside || isLeafFocus) && !labelBuried && !hidden;
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
                      if (!fit.fits) return null;
                      const lines = fit.lines;
                      const fs = Math.max(10, Math.min(cap, fit.fs + TITLE_BOOST));
                      return (
                        <text
                          x={0}
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
                          transform={`rotate(${TITLE_ANGLE} 0 ${titleDy(rFit)})`}
                          style={{
                            fill: d === hovered ? "var(--yellow, #ffd23e)" : "#ffffff",
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
                            <tspan key={li} x={0} dy={li === 0 ? 0 : `${LABEL_LINE_H}em`}>{line}</tspan>
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
              return (
                <g key={i}>
                  {circleEl}
                  {labelEl}
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
              const bx = b ? b.x : d1n ? d1n.x - d1n.r * 0.707 : v[0];
              const by = b ? b.y : d1n ? d1n.y + d1n.r * 0.707 : v[1] - 99999;
              const inert = inertBadges.has(i);
              if (deadBadges.has(i)) return <g key={i} style={{ display: "none" }} />;
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
                /* A learnt chip keeps the green it wore on the learn layer, and
                   takes a white ring and white figure with it. Yellow chips are
                   untouched: white on yellow would not be readable. */
                <circle cx={0} cy={0} r={item.r} style={{ fill: inert ? "#0c5b92" : item.green ? "#22c55e" : item.label ? "#5cc4ee" : "#ffd23e", stroke: item.green ? "#ffffff" : "#0a3a57", strokeWidth: item.r * (item.label ? 0.225 : 0.19) }} />
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
                  <text x={0} y={0} dominantBaseline="central" style={{ fill: item.green ? "#ffffff" : "#0a3a57", fontFamily: "Montserrat, var(--font-body), system-ui, sans-serif", fontWeight: 800, fontSize: `${item.r * 0.7}px`, pointerEvents: "none", userSelect: "none" }}>
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
                    <image href={ty.src} x={-half} y={-ty.h / 2} width={ty.size} height={ty.h}
                      style={ty.filter ? { filter: ty.filter } : undefined} />
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
                    // Second tap on the armed card: taken.
                    setArmedChum(null);
                    setTakenChum(i2);
                    // Out of the physics world first, so nothing can knock a
                    // card that is already on its way to being collected.
                    const b = chumBodiesRef.current[i2];
                    if (b?.mb) { try { removeChumBodyRef.current?.(b.mb); } catch { /* already gone */ } }
                    // Off it goes to the corner. It leaves the list when it
                    // lands, not now, so the flight has something to draw.
                    chumFlyRef.current.set(i2, {
                      t0: performance.now(),
                      spin: (Math.random() < 0.5 ? -1 : 1) * (200 + Math.random() * 160),
                      tx: 0, ty: 0, got: false,
                    });
                    window.setTimeout(() => {
                      if (chumFlyRaf.current == null) chumFlyRaf.current = requestAnimationFrame(stepChumFly);
                    }, CHUM_TAKE_MS);
                    // Counted straight away, so the box pops and the number
                    // climbs as the card sets off, not when it lands.
                    onChumCollected?.(cm.name);
                    flashCorner();
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
                  <rect x={-pl.w / 2} y={-pl.h / 2} width={pl.w} height={pl.h} rx={pl.h / 2}
                    style={{ fill: "#0a3a57", stroke: "rgba(255,255,255,0.85)", strokeWidth: pl.unit * 0.154 }} />
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
            const defs: { kind: UiKind; wx: number; wy: number; a: number }[] = kinds.map((kind, idx) => {
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
            // A spawned pair square: same rect + glyph the corner squares wore,
            // but keyed per instance and positioned by the frame loop via the
            // pairsGRef container. Any leave leaves, any restart rewinds; there
            // is no dismiss, so the pile only grows (up to the cap) until you use
            // one, or the level changes and the whole component remounts.
            const pairSquare = (id: number, kind: "leave" | "restart") => (
              <g key={`${kind}${id}`} role="button"
                aria-label={kind === "leave" ? "Leave the game" : "Back to the start screen"}
                style={{ cursor: "pointer" }}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => {
                  const b = uiBodiesRef.current?.find((u) => u.id === id && u.kind === kind);
                  startDrag(e, b && !b.fixed ? b : null, kind === "leave" ? () => onPitClose?.() : () => onBackToStart?.());
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
            return (<>{defs.map((d) => (
              <g key={d.kind} ref={uiRefFor(d.kind)}
                role="button"
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
                        /* START SCREEN ONLY, which is neither learning nor
                           started. There the X really does close the pit, so it
                           reads red against the green PLAY. In learn it goes
                           back and during a round it opens the menu, and in both
                           of those it stays the pit's yellow. */
                        : d.kind === "close" && !learning && !started ? "#ef4444"
                        : "var(--yellow, #ffd23e)",
                    stroke: d.kind === "close" && !learning && !started ? "#ffffff" : "var(--navy, #0a3a57)",
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
                      fill="var(--navy, #0a3a57)"
                      stroke="var(--navy, #0a3a57)"
                      strokeWidth={iconStroke * 0.8}
                      strokeLinejoin="round"
                    />
                  ) : (
                    <g stroke={!started ? "#ffffff" : "var(--navy, #0a3a57)"} strokeWidth={iconStroke} strokeLinecap="round">
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
                  <g stroke="var(--navy, #0a3a57)" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round"
                    transform={`scale(${uSz / 44}) translate(-12,-12)`}>
                    <rect x="9" y="2" width="6" height="4" rx="1" />
                    <rect x="2" y="18" width="6" height="4" rx="1" />
                    <rect x="16" y="18" width="6" height="4" rx="1" />
                    <path d="M12 6v4M12 10H5v8M12 10h7v8" />
                  </g>
                )}
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
            const SQ = 84 * pitScale * 1.2 * upp;
            const SQ_GAP = 16 * upp;
            const words: { key: "learn" | "start"; label: string; x: number; y: number; anchor: "start" | "end" }[] = [
              { key: "start", label: "PLAY", x: xMinC + m, y: vbHc * WORD_START_Y, anchor: "start" },
              { key: "learn", label: "LEARN", x: xMinC + m + SQ + SQ_GAP, y: vbHc * WORD_START_Y, anchor: "start" },
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
            const fsL = Math.min(Math.min(Math.max(54.4, stW * 0.12), 128) * START_SCALE, (stW * 0.92) / 3.17) * 0.5;
            const vbWc = aspect >= 1 ? SIZE * aspect : SIZE;
            const vbHc = aspect >= 1 ? SIZE : SIZE / aspect;
            const xMinC = -vbWc / 2;
            const m = 18 * upp;
            return (
              <text
                x={xMinC + vbWc - m}
                y={vbHc * WORD_START_Y}
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
        </svg>
        {/* J17: the canvas effects layer, above the SVG, never takes a pointer. */}
        <canvas ref={fxCanvasRef} className={styles.fxCanvas} aria-hidden="true" />
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
            // The track runs from just under the top edge down to the cap of the
            // S in START, so it uses the full height rather than a guessed 52%.
            // START's glyph top is worked out with the same numbers the word
            // itself uses, so the two stay together if either is retuned.
            const st = stageRef.current;
            const vbHc = aspect >= 1 ? SIZE : SIZE / aspect;
            const topFrac = 0.045; // plus a 100px nudge below, applied in css units
            // 1.24 is the glyph half-height as a multiple of fs/vbHc, measured
            // off the rendered word rather than assumed: Luckiest Guy at this
            // scale sits taller in its box than a nominal 0.62 would suggest.
            // PLAY is a square now, not a word, so the track stops at the top
            // of the button rather than at the cap of a letter. Half the
            // square's height, in the same view units, using the same figures
            // the button itself uses. The old glyph maths and its 1.24 fudge
            // factor go with the word.
            const stH = st ? st.clientHeight : 844;
            const uppS = (aspect >= 1 ? SIZE : SIZE / Math.max(aspect, 0.01)) / Math.max(stH, 1);
            const btnHalf = (84 * pitScale * 1.2 * uppS) / 2;
            const startTopFrac = 0.5 + WORD_START_Y - btnHalf / vbHc;
            // nudged 20px down, and the track shortens by the same so its foot
            // stays on the cap of the P
            /* Up 5px. The foot was landing ON the PLAY square rather than
               above it: startTopFrac is the top of the button exactly, so the
               track had no clearance at all. The 5 comes off `top` and the
               height is left alone, which lifts the whole control and takes the
               foot with it. */
            return {
              top: `calc(${topFrac * 100}% + 95px)`,
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
              // And the hover unlock writes offsets straight onto the wrappers.
              // Left running, a circle that had come loose would stay displaced
              // at its old position while everything around it resized.
              //
              // Done here rather than in applyLevel: that is a plain function in
              // the component body, so the compiler reads calls like these as
              // render work. A pointer handler is unambiguously not.
              unlockStop();
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
          {/* The pit-full wash. Placed HERE on purpose: these three are all
              position absolute with no z-index, so DOM order is the stack. Sky,
              then the level picture, then this, then the floor. It therefore
              covers the sky and the picture and never the floor, and the whole
              .level layer sits below the stage, so the words, chips and cards
              stay clear of it too. Different from the main pit, which snaps its
              pattern on at 90% full with no fade. */}
          <div className={styles.levelPaws} style={{ opacity: fullAlpha }} />
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
          /* The wash takes its colour from the level's theme when it has one.
             Set inline rather than through a class, because it is a value per
             era, not a state. An era with no theme, or a theme with no wash,
             keeps the stylesheet's own pink. */
          style={levelTheme?.wash ? { background: levelTheme.wash } : undefined}
        />
      )}
      {/* The white-to-yellow word sweep has gone with the word. The level
          background behind it still slides in on hover, driven by the same
          playPeek and the same seamClip a few blocks above. */}
      {/* Big PLAY in the bottom-left of the learn area: jump straight from
          reading into the round. */}
      {dockAside && gravity && learning && (
        <button
          type="button"
          className={styles.learnPlay}
          onMouseEnter={() => setPlayPeek(true)}
          onMouseLeave={() => setPlayPeek(false)}
          onFocus={() => setPlayPeek(true)}
          onBlur={() => setPlayPeek(false)}
          onClick={() => {
            setLearnPeek(false);
            setStartPeek(false);
            setPlayPeek(false);
            // Reset any learn-area zoom back to the full pit before the round
            // starts. Otherwise the drop routine sees a zoomed-in focus, bails
            // out, and the round begins stuck inside one circle.
            cancelAnimationFrame(rafRef.current);
            focusRef.current = nodes[0];
            setFocus(nodes[0]);
            const rootV = clampRootView([nodes[0].x, nodes[0].y, nodes[0].r * 2 * (isMobileRef.current ? PAD : ZOOM_PAD) * (dockAside ? PIT_SPAN : 1)]);
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
          {/* Drawn from the in-pit square's own figures rather than eyeballed,
              so it cannot drift from the close X and the info square: they use
              uSz = 84 * pitScale * 1.2 in CSS pixels, rx = 0.3 of that, a 5px
              navy rim and an icon about a third of the square across. The 5px
              rim is centred on the rect, so the artboard carries 2.5px of
              padding on every side to hold it. */}
          {(() => {
            const S = 84 * pitScale * 1.2;
            const B = S + 5;
            const c = B / 2;
            const g = S * 0.34;
            const w = S * 0.30;
            return (
              <svg width={B} height={B} viewBox={`0 0 ${B} ${B}`} aria-hidden="true" focusable="false">
                <rect x={2.5} y={2.5} width={S} height={S} rx={S * 0.3} fill="#22c55e" stroke="#ffffff" strokeWidth={5} />
                <path
                  d={`M${c - w * 0.3},${c - g / 2} L${c + w * 0.7},${c} L${c - w * 0.3},${c + g / 2} Z`}
                  fill="#ffffff"
                  stroke="#ffffff"
                  strokeWidth={S * 0.07}
                  strokeLinejoin="round"
                />
              </svg>
            );
          })()}
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
        <LineageMap
          breed={chumTree}
          strongBg
          currentScore={0}
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

                 The radius came through as `c.r` and was thrown away: the chip
                 was then sized by badgeRFor against the pit's badge scale, which
                 has nothing to do with how big the node looked a moment earlier
                 on the learn layer. That is why a 50% node the size of a coin
                 landed in the pit the size of a plum.

                 opts.r is the escape hatch that already exists for a solo dog
                 circle bringing its own radius, so no other caller changes and
                 the pit's own badge rule is untouched for chips that really do
                 belong to it. */
              spawnBadgeRef.current?.(c.x, c.y, c.r, Math.round(c.share), { r: c.r, green: c.green });
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
            setLearnNode(null);
            setLearnCard(null);
            wakeRef.current?.();
          }}
        />
      )}
      <div
        ref={asideRef}
        className={`${styles.aside}${dockAside ? " " + styles.asideDocked : ""}`}
        // visibility, not display. The rail is a descendant positioned off this
        // element's edge, so collapsing it would leave the rail with nothing to
        // hang off. Hidden this way the box keeps its box, the rail keeps its
        // anchor, and the rail turns itself visible again below.
        style={{ position: "relative", visibility: hideCaption ? "hidden" : undefined }}
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
                {/* With a chum picked, the header names the hovered circle and this
                    line links it to the chum shown in yellow just below. */}
                {ancestryFor && (
                  <span className={styles.cRelated}>is related to:</span>
                )}
              </span>
            </div>
          )}
          {ancestryFor && <span className={styles.cName}>{ancestryFor.name}</span>}
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
              <div className={styles.cBreakBig}>{shownNorm < 1 ? "<1%" : `${shownNorm}%`} historical influence</div>
              <div className={styles.cBreakRow}>As {genLabel(shown.depth)}: {shownShare === null ? "" : shownShare < 1 ? "<1%" : `${shownShare}%`}</div>
              <div className={styles.cBreakRow}>Share of this dog: {shownNorm < 1 ? "<1%" : `${shownNorm}%`}</div>
              <div className={styles.cBreakTitle}>Our best guess, not hard science.</div>
              <BreakNote key={`${hideCaption ? "shut" : "open"}|${shown.data.name}`} />
            </div>
          )}
          {/* Chum picked: how much of that pack dog traces to the level circle
              currently shown, from its own ancestry breakdown. */}
          {ancestryFor && dockAside && shown !== nodes[0] && (() => {
            const share = ancestorShareOf(ancestryFor.name, shown.data.name);
            return share !== null ? (
              <div className={styles.cBreak}>
                <div className={styles.cBreakBigRow}>
                  <div className={styles.cBreakBig}>
                    {ancestryFor.name} is <span className={styles.cPct}>{share < 1 ? "<1%" : `${share}%`}</span> {shown.data.name}
                  </div>
                  <SharePie pct={share} />
                </div>
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
                gridTemplateRows: `repeat(${renderRail.length > 9 ? Math.ceil(renderRail.length / 2) : renderRail.length}, auto)`,
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
                  {ancestryFor?.slug === r.slug && (
                    <span
                      className={styles.relCardInfo}
                      role="button"
                      tabIndex={0}
                      aria-label={`Family tree for ${r.name}`}
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
          style={tempPos ? { left: tempPos.left, top: tempPos.top, right: "auto", bottom: "auto" } : undefined}
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
