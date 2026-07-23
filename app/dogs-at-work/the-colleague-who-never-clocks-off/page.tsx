import type { Metadata } from "next";
import * as React from "react";
import Link from "next/link";
import Nav from "../../../components/Nav/Nav";
import Footer from "../../../components/Footer/Footer";
import styles from "../dogs-at-work.module.css";

export const metadata: Metadata = {
  title: "The Colleague Who Never Clocks Off | Dogs at Work | Pedigree Chums™",
  description:
    "A medical alert dog learns one person so completely it can warn them their own body is about to go wrong -- often before they know themselves. That's not a pet. That's a colleague, even if the wages are dinner and the occasional stolen sausage.",
  robots: "noindex",
};

const BODY: (string | { h: string })[] = [
  "Somewhere in Bedfordshire, a golden retriever-Labrador cross called Bramble is doing something no wearable, no app and no alarm clock can quite manage.",
  "He is watching a person for a living.",
  "Not guarding her. Not fetching for her. Watching. Reading. Sniffing the air around her like it is the morning paper.",
  "His job is Sarah. Just Sarah. Not people in general -- one specific human, whose body he knows better than most doctors ever could.",
  "And when Sarah's blood sugar starts to slide, Bramble knows. Often before Sarah does.",
  "The way she tells it, he has saved her life more times than she can count. And then the line that stays with you: she doesn't lie awake anymore wondering whether she will wake up.",
  "That last part is the whole article, really. A dog that lets a person sleep.",
  { h: "One dog. One person. One nose." },
  "Here is the clever bit, and it isn't what people assume.",
  "Bramble isn't sniffing the world for \"illness\" in general. He has learned one person's normal. Sarah's baseline. Her ordinary, everyday, slightly boring human smell.",
  "Because every person is a moving cloud of information. Breath, sweat, hormones, stress, sleep, food, medication -- all of it leaves tiny chemical traces. Scientists call them volatile organic compounds, which sounds like something a Bond villain releases into a volcano lair, but really just means the smells your body gives off without asking your permission.",
  "Humans are hopeless at reading them. Dogs are not.",
  "When Sarah's blood sugar drops, her chemistry shifts and the smell changes. Bramble notices, and refuses to be ignored -- a nudge, a paw, a stare that says sit down, test, now.",
  "Think of it as a smoke alarm for your own body. Except this one wants biscuits, sheds on the sofa, and occasionally sits on your foot.",
  { h: "But is it really work?" },
  "Here is where it gets interesting, and where we would like to pick a small, friendly fight.",
  "To Bramble, none of this is work.",
  "He isn't thinking, \"Ah yes, a medically significant drop in glucose.\" He is thinking, in dog: Sarah smells wrong, this is the part where I boop her. He would do it for free. He does do it for free. Nobody has ever successfully explained \"a job\" to a Labrador.",
  "That is the strange truth underneath every working dog: to the dog, it isn't work at all. It is just the thing they love, done at full volume.",
  "It only becomes a job the moment a human gets something out of it.",
  "And here, the human gets a lot. Sarah gets to sleep. She gets to go out. She gets to stop living braced for an emergency that Bramble will now spot first. That isn't sentiment -- it is independence. And independence has a value you can nearly put a number on: fewer ambulances, fewer hospital nights, a life that doesn't shrink to fit an illness.",
  "Bramble will never see a payslip. He is paid in dinner, walks, praise and the occasional stolen sausage. But make no mistake -- he is working.",
  { h: "Not magic. Just annoyingly good." },
  "There is a trap with stories like this. People either roll their eyes -- dogs can't smell illness, don't be daft -- or they sprint the other way and start treating dogs like tiny four-legged wizards.",
  "They are neither. They are trained animals with extraordinary noses, a deep habit of watching humans, and a talent for spotting patterns we miss. A dog living beside you notices the things you don't advertise: a change in your breathing, a new stillness, a smell you didn't know you had.",
  "We tend to only call something \"intelligent\" when it looks like our kind of intelligence -- maths, language, sitting still in a classroom pretending not to be bored. Dogs are clever in a different key. They read bodies. They read rooms. They read the chemical weather.",
  "A teenager might call it \"vibes\". A dog, if it could talk, would say: your cortisol has entered the chat.",
  "Same skill. Better nose.",
  { h: "What the dog is really telling us" },
  "Medical alert dogs aren't a miracle, and they don't replace the serious kit -- blood tests, continuous glucose monitors, actual doctors. Accuracy varies. Dogs have off days. Nobody should stake a life on a nose alone, and the good charities are the first to say so.",
  "But they point at something genuinely important. The body talks before the crisis. It leaves chemical clues, minutes or hours ahead, that we are simply too blunt-nosed to read. The dog reads them.",
  "And that is where Britain's whole medical-detection story begins -- not in a laboratory, but on a sofa, with a dog that wouldn't stop nudging. In 2009, a Labrador called Daisy kept pawing at her owner's chest until the owner got it checked. It was an early breast cancer, caught in time. That owner, Dr Claire Guest, went on to found the charity Medical Detection Dogs. The living-room alert dog and the laboratory science dog turn out to be two ends of the same nose.",
  "Somewhere tonight, a person with a dangerous condition is going to fall asleep without fear. Because a dog they never put on a payroll -- who doesn't know what diabetes is, who mostly wants dinner and a walk -- is lying by the bed doing the one job it was born to love.",
  "Listening. Or rather, smelling. Mostly smelling.",
];

