// Hidden Games Stage 1: the single campaign registry.
//
// This is the sole definition of the campaign per BRIEF section 3 ("One
// registry"). The total is deliberately NOT stored: it derives from the length
// of the games list, so it can never disagree with the list it counts.
// Nothing else defines the campaign version, mode or the qualifying games.

export const GAME_IDS = ["G01", "G02"] as const;
export type GameId = (typeof GAME_IDS)[number];

export interface GameDef {
  id: GameId;
  name: string;
  threshold: string;
}

export interface Registry {
  campaign_version: string;
  // Stage 1 is achievement only. The prize branch behind this field is not
  // written (BRIEF 1.1).
  mode: "ACHIEVEMENT_ONLY";
  opens_at: string | null;
  closes_at: string | null;
  games: GameDef[];
}

// Verbatim from BRIEF section 3. opens_at is an owner decision still open
// (BRIEF section 14) and is not consumed anywhere in Batch 1.
export const REGISTRY: Registry = {
  campaign_version: "HIDDEN_GAMES_2026_01",
  mode: "ACHIEVEMENT_ONLY",
  // Stage 1 is open-ended and opens when the campaign merges to main; the
  // lifecycle status controls whether it runs. So opens_at stays null rather
  // than a placeholder (owner decision, 29 July 2026).
  opens_at: null,
  closes_at: null,
  games: [
    {
      id: "G01",
      // Renamed from "Off Exploring" per CHANGE-LIST C01. This is a placeholder
      // wording describing the pit; the owner confirms the final visitor-facing
      // name before the found-games list ships (it is not rendered yet, D12).
      name: "The Main Pit",
      threshold:
        "First deliberate pointer interaction with the Main Pit on the home route",
    },
    {
      id: "G02",
      name: "The Lineage Game",
      threshold:
        "LineageModal running state transitions to true, any start path",
    },
  ],
};

// Derived, never stored (BRIEF 3, 4.3). The counter and completion check read
// this so they can never drift from the games list.
export const TOTAL = REGISTRY.games.length;

// The current record schema. Numbers are never reused (BRIEF 4.3): a record
// reading 1 or 2 is not valid Stage 1 progress.
export const RECORD_SCHEMA = 3 as const;

// One storage key per campaign version. A new version begins at zero because
// it reads and writes a different key (BRIEF 4.3, "version isolation").
export const STORAGE_KEY = `pedigree_hidden_games:${REGISTRY.campaign_version}`;

// A record expires 90 days after its updated_at value (BRIEF 4.3, "Expiry").
export const EXPIRY_DAYS = 90;
export const EXPIRY_MS = EXPIRY_DAYS * 24 * 60 * 60 * 1000;

export function isKnownId(id: string): id is GameId {
  return REGISTRY.games.some((g) => g.id === id);
}
