"use client";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./GameOver.module.css";

type Props = { chums: number };

export default function GameOver({ chums }: Props) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);

  const exit = (dest: string) => {
    if (overlayRef.current) overlayRef.current.classList.add(styles.fadeOut);
    setTimeout(() => {
      if (dest === "reload") window.location.reload();
      else router.push(dest);
    }, 600);
  };

  return (
    <div ref={overlayRef} className={styles.overlay}>
      <div className={styles.inner}>
        <h1 className={styles.title}>Game Over</h1>
        <p className={styles.sub}>
          {chums === 1 ? "You got 1 chum." : `You got ${chums} chums.`}
        </p>
        <div className={styles.pills}>
          <button
            type="button"
            className={styles.pill}
            onClick={() => exit("reload")}
          >
            Try Again
          </button>
          <button
            type="button"
            className={`${styles.pill} ${styles.pillSecondary}`}
            onClick={() => exit("/about")}
          >
            Save Score
          </button>
        </div>
      </div>
    </div>
  );
}
