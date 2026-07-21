import type { Metadata } from "next";
import * as React from "react";
import Link from "next/link";
import Nav from "../../../components/Nav/Nav";
import Footer from "../../../components/Footer/Footer";
import styles from "../dogs-at-work.module.css";

export const metadata: Metadata = {
  title: "The Electronic Nose: The Machine That May Owe Dogs a Biscuit | Dogs at Work | Pedigree Chums™",
  description:
    "In 2025, a dog-built \"electronic nose\" began a UK trial sniffing urine for prostate cancer. The machine was shaped from Medical Detection Dogs' own data. The dog wrote the manual for its own replacement -- and doesn't care, because there's a ball by the back door.",
  robots: "noindex",
};

const BODY: (string | { h: string })[] = [
  "Somewhere in Milton Keynes, a machine is learning to do a dog's job. It has no nose, no tail and no interest whatsoever in biscuits. It is an electronic nose -- an \"e-nose\" -- and in November 2025 it began a UK trial, sniffing more than 500 urine samples for prostate cancer.",
  "Here is the twist that makes this a Dogs at Work story and not just a tech story: the machine was built from the dogs.",
  "Not inspired by them in a fuzzy, greetings-card way. Built from them. From their data, their choices, and the exact way they were rewarded for finding the funny-smelling sample.",
  { h: "How the dog became a blueprint" },
  "For nearly a decade, a quantum physicist called Dr Andreas Mershin worked with the charity Medical Detection Dogs -- the same charity whose dogs you met in the last two essays. He watched the dogs pick cancer out of a line-up. Then he asked the question an engineer always asks: could we bottle that?",
  "To build the e-nose, his team didn't just copy a dog's anatomy. They took the dogs' actual detection data and used it to shape the device -- and they even taught the machine the way you teach a dog, with reward-based machine learning. A digital version of \"yes! good boy! biscuit!\"",
  "The dog, in other words, wrote the instruction manual for its own replacement. And has absolutely no idea it did.",
  { h: "Why bother, when the dogs already work?" },
  "Fair question. The dogs are brilliant. In earlier prostate screening, Medical Detection Dogs' dogs hit around 74% specificity and 71% sensitivity -- and, crucially, they could spot cancer in men whose PSA blood test was misleading, which is exactly where current testing struggles.",
  "So why build a machine at all?",
  "Because there are not enough dogs, and there never could be. A dog takes months to train, needs rest, has good days and off days, and cannot be posted to ten thousand hospitals at once. As Claire Guest, who founded Medical Detection Dogs, puts it: the goal was always to inform scalable technology, not to have a dog in every hospital.",
  "That single sentence is the whole point of this piece. The dog was never meant to be the finished product. The dog was the proof -- the living evidence that the smell is real -- so that something tireless and copyable could be built to do it everywhere.",
  { h: "The machine that breathes you in" },
  "The urine-sniffing e-nose in Milton Keynes isn't the only machine chasing the dog's talent. Up the road in Cambridge, a company called Owlstone Medical has spent years on something it calls \"Breath Biopsy\" -- capturing the volatile compounds in a person's breath and reading them for the chemical fingerprints of disease. Its breathalyser-style tests have run in UK trials for cancers including lung cancer, with NHS hospitals involved.",
  "Different sample, same dream: catch disease from its smell -- early, cheaply, without cutting anyone open.",
  "And all of it traces back to the same unlikely starting point. Not a laboratory. A dog, lowering its head over a sample, and stopping.",
  { h: "So is the dog out of a job?" },
  "Here is where our little argument comes back.",
  "If a machine can do the dog's job -- tirelessly, everywhere, at scale -- have we just made the working dog redundant? Put it out to pasture? Handed its P45 to a box of sensors?",
  "The answer is the loveliest part of the whole story: the dog does not care. Not even slightly.",
  "Because to the dog, it was never a job. It was a game with a treat at the end. The e-nose can copy the dog's accuracy, its training, even its data. What it cannot copy is the part where a Labrador finds the cancer sample, looks up, and is so pleased with itself it can barely sit still. The machine detects. The dog delights. Those are not the same thing.",
  "We took an animal's joy and turned it into a blueprint for saving lives at scale. That is either the most heart-warming or the most quietly outrageous thing in this whole series. It might be both.",
  { h: "What we owe the blueprint" },
  "Every breath test, every e-nose, every future gadget that beeps and says \"get that checked\" will owe part of its existence to dogs who were paid in biscuits and never saw a penny of the patent.",
  "They will not mind. They would do it all again tomorrow, for a ball.",
  "But we might, just occasionally, remember it. When a machine in a hospital corridor quietly saves a life, somewhere in its family tree is a wet nose, a wagging tail, and a very good dog who found the strange-smelling one first -- and thought the whole thing was the best afternoon of its life.",
  "The dog taught the machine to smell. The machine will reach a thousand hospitals the dog never could. And the dog, gloriously, will never know and never care -- because there's a ball by the back door, and the day is young.",
];

const cardTitle: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: "24px", letterSpacing: "0.12em", color: "var(--yellow)", textTransform: "uppercase", margin: "0 0 6px" };
const cardBody: React.CSSProperties = { fontFamily: "var(--font-body)", fontSize: "0.92rem", fontWeight: 500, color: "#fff", lineHeight: 1.5, margin: 0 };
const statLabel: React.CSSProperties = { fontFamily: "var(--font-body)", fontSize: "0.66rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--yellow)", marginBottom: 4 };
const statValue: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: "2rem", color: "#fff", lineHeight: 1 };

