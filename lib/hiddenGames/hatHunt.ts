// Task 156 (§4/§8): THE HAT HUNT -- the registry of the ten hats, and the shape of G10.
//
// PROPOSED SHAPE, pending owner approval before wiring (brief §4: "Report the registry shape before
// wiring it"). This file is the single source of the ten hats and the milestones; the counter, the
// record and the Terrier's countdown all read it, so nothing matches on the word "hat" in a filename
// (which would break the first time something is renamed).
//
// THE NEW REGISTRY SHAPE -- a game that is FOUND but UNFINISHED, which the campaign has never had:
//   - G10 joins the Hidden Games registry like any other game, so the /N counter and completion work
//     unchanged for G01-G09 (the total simply becomes 10).
//   - What is NEW is that G10's "found" is not a single event. An INTERNAL hat counter (the visitor
//     never sees it) drives three phases:
//         1-2 hats   silent, nothing visible
//         3 hats     reportHiddenGame('G10') fires -> G10 shows as FOUND in the counter, still unfinished
//         6 hats     the Terrier's countdown begins in the chat (4 to go, then 3, 2, one left)
//         10 hats    the hunt is COMPLETED -- his understated congratulations
//   - The found hats persist in the Hidden Games record as an ADDITIVE optional field `hats_found`
//     (the same treatment as intro_seen/completion_seen), so record_schema stays 3 and no earlier
//     record is invalidated. G10-found is derived (hats_found.length >= FOUND_AT), completion is
//     derived (hats_found.length >= TOTAL). The registry never stores a total (BRIEF 3).
//
// The suppression rule applies to the counter, the G10 award and the Terrier's messages: nothing fires
// if the session has EVER been protected (a child who disclosed something must not get a game toast).

export const HAT_GAME_ID = "G10" as const;

// Task 156 (§8): the Terrier counts you down IN THE CHAT, blunt, no enthusiasm -- from 6 hats to the
// understated congratulations at 10. Owner-approved copy. Keyed by the running found count. Each countdown
// line now names the find ("you found a hat!") so the first one a visitor sees (their 6th hat) says what
// they found and what is being counted, not a bare "4 to go". The 10-hat congratulations is unchanged.
export const HAT_COUNTDOWN_LINES: Record<number, string> = {
  6: "you found a hat! 4 to go",
  7: "you found a hat! 3 to go",
  8: "you found a hat! 2 to go",
  9: "you found a hat! one left",
  10: "thats ten. every hat found. not bad.",
};

// The milestones. FOUND_AT registers G10; COUNTDOWN_AT starts the Terrier counting; TOTAL completes.
// NOTE: there are ELEVEN hats but completion is TEN (HAT_TOTAL), by design -- nobody has to find every
// one, so a hat somewhere a visitor never goes can never lock them out. The countdown lines stop at 10,
// so an eleventh find AFTER completion looks up no line and does nothing: no error, no second congrats.
export const HAT_FOUND_AT = 3;
export const HAT_COUNTDOWN_AT = 6;
export const HAT_TOTAL = 10;

// A hat location kind, so the finder for each surface knows what it is looking at without parsing ids.
export type HatKind = "chat-profile" | "essay" | "mini-game" | "media";

export interface HatDef {
  id: string; // H01..H11
  kind: HatKind;
  // For a chat-profile hat: the dog and the portrait variant that reveals it (the tap-cycle in §3).
  dog?: "collie" | "labrador" | "boxer" | "terrier";
  variant?: string; // e.g. "hat1"
  where: string; // human-readable location, for the report and diagnostics
  // The Terrier's warmer-or-colder hint, vague on purpose (a place or a theme, never "click the third
  // one"), exactly like the game hints in registry.ts. AUTHORED BY THE AGENT, pending owner approval.
  hint: string;
}

// The eleven (owner-confirmed locations); completion is still ten (HAT_TOTAL). Seven ride the chat
// portraits (revealed by tapping through a dog's images, §3); one is the hero image of the smell-disease
// essay; one is the HAT drawing in the Collie's Kennel Sketch game; one is the party-hat pug in
// birthday.mp4, which counts ON PLAY; and the eleventh (bonus) is the dog-birthday panel on the history page.
export const HATS: HatDef[] = [
  { id: "H01", kind: "chat-profile", dog: "boxer", variant: "hat1", where: "Boxer chat portrait, 1st hat", hint: "keep tapping a face until the hats come out" },
  { id: "H02", kind: "chat-profile", dog: "boxer", variant: "hat2", where: "Boxer chat portrait, 2nd hat", hint: "the boxer has more than one" },
  { id: "H03", kind: "chat-profile", dog: "labrador", variant: "hat1", where: "Labrador chat portrait, 1st hat", hint: "the labrador dresses up too" },
  { id: "H04", kind: "chat-profile", dog: "labrador", variant: "hat2", where: "Labrador chat portrait, 2nd hat", hint: "the labrador has a spare" },
  { id: "H05", kind: "chat-profile", dog: "terrier", variant: "hat1", where: "Terrier chat portrait, 1st hat", hint: "one of mine, if you keep tapping" },
  { id: "H06", kind: "chat-profile", dog: "terrier", variant: "hat2", where: "Terrier chat portrait, 2nd hat", hint: "i have two" },
  { id: "H07", kind: "chat-profile", dog: "collie", variant: "hat1", where: "Collie chat portrait, hat", hint: "even the boss puts one on" },
  { id: "H08", kind: "essay", where: "the hero image of /dogs-at-work/the-dogs-teaching-medicine-how-to-smell-disease", hint: "theres one at the top of the disease-smelling essay" },
  { id: "H09", kind: "mini-game", where: "the HAT drawing (tenth sketch) in the Collie's Kennel Sketch game", hint: "the collie draws it in her sketch game, right at the end" },
  { id: "H10", kind: "media", where: "the party-hat pug in birthday.mp4 (counts on play)", hint: "say happy birthday and watch who turns up" },
  // The eleventh. Completion is still ten (above), so this is a bonus a visitor need never reach.
  { id: "H11", kind: "essay", where: "the dog-birthday.jpg image on the '58% buy their dog presents' panel on /britains-dog-history", hint: "some owners spoil us rotten. theres one on the history page, in the birthday bit" },
];

export function isKnownHat(id: string): boolean {
  return HATS.some((h) => h.id === id);
}

// The chat-profile hat for a given dog+variant, or null (so §3's tap-cycle can report it when a hat
// portrait is revealed, without knowing the id).
export function chatHatFor(dog: string, variant: string): HatDef | null {
  return HATS.find((h) => h.kind === "chat-profile" && h.dog === dog && h.variant === variant) ?? null;
}

// The single hats by kind, for the non-chat finders (the essay hero image, the Kennel Sketch identity
// drawing, the birthday-clip pug). Each surface reports its own id without hard-coding "H0x".
export const ESSAY_HAT_ID = "H08";
export const KENNEL_SKETCH_HAT_ID = "H09";
export const BIRTHDAY_HAT_ID = "H10";
export const BRITAIN_HISTORY_HAT_ID = "H11";
