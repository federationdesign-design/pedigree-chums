import type { Metadata } from "next";
import { SITE_URL } from "../../../lib/site";
import * as React from "react";
import Link from "next/link";
import Nav from "../../../components/Nav/Nav";
import Footer from "../../../components/Footer/Footer";
import styles from "../dogs-at-work.module.css";
import ArticleTextToggle from "../../../components/ArticleTextToggle/ArticleTextToggle";
import Payslip from "../../../components/Payslip/Payslip";
import SidebarCard from "../../../components/DogsAtWork/SidebarCard";
import sidebar from "../../../components/DogsAtWork/SidebarCard.module.css";
import MobileArticleBody, { type ArticleCard } from "../../../components/DogsAtWork/MobileArticleBody";
import { PAYSLIPS } from "../data/payslips";

/* ARTICLE 8, THE DIGITAL DETECTION DOGS, 23 September 2026 (owner).

   TONE. These dogs are used in three kinds of case, and one of them is child
   abuse. The owner's instruction is explicit: children read this site, so the
   article leads on MONEY, names the other use once in the plainest possible
   words, and never returns to it. No description of the material, no case
   details, nothing a child should not read. If a later edit is tempted to make
   that section bigger, it should not.

   BRITAIN FIRST. Tweed, a springer spaniel with Devon and Cornwall Police, and
   Rob, a Labrador, were the first digital detection dogs in the UK, trained by
   the force. Handler PC Martin King has worked more than 1,200 searches with
   them. Police Scotland now runs its own team, including a rescue springer called
   Zen. The American programme is credited where it belongs, as the origin, and
   not as the story.

   SOURCES. BBC coverage of Tweed's award nomination for the 1,209 searches, the
   drain and the buried device in two zip-lock bags. Police Professional and the
   Northumbria PCC archive for the 2017 launch of Tweed and Rob, the 50 warrants
   and the Coca-Cola money box holding SD cards. Police Scotland's own
   announcement for the Scottish team. The chemistry, triphenylphosphine oxide,
   and the one-in-fifty pass rate come from the Connecticut State Police
   programme, where the compound was isolated by forensic chemist Jack Hubball in
   2012. The Surrey case of 2017, where a seized USB device turned out to be a
   hardware wallet holding 295 Bitcoin, is from Bloomberg's account of UK crypto
   seizures.

   NO PHOTOGRAPHS OF POLICE DOGS: those belong to the forces. Hero is our own
   spaniel art until the owner supplies something. */

export const metadata: Metadata = {
  title: "The Dog That Can Smell a Hard Drive | Dogs at Work",
  description:
    "Every memory chip ever made carries the same chemical, and a spaniel in Devon can smell it. How Britain's digital detection dogs find a fortune hidden inside something the size of a fingernail.",
  openGraph: {
    images: ["/spaniel.png"],
  },
};

