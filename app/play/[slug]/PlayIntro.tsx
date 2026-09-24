"use client";

import { cloneElement, isValidElement, useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import Nav from "../../../components/Nav/Nav";
import heroBtn from "../../britains-dog-history-2/history2.module.css";
import { resetToys } from "../../../components/BreedTree/BreedTree";

/* THE CHUM'S INTRO VIDEO BEFORE ITS GAME, phones only (owner, 24 September 2026:
   a five second clip per chum, trialled on the Labrador first).

   THE ORDER. On a phone with a video for this chum, the clip plays full screen
   and the game is not mounted at all until it ends, so the round's own start
   (play screen at once, circles falling a second later) begins from the end of
   the clip. On a desktop, or a chum with no clip, the game mounts straight away.

   "A PHONE" IS THE PIT'S OWN TEST, max-width 640px, so the intro and the pit's
   mobile layout can never disagree about which screen they are on.

   IT CAN NEVER STRAND THE PLAYER. A tap skips it; a load error skips it; and if
   the browser refuses to autoplay (a phone in low power mode can), the clip is
   given up and the game starts. Muted and playsInline, which is what lets a
   phone autoplay at all. */

const MOBILE_QUERY = "(max-width: 640px)";

export default function PlayIntro({ video, children }: { video?: string; children: ReactNode }) {
  // Unknown until the browser has been asked, so nothing is drawn for that frame.
  const [phase, setPhase] = useState<"decide" | "video" | "game">("decide");
  const vidRef = useRef<HTMLVideoElement>(null);
  /* WATCHED TO THE END, the round starts the instant the clip does, with no
     second's wait (owner, 24 September 2026). A skip, an error or a refused
     autoplay keep the usual second, since nothing has just led into the game. */
  const [watched, setWatched] = useState(false);
  /* LEARN INSTEAD (owner, 24 September 2026): the intro's Learn button opens the
     chum's level in its learn area rather than starting the round. */
  const [learn, setLearn] = useState(false);

  /* A FRESH SET OF TOYS ON EVERY CHUM PLAY PAGE (owner, 24 September 2026). A toy
     thrown clear of the pit is retired for the whole visit, so after a few levels
     the small chum levels arrived with none. Arriving here un-retires them. The
     flag's read message and a given cookie consent are permanent and stay so.
     Runs before the game mounts, which waits at least a frame (see below). */
  useEffect(() => { resetToys(); }, []);

  // Decided once, on the first frame after mounting, so a later resize can never
  // bring the clip back over a game already running.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const mobile = window.matchMedia(MOBILE_QUERY).matches;
      setPhase(video && mobile ? "video" : "game");
    });
    return () => cancelAnimationFrame(id);
  }, [video]);

  useEffect(() => {
    if (phase !== "video") return;
    const v = vidRef.current;
    if (!v) return;
    v.play().catch(() => setPhase("game"));
  }, [phase]);

  if (phase === "decide") return null;
  if (phase === "game") {
    type StripProps = { arrivalDelayMs?: number; playOnArrival?: boolean; autoLearn?: boolean };
    if (learn && isValidElement(children)) {
      return cloneElement(children as ReactElement<StripProps>, { playOnArrival: false, autoLearn: true });
    }
    if (watched && isValidElement(children)) {
      return cloneElement(children as ReactElement<StripProps>, { arrivalDelayMs: 0 });
    }
    return <>{children}</>;
  }
  return (
    <>
    {/* THE SITE'S MENU AND ACCESSIBILITY SQUARES, top right, over the clip (owner,
        24 September 2026). The clip sits UNDER the nav bar (its z-index 300) so
        the squares stay on top, and the menu itself still opens over everything.
        NOT hideLogo: that removes the logo from the bar, which spaces its children
        to both ends, so the squares fell to the LEFT. The default keeps the logo
        in place but invisible until the page scrolls, as on the rest of the site,
        and this screen never scrolls, so only the squares ever show, on the right. */}
    <Nav />
    <div
      onClick={() => setPhase("game")}
      style={{ position: "fixed", inset: 0, zIndex: 250, background: "#0a3a57", cursor: "pointer" }}
    >
      <video
        ref={vidRef}
        src={video}
        muted
        playsInline
        autoPlay
        preload="auto"
        onEnded={() => { setWatched(true); setPhase("game"); }}
        onError={() => setPhase("game")}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      {/* TWO BUTTONS IN THE HISTORY HERO'S STYLE (owner, 24 September 2026),
          the same classes as its First dog and First era, so they cannot drift:
          green SKIP VIDEO starts the round, blue LEARN opens the learn area.
          Across the foot, 18px in, clear of the phone's home bar. */}
      <div
        className={heroBtn.introBtnRow}
        style={{ position: "absolute", left: 18, right: 18, bottom: "calc(18px + env(safe-area-inset-bottom, 0px))", width: "auto", marginTop: 0 }}
      >
        <button type="button" className={heroBtn.introBtn} onClick={(e) => { e.stopPropagation(); setPhase("game"); }}>
          Skip video
        </button>
        <button type="button" className={`${heroBtn.introBtn} ${heroBtn.introBtnAlt}`} onClick={(e) => { e.stopPropagation(); setLearn(true); setPhase("game"); }}>
          Learn
        </button>
      </div>
    </div>
    </>
  );
}
