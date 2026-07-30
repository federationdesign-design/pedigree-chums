"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ukBreeds, type UKBreed } from "../../data/uk-breeds";
import { breeds as packBreeds } from "../../data/breeds";
import { getLineage, type LineageNode } from "../../data/lineage";
import { resolveLineageName } from "../../data/lineageNames";
import LineageModal from "../../components/LineageModal/LineageModal";
import styles from "./history.module.css";

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
const LIVES_START = 3;
const LIVES_MAX = 6;
const LIVES_STREAK = 3;

const ERA_LABELS: Record<string, string> = {
  "ancient-medieval": "Ancient to medieval",
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
export type BreedStripOpen = (b: UKBreed) => (() => void) | undefined;

export default function BreedStrip({
  era,
  renderLevels,
}: {
  era: string;
  renderLevels?: (open: BreedStripOpen) => React.ReactNode;
}) {
  const router = useRouter();
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
  };
  const [active, setActive] = useState<Active | null>(null);
  // Bumped on a retry so the modal remounts even though the level name has not
  // changed. Without it, Restart on the same level would leave the round exactly
  // as it was lost.
  const [runKey, setRunKey] = useState(0);
  const [campaignScore, setCampaignScore] = useState(0); // carries across levels, resets on start over
  // Lives run alongside the score and last for one run at the pit, not for ever:
  // opening a level from the page starts you at three again. A retry spends one.
  // Three levels completed in a row earns one back, up to a ceiling of six, and
  // a loss breaks the streak, which is what "in a row" has to mean.
  const [lives, setLives] = useState(LIVES_START);
  const [streak, setStreak] = useState(0);

  // The mini pits are levels: every popup-capable breed, in timeline order
  // across all eras. Round Won advances to the next; Game Over restarts at
  // the very first.
  const STRIP_ORDER = ["ancient-medieval", "c1500", "c1700", "early1800", "spaniels", "mid1800", "late1800", "c1900", "crosses"];
  const buildActive = (b: UKBreed): Active | null => {
    const pn = resolveLineageName(b.name);
    const lin = getLineage(pn);
    if (!lin) return null;
    const pk = packBreeds.find((x) => x.name === pn);
    return { name: b.name, image: pk?.image ?? b.image ?? "", character: pk?.character ?? b.note, fact: pk?.fact, lineage: lin };
  };
  const levelList = ukBreeds
    .slice()
    .sort((a, b) => (STRIP_ORDER.indexOf(a.strip) - STRIP_ORDER.indexOf(b.strip)) || (a.anchor - b.anchor))
    .filter((b) => {
      const pn = resolveLineageName(b.name);
      return !packBreeds.find((x) => x.name === pn)?.slug && !!getLineage(pn);
    });
  const nextLevelOf = (name: string): UKBreed | null => {
    const i = levelList.findIndex((b) => b.name === name);
    return i >= 0 && i + 1 < levelList.length ? levelList[i + 1] : null;
  };

  /* What a tap on a dog does. Lifted out of the rail's own map so the slider
     gets the identical rule rather than a second version of it. The three
     outcomes are unchanged: a breed with its own page navigates there, a breed
     with a lineage opens a level as a fresh run, and anything else is not
     tappable. Measured across all 90 dogs: 62 open a level, 28 navigate, none
     fall through. */
  const openFor: BreedStripOpen = (b) => {
    const packName = resolveLineageName(b.name);
    const lineage = getLineage(packName);
    const pack = packBreeds.find((x) => x.name === packName);
    if (pack?.slug) return () => router.push(`/chums/${pack.slug}`);
    if (!lineage) return undefined;
    return () => {
      // opening a level from the page is a fresh run
      setLives(LIVES_START);
      setStreak(0);
      setActive({
        name: b.name,
        image: pack?.image ?? b.image ?? "",
        character: pack?.character ?? b.note,
        fact: pack?.fact,
        lineage,
      });
    };
  };

  const breeds: UKBreed[] = ukBreeds
    .filter((b) => b.strip === era)
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
  const modal = active && (
    <LineageModal
      key={`${active.name}:${runKey}`}
      era={era}
      initialScore={campaignScore}
      onScoreChange={setCampaignScore}
      nextLevelLabel={nextLevelOf(active.name)?.name}
      nextLevelImage={(() => { const nb = nextLevelOf(active.name); return nb ? buildActive(nb)?.image : undefined; })()}
      lives={lives}
      livesMax={LIVES_MAX}
      onNextLevel={() => {
        // a level completed: three in a row earns a life back
        setStreak((st) => {
          const next = st + 1;
          if (next % LIVES_STREAK === 0) setLives((l) => Math.min(LIVES_MAX, l + 1));
          return next;
        });
        const nb = nextLevelOf(active.name);
        const na = nb ? buildActive(nb) : null;
        if (na) setActive(na);
      }}
      onLost={() => setStreak(0)} // a loss breaks the run toward the next life
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
      }}
      onStartOver={() => {
        // A retry costs a life and replays THIS level. It used to rebuild
        // level one and wipe the campaign total, so failing level two threw
        // away every level already cleared as well as the score. Losing your
        // place is what running out of lives is for, and the modal only
        // offers Restart while lives remain.
        setLives((l) => Math.max(0, l - 1));
        setStreak(0);
        // The modal is keyed on the level name, so replaying the same one
        // would not remount and the round would not reset. The run counter
        // is what forces it.
        setRunKey((k) => k + 1);
      }}
      levelNo={Math.max(0, levelList.findIndex((b) => b.name === active.name))}
      name={active.name}
      image={active.image}
      character={active.character}
      fact={active.fact}
      lineage={active.lineage}
      onClose={() => setActive(null)}
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

  return (
    <div className={styles.strip} aria-label={`Breeds: ${ERA_LABELS[era]}`}>
      <span className={styles.stripLabel}>{ERA_LABELS[era]}</span>

      <div ref={wrapRef} className={styles.stripWrap}>
        <div ref={railRef} className={styles.stripRail} role="list">
          {breeds.map((b) => {
            /* packName, lineage and pack used to be resolved here purely to
               build the tap handler inline. openFor does that now, and nothing
               else in this markup used them. */
            const open = openFor(b);
            return (
              <div key={b.name} data-node className={styles.node} role="listitem">
                <span className={styles.nodeEra}>{b.era}</span>
                <button
                  type="button"
                  className={`${styles.flipCard} ${open ? styles.flipCardOpen : ""}`}
                  onClick={open}
                  aria-label={open ? `View ${b.name} family tree` : undefined}
                >
                  <span className={styles.flipInner}>
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
                    </span>
                    <span className={styles.flipBack}>
                      <span className={styles.flipBackInner}>
                        <span className={styles.flipNote}>{b.note}</span>
                        {open && (
                          <span className={styles.flipHint}>Tap to see the family tree</span>
                        )}
                      </span>
                    </span>
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
