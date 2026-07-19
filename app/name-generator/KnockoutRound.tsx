"use client";
import React, { useState, useRef, useEffect } from "react";
import Nav from "../../components/Nav/Nav";
import styles from "./KnockoutRound.module.css";
import ShareScreen from "./ShareScreen";
import { ShortlistEntry } from "./ShortlistBar";

type Props = {
  shortlist: ShortlistEntry[];
  breed: string;
  onBack: () => void;
  onRestart: () => void;
};

// ── Similarity scoring ────────────────────────────────────────────────────
function sharedWords(a: string, b: string): number {
  const wa = new Set(a.toLowerCase().split(/\s+/));
  const wb = b.toLowerCase().split(/\s+/);
  return wb.filter(w => w.length > 2 && wa.has(w)).length;
}
function nickSimilarity(a: string, b: string): number {
  const x = a.toLowerCase(), y = b.toLowerCase();
  if (x === y) return 10;
  if (x.startsWith(y) || y.startsWith(x)) return 5;
  if (x.includes(y) || y.includes(x)) return 3;
  // shared prefix of 3+
  let prefix = 0;
  for (let i = 0; i < Math.min(x.length, y.length); i++) {
    if (x[i] === y[i]) prefix++; else break;
  }
  return prefix >= 3 ? 2 : 0;
}
function similarity(a: ShortlistEntry, b: ShortlistEntry): number {
  return sharedWords(a.full, b.full) * 3 + nickSimilarity(a.nickname || a.full, b.nickname || b.full);
}

// ── Seeded bracket pairing ────────────────────────────────────────────────
function seedBracket(entries: ShortlistEntry[]): ShortlistEntry[] {
  // Deduplicate by full name
  const seen = new Set<string>();
  const deduped = entries.filter(e => { if (seen.has(e.full)) return false; seen.add(e.full); return true; });
  const n = deduped.length;
  if (n <= 1) return deduped;
  const entries2 = deduped;
  const used = new Array(n).fill(false);
  const paired: ShortlistEntry[] = [];
  // Build similarity matrix
  const scores: number[][] = entries2.map((a, i) =>
    entries2.map((b, j) => i === j ? -1 : similarity(a, b))
  );
  // Greedy: find highest similarity pair, add to list, repeat
  while (paired.length < n) {
    let bestScore = -1, bestI = -1, bestJ = -1;
    for (let i = 0; i < n; i++) {
      if (used[i]) continue;
      for (let j = i + 1; j < n; j++) {
        if (used[j]) continue;
        if (scores[i][j] > bestScore) {
          bestScore = scores[i][j]; bestI = i; bestJ = j;
        }
      }
    }
    if (bestI === -1) {
      // Remaining unpaired names -- sort by score descending so highest gets bye (last slot)
      const remaining = entries2.filter((_, i) => !used[i]).sort((a, b) => b.score - a.score);
      paired.push(...remaining);
      break;
    }
    paired.push(entries2[bestI], entries2[bestJ]);
    used[bestI] = used[bestJ] = true;
  }
  // If odd total, the last entry gets the bye -- ensure it's the highest scorer among unpaired
  return paired;
}

// ── Bracket slot types ────────────────────────────────────────────────────
type SlotState = "pending" | "winner" | "loser" | "bye" | "recycle" | "recommended";
type BracketSlot = { entry: ShortlistEntry | null; state: SlotState };
type BracketRound = BracketSlot[][];  // round[matchIdx][0|1]

function buildBracket(seeded: ShortlistEntry[]): BracketRound[] {
  // No padding -- if odd, last entry will be recycled from losers at match time
  const n = seeded.length;
  const round1: BracketSlot[][] = [];
  for (let i = 0; i < n; i += 2) {
    const a = seeded[i];
    const b = seeded[i + 1] || null; // may be null if odd -- will be filled by recycled loser
    round1.push([
      { entry: a, state: "pending" },
      { entry: b, state: b ? "pending" : "recycle" }, // "recycle" = waiting for a loser
    ]);
  }

  // Build subsequent rounds -- size based on ceil(n/2) winners per round
  const rounds: BracketRound[] = [round1];
  let prevSize = Math.ceil(n / 2);
  while (prevSize > 1) {
    const nextSize = Math.ceil(prevSize / 2);
    const round: BracketSlot[][] = [];
    for (let i = 0; i < nextSize; i++) {
      round.push([
        { entry: null, state: "pending" },
        { entry: null, state: "pending" },
      ]);
    }
    rounds.push(round);
    prevSize = nextSize;
  }
  return rounds;
}

