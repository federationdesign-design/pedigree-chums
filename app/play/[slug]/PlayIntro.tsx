"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

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
  if (phase === "game") return <>{children}</>;
  return (
    <div
      onClick={() => setPhase("game")}
      role="button"
      aria-label="Skip the intro and start the game"
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#0a3a57", cursor: "pointer" }}
    >
      <video
        ref={vidRef}
        src={video}
        muted
        playsInline
        autoPlay
        preload="auto"
        onEnded={() => setPhase("game")}
        onError={() => setPhase("game")}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </div>
  );
}
