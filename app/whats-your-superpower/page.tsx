import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import SuperpowerGame from "./ui/SuperpowerGame";
import styles from "./page.module.css";

// Technical prototype (spec MVP-4.2, Phase 1). Deliberately not linked from
// the nav, the home page or any launcher: wiring into the global site layout
// is gated on a runbook checkpoint approved by Steve.
//
// The page hero has moved INSIDE the component. Slide 0 of the carousel is
// now the full-bleed opening screen with the Start button, so a second hero
// above it would have pushed the carousel off a phone screen.

export const metadata: Metadata = {
  title: "What's Your Superpower?",
  description:
    "Answer a collection of strange dog-themed questions and reveal your power mix.",
  robots: { index: false, follow: false },
};

export default function WhatsYourSuperpowerPage() {
  return (
    <>
      <Nav />
      <main className={styles.page}>
        <SuperpowerGame />
      </main>
      {/* THE FOOTER IS WHY THE PAGE WOULD JAR. Nav is fixed, and the carousel
          wrap is 100dvh, so a footer below it makes the DOCUMENT a second,
          vertical scroller. On a phone that drag collapses Safari's bars,
          100dvh changes by about 117px, and every slide resizes mid-scroll.
          Hidden rather than removed so it stays in the markup for crawlers,
          and so it returns with a desktop layout. Same reasoning and same
          fix as britains-dog-history-2. */}
      <div className={styles.footerOff}>
        <Footer />
      </div>
    </>
  );
}
