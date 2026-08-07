import type { Metadata } from "next";
import Footer from "../../components/Footer/Footer";
import PreorderCheckout from "./PreorderCheckout";
import styles from "./preorderCheckout.module.css";

export const metadata: Metadata = {
  title: "Pre-order | Pedigree Chums™",
  description:
    "Pre-order Pedigree Chums™: The Dog Bingo Game at the pre-release price.",
};

// The buy-now path. Payment happens in Stripe's embedded checkout below (no
// redirect); the email-capture path lives separately at /discount-code so the
// two never compete for attention on one page.
export default function PreorderPage() {
  return (
    <>
      <main className={styles.page}>
        <section className={styles.intro}>
          <p className={styles.kicker}>Pre-order</p>
          <h1 className={styles.title}>
            Secure your <span className={styles.accent}>pack</span>
          </h1>
          <p className={styles.lead}>
            Pay the pre-release price of £6.99. Free UK mainland delivery is
            included, and your card details stay with Stripe throughout.
          </p>
        </section>
        <PreorderCheckout />
      </main>
      <Footer />
    </>
  );
}
