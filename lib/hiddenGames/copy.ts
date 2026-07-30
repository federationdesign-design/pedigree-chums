// Hidden Games Stage 1: visitor-facing copy for the lifecycle and storage
// states. Every string here is owner-approved, verbatim from BRIEF section 7.
// The agent never writes or alters a word a visitor reads (BRIEF 7, 10.2), so
// these are copied, not composed.

// BRIEF 7, "Storage blocked".
export const STORAGE_BLOCKED =
  "Your browser is blocking game progress. You can still play, but the games you find cannot be saved on this device.";

// BRIEF 7, "Suspended".
export const SUSPENDED =
  "The Hidden Games challenge is temporarily unavailable. Your saved progress has not been changed. Please check back later.";

// BRIEF 7, "Closed": "This Hidden Games challenge has ended. You found {count}
// of {total} games." The tokens are resolved here from the active count and
// total, so no unresolved token ever reaches the browser (BRIEF 7).
export function closedMessage(count: number, total: number): string {
  return `This Hidden Games challenge has ended. You found ${count} of ${total} games.`;
}

// BRIEF 7, "Campaign introduction". Shown once, expanded, on a visitor's first
// view (D10).
export const CAMPAIGN_INTRO =
  "There are hidden games across the Pedigree Chums website. Find them all.";

// BRIEF 7, "Completion heading" and "Completion body". The two lines the
// completed counter shows at 2/2 (D11).
export const COMPLETION_HEADING = "You found every hidden game!";
export const COMPLETION_BODY =
  "You completed the first Pedigree Chums Hidden Games challenge.";

// CHANGE-LIST C03 prelude card, owner-approved verbatim. Line 1 renders in
// Unica One, line 2 in Luckiest Guy (the display font).
export const PRELUDE_WARNING = "Warning:";
export const PRELUDE_HEADING = "THIS WEBSITE MAY CONTAIN GAMES";

// CHANGE-LIST C02 discovery toast, owner-approved verbatim. {remaining} is
// resolved from the registry (total - count), never written into the copy as a
// literal, so it stays correct as games are added.
export function discoveryToast(remaining: number): string {
  return `Nice one! You found a hidden game. ${remaining} more to find.`;
}
