import type { Metadata } from "next";
import * as React from "react";
import Link from "next/link";
import { SITE_URL } from "../../../lib/site";
import Nav from "../../../components/Nav/Nav";
import Footer from "../../../components/Footer/Footer";
import styles from "../good-dog-bad-dog.module.css";
import ArticleTextToggle from "../../../components/ArticleTextToggle/ArticleTextToggle";
import { BreedFacts, RescueRoll, GazeLoop } from "../../../components/BeastPanels/BeastPanels";

/* ODIN, 23 September 2026 (owner), written to publish alongside the release of
   Heart of the Beast on 25 September.

   NAMED AFTER THE DOG, NOT THE FILM (owner, 23 September 2026): the route was
   /good-dog-bad-dog/heart-of-the-beast for a few hours and is now
   /good-dog-bad-dog/odin, with a permanent redirect in next.config.ts, because
   the article is about the dog and the film is only the way in.

   THREE STRANDS, as agreed: the film, the dogs who would not leave, and the
   science underneath both. The argument is that the rescue dog and the dog at
   your door are running the same programme, so the heroism is not a fluke of
   temperament in a few remarkable animals.

   FILM FACTS are from reviews published 22 and 23 September 2026 (Variety,
   Deadline, IndieWire, Daily Beast) and the film's own listing: David Ayer
   directing, Cameron Alexander writing, Brad Pitt as James Belmont, a German
   Shepherd called Uber playing Odin, the three legs and prosthetic, the titanium
   teeth, and the fifty-eight miles to the nearest road.

   RESCUE DOGS are quoted from the PDSA Dickin Medal citations. Two widely
   repeated details are deliberately not relied on: Rip's hundred lives and Judy's
   registration as a prisoner of war, neither of which is in a citation.

   SCIENCE: Nagasawa et al., Science, 2015, for the oxytocin-gaze loop and the
   wolf control group; Wilson et al., PLOS ONE, 2022, Queen's University Belfast,
   for stress-odour detection, qualified as detection rather than comprehension;
   Topal et al., Journal of Comparative Psychology, 1998, for the strange-situation
   work on attachment.

   NO FILM STILLS. The hero image is our own German Shepherd card art, so the page
   can go live without waiting on Paramount. */

export const metadata: Metadata = {
  title: "Odin: Why a Dog Will Not Leave You | Pedigree Chums",
  description:
    "Brad Pitt's new film strands a man and a three-legged German Shepherd in Alaska. The dogs who really did save their humans, and the science of why a dog attaches to one person and stays.",
  alternates: { canonical: "/good-dog-bad-dog/odin" },
  openGraph: {
    title: "Odin: Why a Dog Will Not Leave You",
    description:
      "One man, one dog, fifty-eight miles. The real rescues behind the film, and what the science says about why dogs stay.",
    url: `${SITE_URL}/good-dog-bad-dog/odin`,
    type: "article",
  },
};

type Block = string | { h: string } | { quote: string };

