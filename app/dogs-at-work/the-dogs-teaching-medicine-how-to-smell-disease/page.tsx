import type { Metadata } from "next";
import * as React from "react";
import Link from "next/link";
import Nav from "../../../components/Nav/Nav";
import Footer from "../../../components/Footer/Footer";
import styles from "../dogs-at-work.module.css";

export const metadata: Metadata = {
  title: "The Dogs Teaching Medicine How to Smell Disease | Dogs at Work | Pedigree Chums™",
  description:
    "In 2025, dogs called Bumper and Peanut detected Parkinson's disease by smell with up to 98% specificity. They are not replacing doctors -- they may be inventing the machines that will. How bio-detection dogs are teaching medicine what disease smells like.",
  robots: "noindex",
};

// Essay body kept as data so apostrophes/quotes stay plain text (no JSX escaping).
const BODY: (string | { h: string })[] = [
  "Somewhere in a laboratory, a golden retriever called Bumper and a black Labrador called Peanut are sniffing skin swabs. They do not know they are doing science. They think they are playing the best game in the world -- the one where you find the funny-smelling sample and a human loses their mind with joy and hands over a treat.",
  "In 2025, working completely blind -- a proper double-blind trial, so nobody in the room could accidentally tip them off -- Bumper and Peanut picked out the people with Parkinson's disease from a swab of skin. They correctly cleared the people who didn't have it up to 98% of the time.",
  "Ninety-eight per cent. From a smell. Of a disease we normally diagnose by watching how a person moves, often years after it has already taken hold.",
  "Neither dog has the faintest idea what Parkinson's is. That is the strange, brilliant heart of this whole story.",
  { h: "What the dog is actually smelling" },
  "Every human body is a slow-moving cloud of chemistry. Breath, sweat, skin, urine -- all of it carries tiny airborne compounds. Scientists call them volatile organic compounds, or VOCs, which sounds like a Bond villain's weapon but really just means the smells your body gives off without being asked.",
  "When something goes wrong inside -- a cancer growing, a disease quietly rewiring the body's chemistry -- that cloud can change. The recipe shifts. New compounds appear. A human nose sails straight past it. A dog's nose, tens of thousands of times more sensitive than ours, walks in and notices someone has moved the furniture.",
  "The dog isn't diagnosing anything. The dog is simply saying: this one smells different. And that, it turns out, can be the start of something very serious.",
  { h: "A game show for noses" },
  "The set-up looks almost like a game show. A carousel of sample pots. One target sample hidden among controls. A dog trots along, sniffing each one for a second or two, then stops dead at the one that matters and stares at it like it owes them money.",
  "To us, the samples are identical. To the dog, they are as different as a fish and a firework.",
  "If a dog can do that again and again -- reliably, blind, with fresh samples and different handlers -- it is powerful evidence that the disease has changed the body in a way we can genuinely detect. Not felt. Not guessed. Detected.",
  { h: "But no, your dog can't diagnose your cancer" },
  "Here is where we pump the brakes, because this field attracts nonsense from both directions -- people who dismiss it as daft, and people who decide dogs are tiny four-legged wizards.",
  "They are neither. And dogs are not sitting in NHS waiting rooms handing out cancer results by paw. This is research, not a service.",
  "The starting gun was fired back in 2004, when six dogs trained by the charity that became Medical Detection Dogs picked bladder-cancer urine samples far more often than chance would allow -- a result published in the British Medical Journal. It was proof that the smell is real. It was never proof that dogs should replace the lab.",
  "Twenty years on, the science has grown up. Medical Detection Dogs now runs NHS-approved trials -- prostate cancer with Milton Keynes University Hospital, bowel cancer with hospitals in Hull. The Parkinson's work with Bumper and Peanut ran alongside the Universities of Bristol and Manchester. Serious institutions. Serious method. And still, crucially, not a diagnosis you can book.",
  "Which is honestly for the best. Imagine the letter. \"Dear Mr Smith, your results have been reviewed by Dr Biscuit. He sat down next to sample three. Please contact reception.\"",
  { h: "The dog doesn't become the machine. The dog invents it." },
  "So if dogs aren't the final answer, why do any of this?",
  "Because the dog may be the creature that tells us what the machine should look for.",
  "A dog proves a scent exists. Scientists then work out the chemistry behind it -- which compounds, in what combination. Once they know the recipe, engineers can try to build a sensor that finds it cheaply, instantly and at scale: an \"electronic nose\" that might one day sit in a GP surgery and catch disease years earlier than we manage today.",
  "In other words, the Labrador at the sample carousel is never going to be the diagnostic tool. The Labrador is helping design it. Progress doesn't always begin with a laser or an algorithm. Sometimes it begins with a dog lowering its head, sniffing, and stopping.",
  { h: "And this, of course, is a job" },
  "To Bumper and Peanut, none of this is work. It is a scent game with a snack at the end, and they would do it for nothing. They have no idea they are standing at the edge of modern medicine. They are thinking, at most: find the weird one, get the toy, everyone acts like I have saved civilisation.",
  "But we get something enormous out of it. A shortcut into diseases that hide for years. A route towards earlier diagnosis. A future the dog will never read about.",
  "That is the deal running quietly under every working dog: the dog brings the instinct and the joy, and we turn it into value. The least we owe back is to remember that the nose doing the science is attached to an animal that mostly wants a ball, a walk, and to be told it is a good boy.",
  "It is. It really is.",
  "Somewhere, a machine that can smell disease is being invented. And somewhere in that machine's family tree there will be a golden retriever and a black Labrador who once sniffed a row of pots, found the strange one, and looked up for their biscuit -- with absolutely no idea they had just shown medicine where to look.",
];

