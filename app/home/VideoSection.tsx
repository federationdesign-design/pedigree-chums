"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./home.module.css";

/* A FILM WITH ITS OWN COVER (owner, J18-329, 4 October 2026). Vimeo's own
   thumbnail for these films did not fit the tall card, so it sat letterboxed. The
   card shows our cover image, cropped to fill, with a play button in Vimeo's
   style; a tap swaps in the player and starts it. Nothing loads from Vimeo until
   then. */
function CoveredFilm({ vimeoId, name, cover }: { vimeoId: string; name: string; cover: string }) {
  const [on, setOn] = useState(false);
  if (on) {
    return (
      <iframe
        src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&playsinline=1&title=0&byline=0&portrait=0&dnt=1&loop=0`}
        title={`Pedigree Chums: ${name}`}
        allow="autoplay; fullscreen; picture-in-picture"
        frameBorder="0"
        className={styles.portraitFrame}
      />
    );
  }
  return (
    <button type="button" className={styles.portraitCover} onClick={() => setOn(true)} aria-label={`Play the ${name} film`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={cover} alt="" className={styles.portraitCoverImg} loading="lazy" />
      <span className={styles.portraitPlay} aria-hidden="true">
        <svg viewBox="0 0 20 20" width="34" height="34"><path d="M5 3l12 7-12 7z" fill="#ffffff" /></svg>
      </span>
    </button>
  );
}

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
          <CoveredFilm vimeoId="1218974120" name="Border Collie" cover="/home-film-covers/collie-cover.jpg" />
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
          <CoveredFilm vimeoId="1232773091" name="Yorkshire Terrier" cover="/home-film-covers/yorky-cover.jpg" />
        </div>
        <div className={`${styles.portraitCol} ${styles.portraitNarrowOnly}`}>
          <CoveredFilm vimeoId="1231967836" name="Basset Hound" cover="/home-film-covers/basset-cover.jpg" />
        </div>
        <div className={`${styles.portraitCol} ${styles.portraitNarrowOnly}`}>
          <CoveredFilm vimeoId="1229938542" name="French Bulldog" cover="/home-film-covers/frenchie-cover.jpg" />
        </div>
      </div>
    </div>
  );
}
