"use client";
import { useEffect, useRef } from "react";
import styles from "./Hero.module.css";
import Triangles, { type Tri } from "../Parallax/Triangles";

const heroTriangles: Tri[] = [
  { size: 70, top: "14%", left: "16%", speed: 0.12, spin: 0.2 },
  { size: 44, top: "30%", right: "22%", speed: 0.22, spin: -0.32 },
  { size: 92, bottom: "16%", left: "42%", speed: 0.16, spin: 0.14 },
];

// Load the Vimeo Player SDK once, on demand. Returns the global Vimeo object.
let vimeoSdkPromise: Promise<unknown> | null = null;
function loadVimeoSdk(): Promise<unknown> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const w = window as unknown as { Vimeo?: unknown };
  if (w.Vimeo) return Promise.resolve(w.Vimeo);
  if (vimeoSdkPromise) return vimeoSdkPromise;
  vimeoSdkPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://player.vimeo.com/api/player.js";
    script.async = true;
    script.onload = () => resolve((window as unknown as { Vimeo?: unknown }).Vimeo ?? null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
  return vimeoSdkPromise;
}

type VimeoPlayer = {
  on: (event: string, cb: () => void) => void;
  off: (event: string, cb: () => void) => void;
};

export default function Hero() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // When the hero clip finishes (loop is off), glide the viewer down to the
  // "Meet the Pack" rail so the cards become the next thing they see.
  useEffect(() => {
    let player: VimeoPlayer | null = null;
    let cancelled = false;
    const onEnded = () => {
      // If the viewer has already scrolled, leave them where they are instead
      // of yanking them back up to the Lab.
      if (window.scrollY > 16) return;
      const el = document.getElementById("lab");
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.scrollY - 200;
      window.scrollTo({ top: y, behavior: "smooth" });
    };
    loadVimeoSdk().then((Vimeo) => {
      if (cancelled || !Vimeo || !iframeRef.current) return;
      const Player = (Vimeo as { Player: new (el: HTMLIFrameElement) => VimeoPlayer }).Player;
      player = new Player(iframeRef.current);
      player.on("ended", onEnded);
    });
    return () => {
      cancelled = true;
      player?.off("ended", onEnded);
    };
  }, []);

  return (
    <section className={styles.hero}>
      <div className={styles.videoWrap} aria-hidden="true">
        <iframe
          ref={iframeRef}
          className={styles.video}
          src={`https://player.vimeo.com/video/1199216471?autoplay=${typeof window !== "undefined" && new URLSearchParams(window.location.search).get("gameover") === "1" ? "0" : "1"}&loop=0&muted=1&controls=0&title=0&byline=0&portrait=0&autopause=0`}
          title="Pedigree Chums"
          allow="autoplay; fullscreen; picture-in-picture"
          frameBorder="0"
        />
        <div className={styles.poster} />
        <div className={styles.tint} />
      </div>
      <button
        type="button"
        className={styles.announce}
        onClick={() => window.dispatchEvent(new CustomEvent("pc:open-offer"))}
      >
        <strong>Released Soon!</strong> Add your email to get a discount code to use on launch day
      </button>
      <div className={styles.heroTris}>
        <Triangles items={heroTriangles} z={1} />
      </div>
    </section>
  );
}
