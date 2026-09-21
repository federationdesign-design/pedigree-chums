"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ukBreeds, type UKBreed } from "../../data/uk-breeds";
import { breeds as packBreeds } from "../../data/breeds";
import { getLineage, type LineageNode } from "../../data/lineage";
import { resolveLineageName } from "../../data/lineageNames";
import LineageModal from "../../components/LineageModal/LineageModal";
import { resetToys } from "../../components/BreedTree/BreedTree";
import { useLeaveDialog } from "../../components/OutboundLink/LeaveDialogProvider";
import styles from "./history.module.css";
import { sourcesFor } from "../../data/breedSources";
import { levelCardKind, STRIP_ORDER } from "../../data/levels";

/* Outbound sources are per dog now (data/breedSources.ts), so the era gate has
   gone: a dog with no sources of its own shows no links, wherever it sits. */

// Bigger dog silhouette for breeds with no square art.
function DogIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.dogIcon}>
      <path d="M4 5l2 1 2-1v3l2 1v8h2v-4h2v4h2v-6l2-1V5l-2 1-1 2h-3l-2-2H6L4 5zm2.5 3.5a.9.9 0 110 1.8.9.9 0 010-1.8z" />
    </svg>
  );
}

// Lives: three to begin, a ceiling of six, one back for every three levels
// completed without a loss in between.
/* Owner, 1 September 2026: 2 to start, 3 the ceiling. Was 3 and 6. The run is
   meant to bite now that a lost or abandoned level no longer leaves its points
   behind, so a spent run comes round sooner and the streak bonus tops out at a
   figure a player can actually hold in their head. */
const LIVES_START = 2;
const LIVES_MAX = 3;
const LIVES_STREAK = 3;

const ERA_LABELS: Record<string, string> = {
  "ancient-medieval": "Ancient to medieval",
  ancient: "Ancient times",
  medieval: "Medieval times",
  c1500: "Tudor times",
  c1700: "The 1700s",
  early1800: "The early 1800s",
  spaniels: "The spaniel explosion",
  mid1800: "The mid-1800s",
  late1800: "The late 1800s",
  c1900: "The 1900s",
  crosses: "Today's crossbreeds",
};

/* `renderLevels` is how the history slider borrows this component.

   THE GAME LIVES HERE AND ONLY HERE. Lives, streak, campaign score, the
   running order across all nine eras, retry and play again: every rule is in
   this file, and the slider must not own a second copy of any of it, or the
   two pages will drift the moment one is edited.

   So the slider does not copy the rules out. It passes its own markup in.
   Given the `open` builder, it renders the dogs however it likes and calls
   `open(breed)` on a tap. This component still owns the state and still
   renders the modal.

   HARD RULE: the branch is at the RENDER only. Nothing above the return may
   ever depend on which presentation is in use. The live page's behaviour has
   to be untouchable from the slider. */
export type BreedStripOpen = (b: UKBreed) => ((e?: { currentTarget?: Element | null }) => void) | undefined;

/* WHAT A CARD IS. One answer, read by both the tap and any badge drawn on the
   card, so a card can never advertise PLAY and then fail to play.

   "learn" means the breed has a page of its own and the tap navigates there.
   "play" means it has no page but has a lineage WITH ANCESTORS, so the tap
   opens a level. null means neither, and the card only flips.

   A lineage with no children cannot be a level: the round works by revealing
   what sits below a dog, and a deepest root has nothing below it. That rule is
   general, not a name list: it keeps the two ancient additions flip-only today
   and will do the same for the medieval foundation roots in later batches
   (docs/lineage/BRIEF.md section 4).

   Measured across all 97 dogs on the history pages: 62 play, 28 learn, 7
   flip-only. Pure and stateless, so it is safe to call from anywhere. */
export type BreedCardKind = "play" | "learn";

/* The ancient-medieval strip is SPLIT into "ancient" and "medieval" on the
   live page (owner request). The slider still shows the combined run, so a
   caller passing the old combined era matches both new strips. */
export function stripMatches(rowStrip: string, era: string): boolean {
  return rowStrip === era || (era === "ancient-medieval" && (rowStrip === "ancient" || rowStrip === "medieval"));
}

/* WHAT OPENING A LEVEL NEEDS, from nothing but the breed's name. Module scope, not
   inside the component, so the initial state below can call it on the very first
   render: a deep link has to arrive already open, and setting it from an effect
   instead costs a second render and trips react-hooks/set-state-in-effect.
   buildActive inside the component is now a one-line call to this, so the tap
   path and the deep link build the level identically. */
function activeFor(name: string) {
  const pn = resolveLineageName(name);
  const lin = getLineage(pn);
  if (!lin) return null;
  const ub = ukBreeds.find((x) => x.name === name);
  const pk = packBreeds.find((x) => x.name === pn);
  return { name, image: pk?.image ?? ub?.image ?? "", character: pk?.character ?? ub?.note, fact: pk?.fact, lineage: lin };
}

/* Delegates to data/levels.ts, 20 September 2026, so the per-level pages and this
   strip read one rule. The body moved there unchanged. */
export function breedCardKind(name: string): BreedCardKind | null {
  return levelCardKind(name);
}

