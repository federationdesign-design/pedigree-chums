"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./CaiusDogs.module.css";
import { breeds } from "../../data/breeds";

/* Caius's dog family tree: John Caius's 1570s sorting of England's dogs, from De
   Canibus Britannicis (Latin) and Abraham Fleming's 1576 English translation, Of
   Englishe Dogges (Project Gutenberg #27050, public domain). Tudor 'n' Stuart era
   page, added 22 Sept 2026 at the owner's request. The groups and names follow
   Caius's own diagram; the job lines are our plain-English retelling; the
   "Today" lines are our hedged pointers to modern relatives, not pedigrees.
   Copy flagged for owner review. */

/* `img`: the dog type's picture from the history page's own breed strips
   (data/uk-breeds.ts), where one exists; lost types without a card get none.
   `pack`: today's relatives that are in the 54-dog pack, shown with their cartoon
   card art. Lost types have no pack dogs and keep the text only (owner, 22 Sept
   2026). */
type Dog = { id: string; name: string; old: string; job: string; today: string; img?: string; pack?: string[] };
type Group = { label: string; dogs: Dog[] };
type Kind = { id: string; title: string; caius: string; groups: Group[] };

const KINDS: Kind[] = [
  {
    id: "gentle",
    title: "Gentle",
    caius: "Well-bred dogs for hunting and sport",
    groups: [
      {
        label: "Hunting",
        dogs: [
          { id: "harrier", name: "Harrier", old: "Harier", job: "Hunted by smell, with long droopy lips and hanging ears. Each one had its favourite quarry: hare, fox, otter, badger and more.", today: "The Harrier and Beagle families.", img: "/history/breeds/Southern-Hound.jpg", pack: ["Beagle"] },
          { id: "terrier", name: "Terrier", old: "Terrare", job: "The smallest scent hound. It crept down into burrows after foxes and badgers, and nipped them until they bolted.", today: "Britain's many terriers.", img: "/history/breeds/Earth-and-hunt-terrier.jpg", pack: ["Jack Russell Terrier", "Border Terrier", "West Highland Terrier"] },
          { id: "bloodhound", name: "Bloodhound", old: "Blud-hunde", job: "Followed the scent of blood, and was trained to track cattle thieves on the border between England and Scotland.", today: "The Bloodhound.", img: "/bloodhound-square.jpg", pack: ["Bloodhound"] },
          { id: "gazehound", name: "Gazehound", old: "Gasehunde", job: "Hunted by sight, not smell. It picked out one animal from a whole herd and chased it down.", today: "A lost type, though today's sighthounds hunt the same way.", img: "/history/breeds/rough-northern-sighthounds.jpg" },
          { id: "greyhound", name: "Greyhound", old: "Grehunde", job: "The fastest of all, chasing hares, deer and foxes. Caius said its name meant it was top of the dogs.", today: "The Greyhound.", img: "/greyhound-square.jpg", pack: ["Greyhound"] },
          { id: "leviner", name: "Leviner", old: "Leviner", job: "Halfway between a harrier and a greyhound: a good nose and fast legs. It was led on a leash called a lyam.", today: "A lost type. Longdogs and lurchers are the nearest thing today." },
          { id: "tumbler", name: "Tumbler", old: "Tumbler", job: "A trickster. It pretended to ignore the rabbits, lay low by their burrow, then pounced as they came home. Caius said it looked like a small mongrel greyhound.", today: "A lost type, but its job lives on in today's lurchers.", pack: ["Lurcher"] },
          { id: "stealer", name: "Stealer", old: "Night curre", job: "Hunted rabbits silently in the dark and carried them back to its master: a poacher's dog.", today: "A lost type, but its job lives on in today's lurchers.", pack: ["Lurcher"] },
        ],
      },
      {
        label: "Bird dogs",
        dogs: [
          { id: "spaniel", name: "Land spaniel", old: "Spainel", job: "Found and flushed birds for the hunter's hawk. Most were white with big red spots.", today: "Springer and Cocker Spaniels.", img: "/history/breeds/original-land-spaniel.jpg", pack: ["Springer Spaniel", "Cocker Spaniel"] },
          { id: "setter", name: "Setter", old: "Setter", job: "Crept along silently, then lay down to show exactly where the partridges were hiding, ready for the net.", today: "The English and Irish Setters.", img: "/history/breeds/british-setters.jpg", pack: ["Irish Setter"] },
          { id: "water", name: "Water spaniel", old: "Water-spainel, or Fynder", job: "Swam out for ducks, and fetched back arrows that missed their target.", today: "The Irish Water Spaniel. England's own water spaniel is extinct.", img: "/history/breeds/original-water-spaniel.jpg" },
        ],
      },
      {
        label: "Lapdogs",
        dogs: [
          { id: "comforter", name: "Comforter", old: "Spainel-gentle, or Comforter", job: "A tiny pet for fine ladies. People believed its warmth could ease a sore tummy.", today: "Toy spaniels such as the Cavalier King Charles.", img: "/history/breeds/Old-sporting-toy-spaniels.jpg", pack: ["Cavalier King Charles Spaniel"] },
        ],
      },
    ],
  },
  {
    id: "homely",
    title: "Homely",
    caius: "Hard-working dogs for everyday jobs",
    groups: [
      {
        label: "Working",
        dogs: [
          { id: "shepherd", name: "Shepherd's dog", old: "Shepherd's Dog", job: "Moved the sheep at a whistle. Caius noticed that in England the shepherd follows the sheep, not the other way round.", today: "Today's sheepdogs and collies.", img: "/history/breeds/medieval-shepherds-dog.jpg", pack: ["Border Collie", "Old English Sheepdog"] },
          { id: "mastiff", name: "Mastiff or Bandog", old: "Mastive, or Bandedogge", job: "A huge guard dog, chained up by day and let loose at night. Sadly it was also made to fight bears and bulls.", today: "The Mastiff and the bulldogs.", img: "/history/breeds/Old-British-bandogs.jpg", pack: ["Mastiff", "Bulldog"] },
        ],
      },
    ],
  },
  {
    id: "currish",
    title: "Currish",
    caius: "Mixed-up mongrels for odd jobs and tricks",
    groups: [
      {
        label: "Odd jobs",
        dogs: [
          { id: "wappe", name: "Wappe", old: "Wappe, or Warner", job: "Barked to tell the house that visitors had arrived: a furry doorbell.", today: "A lost type." },
          { id: "turnspit", name: "Turnspit", old: "Turnespete", job: "Ran inside a wooden wheel in the kitchen to turn the meat roasting over the fire.", today: "Extinct.", img: "/history/breeds/Turnspitdog-drawing-remake.jpg" },
          { id: "dancer", name: "Dancer", old: "Daunser", job: "Taught by travelling showmen to dance to drums and harps, stand on its hind legs and beg.", today: "A lost type." },
        ],
      },
    ],
  },
];

