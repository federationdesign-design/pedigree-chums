import type { Metadata } from "next";
import Image from "next/image";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import PopHeading from "../../components/PopHeading/PopHeading";
import styles from "./history.module.css";

export const metadata: Metadata = {
  title: "Britain's History of Loving Dogs",
  description:
    "How Britain became a nation of dog lovers: from working dogs and war mascots to Greyfriars Bobby, Crufts and the Victorian pet boom, right up to today's designer crossbreeds.",
};

type Section = {
  title: string;
  accent: string;
  intro: string;
  bullets: string[];
  detail: string;
  fact: string;
  image: string; // /history/<name>.jpg image path; drop art in later
  imageAlt: string;
};

const SECTIONS: Section[] = [
  {
    title: "Working roots",
    accent: "roots",
    intro:
      "Long before dogs curled up by the fire, they worked for a living. Across Britain, breeds were shaped by the jobs they were needed to do, and you can still see those jobs written into their bodies and behaviour today.",
    bullets: [
      "Herding breeds like the Border Collie were bred to gather and move livestock across the hills.",
      "Terriers were developed to hunt vermin, going to ground after rats, mice and foxes.",
      "Sighthounds such as the Greyhound and Whippet were built for speed and the chase.",
      "Guarding and droving breeds protected homes and moved cattle to market.",
    ],
    detail:
      "A dog's looks are rarely an accident. The Collie's tireless energy, the terrier's boldness, the sighthound's lean frame: each was honed for a purpose over many generations. Understanding that working past is the key to understanding why breeds behave the way they do, a thread that runs right through the pack.",
    fact:
      "The word 'terrier' comes from the Latin 'terra', meaning earth, after their habit of digging into burrows to flush out prey.",
    image: "/history/working-roots.jpg",
    imageAlt: "A working sheepdog herding livestock on a British hillside",
  },
  {
    title: "Dogs in the armed forces",
    accent: "armed forces",
    intro:
      "Dogs have marched alongside British soldiers for centuries, as scouts, messengers, guards and mascots. The most famous of all was a white poodle who became a legend of the English Civil War.",
    bullets: [
      "Boy was a white hunting poodle belonging to the Royalist commander Prince Rupert of the Rhine.",
      "He followed his master onto the battlefield and was killed at the Battle of Marston Moor in 1644.",
      "Royalist soldiers adored him and reportedly gave him the rank of Sergeant-Major-General.",
      "He is often remembered as the first official British Army dog.",
    ],
    detail:
      "Boy was so well known that enemy pamphlets spread wild rumours about him, claiming the dog had magical powers and could not be harmed by weapons. It was propaganda, of course, and at Marston Moor it proved sadly untrue. Yet the little white poodle had already secured his place in British military memory, the first in a long line of dogs to serve the nation.",
    fact:
      "Parliamentarian propaganda during the Civil War seriously claimed Prince Rupert's poodle was a witch in disguise.",
    image: "/history/armed-forces.jpg",
    imageAlt: "A 17th-century white poodle beside a Civil War cavalier",
  },
  {
    title: "Dogs in London",
    accent: "London",
    intro:
      "In the bustling streets of Victorian London, dogs were not just companions, they were engines of trade. For decades, teams of dogs hauled carts of goods through the capital, until the law stepped in.",
    bullets: [
      "Working dogs pulled small carts of milk, bread, fish and other goods for street traders.",
      "The Metropolitan Police Act of 1839 banned dog-drawn carts within 15 miles of Charing Cross.",
      "A national ban on the public highways followed in 1854.",
      "The campaign against dog-carts helped shape Britain's early animal-welfare laws.",
    ],
    detail:
      "The ban was meant to spare dogs from cruelty and to stop carts spooking horses in crowded streets, but it had a heartbreaking side. With the dogs no longer able to earn their keep, many traders could not afford to feed them, and thousands of working dogs were lost. It was a grim chapter, yet it pushed Britain toward treating dogs as animals deserving of protection.",
    fact:
      "One estimate suggests the 1839 London ban alone led to the loss of more than 3,000 working dogs almost overnight.",
    image: "/history/dogs-in-london.jpg",
    imageAlt: "A Victorian street trader with a dog-drawn cart in London",
  },
  {
    title: "The Victorian turning point",
    accent: "turning point",
    intro:
      "If one era turned the British dog from worker to companion, it is the Victorian age. In just a few decades, dogs moved from the farmyard into the drawing room, and modern pet keeping was born.",
    bullets: [
      "Queen Victoria was a devoted dog lover who owned more than eighty dogs across her lifetime.",
      "Her childhood companion was a Cavalier King Charles Spaniel named Dash, painted by royal artists.",
      "Britain held the world's first organised dog show in Newcastle in 1859.",
      "Battersea Dogs Home opened in 1860 and the Kennel Club followed in 1873.",
    ],
    detail:
      "Victoria's very public affection for her dogs helped make pet keeping fashionable across society. As the middle classes grew, a well-bred dog became a mark of taste and gentility. The first dog show, the founding of Battersea and the arrival of the Kennel Club all came within a single generation, the moment dogs became companions to be celebrated rather than simply animals to be used.",
    fact:
      "The first dog show, held in Newcastle in 1859, was tacked on to a poultry show and only allowed Pointers and Setters to compete.",
    image: "/history/victorian.jpg",
    imageAlt: "A Victorian lady with a small spaniel companion",
  },
  {
    title: "Dogs in popular culture",
    accent: "culture",
    intro:
      "Some dogs become more than pets, they become legends. No British dog story is more beloved than that of Greyfriars Bobby, the little terrier whose loyalty captured a nation's heart.",
    bullets: [
      "Bobby was a Skye Terrier belonging to John Gray, a night watchman for the Edinburgh City Police.",
      "After Gray died in 1858, Bobby reportedly refused to leave his master's grave.",
      "The story says he kept watch over the grave for fourteen years until his own death in 1872.",
      "A statue and fountain were raised in his honour, and still draw visitors today.",
    ],
    detail:
      "Historians gently point out that the tale has grown in the telling, and the details are hard to prove. But whether legend or fact, Bobby became a symbol of the devotion a dog can show, retold in books and films ever since. His statue in Edinburgh remains one of Scotland's best-loved landmarks, a monument to the bond between people and their dogs.",
    fact:
      "Greyfriars Bobby's headstone reads: 'Let his loyalty and devotion be a lesson to us all.'",
    image: "/history/popular-culture.jpg",
    imageAlt: "The Greyfriars Bobby statue in Edinburgh",
  },
  {
    title: "Dog shows",
    accent: "shows",
    intro:
      "Once dogs became companions worth celebrating, Britain found a new way to honour them: the dog show. From modest beginnings grew Crufts, the most famous dog show in the world.",
    bullets: [
      "Crufts was founded by showman Charles Cruft and first held in 1891 in Islington, London.",
      "The famous Best in Show title was not introduced until 1928.",
      "The first ever Best in Show winner was a Greyhound named Primley Sceptre.",
      "Crufts is now recognised as the largest dog show in the world.",
    ],
    detail:
      "Charles Cruft had a genius for promotion, and his show quickly became the highlight of the canine calendar. The arrival of the Best in Show award in 1928 gave the event its crowning moment, and that first winner, a Greyhound chosen from nearly ten thousand competitors, set the tone for a contest that still captivates the nation every spring.",
    fact:
      "Primley Sceptre, the first Best in Show winner, was picked from an entry of 9,466 dogs and described by the judge as 'faultless'.",
    image: "/history/dog-shows.jpg",
    imageAlt: "A Greyhound being presented in a dog show ring",
  },
  {
    title: "Into the modern home",
    accent: "home",
    intro:
      "Through the twentieth century, the dog's place in British life became firmly domestic. No longer just workers or status symbols, dogs settled in as everyday members of the household.",
    bullets: [
      "Dogs became fixtures of family photographs, holidays and daily routines.",
      "Veterinary care, commercial dog food and training advice grew into established industries.",
      "Breeds rose and fell in popularity as fashions and lifestyles changed.",
      "The dog moved from the yard to the hearth, and often to the foot of the bed.",
    ],
    detail:
      "As Britain became more urban and homes grew more comfortable, dogs came indoors for good. The relationship deepened from usefulness into genuine companionship. By the end of the century, the question was no longer what a dog could do for you, but simply the pleasure of its company, a shift that set the stage for the boom still unfolding today.",
    fact:
      "Today around 99 percent of UK dog owners consider their dog to be a full member of the family.",
    image: "/history/modern-home.jpg",
    imageAlt: "A family relaxing at home with their pet dog",
  },
  {
    title: "Today's boom",
    accent: "boom",
    intro:
      "Britain's dog population is bigger than ever, and still growing. A new generation of owners, and a global pandemic, have reshaped which dogs we choose and why.",
    bullets: [
      "The UK dog population has risen from around 8.2 million in 2011 to between 11 and 13 million today.",
      "More than three million UK households welcomed a new pet during the pandemic.",
      "Younger owners now make up a fast-growing share of the dog-loving population.",
      "Designer crossbreeds like the Cockapoo and Labradoodle have surged in popularity.",
    ],
    detail:
      "The most common breeds tell the story of changing tastes. Among dogs of all ages the classic Labrador still leads, but among puppies the French Bulldog and the Cockapoo have raced to the top, a clear sign of the designer-crossbreed boom. The pack brings both worlds together, the old favourites and the new, each with centuries of history behind them.",
    fact:
      "Among dogs under one year old, the French Bulldog and Cockapoo now rank among the three most common breeds in the UK.",
    image: "/history/todays-boom.jpg",
    imageAlt: "A modern Cockapoo, one of Britain's most popular dogs today",
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
            Britain is a nation of dog lovers, and that bond runs deep. From working
            the land to ruling the sofa, here is the story of how dogs became part
            of who we are.
          </p>
        </section>

        <div className={styles.sections}>
          {SECTIONS.map((s, i) => {
            const prefix = s.title.slice(0, s.title.length - s.accent.length);
            return (
              <section key={i} className={styles.section}>
                <div className={styles.imageSlot}>
                  <Image
                    src={s.image}
                    alt={s.imageAlt}
                    width={760}
                    height={320}
                    className={styles.sectionImg}
                    unoptimized
                  />
                </div>
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
            Historic UK, the Kennel Club / Crufts and Guinness World Records. Some
            historical tales are popular legend, and population figures are estimates
            that vary by source.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
