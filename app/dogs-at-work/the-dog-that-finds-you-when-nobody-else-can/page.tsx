import type { Metadata } from "next";
import * as React from "react";
import Link from "next/link";
import Nav from "../../../components/Nav/Nav";
import Footer from "../../../components/Footer/Footer";
import styles from "../dogs-at-work.module.css";
import Payslip from "../../../components/Payslip/Payslip";
import SidebarCard from "../../../components/DogsAtWork/SidebarCard";
import sidebar from "../../../components/DogsAtWork/SidebarCard.module.css";
import MobileArticleBody, { type ArticleCard } from "../../../components/DogsAtWork/MobileArticleBody";
import { PAYSLIPS } from "../data/payslips";

export const metadata: Metadata = {
  title: "The Dog That Finds You When Nobody Else Can | Dogs at Work | Pedigree Chums™",
  // Meta description drawn from the index card dek (supplied by Steve, 11 Aug).
  description:
    "Air scent, trailing, water. A dog covers ground people cannot, in the dark, in the rain, for a toy and a bit of praise.",
  robots: "noindex",
};

// Article 5 body, transcribed verbatim from the supplied copy
// (docs/dogs-at-work/reference/search_rescue_article_copy.md), above the SIDEBAR
// MODULES / WORKING NOTES divider. Headings are sentence-cased; the .subhead rule
// uppercases them. The sidebar modules (payslip, three ways to search, what the
// dog thinks, the honest version, sources) come from the SIDEBAR MODULES section,
// not the body, so nothing is lifted out of the body here.
const BODY: (string | { h: string; id: string })[] = [
  "Somewhere on a British hillside, woodland or moor, somebody has gone missing. It may be dark. The weather may be closing in. Rescue teams can search paths, valleys and likely routes, but a person lying behind a wall, down a bank or among dense vegetation can be frighteningly easy to miss.",
  "Then the dog arrives.",
  "To us, this is a search for a vulnerable or injured person where every minute may matter. To the dog, the problem is beautifully simple. There is human scent somewhere out there. Find where it gets stronger. Find the person. Tell the handler.",
  "Search and rescue dogs in the UK work alongside volunteer rescue teams in all kinds of weather, including at night, when human searchers may have very little chance of spotting somebody away from a path. Mountain Rescue England and Wales says dog teams are particularly valuable in those difficult conditions.",
  "It is one of the rare jobs where being extremely nosy can become a genuine emergency service.",

  { h: "One dog. An enormous search area.", id: "search-area" },
  "The simplest way to understand the value of a search dog is to imagine looking for one person in several square miles of countryside.",
  "Humans are excellent at searching carefully. We can follow paths, study maps, check buildings and examine likely locations. But we generally have to get close enough to see or hear the person we are looking for.",
  "A dog's nose gives the search team another way of finding them.",
  "An air-scenting dog does not necessarily follow footsteps. It searches for human scent carried through the air. Mountain Rescue England and Wales describes that scent as spreading downwind from a casualty in a cone, with the dog working across it and gradually moving towards the source.",
  "That means the missing person does not have to be standing on the path waving politely.",
  "They may be behind vegetation, over a ridge or lying somewhere a rescuer cannot yet see.",
  "The dog is searching a world of information that humans cannot access in anything like the same way.",

  { h: "What the dog is actually doing", id: "actually-doing" },
  "A search dog is not simply running around hoping to bump into somebody.",
  "It is sampling the air.",
  "As wind moves across a person, tiny scent particles travel with it. Terrain, trees, buildings, temperature and weather can all affect where that scent goes.",
  "The dog moves through the search area looking for traces of human scent, often zigzagging until it finds a stronger concentration.",
  "Then it works towards the source.",
  "With air-scenting dogs, the target may simply be any human in the assigned area rather than one particular individual's smell. NSARDA also operates trailing dogs, which can be given a scent article belonging to a particular missing person and follow that individual's trail.",
  "Same nose. Different filing system.",

  { h: "Air scent, trailing and water", id: "air-trailing-water" },
  "There is more than one way to be a search dog.",
  "Air-scenting dogs generally work away from the handler, using scent carried on the wind to locate people within an assigned area.",
  "Trailing dogs work differently. They are usually given an item carrying the missing person's scent and follow that individual trail, often working on a line.",
  "There are even specialist water-search dogs. They work around water margins or from boats, using scent associated with a missing person in much the same way that an air-scenting dog works on land.",
  "Which means the phrase \"search dog\" covers rather more than one employee with one job description.",

  { h: "When the dog finds somebody", id: "when-finds" },
  "Finding the person is only half the conversation.",
  "The dog then has to tell the handler.",
  "Different teams use different indication behaviours. Mountain Rescue England and Wales describes dogs that return or bark to notify their handler after making a find, then help lead the handler towards the casualty.",
  "That behaviour is trained carefully because the handler may be nowhere near the dog when the discovery happens.",
  "The dog therefore has to solve the problem twice.",
  "First: Where is the person?",
  "Second: How do I get the human with the radio to understand that I have found them?",

  { h: "Built for the job", id: "built-for-job" },
  "There is no single search-and-rescue breed.",
  "NSARDA works with a number of different breeds, and search-dog organisations have used everything from collies and spaniels to retrievers and other energetic working dogs. What matters is considerably more specific than the name on the pedigree.",
  "A good search dog needs stamina, confidence, trainability and an enormous willingness to hunt for scent.",
  "It has to work away from its handler without simply disappearing over the horizon.",
  "It must cope with rough ground, darkness, wind, rain, strangers and distractions.",
  "And when the entire operation is finished, it must still regard finding another hidden human as an excellent idea.",
  "That last part is rather important.",

  { h: "The dog that saves footsteps", id: "saves-footsteps" },
  "Search and rescue has the same hidden economics as sheepdog work, except the currency can be much more serious.",
  "Every area a dog can search efficiently is ground human rescuers do not have to cover in exactly the same way.",
  "Every scent cone located can narrow the search.",
  "Every person found sooner can mean less exposure to cold, injury or worsening medical problems.",
  "Mountain rescue searches already combine people, mapping, vehicles, communications, drones and specialist equipment. Dogs add another sensor to that system, except this one has four legs and is usually considerably more enthusiastic about mud.",
  "The dog does not replace the rescue team.",
  "It gives the rescue team access to information they otherwise might never have.",

  { h: "The field is rather large", id: "field-large" },
  "This is a very big field of work.",
  "UK search dogs can be deployed on mountains, moorland, woodland, rural ground and water margins. Some work with Mountain Rescue, others with specialist search-and-rescue organisations, and teams may be called out by police when a high-risk vulnerable person is missing. NSARDA says its volunteer dog-and-handler teams can deploy in all weather, day or night.",
  "So the job title may say \"search dog\".",
  "The office can be almost anywhere.",

  { h: "Why the dog agrees to this", id: "why-agrees" },
  "Nobody has explained emergency response strategy to the dog.",
  "It does not understand missing-person statistics.",
  "It has never attended a multi-agency briefing.",
  "What it understands is hunting for scent, solving the problem and reaching the person at the end of it.",
  "Training turns that natural desire to search into a disciplined behaviour. Successful finds are reinforced with whatever the particular dog values most, often play, praise or a favourite toy.",
  "The extraordinary part is that humans have managed to turn an activity many dogs find inherently rewarding into something capable of saving a life.",
  "We call that work.",
  "The dog may think somebody has organised an unusually elaborate game of hide and seek.",

  { h: "Not every dog with a good nose is a rescue dog", id: "not-every-dog" },
  "The nose is only the beginning.",
  "A rescue dog must be able to concentrate, obey commands, work safely around people and other dogs, negotiate difficult terrain and maintain its search behaviour for long periods.",
  "The handler has just as much training to do. NSARDA and mountain rescue organisations qualify dog-and-handler teams rather than simply certifying the animal in isolation.",
  "That matters because search work is a partnership.",
  "The dog reads scent.",
  "The handler reads the dog, the terrain, the weather and the search plan.",
  "Neither half is particularly useful if the other half has no idea what is happening.",

  { h: "And this, of course, is a job", id: "is-a-job" },
  "The search dog does not know somebody's family is waiting for news.",
  "It does not know that rescuers may have been searching for hours.",
  "It does not know that darkness, cold or injury can turn a missing-person search into a race against time.",
  "The dog knows there is scent somewhere in the landscape and that following it has always led to good things.",
  "We get another way to search.",
  "We get ground covered faster and differently.",
  "We get a nose capable of finding clues that are completely invisible to us.",
  "And sometimes, somebody gets found.",
  "The dog gets the game, the praise and the chance to do it again.",
  "That may be the strangest thing about search and rescue dogs: one of the most serious jobs we can ask an animal to perform is built around something the animal may genuinely love doing.",
];

