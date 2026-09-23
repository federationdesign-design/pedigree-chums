import Link from "next/link";
import { levelBreeds, levelSlug } from "../../data/levels";
import styles from "./EraSummary.module.css";

/* THE PLAIN-PROSE PARAGRAPH, 23 September 2026 (owner: SEO work).

   Everything else on an era page lives inside a map, a slider or a card. A search
   engine can read those, but it reads them poorly and will not quote them, so the
   pages had almost no ordinary prose to rank on. This paragraph is that prose: it
   sits in plain markup at the foot of the page and says what the era did to
   Britain's dogs.

   IT ALSO DOES THE INTERNAL LINKING. Every breed name in the text that matches a
   level is linked to that dog's own page, first mention only. Those 98 pages had
   almost nothing pointing at them from within the site, and this is the cheapest
   way to spread the link equity the era pages earn. Longest names are matched
   first, so "Celtic Coursing Hound" is not swallowed by "Celtic Hound". */

const LEVELS = levelBreeds()
  .map((b) => b.name)
  .sort((a, b) => b.length - a.length);

type Piece = { text: string; href?: string };

function linkBreeds(text: string): Piece[] {
  const used = new Set<string>();
  let pieces: Piece[] = [{ text }];

  for (const name of LEVELS) {
    if (used.has(name)) continue;
    const next: Piece[] = [];
    let done = false;
    for (const piece of pieces) {
      if (done || piece.href) {
        next.push(piece);
        continue;
      }
      const at = piece.text.indexOf(name);
      if (at === -1) {
        next.push(piece);
        continue;
      }
      if (at > 0) next.push({ text: piece.text.slice(0, at) });
      next.push({ text: name, href: `/britains-dog-history/dog/${levelSlug(name)}` });
      const rest = piece.text.slice(at + name.length);
      if (rest) next.push({ text: rest });
      used.add(name);
      done = true;
    }
    pieces = next;
  }
  return pieces;
}

export default function EraSummary({ text, heading }: { text: string; heading: string }) {
  const pieces = linkBreeds(text);
  return (
    <section className={styles.wrap} aria-label={heading}>
      <p className={styles.text}>
        {pieces.map((p, i) =>
          p.href ? (
            <Link key={i} href={p.href} className={styles.link}>
              {p.text}
            </Link>
          ) : (
            <span key={i}>{p.text}</span>
          )
        )}
      </p>
    </section>
  );
}
