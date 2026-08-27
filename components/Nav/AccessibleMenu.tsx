"use client";
import Link from "next/link";
import styles from "./AccessibleMenu.module.css";

// The accessibility launcher. Replaces the Bento board whenever a contrast
// scheme is active or images are hidden (decided in Nav). Same destinations and
// the same grid arrangement as BentoBoard, but every tile is a plain outlined
// box with the page name centred: no images, no video. The 3 rotating featured
// articles become 3 boxes (a carousel would hide 2 items behind arrows, which
// this menu should not do).
//
// Base colours read on the blue overlay (the hide-images-only case). In a scheme
// the whole board is recoloured by contrast-schemes.css via the pc-acc-menu
// marker class Nav puts on the overlay, because the overlay is portalled outside
// #pc-site and the monochrome sweep cannot reach it.

export default function AccessibleMenu({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = onNavigate ?? (() => {});
  const box = (href: string, label: string, big = false) => (
    <Link href={href} className={`${styles.box} ${big ? styles.colBig : ""}`} onClick={navigate}>
      <span className={styles.boxLabel}>{label}</span>
    </Link>
  );

  return (
    <div className={styles.wrap}>
      {/* Featured -- the three carousel articles as boxes */}
      <div className={styles.featured}>
        {box("/good-dog-bad-dog/argos", "Argos: The Dog Who Knew His Master")}
        {box("/good-dog-bad-dog/anubis", "Anubis: The Scavenger Made Into a God")}
        {box("/good-dog-bad-dog/hound-of-the-baskervilles", "The Hound of the Baskervilles")}
      </div>

      {/* Row 1: Name Generator | (Chum Drop over Britain's + About) */}
      <div className={styles.row}>
        {box("/name-generator", "Dog Name Generator")}
        <div className={styles.col}>
          {box("/", "Mini-game: Chum Drop", true)}
          <div className={styles.pairRow}>
            {box("/britains-dog-history", "Britain's Dog History")}
            {box("/about", "About")}
          </div>
        </div>
      </div>

      {/* Row 2: (Chum Finder over Good Dog + Dogs at Work) | The Card Game */}
      <div className={styles.row}>
        <div className={styles.col}>
          {box("/chum-calculator", "Chum Finder", true)}
          <div className={styles.pairRow}>
            {box("/good-dog-bad-dog", "Good Dog, Bad Dog")}
            {box("/dogs-at-work", "Dogs at Work")}
          </div>
        </div>
        {box("/home", "The Card Game")}
      </div>

      {/* Bottom: (Competitions over Smarter + Hot/Dogs) | (Know Your Chums over Discount + Superpower) */}
      <div className={styles.row}>
        <div className={styles.col}>
          {box("/findpug", "Current Competitions", true)}
          <div className={styles.pairRow}>
            {box("/smarter-than-the-test", "Smarter Than the Test")}
            {box("/hot-dogs", "Hot/Dogs")}
          </div>
        </div>
        <div className={styles.col}>
          {box("/know-your-chums", "Know Your Chums", true)}
          <div className={styles.pairRow}>
            {box("/discount-code", "Discount Code")}
            {box("/whats-your-superpower", "What's Your Superpower")}
          </div>
        </div>
      </div>
    </div>
  );
}
