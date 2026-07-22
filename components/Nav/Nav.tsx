"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import ChumDropTile from "./ChumDropTile";
import VideoTile from "./VideoTile";
import styles from "./Nav.module.css";

// ── Launcher tiles. Titles are two-tone: labelA yellow, labelB white. ──
type TileData = { href: string; labelA: string; labelB?: string; cta: string; img?: string; emoji?: string };
const NAV_TILES: Record<string, TileData> = {
  nameGen: { href: "/name-generator", labelA: "Name", labelB: "Generator", cta: "Name your chum", img: "/name-gen-bento-menu-img.jpg" },
  product: { href: "/", labelA: "The Card", labelB: "Game", cta: "Get yours", img: "/product-img.jpg" },
  chumFinder: { href: "/chum-calculator", labelA: "Chum", labelB: "Finder", cta: "Find your perfect dog", emoji: "🔍" },
  britains: { href: "/britains-dog-history", labelA: "Britain's", labelB: "Dog History", cta: "Travel back", img: "/history-hero.jpg" },
  about: { href: "/about", labelA: "About", cta: "Who we are", img: "/initial-preload-hero-img.jpg" },
  gdbd: { href: "/good-dog-bad-dog", labelA: "Good Dog,", labelB: "Bad Dog", cta: "Read the essays", img: "/bulls-eye-img.jpg" },
  dogsAtWork: { href: "/dogs-at-work", labelA: "Dogs", labelB: "at Work", cta: "Meet the workers", img: "/never-clocking-off.jpg" },
};

// Secondary pages -- kept reachable as plain text links
const UTILITY = [
  { label: "Home", href: "/home" },
  { label: "Competitions", href: "/chumspot" },
  { label: "Know Your Chums", href: "/know-your-chums" },
  { label: "Hot/Dogs", href: "/hot-dogs" },
  { label: "Smarter Than the Test", href: "/smarter-than-the-test" },
];

const tradeNavLinks = [
  { label: "Trade Enquiry", href: "/trade#enquire" },
  { label: "Independent Stockists", href: "/independents#enquire" },
  { label: "Evidence Register", href: "/evidence-register" },
  { label: "Toy Safety Technical File", href: "/toy-safety" },
];

