import Link from "next/link";
import Footer from "../../../components/Footer/Footer";
import type { Metadata } from "next";
import styles from "../preorder.module.css";

export const metadata: Metadata = {
  title: "Pre-order confirmed | Pedigree Chums",
  robots: { index: false, follow: false },
};

// Rendered dynamically so the dispatch note reflects the current env value
// without needing a rebuild.
export const dynamic = "force-dynamic";

const DEFAULT_DISPATCH_NOTE =
  "We will email you a dispatch confirmation as soon as your pack is on its way.";

export default function PreorderSuccess() {
  const dispatchNote = process.env.PREORDER_DISPATCH_NOTE || DEFAULT_DISPATCH_NOTE;

  return (
    <>
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.kicker}>Pre-order confirmed</p>
        <h1 className={styles.title}>
          You are one of the <span className={styles.accent}>chums</span>!
        </h1>
        <p className={styles.lead}>
          Thank you for pre-ordering Pedigree Chums: The Dog Bingo Game. Your
          payment has gone through and your pack is reserved.
        </p>
        <p className={styles.body}>
          A confirmation email is on its way to you now. {dispatchNote}
        </p>
        <p className={styles.body}>
          Free UK mainland delivery is included. As a pre-order placed online you
          can cancel within 14 days, just reply to your confirmation email.
        </p>
        <Link href="/" className={styles.btn}>
          Back to home
        </Link>
      </section>
    </main>
    <Footer />
    </>
  );
}
