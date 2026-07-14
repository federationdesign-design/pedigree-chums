"use client";
import { useEffect, useRef } from "react";
import styles from "./home.module.css";

export default function VideoSection() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const played = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio >= 0.5 && !played.current) {
            played.current = true;
            const iframe = iframeRef.current;
            if (iframe?.contentWindow) {
              iframe.contentWindow.postMessage('{"method":"play"}', "https://player.vimeo.com");
            }
          }
        });
      },
      { threshold: 0.5 }
    );
    if (iframeRef.current) observer.observe(iframeRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.videoCol}>
      <iframe
        ref={iframeRef}
        src="https://player.vimeo.com/video/1199216471?autoplay=0&loop=1&muted=1&controls=0&title=0&byline=0&portrait=0&background=1"
        title="Pedigree Chums™"
        allow="autoplay; fullscreen; picture-in-picture"
        frameBorder="0"
        className={styles.videoFrame}
      />
    </div>
  );
}
