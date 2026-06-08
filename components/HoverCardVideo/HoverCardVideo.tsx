"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./HoverCardVideo.module.css";

type Props = {
  poster: string;
  video?: string; // self-hosted mp4
  vimeoId?: string; // vimeo video id
};

export default function HoverCardVideo({ poster, video, vimeoId }: Props) {
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
          {vimeoId ? (
            <iframe
              className={styles.video}
              src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&loop=0&muted=1&controls=0&title=0&byline=0&portrait=0`}
              title="Breed video"
              allow="autoplay; fullscreen; picture-in-picture"
              frameBorder="0"
            />
          ) : (
            <video
              ref={vidRef}
              className={styles.video}
              src={video}
              muted
              playsInline
              preload="metadata"
            />
          )}
          {/* transparent catcher so a click on the video area also closes it */}
          <button
            type="button"
            className={styles.clickCatch}
            aria-label="Close video"
            onClick={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
