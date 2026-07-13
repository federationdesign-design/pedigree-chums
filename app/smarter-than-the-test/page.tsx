import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import styles from "../good-dog-bad-dog/good-dog-bad-dog.module.css";

export const metadata: Metadata = {
  title: "Your Dog Is Smarter Than the Test | Pedigree Chums",
  description: "We measure animal intelligence by how closely it resembles our own. Dogs and dolphins suggest we have been asking the wrong question.",
};

const NOTABLE = [
  {
    name: "Chaser",
    category: "Dog",
    note: "Border Collie who learned 1,022 object names -- the largest tested vocabulary of any non-human animal.",
    url: "https://en.wikipedia.org/wiki/Chaser_(dog)",
  },
  {
    name: "Rico",
    category: "Dog",
    note: "Border Collie who could identify objects by name and use fast mapping to learn new words from a single exposure.",
    url: "https://en.wikipedia.org/wiki/Rico_(dog)",
  },
  {
    name: "Betsy",
    category: "Dog",
    note: "Border Collie with a vocabulary of over 340 words who could match a photograph of an object to the real thing.",
    url: "https://en.wikipedia.org/wiki/Betsy_(dog)",
  },
  {
    name: "Endal",
    category: "Dog",
    note: "Labrador Retriever service dog who could respond to hundreds of signed commands and was filmed using a cash machine.",
    url: "https://en.wikipedia.org/wiki/Endal",
  },
  {
    name: "Bottlenose Dolphin",
    category: "Cetacean",
    note: "Forms multi-level social alliances, uses signature whistles as individual names, and passes learned behaviours between generations.",
    url: "https://en.wikipedia.org/wiki/Bottlenose_dolphin",
  },
  {
    name: "Orca",
    category: "Cetacean",
    note: "Hunts cooperatively in family pods, has distinct dialects by population, and shows evidence of cultural transmission across generations.",
    url: "https://en.wikipedia.org/wiki/Orca",
  },
  {
    name: "Sperm Whale",
    category: "Cetacean",
    note: "Has the largest brain of any animal on Earth. Lives in matriarchal social groups with complex vocalisation patterns.",
    url: "https://en.wikipedia.org/wiki/Sperm_whale",
  },
  {
    name: "Pakicetus",
    category: "Ancestor",
    note: "The earliest known cetacean ancestor -- a dog-sized land mammal that lived 50 million years ago before the whale lineage returned to the sea.",
    url: "https://en.wikipedia.org/wiki/Pakicetus",
  },
  {
    name: "African Elephant",
    category: "Other",
    note: "Recognises itself in mirrors, mourns its dead, uses tools, and maintains complex long-term social bonds across decades.",
    url: "https://en.wikipedia.org/wiki/African_elephant",
  },
  {
    name: "New Caledonian Crow",
    category: "Other",
    note: "Manufactures hooked tools from leaves, solves multi-step problems, and can plan for future needs -- a capacity once thought uniquely human.",
    url: "https://en.wikipedia.org/wiki/New_Caledonian_crow",
  },
];

const CATEGORY_COLOUR: Record<string, string> = {
  "Dog":      "#22c55e",
  "Cetacean": "#5cc4ee",
  "Ancestor": "#fb923c",
  "Other":    "#a855f7",
};

