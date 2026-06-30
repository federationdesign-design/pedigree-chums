import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Hot/Dogs - Pedigree Chums",
  description: "A hot dog is a sausage. A sausage dog is a dog. A dog can be hot. A hot dog in a car is not funny at all.",
};

export default function HotDogs() {
  return (
    <>
      <Nav />
      <main className={styles.main}>

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className={styles.hero}>
          <div className={styles.heroImg} aria-hidden="true" />
          <div className={styles.heroTint} aria-hidden="true" />
          <div className={styles.heroInner}>
            <h1 className={styles.heroTitle}>
              Hot<span className={styles.slash}>/</span>Dogs
            </h1>
            <p className={styles.heroSub}>
              Some come with sauce. Some come with paws.<br />
              Some are a flavour. Only one should be eaten.
            </p>

            {/* 3 anchor pills, moved up directly below the subtitle */}
            <nav className={styles.pills} aria-label="Jump to section">
              <a href="#cooking" className={styles.pill}>Cooking hot dogs</a>
              <a href="#sausage-names" className={styles.pill}>Sausage dog name</a>
              <a href="#safety" className={styles.pill}>Keeping dogs cool</a>
              <a href="#game" className={styles.pill}>Flavour rules</a>
            </nav>

            {/* Wordplay stack */}
            <div className={styles.wordplay}>
              <p>A hot dog is a sausage.</p>
              <p>A sausage can be a dog.</p>
              <p>A dog can be hot.</p>
              <p>Hot dogs is a game.</p>
              <p>Being a hot dog is not good for any canine.</p>
              <p className={styles.wordplayWarning}>Dogs die in hot cars.</p>
            </div>
          </div>
        </section>

        {/* ── Disambiguation note ───────────────────────────────────── */}
        <section className={styles.noteSection}>
          <div className={styles.noteInner}>
            <div className={styles.noteRow}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/eatinghotdog.png" alt="" className={styles.noteImg} />
              <div className={styles.noteText}>
                <h2 className={styles.noteTitle}>A note about hot dogs</h2>
                <p>Sometimes we mean human food: sausages in buns.</p>
                <p>Sometimes we mean dogs who are too hot and need shade, water and probably some ice.</p>
                <p>Sometimes we mean <strong>Hot Dogs</strong>, the Pedigree Chums game flavour.</p>
                <p>We do not mean heating up your dog&rsquo;s food.</p>
                <hr className={styles.rule} />
                <p className={styles.legal}>
                  Pedigree Chums is an dog spotting card game. It is not food or pet food, not dog food, not a dog treat,
                  There are not nuts in Pedigree Chums.
                </p>
                <p className={styles.legal}>
                  The cards may contain dogs. Your dog may show interest in the dogs like it does with your hotdogs.
                  This does not make them the dogs food. Please do not feed the cards to your dog,
                  even if your dog appears to have understood the rules.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Keeping dogs cool ────────────────────────────────────── */}
        <section id="safety" className={styles.safetySection}>
          <div className={styles.safetyInner}>
            <p className={styles.sectionEyebrow}>The serious bit</p>
            <h2 className={styles.sectionTitle}>Now let&rsquo;s talk about hot dogs</h2>
            <p className={styles.lead}>Not hot dogs in buns. Hot dogs. Dogs who are too hot.</p>

            <p>
              This is where the joke stops being a joke.
            </p>

            <div className={styles.safetyCards}>
              <div className={styles.safetyCard}>
                <h3>A dog never died from missing a walk.</h3>
                <p>Dogs do die from being too hot.</p>
              </div>
              <div className={styles.safetyCard}>
                <h3>A car is not a kennel.</h3>
                <p>It is an oven with cup holders.</p>
              </div>
              <div className={styles.safetyCard}>
                <h3>If the pavement is too hot for your hand,</h3>
                <p>it is too hot for paws.</p>
              </div>
            </div>

            <h3 className={styles.subTitle}>What do I do if my dog is hot?</h3>
            <p className={styles.lead}>Stop.</p>
            <p>That is not a punchline. That is the answer.</p>
            <p>
              Stop walking. Stop playing. Stop throwing the ball. Stop the errand.
              Stop assuming they are probably fine.
            </p>
            <p>
              Move them somewhere cooler. Offer water. Get them off hot ground. Keep them calm.
              If you are worried, call a vet.
            </p>

            <h3 className={styles.subTitle}>Signs of heatstroke in dogs</h3>
            <ul className={styles.signsList}>
              <li>Heavy panting</li>
              <li>Drooling</li>
              <li>Weakness or confusion</li>
              <li>Vomiting</li>
              <li>Collapse</li>
              <li>Breathing that looks or sounds wrong</li>
            </ul>
            <p>A hot dog on the floor, panting hard and not acting right, is urgent.</p>

            <div className={styles.heatAlerts}>
              <div className={styles.alert} data-level="yellow">
                <span className={styles.alertLabel}>Yellow alert</span>
                <p>Walk earlier. Walk later. Carry water. Find shade. Keep the day boring. Boring dogs are alive dogs.</p>
              </div>
              <div className={styles.alert} data-level="amber">
                <span className={styles.alertLabel}>Amber alert</span>
                <p>Skip the midday walk. Avoid ball games and hot pavements. Your dog does not need a nice day out. Your dog needs not to become soup.</p>
              </div>
              <div className={styles.alert} data-level="red">
                <span className={styles.alertLabel}>Red alert</span>
                <p>No unnecessary walks. No hot cars. No quick errands. Keep your dog cool, shaded, watered, watched, and indoors as much as possible.</p>
              </div>
            </div>

            <p className={styles.safetyNote}>
              For official guidance, see the{" "}
              <a href="https://www.rspca.org.uk" target="_blank" rel="noopener noreferrer">RSPCA</a>,{" "}
              <a href="https://www.dogstrust.org.uk" target="_blank" rel="noopener noreferrer">Dogs Trust</a>, and{" "}
              <a href="https://www.bluecross.org.uk" target="_blank" rel="noopener noreferrer">Blue Cross</a>.
            </p>
          </div>
        </section>

        {/* ── Keeping dogs cool ────────────────────────────────────── */}
        <section id="safety" className={styles.safetySection}>
          <div className={styles.safetyInner}>
            <p className={styles.sectionEyebrow}>The serious bit</p>
            <h2 className={styles.sectionTitle}>Now let&rsquo;s talk about hot dogs</h2>
            <p className={styles.lead}>Not hot dogs in buns. Hot dogs. Dogs who are too hot.</p>

            <p>
              This is where the joke stops being a joke.
            </p>

            <div className={styles.safetyCards}>
              <div className={styles.safetyCard}>
                <h3>A dog never died from missing a walk.</h3>
                <p>Dogs do die from being too hot.</p>
              </div>
              <div className={styles.safetyCard}>
                <h3>A car is not a kennel.</h3>
                <p>It is an oven with cup holders.</p>
              </div>
              <div className={styles.safetyCard}>
                <h3>If the pavement is too hot for your hand,</h3>
                <p>it is too hot for paws.</p>
              </div>
            </div>

            <h3 className={styles.subTitle}>What do I do if my dog is hot?</h3>
            <p className={styles.lead}>Stop.</p>
            <p>That is not a punchline. That is the answer.</p>
            <p>
              Stop walking. Stop playing. Stop throwing the ball. Stop the errand.
              Stop assuming they are probably fine.
            </p>
            <p>
              Move them somewhere cooler. Offer water. Get them off hot ground. Keep them calm.
              If you are worried, call a vet.
            </p>

            <h3 className={styles.subTitle}>Signs of heatstroke in dogs</h3>
            <ul className={styles.signsList}>
              <li>Heavy panting</li>
              <li>Drooling</li>
              <li>Weakness or confusion</li>
              <li>Vomiting</li>
              <li>Collapse</li>
              <li>Breathing that looks or sounds wrong</li>
            </ul>
            <p>A hot dog on the floor, panting hard and not acting right, is urgent.</p>

            <div className={styles.heatAlerts}>
              <div className={styles.alert} data-level="yellow">
                <span className={styles.alertLabel}>Yellow alert</span>
                <p>Walk earlier. Walk later. Carry water. Find shade. Keep the day boring. Boring dogs are alive dogs.</p>
              </div>
              <div className={styles.alert} data-level="amber">
                <span className={styles.alertLabel}>Amber alert</span>
                <p>Skip the midday walk. Avoid ball games and hot pavements. Your dog does not need a nice day out. Your dog needs not to become soup.</p>
              </div>
              <div className={styles.alert} data-level="red">
                <span className={styles.alertLabel}>Red alert</span>
                <p>No unnecessary walks. No hot cars. No quick errands. Keep your dog cool, shaded, watered, watched, and indoors as much as possible.</p>
              </div>
            </div>

            <p className={styles.safetyNote}>
              For official guidance, see the{" "}
              <a href="https://www.rspca.org.uk" target="_blank" rel="noopener noreferrer">RSPCA</a>,{" "}
              <a href="https://www.dogstrust.org.uk" target="_blank" rel="noopener noreferrer">Dogs Trust</a>, and{" "}
              <a href="https://www.bluecross.org.uk" target="_blank" rel="noopener noreferrer">Blue Cross</a>.
            </p>
          </div>
        </section>

        {/* ── Cooking sausages ─────────────────────────────────────── */}
        <section id="cooking" className={styles.section}>
          <div className={styles.sectionInner}>
            <p className={styles.sectionEyebrow}>The edible kind</p>
            <h2 className={styles.sectionTitle}>How do I cook hot dogs?</h2>
            <p className={styles.lead}>Carefully. And preferably without involving a dachshund.</p>
            <p>
              Boil them, grill them, fry them, air-fry them, barbecue them, or warm them gently
              while staring into the middle distance wondering why dinner sounds like a pet emergency.
            </p>
            <p>
              The important thing is that a hot dog should be hot all the way through.
              This is the first kind of hot dog. It is food. It may involve mustard.
              It should not involve an actual dog.
            </p>

            <h3 className={styles.subTitle}>Why are hot dogs called hot dogs?</h3>
            <p>
              Not because dogs are hot. Disappointing, perhaps.
            </p>
            <p>
              Hot dogs are called hot dogs because sausages were once jokingly called dogs.
              A hot sausage became a hot dog. Then a dog shaped like a sausage became a sausage dog.
              Then language stood back and pretended this was normal.
            </p>

            <h3 className={styles.subTitle}>What is a sausage dog?</h3>
            <p>
              A sausage dog is a dachshund. A dachshund is not a sausage.
              A sausage is not a dachshund. But put them in the same sentence
              and the English language starts chasing its tail.
            </p>
            <p>
              Their real name is dachshund, from German meaning badger dog.
              They were bred with short legs and long bodies for going into burrows.
              Then Britain saw the shape and thought: <em>sausage.</em>
            </p>
            <p className={styles.conga}>
              badger dog &rarr; dachshund &rarr; sausage dog &rarr; hot dog &rarr; Hot/Dogs
            </p>
            <p>This is not etymology anymore. It is a conga line.</p>

            <h3 className={styles.subTitle}>Do dogs prefer hot food or cold food?</h3>
            <p>
              Some dogs like dinner slightly warmed because it smells more interesting.
              This is not because they are restaurant critics. It is because their nose is in charge
              and their nose has strong opinions.
            </p>
            <div className={styles.rule2}>
              <p><strong>Warm is fine. Hot is not.</strong></p>
              <p>
                If you warm your dog&rsquo;s food, warm it gently, stir it, check it,
                and let it cool before serving. The aim is &ldquo;smells nice,&rdquo; not
                &ldquo;fresh from the volcano.&rdquo;
              </p>
            </div>
          </div>
        </section>

        {/* ── Sausage dog name (placeholder) ──────────────────────── */}
        <section id="sausage-names" className={styles.section}>
          <div className={styles.sectionInner}>
            <p className={styles.sectionEyebrow}>Coming soon</p>
            <h2 className={styles.sectionTitle}>What&rsquo;s your sausage dog name?</h2>
            <p className={styles.lead}>This section is on its way.</p>
            <p>
              We&rsquo;re putting together a proper sausage dog name generator.
              Check back soon to find out yours.
            </p>
          </div>
        </section>

        {/* ── Cooking sausages ─────────────────────────────────────── */}
        <section id="cooking" className={styles.section}>
          <div className={styles.sectionInner}>
            <p className={styles.sectionEyebrow}>The edible kind</p>
            <h2 className={styles.sectionTitle}>How do I cook hot dogs?</h2>
            <p className={styles.lead}>Carefully. And preferably without involving a dachshund.</p>
            <p>
              Boil them, grill them, fry them, air-fry them, barbecue them, or warm them gently
              while staring into the middle distance wondering why dinner sounds like a pet emergency.
            </p>
            <p>
              The important thing is that a hot dog should be hot all the way through.
              This is the first kind of hot dog. It is food. It may involve mustard.
              It should not involve an actual dog.
            </p>

            <h3 className={styles.subTitle}>Why are hot dogs called hot dogs?</h3>
            <p>
              Not because dogs are hot. Disappointing, perhaps.
            </p>
            <p>
              Hot dogs are called hot dogs because sausages were once jokingly called dogs.
              A hot sausage became a hot dog. Then a dog shaped like a sausage became a sausage dog.
              Then language stood back and pretended this was normal.
            </p>

            <h3 className={styles.subTitle}>What is a sausage dog?</h3>
            <p>
              A sausage dog is a dachshund. A dachshund is not a sausage.
              A sausage is not a dachshund. But put them in the same sentence
              and the English language starts chasing its tail.
            </p>
            <p>
              Their real name is dachshund, from German meaning badger dog.
              They were bred with short legs and long bodies for going into burrows.
              Then Britain saw the shape and thought: <em>sausage.</em>
            </p>
            <p className={styles.conga}>
              badger dog &rarr; dachshund &rarr; sausage dog &rarr; hot dog &rarr; Hot/Dogs
            </p>
            <p>This is not etymology anymore. It is a conga line.</p>

            <h3 className={styles.subTitle}>Do dogs prefer hot food or cold food?</h3>
            <p>
              Some dogs like dinner slightly warmed because it smells more interesting.
              This is not because they are restaurant critics. It is because their nose is in charge
              and their nose has strong opinions.
            </p>
            <div className={styles.rule2}>
              <p><strong>Warm is fine. Hot is not.</strong></p>
              <p>
                If you warm your dog&rsquo;s food, warm it gently, stir it, check it,
                and let it cool before serving. The aim is &ldquo;smells nice,&rdquo; not
                &ldquo;fresh from the volcano.&rdquo;
              </p>
            </div>
          </div>
        </section>

        {/* ── Game rules ───────────────────────────────────────────── */}
        <section id="game" className={styles.section}>
          <div className={styles.sectionInner}>
            <p className={styles.sectionEyebrow}>Pedigree Chums game flavour</p>
            <h2 className={styles.sectionTitle}>Hot Dogs mode</h2>
            <p className={styles.lead}>
              In normal play, your hand is your kennel. In Hot Dogs, every kennel opens once.
            </p>
            <p>
              In the original game, your hand is private. Your dogs are your dogs.
              Your secrets are your secrets.
            </p>
            <p>Hot Dogs mode is different.</p>

            <div className={styles.ruleSteps}>
              <div className={styles.ruleStep}>
                <span className={styles.ruleNum}>1</span>
                <div>
                  <strong>Draw your hand</strong>
                  <p>Deal as normal.</p>
                </div>
              </div>
              <div className={styles.ruleStep}>
                <span className={styles.ruleNum}>2</span>
                <div>
                  <strong>Show your hand</strong>
                  <p>Everyone briefly shows their cards to the table. Three to five seconds. Long enough to see. Short enough to panic.</p>
                </div>
              </div>
              <div className={styles.ruleStep}>
                <span className={styles.ruleNum}>3</span>
                <div>
                  <strong>Hide your hand</strong>
                  <p>Cards go face down again. From this point you can only look at your own hand.</p>
                </div>
              </div>
              <div className={styles.ruleStep}>
                <span className={styles.ruleNum}>4</span>
                <div>
                  <strong>Remember</strong>
                  <p>You must recall which dogs were in each other&rsquo;s hands. Your memory is now on its own.</p>
                </div>
              </div>
              <div className={styles.ruleStep}>
                <span className={styles.ruleNum}>5</span>
                <div>
                  <strong>Spot and call</strong>
                  <p>When a dog appears, the fastest correct call wins. If you call wrong, everyone is allowed to look at you. Like a disappointed spaniel.</p>
                </div>
              </div>
            </div>

            <p>Hot Dogs is a memory test disguised as a shouting problem.</p>
            <p>It is a bit like Snap. It is a bit like Pairs. It is a bit like looking into someone else&rsquo;s kennel for three seconds and then being expected to act normal.</p>
          </div>
        </section>

        {/* ── FAQ accordion ────────────────────────────────────────── */}
        <section className={styles.faqSection}>
          <div className={styles.sectionInner}>
            <h2 className={styles.sectionTitle}>Questions this page has unfortunately made necessary</h2>
            <div className={styles.faqList}>
              {[
                ["Why are hot dogs called hot dogs?", "Not because dogs are hot. Hot dogs are called hot dogs because sausages were once jokingly called dogs. A hot sausage became a hot dog. Then a dog shaped like a sausage became a sausage dog. Then language stood back and pretended this was normal."],
                ["What is a sausage dog?", "A sausage dog is a dachshund. A dachshund is not a sausage. A sausage is not a dachshund. But put them in the same sentence and the English language starts chasing its tail."],
                ["Why are dachshunds called sausage dogs?", "Because look at them. Their real name means badger dog in German. They were bred with short legs and long bodies for going into burrows. Then Britain saw the shape and thought: sausage. This is unfair to dachshunds. It is also difficult to argue with."],
                ["Can dogs eat hot dogs?", "Emotionally, your dog says yes. Should they? Hot dogs are made for humans. They can be salty, processed, and fatty. A tiny plain bit may not end the world for many dogs, but it should not become a habit. Your dog also wants to eat socks. We cannot let desire run the department."],
                ["Is it too hot to walk my dog?", "Ask the pavement. If it feels too hot for your hand, it is too hot for paws. A dog never died from missing a walk. Dogs do die from being too hot."],
                ["Are dogs safe in hot cars?", "No. Not for five minutes. Not with the window cracked. Not because you parked in the shade. Not because you are just popping in. A car is not a kennel. It is an oven with cup holders."],
                ["What is Hot Dogs mode?", "Hot Dogs mode is a Pedigree Chums game flavour where everyone briefly shows their hand after the draw, then hides it again. From then on you can only look at your own cards. You must remember which dogs were in the other players' hands. It is fast, it is memory, and it makes everyone accuse Grandma of hiding a spaniel."],
                ["Is Hot Dogs mode like Snap?", "Yes. But with homework. In Snap you react to what you can see. In Hot Dogs you react to what you think you remember seeing. That is worse. And therefore better."],
                ["Is Pedigree Chums dog food?", "No. Pedigree Chums is a dog card game. It contains dog characters, dog jokes, and dog chaos. It does not contain dog food. Do not feed the game to the dog. Play the game. Feed the dog something else."],
              ].map(([q, a], i) => (
                <details key={i} className={styles.faqItem}>
                  <summary className={styles.faqQ}>{q}</summary>
                  <p className={styles.faqA}>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── End ──────────────────────────────────────────────────── */}
        <section className={styles.endSection}>
          <div className={styles.sectionInner}>
            <p className={styles.endLine}>A sausage can be a dog.</p>
            <p className={styles.endLine}>A dog can be a sausage.</p>
            <p className={styles.endLine}>A comma can move the joke.</p>
            <p className={styles.endLine}>Heat can move the ending.</p>
            <p className={`${styles.endLine} ${styles.endBig}`}>Keep your chums cool.</p>
          </div>
        </section>

      </main>
    </>
  );
}
