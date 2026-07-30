"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import BreedTree from "../BreedTree/BreedTree";
import CookieBanner from "../CookieBanner/CookieBanner";
import { BRAIN_PATH, BRAIN_ARTBOARD } from "../icons/brain";
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
  // history-page era strip, e.g. "ancient-medieval". Picks the pit's themed
  // background; an era with no artwork keeps the plain blue gradient.
  era?: string;
};

export default function LineageModal({ name, image, character, lineage, onClose, nextLevelLabel, onNextLevel, onStartOver, initialScore, onScoreChange, era, lives, livesMax = 6, onLost, onSpendLife, onResetRun, nextLevelImage, levelNo }: Props) {
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
      </div>

      {/* The diagram owns everything below the header. BreedTree runs in
          fill + dockAside mode: caption and breadcrumbs docked at the top,
          circles filling the rest. The character text becomes the caption
          shown at root, replacing the old floating blue box. */}
      <div className={css.stageArea}>
        <BreedTree
          key={runKey}
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
          onChumCollected={(n) => setCollectedChums((prev) => (prev.has(n) ? prev : new Set(prev).add(n)))}
          hideCaption={!captionOpen}
          onCaptionClose={() => setCaptionOpen(false)}
          onScore={addScore}
          registerShake={(fn) => { shakeFnRef.current = fn; }}
          registerSlowmo={(fn) => { slowmoFnRef.current = fn; }}
          onToggleCaption={() => setCaptionOpen((o) => !o)}
          onPitClose={() => setExitAsk(true)}
          onRoundWon={() => {
            setPhase("won");
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
            {/* Ordered least destructive first, so the safe choice is the one
                under the thumb and the way out of the game is last. */}
            <div className={css.exitBtns}>
              <button
                type="button"
                className={`${css.endBtn} ${css.endBtnAlt}`}
                onClick={() => setExitAsk(false)}
                aria-label="Keep playing"
                autoFocus
              >
                Keep playing
              </button>
              <button
                type="button"
                className={css.endBtn}
                onClick={() => { setExitAsk(false); backToLearn(); }}
                aria-label="Go to the learn area"
              >
                Learn area
              </button>
              <button
                type="button"
                className={css.endBtn}
                onClick={() => { setExitAsk(false); backToStart(); }}
                aria-label="Back to the start screen"
              >
                Start screen
              </button>
              <button type="button" className={css.endBtn} onClick={onClose} aria-label="Leave the game">
                Leave game
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
                <span className={css.winBanner}>Ancestor discovered</span>
              </div>
              <div className={css.winScore}>Your Round Score: {score.toLocaleString()}</div>
              <div className={css.winFlash}>Round Won</div>
              {nextLevelLabel && onNextLevel ? (
                <>
                  <div className={css.winNextLead}>Next Level Up...</div>
                  <div className={css.winNextName}>{nextLevelLabel}</div>
                  {nextLevelImage ? (
                    <img className={css.winNextImg} src={nextLevelImage} alt="" aria-hidden="true" />
                  ) : null}
                  <button type="button" className={`${css.endBtnGo} ${css.winGo}`} onClick={onNextLevel}>Next Level</button>
                </>
              ) : (
                // Last level, so there is nothing to go on to. The way out has
                // to come back, or the player is stuck on this screen.
                <button type="button" className={`${css.endBtn} ${css.endBtnAlt} ${css.winGo}`} onClick={onClose}>Close</button>
              )}
            </div>
          ) : (
            <>
              <button type="button" className={css.endClose} onClick={onClose} aria-label="Close the pit">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <line x1="7" y1="7" x2="17" y2="17" />
                  <line x1="17" y1="7" x2="7" y2="17" />
                </svg>
              </button>
              <div className={css.endFlash} style={{ fontSize: "clamp(6.8rem, 24vw, 16rem)" }}>
                <span className={css.endFlashWord}>GAME</span>
                <span className={css.endFlashWord}>OVER</span>
              </div>
              {/* ICONS, not words. Restart wears the replay mark, Learn wears the
                  pit's own brain, imported rather than copied so the two cannot
                  drift apart. Both keep the button shapes they already had, so
                  the primary and secondary reading survives.
                  The labels move to aria-label: an icon-only control with no
                  accessible name is unusable with a screen reader. */}
              <div className={css.endBtns}>
                {/* RESTART, and it is offered whether or not lives remain.
                    It used to be gated on lives > 0, so a spent run had no way
                    back into the level at all: the only controls left were Learn
                    and the close X, and the X drops you out to the level strip.
                    That reads as "restart sent me back to the beginning" even
                    though Restart was never on screen.
                    With lives left it costs one and replays the level. With none
                    left it restores the run first, so you come back here with a
                    full set rather than being sent out to find your way in. */}
                {(onStartOver || onResetRun) && (
                  <button
                    type="button"
                    className={`${css.endBtn} ${css.endBtnIcon}`}
                    onClick={() => {
                      if (lives !== undefined && lives <= 0) { onResetRun?.(); replay(); return; }
                      onStartOver?.();
                    }}
                    aria-label={lives !== undefined && lives <= 0 ? "Start again on this level" : "Restart this level"}
                    title={lives !== undefined && lives <= 0 ? "Start again" : "Restart"}
                  >
                    {/* A background rather than an <img>: Next flags img elements,
                        and for a decorative icon with the label on the button
                        there is nothing an img gives us here. */}
                    <span className={`${css.endIcon} ${css.endIconReplay}`} aria-hidden="true" />
                  </button>
                )}
                <button type="button" className={`${css.endBtn} ${css.endBtnAlt} ${css.endBtnIcon}`} onClick={() => goLearn(false)} aria-label="Go to the learn area" title="Learn">
                  <svg className={css.endIcon} viewBox={`0 0 ${BRAIN_ARTBOARD.w} ${BRAIN_ARTBOARD.h}`} aria-hidden="true" focusable="false">
                    <path d={BRAIN_PATH} fill="currentColor" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* The cookie notice must be reachable above this overlay */}
      <CookieBanner />
    </div>,
    document.body,
  );
}
