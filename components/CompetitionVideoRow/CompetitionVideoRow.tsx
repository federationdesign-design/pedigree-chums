import type { CSSProperties } from "react";
import styles from "./CompetitionVideoRow.module.css";

/* Three Vimeo clips in a row (Steve, 26 Aug 2026). Standard Vimeo players: each
   shows its thumbnail and plays with sound on click, no autoplay. Self-contained,
   not a generalisation of the homepage VideoSection. The videos live on Vimeo, so
   the row adds almost nothing to the page weight. Each clip carries its own Vimeo
   id and native pixel size from the per-breed config; the aspect (w/h) is passed to
   the CSS as --aspect so the box cover-fills any shape (the Vimeo player is given
   the clip's own aspect, leaving it no room to letterbox, and the box clips the
   overflow). So next month is three new clips of any shape, no code change. Desktop
   is a 3-column row; below 768px it stacks to one column (a Vimeo iframe captures
   touch, so a swipe rail would fight the player). */

type Clip = { id: string; w: number; h: number };

type Props = {
  /** The three clips, left to right, each with its Vimeo id and native pixel size. */
  videos: Clip[];
};

export default function CompetitionVideoRow({ videos }: Props) {
  return (
    <section className={styles.section} aria-label="Competition videos">
      <div className={styles.row}>
        {videos.map((v, i) => (
          <div key={v.id} className={styles.col}>
            <iframe
              className={styles.frame}
              style={{ "--aspect": v.w / v.h } as CSSProperties}
              src={`https://player.vimeo.com/video/${v.id}?title=0&byline=0&portrait=0&dnt=1`}
              title={`Competition video ${i + 1}`}
              allow="fullscreen; picture-in-picture"
              frameBorder="0"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
