'use client';

// DEV ONLY (stripped for production). A small, out-of-the-way badge that records
// every turn silently to IndexedDB and shows running counts while Steve tests on
// a Vercel preview. Zero friction: no save button, no per-conversation prompt.
// One control, Export, downloads the whole log as CSV. The badge never renders on
// a production host (recorderEnabled) and returns null until mounted so it cannot
// cause a hydration mismatch in the shipping tree.

import { useCallback, useEffect, useState } from 'react';
import styles from './DevRecorder.module.css';
import { setTurnTap, recorderEnabled, TurnEvent } from '../lib/turn-tap';
import { record, getAggregate, downloadBoth, Aggregate } from './recorder-store';

const EMPTY: Aggregate = { conversations: 0, messages: 0, missed: 0 };

export default function DevRecorder() {
  const [mounted, setMounted] = useState(false);
  const [agg, setAgg] = useState<Aggregate>(EMPTY);

  const refresh = useCallback(() => {
    getAggregate().then(setAgg).catch(() => {});
  }, []);

  useEffect(() => {
    setMounted(true);
    if (!recorderEnabled()) return;
    refresh(); // restore the running totals from earlier sessions
    const onTurn = (e: TurnEvent) => {
      record(e, new Date().toISOString())
        .then(refresh)
        .catch(() => {});
    };
    setTurnTap(onTurn);
    return () => setTurnTap(null);
  }, [refresh]);

  const onExport = useCallback(() => {
    // Task 159: two sheets -- the per-turn log and the per-session summary.
    downloadBoth(new Date().toISOString().replace(/[:.]/g, '-')).catch(() => {});
  }, []);

  if (!mounted || !recorderEnabled()) return null;

  return (
    <div className={styles.badge} role="status" aria-label="Conversation recorder">
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.label}>REC</span>
      <span className={styles.stat}>
        convos <b>{agg.conversations}</b>
      </span>
      <span className={styles.stat}>
        msgs <b>{agg.messages}</b>
      </span>
      <span className={styles.stat}>
        miss <b>{agg.missed}</b>
      </span>
      <button type="button" className={styles.export} onClick={onExport}>
        Export
      </button>
    </div>
  );
}
