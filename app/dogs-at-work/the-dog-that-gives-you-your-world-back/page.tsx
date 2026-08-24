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
import CostToTrainCard from "../../../components/DogsAtWork/CostToTrainCard";
import { PAYSLIPS } from "../data/payslips";

export const metadata: Metadata = {
  title: "The Dog That Gives You Your World Back | Dogs at Work",
  // Meta description drawn from the index card dek (supplied by Steve, 11 Aug).
  description:
    "A guide dog does not give somebody their sight back. It gives them the confidence to go, and that turns out to be almost as valuable.",
  openGraph: {
    images: ["/guide_dog_image.jpg"],
  },
};

// Article 6 body, transcribed verbatim from the supplied copy
// (docs/dogs-at-work/reference/guide_dogs_article_copy.md), above the SIDEBAR
// MODULES / WORKING NOTES divider. Headings are sentence-cased; the .subhead rule
// uppercases them. Sidebar modules come from the SIDEBAR MODULES section, not the
// body, so nothing is lifted out of the body. NOTE for Steve: the copy names real
// people and dogs (Trudy Sherwood and Connie, Scott and Milo, Emma and Archie);
// the campaign brief asks for written permission before publishing named cases.
const BODY: (string | { h: string; id: string })[] = [
  "For somebody with sight loss, the hardest journeys are not always the dramatic ones. They are the ordinary ones. The bus stop. The shops. The walk to work. Crossing a road. Getting around a pavement somebody has helpfully blocked with a car.",
  "Those journeys can become tiring, stressful and frightening enough that staying at home sometimes feels easier.",
  "Then a guide dog arrives.",
  "To us, it is mobility support. To the person holding the harness, it can be independence, confidence and the return of an ordinary life. To the dog, it is a series of problems to solve with one very important rule: get your person there safely.",
  "Guide Dogs describes the basic job as travelling from kerb to kerb, avoiding obstacles and helping the owner reach their destination safely. But the effect of that relatively simple description can be enormous.",
  "A dog does not give somebody their sight back.",
  "It can give them something almost as important: the confidence to go.",

  { h: "Before the dog", id: "before-dog" },
  "One of the easiest mistakes to make is thinking a guide dog simply replaces a white cane.",
  "It does not.",
  "A person with sight loss can use mobility training, a cane, technology, memory and other techniques to travel independently. But every journey can still require concentration, judgement and repeated decisions about obstacles the rest of us barely notice.",
  "A pavement sign.",
  "A bin.",
  "Roadworks.",
  "A café table.",
  "A car parked across the pavement.",
  "Guide Dogs reports that 95% of people with sight loss in its research said they had been forced into the road because vehicles were blocking pavements. One in five said they had been injured as a result of pavement parking.",
  "That is why confidence matters as much as navigation.",
  "Knowing you can technically make a journey is not the same as feeling comfortable enough to make it.",

  { h: "Then the harness goes on", id: "harness-on" },
  "Trudy Sherwood described life before her first guide dog as isolated and frightening. Some days, she did not want to leave the house.",
  "Then she was partnered with Connie.",
  "Suddenly roads, buses and everyday journeys became easier. Trudy described the change as feeling as though she could fly.",
  "That story captures the real value of a guide dog better than almost any technical description.",
  "The dog is not merely steering around lampposts.",
  "It is reducing the mental load of every journey.",
  "The owner still decides where they are going. The dog handles many of the immediate obstacles along the way.",
  "One half of the partnership knows the destination.",
  "The other half is exceptionally good at avoiding the wheelie bin somebody left in the middle of the pavement.",

  { h: "What the dog is actually doing", id: "actually-doing" },
  "A guide dog does not know the entire town like a furry satnav.",
  "The person gives direction and knows the route.",
  "The dog's job is the immediate environment.",
  "It learns to maintain a safe pavement position, stop at kerbs, avoid obstacles, negotiate transport, cope with distractions and find useful landmarks such as doors or crossings. Guide Dogs says the core skill is moving safely from kerb to kerb while avoiding obstacles along the route.",
  "That distinction is important.",
  "The human navigates.",
  "The dog guides.",
  "It is a partnership rather than somebody being taken for a walk by a Labrador.",

  { h: "The cleverest word in guide-dog training: no", id: "disobedience" },
  "Perhaps the most extraordinary part of the job is that sometimes a guide dog has to ignore an instruction.",
  "A well-trained dog can refuse to move forward when doing so would be unsafe, even if the person holding the harness has asked it to continue.",
  "That ability is often called intelligent disobedience.",
  "Humans spend months teaching the dog to follow instructions.",
  "Then part of the final lesson is: unless the instruction is a terrible idea.",
  "A kerb, an approaching vehicle or another hazard may give the dog information its owner cannot access visually.",
  "At that moment, obedience is no longer the job.",
  "Keeping the person safe is.",

  { h: "Trained for the ordinary world", id: "ordinary-world" },
  "Guide dogs are not trained in an empty field where nothing inconvenient ever happens.",
  "They learn in the same messy world they will eventually work in.",
  "Training can include kerbs, pavement positioning, obstacle avoidance, public transport, traffic, other dogs, cats, birds, shops and social behaviour. The process is also tailored to the individual dog because temperament, confidence and sensitivity matter as much as learning commands.",
  "The dog has to remain calm around things most dogs are specifically interested in investigating.",
  "Another dog.",
  "A pigeon.",
  "Food on the pavement.",
  "Somebody saying, \"Ohhhh, puppy!\" from three metres away.",
  "The professional response is to ignore all of this and continue to work.",
  "Which is quite a lot to ask of somebody whose natural qualifications include an extremely good nose and an enthusiasm for strangers.",

  { h: "Matching two individuals", id: "matching" },
  "Training the dog is only half the process.",
  "The right dog then has to be matched with the right person.",
  "Walking speed matters. Lifestyle matters. Confidence matters. The places somebody travels matter. Personality matters.",
  "Guide Dogs says a partnership can increase independence and support an active life, whether that means getting to work, attending an exercise class or simply going to the shops.",
  "That is why a guide dog is not simply issued.",
  "A partnership is built.",
  "And, as Trudy pointed out, sometimes two perfectly capable individuals simply do not click.",
  "Which makes guide-dog matching one of the few recruitment processes where both candidates may be highly qualified but one of them keeps eating things off the floor.",

  { h: "The change is bigger than getting from A to B", id: "bigger-change" },
  "This is where guide dogs become especially interesting as working dogs.",
  "Their job produces effects far beyond the task itself.",
  "Getting to a bus stop means being able to meet somebody.",
  "Getting to work means keeping a career.",
  "Getting around a town means shopping, exercising, socialising and participating in ordinary life without organising another person's help first.",
  "Guide Dogs explicitly describes the partnership in terms of confidence, independence and mobility rather than simply obstacle avoidance.",
  "And the stories of guide-dog owners repeatedly say the same thing.",
  "Scott, who was matched with golden retriever Milo, described walking with him as though a weight had been lifted because he could trust the dog to concentrate on keeping him safe.",
  "Emma originally hoped guide dog Archie would make her commute easier. She found that the partnership changed far more than the journey to work, increasing her confidence both professionally and at home.",
  "The dog begins by helping somebody cross the street.",
  "The result can be a larger life.",

  { h: "The dog that makes you visible", id: "visible" },
  "There is another part of the partnership that has almost nothing to do with navigation.",
  "Dogs are social magnets.",
  "Trudy described sitting alone on buses before she had a guide dog and feeling invisible. With a dog beside her, strangers started conversations.",
  "That might sound like a minor side effect.",
  "It is not necessarily minor when somebody has been feeling isolated.",
  "The harness tells the public what the dog is doing.",
  "The dog gives people a reason to engage.",
  "And suddenly an animal trained primarily for mobility can also create spontaneous human contact.",
  "The employee has accidentally joined the social department.",

  { h: "What happens when the dog is gone", id: "dog-gone" },
  "Perhaps the clearest evidence of what a guide dog contributes comes when the partnership ends.",
  "After six years, Trudy's first guide dog Connie retired. Trudy returned temporarily to using a cane and described the loss of the working partnership as being like losing her left arm.",
  "That is a powerful description because the person has not lost the skills they had before.",
  "What has disappeared is the layer of confidence, speed and partnership the dog had added.",
  "A guide dog eventually retires because the work demands concentration and physical fitness. Retirement is not failure. It is part of the bargain.",
  "The dog has done its shift.",
  "The human now has to learn how to let a colleague retire who also happens to be one of their closest companions.",

  { h: "Blind does not mean unable", id: "blind-not-unable" },
  "The most important part of this story is not that guide dogs allow blind people to do extraordinary things.",
  "Blind and partially sighted people were capable of extraordinary things already.",
  "Elite athletes and para-sport competitors do not succeed because a dog somehow supplies talent, determination or ability.",
  "The person brings those.",
  "What a guide dog can remove are some of the barriers around getting there.",
  "Travel.",
  "Confidence.",
  "Independence.",
  "The exhausting practical problem of safely negotiating a world designed largely for people who can see it.",
  "Guide Dogs has itself campaigned against the outdated idea that sight loss defines what somebody is capable of, emphasising confidence, independence and ability instead.",
  "The dog does not create the person's potential.",
  "It can make that potential easier to reach.",

  { h: "Why the dog agrees to all this", id: "why-agrees" },
  "The guide dog has not made a philosophical commitment to accessibility.",
  "It does not understand social inclusion.",
  "It has never read the Equality Act.",
  "What it understands is partnership, routine, training, reinforcement and the satisfaction of solving familiar problems alongside somebody it knows exceptionally well.",
  "Guide-dog work asks dogs to do things many well-bred retrievers and similar working dogs are naturally good at: cooperate with humans, learn patterns, make decisions and repeat tasks for reward and praise.",
  "Then the harness comes off.",
  "And this is important.",
  "A guide dog is still a dog.",
  "Trudy specifically points out that her dogs enjoy treats and free running when they are off duty.",
  "Working dog in harness.",
  "Ordinary idiot around an interesting puddle afterwards.",
  "Both things can be true.",

  { h: "The transformation is a partnership", id: "partnership" },
  "It would be easy to tell this story as though the dog arrives and fixes everything.",
  "That would undersell the person and misunderstand the dog.",
  "The owner has already learned how to live with sight loss.",
  "The dog has already spent months learning how to guide.",
  "Then both have to learn each other.",
  "The transformation happens in the partnership.",
  "The person begins trusting the dog's judgement.",
  "The dog learns the person's pace, routines and destinations.",
  "Journeys become familiar.",
  "Confidence grows.",
  "The radius of ordinary life can expand.",
  "Eventually the remarkable thing is not that somebody with sight loss has gone somewhere.",
  "It is that going somewhere has stopped being remarkable.",

  { h: "And this, of course, is a job", id: "is-a-job" },
  "The guide dog does not understand independence.",
  "It does not know that its owner may have spent months avoiding a particular journey.",
  "It does not know that catching a bus alone might represent freedom rather than transport.",
  "It knows the harness is on.",
  "There is a route to follow.",
  "There are obstacles to avoid.",
  "There is a person beside it who trusts it.",
  "We get mobility.",
  "We get confidence.",
  "We get access to work, education, sport, friendships and all the ordinary things that require getting out of the front door first. Guide Dogs' own description of its mission is to help people with sight loss live the life they choose rather than lose freedom alongside sight.",
  "The dog gets the partnership, the praise, the work and, eventually, the free run.",
  "Perhaps that is why guide dogs are such a powerful example of what working dogs can give us.",
  "They do not make somebody extraordinary.",
  "They help make extraordinary things ordinary again.",
];

