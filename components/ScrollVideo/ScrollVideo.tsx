"use client";

import * as React from "react";
import { useEffect, useRef } from "react";

/*
  Scroll-scrubbed video. Playback position is driven by how far the reader
  has scrolled through the surrounding scene, so the footage runs forward as
  they scroll down and backward as they scroll up. Muted/inline/no-autoplay:
  the scrubbing IS the playback. Requires a keyframe-dense encode (the -opt
  file) for smooth seeking.
*/
export default function ScrollVideo({ src, className }: { src: string; className?: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const raf = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let duration = 0;
    const onMeta = () => {
      duration = video.duration || 0;
    };
    video.addEventListener("loadedmetadata", onMeta);
    if (video.readyState >= 1) onMeta();

    const scene = video.closest("[data-scrub-scene]") || video.parentElement;

    const update = () => {
      raf.current = false;
      if (!duration || !scene) return;
      const r = (scene as HTMLElement).getBoundingClientRect();
      const total = r.height + window.innerHeight;
      const progress = Math.min(1, Math.max(0, (window.innerHeight - r.top) / total));
      const t = progress * duration;
      if (Math.abs(video.currentTime - t) > 0.02) video.currentTime = t;
    };

    const onScroll = () => {
      if (!raf.current) {
        raf.current = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      video.removeEventListener("loadedmetadata", onMeta);
    };
  }, []);

  return (
    <video ref={videoRef} src={src} className={className} muted playsInline preload="auto" />
  );
}