/* Pack card art for today's relatives, copied from data/breeds.ts (checked 22 Sept
   2026). Kept here rather than importing the whole breed file into this page. */
const PACK_ART: Record<string, string> = {
  Beagle: "/beagle-square.jpg",
  "Jack Russell Terrier": "/jack-russel-square.jpg",
  "Border Terrier": "/border terrier-square.jpg",
  "West Highland Terrier": "/west-highland-square.jpg",
  Bloodhound: "/bloodhound-square.jpg",
  Greyhound: "/greyhound-square.jpg",
  Lurcher: "/lercher-square.jpg",
  "Springer Spaniel": "/springer-square.jpg",
  "Cocker Spaniel": "/cooker-square.jpg",
  "Irish Setter": "/irish-setter-square.jpg",
  "Cavalier King Charles Spaniel": "/cav-spaniel-square.jpg",
  "Border Collie": "/collie-square.jpg",
  "Old English Sheepdog": "/old-english-square.jpg",
  Mastiff: "/mastiff-square.jpg",
  Bulldog: "/bulldog-square.jpg",
};

/* Every name in PACK_ART is one of the 54 chums, so each thumbnail links to that
   dog's page (owner, 23 September 2026). Those pages had almost nothing pointing
   at them, and a reader already looking at the breed is the natural way in. The
   slugs come from data/breeds.ts rather than being typed again, so a renamed chum
   cannot leave a dead link here. */
