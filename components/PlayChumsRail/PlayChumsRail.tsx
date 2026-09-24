import Link from "next/link";
import { breeds } from "../../data/breeds";
import { INTRO_VIDEOS, chumCircleCount } from "../../data/playIntros";
import styles from "./PlayChumsRail.module.css";

/* THE CHUM PLAY LINKS ON THE HOMEPAGE (owner, 24 September 2026): every chum with
   an intro clip, as a horizontal slider, each card opening /play/<slug>.

   ORDERED BY HOW MANY CIRCLES THE LEVEL DROPS, smallest first, so the quickest
   games lead. Counted on the server at build (see chumCircleCount), never on the
   phone. A chum is on the rail exactly when it has a clip in INTRO_VIDEOS, the
   same list the /play pages read, so the two cannot disagree. */
export default function PlayChumsRail() {
  const chums = Object.keys(INTRO_VIDEOS)
    .map((slug) => breeds.find((b) => b.slug === slug))
    .filter((b): b is (typeof breeds)[number] => !!b)
    .map((b) => ({ b, circles: chumCircleCount(b.name) }))
    .sort((x, y) => x.circles - y.circles);
  return (
    <section className={styles.wrap} aria-labelledby="play-chums-heading">
      <h2 id="play-chums-heading" className={styles.heading}>
        Play a <span className={styles.headingYellow}>chum</span>
      </h2>
      <div className={styles.rail}>
        {chums.map(({ b }) => (
          <Link key={b.slug} href={`/play/${b.slug}`} className={styles.card} aria-label={`Play the ${b.name}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.img} src={encodeURI(b.image)} alt="" loading="lazy" />
            <span className={styles.name}>{b.name}</span>
            <span className={styles.play}>Play</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