// Sidebar cards (payslip rendered separately). "What the dog thinks it's doing",
// "The honest version" and "Sources" are marked "drafted for approval" in the copy.
const CARDS: ArticleCard[] = [
  {
    id: "who-does-what",
    pairWith: "actually-doing",
    node: (
      <SidebarCard title="Who does what?">
        <p className={sidebar.subtitle}>The person</p>
        <p className={sidebar.text}>Chooses the destination.<br />Knows or learns the route.<br />Listens to traffic and surroundings.<br />Gives directional commands.<br />Makes the overall decisions.</p>
        <p className={sidebar.subtitle}>The dog</p>
        <p className={sidebar.text}>Keeps a safe line.<br />Avoids obstacles.<br />Stops at kerbs.<br />Finds useful landmarks.<br />Refuses unsafe movement when necessary.</p>
        <p className={sidebar.text}>It is not a dog leading a passive human. It is two specialists dividing one journey between them.</p>
      </SidebarCard>
    ),
  },
  {
    // Reused verbatim from article 1 (see CostToTrainCard). Paired with the
    // training section so it lands beside the cost/training copy on mobile.
    id: "cost-to-train",
    pairWith: "ordinary-world",
    node: <CostToTrainCard />,
  },
  {
    id: "what-changes",
    pairWith: "bigger-change",
    node: (
      <SidebarCard title="What changes?">
        <p className={sidebar.subtitle}>Before</p>
        <p className={sidebar.text}>&quot;Can I manage that journey safely?&quot;</p>
        <p className={sidebar.subtitle}>With the partnership</p>
        <p className={sidebar.text}>&quot;Where am I going?&quot;</p>
      </SidebarCard>
    ),
  },
  {
    id: "dog-thinks",
    pairWith: "is-a-job",
    node: (
      <SidebarCard title="What the dog thinks it's doing">
        <p className={sidebar.text}>
          <strong>What humans think:</strong> a trained assistance dog is providing safe mobility, obstacle avoidance and independent travel for a person with sight loss.
        </p>
        <p className={sidebar.text}>
          <strong>What the dog thinks:</strong> harness on. Walk nicely. Do not step off there. Ignore that pigeon. Ignore that pigeon. Ignore that pigeon.
        </p>
      </SidebarCard>
    ),
  },
  {
    id: "honest-version",
    pairWith: "matching",
    node: (
      <SidebarCard title="The honest version">
        <p className={sidebar.text}>A guide dog does not replace a person's own mobility skills, and it does not know the route. The person navigates; the dog handles what is immediately in the way.</p>
        <p className={sidebar.text}>Not every pairing works. Matching is done on walking pace, lifestyle, confidence and temperament, and two well-qualified individuals can still be wrong for each other.</p>
        <p className={sidebar.text}>Guide dogs retire, usually after several years, because the work needs concentration and fitness. That is part of the arrangement rather than a failure.</p>
      </SidebarCard>
    ),
  },
  {
    id: "sources",
    pairWith: "tail",
    node: (
      <SidebarCard title="Sources">
        <p className={sidebar.sources}>Guide Dogs</p>
      </SidebarCard>
    ),
  },
];

