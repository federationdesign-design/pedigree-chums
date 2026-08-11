'use client';

// DEV / OPT-IN ONLY (Task 163). A tiny badge, mounted only when gapLogEnabled() (an explicit ?gaplog=1),
// that records the UNANSWERABLE inputs (the no-subject "im a dog" fallback) toward a content backlog while
// holding nothing about any one child. See gap-log.ts for the threshold (the real control), the redaction
// backstop, and the single-browser caveat. Off by default => this returns null and registers no tap.

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './DevRecorder.module.css';
import { addTurnTap, gapLogEnabled, TurnEvent } from '../lib/turn-tap';
import {
  isNoSubjectFallback, ingest, onProtected, rankedItems, loadStore, saveStore, emptyStore,
  newSessionState, GapStore, SessionState,
} from './gap-log';
import { applyProtection } from './session-protection';

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function GapLog() {
  const [mounted, setMounted] = useState(false);
  const [count, setCount] = useState(0); // number of backlog items (hashes at/over threshold)
  const storeRef = useRef<GapStore>(emptyStore());
  const sessionsRef = useRef<Map<string, SessionState>>(new Map());

  const sessionState = useCallback((id: string): SessionState => {
    let s = sessionsRef.current.get(id);
    if (!s) {
      s = newSessionState();
      sessionsRef.current.set(id, s);
    }
    return s;
  }, []);

  const refresh = useCallback(() => setCount(rankedItems(storeRef.current).length), []);

  useEffect(() => {
    setMounted(true);
    if (!gapLogEnabled()) return; // OFF by default: no sink registered, nothing collected
    loadStore().then((s) => {
      storeRef.current = s;
      refresh();
    });
    const onTurn = (e: TurnEvent) => {
      const store = storeRef.current;
      const sess = sessionState(e.sessionId);
      // Session protection is the shared rule (session-protection.ts, reused by Task 171 sheet-sync): a
      // protectedState turn latches the session; the FIRST time it does, discard the text it wrote (keep the
      // counts) and log nothing further. (The disclosure turn is a safety turn, not a fallback, so this is
      // how the gap-log learns a session went protected.)
      const p = applyProtection(sess, e);
      if (p !== 'clean') {
        if (p === 'just-protected') {
          onProtected(store, sess);
          saveStore(store).then(refresh);
        }
        return;
      }
      if (!isNoSubjectFallback(e.response?.responseId ?? '')) return; // only the unanswerable fallback
      ingest(store, sess, e.input);
      saveStore(store).then(refresh);
    };
    const off = addTurnTap(onTurn);
    return () => off();
  }, [refresh, sessionState]);

  const onExport = useCallback(() => {
    const items = rankedItems(storeRef.current);
    const head = 'input,count,bucket';
    const body = items.map((i) => [csvCell(i.input), i.count, csvCell(i.bucket)].join(',')).join('\n');
    const blob = new Blob([`${head}\n${body}\n`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pick-a-chum-gaps-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, []);

  if (!mounted || !gapLogEnabled()) return null;

  return (
    <div className={styles.badge} role="status" aria-label="Gap log">
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.label}>GAP</span>
      <span className={styles.stat}>
        backlog <b>{count}</b>
      </span>
      <button type="button" className={styles.export} onClick={onExport}>
        Export
      </button>
    </div>
  );
}
