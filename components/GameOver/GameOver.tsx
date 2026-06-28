"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./GameOver.module.css";

type Props = { chums: number; score: number };

const DANCE_MS = 10000;
const FADE_MS  = 600;

// Dog leaderboard -- seeded by date so it changes daily but is consistent within a day
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

function getDailyLeaderboard() {
  // seed by date string -- same result all day, different each day
  const seed = new Date().toDateString().split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = (n: number) => { const x = Math.sin(seed + n) * 10000; return x - Math.floor(x); };
  // shuffle pool with seeded rng
  const shuffled = [...DOG_POOL].sort((a, b) => rng(a.name.charCodeAt(0)) - rng(b.name.charCodeAt(0)));
  return shuffled.slice(0, 3).map((dog, i) => ({
    name: dog.name,
    score: dog.scores[Math.floor(rng(i + 10) * dog.scores.length)],
  })).sort((a, b) => b.score - a.score);
}

export default function GameOver({ chums, score }: Props) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);
  const leaders = getDailyLeaderboard();

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => {
      if (overlayRef.current) overlayRef.current.classList.add(styles.fadeOut);
    }, DANCE_MS);
    const navTimer = window.setTimeout(() => {
      router.push("/about");
    }, DANCE_MS + FADE_MS);
    return () => { clearTimeout(fadeTimer); clearTimeout(navTimer); };
  }, [router]);

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
        <div className={styles.leaderboard} style={{ animationDelay: "1s" }}>
          <p className={styles.leaderTitle}>Today&rsquo;s top chums</p>
          {leaders.map((dog, i) => (
            <div key={dog.name} className={styles.leaderRow} style={{ animationDelay: `${(2 - i) * 0.4}s` }}>
              <span className={styles.leaderPos}>{i + 1}</span>
              <span className={styles.leaderName}>{dog.name}</span>
              <span className={styles.leaderScore}>{dog.score.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
