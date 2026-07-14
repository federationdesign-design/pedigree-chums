"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./Nav.module.css";

const links = [
  { label: "Home", href: "/home" },
  { label: "About", href: "/about" },
  { label: "Britain's Dog History", href: "/britains-dog-history" },
  { label: "Know Your Chums", href: "/know-your-chums" },
  { label: "Hot/Dogs", href: "/hot-dogs" },
  { label: "Competitions", href: "/chumspot" },
  { label: "Good Dog, Bad Dog", href: "/good-dog-bad-dog" },
  { label: "Chum Drop", href: "/" },
  { label: "Chum Calculator", href: "/chum-calculator" },
];

export default function Nav({ hideLogo = false, dockBottomLeft = false, showLogo = false }: { hideLogo?: boolean; dockBottomLeft?: boolean; showLogo?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    // Defer the first read out of the effect body (avoids set-state-in-effect)
    // and covers the case of loading already scrolled down the page.
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

  return (
    <header className={`pc-nav ${styles.bar} ${dockBottomLeft ? styles.barDock : ""} ${scrolled ? styles.scrolled : ""} ${showLogo ? styles.showLogo : ""}`}>
      {hideLogo ? (
        <span aria-hidden />
      ) : (
        <Link href="/" className={styles.logo} aria-label="Pedigree Chums™ home">
          <Image src="/dogbingo.svg" alt="Pedigree Chums™" width={150} height={64} priority />
        </Link>
      )}
      {!dockBottomLeft && (
        <button
          type="button"
          className={styles.burger}
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <span />
          <span />
          <span />
        </button>
      )}

      {open && (
        <div className={styles.overlay} role="dialog" aria-modal="true">
          <button
            type="button"
            className={styles.close}
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            {"\u00D7"}
          </button>
          <nav className={styles.menu}>
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={styles.menuLink} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <button
              type="button"
              className={styles.menuLink}
              onClick={() => {
                setOpen(false);
                window.dispatchEvent(new CustomEvent("pc:open-offer"));
              }}
            >
              Get discount code
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
