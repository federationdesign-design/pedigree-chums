"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readProgress, chumRate, PROGRESS_KEY, PROGRESS_EVENT, type Progress } from "../../lib/progress";
import { readLevelsDone, LEVELS_DONE_KEY, LEVELS_DONE_EVENT } from "../../lib/levelsDone";
import { mergeSnapshots, sanitise, type Snapshot } from "../../lib/saves/snapshot";
import { normaliseCode } from "../../lib/saves/codes";
import styles from "./MyProgress.module.css";

/* MY PROGRESS, 29 September 2026 (owner, J18-316). The save codes panel on /play.

   WHAT IT SHOWS. The figures the game keeps in this browser: levels done
   (pc-levels-done), the progress record (pc-progress) and facts seen
   (pc-facts-seen, kept by BreedTree as short hashes).

   SAVING. A code is made only when the player taps "Save my progress" (owner's
   decision). The code is kept in this browser (pc-save-code). From then on the
   panel sends the progress to the code by itself: when the page opens, whenever
   progress changes while it is open, and when the page is left. The server merges,
   never replaces, and sends the merged save back, which is written here too, so
   progress made on another device arrives as well.

   LOADING. Typing a code fetches that save, merges it with this browser's own
   progress (nothing here is lost) and writes the result back to both.

   ICO CHILDREN'S CODE. Nothing here asks a child to share anything. The code holds
   no personal data, and the wording tells the player to keep it to themselves. */

const CODE_KEY = "pc-save-code";
const FACTS_SEEN_KEY = "pc-facts-seen";
const SYNC_DELAY_MS = 2000;

type Status = "idle" | "working" | "saved" | "offline";

