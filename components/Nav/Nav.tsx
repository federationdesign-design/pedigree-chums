"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./Nav.module.css";

// ── Featured tiles (the launcher grid). Order = DOM order = grid flow. ──
// img: real hero image for the tile. Falls back to the emoji when absent.
type Tile = { key: string; label: string; href: string; cta: string; size: string; emoji: string; img?: string };
const TILES: Tile[] = [
  { key: "name-generator", label: "Name Generator", href: "/name-generator", cta: "Name your chum", size: "tileBig", emoji: "🐶", img: "/name-podium.jpg" },
  { key: "chum-finder", label: "Chum Finder", href: "/chum-calculator", cta: "Find your perfect dog", size: "tileWide", emoji: "🔍" },
  { key: "chum-drop", label: "Chum Drop", href: "/", cta: "Play the game", size: "tileWide", emoji: "🎯", img: "/home-hero.jpg" },
  { key: "dogs-at-work", label: "Dogs at Work", href: "/dogs-at-work", cta: "Meet the workers", size: "tileSmall", emoji: "🦺" },
  { key: "good-dog-bad-dog", label: "Good Dog, Bad Dog", href: "/good-dog-bad-dog", cta: "Read the essays", size: "tileSmall", emoji: "📖" },
  { key: "britains-dog-history", label: "Britain's Dog History", href: "/britains-dog-history", cta: "Travel back", size: "tileSmall", emoji: "🏰", img: "/history-hero.jpg" },
  { key: "about", label: "About", href: "/about", cta: "Who we are", size: "tileSmall", emoji: "🐾", img: "/initial-preload-hero-img.jpg" },
];

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

  function openOffer() {
    setOpen(false);
    window.dispatchEvent(new CustomEvent("pc:open-offer"));
  }

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
              <Link href="/good-dog-bad-dog/argos" className={styles.heroSlot} onClick={() => setOpen(false)}>
                <video className={styles.heroVideo} src="/menuflash-argos-opt.mp4" autoPlay muted loop playsInline aria-hidden />
                <div className={styles.heroContent}>
                  <div className={styles.heroTags}>
                    <span className={styles.heroTagGood}>Good dog</span>
                    <span className={styles.heroTagOutline}>Homer</span>
                    <span className={styles.heroTagOutline}>The Odyssey</span>
                  </div>
                  <p className={styles.heroTitle}>Argos: The Dog Who Knew His Master</p>
                  <span className={styles.heroBtn}>Read the essay</span>
                </div>
              </Link>

              <div className={styles.bentoGrid}>
                {TILES.map((t) => (
                  <Link
                    key={t.key}
                    href={t.href}
                    className={`${styles.tile} ${styles[t.size as keyof typeof styles]}`}
                    onClick={() => setOpen(false)}
                  >
                    <span className={styles.tileImg} aria-hidden>
                      {t.img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.img} alt="" className={styles.tileImgTag} loading="lazy" />
                      ) : (
                        <span className={styles.tileEmoji}>{t.emoji}</span>
                      )}
                    </span>
                    <span className={styles.tileMeta}>
                      <span className={styles.tileLabel}>{t.label}</span>
                      <span className={styles.tileCta}>{t.cta} →</span>
                    </span>
                  </Link>
                ))}

                {/* Discount -- full-width action strip */}
                <button type="button" className={`${styles.tile} ${styles.tileStrip}`} onClick={openOffer}>
                  <span className={styles.tileMeta}>
                    <span className={styles.tileLabel}>Discount code</span>
                    <span className={styles.tileCta}>Grab your code →</span>
                  </span>
                </button>
              </div>

              <div className={styles.utilityRow}>
                {UTILITY.map((l) => (
                  <Link key={l.href} href={l.href} className={styles.utilityLink} onClick={() => setOpen(false)}>{l.label}</Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
