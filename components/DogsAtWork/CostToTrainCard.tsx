import * as React from "react";
import styles from "../../app/dogs-at-work/dogs-at-work.module.css";

// "What it costs to train a dog": the figures sidebar module. It first appeared
// inline on article 1 (the bio-detection essay) and is reused verbatim on
// article 6 (the guide dogs essay), so it lives here as one component rather than
// a re-typed copy that could drift. The figures and the sources line are the
// single source of truth: change them here and both articles follow. The shell is
// the same legacy .sidebarCard the inline cards use, so it sits beside its
// neighbours without a seam.

// CARD TEXT IS CLASSES NOW, 19 September 2026 (Steve). The React.CSSProperties
// objects that used to live here are .cardTitle2, .cardBody2, .statLabel2 and
// .statValue2 in dogs-at-work.module.css, value for value. See the note there for
// why. Per-site overrides stay inline, because they are genuinely per site.

export default function CostToTrainCard() {
  return (
    <div className={styles.sidebarCard}>
      <div style={{ padding: "32px 40px 16px" }}>
        <p className={styles.cardTitle2}>What it costs to train a dog</p>
      </div>
      <div style={{ padding: "0 40px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          { role: "Guide dog", detail: "birth to retirement", value: "£55,000+" },
          { role: "Medical alert assistance dog", detail: "to fully train", value: "£29,000" },
          { role: "Ongoing support", detail: "per year, per dog", value: "£1,000" },
        ].map(({ role, detail, value }) => (
          <div key={role} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 10 }}>
            <div>
              <p className={styles.cardBody2} style={{ fontWeight: 700 }}>{role}</p>
              <p className={styles.cardBody2} style={{ fontSize: "0.72rem", color: "#ffffff" }}>{detail}</p>
            </div>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "#fff", whiteSpace: "nowrap", lineHeight: 1 }}>{value}</p>
          </div>
        ))}
      </div>
      <div style={{ padding: "8px 40px 52px" }}>
        <p className={styles.cardBody2} style={{ fontSize: "0.78rem", color: "#ffffff" }}>These dogs are given free to the people who need them, funded almost entirely by public donations. Sources: Guide Dogs; Medical Detection Dogs.</p>
      </div>
    </div>
  );
}
