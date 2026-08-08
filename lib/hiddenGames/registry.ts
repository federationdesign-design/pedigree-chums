// Hidden Games Stage 1: the single campaign registry.
//
// This is the sole definition of the campaign per BRIEF section 3 ("One
// registry"). The total is deliberately NOT stored: it derives from the length
// of the games list, so it can never disagree with the list it counts.
// Nothing else defines the campaign version, mode or the qualifying games.

export const GAME_IDS = ["G01", "G02", "G03", "G04", "G05", "G06", "G07", "G08", "G09", "G10", "G11"] as const;
export type GameId = (typeof GAME_IDS)[number];

export interface GameDef {
  id: GameId;
  name: string;
  threshold: string;
  // Task 148: the Terrier's warmer-or-colder hint at where this game is -- vague on purpose (a theme
  // or a dog, never "click the third card"), so finding stays finding. A new game brings its own hint.
  // AUTHORED BY THE AGENT, pending owner approval (brief section 7 / 10).
  hint: string;
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
      id: "G06",
      name: "Fetch",
      threshold:
        "The Collie is asked to play fetch and throws a random page link",
      hint: "one of us likes chasing things you throw. see what comes back",
    },
    {
      id: "G01",
      // Renamed from "Off Exploring" per CHANGE-LIST C01. This is a placeholder
      // wording describing the pit; the owner confirms the final visitor-facing
      // name before the found-games list ships (it is not rendered yet, D12).
      name: "The Main Pit",
      threshold:
        "First deliberate pointer interaction with the Main Pit on the home route",
      hint: "theres one right on the front, hiding in the pile of us",
    },
    {
      id: "G02",
      name: "The Lineage Game",
      threshold:
        "LineageModal running state transitions to true, any start path",
      hint: "theres one tangled up in the family trees",
    },
    // Task 123: the three in-chat Collie games (Pick a Chum). Each qualifies the
    // moment its opening surface is SERVED in the chat (game entered by name),
    // not on the first move. The bark game is deliberately NOT a qualifying game
    // (a single "woof" is a turn, not finding a game), so it has no row here.
    {
      id: "G03",
      name: "Nine-Square Sheep Management",
      threshold:
        "The Nine-Square board is served in the Pick a Chum chat (game entered by name), before any move",
      hint: "the collie has a squares game going, if you get her started",
    },
    {
      id: "G04",
      name: "Missing Sheep",
      threshold:
        "The Missing Sheep word is set and its masked tiles are served in the Pick a Chum chat, before any guess",
      hint: "someone round here keeps losing sheep. help find them",
    },
    {
      id: "G05",
      name: "Kennel Sketch Recognition",
      threshold:
        "The Kennel Sketch drawing is served in the Pick a Chum chat, before the first guess",
      hint: "theres one where you have to name a rough drawing",
    },
    // Task 146: the Labrador's game. Qualifies the moment its opening surface (the START line + the
    // first object's first clue) is served in the chat, on game_start, before any guess -- exactly
    // like the Collie's three. This takes the campaign TOTAL from 6 to 7.
    {
      id: "G07",
      name: "Treat Trail",
      threshold:
        "The Treat Trail first clue is served in the Pick a Chum chat (the Labrador's game entered by name), before any guess",
      hint: "the labrador will play if you so much as mention food",
    },
    // Task 147: the Border Terrier's game. Qualifies the moment its opening surface (the first case's
    // opening line + the three suspects) is served in the chat, on game_start, before any guess. This
    // takes the campaign TOTAL from 7 to 8.
    {
      id: "G08",
      name: "The Case of the Missing Biscuit",
      threshold:
        "The Missing Biscuit first case is served in the Pick a Chum chat (the Border Terrier's game entered by name), before any guess",
      hint: "a biscuit went missing. that ones mine",
    },
    // Task 149: the Labrador's second game. Qualifies the moment its opening surface (the cookie pills)
    // is served in the chat, on game_start, before any cookie is fed. Takes the campaign TOTAL 8 -> 9.
    {
      id: "G09",
      name: "Feed the Dog a Cookie",
      threshold:
        "The Feed the Dog a Cookie pills are served in the Pick a Chum chat (the Labrador's second game entered by name), before any cookie is fed",
      hint: "the labrador eats anything. offer him a cookie, even the not-food kind",
    },
    // Task 156: the Hat Hunt. The FIRST game that is FOUND but UNFINISHED -- an internal hat counter
    // (never shown) drives it: it registers as FOUND at 3 hats (this row's threshold), and COMPLETES at
    // 10 (derived from the record's hats_found, see hatHunt.ts + record.ts). It joins the campaign like
    // any other game, so the /N counter simply becomes 10.
    {
      id: "G10",
      name: "The Hat Hunt",
      threshold:
        "The internal hat counter reaches THREE found hats (of ten hidden across the site) -- found, though the hunt is not yet complete",
      hint: "some of us are wearing hats. keep tapping our faces, and look further out",
    },
    // Task 164: the Boxer's game, DO NOT PRESS THAT BUTTON. Qualifies the moment its control panel is
    // SERVED in the chat, on game_start, before any button is pressed (brief section 6) -- exactly like
    // the other in-chat games. This takes the campaign TOTAL from 10 to 11.
    {
      id: "G11",
      name: "Do Not Press That Button",
      threshold:
        "The Boxer's control panel is served in the Pick a Chum chat (his game entered by name), before any button is pressed",
      hint: "the boxer found a panel he was told not to touch. ask him to press the buttons",
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
