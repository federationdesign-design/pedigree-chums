"use client";
import { useEffect, useRef } from "react";
import styles from "./page.module.css";

export default function ScrollDog() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();

    // start off-screen to the right
    const container = video.parentElement as HTMLElement;
    if (container) {
      const offscreen = container.offsetWidth + 20;
      container.style.transform = `translateX(${offscreen}px)`;
      container.style.right = "25%";
    }

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

      // slide in from right: starts off-screen, settles at 25% from right
      // use first 20% of scroll to complete the slide
      const slideProgress = Math.min(1, progress / 0.2);
      const container = video.parentElement as HTMLElement;
      if (container) {
        const offscreen = container.offsetWidth + 20; // fully off right edge
        const translateX = offscreen * (1 - slideProgress);
        container.style.transform = `translateX(${translateX}px)`;
        container.style.right = "25%";
      }
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
        style={{ background: "transparent" }}
      />
    </div>
  );
}