const BODY: Block[] = [
  "Somewhere over the Alaskan mountains, a small plane comes down. When the noise stops there are two survivors: a retired Special Forces officer called James Belmont, and a German Shepherd called Odin. The nearest road is fifty-eight miles away. Neither of them is in any condition to walk it.",
  "That is Heart of the Beast, David Ayer's survival film, with Brad Pitt as the man and a German Shepherd named Uber playing the dog. Odin is not a pet who happens to be along for the trip. He is a retired combat dog, raised by Belmont from a puppy, and he carries the evidence of that life with him: titanium teeth, three legs and a prosthetic where the fourth used to be.",
  "Most of the film has very little dialogue, which works because the other main character cannot talk. But silence is not the same as nothing being said. A dog living beside a person is constantly receiving information that person does not know they are giving away.",
  "Whether it means to or not, the film is really about three things: why a dog stays, how a dog knows something is wrong, and what humans owe an animal that has been shaped to do both. The film is fiction. The machinery underneath it is not.",

  { h: "One dog, one person" },
  "Start with the thing the film gets right. Odin is not devoted to humanity. He is devoted to Belmont.",
  "Anyone who has lived with a dog that has a particular person in the household knows the shape of it. The dog may like everyone, greet everyone, take food and walks from anyone. But one person becomes different. It knows their car, their footsteps, their key in the door, and it sleeps facing the place they are expected to come back through.",
  "Dogs do more than tolerate human company. They form genuine attachment relationships with particular people, and researchers have tested it using versions of the strange situation, the experiment developed to study attachment between human infants and their caregivers. Dogs use their owner as a secure base. They behave differently when that person leaves, and differently again when they return.",
  { quote: "Obedience is doing what someone asks. Attachment is what remains when nobody has asked for anything." },
  "That is the first thing the film understands about Odin. Belmont is not merely his handler. He is where the dog expects the world to make sense.",
  "There is a less comfortable side to it. The dog that settles when its person comes back is the same dog that comes apart when they disappear: the whining at the window, the refusal to eat, the pacing while somebody is in hospital. We enjoy the greeting at the door. The dog carries the waiting. The relationship gives the dog security, and it gives the dog something to lose. That is the first half of the bargain, and it matters later.",

  { h: "The dogs who would not leave" },
  "A survival film with a dog in it works so easily because we have already watched versions of this happen for real. Britain even has a medal for some of them: the PDSA Dickin Medal, created during the Second World War for conspicuous gallantry by animals. The interesting part is not that dogs received medals. It is what the dogs were actually doing.",
  "Rip was a stray, found in Poplar during the Blitz and adopted by an air raid patrol. Nobody had trained him. He simply began finding people in collapsed buildings, and the work helped prove that dogs could search bombed sites at all. Something in the dog was already useful; humans noticed afterwards and gave the job a name.",
  "Sheila was a working border collie on a Northumberland hill farm. In December 1944 a US B-17 came down in the Cheviots in fog and snow, and her shepherd John Dagg climbed towards the wreck with her. In conditions where a man could barely see, she led him to four airmen sheltering in the hillside. They got them down, and shortly afterwards the bombs still aboard the aircraft went off. This was not an anonymous rescue dog searching for an anonymous victim. It was a working dog following the person it already worked beside: the partnership came first, and the rescue happened inside it.",
  "Judy was a ship's dog who survived a sinking and then three years in Japanese prison camps in Sumatra. Her citation praises courage, endurance, intelligence and watchfulness, but the revealing part is not what she did for Frank Williams. It is what he said she did to him. She gave him something to protect. Now the relationship is running both ways: the dog is not simply saving the human, the human is being held together by the need to keep the dog alive.",
  "Three dogs, three increasingly complicated versions of one relationship. And one thing worth noticing: we give medals for the dramatic moments when attachment saves us, and nothing at all for the thousands of ordinary days when the same attachment costs the dog something.",

  { h: "The part you cannot see" },
  "So why does the dog notice that something is wrong? Because it is receiving a version of the world we barely experience. When Belmont talks to Odin, Odin is not only listening. He is reading: posture, breathing, movement, the direction of a gaze, routine, expression. And smell, especially smell.",
  "The mammalian sense of smell takes an unusual route through the brain. Unlike vision or hearing, its first journey towards the cortex does not require the same obligatory relay through the thalamus, and olfactory pathways connect closely with the systems that handle emotion and memory. That is part of why a smell can feel less like information arriving and more like a feeling appearing fully formed. For a dog, that channel matters immeasurably more than it does for us.",
  "So a person can begin changing before they consciously know they have changed. Heart rate shifts. Breathing alters. Sweat chemistry moves. The dog may already have the news.",
  "There is experimental evidence for part of this. In 2022, researchers collected breath and sweat samples from people before and after a stressful task, then asked trained dogs to pick the stressed samples from the calm ones taken from the same people. The dogs performed far above chance. That does not mean they understood why anyone was stressed, and it certainly does not mean they read minds. It means stress changes us chemically and dogs can detect some of that change. The dog beside you may know your body has changed before you have said a word, and possibly before you have admitted it to yourself.",
  "Which makes the silence in the film look less like a filmmaking trick. Dialogue was never the main channel.",

  { h: "The look" },
  "Then there is the thing dogs do that almost nothing else does in quite the same way. They look at us. Not glance, not monitor. Look.",
  "In 2015, researchers led by Miho Nagasawa studied prolonged gaze between dogs and their owners, and found that longer mutual gaze went with rises in oxytocin in both of them. Oxytocin is involved in social bonding, including between human parents and infants. Then they pushed it further: dogs given oxytocin gazed more at their owners, and the owners' oxytocin rose in turn. The relationship appeared capable of feeding itself. Dog looks at human. Human responds. Dog responds to the response.",
  "The comparison with wolves is the interesting part. The same loop did not appear in wolves raised by people. A dog looking at you is not simply a tame wolf looking at you. Across thousands of years beside us, dogs became unusually good at getting inside human social circuitry, several times a day, for free, at the bottom of the stairs.",
  "The evidence is not perfect. Oxytocin is not a love chemical, and the effect varies with the dog's sex, breed and history with the person. But the broader point survives the caution: dogs are not passive recipients of human affection. They maintain the bond themselves.",
  "So attachment explains why the dog stays. Scent and behaviour explain how the dog knows. Gaze explains how the relationship keeps renewing itself. Humans have benefited enormously from all three.",

  { h: "The bond they did not have to act" },
  "Which brings us to the part of this that is not fiction at all.",
  "Uber, the German Shepherd playing Odin, was a working search and rescue dog before he was ever a film dog. He had been on helicopters and been to real incidents. The film did not teach him to be steady in chaos; it hired him because he already was.",
  "And over the shoot, in New Zealand, wet and cold for twelve hours a day, the thing the article has been describing happened to the actor. Pitt has said since that he wanted the dog to trust him and to feel safe with him, and that this was the first job before any acting could happen. Not a performance of a bond. The actual construction of one, in the order the mechanism requires: safety first, attention second, everything else after that.",
  "David Ayer, directing, put it in one line. They found the relationship, he said, in the eyes.",
  { quote: "That is the 2015 experiment, restaged by accident on a film set, by two people who were only trying to get a scene." },
  "It shows in the working detail too. Pitt has described having to keep treats on him and break mid-scene to call the dog back, then drop straight back into the emotion, because the dog had wandered off after something more interesting. The dog was not acting. It was doing what it liked doing, near a man it had decided to be near, and the camera collected the result.",
  "Pitt called it a moving experience and says the dog's expressions still get to him. He has three dogs of his own now, one of them a rescue taken on since filming.",
  "Which is the whole argument, arriving from the least likely direction. You cannot spend months building trust with a dog and come away unchanged, because the loop does not care that one of you is being paid.",

  { h: "Is it courage if the dog cannot help it?" },
  "This is where it gets awkward. We call Rip brave. We call Sheila brave. We call Judy brave. Odin is framed as heroic because he stays where leaving would be easier. But does courage require a choice?",
  "A human hero can supposedly understand the danger, consider leaving and decide to stay. The dog in the rubble is not writing an ethical argument. Sheila did not understand the British Empire Medal. Judy did not know what a prisoner of war was. The dog has a person, something is wrong, and leaving does not feel like the correct response.",
  { quote: "We are the ones who call that courage. The dog would just call it Tuesday, if it called it anything." },
  "At first that sounds like it shrinks the achievement. Maybe the dog is not heroic at all. Maybe it is simply attached. But think about human courage for a moment. A parent running towards an injured child does not stop to calculate risk. Someone going into the water after a stranger often moves before thinking. A person who hears screaming inside a burning building can be running before the moral philosophy arrives.",
  "Sometimes attachment is the mechanism that creates courage. Explaining the mechanism does not make the behaviour smaller; it may explain why it is so powerful. We like to imagine loyalty as a noble decision made from first principles. It is probably older than that, and messier: a body that has learned where safety lives, a nervous system that notices when that safety is threatened, a relationship so thoroughly installed that staying feels less like a decision than leaving would.",
  "Which means the heroic dog and the dog waiting behind your front door are running versions of the same programme. One makes the news. The other happens every evening.",

  { h: "The animal we made" },
  "And now the uncomfortable part. Humans did not merely discover dogs behaving like this. We helped make them.",
  "For thousands of years we favoured the animals that could live beside us: the ones that tolerated us, watched us, followed us, worked with us, came back when called, stayed near the camp, the livestock, the children, the person holding the lead. Generation after generation, the animals that succeeded beside humans reproduced inside a human world. Eventually we had something extraordinary: an animal unusually capable of making one human being the centre of its social universe.",
  "Then we praised the result as loyalty. We gave it medals, built statues, made films.",
  "There is nothing wrong with celebrating it. But the same attachment that makes a dog stay when we are in trouble makes the dog vulnerable to us when we are not. A dog cannot negotiate the terms. It cannot decide the workload has become unreasonable, or weigh another deployment against the arthritis ten years later. It cannot tell you in words that it has had enough. And the quality we admire most is often the reason it keeps going.",

  { h: "The other half of the bargain" },
  "Which brings us back to Odin's missing leg. The film puts the question on screen without needing to explain it. A working dog has given part of its body to the relationship, the work is supposedly over, and somebody has to answer what happens next: the prosthetic, the arthritis, the medication, the years after the useful part has ended. That is not a philosophical question for the dog. It is a practical one for the human.",
  "We are very good at counting what dogs give us. Searches completed, people found, livestock moved, explosives detected, lives saved. We are much worse at counting what goes back the other way. A dog cannot retire itself, and it will keep turning up, because turning up is what the relationship taught it to do.",
  "Somewhere on a fictional Alaskan mountain, a man survives because a three-legged dog will not leave him. Somewhere real tonight, someone will sleep a little more easily because a dog is lying across the end of the bed, listening. Neither dog thinks it is doing anything remarkable, which is exactly why it is.",
  "The miracle is not simply that the dog stays. It is that two species built a relationship in which, sometimes, leaving feels harder than staying. If the dog keeps its side of that bargain, we owe it ours.",
];