function readFactsSeen(): string[] {
  try {
    const list: unknown = JSON.parse(window.localStorage.getItem(FACTS_SEEN_KEY) ?? "[]");
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function localSnapshot(): Snapshot {
  return sanitise({ v: 1, levelsDone: [...readLevelsDone()], factsSeen: readFactsSeen(), progress: readProgress() }) as Snapshot;
}

/* Write a save into this browser. Only what changed is written, and only a change
   fires the game's events, so the green ticks and this panel refresh, and a save
   that comes back the same as it went out stops there. */
function writeLocal(s: Snapshot): void {
  const put = (key: string, value: unknown, event?: string) => {
    const text = JSON.stringify(value);
    if (window.localStorage.getItem(key) === text) return;
    window.localStorage.setItem(key, text);
    if (event) window.dispatchEvent(new Event(event));
  };
  try {
    put(FACTS_SEEN_KEY, s.factsSeen);
    put(LEVELS_DONE_KEY, s.levelsDone, LEVELS_DONE_EVENT);
    put(PROGRESS_KEY, s.progress, PROGRESS_EVENT);
  } catch {
    /* private mode or full storage: the save stays online only */
  }
}

async function api(method: "POST" | "GET" | "PUT", path: string, snapshot?: Snapshot): Promise<{ ok: boolean; code?: string; snapshot?: unknown; reason?: string }> {
  try {
    const res = await fetch(path, {
      method,
      headers: snapshot ? { "Content-Type": "application/json" } : undefined,
      body: snapshot ? JSON.stringify({ snapshot }) : undefined,
      cache: "no-store",
    });
    return await res.json();
  } catch {
    return { ok: false, reason: "offline" };
  }
}

type Figures = { levels: number; facts: number; progress: Progress };

export default function MyProgress() {
  const [figs, setFigs] = useState<Figures | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [copied, setCopied] = useState(false);
  const [typed, setTyped] = useState("");
  const [loadMsg, setLoadMsg] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const codeRef = useRef<string | null>(null);
  const timer = useRef<number | null>(null);

  const refresh = useCallback(() => {
    setFigs({ levels: readLevelsDone().size, facts: readFactsSeen().length, progress: readProgress() });
  }, []);

  const forgetCode = useCallback(() => {
    codeRef.current = null;
    setCode(null);
    try { window.localStorage.removeItem(CODE_KEY); } catch { /* nothing to forget */ }
  }, []);

  // Send this browser's progress to the code, and take the merged save back.
  const sync = useCallback(async () => {
    const c = codeRef.current;
    if (!c) return;
    setStatus("working");
    const r = await api("PUT", `/api/save/${encodeURIComponent(c)}`, localSnapshot());
    if (codeRef.current !== c) return; // the code changed while this was in flight
    if (r.ok) {
      const merged = sanitise(r.snapshot);
      if (merged) writeLocal(merged);
      setStatus("saved");
      refresh();
    } else if (r.reason === "not-found") {
      forgetCode();
      setStatus("idle");
      setSaveMsg("That save code has gone, so your progress is kept on this device only. You can make a new code.");
    } else {
      setStatus("offline");
    }
  }, [refresh, forgetCode]);

  const syncSoon = useCallback(() => {
    refresh();
    if (!codeRef.current) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { timer.current = null; void sync(); }, SYNC_DELAY_MS);
  }, [refresh, sync]);

  useEffect(() => {
    // First read after hydration: the server cannot see this browser's storage.
    const start = window.setTimeout(() => {
      refresh();
      let stored: string | null = null;
      try { stored = normaliseCode(window.localStorage.getItem(CODE_KEY) ?? ""); } catch { /* no storage */ }
      if (stored) { codeRef.current = stored; setCode(stored); void sync(); }
    }, 0);

    const onStorage = (e: StorageEvent) => {
      if (e.key === PROGRESS_KEY || e.key === LEVELS_DONE_KEY || e.key === FACTS_SEEN_KEY) syncSoon();
    };
    // Leaving the page: send anything still waiting.
    const onHide = () => {
      if (document.visibilityState !== "hidden" || !timer.current) return;
      window.clearTimeout(timer.current);
      timer.current = null;
      void sync();
    };
    window.addEventListener(PROGRESS_EVENT, syncSoon);
    window.addEventListener(LEVELS_DONE_EVENT, syncSoon);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, syncSoon);
      window.removeEventListener(LEVELS_DONE_EVENT, syncSoon);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onHide);
      window.clearTimeout(start);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [refresh, sync, syncSoon]);

  const makeSave = async () => {
    setSaveMsg(null);
    setStatus("working");
    const r = await api("POST", "/api/save", localSnapshot());
    const c = r.ok && r.code ? normaliseCode(r.code) : null;
    if (!c) {
      setStatus("idle");
      setSaveMsg(r.reason === "slow-down" ? "Too many tries. Wait a minute and try again." : "Saving did not work just now. Please try again later.");
      return;
    }
    codeRef.current = c;
    setCode(c);
    try { window.localStorage.setItem(CODE_KEY, c); } catch { /* the code still shows, for writing down */ }
    setStatus("saved");
  };

  const loadSave = async () => {
    setLoadMsg(null);
    const c = normaliseCode(typed);
    if (!c) { setLoadMsg("That does not look like a save code. It is three words and two numbers."); return; }
    setStatus("working");
    const r = await api("GET", `/api/save/${encodeURIComponent(c)}`);
    const theirs = r.ok ? sanitise(r.snapshot) : null;
    if (!theirs) {
      setStatus(codeRef.current ? "saved" : "idle");
      setLoadMsg(r.reason === "not-found" ? "We could not find that code. Check the words and try again." : r.reason === "slow-down" ? "Too many tries. Wait a minute and try again." : "Loading did not work just now. Please try again later.");
      return;
    }
    writeLocal(mergeSnapshots(localSnapshot(), theirs));
    codeRef.current = c;
    setCode(c);
    try { window.localStorage.setItem(CODE_KEY, c); } catch { /* the code still works for this visit */ }
    setTyped("");
    setLoadMsg("Progress loaded. Welcome back!");
    await sync(); // give the save anything this device had that it did not
  };

  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* no clipboard: the code is on screen to write down */
    }
  };

  const p = figs?.progress;
  const rate = p ? chumRate(p) : null;
  const stats: { label: string; value: string }[] = figs && p
    ? [
        { label: "Levels done", value: String(figs.levels) },
        { label: "Points", value: p.totalPoints.toLocaleString("en-GB") },
        { label: "Dogs found", value: String(Object.keys(p.dogsFound).length) },
        { label: "Chums collected", value: String(Object.keys(p.chums).length) },
        { label: "Chum rate", value: rate === null ? "-" : `${rate}%` },
        { label: "Best chum chain", value: String(p.recordChumChain) },
        { label: "Quiz answers right", value: String(p.quizRight) },
        { label: "Facts seen", value: String(figs.facts) },
      ]
    : [];

  return (
    <section className={styles.panel} aria-labelledby="my-progress-title">
      <h2 id="my-progress-title" className={styles.title}>My progress</h2>

      <dl className={styles.stats}>
        {stats.map((s) => (
          <div key={s.label} className={styles.stat}>
            <dt className={styles.statLabel}>{s.label}</dt>
            <dd className={styles.statValue}>{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className={styles.row}>
        <div className={styles.block}>
          {code ? (
            <>
              <p className={styles.label}>Your save code</p>
              <div className={styles.codeLine}>
                <span className={styles.code}>{code}</span>
                <button type="button" className={styles.btn} onClick={copyCode}>{copied ? "Copied" : "Copy"}</button>
              </div>
              <p className={styles.note}>Keep it to yourself, like a password. Your progress saves to it by itself.</p>
              <p className={styles.status} aria-live="polite">
                {status === "working" ? "Saving..." : status === "offline" ? "Could not save just now. We will try again." : status === "saved" ? "Saved" : ""}
              </p>
            </>
          ) : (
            <>
              <button type="button" className={`${styles.btn} ${styles.btnBig}`} onClick={makeSave} disabled={status === "working"}>
                {status === "working" ? "Saving..." : "Save my progress"}
              </button>
              <p className={styles.note}>You will get a secret code. Use it to carry on playing on another device.</p>
            </>
          )}
          {saveMsg && <p className={styles.msg} aria-live="polite">{saveMsg}</p>}
        </div>

        <div className={styles.block}>
          <label className={styles.label} htmlFor="my-progress-code">Got a save code?</label>
          <div className={styles.codeLine}>
            <input
              id="my-progress-code"
              className={styles.input}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void loadSave(); }}
              placeholder="PUG-BONE-SAUSAGE-42"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
            />
            <button type="button" className={styles.btn} onClick={loadSave} disabled={status === "working" || !typed.trim()}>Load</button>
          </div>
          {loadMsg && <p className={styles.msg} aria-live="polite">{loadMsg}</p>}
        </div>
      </div>
    </section>
  );
}
