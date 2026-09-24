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

   THE CUT-OFFS split the 54 chums into near-even thirds on round numbers: 19, 18
   and 17 when set. Change them here. */
const EASY_MAX = 30;
const MEDIUM_MAX = 150;

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

function Ladder({ title, tone, sub, rows }: { title: string; tone: string; sub: string; rows: Row[] }) {
  return (
    <section className={styles.ladder} aria-label={`${title} levels`}>
      <header className={styles.head}>
        <h2 className={`${styles.title} ${tone}`}>{title}</h2>
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
    .sort((a, b) => a.circles - b.circles || a.name.localeCompare(b.name));
  const easy = rows.filter((r) => r.circles <= EASY_MAX);
  const medium = rows.filter((r) => r.circles > EASY_MAX && r.circles <= MEDIUM_MAX);
  const hard = rows.filter((r) => r.circles > MEDIUM_MAX);
  return (
    <div className={styles.wrap}>
      <Ladder title="Easy" tone={styles.easy} sub={`Up to ${EASY_MAX} circles`} rows={easy} />
      <Ladder title="Medium" tone={styles.medium} sub={`${EASY_MAX + 1} to ${MEDIUM_MAX} circles`} rows={medium} />
      <Ladder title="Hard" tone={styles.hard} sub={`Over ${MEDIUM_MAX} circles`} rows={hard} />
    </div>
  );
}