export default function Nav({ hideLogo = false, dockBottomLeft = false, showLogo = false, tradeLinks = false }: { hideLogo?: boolean; dockBottomLeft?: boolean; showLogo?: boolean; tradeLinks?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    const openMenu = () => setOpen(true);
    window.addEventListener("pc:open-menu", openMenu);
    return () => window.removeEventListener("pc:open-menu", openMenu);
  }, []);

  // Featured hero: wait 2s after the menu opens, then play the clip through once.
  useEffect(() => {
    if (!open) return;
    const v = videoRef.current;
    if (!v) return;
    try { v.currentTime = 0; } catch {}
    const t = setTimeout(() => { v.play().catch(() => {}); }, 2000);
    return () => clearTimeout(t);
  }, [open]);

  // Hover: replay if finished, pause if playing, resume if paused part-way.
  function handleHeroHover() {
    const v = videoRef.current;
    if (!v) return;
    const atEnd = v.ended || (v.duration > 0 && v.currentTime >= v.duration - 0.05);
    if (atEnd) {
      v.currentTime = 0;
      v.play().catch(() => {});
    } else if (!v.paused) {
      v.pause();
    } else {
      v.play().catch(() => {});
    }
  }

  function openOffer() {
    setOpen(false);
    window.dispatchEvent(new CustomEvent("pc:open-offer"));
  }

  const closeMenu = () => setOpen(false);

  // Two-tone title: first word(s) yellow, remainder white.
  const twoTone = (a: string, b?: string) => (
    <span className={styles.tileLabel}>
      <span className={styles.tileLabelAccent}>{a}</span>{b ? ` ${b}` : ""}
    </span>
  );

  // Standard tile: image (or emoji) fills as a cropped backdrop, label overlaid.
  const coverTile = (t: TileData, cls: string) => (
    <Link href={t.href} className={`${styles.tile} ${cls}`} onClick={closeMenu}>
      <span className={styles.tileImg} aria-hidden>
        {t.img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.img} alt="" className={styles.tileImgTag} loading="lazy" />
        ) : (
          <span className={styles.tileEmoji}>{t.emoji}</span>
        )}
      </span>
      <span className={styles.tileMeta}>
        {twoTone(t.labelA, t.labelB)}
        <span className={styles.tileCta}>{t.cta} →</span>
      </span>
    </Link>
  );

  // Image-fit tile: box scales to the image width and takes the image's height,
  // so 100% of the artwork shows. Label overlays the bottom.
  const fitTile = (t: TileData) => (
    <Link href={t.href} className={`${styles.tile} ${styles.tileFit}`} onClick={closeMenu}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={t.img} alt="" className={styles.tileFitImg} />
      <span className={`${styles.tileMeta} ${styles.tileMetaOverlay}`}>
        {twoTone(t.labelA, t.labelB)}
        <span className={styles.tileCta}>{t.cta} →</span>
      </span>
    </Link>
  );

  return (
    <header className={`pc-nav ${styles.bar} ${dockBottomLeft ? styles.barDock : ""} ${scrolled ? styles.scrolled : ""} ${showLogo ? styles.showLogo : ""}`}>
      {/* Header contents hide while the menu is open -- no logo, no hamburger. */}
      {!open && !hideLogo && (
        <Link href="/" className={styles.logo} aria-label="Pedigree Chums™ home">
          <Image src="/dogbingo.svg" alt="Pedigree Chums™" width={150} height={64} priority />
        </Link>
      )}
      {!open && !dockBottomLeft && (
        <button type="button" className={styles.burger} onClick={() => setOpen(true)} aria-label="Open menu">
          <span />
          <span />
          <span />
        </button>
      )}

      {open && (
        <div className={`${styles.overlay} ${!tradeLinks ? styles.overlayScroll : ""}`} role="dialog" aria-modal="true">
          <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label="Close menu">{"×"}</button>

          {tradeLinks ? (
            <nav className={styles.menu}>
              {tradeNavLinks.map((l) => (
                <Link key={l.href} href={l.href} className={styles.menuLink} onClick={() => setOpen(false)}>{l.label}</Link>
              ))}
              <Link href="/preorder" className={styles.menuLink} onClick={() => setOpen(false)}>Get pre-order discount code</Link>
            </nav>
          ) : (
            <div className={styles.bentoWrap}>
              {/* Featured hero -- Argos letterbox animation, click-through to the essay */}
              <Link href="/good-dog-bad-dog/argos" className={styles.heroSlot} onClick={closeMenu} onMouseEnter={handleHeroHover}>
                <video ref={videoRef} className={styles.heroVideo} src="/menuflash-argos-opt.mp4" muted playsInline preload="auto" aria-hidden />
                <div className={styles.heroContent}>
                  <div className={styles.heroTags}>
                    <span className={styles.heroTagGood}>Good dog</span>
                    <span className={styles.heroTagOutline}>Homer</span>
                    <span className={styles.heroTagOutline}>The Odyssey</span>
                  </div>
                  <div className={styles.heroBottom}>
                    <p className={styles.heroTitle}><span className={styles.heroTitleAccent}>Argos:</span> The Dog Who Knew His Master</p>
                    <span className={styles.heroBtn}>About this dog</span>
                  </div>
                </div>
              </Link>

              {/* Row 1 -- Name Generator (left) beside the Chum Drop / Britain's / About cluster */}
              <div className={styles.rowBlock}>
                {fitTile(NAV_TILES.nameGen)}
                <div className={styles.cluster}>
                  <ChumDropTile href="/" labelA="Mini-game:" labelB="Chum Drop" cta="Play free now" sizeClass={styles.clusterVideo} onNavigate={closeMenu} />
                  <div className={styles.clusterRow}>
                    {coverTile(NAV_TILES.britains, styles.clusterCell)}
                    <VideoTile href="/about" src="/menu-about-video.mp4" labelA="About" cta="Who we are" sizeClass={styles.clusterCell} onNavigate={closeMenu} />
                  </div>
                </div>
              </div>

              {/* Row 2 -- alternated: cluster (left) beside The Card Game (right) */}
              <div className={styles.rowBlock}>
                <div className={styles.cluster}>
                  <VideoTile href="/chum-calculator" src="/chumfinder-vid.mp4" labelA="Chum" labelB="Finder" cta="Find your perfect dog" sizeClass={styles.clusterWide} onNavigate={closeMenu} />
                  <div className={styles.clusterRow}>
                    {coverTile(NAV_TILES.gdbd, styles.clusterCell)}
                    {coverTile(NAV_TILES.dogsAtWork, styles.clusterCell)}
                  </div>
                </div>
                {fitTile(NAV_TILES.product)}
              </div>

              {/* Discount -- full-width action strip */}
              <button type="button" className={`${styles.tile} ${styles.tileStrip}`} onClick={openOffer}>
                <span className={styles.tileMeta}>
                  <span className={styles.tileLabel}>
                    <span className={styles.tileLabelAccent}>Discount</span> code
                  </span>
                  <span className={styles.tileCta}>Grab your code →</span>
                </span>
              </button>

              <div className={styles.utilityRow}>
                {UTILITY.map((l) => (
                  <Link key={l.href} href={l.href} className={styles.utilityLink} onClick={closeMenu}>{l.label}</Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
