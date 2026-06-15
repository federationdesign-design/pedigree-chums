import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import PopHeading from "../../components/PopHeading/PopHeading";
import styles from "./history.module.css";

export const metadata: Metadata = {
  title: "Britain's History of Loving Dogs",
  description:
    "How Britain became a nation of dog lovers: from working animals to royal companions, the first dog show, Battersea and the Kennel Club, to today's pandemic-puppy boom.",
};

type Section = {
  title: string;
  accent: string;
  intro: string;
  bullets: string[];
  detail: string;
  fact: string;
};

const SECTIONS: Section[] = [
  {
    title: "A nation of dog lovers",
    accent: "lovers",
    intro:
      "Few countries are as devoted to their dogs as Britain. That bond runs deep, and it has a long and surprising history behind it. This is the story of how dogs went from working the land to ruling the sofa.",
    bullets: [
      "Dogs have shared British life for thousands of years, long before they were ever called pets.",
      "For most of that history, a dog earned its keep through work, not cuddles.",
      "The idea of a dog as a beloved family companion is more recent than you might think.",
      "Today the UK is home to an estimated 11 to 13 million dogs, and the number keeps climbing.",
    ],
    detail:
      "Britain's love affair with dogs did not happen overnight. It grew over centuries, shaped by farming, hunting, royalty, social change and, more recently, a global pandemic. Each chapter added something to the relationship we now take for granted, where a dog is less an animal we own and more a member of the family.",
    fact: "The UK has one of the highest rates of dog ownership in Europe, second only to a handful of nations.",
  },
  {
    title: "Working roots",
    accent: "roots",
    intro:
      "Long before dogs curled up by the fire, they worked for a living. Across Britain, breeds were shaped by the jobs they were needed to do, and you can still see those jobs written into their bodies and behaviour today.",
    bullets: [
      "Herding breeds like the Border Collie were bred to gather and move livestock across the hills.",
      "Terriers were developed to hunt vermin, going to ground after rats, mice and foxes.",
      "Sighthounds such as the Greyhound and Whippet were built for speed and the chase.",
      "Guarding and draught breeds protected homes, drove cattle and even pulled carts.",
    ],
    detail:
      "A dog's looks are rarely an accident. The Collie's tireless energy, the terrier's boldness, the sighthound's lean frame: each was honed for a purpose over many generations. Understanding that working past is the key to understanding why breeds behave the way they do, a thread that runs right through the pack of cards in your hand.",
    fact: "The word 'terrier' comes from the Latin 'terra', meaning earth, after their habit of digging into burrows to flush out prey.",
  },
  {
    title: "The Victorian turning point",
    accent: "turning point",
    intro:
      "If there is one era that turned the British dog from worker to companion, it is the Victorian age. In just a few decades, dogs moved from the farmyard into the drawing room, and the modern world of pet keeping was born.",
    bullets: [
      "Queen Victoria was a passionate dog lover and owned more than eighty dogs across her lifetime.",
      "Her childhood companion was a Cavalier King Charles Spaniel named Dash, immortalised in royal portraits.",
      "Britain held the world's first organised dog show in Newcastle in 1859.",
      "The Kennel Club was founded in 1873, creating breed standards and formal records.",
    ],
    detail:
      "Victoria's very public affection for her dogs helped make pet keeping fashionable across society. As the middle classes grew, owning a well-bred dog became a mark of taste and gentility. The first dog show, the founding of Battersea Dogs Home in 1860, and the arrival of the Kennel Club all came within a single generation, marking the moment dogs became companions to be celebrated rather than simply animals to be used.",
    fact:
      "The first dog show, held in Newcastle in 1859, was tacked on to a poultry show and only allowed two breeds to compete: Pointers and Setters.",
  },
  {
    title: "Into the modern home",
    accent: "home",
    intro:
      "Through the twentieth century, the dog's place in British life became firmly domestic. No longer just workers or status symbols, dogs settled in as everyday members of the household.",
    bullets: [
      "Dogs became fixtures of family photographs, holidays and daily routines.",
      "Veterinary care, commercial dog food and training advice all grew into established industries.",
      "Certain breeds rose and fell in popularity as fashions and lifestyles changed.",
      "The dog shifted from the yard to the hearth, and often to the foot of the bed.",
    ],
    detail:
      "As Britain became more urban and homes grew more comfortable, dogs came indoors for good. The relationship deepened from usefulness into genuine companionship. By the end of the century, the question was no longer what a dog could do for you, but simply the pleasure of its company, a shift that set the stage for the boom still unfolding today.",
    fact: "Today around 99 percent of UK dog owners consider their dog to be a full member of the family.",
  },
  {
    title: "Today's boom",
    accent: "boom",
    intro:
      "Britain's dog population is bigger than ever, and still growing. A new generation of owners, and a global pandemic, have reshaped which dogs we choose and why.",
    bullets: [
      "The UK dog population has risen sharply, from around 8.2 million in 2011 to between 11 and 13 million today.",
      "More than three million UK households welcomed a new pet during the pandemic.",
      "Younger owners now make up a fast-growing share of the dog-loving population.",
      "Designer crossbreeds like the Cockapoo and Labradoodle have surged in popularity.",
    ],
    detail:
      "The most common breeds tell the story of changing tastes. Among dogs of all ages the classic Labrador still leads, but among puppies the French Bulldog and the Cockapoo have raced to the top, a clear sign of the designer-crossbreed boom. The pack brings both worlds together, the old favourites and the new, each with centuries of history behind them.",
    fact: "Among dogs under one year old, the French Bulldog and Cockapoo now rank among the three most common breeds in the UK.",
  },
];

export default function HistoryPage() {
  return (
    <>
      <Nav />
      <main>
        <section className={styles.intro}>
          <PopHeading className={`display ${styles.title}`}>
            Britain&apos;s history of <span className="display-yellow">loving dogs</span>
          </PopHeading>
          <p className={styles.lead}>
            From working the land to ruling the sofa, here is how Britain became
            the nation of dog lovers it is today.
          </p>
        </section>

        <div className={styles.sections}>
          {SECTIONS.map((s, i) => {
            const prefix = s.title.slice(0, s.title.length - s.accent.length);
            return (
              <section key={i} className={styles.section}>
                <h2 className={`display ${styles.sectionTitle}`}>
                  {prefix}
                  <span className="display-yellow">{s.accent}</span>
                </h2>
                <p className={styles.sectionIntro}>{s.intro}</p>
                <ul className={styles.bullets}>
                  {s.bullets.map((b, j) => (
                    <li key={j}>{b}</li>
                  ))}
                </ul>
                <p className={styles.detail}>{s.detail}</p>
                <div className={styles.fact}>
                  <span className={styles.factLabel}>Did you know?</span>
                  <span className={styles.factText}>{s.fact}</span>
                </div>
              </section>
            );
          })}
        </div>

        <section className={styles.sourceNote}>
          <p>
            Sources: RVC VetCompass, PDSA, UK Pet Food, the Royal Collection Trust,
            English Heritage and Guinness World Records. Population figures are
            estimates and vary by source.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
