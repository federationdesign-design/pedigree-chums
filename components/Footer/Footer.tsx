import Image from "next/image";
import Link from "next/link";
import styles from "./Footer.module.css";

const NAV_LINKS = [
  { href: "/home",                label: "Home" },
  { href: "/about",               label: "About" },
  { href: "/know-your-chums",     label: "Know Your Chums" },
  { href: "/britains-dog-history", label: "Britain's Dog History" },
  { href: "/hot-dogs",            label: "Hot/Dogs" },
  { href: "/chumspot",            label: "Competitions" },
  { href: "/",                    label: "Chum Drop" },
];

export default function Footer({ tradeLinks = false }: { tradeLinks?: boolean }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.logoCol}>
        <Image src="/dogbingo.svg" alt="Pedigree Chums" width={340} height={148} />
      </div>

      <nav className={styles.nav}>
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={styles.navLink}>
            {link.label}
          </Link>
        ))}
      </nav>

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
