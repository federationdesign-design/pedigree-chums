import type { Metadata } from "next";
import * as React from "react";
import Link from "next/link";
import { SITE_URL } from "../../../lib/site";
import Nav from "../../../components/Nav/Nav";
import Footer from "../../../components/Footer/Footer";
import styles from "../good-dog-bad-dog.module.css";
import ArticleTextToggle from "../../../components/ArticleTextToggle/ArticleTextToggle";
import { RescueRoll, GazeLoop } from "../../../components/BeastPanels/BeastPanels";
import RunningCostCard from "../../../components/RunningCostCard/RunningCostCard";
import SuitabilityRadar from "../../../components/SuitabilityRadar/SuitabilityRadar";
import TrainingCard from "../../../components/TrainingCard/TrainingCard";
import GroomingCard from "../../../components/GroomingCard/GroomingCard";
import ExerciseCard from "../../../components/ExerciseCard/ExerciseCard";
import runningCosts from "../../../data/runningCosts";
import suitabilityScores from "../../../data/suitabilityScores";
import trainingDifficulty from "../../../data/trainingDifficulty";
import groomingNeeds from "../../../data/groomingNeeds";
import exerciseNeeds from "../../../data/exerciseNeeds";

/* ODIN, 23 September 2026 (owner), written to publish alongside the release of
   Heart of the Beast on 25 September.

   NAMED AFTER THE DOG, NOT THE FILM (owner, 23 September 2026): the route was
   /good-dog-bad-dog/heart-of-the-beast for a few hours and is now
   /good-dog-bad-dog/odin, with a permanent redirect in next.config.ts, because
   the article is about the dog and the film is only the way in.

   REWORKED TO THE SERIES THEME, 10 October 2026 (owner, J18-338): the article now
   asks what the film's picture of the German Shepherd says about the real breed,
   as the other Good Dog, Bad Dog essays do for theirs. UK instances only (no Rin
   Tin Tin): the Alsatian renaming and 1920s breed boom (Country Life), the Hull
   dock police (British Transport Police history), the 1931 Wallasey guide dogs,
   the German Shepherd Dickin Medal dogs Irma, Jet of Iada and Antis, PD Finn and
   Finn's Law, and the Crufts 2016 sloping-back row. Plain language throughout:
   the brain-anatomy paragraph is rewritten for children. The film strand and the
   science (attachment, stress odour, the gaze loop) are kept.

   FILM FACTS are from reviews published 22 and 23 September 2026 (Variety,
   Deadline, IndieWire, Daily Beast) and the film's own listing: David Ayer
   directing, Cameron Alexander writing, Brad Pitt as James Belmont, a German
   Shepherd called Uber playing Odin, the three legs and prosthetic, the titanium
   teeth, and the fifty-eight miles to the nearest road.

   RESCUE DOGS are German Shepherds only (owner, J18-338): Irma, Jet of Iada and
   Antis from the PDSA Dickin Medal roll, and the police dog Finn.

   SCIENCE: Nagasawa et al., Science, 2015, for the oxytocin-gaze loop and the
   wolf control group; Wilson et al., PLOS ONE, 2022, Queen's University Belfast,
   for stress-odour detection, qualified as detection rather than comprehension;
   Topal et al., Journal of Comparative Psychology, 1998, for the strange-situation
   work on attachment.

   HERO IMAGE. Supplied by the owner on 23 September 2026 as obin-uber-hero-img.jpg
   (the file name's "obin" is the owner's spelling and is kept so the file and the
   reference cannot drift apart). It replaces the German Shepherd card art the page
   launched with. Check the licence before the page is promoted anywhere paid. */

export const metadata: Metadata = {
  title: "Odin: Why a Dog Will Not Leave You | Pedigree Chums",
  description:
    "Brad Pitt's new film strands a man and a three-legged German Shepherd in Alaska. How Britain went from fearing the Alsatian to trusting it, the German Shepherds who really did save their people, and why the breed attaches to one person and stays.",
  alternates: { canonical: "/good-dog-bad-dog/odin" },
  openGraph: {
    title: "Odin: Why a Dog Will Not Leave You",
    description:
      "One man, one German Shepherd, fifty-eight miles. The breed's real British story, and what the science says about why it stays.",
    url: `${SITE_URL}/good-dog-bad-dog/odin`,
    images: ["/obin-uber-hero-img.jpg"],
    type: "article",
  },
};

type Block = string | { h: string } | { quote: string };

