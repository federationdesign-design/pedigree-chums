"use client";
import { useState, useRef, useEffect } from "react";
import Nav from "../../components/Nav/Nav";
import styles from "./KnockoutRound.module.css";
import { ShortlistEntry } from "./ShortlistBar";

type Props = { shortlist: ShortlistEntry[]; breed: string; onBack: () => void; };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getLabel(e: ShortlistEntry) {
  return e.nickname && e.nickname !== e.full ? e.nickname : e.full;
}

export default function KnockoutRound({ shortlist, breed, onBack }: Props) {
  const [phase, setPhase] = useState<"fighting" | "podium">("fighting");
  const [bracket, setBracket] = useState<ShortlistEntry[]>(() => shuffle(shortlist));
  const [pairIdx, setPairIdx] = useState(0);
  const [roundWinners, setRoundWinners] = useState<ShortlistEntry[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [roundNum, setRoundNum] = useState(1);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Podium tracking
  const [first, setFirst] = useState<ShortlistEntry | null>(null);
  const [second, setSecond] = useState<ShortlistEntry | null>(null);
  const [third, setThird] = useState<ShortlistEntry | null>(null);
  const [semiFinalLosers, setSemiFinalLosers] = useState<ShortlistEntry[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sharing, setSharing] = useState(false);
  const [podiumReady, setPodiumReady] = useState(false);

  const pairA = bracket[pairIdx * 2];
  const pairB = bracket[pairIdx * 2 + 1];
  const hasBye = pairA && !pairB;
  const isLastPair = pairIdx + 1 >= Math.floor(bracket.length / 2);
  const isSemiFinal = bracket.length === 4 || bracket.length === 3;

  function endRound(winners: ShortlistEntry[], losers: ShortlistEntry[]) {
    const odd = bracket.length % 2 === 1 ? bracket[bracket.length - 1] : null;
    const next = odd ? [...winners, odd] : winners;

    if (isSemiFinal) {
      setSemiFinalLosers(prev => [...prev, ...losers]);
    }

    if (next.length === 1) {
      // We have our winner
      const winner = next[0];
      setFirst(winner);
      // second is the last loser (losing finalist)
      // third is highest scored semi-final loser
      setPhase("podium");
    } else {
      setBracket(shuffle(next));
      setPairIdx(0);
      setRoundWinners([]);
      setRoundNum(r => r + 1);
    }
  }

  function pick(winner: ShortlistEntry, loser: ShortlistEntry) {
    if (chosen !== null) return;
    setChosen([pairA, pairB].indexOf(winner));
    setTimeout(() => {
      setChosen(null);
      const nextWinners = [...roundWinners, winner];
      const nextLosers = [loser];

      if (isLastPair) {
        // Collect all losers this round
        const allLosers = isSemiFinal ? [loser] : [];
        endRound(nextWinners, allLosers);
      } else {
        setRoundWinners(nextWinners);
        setPairIdx(i => i + 1);
      }
    }, 400);
  }

  function advanceBye() {
    const next = [...roundWinners, pairA];
    if (isLastPair) endRound(next, []);
    else { setRoundWinners(next); setPairIdx(i => i + 1); }
  }

  // Draw podium canvas
  useEffect(() => {
    if (phase !== "podium" || !first) return;

    // Determine 2nd and 3rd from semiFinalLosers
    const sorted = [...semiFinalLosers].sort((a, b) => b.score - a.score);
    const p2 = sorted[0] || null;
    const p3 = sorted[1] || null;
    setSecond(p2);
    setThird(p3);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new window.Image();

    // Breed → podium image mapping
    const PODIUM_MAP: Record<string, string> = {
      "bichon frise":  "/podiums/bichon-podium.jpg",
      "bichon":        "/podiums/bichon-podium.jpg",
      "lurcher":       "/podiums/lurcher-podium.jpg",
      "whippet":       "/podiums/whippet-podium.jpg",
    };
    const breedKey = (breed || "").toLowerCase().trim();
    img.src = PODIUM_MAP[breedKey] || "/name-podium.jpg";
    img.onload = () => {
      const W = img.width, H = img.height;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      function drawText(text: string, cx: number, cy: number, fontSize: number, rotateDeg: number) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((rotateDeg * Math.PI) / 180);
        ctx.font = `900 ${fontSize}px 'Luckiest Guy', cursive`;
        ctx.fillStyle = "#0a3a57";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        // Word wrap if needed
        const maxW = fontSize * 8;
        const words = text.split(" ");
        if (ctx.measureText(text).width > maxW && words.length > 1) {
          const mid = Math.ceil(words.length / 2);
          const line1 = words.slice(0, mid).join(" ");
          const line2 = words.slice(mid).join(" ");
          ctx.fillText(line1, 0, -fontSize * 0.6);
          ctx.fillText(line2, 0, fontSize * 0.6);
        } else {
          ctx.fillText(text, 0, 0);
        }
        ctx.restore();
      }

      // 1st place -- white placard centre, larger font, +2deg clockwise
      drawText(getLabel(first), 627, 472, 72, 2);

      // 2nd place -- yellow left placard, smaller, -2deg
      if (p2) drawText(getLabel(p2), 275, 734, 48, -2);

      // 3rd place -- yellow right placard, smaller, -2deg
      if (p3) drawText(getLabel(p3), 978, 734, 48, -2);

      setPodiumReady(true);
    };
  }, [phase, first, semiFinalLosers]);

  async function handleShare() {
    setSharing(true);
    try {
      const canvas = canvasRef.current!;
      const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), "image/jpeg", 0.92));
      const file = new File([blob], "my-dog-name.jpg", { type: "image/jpeg" });
      const caption = `Meet my new pup! What do you think of the name? 🐾\n\nGenerated at pedigreechums.co.uk`;
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: caption });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "my-dog-name.jpg"; a.click();
        URL.revokeObjectURL(url);
      }
    } catch {}
    setSharing(false);
  }

  // ── PODIUM ────────────────────────────────────────────────────────────
  if (phase === "podium") {
    return (
      <>
        <Nav />
        <div className={styles.wrap}>
          <h2 className={`display ${styles.title}`}>
            We have a <span className={styles.yellow}>winner!</span>
          </h2>
          <p className={styles.sub}>
            {first ? getLabel(first) : ""} takes the top spot
          </p>
          <div className={styles.podiumWrap}>
            <canvas ref={canvasRef} className={styles.podiumCanvas} />
          </div>
          {podiumReady && (
            <button className={styles.shareBtn} onClick={handleShare} disabled={sharing}>
              {sharing ? "Sharing..." : "📤 Share your podium"}
            </button>
          )}
          <button className={styles.startAgainBtn} onClick={onBack}>
            Start again
          </button>
        </div>
      </>
    );
  }

  // ── FIGHTING ──────────────────────────────────────────────────────────
  return (
    <>
      <Nav />
      <div className={styles.wrap}>
        <h2 className={`display ${styles.title}`}>
          The <span className={styles.yellow}>Knockout</span> Round
        </h2>
        <p className={styles.sub}>
          Round {roundNum} — tap to pick the winner
        </p>
        <div className={styles.progress}>
          <div className={styles.progressBar} style={{ width: `${Math.min(((roundNum - 1) / Math.ceil(Math.log2(Math.max(shortlist.length, 2)))) * 100, 95)}%` }} />
        </div>

        {hasBye ? (
          <div className={styles.byeCard}>
            <p className={styles.byeLabel}>🎉 Free pass!</p>
            <p className={styles.byeName}>{getLabel(pairA)}</p>
            <button className={styles.byeBtn} onClick={advanceBye}>Through →</button>
          </div>
        ) : (
          <div
            className={styles.pairWrap}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {[pairA, pairB].filter(Boolean).map((entry, i) => (
              <button
                key={entry.full}
                className={`${styles.fightCard} ${chosen === i ? styles.winner : ""} ${chosen !== null && chosen !== i ? styles.loser : ""} ${hoveredIdx === i ? styles.hoverGreen : ""} ${hoveredIdx !== null && hoveredIdx !== i ? styles.hoverRed : ""}`}
                onClick={() => pick(entry, i === 0 ? pairB : pairA)}
                disabled={chosen !== null}
                onMouseEnter={() => setHoveredIdx(i)}
              >
                <p className={styles.fightName}>{getLabel(entry)}</p>
                {entry.nickname && entry.nickname !== entry.full && (
                  <p className={styles.fightNick}>{entry.full}</p>
                )}
              </button>
            ))}
            <p className={styles.vsLabel}>VS</p>
          </div>
        )}
      </div>
    </>
  );
}
