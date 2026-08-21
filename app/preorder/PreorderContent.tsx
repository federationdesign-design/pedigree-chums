import PreorderCheckout from "./PreorderCheckout";
import FAQ from "../../components/FAQ/FAQ";
import CardRail from "../../components/CardRail/CardRail";
import styles from "./preorderContent.module.css";

/*
 * /preorder layout. Hero up top, Stripe checkout card overlapping the hero from
 * the right, then the FAQ ladder, then the chum card slider.
 *
 * Layout is a single in-flow grid on .wrap (see preorderContent.module.css): the
 * hero and slider span the full width; the FAQ (left, 538px) and the checkout
 * (right, 560px) share the middle row. The checkout is a real grid column lifted
 * with a negative margin so it still overlaps the hero from the right, rather than
 * being absolutely positioned. On mobile the columns stack, checkout above hero.
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

      {/* Checkout column: the Stripe card plus the intro copy. A real in-flow grid
          column (the 560px right track), lifted on desktop with a negative margin
          so it still overlaps the hero from the right; on mobile it stacks above
          the hero. No absolute positioning. */}
      <div className={styles.checkoutCol}>
        <PreorderCheckout />
        {/* Intro copy directly below the card, in the same column. */}
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

      {/* FAQ column: the left grid track (538px at 1280). A real in-flow column
          beside the checkout, not a phantom half of an empty two-track grid. The
          shared FAQ in single-column, bare mode (no built-in heading, no page
          padding), so the questions live in one place; the heading below stays
          local because it is smaller and left-aligned, not the big centred /home one. */}
      <section className={styles.faqCol}>
        <h2 className={styles.faqHeading}>
          Frequently Asked <span>Questions</span>
        </h2>
        <FAQ columns={1} bare />
      </section>

      {/* Chum card slider, reused from components/CardRail exactly as /about does. */}
      <div className={styles.sliderWrap}>
        <CardRail />
      </div>
    </main>
  );
}
