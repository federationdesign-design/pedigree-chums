import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import styles from "./good-dog-bad-dog.module.css";

export const metadata: Metadata = {
  title: "Good Dog, Bad Dog | Pedigree Chums™",
  description: "A series of essays exploring how dogs are portrayed in stories, legends and popular culture -- and what those portrayals really say about the breeds behind the image.",
  robots: "noindex",
};

const ESSAYS = [
  {
    slug: "bulls-eye",
    tag: "Bad dog", tagStyle: "tagBad",
    breed: "Bull Terrier",
    title: "Bull's-eye: The Dog as the Owner's Shadow",
    summary: "Bull's-eye belongs to Bill Sikes, one of Dickens's most violent characters. He is not simply a bad dog -- he is a dog made to carry a bad man's reputation.",
    image: "/bulls-eye-img.jpg",
  },
  {
    slug: "gelert",
    tag: "Good dog", tagStyle: "tagGood",
    breed: "Irish Wolfhound",
    title: "Gelert: The Dog Who Couldn't Explain Himself",
    summary: "Llywelyn the Great returns from the hunt to find his hound covered in blood and the cradle empty. A legend about what happens when a powerful dog cannot defend itself against the story told about it.",
    image: "/gelert-painting.jpg",
  },
  {
    slug: "hound-of-the-baskervilles",
    tag: "Bad dog", tagStyle: "tagBad",
    breed: "Bloodhound / Mastiff",
    title: "The Hound of the Baskervilles: How a Dog Was Made into a Monster",
    summary: "The hound is eventually revealed to be a real animal -- kept, coated in phosphorus and deliberately released by a human murderer. The dog supplies the teeth. The human supplies the motive.",
    image: "/hound-of-the-baskervilles.jpg",
  },
  {
    slug: "lassie",
    tag: "Good dog", tagStyle: "tagGood",
    breed: "Rough Collie",
    title: "Lassie: The Burden of Being the Perfect Dog",
    summary: "Lassie never makes a mistake. She is not a dog. She is a heroic design. And that is where the real breed pays the price.",
    image: "/lassie-img.jpg",
  },
  {
    slug: "argos",
    tag: "Good dog", tagStyle: "tagGood",
    breed: "Ancient Greek Hunting Hound",
    title: "Argos: The Dog Who Knew His Master",
    summary: "Before Lassie, before Greyfriars Bobby, there was Argos. Homer's dog from The Odyssey waited twenty years for his master to return.",
    image: "/history/Argos-hero.jpg",
  },
  {
    slug: "greyfriars-bobby",
    tag: "Good dog", tagStyle: "tagGood",
    breed: "Skye Terrier",
    title: "Greyfriars Bobby: Loyalty, Legend and the Making of a National Dog",
    summary: "A small terrier lived near Greyfriars Kirkyard for fourteen years after his master's death. An essay on what happens when a real dog is gradually transformed into the perfect good dog.",
    image: "/greyfryers-bobby.jpg",
  },
];

export default function GoodDogBadDogPage() {
  return (
    <>
      <Nav showLogo />
      <main className={styles.page}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>An essay series</p>
          <h1 className={styles.title}>
            Good Dog,<br />
            <span className={styles.titleAccent}>Bad Dog</span>
          </h1>
          <p className={styles.intro}>
            Fictional dogs are rarely just dogs. They get cast as heroes, monsters,
            loyal companions and dangerous outsiders. Their size, breed and appearance
            become shorthand for the role the story needs them to play.
          </p>
          <p className={styles.intro}>
            This series looks at some of the most famous dog stories and legends and asks what effect this has had on our conceptions of the actual breeds and the effect of that portrayal.
          </p>
        </header>

        {/* ── Desktop grid ── */}
        <section className={styles.grid}>
          {ESSAYS.map((essay) => (
            <article key={essay.slug} className={styles.card}>
              <div className={styles.cardMeta}>
                <span className={`${styles.tag} ${styles[essay.tagStyle as keyof typeof styles]}`}>{essay.tag}</span>
                <span className={styles.cardBreed}>{essay.breed}</span>
              </div>
              <h2 className={styles.cardTitle}>{essay.title}</h2>
              <p className={styles.cardSummary}>{essay.summary}</p>
              <Link href={`/good-dog-bad-dog/${essay.slug}`} className={styles.readMore}>
                Read the essay →
              </Link>
            </article>
          ))}
        </section>

        {/* ── Mobile carousel ── */}
        <section className={styles.mobileCarousel}>

          {/* Intro slide -- first card */}
          <div className={styles.mobileSlide}>
            <div className={styles.mobileIntroSlide}>
              <p className={styles.eyebrow}>An essay series</p>
              <h1 className={styles.mobileIntroTitle}>
                Good Dog,<br />
                <span className={styles.titleAccent}>Bad Dog</span>
              </h1>
              <p className={styles.mobileIntroText}>
                Fictional dogs are rarely just dogs. They get cast as heroes, monsters,
                loyal companions and dangerous outsiders. Their size, breed and appearance
                become shorthand for the role the story needs them to play.
              </p>
              <p className={styles.mobileIntroText}>
                This series looks at some of the most famous dog stories and legends
                and asks what effect this has had on our conceptions of the actual breeds.
              </p>
              <p className={styles.mobileIntroHint}>Swipe to read the essays →</p>
            </div>
          </div>

          {ESSAYS.map((essay, i) => (
            <div key={essay.slug} className={styles.mobileSlide}>
              {/* Top half: hero image */}
              <div className={styles.mobileSlideImg}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={essay.image} alt={essay.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <div className={styles.mobileSlideImgTint} />
                {/* Slide counter */}
                <div className={styles.mobileSlideCount}>
                  {i + 1} / {ESSAYS.length}
                </div>
              </div>
              {/* Bottom half: info panel */}
              <div className={styles.mobileSlideInfo}>
                <div className={styles.mobileSlideTag}>
                  <span className={`${styles.tag} ${styles[essay.tagStyle as keyof typeof styles]}`}>{essay.tag}</span>
                  <span className={styles.mobileSlideBreed}>{essay.breed}</span>
                </div>
                <h2 className={styles.mobileSlideTitle}>{essay.title}</h2>
                <p className={styles.mobileSlideSummary}>{essay.summary}</p>
                <Link href={`/good-dog-bad-dog/${essay.slug}`} className={styles.readMore}>
                  Read the essay →
                </Link>
              </div>
            </div>
          ))}
        </section>
      </main>
      <Footer />
    </>
  );
}
