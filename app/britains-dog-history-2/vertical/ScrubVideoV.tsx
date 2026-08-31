"use client";

import { useEffect, useRef } from "react";

/*
  Scroll-scrubbed video for the version 2 carousel.

  WHY THIS IS NOT components/ScrollVideo/ScrollVideo.tsx: that one reads
  window scroll and maps playback to a scene's bounding box. This page scrolls
  a single overflow container, and the document behind it never moves at all,
  so window scroll would read zero forever. Extracted rather than altered, so
  the Argos page that uses ScrollVideo cannot break.

  31 Aug 2026, stage 2: the input used to be scrollLeft divided by the
  container width. The page scrolls down now and the snap step is no longer
  uniform, so it reads the measured panel index HistoryVertical publishes.

  The video is never played. Seeking IS the playback, which is why the source
  needs a keyframe-dense encode: `-g 1 -keyint_min 1 -sc_threshold 0`. A normal
  MP4 seeks to the nearest keyframe and the scrub looks like it is stuttering.
  Same reason the repo already carries `menuflash-argos-opt.mp4`.

  The poster is the section's own photograph, so there is something correct on
  screen before the video has loaded, and if the file is missing entirely the
  page still looks finished.
*/
export default function ScrubVideoV({
  src,
  poster,
  className,
  firstPanel,
  panelCount,
}: {
  src: string;
  poster: string;
  className?: string;
  /* Global index of this section's first panel, and how many it has. Passed in
     rather than derived: the carousel is no longer a fixed nine panels per
     section, so there is nothing to derive it from. */
  firstPanel: number;
  panelCount: number;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const queued = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const carousel = document.getElementById("vertical-carousel");
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
      /* 31 Aug 2026, stage 2: the page scrolls down, and the snap step is no
         longer a uniform clientWidth, so the index cannot be a division any
         more. HistoryVertical measures every panel's settled position and
         publishes the lookup; reading it here means the scrub, the counter and
         the progress bar can never disagree about which panel is showing. */
      const at = (window as unknown as { __pcPanelAt?: () => number }).__pcPanelAt;
      if (!at) return;
      const g = at();
      const first = firstPanel;
      /* Nine panels means eight gaps between them, so the video reaches its
         last frame exactly as the last panel arrives. */
      const span = panelCount - 1;
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
  }, [firstPanel, panelCount]);

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