// Article + breadcrumb structured data for this essay. Every value comes from
// this page: headline is the on-page heading, description reuses the metadata
// description, image is the real hero above. Author and publish date are omitted
// (the page has no honest source for either). Publisher links to the site-wide
// Organization node emitted in app/layout.tsx.
const HEADLINE = "The Dog That Gives You Your World Back";
const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: HEADLINE,
      description: metadata.description,
      image: `${SITE_URL}/guide_dog_image.jpg`,
      publisher: { "@id": `${SITE_URL}/#organization` },
      mainEntityOfPage: `${SITE_URL}/dogs-at-work/the-dog-that-gives-you-your-world-back`,
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Dogs at Work", item: `${SITE_URL}/dogs-at-work` },
        { "@type": "ListItem", position: 3, name: HEADLINE, item: `${SITE_URL}/dogs-at-work/the-dog-that-gives-you-your-world-back` },
      ],
    },
  ],
};

export default function GuideDogsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(ARTICLE_JSONLD).replace(/</g, "\\u003c"),
        }}
      />
      <Nav showLogo />
      <main className={styles.essayPage}>
        <div className={styles.essayHero}>
          {/* Hero and alt supplied by Steve (12 Aug 2026). */}
          <img
            src="/guide_dog_image.jpg"
            alt="a man with a white cane sitting on a park bench beside a black Labrador in a yellow guide-dog harness"
            className={styles.essayHeroImg}
          />
          <div className={styles.essayHeroTint} />
          <div className={styles.essayHeroContent}>
            <Link href="/dogs-at-work" className={styles.backLink}>← Back to Dogs at Work</Link>
            <div className={styles.essayHeroMeta}>
              <span className={`${styles.tag} ${styles.tagPeople}`}>People</span>
              <span className={styles.tagBreed}>Guide dogs</span>
            </div>
            <h1 className={styles.essayHeroTitle}>The Dog That Gives You Your World Back</h1>
          </div>
        </div>

        <ArticleTextToggle />

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
            {/* The payslip (brief v3.0 section 13 + Appendix C). Trimmed article 6
                values from the supplied copy, not the longer originals. */}
            <Payslip data={PAYSLIPS["the-dog-that-gives-you-your-world-back"]} className={styles.payslipOverlay} />

            {CARDS.map((c) => (
              <React.Fragment key={c.id}>{c.node}</React.Fragment>
            ))}
          </aside>
        </div>

        {/* Mobile: single interleaved column. Payslip in the after-hero slot, then
            each card above its paired H2 (see MobileArticleBody). */}
        <div className={styles.articleMobile}>
          <div className={styles.mobilePayslip}>
            <Payslip data={PAYSLIPS["the-dog-that-gives-you-your-world-back"]} />
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
