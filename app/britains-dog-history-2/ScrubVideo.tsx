"use client";

import { useEffect, useRef } from "react";

/*
  Scroll-scrubbed video for the version 2 carousel.

  WHY THIS IS NOT components/ScrollVideo/ScrollVideo.tsx: that one reads
  `window` scroll and maps playback to a vertical scene's bounding box. This
  page never scrolls vertically. Its motion is `scrollLeft` on a single
  horizontal container, so the input is different even though the technique is
  the same. Extracted rather than altered, so the Argos page that uses
  ScrollVideo cannot break.

  The video is never played. Seeking IS the playback, which is why the source
  needs a keyframe-dense encode: `-g 1 -keyint_min 1 -sc_threshold 0`. A normal
  MP4 seeks to the nearest keyframe and the scrub looks like it is stuttering.
  Same reason the repo already carries `menuflash-argos-opt.mp4`.

  The poster is the section's own photograph, so there is something correct on
  screen before the video has loaded, and if the file is missing entirely the
  page still looks finished.
*/
export default function ScrubVideo({
  src,
  poster,
  className,
  sectionIndex,
  panelsPerSection,
}: {
  src: string;
  poster: string;
  className?: string;
  sectionIndex: number;
  panelsPerSection: number;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const queued = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const carousel = document.getElementById("mobile-carousel");
    if (!carousel) return;

    let duration = 0;
    const onMeta = () => {
      duration = video.duration || 0;
      update();
    };
    video.addEventListener("loadedmetadata", onMeta);
    if (video.readyState >= 1) onMeta();

    function update() {
      queued.current = false;
      const v = videoRef.current;
      if (!v || !duration || !carousel) return;
      const w = carousel.clientWidth;
      if (!w) return;
      /* Fractional panel index across the whole carousel: panel 0 is the page
         intro, then panelsPerSection panels for each section in turn. */
      const g = carousel.scrollLeft / w;
      const first = 1 + sectionIndex * panelsPerSection;
      /* Nine panels means eight gaps between them, so the video reaches its
         last frame exactly as the last panel arrives. */
      const span = panelsPerSection - 1;
      const p = Math.min(1, Math.max(0, (g - first) / span));
      const t = p * duration;
      if (Math.abs(v.currentTime - t) > 0.02) v.currentTime = t;
    }

    const onScroll = () => {
      if (queued.current) return;
      queued.current = true;
      requestAnimationFrame(update);
    };

    carousel.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      carousel.removeEventListener("scroll", onScroll);
      video.removeEventListener("loadedmetadata", onMeta);
    };
  }, [sectionIndex, panelsPerSection]);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      className={className}
      muted
      playsInline
      preload="auto"
    />
  );
}