const BODY: (string | { h: string; id: string })[] = [
  "In a village west of London in 2017, police searching a house found a safety deposit box: jewellery, gold bars, and 263,000 pounds in cash. They also found a small plastic device in the study, wrapped inside a notebook with two lines of random words written in it.",
  "It took a young officer to recognise what it was. The device was a hardware wallet, the words were the key to it, and it held 295 Bitcoin.",
  "Every other thing in that house announced itself. The gold looked like gold. The cash looked like cash. The most valuable object in the building looked like a lost USB stick.",
  "This is the problem that created one of the strangest jobs a dog has ever been given.",

  { h: "The chemical that gives it away", id: "chemical" },
  "Here is the thing that makes the job possible, and it is a genuine fluke of manufacturing.",
  "Memory chips get hot. To stop them cooking themselves, the boards are coated with a compound called triphenylphosphine oxide, TPPO for short. It is on hard drives. It is on SD cards. It is on phones, laptops, memory sticks and the fingernail-sized card inside a camera.",
  "As one of the instructors on the original programme put it, these devices cannot be made without it.",
  "So every piece of digital storage on earth, whatever it is wrapped in, whatever it is hidden inside, carries the same smell. A forensic chemist in Connecticut worked that out in 2012, and the first dogs were trained on it not long after.",
  "Britain got its own in 2017.",

  { h: "Tweed, of Devon and Cornwall", id: "tweed" },
  "Tweed is a springer spaniel. He was trained by Devon and Cornwall Police alongside a Labrador called Rob, and the two of them were the first digital detection dogs in the country.",
  "His handler, PC Martin King, has now worked more than 1,200 searches with his dogs. The list of things Tweed has found reads like a challenge somebody set him.",
  "A device down a drain. A device buried in the ground, sealed inside two zip-lock bags. And, on one search, a Coca-Cola can that turned out to be a money box with SD cards hidden inside it.",
  "Nobody would have opened that can. A room full of trained officers can search a house for hours and walk past a fizzy drink. The dog walked in, smelled a chemical through aluminium, and sat down next to it.",
  "That is the whole value of the job in one image: not a dog doing police work, but a dog doing the part of police work people are physically incapable of.",

  { h: "What the dog is being asked to do", id: "job" },
  "It is a harder job than it sounds, and the pass rate says so. On the original American programme, roughly one dog in fifty makes it.",
  "Drugs and explosives are loud smells. TPPO is a faint one, and the target is often behind a wall, under a floor or inside another object. The dog has to work slowly, ignore everything interesting in a stranger's house, and commit to a spot with no visible reason for doing so.",
  "When it finds the smell it does not dig, bark or grab. It sits and points its nose, and waits.",
  "And then it gets paid, which is the part that makes the whole thing work. These dogs are often fed by hand, piece by piece, as they search. The job is literally dinner. A dog looking for a memory card in a cavity wall is not hunting criminals, it is playing the one game it has been taught, with the person who brings the food.",

  { h: "What it is used for", id: "used-for" },
  "Digital detection dogs are used on three kinds of case: fraud, terrorism, and crimes against children. That third one is real and it is a large part of the work, and this article is not going to describe it.",
  "The fraud side is the one nobody expects, and it has grown fast. Money now hides the same way evidence does: as data. A hardware wallet, a phone with an app on it, a memory card taped inside a plug socket. A person can carry a life-changing sum through an airport in a pocket and look like they are carrying nothing.",
  "Police forces in Britain have been catching up with that for a decade, and it turns out one of the more effective tools is a spaniel. You cannot encrypt a smell. You cannot password-protect a drawer. Whatever is on the device, and however well it is locked, the dog finds the object.",
  "The rest is a job for the people with the warrant.",

  { h: "The strangest thing about the job", id: "strange" },
  "A digital detection dog has no idea what a computer is.",
  "It does not know what money is, or a photograph, or the internet. It cannot be told that the thing it is looking for holds a fortune, or a conviction, or somebody's whole life. It knows a smell, a sit, and a person who produces food when the smell is found.",
  "Which is why the job is so completely unspoofable. You cannot bribe it, mislead it, or argue with it. It has no theory about the case and no interest in the outcome.",
  "There is one more thing worth saying about that. These dogs are often spaniels and Labradors, and often rescues. Police Scotland's digital team includes a rescue springer called Zen. A dog that nobody wanted turns out to be very good indeed at finding the one thing in a house that somebody desperately did.",
  "And this, of course, is a job.",
];

