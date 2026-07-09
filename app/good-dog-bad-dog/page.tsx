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

        {/* ── Essay divider ── */}
        <div className={styles.essayDivider} />

        {/* ── Essay: Hound of the Baskervilles ── */}
        <article className={styles.essay}>

          <div className={styles.essayMeta}>
            <span className={styles.tagBad}>Bad dog</span>
            <span className={styles.tagBreed}>Bloodhound / Mastiff</span>
          </div>

          <h2 className={styles.essayTitle}>
            The Hound of the Baskervilles: How a Dog Was Made into a Monster
          </h2>

          <div className={styles.essayBody}>

            <h3 className={styles.subhead}>A body on the moor, and something in the dark</h3>

            <p>
              A wealthy man is found dead on the edge of Dartmoor. No obvious wounds.
              But nearby, someone has found the footprints of an enormous hound.
            </p>
            <p>
              Sir Charles Baskerville already believed his family was haunted. An old
              legend told of a monstrous black dog that had pursued generations of
              Baskervilles across the moor as punishment for the cruelty of an ancestor.
              Now Sir Charles is dead, and the impossible appears to have left tracks in
              the mud.
            </p>
            <p>
              Arthur Conan Doyle's <em>The Hound of the Baskervilles</em> works because
              it allows two explanations to exist at the same time. One is rational: a
              person has committed a crime. The other belongs to folklore: an ancient
              beast has returned to claim another victim.
            </p>
            <p>A dog sits at the centre of both.</p>
            <p>
              The hound is eventually revealed to be a real animal -- a huge cross between
              a Bloodhound and a Mastiff, kept and controlled by a human murderer. Conan
              Doyle describes it as "as large as a small lioness." The dog is genuinely
              terrifying. But is it evil? That question makes this one of the most
              interesting cases in the Good Dog, Bad Dog series. The novel appears to give
              us the ultimate bad dog. Look closer, and almost everything monstrous about
              it has been manufactured by a person.
            </p>

            <h3 className={styles.subhead}>The hound exists in language before it exists in flesh</h3>

            <p>
              One of the cleverest things about the novel is that the dog becomes
              frightening long before anyone properly sees it.
            </p>
            <p>
              The reader first encounters it through a family manuscript, local rumours,
              a dead man's footprints, distant sounds on the moor and Watson's increasingly
              uneasy imagination. By the time the animal actually appears, it is carrying
              the weight of an entire legend. It is not simply a large dog. It has already
              been presented as a family curse, an instrument of divine punishment, a
              creature from hell.
            </p>
            <p>
              People rarely encounter dogs without context arriving first. Breed reputation,
              previous stories, headlines and visual stereotypes often land before the
              individual animal does. The Baskerville hound is feared before anyone has
              seen it. When it finally appears, every witness is already primed to see a
              monster.
            </p>
            <p>
              Stapleton -- the novel's villain, secretly another Baskerville heir --
              understands this perfectly. He does not simply release a dog onto the moor.
              He releases a story first.
            </p>

            <h3 className={styles.subhead}>Why a Bloodhound and a Mastiff?</h3>

            <p>Conan Doyle's choice of breeds is deliberate.</p>
            <p>
              The Bloodhound contributes the idea of relentless pursuit. Its threat is
              not speed but inevitability -- the sense that it can find you, wherever you
              go, however long it takes. The Mastiff contributes sheer physical mass. The
              word alone suggests an animal capable of overpowering a person.
            </p>
            <p>
              Put the two together and the story has a dog that can both hunt and destroy.
              This is effective storytelling. It is not, however, a fair breed portrait.
            </p>

            <div className={styles.breedPanel}>
              <p className={styles.breedPanelLabel}>The real breeds</p>
              <p>
                The Kennel Club describes the Bloodhound as affectionate, sensitive and
                not quarrelsome with people or other dogs. The Mastiff standard describes
                a calm dog, affectionate towards its owners. Neither description supports
                the idea of breeds naturally driven to hunt human beings across moorland.
              </p>
              <p>
                That does not make either breed suitable for every household. A very large
                dog that is poorly managed or deliberately provoked is genuinely dangerous.
                But physical capability is not the same as murderous intent. Conan Doyle
                selects the traits that serve his story and sets aside the ones that do not.
              </p>
            </div>

            <h3 className={styles.subhead}>The phosphorus</h3>

            <p>
              Here is the detail that gives the whole novel away, if you read it carefully enough.
            </p>
            <p>
              Stapleton does not rely on the dog's natural appearance. He paints the
              animal's head and body with phosphorus, so that it glows in the darkness
              of the moor. Think about what that tells you.
            </p>
            <p>
              A normal dog, however large, is apparently not frightening enough to sustain
              the Baskerville legend. Stapleton has to alter it. He has to make it look
              unnatural. He needs witnesses to see not an animal but something that appears
              to burn. He transforms the dog into theatre.
            </p>
            <p>
              The luminous coating conceals the dog's ordinary identity, connects the
              attack to the ancient curse, causes panic before physical contact occurs and
              makes witnesses doubt their own reason. The hound's supernatural quality is
              not inherent. It is applied.
            </p>
            <p>
              This is not so different from the way dogs are filmed. Low camera angles
              enlarge the body. Close-ups isolate teeth. Growling is added or intensified.
              Darkness prevents the audience from reading the animal's full posture or
              expression. The viewer is shown how to feel about the dog before they have
              had time to look at it. Stapleton is doing inside the story exactly what a
              director does outside it.
            </p>

            <h3 className={styles.subhead}>The dog does not write the plot</h3>

            <p>
              The central moral fact of the novel is this: the hound does not design the murder.
            </p>
            <p>
              Stapleton does. He identifies his target, obtains the dog, hides it on the
              moor, exploits the family legend and controls precisely when the animal is
              released. The dog supplies the teeth. The human supplies the motive, the
              plan and the staging.
            </p>
            <p>
              The hound has physical agency -- it runs, it attacks. Stapleton has moral
              agency -- he understands the consequences and intends them. Yet the dog is
              what ends up on the book cover.
            </p>
            <p>
              This reflects something wider in how stories use animals. A villain's dog
              becomes an extension of the villain -- its teeth represent his cruelty, its
              size represents his power, its obedience reveals his control. The animal
              does the visible thing. The human who directed it remains one step removed.
              The Baskerville hound absorbs the visual blame for a crime it did not conceive.
            </p>

            <h3 className={styles.subhead}>The nameless dog</h3>

            <p>
              Unlike Gelert, the Baskerville hound has no name. It is called the hound,
              the fiend, the creature, the beast, the family curse. Never anything else.
            </p>
            <p>
              A name would imply an individual animal with a history and a relationship
              to people. "The hound" turns it into a category. It represents not one dog
              but all the dogs in the legend, all the accumulated fear of the Baskerville
              family across generations.
            </p>
            <p>
              That namelessness also means the reader is never invited to ask the obvious
              questions. Where did this animal come from? What was it like before Stapleton
              acquired it? How was it trained? The novel does not want you to think about
              these things. The plot needs a threat, not a biography.
            </p>
            <p>
              Strip away the legend, the phosphorus, the isolation and the deliberate
              staging, and you have an animal whose aggression has been cultivated and
              directed by a person, then released into a situation designed to make
              violence inevitable. The less individuality a dog possesses in fiction,
              the more easily it becomes a monster.
            </p>

            <h3 className={styles.subhead}>The legend as alibi</h3>

            <p>
              The legend provides Stapleton with more than a method of killing. It
              provides him with an explanation. If Sir Henry dies from fright or an animal
              attack, the supernatural story actively discourages people from looking for
              a human criminal. Fear becomes concealment. The curse explains what happened
              without requiring anyone to look for who caused it.
            </p>
            <p>
              Stapleton understands something that remains entirely recognisable: people
              see what they have been prepared to see. If the Baskervilles expect a curse,
              a glowing dog in the fog will confirm it. The legend turns an attack into
              evidence of something already believed.
            </p>
            <p>The dog's reputation arrives first. The dog follows.</p>

            <h3 className={styles.subhead}>What the story is really asking</h3>

            <p>
              <em>The Hound of the Baskervilles</em> appears to ask whether a supernatural
              dog exists. Its deeper question is why people are so ready to believe in one.
            </p>
            <p>
              The answer the novel gives, without quite saying so directly, is that fear
              does not need much help. Give people a legend, a death they cannot fully
              explain, some footprints and a glimpse of something enormous and luminous
              in the fog -- and they will do the rest themselves.
            </p>
            <p>
              Stapleton does not create the fear. He finds it already there, in the family
              history, in local belief, in the dark reputation of the moor itself. He
              simply gives it a body. That body happens to be a dog.
            </p>
            <p>
              The hound is dangerous. It is not the architect of its own monstrosity. A
              dog can be capable of causing serious harm without possessing anything
              resembling human malice. A person can take that capability, sharpen it,
              stage it and then allow the animal to carry the blame.
            </p>
            <p>That is what Stapleton does.</p>
            <p>
              There is no ancient curse. There is only a person who recognised the
              usefulness of an animal, a legend and other people's readiness to believe.
            </p>

            <p className={styles.verdict}>
              <strong>The verdict:</strong> Manufactured monster. The hound's danger was
              real. Its monstrosity was built by a human being who knew exactly what he
              was doing -- and who let the dog carry the blame.
            </p>

          </div>
        </article>

        {/* ── Essay divider ── */}
        <div className={styles.essayDivider} />

        {/* ── Essay: Lassie ── */}
        <article className={styles.essay}>

          <div className={styles.essayMeta}>
            <span className={styles.tag}>Good dog</span>
            <span className={styles.tagBreed}>Rough Collie</span>
          </div>

          <h2 className={styles.essayTitle}>
            Lassie: The Burden of Being the Perfect Dog
          </h2>

          <div className={styles.essayBody}>

            <h3 className={styles.subhead}>The dog who is always right</h3>

            <p>Lassie never makes a mistake.</p>
            <p>
              She knows when someone is in danger. She finds help when adults cannot.
              She travels hundreds of miles through unfamiliar country, crosses rivers,
              survives injury and keeps moving. She cannot speak, but the people around
              her eventually understand exactly what she needs them to know.
            </p>
            <p>
              She is intelligent, loyal, brave and -- most importantly -- she always does
              the right thing. That last quality is where the story gets interesting.
              Because intelligence does not guarantee good decisions. Loyalty does not
              guarantee obedience. Bravery is not the same as wisdom. Lassie possesses
              all of these qualities simultaneously, at an exceptional level, directed
              always towards the correct outcome.
            </p>
            <p>She is not a dog. She is a heroic design.</p>
            <p>And that is where the real breed pays the price.</p>

            <h3 className={styles.subhead}>Where Lassie came from</h3>

            <p>
              Eric Knight introduced Lassie in a magazine story in 1938, then expanded
              the character into the novel <em>Lassie Come-Home</em> in 1940. The story
              is set in Yorkshire, where a boy named Joe Carraclough has grown up with a
              Rough Collie he loves. When Joe's family falls on hard times, they are forced
              to sell Lassie to the Duke of Rudling, who takes her to Scotland.
            </p>
            <p>
              Lassie keeps escaping. Eventually she is transported hundreds of miles
              north. From there, she begins the journey home -- crossing unfamiliar
              country, facing hunger, injury and the full difficulty of moving through a
              landscape built for humans, not dogs.
            </p>
            <p>
              The plot is straightforward enough for a child. A dog is separated from the
              person she loves and refuses to accept it. What gives the novel its staying
              power is that Lassie's journey is both extraordinary and emotionally
              inevitable. She cannot do anything else.
            </p>
            <p>
              The 1943 film brought the character to a global audience. Further films and
              a long-running television series followed. Over time, "Lassie" stopped
              meaning one fictional dog and started meaning a type -- the Collie who
              understands, rescues and returns.
            </p>

            <h3 className={styles.subhead}>What is genuinely Collie-like</h3>

            <p>The Lassie image did not appear from nowhere.</p>
            <p>
              Rough Collies were developed as working dogs expected to cooperate with
              people, respond to movement and manage livestock at a distance from their
              handler. Dogs can become highly attuned to routine. They can read body
              language and tone of voice with extraordinary sensitivity. A pastoral breed
              that has spent generations working alongside people may appear, from the
              outside, to understand almost everything.
            </p>
            <p>
              The Kennel Club describes the Rough Collie as friendly, active and suited
              to companionship -- nothing in the real breed profile contradicts the Lassie
              image outright. That is precisely what makes the exaggeration so effective.
              Lassie looks like a real Collie with the volume turned up. She is believable
              because she starts from something true.
            </p>

            <h3 className={styles.subhead}>Intelligence is not the same as wisdom</h3>

            <p>Here is where the story quietly departs from reality.</p>
            <p>
              Dogs are genuinely intelligent. They learn words, routines, associations and
              gestures. When a dog looks at you, moves towards the door and then looks
              back, the interpretation -- "come with me, something is wrong" -- may be
              broadly right. But the dog has not constructed a sentence or weighed the
              options and decided on a course of action. Its behaviour is real. The human
              interpretation of that behaviour contains more certainty than the evidence
              supports.
            </p>
            <p>
              Lassie stories depend on this gap. The dog communicates so successfully
              that people understand exactly what she wants. She leads them to the right
              place, alerts them to the right person, rejects the wrong plan. The audience
              is invited to believe she understands not just a cue but the whole problem.
            </p>
            <p>
              This is dramatically satisfying. But it quietly suggests that a truly
              intelligent dog should just <em>know</em> -- that understanding ought to
              emerge naturally from the bond, without training, without instruction,
              without much human effort at all. That expectation does not survive contact
              with actual dogs.
            </p>

            <h3 className={styles.subhead}>The intelligence without the inconvenience</h3>

            <p>Real intelligence in a dog is not always convenient.</p>
            <p>
              A clever dog can learn unwanted routines as quickly as wanted ones. It can
              anticipate commands and decide not to cooperate. It can become difficult when
              insufficiently occupied, reactive to things it notices that its owner misses,
              anxious in environments that feel unpredictable. The same sensitivity that
              makes a Collie responsive to a child in distress can make the same dog
              overwhelmed by a chaotic household.
            </p>
            <p>Lassie rarely encounters any of this.</p>
            <p>
              Her intelligence is consistently directed towards moral outcomes. She solves
              the right problems. She uses initiative without becoming unmanageable. She
              is independent without ever being irresponsible. She contains the desirable
              side of every Collie trait, with the difficult side quietly removed.
            </p>
            <p>That is not a breed profile. It is a wish list.</p>

            <h3 className={styles.subhead}>The social world Lassie lives in</h3>

            <p>
              Joe's family does not sell Lassie because they do not love her. They sell
              her because poverty forces them to make a choice they do not want to make.
              The dog therefore becomes a measure of what hardship takes away. For the
              Duke, Lassie is a valuable pedigree animal. For Joe, she is a relationship.
            </p>
            <p>
              Lassie answers through action. She keeps choosing Joe.
            </p>
            <p>
              Adults in Lassie's world are constrained by class, money and circumstance.
              The dog is not. She cannot solve the economic problem, but she can refuse to
              be separated from the person she loves. Her loyalty becomes a kind of repair
              for what the adult world has broken. That is a lot to ask of any animal.
              But it is why the character has lasted.
            </p>

            <h3 className={styles.subhead}>Positive stereotypes are still stereotypes</h3>

            <p>
              Negative breed stereotypes are easy to recognise. A black dog is presented
              as dangerous. A Bull Terrier is assumed to be violent. The association is
              obvious enough to challenge.
            </p>
            <p>
              Positive stereotypes appear kinder. They are harder to question because they
              seem complimentary. But the Lassie image creates its own problems. Someone
              drawn to the breed because it seems wise and effortlessly good with children
              may be less prepared for what a real Collie actually needs -- the exercise,
              mental stimulation, careful socialisation and consistent training that any
              intelligent working breed requires.
            </p>
            <p>
              When the real dog turns out to be reactive, anxious, or difficult to recall,
              the animal tends to get the blame. It has failed to live up to the image.
              The fact that the image was always impossible does not help the dog.
            </p>

            <div className={styles.breedPanel}>
              <p className={styles.breedPanelLabel}>The real Rough Collie</p>
              <p>
                The Kennel Club describes the Rough Collie as friendly and active, bred
                for close cooperation with people. They are highly trainable and responsive
                -- but that same sensitivity means they need consistent mental stimulation,
                structured exercise and careful socialisation. A bored or under-stimulated
                Collie can become anxious, reactive or difficult. None of that appears in
                Lassie's world.
              </p>
            </div>

            <h3 className={styles.subhead}>What Lassie tells us</h3>

            <p>
              The Hound of the Baskervilles reflects the fear that dogs can become
              monsters. Gelert reflects the fear that we might condemn an innocent animal.
              Lassie reflects something different -- the desire that dogs might be better
              than we are.
            </p>
            <p>
              The character works because genuine Collie qualities are real. The story
              takes those qualities and elevates them until the dog seems incapable of
              error. She is not simply well trained. She is wise. She is not simply
              attached. She is faithful in the heroic sense. She does not merely respond
              to people. She understands what they cannot say.
            </p>
            <p>
              That is the gap between the story and the breed. And it is why the good dog
              can be as misleading as the bad one.
            </p>
            <p>She is a believable Collie made unbelievable through perfection.</p>

            <p className={styles.verdict}>
              <strong>The verdict:</strong> Positive stereotype. Lassie is rooted in
              genuine Collie qualities -- then elevated into an ideal no individual dog
              can meet. The danger is not that she made the breed look bad. It is that
              she made it look impossibly good.
            </p>

          </div>
        </article>

      </main>
      <Footer />
    </>
  );
}
