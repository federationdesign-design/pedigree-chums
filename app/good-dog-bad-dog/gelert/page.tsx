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
  title: "Gelert: The Dog Who Couldn't Explain Himself | Good Dog, Bad Dog",
  description: "A legend about what happens when a powerful dog cannot defend itself against the story told about it.",
  robots: "noindex",
};

const SLUG = "irish-wolfhound";

export default function GelertPage() {
  return (
    <>
      <Nav showLogo />
      <main className={styles.essayPage}>
        <div className={styles.essayHero}>
          <Link href="/good-dog-bad-dog" className={styles.backLink}>← Back to Good Dog, Bad Dog</Link>
          <img src="/gelert-painting.jpg" alt="Gelert" className={styles.essayHeroImg} />
          <div className={styles.essayHeroTint} />
        </div>

        <div className={styles.essayLayout}>
          {/* Main essay column */}
          <article className={styles.essay}>
            <div className={styles.essayMeta}>
              <span className={`${styles.tag} ${styles.tagMisjudged}`}>Misjudged dog</span>
              <span className={styles.tagBreed}>Irish Wolfhound</span>
            </div>
            <h1 className={styles.essayTitle}>Gelert: The Dog Who Couldn't Explain Himself</h1>
            <div className={styles.essayBody}>
              <h3 className={styles.subhead}>A prince, a wolf and a terrible mistake</h3>
              <p>Llywelyn the Great returns from the hunt to find his favourite hound bounding towards him, muzzle covered in blood.</p>
              <p>Inside, the cradle is empty. The room is wrecked. There is blood on the floor.</p>
              <p>He draws his sword.</p>
              <p>Only after Gelert is dead does Llywelyn hear his infant son crying from beneath a pile of bedding -- alive, unharmed, lying next to the body of a wolf. A wolf that Gelert had fought and killed while Llywelyn was out.</p>
              <p>The dog had stayed behind to protect the child. The blood was the wolf's. The chaos was a struggle, not an attack.</p>
              <p>The prince had murdered the most loyal animal he had ever owned.</p>
              <p>This is the legend of Gelert, set in the village of Beddgelert in North Wales -- whose name is commonly translated as "Gelert's grave." A stone memorial still stands there today, beside the River Glaslyn. The National Trust presents it carefully, as a site connected with a legend rather than a confirmed piece of medieval history.</p>
              <p>It survives because the mistake Llywelyn makes is one we all recognise.</p>
              <h3 className={styles.subhead}>Why he got it so wrong</h3>
              <p>Put yourself in Llywelyn's position for a moment. He walks in and sees a large, powerful dog covered in blood, an overturned cradle, a missing baby and a room that looks like a fight happened in it.</p>
              <p>Every single detail points in the same direction. Of course he drew the worst conclusion. The evidence felt overwhelming.</p>
              <p>Except none of it was actually evidence.</p>
              <p>Blood tells you that something was injured. It doesn't tell you who did the injuring. Disorder tells you that violence happened. It doesn't tell you who committed it. And Gelert -- bounding over enthusiastically, as dogs do when their owner comes home -- couldn't exactly raise a paw and say "hang on, let me explain."</p>
              <p>That's the real trap at the centre of this story. Gelert looked guilty. He couldn't prove he wasn't. He was at the mercy of someone else's interpretation.</p>
              <p>Llywelyn didn't investigate. He reacted.</p>
              <h3 className={styles.subhead}>The dog who couldn't defend himself</h3>
              <p>One of the things that makes dogs such powerful figures in stories is precisely this: they cannot explain themselves.</p>
              <p>A human character can argue their case. A dog cannot. Their actions have to be read by the people around them -- and those readings can be completely wrong.</p>
              <p>In the moment Gelert came bounding over, Llywelyn had two possible interpretations available. Gelert had attacked his son, or Gelert was pleased to see him, as he always was. The blood tipped the balance. Everything that would normally be read as loyalty and affection suddenly looked suspicious instead.</p>
              <p>Nothing about Gelert had actually changed. The story told about him had.</p>
              <h3 className={styles.subhead}>The irony hiding in plain sight</h3>
              <p>The qualities that made Gelert look terrifying -- his size, his strength, his ability to kill something -- are the exact same qualities that allowed him to save the child in the first place.</p>
              <p>A small lap dog couldn't have fought off a wolf. Gelert's power is what made him valuable. The moment that power is misread, it becomes the thing that gets him killed.</p>
              <div className={styles.breedPanel}>
                <p className={styles.breedPanelLabel}>The real Irish Wolfhound</p>
                <p>The Kennel Club describes the Irish Wolfhound as "gentle, kind and friendly" -- a phrase that sits oddly against the terrifying silhouette the breed can cut. One of the tallest dogs in the world, built to pursue and bring down large animals, yet consistently described as calm, gentle and affectionate.</p>
                <p>The capacity to be dangerous is not the same thing as being dangerous.</p>
              </div>
              <h3 className={styles.subhead}>What Gelert actually tells us</h3>
              <p>The mistake Llywelyn makes isn't an unusual one. It's the mistake of looking at incomplete evidence, feeling certain, and acting before the full picture is available. We do this with dogs all the time. A large dog that barks becomes "aggressive." A breed that appears in news coverage of attacks becomes "dangerous" regardless of what any individual dog has actually done.</p>
              <p>He was the same dog the whole time. Before the sword, he was Llywelyn's most trusted hound, responding to a genuine threat exactly as he had been bred to do. After the sword, those same facts were finally understood. Nothing about Gelert changed between those two moments except the human story told about him.</p>
              <p>A dog covered in blood, in a wrecked room, next to an empty cradle, is a frightening sight. It is also not, by itself, a verdict.</p>
              <p className={styles.verdict}><strong>The verdict:</strong> Misjudged. Gelert was condemned not for what he did, but for what his appearance led a person to assume. He was the same dog before and after the truth came to light. Only the human story changed.</p>
            </div>
          </article>

          {/* Sidebar */}
          <aside className={styles.sidebar}>
            {runningCosts[SLUG] && <div className={styles.sidebarCard}><RunningCostCard config={runningCosts[SLUG]} /></div>}
            {suitabilityScores[SLUG] && <div className={styles.sidebarCard}><SuitabilityRadar score={suitabilityScores[SLUG]} breedName="Irish Wolfhound" /></div>}
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
