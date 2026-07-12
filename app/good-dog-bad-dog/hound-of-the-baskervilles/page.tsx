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
  title: "The Hound of the Baskervilles: How a Dog Was Made into a Monster | Good Dog, Bad Dog",
  description: "How Arthur Conan Doyle turned a real dog into the image of a supernatural killer.",
  robots: "noindex",
};

const SLUG = "bloodhound";

export default function HoundPage() {
  return (
    <>
      <Nav showLogo />
      <main className={styles.essayPage}>
        <div className={styles.essayHero}>
          <Link href="/good-dog-bad-dog" className={styles.backLink}>← Back to Good Dog, Bad Dog</Link>
          <img src="/bloodhound-square.jpg" alt="Bloodhound" className={styles.essayHeroImg} />
          <div className={styles.essayHeroTint} />
          <div className={styles.essayHeroContent}>
            <div className={styles.essayHeroMeta}>
              <span className={`${styles.tag} ${styles.tagBad}`}>Bad dog</span>
              <span className={styles.tagBreed}>Bloodhound / Mastiff</span>
            </div>
            <h1 className={styles.essayHeroTitle}>The Hound of the Baskervilles: How a Dog Was Made into a Monster</h1>
          </div>
        </div>

        <div className={styles.essayLayout}>
          <article className={styles.essay}>
            <div className={styles.essayBody}>
              <h2 className={styles.subhead}>A body on the moor, and something in the dark</h2>
              <p>A wealthy man is found dead on the edge of Dartmoor. No obvious wounds. But nearby, someone has found the footprints of an enormous hound.</p>
              <p>Sir Charles Baskerville already believed his family was haunted. An old legend told of a monstrous black dog that had pursued generations of Baskervilles across the moor as punishment for the cruelty of an ancestor. Now Sir Charles is dead, and the impossible appears to have left tracks in the mud.</p>
              <p>Arthur Conan Doyle's The Hound of the Baskervilles works because it allows two explanations to exist at the same time. One is rational: a person has committed a crime. The other belongs to folklore: an ancient beast has returned to claim another victim.</p>
              <p>The hound is eventually revealed to be a real animal -- a huge cross between a Bloodhound and a Mastiff, kept and controlled by a human murderer. The dog is genuinely terrifying. But is it evil? Look closer, and almost everything monstrous about it has been manufactured by a person.</p>
              <h2 className={styles.subhead}>The hound exists in language before it exists in flesh</h2>
              <p>One of the cleverest things about the novel is that the dog becomes frightening long before anyone properly sees it. By the time the animal actually appears, it is carrying the weight of an entire legend -- already presented as a family curse, an instrument of divine punishment, a creature from hell.</p>
              <p>People rarely encounter dogs without context arriving first. Breed reputation, previous stories and visual stereotypes often land before the individual animal does. The Baskerville hound is feared before anyone has seen it. When it finally appears, every witness is already primed to see a monster.</p>
              <p>Stapleton -- the novel's villain, secretly another Baskerville heir -- understands this perfectly. He does not simply release a dog onto the moor. He releases a story first.</p>
              <h2 className={styles.subhead}>Why a Bloodhound and a Mastiff?</h2>
              <p>The Bloodhound contributes the idea of relentless pursuit -- the sense that it can find you, wherever you go. The Mastiff contributes sheer physical mass. Put the two together and the story has a dog that can both hunt and destroy. This is effective storytelling. It is not, however, a fair breed portrait.</p>
              <div className={styles.breedPanel}>
                <p className={styles.breedPanelLabel}>The real breeds</p>
                <p>The Kennel Club describes the Bloodhound as affectionate, sensitive and not quarrelsome with people or other dogs. The Mastiff standard describes a calm dog, affectionate towards its owners. Neither description supports the idea of breeds naturally driven to hunt human beings across moorland.</p>
                <p>Physical capability is not the same as murderous intent. Conan Doyle selects the traits that serve his story and sets aside the ones that do not.</p>
              </div>
              <h2 className={styles.subhead}>The phosphorus</h2>
              <p>Here is the detail that gives the whole novel away. Stapleton does not rely on the dog's natural appearance. He paints the animal's head and body with phosphorus, so that it glows in the darkness of the moor. Think about what that tells you.</p>
              <p>A normal dog, however large, is apparently not frightening enough to sustain the Baskerville legend. Stapleton has to alter it -- to make it look unnatural, to transform the dog into theatre. The hound's supernatural quality is not inherent. It is applied.</p>
              <p>This is not so different from the way dogs are filmed. Low camera angles enlarge the body. Close-ups isolate teeth. Growling is intensified. The viewer is shown how to feel about the dog before they have had time to look at it. Stapleton is doing inside the story exactly what a director does outside it.</p>
              <h2 className={styles.subhead}>The dog does not write the plot</h2>
              <p>The central moral fact of the novel: the hound does not design the murder. Stapleton does. He identifies his target, obtains the dog, hides it on the moor, exploits the family legend and controls precisely when the animal is released. The dog supplies the teeth. The human supplies the motive, the plan and the staging.</p>
              <p>The hound has physical agency -- it runs, it attacks. Stapleton has moral agency -- he understands the consequences and intends them. Yet the dog is what ends up on the book cover.</p>
              <h2 className={styles.subhead}>The nameless dog</h2>
              <p>Unlike Gelert, the Baskerville hound has no name. It is called the hound, the fiend, the creature, the beast, the family curse. Never anything else. A name would imply an individual animal with a history. "The hound" turns it into a category.</p>
              <p>Strip away the legend, the phosphorus, the isolation and the deliberate staging, and you have an animal whose aggression has been cultivated and directed by a person, then released into a situation designed to make violence inevitable. The less individuality a dog possesses in fiction, the more easily it becomes a monster.</p>
              <h2 className={styles.subhead}>What the story is really asking</h2>
              <p>The Hound of the Baskervilles appears to ask whether a supernatural dog exists. Its deeper question is why people are so ready to believe in one.</p>
              <p>Fear does not need much help. Give people a legend, a death they cannot fully explain and a glimpse of something enormous and luminous in the fog -- and they will do the rest themselves.</p>
              <p>Stapleton does not create the fear. He finds it already there, in the family history, in local belief, in the dark reputation of the moor itself. He simply gives it a body. That body happens to be a dog. There is no ancient curse. There is only a person who recognised the usefulness of an animal, a legend and other people's readiness to believe.</p>
              <p className={styles.verdict}><strong>The verdict:</strong> Manufactured monster. The hound's danger was real. Its monstrosity was built by a human being who knew exactly what he was doing -- and who let the dog carry the blame.</p>
            </div>
          </article>

          <aside className={styles.sidebar}>
            {runningCosts[SLUG] && <div className={styles.sidebarCard}><RunningCostCard config={runningCosts[SLUG]} /></div>}
            {suitabilityScores[SLUG] && <div className={styles.sidebarCard}><SuitabilityRadar score={suitabilityScores[SLUG]} breedName="Bloodhound" /></div>}
            {trainingDifficulty[SLUG] && <div className={styles.sidebarCard}><TrainingCard data={trainingDifficulty[SLUG]} /></div>}
            {groomingNeeds[SLUG] && <div className={styles.sidebarCard}><GroomingCard data={groomingNeeds[SLUG]} /></div>}
            {exerciseNeeds[SLUG] && <div className={styles.sidebarCard}><ExerciseCard data={exerciseNeeds[SLUG]} /></div>}
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
