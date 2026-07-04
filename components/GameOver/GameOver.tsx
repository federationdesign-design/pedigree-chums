"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./GameOver.module.css";

type Props = { chums: number; score: number; collectedBreeds?: { name: string; img: string }[]; allCollected?: boolean };

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
  return shuffled.slice(0, 7).map((dog, i) => ({
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
  }).slice(0, 10);
}

export default function GameOver({ chums, score, collectedBreeds = [], allCollected = false }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<number | null>(null);
  const resetIdleTimer = () => {
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => window.location.assign("/about"), 10000);
  };
  useEffect(() => { resetIdleTimer(); return () => { if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current); }; }, []);

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

  const [shareState, setShareState] = useState<"idle" | "generating" | "ready" | "shared">("idle");
  const [shareDataUrl, setShareDataUrl] = useState<string | null>(null);
  const [deckHover, setDeckHover] = useState<number | null>(null);

  const generateScoreCard = (): Promise<string> => new Promise((resolve) => {
    const W = 1080, H = 1080;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#0a3a57"; ctx.fillRect(0, 0, W, H);
    const grad = ctx.createRadialGradient(W/2, H*0.4, 0, W/2, H*0.4, W*0.8);
    grad.addColorStop(0, "rgba(20,151,214,0.45)"); grad.addColorStop(1, "rgba(12,91,146,0.1)");
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#ffd23e"; ctx.font = "bold 68px Arial Black, sans-serif"; ctx.textAlign = "center";
    ctx.fillText("PEDIGREE CHUMS", W/2, 130);
    ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.fillRect(80, 155, W-160, 3);
    ctx.fillStyle = "#ffffff"; ctx.font = "bold 44px Arial, sans-serif"; ctx.fillText("MY SCORE", W/2, 240);
    ctx.fillStyle = "#ffd23e"; ctx.font = "bold 180px Arial Black, sans-serif";
    ctx.fillText(score.toLocaleString(), W/2, 430);
    ctx.fillStyle = "#ffffff"; ctx.font = "bold 44px Arial, sans-serif";
    ctx.fillText(`${chums} Chums Found`, W/2, 510);
    ctx.strokeStyle = "rgba(255,210,62,0.3)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(120, 560); ctx.lineTo(W-120, 560); ctx.stroke();
    const shown = collectedBreeds.slice(-8);
    if (shown.length === 0) {
      ctx.fillStyle = "#ffd23e"; ctx.font = "bold 38px Arial, sans-serif";
      ctx.fillText("Can you beat my score? 🐾", W/2, 700);
      ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "32px Arial, sans-serif";
      ctx.fillText("pedigreechums.co.uk", W/2, 760);
      resolve(canvas.toDataURL("image/png")); return;
    }
    const sz = 110, gap = 16, totalW = shown.length * sz + (shown.length-1)*gap;
    let x = (W - totalW) / 2; let loaded = 0;
    shown.forEach((breed) => {
      const bx = x; x += sz + gap;
      const img = new Image(); img.crossOrigin = "anonymous";
      const finish = () => { loaded++; if (loaded === shown.length) {
        ctx.fillStyle = "#ffd23e"; ctx.font = "bold 38px Arial, sans-serif";
        ctx.fillText("Can you beat my score? 🐾", W/2, 760);
        ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "32px Arial, sans-serif";
        ctx.fillText("pedigreechums.co.uk", W/2, 820);
        resolve(canvas.toDataURL("image/png"));
      }};
      img.onload = () => {
        ctx.save(); ctx.beginPath(); ctx.arc(bx+sz/2, 650, sz/2, 0, Math.PI*2); ctx.clip();
        ctx.drawImage(img, bx, 600, sz, sz); ctx.restore();
        ctx.strokeStyle = "#ffd23e"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(bx+sz/2, 650, sz/2, 0, Math.PI*2); ctx.stroke();
        finish();
      };
      img.onerror = finish;
      img.src = breed.img;
    });
  });

  const handleShare = async () => {
    setShareState("generating");
    const dataUrl = await generateScoreCard();
    setShareDataUrl(dataUrl);
    setShareState("ready");
  };

  const doShare = (method: "download" | "instagram" | "copy") => {
    const text = `I scored ${score.toLocaleString()} pts and found ${chums} chums in Pedigree Chums! Can you beat me? 🐾 #PedigreeChums #DogSpotting pedigreechums.co.uk`;
    if ((method === "download" || method === "instagram") && shareDataUrl) {
      const a = document.createElement("a"); a.href = shareDataUrl; a.download = "pedigree-chums-score.png"; a.click();
      if (method === "instagram") window.setTimeout(() => window.open("https://www.instagram.com", "_blank"), 600);
    }
    if (method === "copy") navigator.clipboard.writeText(text).catch(() => {});
    setShareState("shared"); window.setTimeout(() => setShareState("ready"), 2500);
  };

  return (
    <div ref={overlayRef} className={styles.overlay} onClick={resetIdleTimer} onKeyDown={resetIdleTimer}>


      {/* Score top-left */}
      <div className={styles.scoreDisplay}>
        <span className={styles.scoreNum}>{score.toLocaleString()}</span>
        <span className={styles.scorePts}> points</span>
      </div>

      <div className={styles.inner}>
        {/* Collected chums deck */}
        {collectedBreeds.length > 0 && (
          <div className={styles.chumDeck}>
            {collectedBreeds.slice().reverse().map((c, i) => {
              const isHov = deckHover === i;
              const total = collectedBreeds.length;
              const spread = Math.min(96, 540 / Math.max(total, 1));
              const offset = i * spread;
              return (
                <div
                  key={i}
                  className={styles.chumDeckCard}
                  style={{
                    left: offset,
                    zIndex: isHov ? total + 1 : i,
                    transform: isHov ? "translateY(-20px) scale(1.15)" : "translateY(0) scale(1)",
                    transition: "transform 0.2s cubic-bezier(0.22,1,0.36,1)",
                  }}
                  onMouseEnter={() => setDeckHover(i)}
                  onMouseLeave={() => setDeckHover(null)}
                >
                  {c.img
                    ? <img src={c.img} alt={c.name} />
                    : <div style={{ width: "100%", height: "100%", background: "#0a3a57", borderRadius: "inherit" }} />
                  }
                  {isHov && (
                    <div className={styles.chumDeckLabel}>{c.name}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Title */}
        {allCollected && (
          <div className={styles.allCollectedPaw} aria-hidden="true">🐾</div>
        )}
        <h1 className={styles.title}>
          {allCollected
            ? "YOU GOT 'EM ALL!"
            : chums === 0
            ? "You have no chums and your... tell you what, grab some chums next time!"
            : chums === 1
            ? "Well done, you found 1 chum!"
            : `Well done, you found ${chums} chums!`}
        </h1>
        {allCollected && (
          <p className={styles.allCollectedSub}>ALL 54 CHUMS COLLECTED</p>
        )}

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
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            {shareState === "idle" && (
              <button className={styles.shareBtn} onClick={handleShare} type="button">📸 Create Score Card</button>
            )}
            {shareState === "generating" && (
              <p style={{ color: "#ffd23e", fontFamily: "'Luckiest Guy', system-ui", fontSize: 16, margin: 0 }}>Creating your card...</p>
            )}
            {(shareState === "ready" || shareState === "shared") && shareDataUrl && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <img src={shareDataUrl} alt="Score card" style={{ width: 180, height: 180, borderRadius: 14, border: "3px solid #ffd23e", display: "block" }} />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                  <button className={styles.shareOption} onClick={() => doShare("download")} type="button">⬇ Save Image</button>
                  <button className={styles.shareOption} onClick={() => doShare("instagram")} type="button">📷 Instagram</button>
                  <button className={styles.shareOption} onClick={() => doShare("copy")} type="button">📋 Copy Caption</button>
                </div>
                {shareState === "shared" && <p style={{ color: "#22c55e", fontFamily: "'Luckiest Guy', system-ui", fontSize: 13, margin: 0 }}>Ready to post! 🐾</p>}
              </div>
            )}
          </div>
          <button className={styles.continueBtn} onClick={() => window.location.assign("/about")} type="button">
            Continue &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}