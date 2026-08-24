import type { Metadata } from "next";
import { SITE_URL } from "../../../lib/site";
import * as React from "react";
import Link from "next/link";
import Nav from "../../../components/Nav/Nav";
import Footer from "../../../components/Footer/Footer";
import styles from "../good-dog-bad-dog.module.css";
import ArticleTextToggle from "../../../components/ArticleTextToggle/ArticleTextToggle";

export const metadata: Metadata = {
  title: "Anubis: The Scavenger Made Into a God | Good Dog, Bad Dog",
  description:
    "The Egyptians made a dog the god of death -- and it turns out almost everyone did. An essay on the jackal we posted at the door of the dark, from a scavenger of desert graves to a Suffolk hellhound, and why we thanked it by turning its name into an insult.",
  openGraph: {
    images: ["/history/Anubis-hero.jpg"],
  },
};

type Row = string | { h: string } | { quote: string };

const BODY: Row[] = [
  "Picture the god waiting for you at the edge of death.",
  "If you have seen a single Egyptian tomb painting, you may already be picturing a dog.",
  "Not a dragon. Not a skeleton. Not a hooded figure carrying a scythe.",
  "A lean, jet-black, canine-headed figure bent with enormous care over a body, doing what he clearly believes is the most important job in the world.",
  "That is Anubis.",
  "He preserved the dead, guarded their resting places, guided them through the afterlife and stood beside the scales when their hearts were weighed against truth. At the most frightening moment the Egyptians could imagine, they placed a canine figure beside the balance to make sure it was fair.",
  "But Anubis is only the beginning. Once you notice the dog standing at the door of death in Egypt, you begin seeing it elsewhere: at gates, graves, roads, churchyards and the entrances to other worlds.",
  "Then you notice something else.",
  "DOG. GOD.",
  "The same three English letters walking in opposite directions.",
  "There is no known historical connection between the two words. God belongs to an old Germanic family of words for a deity. Dog first appears in Old English as docga and later displaced hund, the ancestor of our word hound; its deeper origin remains uncertain. The Egyptians did not know the English trick. Neither did the Greeks, the Norse or the Mexica.",
  "It is a coincidence.",
  "It is also a remarkably well-placed one, because the history of dogs and death is a history of things being turned around.",
  "The scavenger becomes the guardian. The animal becomes the god. The provider becomes the sacrifice. The guide becomes the monster. The symbol of loyalty becomes an insult.",
  "The dog does almost none of the changing. We do all of it.",
  { h: "Why death has a dog's head" },
  "Long before the pyramids, Egyptians buried their dead near the edge of the desert. That was also the territory of wild canids.",
  "Jackals and other scavengers lived around the margins of settlement, looking for food wherever it could be found. To people who believed that preserving the body mattered to the dead person's continued existence, an animal disturbing a grave threatened the whole journey into the next world.",
  "Nobody wrote down exactly how the association began. It reaches back into Egyptian prehistory. But canids around cemeteries are widely understood as part of the background from which Egypt's protective jackal gods emerged.",
  "The solution was beautifully strange.",
  "The grave robber was handed the keys to the graveyard.",
  "If ordinary canids appeared around the dead, then a divine canid could be imagined protecting them. If the animal already belonged at the edge of death, put a greater version of it in charge.",
  "The jackal did not change. The story did.",
  { h: "Before the dog became divine, it became useful" },
  "There is an older story beneath Anubis.",
  "Long before anyone carved a canine god into a temple wall, hunter-gatherers formed an alliance with the animals that became dogs.",
  "Dogs were the first animals to enter a domestic relationship with humans. New ancient-DNA research places genetically identified dogs alongside hunter-gatherers in western Eurasia roughly 16,000 to 14,000 years ago, before agriculture and before any other known domesticated animal. The exact place and process of domestication remain debated.",
  "There was probably no single clean moment when a wolf became a dog. Animals that could tolerate people gained food and protection. Humans who could work with those animals gained access to abilities no human possessed.",
  "What followed was not simply ownership. It was a merger of abilities.",
  "Humans had weapons, planning, language, fire and the ability to cooperate in large groups.",
  "Dogs brought scent, hearing, speed, endurance and the ability to follow a trail that had disappeared from human senses.",
  "The dog could find an animal the human could not. Follow it through cover. Flush it from hiding. Recover a wounded animal after it fled. Alert the camp while everyone slept.",
  "The dog did not turn a helpless ape into a hunter. Humans had been cooperatively hunting large mammals and sharing meat hundreds of thousands of years before domestic dogs existed.",
  "But it could make an already capable hunter better, and that distinction matters.",
  "The dog was humanity's first living technology.",
  { quote: "A spear extended the arm. A dog extended the senses." },
  { h: "The first bargain" },
  "It is tempting to call this loyalty.",
  "It lasted because it began as self-interest on both sides.",
  "The animal received food, protection and a place near the fire. The human received warning, tracking and assistance. A successful dog improved the group's chance of returning with meat. A successful group improved the dog's chance of eating it.",
  "In some recent small-scale hunting societies the contribution has been enormous. Among Mayangna and Miskito communities studied in lowland Nicaragua, about 85 per cent of harvested mammals were captured with the help of dogs. Individual dogs varied sharply: some contributed more than 50 kilograms of wild meat a month, while others contributed nothing.",
  "This is not a universal law. A dog's value depends on prey, terrain and technique, and dogs have to be fed and trained. But where the alliance worked, both species profited.",
  "Self-interest became cooperation. Cooperation became dependence. Dependence became trust. Trust, repeated across generations, began to look like loyalty.",
  { quote: "Loyalty is only self-interest if you stop the story too soon." },
  "A large kill was never just calories. It had to be carried, divided, cooked, defended and shared. A feast is food converted into social structure: who found it, who killed it, who received the best portion, and who told the story afterwards.",
  "The dog did not invent the feast. But it could help turn an uncertain hunt into enough food for a gathering. It was there for the whole transformation.",
  "At the pursuit. At the kill. At the fire. At the edge of the gathering, waiting for its share.",
  { h: "If that is not a god, what is?" },
  "Not every god in every tradition does the same job. But across religions, gods are repeatedly asked to protect, provide, warn, perceive what humans cannot, stand between people and dangerous forces, and receive offerings in return.",
  "Long before temples, priests or written prayers, the dog was already doing a physical version of those jobs.",
  "It heard danger before we did. It smelled what we could not find. It stayed awake while we slept. It improved the odds of food arriving. And it took a share of that food in return.",
  "It never promised the hunt would succeed. It made success more likely.",
  "That may be closer to one early practical experience of divinity than the grander gods imagined later. Not an all-powerful being above the world. A powerful ally standing beside us inside it.",
  "The dog did not rule the storm. It warned us something was coming. It did not create the animal. It helped us find it. It did not abolish death. It stood near us when death arrived.",
  "Perhaps humans did not invent the divine dog from nothing. Perhaps we recognised in the dog qualities we wanted a god to possess: vigilance, protection, hidden knowledge and the willingness to remain beside us in the dark.",
  { h: "Or maybe we put it there" },
  "There is a less flattering explanation, and it deserves a hearing.",
  "Perhaps the dog never belonged to the supernatural world at all. Perhaps we installed it.",
  "Humans are pattern-making animals. We watch behaviour and convert it into intention.",
  "A dog stares into the dark, so we decide it sees spirits. A companion follows us everywhere, so we imagine it following us out of the world.",
  "The animal performs an ordinary behaviour. The human supplies the meaning. A jackal does not know that scavenging is undignified.",
  "This is not stupidity. Pattern recognition is one of the main things intelligence is for. But the same instinct draws constellations. Those stars are not joined. Some are separated by distances the mind can barely hold. The hunter, the bear and the dog exist partly in the sky and partly in the person looking up.",
  "The pattern is not entirely outside us. It is not entirely inside us. It happens where the two meet.",
  { quote: "The real animal gave us the points. We drew the lines." },
  { h: "Except some of the lines were real" },
  "Ask yourself whether your dog seems to know when you are stressed before you have said anything.",
  "It may not be sentimentality.",
  "In 2022, researchers collected breath and sweat samples from people before and after a stress-inducing mental-arithmetic task. In a double-blind procedure, four trained dogs were asked to distinguish each person's stress sample from that person's baseline sample and a blank.",
  "Across 720 discrimination trials, the dogs selected the stress sample correctly 675 times: an accuracy of 93.75 per cent. On their first exposure to each new set of samples, they were correct in 34 of 36 trials.",
  "Acute stress changes the chemical information released by breath and skin. That change is invisible to us. A dog may already have smelled the change.",
  "The experiment did not prove that the dogs understood why a person was stressed, or that scent is the only way dogs notice emotion. Dogs also read voice, posture, expression, routine and context.",
  "It proved something more basic and stranger: a human body broadcasts information that dogs can detect and humans ordinarily cannot.",
  "The ancients had no language for volatile compounds or stress chemistry. They could not explain the mechanism. They could observe the result.",
  "The dog knew. Not everything. Not the future. But more than the human standing next to it.",
  { h: "The original working dog" },
  "Seen from there, Anubis stops looking like a random animal placed onto a human body.",
  "He looks like the ancient partnership, promoted into eternity.",
  "Anubis was associated with embalming, the protection of cemeteries and the guidance of the dead. His image appeared on funerary objects, and in judgement scenes he stands beside the balance.",
  "He did not merely guard the doorway. He knew the road.",
  "At the end of that road came the Hall of Truth.",
  "The dead person's heart went on one side of a balance. On the other went the feather of Ma'at: truth and order. Anubis supervised the weighing. Thoth recorded the result.",
  "Read that again.",
  "Humans imagined the single instant in which an entire life would be measured.",
  "Then they placed a dog-shaped god beside the scales.",
  "Not a snarling one. A careful one. An impartial one. A figure trusted to make the balance true.",
  "We did not merely allow the dog into the afterlife. We handed it the scales.",
  { h: "An idea shaped like a dog" },
  "For generations Anubis has been filed neatly as a jackal god. The real picture is untidier.",
  "Egypt's sacred canids were symbolic creatures, not zoological diagrams. The figure draws on familiar dogs and wild canids, but assigning it to one modern breed or even one living species would be too confident. Ancient dog types were real, but they were not standardised pedigree breeds in the modern sense.",
  "The black coat was symbolic too. It evoked the altered body of the dead and, at the same time, the dark fertile soil associated with the Nile and renewal.",
  "Death and rebirth, worn in the same coat. The symbol turns both ways. It always does.",
  { h: "Everyone posts a dog at the door" },
  "Egypt is not unusual. It is simply the best documented.",
  "The Greek underworld had Cerberus, the monstrous hound guarding its entrance. In the Rigveda, Yama's two four-eyed dogs watch the road travelled by the dead. Xolotl carries canine form and underworld associations in Central Mexican religion, while dogs and dog images accompanied the dead in parts of Mesoamerica. Norse tradition places Garmr in the company of Hel and the world's ending. Welsh tradition gives Annwn its white, red-eared hounds.",
  "These figures are not interchangeable. Some are gods. Some serve gods. Some guide. Some guard. Some protect the dead. Some prevent the dead from returning.",
  "Nor should we pretend we can identify each one as a specific modern breed. Artists and storytellers used the canids they knew, but resemblance is not pedigree and dog type is not the same thing as breed.",
  "Did the stories travel? Some certainly did; religions and symbols moved with trade, migration and conquest.",
  "Did distant societies invent similar figures independently? Almost certainly. Different communities lived alongside related animals, feared death and needed an imagined guardian for the same final boundary.",
  "Stories spread. They also converge on similar answers because they face similar questions.",
  "Who guards the entrance? Who knows the road? Who can enter the darkness and return? Who stays awake while everyone else sleeps?",
  "Again and again, the answer was some version of a dog.",
  { h: "The provider becomes the sacrifice" },
  "Here is the part of the bargain nobody likes to look at.",
  "We did not only imagine dogs guiding the dead. We sent them.",
  "At North Saqqara, vast catacombs connected with the cult of Anubis held the remains of enormous numbers of canids. Researchers have estimated that the main dog catacomb may once have contained up to eight million animals. Many were extremely young, sometimes only hours or days old, suggesting a specialised system supplying votive mummies for pilgrims.",
  "In parts of Mesoamerica, dogs or dog images were placed in tombs and associated with protection or guidance on the underworld journey.",
  "Read the logic of that.",
  "The animal was valuable because it guided, guarded and warned. So when a human needed guiding, guarding and warning on the last journey of all, the animal was offered to the power it represented.",
  { quote: "The reward for being indispensable in life was to be required in death." },
  "The dog did not consent to the theology. It was caught inside the meaning humans had built around it.",
  "That is the darkest turn in the story, and the one the beautiful tomb paintings make easiest to overlook.",
  { h: "From Egypt to East Anglia" },
  "You do not have to remain in the ancient Mediterranean to meet the black dog at the edge of death. Britain has its own, and Britain's is not gentle.",
  "Across East Anglia, stories tell of Black Shuck: a vast spectral dog on empty lanes, marshes and churchyards. The most famous account is tied to a violent storm at Bungay in 1577. Abraham Fleming's pamphlet, published that year, described a black dog running through the church during the tempest.",
  "Egypt saw a black canine at the edge of death and made it a protector. East Anglia saw one and made it a warning.",
  "Same position. Opposite verdict.",
  "That does not make Black Shuck a descendant of Anubis. Similarity is not ancestry. Egyptian religion travelled through the Greek and Roman worlds, but the line from the Nile to a Suffolk churchyard must contain a break.",
  "It is not a genealogy. It is a trail of echoes.",
  "And look where both figures stand: the church door, the graveyard, the lane at night, the desert's edge, the point where one state becomes another.",
  "The dog is comfortable there for reasons that are biography rather than mysticism: domestic but descended from the wild, inside the house but listening to what is outside, a protector that can also frighten.",
  "One culture makes it holy. Another makes it horrifying. The animal carries both possibilities. We choose which one to see.",
  { h: "From god to insult" },
  "Then the reversal happens one more time, and this time it is petty.",
  "The animal raised towards divinity gets dragged down into language.",
  "Call someone a jackal and you mean a sneak or scavenger. Cur becomes contemptible. Mongrel becomes abuse. We look hangdog. Things go to the dogs. People end up in the doghouse.",
  "Even early uses of the English word dog could be depreciatory, before it became the ordinary name and pushed hound into a narrower role.",
  "The dog did nothing to earn any of it.",
  "The jackal scavenged because scavenging keeps an animal alive. The guard dog barked because something approached. The hunting dog followed because humans rewarded the chase.",
  "The godhood was ours. The monstrousness was ours. The insult is ours.",
  "The dog was cast in every role, and then blamed for the whole performance.",
  { h: "The meaning of an accident" },
  "Which brings us back to those three letters.",
  "DOG. GOD.",
  "They are not secretly the same word. There is no hidden proof in the spelling. It is an accident of English.",
  "But an accident does not have to be planned to become meaningful.",
  "A constellation is not physically drawn across the sky. The lines are ours. Yet people have used those lines to navigate, mark seasons and carry stories for thousands of years.",
  "DOG and GOD may be that kind of line. No history joins the words. We join them because they fit something humans have been doing for a very long time.",
  "We did not raise an ordinary animal into a divine role out of nothing. We recognised an animal already doing some of the work: protecting us, warning us, helping to feed us, entering danger beside us and perceiving signals beyond our senses.",
  "Then, across thousands of repeated exchanges, the bargain became a bond.",
  "Usefulness became reliance. Reliance became trust. Trust became grief when the animal died.",
  "The dog did not make us hunters. It made some hunts better. It did something stranger than that.",
  { quote: "It persuaded two competing predators to stop seeing one another only as rivals." },
  "If that is not the oldest practical idea of a god, it comes remarkably close.",
  "Not a being that made humans powerful by magic. A being that lent us powers we did not possess.",
  "Long before the dog was holy or horrifying, it was the creature that would not leave us alone at the edge of the dark.",
  "We made it a god because it guarded us. We made it a guide because it knew the road. We made it a judge because we trusted it to recognise what was true.",
  "DOG. GOD.",
  "The letters are an accident. The alliance was not.",
];