const cardTitle: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: "24px", letterSpacing: "0.12em", color: "var(--yellow)", textTransform: "uppercase", margin: "0 0 6px" };
const cardBody: React.CSSProperties = { fontFamily: "var(--font-body)", fontSize: "0.92rem", fontWeight: 500, color: "#fff", lineHeight: 1.5, margin: 0 };

const PAYSLIP: [string, string][] = [
  ["Name", "Bramble"],
  ["Job title", "Blood-sugar bodyguard"],
  ["Department", "Medical alert"],
  ["Shift pattern", "24/7 — whenever the human smells suspicious"],
  ["Paid in", "Dinner, praise, walkies, head strokes"],
  ["Bonus scheme", "Emergency sausage clause"],
  ["Retirement", "Sofa, blanket, full honours"],
];

export default function AlertDogPage() {
  return (
    <>
      <Nav showLogo />
      <main className={styles.essayPage}>
        <div className={styles.essayHero}>
          <img src="/never-clocking-off.jpg" alt="A medical alert dog resting beside its owner" className={styles.essayHeroImg} />
          <div className={styles.essayHeroTint} />
          <div className={styles.essayHeroContent}>
            <Link href="/dogs-at-work" className={styles.backLink}>← Back to Dogs at Work</Link>
            <div className={styles.essayHeroMeta}>
              <span className={`${styles.tag} ${styles.tagGood}`}>Medical</span>
              <span className={styles.tagBreed}>Medical alert dogs</span>
            </div>
            <h1 className={styles.essayHeroTitle}>The Colleague Who Never Clocks Off</h1>
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
            {/* Editor's note (placeholder hero) */}
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 16px" }}>
                <p style={cardTitle}>Editor&apos;s note</p>
                <p style={{ ...cardBody, fontStyle: "italic" }}>&quot;Bramble&quot; and &quot;Sarah&quot; are illustrative while we finalise a real, currently-working alert dog to feature -- with the organisation&apos;s and owner&apos;s permission.</p>
              </div>
            </div>

            {/* The payslip */}
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 8px" }}>
                <p style={cardTitle}>The payslip</p>
              </div>
              <div style={{ padding: "0 20px 16px", display: "flex", flexDirection: "column", gap: 9 }}>
                {PAYSLIP.map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 8 }}>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--yellow)", flexShrink: 0 }}>{k}</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 600, color: "#fff", textAlign: "right" }}>{v}</span>
                  </div>
                ))}
                <p style={{ ...cardBody, fontSize: "0.78rem", color: "#aac4d4", marginTop: 2 }}>Signed, one very good boy.</p>
              </div>
            </div>

            {/* What the dog thinks */}
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 16px" }}>
                <p style={cardTitle}>What the dog thinks it&apos;s doing</p>
                <p style={{ ...cardBody, marginBottom: 8 }}><strong>What humans think:</strong> a medical alert dog is detecting the odour change linked to a dangerous drop in blood sugar and warning its owner in time to act.</p>
                <p style={cardBody}><strong>What Bramble thinks:</strong> Sarah smells wrong. Boop Sarah. Receive biscuit. Be brilliant.</p>
              </div>
            </div>

            {/* Conditions */}
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 12px" }}>
                <p style={cardTitle}>What they can be trained for</p>
                <p style={cardBody}>Medical alert assistance dogs are trained to detect the minute odour changes linked to conditions such as diabetes (blood sugar), PoTS, cardiac arrhythmias, Addison&apos;s disease and severe allergies &mdash; and can be trained to alert to seizure activity. Always alongside, never instead of, medical care.</p>
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
                <p style={{ ...cardBody, fontSize: "0.78rem", color: "#aac4d4" }}>Given free to the people who need them, funded almost entirely by public donations. Sources: Guide Dogs; Medical Detection Dogs.</p>
              </div>
            </div>

            {/* Read next */}
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 16px" }}>
                <p style={cardTitle}>Read next</p>
                <p style={{ ...cardBody, marginBottom: 10 }}>The other end of the same nose: the dogs helping scientists work out whether disease has a smell.</p>
                <Link href="/dogs-at-work/the-dogs-teaching-medicine-how-to-smell-disease" className={styles.readMore}>The lab dogs →</Link>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
