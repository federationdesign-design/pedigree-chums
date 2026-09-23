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

/* THE MILITARY ARTICLE, 23 September 2026 (owner).

   THE SPINE IS TWO DOGS, not a list of eight. Crumstone Irma could tell a living
   casualty from a dead one through rubble, which is the detection argument made
   concrete. Rifleman Khan was a family pet from Tolworth, lent to the War Office,
   who went into the water under fire for a man he had known months, which is the
   attachment argument made concrete. The other six Alsatian medallists are
   supporting cast, and they live in the sidebar cards.

   THE PAYSLIP IS MANDATORY (owner, 23 September 2026): it is the device that ties
   the whole series together, so it sits in the sidebar on desktop and in the
   after-hero slot on mobile, exactly as on the other six articles. Everything
   else goes in the blue cards.

   SOURCES. All eight medal facts are from the PDSA Dickin Medal roll of honour
   and its citations. Jet of Iada and Crumstone Irma's rescue counts (150 and 191)
   are the figures PDSA and the Imperial War Museum give. Khan's citation is for
   rescuing L/Cpl Muldoon during the assault on Walcheren in November 1944 while
   serving with the 6th Battalion Cameronians. Appollo's is for the search at New
   York and Washington after 11 September 2001. Kuno (2020) and Bass (2023) are
   recent recipients and are named only where the text says so.

   HERO IMAGE. The owner's military dog photograph, miltray-dog-img.jpg (his
   spelling, kept so the file and the reference cannot drift apart). It is already
   the card image on the Dogs at Work deck; the article page was still on the
   German Shepherd card art, which is the fault fixed here on 23 September 2026.

   NO PHOTOGRAPHS OF THE MEDAL DOGS THEMSELVES: those belong to PDSA and the IWM,
   so none are used anywhere on this page. */

export const metadata: Metadata = {
  title: "The Dog They Gave a Medal To | Dogs at Work",
  description:
    "Britain has given the animals' Victoria Cross to more Alsatians than any other breed. What military dogs actually do, why the same qualities that make them good at it make them vulnerable, and what happens when the work stops.",
  openGraph: {
    images: ["/miltray-dog-img.jpg"],
  },
};

