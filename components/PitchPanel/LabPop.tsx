"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./PitchPanel.module.css";

export default function LabPop() {
  const [popped, setPopped] = useState(false);

  useEffect(() => {
    // Pop once the page has been scrolled past 5% of its scrollable height.
    // The scrollY > 0 guard means layout shifts on load (scrollY stays 0)
    // cannot trip it.
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const threshold = max * 0.05;
      if (window.scrollY > 0 && window.scrollY >= threshold) {
        setPopped(true);
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Image
      src="/lab.png"
      id="lab"
      alt="A Labrador being spotted in the park"
      width={620}
      height={620}
      className={`${styles.photo} ${popped ? styles.popped : styles.prePop}`}
      priority
    />
  );
}
