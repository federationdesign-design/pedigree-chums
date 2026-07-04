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
              <a href="#safety" className={styles.pill}>Keeping Dogs Cool</a>
              <a href="#cooking" className={styles.pill}>Making Dogs Hot</a>
              <a href="#sausage-names" className={styles.pill}>Why the funny name</a>
              <a href="#game" className={styles.pill}>Game Flavour Rules</a>
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
                <h2 className={styles.noteTitle}>Disclaimer: A note about hot dogs</h2>
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/a-dog-never-died-from-missing-a-walk.jpg" alt="" className={styles.safetyCardImg} />
                <h3>A dog never died from missing a walk.</h3>
                <p>Dogs do die from being too hot.</p>
              </div>
              <div className={styles.safetyCard}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/a-car-is-not-a-kennel.jpg" alt="" className={styles.safetyCardImg} />
                <h3>A car is not a kennel.</h3>
                <p>It is an oven with cup holders.</p>
              </div>
              <div className={styles.safetyCard}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/if-the-pavement-is-too-hot-for-your-hand.jpg" alt="" className={styles.safetyCardImg} />
                <h3>If the pavement is too hot for your hand,</h3>
                <p>it is too hot for paws.</p>
              </div>
            </div>

            <div className={styles.safetyTwoCols}>
              <div className={styles.safetyCol}>
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
              </div>
              <div className={styles.safetyCol}>
                <h3 className={styles.subTitle}>Signs of heatstroke in dogs</h3>
                <ul className={styles.signsList}>
                  <li>🥵 Heavy panting</li>
                  <li>🤤 Drooling</li>
                  <li>🫤 Weakness or confusion</li>
                  <li>🤮 Vomiting</li>
                  <li>⬇️ Collapse</li>
                  <li>😮‍💨 Breathing that looks or sounds wrong</li>
                </ul>
              </div>
            </div>
            <p className={styles.urgentNote}>A hot dog on the floor, panting hard and not acting right, is urgent.</p>

            <div className={styles.heatAlerts}>
              <div className={styles.alert} data-level="yellow">
                <span className={styles.alertIcon}>🌡️</span>
                <span className={styles.alertLabel}>Yellow alert</span>
                <span className={styles.alertTemp}>28°C – 30°C</span>
                <p>Conditions are unlikely to affect most people, but pose real risks to dogs, who cannot sweat and cannot tell you they are struggling.</p>
                <br />
                <p>Walk earlier. Walk later. Carry water. Find shade. Keep the day boring. Boring dogs are alive dogs.</p>
              </div>
              <div className={styles.alert} data-level="amber">
                <span className={styles.alertIcon}>🌡️</span>
                <span className={styles.alertLabel}>Amber alert</span>
                <span className={styles.alertTemp}>30°C – 36°C</span>
                <p>The whole population is potentially at risk. Dogs even more so. You can skip the midday walk. Your dog does not need a nice day out. Your dog needs not to become soup.</p>
                <br />
                <p>Avoid ball games, hot pavements, and the words &ldquo;they&rsquo;ll be fine.&rdquo;</p>
              </div>
              <div className={styles.alert} data-level="red">
                <span className={styles.alertIcon}>🌡️</span>
                <span className={styles.alertLabel}>Red alert</span>
                <span className={styles.alertTemp}>36°C – 38°C+</span>
                <p>A severe risk to life, even for healthy individuals. For dogs, this is not a heat warning. It is an emergency.</p>
                <br />
                <p>No unnecessary walks. No hot cars. No quick errands. Keep your dog cool, shaded, watered, watched, and indoors. If you are worried, call a vet now.</p>
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
        <section id="cooking" className={styles.cookingSection}>
          <div className={styles.cookingInner}>
            <p className={styles.sectionEyebrow}>The edible kind</p>
            <h2 className={styles.sectionTitle}>How do I cook hot dogs?</h2>
            <p className={styles.lead}>Carefully. And preferably without involving a dachshund.</p>
            <p>
              Boil them, grill them, fry them, air-fry them, barbecue them, or warm them gently
              while staring into the middle distance wondering why dinner sounds like a pet emergency.
              This is the first kind of hot dog. It is food. It may involve mustard.
              It should not involve an actual dog.
            </p>

            <div className={styles.cookingTwoCols}>
              <div className={styles.cookingCol}>
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
              </div>

              <div className={styles.cookingCol}>
                <h3 className={styles.subTitle}>Instructions for tinned hot dogs</h3>
                <p>Where do you store your dogs? Store in a cool, dry place. Preferably not on the floor where the dog can reach them. The hot dogs, that is. Not the dogs. Although arguably both.</p>
                <p>
                  Once opened, empty unused hot dogs into a bowl, cover, and refrigerate.
                  Consume within 2 days of opening.
                  Do not refrigerate in the can. The can has done its job. Let it go.
                </p>
                <p>
                  Unused hot dogs can be frozen and consumed within 3 months.
                  This is longer than most people keep leftovers and shorter than a dachshund grudge.
                </p>
                <p>
                  <strong>For best before end:</strong> See date on can end.
                  The can end is the round bit. Yes, there are two of them. Check both if you are worried.
                  One is a lid. One is a question.
                </p>
                <div className={styles.tinWarning}>
                  🐶 Note: None of this advice applies to actual dogs. Do not store your dog in a can.
                  Do not refrigerate your dog. Your dog has a best before end of approximately forever,
                  as far as you are concerned.
                </div>
              </div>
            </div>

            <div className={styles.congaFeature}>
              <div className={styles.congaChain}>
                <span className={styles.congaStep}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/yellow-arrow.svg" alt="" aria-hidden="true" style={{position:"absolute",top:"-18px",right:"-14px",width:"28px",zIndex:1}} />
                  <strong>Dachs + Hund</strong>
                  <em>German. Dachs means badger. Hund means dog. Together: a dog bred to dig into badger burrows, low to the ground, long in the body, short in the leg. The Germans named it for its job. Sensible people, the Germans.</em>
                </span>
                <span className={styles.congaArrow}>&rarr;</span>
                <span className={styles.congaStep}>
                  <strong>Dachshund</strong>
                  <em>1700s. British troops returning from Europe brought the breed home. The name came with it. &ldquo;Dachshund&rdquo; proved difficult to say after a long day, and British English was already looking for a way out.</em>
                </span>
                <span className={styles.congaArrow}>&rarr;</span>
                <span className={styles.congaStep}>
                  <strong>Sausage dog</strong>
                  <em>Britain looked at the dachshund and thought: sausage. Long body. Short legs. Slightly startled expression. The name stuck. The dachshund has not fully forgiven us. Their official name is still dachshund. We have not taken the hint.</em>
                </span>
                <span className={styles.congaArrow}>&rarr;</span>
                <span className={styles.congaStep}>
                  <strong>Hot dog</strong>
                  <em>1890s, New York. Street vendors sold warm sausages in rolls. Cartoonists drew them as dachshunds. The joke became the name. A hot sausage became a hot dog. No actual dogs were harmed. Several were confused.</em>
                </span>
                <span className={styles.congaArrow}>&rarr;</span>
                <span className={styles.congaStep}>
                  <strong>Hot/Dogs</strong>
                  <em>2024, Britain. A card game about spotting dog breeds. Named after sausages named after dogs named after badger holes. The dachshund appears on card 14. It looks like it knows exactly what happened.</em>
                </span>
              </div>
              <p className={styles.congaCaption}>
                This is not etymology anymore. It is a conga line. The dachshund started it.
                The English language was too polite to say no.
              </p>
            </div>

            <div className={styles.foodFaqCols}>
              <div className={styles.foodCol}>
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
              <div className={styles.foodCol}>
                <h3 className={styles.subTitle}>A few more questions</h3>
                <div className={styles.miniAccordion}>
                  {[
                    ["Why were sausages called dogs before hot dogs were called hot dogs?", "Nobody is entirely sure, which is reassuring if you were worried etymology was an exact science. The best theory: in the 1800s, cheap sausages were sometimes suspected of containing dog meat. Rather than addressing the rumour, the name stuck. The sausage became the dog. Then someone warmed it up and we were off."],
                    ["What food smells nicest to dogs?", "Meat, fish, and anything you are currently eating. Dogs are not subtle. Their sense of smell is roughly 10,000 times stronger than ours, which means a tin of hot dogs from the next room smells, to a dog, approximately as loud as a brass band."],
                    ["Can dogs eat the hot dogs I have left?", "A tiny plain bit may not cause immediate disaster. But hot dogs are salty, processed, and made for humans. The dog looking at you wants them very much. The dog looking at you also wanted to eat a sock last Tuesday. Use your judgement."],
                    ["Can dogs eat the hot, hot dogs?", "No. Hot food is genuinely dangerous for dogs. Their mouths and throats are not built for heat the way ours are. Let the hot dog cool completely first. Or just eat it yourself. There are plenty of actual dog treats available, and none of them are called hot dogs."],
                    ["What are Hot Dogs made from?", "The game? Dogs. Specifically: 54 unique dog breeds illustrated on playing cards. Also some rules, a lot of shouting, and one person who insists they saw the Golden Retriever in someone else's hand and cannot let it go."],
                    ["Should I keep my dogs in the fridge?", "The cards? No. They will go damp. The dogs? Also no. They will go unhappy. Fridge temperature for a dog is approximately the same as a walk in November without a coat. Technically survivable. Not recommended."],
                  ].map(([q, a], i) => (
                    <details key={i} className={styles.miniItem}>
                      <summary className={styles.miniQ}>{q}</summary>
                      <p className={styles.miniA}>{a}</p>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Game rules ───────────────────────────────────────────── */}
        <section id="game" className={styles.gameSection}>
          <div className={styles.gameInner}>
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

            <div className={styles.gameTwoCols}>
              <div>
                <div className={styles.ruleSteps}>
                  <div className={styles.ruleStep}>
                    <span className={styles.ruleNum}>1</span>
                    <div><strong>Draw your hand</strong><p>Deal as normal.</p></div>
                  </div>
                  <div className={styles.ruleStep}>
                    <span className={styles.ruleNum}>2</span>
                    <div><strong>Show your hand</strong><p>Everyone briefly shows their cards to the table. Three to five seconds. Long enough to see. Short enough to panic.</p></div>
                  </div>
                  <div className={styles.ruleStep}>
                    <span className={styles.ruleNum}>3</span>
                    <div><strong>Hide your hand</strong><p>Cards go face down again. From this point you can only look at your own hand.</p></div>
                  </div>
                  <div className={styles.ruleStep}>
                    <span className={styles.ruleNum}>4</span>
                    <div><strong>Remember</strong><p>You must recall which dogs were in each other&rsquo;s hands. Your memory is now on its own.</p></div>
                  </div>
                  <div className={styles.ruleStep}>
                    <span className={styles.ruleNum}>5</span>
                    <div><strong>Spot and call</strong><p>When a dog appears, the fastest correct call wins. If you call wrong, everyone is allowed to look at you. Like a disappointed spaniel.</p></div>
                  </div>
                </div>
                <p style={{marginTop:"16px"}}>Hot Dogs is a memory test disguised as a shouting problem.</p>
                <p>It is a bit like Snap. It is a bit like Pairs. It is a bit like looking into someone else&rsquo;s kennel for three seconds and then being expected to act normal.</p>
              </div>
              <div>
                <h3 className={styles.subTitle}>Questions this page has unfortunately made necessary</h3>
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
                    ["What is the best kind of hot dog?", "The one in a bun. The one with mustard. The one that is not panting, drooling, wobbling, trapped in a car, standing on hot pavement, or wondering why humans have made summer everybody’s problem. The best hot dogs are not dogs."],
              ].map(([q, a], i) => (
                <details key={i} className={styles.faqItem}>
                  <summary className={styles.faqQ}>{q}</summary>
                  <p className={styles.faqA}>{a}</p>
                </details>
              ))}
                </div>
              </div>
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
