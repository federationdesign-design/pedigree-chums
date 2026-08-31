"use client";

import { useCallback, useEffect, useRef, useState, type Ref } from "react";
import { createPortal } from "react-dom";
import BreedTree from "../BreedTree/BreedTree";
import TimeTunnel from "../TimeTunnel/TimeTunnel";
import ScoreTable from "../ScoreTable/ScoreTable";
import { BRAIN_PATH, BRAIN_ARTBOARD } from "../icons/brain";
import ShareCard from "../ShareCard/ShareCard";
import type { LineageNode } from "../../data/lineage";
import { levelThemeFor } from "../../data/levelThemes";
import css from "./LineageModal.module.css";
import { TAG_STYLE, nodeStatus, type BreedTag } from "../BreedTreeMap/BreedTreeMap";
import { useRouter } from "next/navigation";
import { reportHiddenGame } from "../../lib/hiddenGames/browserEngine";
import MilestoneMessage from "../Milestone/MilestoneMessage";
import { MINI_PIT_MILESTONES as MS, milestoneLabel } from "../Milestone/milestones";

// Plain-language label for the status dot on the title portrait.
const STATUS_LABEL: Record<BreedTag, string> = {
  extinct: "Extinct",
  trending: "Trending",
  popular: "Popular",
  endangered: "Endangered",
  "in-decline": "In decline",
};

// Breed names longer than 11 characters break onto a second line at the
// nearest word boundary, so long names never force a tiny single line.
function titleLines(name: string): string[] {
  if (name.length <= 11 || !name.includes(" ")) return [name];
  const words = name.split(" ");
  let first = words[0];
  let i = 1;
  while (i < words.length && (first + " " + words[i]).length <= 11) {
    first += " " + words[i];
    i++;
  }
  const rest = words.slice(i).join(" ");
  return rest ? [first, rest] : [first];
}

// One line of the stacked title: round portrait, status dot, name. Pulled out
// because the level's dog and the circle being looked at are now drawn with the
// same markup, one above the other.
function TitleRow({ img, name, status, isNarrow, imgRef }: { img: string | null; name: string; status: BreedTag | null; isNarrow: boolean; imgRef?: Ref<HTMLImageElement> }) {
  return (
    <div className={css.titleRow}>
      {img && (
        <span className={css.titlePortraitWrap}>
          <img ref={imgRef} className={css.titlePortrait} src={img} alt="" draggable={false} />
          {status && (
            <span
              className={css.titleStatus}
              style={{ background: TAG_STYLE[status].bg }}
              title={STATUS_LABEL[status]}
              aria-label={STATUS_LABEL[status]}
            />
          )}
        </span>
      )}
      <h3 className={css.title}>
        {(isNarrow ? titleLines(name) : [name]).map((line, i, arr) => (
          <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
        ))}
      </h3>
    </div>
  );
}

type Props = {
  name: string;
  image: string;
  character?: string;
  fact?: string;
  lineage: LineageNode;
  /* The clicked history card's viewport rect, so the time tunnel's card dives
     from where it sat. Optional: absent means the tunnel dives from centre. */
  fromRect?: { x: number; y: number; w: number; h: number };
  onClose: () => void;
  nextLevelLabel?: string;
  /* The next era's name, set only when the level just won is the last of its
     era. A message on the win screen and nothing more: the round carries on to
     the next level exactly as it would have, so the score and the run survive
     the join. */
  eraJoinLabel?: string;
  initialScore?: number;
  onScoreChange?: (s: number) => void;
  /* THE BANKED TOTAL: the campaign score as it stood after the last level the
     player actually FINISHED. Everything below reverts to this figure, so a
     round that is lost or walked out of cannot leave its points behind.
     Undefined means nothing has been banked, which is the same as zero and is
     what failing the very first level correctly reports. */
  bankedScore?: number;
  /* Called with the score at the moment a level is COMPLETED, which is the only
     event that advances the banked total. The score is passed rather than read
     upstream so the two can never be a render out of step. */
  onBankScore?: (s: number) => void;
  onNextLevel?: () => void;
  // Photo of the level the player is about to unlock, for the Round Won screen.
  nextLevelImage?: string;
  onStartOver?: () => void;
  // Zero-based campaign level, straight through to the pit's start screen.
  levelNo?: number;
  // Lives are owned by the page, since they have to survive between levels.
  // The modal only displays them and decides whether a retry may be offered.
  lives?: number;
  livesMax?: number;
  onLost?: () => void;
  // Leaving a live round for the learn area costs a life. The page owns lives,
  // so it does the spending.
  onSpendLife?: () => void;
  // PLAY AGAIN on a spent run: the page restores lives and the campaign total.
  onResetRun?: () => void;
  /* This level's chum catch, as a percentage, reported once when the level is
     completed. The modal is keyed per level and remounts on every one, so the
     figure has to leave here or it goes with it. Silent when the level had no
     chums to catch: a level with nothing to collect is not a level you caught
     none of, and averaging in a nought would say it was. */
  onLevelChumRate?: (pct: number) => void;
  // The run so far, handed back down for the game over screen. Mean of every
  // completed level's percentage, and how many levels went into it.
  runChumRate?: number | null;
  runLevels?: number;
  /* Each catch as it happens, so the run can count which dog turns up most.
     A chum leaves this level's flood once taken, but the sets reset per level,
     so the same breed can be caught again in a later one. */
  onChumCaught?: (name: string) => void;
  // The most caught dog of the run, with its picture, for the spent screen.
  topChum?: { name: string; image: string; count: number } | null;
  // history-page era strip, e.g. "ancient-medieval". Picks the pit's themed
  // background; an era with no artwork keeps the plain blue gradient.
  era?: string;
};

