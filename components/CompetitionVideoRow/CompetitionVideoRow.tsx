import styles from "./CompetitionVideoRow.module.css";

/* Three Vimeo clips in a row (Steve, 26 Aug 2026). Standard Vimeo players: each
   shows its thumbnail and plays with sound on click, no autoplay. Self-contained,
   not a generalisation of the homepage VideoSection. The videos live on Vimeo, so
   the row adds almost nothing to the page weight. IDs come from the per-breed
   config, so next month is three new IDs. Desktop is a 3-column row; below 768px
   it stacks to one column (a Vimeo iframe captures touch, so a swipe rail would
   fight the player). */

type Props = {
  /** Vimeo video IDs, left to right (from config). */
  videos: string[];
};

export default function CompetitionVideoRow({ videos }: Props) {
  return (
    <section className={styles.section} aria-label="Competition videos">
      <div className={styles.row}>
        {videos.map((id, i) => (
          <div key={id} className={styles.col}>
            <iframe
              className={styles.frame}
              src={`https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0&dnt=1`}
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
