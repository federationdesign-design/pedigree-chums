"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./PopHeading.module.css";

type Props = {
  children: React.ReactNode;
  className?: string;
  // Heading level to render. Defaults to h2, because most PopHeading usages sit
  // beneath a page-level h1 elsewhere on the page. Pass as="h1" on pages whose
  // visible top heading IS a PopHeading, so the page is not left starting at h2
  // with no h1 above it. Styling is unaffected: the look comes from the classes
  // passed in, not the tag.
  as?: "h1" | "h2";
};

// A heading that stays hidden until it scrolls into view, then pops in with a
// little settle-jiggle. Plays once.
export default function PopHeading({ children, className = "", as = "h2" }: Props) {
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

  const Tag = as;
  return (
    <Tag
      ref={ref}
      className={`${className} ${styles.pop} ${shown ? styles.shown : ""}`}
    >
      {children}
    </Tag>
  );
}
