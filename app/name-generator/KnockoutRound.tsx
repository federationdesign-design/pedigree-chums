"use client";
import { useState } from "react";
import styles from "./KnockoutRound.module.css";
import ShareScreen from "./ShareScreen";
import { ShortlistEntry } from "./ShortlistBar";

type Platform = "instagram" | "twitter" | "tiktok" | "none";
const PLATFORM_LIMIT: Record<string, number> = {
  instagram: 2,
  twitter: 4,
  tiktok: 2,
  none: 4,
};

type Props = {
  shortlist: ShortlistEntry[];
  breed: string;
  onBack: () => void;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function KnockoutRound({ shortlist, breed, onBack }: Props) {
  const [phase, setPhase] = useState<"intro" | "fighting" | "share">("intro");
  const [platform] = useState<Platform>("none");
  const [remaining, setRemaining] = useState<ShortlistEntry[]>([]);
  const [pairIdx, setPairIdx] = useState(0);
  const [byes, setByes] = useState<ShortlistEntry[]>([]);
  const [finalists, setFinalists] = useState<ShortlistEntry[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [favePick, setFavePick] = useState<ShortlistEntry | null>(null);

  // Top 2 by score
  const ourPicks = [...shortlist].sort((a, b) => b.score - a.score).slice(0, 2);

  // User taps one of Our Picks -- that's their declared favourite
  // It gets a bye straight to the end; the rest fight it out
  function pickFavourite(pick: ShortlistEntry) {
    setFavePick(pick);
    const rest = shuffle(shortlist.filter(e => e.full !== pick.full));
    if (rest.length === 0) {
      setFinalists([pick]);
      setPhase("share");
      return;
    }
    setRemaining(rest);
    setPairIdx(0);
    setByes([pick]); // favourite gets a bye
    setPhase("fighting");
  }

  // Fighting phase pick
  const pair = [remaining[pairIdx * 2], remaining[pairIdx * 2 + 1]].filter(Boolean);
  const hasBye = pair.length === 1;
  const limit = PLATFORM_LIMIT[platform];

  function pick(winner: ShortlistEntry) {
    const winnerIdx = pair.indexOf(winner);
    setChosen(winnerIdx);
    setTimeout(() => {
      setChosen(null);
      const winners = [...byes, winner];
      const nextPairIdx = pairIdx + 1;
      const totalPairs = Math.floor(remaining.length / 2);

      if (nextPairIdx >= totalPairs) {
        const roundWinners = [...winners];
        if (remaining.length % 2 === 1) {
          roundWinners.push(remaining[remaining.length - 1]);
        }
        if (roundWinners.length <= limit) {
          setFinalists(roundWinners);
          setPhase("share");
        } else {
          setRemaining(shuffle(roundWinners.filter(e => e.full !== (favePick?.full ?? ""))));
          const fave = roundWinners.find(e => e.full === favePick?.full);
          setPairIdx(0);
          setByes(fave ? [fave] : []);
        }
      } else {
        setByes(winners);
        setPairIdx(nextPairIdx);
      }
    }, 400);
  }

  if (phase === "share") {
    return <ShareScreen finalists={finalists} breed={breed} platform={platform} onBack={onBack} />;
  }

  if (phase === "fighting") {
    const currentWinners = byes.length + pairIdx;
    const progress = currentWinners / (shortlist.length - limit);

    return (
      <div className={styles.wrap}>
        <button className={styles.backBtn} onClick={onBack}>← Back</button>
        <h2 className={`display ${styles.title}`}>
          The <span className={styles.yellow}>Knockout</span> Round
        </h2>
        <p className={styles.sub}>Pick your favourite</p>

        <div className={styles.progress}>
          <div className={styles.progressBar} style={{ width: `${Math.min(progress * 100, 100)}%` }} />
        </div>

        <div className={styles.pairWrap}>
          {hasBye ? (
            <div className={styles.byeCard}>
              <p className={styles.byeLabel}>🎉 Free pass!</p>
              <p className={styles.byeName}>{pair[0].full}</p>
              {pair[0].nickname && pair[0].nickname !== pair[0].full && (
                <p className={styles.byeNick}>"{pair[0].nickname}"</p>
              )}
              <button className={styles.byeBtn} onClick={() => pick(pair[0])}>Advance →</button>
            </div>
          ) : (
            pair.map((entry, i) => (
              <button
                key={entry.full}
                className={`${styles.fightCard} ${chosen === i ? styles.winner : ""} ${chosen !== null && chosen !== i ? styles.loser : ""}`}
                onClick={() => chosen === null && pick(entry)}
                disabled={chosen !== null}
              >
                <p className={styles.fightName}>{entry.full}</p>
                {entry.nickname && entry.nickname !== entry.full && (
                  <p className={styles.fightNick}>"{entry.nickname}"</p>
                )}
                <span className={styles.fightVs}>TAP TO PICK</span>
              </button>
            ))
          )}
        </div>

        {!hasBye && pair.length === 2 && (
          <p className={styles.vsLabel}>VS</p>
        )}
      </div>
    );
  }

  // ── INTRO ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.wrap}>
      <button className={styles.backBtn} onClick={onBack}>← Back</button>

      <h2 className={`display ${styles.title}`}>
        The <span className={styles.yellow}>Knockout</span> Round
      </h2>
      <p className={styles.sub}>
        You&apos;ve saved {shortlist.length} name{shortlist.length !== 1 ? "s" : ""}. Tap your favourite to kick things off.
      </p>

      <div className={styles.allNamesBox}>
        <p className={styles.allNamesLabel}>Pick your favourite to start</p>
        <div className={styles.allNamesList}>
          {shortlist.map((e) => (
            <button
              key={e.full}
              className={styles.allNameBtn}
              onClick={() => pickFavourite(e)}
            >
              {e.full}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