const cardTitle: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: "24px", letterSpacing: "0.12em", color: "var(--yellow)", textTransform: "uppercase", margin: "0 0 6px" };
const cardBody: React.CSSProperties = { fontFamily: "var(--font-body)", fontSize: "0.92rem", fontWeight: 500, color: "#fff", lineHeight: 1.5, margin: 0 };
const statLabel: React.CSSProperties = { fontFamily: "var(--font-body)", fontSize: "0.66rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--yellow)", marginBottom: 4 };
const statValue: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: "2rem", color: "#fff", lineHeight: 1 };

export default function BioDetectionPage() {
  return (
    <>
      <Nav showLogo />
      <main className={styles.essayPage}>
        <div className={styles.essayHero}>
          <img src="/Bumper-and-peatnut.jpg" alt="Bumper and Peanut, the Parkinson's bio-detection dogs" className={styles.essayHeroImg} />
          <div className={styles.essayHeroTint} />
          <div className={styles.essayHeroContent}>
            <Link href="/dogs-at-work" className={styles.backLink}>← Back to Dogs at Work</Link>
            <div className={styles.essayHeroMeta}>
              <span className={`${styles.tag} ${styles.tagGood}`}>Medical</span>
              <span className={styles.tagBreed}>Bio-detection dogs</span>
            </div>
            <h1 className={styles.essayHeroTitle}>The Dogs Teaching Medicine How to Smell Disease</h1>
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
              <div style={{ padding: "16px 20px 12px" }}>
                <p style={cardTitle}>The honest version</p>
                <p style={cardBody}>Dogs have shown in published studies that they can detect disease odours -- including bladder cancer and Parkinson&apos;s -- but they are <strong>not</strong> a routine NHS diagnostic service. Think &quot;research&quot; and &quot;scent signatures&quot;, not &quot;your dog can diagnose your cancer&quot;. Their bigger role may be helping humans discover what disease smells like, so future machines can detect it.</p>
              </div>
            </div>

            {/* The 2025 study */}
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 6px" }}>
                <p style={cardTitle}>The 2025 study</p>
                <p style={{ ...cardBody, fontWeight: 600 }}>Dogs detect Parkinson&apos;s by smell</p>
              </div>
              <div style={{ padding: "10px 20px 4px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { label: "Specificity", value: "98%" },
                  { label: "Sensitivity", value: "80%" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <p style={statLabel}>up to</p>
                    <p style={statValue}>{value}</p>
                    <p style={{ ...statLabel, color: "#aac4d4", marginTop: 4 }}>{label}</p>
                  </div>
                ))}
              </div>
              <div style={{ padding: "12px 20px 16px" }}>
                <p style={cardBody}><strong>Dogs:</strong> Bumper (Golden Retriever) &amp; Peanut (Black Labrador). <strong>Method:</strong> double-blind, skin swabs. <strong>Partners:</strong> Medical Detection Dogs, University of Bristol &amp; University of Manchester (published 15 July 2025).</p>
              </div>
            </div>

            {/* How a scent line-up works */}
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 12px" }}>
                <p style={cardTitle}>How a scent line-up works</p>
                <p style={cardBody}>A carousel of sample pots. One target hidden among controls. The dog sniffs each for a second or two and freezes at the one that smells different. Do it blind, repeatedly, with fresh samples -- and a &quot;that one&quot; becomes data.</p>
              </div>
            </div>

            {/* Cost to train */}
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 8px" }}>
                <p style={cardTitle}>What it costs to train a dog</p>
              </div>
              <div style={{ padding: "0 20px 8px", display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { role: "Guide dog", detail: "birth to retirement", value: "£55,000+" },
                  { role: "Medical alert assistance dog", detail: "to fully train", value: "£29,000" },
                  { role: "Ongoing support", detail: "per year, per dog", value: "£1,000" },
                ].map(({ role, detail, value }) => (
                  <div key={role} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 10 }}>
                    <div>
                      <p style={{ ...cardBody, fontWeight: 700 }}>{role}</p>
                      <p style={{ ...cardBody, fontSize: "0.72rem", color: "#aac4d4" }}>{detail}</p>
                    </div>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--yellow)", whiteSpace: "nowrap", lineHeight: 1 }}>{value}</p>
                  </div>
                ))}
              </div>
              <div style={{ padding: "4px 20px 16px" }}>
                <p style={{ ...cardBody, fontSize: "0.78rem", color: "#aac4d4" }}>These dogs are given free to the people who need them, funded almost entirely by public donations. Sources: Guide Dogs; Medical Detection Dogs.</p>
              </div>
            </div>

            {/* What the dog thinks */}
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 12px" }}>
                <p style={cardTitle}>What the dog thinks it&apos;s doing</p>
                <p style={{ ...cardBody, marginBottom: 8 }}><strong>What humans think:</strong> a trained detection dog is screening samples for disease biomarkers.</p>
                <p style={cardBody}><strong>What the dog thinks:</strong> sniff pots, sit near the weird one, receive biscuit, be brilliant.</p>
              </div>
            </div>

            {/* Sources */}
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 16px" }}>
                <p style={cardTitle}>Sources</p>
                <p style={{ ...cardBody, fontSize: "0.82rem" }}>
                  Parkinson&apos;s study &mdash; University of Bristol (2025).<br />
                  Cancer detection &amp; NHS trials &mdash; Medical Detection Dogs.<br />
                  Bladder-cancer proof of principle &mdash; <em>BMJ</em>, September 2004.
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