const BODY: Block[] = [
  "Somewhere over the Alaskan mountains, a small plane comes down. When the noise stops there are two survivors: a retired Special Forces officer called James Belmont, and a German Shepherd called Odin. The nearest road is fifty-eight miles away. Neither of them is in any condition to walk it.",
  "That is Heart of the Beast, David Ayer's survival film, with Brad Pitt as the man and a German Shepherd named Uber playing the dog. Odin is a retired combat dog, raised by Belmont from a puppy, and he carries the evidence of that life with him: titanium teeth, three legs and a prosthetic where the fourth used to be.",
  "Whether it means to or not, the film leans on a picture of the German Shepherd that most British viewers already carry in their heads: the police dog, the army dog, the guard at the gate, the dog that belongs to one person and nobody else. The film does not need to explain why Odin will not leave Belmont. It cast the breed that comes with that story already attached.",
  "So this is a question about the breed as much as the film. Where did that picture come from, how much of it is true, and what has it cost the dogs who have had to live up to it?",

  { h: "The wolf dog Britain was afraid of" },
  "The German Shepherd was made in Germany in the 1890s by a cavalry officer, Max von Stephanitz, who wanted one clever, steady working dog for the farms and later for the army. The first ones reached Britain around 1911 and hardly anyone noticed them.",
  "The First World War changed that. British soldiers came home talking about the German army's dogs: messengers, guards, and dogs trained to find the wounded on the battlefield. People wanted one. But a dog with German in its name was not an easy sell after the war, so in Britain it became the Alsatian Wolf Dog, named after the border region of Alsace.",
  "The new name sold the dog and frightened people in the same breath. Through the 1920s the Alsatian became Britain's first great breed craze, and breeders rushed to meet demand. Rushed breeding meant nervous, unpredictable dogs, and the breed's reputation fell almost as fast as it had risen. To many people it was simply a wolf in the house, a dog that might attack without being told to. In 1928 Country Life magazine said Alsatians were like caviare: you either loved them or you could not stand them.",
  "That is the Bad Dog half of this breed's story, and it has never completely gone away. The same reputation that makes a German Shepherd the obvious dog to cast as a fearless hero also makes some people cross the road when one comes towards them.",

  { h: "How the breed won Britain back" },
  "What rescued the German Shepherd's name in Britain was work, not films.",
  "The railway police on the docks at Hull, who had used Airedale Terriers since 1908, had switched to Alsatians by 1923. In 1931 Britain's first four guide dogs, Flash, Judy, Meta and Folly, qualified in Wallasey on Merseyside, and all four were German Shepherds. In the Second World War, Alsatians guarded RAF airfields, carried messages and searched bombed buildings in London. Today the police dog that British forces send after a running suspect is still very often a German Shepherd, though the Belgian Malinois is catching up.",
  "Each of those jobs asked for the same thing: a dog that would stay with one person and keep working when everything around it was frightening. By 1977 the breed's standing had recovered enough for the Kennel Club to let it be registered again under its proper name, the German Shepherd Dog.",

  { h: "One dog, one person" },
  "Start with the thing the film gets right. Odin is not devoted to people in general. He is devoted to Belmont.",
  "Not every dog is like this. A Labrador will usually go home with anyone holding a biscuit. But some breeds are known for attaching hardest to one person in the household, and the German Shepherd is the classic example, alongside breeds such as the Akita and the Shiba Inu. It is friendly enough with the family, often reserved with strangers, and plainly organised around one human: their car, their footsteps, their key in the door.",
  "That is not an accident. Von Stephanitz bred his dogs to work all day beside a single shepherd, watching for every signal. The police and the army chose the breed for the same reason. A British police dog usually lives at home with its handler and works only with that handler, often for its whole career.",
  "Part of the bond is built very early. Between about three and twelve weeks old, a puppy goes through what scientists call the socialisation window, when it learns who and what is safe. A German Shepherd puppy raised by one person through those weeks, as Odin was raised by Belmont, learns that this person is where safety lives.",
  "People sometimes say the puppy comes to think the human is its mother. That is not quite right. But scientists have tested dogs with an experiment first designed for human babies and their parents, and dogs behave in a very similar way: they use their person as a safe base, they get upset when that person leaves, and they settle when that person comes back.",
  { quote: "Obedience is doing what someone asks. Attachment is what remains when nobody has asked for anything." },
  "There is a harder side to it. The dog that settles when its person comes back is the same dog that comes apart when they disappear: the whining at the window, the refusal to eat, the pacing while someone is in hospital. The bond gives the dog security, and it gives the dog something to lose.",

  { h: "The dogs who would not leave" },
  "A survival film with a German Shepherd in it works so easily because the real stories are already on record. Britain even has a medal for some of them: the PDSA Dickin Medal, created during the Second World War for bravery by animals. Several German Shepherds have won it, and what they were doing tells you a lot about the breed.",
  "Irma was an Alsatian who worked with her owner, Margaret Griffin, in the London Civil Defence during the Blitz. She is credited with helping to rescue 191 people from bombed buildings, working through the rubble alongside the rescue squads. She won the Dickin Medal in January 1945.",
  "Jet of Iada, a black Alsatian born in Liverpool, was the first dog used officially for Civil Defence rescue in London, working with Corporal Wardle. He helped rescue dozens of people trapped under the ruins and won the Dickin Medal on the same day as Irma.",
  "Antis is the closest real dog to Odin. Early in the Second World War, a Czech airman, Robert Bozdech, found him as a puppy in an abandoned farmhouse in no man's land in France, and raised him himself. Antis flew around thirty missions with Bozdech's RAF squadron from bases in England. Once, left behind on the quay at Gibraltar, he swam out to Bozdech's ship rather than be parted from him. In 1948 he guided Bozdech past guards and searchlights when he escaped from Czechoslovakia. He won the Dickin Medal in 1949.",
  "And the bond is not only history. In October 2016, in Stevenage, a police German Shepherd called Finn caught a fleeing suspect who then stabbed him in the chest and head. Finn kept his grip until his handler, PC Dave Wardell, could disarm the man. He survived, and was back at work eleven weeks later.",
  "Four German Shepherds, the same pattern each time. None of them was rescuing a stranger out of general goodness. Each was working beside one person, and the rescue happened inside that partnership.",

  { h: "How a dog knows something is wrong" },
  "So how does the dog notice that something is wrong? Because it is picking up far more than we realise. When Belmont talks to Odin, Odin is not only listening. He is reading the way Belmont stands, breathes, moves and looks. And above all, he is smelling him.",
  "Smell is wired more directly than our other senses to the parts of the brain that deal with feelings and memories, which is why a smell can bring back a feeling in an instant. For a dog, whose nose is many thousands of times more sensitive than ours, that channel matters far more than it does for us.",
  "There is evidence for this from the UK. In 2022, researchers at Queen's University Belfast collected breath and sweat samples from people before and after a stressful task, and trained dogs picked out the stressed samples far more often than chance. That does not mean the dogs understood why anyone was stressed, or could read minds. It means stress changes the way we smell, and dogs can notice the change, possibly before we have admitted it to ourselves.",

  { h: "The look" },
  "Then there is the thing dogs do that almost no other animal does in quite the same way. They look at us. Not a glance. A proper look.",
  "In 2015, a team in Japan studied dogs and their owners gazing at each other, and found that a long shared look raised oxytocin, a hormone linked with bonding, in both of them. When dogs were given extra oxytocin, they looked at their owners for longer, and the owners' oxytocin rose too. The bond seemed able to feed itself: the dog looks, the person responds, the dog responds to the response.",
  "The team ran the same test with wolves raised by people, and the loop did not appear. Over thousands of years beside us, dogs became unusually good at plugging into human friendship, several times a day, for free, at the bottom of the stairs.",
  "The evidence is not perfect. Oxytocin is not a love potion, and the effect varies between dogs. But the main point stands: dogs do not just receive our affection. They help keep the bond going themselves.",

  { h: "The bond they did not have to act" },
  "Which brings us to the part of Heart of the Beast that is not fiction at all.",
  "Uber, the German Shepherd playing Odin, was a working search and rescue dog before he was a film dog. He had flown in helicopters and been to real incidents. The film did not teach him to stay calm in chaos; it hired him because he already could. In other words, the film cast exactly the dog that the breed's British history describes.",
  "Over the shoot in New Zealand, wet and cold for twelve hours a day, the same bond started to form with the actor. Pitt has said his first job, before any acting, was getting the dog to trust him and feel safe with him. Safety first, attention second, everything else after that: the same order the science describes.",
  "David Ayer, the director, put it in one line. They found the relationship, he said, in the eyes.",
  "It shows in the working detail too. Pitt has described keeping treats in his pocket and breaking off mid-scene to call the dog back, because Uber had wandered off after something more interesting. The dog was not acting. It was doing what it liked doing, near a man it had decided to be near, and the camera collected the result.",

  { h: "The other picture of the breed" },
  "There is a second image of the German Shepherd in Britain, and it is not the one in the film.",
  "At Crufts in 2016, the German Shepherd judged best of its breed had a steeply sloping back and struggled to walk steadily on its back legs. The footage was shown on television and caused an outcry. The vet who chaired the Kennel Club's own dog health group said he was appalled that the dog had been held up as a good example of the breed, and the RSPCA called for judges to put health first.",
  "It showed how far one version of the breed had drifted from the other. The working German Shepherd, the police dog and the search dog, is bred to move freely and work all day. Some show lines were being bred for a look. Odin, Irma and Finn belong to the first kind. Anyone choosing a German Shepherd puppy in Britain today is choosing between both.",

  { h: "Is it courage if the dog cannot help it?" },
  "This is where it gets awkward. We call Irma brave. We call Finn brave. Odin is framed as a hero because he stays where leaving would be easier. But does courage need a choice?",
  "A human hero can, in theory, understand the danger, think about leaving and decide to stay. Finn was not weighing up the risk in Stevenage. Irma did not know what a medal was. The dog has a person, something is wrong, and leaving does not feel like the right thing to do.",
  "At first that sounds as if it shrinks the achievement. But think about human courage for a moment. A parent running towards an injured child does not stop to calculate the risk. Someone diving into the water after a stranger often moves before they think.",
  "Sometimes attachment is what creates courage. Explaining how it works does not make the behaviour smaller; it may explain why it is so powerful. Loyalty is probably not a noble decision made from first principles. It is older and simpler than that: a body that has learned where safety lives, and a bond so deep that staying feels easier than leaving.",
  "Which means the medal-winning dog and the German Shepherd waiting behind someone's front door are running versions of the same programme. One makes the news. The other happens every evening.",

  { h: "What we owe the dog" },
  "Humans did not simply discover dogs behaving like this. With the German Shepherd, we built it on purpose. For more than a century we chose the dogs that watched one person, followed one person and kept working for one person, and then we praised the result as loyalty. We gave it medals, put it on the docks and the airfields, and cast it in films.",
  "There is nothing wrong with celebrating that. But the same bond that makes a dog stay when we are in trouble makes it vulnerable to us when we are not. A dog cannot decide the workload has become too much, or tell you in words that it has had enough. The quality we admire most is often the reason it keeps going.",
  "Which brings us back to Odin's missing leg. The film puts the question on screen without needing to explain it: a working dog has given part of its body to the partnership, and somebody now has to look after it, the prosthetic, the stiff joints, the years after the useful part has ended.",
  "Britain has started to answer that question. After Finn was stabbed, the law could only treat the attack on him as damage to property. His handler campaigned to change that, and in 2019 Finn's Law gave service animals such as police dogs and horses proper protection in their own right. Finn retired, lived out his days at home with the man he had protected, and died peacefully in 2023, aged fourteen.",
  "The miracle is not simply that the dog stays. It is that people and German Shepherds built a partnership in which, sometimes, leaving feels harder than staying. If the dog keeps its side of that bargain, we owe it ours.",
];

