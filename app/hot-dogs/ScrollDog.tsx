"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

export default function ScrollDog() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return;

    video.pause();

    const onLoaded = () => {
      video.pause();
      setVideoReady(true);
    };

    const onScroll = () => {
      if (!videoRef.current || !sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const sectionH = sectionRef.current.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / sectionH));
      const duration = videoRef.current.duration || 5;
      videoRef.current.currentTime = progress * duration;
    };

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("canplay", onLoaded);
    window.addEventListener("scroll", onScroll, { passive: true });

    // trigger once in case already loaded
    if (video.readyState >= 1) onLoaded();

    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("canplay", onLoaded);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div ref={sectionRef} className={styles.scrollSection}>
      <div className={styles.scrollSticky}>
        {/* Poster shown until video is ready */}
        {!videoReady && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/cerberous%20dog.png"
            alt="Cerberus hot dog"
            className={styles.scrollPoster}
          />
        )}
        <video
          ref={videoRef}
          className={styles.scrollVideo}
          src="/cerberous%20dog%20video.mp4"
          muted
          playsInline
          preload="auto"
          style={{ display: videoReady ? "block" : "none" }}
        />
      </div>
    </div>
  );
}
