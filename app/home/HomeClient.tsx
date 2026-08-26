"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import VideoGrid from "../../components/VideoGrid/VideoGrid";
import AnubisFeature from "../../components/AnubisFeature/AnubisFeature";
/* The search moved out to components/ChumSearch so Know Your Chums can use the
   same one (owner instruction, 5 August). The markup and behaviour are
   unchanged: they were moved whole, not rewritten. */
import ChumSearch from "../../components/ChumSearch/ChumSearch";
import ArticleTextToggle from "../../components/ArticleTextToggle/ArticleTextToggle";
import styles from "./home.module.css";

// Two-column product block (image left, copy right). Written once and rendered
// three times below (the card game, plus the two Coming Soon teasers) rather
// than pasting the markup three times. imageClass swaps the .productImage
// background; meta and cta are omitted for the Coming Soon blocks (no green
// button, no players/age/where row).
function ProductBlock({
  imageClass,
  badge,
  title,
  titleClass,
  children,
  meta,
  cta,
}: {
  imageClass?: string;
  badge: string;
  title: ReactNode;
  titleClass?: string;
  children: ReactNode;
  meta?: ReactNode;
  cta?: ReactNode;
}) {
  return (
    <section className={styles.product}>
      <div className={imageClass ? `${styles.productImage} ${imageClass}` : styles.productImage}>
        <span className={styles.productCorner}>{badge}</span>
      </div>
      <div className={styles.productContent}>
        <h2 className={titleClass ? `${styles.productTitle} ${titleClass}` : styles.productTitle}>{title}</h2>
        <p className={styles.productDesc}>{children}</p>
        {meta}
        {cta}
      </div>
    </section>
  );
}

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

      {/* Article text toggle: switches the white content below the hero to navy.
          Anchored above the H1 that follows the video grid (Steve, 17 Aug 2026).
          Same control and per-pathname sessionStorage as the essay pages; it hides
          itself in a contrast scheme. Needs the <main> wrapper added in page.tsx. */}
      <ArticleTextToggle centered />

      {/* Search hero */}
      <section id="preorder" className={styles.searchHero}>
        <p className={styles.searchEyebrow}>54 breeds to discover</p>
        <h1 className={styles.searchTitle}>
          Explore Britain&apos;s most <span>popular breeds</span>
        </h1>
        <p className={styles.searchSub}>
          Type a breed to explore its family tree, history, and personality
        </p>
        <ChumSearch />
      </section>


      {/* Product sections. All three use the ProductBlock helper above so the
          two-column block is written once, not pasted three times (Batch 2). */}
      <ProductBlock
        badge="Pre-order"
        title={<>Pedigree <span>Chums</span></>}
        meta={
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
        }
        cta={
          <div className={styles.productCta}>
            <Link className={styles.btnPrimary} href="/preorder">
              Pre-order now
            </Link>
          </div>
        }
      >
        The on-the-go <span className={styles.productDescHi}>dog spotting game</span> for curious minds and dog lovers. <span className={`${styles.productDescWhite} ${styles.productDescUnderline}`}>54 illustrated breed cards</span> packed with traits, stats, and tell-tale features. <span className={styles.productDescHi}>Spot a dog. </span><span className={styles.productDescWhite}>Make a friend, </span><span className={`${styles.productDescYellow} ${styles.productDescUnderline}`}>you have a new chum.</span>
      </ProductBlock>

      <ProductBlock
        imageClass={styles.productImageSticker}
        badge="Coming soon"
        title="Pedigree Chums Sticker Pack, 212 Stickers"
        titleClass={styles.productTitleSmall}
      >
        A bumper pack of 212 colourful Pedigree Chums stickers, featuring favourite breeds, paws, bones, stars and more. Perfect for notebooks, bottles, folders and anywhere that needs a little more dog. <span className={styles.productDescHi}>Coming soon. Not yet available to purchase.</span>
      </ProductBlock>

      <ProductBlock
        imageClass={styles.productImageFigurine}
        badge="Coming soon"
        title="Pedigree Chums 3D Figurines"
        titleClass={styles.productTitleSmall}
      >
        Bring your favourite chum off the card and into the real world with our collectible 3D Pedigree Chums figurines. They are not available to buy just yet. For now, the only way to get one is to win one in a Pedigree Chums competition. <span className={styles.productDescHi}>More chums coming soon.</span>
      </ProductBlock>
    </>
  );
}
