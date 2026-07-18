"use client";
import { useState, useEffect } from "react";
import styles from "./KnockoutRound.module.css";
import ShareScreen from "./ShareScreen";
import { ShortlistEntry } from "./ShortlistBar";

type Platform = "instagram" | "twitter" | "tiktok" | "none";
const PLATFORM_LIMIT: Record<string, number> = {
  instagram: 2,
  twitter: 4,
  tiktok: 2,
  none: 4,
};

type Props = {
  shortlist: ShortlistEntry[];
  breed: string;
  onBack: () => void;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function KnockoutRound({ shortlist, breed, onBack }: Props) {
  const [phase, setPhase] = useState<"intro" | "fighting" | "share">("intro");
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [remaining, setRemaining] = useState<ShortlistEntry[]>([]);
  const [pairIdx, setPairIdx] = useState(0);
  const [byes, setByes] = useState<ShortlistEntry[]>([]);
  const [finalists, setFinalists] = useState<ShortlistEntry[]>([]);
  const [chosen, setChosen] = useState<number | null>(null); // 0 or 1, for animation

  // Top 2 by score -- our picks
  const ourPicks = [...shortlist].sort((a, b) => b.score - a.score).slice(0, 2);

  function startKnockout() {
    if (!platform) return;
    const limit = PLATFORM_LIMIT[platform];
    // If already at or below limit, go straight to share
    if (shortlist.length <= limit) {
      setFinalists(shortlist);
      setPhase("share");
      return;
    }
    const shuffled = shuffle(shortlist);
    setRemaining(shuffled);
    setPairIdx(0);
    setByes([]);
    setPhase("fighting");
  }

  // Current pair
  const pair = [remaining[pairIdx * 2], remaining[pairIdx * 2 + 1]].filter(Boolean);
  const hasBye = pair.length === 1;
  const limit = platform ? PLATFORM_LIMIT[platform] : 4;

  function pick(winner: ShortlistEntry) {
    // Animate briefly then advance
    const winnerIdx = pair.indexOf(winner);
    setChosen(winnerIdx);
    setTimeout(() => {
      setChosen(null);
      const winners = [...byes, winner];
      const nextPairIdx = pairIdx + 1;
      const totalPairs = Math.floor(remaining.length / 2);

      if (nextPairIdx >= totalPairs) {
        // End of round -- collect all winners + remaining byes
        const roundWinners = [...winners];
        // If odd number, last item gets a bye
        if (remaining.length % 2 === 1) {
          roundWinners.push(remaining[remaining.length - 1]);
        }
        if (roundWinners.length <= limit) {
          setFinalists(roundWinners);
          setPhase("share");
        } else {
          // Next round
          setRemaining(shuffle(roundWinners));
          setPairIdx(0);
          setByes([]);
        }
      } else {
        setByes(winners);
        setPairIdx(nextPairIdx);
      }
    }, 400);
  }

  if (phase === "share") {
    return <ShareScreen finalists={finalists} breed={breed} platform={platform} onBack={onBack} />;
  }

  if (phase === "fighting") {
    const totalRounds = Math.ceil(Math.log2(shortlist.length / limit));
    const currentWinners = byes.length + pairIdx;
    const progress = currentWinners / (shortlist.length - limit);

    return (
      <div className={styles.wrap}>
        <button className={styles.backBtn} onClick={onBack}>← Back</button>
        <h2 className={`display ${styles.title}`}>
          The <span className={styles.yellow}>Knockout</span> Round
        </h2>
        <p className={styles.sub}>Pick your favourite</p>

        <div className={styles.progress}>
          <div className={styles.progressBar} style={{ width: `${Math.min(progress * 100, 100)}%` }} />
        </div>

        <div className={styles.pairWrap}>
          {hasBye ? (
            <div className={styles.byeCard}>
              <p className={styles.byeLabel}>🎉 Free pass!</p>
              <p className={styles.byeName}>{pair[0].full}</p>
              <p className={styles.byeNick}>"{pair[0].nickname}"</p>
              <button className={styles.byeBtn} onClick={() => pick(pair[0])}>
                Advance →
              </button>
            </div>
          ) : (
            pair.map((entry, i) => (
              <button
                key={entry.full}
                className={`${styles.fightCard} ${chosen === i ? styles.winner : ""} ${chosen !== null && chosen !== i ? styles.loser : ""}`}
                onClick={() => chosen === null && pick(entry)}
                disabled={chosen !== null}
              >
                <p className={styles.fightName}>{entry.full}</p>
                {entry.nickname && entry.nickname !== entry.full && (
                  <p className={styles.fightNick}>"{entry.nickname}"</p>
                )}
                <span className={styles.fightVs}>TAP TO PICK</span>
              </button>
            ))
          )}
        </div>

        {!hasBye && pair.length === 2 && (
          <div className={styles.vsLabel}>VS</div>
        )}
      </div>
    );
  }

  // Intro phase
  return (
    <div className={styles.wrap}>
      <button className={styles.backBtn} onClick={onBack}>← Back</button>

      <h2 className={`display ${styles.title}`}>
        The <span className={styles.yellow}>Knockout</span> Round
      </h2>
      <p className={styles.sub}>
        You&apos;ve saved {shortlist.length} name{shortlist.length !== 1 ? "s" : ""}. Time to find your favourite.
      </p>

      {/* Our Picks */}
      <div className={styles.picksBox}>
        <p className={styles.picksLabel}>⭐ Our picks</p>
        <p className={styles.picksSub}>Based on how well the names scored, we love these two</p>
        <div className={styles.picksRow}>
          {ourPicks.map((p) => (
            <div key={p.full} className={styles.pickCard}>
              <p className={styles.pickName}>{p.full}</p>
              {p.nickname && p.nickname !== p.full && (
                <p className={styles.pickNick}>"{p.nickname}"</p>
              )}
            </div>
          ))}
        </div>
        <p className={styles.picksNote}>They still have to earn it though 🏆</p>
      </div>

      {/* Platform selector */}
      <div className={styles.platformBox}>
        <p className={styles.platformLabel}>Where are you sharing?</p>
        <div className={styles.platformGrid}>
          {([
            { id: "instagram", emoji: "📸", name: "Instagram", limit: "2 names" },
            { id: "twitter",   emoji: "𝕏",  name: "X / Twitter", limit: "4 names" },
            { id: "tiktok",    emoji: "🎵", name: "TikTok", limit: "2 names" },
            { id: "none",      emoji: "📋", name: "No platform", limit: "up to 4" },
          ] as { id: Platform; emoji: string; name: string; limit: string }[]).map((p) => (
            <button
              key={p.id}
              className={`${styles.platformBtn} ${platform === p.id ? styles.platformSelected : ""}`}
              onClick={() => setPlatform(p.id)}
            >
              <span className={styles.platformEmoji}>{p.emoji}</span>
              <span className={styles.platformName}>{p.name}</span>
              <span className={styles.platformLimit}>{p.limit}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        className={styles.startBtn}
        onClick={startKnockout}
        disabled={!platform}
      >
        {platform && shortlist.length <= PLATFORM_LIMIT[platform]
          ? "Share my shortlist →"
          : "Start the Knockout →"}
      </button>
    </div>
  );
}
