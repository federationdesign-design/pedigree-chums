"use client";
import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  className?: string;
  speed?: number; // fraction of scroll applied as downward drift (slower than page)
  spin?: boolean; // rotate as the page scrolls (stops when scrolling stops)
  spinFactor?: number; // degrees per pixel scrolled
  children?: ReactNode;
};

export default function ParallaxShape({
  className,
  speed = 0.25,
  spin = false,
  spinFactor = 0.15,
  children,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const ty = y * speed;
        el.style.transform = spin
          ? `translateY(${ty}px) rotate(${y * spinFactor}deg)`
          : `translateY(${ty}px)`;
        raf = 0;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [speed, spin, spinFactor]);

  return (
    <span ref={ref} className={className} aria-hidden="true">
      {children}
    </span>
  );
}
