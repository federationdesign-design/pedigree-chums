"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import GameOver from "../../components/GameOver/GameOver";

export default function AboutClient() {
  const params = useSearchParams();
  const router = useRouter();
  const [showGameOver, setShowGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [chums, setChums] = useState(0);
  const [breeds, setBreeds] = useState<{ name: string; img: string }[]>([]);
  const scrollPos = useRef(0);

  useEffect(() => {
    if (params.get("gameover") !== "1") return;
    // Read game state from sessionStorage
    try {
      setScore(Number(sessionStorage.getItem("pc-gameover-score") || "0"));
      setChums(Number(sessionStorage.getItem("pc-gameover-chums") || "0"));
      setBreeds(JSON.parse(sessionStorage.getItem("pc-gameover-breeds") || "[]"));
      sessionStorage.removeItem("pc-gameover-score");
      sessionStorage.removeItem("pc-gameover-chums");
      sessionStorage.removeItem("pc-gameover-breeds");
    } catch {}
    // Lock scroll
    scrollPos.current = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.top = `-${scrollPos.current}px`;
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    // Pause Vimeo video while overlay is showing
    try {
      const iframe = document.querySelector("iframe[src*=vimeo]") as HTMLIFrameElement | null;
      if (iframe) iframe.contentWindow?.postMessage('{"method":"pause"}', "*");
    } catch {}
    setShowGameOver(true);
  }, [params]);

  const handleClose = () => {
    setShowGameOver(false);
    // Unlock scroll
    document.body.style.overflow = "";
    document.body.style.top = "";
    document.body.style.position = "";
    document.body.style.width = "";
    window.scrollTo(0, scrollPos.current);
    // Clean URL
    router.replace("/about", { scroll: false });
    // Resume Vimeo video
    try {
      const iframe = document.querySelector("iframe[src*=vimeo]") as HTMLIFrameElement | null;
      if (iframe) iframe.contentWindow?.postMessage('{"method":"play"}', "*");
    } catch {}
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
