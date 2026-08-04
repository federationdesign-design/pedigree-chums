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
        <SuperpowerGame />
      </main>
      <Footer />
    </>
  );
}