export default function ElectronicNosePage() {
  return (
    <>
      <Nav showLogo />
      <main className={styles.essayPage}>
        <div className={styles.essayHero}>
          <div className={styles.essayHeroImgFallback} />
          <div className={styles.essayHeroTint} />
          <div className={styles.essayHeroContent}>
            <Link href="/dogs-at-work" className={styles.backLink}>← Back to Dogs at Work</Link>
            <div className={styles.essayHeroMeta}>
              <span className={`${styles.tag} ${styles.tagGood}`}>Medical</span>
              <span className={styles.tagBreed}>The machine the dogs built</span>
            </div>
            <h1 className={styles.essayHeroTitle}>The Electronic Nose: The Machine That May Owe Dogs a Biscuit</h1>
          </div>
        </div>

        <div className={styles.essayLayout}>
          <article className={styles.essay}>
            <div className={styles.essayBody}>
              {BODY.map((b, i) =>
                typeof b === "string"
                  ? <p key={i}>{b}</p>
                  : <h2 key={i} className={styles.subhead}>{b.h}</h2>
              )}
            </div>
          </article>

          <aside className={styles.sidebar}>
            {/* The honest version */}
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 16px" }}>
                <p style={cardTitle}>The honest version</p>
                <p style={cardBody}>Electronic noses are emerging technology in <strong>trials and research</strong>, not a test you can book at the GP yet. They are being built to scale up what dogs proved is possible -- reading disease from its scent -- so think &quot;promising and coming&quot;, not &quot;finished and available&quot;.</p>
              </div>
            </div>

            {/* The dog-built machine */}
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 6px" }}>
                <p style={cardTitle}>The dog-built machine</p>
                <p style={{ ...cardBody, fontWeight: 600 }}>UK e-nose prostate-cancer trial</p>
              </div>
              <div style={{ padding: "10px 20px 4px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { label: "Urine samples", value: "500+" },
                  { label: "Began", value: "Nov 2025" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <p style={statValue}>{value}</p>
                    <p style={{ ...statLabel, color: "#aac4d4", marginTop: 4 }}>{label}</p>
                  </div>
                ))}
              </div>
              <div style={{ padding: "12px 20px 16px" }}>
                <p style={cardBody}>Built by quantum physicist <strong>Dr Andreas Mershin</strong> from <strong>Medical Detection Dogs&apos;</strong> own detection data, with the University of Texas at El Paso. Running at <strong>Milton Keynes University Hospital</strong> -- the same hospital as the dogs&apos; prostate trial.</p>
              </div>
            </div>

            {/* The dogs' scorecard */}
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 6px" }}>
                <p style={cardTitle}>The dogs&apos; scorecard</p>
                <p style={{ ...cardBody, fontWeight: 600 }}>Prostate screening, by nose</p>
              </div>
              <div style={{ padding: "10px 20px 4px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { label: "Specificity", value: "74%" },
                  { label: "Sensitivity", value: "71%" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <p style={statValue}>{value}</p>
                    <p style={{ ...statLabel, color: "#aac4d4", marginTop: 4 }}>{label}</p>
                  </div>
                ))}
              </div>
              <div style={{ padding: "12px 20px 16px" }}>
                <p style={cardBody}>The dogs could also flag cancer in men whose PSA blood test was misleading -- exactly where standard testing struggles.</p>
              </div>
            </div>

            {/* How an e-nose works */}
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 16px" }}>
                <p style={cardTitle}>How an electronic nose works</p>
                <p style={cardBody}>An array of chemical sensors reads the volatile compounds in a sample, and machine learning looks for the pattern linked to disease -- trained, reward-style, much like a dog. No wet nose required, but the same job: spot the smell that shouldn&apos;t be there.</p>
              </div>
            </div>

            {/* Other machines that smell */}
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 16px" }}>
                <p style={cardTitle}>Other machines that smell</p>
                <p style={cardBody}><strong>Owlstone Medical</strong> (Cambridge) built &quot;Breath Biopsy&quot; -- capturing the volatile compounds in your breath to read for disease. Its breathalyser-style tests have run in UK trials for cancers including lung cancer, with NHS hospitals involved.</p>
              </div>
            </div>

            {/* What the dog thinks */}
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 16px" }}>
                <p style={cardTitle}>What the dog thinks happened</p>
                <p style={{ ...cardBody, marginBottom: 8 }}><strong>What humans think:</strong> a machine is running dog-derived scent data to detect cancer at scale.</p>
                <p style={cardBody}><strong>What the dog thinks:</strong> I found the weird pot. I got a biscuit. Apparently I am now in a science magazine.</p>
              </div>
            </div>

            {/* Read the trilogy */}
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 16px" }}>
                <p style={cardTitle}>The medical trilogy</p>
                <p style={{ ...cardBody, marginBottom: 10 }}>Start at the beginning: the dogs that proved disease has a smell, and the dogs that warn one person before their own body does.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Link href="/dogs-at-work/the-dogs-teaching-medicine-how-to-smell-disease" className={styles.readMore}>1 · The lab dogs →</Link>
                  <Link href="/dogs-at-work/the-colleague-who-never-clocks-off" className={styles.readMore}>2 · The alert dogs →</Link>
                </div>
              </div>
            </div>

            {/* Sources */}
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 16px" }}>
                <p style={cardTitle}>Sources</p>
                <p style={{ ...cardBody, fontSize: "0.82rem" }}>
                  Dog-inspired e-nose prostate trial (Nov 2025) &mdash; Medical Detection Dogs; Dr Andreas Mershin; Milton Keynes University Hospital.<br />
                  Breath Biopsy &mdash; Owlstone Medical, Cambridge.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
