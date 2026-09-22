import styles from "./PedigreeBoom.module.css";

/* The Victorian dog show boom: a chart and milestones for the 1800s era page
   (/britains-dog-history/1800s), shown after the late-1800s strip. Added
   22 September 2026 (owner chose option B: 1800s data on the 1800s page). Copy
   flagged for owner review.

   Show figures are as reported by the sources at the foot of the panel. Where a
   source says "more than 1,000", the bar is drawn at 1,000 and labelled "1,000+". */

type Show = { year: number; place: string; dogs: number; label: string; note?: string };

const SHOWS: Show[] = [
  { year: 1859, place: "Newcastle upon Tyne", dogs: 60, label: "60", note: "Pointers and setters only" },
  { year: 1860, place: "Birmingham", dogs: 267, label: "267", note: "First show for sporting and other dogs" },
  { year: 1863, place: "Cremorne Gardens, Chelsea", dogs: 1000, label: "1,000+" },
  { year: 1873, place: "Kennel Club show, Crystal Palace", dogs: 975, label: "975" },
  { year: 1874, place: "Birmingham", dogs: 1000, label: "1,000+" },
  { year: 1891, place: "First Cruft's, Islington", dogs: 2437, label: "2,437", note: "36 breeds" },
];

const MAX = Math.max(...SHOWS.map((s) => s.dogs));

const MILESTONES: { year: string; title: string; text: string }[] = [
  {
    year: "1859",
    title: "The first dog show",
    text: "Sixty pointers and setters are judged at Newcastle Town Hall, on their looks rather than their work. The prizes are shotguns.",
  },
  {
    year: "1860",
    title: "A home for lost dogs",
    text: "The Temporary Home for Lost and Starving Dogs opens in London. Today it is Battersea Dogs and Cats Home.",
  },
  {
    year: "1873",
    title: "The Kennel Club",
    text: "Thirteen enthusiasts meet in a three-room London flat and found the world's first national kennel club.",
  },
  {
    year: "1874",
    title: "The first Stud Book",
    text: "The Kennel Club records the pedigrees of 4,027 prize-winning dogs from every show since 1859.",
  },
  {
    year: "1886",
    title: "Charles Cruft's first show",
    text: "A show for terriers only, at the Royal Aquarium in Westminster, draws 570 entries.",
  },
  {
    year: "1891",
    title: "The first Cruft's",
    text: "2,437 entries across 36 breeds fill the Royal Agricultural Hall. Queen Victoria enters six of her Pomeranians.",
  },
];

const SOURCES: { label: string; href: string }[] = [
  { label: "Crufts: history", href: "https://crufts.org.uk/about-us/history/crufts/" },
  { label: "American Kennel Club: history of conformation", href: "https://www.akc.org/expert-advice/sports/history-of-conformation/" },
  { label: "Middleburg Life: the proliferation of dog shows", href: "https://www.middleburglife.com/?p=12631" },
  { label: "Philip Howell, BRANCH: the dog show and the dogs' home", href: "https://branchcollective.org/?ps_articles=philip-howell-june-1859december-1860-the-dog-show-and-the-dogs-home" },
  { label: "The Graphic (1874), via the Victorian Web", href: "https://victorianweb.org/history/animals/2.html" },
  { label: "Wikipedia: Kennel club", href: "https://en.wikipedia.org/wiki/Kennel_club" },
];

export default function PedigreeBoom() {
  return (
    <section className={styles.panel} aria-labelledby="pedigree-boom-title">
      <h2 id="pedigree-boom-title" className={`display ${styles.title}`}>
        The Dog Show <span className="display-yellow">Boom</span>
      </h2>
      <p className={styles.intro}>
        Before 1859 there were no dog shows, no stud books and no breed standards. Within a single lifetime, Victorian Britain created all three.
      </p>

      <h3 className={styles.chartTitle}>Dogs entered at landmark shows</h3>
      <ol className={styles.chart}>
        {SHOWS.map((s) => (
          <li key={`${s.year}-${s.place}`} className={styles.row}>
            <span className={styles.year}>{s.year}</span>
            <span className={styles.barCell}>
              <span className={styles.place}>
                {s.place}
                {s.note ? <span className={styles.note}> ({s.note})</span> : null}
              </span>
              <span className={styles.barTrack}>
                <span className={styles.bar} style={{ width: `${Math.max(2, (s.dogs / MAX) * 100)}%` }} />
                <span className={styles.value}>{s.label}</span>
              </span>
            </span>
          </li>
        ))}
      </ol>

      <h3 className={styles.chartTitle}>Milestones</h3>
      <ol className={styles.milestones}>
        {MILESTONES.map((m) => (
          <li key={m.year} className={styles.milestone}>
            <span className={styles.mYear}>{m.year}</span>
            <h4 className={styles.mTitle}>{m.title}</h4>
            <p className={styles.mText}>{m.text}</p>
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