const CHUM_SLUG: Record<string, string> = Object.fromEntries(breeds.map((b) => [b.name, b.slug]));

const ALL = KINDS.flatMap((k) => k.groups.flatMap((g) => g.dogs.map((d) => ({ ...d, kind: k.title }))));

export default function CaiusDogs() {
  const [sel, setSel] = useState("turnspit");
  const dog = ALL.find((d) => d.id === sel) ?? ALL[0];

  return (
    <section className={styles.panel} aria-labelledby="caius-title">
      <h2 id="caius-title" className={`display ${styles.title}`}>
        1st Book of <span className="display-yellow">Dogs</span>
      </h2>
      <p className={styles.intro}>
        In 1576 Doctor John Caius sorted England&apos;s dogs into three kinds. Tap a dog to see what job it did, and what it became.
      </p>

      <div className={styles.tree}>
        {KINDS.map((k) => (
          <div key={k.id} className={styles.kind}>
            <h3 className={`display ${styles.kindTitle}`}>{k.title}</h3>
            <p className={styles.kindQuote}>{k.caius}</p>
            {k.groups.map((g) => (
              <div key={g.label} className={styles.group}>
                <span className={styles.groupLabel}>{g.label}</span>
                <div className={styles.chips}>
                  {g.dogs.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      className={styles.chip}
                      aria-pressed={sel === d.id}
                      onClick={() => setSel(d.id)}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className={styles.card} aria-live="polite">
        <div className={styles.cardHead}>
          {dog.img && (
            <Image
              src={encodeURI(dog.img)}
              alt=""
              width={96}
              height={96}
              className={styles.profile}
              unoptimized
            />
          )}
          <div>
            <span className={styles.cardKind}>{dog.kind} kind</span>
            <h3 className={`display ${styles.cardName}`}>{dog.name}</h3>
            <p className={styles.cardOld}>Caius called it: &ldquo;{dog.old}&rdquo;</p>
          </div>
        </div>
        <p className={styles.cardJob}>{dog.job}</p>
        <p className={styles.cardToday}>
          <span className={styles.todayLabel}>Today:</span> {dog.today}
        </p>
        {dog.pack && (
          <ul className={styles.packRow} aria-label="In the Pedigree Chums pack">
            {dog.pack.map((n) => (
              <li key={n} className={styles.packDog}>
                {CHUM_SLUG[n] ? (
                  <Link href={`/chums/${CHUM_SLUG[n]}`} className={styles.packLink} aria-label={n}>
                    <Image src={encodeURI(PACK_ART[n])} alt="" width={56} height={56} className={styles.packImg} unoptimized />
                    <span className={styles.packName}>{n}</span>
                  </Link>
                ) : (
                  <>
                    <Image src={encodeURI(PACK_ART[n])} alt="" width={56} height={56} className={styles.packImg} unoptimized />
                    <span className={styles.packName}>{n}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Why some of Caius's dogs have no level (owner request, 22 Sept 2026). The
          lurcher link follows Caius's own description of the Tumbler as like "a
          mungrell Grehounde" and the Stealer as a silent night rabbit-catcher; the
          word lurcher, from "lurch" (to lurk or steal), is first used for a dog in
          1668 (Wikipedia, Lurcher). */}
      <div className={styles.why}>
        <h3 className={styles.whyTitle}>Why don&apos;t all these dogs appear in our timeline?</h3>
        <p className={styles.whyText}>
          Caius named dogs by the job they did, not by breed, and most of those jobs never became breeds of their own. The Gazehound hunted by sight, much like our Rough northern sighthounds. The Wappe and the Dancer were mongrels, like our Cur. The Leviner was an in-between hound that has simply been lost. And the Tumbler and the Stealer were crafty poachers&apos; dogs whose job lives on in today&apos;s Lurcher.
        </p>
      </div>

      <p className={styles.note}>
        Source: John Caius, Of Englishe Dogges, translated by Abraham Fleming, 1576 (public domain, Project Gutenberg).
      </p>
    </section>
  );
}