const cardTitle: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: "22px", letterSpacing: "0.1em", color: "var(--yellow)", textTransform: "uppercase", margin: "0 0 10px", lineHeight: 1.15 };
const cardBody: React.CSSProperties = { fontFamily: "var(--font-body)", fontSize: "0.9rem", fontWeight: 500, color: "#fff", lineHeight: 1.6, margin: "0 0 10px" };
const cardBodyLast: React.CSSProperties = { ...cardBody, margin: 0 };

const PACK: [string, string][] = [
  ["Egypt", "Anubis -- embalmer, guardian and guide of the dead"],
  ["Greece", "Cerberus -- three-headed hound on the gates of Hades"],
  ["Norse", "Garmr -- the blood-caked dog at the door of Hel"],
  ["Wales", "Cwn Annwn -- spectral red-eared hounds whose howl foretells a death"],
  ["India", "Yama's two dogs -- watchers of the road of the dead"],
  ["Aztec", "Xolotl -- the dog-headed god who leads souls across the underworld"],
  ["England", "Black Shuck -- the East Anglian omen-hound of the lanes and churchyards"],
];

// Article + breadcrumb structured data for this essay. Every value comes from
// this page: headline is the on-page heading, description reuses the metadata
// description, image is the real hero above. Author and publish date are omitted
// (the page has no honest source for either). Publisher links to the site-wide
// Organization node emitted in app/layout.tsx.
const HEADLINE = "Anubis: The Scavenger Made Into a God";
const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: HEADLINE,
      description: metadata.description,
      image: `${SITE_URL}/history/Anubis-hero.jpg`,
      publisher: { "@id": `${SITE_URL}/#organization` },
      mainEntityOfPage: `${SITE_URL}/good-dog-bad-dog/anubis`,
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Good Dog, Bad Dog", item: `${SITE_URL}/good-dog-bad-dog` },
        { "@type": "ListItem", position: 3, name: HEADLINE, item: `${SITE_URL}/good-dog-bad-dog/anubis` },
      ],
    },
  ],
};