export default function SmarterThanTheTestPage() {
  return (
    <>
      <Nav showLogo />
      <main className={styles.essayPage}>
        <div className={styles.essayHero}>
          <img src="/inteligent-dogs.jpg" alt="Animal intelligence" className={styles.essayHeroImg} />
          <div className={styles.essayHeroTint} />
          <div className={styles.essayHeroContent}>
            <Link href="/home" className={styles.backLink}>← Back to home</Link>
            <div className={styles.essayHeroMeta}>
              <span className={`${styles.tag} ${styles.tagGood}`}>Long read</span>
              <span className={styles.tagBreed}>Animal intelligence</span>
            </div>
            <h1 className={styles.essayHeroTitle}>Your Dog Is Smarter Than the Test: <span style={{ color: "#ffffff" }}>Why the Maze Isn't the Measure</span></h1>
          </div>
        </div>

        <div className={styles.essayLayout}>
          <article className={styles.essay}>
            <div className={styles.essayBody}>

              <p>A dog knows when you are about to leave the house.</p>
              <p>It may know before you pick up your keys. Before you put on your shoes. Before you say anything at all. It has read the change in your posture, the rhythm of your movement, the small shift in routine that tells it something is about to happen.</p>
              <p>A dog knows when your voice is playful and when it is tense. It can follow your pointing finger to find something hidden. It can learn the name of a toy and bring that object from another room. It can work sheep across a field, guide a blind person through traffic, detect a medical odour humans cannot smell, or quietly place its head on the lap of someone who is distressed.</p>
              <p>Yet for much of the history of animal intelligence research, we have tended to ask a narrower question: can the animal solve the kind of problem that looks intelligent to us?</p>
              <p>We build mazes. We hide food under cups. We test memory, speed, tool use and mirror recognition. These tests can be useful. They have produced real science. But they can also smuggle in a hidden assumption: that intelligence is best measured by how closely an animal's mind resembles our own.</p>
              <p>That is the problem. A maze may measure one kind of problem-solving. It does not measure what a sheepdog knows about movement, pressure and distance. It does not measure what a Labrador knows about scent. It does not measure what a family dog knows about the emotional weather of a household.</p>
              <p>The maze is not the measure.</p>

              <h2 className={styles.subhead}>The intelligence we live with</h2>
              <p>Dogs are so familiar that we risk underestimating them. Because they live in our homes, sleep on our floors and ask for food from our plates, their abilities can become invisible. We call them loyal, affectionate or trainable, but those words sometimes hide the intelligence involved.</p>
              <p>A dog that follows a human pointing gesture is not merely reacting to movement. It is using information from another species to solve a problem. Research by Brian Hare and colleagues found that domestic dogs could use human signals to locate hidden food, and that young puppies showed these skills even with little human contact, while human-raised wolves did not show the same performance in those tasks. Dogs have been shaped by domestication into specialists in the human social world. Their intelligence has bent towards us.</p>
              <p>A dog notices where we look. It distinguishes tones of voice. It learns routines: school run, walk time, dinner time, bedtime. It discovers which family member enforces the rules and which one can be persuaded. This is not abstract reasoning in the human academic sense. But it is intelligence all the same. It is social intelligence.</p>

              <h2 className={styles.subhead}>Dogs do not just obey -- they interpret</h2>
              <p>The smartest dogs are often described as obedient, but obedience is only one piece of the picture. A Border Collie working sheep may operate at a distance from the handler, reading the flock, the terrain, the pressure of its own position and the intention behind a whistle or gesture. A guide dog may disobey a command if obeying it would lead its person into danger. These are not simple reflexes. They require attention, memory, inhibition, learning and judgement.</p>
              <p>The Border Collie Chaser learned and retained the names of 1,022 objects over three years of training, and researchers found she could distinguish object names from commands. That matters because it challenges a simple idea of dogs as creatures who merely associate one sound with one reward. Chaser showed that a dog could build a large vocabulary of object labels and use them flexibly. Most dogs will never become Chaser. But Chaser shows what the canine mind is capable of under patient, structured teaching.</p>
              <p>Other work has explored dogs' ability to imitate human actions. The Do as I Do method, developed by Claudia Fugazza and colleagues, trains dogs to observe a human action and reproduce it on cue. That is not just trick training. It suggests that some dogs can map a human action onto their own body and reproduce it in a new context. The dog watches. The dog interprets. The dog acts.</p>

              <h2 className={styles.subhead}>Smell as thought</h2>
              <p>A large part of canine intelligence is built on a sense we barely possess. Humans are visual creatures. We organise the world through sight and language. Dogs experience a world thick with scent: identity, time, sex, stress, illness, direction, absence, presence. A path is not just a path. It is a recent history of who has passed, when, in what condition, and in what direction.</p>
              <p>This is why dogs can track people, detect explosives, locate drugs, find human remains, alert to low blood sugar or seizures, and in some experimental contexts detect disease-related odours -- though researchers are careful to stress that detection work requires rigorous validation before it reaches clinical use.</p>
              <p>Imagine designing an intelligence test where the central task was to identify disease, emotional state, age, sex and direction of travel from odour alone. We would fail. But our failure would not prove that humans lack intelligence. It would prove that the test was built around another animal's world. This is what we often do to animals. We ask them to be clever in our language.</p>

              <h2 className={styles.subhead}>The problem with one ladder</h2>
              <p>One of the mistakes humans make is to imagine intelligence as a ladder. At the top: humans. Below us: apes, then dolphins, elephants, dogs, corvids, pigs, rats, and so on. But this picture is misleading. Intelligence is not a single ladder. It is a set of adaptations to different problems.</p>
              <p>The better question is not simply how clever is this animal -- but what problems has this animal evolved to solve? For dogs, the problems include living with humans, reading social cues, learning from us, cooperating with us, sensing what we cannot sense, and adapting to households that are emotionally and behaviourally complicated. For dolphins, the problems are different: navigating three-dimensional water, communicating through sound, tracking social partners, coordinating hunts, raising calves and maintaining relationships in a fluid pod structure.</p>
              <p>None of these is a lesser version of human intelligence. They are different answers to different evolutionary questions. That is why dogs and dolphins are useful to think about together -- not because they are similar animals, but because they show the same principle from opposite directions. Dogs direct their social intelligence outward, toward us. Dolphins direct theirs inward, toward each other. Both minds became more complex because their worlds rewarded understanding others.</p>

              <h2 className={styles.subhead}>Dolphins: another kind of social mind</h2>
              <p>Consider what a dolphin knows that we do not. It lives in a world where sound travels differently, where vision is limited by water and distance, where bodies move in three dimensions, and where cooperation may be essential to survival.</p>
              <p>A dolphin recognises individuals by sound. It coordinates hunts, maintains long-term relationships across changing group membership, and in Shark Bay, Western Australia, male bottlenose dolphins form multi-level alliances -- alliances within alliances -- that require tracking relationships over years. This is precisely the kind of social complexity the social brain hypothesis was built to explain.</p>
              <p>The social brain hypothesis proposes that complex social life creates cognitive demands: remembering individuals, tracking alliances, managing conflict, predicting behaviour, cooperating, deceiving, reconciling and learning from others. A large-scale study of cetaceans found that whales and dolphins show sophisticated social and cultural behaviours linked with brain size and encephalisation. That does not mean dolphins are humans in the sea. It means the sea has produced its own form of social intelligence. A dolphin does not need to understand a pointing human hand to be intelligent. It needs to understand a pod.</p>

              <h2 className={styles.subhead}>What Pakicetus tells us -- and what it doesn't</h2>
              <p>The evolutionary story of whales and dolphins runs deeper than it first appears. Around 50 million years ago, early cetaceans such as Pakicetus lived near shallow waters in what is now South Asia. Pakicetus was a land mammal, often described as wolf-sized with four legs and a long skull. But it was not a dog, not a wolf and not an ancestor of dogs. Early whales belonged to the lineage closely related to even-toed ungulates, with hippopotamuses as the closest living relatives of modern whales and dolphins.</p>
              <p>The point is not that dolphins are clever because they used to be dogs. They did not. The point is more interesting: evolution repeatedly finds social intelligence when conditions reward it. Dogs and wolves come from the Carnivora branch. Dolphins and whales come from a different mammalian branch. Yet both show sophisticated social behaviour. That makes the comparison stronger, not weaker. It means intelligence is not a one-off miracle. It is a solution evolution can reach more than once.</p>
              <p>The ancestors of whales did not enter the water as blank neurological slates. They entered as mammals already equipped with nervous systems capable of movement, perception, memory, emotion and social behaviour. Over millions of years, the marine environment reshaped and amplified those inherited capacities: acoustic communication, group hunting, calf care, migration, social memory and culture. Dogs followed a different route. Domestication amplified their ability to live with us. The ocean shaped dolphins. The human home shaped dogs. Both environments rewarded minds that could understand others.</p>

              <h2 className={styles.subhead}>The intelligence at our feet</h2>
              <p>Perhaps the reason dogs matter so much in this discussion is that they live close enough for us to notice the failure of our categories. We know a dog is not a human. But we also know a dog is not a machine. It remembers. It anticipates. It misleads. It cooperates. It asks. It refuses. It learns our habits. It studies our moods.</p>
              <p>A dog that opens a door has solved a mechanical problem. A dog that learns the names of a thousand toys has solved a memory and language problem. A dog that follows a point has solved a cross-species communication problem. A dog that senses distress and changes its behaviour has solved an emotional problem. No single test captures all of that.</p>
              <p>A dolphin moving through open water, coordinating with others through sound, may be doing something as cognitively rich as a dog reading a human household. It is simply doing it in a medium we do not inhabit, through senses we do not possess. The animal does not have to think like us to be thinking well.</p>
              <p>We have spent too long asking whether animals can find their way through our mazes. The better question is how well they find their way through their own worlds. A dolphin does it through sound, alliance and open water. A dog does it through scent, gesture and the daily emotional weather of a human home. Both remind us that intelligence is not a ladder with humans at the top. It is a set of answers to the problem of living with others.</p>

            </div>
          </article>

          {/* ── Sidebar -- Notable animals ──────────────────────────────── */}
          <aside className={styles.sidebar}>
            {(["Dog", "Cetacean", "Ancestor", "Other"]).map((cat) => {
              const items = NOTABLE.filter((n) => n.category === cat);
              if (!items.length) return null;
              const colour = CATEGORY_COLOUR[cat] ?? "#ffffff";
              return (
                <div key={cat} className={styles.sidebarCard} style={{ padding: "16px 0 8px" }}>
                  <div style={{ padding: "0 20px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      fontFamily: "var(--font-body,'Montserrat',sans-serif)",
                      fontSize: "0.6rem", fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.1em",
                      color: colour, border: `1px solid ${colour}`,
                      borderRadius: 999, padding: "2px 10px",
                    }}>{cat}</span>
                  </div>
                  {items.map((item) => (
                    <a
                      key={item.name}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "block",
                        padding: "10px 20px",
                        textDecoration: "none",
                        borderTop: "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <div style={{
                        fontFamily: "var(--font-body,'Montserrat',sans-serif)",
                        fontSize: "0.82rem", fontWeight: 700,
                        color: "#ffffff", marginBottom: 3,
                      }}>{item.name} ↗</div>
                      <p style={{
                        fontFamily: "var(--font-body,'Montserrat',sans-serif)",
                        fontSize: "0.7rem", fontWeight: 500,
                        color: "rgba(255,255,255,0.6)",
                        margin: 0, lineHeight: 1.5,
                      }}>{item.note}</p>
                    </a>
                  ))}
                </div>
              );
            })}
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
