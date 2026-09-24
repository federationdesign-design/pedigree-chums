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
// The still for a clip: the same name with -last.jpg in place of .mp4.
const lastFrameOf = (clip: string) => clip.replace(/\.mp4$/, "-last.jpg");

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
            {/* THE LAST FRAME OF THE CHUM'S OWN INTRO CLIP (owner, 24 September
                2026), in place of the card built from its square photo. The frame
                already carries the dog's name, so nothing is drawn over it. Each
                sits beside its clip in public/ as <clip>-last.jpg, 480px wide. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.img} src={lastFrameOf(INTRO_VIDEOS[b.slug])} alt="" loading="lazy" width={480} height={682} />
          </Link>
        ))}
      </div>
    </section>
  );
}
