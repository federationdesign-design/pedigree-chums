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
    <div className={styles.videoStack}>
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
      {/* Three portrait clips replacing the old plinth.mp4 (the Staffy clip added
          in Batch 2). They have sound, so they
          cannot autoplay: the standard Vimeo player shows each video's Vimeo
          thumbnail, with controls and click to play (sound on), unlike the muted
          background embed above.
          loop=0 (owner, J18-319, 1 October 2026): the Vimeo films loop by
          default, so each is told to stop on its last frame, as the /play cards
          already do. */}
      <div className={styles.portraitPair}>
        <div className={styles.portraitCol}>
          <iframe
            src="https://player.vimeo.com/video/1218972477?title=0&byline=0&portrait=0&dnt=1&loop=0"
            title="Pedigree Chums"
            allow="fullscreen; picture-in-picture"
            frameBorder="0"
            className={styles.portraitFrame}
          />
        </div>
        <div className={styles.portraitCol}>
          <iframe
            src="https://player.vimeo.com/video/1218974120?title=0&byline=0&portrait=0&dnt=1&loop=0"
            title="Pedigree Chums"
            allow="fullscreen; picture-in-picture"
            frameBorder="0"
            className={styles.portraitFrame}
          />
        </div>
        <div className={styles.portraitCol}>
          <iframe
            src="https://player.vimeo.com/video/1221597339?title=0&byline=0&portrait=0&dnt=1&loop=0"
            title="Pedigree Chums"
            allow="fullscreen; picture-in-picture"
            frameBorder="0"
            className={styles.portraitFrame}
          />
        </div>
        {/* NARROW SCREENS ONLY (owner, J18-327, 2 October 2026): the Yorkshire Terrier,
            Basset Hound and French Bulldog films join the three above on screens under
            1200px wide, as a second row of three (one column on phones). Hidden from
            1200px up. Lazy, so a wide screen never loads them. */}
        <div className={`${styles.portraitCol} ${styles.portraitNarrowOnly}`}>
          <iframe
            src="https://player.vimeo.com/video/1232773091?title=0&byline=0&portrait=0&dnt=1&loop=0"
            title="Pedigree Chums: Yorkshire Terrier"
            allow="fullscreen; picture-in-picture"
            frameBorder="0"
            loading="lazy"
            className={styles.portraitFrame}
          />
        </div>
        <div className={`${styles.portraitCol} ${styles.portraitNarrowOnly}`}>
          <iframe
            src="https://player.vimeo.com/video/1231967836?title=0&byline=0&portrait=0&dnt=1&loop=0"
            title="Pedigree Chums: Basset Hound"
            allow="fullscreen; picture-in-picture"
            frameBorder="0"
            loading="lazy"
            className={styles.portraitFrame}
          />
        </div>
        <div className={`${styles.portraitCol} ${styles.portraitNarrowOnly}`}>
          <iframe
            src="https://player.vimeo.com/video/1229938542?title=0&byline=0&portrait=0&dnt=1&loop=0"
            title="Pedigree Chums: French Bulldog"
            allow="fullscreen; picture-in-picture"
            frameBorder="0"
            loading="lazy"
            className={styles.portraitFrame}
          />
        </div>
      </div>
    </div>
  );
}
