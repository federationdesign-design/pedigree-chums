import type { Metadata } from "next";
import * as React from "react";
import Link from "next/link";
import Nav from "../../../components/Nav/Nav";
import Footer from "../../../components/Footer/Footer";
import styles from "../good-dog-bad-dog.module.css";

export const metadata: Metadata = {
  title: "Anubis: The Grave-Robber We Made a God | Good Dog, Bad Dog",
  description:
    "The Egyptians made a dog the god of death -- and it turns out almost everyone did. An essay on the jackal we posted at the door of the dark, from a scavenger of desert graves to a Suffolk hellhound, and why we thanked it by turning its name into an insult.",
  robots: "noindex",
};

type Row = string | { h: string } | { quote: string };

const BODY: Row[] = [
  "Picture the god of death. If you have seen a single Egyptian tomb painting, you are picturing a dog. Not a dragon, not a skeleton, not a hooded figure with a scythe -- a dog. A lean, jet-black, jackal-headed man, bent with enormous care over a body, doing what he clearly believes is the most important job in the world.",

  "That is Anubis, and he is almost the reason this whole series exists. Because underneath the gold leaf, the story of how a dog ended up running the Egyptian afterlife is a story about reputation -- about how we take an animal that is only ever being an animal, hand it a role, and then blame it for the part. Anubis got the grandest role imaginable. He also got it for a reason that does the jackal no favours at all.",

  { h: "Why the god of death is a dog" },
  "Here is the uncomfortable origin. Long before the pyramids, in Egypt's Predynastic period, the dead were buried in shallow graves at the desert's edge -- and jackals and wild dogs did exactly what jackals and wild dogs do. They dug them up. To a people who believed the body had to survive for the soul to survive, this was close to the worst thing imaginable: the desert cousin of the family dog, scattering grandfather across the sand.",
  "The Egyptian solution was not to fight the animal. It was to promote it. If a jackal is going to haunt your cemetery, the logic seems to have run, then set a jackal-god to guard it, and the ordinary jackals will keep their distance. The grave-robber was made the grave-keeper. The threat was handed the keys.",
  { quote: "The animal that dug up the dead was made the god who protects them. If you can't beat the jackal, deify him." },

  { h: "The original working dog" },
  "Once Anubis had the job, he did not have one job. He had all of them.",
  "He was the first embalmer -- myth credited him with inventing mummification itself, and with performing it on Osiris, the murdered god, putting a dead deity back together carefully enough to live again. He was the guardian of the necropolis, \"Lord of the Sacred Land,\" patrolling the desert margin where the scavengers gathered. He was the guide who takes the dead by the hand and walks them through the dark towards judgment.",
  "And at the end of that walk, he did the most extraordinary thing of all. In the Hall of Truth he worked the scales. Your heart went on one pan; the feather of Ma'at -- the feather of truth -- went on the other. A decent life balanced the feather. A heavy heart, weighed down with wrongdoing, tipped it, and a waiting monster called Ammit, part crocodile, part lion, part hippo, ate the heart and ended you for good.",
  "Read that again. Humans invented the single most frightening moment they could conceive of -- the instant your entire life is judged -- and they put a dog in charge of the scales. Not a snarling guard dog. An impartial one. They trusted the dog to be fair.",
  { quote: "We didn't just let the dog into the afterlife. We handed it the scales." },

  { h: "Is he even a jackal?" },
  "For most of recorded history the animal behind the god was filed as a jackal, and then modern DNA turned the label inside out. The creature long called the \"Egyptian jackal\" turned out not to be a jackal at all: work from 2011 onward showed it was really a wolf, and in 2015 it was formally recognised as its own species, the African golden wolf. The definitive death-dog of the ancient world had arguably been mis-identified for a century and a half.",
  "It gets blurrier. The Egyptians also kept ordinary domestic dogs, in great numbers and obvious affection. And the jet-black of Anubis was never a portrait of a real animal -- Egyptian jackals and wolves are sandy-grey. Black was a deliberate symbol: the colour of the decaying body Anubis tended, and, at the very same time, the colour of the rich silt the Nile laid down each year to bring the fields back to life. Death and rebirth, worn as one coat.",

  { h: "Everyone had the same idea" },
  "Here is the part that turns a fun fact into something stranger. The Egyptians were not unusual. Almost everyone put a dog at the door of the dead.",
  "The Greeks had Cerberus, the three-headed hound on the gates of Hades. The Norse had Garmr, the blood-caked dog snarling at the entrance to Hel. The Welsh had the Cwn Annwn, spectral hounds with red ears whose howl across the hills meant a death was on its way. The god Yama, in early Indian belief, kept two dogs to watch the road of the dead. In the Aztec world the dog-headed Xolotl led souls through the underworld -- which is part of why families were buried with a dog to walk them across.",
  "These cultures did not compare notes. They had no way to. They arrived at the same image again and again, independently, because dogs genuinely behave in a way that sets them on the threshold of death. They scavenge the graves. They guard the doorways. They bark at nothing in the dark, long after the rest of us have gone uneasily to bed. Post a dog at the edge of the thing we fear most and, apparently, culture after culture reaches the same verdict: it belongs there. It will see us across.",

  { h: "Britain's own black dog" },
  "You do not have to sail to Egypt or Greece to meet one. Britain has its own, and it is nastier.",
  "On the coast of East Anglia they still speak of Black Shuck -- a huge black dog with eyes like coals that pads the lonely lanes and churchyards, and to meet his gaze is to be marked for death. In 1577 the legend had its most famous outing: during a violent storm a great black dog was said to have burst into the church at Bungay and torn through the congregation, killing two people at prayer, then done the same a few miles off at Blythburgh, where scorch marks on the door are still shown to visitors as his claw-prints. A pamphlet by one Abraham Fleming carried the tale across England.",
  "Black Shuck is not Anubis's descendant. His roots are Norse, not Egyptian -- East Anglia was Viking country, the Danelaw, and his name most likely comes from the Old English scucca, meaning demon. He is the same instinct grown in colder soil: the dog at the edge of the dark, cast this time not as a gentle guide but as a warning.",
  "Although -- for anyone who suspects a hidden thread -- Egypt's gods genuinely did reach Britain. Not down some line of wandering pharaohs, but up the Roman road. The cult of the goddess Isis spread right across the Roman Empire, and Anubis travelled with it; there is real evidence of Isis-worship in Roman London, including a wine jug scratched with the words \"LONDINI AD FANVM ISIDIS\" -- at the temple of Isis in London. Anubis, in some form, very probably did pad through Londinium. Just not in time to bother a Suffolk church.",

  { h: "The bad rap" },
  "So the dog kept turning up at the door of death, all over the world, doing us the enormous favour of standing between us and the dark. And how did we thank it?",
  "We turned its name into an insult. To call a person a jackal, in English and in plenty of other languages, is to call them a sneak and a scavenger -- a coward who does another's dirty work. The slur leans on an old belief that the jackal was merely the lion's servant, flushing out prey for its betters. The animal was libelled as a lackey for the crime of being an efficient survivor. And Anubis fared no better: the dog-headed god of a conquered religion was easy for outsiders to recast as something sinister -- not far, in the end, from the shape of the black dog that would one day terrify Bungay.",
  "The jackal did nothing to earn any of it. It scavenged, because scavenging is a living. It lingered around the graves, because that is where the food and the shelter were. Everything else -- the godhood, the monstrousness, the insult -- we supplied.",

  { h: "What we owe them" },
  "That is the whole of Good Dog, Bad Dog folded into one animal. The dog turns up at the most frightening threshold we know, and stays there with us, and we cannot decide whether that makes it holy or horrifying -- so, across the centuries, we have called it both.",
  "The kindest reading is also the truest one. Long before it was a god or a monster, the dog was simply the creature that would not leave us alone at the edge of the dark. We repaid that loyalty by making it the face of death itself, and then by making its name a word for a coward. The least we owe it back is to remember that the dog asleep at your feet tonight is the same animal a hundred cultures once trusted to walk them home.",
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

export default function AnubisPage() {
  return (
    <>
      <Nav showLogo />
      <main className={styles.essayPage}>
        <div className={styles.essayHero}>
          <div className={styles.essayHeroImgFallback} />
          <div className={styles.essayHeroTint} />
          <div className={styles.essayHeroContent}>
            <h1 className={styles.essayHeroTitle}>
              <span className={styles.essayHeroTitleWhite}>Anubis:</span> The Grave-Robber We Made a God
            </h1>
            <div className={styles.essayHeroMeta}>
              <span className={`${styles.tag} ${styles.tagBad}`}>Bad dog</span>
              <span className={styles.tagBreed}>Egyptian jackal / African golden wolf</span>
            </div>
            <Link href="/good-dog-bad-dog" className={styles.backLink}>← Back to Good Dog, Bad Dog</Link>
          </div>
        </div>

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
