"use client";
import { useEffect, useRef } from "react";
import styles from "./page.module.css";

export default function ScrollDog() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return;

    video.pause();

    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const sectionH = section.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / sectionH));
      const duration = video.duration || 5;
      video.currentTime = progress * duration;
    };

    const onLoaded = () => {
      video.pause();
      onScroll();
    };

    video.addEventListener("loadedmetadata", onLoaded);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div ref={sectionRef} className={styles.scrollSection}>
      <div className={styles.scrollSticky}>
        <video
          ref={videoRef}
          className={styles.scrollVideo}
          src="/cerberous dog video.mp4"
          muted
          playsInline
          preload="auto"
          poster="/cerberous dog.png"
        />
      </div>
    </div>
  );
}