const CARDS: ArticleCard[] = [
  {
    id: "tppo",
    pairWith: "chemical",
    node: (
      <SidebarCard title="The smell of a memory chip">
        <p className={sidebar.text}>
          Triphenylphosphine oxide, or TPPO, is used to coat circuit boards so memory chips do not overheat. Hard
          drives, SD cards, phones, memory sticks: the same compound, and therefore the same smell, on all of them.
        </p>
      </SidebarCard>
    ),
  },
  {
    id: "tweed-card",
    pairWith: "tweed",
    node: (
      <SidebarCard title="Tweed and Rob">
        <div className={sidebar.text}>
          {[
            ["Force", "Devon and Cornwall Police"],
            ["Breeds", "Springer spaniel and Labrador"],
            ["First", "The first digital detection dogs in the UK"],
            ["Searches", "More than 1,200 with handler PC Martin King"],
            ["Best find", "A Coca-Cola can that was a money box full of SD cards"],
          ].map(([k, v]) => (
            <div key={k} className={sidebar.attrRow}>
              <span className={sidebar.attrName}>{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
      </SidebarCard>
    ),
  },
  {
    id: "what-the-dog-thinks",
    pairWith: "job",
    node: (
      <SidebarCard title="What the dog thinks it is doing">
        <p className={sidebar.text}>
          <strong>What humans get:</strong> a hardware wallet behind a plug socket, a memory card in a drain,
          evidence a search team would have walked past.
        </p>
        <p className={sidebar.text}>
          <strong>What the dog thinks:</strong> there is the funny smell again. Sit next to it. Look at my person.
          Dinner arrives. Best job in the world.
        </p>
      </SidebarCard>
    ),
  },
  {
    id: "one-in-fifty",
    pairWith: "strange",
    node: (
      <SidebarCard title="One dog in fifty">
        <p className={sidebar.text}>
          On the programme that started this work, only about one dog in fifty passes the tests. The scent is
          fainter than drugs or explosives, and the dog has to stay patient in a house full of distractions.
        </p>
      </SidebarCard>
    ),
  },
  {
    id: "sources",
    pairWith: "tail",
    node: (
      <SidebarCard title="Sources">
        <p className={sidebar.sources}>
          BBC News on Tweed and PC Martin King<br />
          Police Professional and the Northumbria PCC archive, 2017<br />
          Police Scotland<br />
          Connecticut State Police electronic storage detection programme<br />
          Bloomberg on UK crypto seizures, 2022
        </p>
      </SidebarCard>
    ),
  },
];

const HEADLINE = "The Dog That Can Smell a Hard Drive";
const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: HEADLINE,
      description: metadata.description,
      image: `${SITE_URL}/spaniel.png`,
      publisher: { "@id": `${SITE_URL}/#organization` },
      mainEntityOfPage: `${SITE_URL}/dogs-at-work/the-dog-that-smells-a-hard-drive`,
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Dogs at Work", item: `${SITE_URL}/dogs-at-work` },
        { "@type": "ListItem", position: 3, name: HEADLINE, item: `${SITE_URL}/dogs-at-work/the-dog-that-smells-a-hard-drive` },
      ],
    },
  ],
};

export default function DigitalDogsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD).replace(/</g, "\\u003c") }}
      />
      <Nav showLogo />
      <main className={styles.essayPage}>
        <div className={styles.essayHero}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/spaniel.png"
            alt="Illustration of a springer spaniel, the breed of Britain's first digital detection dog."
            className={styles.essayHeroImg}
          />
          <div className={styles.essayHeroTint} />
          <div className={styles.essayHeroContent}>
            <Link href="/dogs-at-work" className={styles.backLink}>Back to Dogs at Work</Link>
            <div className={styles.essayHeroMeta}>
              <span className={`${styles.tag} ${styles.tagPeople}`}>Security</span>
              <span className={styles.tagBreed}>Springer spaniel</span>
            </div>
            <h1 className={styles.essayHeroTitle}>The Dog That Can Smell a Hard Drive</h1>
          </div>
        </div>

        <div className={styles.toggleSlotArticle}>
          <ArticleTextToggle />
        </div>

        <div className={styles.essayLayout}>
          <article className={styles.essay}>
            <div className={styles.essayBody}>
              {BODY.map((b, i) =>
                typeof b === "string" ? (
                  <p key={i}>{b}</p>
                ) : (
                  <h2 key={i} id={b.id} className={styles.subhead}>{b.h}</h2>
                )
              )}
            </div>
          </article>

          <aside className={styles.sidebar}>
            <Payslip data={PAYSLIPS["the-dog-that-smells-a-hard-drive"]} className={styles.payslipOverlay} />
            {CARDS.map((c) => (
              <React.Fragment key={c.id}>{c.node}</React.Fragment>
            ))}
          </aside>
        </div>

        <div className={styles.articleMobile}>
          <div className={styles.mobilePayslip}>
            <Payslip data={PAYSLIPS["the-dog-that-smells-a-hard-drive"]} />
          </div>
          <div className={styles.toggleSlotMobile}>
            <ArticleTextToggle />
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
