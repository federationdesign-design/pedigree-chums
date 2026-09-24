import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import PlayChumsRail from "../../components/PlayChumsRail/PlayChumsRail";
import PlayLadder from "../../components/PlayLadder/PlayLadder";
import ArticleTextToggle from "../../components/ArticleTextToggle/ArticleTextToggle";
import styles from "./play.module.css";

/* THE PLAY PAGE (owner, 24 September 2026): the homepage's chum slider on its
   own, with every chum in it, under one title. The homepage copy hides seven. */
export const metadata: Metadata = {
  title: "Play and learn about your chums",
  description: "Pick a dog, watch its film and play its family tree. Come play and learn about some of your chums.",
};

export default function PlayPage() {
  return (
    <main className={styles.page}>
      <Nav />
      <section className={styles.intro}>
        <h1 className={styles.heading}>
          Come play and learn about some of your <span className={styles.yellow}>chums</span>
        </h1>
        {/* The text colour toggle, under the title (owner, 24 September 2026):
            it turns the level tables white with navy text. */}
        <ArticleTextToggle centered labelOn="Switch to white tables with navy text" labelOff="Switch back to the glass tables" />
      </section>
      {/* TWO ROWS (owner, 24 September 2026): the chums with a film to watch on
          top, the rest below. */}
      <PlayChumsRail films="with" anchorId="play-chums-films" label="Chums with a film to watch" />
      <div className={styles.rowGap} />
      <PlayChumsRail films="without" anchorId="play-chums-more" label="More chums to play" />
      {/* THE LADDERS (owner, 24 September 2026): every chum's game in Easy,
          Medium and Hard, fewest circles first. */}
      <PlayLadder />
      <Footer />
    </main>
  );
}