export default function BreedStrip({
  era,
  renderLevels,
  initialLevel,
  closeHref,
  only,
  label,
  labelName,
  playName,
}: {
  era: string;
  renderLevels?: (open: BreedStripOpen) => React.ReactNode;
  /* OPEN THIS LEVEL ON ARRIVAL, 20 September 2026, for the per-level pages at
     /britains-dog-history/dog/[slug]. The breed's NAME, exactly as ukBreeds holds
     it. Opened quiet, so the visitor lands on the level's start screen rather
     than sitting through the time tunnel: the owner asked for the start screen. */
  initialLevel?: string;
  /* WHERE CLOSING THE LEVEL GOES, and the signal that this is a per-level page
     showing the GAME ONLY (owner, 20 September 2026: no text underneath, no strip,
     close goes to that dog's era page). When set, nothing but the level is
     rendered, and closing it navigates here instead of revealing a strip. */
  closeHref?: string;
  /* A CHUM PAGE'S ANCESTOR STRIP, 20 September 2026 (owner: the slider at the foot
     of a chum page should look like the era page's, same corners, and flip).

     THE SAME CARDS, NOT A COPY OF THEM. Passing `only` swaps the era's dogs for this
     list and `label` replaces the era name, and everything else, the corners, the
     flip, the wheel-to-sideways scroll, is this component's own, so the two rows
     cannot drift apart in look or behaviour.

     A TAP OPENS THE LEVEL HERE, WITH THE TIME TUNNEL, 20 September 2026 (owner:
     the time tunnel on the card click and into the start screen). It navigated to
     /britains-dog-history/dog/[slug] instead, which arrives quiet by design, the
     owner having asked for shared links to land straight on the start screen. A
     tap from the strip now does exactly what a tap on the era page does: the
     tunnel dives from the card's own rect into that level's start screen, over
     the chum page. The level pages are unchanged and are still the shareable URLs.
     Learn cards still go to their chum page as before. */
  only?: UKBreed[];
  label?: string;
  /* THE PART OF THE LABEL DRAWN IN WHITE, the chum's own name (owner, 20 September
     2026: the dog name in the title should be white). Kept separate from `label`
     so the heading can colour it without the caller passing markup. */
  labelName?: string;
  /* THE ONE CARD THAT PLAYS IN PLACE (owner, 20 September 2026: a final playable
     level on every chum page for the dog the page is about). Every other card in
     an `only` strip goes to its level page; this dog has no level page, because
     it is a chum, so tapping its card opens the game right here on the chum page. */
  playName?: string;
}) {
  const router = useRouter();
  const { confirmLeave } = useLeaveDialog();
  const wrapRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  type Active = {
    name: string;
    image: string;
    character?: string;
    fact?: string;
    lineage: LineageNode;
    // The clicked card's on-screen rect, so the tunnel's card dives from it.
    fromRect?: { x: number; y: number; w: number; h: number };
    // And WHAT dives. See the note at the top of TimeTunnel.
    diver?: "card" | "button";
    /* NO TIME TUNNEL, 9 Sept 2026. LineageModal remounts on every level change,
       and its tunnel state initialises to "play" on mount, so swiping between
       dogs on the start screen replayed the whole arrival sequence each time.
       The tunnel is the "enter the pit" moment. Browsing from one start screen
       to the next is not an arrival, so it is suppressed for those and those
       only. Tapping a card from the page, and finishing a level and taking the
       next one, both still play it. */
    quiet?: boolean;
  };
  /* THE DEEP LINK, 20 September 2026. A per-level page passes initialLevel and the
     level is open from the first render, quiet, so the visitor lands on its start
     screen with no tunnel. Read once, in the initialiser, so closing the level or
     moving on is never undone by a re-render. */
  const [active, setActive] = useState<Active | null>(() => {
    const na = initialLevel ? activeFor(initialLevel) : null;
    return na ? { ...na, quiet: true } : null;
  });
  // Bumped on a retry so the modal remounts even though the level name has not
  // changed. Without it, Restart on the same level would leave the round exactly
  // as it was lost.
  const [runKey, setRunKey] = useState(0);
  const [campaignScore, setCampaignScore] = useState(0); // carries across levels, resets on start over
  /* THE BANKED TOTAL, 31 August 2026 (owner). campaignScore follows the live
     round, point by point, so before this existed a level you FAILED still left
     its points in the campaign total. Two things fell out of that: a failed
     level put you on the score table, and closing a level before you died and
     reopening it refilled your lives while keeping the points, which could be
     cycled for ever.

     The rule now: the campaign total only advances when a level is COMPLETED.
     Everything else returns it to this figure.

     Zero at the start, so failing level one reports zero. Owner confirmed. */
  const [bankedScore, setBankedScore] = useState(0);
  /* Every COMPLETED level's chum catch, as raw counts. Kept here rather than in
     the modal because the modal is keyed per level and remounts on each one.

     Counts rather than the percentages this held until now, because the run
     total is read as "23, then 46, then 230" and a mean of percentages cannot
     be turned back into that. The per-level percentage average is still
     derived from these below, so nothing that read it has changed.

     A failed level never appends here: the modal only reports on a win, which
     is the same rule bankedScore advances under. Five retries of level one
     therefore cannot show 115 possible. */
  const [chumTallies, setChumTallies] = useState<{ found: number; possible: number }[]>([]);
  /* How many times each dog has been caught this run, by name. The picture is
     resolved from the pack data rather than carried through two components,
     because the pack is already the source of truth for it here. */
  const [chumCounts, setChumCounts] = useState<Record<string, number>>({});
  const topChum = (() => {
    let best: string | null = null;
    for (const [n, c] of Object.entries(chumCounts)) {
      if (!best || c > chumCounts[best]) best = n;
    }
    if (!best) return null;
    const b = packBreeds.find((x) => x.name === best);
    return { name: best, image: b?.image || "", count: chumCounts[best] };
  })();
  // Lives run alongside the score and last for one run at the pit, not for ever:
  // opening a level from the page starts you at three again. A retry spends one.
  // Three levels completed in a row earns one back, up to a ceiling of six, and
  // a loss breaks the streak, which is what "in a row" has to mean.
  const [lives, setLives] = useState(LIVES_START);
  const [streak, setStreak] = useState(0);
  /* LEVELS FINISHED THIS SESSION, 16 September 2026 (owner: show a completed level
     as green, with a tick for the portrait and no play button).

     IN MEMORY, BY NAME, alongside position, lives and streak, which are all held
     the same way. The owner chose this deliberately as stage one: the look is what
     wants judging, and where completion should live is a separate question worth
     answering properly. A refresh clears it, which will read as a bug to a player,
     so this is not the finished state of the feature.

     Swapping the backing store later means changing only this line and the setter
     below; everything downstream reads a Set of names. */
  const [completedLevels, setCompletedLevels] = useState<Set<string>>(new Set());
  /* Which card is flipped to its back, by name, or null. Only used below 480,
     where there is no hover to flip on: the tap controls set it. Above 480 the
     controls are display:none and the CSS hover flip governs, so this stays null
     and has no effect there. See the touch-flip rules in history.module.css. */
  const [flipped, setFlipped] = useState<string | null>(null);

  // The mini pits are levels: every popup-capable breed, in timeline order
  // across all eras. Round Won advances to the next; Game Over restarts at
  // the very first.
  // STRIP_ORDER now comes from data/levels.ts, unchanged, so the level pages share it.
  // The same builder the deep link uses. See activeFor at module scope.
  const buildActive = (b: UKBreed): Active | null => activeFor(b.name);
  const levelList = ukBreeds
    .slice()
    .sort((a, b) => (STRIP_ORDER.indexOf(a.strip) - STRIP_ORDER.indexOf(b.strip)) || (a.anchor - b.anchor))
    // The same single answer the tap and the badge read: only "play" cards are
    // levels, so a root-only record (flip-only card) can never join the
    // campaign or shift its numbering.
    .filter((b) => breedCardKind(b.name) === "play");
  const nextLevelOf = (name: string): UKBreed | null => {
    const i = levelList.findIndex((b) => b.name === name);
    return i >= 0 && i + 1 < levelList.length ? levelList[i + 1] : null;
  };
  /* START SCREEN NAVIGATION (2 Sept 2026). The pit reports a swipe or a D-pad
     press; the answer to "where does that land" lives here, because levelList
     above is the whole campaign in order across every era.
     These are PURE NAVIGATION. They must not borrow onNextLevel's body: that
     one bumps the streak and hands back a life every third call, which is
     right for winning a level and wrong for browsing. */
  const prevLevelOf = (name: string): UKBreed | null => {
    const i = levelList.findIndex((b) => b.name === name);
    return i > 0 ? levelList[i - 1] : null;
  };
  /* NEXT ERA: the first dog of the first strip after this one. Null in the
     final era, so the button dims rather than wrapping. */
  const nextEraOf = (name: string): UKBreed | null => {
    const i = levelList.findIndex((b) => b.name === name);
    if (i < 0) return null;
    const here = STRIP_ORDER.indexOf(levelList[i].strip);
    return levelList.find((b) => STRIP_ORDER.indexOf(b.strip) > here) ?? null;
  };
  /* LAST ERA behaves like a track-back button, which is the owner's choice
     (option A of three). If you are part way through an era it takes you to the
     FIRST DOG OF THE ERA YOU ARE IN; only when you are already on that first dog
     does it cross into the previous era. So the only dog with nowhere to go is
     the very first of the campaign, which is exactly the stated rule. */
  const prevEraOf = (name: string): UKBreed | null => {
    const i = levelList.findIndex((b) => b.name === name);
    if (i < 0) return null;
    const here = STRIP_ORDER.indexOf(levelList[i].strip);
    const firstOfHere = levelList.findIndex((b) => STRIP_ORDER.indexOf(b.strip) === here);
    if (i > firstOfHere) return levelList[firstOfHere];
    let prevStrip = -1;
    for (const b of levelList) {
      const si = STRIP_ORDER.indexOf(b.strip);
      if (si < here && si > prevStrip) prevStrip = si;
    }
    if (prevStrip < 0) return null;
    return levelList.find((b) => STRIP_ORDER.indexOf(b.strip) === prevStrip) ?? null;
  };
  /* THE CROSS-FADE (9 Sept 2026). Suppressing the time tunnel left the swap
     bare: one diagram was replaced by the next in a single frame and it read as
     a flick. So the outgoing diagram is faded out FIRST, then swapped, then the
     new one fades in.
     The wait has to live here rather than in the modal because the modal is
     KEYED on the level and unmounts the instant setActive runs. Nothing inside
     it can animate its own departure. This holds the old one on screen for
     NAV_FADE_MS, which is the whole trick.
     The two halves are deliberately uneven: out is quicker than in, so the
     screen is never empty for long and the arrival is the part you notice. */
  /* 140 -> 90 on 9 Sept 2026. With the shell now staying solid through a swipe
     (see .overlayQuiet), the only thing this wait buys is the outgoing diagram's
     fade. 140ms out, then a swap, then 200ms in, left a visible beat of empty
     level background between the two. Shorter out plus the solid shell reads as
     one diagram replacing another rather than a flash.
     THE ONE FIGURE TO KEEP IN STEP is the transition on .stageGoing. */
  const NAV_FADE_MS = 90;
  const [navFading, setNavFading] = useState(false);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (navTimer.current) clearTimeout(navTimer.current); }, []);
  const navTo = (b: UKBreed | null) => {
    const na = b ? buildActive(b) : null;
    if (!na) return;
    // A second swipe mid-fade replaces the first rather than queueing behind it,
    // so a quick double flick lands on the right dog instead of two in a row.
    if (navTimer.current) clearTimeout(navTimer.current);
    setNavFading(true);
    navTimer.current = setTimeout(() => {
      navTimer.current = null;
      // quiet: this is navigation between start screens, not an arrival.
      setActive({ ...na, quiet: true });
      setNavFading(false);
    }, NAV_FADE_MS);
  };


  /* What a tap on a dog does. Lifted out of the rail's own map so the slider
     gets the identical rule rather than a second version of it. The three
     outcomes are unchanged: a breed with its own page navigates there, a breed
     with an ancestored lineage opens a level as a fresh run, and anything else
     only flips. Measured across all 97 dogs: 62 open a level, 28 navigate, 7
     flip only. */
  const openFor: BreedStripOpen = (b) => {
    const kind = breedCardKind(b.name);
    const packName = resolveLineageName(b.name);
    const lineage = getLineage(packName);
    const pack = packBreeds.find((x) => x.name === packName);
    // The chum page's own dog plays here rather than sending the visitor to the
    // page they are already on. See playName.
    const playHere = !!only && b.name === playName && !!lineage;
    if (!playHere) {
      if (kind === "learn" && pack?.slug) return () => router.push(`/chums/${pack.slug}`);
      if (kind !== "play" || !lineage) return undefined;
    }
    if (!lineage) return undefined;
    return (e) => {
      // opening a level from the page is a fresh run
      setLives(LIVES_START);
      setStreak(0);
      /* THE FARM, CLOSED. Opening a level already refilled the lives; it did
         not touch the score, so leaving a round before dying and coming back in
         kept the points AND handed back three lives. Starting from the banked
         total means an unfinished round can never leave anything behind. */
      setCampaignScore(bankedScore);
      // The clicked card's on-screen rect, so the tunnel's card dives from where
      // it sits. Missing (e.g. a caller that passes no event) falls back to the
      // screen centre in TimeTunnel.
      const r = e?.currentTarget?.getBoundingClientRect();
      setActive({
        name: b.name,
        image: pack?.image ?? b.image ?? "",
        character: pack?.character ?? b.note,
        fact: pack?.fact,
        lineage,
        fromRect: r ? { x: r.x, y: r.y, w: r.width, h: r.height } : undefined,
        /* A DOG CARD, AT EVERY WIDTH. openFor is the tap handler for BOTH the
           rail and the era sliders, so this one line covers every card route
           there is, which is the route the 19 September width rule broke. */
        diver: "card",
      });
    };
  };

  /* THE HEADER PICTURE PLAYS THE CHUM'S LEVEL, 21 September 2026 (owner: a direct
     link to the chum level from the dog image). The picture lives in another
     component, so it announces "pc:play-chum" with itself as the element, and this
     strip, which owns the game, answers it by tapping the chum's own card through
     the SAME openFor the card uses. One path, so the run resets, the tunnel and
     the start screen are identical to tapping the card; and the tunnel dives from
     the picture the player actually pressed.

     Re-subscribed each render so it always holds the current openFor, whose play
     branch reads the banked score; a listener captured once would bank a stale
     one. Cheap: it is one listener. */
  useEffect(() => {
    if (!playName || !only) return;
    const onPlay = (ev: Event) => {
      const el = (ev as CustomEvent<{ el?: Element }>).detail?.el ?? null;
      const b = only.find((x) => x.name === playName);
      const h = b ? openFor(b) : undefined;
      h?.({ currentTarget: el });
    };
    window.addEventListener("pc:play-chum", onPlay);
    return () => window.removeEventListener("pc:play-chum", onPlay);
  });

  const breeds: UKBreed[] = only ?? ukBreeds
    .filter((b) => stripMatches(b.strip, era))
    .sort((a, b) => a.anchor - b.anchor);

  // Homepage-style scroll: convert vertical wheel into horizontal scroll for
  // the first few cards (the "hold"), then release the page to scroll on.
  useEffect(() => {
    const wrap = wrapRef.current;
    const el = railRef.current;
    if (!wrap || !el) return;

    const holdDistance = () => {
      const items = el.querySelectorAll<HTMLElement>("[data-node]");
      if (items.length > 3) return items[3].offsetLeft - items[0].offsetLeft;
      return el.clientWidth;
    };
    let hold = holdDistance();
    const onResize = () => {
      hold = holdDistance();
    };

    // Shared drive: move the rail sideways, holding the page for the first
    // few cards then releasing it. delta > 0 scrolls forward. The caller
    // passes its own preventDefault so the same logic serves wheel and touch.
    const driveRail = (delta: number, preventDefault: () => void) => {
      if (delta === 0) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return; // nothing to scroll, let the page move
      if (delta > 0) {
        if (el.scrollLeft >= max) return;
        if (el.scrollLeft < hold) preventDefault();
        el.scrollLeft = Math.min(el.scrollLeft + delta, max);
      } else {
        if (el.scrollLeft <= 0) return;
        if (el.scrollLeft <= hold) preventDefault();
        el.scrollLeft = Math.max(el.scrollLeft + delta, 0);
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // trackpad pinch (ctrl+wheel): let the browser zoom
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      driveRail(delta, () => e.preventDefault());
    };

    wrap.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", onResize);
    return () => {
      wrap.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Mobile has no wheel events, so the desktop hold never engages. Borrow the
  // LHM scroll-driven carousel trick: a rAF loop lerps the rail toward a
  // scroll-derived target, so it eases in with inertia instead of tracking the
  // finger 1:1. Engages only once the strip centre reaches mid screen, advances
  // a couple of cards, then releases so finger swipes still work.
  useEffect(() => {
    const wrap = wrapRef.current;
    const el = railRef.current;
    if (!wrap || !el) return;
    if (!window.matchMedia("(pointer: coarse)").matches) return;

    // how far to auto-advance: two cards in from the start
    const holdDistance = () => {
      const items = el.querySelectorAll<HTMLElement>("[data-node]");
      if (items.length > 2) return items[2].offsetLeft - items[0].offsetLeft;
      return el.clientWidth;
    };

    const EASE = 0.06; // lower = more lag and inertia, higher = more direct
    let target = 0;
    let current = 0;
    let released = false;
    let raf = 0;

    const measure = () => {
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return 0; // nothing to scroll on this strip
      const hold = Math.min(holdDistance(), max);
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const centre = rect.top + rect.height / 2;
      const start = vh * 0.5; // nothing happens until the centre hits mid screen
      const end = vh * 0.0; //   finishes as the centre reaches the top
      const p = (start - centre) / (start - end);
      const clamped = Math.max(0, Math.min(1, p));
      if (clamped >= 1) released = true; // strip has passed, hand control back
      return clamped * hold;
    };

    const tick = () => {
      target = measure();
      current += (target - current) * EASE;
      if (Math.abs(target - current) < 0.5) current = target;
      el.scrollLeft = current;
      if (current === target) {
        raf = 0;
        return; // settled, wait for the next scroll (or stay put if released)
      }
      raf = requestAnimationFrame(tick);
    };
    const onScroll = () => {
      if (released) return; // reader owns it now, stop driving
      if (!raf) raf = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Yellow draggable scrollbar thumb synced to the rail's scroll position.
  useEffect(() => {
    const el = railRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!el || !track || !thumb) return;

    const sync = () => {
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 1) {
        track.style.opacity = "0";
        return;
      }
      track.style.opacity = "1";
      thumb.style.width = `${(el.clientWidth / el.scrollWidth) * 100}%`;
      thumb.style.left = `${(el.scrollLeft / el.scrollWidth) * 100}%`;
    };

    let dragging = false;
    let startX = 0;
    let startScroll = 0;
    const onDown = (e: PointerEvent) => {
      dragging = true;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      thumb.setPointerCapture(e.pointerId);
      e.preventDefault();
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const trackW = track.clientWidth || 1;
      const max = el.scrollWidth - el.clientWidth;
      const next = startScroll + ((e.clientX - startX) / trackW) * el.scrollWidth;
      el.scrollLeft = Math.max(0, Math.min(next, max));
    };
    const onUp = () => {
      dragging = false;
    };

    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    thumb.addEventListener("pointerdown", onDown);
    thumb.addEventListener("pointermove", onMove);
    thumb.addEventListener("pointerup", onUp);
    thumb.addEventListener("pointercancel", onUp);
    const ro = new ResizeObserver(sync);
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      thumb.removeEventListener("pointerdown", onDown);
      thumb.removeEventListener("pointermove", onMove);
      thumb.removeEventListener("pointerup", onUp);
      thumb.removeEventListener("pointercancel", onUp);
      ro.disconnect();
    };
  }, []);

  if (breeds.length === 0) return null;

  const tagLabel = (t: string) =>
    t === "extinct"
      ? "Extinct"
      : t === "trending"
      ? "Trending"
      : t === "popular"
      ? "Popular"
      : t === "in-decline"
      ? "In decline"
      : "Endangered";
  const tagClass = (t: string) =>
    t === "extinct"
      ? styles.nodeTagExtinct
      : t === "trending"
      ? styles.nodeTagTrending
      : t === "popular"
      ? styles.nodeTagPopular
      : t === "in-decline"
      ? styles.nodeTagDecline
      : styles.nodeTagEndangered;

  /* The level window, built once and used by both presentations. It is the
     whole reason the slider borrows this component rather than copying it:
     every rule below is written here and nowhere else. */
  /* THE ERA JOIN, as a message only. The level list runs across all nine eras,
     so a run rolls from the last dog of one straight into the first of the
     next with nothing marking it.

     COMPARE THE CURRENT LEVEL'S OWN STRIP, NOT THIS STRIP'S `era` PROP. The
     player opens a level from one era and then plays on across the joins, so
     `era` stays where they started while the round moves on. Testing against it
     would call every level after the first join a crossing.

     Nothing about the round changes: the next level is still offered, the pit
     is not closed, and the score carries. */
  const nextUp = active ? nextLevelOf(active.name) : null;
  const curStrip = active ? ukBreeds.find((b) => b.name === active.name)?.strip : undefined;
  const eraJoinLabel =
    nextUp && curStrip && nextUp.strip !== curStrip
      ? ERA_LABELS[nextUp.strip] ?? nextUp.strip
      : undefined;

  const modal = active && (
    <LineageModal
      key={`${active.name}:${runKey}`}
      era={era}
      initialScore={campaignScore}
      onScoreChange={setCampaignScore}
      bankedScore={bankedScore}
      onBankScore={setBankedScore}
      onLevelChums={(found, possible) => setChumTallies((t) => [...t, { found, possible }])}
      onChumCaught={(n) => setChumCounts((c) => ({ ...c, [n]: (c[n] ?? 0) + 1 }))}
      topChum={topChum}
      /* Unchanged in meaning: still the mean of each completed level's own
         percentage, so a level with three chums counts the same as one with
         twenty. Only the source changed, from stored percentages to counts. */
      runChumRate={chumTallies.length ? chumTallies.reduce((a, t) => a + (t.possible > 0 ? (t.found / t.possible) * 100 : 0), 0) / chumTallies.length : null}
      runLevels={chumTallies.length}
      /* THE RUN TOTAL. Plain sums, completed levels only. */
      runChumsFound={chumTallies.reduce((a, t) => a + t.found, 0)}
      runChumsPossible={chumTallies.reduce((a, t) => a + t.possible, 0)}
      eraJoinLabel={eraJoinLabel}
      nextLevelLabel={nextUp?.name}
      nextLevelImage={(() => { const nb = nextLevelOf(active.name); return nb ? buildActive(nb)?.image : undefined; })()}
      lives={lives}
      livesMax={LIVES_MAX}
      /* Pure navigation. Null means the end of the line, and LineageModal dims
         that control rather than hiding it, so the D-pad does not reflow. */
      onNavPrev={prevLevelOf(active.name) ? () => navTo(prevLevelOf(active.name)) : undefined}
      onNavNext={nextLevelOf(active.name) ? () => navTo(nextLevelOf(active.name)) : undefined}
      onNavPrevEra={prevEraOf(active.name) ? () => navTo(prevEraOf(active.name)) : undefined}
      onNavNextEra={nextEraOf(active.name) ? () => navTo(nextEraOf(active.name)) : undefined}
      onNextLevel={(rect) => {
        // The one place a level is known to be finished, so the one place this is
        // recorded. Keyed by name, which is the same key the timeline and the
        // lineage records use.
        setCompletedLevels((prev) => (prev.has(active.name) ? prev : new Set(prev).add(active.name)));
        // a level completed: three in a row earns a life back
        setStreak((st) => {
          const next = st + 1;
          if (next % LIVES_STREAK === 0) setLives((l) => Math.min(LIVES_MAX, l + 1));
          return next;
        });
        const nb = nextLevelOf(active.name);
        const na = nb ? buildActive(nb) : null;
        /* THE BUTTON'S RECT COMES WITH IT, 19 September 2026. buildActive returns
           no fromRect, because it is built from a breed record rather than from
           anything on screen, so this route reached TimeTunnel with none and the
           object dived from the screen centre at a fallback size. The Next Level
           button now reports its own rect and it is carried here. */
        if (na) setActive({ ...na, fromRect: rect, diver: "button" });
      }}
      onLost={() => {
        /* THE LIFE IS SPENT ON THE LOSS, 19 September 2026 (owner). It used to
           be charged by onStartOver, the retry, which made the try again
           screen's "N more tries left" untrue: at one life the retry spent the
           last one, the modal remounted with lives at 0, and LineageModal's
           showEnding (phase !== "play" || outOfLives) covered the fresh round
           with GAME OVER before it could be played. LIVES_START of 2 therefore
           bought only ONE attempt.
           Charged here, the count means playable attempts: lose, see the count
           already decremented, retry for free, and a loss at 0 is the ending.
           DO NOT PUT THE CHARGE BACK ON THE RETRY.
           Safe to charge here because the loss has exactly one source,
           onPitFull in LineageModal, which BreedTree guards with pitEndedRef so
           it cannot fire twice in a round. onClose does not charge, so walking
           out after a loss does not pay twice either. */
        setLives((l) => Math.max(0, l - 1));
        setStreak(0); // a loss breaks the run toward the next life
      }}
      onSpendLife={() => {
        // Leaving a live round to go and read costs a life, exactly like a
        // retry does, and breaks the streak for the same reason.
        setLives((l) => Math.max(0, l - 1));
        setStreak(0);
      }}
      onResetRun={() => {
        // PLAY AGAIN on a spent run: lives and the campaign total go back
        // to the start, but the player keeps their place in the level.
        setLives(LIVES_START);
        setStreak(0);
        setCampaignScore(0);
        setBankedScore(0); // a fresh run has nothing banked either
        setChumTallies([]);
        setChumCounts({});
        // A fresh run is a fresh set of toys. See resetToys in BreedTree: they
        // are spent by PROGRESS, and a game over is the opposite of progress.
        resetToys();
      }}
      onStartOver={() => {
        // A retry replays THIS level. It used to rebuild level one and wipe the
        // campaign total, so failing level two threw away every level already
        // cleared as well as the score. Losing your place is what running out
        // of lives is for, and the modal only offers Restart while lives
        // remain.
        /* THE RETRY NO LONGER COSTS A LIFE, 19 September 2026 (owner). The loss
           already charged it: see onLost above for why the charge moved and why
           it must not come back here. The streak still breaks, because that is
           about the run and not about this press. */
        setStreak(0);
        // The retry starts from the BANKED total, not from whatever the failed
        // attempt reached. The remount below re-seeds the modal from
        // campaignScore, so this is the line that decides what it re-seeds to.
        setCampaignScore(bankedScore);
        // The modal is keyed on the level name, so replaying the same one
        // would not remount and the round would not reset. The run counter
        // is what forces it.
        setRunKey((k) => k + 1);
        /* NO TIME TUNNEL ON A RETRY, 19 September 2026 (owner: go directly back
           to the start screen).

           A COMMENT IN LineageModal SAID THIS ALREADY WORKED and it did not. It
           reads "it stays down after the first play, so an in-pit retry does not
           replay it", which was true when tunnelActive was plain state inside a
           modal that survived the retry. The line above remounts the modal, so
           the state is rebuilt from scratch and the tunnel plays again. Code
           over doc, as usual.
           The fix is `quiet`, which the modal already reads at mount and which
           BreedStrip already sets for D-pad and swipe navigation for exactly the
           same reason: that is browsing, and this is a replay. It also drops
           holdEntrance, so the circles arrive without the held entrance, which is
           what "directly back to the start screen" asks for.
           It stays set on this level until the player navigates or advances,
           both of which rebuild `active` through buildActive and clear it. */
        setActive((a) => (a ? { ...a, quiet: true } : a));
        // AND THE TOYS COME BACK, because a retry is not progress. Throwing a
        // ball out costs it for the rest of the level and for every level you go
        // on to clear; it does not cost it for an attempt you failed.
        resetToys();
      }}
      levelCompleted={completedLevels.has(active.name)}
      levelNo={Math.max(0, levelList.findIndex((b) => b.name === active.name))}
      name={active.name}
      image={active.image}
      character={active.character}
      fact={active.fact}
      lineage={active.lineage}
      fromRect={active.fromRect}
      diver={active.diver}
      quiet={active.quiet}
      navFading={navFading}
      onClose={() => {
        // Walking out of a live round forfeits it, the same as losing it. The
        // modal does this for its own back-out controls; this is the last way
        // out, and without it the whole rule has a hole in it.
        setCampaignScore(bankedScore);
        // A per-level page has no strip behind the game to fall back to, so it
        // leaves for the dog's era page. Everywhere else, closing reveals the strip.
        if (closeHref) { router.push(closeHref); return; }
        setActive(null);
      }}
    />
  );

  /* THE SLIDER'S BRANCH. A fragment, deliberately: the history slider's dog
     screens are `height: 100%` of their scroller and only resolve while they
     are its DIRECT children. A wrapper here would collapse every one of them.
     Nothing above this line knows which branch is taken. */
  if (renderLevels) {
    return (
      <>
        {renderLevels(openFor)}
        {modal}
      </>
    );
  }

  /* THE PER-LEVEL PAGE'S BRANCH. The game and nothing else: no era label, no rail,
     no dogs underneath. The level is open from the first render via initialLevel,
     so this is never empty in practice; if it ever closed without navigating, the
     page would simply be blank rather than show a strip nobody asked for. */
  if (closeHref) {
    return <>{modal}</>;
  }

  return (
    <div className={`${styles.strip} ${only ? styles.stripFlush : ""}`.trim()} aria-label={`Breeds: ${label ?? ERA_LABELS[era]}${labelName ? ` ${labelName}` : ""}`}>
      {/* A chum page's strip gets a real HEADING, 20 September 2026 (owner: make
          it an h2, smaller, right aligned). It is a sentence there, "Learn more
          about the dogs that went into making...", and the page's section heading,
          so it earns the h2; the era pages keep their decorative era name as a
          span, since the page itself carries that era's heading. */}
      {only ? (
        // The anchor the chum page's title links down to. See Chums2Client.
        <h2 id="dogs-that-made" className={`${styles.stripLabel} ${styles.stripLabelLemon}`}>
          {label ?? ERA_LABELS[era]}
          {labelName ? <> <span className={styles.stripLabelName}>{labelName}</span></> : null}
        </h2>
      ) : (
        <span className={styles.stripLabel}>{label ?? ERA_LABELS[era]}</span>
      )}

      <div ref={wrapRef} className={styles.stripWrap}>
        <div ref={railRef} className={styles.stripRail} role="list">
          {breeds.map((b) => {
            /* packName, lineage and pack used to be resolved here purely to
               build the tap handler inline. openFor does that now, and nothing
               else in this markup used them. */
            const open = openFor(b);
            const kind = breedCardKind(b.name);
            return (
              <div key={b.name} data-node className={styles.node} role="listitem">
                <span className={styles.nodeEra}>{b.era}</span>
                <button
                  type="button"
                  className={`${styles.flipCard} ${open ? styles.flipCardOpen : ""}`}
                  onClick={open}
                  aria-label={open ? `View ${b.name} family tree` : undefined}
                >
                  <span
                    className={styles.flipInner}
                    style={flipped === b.name ? { transform: "rotateY(180deg)" } : undefined}
                  >
                    <span className={styles.flipFront}>
                      <span className={styles.nodeThumb}>
                        {b.image ? (
                          <Image
                            src={b.image}
                            alt={b.name}
                            width={160}
                            height={160}
                            unoptimized
                            draggable={false}
                          />
                        ) : (
                          <DogIcon />
                        )}
                      </span>
                      {kind && (
                        <span className={styles.deskWedge} aria-hidden="true" />
                      )}
                      {open && (
                        <span className={styles.lineageBadge} aria-hidden="true">
                          <svg viewBox="0 0 24 24">
                            <circle cx="12" cy="5" r="2.4" />
                            <circle cx="6" cy="18" r="2.4" />
                            <circle cx="18" cy="18" r="2.4" />
                            <path
                              d="M12 7v3.2M6 15.6V12h12v3.6"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.6"
                            />
                          </svg>
                        </span>
                      )}
                      {b.tag && (
                        <span className={`${styles.nodeTag} ${tagClass(b.tag)}`}>
                          {tagLabel(b.tag)}
                        </span>
                      )}
                      {/* Touch flip control. Shown only below 480 (display:none
                          above, see history.module.css), so on the desktop strip
                          it is not rendered, not tabbable, and cannot flip the
                          card. A span, not a button, because it lives inside the
                          card's own button. */}
                      <span
                        className={styles.frontFlip}
                        role="button"
                        tabIndex={0}
                        aria-label={`Turn the ${b.name} card over`}
                        onClick={(e) => { e.stopPropagation(); setFlipped(b.name); }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); setFlipped(b.name); }
                        }}
                      />
                    </span>
                    <span className={styles.flipBack}>
                      <span className={styles.flipBackInner}>
                        {open && (
                          <span className={styles.deskBackHint}>Tap to learn about this dog</span>
                        )}
                        <span className={styles.flipNote}>{b.note}</span>
                        {sourcesFor(b.name).length > 0 && (
                          <span className={styles.backLinks}>
                            {sourcesFor(b.name).map((o) => (
                              <span
                                key={o.href}
                                className={styles.backLink}
                                role="button"
                                tabIndex={0}
                                aria-label="Read more on another site"
                                onClick={(e) => { e.stopPropagation(); confirmLeave(o.href); }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); confirmLeave(o.href); }
                                }}
                              >
                                <span className={styles.backLinkIcon} aria-hidden="true" />
                              </span>
                            ))}
                          </span>
                        )}
                      </span>
                      {/* The existing flip icon, now interactive: taps turn the
                          card back. Below 480 only (pointer-events gated in CSS);
                          above 480 it stays the decorative icon it was, mouse
                          blocked, and turning it back to the front is a no-op. */}
                      <span
                        className={styles.deskBackFlip}
                        role="button"
                        tabIndex={0}
                        aria-label="Turn the card back"
                        onClick={(e) => { e.stopPropagation(); setFlipped(null); }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); setFlipped(null); }
                        }}
                      />
                    </span>
                    {kind && (
                      <span
                        className={`${styles.deskFlash} ${kind === "play" ? styles.deskFlashPlay : styles.deskFlashLearn}`}
                        aria-hidden="true"
                      />
                    )}
                  </span>
                </button>
                <span className={styles.nodeName}>{b.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div ref={trackRef} className={styles.stripScrollbar} aria-hidden="true">
        <div ref={thumbRef} className={styles.stripThumb} />
      </div>

      {modal}
    </div>
  );
}
