// THE ONE session-protection rule, single-sourced (Task 163 gap log; reused by Task 171 sheet-sync). A turn
// that carries protectedState marks its session protected FOR GOOD: a caller that has BUFFERED a child's
// turns must discard the lot -- earlier turns included -- and keep nothing more from that session. `over`
// latches, so a session can never un-protect. There must be exactly one of these; a second, divergent copy
// of "when is a session protected and what gets dropped" is the drift this exists to prevent.

export interface Guard {
  over: boolean;
}
export function newGuard(): Guard {
  return { over: false };
}

// Apply the rule to a turn:
//   'just-protected' -- this turn latched the session (first time). The caller runs its one-time discard.
//   'protected'      -- the session was already latched. The caller keeps ignoring it.
//   'clean'          -- the session is still safe to buffer.
export function applyProtection(g: Guard, e: { protectedState?: string | null }): 'just-protected' | 'protected' | 'clean' {
  if (g.over) return 'protected';
  if (e.protectedState) {
    g.over = true;
    return 'just-protected';
  }
  return 'clean';
}
