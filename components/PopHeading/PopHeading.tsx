"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./PopHeading.module.css";

type Props = {
  children: React.ReactNode;
  className?: string;
};

// A heading that stays hidden until it scrolls into view, then pops in with a
// little settle-jiggle. Plays once.
export default function PopHeading({ children, className = "" }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <h2
      ref={ref}
      className={`${className} ${styles.pop} ${shown ? styles.shown : ""}`}
    >
      {children}
    </h2>
  );
}
