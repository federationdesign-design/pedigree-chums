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
  const [roundLosers, setRoundLosers] = useState<ShortlistEntry[]>([]);
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
  // Semi-final is the round whose winners will number exactly 2
  const nextRoundSize = Math.ceil(bracket.length / 2);
  const isSemiFinal = nextRoundSize === 2;
  // Final is the round with exactly 2 names
  const isFinal = bracket.length === 2;

  function endRound(allWinners: ShortlistEntry[], allLosers: ShortlistEntry[]) {
    const odd = bracket.length % 2 === 1 ? bracket[bracket.length - 1] : null;
    const next = odd ? [...allWinners, odd] : allWinners;

    if (isSemiFinal) {
      // Track all losers from the semi-final for 3rd place
      setSemiFinalLosers(prev => [...prev, ...allLosers]);
    }

    if (isFinal) {
      // The winner is allWinners[0], loser is 2nd place
      setFirst(allWinners[0]);
      setSecond(allLosers[0] || null);
      setPhase("podium");
    } else if (next.length === 1) {
      setFirst(next[0]);
      setPhase("podium");
    } else {
      setBracket(shuffle(next));
      setPairIdx(0);
      setRoundWinners([]);
      setRoundLosers([]);
      setRoundNum(r => r + 1);
    }
  }

  function pick(winner: ShortlistEntry, loser: ShortlistEntry) {
    if (chosen !== null) return;
    setChosen([pairA, pairB].indexOf(winner));
    setTimeout(() => {
      setChosen(null);
      const nextWinners = [...roundWinners, winner];
      const nextLosers = [...roundLosers, loser];

      if (isLastPair) {
        endRound(nextWinners, nextLosers);
      } else {
        setRoundWinners(nextWinners);
        setRoundLosers(nextLosers);
        setPairIdx(i => i + 1);
      }
    }, 400);
  }

  function advanceBye() {
    const next = [...roundWinners, pairA];
    if (isLastPair) endRound(next, roundLosers);
    else { setRoundWinners(next); setPairIdx(i => i + 1); }
  }

  // Draw podium canvas
  useEffect(() => {
    if (phase !== "podium" || !first) return;

    const sorted = [...semiFinalLosers].sort((a, b) => b.score - a.score);
    const p2 = sorted[0] || null;
    const p3 = sorted[1] || null;
    setSecond(p2);
    setThird(p3);

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Load Luckiest Guy for canvas then draw
    const luckiestGuy = new FontFace(
      "Luckiest Guy",
      "url(https://fonts.gstatic.com/s/luckiestguy/v22/_gP_1RrxsjcxVyin9l9n_j2RStC3yts.woff2)"
    );

    luckiestGuy.load().then(font => {
      document.fonts.add(font);
    }).catch(() => {}).finally(() => {
      const img = new window.Image();
      const PODIUM_MAP: Record<string, string> = {
        "bichon frise":           "/podiums/bichon-podium.jpg",
        "bichon":                 "/podiums/bichon-podium.jpg",
        "lurcher":                "/podiums/lurcher-podium.jpg",
        "whippet":                "/podiums/whippet-podium.jpg",
        "afghan hound":           "/podiums/afgan-podium.jpg",
        "beagle":                 "/podiums/beagle-podium.jpg",
        "bloodhound":             "/podiums/bloodhound-podium.jpg",
        "border terrier":         "/podiums/border-terrier-podium.jpg",
        "boxer":                  "/podiums/boxer-podium.jpg",
        "bull terrier":           "/podiums/bull-terrier-podium.jpg",
        "cavachon":               "/podiums/cavachon-podium.jpg",
        "chihuahua":              "/podiums/chihuahua-podium.jpg",
        "greyhound":              "/podiums/greyhound-podium.jpg",
        "jack russell":           "/podiums/jack-russel-podium.jpg",
        "irish setter":           "/podiums/setter-podium.jpg",
        "cockapoo":               "/podiums/cockapoo-podium.jpg",
        "border collie":          "/podiums/collie-podium.jpg",
        "dachshund":              "/podiums/dachshund-podium.jpg",
      };
      const breedKey = (breed || "").toLowerCase().trim();
      img.src = PODIUM_MAP[breedKey] || "/name-podium.jpg";
      img.onload = () => {
        const W = img.width, H = img.height;
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);

        function wrapText(text: string, maxWidth: number): string[] {
          const words = text.split(" ");
          const lines: string[] = [];
          let current = "";
          for (const word of words) {
            const test = current ? `${current} ${word}` : word;
            if (ctx.measureText(test).width > maxWidth && current) {
              lines.push(current);
              current = word;
            } else {
              current = test;
            }
          }
          if (current) lines.push(current);
          return lines;
        }

        function drawPlacard(
          nickname: string, fullName: string,
          cx: number, cy: number,
          nickSize: number, fullSize: number,
          rotateDeg: number,
          maxW: number
        ) {
          ctx.save();
          ctx.translate(cx, cy + 10);
          ctx.rotate((rotateDeg * Math.PI) / 180);
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#0a3a57";

          const hasFullName = fullName && fullName !== nickname;

          // Nickname -- scale down if too wide
          let ns = nickSize;
          ctx.font = `normal ${ns}px 'Luckiest Guy', cursive`;
          while (ctx.measureText(nickname).width > maxW && ns > 24) {
            ns -= 2;
            ctx.font = `normal ${ns}px 'Luckiest Guy', cursive`;
          }
          const nickY = hasFullName ? -(fullSize * 1.1) : 0;
          ctx.fillText(nickname, 0, nickY);

          // Full name -- smaller, word wrapped to fit
          if (hasFullName) {
            let fs = fullSize;
            ctx.font = `700 ${fs}px Montserrat, sans-serif`;
            while (ctx.measureText(fullName).width > maxW && fs > 14) {
              fs -= 1;
              ctx.font = `700 ${fs}px Montserrat, sans-serif`;
            }
            const lines = wrapText(fullName, maxW);
            const lineH = fs * 1.3;
            const startY = ns * 0.5;
            lines.forEach((line, i) => {
              ctx.fillText(line, 0, startY + i * lineH);
            });
          }
          ctx.restore();
        }

        drawPlacard(
          getLabel(first),
          first.full !== getLabel(first) ? first.full : "",
          627, 492, 72, 32, 2, 460
        );
        if (p2) drawPlacard(
          getLabel(p2),
          p2.full !== getLabel(p2) ? p2.full : "",
          275, 754, 44, 20, -2, 270
        );
        if (p3) drawPlacard(
          getLabel(p3),
          p3.full !== getLabel(p3) ? p3.full : "",
          978, 754, 44, 20, -2, 270
        );

        setPodiumReady(true);
      };
    });
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
        <div className={styles.wrapPodium}>
          <h2 className={`display ${styles.title}`}>
            We have a <span className={styles.yellow}>winner!</span>
          </h2>
          <p className={styles.sub}>
            {first ? getLabel(first) : ""} takes the top spot
          </p>
          <div className={styles.podiumWrap}>
            <canvas ref={canvasRef} className={styles.podiumCanvas} />
            {podiumReady && (
              <button className={styles.shareBtn} onClick={handleShare} disabled={sharing}>
                {sharing ? "Sharing..." : "Share your podium"}
              </button>
            )}
          </div>
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
            <button
              className={`${styles.fightCard} ${chosen === 0 ? styles.winner : ""} ${chosen !== null && chosen !== 0 ? styles.loser : ""} ${hoveredIdx === 0 ? styles.hoverGreen : ""} ${hoveredIdx !== null && hoveredIdx !== 0 ? styles.hoverRed : ""}`}
              onClick={() => pick(pairA, pairB)}
              disabled={chosen !== null}
              onMouseEnter={() => setHoveredIdx(0)}
            >
              <p className={styles.fightName}>{getLabel(pairA)}</p>
              {pairA.nickname && pairA.nickname !== pairA.full && (
                <p className={styles.fightNick} style={{ color: hoveredIdx !== null ? "var(--navy, #0a3a57)" : "var(--yellow, #ffe227)", transition: "color 0.3s ease 0.3s" }}>{pairA.full}</p>
              )}
            </button>
            <p className={styles.vsLabel}>VS</p>
            <button
              className={`${styles.fightCard} ${chosen === 1 ? styles.winner : ""} ${chosen !== null && chosen !== 1 ? styles.loser : ""} ${hoveredIdx === 1 ? styles.hoverGreen : ""} ${hoveredIdx !== null && hoveredIdx !== 1 ? styles.hoverRed : ""}`}
              onClick={() => pick(pairB, pairA)}
              disabled={chosen !== null}
              onMouseEnter={() => setHoveredIdx(1)}
            >
              <p className={styles.fightName}>{getLabel(pairB)}</p>
              {pairB.nickname && pairB.nickname !== pairB.full && (
                <p className={styles.fightNick} style={{ color: hoveredIdx !== null ? "var(--navy, #0a3a57)" : "var(--yellow, #ffe227)", transition: "color 0.3s ease 0.3s" }}>{pairB.full}</p>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
