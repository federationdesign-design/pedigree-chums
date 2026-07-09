import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import styles from "./good-dog-bad-dog.module.css";

export const metadata: Metadata = {
  title: "Good Dog, Bad Dog | Pedigree Chums",
  description:
    "A series of essays exploring how dogs are portrayed in stories, legends and popular culture -- and what those portrayals really say about the breeds behind the image.",
  robots: "noindex",
};

export default function GoodDogBadDogPage() {
  return (
    <>
      <Nav showLogo />
      <main className={styles.page}>

        {/* ── Series intro ── */}
        <header className={styles.hero}>
          <p className={styles.eyebrow}>An essay series</p>
          <h1 className={styles.title}>
            Good Dog,<br />
            <span className={styles.titleAccent}>Bad Dog</span>
          </h1>
          <p className={styles.intro}>
            Fictional dogs are rarely just dogs. They get cast as heroes, monsters, loyal
            companions and dangerous outsiders. Their size, breed and appearance become
            shorthand for the role the story needs them to play.
          </p>
          <p className={styles.intro}>
            This series looks at some of the most famous dogs in stories and legends --
            and asks what they actually tell us about the real breeds behind the image.
          </p>
        </header>

        {/* ── Essay: Gelert ── */}
        <article className={styles.essay}>

          <div className={styles.essayMeta}>
            <span className={styles.tag}>Misjudged dog</span>
            <span className={styles.tagBreed}>Irish Wolfhound</span>
          </div>

          <h2 className={styles.essayTitle}>
            Gelert: The Dog Who Couldn't Explain Himself
          </h2>

          <div className={styles.essayBody}>

            <h3 className={styles.subhead}>A prince, a wolf and a terrible mistake</h3>

            <p>
              Llywelyn the Great returns from the hunt to find his favourite hound
              bounding towards him, muzzle covered in blood.
            </p>
            <p>
              Inside, the cradle is empty. The room is wrecked. There is blood on the floor.
            </p>
            <p>He draws his sword.</p>
            <p>
              Only after Gelert is dead does Llywelyn hear his infant son crying from
              beneath a pile of bedding -- alive, unharmed, lying next to the body of a wolf.
              A wolf that Gelert had fought and killed while Llywelyn was out.
            </p>
            <p>
              The dog had stayed behind to protect the child. The blood was the wolf's.
              The chaos was a struggle, not an attack.
            </p>
            <p>The prince had murdered the most loyal animal he had ever owned.</p>
            <p>
              This is the legend of Gelert, set in the village of Beddgelert in North
              Wales -- whose name is commonly translated as "Gelert's grave." A stone
              memorial still stands there today, beside the River Glaslyn. The National
              Trust presents it carefully, as a site connected with a legend rather than
              a confirmed piece of medieval history.
            </p>
            <p>
              That matters, and we'll come back to it. But the reason the story has
              survived for centuries has nothing to do with whether a particular dog is
              buried under those stones.
            </p>
            <p>It survives because the mistake Llywelyn makes is one we all recognise.</p>

            <h3 className={styles.subhead}>Why he got it so wrong</h3>

            <p>Put yourself in Llywelyn's position for a moment. He walks in and sees:</p>

            <ul className={styles.evidenceList}>
              <li>A large, powerful dog, covered in blood</li>
              <li>An overturned cradle</li>
              <li>A missing baby</li>
              <li>A room that looks like a fight happened in it</li>
            </ul>

            <p>
              Every single detail points in the same direction. Of course he drew the
              worst conclusion. The evidence felt overwhelming.
            </p>
            <p>Except none of it was actually evidence.</p>
            <p>
              Blood tells you that something was injured. It doesn't tell you who did the
              injuring. Disorder tells you that violence happened. It doesn't tell you who
              committed it. And Gelert -- bounding over enthusiastically, as dogs do when
              their owner comes home -- couldn't exactly raise a paw and say "hang on,
              let me explain."
            </p>
            <p>
              That's the real trap at the centre of this story. Gelert looked guilty. He
              couldn't prove he wasn't. He was at the mercy of someone else's interpretation.
            </p>
            <p>Llywelyn didn't investigate. He reacted.</p>

            <h3 className={styles.subhead}>The dog who couldn't defend himself</h3>

            <p>
              One of the things that makes dogs such powerful figures in stories is
              precisely this: they cannot explain themselves.
            </p>
            <p>
              A human character can argue their case. They can point to witnesses, offer
              context, say "you've got it wrong." A dog cannot do any of that. Their
              actions have to be read by the people around them -- and those readings can
              be completely wrong.
            </p>
            <p>
              In the moment Gelert came bounding over, Llywelyn had two possible
              interpretations available. Gelert had attacked his son, or Gelert was pleased
              to see him, as he always was. The blood tipped the balance. Everything that
              would normally be read as loyalty and affection -- the enthusiasm, the
              greeting, the presence at the door -- suddenly looked suspicious instead.
            </p>
            <p>
              Nothing about Gelert had actually changed. The story told about him had.
            </p>

            <h3 className={styles.subhead}>The irony hiding in plain sight</h3>

            <p>
              The qualities that made Gelert look terrifying -- his size, his strength,
              his ability to kill something -- are the exact same qualities that allowed
              him to save the child in the first place.
            </p>
            <p>
              A small lap dog couldn't have fought off a wolf. Gelert's power is what
              made him valuable. The moment that power is misread, it becomes the thing
              that gets him killed.
            </p>
            <p>
              The legend doesn't give Gelert a history of bad behaviour. He isn't
              introduced as a dog who has caused trouble before. In most versions of the
              story, he is Llywelyn's most trusted and beloved hound. His apparent guilt
              comes entirely from his appearance in a frightening moment. The physical
              capability that should have made him the hero of the story is the thing
              that makes him look like the villain.
            </p>

            <h3 className={styles.subhead}>Was Gelert actually an Irish Wolfhound?</h3>

            <p>
              In most modern retellings, yes. In medieval Wales, the honest answer is:
              probably not exactly.
            </p>
            <p>
              The legend predates the formal breed standards we know today. "Wolfhound"
              originally described a purpose -- a large, powerful hound capable of hunting
              wolves and other big quarry -- rather than a specific pedigree dog.
            </p>
            <p>
              The association with the modern Irish Wolfhound makes intuitive sense. The
              breed has the height, the rough coat and the imposing outline that suits the
              visual image of Gelert. The connection with wolf hunting is historically
              genuine. But the safer description is the type of large hunting hound that
              would have existed in medieval Britain -- the ancestor of the breed we know
              today, rather than the breed itself.
            </p>

            <div className={styles.breedPanel}>
              <p className={styles.breedPanelLabel}>The real Irish Wolfhound</p>
              <p>
                The Kennel Club describes the Irish Wolfhound as "gentle, kind and
                friendly" -- a phrase that sits oddly against the terrifying silhouette
                the breed can cut. One of the tallest dogs in the world, built to pursue
                and bring down large animals, yet consistently described by people who
                own and work with them as calm, gentle and affectionate.
              </p>
              <p>
                Which is exactly what Gelert's story illustrates, if you read it the
                right way. The capacity to be dangerous is not the same thing as being
                dangerous.
              </p>
            </div>

            <h3 className={styles.subhead}>A legend that has lasted because the mistake is real</h3>

            <p>
              Similar tales appear in several different cultures -- a trusted animal kills
              a threat, is mistaken for having harmed a child, and is killed by its owner.
              The pattern predates any specific connection with Beddgelert.
            </p>
            <p>
              This doesn't make the story less valuable. If anything, the fact that the
              same tale kept being told in different places suggests something true about
              it -- not true as in factually accurate, but true as in recognisably human.
            </p>
            <p>
              The mistake Llywelyn makes isn't an unusual one. It's the mistake of looking
              at incomplete evidence, feeling certain, and acting before the full picture
              is available. We do this with dogs all the time. A large dog that barks
              becomes "aggressive." A breed that appears in news coverage of attacks
              becomes "dangerous" regardless of what any individual dog has actually done.
            </p>
            <p>The evidence feels overwhelming. The conclusion feels obvious.</p>
            <p>And sometimes it is completely wrong.</p>

            <h3 className={styles.subhead}>The prince's remorse, and what it cannot undo</h3>

            <p>
              In almost every version of the story, Llywelyn buries Gelert with honours
              and is said never to smile again.
            </p>
            <p>
              The remorse is total. The prince understands exactly what he has done. And
              yet Gelert is still dead. The story doesn't offer redemption. It offers
              regret. The information that would have changed everything was present all
              along -- the dead wolf, the unharmed child, the evidence of a struggle
              rather than an attack. Llywelyn just didn't look for it before he acted.
            </p>
            <p>
              The legend's moral isn't really about dog loyalty, though that is usually
              the headline. It's about the cost of certainty arrived at too quickly.
            </p>

            <h3 className={styles.subhead}>What Gelert actually tells us</h3>

            <p>Gelert is remembered as a good dog. That framing is understandable.</p>
            <p>But the more interesting point is simpler than that.</p>
            <p>He was the same dog the whole time.</p>
            <p>
              Before the sword, he was Llywelyn's most trusted hound, capable of great
              violence, loyal to the child, responding to a genuine threat exactly as he
              had been bred to do. After the sword, those same facts were finally
              understood. Nothing about Gelert changed between those two moments except
              the human story told about him.
            </p>
            <p>
              That's what makes this a legend worth retelling. Not because it tells us
              that loyal dogs are admirable -- though they are. But because it asks us to
              notice the gap between what we see and what we know.
            </p>
            <p>
              A dog covered in blood, in a wrecked room, next to an empty cradle, is a
              frightening sight.
            </p>
            <p>It is also not, by itself, a verdict.</p>

            <p className={styles.verdict}>
              <strong>The verdict:</strong> Misjudged. Gelert was condemned not for what
              he did, but for what his appearance led a person to assume. He was the same
              dog before and after the truth came to light. Only the human story changed.
            </p>

          </div>
        </article>

        {/* ── Coming soon ── */}
        <section className={styles.coming}>
          <h2 className={styles.comingTitle}>Coming next</h2>
          <div className={styles.comingGrid}>
            <div className={styles.comingCard}>
              <span className={styles.comingTag}>Bad dog</span>
              <h3 className={styles.comingName}>The Hound of the Baskervilles</h3>
              <p className={styles.comingBreed}>Bloodhound / Mastiff</p>
              <p className={styles.comingDesc}>
                How Arthur Conan Doyle turned a real dog into the image of a
                supernatural killer -- and what the story actually says about who
                is responsible for the violence.
              </p>
            </div>
            <div className={styles.comingCard}>
              <span className={styles.comingTag}>Good dog</span>
              <h3 className={styles.comingName}>Lassie</h3>
              <p className={styles.comingBreed}>Rough Collie</p>
              <p className={styles.comingDesc}>
                Lassie's intelligence and sensitivity are genuinely Collie-like.
                But what happens when a real trait gets elevated into something
                close to a superpower?
              </p>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
