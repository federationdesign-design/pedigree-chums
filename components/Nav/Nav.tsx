"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import ChumDropTile from "./ChumDropTile";
import VideoTile from "./VideoTile";
import styles from "./Nav.module.css";

// ── Launcher tiles. Titles are two-tone: labelA yellow, labelB white. ──
type TileData = { href: string; labelA: string; labelB?: string; cta: string; img?: string; emoji?: string; size?: string; video?: string; videoAspect?: string };
const NAV_TILES: Record<string, TileData> = {
  nameGen: { href: "/name-generator", labelA: "Try the Dog", labelB: "Name Generator", cta: "Name your chum", video: "/podium-video-menu.mp4", videoAspect: "650 / 542" },
  product: { href: "/", labelA: "The Card", labelB: "Game", cta: "Get yours", img: "/product-img.jpg" },
  chumFinder: { href: "/chum-calculator", labelA: "Chum", labelB: "Finder", cta: "Find your perfect dog", emoji: "🔍" },
  britains: { href: "/britains-dog-history", labelA: "Britain's", labelB: "Dog History", cta: "Travel back", img: "/history-hero.jpg" },
  about: { href: "/about", labelA: "About", cta: "Who we are", img: "/initial-preload-hero-img.jpg" },
  gdbd: { href: "/good-dog-bad-dog", labelA: "Good Dog,", labelB: "Bad Dog", cta: "Read the essays", img: "/bulls-eye-img.jpg" },
  dogsAtWork: { href: "/dogs-at-work", labelA: "Dogs", labelB: "at Work", cta: "Meet the workers", img: "/never-clocking-off.jpg" },
  knowYourChums: { href: "/know-your-chums", labelA: "Know Your", labelB: "Chums", cta: "Meet the pack", img: "/know-your-chums.jpg" },
  home: { href: "/home", labelA: "Home", cta: "Back to start", img: "/home-hero.jpg" },
  hotDogs: { href: "/hot-dogs", labelA: "Hot/Dogs", cta: "Keep cool", img: "/hot-dog-hearo-img.jpg" },
  smarter: { href: "/smarter-than-the-test", labelA: "Smarter Than", labelB: "the Test", cta: "Find out", img: "/inteligent-dogs.jpg" },
};

