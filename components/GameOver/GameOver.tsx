"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./GameOver.module.css";

type Props = { chums: number; score: number };

const DANCE_MS = 4000;
const FADE_MS  = 600;

export default function GameOver({ chums, score }: Props) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);

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
      </div>
    </div>
  );
}
