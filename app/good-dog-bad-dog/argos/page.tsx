import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../../../components/Nav/Nav";
import Footer from "../../../components/Footer/Footer";
import styles from "../good-dog-bad-dog.module.css";

export const metadata: Metadata = {
  title: "Argos: Homer's Dog in The Odyssey — Loyalty, Home and the Nolan Film",
  description:
    "The dog from Homer's Odyssey who waited twenty years for his master to return. What Argos tells us about loyalty, home, scent and what we owe the dogs who love us.",
  robots: "index, follow",
  openGraph: {
    title: "Argos: The Dog Who Knew His Master",
    description:
      "He simply lifts his head, recognises the man he has waited for, wags his tail, and dies. Nearly three thousand years later, that is enough.",
    url: "https://pedigree-chums.co.uk/good-dog-bad-dog/argos",
    siteName: "Pedigree Chums",
    images: [
      {
        url: "https://pedigree-chums.co.uk/og/argos-og.jpg",
        width: 1200,
        height: 630,
        alt: "Argos: The Dog Who Knew His Master — Pedigree Chums Good Dog Bad Dog",
      },
    ],
    locale: "en_GB",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Argos: The Dog Who Knew His Master",
    description:
      "He simply lifts his head, recognises the man he has waited for, wags his tail, and dies. Nearly three thousand years later, that is enough.",
    images: ["https://pedigree-chums.co.uk/og/argos-og.jpg"],
  },
};