const GSD = "german-shepherd"; // the breed cards in the sidebar (J18-336)
const HEADLINE = "Odin: Why a Dog Will Not Leave You";
const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: HEADLINE,
      description: metadata.description,
      image: `${SITE_URL}/obin-uber-hero-img.jpg`,
      datePublished: "2026-09-24",
      dateModified: "2026-10-10",
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
            src="/obin-uber-hero-img.jpg"
            alt="Odin, the retired combat dog of Heart of the Beast, played by a German Shepherd called Uber."
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
                      <FilmCard />
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
            {/* THE GERMAN SHEPHERD (owner, J18-336, 7 October 2026): the same breed
                cards as the Gelert page, for the German Shepherd, replacing the
                "Meet the German Shepherd" panel. Its introduction keeps a box of
                its own above them. */}
            {/* Styled as the Argos page's first box (owner, J18-337): the dog's
                name, the film as subtitle, centred text. */}
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 4px" }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "54px", textAlign: "center", letterSpacing: "0.12em", color: "var(--yellow-header)", textTransform: "uppercase", margin: "0 0 4px" }}>Odin</p>
                <p style={{ textAlign: "center", fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 600, color: "#fff" }}>Heart of the Beast</p>
              </div>
              <div style={{ padding: "9px 25px 16px 25px" }}>
                <p style={{ textAlign: "center", fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 500, color: "#fff", lineHeight: 1.3 }}>
                  Odin is not a breed chosen for the poster. Everything the film asks of him is on this dog&rsquo;s job
                  description, including the line about bonding to one handler.
                </p>
              </div>
            </div>
            {runningCosts[GSD] && <div className={styles.sidebarCard}><RunningCostCard config={runningCosts[GSD]} /></div>}
            {suitabilityScores[GSD] && <div className={styles.sidebarCard}><SuitabilityRadar score={suitabilityScores[GSD]} breedName="German Shepherd" /></div>}
            {trainingDifficulty[GSD] && <div className={styles.sidebarCard}><TrainingCard data={trainingDifficulty[GSD]} /></div>}
            {groomingNeeds[GSD] && <div className={styles.sidebarCard}><GroomingCard data={groomingNeeds[GSD]} /></div>}
            {exerciseNeeds[GSD] && <div className={styles.sidebarCard}><ExerciseCard data={exerciseNeeds[GSD]} /></div>}
            {/* The rescue dogs, moved here from the reading column (owner, J18-335). */}
            <RescueRoll side />

            <div className={styles.sidebarCard}>
              <div style={{ padding: "18px 20px" }}>
                <p style={cardTitle}>Sources</p>
                <p style={{ ...cardBodyLast, fontSize: "0.8rem", color: "#aac4d4" }}>
                  Country Life, on the Alsatian in Britain and the 1920s breed boom. British Transport Police history,
                  on the Hull dock dogs. PDSA Dickin Medal records for Irma, Jet of Iada and Antis. The Animal Welfare
                  (Service Animals) Act 2019 (Finn&apos;s Law). Veterinary Times, March 2016, on the Crufts German
                  Shepherd. The Association of Pet Behaviour Counsellors, on the socialisation window. Nagasawa et al.,
                  Science (2015), on the oxytocin-gaze loop and the wolf control group. Wilson et al., PLOS ONE (2022),
                  Queen&apos;s University Belfast, on the detection of stress odour. Topal et al., Journal of Comparative
                  Psychology (1998), on attachment. Film details and cast interviews from Variety, Collider,
                  Entertainment Weekly and People, published between August and 23 September 2026.
                </p>
              </div>
            </div>
          </aside>
        </div>

        <div className={styles.verdict}>
          <strong>The verdict:</strong> Good dog, and earned the hard way. Britain once feared the Alsatian as a
          wolf in the house; police work, guide dogs and the Blitz won it back. Odin stays because the breed was made
          to stay with one person, and that bond is worth honouring, not just admiring.
        </div>
      </main>
      <Footer />
    </>
  );
}

