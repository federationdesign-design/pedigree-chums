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
  title: "Lassie: The Burden of Being the Perfect Dog | Good Dog, Bad Dog",
  description: "Lassie's intelligence and sensitivity are genuinely Collie-like. But what happens when a real trait gets elevated into something close to a superpower?",
  robots: "noindex",
};

const SLUG = "rough-collie";

export default function LassiePage() {
  return (
    <>
      <Nav showLogo />
      <main className={styles.essayPage}>
        <div className={styles.essayHero}>
          <img src="/lassie-img.jpg" alt="Lassie" className={styles.essayHeroImg} />
          <div className={styles.essayHeroTint} />
          <div className={styles.essayHeroContent}>
            <Link href="/good-dog-bad-dog" className={styles.backLink}>← Back to Good Dog, Bad Dog</Link>
            <div className={styles.essayHeroMeta}>
              <span className={`${styles.tag} ${styles.tagGood}`}>Good dog</span>
              <span className={styles.tagBreed}>Rough Collie</span>
            </div>
            <h1 className={styles.essayHeroTitle}>Lassie: The Burden of Being the Perfect Dog</h1>
          </div>
        </div>

        <div className={styles.essayLayout}>
          <article className={styles.essay}>
            <div className={styles.essayBody}>
              <h2 className={styles.subhead}>The dog who is always right</h2>
              <p>Lassie never makes a mistake.</p>
              <p>She knows when someone is in danger. She finds help when adults cannot. She travels hundreds of miles through unfamiliar country, crosses rivers, survives injury and keeps moving. She is intelligent, loyal, brave and -- most importantly -- she always does the right thing.</p>
              <p>She is not a dog. She is a heroic design. And that is where the real breed pays the price.</p>
              <h2 className={styles.subhead}>Where Lassie came from</h2>
              <p>Eric Knight introduced Lassie in a magazine story in 1938, then expanded the character into the novel Lassie Come-Home in 1940. Set in Yorkshire, a boy named Joe Carraclough has grown up with a Rough Collie he loves. When Joe's family falls on hard times, they are forced to sell Lassie to the Duke of Rudling, who takes her to Scotland.</p>
              <p>Lassie keeps escaping. From there, she begins the journey home -- crossing unfamiliar country, facing hunger, injury and the full difficulty of moving through a landscape built for humans, not dogs. The 1943 film brought the character to a global audience. Over time, "Lassie" stopped meaning one fictional dog and started meaning a type -- the Collie who understands, rescues and returns.</p>
              <h2 className={styles.subhead}>What is genuinely Collie-like</h2>
              <p>Rough Collies were developed as working dogs expected to cooperate with people, respond to movement and manage livestock at a distance from their handler. They can become highly attuned to routine and read body language with extraordinary sensitivity.</p>
              <p>The Kennel Club describes the Rough Collie as friendly, active and suited to companionship. That is precisely what makes the exaggeration so effective. Lassie looks like a real Collie with the volume turned up. She is believable because she starts from something true.</p>
              <h2 className={styles.subhead}>Intelligence is not the same as wisdom</h2>
              <p>Dogs are genuinely intelligent. When a dog looks at you, moves towards the door and then looks back, the interpretation -- "come with me, something is wrong" -- may be broadly right. But the dog has not constructed a sentence or weighed the options.</p>
              <p>Lassie stories quietly suggest that a truly intelligent dog should just know -- that understanding ought to emerge naturally from the bond, without training, without instruction, without much human effort at all. That expectation does not survive contact with actual dogs.</p>
              <h2 className={styles.subhead}>The intelligence without the inconvenience</h2>
              <p>Real intelligence in a dog is not always convenient. A clever dog can learn unwanted routines as quickly as wanted ones. It can become difficult when insufficiently occupied, reactive, anxious in environments that feel unpredictable. The same sensitivity that makes a Collie responsive to a child in distress can make the same dog overwhelmed by a chaotic household.</p>
              <p>Lassie rarely encounters any of this. She contains the desirable side of every Collie trait, with the difficult side quietly removed. That is not a breed profile. It is a wish list.</p>
              <h2 className={styles.subhead}>Positive stereotypes are still stereotypes</h2>
              <p>Positive stereotypes appear kinder than negative ones. But the Lassie image creates its own problems. Someone drawn to the breed because it seems wise and effortlessly good with children may be less prepared for what a real Collie actually needs -- the exercise, mental stimulation, careful socialisation and consistent training that any intelligent working breed requires.</p>
              <p>When the real dog turns out to be reactive or anxious, it tends to get the blame. It has failed to live up to the image. The fact that the image was always impossible does not help the dog.</p>
              <div className={styles.breedPanel}>
                <p className={styles.breedPanelLabel}>The real Rough Collie</p>
                <p>The Kennel Club describes the Rough Collie as friendly and active, bred for close cooperation with people. They are highly trainable and responsive -- but that same sensitivity means they need consistent mental stimulation, structured exercise and careful socialisation. A bored or under-stimulated Collie can become anxious, reactive or difficult. None of that appears in Lassie's world.</p>
              </div>
              <h2 className={styles.subhead}>What Lassie tells us</h2>
              <p>The Hound of the Baskervilles reflects the fear that dogs can become monsters. Gelert reflects the fear that we might condemn an innocent animal. Lassie reflects something different -- the desire that dogs might be better than we are.</p>
              <p>The character works because genuine Collie qualities are real. The story takes those qualities and elevates them until the dog seems incapable of error. That is the gap between the story and the breed. And it is why the good dog can be as misleading as the bad one.</p>
              <p>She is a believable Collie made unbelievable through perfection.</p>
              <p className={styles.verdict}><strong>The verdict:</strong> Positive stereotype. Lassie is rooted in genuine Collie qualities -- then elevated into an ideal no individual dog can meet. The danger is not that she made the breed look bad. It is that she made it look impossibly good.</p>
            </div>
          </article>

          <aside className={styles.sidebar}>
            {runningCosts[SLUG] && <div className={styles.sidebarCard}><RunningCostCard config={runningCosts[SLUG]} /></div>}
            {suitabilityScores[SLUG] && <div className={styles.sidebarCard}><SuitabilityRadar score={suitabilityScores[SLUG]} breedName="Rough Collie" /></div>}
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
