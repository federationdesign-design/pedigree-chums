import Image from "next/image";
import Link from "next/link";
import styles from "./Footer.module.css";

const menu = [
  { label: "Homepage", href: "/" },
  { label: "About", href: "/about" },
  { label: "Order", href: "/order" },
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.logoCol}>
          <Image src="/dogbingo.svg" alt="Pedigree Chums" width={340} height={148} />
        </div>
        <nav className={styles.menu}>
          {menu.map((l) => (
            <Link key={l.href} href={l.href} className={styles.link}>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>

      <p className={styles.legal}>
        Pedigree Chums | The Dog Bingo Game. Registered in England and Wales.
        Copyright 2026: Taylor James Stephens Ltd Trading as Pedigree Chums |
        United Kingdom | Copyright 2026
      </p>
    </footer>
  );
}
