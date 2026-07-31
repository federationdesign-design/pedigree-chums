/* The invented dogs the player is measured against.
   These are deliberately fictional: the board is a solo yardstick, not a
   competition. Only one real score ever appears on it, the player's own.

   The same eight dogs and the same figures the main pit's GameOver screen
   uses. That file still carries its own copy; when it is migrated it should
   import from here so the two cannot drift apart. */
export const DOG_POOL: { name: string; scores: number[] }[] = [
  { name: "Rover", scores: [28400, 34200, 19800, 42100, 31500] },
  { name: "Max", scores: [22100, 38700, 15600, 29300, 44800] },
  { name: "Rolo", scores: [18500, 27900, 41200, 33600, 12400] },
  { name: "Biscuit", scores: [9800, 16200, 24500, 38100, 21700] },
  { name: "Scruff", scores: [47300, 31800, 22600, 39500, 14900] },
  { name: "Pickle", scores: [7600, 13400, 19200, 28500, 35700] },
  { name: "Monty", scores: [26500, 43100, 17800, 32400, 48200] },
  { name: "Bonnie", scores: [11300, 24800, 37600, 20100, 29400] },
];

export type BoardEntry = { name: string; score: number; isDog: boolean };

function todayStr(): string {
  return new Date().toDateString();
}

/* Seeded off the date, so the board is stable for a whole day and different
   the next. Same shuffle the main pit uses. */
export function dogLeaderboard(count: number): BoardEntry[] {
  const seed = todayStr()
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = (n: number) => {
    const x = Math.sin(seed + n) * 10000;
    return x - Math.floor(x);
  };
  return [...DOG_POOL]
    .sort((a, b) => rng(a.name.charCodeAt(0)) - rng(b.name.charCodeAt(0)))
    .slice(0, count)
    .map((dog, i) => ({
      name: dog.name,
      score: dog.scores[Math.floor(rng(i + 10) * dog.scores.length)],
      isDog: true,
    }))
    .sort((a, b) => b.score - a.score);
}

/* The player's own row against the dogs. No storage: the score is already in
   hand on the screen this renders on, and nothing from an earlier run is
   wanted here. */
export function buildBoard(
  playerScore: number,
  playerLabel: string,
  dogCount: number,
): BoardEntry[] {
  const rows: BoardEntry[] = [
    ...dogLeaderboard(dogCount),
    { name: playerLabel, score: playerScore, isDog: false },
  ];
  return rows.sort((a, b) => b.score - a.score);
}
