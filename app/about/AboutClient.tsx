"use client";
import { useEffect } from "react";

/**
 * The about page's client bit. It plays the hero video once the Vimeo iframe
 * reports ready, and nothing else.
 *
 * IT USED TO HOST THE GAME OVER SCREEN. The main pit sent players here with
 * ?gameover=1 after stashing their score in sessionStorage, and this read those
 * keys back, froze the body scroll, paused the video and rendered GameOver over
 * the page. All of that is gone: the pit shows its own end screen in place, so
 * nothing arrives here with a score to display and nothing sets that parameter.
 *
 * The video effect kept a `gameover` guard that skipped autoplay on that path.
 * That has gone too, because the path has.
 */
export default function AboutClient() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onReady = (e: MessageEvent) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (data.event === "ready") {
          const iframe = document.querySelector("iframe[src*=vimeo]") as HTMLIFrameElement | null;
          if (iframe) iframe.contentWindow?.postMessage('{"method":"play"}', "*");
          window.removeEventListener("message", onReady);
        }
      } catch { /* not a Vimeo message */ }
    };
    window.addEventListener("message", onReady);
    return () => window.removeEventListener("message", onReady);
  }, []);

  return null;
}
