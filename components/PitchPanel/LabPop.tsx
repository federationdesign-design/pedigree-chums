"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./PitchPanel.module.css";

export default function LabPop() {
  const [popped, setPopped] = useState(false);

  useEffect(() => {
    // If the page is already scrolled (e.g. reload mid-page), show it now.
    if (window.scrollY > 0) {
      setPopped(true);
      return;
    }
    const trigger = () => setPopped(true);
    const opts = { once: true, passive: true } as AddEventListenerOptions;
    window.addEventListener("scroll", trigger, opts);
    window.addEventListener("wheel", trigger, opts);
    window.addEventListener("touchmove", trigger, opts);
    return () => {
      window.removeEventListener("scroll", trigger);
      window.removeEventListener("wheel", trigger);
      window.removeEventListener("touchmove", trigger);
    };
  }, []);

  return (
    <Image
      src="/lab.png"
      alt="A Labrador being spotted in the park"
      width={620}
      height={620}
      className={`${styles.photo} ${popped ? styles.popped : styles.prePop}`}
      priority
    />
  );
}