// Sidebar cards as an explicit list (payslip is rendered separately, in the
// after-hero slot). Desktop renders these in the sticky sidebar in order; mobile
// renders each above the H2 named in pairWith, Sources to the tail. The honest
// version and the sources are marked "drafted for approval" in the copy.
const CARDS: ArticleCard[] = [
  {
    id: "three-ways-to-search",
    pairWith: "air-trailing-water",
    node: (
      <SidebarCard title="Three ways to search">
        <p className={sidebar.subtitle}>Air scenting</p>
        <p className={sidebar.text}>Find human scent carried on the wind. Search an area rather than necessarily one person's exact footsteps.</p>
        <p className={sidebar.subtitle}>Trailing</p>
        <p className={sidebar.text}>Use an item carrying a missing person's scent and follow that individual's trail.</p>
        <p className={sidebar.subtitle}>Water search</p>
        <p className={sidebar.text}>Search shorelines and water from the bank or a boat using scent associated with a missing person.</p>
      </SidebarCard>
    ),
  },
  {
    id: "dog-thinks",
    pairWith: "is-a-job",
    node: (
      <SidebarCard title="What the dog thinks it's doing">
        <p className={sidebar.text}>
          <strong>What humans think:</strong> a high-risk missing-person search across difficult terrain, coordinated with rescue teams and police.
        </p>
        <p className={sidebar.text}>
          <strong>What the dog thinks:</strong> somebody is hiding somewhere in this enormous field.
        </p>
      </SidebarCard>
    ),
  },
  {
    id: "honest-version",
    pairWith: "not-every-dog",
    node: (
      <SidebarCard title="The honest version">
        <p className={sidebar.text}>Search dogs are not a guarantee. A find depends on wind, terrain, weather, how long the person has been missing and where they actually are, and a search can end without one.</p>
        <p className={sidebar.text}>Most UK search dog teams are volunteers, and it is the dog and handler together that qualify, not the dog alone. Training a team takes years.</p>
        <p className={sidebar.text}>The dog does not replace the rescue team. It gives them a way of covering ground that people, maps and equipment cannot cover in the same way.</p>
      </SidebarCard>
    ),
  },
  {
    id: "sources",
    pairWith: "tail",
    node: (
      <SidebarCard title="Sources">
        <p className={sidebar.sources}>
          Mountain Rescue England and Wales<br />
          National Search and Rescue Dog Association (NSARDA)
        </p>
      </SidebarCard>
    ),
  },
];

