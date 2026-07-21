import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import styles from "./dogs-at-work.module.css";

export const metadata: Metadata = {
  title: "Dogs at Work | Pedigree Chums™",
  description:
    "Britain's working dogs are an invisible workforce -- felt emotionally, but rarely counted economically. A series on the dogs that help Britain function, and the question behind every wagging tail: if dogs give us this much, what do we owe them back?",
  robots: "noindex",
};

const ARTICLES = [
  {
    slug: "the-dogs-teaching-medicine-how-to-smell-disease",
    tag: "Medical",
    breed: "Bio-detection dogs",
    title: "The Dogs Teaching Medicine How to Smell Disease",
    summary:
      "In 2025, two dogs called Bumper and Peanut sniffed out Parkinson's disease in a double-blind trial with up to 98% specificity. They are not replacing doctors. They may be doing something stranger: proving disease has a smell, so the machines of the future know what to look for. The dog doesn't become the machine. The dog invents it.",
  },
  {
    slug: "the-colleague-who-never-clocks-off",
    tag: "Medical",
    breed: "Medical alert dogs",
    title: "The Colleague Who Never Clocks Off",
    summary:
      "A medical alert dog learns one person so completely it can warn them their own body is about to go wrong -- often before they know themselves. That's not a pet. That's a colleague. Even if the only wages are dinner and the occasional stolen sausage.",
  },
];

const COMING = [
  { tag: "Public service", name: "Police & Border Force dogs", desc: "Tracking, searching, and the noses that screen a border before anyone opens a suitcase." },
  { tag: "Rural", name: "Sheepdogs", desc: "One of the oldest and most economically important dog jobs in Britain -- a farm worker with four legs." },
  { tag: "Emergency", name: "Search & rescue dogs", desc: "Air-scenting and trailing dogs that find missing people when time is running out." },
  { tag: "Science", name: "Conservation detection dogs", desc: "Finding newts, invasive species and tree disease that humans simply cannot see." },
  { tag: "Wildcard", name: "Water-leak detection dogs", desc: "Yes, really -- dogs that sniff out leaks in the water network. Almost nobody knows they exist." },
  { tag: "Independence", name: "Assistance & guide dogs", desc: "The clearest economic case of all: a life lived independently, measured in more than sentiment." },
];

export default function DogsAtWorkPage() {
  return (
    <>
      <Nav showLogo />
      <main className={styles.page}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>An essay series</p>
          <h1 className={styles.title}>
            Dogs at<br />
            <span className={styles.titleAccent}>Work</span>
          </h1>
          <p className={styles.intro}>
            Working dogs do not know they have jobs. To a sheepdog, moving livestock is instinct,
            training and the best game in the world. To a detection dog, finding the scent is a puzzle
            with a reward at the end. To a medical alert dog, noticing that their human smells wrong is
            not a shift pattern. It is just what they do.
          </p>
          <p className={styles.intro}>
            It only becomes work when humans benefit from it. This series looks at the dogs that help
            Britain function -- the noses at the border, the paws on the hills, the search dogs in the
            woods, the assistance dogs beside their people, and the bio-detection dogs helping scientists
            ask whether disease has a smell.
          </p>
          <p className={styles.intro}>
            They are paid in food, shelter, praise, tennis balls, head strokes and the occasional stolen
            sausage. But their value is measured in time, safety, independence, science and trust. This is
            about that hidden workforce, and the question behind every wagging tail:
            <strong> if dogs give us this much, what do we owe them back?</strong>
          </p>
        </header>

        <section className={styles.grid}>
          {ARTICLES.map((a) => (
            <article key={a.slug} className={styles.card}>
              <div className={styles.cardMeta}>
                <span className={`${styles.tag} ${styles.tagGood}`}>{a.tag}</span>
                <span className={styles.cardBreed}>{a.breed}</span>
              </div>
              <h2 className={styles.cardTitle}>{a.title}</h2>
              <p className={styles.cardSummary}>{a.summary}</p>
              <Link href={`/dogs-at-work/${a.slug}`} className={styles.readMore}>
                Read the essay →
              </Link>
            </article>
          ))}
        </section>

        <section className={styles.coming}>
          <h2 className={styles.comingTitle}>Coming to the workforce</h2>
          <div className={styles.comingGrid}>
            {COMING.map((c) => (
              <div key={c.name} className={styles.comingCard}>
                <span className={styles.comingTag}>{c.tag}</span>
                <p className={styles.comingName}>{c.name}</p>
                <p className={styles.comingDesc}>{c.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
