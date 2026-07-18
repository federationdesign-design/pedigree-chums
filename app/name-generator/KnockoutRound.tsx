"use client";
import { useState } from "react";
import styles from "./KnockoutRound.module.css";
import ShareScreen from "./ShareScreen";
import { ShortlistEntry } from "./ShortlistBar";

type Platform = "instagram" | "twitter" | "tiktok" | "none";
const PLATFORM_LIMIT: Record<string, number> = {
  instagram: 2, twitter: 4, tiktok: 2, none: 4,
};

type Props = { shortlist: ShortlistEntry[]; breed: string; onBack: () => void; };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function KnockoutRound({ shortlist, breed, onBack }: Props) {
  const [phase, setPhase] = useState<"platform" | "fighting" | "share">("platform");
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [bracket, setBracket] = useState<ShortlistEntry[]>([]);
  const [pairIdx, setPairIdx] = useState(0);
  const [roundWinners, setRoundWinners] = useState<ShortlistEntry[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [roundNum, setRoundNum] = useState(1);
  const [finalists, setFinalists] = useState<ShortlistEntry[]>([]);

  const limit = PLATFORM_LIMIT[platform ?? "none"];

  function startKnockout() {
    if (!platform) return;
    setBracket(shuffle(shortlist));
    setPairIdx(0);
    setRoundWinners([]);
    setRoundNum(1);
    setPhase("fighting");
  }

  const pairA = bracket[pairIdx * 2];
  const pairB = bracket[pairIdx * 2 + 1];
  const hasBye = pairA && !pairB;
  const isLastPair = pairIdx + 1 >= Math.floor(bracket.length / 2);

  function endRound(winners: ShortlistEntry[]) {
    const odd = bracket.length % 2 === 1 ? bracket[bracket.length - 1] : null;
    const next = odd ? [...winners, odd] : winners;
    if (next.length <= limit) {
      setFinalists(next);
      setPhase("share");
    } else {
      setBracket(shuffle(next));
      setPairIdx(0);
      setRoundWinners([]);
      setRoundNum(r => r + 1);
    }
  }

  function pick(winner: ShortlistEntry) {
    if (chosen !== null) return;
    setChosen([pairA, pairB].indexOf(winner));
    setTimeout(() => {
      setChosen(null);
      const next = [...roundWinners, winner];
      if (isLastPair) endRound(next);
      else { setRoundWinners(next); setPairIdx(i => i + 1); }
    }, 400);
  }

  function advanceBye() {
    const next = [...roundWinners, pairA];
    if (isLastPair) endRound(next);
    else { setRoundWinners(next); setPairIdx(i => i + 1); }
  }

  if (phase === "share") return <ShareScreen finalists={finalists} breed={breed} platform={platform} onBack={onBack} />;

  if (phase === "platform") return (
    <div className={styles.wrap}>
      <h2 className={`display ${styles.title}`}>The <span className={styles.yellow}>Knockout</span> Round</h2>
      <p className={styles.sub}>{shortlist.length} names saved. Where are you sharing?</p>
      <div className={styles.platformGrid}>
        {([
          { id: "instagram", emoji: "📸", name: "Instagram", note: "Final 2" },
          { id: "twitter",   emoji: "𝕏",  name: "X / Twitter", note: "Final 4" },
          { id: "tiktok",    emoji: "🎵", name: "TikTok", note: "Final 2" },
          { id: "none",      emoji: "📋", name: "No platform", note: "Final 4" },
        ] as { id: Platform; emoji: string; name: string; note: string }[]).map(p => (
          <button key={p.id}
            className={`${styles.platformBtn} ${platform === p.id ? styles.platformSelected : ""}`}
            onClick={() => setPlatform(p.id)}>
            <span className={styles.platformEmoji}>{p.emoji}</span>
            <span className={styles.platformName}>{p.name}</span>
            <span className={styles.platformLimit}>{p.note}</span>
          </button>
        ))}
      </div>
      <button className={styles.startBtn} disabled={!platform} onClick={startKnockout}>
        Start the Knockout →
      </button>
    </div>
  );

  return (
    <div className={styles.wrap}>
      <h2 className={`display ${styles.title}`}>The <span className={styles.yellow}>Knockout</span> Round</h2>
      <p className={styles.sub}>Round {roundNum} — tap to pick the winner</p>
      <div className={styles.progress}>
        <div className={styles.progressBar} style={{ width: `${Math.min(((roundNum-1)/Math.ceil(Math.log2(Math.max(shortlist.length/limit,2))))*100,95)}%` }} />
      </div>
      {hasBye ? (
        <div className={styles.byeCard}>
          <p className={styles.byeLabel}>🎉 Free pass!</p>
          <p className={styles.byeName}>{pairA.full}</p>
          <button className={styles.byeBtn} onClick={advanceBye}>Through →</button>
        </div>
      ) : (
        <>
          <p className={styles.vsLabel}>VS</p>
          <div className={styles.pairWrap}>
            {[pairA, pairB].filter(Boolean).map((entry, i) => (
              <button key={entry.full}
                className={`${styles.fightCard} ${chosen === i ? styles.winner : ""} ${chosen !== null && chosen !== i ? styles.loser : ""}`}
                onClick={() => pick(entry)} disabled={chosen !== null}>
                <p className={styles.fightName}>{entry.full}</p>
                {entry.nickname && entry.nickname !== entry.full && (
                  <p className={styles.fightNick}>"{entry.nickname}"</p>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
