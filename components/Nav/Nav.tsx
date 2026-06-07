"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./Nav.module.css";

const links = [
  { label: "Homepage", href: "/" },
  { label: "About", href: "/about" },
  { label: "Order", href: "/order" },
  { label: "Contact", href: "/contact" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className={styles.bar}>
      <Link href="/" className={styles.logo} aria-label="Pedigree Chums home">
        <Image src="/dogbingo.svg" alt="Pedigree Chums" width={150} height={64} priority />
      </Link>
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
          </nav>
        </div>
      )}
    </header>
  );
}
