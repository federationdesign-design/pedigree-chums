"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./GameOver.module.css";

type Props = { chums: number; score: number };

const MAX_NAME = 6;
const STORAGE_KEY = "pc_scores";
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ".split("");

interface StoredEntry { name: string; score: number; date: string; }

const DOG_POOL = [
  { name: "Rover",   scores: [28400, 34200, 19800, 42100, 31500] },
  { name: "Max",     scores: [22100, 38700, 15600, 29300, 44800] },
  { name: "Rolo",    scores: [18500, 27900, 41200, 33600, 12400] },
  { name: "Biscuit", scores: [9800,  16200, 24500, 38100, 21700] },
  { name: "Scruff",  scores: [47300, 31800, 22600, 39500, 14900] },
  { name: "Pickle",  scores: [7600,  13400, 19200, 28500, 35700] },
  { name: "Monty",   scores: [26500, 43100, 17800, 32400, 48200] },
  { name: "Bonnie",  scores: [11300, 24800, 37600, 20100, 29400] },
];

function todayStr() { return new Date().toDateString(); }

function getDogLeaderboard() {
  const seed = todayStr().split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = (n: number) => { const x = Math.sin(seed + n) * 10000; return x - Math.floor(x); };
  const shuffled = [...DOG_POOL].sort((a, b) => rng(a.name.charCodeAt(0)) - rng(b.name.charCodeAt(0)));
  return shuffled.slice(0, 3).map((dog, i) => ({
    name: dog.name,
    score: dog.scores[Math.floor(rng(i + 10) * dog.scores.length)],
    isDog: true,
  })).sort((a, b) => b.score - a.score);
}

function getStoredScores(): StoredEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as StoredEntry[]).filter(e => e.date === todayStr());
  } catch { return []; }
}

