"use client";
import { useRef, useState, useCallback, type CSSProperties } from "react";
import styles from "./HoverCardVideo.module.css";

type Crop = { x: number; y: number; w: number; h: number };

type Props = {
  poster: string;
  video: string;
  expandAtMs?: number;
  crop?: Crop; // the card's rectangle within the video frame, as 0-1 fractions
};

export default function HoverCardVideo({
  poster,
  video,
  expandAtMs = 2000,
  // defaults eyeballed from the first frame (card centred with white margin)
  crop = { x: 0.3, y: 0.12, w: 0.4, h: 0.76 },
}: Props) {
  const slotRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const vidRef = useRef<HTMLVideoElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [active, setActive] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const onEnter = useCallback(() => {
    const slot = slotRef.current;
    const stage = stageRef.current;
    const v = vidRef.current;
    if (!slot || !stage) return;
    // pin the fixed overlay exactly over the static card to start
    const r = slot.getBoundingClientRect();
    stage.style.top = `${r.top}px`;
    stage.style.left = `${r.left}px`;
    stage.style.width = `${r.width}px`;
    stage.style.height = `${r.height}px`;
    setActive(true);
    setExpanded(false);
    if (v) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
    timer.current = window.setTimeout(() => setExpanded(true), expandAtMs);
  }, [expandAtMs]);

  const onLeave = useCallback(() => {
    setActive(false);
    setExpanded(false);
    if (timer.current) window.clearTimeout(timer.current);
    const v = vidRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  }, []);

  const cropVars = {
    "--cx": crop.x,
    "--cy": crop.y,
    "--cw": crop.w,
    "--ch": crop.h,
  } as CSSProperties;

  return (
    <div
      ref={slotRef}
      className={styles.slot}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={poster} alt="Breed card" className={styles.poster} draggable={false} />
      <div
        ref={stageRef}
        className={`${styles.stage} ${active ? styles.active : ""} ${expanded ? styles.expanded : ""}`}
        style={cropVars}
        aria-hidden="true"
      >
        <video ref={vidRef} className={styles.video} src={video} muted playsInline preload="metadata" />
      </div>
    </div>
  );
}
