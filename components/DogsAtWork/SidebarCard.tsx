import * as React from "react";
import styles from "./SidebarCard.module.css";

// A Dogs at Work article sidebar card: the navy, hairline-bordered box with a
// display-font yellow heading, used down the right column of every article page.
// Brief v3.0 Appendix B asks for real CSS Module components here rather than the
// inline React.CSSProperties objects the three legacy articles carry, so this is
// the shell every article-4 module is built from, and the one articles five to
// twelve reuse. Content classes live in SidebarCard.module.css and are consumed
// by the page via the same stylesheet import.
export interface SidebarCardProps {
  title: string;
  children: React.ReactNode;
  /* An optional round thumbnail sitting ON the title line (owner, 23 September
     2026), used on the cards about real dogs. With one present the title drops a
     size so the pair still fits the card width; see .titleRow in the stylesheet. */
  thumb?: { src: string; alt?: string };
}

export default function SidebarCard({ title, children, thumb }: SidebarCardProps) {
  return (
    <section className={styles.card}>
      <div className={styles.pad}>
        {thumb ? (
          <div className={styles.titleRow}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumb.src} alt={thumb.alt ?? ""} className={styles.titleThumb} loading="lazy" />
            <h3 className={`${styles.title} ${styles.titleWithThumb}`}>{title}</h3>
          </div>
        ) : (
          <h3 className={styles.title}>{title}</h3>
        )}
        {children}
      </div>
    </section>
  );
}
