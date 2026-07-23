"use client";
import Link from "next/link";
import ChumDropTile from "./ChumDropTile";
import VideoTile from "./VideoTile";
import HeroCarousel from "./HeroCarousel";
import styles from "./Nav.module.css";

// ── Launcher tiles. Titles are two-tone: labelA yellow, labelB white. ──
type TileData = { href: string; labelA: string; labelB?: string; cta: string; img?: string; emoji?: string; size?: string; video?: string; videoAspect?: string };
const NAV_TILES: Record<string, TileData> = {
  nameGen: { href: "/name-generator", labelA: "Try the Dog", labelB: "Name Generator", cta: "Name your chum", video: "/podium-video-menu.mp4", videoAspect: "650 / 542" },
  product: { href: "/", labelA: "The Card", labelB: "Game", cta: "Get yours", img: "/product-img.jpg" },
  chumFinder: { href: "/chum-calculator", labelA: "Chum", labelB: "Finder", cta: "Find your perfect dog", emoji: "🔍" },
  britains: { href: "/britains-dog-history", labelA: "Britain's", labelB: "Dog History", cta: "Travel back", img: "/history-hero.jpg" },
  about: { href: "/about", labelA: "About", cta: "Who we are", img: "/initial-preload-hero-img.jpg" },
  gdbd: { href: "/good-dog-bad-dog", labelA: "Good Dog,", labelB: "Bad Dog", cta: "Learn", img: "/bulls-eye-img.jpg" },
  dogsAtWork: { href: "/dogs-at-work", labelA: "Dogs", labelB: "at Work", cta: "Learn", img: "/never-clocking-off.jpg" },
  knowYourChums: { href: "/know-your-chums", labelA: "Know Your", labelB: "Chums", cta: "Meet the pack", img: "/know-your-chums.jpg" },
  home: { href: "/home", labelA: "Home", cta: "Back to start", img: "/home-hero.jpg" },
  hotDogs: { href: "/hot-dogs", labelA: "Hot/Dogs", cta: "What??", img: "/hot-dog-hearo-img.jpg" },
  smarter: { href: "/smarter-than-the-test", labelA: "Smarter Than", labelB: "the Test", cta: "Learn", img: "/inteligent-dogs.jpg" },
};

