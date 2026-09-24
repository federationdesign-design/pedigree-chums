import Link from "next/link";
import { breeds } from "../../data/breeds";
import { chumCircleCount } from "../../data/playIntros";
import { getLineage, type LineageNode } from "../../data/lineage";
import { resolveLineageName } from "../../data/lineageNames";
import { isEchoName } from "../../data/lineageShape";
import styles from "./PlayLadder.module.css";

/* THE PLAY LADDERS (owner, 24 September 2026): every chum's game, ranked from
   the fewest circles to the most, in three lists, Easy, Medium and Hard. Each row
   shows the chum's card picture, the number of DIFFERENT dogs in its tree, and
   the number of CIRCLES that drop (a dog met twice drops twice, so circles can be
   far more than dogs). Counted on the server from the lineage data, so the lists
   follow every change to the trees by themselves.

   SEVEN LADDERS, HARDEST FIRST (owner, 24 September 2026, replacing the three
   of Easy, Medium and Hard). Split by RANK rather than by fixed circle counts, so
   the columns stay even as the trees grow: the chums are ranked hardest first
   and dealt out in order, the first columns taking one extra when the count does
   not divide by seven (54 chums: five columns of 8, two of 7). Inside each column
   the hardest is at the top. */
const LEVELS: { title: string; colour: string }[] = [
  { title: "Oober", colour: "#a855f7" },
  { title: "Extreme", colour: "#db2777" },
  { title: "Very hard", colour: "#ef4444" },
  { title: "Hard", colour: "#f97316" },
  { title: "Medium", colour: "#ffd23e" },
  { title: "Easy", colour: "#84cc16" },
  { title: "Very easy", colour: "#22c55e" },
];

// Different dogs in a chum's tree: every name below the chum, counted once.
function dogCount(name: string): number {
  const lin = getLineage(resolveLineageName(name));
  if (!lin) return 0;
  const names = new Set<string>();
  const walk = (x: LineageNode, parent: LineageNode | null, depth: number) => {
    if (depth > 0 && !(parent && isEchoName(x.name, parent.name))) names.add(x.name);
    for (const c of x.children ?? []) walk(c, x, depth + 1);
  };
  walk(lin, null, 0);
  return names.size;
}

type Row = { slug: string; name: string; image: string; circles: number; dogs: number };

function Ladder({ title, colour, sub, rows }: { title: string; colour: string; sub: string; rows: Row[] }) {
  return (
    <section className={styles.ladder} aria-label={`${title} levels`}>
      <header className={styles.head}>
        <h2 className={styles.title} style={{ color: colour }}>{title}</h2>
        <p className={styles.sub}>{sub}</p>
      </header>
      <ol className={styles.list}>
        {rows.map((r, i) => (
          <li key={r.slug}>
            <Link href={`/play/${r.slug}`} className={styles.row} aria-label={`Play the ${r.name}: ${r.dogs} dogs, ${r.circles} circles`}>
              <span className={styles.rank}>{i + 1}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={styles.thumb} src={encodeURI(r.image)} alt="" loading="lazy" width={48} height={48} />
              <span className={styles.name}>{r.name}</span>
              <span className={styles.stat}><span className={styles.num}>{r.dogs}</span><span className={styles.unit}>dogs</span></span>
              <span className={styles.stat}><span className={styles.num}>{r.circles}</span><span className={styles.unit}>circles</span></span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function PlayLadder() {
  const rows: Row[] = breeds
    .filter((b) => !!b.slug)
    .map((b) => ({ slug: b.slug, name: b.name, image: b.image, circles: chumCircleCount(b.name), dogs: dogCount(b.name) }))
    .sort((a, b) => b.circles - a.circles || a.name.localeCompare(b.name));
  // Dealt out hardest first; the first (rows % 7) columns take one extra.
  const base = Math.floor(rows.length / LEVELS.length);
  const extra = rows.length % LEVELS.length;
  const groups = LEVELS.map((lv, i) => {
    const start = i * base + Math.min(i, extra);
    return { ...lv, rows: rows.slice(start, start + base + (i < extra ? 1 : 0)) };
  });
  return (
    <div className={styles.wrap}>
      {groups.map((g) => {
        const hi = g.rows[0]?.circles ?? 0;
        const lo = g.rows[g.rows.length - 1]?.circles ?? 0;
        return <Ladder key={g.title} title={g.title} colour={g.colour} sub={hi === lo ? `${hi} circles` : `${lo} to ${hi} circles`} rows={g.rows} />;
      })}
    </div>
  );
}
