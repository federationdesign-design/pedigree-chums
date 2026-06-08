"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./PitchPanel.module.css";

export default function LabPop() {
  const [popped, setPopped] = useState(false);

  useEffect(() => {
    // Pop on the first genuine user scroll input. We deliberately avoid the
    // generic "scroll" event because layout shifts on load can fire it and
    // trip the pop before the user has interacted.
    const trigger = () => setPopped(true);
    const opts = { once: true, passive: true } as AddEventListenerOptions;
    window.addEventListener("wheel", trigger, opts);
    window.addEventListener("touchmove", trigger, opts);
    window.addEventListener("keydown", trigger, opts);
    return () => {
      window.removeEventListener("wheel", trigger);
      window.removeEventListener("touchmove", trigger);
      window.removeEventListener("keydown", trigger);
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
