// Hidden Games Stage 1: the single browser instance of the engine.
//
// One module-level singleton, built lazily on first access. Because the counter
// is mounted once in the root layout and the App Router keeps that client tree
// alive across route changes, this singleton is the cross-route mechanism the
// campaign needs; there is no global store in this codebase to join (BRIEF 6.1).
//
// reportHiddenGame is the one import every qualifying game will use in a later
// batch (BRIEF 3). No game imports it yet: G01 and G02 wiring is out of scope
// for Batch 1.

import type { GameId } from "./registry";
import { createEngine, type HiddenGamesEngine } from "./engine";
import { STATUS } from "./lifecycle";
import type { MeasurementEvent } from "./measure";

// Consent key, matching CookieBanner and Analytics (recon 03). GA4 loads only
// after the visitor accepts, so we gate explicitly on the same value: this is
// the first gtag('event') pattern in the repo. Measurement therefore covers
// consented visitors only (BRIEF 8), sends aggregate params only, and never
// throws so it cannot break the site.
const CONSENT_KEY = "pc-cookie-consent";

type Gtag = (command: string, name: string, params?: Record<string, unknown>) => void;

export function emitHiddenGamesEvent(event: MeasurementEvent): void {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(CONSENT_KEY) !== "accepted") return;
    const gtag = (window as unknown as { gtag?: Gtag }).gtag;
    if (typeof gtag === "function") {
      gtag("event", event.name, event.params ?? {});
    }
  } catch {
    // Measurement must never break play.
  }
}

let singleton: HiddenGamesEngine | null = null;

export function getHiddenGamesEngine(): HiddenGamesEngine {
  if (singleton) return singleton;
  singleton = createEngine({
    getItem: (key) =>
      typeof window !== "undefined" ? window.localStorage.getItem(key) : null,
    setItem: (key, value) => {
      if (typeof window !== "undefined") window.localStorage.setItem(key, value);
    },
    now: () => Date.now(),
    warn: (message) => {
      if (typeof console !== "undefined") console.warn(message);
    },
    status: STATUS,
    track: emitHiddenGamesEvent,
  });
  return singleton;
}

// The public report entry point. Typed to the known Game IDs so game code gets a
// compile-time check; the engine still validates at runtime for any caller that
// reaches it as a plain string.
export function reportHiddenGame(gameId: GameId): void {
  getHiddenGamesEngine().reportHiddenGame(gameId);
}

// Task 156: report a found hat. THE PROTECTED GUARD lives here, once, so every surface (the chat tap-
// cycle, the essay hero image, the Kennel Sketch drawing, the birthday clip) is covered: a session that
// has ever entered a protected safety state never advances the hat counter, never awards G10, and never
// triggers the Terrier's countdown -- a child who disclosed something gets no game toast. "pc-protected"
// is Pick a Chum's content-free protected flag (pcKeys.PROTECTED_FLAG); the literal avoids a UI import.
export function reportHat(hatId: string): void {
  if (typeof window !== "undefined") {
    try {
      if (window.sessionStorage.getItem("pc-protected")) return;
    } catch {
      return;
    }
  }
  getHiddenGamesEngine().reportHat(hatId);
}
