"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import BreedTree from "../BreedTree/BreedTree";
import CookieBanner from "../CookieBanner/CookieBanner";
import ScoreTable from "../ScoreTable/ScoreTable";
import { BRAIN_PATH, BRAIN_ARTBOARD } from "../icons/brain";
import ShareCard from "../ShareCard/ShareCard";
import type { LineageNode } from "../../data/lineage";
import { levelThemeFor } from "../../data/levelThemes";
import css from "./LineageModal.module.css";
import { TAG_STYLE, nodeStatus, type BreedTag } from "../BreedTreeMap/BreedTreeMap";
import { useRouter } from "next/navigation";
import { reportHiddenGame } from "../../lib/hiddenGames/browserEngine";

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
function TitleRow({ img, name, status, isNarrow }: { img: string | null; name: string; status: BreedTag | null; isNarrow: boolean }) {
  return (
    <div className={css.titleRow}>
      {img && (
        <span className={css.titlePortraitWrap}>
          <img className={css.titlePortrait} src={img} alt="" draggable={false} />
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
  onClose: () => void;
  nextLevelLabel?: string;
  /* The next era's name, set only when the level just won is the last of its
     era. A message on the win screen and nothing more: the round carries on to
     the next level exactly as it would have, so the score and the run survive
     the join. */
  eraJoinLabel?: string;
  initialScore?: number;
  onScoreChange?: (s: number) => void;
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

export default function LineageModal({ name, image, character, lineage, onClose, nextLevelLabel, onNextLevel, onStartOver, initialScore, onScoreChange, era, lives, livesMax = 6, onLost, onSpendLife, onResetRun, nextLevelImage, levelNo, eraJoinLabel, onLevelChumRate, runChumRate, runLevels, onChumCaught, topChum }: Props) {
  const theme = levelThemeFor(era);
  // The close X asks before it closes. A round can take a couple of minutes to
  // build up, and losing it to a mis-tap in the corner is a rotten exit.
  const [exitAsk, setExitAsk] = useState(false);
  // read inside the key handler, which is bound once
  const exitAskRef = useRef(false);
  const [mounted, setMounted] = useState(false);
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
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => { exitAskRef.current = exitAsk; }, [exitAsk]);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const apply = () => setIsNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  const [score, setScore] = useState(initialScore ?? 0); // campaign total rides in across levels
  useEffect(() => { onScoreChange?.(score); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [score]);
  const [phase, setPhase] = useState<"play" | "won" | "lost">("play");
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
      {/* Score, fixed top-right beside where the in-pit close object starts.
          Hidden once the round is running: the number belongs to the menu and
          the end screens, and during play it competes with the lives indicator
          that now sits along the same edge. */}
      {!running && !learningActive && (
        <div className={css.scoreTotal + (scorePulse ? " " + css.scorePulse : "")} aria-label={`Score: ${score.toLocaleString("en-GB")}`}>
          {score.toLocaleString("en-GB")}
        </div>
      )}
      {/* Title floats over the pit and never affects its size. The level's own
          dog holds the top row and never moves. Whatever circle is being looked
          at is added underneath it rather than replacing it, so you can always
          see where you are as well as what you are on. The second row is only
          drawn once the two differ, which is why the resting state still reads
          as a single title. */}
      <div className={css.titleWrap}>
        <TitleRow img={image} name={name} status={levelStatus} isNarrow={isNarrow} />
        {shownName !== name && (
          <TitleRow img={shownImg} name={shownName} status={shownStatus} isNarrow={isNarrow} />
        )}
        {/* The global explanation (owner placement, option A): rides in the
            title wrap so it is on screen before any break panel opens.
            Verbatim from docs/lineage/BRIEF.md section 7. On narrow screens
            it appears only once the round is running (owner ruling,
            4 August): the LEARN title owns that band on the start screen,
            and the note still precedes any break panel. */}
        {/* Owner review: the note is off the start screen and the learn area
            entirely -- it belongs to a running round only. */}
        {running && !learningActive && (
          <p className={css.globalNote}>
            These family trees show likely historical influences. Ancient and medieval dogs were working types, not modern standardised breeds, so the percentages are illustrative rather than measured genetic results.
          </p>
        )}
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
          strokeByDepth
          tinted={false}
          onShownChange={setShownName}
          onShownImageChange={setShownImg}
          onShownStatusChange={setShownStatus}
          levelTheme={theme}
          onBackToLearn={backToLearn}
          startInLearn={resumeInLearn}
          playLabel={outOfLives ? "PLAY AGAIN" : "PLAY"}
          onPlayPressed={() => {
            // Out of lives, so this press is a fresh run, not a fresh round.
            if (outOfLives) { onResetRun?.(); setScore(0); }
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
            // Completed, so this level's catch counts toward the run.
            if (packSize > 0) onLevelChumRate?.((collectedChums.size / packSize) * 100);
            // celebration: confetti over the flash (canvas-confetti, CDN pattern)
            const fire = () => (window as any).confetti?.({ particleCount: 180, spread: 110, origin: { x: 0.5, y: 0.45 }, colors: ["#ffe227", "#ffffff", "#22c55e", "#ff6b6b"], startVelocity: 45 });
            if ((window as any).confetti) fire();
            else {
              const sc = document.createElement("script");
              sc.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js";
              sc.onload = fire;
              document.body.appendChild(sc);
            }
          }}
          onPitFull={() => { setPhase("lost"); onLost?.(); }}
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
        />
      )}

      {/* The cookie notice must be reachable above this overlay */}
      <CookieBanner />
    </div>,
    document.body,
  );
}
