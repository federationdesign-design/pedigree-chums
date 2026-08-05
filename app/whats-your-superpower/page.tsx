import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import SuperpowerGame from "./ui/SuperpowerGame";
import styles from "./page.module.css";

// Technical prototype (spec MVP-4.1, Phase 1). Deliberately not linked from
// the nav, the home page or any launcher: wiring into the global site layout
// is gated on a runbook checkpoint approved by Steve.

export const metadata: Metadata = {
  title: "What's Your Superpower? | Pedigree Chums™",
  description:
    "Answer a collection of strange dog-themed questions and reveal your power mix.",
  robots: { index: false, follow: false },
};

export default function WhatsYourSuperpowerPage() {
  return (
    <>
      <Nav />
      <main className={styles.page}>
        <section className={styles.hero} aria-label="What's Your Superpower?">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/superhero-power.jpg" alt="" className={styles.heroImg} />
          <div className={styles.heroTint} aria-hidden="true" />
          <h1 className={`display ${styles.heroTitle}`}>What&apos;s Your <span className="display-yellow">Superpower?</span></h1>
        </section>
        <SuperpowerGame />
      </main>
      <Footer />
    </>
  );
}
