"use client";
import styles from "./Announce.module.css";

export default function Announce() {
  return (
    <button
      type="button"
      className={styles.announce}
      onClick={() => window.dispatchEvent(new CustomEvent("pc:open-offer"))}
    >
      <strong>Released Soon!</strong> Add your email to get a discount code to use on launch day
    </button>
  );
}
