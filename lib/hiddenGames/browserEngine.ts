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
  });
  return singleton;
}

// The public report entry point. Typed to the known Game IDs so game code gets a
// compile-time check; the engine still validates at runtime for any caller that
// reaches it as a plain string.
export function reportHiddenGame(gameId: GameId): void {
  getHiddenGamesEngine().reportHiddenGame(gameId);
}