const BODY: (string | { h: string; id: string })[] = [
  "In November 1944, during the assault on Walcheren, a landing craft went over in cold water under shellfire. Lance Corporal Muldoon could not swim. His dog could.",
  "Khan had been a family pet in Tolworth, Surrey, lent to the War Office two years earlier because the army had asked the public for dogs and the Railton family had one to give. He had known Muldoon a matter of months. He went into the water, found him, and pulled him to the bank.",
  "The army gave the dog a rank and called him Rifleman Khan. Britain gave him the Dickin Medal, which is as close as an animal gets to the Victoria Cross.",
  "Here is the thing worth sitting with. Nobody trained Khan to do that.",

  { h: "What the army actually hires a dog for", id: "the-job" },
  "Military working dogs are not weapons, whatever the films suggest. They are sensors with legs, and almost all of the work is detection.",
  "An arms and explosives search dog walks a route ahead of the people who would otherwise walk it. It is looking for a smell: the chemistry of an explosive, of a weapon that has been handled, of a cache buried under a track. When it finds one it does not attack anything. It sits down, or lies down, and waits to be paid.",
  "That is the whole job, and it is worth being precise about why it matters. A dog working a route is not finding bombs. It is finding them before a person does. The value is entirely in the gap between those two sentences.",
  "The rest of the work is the same skill pointed at different problems: patrol dogs that notice somebody who should not be there, tracking dogs that follow a person across ground, casualty dogs that find the wounded, and in the Second World War, rescue dogs that worked British streets after a raid.",

  { h: "Irma, and the thing she could do", id: "irma" },
  "Crumstone Irma was an Alsatian who served with London's Civil Defence during the Blitz, and she is credited with helping rescue 191 people from bombed buildings.",
  "The figure is not the interesting part. This is: Irma could tell, by scent, whether the person buried under the rubble was still alive. Her handler learned to read the difference in how she reported it, and the rescue parties dug accordingly.",
  "Think about what that means practically. In a street of collapsed houses, with hours of digging available and not enough of them, a dog was deciding where the effort went. It is the same faculty a medical detection dog uses on a sample tray, doing triage in the dark.",
  "Irma did not know any of that. She was finding a smell and telling a person about it, which is the only job she thought she had.",

  { h: "Why the dog does it at all", id: "why" },
  "A dog will not cross a minefield for a country. It has no view on the war.",
  "It will do it for a ball, a tug toy and a handler. That is the real mechanism, and it is not a cynical reading: the search is a game with a prize, and the prize is not the explosive but the toy that comes after, and the person who produces the toy.",
  "Which is why the handler-dog pairing is treated as a unit rather than a man and his equipment. The dog works for that person, reads that person, and in Khan's case will go into cold water for that person, because the relationship is what the work runs on.",
  "It also means the dog cannot tell the difference between a training run and a real one. There is no version of the job where the dog understands the risk it is taking. It understands that its person is here, that the game is on, and that something is wrong when its person is frightened.",

  { h: "The breed that keeps turning up", id: "breed" },
  "Look down the list of dogs given the Dickin Medal and one breed appears more than any other: the German Shepherd, or the Alsatian as Britain called it for most of the last century.",
  "Eight of them have received it. Jet of Iada and Crumstone Irma for the Blitz rescues, Thorn and Rex for finding casualties inside burning buildings, Khan for Walcheren, Brian who parachuted with the airborne, Antis who served with a Czech airman in the French Air Force and the RAF, and Appollo, the first search dog into Ground Zero.",
  "That is not a coincidence of fashion. It is a breed built in the 1890s for exactly this: a working shepherd's dog selected for nose, stamina, biddability and a strong attachment to one handler. The breed's own training profile still says it bonds deeply with one person, which is an asset in a job where the dog has to want to come back.",
  "The same paperwork has a second column, and it reads: needs firm, consistent handling, and can develop anxiety.",

  { h: "What the job costs", id: "cost" },
  "A military dog does not get to decide that it has had enough.",
  /* Was "the part the films show", which assumed the reader had arrived from the
     Odin article. This page stands alone (owner, 23 September 2026). */
  "The physical price is the easy part to picture: the injuries, the worn joints, the broken teeth, the working life that ends years before the dog does. The rest is less visible. Dogs coming back from deployments have been diagnosed with a condition that looks very much like post-traumatic stress: a dog that will not enter a building, or will not work a vehicle, or attaches itself to one person and refuses to be handed on.",
  "And there is the part nobody writes citations for. A dog that has spent its adult life with one handler, in a job that the two of them did together, does not understand a posting, a discharge, or a funeral. It understands that the person stopped coming.",
  "We are good at counting the finds, the routes cleared and the lives not lost. We are worse at counting that.",

  { h: "And this, of course, is a job", id: "job" },
  "Khan went back to Tolworth after the war, to the family who had lent him. Muldoon, the man he pulled out of the water, travelled to a parade in 1947 to handle him one more time, and the family gave the dog to him. That is the ending the story deserved, and it is the exception rather than the rule.",
  "The modern position is better than it was. Retired military working dogs in Britain are routinely rehomed, usually with their handlers, and charities cover a good deal of the veterinary cost that follows. Better is not the same as settled: a dog with a decade of working injuries is an expensive animal to keep well, and the bill arrives after the usefulness has ended.",
  "None of which the dog is aware of. It went where its person went, found what it was asked to find, sat down beside it and waited to be told it was good.",
  "That is work. It has a payslip, whether or not anyone ever ran the numbers.",
];

