"use client";
import { useEffect, useRef } from "react";
import styles from "./page.module.css";

export default function ScrollDog() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();

    const onLoaded = () => { video.pause(); };
    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("canplay", onLoaded);
    if (video.readyState >= 1) onLoaded();

    const onScroll = () => {
      if (!video.duration) return;
      const scrolled = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.max(0, Math.min(1, scrolled / maxScroll));
      video.currentTime = progress * video.duration;
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("canplay", onLoaded);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className={styles.fixedDog}>
      <video
        ref={videoRef}
        src="/cerberous%20dog%20video.mp4"
        poster="/cerberous%20dog.png"
        muted
        playsInline
        preload="auto"
        className={styles.fixedDogVideo}
      />
    </div>
  );
}
