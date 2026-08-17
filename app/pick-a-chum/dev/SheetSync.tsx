'use client';

// Task 171: the client half of tester sheet-sync. Headless (renders null). It buffers each engine session's
// turns and posts a session ONLY when it is COMPLETE -- the visitor switched dogs (the previous session ends)
// or the page is unloading -- so a disclosure on turn 4 recalls turn 1 (per-turn posting could not). It is
// OFF unless fetchSheetSyncEnabled() resolves true (?rec=1 AND the runtime switch), in which case it registers
// a turn tap; otherwise it registers nothing at all. It sends to the same-origin /api/pc-sync route, which
// re-reads the kill switch server-side and forwards to the Apps Script, so the endpoint never reaches the
// client and an instant kill stops even a stale tab. Protected sessions are dropped in the buffer and never
// reach here. A failed post is swallowed: a tester whose network drops notices nothing.

import { useEffect } from 'react';
import { addTurnTap, fetchSheetSyncEnabled, TurnEvent } from '../lib/turn-tap';
import { SyncBuffer, Buffered } from './sheet-sync-buffer';
import { buildRow, buildAppearanceRow, enrichRows, buildSessions, TurnRow } from './recorder-store';

function payload(buf: Buffered[]): string {
  const rows = buf
    .map(({ e, ts }) => {
      if (e.trigger && e.trigger !== 'reply') return buildAppearanceRow(e, ts);
      return e.resolution && e.response ? buildRow(e, ts) : null; // a reply turn always carries both; guard anyway
    })
    .filter((r): r is TurnRow => r !== null);
  const turns = enrichRows(rows); // gapAfter / rephrase / lastTurn, exactly as the CSV export computes them
  const sessions = buildSessions(turns); // computed BEFORE the trim -- it reads outcome/protected/route
  // Task 174: trim route, outcome, protected and lastTurn from the exported turns (owner request), matching
  // the CSV COLUMNS. Stripped after buildSessions so the session summary still sees them.
  const exportTurns = turns.map(({ route, outcome, protected: _protected, lastTurn, ...rest }) => rest);
  return JSON.stringify({ turns: exportTurns, sessions });
}

export default function SheetSync() {
  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    fetchSheetSyncEnabled().then((on) => {
      if (cancelled || !on) return; // OFF: no tap, no buffer, no post
      const buffer = new SyncBuffer();
      const flush = (sessionId: string, beacon: boolean) => {
        const buf = buffer.take(sessionId);
        if (!buf) return; // dropped / protected / empty: nothing leaves
        const body = payload(buf);
        if (!body) return;
        try {
          if (beacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
            navigator.sendBeacon('/api/pc-sync', new Blob([body], { type: 'application/json' }));
          } else {
            fetch('/api/pc-sync', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body,
              keepalive: true,
            }).catch(() => {});
          }
        } catch {
          // never surface a sink failure
        }
      };
      const onTurn = (e: TurnEvent) => {
        const { completed } = buffer.onTurn(e, new Date().toISOString());
        if (completed) flush(completed, false); // a previous session just ended: post it now
      };
      const off = addTurnTap(onTurn);
      // The live session is posted on unload only, via sendBeacon. pagehide (not visibilitychange) so a mere
      // tab-away does not flush and then re-send the same session; a hard crash loses only the live session,
      // which is the safe direction (nothing leaks).
      const onHide = () => {
        const cur = buffer.currentSession();
        if (cur) flush(cur, true);
      };
      window.addEventListener('pagehide', onHide);
      cleanup = () => {
        off();
        window.removeEventListener('pagehide', onHide);
      };
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);
  return null;
}