export default function AnubisPage() {
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/history/Anubis-hero.jpg" alt="An ancient Egyptian tomb painting of the jackal-headed god Anubis leaning over a mummy on a lion-shaped bier, canopic jars beneath and hieroglyphs to either side." className={styles.essayHeroImg} />
          <div className={styles.essayHeroTint} />
          <div className={styles.essayHeroContent}>
            <h1 className={styles.essayHeroTitle}>
              <span className={styles.essayHeroTitleWhite}>Anubis:</span> The Scavenger Made Into a God
            </h1>
            <div className={styles.essayHeroMeta}>
              <span className={`${styles.tag} ${styles.tagBad}`}>Bad dog</span>
              <span className={styles.tagBreed}>Egyptian jackal / African golden wolf</span>
            </div>
            <Link href="/good-dog-bad-dog" className={styles.backLink}>← Back to Good Dog, Bad Dog</Link>
          </div>
        </div>

        <ArticleTextToggle />

        <div className={styles.essayLayout}>
          <article className={styles.essay}>
            <div className={styles.essayBody}>
              {BODY.map((b, i) => {
                if (typeof b === "string") return <p key={i}>{b}</p>;
                if ("h" in b) return <h2 key={i} className={styles.subhead}>{b.h}</h2>;
                return <blockquote key={i} className={styles.pullquote}>{b.quote}</blockquote>;
              })}
            </div>
          </article>

          <aside className={styles.sidebar}>
            {/* The worldwide pack */}
            <div className={styles.sidebarCard}>
              <div style={{ padding: "18px 20px" }}>
                <p style={cardTitle}>The worldwide pack</p>
                <p style={{ ...cardBody, fontSize: "0.82rem", color: "#aac4d4" }}>Dogs guarding the door of the dead, culture by culture -- invented over and over, with no contact between them.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 4 }}>
                  {PACK.map(([place, who]) => (
                    <div key={place} style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 8 }}>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.66rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--yellow)", margin: "0 0 2px" }}>{place}</p>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.84rem", fontWeight: 500, color: "#fff", lineHeight: 1.45, margin: 0 }}>{who}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Jackal, and other insults */}
            <div className={styles.sidebarCard}>
              <div style={{ padding: "18px 20px" }}>
                <p style={cardTitle}>Jackal, and other insults</p>
                <p style={cardBody}>Half the dog is buried in our language as an insult. To be a <strong>jackal</strong> is to be a sneak who does another&apos;s dirty work &mdash; from the old idea that the jackal was the lion&apos;s servant.</p>
                <p style={cardBodyLast}>It has company: <strong>cur</strong>, <strong>mongrel</strong>, <strong>hangdog</strong>, &quot;gone to the dogs,&quot; &quot;in the doghouse.&quot; The animal we call loyal is also the animal we reach for when we want to name a coward.</p>
              </div>
            </div>

            {/* Taxonomy */}
            <div className={styles.sidebarCard}>
              <div style={{ padding: "18px 20px" }}>
                <p style={cardTitle}>Is Anubis even a jackal?</p>
                <p style={cardBody}>Possibly not. The animal long called the &quot;Egyptian jackal&quot; was shown by DNA (from 2011, formalised in 2015) to be a wolf &mdash; now the <strong>African golden wolf</strong>.</p>
                <p style={cardBodyLast}>His black coat is symbolic, not literal: the black of decay and, at once, the black of the life-giving Nile silt.</p>
              </div>
            </div>

            {/* Egypt reached Britain */}
            <div className={styles.sidebarCard}>
              <div style={{ padding: "18px 20px" }}>
                <p style={cardTitle}>How Egypt reached Britain</p>
                <p style={cardBodyLast}>Egyptian gods really did come to Britain &mdash; up the Roman road, not down a line of pharaohs. The cult of Isis (Anubis in tow) spread across the Empire, and a jug from Roman London is scratched <em>&quot;Londini ad fanum Isidis&quot;</em> &mdash; &quot;at the temple of Isis in London.&quot;</p>
              </div>
            </div>

            {/* Sources */}
            <div className={styles.sidebarCard}>
              <div style={{ padding: "18px 20px" }}>
                <p style={cardTitle}>Sources &amp; further reading</p>
                <p style={{ ...cardBodyLast, fontSize: "0.8rem", color: "#aac4d4" }}>British Museum (Book of the Dead; Egyptian gods); the African golden wolf reclassification (PLOS / 2015 species work); East Anglian folklore of Black Shuck (Bungay &amp; Blythburgh, 1577); evidence for Isis-worship in Roman London. Full citations to be confirmed before indexing.</p>
              </div>
            </div>
          </aside>
        </div>

        <div className={styles.verdict}>
          <strong>The verdict:</strong> Not a bad dog &mdash; a dog handed the worst job we had. Anubis is the greatest promotion in history: the animal we blamed for disturbing our dead, made the god who guards them and the impartial judge of our lives. We gave the dog our deepest fear, and when it stayed, we turned its name into a slur. The jackal was only ever being a dog.
        </div>
      </main>
      <Footer />
    </>
  );
}
