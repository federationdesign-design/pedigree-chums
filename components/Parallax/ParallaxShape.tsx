"use client";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type Props = {
  className?: string;
  style?: CSSProperties;
  speed?: number; // drift as a fraction of local scroll (slower than page)
  spin?: boolean; // rotate while scrolling (holds when scrolling stops)
  spinFactor?: number; // degrees per pixel scrolled
  children?: ReactNode;
};

export default function ParallaxShape({
  className,
  style,
  speed = 0.18,
  spin = false,
  spinFactor = 0.15,
  children,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const anchor = el.parentElement; // transform-free, so drift stays local
    let raf = 0;
    const apply = () => {
      raf = 0;
      const top = anchor ? anchor.getBoundingClientRect().top : 0;
      const ty = -top * speed;
      el.style.transform = spin
        ? `translateY(${ty}px) rotate(${window.scrollY * spinFactor}deg)`
        : `translateY(${ty}px)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    apply();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [speed, spin, spinFactor]);

  return (
    <span ref={ref} className={className} style={style} aria-hidden="true">
      {children}
    </span>
  );
}