export default function SearchRescuePage() {
  return (
    <>
      <Nav showLogo />
      <main className={styles.essayPage}>
        <div className={styles.essayHero}>
          {/* Hero alt supplied by Steve (11 Aug). */}
          <img
            src="/search_rescue_dogs.jpg"
            alt="a search and rescue dog working across open moorland"
            className={styles.essayHeroImg}
          />
          <div className={styles.essayHeroTint} />
          <div className={styles.essayHeroContent}>
            <Link href="/dogs-at-work" className={styles.backLink}>← Back to Dogs at Work</Link>
            <div className={styles.essayHeroMeta}>
              <span className={`${styles.tag} ${styles.tagEmergency}`}>Emergency</span>
              <span className={styles.tagBreed}>Search and rescue dogs</span>
            </div>
            <h1 className={styles.essayHeroTitle}>The Dog That Finds You When Nobody Else Can</h1>
          </div>
        </div>

        <div className={styles.essayLayout}>
          <article className={styles.essay}>
            <div className={styles.essayBody}>
              {BODY.map((b, i) =>
                typeof b === "string"
                  ? <p key={i}>{b}</p>
                  : <h2 key={i} id={b.id} className={styles.subhead}>{b.h}</h2>
              )}
            </div>
          </article>

          <aside className={styles.sidebar}>
            {/* The payslip (brief v3.0 section 13 + Appendix C). Trimmed article 5
                values from the supplied copy, not the longer originals. */}
            <Payslip data={PAYSLIPS["the-dog-that-finds-you-when-nobody-else-can"]} className={styles.payslipOverlay} />

            {CARDS.map((c) => (
              <React.Fragment key={c.id}>{c.node}</React.Fragment>
            ))}
          </aside>
        </div>

        {/* Mobile: single interleaved column. Payslip in the after-hero slot, then
            each card above its paired H2 (see MobileArticleBody). */}
        <div className={styles.articleMobile}>
          <div className={styles.mobilePayslip}>
            <Payslip data={PAYSLIPS["the-dog-that-finds-you-when-nobody-else-can"]} />
          </div>
          <MobileArticleBody
            body={BODY}
            cards={CARDS}
            bodyClassName={styles.essayBody}
            subheadClassName={styles.subhead}
            slotClassName={styles.mobileCardSlot}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
