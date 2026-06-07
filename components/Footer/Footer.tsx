import Image from "next/image";
import Link from "next/link";
import styles from "./Footer.module.css";

const mainMenu = [
  { label: "Homepage", href: "/" },
  { label: "About", href: "/about" },
  { label: "Order", href: "/order" },
  { label: "Contact", href: "/contact" },
];

const usefulLinks = [
  { label: "FAQ", href: "/faq" },
  { label: "SOP", href: "/sop" },
  { label: "Cookie Policy", href: "/cookie-policy" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Use", href: "/terms-of-use" },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.col}>
          <p className={styles.brandLine}>The Dog Bingo Game</p>
          <a href="mailto:enquiries@pedigreechums.co.uk" className={styles.email}>
            enquiries@pedigreechums.co.uk
          </a>
        </div>

        <div className={styles.col}>
          <h3 className={styles.colHead}>Main Menu</h3>
          {mainMenu.map((l) => (
            <Link key={l.href} href={l.href} className={styles.link}>
              {l.label}
            </Link>
          ))}
        </div>

        <div className={styles.col}>
          <h3 className={styles.colHead}>Useful Links</h3>
          {usefulLinks.map((l) => (
            <Link key={l.href} href={l.href} className={styles.link}>
              {l.label}
            </Link>
          ))}
        </div>

        <div className={styles.logoCol}>
          <Image src="/dogbingo.svg" alt="Pedigree Chums" width={170} height={74} />
        </div>
      </div>

      <p className={styles.legal}>
        Pedigree Chums | Registered address: PO BOX 230, Leatherhead, Surrey KT22 8WZ | United
        Kingdom | Copyright 2026
      </p>
    </footer>
  );
}