function getRoundNameStatic(roundsRemaining: number): string {
  if (roundsRemaining === 1) return "The Final";
  if (roundsRemaining === 2) return "Semi Final";
  if (roundsRemaining === 3) return "Quarter Final";
  return "Round";
}

function getLabel(e: ShortlistEntry) {
  return e.nickname && e.nickname !== e.full ? e.nickname : e.full;
}

export default function KnockoutRound({ shortlist, breed, onBack, onRestart }: Props) {
  const seeded = seedBracket(shortlist);
  const [bracket, setBracket] = useState<BracketRound[]>(() => buildBracket(seeded));
  const [currentRound, setCurrentRound] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [phase, setPhase] = useState<"fighting" | "podium">("fighting");
  const [chosen, setChosen] = useState<number | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [fallingIdx, setFallingIdx] = useState<number | null>(null);
  const [pulsingIdx, setPulsingIdx] = useState<number | null>(null);
  const [roundLosers, setRoundLosers] = useState<ShortlistEntry[]>([]); // for recycling
  const [puffingIdx, setPuffingIdx] = useState<number | null>(null);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [cardsReady, setCardsReady] = useState(true);
  const [cardsInteractive, setCardsInteractive] = useState(true);
  const [first, setFirst] = useState<ShortlistEntry | null>(null);
  const [second, setSecond] = useState<ShortlistEntry | null>(null);
  const [allRoundLosers, setAllRoundLosers] = useState<ShortlistEntry[]>([]);
  const [roundFlash, setRoundFlash] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [podiumReady, setPodiumReady] = useState(false);
  const confettiRef = useRef<((opts: Record<string, unknown>) => void) | null>(null);
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js";
    script.onload = () => { confettiRef.current = (window as unknown as Record<string, unknown>)["confetti"] as (opts: Record<string, unknown>) => void; };
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);
  const [sharing, setSharing] = useState(false);



  const round = bracket[currentRound];
  const match = round?.[currentMatch];
  const pairA = match?.[0]?.entry ?? null;
  const pairB = match?.[1]?.entry ?? null;
  const hasBye = (pairA && !pairB) || (!pairA && pairB);
  const totalRounds = bracket.length;
  const roundsRemaining = totalRounds - currentRound;

  // Round label
  function getRoundName(remaining: number): string {
    if (remaining === 1) return "The Final";
    if (remaining === 2) return "Semi Final";
    if (remaining === 3) return "Quarter Final";
    return `Round ${currentRound + 1}`;
  }
  const roundLabel = getRoundName(roundsRemaining);
  const matchLabel = `Match up ${currentMatch + 1} of ${round?.length ?? 1}`;

  // Completed round pills
  const completedRoundNames: string[] = [];
  for (let r = 0; r < currentRound; r++) {
    completedRoundNames.push(getRoundName(totalRounds - r));
  }

  function doAdvance(
    winner: ShortlistEntry,
    loser: ShortlistEntry | null,
    isBye: boolean,
    curBracket: BracketRound[],
    curRound: number,
    curMatch: number
  ) {
    const newBracket = curBracket.map(r => r.map(m => m.map(s => ({ ...s }))));
    const matchSlots = newBracket[curRound]?.[curMatch];
    if (!matchSlots) return;

    // Mark winner/loser
    matchSlots[0].state = matchSlots[0].entry === winner ? "winner" : (matchSlots[0].entry ? "loser" : "pending");
    matchSlots[1].state = matchSlots[1].entry === winner ? "winner" : (matchSlots[1].entry ? "loser" : "pending");

    // Place winner in next round
    const nextRoundIdx = curRound + 1;
    if (nextRoundIdx < newBracket.length) {
      const nextMatchIdx = Math.floor(curMatch / 2);
      const nextSlotIdx = curMatch % 2;
      const nextSlot = newBracket[nextRoundIdx]?.[nextMatchIdx]?.[nextSlotIdx];
      if (nextSlot) { nextSlot.entry = winner; nextSlot.state = "pending"; }
    }

    // Track losers
    if (loser && !isBye) {
      if (curRound === totalRounds - 1) {
        setSecond(loser);
      } else {
        setAllRoundLosers(prev => [...prev, loser]);
      }
    }

    // Advance match or round
    const nextMatch = curMatch + 1;
    let nextR = curRound;
    let nextM = nextMatch;

    if (nextMatch >= (newBracket[curRound]?.length ?? 0)) {
      if (nextRoundIdx >= newBracket.length) {
        setFirst(winner);
        try { sessionStorage.removeItem("pc_shortlist"); } catch {}
        try { window.scrollTo(0, 0); } catch {}
        setPhase("podium");
        return;
      } else {
        nextR = nextRoundIdx;
        nextM = 0;
      }
    }

    // Check if the next position is a bye -- chain synchronously
    const nextMatchSlots = newBracket[nextR]?.[nextM];
    if (nextMatchSlots) {
      const [sa, sb] = nextMatchSlots;
      if (!sa.entry && !sb.entry) {
        // Pure padding slot -- skip it and find next real match
        let skipR = nextR;
        let skipM = nextM + 1;
        while (skipR < newBracket.length) {
          if (skipM < (newBracket[skipR]?.length ?? 0)) {
            const ss = newBracket[skipR][skipM];
            if (ss[0].entry || ss[1].entry) break;
            skipM++;
          } else {
            skipR++;
            skipM = 0;
          }
        }
        setBracket(newBracket);
        setCurrentRound(skipR);
        setCurrentMatch(skipM);
        return;
      } else if (sa.entry && !sb.entry) {
        sa.state = "bye";
        doAdvance(sa.entry, null, true, newBracket, nextR, nextM);
        return;
      } else if (!sa.entry && sb.entry) {
        sb.state = "bye";
        doAdvance(sb.entry, null, true, newBracket, nextR, nextM);
        return;
      }
    }

    setBracket(newBracket);
    // Show round complete flash if this was the last match of a round
    if (nextM === 0 && nextR > curRound) {
      const nextRoundName = getRoundNameStatic(totalRounds - curRound - 1);
      setRoundFlash("Next up: " + nextRoundName + "!");
      if (confettiRef.current) {
        confettiRef.current({ particleCount: 150, spread: 100, origin: { x: 0.5, y: 0.4 }, colors: ["#ffe227","#ffffff","#22c55e","#ff6b6b"], startVelocity: 45 });
      }
      setTimeout(() => setRoundFlash(null), 1500);
    }
    // Fill any "recycle" slot in next position with highest-scoring loser
    const nextMatchSlots2 = newBracket[nextR]?.[nextM];
    if (nextMatchSlots2) {
      const [sa2, sb2] = nextMatchSlots2;
      if (sb2 && sb2.state === "recycle" && sa2.entry) {
        setAllRoundLosers(prev => {
          const sorted = [...prev].sort((a, b) => b.score - a.score);
          const recycled = sorted[0];
          if (recycled) {
            sb2.entry = recycled;
            sb2.state = "pending";
            setBracket(newBracket);
            return prev.filter(l => l.full !== recycled.full);
          }
          return prev;
        });
      } else {
        setBracket(newBracket);
      }
    } else {
      setBracket(newBracket);
    }

    setCurrentRound(nextR);
    setCurrentMatch(nextM);
  }

  function advanceWinner(winner: ShortlistEntry, loser: ShortlistEntry | null, isBye = false) {
    doAdvance(winner, loser, isBye, bracket, currentRound, currentMatch);
  }

  function pick(winner: ShortlistEntry, loser: ShortlistEntry, e?: React.MouseEvent) {
    if (chosen !== null) return;
    const winnerIdx = pairA === winner ? 0 : 1;
    const loserIdx = winnerIdx === 0 ? 1 : 0;
    setChosen(winnerIdx);
    setFallingIdx(loserIdx);
    setPulsingIdx(winnerIdx);
    setCardsInteractive(false);
    setHoveredIdx(null);
    // Fire confetti from click point
    if (e && confettiRef.current) {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      confettiRef.current({ particleCount: 80, spread: 70, origin: { x, y }, colors: ["#22c55e","#ffe227","#ffffff","#60d394"] });
    }
    // Step 1 (400ms): loser falls, winner pulses
    // Step 2 (500ms): winner puffs out
    setTimeout(() => {
      setPulsingIdx(null);
      setPuffingIdx(winnerIdx);
    }, 400);
    const snapBracket = bracket;
    const snapRound = currentRound;
    const snapMatch = currentMatch;
    const isFinalMatch = bracket.length === 2;

    // Step 3 (700ms): hide cards, show interstitial (skip on final)
    setTimeout(() => {
      setChosen(null);
      setFallingIdx(null);
      setPuffingIdx(null);
      if (!isFinalMatch) {
        setCardsReady(false);
        setShowInterstitial(true);
      }
    }, 700);

    // Step 4: advance bracket
    const delay = isFinalMatch ? 800 : 1400;
    setTimeout(() => {
      setShowInterstitial(false);
      doAdvance(winner, loser, false, snapBracket, snapRound, snapMatch);
      if (!isFinalMatch) {
        setCardsReady(true);
        setTimeout(() => {
          setCardsInteractive(true);
          setHoveredIdx(null);
        }, 500);
      }
    }, delay);
  }

  // ── Canvas podium drawing ─────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "podium" || !first) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const sorted = [...allRoundLosers].sort((a, b) => b.score - a.score);
    const p2 = second;
    const p3 = sorted[0] || null;

    const luckiestGuy = new FontFace(
      "Luckiest Guy",
      "url(https://fonts.gstatic.com/s/luckiestguy/v22/_gP_1RrxsjcxVyin9l9n_j2RStC3yts.woff2)"
    );
    luckiestGuy.load().then(f => document.fonts.add(f)).catch(() => {}).finally(() => {
      const img = new window.Image();
      const PODIUM_MAP: Record<string, string> = {
        "bichon frise": "/podiums/bichon-podium.jpg", "bichon": "/podiums/bichon-podium.jpg",
        "lurcher": "/podiums/lurcher-podium.jpg", "whippet": "/podiums/whippet-podium.jpg",
        "afghan hound": "/podiums/afgan-podium.jpg", "beagle": "/podiums/beagle-podium.jpg",
        "bloodhound": "/podiums/bloodhound-podium.jpg", "border terrier": "/podiums/border-terrier-podium.jpg",
        "boxer": "/podiums/boxer-podium.jpg", "bull terrier": "/podiums/bull-terrier-podium.jpg",
        "cavachon": "/podiums/cavachon-podium.jpg", "chihuahua": "/podiums/chihuahua-podium.jpg",
        "greyhound": "/podiums/greyhound-podium.jpg", "jack russell": "/podiums/jack-russel-podium.jpg",
        "irish setter": "/podiums/setter-podium.jpg", "cockapoo": "/podiums/cockapoo-podium.jpg",
        "border collie": "/podiums/collie-podium.jpg", "dachshund": "/podiums/dachshund-podium.jpg",
      };
      img.src = PODIUM_MAP[(breed || "").toLowerCase().trim()] || "/name-podium.jpg";
      img.onload = () => {
        const W = img.width, H = img.height;
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);

        function wrapText(text: string, maxW: number): string[] {
          const words = text.split(" ");
          const lines: string[] = [];
          let cur = "";
          for (const w of words) {
            const test = cur ? `${cur} ${w}` : w;
            if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
            else cur = test;
          }
          if (cur) lines.push(cur);
          return lines;
        }

        function drawPlacard(nickname: string, fullName: string, cx: number, cy: number, nickSize: number, fullSize: number, rotateDeg: number, maxW: number) {
          ctx.save();
          ctx.translate(cx, cy + 10);
          ctx.rotate((rotateDeg * Math.PI) / 180);
          ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#0a3a57";
          const hasFullName = fullName && fullName !== nickname;
          let ns = nickSize;
          ctx.font = `normal ${ns}px 'Luckiest Guy', cursive`;
          while (ctx.measureText(nickname).width > maxW && ns > 24) { ns -= 2; ctx.font = `normal ${ns}px 'Luckiest Guy', cursive`; }
          ctx.fillText(nickname, 0, hasFullName ? -(fullSize * 1.1) : 0);
          if (hasFullName) {
            let fs = fullSize;
            ctx.font = `700 ${fs}px Montserrat, sans-serif`;
            while (ctx.measureText(fullName).width > maxW && fs > 14) { fs -= 1; ctx.font = `700 ${fs}px Montserrat, sans-serif`; }
            const lines = wrapText(fullName, maxW);
            lines.forEach((line, i) => ctx.fillText(line, 0, ns * 0.5 + i * fs * 1.3));
          }
          ctx.restore();
        }

        drawPlacard(getLabel(first), first.full !== getLabel(first) ? first.full : "", 627, 527, 72, 32, 5, 460);
        if (p2) drawPlacard(getLabel(p2), p2.full !== getLabel(p2) ? p2.full : "", 270, 754, 44, 20, -6, 270);
        if (p3) drawPlacard(getLabel(p3), p3.full !== getLabel(p3) ? p3.full : "", 983, 779, 44, 20, -5, 270);
        setPodiumReady(true);
      };
    });
  }, [phase, first, second, allRoundLosers]);

  async function handleShare() {
    setSharing(true);
    try {
      const blob = await new Promise<Blob>(res => canvasRef.current!.toBlob(b => res(b!), "image/jpeg", 0.92));
      const file = new File([blob], "my-dog-name.jpg", { type: "image/jpeg" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: `Meet my new pup! 🐾\n\npedigreechums.co.uk` });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = "my-dog-name.jpg"; a.click();
        URL.revokeObjectURL(url);
      }
    } catch {}
    setSharing(false);
  }

  // ── PODIUM ────────────────────────────────────────────────────────────
  if (phase === "podium") {
    return (
      <>
        <Nav showLogo={true} />
        <div className={styles.wrapPodium}>
          <div className={styles.podiumWrap}>
            <canvas ref={canvasRef} className={styles.podiumCanvas} />
            {podiumReady && (
              <button className={styles.shareBtn} onClick={handleShare} disabled={sharing}>
                {sharing ? "Sharing..." : "Share your podium"}
              </button>
            )}
          </div>
          <h2 className={`display ${styles.title}`}>
            We have a <span className={styles.yellow}>winner!</span>
          </h2>
          <p className={styles.sub}>{first ? getLabel(first) : ""} takes the top spot</p>
          <button className={styles.startAgainBtn} onClick={onRestart}>Start again</button>
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

        {/* Round pills */}
        <div className={styles.pillTrail}>
          {completedRoundNames.map((name, i) => (
            <span key={i} className={styles.pillDone}>{name}</span>
          ))}
          <span className={styles.pillCurrent}>{roundLabel}</span>
        </div>
        <p className={styles.matchLabel}>{matchLabel}</p>

        {/* VS cards */}
        {showInterstitial ? (
          <div className={styles.nextMatchup}>
            <p className={styles.nextMatchupText}>Next matchup</p>
          </div>
        ) : !hasBye && pairA && pairB ? (
          <div className={`${styles.pairWrap} ${cardsReady ? styles.cardsVisible : styles.cardsHidden}`} onMouseLeave={() => setHoveredIdx(null)}>
            <button
              className={[styles.fightCard, chosen === 0 ? styles.winner : "", chosen !== null && chosen !== 0 ? styles.loser : "", hoveredIdx === 0 && cardsInteractive ? styles.hoverGreen : "", hoveredIdx !== null && hoveredIdx !== 0 && cardsInteractive ? styles.hoverRed : "", fallingIdx === 0 ? styles.falling : "", pulsingIdx === 0 ? styles.winnerPulse : "", puffingIdx === 0 ? styles.puffOut : ""].filter(Boolean).join(" ")}
              onClick={(e) => pick(pairA, pairB, e)} disabled={chosen !== null}
              onMouseEnter={() => cardsInteractive && setHoveredIdx(0)}>
              <p className={styles.fightName}>{getLabel(pairA)}</p>
              {pairA.nickname && pairA.nickname !== pairA.full && (
                <p className={styles.fightNick} style={{ color: hoveredIdx !== null ? "var(--navy, #0a3a57)" : "var(--yellow, #ffe227)", transition: hoveredIdx !== null ? "color 0.3s ease 0.3s" : "color 0s" }}>{pairA.full}</p>
              )}
            </button>
            <p className={styles.vsLabel}>VS</p>
            <button
              className={[styles.fightCard, chosen === 1 ? styles.winner : "", chosen !== null && chosen !== 1 ? styles.loser : "", hoveredIdx === 1 && cardsInteractive ? styles.hoverGreen : "", hoveredIdx !== null && hoveredIdx !== 1 && cardsInteractive ? styles.hoverRed : "", fallingIdx === 1 ? styles.falling : "", pulsingIdx === 1 ? styles.winnerPulse : "", puffingIdx === 1 ? styles.puffOut : ""].filter(Boolean).join(" ")}
              onClick={(e) => pick(pairB, pairA, e)} disabled={chosen !== null}
              onMouseEnter={() => cardsInteractive && setHoveredIdx(1)}>
              <p className={styles.fightName}>{getLabel(pairB)}</p>
              {pairB.nickname && pairB.nickname !== pairB.full && (
                <p className={styles.fightNick} style={{ color: hoveredIdx !== null ? "var(--navy, #0a3a57)" : "var(--yellow, #ffe227)", transition: hoveredIdx !== null ? "color 0.3s ease 0.3s" : "color 0s" }}>{pairB.full}</p>
              )}
            </button>
          </div>
        ) : (
          <div className={styles.byeCard}>
            <p className={styles.byeLabel}>🎉 Free pass!</p>
            <p className={styles.byeName}>{getLabel((pairA || pairB)!)}</p>
            <button className={styles.byeBtn} onClick={() => advanceWinner((pairA || pairB)!, null, true)}>Through →</button>
          </div>
        )}

        {/* Bracket tree */}
        <div className={styles.bracketScroll}>
          <div className={styles.bracketTree}>
            {bracket.map((roundSlots, rIdx) => (
              <div key={rIdx} className={styles.bracketRound}>
                <p className={styles.bracketRoundLabel}>{getRoundName(totalRounds - rIdx)}</p>
                <div className={styles.bracketMatchGroup}>
                  {roundSlots.map((matchSlots, mIdx) => {
                    // Hide pure-bye matches (null vs null) that are just bracket padding
                    const hasAnyEntry = matchSlots.some(s => s.entry !== null);
                    const bothNull = matchSlots.every(s => s.entry === null);
                    // In future rounds, always show (they fill in as tournament progresses)
                    // In round 0, hide if both are null (pure padding byes)
                    if (rIdx === 0 && bothNull) return null;
                    return (
                      <div key={mIdx} className={styles.bracketMatch}>
                        {matchSlots.map((slot, sIdx) => {
                          // In round 0, hide empty bye slot (the null side of a real bye)
                          if (rIdx === 0 && !slot.entry && hasAnyEntry) return null;
                          return (
                            <div key={sIdx}
                              title={slot.entry ? slot.entry.full : undefined}
                              className={[
                                styles.bracketSlot,
                                slot.state === "winner" ? styles.bracketWinner : "",
                                slot.state === "loser" ? styles.bracketLoser : "",
                                slot.state === "bye" ? styles.bracketBye : "",
                                slot.state === "recycle" ? styles.bracketRecycle : "",
                                slot.state === "recommended" && slot.entry ? styles.bracketRecommended : "",
                                rIdx === currentRound && mIdx === currentMatch ? styles.bracketSlotActive : "",
                                (!slot.entry && slot.state === "pending") ? styles.bracketSlotTBD : "",
                                (!slot.entry && slot.state !== "winner" && slot.state !== "loser" && slot.state !== "bye" && slot.state !== "recycle" && slot.state !== "pending") ? styles.bracketGhost : "",
                              ].filter(Boolean).join(" ")}>
                              {slot.entry ? (
                              <>
                                {getLabel(slot.entry)}
                                {slot.state === "recycle" && <span className={styles.bracketTag}>2nd chance</span>}
                                {slot.state === "recommended" && <span className={styles.bracketTagRec}>recommended</span>}
                              </>
                            ) : <span className={styles.bracketEmpty}>TBD</span>}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Round complete flash */}
      {roundFlash && (
        <div style={{ position:"fixed", inset:0, display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, pointerEvents:"none", background:"rgba(0,0,0,0.4)", animation:"flashFadeOut 1.5s ease forwards" }}>
          <p style={{ fontFamily:"var(--font-display,'Luckiest Guy',cursive)", fontSize:"clamp(3rem,10vw,6rem)", color:"#fff", textShadow:"0 0 30px rgba(0,0,0,0.8), 0 4px 0 rgba(0,0,0,0.5)", margin:0, textAlign:"center", letterSpacing:"0.05em", animation:"flashText 1.5s ease forwards" }}>
            {roundFlash.toUpperCase()}
          </p>
        </div>
      )}
      <style>{`
        @keyframes flashFadeOut { 0%{opacity:1} 70%{opacity:1} 100%{opacity:0} }
        @keyframes flashText { 0%{transform:scale(0.5)} 20%{transform:scale(1.1)} 35%{transform:scale(1)} 100%{transform:scale(1)} }
      `}</style>
    </>
  );
}
