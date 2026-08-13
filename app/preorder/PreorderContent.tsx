import PreorderCheckout from "./PreorderCheckout";
import FaqLadder from "./FaqLadder";
import CardRail from "../../components/CardRail/CardRail";
import styles from "./preorderContent.module.css";

/*
 * /preorder layout. Hero up top, Stripe checkout card overlapping the hero from
 * the right, then the FAQ ladder, then the chum card slider.
 *
 * The checkout stage is positioned absolutely with a fixed top of 440px (set in
 * preorderContent.module.css): its top edge sits 440px down the page, overlapping
 * the hero. It is out of flow, so it does not push the sections below. The FAQ
 * block is anchored 50px below the hero's bottom, independent of the checkout.
 */
export default function PreorderContent() {
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
          {/* Intro copy sits directly below the card, inside the same
              (absolutely-positioned) column, so it tracks the card's bottom edge
              and is independent of the in-flow FAQ column. */}
          <div className={styles.intro}>
            <h2 className={styles.introTitle}>
              Pedigree <span>Chums</span>
            </h2>
            <p className={styles.introDesc}>
              The on-the-go <span className={styles.hi}>dog spotting game</span> for
              curious minds and dog lovers.{" "}
              <span className={`${styles.white} ${styles.underline}`}>54 illustrated
              breed cards</span> packed with traits, stats, and tell-tale features.{" "}
              <span className={styles.hi}>Spot a dog. </span>
              <span className={styles.white}>Make a friend, </span>
              <span className={`${styles.yellow} ${styles.underline}`}>you have a new
              chum.</span>
            </p>
            <div className={styles.meta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Players</span>
                <span className={styles.metaValue}>2+</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Age</span>
                <span className={styles.metaValue}>7+</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Where</span>
                <span className={styles.metaValue}>Anywhere</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* One column: the FAQ ladder only. The grid is left as two tracks so the
          FAQ keeps its existing left-hand width rather than filling the space. */}
      <section className={styles.twoCol}>
        <div>
          <h2 className={styles.faqHeading}>
            Frequently Asked <span>Questions</span>
          </h2>
          <FaqLadder />
        </div>
      </section>

      {/* Chum card slider, reused from components/CardRail exactly as /about does. */}
      <CardRail />
    </main>
  );
}