export default function LineageModal({ name, image, character, lineage, fromRect, onClose, nextLevelLabel, onNextLevel, onStartOver, initialScore, onScoreChange, bankedScore, onBankScore, era, lives, livesMax = 6, onLost, onSpendLife, onResetRun, nextLevelImage, levelNo, eraJoinLabel, onLevelChumRate, runChumRate, runLevels, onChumCaught, topChum }: Props) {
  const theme = levelThemeFor(era);
  // The close X asks before it closes. A round can take a couple of minutes to
  // build up, and losing it to a mis-tap in the corner is a rotten exit.
  const [exitAsk, setExitAsk] = useState(false);
  // read inside the key handler, which is bound once
  const exitAskRef = useRef(false);
  const [mounted, setMounted] = useState(false);
  // The time-tunnel transition plays over the arriving pit on open, then removes
  // itself to reveal the pit (stage 1: rings + motes). Under reduced motion it
  // never mounts, so there is no flash and the pit is there at once. It stays
  // down after the first play, so an in-pit retry does not replay it: the tunnel
  // is the "enter the pit" moment, not a per-round one.
  const [tunnelActive, setTunnelActive] = useState(() => {
    if (typeof window === "undefined") return false;
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  // The tunnel drives the pit's entrance: the drop-in is held and the cluster ring
  // stays small until the tunnel signals the resolve. holdEntrance is a stable
  // mirror of "the tunnel is playing" (so under reduced motion the pit enters
  // normally, unheld); resolving flips once, when the tunnel begins clearing.
  const [holdEntrance] = useState(() => {
    if (typeof window === "undefined") return false;
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  const [resolving, setResolving] = useState(false);
  const [shownName, setShownName] = useState(name);
  const [shownImg, setShownImg] = useState<string | null>(image);
  const [shownStatus, setShownStatus] = useState<BreedTag | null>(null);
  // The top row's dot. The circles get theirs from nodeStatus too, so the two
  // rows cannot disagree about the same dog.
  const levelStatus = nodeStatus(name, lineage.note ?? "");
  const router = useRouter();
  const [leavePage, setLeavePage] = useState<{ slug: string; name: string } | null>(null);
  const [captionOpen, setCaptionOpen] = useState(false); // hidden behind the info icon (rolled back by request)
  // Chums collected on this level. Per level by decision, so no storage and no
  // reset: this component already unmounts when the level changes.
  const [collectedChums, setCollectedChums] = useState<Set<string>>(new Set());
  // The share overlay. Opened from the game over row, closed by its own back
  // arrow. Nothing navigates, so score, rate and topChum stay in scope.
  const [sharing, setSharing] = useState(false);
  /* The size of this level's pack, so the count can be read as a share.
     The flood reports what it tipped in, and anything already taken before it
     ran is added back, because the flood is handed a list with those already
     filtered out. Reset per level for free: this modal remounts on every one. */
  const [packSize, setPackSize] = useState(0);
  /* THE TITLE LADDER. The line from the level's own dog down to the circle
     being looked at, root first. Two steps deep it is level > parent > circle,
     which is the case this was built for. Deeper than that it does not fit, so
     the middle collapses into a count: see LADDER_ROWS below. */
  const [shownPath, setShownPath] = useState<{ name: string; img: string | null; status: BreedTag | null }[]>([]);
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => { exitAskRef.current = exitAsk; }, [exitAsk]);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const apply = () => setIsNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  // Publish the top-left level portrait's live screen position to BreedTree, so its
  // cluster connector points at the real image on every width, not a fixed guess.
  // A ResizeObserver is the primary trigger: it fires on mount for the first measure
  // AND whenever the portrait's rendered SIZE changes, which is exactly the narrow-
  // screen shrink (the portrait is responsive), so nothing caches a desktop size. A
  // window resize re-read is added for position-only reflows that keep the same size.
  // getBoundingClientRect gives the current centre and radius each time.
  // Callback ref: fires exactly when the portrait <img> attaches (and again with
  // null on detach), so the measure can never run before the node exists. The
  // RefObject + effect version raced and read null, so measure never ran and the
  // connector sat in its fixed-anchor fallback. Storing the node in state re-runs
  // the measure effect on attach.
  const [portraitEl, setPortraitEl] = useState<HTMLImageElement | null>(null);
  const portraitRef = useCallback((node: HTMLImageElement | null) => setPortraitEl(node), []);
  const [portraitAnchor, setPortraitAnchor] = useState<{ cx: number; cy: number; rad: number } | null>(null);
  useEffect(() => {
    const el = portraitEl;
    if (!el) { setPortraitAnchor(null); return; }
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (!r.width) return;
      setPortraitAnchor({ cx: r.left + r.width / 2, cy: r.top + r.height / 2, rad: r.width / 2 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [portraitEl]);
  const [score, setScore] = useState(initialScore ?? 0); // campaign total rides in across levels
  useEffect(() => { onScoreChange?.(score); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [score]);
  // Score-milestone celebration, ported from the main pit (shared ../Milestone).
  // The mini pit's score is a CAMPAIGN total that rides in via initialScore, and
  // this modal remounts per level, so msLast is seeded from initialScore, in the
  // ref initialiser so it is set BEFORE the trigger effect can run, to the highest
  // 5k mark already passed. Entering a level part way up the ladder then fires
  // nothing, and only milestones crossed DURING this level celebrate. Seeding late
  // (in an effect) would let a carried-in score fire every passed mark at once.
  const [milestone, setMilestone] = useState<{ value: number; label: string; id: number } | null>(null);
  const msLast = useRef(Math.floor((initialScore ?? 0) / MS.step) * MS.step);
  const [phase, setPhase] = useState<"play" | "won" | "lost">("play");
  // Fire only during play (never over the won/lost screens), and only for a NEW
  // milestone above the seeded high-water mark. The score can dip mid-play (the
  // learn shortcut costs points), so msLast is never lowered here: climbing back
  // past a mark already celebrated must not re-fire it. A fresh run (score reset
  // to 0) resets msLast at the reset sites instead. Allowed mid-play on purpose:
  // the running score is otherwise hidden then (it competes with the lives row),
  // but a one-off celebration is a different thing.
  useEffect(() => {
    if (phase !== "play") return;
    const reached = Math.floor(score / MS.step) * MS.step;
    if (reached >= MS.step && reached > msLast.current) {
      msLast.current = reached;
      setMilestone({ value: reached, label: milestoneLabel(MS, reached), id: performance.now() });
    }
  }, [score, phase]);
  useEffect(() => {
    if (!milestone) return;
    const t = window.setTimeout(() => setMilestone(null), 2600); // clears after the pop-out finishes
    return () => window.clearTimeout(t);
  }, [milestone]);
  /* The win screen's way on holds back for a beat. Pressed the instant the
     screen lands it did nothing, because the screen arrives before everything
     behind it has settled, so the press was going nowhere and reading as a dead
     button. It is a real timer rather than a CSS reveal on purpose: this is the
     only way off the screen, and decoration must never gate content. */
  const WIN_GO_DELAY_MS = 1200;
  const [goReady, setGoReady] = useState(false);
  useEffect(() => {
    if (phase !== "won") return;
    const t = window.setTimeout(() => setGoReady(true), WIN_GO_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [phase]);
  // The start screen is bare: no shake, no slow motion. They arrive with the
  // round, so nothing is offered that cannot do anything yet.
  const [running, setRunning] = useState(false);
  const [learningActive, setLearningActive] = useState(false);
  const [runKey, setRunKey] = useState(0);
  // The one-way gate. Learn to play is free: nothing is running yet, so there
  // is nothing to preserve. Play to learn costs a life and RESTARTS the round,
  // which is what keeps this cheap: the pit is remounted from scratch rather
  // than frozen and revived mid-flight. The score carries, so the learn area
  // is really a restart screen wearing something more useful.
  const [resumeInLearn, setResumeInLearn] = useState(false);
  const outOfLives = typeof lives === "number" && lives <= 0;
  // Straight there, no question asked. The switch is meant to feel abrupt.
  // Leaving a LIVE round costs a life. Leaving the game over screen does not:
  // the round is already spent, so charging again would be charging twice.
  const goLearn = (spend: boolean) => {
    if (spend) onSpendLife?.();
    // Same rule as backToStart: this remounts the pit, so the round is over
    // and its points do not survive it.
    if (spend) setScore(bankedScore ?? 0);
    setResumeInLearn(true);
    setPhase("play");
    setSlowmo(false);
    setCaptionOpen(false);
    setRunKey((k) => k + 1); // remounts the pit fresh, in learn
  };
  const backToLearn = () => goLearn(true);
  // Back to this level's start screen: the pit remounts unstarted, in play
  // rather than learn. Deliberately NOT replay(), which also zeroes the score:
  // that one belongs to a spent run. Charged a life for the same reason going
  // to learn is, since it abandons a live round, and a free escape from a
  // losing one would make the lives meaningless.
  const backToStart = () => {
    onSpendLife?.();
    // Abandoning a live round forfeits its points, exactly as losing it does.
    // Without this, backing out at the right moment was the cheapest way to
    // keep a big score without ever finishing the level.
    setScore(bankedScore ?? 0);
    setPhase("play");
    setResumeInLearn(false);
    setSlowmo(false);
    setCaptionOpen(false);
    setRunKey((k) => k + 1);
  };
  const replay = () => {
    setPhase("play");
    setResumeInLearn(false);
    setScore(0);
    msLast.current = 0; // fresh run: milestones celebrate again from the bottom
    setSlowmo(false); // a fresh pit always starts at full speed
    setCaptionOpen(false);
    setRunKey((k) => k + 1); // remounts the pit fresh
  };
  const [scorePulse, setScorePulse] = useState(false);
  const shakeFnRef = useRef<(() => void) | null>(null);
  const slowmoFnRef = useRef<(() => void) | null>(null);
  const [slowmo, setSlowmo] = useState(false);
  const addScore = (v: number) => {
    setScore((s) => s + v);
    setScorePulse(true);
    window.setTimeout(() => setScorePulse(false), 400);
  };

  /* THE TIME DRAIN. Ported from the main pit, PackPit.tsx, where it has always
     run: one point a second, four a second in slow motion, never below zero.

     WHY IT IS HERE NOW (31 August 2026, Steve). The mini pit had no drain at
     all, and that single omission is most of why a mini pit score reads
     drastically higher than a main pit one. A three minute main pit round
     quietly costs 180 points. The same round here cost nothing, so the only
     pressure on the clock was the player's patience.

     Four conditions have to hold, and each one is a real case, not caution:
       - `running`: the start screen is not a round, and a score must not bleed
         while nobody is playing.
       - `phase === "play"`: won and lost screens freeze the score, the same way
         gameOverRef freezes the main pit's.
       - not `learningActive`: the learn area is a reference layer over a paused
         round. The main pit does exactly this with lineageOpenRef.
       - slow motion costs 4x, matching the main pit, because slow motion buys
         accuracy and has to be paid for.

     Read through refs, so the interval is created once and never torn down and
     rebuilt as state changes. */
  const drainRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const phaseRef = useRef<"play" | "won" | "lost">("play");
  const slowmoDrainRef = useRef(false);
  const learningRef = useRef(false);
  useEffect(() => { runningRef.current = running; }, [running]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { slowmoDrainRef.current = slowmo; }, [slowmo]);
  useEffect(() => { learningRef.current = learningActive; }, [learningActive]);
  useEffect(() => {
    drainRef.current = window.setInterval(() => {
      if (!runningRef.current) return;
      if (phaseRef.current !== "play") return;
      if (learningRef.current) return;
      const drain = slowmoDrainRef.current ? 4 : 1;
      setScore((s) => Math.max(0, s - drain));
    }, 1000);
    return () => { if (drainRef.current) window.clearInterval(drainRef.current); };
  }, []); // once; every live value above is read through a ref inside the tick

  useEffect(() => setMounted(true), []);

  // G02 "The Lineage Game": the round has started. One effect on the running
  // state, per BRIEF 2.2. onStartedChange is wired to the stable setRunning
  // setter (line ~226), never an inline arrow, so effect 743 in BreedTree does
  // not re-fire per render. No dedup wrapper: a new round is a fresh key mount,
  // so running legitimately transitions again, and the engine dedupes by ID.
  useEffect(() => { if (running) reportHiddenGame("G02"); }, [running]);

  // NO COOKIE BANNER IN THE PIT, by design.
  //
  // This used to dispatch pc:open-cookies a second after the pit opened, which
  // asked the site-wide banner to appear. It could never be seen: the banner is
  // z-index 55 and this overlay is z-index 900 with an opaque background, so it
  // rendered underneath. That looked like a bug and was reported as one.
  //
  // It is not being lifted above the pit, because a banner is not what the pit
  // wants. The consent object here is the cookies-policy PANEL that falls into
  // the pit two seconds in: it gets in your way until you answer it, and
  // answering scores. Same consent, earned rather than nagged.

  useEffect(() => {
    // Escape closes the pit as before, but while the exit panel is up it answers
    // "no" instead. A stray key should never be the thing that ends a round.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (exitAskRef.current) { setExitAsk(false); return; }
      onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    document.body.classList.add("pc-modal-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      document.body.classList.remove("pc-modal-open");
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className={css.overlay} role="dialog" aria-modal="true" aria-label={name}>
      {/* The time tunnel covers the pit while it arrives, then removes itself. */}
      {tunnelActive && <TimeTunnel fromRect={fromRect} onResolve={() => setResolving(true)} onDone={() => setTunnelActive(false)} />}
      {/* Score, top of the pit on the same axis as the level portrait.

          SHOWN DURING PLAY AGAIN, 31 August 2026 (Steve), to match the main
          pit, where .scoreTotal sits in .controls and is never gated at all.

          THE REASON IT WAS HIDDEN HAS EXPIRED. The old note here said the
          number competed with the lives indicator along the same edge, and at
          the time that was true. The lives have since moved: see .lives in the
          stylesheet, "BOTTOM CENTRE ... Moved by request: the top left is now
          three things deep and the foot of the pit is empty." Nothing has sat
          on this axis since, so the gate was guarding against a collision that
          no longer exists.

          Still hidden in the LEARN area. That is a different screen with its own
          crowded top left, and a running score means nothing while the round is
          paused behind it. */}
      {!learningActive && (
        <div className={css.scoreTotal + (scorePulse ? " " + css.scorePulse : "")} aria-label={`Score: ${score.toLocaleString("en-GB")}`}>
          {score.toLocaleString("en-GB")}
        </div>
      )}
      {milestone && (
        <MilestoneMessage key={milestone.id} value={milestone.value} label={milestone.label} />
      )}
      {/* Title floats over the pit and never affects its size. The level's own
          dog holds the top row and never moves. Whatever circle is being looked
          at is added underneath it rather than replacing it, so you can always
          see where you are as well as what you are on. The second row is only
          drawn once the two differ, which is why the resting state still reads
          as a single title. */}
      {/* EVERY STEP SHOWS. An earlier pass collapsed the middle into a "+N"
          chip because a fourth row ran into the learn info box. Owner ruling:
          show them all. So instead of dropping rows the portrait shrinks
          itself, and --rows is how the stylesheet knows how far it has to go.
          One to three steps are unaffected, which is nearly every case; only
          the deepest circles of the deepest levels ever shrink. */}
      <div
        className={css.titleWrap}
        style={{ ["--rows" as string]: Math.max(1, shownPath.length || (shownName !== name ? 2 : 1)) }}
      >
        <TitleRow img={image} name={name} status={levelStatus} isNarrow={isNarrow} imgRef={portraitRef} />
        {shownPath.length > 1
          ? shownPath.slice(1).map((step, i) => (
              <TitleRow key={`${i}-${step.name}`} img={step.img} name={step.name} status={step.status} isNarrow={isNarrow} />
            ))
          : /* The path callback has not arrived yet: fall back to the old
               single-row comparison so the title is never blank. */
            shownName !== name && (
              <TitleRow img={shownImg} name={shownName} status={shownStatus} isNarrow={isNarrow} />
            )}
        {/* THE GLOBAL EXPLANATION IS GONE from the title band. Owner ruling.

            Its history, since it moved twice before this: it began on every
            screen, was then cut from the start screen and the learn area so it
            belonged to a running round only, and is now off the round as well.
            It sat directly under the title ladder, and once that ladder could
            run to several rows the paragraph was the only block of body copy on
            a screen that is otherwise pictures and names.

            The same caveat is still said where it is actually needed: the learn
            info box carries "Our best guess, not hard science." under every
            percentage breakdown, which is the place a reader meets a figure and
            might take it literally. Nothing has been lost, only moved off a
            screen that was not asking the question. */}
      </div>

      {/* The diagram owns everything below the header. BreedTree runs in
          fill + dockAside mode: caption and breadcrumbs docked at the top,
          circles filling the rest. The character text becomes the caption
          shown at root, replacing the old floating blue box. */}
      <div className={css.stageArea}>
        <BreedTree
          key={runKey}
          /* The pit needs the era by name as well as by theme: a thrown ball is
             retired for this era and returns in the next one. */
          era={era}
          levelName={name}
          root={lineage}
          rootImage={image}
          centred
          fill
          dockAside
          gravity
          holdEntrance={holdEntrance}
          resolve={resolving}
          strokeByDepth
          tinted={false}
          onShownChange={setShownName}
          onShownImageChange={setShownImg}
          onShownStatusChange={setShownStatus}
          onShownPathChange={setShownPath}
          levelTheme={theme}
          onBackToLearn={backToLearn}
          startInLearn={resumeInLearn}
          playLabel={outOfLives ? "PLAY AGAIN" : "PLAY"}
          onPlayPressed={() => {
            // Out of lives, so this press is a fresh run, not a fresh round.
            if (outOfLives) { onResetRun?.(); setScore(0); msLast.current = 0; } // fresh run: milestones from the bottom
          }}
          onStartedChange={setRunning}
          onLearningChange={setLearningActive}
          onRelativeTap={(slug, nm) => setLeavePage({ slug, name: nm })}
          levelNo={levelNo}
          collectedChums={collectedChums}
          onChumCollected={(n) => {
            setCollectedChums((prev) => (prev.has(n) ? prev : new Set(prev).add(n)));
            onChumCaught?.(n);
          }}
          onChumsDropped={(n) => setPackSize(n + collectedChums.size)}
          hideCaption={!captionOpen}
          onCaptionClose={() => setCaptionOpen(false)}
          onScore={addScore}
          portraitAnchor={portraitAnchor}
          registerShake={(fn) => { shakeFnRef.current = fn; }}
          registerSlowmo={(fn) => { slowmoFnRef.current = fn; }}
          onToggleCaption={() => setCaptionOpen((o) => !o)}
          /* NOTHING TO PAUSE, NOTHING TO CONFIRM. The X used to raise the
             PAUSED panel unconditionally, including on the learn and start
             screens where no round exists and there is nothing at stake. It
             only earns its place mid-round, where a stray tap in the corner
             would throw away a live game. */
          /* NOTHING TO PAUSE, NOTHING TO CONFIRM. On the learn and start screens
             there is no round, so the X closes outright.
             During a round the pit now handles it itself: the X drops a red
             leave and a green rewind into the pit, and tapping it again takes
             them away. Two deliberate taps, the same protection the PAUSED
             panel gave, without a screen over the game. */
          onPitClose={onClose}
          onBackToStart={backToStart}
          onRoundWon={() => {
            setPhase("won");
            /* BANK IT. Completing a level is the ONE event that advances the
               campaign total for good. Everything else, losing, restarting,
               going back to learn, walking out, returns the score to whatever
               was banked here last. */
            onBankScore?.(score);
            // Completed, so this level's catch counts toward the run.
            if (packSize > 0) onLevelChumRate?.((collectedChums.size / packSize) * 100);
            /* CONFETTI REMOVED 31 August 2026 (Steve): off-style, and the
               most expensive thing on screen at the worst possible moment.

               It fired 180 particles onto a fixed full-screen canvas at
               z-index 2147483647, sized innerWidth by innerHeight times a
               device pixel ratio of up to 2, and ran for about two seconds.
               Every frame cleared the whole canvas and drew 180 rotated
               shapes, each bone being five separate paths.

               Why that mattered here and not elsewhere: the mini pit steps its
               physics on a fixed 16.66ms accumulator clamped at MAX_ACC = 100
               (BreedTree.tsx). Past 100ms of backlog the surplus time is
               DISCARDED, so the pit does not catch up, it silently runs behind
               real time. Firing this on the win meant the celebration was
               competing with the pit for frames and dragging its clock. Do not
               reintroduce a full-screen per-frame canvas over a live pit. */
          }}
          /* THE ROUND IS LOST, SO ITS POINTS GO. The score returns to the
             banked figure before the lost screen renders, which is what puts
             the honest number in front of the player and, more to the point,
             into the ScoreTable below: a level you failed can no longer put
             you on the board. Nothing is clamped at zero, owner's call: a
             negative total is expected and allowed. */
          onPitFull={() => { setPhase("lost"); setScore(bankedScore ?? 0); onLost?.(); }}
          rootNote={character}
          onClose={onClose}
        />
        {/* Pit floor, same graphic as the main pit. A themed level brings its
            own ground art, so the default strip stands down rather than
            doubling up underneath it. */}
        {!theme && <img src="/floor-shortened-svg.svg" alt="" aria-hidden="true" className={css.floor} />}
      </div>

      {/* Slow motion, straight from the main pit: snail icon, sits above shake.
          Quarter speed while active, navy while on. */}
      {running && (
        <>
        <button
          type="button"
          className={`${css.slowmo}${slowmo ? " " + css.slowmoActive : ""}`}
          onClick={() => { slowmoFnRef.current?.(); setSlowmo((s2) => !s2); }}
          aria-label={slowmo ? "Normal speed" : "Slow motion"}
        >
          <img src="/svg-snail-icon.svg" alt="" aria-hidden="true" className={css.slowmoIcon} />
        </button>

        {/* Shake button, straight from the pit: jelly icon, bottom right */}
        <button
          type="button"
          className={css.shake}
          onClick={(e) => {
            shakeFnRef.current?.();
            const el = e.currentTarget;
            el.classList.add(css.shakeFlash);
            window.setTimeout(() => el.classList.remove(css.shakeFlash), 300);
          }}
          aria-label="Shake the pit"
        >
          <span className={css.shakeIcon} aria-hidden="true" />
        </button>
        </>
      )}

      {/* Lives belong to the round, not the menu. On the start screen there is
          nothing at stake yet, and the indicator sat over the title. It arrives
          with PLAY, alongside the shake and slow-motion controls. */}
      {running && typeof lives === "number" && (
        <div className={css.lives} aria-label={`${lives} of ${livesMax} lives left`}>
          <div className={css.livesBar} aria-hidden="true">
            {Array.from({ length: livesMax }, (_, i) => (
              <span key={i} className={`${css.lifePip}${i < lives ? "" : " " + css.lifePipSpent}`} />
            ))}
          </div>
        </div>
      )}

      {/* Tapping a related dog offers its page, gated by the same leave-game
          confirm so a stray tap never drops the player out mid-round. */}
      {leavePage && (
        <div
          className={css.exitOverlay}
          role="alertdialog"
          aria-modal="true"
          aria-label={`View ${leavePage.name}`}
          onClick={() => setLeavePage(null)}
        >
          <div className={css.exitPanel} onClick={(e) => e.stopPropagation()}>
            <div className={css.exitTitle}>LEAVE GAME</div>
            <div style={{ color: "#ffffff", fontWeight: 600, fontSize: 13, lineHeight: 1.4, margin: "2px 0 10px", textAlign: "center", maxWidth: 260 }}>
              Leave to view {leavePage.name}?
            </div>
            <div className={css.exitBtns}>
              <button type="button" className={css.endBtn} onClick={() => router.push(`/chums/${leavePage.slug}`)} aria-label={`View ${leavePage.name}`}>
                View
              </button>
              <button type="button" className={`${css.endBtn} ${css.endBtnAlt}`} onClick={() => setLeavePage(null)} aria-label="Stay in the game" autoFocus>
                Stay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit confirmation, raised by the close X rather than closing outright.
          Sits above the pit at z-index 320 and takes every pointer, so the pit
          is unreachable while it is up. Escape answers no, which is the safe
          direction for a stray key. */}
      {exitAsk && (
        <div
          className={css.exitOverlay}
          role="alertdialog"
          aria-modal="true"
          aria-label="Leave the game?"
          onClick={() => setExitAsk(false)}
        >
          <div className={css.exitPanel} onClick={(e) => e.stopPropagation()}>
            <div className={css.exitTitle}>PAUSED</div>
            {/* ICONS, in the same order and the same colours as the game over
                row, so the two menus read as one system: close, back to the
                start screen, keep playing, learn.
                Learn is inverted, blue with a yellow glyph, because it is the
                only one here that is not a way out of the round. */}
            <div className={css.exitBtns}>
              <button
                type="button"
                className={`${css.endBtn} ${css.endBtnIcon} ${css.endBtnRed}`}
                onClick={onClose}
                aria-label="Leave the game"
                title="Leave"
              >
                <svg className={css.endIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false"
                  stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" fill="none">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              </button>
              <button
                type="button"
                className={`${css.endBtn} ${css.endBtnIcon} ${css.endBtnGreen}`}
                onClick={() => { setExitAsk(false); backToStart(); }}
                aria-label="Back to the start screen"
                title="Start screen"
              >
                <svg className={css.endIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M12 5 L4 12 L12 19 Z" fill="currentColor" />
                  <path d="M21 5 L13 12 L21 19 Z" fill="currentColor" />
                </svg>
              </button>
              {/* KEEP PLAYING keeps the autoFocus. A keyboard user landing on
                  this menu should start on the option that changes nothing. */}
              <button
                type="button"
                className={`${css.endBtn} ${css.endBtnIcon} ${css.endBtnYellow}`}
                onClick={() => setExitAsk(false)}
                aria-label="Keep playing"
                title="Keep playing"
                autoFocus
              >
                <svg className={css.endIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M7 4 L19 12 L7 20 Z" fill="currentColor" />
                </svg>
              </button>
              <button
                type="button"
                className={`${css.endBtn} ${css.endBtnIcon} ${css.endBtnBlue}`}
                onClick={() => { setExitAsk(false); backToLearn(); }}
                aria-label="Go to the learn area"
                title="Learn"
              >
                <svg className={css.endIcon} viewBox={`0 0 ${BRAIN_ARTBOARD.w} ${BRAIN_ARTBOARD.h}`} aria-hidden="true" focusable="false">
                  <path d={BRAIN_PATH} fill="currentColor" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Round won / game over, main-pit flash styling */}
      {phase !== "play" && (
        <div className={`${css.endOverlay}${phase === "won" ? " " + css.winOverlay : ""}`} role="alertdialog" aria-label={phase === "won" ? "Round won" : "Game over"}>
          {/* Round Won is its own screen: what you just finished, what it was
              worth, and what is coming next. Next Level is the whole point of
              it, so there is no X competing with the button. Game Over keeps the
              older layout, since it is a different moment. */}
          {phase === "won" ? (
            <div className={css.winWrap}>
              <div className={css.winTop}>
                <span className={css.winDone}>
                  {/* Drawn rather than loaded: one less asset to ship, and it
                      cannot 404. Swap for artwork later if you want to. */}
                  <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
                    <circle cx="24" cy="24" r="22" fill="#22c55e" />
                    <path d="M14 24.5l7 7 13-14" fill="none" stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className={css.winDoneName}>
                    {titleLines(name).map((ln, i) => (
                      <span key={i} className={css.winDoneLine}>{ln}</span>
                    ))}
                  </span>
                </span>
                <span className={css.winTopRight}>
                  <span className={css.winBanner}>Ancestor discovered</span>
                  {/* THE RATE, under the banner. Shown whenever the level had
                      chums in it, INCLUDING a round where none were caught: nought
                      per cent is a rate, and hiding it is why you could not find
                      it on a round where you caught nothing. */}
                  {packSize > 0 && (
                    <span className={css.winRate}>
                      <span className={css.winRateTitle}>Chum rate:</span>
                      <span className={css.winRateValue}>
                        {Math.min(100, Math.round((collectedChums.size / packSize) * 100))}%
                      </span>
                      <span className={css.winRateDetail}>
                        {collectedChums.size} found from potentially{" "}
                        {Math.max(packSize, collectedChums.size)} chums
                      </span>
                    </span>
                  )}
                </span>
              </div>
              <div className={css.winScore}>Your Round Score: {score.toLocaleString()}</div>
              {/* The chums taken out of this level. The set already exists and
                  already resets per level, because the modal remounts on every
                  one, so this is only the reporting.
                  Hidden at zero rather than showing "0 chums": a level where the
                  reader collected nothing should not be told so. */}
              <div className={css.winFlash}>Round Won</div>
              {/* THE ERA JOIN. Two messages in one slot: the first lands with
                  the screen, the second pops over the top of it a beat later.
                  Sits ABOVE the next-level block rather than replacing it, so
                  the dog just finished keeps its own ending. */}
              {eraJoinLabel && (
                <div className={css.eraJoin} aria-label={`Era complete. Next era, ${eraJoinLabel}`}>
                  <span className={css.eraJoinDone} aria-hidden="true">Era complete</span>
                  <span className={css.eraJoinNext} aria-hidden="true">
                    <span className={css.eraJoinNextLead}>Next era</span>
                    <span className={css.eraJoinNextName}>{eraJoinLabel}</span>
                  </span>
                </div>
              )}
              {nextLevelLabel && onNextLevel ? (
                <>
                  <div className={css.winNextLead}>Next Level Up...</div>
                  <div className={css.winNextName}>{nextLevelLabel}</div>
                  {nextLevelImage ? (
                    <img className={css.winNextImg} src={nextLevelImage} alt="" aria-hidden="true" />
                  ) : null}
                </>
              ) : null}
              {/* THE FOOT. The count and the way on are one block pinned to the
                  bottom, so the count sits directly above the button on every
                  screen without a hand-worked offset chasing the button's own
                  clamps. */}
              <div className={css.winFoot}>
                {goReady && (nextLevelLabel && onNextLevel ? (
                  <button type="button" className={`${css.endBtnGo} ${css.winGo}`} onClick={onNextLevel}>Next Level</button>
                ) : (
                  // Last level, so there is nothing to go on to. The way out has
                  // to come back, or the player is stuck on this screen.
                  <button type="button" className={`${css.endBtn} ${css.endBtnAlt} ${css.winGo}`} onClick={onClose}>Close</button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* The close X has moved down into the button row. */}
              {/* SHARE, as a corner flash rather than a fifth icon. The row is
                  four ways out of the round; sharing is not one of them, and it
                  reads better as the card flashes on the history page do.
                  One SVG as a background, the same as flash-learn.svg. */}
              <button
                type="button"
                className={css.endShareFlash}
                onClick={() => setSharing(true)}
                aria-label="Share your score"
                title="Share your score"
              >
                <span className={css.endShareFlashText} aria-hidden="true" />
              </button>
              {/* The size lives in the stylesheet now, not here. An inline style
                  beats a media query, so desktop could never override it. */}
              <div className={css.endFlash}>
                <span className={css.endFlashWord}>GAME</span>
                <span className={css.endFlashWord}>OVER</span>
              </div>
              {/* THIS ROUND, on every life lost. The pack it was measured
                  against is the flood this level dropped, so it is the same
                  figure the win screen would have shown had it gone the other
                  way. Hidden when the level had no chums in it. */}
              {packSize > 0 && (
                <div className={css.endRound}>
                  <span className={css.endRoundTitle}>Chum rate:</span>
                  <span className={css.endRoundValue}>
                    {Math.min(100, Math.round((collectedChums.size / packSize) * 100))}%
                  </span>
                  <span className={css.endRoundDetail}>
                    {collectedChums.size} found from potentially{" "}
                    {Math.max(packSize, collectedChums.size)} chums
                  </span>
                </div>
              )}
              {/* THE RUN, not the round. Only when the lives are actually gone:
                  on a loss you can still come back from, a campaign total would
                  be reporting the end of something that is not over. */}
              {lives !== undefined && lives <= 0 && (
                <div className={css.endSummary}>
                  <div className={css.endSummaryScore}>Total score: {score.toLocaleString()}</div>
                  {runChumRate !== null && runChumRate !== undefined && (runLevels ?? 0) > 0 && (
                    <div className={css.endSummaryChums}>
                      Chums caught: {Math.round(runChumRate)}% average over {runLevels} level{runLevels === 1 ? "" : "s"}
                    </div>
                  )}
                  {topChum && (
                    <div className={css.endTopChum}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- a fixed-size square from the pack data */}
                      <img className={css.endTopChumImg} src={topChum.image} alt="" aria-hidden="true" />
                      <span className={css.endTopChumText}>
                        <span className={css.endTopChumLead}>Most caught</span>
                        <span className={css.endTopChumName}>{topChum.name}</span>
                        <span className={css.endTopChumCount}>
                          {topChum.count} time{topChum.count === 1 ? "" : "s"}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              )}
              <ScoreTable score={score} dogs={3} />
              {/* ICONS, not words. Restart wears the replay mark, Learn wears the
                  pit's own brain, imported rather than copied so the two cannot
                  drift apart. Both keep the button shapes they already had, so
                  the primary and secondary reading survives.
                  The labels move to aria-label: an icon-only control with no
                  accessible name is unusable with a screen reader. */}
              <div className={css.endBtns}>
                {/* ORDER AND COLOUR set by request: close, rewind, replay,
                    learn. Learn is inverted, a blue box with a yellow glyph,
                    which is the only one that reads as a different kind of
                    action rather than a way out. */}
                <button
                  type="button"
                  className={`${css.endBtn} ${css.endBtnIcon} ${css.endBtnRed}`}
                  onClick={onClose}
                  aria-label="Leave the game"
                  title="Leave"
                >
                  <svg className={css.endIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false"
                    stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" fill="none">
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="18" y1="6" x2="6" y2="18" />
                  </svg>
                </button>
                {/* REWIND, back to this level's start screen. Not a retry: no
                    life spent and no score reset, because the life for this
                    round has already gone and the score is what you keep. */}
                <button
                  type="button"
                  className={`${css.endBtn} ${css.endBtnIcon} ${css.endBtnGreen}`}
                  onClick={() => {
                    setPhase("play");
                    setResumeInLearn(false);
                    setSlowmo(false);
                    setCaptionOpen(false);
                    setRunKey((k) => k + 1);
                  }}
                  aria-label="Back to the start screen"
                  title="Start screen"
                >
                  <svg className={css.endIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M12 5 L4 12 L12 19 Z" fill="currentColor" />
                    <path d="M21 5 L13 12 L21 19 Z" fill="currentColor" />
                  </svg>
                </button>
                {(onStartOver || onResetRun) && (
                  <button
                    type="button"
                    className={`${css.endBtn} ${css.endBtnIcon} ${css.endBtnYellow}`}
                    onClick={() => {
                      if (lives !== undefined && lives <= 0) { onResetRun?.(); replay(); return; }
                      onStartOver?.();
                    }}
                    aria-label={lives !== undefined && lives <= 0 ? "Start again on this level" : "Restart this level"}
                    title={lives !== undefined && lives <= 0 ? "Start again" : "Restart"}
                  >
                    <span className={`${css.endIcon} ${css.endIconReplay}`} aria-hidden="true" />
                  </button>
                )}
                <button type="button" className={`${css.endBtn} ${css.endBtnIcon} ${css.endBtnBlue}`} onClick={() => goLearn(false)} aria-label="Go to the learn area" title="Learn">
                  <svg className={css.endIcon} viewBox={`0 0 ${BRAIN_ARTBOARD.w} ${BRAIN_ARTBOARD.h}`} aria-hidden="true" focusable="false">
                    <path d={BRAIN_PATH} fill="currentColor" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {sharing && (
        <ShareCard
          score={score}
          rate={packSize > 0 ? Math.min(100, Math.round((collectedChums.size / packSize) * 100)) : 0}
          chums={collectedChums.size}
          level={name}
          topChum={topChum}
          onClose={() => setSharing(false)}
          onExit={() => {
            // Out of the pit AND back to the top of the history page: the share
            // view is the end of the round, so it returns to the title slide
            // with its two ways in rather than to the panel the level was
            // opened from. The carousel listens for this; pages without one
            // ignore it.
            setSharing(false);
            onClose();
            window.dispatchEvent(new CustomEvent("pc:history-home"));
          }}
        />
      )}
    </div>,
    document.body,
  );
}
