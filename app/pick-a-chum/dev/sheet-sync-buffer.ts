// Task 171: the sheet-sender's per-session buffer, kept PURE so the safety behaviour is unit-testable away
// from React. It holds each engine session's turns until the session is COMPLETE (the visitor switched dogs,
// closed, or the page is unloading) and only THEN are they built into rows and posted -- so a disclosure on
// turn 4 can still recall turn 1, which per-turn posting could not. Protection is the shared rule
// (session-protection.ts): a protectedState turn drops the whole session's buffer, earlier turns included,
// and latches it so nothing more is buffered from it. Nothing here posts; the caller flushes completed
// sessions.

import type { TurnEvent } from '../lib/turn-tap';
import { applyProtection, newGuard, Guard } from './session-protection';

export interface Buffered {
  e: TurnEvent;
  ts: string; // ISO capture time of this turn, so gapAfter is real rather than all-at-flush
}

export class SyncBuffer {
  private sessions = new Map<string, Buffered[]>();
  private guards = new Map<string, Guard>();
  private current: string | null = null;

  // Feed one turn. Returns the id of the session that just BECAME complete (the previous one, when the active
  // session changes), or null. The caller flushes a completed id via take(). A protected turn drops its
  // session's buffer here and returns whichever previous session completed, so the switch still flushes.
  onTurn(e: TurnEvent, ts: string): { completed: string | null } {
    const completed = this.current !== null && this.current !== e.sessionId ? this.current : null;
    this.current = e.sessionId;

    let guard = this.guards.get(e.sessionId);
    if (!guard) {
      guard = newGuard();
      this.guards.set(e.sessionId, guard);
    }
    if (applyProtection(guard, e) !== 'clean') {
      this.sessions.delete(e.sessionId); // drop earlier turns too; the latch keeps future ones out
      return { completed };
    }
    let buf = this.sessions.get(e.sessionId);
    if (!buf) {
      buf = [];
      this.sessions.set(e.sessionId, buf);
    }
    buf.push({ e, ts });
    return { completed };
  }

  // Remove and return a session's buffered turns (null if it was dropped/empty/protected). Clears its guard.
  take(sessionId: string): Buffered[] | null {
    const buf = this.sessions.get(sessionId);
    this.sessions.delete(sessionId);
    this.guards.delete(sessionId);
    if (sessionId === this.current) this.current = null;
    return buf && buf.length ? buf : null;
  }

  currentSession(): string | null {
    return this.current;
  }
}
