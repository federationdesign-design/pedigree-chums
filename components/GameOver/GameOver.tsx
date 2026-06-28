"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./GameOver.module.css";

type Props = { chums: number; score: number };

const DANCE_MS = 10000;
const FADE_MS  = 600;
const MAX_NAME = 8;
const STORAGE_KEY = "pc_scores";

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
    const entries: StoredEntry[] = JSON.parse(raw);
    // Daily reset -- remove entries from previous days
    return entries.filter(e => e.date === todayStr());
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
  const humanEntries = stored.map(e => ({ name: e.name, score: e.score, isDog: false }));
  // Add current player if named
  if (playerName) humanEntries.push({ name: playerName, score: playerScore, isDog: false });
  // Merge dogs + humans, sort, take top 3
  const all = [...dogs, ...humanEntries].sort((a, b) => b.score - a.score);
  // Deduplicate same name+score
  const seen = new Set<string>();
  return all.filter(e => { const k = `${e.name}:${e.score}`; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 3);
}

export default function GameOver({ chums, score }: Props) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [leaders, setLeaders] = useState(() => buildLeaderboard(score, null));
  const [showLeaders, setShowLeaders] = useState(false);

  useEffect(() => {
    // Show leaderboard after 1s
    const lt = window.setTimeout(() => setShowLeaders(true), 1000);
    const fadeTimer = window.setTimeout(() => {
      if (overlayRef.current) overlayRef.current.classList.add(styles.fadeOut);
    }, DANCE_MS);
    const navTimer = window.setTimeout(() => {
      router.push("/about");
    }, DANCE_MS + FADE_MS);
    return () => { clearTimeout(lt); clearTimeout(fadeTimer); clearTimeout(navTimer); };
  }, [router]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    const trimmed = name.trim().slice(0, MAX_NAME);
    saveScore(trimmed, score);
    setLeaders(buildLeaderboard(score, trimmed));
    setSubmitted(true);
    // Submit email to MailerLite/Resend if provided
    const trimEmail = email.trim();
    if (trimEmail && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimEmail)) {
      try {
        await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimEmail, consent: true }),
        });
      } catch {}
    }
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
      <div className={styles.inner}>
        <p className={styles.scoreDisplay}>{score.toLocaleString()} pts</p>
        <h1 className={styles.title}>
          {chums === 0
            ? "Ah deer, you were meant to grab some chums."
            : chums === 1
            ? "You had 1 chum!"
            : `You had ${chums} chums!`}
        </h1>

        {/* Name entry */}
        {!submitted ? (
          <div className={styles.nameEntry}>
            <input
              className={styles.nameInput}
              type="text"
              maxLength={MAX_NAME}
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              autoComplete="off"
            />
            <input
              className={`${styles.nameInput} ${styles.emailInput}`}
              type="email"
              placeholder="Email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              autoComplete="email"
            />
            <button className={styles.nameSubmit} onClick={handleSubmit} type="button">
              Add score
            </button>
          </div>
        ) : (
          <p className={styles.nameConfirm}>Score saved, {name.trim().slice(0, MAX_NAME)}!</p>
        )}

        {/* Leaderboard */}
        {showLeaders && (
          <div className={styles.leaderboard}>
            <p className={styles.leaderTitle}>Today&rsquo;s top chums</p>
            {leaders.map((dog, i) => (
              <div
                key={`${dog.name}${dog.score}`}
                className={`${styles.leaderRow}${!dog.isDog ? " " + styles.leaderRowHuman : ""}`}
                style={{ animationDelay: `${(2 - i) * 0.4}s` }}
              >
                <span className={styles.leaderPos}>{i + 1}</span>
                <span className={styles.leaderName}>{dog.name}</span>
                <span className={styles.leaderScore}>{dog.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.shareBtn} onClick={handleShare} type="button">
            Share score
          </button>
          <a href="/about" className={styles.continueBtn}>
            Continue &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