// The bento launcher board. Used both inside the menu overlay and as a section
// on the homepage. onNavigate fires on any tile click (closes the menu when in
// the overlay; a no-op on the page). onOffer opens the discount offer.
export default function BentoBoard({
  onNavigate,
  onOffer,
  animateIn = false,
}: {
  onNavigate?: () => void;
  onOffer?: () => void;
  animateIn?: boolean;
}) {
  const navigate = onNavigate ?? (() => {});
  const offer = onOffer ?? (() => window.dispatchEvent(new CustomEvent("pc:open-offer")));

  // Two-tone title: first word(s) yellow, remainder white.
  const twoTone = (a: string, b?: string) => (
    <span className={styles.tileLabel}>
      <span className={styles.tileLabelAccent}>{a}</span>{b ? ` ${b}` : ""}
    </span>
  );

  // Standard tile: image (or emoji) fills as a cropped backdrop, label overlaid.
  const coverTile = (t: TileData, cls: string, ctaTop = false, noCta = false) => (
    <Link href={t.href} className={`${styles.tile} ${cls}`} onClick={navigate}>
      <span className={styles.tileImg} aria-hidden>
        {t.img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.img} alt="" className={styles.tileImgTag} loading="lazy" />
        ) : (
          <span className={styles.tileEmoji}>{t.emoji}</span>
        )}
      </span>
      {ctaTop && !noCta && <span className={`${styles.ctaBtn} ${styles.ctaTopRight}`}>{t.cta}</span>}
      <span className={styles.tileMeta}>
        {twoTone(t.labelA, t.labelB)}
        {!ctaTop && !noCta && <span className={styles.ctaBtn}>{t.cta}</span>}
      </span>
    </Link>
  );

  // Image-fit tile: media on top (100% shown), title in a solid navy box below.
  const fitTile = (t: TileData, revealAccent = false) => (
    <Link href={t.href} className={`${styles.tile} ${styles.tileFit}`} onClick={navigate}>
      {t.video ? (
        <span className={styles.fitVideoBox} style={{ aspectRatio: t.videoAspect }} aria-hidden>
          <video className={styles.tileImgTag} src={t.video} muted autoPlay playsInline preload="auto" />
          {revealAccent && <span className={`${styles.fitAccent} ${styles.accentReveal}`}>{t.labelA}</span>}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={t.img} alt="" className={styles.tileFitImg} />
      )}
      <span className={`${styles.ctaBtn} ${styles.ctaTopRight}`}>{t.cta}</span>
      <span className={styles.fitCaption}>
        <span className={styles.tileLabel}>
          {revealAccent ? (
            t.labelB
          ) : (
            <><span className={styles.tileLabelAccent}>{t.labelA}</span>{t.labelB ? ` ${t.labelB}` : ""}</>
          )}
        </span>
      </span>
    </Link>
  );

  return (
    <div className={`${styles.bentoWrap} ${animateIn ? styles.overlayIn : ""}`}>
      {/* Featured hero -- carousel: Argos / Anubis / Hound of the Baskervilles */}
      <HeroCarousel onNavigate={navigate} />

      {/* Row 1 -- Name Generator (left) beside the Chum Drop / Britain's / About cluster */}
      <div className={styles.rowBlock}>
        {fitTile(NAV_TILES.nameGen, true)}
        <div className={styles.cluster}>
          <ChumDropTile href="/" labelA="Mini-game:" labelB="Chum Drop" cta="Play free now" sizeClass={styles.clusterVideo} onNavigate={navigate} />
          <div className={styles.clusterRow}>
            {coverTile(NAV_TILES.britains, `${styles.clusterCell} ${styles.zoomHover}`, false, true)}
            <VideoTile href="/about" src="/menu-about-video.mp4" labelA="About" cta="Who we are" noCta sizeClass={`${styles.clusterCell} ${styles.aboutBig}`} loop={false} reverseOnHover onNavigate={navigate} />
          </div>
        </div>
      </div>

      {/* Row 2 -- alternated: cluster (left) beside The Card Game (right) */}
      <div className={styles.rowBlock}>
        <div className={styles.cluster}>
          <VideoTile href="/chum-calculator" src="/chumfinder-vid.mp4" labelA="Chum" labelB="Finder" cta="Take the suitability test" sizeClass={`${styles.clusterWide} ${styles.chumFinderTitle}`} loop={false} reverseOnHover onNavigate={navigate} />
          <div className={styles.clusterRow}>
            {coverTile(NAV_TILES.gdbd, styles.clusterCell, false, true)}
            {coverTile(NAV_TILES.dogsAtWork, styles.clusterCell, false, true)}
          </div>
        </div>
        {fitTile(NAV_TILES.product)}
      </div>

      {/* Bottom bento -- Competitions (square video) + Know Your Chums (square) */}
      <div className={`${styles.rowBlock} ${styles.rowBlockStart}`}>
        {/* Left: Competitions video + Smarter / Home */}
        <div className={styles.cluster}>
          <VideoTile href="/chumspot" src="/comp-vid.mp4" labelA="Current" labelB="Competitions" cta="Win prizes" sizeClass={`${styles.sqTile} ${styles.centerMeta} ${styles.ctaHover} ${styles.compTile}`} loop={false} reverseOnHover onNavigate={navigate} />
          <div className={styles.miniRow}>
            {coverTile(NAV_TILES.smarter, `${styles.miniCell} ${styles.homeLabel} ${styles.labelHover}`, false, true)}
            {coverTile(NAV_TILES.hotDogs, `${styles.miniCell} ${styles.homeLabel} ${styles.labelHover}`, false, true)}
          </div>
        </div>
        {/* Right: Know Your Chums square + Discount / Home side by side */}
        <div className={styles.cluster}>
          {coverTile(NAV_TILES.knowYourChums, styles.sqTile, true)}
          <div className={styles.miniRow}>
            <button type="button" className={`${styles.tile} ${styles.tileStrip} ${styles.miniCell}`} onClick={offer}>
              <span className={styles.tileMeta}>
                <span className={styles.tileLabel}>
                  <span className={styles.tileLabelAccent}>Discount</span> code
                </span>
                <span className={styles.tileCta}>Grab your code →</span>
              </span>
            </button>
            {coverTile(NAV_TILES.home, `${styles.miniCell} ${styles.homeLabel} ${styles.labelHover}`, false, true)}
          </div>
        </div>
      </div>
    </div>
  );
}
