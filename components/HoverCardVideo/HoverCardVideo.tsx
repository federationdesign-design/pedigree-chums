"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./HoverCardVideo.module.css";

type Props = {
  poster: string;
  video: string;
};

export default function HoverCardVideo({ poster, video }: Props) {
  const vidRef = useRef<HTMLVideoElement>(null);
  const [open, setOpen] = useState(false);

  const openVideo = (e: React.MouseEvent) => {
    e.stopPropagation(); // don't let the opening click immediately close it
    setOpen(true);
  };

  useEffect(() => {
    const v = vidRef.current;
    if (open) {
      if (v) {
        v.currentTime = 0;
        v.play().catch(() => {});
      }
      const close = () => setOpen(false);
      // attach on the next tick so the opening click doesn't trigger it
      const id = window.setTimeout(() => {
        document.addEventListener("click", close);
        document.addEventListener("keydown", close);
      }, 0);
      return () => {
        window.clearTimeout(id);
        document.removeEventListener("click", close);
        document.removeEventListener("keydown", close);
      };
    }
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  }, [open]);

  return (
    <div className={styles.slot} onClick={openVideo}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={poster} alt="Breed card" className={styles.poster} draggable={false} />
      {open && (
        <div className={styles.popout}>
          <video
            ref={vidRef}
            className={styles.video}
            src={video}
            muted
            playsInline
            preload="metadata"
          />
        </div>
      )}
    </div>
  );
}