// Menu images worth preloading so the launcher opens without pop-in.
const PRELOAD_IMAGES = [
  "/name-gen-bento-menu-img.jpg", "/product-img.jpg", "/history-hero.jpg",
  "/bulls-eye-img.jpg", "/never-clocking-off.jpg", "/home-hero.jpg",
  "/know-your-chums.jpg", "/hot-dog-hearo-img.jpg", "/inteligent-dogs.jpg",
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
  const heroRaf = useRef(0);
  const heroReversing = useRef(false);
  const heroLastTs = useRef(0);

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

  // Preload the menu images on page load so the launcher opens without pop-in.
  useEffect(() => {
    PRELOAD_IMAGES.forEach((s) => { const im = new window.Image(); im.src = s; });
  }, []);

  // Featured hero: wait 2s after the menu opens, then play the clip through once.
  useEffect(() => {
    if (!open) return;
    const v = videoRef.current;
    if (!v) return;
    try { v.currentTime = 0; } catch {}
    const t = setTimeout(() => { v.play().catch(() => {}); }, 2000);
    return () => { clearTimeout(t); heroReversing.current = false; cancelAnimationFrame(heroRaf.current); };
  }, [open]);

  // Hero hover: rewind (play backwards) while hovering, play forward on leave.
  const heroStep = (ts: number) => {
    const v = videoRef.current;
    if (!v || !heroReversing.current) return;
    if (heroLastTs.current) {
      const dt = (ts - heroLastTs.current) / 1000;
      v.currentTime = Math.max(0, v.currentTime - dt);
    }
    heroLastTs.current = ts;
    if (v.currentTime <= 0.02) { heroReversing.current = false; return; }
    heroRaf.current = requestAnimationFrame(heroStep);
  };
  function handleHeroEnter() {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    heroReversing.current = true;
    heroLastTs.current = 0;
    heroRaf.current = requestAnimationFrame(heroStep);
  }
  function handleHeroLeave() {
    heroReversing.current = false;
    cancelAnimationFrame(heroRaf.current);
    videoRef.current?.play().catch(() => {});
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
  // ctaTop floats the green button over the top-right instead of by the title.
  const coverTile = (t: TileData, cls: string, ctaTop = false) => (
    <Link href={t.href} className={`${styles.tile} ${cls}`} onClick={closeMenu}>
      <span className={styles.tileImg} aria-hidden>
        {t.img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.img} alt="" className={styles.tileImgTag} loading="lazy" />
        ) : (
          <span className={styles.tileEmoji}>{t.emoji}</span>
        )}
      </span>
      {ctaTop && <span className={`${styles.ctaBtn} ${styles.ctaTopRight}`}>{t.cta}</span>}
      <span className={styles.tileMeta}>
        {twoTone(t.labelA, t.labelB)}
        {!ctaTop && <span className={styles.ctaBtn}>{t.cta}</span>}
      </span>
    </Link>
  );

  // Image-fit tile: media on top (100% shown), title in a solid navy box below.
  // Green CTA button floats top-right. revealAccent hides labelA until hover.
  const fitTile = (t: TileData, revealAccent = false) => (
    <Link href={t.href} className={`${styles.tile} ${styles.tileFit}`} onClick={closeMenu}>
      {t.video ? (
        <span className={styles.fitVideoBox} style={{ aspectRatio: t.videoAspect }} aria-hidden>
          <video className={styles.tileImgTag} src={t.video} muted loop autoPlay playsInline preload="auto" />
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={t.img} alt="" className={styles.tileFitImg} />
      )}
      <span className={`${styles.ctaBtn} ${styles.ctaTopRight}`}>{t.cta}</span>
      <span className={styles.fitCaption}>
        <span className={styles.tileLabel}>
          {revealAccent ? (
            <><span className={`${styles.tileLabelAccent} ${styles.accentReveal}`}>{t.labelA} </span>{t.labelB}</>
          ) : (
            <><span className={styles.tileLabelAccent}>{t.labelA}</span>{t.labelB ? ` ${t.labelB}` : ""}</>
          )}
        </span>
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
            <div className={`${styles.bentoWrap} ${styles.overlayIn}`}>
              {/* Featured hero -- Argos letterbox animation, click-through to the essay */}
              <Link href="/good-dog-bad-dog/argos" className={styles.heroSlot} onClick={closeMenu} onMouseEnter={handleHeroEnter} onMouseLeave={handleHeroLeave}>
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
                {fitTile(NAV_TILES.nameGen, true)}
                <div className={styles.cluster}>
                  <ChumDropTile href="/" labelA="Mini-game:" labelB="Chum Drop" cta="Play free now" sizeClass={styles.clusterVideo} onNavigate={closeMenu} />
                  <div className={styles.clusterRow}>
                    {coverTile(NAV_TILES.britains, `${styles.clusterCell} ${styles.zoomHover}`)}
                    <VideoTile href="/about" src="/menu-about-video.mp4" labelA="About" cta="Who we are" sizeClass={`${styles.clusterCell} ${styles.aboutBig}`} loop={false} reverseOnHover onNavigate={closeMenu} />
                  </div>
                </div>
              </div>

              {/* Row 2 -- alternated: cluster (left) beside The Card Game (right) */}
              <div className={styles.rowBlock}>
                <div className={styles.cluster}>
                  <VideoTile href="/chum-calculator" src="/chumfinder-vid.mp4" labelA="Chum" labelB="Finder" cta="Find your perfect dog" sizeClass={styles.clusterWide} loop={false} reverseOnHover onNavigate={closeMenu} />
                  <div className={styles.clusterRow}>
                    {coverTile(NAV_TILES.gdbd, styles.clusterCell)}
                    {coverTile(NAV_TILES.dogsAtWork, styles.clusterCell)}
                  </div>
                </div>
                {fitTile(NAV_TILES.product)}
              </div>

              {/* Bottom bento -- Competitions (square video) + Know Your Chums (square) */}
              <div className={`${styles.rowBlock} ${styles.rowBlockStart}`}>
                {/* Left: Competitions video + Smarter / Home */}
                <div className={styles.cluster}>
                  <VideoTile href="/chumspot" src="/comp-vid.mp4" labelA="Current" labelB="Competitions" cta="Win prizes" sizeClass={styles.sqTile} loop={false} reverseOnHover onNavigate={closeMenu} />
                  <div className={styles.miniRow}>
                    {coverTile(NAV_TILES.smarter, styles.miniCell)}
                    {coverTile(NAV_TILES.hotDogs, styles.miniCell)}
                  </div>
                </div>
                {/* Right: Know Your Chums square + Discount / Home side by side */}
                <div className={styles.cluster}>
                  {coverTile(NAV_TILES.knowYourChums, styles.sqTile, true)}
                  <div className={styles.miniRow}>
                    <button type="button" className={`${styles.tile} ${styles.tileStrip} ${styles.miniCell}`} onClick={openOffer}>
                      <span className={styles.tileMeta}>
                        <span className={styles.tileLabel}>
                          <span className={styles.tileLabelAccent}>Discount</span> code
                        </span>
                        <span className={styles.tileCta}>Grab your code →</span>
                      </span>
                    </button>
                    {coverTile(NAV_TILES.home, styles.miniCell)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