export default function ArgosPage() {
  return (
    <>
      <Nav showLogo />
      <main className={styles.essayPage}>

        {/* ── Hero ── */}
        <div className={styles.essayHero}>
          <img src="/history/Argos-hero.jpg" alt="Argos — The Dog Who Knew His Master" className={styles.essayHeroImg} />
          <div className={styles.essayHeroTint} />
          <div className={styles.essayHeroContent}>
            <Link href="/good-dog-bad-dog" className={styles.backLink}>← Back to Good Dog, Bad Dog</Link>
            <div className={styles.essayHeroMeta}>
              <span className={`${styles.tag} ${styles.tagGood}`}>Good dog</span>
              <span className={styles.tagBreed}>Ancient Greek Hunting Hound</span>
            </div>
            <h1 className={styles.essayHeroTitle}>Argos: The Dog Who Knew His Master</h1>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className={styles.essayLayout}>
          <article className={styles.essay}>
            <div className={styles.essayBody}>

              <p>Before Lassie ran for help, before Greyfriars Bobby waited by a grave, before the internet discovered videos of dogs greeting soldiers home from war, there was Argos.</p>

              <p>He appears only briefly in <em>The Odyssey</em>. He does not fight a monster. He does not save a child. He does not lead anyone out of danger. He simply lifts his head, recognises the man he has waited for, wags his tail, and dies.</p>

              <p>And somehow, nearly three thousand years later, that is enough.</p>

              <p>Now that Christopher Nolan has brought <em>The Odyssey</em> back into cinemas, Argos has returned too. Nolan has described <em>The Odyssey</em> as &quot;the ultimate dog movie&quot;, and has linked his own recent experience of becoming a dog owner to the importance of Argos in the story. In Homer, Argos is a tiny scene. In emotional terms, he is enormous.</p>

              <p>That may be because Argos is not just a loyal dog. He is something more complicated. He is the dog as memory. The dog as home. The dog as witness. The dog as proof that someone can be changed by war, time, disguise and suffering, and still be known by the creature who loved him before all of it.</p>

              <h2 className={styles.subhead}>The oldest dog reunion in literature</h2>

              <p>The Argos scene comes late in <em>The Odyssey</em>, when Odysseus has finally returned to Ithaca after twenty years away. Ten years were spent at Troy. Another ten were spent trying to get home.</p>

              <p>But when he arrives, he cannot simply walk through the door and announce himself. His palace has been overrun by suitors who want to marry his wife, consume his wealth and take his place. Odysseus returns disguised as a beggar. His survival depends on being unrecognised.</p>

              <p>Then he sees the dog.</p>

              <p>Argos is lying outside, old, filthy and neglected. He had once been a fine hunting dog, raised by Odysseus himself, but Odysseus left for Troy before he ever properly hunted with him. In the old days, the young men took Argos out to hunt wild goats, deer and hares. Now he lies on a dung heap, covered in fleas, ignored by the household that should have cared for him.</p>

              <p>But Argos recognises Odysseus.</p>

              <p>The humans see a beggar. The dog knows his master.</p>

              <p>That is the whole power of the scene.</p>

              <p>Odysseus notices. He wipes away a tear, but he cannot go to Argos openly. He cannot kneel beside him, call his name, or comfort him without risking his disguise. Argos has enough strength left to recognise him, but not enough to reach him. Then, as Odysseus goes inside, Argos dies.</p>

              <p>It is a brutal little scene because it withholds the reunion we want. Homer does not give us the big embrace. He gives us recognition without comfort.</p>

              <h2 className={styles.subhead}>Why we need Odysseus to go to him</h2>

              <p>Around the time Nolan&apos;s film was announced, something interesting happened online. Fans were discussing the Argos scene before the film was even released. One Reddit thread asked whether Nolan would include the moment, with users remembering it as one of the most emotional parts of the poem. One comment put the modern demand bluntly: &quot;Pet.The.Dog Nolan.&quot;</p>

              <p>That reaction tells us something real.</p>

              <p>Modern audiences do not just want Argos to recognise Odysseus. They want Odysseus to recognise Argos back. They want the reunion to be mutual. They want the dog&apos;s loyalty to be answered with something visible: a hand on the head, a moment beside him, acknowledgement.</p>

              <p>In Homer, Odysseus&apos;s restraint makes sense. He is in disguise, in danger, inside a plan that cannot unravel. The scene is painful precisely because he loves Argos and cannot act on it. An ancient audience may have been more prepared to admire that restraint: Odysseus endures the pain, keeps his disguise and remains faithful to the larger task.</p>

              <p>Modern audiences do something different. We do not only watch Odysseus. We become him. We enter the scene emotionally, and once we have done that, walking past the dog feels almost impossible.</p>

              <p>Psychologists often describe this kind of absorption as narrative transportation: the process by which people become mentally and emotionally drawn into a story world. It is why we wince when a character is hurt, why fictional grief can produce real tears, and why the death of a dog on screen can feel almost personally unfair.</p>

              <p>That instinct has become much more visible in the age of social media. Audiences no longer wait silently for a story to happen to them. They talk back. They speculate, demand, dread and rewrite in real time. The Reddit users asking Nolan to pet the dog are doing what audiences have always done, only louder: asking an old story to answer a modern emotional need.</p>

              <p>Part of why that need is so strong is that the dog&apos;s position in our lives has changed so completely. Over the last century, and dramatically over the last few decades, the dog has moved from the yard to the house, from the house to the sofa, from the sofa to the bedroom. Dogs now have beds chosen for their joint health, food chosen for their digestion, coats chosen for cold mornings. We arrange our holidays around them. We grieve them publicly, with the same language we use for people, because the loss genuinely feels like the same kind of thing.</p>

              <p>The old contract &mdash; I keep you, you serve me &mdash; has been replaced by something closer to mutual love, and that love now feels like a moral obligation. When Odysseus walks past Argos without stopping, modern audiences feel it not as a tactical necessity but as a failure. That is the distance between Homer&apos;s world and ours.</p>

              <p>Which puts Nolan in an interesting position.</p>

              <p>He is adapting an ancient scene built on restraint for a modern audience that craves emotional acknowledgement. If Nolan allows Odysseus to acknowledge Argos more directly than Homer does, that is not simply sentimentality. It is cultural translation. Homer&apos;s Argos belongs to a world of hunting dogs, households, duty and restraint. Nolan&apos;s Argos belongs to an audience that sees an old dog and thinks: he should be comforted.</p>

              <p>And early discussion of the film suggests that Argos has not been treated as a disposable detail. Coverage of Nolan&apos;s adaptation notes that Argos appears in the film, and viewers have already singled out the dog scene as one of the moments that affected them most.</p>

              <p>Both versions can be true. But they tell us different things about dogs, and about ourselves.</p>

              <p>There is an old literary argument, often associated with Roland Barthes, that once a work is released, it no longer belongs entirely to its author. Meaning is made and remade by readers. Homer has been dead for nearly three thousand years, and <em>The Odyssey</em> has belonged to singers, translators, teachers, readers, filmmakers and audiences ever since. The people demanding that Argos be petted are not doing something entirely new. They are doing what audiences have always done: asking an old story to speak to the feelings of the present.</p>

              <h2 className={styles.subhead}>How Homer wrote the most realistic dog in ancient literature</h2>

              <p>We cannot prove that Homer, or whoever shaped this part of the poem, was a dog owner in the modern sense. But it is very hard to read the Argos scene and not feel that it was written by someone who had watched dogs closely.</p>

              <p>Argos does not make a grand gesture. He does not speak. He does not perform some impossible feat. He does small, dog-like things. He lifts his head. He pricks his ears. He wags his tail. He recognises.</p>

              <p>That restraint is why the scene still works. The poem understands something every dog owner knows: a dog&apos;s recognition goes deeper than sight. Dogs read the world differently from us. They notice changes in posture, rhythm, emotional atmosphere and routine. They know when you are about to leave before you pick up your keys. They understand the difference between a playful voice and a tense one. And they live in a world thick with scent: identity, presence, absence, age, stress and memory that no costume can entirely erase.</p>

              <p>A person changed by twenty years of war and sea-crossing can put on different clothes. But to a dog, identity is not only visual. Scent, movement, voice and old association may survive a disguise in ways human recognition cannot.</p>

              <p>Odysseus&apos;s appearance has changed. His status has changed. His clothes are false.</p>

              <p>Humans recognise status. Dogs recognise presence.</p>

              <p>That is why the returning soldier videos hit so hard online. A person comes home from deployment, changed by distance and time and experience. The dog does not understand war or politics. But it understands return, sometimes before the person is fully through the door.</p>

              <p>Argos does that in ancient form. He does not need Odysseus to explain. He does not need proof. He knows.</p>

              <h2 className={styles.subhead}>The smell of home</h2>

              <p>Ask someone what home smells like and they will almost always be able to tell you. Not think about it. Tell you. Immediately, from somewhere that bypasses conscious thought entirely.</p>

              <p>For many people, that smell includes a dog.</p>

              <p>Not everyone welcomes this. There are people who notice dog smell the moment they step through a front door. To them it is intrusion: animal, persistent, worked into curtains, carpets and cushions.</p>

              <p>But for people who grew up with dogs, that same smell does something completely different. It opens a door. Not a metaphorical door, but a specific one, in a specific house, at a specific age. The smell of dog is the smell of Saturday mornings, school holidays, wet paws by the back door, warm fur, old blankets and a particular kind of safety that belongs almost entirely to childhood.</p>

              <p>People press their face into the fur of an old dog and inhale, not because the dog smells good exactly, but because the dog smells like home.</p>

              <p>This is not just sentimentality. It is biology.</p>

              <p>Smell has an unusually direct relationship with memory and emotion. Research into odour-evoked autobiographical memory, often called the Proust phenomenon, has shown that smells can trigger unusually vivid and emotional memories. Scientific reviews also describe the close relationship between olfaction and brain regions involved in memory and emotion, including the amygdala and hippocampus. A smell does not merely remind you of a memory. Sometimes it returns you to one, whole and unannounced, with the feeling already attached before you have had time to prepare.</p>

              <p>That matters here because dogs live in scent in a way humans barely do. Dogs experience paths, people and homes through layers of smell: identity, time, stress, illness, direction, absence and presence. A path is not just a path. It is a recent history of who has passed, when, in what condition and in what direction.</p>

              <p>Argos belongs to that world.</p>

              <p>It is tempting to imagine him knowing Odysseus before Odysseus is fully visible. Whether through scent, movement, voice, or some mixture of all three, the dog recognises what the humans miss. The scent of his master, however changed by twenty years of sea, war and foreign places, would have meant something to him that no disguise could fully hide.</p>

              <p>That is the smell of home, arriving after twenty years. And for Argos, it is enough.</p>

              <h2 className={styles.subhead}>The dog as home</h2>

              <p>Argos is not just a dog at the house. In a way, Argos is the house.</p>

              <p>For people who grow up with dogs, home is not only a place. It is a set of sounds and sensations. Paws in the hallway. A bowl on the kitchen floor. The soft weight of a dog settling beside you. Wet paws by the back door. A dog bed tucked into a corner.</p>

              <p>Dogs alter the atmosphere of a home in a physical, audible, smellable way. They greet. They wait. They follow. They occupy the ordinary routes through the house. They are often the most consistent presence in a family: the one who is always there when everyone else leaves.</p>

              <p>A house with a dog in it has a quality of aliveness that a house without one lacks. Not noise exactly, though there is noise. Not mess exactly, though there is mess. Something more like the sense that the house is inhabited rather than merely occupied. Something in it is paying attention.</p>

              <p>Argos is all of that, compressed into a single moment. He is the physical proof that this was once a real home, with a man who raised a dog, knew his name and expected to return to him. That home has been hollowed out by twenty years of absence and occupation. The suitors have filled the palace, but they have not made it home. Argos, neglected and nearly gone, is still part of the old household. He is what remains of what Odysseus left behind.</p>

              <h2 className={styles.subhead}>A good household, and what it owes</h2>

              <p>Argos&apos;s condition when Odysseus finds him is not accidental. The neglect is a moral signal.</p>

              <p>He had once been a fine hunting dog. He had been raised well, by a man who valued him. Now he lies on dung, covered in fleas, outside the house that should have been his. The suitors eat at the tables. The suitors drink the wine. The suitors consume what belongs to others. Argos gets nothing.</p>

              <p>But there is something else worth sitting with here.</p>

              <p>Odysseus raised Argos. The bond was his. Without Odysseus, perhaps nobody felt that particular responsibility. The dog belonged to him, and in his absence, the dog seems to have belonged to nobody. Not the suitors, who had no reason to care. Perhaps not even the servants, who had their own survival to manage.</p>

              <p>This is what happens when the person who defines a household disappears. Things fall through the gap. Not always the large things. Penelope kept the estate, kept the suitors at bay, kept the kingdom waiting. But the small, specific things held together by one person&apos;s presence can quietly collapse. The dog your father raised. The garden he tended. The obligations that were his and only his, which nobody else thought to carry because they had not been the one to begin them.</p>

              <p>We see versions of this in every era. When the person who holds the centre of a household is absent, through death, distance or circumstance, certain threads go unmet. Not always out of malice. Sometimes out of the gap between what was his and what is anyone else&apos;s.</p>

              <p>Argos, lying in the dirt outside a palace that should have been his home, is its quietest proof. In a good household, you care for what belongs to it. This one did not. Argos shows that.</p>

              <h2 className={styles.subhead}>Dog loyalty is only half the story</h2>

              <p>That brings us to the more uncomfortable question: is this only a story about a dog&apos;s loyalty to a man, or is it also about what a man owes a dog?</p>

              <p>For most of history, humans have celebrated dogs for what they give us: loyalty, protection, service, companionship. The good dog is usually the dog who waits, obeys, returns, forgives, recognises. Argos is the archetype of all of it.</p>

              <p>But Argos also asks what we owe back.</p>

              <p>Odysseus has a reason for not going to him. He is inside a dangerous plan. Homer&apos;s version is true to that situation. It is also, for modern readers, painfully unsatisfying.</p>

              <p>Because the modern dog owner wants to say: go to him. Forget the suitors for one second. Sit with the dog.</p>

              <p>That reaction is not weakness. It is evidence of how completely our understanding of the bond has changed. To us, a dog is owed comfort. Especially an old dog. Especially at the end. We believe now, almost instinctively, that an elderly dog belongs somewhere warm, on a blanket, by the fire, beside the person it loves.</p>

              <p>That belief is relatively recent in the long history of dogs and people. For most of that history, dogs lived and died in conditions we would now find distressing, not always out of cruelty, but because the emotional contract was different. The dog was valued first for what it did, not for what it felt.</p>

              <p>What Argos quietly demands, for modern readers, is a question the ancient world never quite asked in the same way: what do we owe, in return, for that kind of love?</p>

              <h2 className={styles.subhead}>Why Argos couldn&apos;t really have lived twenty years &mdash; and why it matters</h2>

              <p>There is one more problem with Argos that is easy to overlook because the story is so moving.</p>

              <p>He waits twenty years.</p>

              <p>For a small terrier or toy breed, reaching eighteen or nineteen is rare but not impossible. For a large hunting dog, especially in the ancient world without modern veterinary care, pain relief, parasite control or senior diets, twenty years is almost certainly mythic. Argos would not have been a pampered senior dog carefully managed through his final years. He was a neglected working hound lying outside.</p>

              <p>Homer gives Argos twenty years because myth often measures goodness in impossible numbers. The longer the dog waits, the greater the loyalty appears. Argos becomes a good dog not only because he recognises Odysseus, but because he has survived impossibly long in order to do it.</p>

              <p>Yet real dogs do not need impossible longevity to be good.</p>

              <p>A dog does not have to live twenty years to prove loyalty. It does not even have to live ten. A dog can be good for three years, five years, seven years, one afternoon. The goodness is not in the length of the life. It is in the bond.</p>

              <p>Argos&apos;s twenty years belong to myth. Real dogs prove themselves in smaller, daily ways: waiting at the door, learning our routines, forgiving our absences, greeting us as though we have returned from war when we have only been to Tesco.</p>

              <p>That is the everyday version of Argos. Less epic, perhaps, but no less true.</p>

              <h2 className={styles.subhead}>Did Argos die of a broken heart? The answer is more surprising</h2>

              <p>It is tempting to say yes. It feels right. The dog has waited twenty years, sees Odysseus, and dies.</p>

              <p>But the better answer is more subtle.</p>

              <p>Argos does not die because Odysseus fails to love him. Odysseus does love him. That is why he hides his tears. Argos does not die because the reunion goes wrong. He dies because the waiting is over.</p>

              <p>His final task is recognition.</p>

              <p>Once he has seen Odysseus, once he has known him, once he has confirmed that the man beneath the disguise is still the man who left, Argos can go. In a story full of monsters, storms, gods, violence and tricks, the dog&apos;s gift is simple.</p>

              <p>He knows who has come home. That is not a broken heart. That is a completed one.</p>

              <h2 className={styles.subhead}>Why Argos still matters</h2>

              <p>Argos is famous because he waits. But that is only the surface of the story.</p>

              <p>He matters because he recognises what humans miss. He matters because he turns a palace back into a home. He matters because his neglected body shows the damage done by Odysseus&apos;s absence. He matters because he asks whether loyalty should travel both ways. He matters because his impossible age reminds us that myth often makes dogs prove goodness by suffering too long. He matters because he shows, quietly and without judgement, what falls apart when the person who holds something together is gone.</p>

              <p>And now, with Nolan returning Argos to the screen, the scene belongs to another generation of dog lovers entirely. People are not waiting for the Argos scene because he is a plot point. They are waiting because they know what an old dog means.</p>

              <p>That says everything.</p>

              <p>Argos appears for a moment, but he carries the whole idea of home. He is the dog at the door. The smell in the hallway. The one who knows your step. The first to greet you. The first to miss you. The one who remembers who you were before the world got to you.</p>

              <p>Homer may have written an epic about war, gods, monsters and kings. But in Argos, he also wrote one of the oldest truths about dogs.</p>

              <p>A dog does not need you to look like yourself. A dog does not need your status restored. A dog does not need the world to know who you are.</p>

              <p className={styles.verdict}><strong>The verdict:</strong> A dog knows. And sometimes, after twenty years of storms and blood and distance, that is what finally makes a man home.</p>

            </div>
          </article>

          {/* ── Custom Argos sidebar ── */}
          <aside className={styles.sidebar}>

            {/* Identity card */}
            <div className={styles.sidebarCard}>
              <div style={{ padding: "18px 20px 14px", borderBottom: "1.5px solid rgba(255,255,255,0.08)" }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", letterSpacing: "0.06em", color: "var(--yellow)", marginBottom: 2 }}>ARGOS</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 10, letterSpacing: "0.04em" }}>The Dog of Odysseus</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>In Homer&apos;s <em>Odyssey</em>, Argos is Odysseus&apos; old hunting dog who recognises his master after 20 years away. The details below are a realistic interpretation of how Argos may have looked, based on archaeological evidence and ancient art.</p>
              </div>

              {/* Likely origins */}
              <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--yellow)", marginBottom: 8 }}>Likely Origins</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginBottom: 8 }}>Argos would not be a modern breed but a type of ancient working dog common across the Mediterranean — most likely descended from <strong style={{ color: "#fff" }}>Molossian / Molosser type dogs</strong>: powerful, loyal hunting and guard animals used by the Greeks and earlier by the Mycenaeans.</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>Larger, strong-boned, with short coats and great endurance.</p>
              </div>

              {/* Size */}
              <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--yellow)", marginBottom: 10 }}>Estimated Size</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {[
                    { label: "Height", value: "65–75 cm", sub: "at shoulder" },
                    { label: "Length", value: "130–150 cm", sub: "nose to tail" },
                    { label: "Weight", value: "45–65 kg", sub: "" },
                  ].map(({ label, value, sub }) => (
                    <div key={label} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.58rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{label}</p>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", fontWeight: 700, color: "#fff", lineHeight: 1.1, marginBottom: 2 }}>{value}</p>
                      {sub && <p style={{ fontFamily: "var(--font-body)", fontSize: "0.58rem", color: "rgba(255,255,255,0.35)" }}>{sub}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Physical appearance */}
              <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--yellow)", marginBottom: 10 }}>Build & Appearance</p>
                {[
                  "Broad head, powerful jaw, drop ears, thick neck",
                  "Powerful, muscular and deep-chested",
                  "Built for endurance, strength and protection",
                  "Short, dense coat suited to heat and outdoor life",
                  "Likely brindle, grey, fawn or dark-coated",
                  "Worn, scarred and aged after years of neglect",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
                    <span style={{ color: "var(--yellow)", fontSize: "0.6rem", marginTop: 3, flexShrink: 0 }}>▸</span>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.5, margin: 0 }}>{item}</p>
                  </div>
                ))}
              </div>

              {/* In context */}
              <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--yellow)", marginBottom: 8 }}>In Context</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.6, fontStyle: "italic" }}>Argos in <em>The Odyssey</em> is old, neglected and lying in refuse when Odysseus returns. He once hunted beside his master, but in his absence, no one cared for him.</p>
              </div>

              {/* Ancestral lineage timeline */}
              <div style={{ padding: "16px 20px" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--yellow)", marginBottom: 14 }}>Ancestral Lineage</p>
                {[
                  { era: "3000–1200 BCE", name: "Ancient Near Eastern Molosser", top: true },
                  { era: "1600–1100 BCE", name: "Mycenaean / Aegean Molosser", top: false },
                  { era: "800–300 BCE", name: "Greek Molossian Type", top: false },
                  { era: "c. 8th century BCE", name: "Argos — Odysseus' Dog", top: false, highlight: true },
                ].map(({ era, name, top, highlight }, i) => (
                  <div key={era} style={{ display: "flex", gap: 12, marginBottom: i === 3 ? 0 : 0 }}>
                    {/* Line and dot */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 16, flexShrink: 0 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: highlight ? "var(--yellow)" : "rgba(255,255,255,0.3)", flexShrink: 0, marginTop: 3 }} />
                      {i < 3 && <div style={{ width: 1.5, flex: 1, background: "rgba(255,255,255,0.12)", minHeight: 28 }} />}
                    </div>
                    {/* Text */}
                    <div style={{ paddingBottom: i < 3 ? 16 : 0 }}>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", marginBottom: 2 }}>{era}</p>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: highlight ? "0.8rem" : "0.75rem", fontWeight: highlight ? 700 : 500, color: highlight ? "#fff" : "rgba(255,255,255,0.7)", lineHeight: 1.3 }}>{name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Editor note card */}
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--yellow)", marginBottom: 8 }}>Editor&apos;s note</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.6, fontStyle: "italic" }}>This piece was written before the release of Christopher Nolan&apos;s <em>The Odyssey</em>. It reflects the conversation around the Argos scene in the weeks leading up to the film, and should be read in that context.</p>
              </div>
            </div>

            {/* Research note */}
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.6, fontStyle: "italic" }}>The lineage and physical description above are historical reconstructions based on archaeological finds, ancient art and written accounts. Argos is a literary character, but his depiction is grounded in the types of dogs that likely existed in Homer&apos;s world.</p>
              </div>
            </div>

          </aside>        </div>
      </main>
      <Footer />
    </>
  );
}
