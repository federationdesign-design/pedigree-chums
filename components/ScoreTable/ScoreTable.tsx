"use client";
import { useMemo } from "react";
import { buildBoard } from "../../data/dogLeaderboard";
import css from "./ScoreTable.module.css";

type Props = {
  score: number;
  dogs?: number;
  playerLabel?: string;
  title?: string;
};

export default function ScoreTable({
  score,
  dogs = 3,
  playerLabel = "You",
  title = "Today's high scores",
}: Props) {
  const rows = useMemo(
    () => buildBoard(score, playerLabel, dogs),
    [score, playerLabel, dogs],
  );

  return (
    <div className={css.board}>
      <p className={css.title}>{title}</p>
      {rows.map((entry, i) => (
        <div
          key={`${entry.name}${entry.score}`}
          className={`${css.row}${entry.isDog ? "" : " " + css.rowPlayer}`}
        >
          <span className={css.pos}>{i + 1}</span>
          <span className={css.name}>{entry.name}</span>
          <span className={css.score}>{entry.score.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
