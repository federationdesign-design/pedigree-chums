import Link from "next/link";
import type { Metadata } from "next";
import styles from "../preorder.module.css";
import Footer from "../../../components/Footer/Footer";

export const metadata: Metadata = {
  title: "Pre-order cancelled | Pedigree Chums",
  robots: { index: false, follow: false },
};

export default function PreorderCancelled() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.kicker}>Checkout cancelled</p>
        <h1 className={styles.title}>No worries, nothing was charged</h1>
        <p className={styles.lead}>
          Your pre-order was not completed and your card has not been charged.
        </p>
        <p className={styles.body}>
          Changed your mind about paying now? You can still get a discount code
          emailed to use on launch day instead.
        </p>
        <Link href="/#preorder" className={styles.btn}>
          Back to the offer
        </Link>
      </section>
    </main>
    <Footer />
  );
}
