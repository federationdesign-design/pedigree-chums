"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./GameOver.module.css";

type Props = { chums: number };

const DANCE_MS = 4000;
const FADE_MS  = 600;

export default function GameOver({ chums }: Props) {
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
        <h1 className={styles.title}>Game Over</h1>
        <p className={styles.sub}>
          {chums === 1 ? "You got 1 chum." : `You got ${chums} chums.`}
        </p>
      </div>
    </div>
  );
}
