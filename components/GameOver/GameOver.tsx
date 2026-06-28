"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./GameOver.module.css";

type Props = { chums: number; score: number };

const DANCE_MS = 4000;
const FADE_MS  = 600;

// Dog leaderboard -- seeded by date so it changes daily but is consistent within a day
const DOG_POOL = [
  { name: "Rover",   scores: [1840, 2210, 1650, 1990, 2340] },
  { name: "Max",     scores: [1420, 1780, 2050, 1600, 1920] },
  { name: "Rolo",    scores: [1100, 1380, 1560, 1240, 1700] },
  { name: "Biscuit", scores: [980,  1200, 1450, 1080, 1310] },
  { name: "Scruff",  scores: [2100, 1760, 2400, 1880, 2250] },
  { name: "Pickle",  scores: [760,  940,  1120, 850,  1050] },
  { name: "Monty",   scores: [1650, 1920, 1430, 1780, 2100] },
  { name: "Bonnie",  scores: [1300, 1550, 1180, 1420, 1640] },
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
            ? "You have 1 dog in your hand."
            : `You have ${chums} dogs in your hand.`}
        </h1>
        <div className={styles.leaderboard}>
          <p className={styles.leaderTitle}>Today&rsquo;s top chums</p>
          {leaders.map((dog, i) => (
            <div key={dog.name} className={styles.leaderRow}>
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
