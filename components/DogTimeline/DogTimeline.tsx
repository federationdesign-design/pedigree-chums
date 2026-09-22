import styles from "./DogTimeline.module.css";

/* Britain's first dogs: an archaeology timeline for the Ancient era page
   (/britains-dog-history/ancient), shown below the sea level map. Added
   22 September 2026 at the owner's request. Copy flagged for owner review.

   Starts at Gough's Cave, 14,300 years ago (owner request, 22 Sept 2026): the
   wolf-to-dog and Türkiye entries and the Britain / wider-world key were removed.

   Dates are as reported by the sources listed at the foot of the panel. Star Carr
   is given as about 11,000 years ago: the site was first occupied then, and its
   dog was dated to about 9,500 radiocarbon years BP, which is older in calendar
   years. Some popular articles quote the uncalibrated 9,500 as "years ago". */

type Entry = { when: string; title: string; text: string; uk?: boolean };

const ENTRIES: Entry[] = [
  {
    when: "14,300 years ago",
    title: "Gough's Cave, Somerset",
    uk: true,
    text: "A jawbone from Gough's Cave in Cheddar Gorge was tested by the Natural History Museum and proved to be a dog, not a wolf. It is the oldest dog yet found in Britain. It lived with Ice Age hunters, and its remains seem to have been handled after death in similar ways to the human remains found in the cave.",
  },
  {
    when: "About 11,000 years ago",
    title: "Star Carr, North Yorkshire",
    uk: true,
    text: "At a lakeside hunting camp near Scarborough, archaeologists found a dog's skull and leg bones. Doggerland still joined Britain to Europe, so people and their dogs could walk here.",
  },
  {
    when: "About 8,000 years ago",
    title: "Britain becomes an island",
    uk: true,
    text: "Rising seas drowned the last of the land bridge. From then on, any new dogs had to arrive by boat.",
  },
  {
    when: "About 5,000 years ago",
    title: "Farmers' dogs reach Scotland",
    uk: true,
    text: "DNA from dogs at Neolithic sites in Orkney and Caithness shows that about a quarter of their ancestry came from dogs brought by incoming farmers. The rest came from Britain's older hunter-gatherer dogs.",
  },
];

const SOURCES: { label: string; href: string }[] = [
  { label: "Natural History Museum (2026)", href: "https://www.nhm.ac.uk/discover/news/2026/march/oldest-evidence-of-domestic-dogs.html" },
  { label: "Nature (2026): dogs in Palaeolithic western Eurasia", href: "https://doi.org/10.1038/s41586-026-10170-x" },
  { label: "Nature (2026): genomic history of early dogs in Europe", href: "https://www.nature.com/articles/s41586-026-10112-7" },
  { label: "Degerbøl (1961): the Star Carr dog", href: "https://www.cambridge.org/core/journals/proceedings-of-the-prehistoric-society/article/abs/on-a-find-of-a-preboreal-domestic-dog-canis-familiaris-l-from-star-carr-yorkshire-with-remarks-on-other-mesolithic-dogs/5AD182C21A7D3D0A2E9949D00F6C7F53" },
];

export default function DogTimeline() {
  return (
    <section className={styles.panel} aria-labelledby="dog-timeline-title">
      <h2 id="dog-timeline-title" className={`display ${styles.title}`}>
        Britain&apos;s First <span className="display-yellow">Dogs</span>
      </h2>
      <p className={styles.intro}>
        Bones and ancient DNA tell us when dogs first padded across Britain. This is what archaeologists have found so far.
      </p>

      <ol className={styles.timeline}>
        {ENTRIES.map((e) => (
          <li key={e.title} className={`${styles.item} ${e.uk ? styles.uk : ""}`}>
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.when}>{e.when}</span>
            <h3 className={styles.itemTitle}>{e.title}</h3>
            <p className={styles.text}>{e.text}</p>
          </li>
        ))}
      </ol>

      <p className={styles.sources}>
        Sources:{" "}
        {SOURCES.map((s, i) => (
          <span key={s.href}>
            <a href={s.href} target="_blank" rel="noopener noreferrer">
              {s.label}
            </a>
            {i < SOURCES.length - 1 ? "; " : "."}
          </span>
        ))}
      </p>
    </section>
  );
}
