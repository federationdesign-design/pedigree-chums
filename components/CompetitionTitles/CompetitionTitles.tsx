import OutboundLink from "../OutboundLink/OutboundLink";
import styles from "./CompetitionTitles.module.css";

/* Titles + intro block for the Spot your Chum competition pages (brief 4c).
   Shared across every breed: only the breed name in the question and the intro
   body lines vary, and those come in as props from the per-breed config.

   The two title lines are one heading ("Spot your Chum Photo Competition"), so
   the outline is done with -webkit-text-stroke + paint-order (the site's
   established technique, see app/britains-dog-history-2) on single elements
   rather than duplicated stacked copies. That keeps it a single accessible h1.

   Desktop-first (brief stage 3). Mobile tuning lands at stage 5. */

/* Split an intro line on any [label](href) tokens and turn each into a link,
   leaving the surrounding plain text intact.

   THE SAME CONVENTION AS THE TERMS BLOCK, deliberately: renderBody in
   CompetitionTerms.tsx does exactly this, so a line of copy stays a plain string
   in the per-breed config and nobody has to touch a component to link a word.

   An http(s) target goes through OutboundLink so it raises the sitewide leave
   dialogue, the same as the social icons further down the page. Anything else is
   treated as internal and gets a plain anchor. */
function renderLine(text: string) {
  return text.split(/(\[[^\]]+\]\([^)]+\))/g).map((part, i) => {
    const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (!m) return part;
    const [, label, href] = m;
    return /^https?:\/\//.test(href) ? (
      <OutboundLink key={i} href={href} className={styles.introLink}>{label}</OutboundLink>
    ) : (
      <a key={i} href={href} className={styles.introLink}>{label}</a>
    );
  });
}

type Props = {
  /** Breed name, as printed in "Have you spotted <breed>?". */
  breed: string;
  /** The intro body lines beneath the question. May contain [label](href)
      tokens, which are rendered as links. */
  introLines: string[];
};

export default function CompetitionTitles({ breed, introLines }: Props) {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        {/* The explicit {" "} between the two block lines guarantees a space in
            the text content, so the accessible name reads "Spot your Chum Photo
            Competition" and any inline fallback does not run the words together
            ("ChumPhoto"). The lines stack via display: block in the CSS. */}
        <h1 className={styles.title}>
          <span className={styles.line1}>Spot your Chum</span>{" "}
          <span className={styles.line2}>Photo Competition</span>
        </h1>
        <p className={styles.question}>Have you spotted {breed}?</p>
        {introLines.map((line, i) => (
          <p key={i} className={styles.introBody}>{renderLine(line)}</p>
        ))}
      </div>
    </section>
  );
}
