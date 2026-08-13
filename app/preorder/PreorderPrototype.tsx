import PreorderCheckout from "./PreorderCheckout";
import ProtoFaqLadder from "./ProtoFaqLadder";
import CardRail from "../../components/CardRail/CardRail";
import styles from "./proto.module.css";

/*
 * /preorder layout. Hero up top, Stripe checkout card overlapping the hero from
 * the right, then the FAQ ladder, then the chum card slider.
 *
 * The checkout stage is positioned absolutely with a fixed top of 440px (set in
 * proto.module.css): its top edge sits 440px down the page, overlapping the
 * hero. It is out of flow, so it does not push the sections below. The FAQ block
 * is anchored 50px below the hero's bottom, independent of the checkout height.
 */
export default function PreorderPrototype() {
  return (
    <main className={styles.wrap}>
      <section className={styles.hero}>
        <div className={styles.heroImg} aria-hidden="true" />
        <div className={styles.heroTint} aria-hidden="true" />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Secure your <span>pack</span>
          </h1>
          <p className={styles.heroSub}>
            Pay the pre-release price of £6.99. Free UK mainland delivery is
            included, and your card details stay with Stripe throughout.
          </p>
        </div>
      </section>

      <div className={styles.stage}>
        <div className={styles.col}>
          <PreorderCheckout />
        </div>
      </div>

      {/* One column: the FAQ ladder only. The grid is left as two tracks so the
          FAQ keeps its existing left-hand width rather than filling the space. */}
      <section className={styles.twoCol}>
        <div>
          <h2 className={styles.faqHeading}>
            Frequently Asked <span>Questions</span>
          </h2>
          <ProtoFaqLadder />
        </div>
      </section>

      {/* Chum card slider, reused from components/CardRail exactly as /about does. */}
      <CardRail />
    </main>
  );
}
