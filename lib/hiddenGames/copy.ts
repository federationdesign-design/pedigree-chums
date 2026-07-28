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
