"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import GameOver from "../../components/GameOver/GameOver";

export default function AboutClient() {
  const router = useRouter();
  const isGameOver = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("gameover") === "1";
  const [showGameOver, setShowGameOver] = useState(isGameOver);
  const [score, setScore] = useState(() => isGameOver ? Number(sessionStorage.getItem("pc-gameover-score") || "0") : 0);
  const [chums, setChums] = useState(() => isGameOver ? Number(sessionStorage.getItem("pc-gameover-chums") || "0") : 0);
  const [breeds, setBreeds] = useState<{ name: string; img: string }[]>(() => {
    if (!isGameOver) return [];
    try { return JSON.parse(sessionStorage.getItem("pc-gameover-breeds") || "[]"); } catch { return []; }
  });
  const scrollPos = useRef(0);

  useEffect(() => {
    if (!isGameOver) return;
    // Clear sessionStorage now that we've read it
    sessionStorage.removeItem("pc-gameover-score");
    sessionStorage.removeItem("pc-gameover-chums");
    sessionStorage.removeItem("pc-gameover-breeds");
    // Lock scroll
    scrollPos.current = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.top = `-${scrollPos.current}px`;
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    // Pause Vimeo - listen for ready event
    const onVimeoMsg = (e: MessageEvent) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (data.event === "ready") {
          const iframe = document.querySelector("iframe[src*=vimeo]") as HTMLIFrameElement | null;
          if (iframe) iframe.contentWindow?.postMessage('{"method":"pause"}', "*");
          window.removeEventListener("message", onVimeoMsg);
        }
      } catch {}
    };
    window.addEventListener("message", onVimeoMsg);
    // Also pause immediately if already loaded
    const iframe0 = document.querySelector("iframe[src*=vimeo]") as HTMLIFrameElement | null;
    if (iframe0) iframe0.contentWindow?.postMessage('{"method":"pause"}', "*");
    return () => window.removeEventListener("message", onVimeoMsg);
  }, [isGameOver]);

  const handleClose = () => {
    setShowGameOver(false);
    document.body.style.overflow = "";
    document.body.style.top = "";
    document.body.style.position = "";
    document.body.style.width = "";
    window.scrollTo(0, scrollPos.current);
    router.replace("/about", { scroll: false });
    const iframe = document.querySelector("iframe[src*=vimeo]") as HTMLIFrameElement | null;
    if (iframe) iframe.contentWindow?.postMessage('{"method":"play"}', "*");
  };

  if (!showGameOver) return null;

  return (
    <GameOver
      score={score}
      chums={chums}
      collectedBreeds={breeds}
      onClose={handleClose}
    />
  );
}
