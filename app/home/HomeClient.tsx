"use client";
import VideoGrid from "../../components/VideoGrid/VideoGrid";
import AnubisFeature from "../../components/AnubisFeature/AnubisFeature";
/* The search moved out to components/ChumSearch so Know Your Chums can use the
   same one (owner instruction, 5 August). The markup and behaviour are
   unchanged: they were moved whole, not rewritten. */
import ChumSearch from "../../components/ChumSearch/ChumSearch";
import styles from "./home.module.css";

export default function HomeClient() {
  return (
    <>
      {/* Hero image */}
      <section className={styles.hero}>
        <div className={styles.heroImg} aria-hidden="true" />
        <div className={styles.heroTint} aria-hidden="true" />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Pedigree <span>Chums</span></h1>
          <p className={styles.heroSub}>The on-the-go dog spotting game.<br />54 breeds to discover.</p>
        </div>
      </section>

      {/* 3 x 2 grid of breed videos, with the Anubis feature below it on desktop
          and above it on mobile. */}
      <div className={styles.videoBlock}>
        <VideoGrid />
        <AnubisFeature />
      </div>

      {/* Search hero */}
      <section className={styles.searchHero}>
        <p className={styles.searchEyebrow}>54 breeds to discover</p>
        <h1 className={styles.searchTitle}>
          Explore Britain&apos;s most <span>popular breeds</span>
        </h1>
        <p className={styles.searchSub}>
          Type a breed to explore its family tree, history, and personality
        </p>
        <ChumSearch />
      </section>


      {/* Product section */}
      <section className={styles.product}>
        <div className={styles.productImage}>
          <span className={styles.productCorner}>Pre-order</span>
        </div>
        <div className={styles.productContent}>
          <h2 className={styles.productTitle}>
            Pedigree <span>Chums</span>
          </h2>
          <p className={styles.productDesc}>
            The on-the-go <span className={styles.productDescHi}>dog spotting game</span> for curious minds and dog lovers. <span className={`${styles.productDescWhite} ${styles.productDescUnderline}`}>54 illustrated breed cards</span> packed with traits, stats, and tell-tale features. <span className={styles.productDescHi}>Spot a dog. </span><span className={styles.productDescWhite}>Make a friend, </span><span className={`${styles.productDescYellow} ${styles.productDescUnderline}`}>you have a new chum.</span>
          </p>
          <div className={styles.productMeta}>
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
          <div className={styles.productCta}>
            <button
              className={styles.btnPrimary}
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("pc:open-offer"))}
            >
              Pre-order now
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
