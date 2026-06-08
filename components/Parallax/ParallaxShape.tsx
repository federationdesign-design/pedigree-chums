"use client";
import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  className?: string;
  speed?: number; // drift as a fraction of local scroll (slower than page)
  spin?: boolean; // rotate while scrolling (holds when scrolling stops)
  spinFactor?: number; // degrees per pixel scrolled
  children?: ReactNode;
};

export default function ParallaxShape({
  className,
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

    // Anchor to the parent (never transformed), so the drift is measured
    // locally to this section and stays bounded to the viewport.
    const anchor = el.parentElement;
    let raf = 0;
    const update = () => {
      raf = 0;
      const top = anchor ? anchor.getBoundingClientRect().top : 0;
      const ty = -top * speed;
      el.style.transform = spin
        ? `translateY(${ty}px) rotate(${window.scrollY * spinFactor}deg)`
        : `translateY(${ty}px)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [speed, spin, spinFactor]);

  return (
    <span ref={ref} className={className} aria-hidden="true">
      {children}
    </span>
  );
}
