import styles from "./AncientFacts.module.css";

/* Three boxed facts for the Ancient era page, below the map and timeline.
   Text taken from the owner's social slides (slide1b, slide2, slide4), 22 Sept
   2026, with light copy fixes: "there" to "their", "A Roman writer Arrian" to
   "The Roman writer Arrian", and the guard dogs sentence given a verb. The image
   caption on slide 2 ("no doubt a very good boy") is left out, as the image is
   not used here. The Star Carr height sentence was added 22 Sept 2026 to balance
   the middle box: Harcourt (1974), as cited in Journal of Archaeological Science
   (2010), https://www.sciencedirect.com/science/article/abs/pii/S0305440310001974 */

type Fact = { heading: string; paras: string[] };

const FACTS: Fact[] = [
  {
    heading: "Britain's earliest dogs had no breed standards or pedigrees.",
    paras: [
      "They were shaped by the jobs people needed doing: guarding homes and livestock, following scents, chasing deer and hares.",
      "Classical writers recorded that British hunting dogs were exported overseas, and reported on Celts using dogs in war.",
    ],
  },
  {
    heading: "A 14,000-year-old dog jawbone",
    paras: [
      "Archaeologists have found dogs of very different sizes in early British settlements, from small animals to dogs approaching wolf size.",
      "The dogs at Star Carr in North Yorkshire, around 11,000 years ago, stood between 52 and 61 cm at the shoulder, about the height of a modern Labrador.",
    ],
  },
  {
    heading: "Several generations later",
    paras: [
      "The Roman writer Arrian described swift Celtic coursing hounds that hunted by sight rather than scent.",
      "These early dogs were types shaped by their work and environments.",
      "There were all kinds of dogs, from fast coursing hounds to powerful guard dogs and small practical workers.",
      "Their names, appearance and purpose could change from place to place and one century to the next.",
    ],
  },
];

export default function AncientFacts() {
  return (
    <div className={styles.grid}>
      {FACTS.map((f) => (
        <section key={f.heading} className={styles.box}>
          <h3 className={styles.boxTitle}>{f.heading}</h3>
          {f.paras.map((p) => (
            <p key={p} className={styles.text}>
              {p}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}