const CARDS: ArticleCard[] = [
  {
    id: "khan-card",
    /* Khan now sits first, Irma second (owner, 23 September 2026). The pairings
       are unchanged: on mobile each card still lands beside its own passage. */
    pairWith: "why",
    node: (
      <SidebarCard title="Rifleman Khan" thumb={{ src: "/german-shepard-square.jpg", alt: "" }}>
        <p className={sidebar.text}>
          Alsatian, 6th Battalion Cameronians. Dickin Medal, 27 March 1945, for rescuing L/Cpl Muldoon from drowning
          under heavy shellfire during the assault on Walcheren. A family pet before the war, and afterwards.
        </p>
      </SidebarCard>
    ),
  },
  {
    id: "irma-card",
    pairWith: "irma",
    node: (
      <SidebarCard title="Crumstone Irma" thumb={{ src: "/german-shepard-square.jpg", alt: "" }}>
        <p className={sidebar.text}>
          Alsatian, London Civil Defence. Dickin Medal, 1945, for helping rescue 191 people from blitzed buildings.
          Her owner, Margaret Griffin, received the British Empire Medal for training her.
        </p>
      </SidebarCard>
    ),
  },
  {
    id: "the-eight",
    pairWith: "breed",
    node: (
      /* The same cartoon roundel against each name (owner, 23 September 2026).
         Photographs of these dogs belong to PDSA and the Imperial War Museum, so
         the card uses our own art: identical portraits, which at least say "all
         eight were this breed" rather than pretending to show the individuals. */
      <SidebarCard title="The eight Alsatians" thumb={{ src: "/german-shepard-square.jpg", alt: "" }}>
        <div className={sidebar.text}>
          {[
            ["Jet of Iada", "1945, Blitz rescue, 150 people"],
            ["Crumstone Irma", "1945, Blitz rescue, 191 people"],
            ["Thorn", "1945, casualties in a burning building"],
            ["Rex", "1945, casualties in burning buildings"],
            ["Rifleman Khan", "1945, Walcheren"],
            ["Brian", "1947, parachuted with the airborne"],
            ["Antis", "1949, French Air Force and RAF"],
            ["Appollo", "2002, first search dog at Ground Zero"],
          ].map(([name, what]) => (
            <div key={name} className={sidebar.medalRow}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/german-shepard-square.jpg" alt="" className={sidebar.medalThumb} loading="lazy" />
              <span>
                <span className={sidebar.medalName}>{name}</span>
                <span className={sidebar.medalWhat}>{what}</span>
              </span>
            </div>
          ))}
        </div>
      </SidebarCard>
    ),
  },
  {
    id: "what-the-dog-thinks",
    pairWith: "cost",
    node: (
      <SidebarCard title="What the dog thinks it is doing">
        <p className={sidebar.text}>
          <strong>What humans get:</strong> a route cleared, a weapons cache found, a casualty located, a patrol
          that did not walk into anything.
        </p>
        <p className={sidebar.text}>
          <strong>What the dog thinks:</strong> find the smell, sit next to it, look at my person, receive the ball.
          Repeat until the ball comes out again.
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
          PDSA Dickin Medal roll of honour and citations<br />
          Imperial War Museum<br />
          Royal Army Veterinary Corps
        </p>
      </SidebarCard>
    ),
  },
];

const HEADLINE = "The Dog They Gave a Medal To";
const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: HEADLINE,
      description: metadata.description,
      image: `${SITE_URL}/miltray-dog-img.jpg`,
      publisher: { "@id": `${SITE_URL}/#organization` },
      mainEntityOfPage: `${SITE_URL}/dogs-at-work/the-dog-they-gave-a-medal-to`,
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Dogs at Work", item: `${SITE_URL}/dogs-at-work` },
        { "@type": "ListItem", position: 3, name: HEADLINE, item: `${SITE_URL}/dogs-at-work/the-dog-they-gave-a-medal-to` },
      ],
    },
  ],
};

export default function MilitaryDogsPage() {
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
            src="/miltray-dog-img.jpg"
            alt="A military working dog at work with its handler."
            className={styles.essayHeroImg}
          />
          <div className={styles.essayHeroTint} />
          <div className={styles.essayHeroContent}>
            <Link href="/dogs-at-work" className={styles.backLink}>Back to Dogs at Work</Link>
            <div className={styles.essayHeroMeta}>
              <span className={`${styles.tag} ${styles.tagPeople}`}>Armed forces</span>
              <span className={styles.tagBreed}>German Shepherd</span>
            </div>
            <h1 className={styles.essayHeroTitle}>The Dog They Gave a Medal To</h1>
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
            <Payslip data={PAYSLIPS["the-dog-they-gave-a-medal-to"]} className={styles.payslipOverlay} />
            {CARDS.map((c) => (
              <React.Fragment key={c.id}>{c.node}</React.Fragment>
            ))}
          </aside>
        </div>

        <div className={styles.articleMobile}>
          <div className={styles.mobilePayslip}>
            <Payslip data={PAYSLIPS["the-dog-they-gave-a-medal-to"]} />
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
