// Hidden Games Stage 1: measurement event vocabulary (BRIEF 8).
//
// Pure module: the event shape and the fixed set of names only, so the engine
// and node:test can reference them without touching the browser. The
// consent-gated emit that actually reaches GA4 lives in browserEngine.ts, since
// it needs window, localStorage and gtag.

export interface MeasurementEvent {
  name: string;
  // Aggregate parameters only. No message content, no cross-site identifier, no
  // personal data (BRIEF 8). game_id (G01 / G02) is campaign metadata, not
  // personal data.
  params?: Record<string, string | number>;
}

// The events BRIEF 8 asks for. G01-awarded and G02-awarded are one `award`
// event distinguished by the game_id param, which segments the same aggregate
// split in GA4 without a per-game event name.
export const HG_EVENTS = {
  visible: "hidden_games_visible",
  award: "hidden_games_award",
  completion: "hidden_games_completion",
  duplicate: "hidden_games_duplicate",
  unknownId: "hidden_games_unknown_id",
  storageBlocked: "hidden_games_storage_blocked",
} as const;