function saveScore(name: string, score: number) {
  try {
    const existing = getStoredScores();
    existing.push({ name, score, date: todayStr() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch {}
}

function buildLeaderboard(playerScore: number, playerName: string | null) {
  const dogs = getDogLeaderboard();
  const stored = getStoredScores();
  const humans = stored.map(e => ({ name: e.name, score: e.score, isDog: false }));
  if (playerName) humans.push({ name: playerName, score: playerScore, isDog: false });
  const all = [...dogs, ...humans].sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  return all.filter(e => {
    const k = `${e.name}:${e.score}`;
    if (seen.has(k)) return false;
    seen.add(k); return true;
  }).slice(0, 3);
}

export default function GameOver({ chums, score }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Arcade name entry: array of char indices, one active column
  const [chars, setChars] = useState<number[]>(Array(MAX_NAME).fill(0));
  const [activeCol, setActiveCol] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSaved, setEmailSaved] = useState(false);
  const [leaders, setLeaders] = useState(() => buildLeaderboard(score, null));
  const thirdPlaceScore = leaders[2]?.score ?? 0;
  const qualifies = score > thirdPlaceScore;

  const getName = () => chars.map(i => CHARS[i]).join("").trimEnd();

  const nudge = useCallback((dir: 1 | -1) => {
    setChars(prev => {
      const next = [...prev];
      next[activeCol] = (next[activeCol] + dir + CHARS.length) % CHARS.length;
      return next;
    });
  }, [activeCol]);

  const advance = useCallback(() => {
    if (activeCol < MAX_NAME - 1) setActiveCol(c => c + 1);
  }, [activeCol]);

  const back = useCallback(() => {
    if (activeCol > 0) setActiveCol(c => c - 1);
  }, [activeCol]);

  // Keyboard support
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (submitted) return;
      if (e.key === "ArrowUp") { e.preventDefault(); nudge(-1); }
      if (e.key === "ArrowDown") { e.preventDefault(); nudge(1); }
      if (e.key === "ArrowRight" || e.key === "Tab") { e.preventDefault(); advance(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); back(); }
      if (e.key === "Enter") handleSubmit();
      // Letter keys jump to that char
      if (e.key.length === 1) {
        const idx = CHARS.indexOf(e.key.toUpperCase());
        if (idx !== -1) {
          setChars(prev => { const n = [...prev]; n[activeCol] = idx; return n; });
          advance();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nudge, advance, back, activeCol, submitted]);

  const handleSubmit = () => {
    const n = getName();
    if (!n.trim()) return;
    saveScore(n, score);
    setLeaders(buildLeaderboard(score, n));
    setSubmitted(true);
  };

  const handleEmailSubmit = async () => {
    const trimEmail = email.trim();
    if (!trimEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimEmail)) return;
    try {
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimEmail, consent: true }),
      });
    } catch {}
    setEmailSaved(true);
  };

  const handleShare = async () => {
    const text = `I scored ${score.toLocaleString()} pts and found ${chums} chums in Pedigree Chums! 🐾 pedigreechums.co.uk`;
    if (navigator.share) {
      try { await navigator.share({ title: "Pedigree Chums", text, url: "https://pedigreechums.co.uk" }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(text); } catch {}
    }
  };

  return (
    <div ref={overlayRef} className={styles.overlay}>
      {/* Replay button */}
      <button className={styles.closeBtn} onClick={() => window.location.reload()} type="button" aria-label="Play again">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
          <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
        </svg>
      </button>

      {/* Score top-left */}
      <div className={styles.scoreDisplay}>
        <span className={styles.scoreNum}>{score.toLocaleString()}</span>
        <span className={styles.scorePts}> points</span>
      </div>

      <div className={styles.inner}>
        {/* Title */}
        <h1 className={styles.title}>
          {chums === 0
            ? "Ah deer, grab some chums next time!"
            : chums === 1
            ? "Well done, you found 1 chum!"
            : `Well done, you found ${chums} chums!`}
        </h1>

        {/* Leaderboard */}
        <div className={styles.leaderboard}>
          <p className={styles.leaderTitle}>Today&rsquo;s High Scores</p>
          {leaders.map((entry, i) => (
            <div key={`${entry.name}${entry.score}`}
              className={`${styles.leaderRow}${!entry.isDog ? " " + styles.leaderRowHuman : ""}`}>
              <span className={styles.leaderPos}>{i + 1}</span>
              <span className={styles.leaderName}>{entry.name}</span>
              <span className={styles.leaderScore}>{entry.score.toLocaleString()}</span>
            </div>
          ))}
        </div>

        {/* Arcade name entry -- only if score beats 3rd place */}
        {qualifies && !submitted ? (
          <div className={styles.nameSection}>
            <p className={styles.nameLabel}>Enter Name</p>
            <div className={styles.arcadeEntry}>
              {chars.map((ci, col) => (
                <div key={col} className={styles.arcadeCol}
                  onClick={() => setActiveCol(col)}>
                  <button type="button" className={styles.arcadeArrow}
                    onClick={(e) => { e.stopPropagation(); nudge(-1); }}>
                    ▲
                  </button>
                  <div className={`${styles.arcadeChar}${col === activeCol ? " " + styles.arcadeCharActive : ""}`}>
                    {CHARS[ci]}
                  </div>
                  <button type="button" className={styles.arcadeArrow}
                    onClick={(e) => { e.stopPropagation(); nudge(1); }}>
                    ▼
                  </button>
                </div>
              ))}
            </div>
            <button className={styles.nameSubmit} onClick={handleSubmit} type="button">
              Save Score
            </button>
          </div>
        ) : qualifies && submitted ? (
          <div className={styles.emailSection}>
            <p className={styles.nameConfirm}>Score saved, {getName()}!</p>
            {!emailSaved ? (
              <div className={styles.emailPill}>
                <input
                  className={styles.emailInput}
                  type="email"
                  placeholder="Add email to keep your score"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleEmailSubmit(); }}
                  autoComplete="email"
                />
                <button className={styles.emailSubmit} onClick={handleEmailSubmit} type="button">
                  ✓
                </button>
              </div>
            ) : (
              <p className={styles.emailConfirm}>Email saved!</p>
            )}
          </div>
        ) : null}

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.shareBtn} onClick={handleShare} type="button">
            Share Score
          </button>
          <button className={styles.continueBtn} onClick={() => window.location.assign("/about")} type="button">
            Continue &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}