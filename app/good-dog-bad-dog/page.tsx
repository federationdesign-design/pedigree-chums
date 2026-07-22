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
    slug: "anubis",
    tag: "Bad dog", tagStyle: "tagBad",
    breed: "Egyptian jackal / African golden wolf",
    title: "Anubis: The Grave-Robber We Made a God",
    summary: "The Egyptians made a dog the god of death -- and it turns out almost everyone did. From a jackal digging up desert graves to a Suffolk hellhound, an essay on the dog we keep posting at the door of the dark, and why we thanked it by turning its name into an insult.",
  },
  {
    slug: "bulls-eye",
    tag: "Bad dog", tagStyle: "tagBad",
    breed: "Bull Terrier",
    title: "Bull's-eye: The Dog as the Owner's Shadow",
    summary: "Bull's-eye belongs to Bill Sikes, one of Dickens's most violent characters. He is not simply a bad dog -- he is a dog made to carry a bad man's reputation. An essay on Oliver Twist, the status dog and what happens when an animal becomes the emblem of human threat.",
  },
  {
    slug: "gelert",
    tag: "Good dog", tagStyle: "tagGood",
    breed: "Irish Wolfhound",
    title: "Gelert: The Dog Who Couldn't Explain Himself",
    summary: "Llywelyn the Great returns from the hunt to find his hound covered in blood and the cradle empty. He draws his sword. Only after Gelert is dead does the truth become clear. A legend about what happens when a powerful dog cannot defend itself against the story told about it.",
  },
  {
    slug: "hound-of-the-baskervilles",
    tag: "Bad dog", tagStyle: "tagBad",
    breed: "Bloodhound / Mastiff",
    title: "The Hound of the Baskervilles: How a Dog Was Made into a Monster",
    summary: "The hound is eventually revealed to be a real animal -- kept, coated in phosphorus and deliberately released by a human murderer. The dog supplies the teeth. The human supplies the motive. An essay on how fiction manufactures monstrosity and lets the animal carry the blame.",
  },
  {
    slug: "lassie",
    tag: "Good dog", tagStyle: "tagGood",
    breed: "Rough Collie",
    title: "Lassie: The Burden of Being the Perfect Dog",
    summary: "Lassie never makes a mistake. She knows when someone is in danger, travels hundreds of miles to find help and always does the right thing. She is not a dog. She is a heroic design. And that is where the real breed pays the price.",
  },
  {
    slug: "argos",
    tag: "Good dog", tagStyle: "tagGood",
    breed: "Ancient Greek Hunting Hound",
    title: "Argos: The Dog Who Knew His Master",
    summary: "Before Lassie, before Greyfriars Bobby, there was Argos. Homer's dog from The Odyssey waited twenty years for his master to return. An essay on loyalty, home, the smell of memory, and what the oldest dog reunion in literature still tells us about ourselves.",
  },
  {
    slug: "greyfriars-bobby",
    tag: "Good dog", tagStyle: "tagGood",
    breed: "Skye Terrier",
    title: "Greyfriars Bobby: Loyalty, Legend and the Making of a National Dog",
    summary: "A small terrier lived near Greyfriars Kirkyard for fourteen years after his master's death. A city watched, fed him, photographed him and eventually cast him in bronze. An essay on what happens when a real dog is gradually transformed into the perfect good dog.",
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
      </main>
      <Footer />
    </>
  );
}
