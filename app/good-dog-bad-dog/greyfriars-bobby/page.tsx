import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../../../components/Nav/Nav";
import Footer from "../../../components/Footer/Footer";
import RunningCostCard from "../../../components/RunningCostCard/RunningCostCard";
import SuitabilityRadar from "../../../components/SuitabilityRadar/SuitabilityRadar";
import TrainingCard from "../../../components/TrainingCard/TrainingCard";
import GroomingCard from "../../../components/GroomingCard/GroomingCard";
import ExerciseCard from "../../../components/ExerciseCard/ExerciseCard";
import runningCosts from "../../../data/runningCosts";
import suitabilityScores from "../../../data/suitabilityScores";
import trainingDifficulty from "../../../data/trainingDifficulty";
import groomingNeeds from "../../../data/groomingNeeds";
import exerciseNeeds from "../../../data/exerciseNeeds";
import styles from "../good-dog-bad-dog.module.css";

export const metadata: Metadata = {
  title: "Greyfriars Bobby: Loyalty, Legend and the Making of a National Dog | Good Dog, Bad Dog",
  description: "How a small Edinburgh terrier became a symbol of devotion -- and how the story grew larger than the life behind it.",
  robots: "noindex",
};

const SLUG = "skye-terrier";

export default function GreyfriarsBobbyPage() {
  return (
    <>
      <Nav showLogo />
      <main className={styles.essayPage}>
        <div className={styles.essayHero}>
          <img src="/greyfryers-bobby.jpg" alt="Greyfriars Bobby" className={styles.essayHeroImg} />
          <div className={styles.essayHeroTint} />
          <div className={styles.essayHeroContent}>
            <h1 className={styles.essayHeroTitle}>
              <span className={styles.essayHeroTitleWhite}>Greyfriars Bobby:</span> Loyalty, Legend and the Making of a Nation
            </h1>
            <div className={styles.essayHeroMeta}>
              <span className={`${styles.tag} ${styles.tagGood}`}>Good dog</span>
              <span className={styles.tagBreed}>Skye Terrier</span>
            </div>
            <Link href="/good-dog-bad-dog" className={styles.backLink}>← Back to Good Dog, Bad Dog</Link>
          </div>
        </div>

        <div className={styles.essayLayout}>
          <article className={styles.essay}>
            <div className={styles.essayBody}>
              <h2 className={styles.subhead}>The story that grew larger than the life</h2>
              <p>Here is what we know with reasonable confidence about Greyfriars Bobby.</p>
              <p>A small terrier lived in Edinburgh in the second half of the nineteenth century. He became associated with Greyfriars Kirkyard, was fed by local people, was photographed, and died in January 1872. A bronze memorial was erected near the kirkyard entrance within a year of his death.</p>
              <p>Here is what the familiar version adds. Bobby belonged to John Gray, a night watchman with the Edinburgh police. When Gray died in 1858, Bobby followed the funeral procession to Greyfriars Kirkyard and then remained close to the grave for the next fourteen years -- through Edinburgh winters, through hunger, through loneliness -- because he could not bear to leave the place where his master had been buried. He died still faithful. The city erected a statue.</p>
              <p>Both versions have a real dog at their centre. What separates them is the process by which history becomes legend.</p>
              <h2 className={styles.subhead}>The dog who stayed</h2>
              <p>The emotional power of Bobby's story rests on one image: a small dog beside a grave, refusing to leave. Human death has ended the relationship, but the dog refuses to behave as though it has.</p>
              <p>What the popular version tends to simplify is that Bobby's survival required a functioning community around him. Edinburgh residents fed him, recognised him and permitted him to remain. He was not an isolated mourner. He was a dog sustained by a network of human care.</p>
              <p>Bobby's loyalty may have drawn the community around him. The legend says: Bobby remained faithful to John Gray. A fuller account might say: Bobby remained connected to Gray's grave while Edinburgh gradually adopted Bobby. Without the community, there would be no surviving legend.</p>
              <h2 className={styles.subhead}>What the behaviour actually tells us</h2>
              <p>Bobby stayed near Greyfriars Kirkyard. People concluded he was mourning. He returned to familiar places. People understood this as faithfulness. These interpretations are plausible. But Bobby cannot tell us what he experienced. He may have been drawn to the scent and familiarity of the area, to a well-established daily routine, to the food provided by local people -- or to some combination of all of these.</p>
              <p>The moral story selects one explanation above the others: love. The movement from behaviour to moral meaning is central to the way famous dogs are remembered. The story closes the gap by giving Bobby a recognisably human virtue. He becomes faithful.</p>
              <h2 className={styles.subhead}>Was Bobby a Skye Terrier?</h2>
              <p>Probably, but not certainly. Edinburgh's own historical accounts acknowledge that Bobby has been described as either a Skye Terrier or a Dandie Dinmont type, and more recent examination of surviving photographs has raised the possibility that he was a terrier cross.</p>
              <p>The most accurate description is: traditionally identified as a Skye Terrier, though the evidence is not conclusive. The story needs a breed name. Public memory supplies one.</p>
              <div className={styles.breedPanel}>
                <p className={styles.breedPanelLabel}>The real Skye Terrier</p>
                <p>The Kennel Club describes the Skye Terrier as elegant and dignified, with a strong attachment to one person and wariness of strangers. Originally bred to work around rocks, burrows and difficult ground. Currently classified as a vulnerable native breed -- one of the rarer dogs in Britain despite being one of its most famous.</p>
              </div>
              <h2 className={styles.subhead}>The statue that completed the story</h2>
              <p>The bronze Bobby standing above the fountain at the kirkyard entrance is, in one sense, more faithful to the legend than the living dog ever was. Bobby moved around Edinburgh. The bronze dog never leaves his position. A statue does what the legend claims Bobby did: it remains.</p>
              <p>Visitors who touch the nose of the statue -- a tradition that has worn it bright -- are not encountering the historical dog. They are encountering an interpretation of him. The film dog performs Bobby's loyalty. The statue freezes it. The visitor repeats it. The city markets it. Eventually the symbolic Bobby becomes easier to know than the historical one.</p>
              <h2 className={styles.subhead}>What Bobby tells us</h2>
              <p>The Hound of the Baskervilles reflects the fear that dogs can be turned into monsters. Gelert reflects the fear that we might condemn an innocent animal. Lassie reflects the desire that dogs might be better than we are.</p>
              <p>Greyfriars Bobby reflects something else: the human need to believe that love can outlast the person who inspired it.</p>
              <p>That need is genuine. The story that serves it may be partly shaped. And the small terrier at the centre of both has been transformed into something that no living dog could ever quite become. An idea of faithfulness, preserved in bronze.</p>
            </div>
          </article>

          <aside className={styles.sidebar}>
            {runningCosts[SLUG] && <div className={styles.sidebarCard}><RunningCostCard config={runningCosts[SLUG]} /></div>}
            {suitabilityScores[SLUG] && <div className={styles.sidebarCard}><SuitabilityRadar score={suitabilityScores[SLUG]} breedName="Skye Terrier" /></div>}
            {trainingDifficulty[SLUG] && <div className={styles.sidebarCard}><TrainingCard data={trainingDifficulty[SLUG]} /></div>}
            {groomingNeeds[SLUG] && <div className={styles.sidebarCard}><GroomingCard data={groomingNeeds[SLUG]} /></div>}
            {exerciseNeeds[SLUG] && <div className={styles.sidebarCard}><ExerciseCard data={exerciseNeeds[SLUG]} /></div>}
          </aside>
        </div>

        <div className={styles.verdict}><strong>The verdict:</strong> Good dog. Genuine attachment simplified by legend into something closer to perfection than any living animal could sustain.</div>
      </main>
      <Footer />
    </>
  );
}
