"use client";
import { useState, useRef, useEffect } from "react";
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
      for (let i = 0; i < n; i++) if (!used[i]) { paired.push(entries2[i]); used[i] = true; }
      break;
    }
    paired.push(entries2[bestI], entries2[bestJ]);
    used[bestI] = used[bestJ] = true;
  }
  return paired;
}

// ── Bracket slot types ────────────────────────────────────────────────────
type SlotState = "pending" | "winner" | "loser" | "bye";
type BracketSlot = { entry: ShortlistEntry | null; state: SlotState };
type BracketRound = BracketSlot[][];  // round[matchIdx][0|1]

function buildBracket(seeded: ShortlistEntry[]): BracketRound[] {
  // Pad to next power of 2
  const size = Math.pow(2, Math.ceil(Math.log2(Math.max(seeded.length, 2))));
  const slots: (ShortlistEntry | null)[] = [...seeded];
  while (slots.length < size) slots.push(null); // null = bye slot

  // Round 1: pair adjacent slots
  const round1: BracketSlot[][] = [];
  for (let i = 0; i < size; i += 2) {
    const a = slots[i];
    const b = slots[i + 1];
    round1.push([
      { entry: a, state: a ? (b ? "pending" : "bye") : "pending" },
      { entry: b, state: b ? (a ? "pending" : "pending") : "pending" },
    ]);
  }

  // Subsequent rounds: empty pending slots
  const rounds: BracketRound[] = [round1];
  let matchCount = size / 2;
  while (matchCount > 1) {
    matchCount /= 2;
    const round: BracketSlot[][] = [];
    for (let i = 0; i < matchCount; i++) {
      round.push([
        { entry: null, state: "pending" },
        { entry: null, state: "pending" },
      ]);
    }
    rounds.push(round);
  }
  return rounds;
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
  const [first, setFirst] = useState<ShortlistEntry | null>(null);
  const [second, setSecond] = useState<ShortlistEntry | null>(null);
  const [allRoundLosers, setAllRoundLosers] = useState<ShortlistEntry[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [podiumReady, setPodiumReady] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Advance through byes automatically
  useEffect(() => {
    if (phase !== "fighting") return;
    const round = bracket[currentRound];
    if (!round) return;
    const match = round[currentMatch];
    if (!match) return;
    const [slotA, slotB] = match;
    // If one slot is null (bye), advance the other automatically
    if (slotA.entry && !slotB.entry) {
      advanceWinner(slotA.entry, null, true);
    } else if (!slotA.entry && slotB.entry) {
      advanceWinner(slotB.entry, null, true);
    }
  }, [currentRound, currentMatch, bracket, phase]);

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

  function advanceWinner(winner: ShortlistEntry, loser: ShortlistEntry | null, isBye = false) {
    const newBracket = bracket.map(r => r.map(m => m.map(s => ({ ...s }))));
    const curMatch = newBracket[currentRound][currentMatch];

    // Mark winner/loser in current round
    curMatch[0].state = curMatch[0].entry === winner ? "winner" : (curMatch[0].entry ? "loser" : "pending");
    curMatch[1].state = curMatch[1].entry === winner ? "winner" : (curMatch[1].entry ? "loser" : "pending");

    // Place winner in next round
    const nextRoundIdx = currentRound + 1;
    if (nextRoundIdx < newBracket.length) {
      const nextMatchIdx = Math.floor(currentMatch / 2);
      const nextSlotIdx = currentMatch % 2;
      newBracket[nextRoundIdx][nextMatchIdx][nextSlotIdx].entry = winner;
      newBracket[nextRoundIdx][nextMatchIdx][nextSlotIdx].state = "pending";
    }

    // Track losers for 3rd place
    if (loser && !isBye) {
      const isFinalRound = currentRound === totalRounds - 1;
      if (!isFinalRound) {
        setAllRoundLosers(prev => [...prev, loser]);
      } else {
        // Final loser = 2nd place
        setSecond(loser);
      }
    }

    setBracket(newBracket);

    // Advance to next match or next round
    const nextMatchInRound = currentMatch + 1;
    if (nextMatchInRound < (newBracket[currentRound]?.length ?? 0)) {
      setCurrentMatch(nextMatchInRound);
    } else {
      // Round complete
      if (nextRoundIdx >= newBracket.length) {
        // Tournament over
        setFirst(winner);
        try { sessionStorage.removeItem("pc_shortlist"); } catch {}
        setPhase("podium");
      } else {
        setCurrentRound(nextRoundIdx);
        setCurrentMatch(0);
      }
    }
  }

  function pick(winner: ShortlistEntry, loser: ShortlistEntry) {
    if (chosen !== null) return;
    setChosen(pairA === winner ? 0 : 1);
    setTimeout(() => {
      setChosen(null);
      advanceWinner(winner, loser);
    }, 400);
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

        drawPlacard(getLabel(first), first.full !== getLabel(first) ? first.full : "", 627, 512, 72, 32, 5, 460);
        if (p2) drawPlacard(getLabel(p2), p2.full !== getLabel(p2) ? p2.full : "", 275, 754, 44, 20, -6, 270);
        if (p3) drawPlacard(getLabel(p3), p3.full !== getLabel(p3) ? p3.full : "", 978, 754, 44, 20, -5, 270);
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
        {!hasBye && pairA && pairB ? (
          <div className={styles.pairWrap} onMouseLeave={() => setHoveredIdx(null)}>
            <button
              className={`${styles.fightCard} ${chosen === 0 ? styles.winner : ""} ${chosen !== null && chosen !== 0 ? styles.loser : ""} ${hoveredIdx === 0 ? styles.hoverGreen : ""} ${hoveredIdx !== null && hoveredIdx !== 0 ? styles.hoverRed : ""}`}
              onClick={() => pick(pairA, pairB)} disabled={chosen !== null}
              onMouseEnter={() => setHoveredIdx(0)}>
              <p className={styles.fightName}>{getLabel(pairA)}</p>
              {pairA.nickname && pairA.nickname !== pairA.full && (
                <p className={styles.fightNick} style={{ color: hoveredIdx !== null ? "var(--navy, #0a3a57)" : "var(--yellow, #ffe227)", transition: "color 0.3s ease 0.3s" }}>{pairA.full}</p>
              )}
            </button>
            <p className={styles.vsLabel}>VS</p>
            <button
              className={`${styles.fightCard} ${chosen === 1 ? styles.winner : ""} ${chosen !== null && chosen !== 1 ? styles.loser : ""} ${hoveredIdx === 1 ? styles.hoverGreen : ""} ${hoveredIdx !== null && hoveredIdx !== 1 ? styles.hoverRed : ""}`}
              onClick={() => pick(pairB, pairA)} disabled={chosen !== null}
              onMouseEnter={() => setHoveredIdx(1)}>
              <p className={styles.fightName}>{getLabel(pairB)}</p>
              {pairB.nickname && pairB.nickname !== pairB.full && (
                <p className={styles.fightNick} style={{ color: hoveredIdx !== null ? "var(--navy, #0a3a57)" : "var(--yellow, #ffe227)", transition: "color 0.3s ease 0.3s" }}>{pairB.full}</p>
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
                              className={[
                                styles.bracketSlot,
                                slot.state === "winner" ? styles.bracketWinner : "",
                                slot.state === "loser" ? styles.bracketLoser : "",
                                slot.state === "bye" ? styles.bracketBye : "",
                                rIdx === currentRound && mIdx === currentMatch ? styles.bracketSlotActive : "",
                              ].filter(Boolean).join(" ")}>
                              {slot.entry ? getLabel(slot.entry) : <span className={styles.bracketEmpty}>TBD</span>}
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
    </>
  );
}
