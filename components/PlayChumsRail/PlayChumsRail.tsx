import Link from "next/link";
import { breeds } from "../../data/breeds";
import { CHUM_VIMEO, INTRO_VIDEOS, chumCircleCount, vimeoSeconds } from "../../data/playIntros";
import WatchVideoRow from "./WatchVideoRow";
import ScrollRail from "./ScrollRail";
import styles from "./PlayChumsRail.module.css";

/* THE CHUM PLAY LINKS ON THE HOMEPAGE (owner, 24 September 2026): every chum with
   an intro clip, as a horizontal slider, each card opening /play/<slug>.

   ORDERED BY HOW MANY CIRCLES THE LEVEL DROPS, smallest first, so the quickest
   games lead. Counted on the server at build (see chumCircleCount), never on the
   phone. A chum is on the rail exactly when it has a clip in INTRO_VIDEOS, the
   same list the /play pages read, so the two cannot disagree. */
// The still for a clip: the same name with -last.jpg in place of .mp4.
const lastFrameOf = (clip: string) => clip.replace(/\.mp4$/, "-last.jpg");

/* hide: chum slugs to leave off this copy of the slider (owner, 24 September
   2026: the homepage hides seven for now, the /play page shows them all). */
/* films: "with" keeps only the chums that have a Watch video film, "without" only
   the rest (owner, 24 September 2026: the /play page splits them into two rows,
   films on top). anchorId: the section's id; only the homepage copy carries the
   one the learn area's back button returns to, so two rows never share an id. */
export default async function PlayChumsRail({ hide = [], films, anchorId = "play-chums", label = "Play a chum" }: { hide?: string[]; films?: "with" | "without"; anchorId?: string; label?: string } = {}) {
  const chums = Object.keys(INTRO_VIDEOS)
    .filter((slug) => !hide.includes(slug))
    .filter((slug) => !films || (films === "with") === !!CHUM_VIMEO[slug])
    .map((slug) => breeds.find((b) => b.slug === slug))
    .filter((b): b is (typeof breeds)[number] => !!b)
    .map((b) => ({ b, circles: chumCircleCount(b.name) }))
    .sort((x, y) => x.circles - y.circles);
  // Each film's length, asked of Vimeo once per build (cached a day).
  const secs = new Map<string, number | null>();
  await Promise.all(chums.map(async ({ b }) => {
    const id = CHUM_VIMEO[b.slug];
    if (id) secs.set(b.slug, await vimeoSeconds(id));
  }));
  return (
    /* NO VISIBLE TITLE (owner, 24 September 2026: the "Play a chum" heading is
       removed). A screen reader still hears what the row is, from the label. */
    // id: the anchor the learn area's back square returns to. ?from=home on the
    // links is how a /play page knows it was opened from here.
    <section id={anchorId} className={styles.wrap} aria-label={label}>
      <ScrollRail className={styles.rail}>
        {chums.map(({ b, circles }) => {
          const poster = lastFrameOf(INTRO_VIDEOS[b.slug]);
          const vimeoId = CHUM_VIMEO[b.slug];
          return (
            <div key={b.slug} className={styles.card} data-play-card>
              {/* THE LAST FRAME OF THE CHUM'S OWN INTRO CLIP. The frame already
                  carries the dog's name. A tap on the picture plays the game. */}
              <Link href={`/play/${b.slug}?from=home`} tabIndex={-1} aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={styles.img} src={poster} alt="" loading="lazy" width={480} height={682} />
              </Link>
              {/* THE CARD'S FOOTER (owner, 24 September 2026, from his mock-up):
                  PLAY GAME with the joystick and the level's circle count on
                  every card, and WATCH VIDEO with the film's length above it on
                  the chums that have a film. */}
              <div className={styles.actions}>
                {vimeoId ? <WatchVideoRow name={b.name} slug={b.slug} vimeoId={vimeoId} poster={poster} seconds={secs.get(b.slug) ?? null} /> : null}
                <Link href={`/play/${b.slug}?from=home`} className={styles.row} aria-label={`Play the ${b.name} game, ${circles} dogs`}>
                  <span className={styles.rowLabel}>Play game</span>
                  <span className={`${styles.dot} ${styles.dotPlay}`} aria-hidden="true">🕹️</span>
                  <span className={`${styles.dot} ${styles.dotDogs}`} aria-hidden="true">
                    <span className={styles.dotNum}>{circles}</span>
                    <span className={styles.dotUnit}>dogs</span>
                  </span>
                </Link>
              </div>
            </div>
          );
        })}
      </ScrollRail>
    </section>
  );
}
