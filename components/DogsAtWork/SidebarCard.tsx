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
}

export default function SidebarCard({ title, children }: SidebarCardProps) {
  return (
    <section className={styles.card}>
      <div className={styles.pad}>
        <h3 className={styles.title}>{title}</h3>
        {children}
      </div>
    </section>
  );
}