/* THE FILM CARD in the Argos page's style (owner, J18-333, 7 October 2026): the
   same layout as NolanFilmCard on /good-dog-bad-dog/argos, title, credit line,
   three figures, the red panel and the cast pills. No star rating, as Argos's is
   our own score and none has been given here; a US certificate, as no UK one is
   held. Facts as before: Paramount, released 25 September 2026, David Ayer,
   PG-13 for violence, peril and injury images, 101 minutes. */
function FilmCard() {
  return (
    <div className={styles.sidebarCard}>
      <div style={{ padding: "16px 20px 4px" }}>
        <p style={{ fontFamily: "var(--font-display)", fontSize: "54px", textAlign: "center", letterSpacing: "0.12em", color: "var(--yellow-header)", textTransform: "uppercase", margin: "0 0 2px", lineHeight: 1 }}>Heart of the Beast</p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 600, color: "#fff", textAlign: "center" }}>David Ayer · Paramount · 2026</p>
      </div>
      <div style={{ padding: "12px 30px 4px 30px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, margin: "4px 0 16px" }}>
          {([
            { label: "Runtime", value: <>101 <span style={{ fontSize: "75%" }}>min</span></> },
            { label: "Released", value: "Sept 25" },
            { label: "US cert", value: "PG-13" },
          ] as { label: string; value: React.ReactNode }[]).map(({ label, value }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--yellow)", marginBottom: 3 }}>{label}</p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "3.4rem", color: "#fff", lineHeight: 1 }}>{value}</p>
            </div>
          ))}
        </div>
        <div style={{ background: "#ef4444", borderRadius: 8, padding: "26px 30px", marginBottom: 16, textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "1.05rem", fontWeight: 700, color: "#fff", marginBottom: 4 }}>Parental guidance advised</p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.98rem", fontWeight: 500, color: "#fff", lineHeight: 1.3 }}>Rated PG-13 in the United States for violence, peril and injury images.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {["Brad Pitt", "Uber as Odin"].map(name => (
            <span key={name} style={{ fontFamily: "var(--font-body)", fontSize: "1.04rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--navy)", background: "var(--yellow)", borderRadius: 999, padding: "8px 20px", display: "inline-block" }}>{name}</span>
          ))}
        </div>
      </div>
      <div style={{ height: 16 }} />
    </div>
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
