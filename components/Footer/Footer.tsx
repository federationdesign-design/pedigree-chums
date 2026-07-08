import Image from "next/image";
import Link from "next/link";
import styles from "./Footer.module.css";

const NAV_LINKS = [
  { href: "/home", label: "Explore Breeds" },
  { href: "/about", label: "About" },
  { href: "/hot-dogs", label: "Hot Dogs" },
  { href: "/know-your-chums", label: "Know Your Chums" },
  { href: "/preorder", label: "Pre-order" },
];

export default function Footer({ tradeLinks = false }: { tradeLinks?: boolean }) {
  return (
    <footer className={styles.footer}>
      <nav className={styles.nav}>
        {NAV_LINKS.map((link, i) => (
          <span key={link.href} className={styles.navItem}>
            {i > 0 && <span className={styles.pipe}>|</span>}
            <Link href={link.href} className={styles.navLink}>{link.label}</Link>
          </span>
        ))}
      </nav>

      <div className={styles.logoCol}>
        <Image src="/dogbingo.svg" alt="Pedigree Chums" width={340} height={148} />
      </div>

      {tradeLinks && (
        <nav className={styles.links}>
          <Link href="/toy-safety" className={styles.link}>Toy Safety Technical File</Link>
          <Link href="/evidence-register" className={styles.link}>Evidence Register</Link>
        </nav>
      )}

      <p className={styles.legal}>
        Pedigree Chums | The Dog Bingo Game. Registered in England and Wales.
        Copyright 2026: Taylor James Stephens Ltd Trading as Pedigree Chums |
        United Kingdom
      </p>
    </footer>
  );
}
