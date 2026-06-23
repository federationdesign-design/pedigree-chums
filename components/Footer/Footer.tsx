import Image from "next/image";
import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.logoCol}>
        <Image src="/dogbingo.svg" alt="Pedigree Chums" width={340} height={148} />
      </div>

      <nav className={styles.links}>
        <Link href="/toy-safety" className={styles.link}>Toy Safety Technical File</Link>
      </nav>

      <p className={styles.legal}>
        Pedigree Chums | The Dog Bingo Game. Registered in England and Wales.
        Copyright 2026: Taylor James Stephens Ltd Trading as Pedigree Chums |
        United Kingdom
      </p>
    </footer>
  );
}
