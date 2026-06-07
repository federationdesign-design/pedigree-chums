"use client";
import { useEffect, useRef } from "react";
import styles from "./PitchPanel.module.css";

export default function YellowCircle() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        // Push the circle down as the page scrolls down, so its net upward
        // travel is less than the page: classic "moves slower" parallax.
        const offset = window.scrollY * 0.25;
        el.style.transform = `translateY(${offset}px)`;
        raf = 0;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <span ref={ref} className={styles.yellowCircle} aria-hidden="true" />;
}
