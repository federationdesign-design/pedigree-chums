import styles from "./AncientFacts.module.css";

/* Three boxed facts for the Ancient era page, below the map and timeline.
   Text taken from the owner's social slides (slide1b, slide2, slide4), 22 Sept
   2026, with light copy fixes: "there" to "their", "A Roman writer Arrian" to
   "The Roman writer Arrian", and the guard dogs sentence given a verb. The image
   caption on slide 2 ("no doubt a very good boy") is left out, as the image is
   not used here. The Star Carr height sentence was added 22 Sept 2026 to balance
   the middle box: Harcourt (1974), as cited in Journal of Archaeological Science
   (2010), https://www.sciencedirect.com/science/article/abs/pii/S0305440310001974 */

export type Fact = { heading: string; paras: string[] };

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

/* Medieval page boxes (owner request, 22 Sept 2026). Sources: Domesday shares,
   encyclopedia.com "tenants-in-chief"; forest extent and "not always wooded",
   Charter of the Forest summaries; dogs' toes and bows banned, encyclopedia.com
   "forest laws" (Assize of the Forest, 1184); firewood and pig grazing restored,
   History Hit on the 1217 Charter, clause 9. */
export const MEDIEVAL_FACTS: Fact[] = [
  {
    heading: "The Domesday Book (1086)",
    paras: [
      "Twenty years after conquering England, William the Conqueror had his officials record who held what: land, animals, mills and people, in almost every corner of England.",
      "It showed the king kept about a fifth of the land for himself, the church held about a quarter, and his barons held about half.",
    ],
  },
  {
    heading: "A forest without trees?",
    paras: [
      "A royal forest was not always a wood. It could include heaths, fields, wetlands and even whole villages.",
      "By the early 1200s, almost a third of England was under the king's forest law, and the deer and wild boar living there belonged to the king alone.",
    ],
  },
  {
    heading: "Mind your dog's toes!",
    paras: [
      "Inside a royal forest, nobody could carry a bow and arrows, and dogs had their toes clipped so they could not chase the king's deer.",
      "In 1217 the Charter of the Forest gave ordinary people some of their rights back, like collecting firewood and letting their pigs graze.",
    ],
  },
];

/* `facts` lets other era pages reuse the same heading, boxes and styling
   (22 Sept 2026); Ancient passes nothing and gets its own boxes as before. */
export default function AncientFacts({ facts = FACTS }: { facts?: Fact[] }) {
  return (
    <>
      {/* Section heading above the three boxes (owner request, 22 Sept 2026). */}
      <h2 className={`display ${styles.factsTitle}`}>
        Did <span className="display-yellow">you</span> know?
      </h2>
    <div className={styles.grid}>
      {facts.map((f) => (
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
    </>
  );
}