const HEADLINE = "Odin: Why a Dog Will Not Leave You";
const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: HEADLINE,
      description: metadata.description,
      image: `${SITE_URL}/german-shepard-square.jpg`,
      datePublished: "2026-09-24",
      dateModified: "2026-09-24",
      publisher: { "@id": `${SITE_URL}/#organization` },
      mainEntityOfPage: `${SITE_URL}/good-dog-bad-dog/odin`,
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Good Dog, Bad Dog", item: `${SITE_URL}/good-dog-bad-dog` },
        { "@type": "ListItem", position: 3, name: HEADLINE, item: `${SITE_URL}/good-dog-bad-dog/odin` },
      ],
    },
  ],
};

export default function HeartOfTheBeastPage() {
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
            src="/german-shepard-square.jpg"
            alt="Illustration of a German Shepherd, the breed that plays Odin in Heart of the Beast."
            className={styles.essayHeroImg}
          />
          <div className={styles.essayHeroTint} />
          <div className={styles.essayHeroContent}>
            <h1 className={styles.essayHeroTitle}>
              <span className={styles.essayHeroTitleWhite}>Odin:</span> Why a Dog Will Not Leave You
            </h1>
            <div className={styles.essayHeroMeta}>
              <span className={`${styles.tag} ${styles.tagGood}`}>Good dog</span>
              <span className={styles.tagBreed}>German Shepherd</span>
            </div>
            <Link href="/good-dog-bad-dog" className={styles.backLink}>Back to Good Dog, Bad Dog</Link>
          </div>
        </div>

        <ArticleTextToggle />

        <div className={styles.essayLayout}>
          <article className={styles.essay}>
            <div className={styles.essayBody}>
              {BODY.map((b, i) => {
                const block =
                  typeof b === "string" ? (
                    <p key={i}>{b}</p>
                  ) : "h" in b ? (
                    <h2 key={i} className={styles.subhead}>{b.h}</h2>
                  ) : (
                    <blockquote key={i} className={styles.pullquote}>{b.quote}</blockquote>
                  );

                /* Panels sit in the reading column, each after the passage it
                   belongs to. Fragments, not wrappers: the essay styles its first
                   paragraph by `p:first-child` and spaces the column by direct
                   children, so a wrapper div breaks both. */
                /* The film card sits at the top, under the introduction, rather
                   than in the sidebar (owner, 23 September 2026): the reader wants
                   the release details before the argument starts. */
                if (typeof b === "string" && b.startsWith("Whether it means to or not")) {
                  return (
                    <React.Fragment key={i}>
                      {block}
                  <div className={styles.sidebarCard}>
                    <div style={{ padding: "18px 20px" }}>
                      <p style={cardTitle}>The film</p>
                      <p style={cardBody}>
                        <strong>Heart of the Beast</strong>, Paramount, released 25 September 2026. Directed by David
                        Ayer, written by Cameron Alexander. Brad Pitt plays James Belmont; Odin is played by a German
                        Shepherd called Uber, with other dogs from the same family covering parts of the role.
                      </p>
                      <p style={cardBodyLast}>
                        Rated PG-13 in the United States for violence, peril and injury images. Running time 101 minutes.
                      </p>
                    </div>
                  </div>
                    </React.Fragment>
                  );
                }
                if (typeof b !== "string" && "h" in b && b.h === "The dogs who would not leave") {
                  return (
                    <React.Fragment key={i}>
                      <BreedFacts />
                      {block}
                    </React.Fragment>
                  );
                }
                if (typeof b === "string" && b.startsWith("Three dogs, three increasingly complicated")) {
                  return (
                    <React.Fragment key={i}>
                      {block}
                      <RescueRoll />
                    </React.Fragment>
                  );
                }
                if (typeof b === "string" && b.startsWith("The evidence is not perfect.")) {
                  return (
                    <React.Fragment key={i}>
                      <GazeLoop />
                      {block}
                    </React.Fragment>
                  );
                }
                return block;
              })}
            </div>
          </article>

          <aside className={styles.sidebar}>

            <div className={styles.sidebarCard}>
              <div style={{ padding: "18px 20px" }}>
                <p style={cardTitle}>Sources</p>
                <p style={{ ...cardBodyLast, fontSize: "0.8rem", color: "#aac4d4" }}>
                  Nagasawa et al., Science (2015), on the oxytocin-gaze loop and the wolf control group. Wilson et
                  al., PLOS ONE (2022), Queen&apos;s University Belfast, on the detection of stress odour. Topal et
                  al., Journal of Comparative Psychology (1998), on attachment. PDSA Dickin Medal citations for
                  Rip, Sheila and Judy. Film details and cast interviews from Variety, Collider, Entertainment Weekly and
          People, published between August and 23 September 2026.
                </p>
              </div>
            </div>
          </aside>
        </div>

        <div className={styles.verdict}>
          <strong>The verdict:</strong> Not devotion as a virtue, but devotion as a mechanism. The dog stays
          because staying is what the relationship is made of, and we get to call it bravery.
        </div>
      </main>
      <Footer />
    </>
  );
}

const cardTitle: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "22px",
  letterSpacing: "0.1em",
  color: "var(--yellow-header)",
  textTransform: "uppercase",
  margin: "0 0 10px",
};
const cardBody: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "0.9rem",
  fontWeight: 500,
  color: "#fff",
  lineHeight: 1.6,
  margin: "0 0 10px",
};
const cardBodyLast: React.CSSProperties = { ...cardBody, margin: 0 };
