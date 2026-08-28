import type { Metadata } from "next";
import { SITE_URL } from "../../../lib/site";
import Link from "next/link";
import Nav from "../../../components/Nav/Nav";
import Footer from "../../../components/Footer/Footer";
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
import styles from "../good-dog-bad-dog.module.css";
import ArticleTextToggle from "../../../components/ArticleTextToggle/ArticleTextToggle";
import { WipeSequence } from "../../../components/ArgosChoreo/ArgosChoreo";
import { QuoteReveal } from "../../../components/ScrollScenes/QuoteReveal";

export const metadata: Metadata = {
  title: "Bull's-eye: The Dog as the Owner's Shadow | Good Dog, Bad Dog",
  description: "Bull's-eye in Oliver Twist is not simply a bad dog -- he is a dog made to carry a bad man's reputation. An essay on Dickens, Bill Sikes and the modern status dog.",
  openGraph: {
    images: ["/bulls-eye-img.jpg"],
  },
};

const SLUG = "bull-terrier";

const BE_TIMELINE = [
  { era: "1837\u20131839", name: "Oliver Twist is serialised", context: "Dickens describes Bull\u2019s-eye as a white, shaggy and injured dog. He does not give him a modern breed identity." },
  { era: "Original illustrations", name: "The appearance begins to change", context: "George Cruikshank depicts Bull\u2019s-eye with a smoother coat and inconsistent size, already moving away from Dickens\u2019s description." },
  { era: "1850s\u20131860s", name: "The Bull Terrier develops", context: "James Hinks refines and standardises an all-white Bull Terrier intended for exhibition and companionship." },
  { era: "Later theatre and film", name: "Bull\u2019s-eye gains a recognisable breed", context: "Adaptations increasingly cast or illustrate the dog as a Bull Terrier." },
  { era: "1968", name: "The film Oliver! fixes the image", context: "The Bull Terrier Butch appears beside Oliver Reed\u2019s Sikes, helping establish the version remembered by modern audiences." },
  { era: "Today", name: "The adaptation has overtaken the description", context: "Many readers assume Dickens explicitly created a Bull Terrier, even though the famous breed image belongs largely to Bull\u2019s-eye\u2019s later cultural life.", end: true },
];

// Article + breadcrumb structured data for this essay. Every value comes from
// this page: headline is the on-page heading, description reuses the metadata
// description, image is the real hero above. Author and publish date are omitted
// (the page has no honest source for either). Publisher links to the site-wide
// Organization node emitted in app/layout.tsx.
const HEADLINE = "Bull’s-eye: The Dog as the Owner’s Shadow";
const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: HEADLINE,
      description: metadata.description,
      image: `${SITE_URL}/bulls-eye-img.jpg`,
      publisher: { "@id": `${SITE_URL}/#organization` },
      mainEntityOfPage: `${SITE_URL}/good-dog-bad-dog/bulls-eye`,
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Good Dog, Bad Dog", item: `${SITE_URL}/good-dog-bad-dog` },
        { "@type": "ListItem", position: 3, name: HEADLINE, item: `${SITE_URL}/good-dog-bad-dog/bulls-eye` },
      ],
    },
  ],
};

export default function BullsEyePage() {
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
          <img src="/bulls-eye-img.jpg" alt="A white-and-brindle bull terrier standing on wet cobblestones in a gaslit Victorian street at night, shadowy top-hatted figures and a watching boy behind." className={styles.essayHeroImg} />
          <div className={styles.essayHeroTint} />
          <div className={styles.essayHeroContent}>
            <h1 className={styles.essayHeroTitle}>
              <span className={styles.essayHeroTitleWhite}>Bull’s-eye:</span> The Dog as the Owner’s Shadow
            </h1>
            <div className={styles.essayHeroMeta}>
              <span className={`${styles.tag} ${styles.tagBad}`}>Bad dog</span>
              <span className={styles.tagBreed}>Bull Terrier</span>
            </div>
            <Link href="/good-dog-bad-dog" className={styles.backLink}>← Back to Good Dog, Bad Dog</Link>
          </div>
        </div>

        <ArticleTextToggle />

        <div className={styles.essayLayout}>
          <article className={styles.essay}>
            <div className={styles.essayBody}>

              <p>Bull&rsquo;s-eye is one of the most uncomfortable dogs in British literature.</p>

              <p>He is not a heroic dog like Lassie. He is not a wrongly condemned dog like Gelert. He is not even a supernatural monster like the Hound of the Baskervilles. He is something more ordinary and, in some ways, more troubling: a dog whose reputation has been shaped almost entirely by the man who owns him.</p>

              <p>In <em>Oliver Twist</em>, Bull&rsquo;s-eye belongs to Bill Sikes, one of Dickens&rsquo;s most violent characters. Sikes is a robber, an abuser and eventually a murderer. He moves through London with menace, and Bull&rsquo;s-eye moves with him. The dog is not simply a pet placed in the background. He helps complete the reader&rsquo;s picture of Sikes as a dangerous man.</p>

              <p>That makes Bull&rsquo;s-eye an important subject for <strong>Good Dog, Bad Dog</strong>. Dickens certainly gives us a dog we are meant to fear. Bull&rsquo;s-eye is rough, threatening and closely associated with violence. But the more interesting question is why he appears dangerous. Is the dog morally corrupt, or has he been made to carry the brutality of his owner?</p>

              <p>Bull&rsquo;s-eye is frightening because he is Sikes&rsquo;s dog.</p>

              <div className={styles.sceneMobile}>
                <QuoteReveal
                  tight
                  blockClass={styles.pullquote}
                  markClass={styles.pullquoteMark}
                  pinned={<p className={styles.pinnedQuoteText} style={{ margin: 0 }}>Dickens gives Sikes a dog the way he gives him a temper: as part of the picture. The reader learns to fear the man partly by looking at the animal beside him.</p>}
                  quote="Bull&rsquo;s-eye does not merely accompany Sikes. He helps the reader recognise him."
                />
              </div>

              <h2 className={styles.subhead}>How Bill Sikes uses his dog to project violence</h2>

              <p>Bill Sikes belongs to the criminal underworld of Victorian London. Everything around him reinforces that identity: his language, movements, temper, clothing, surroundings and companions.</p>

              <p>Bull&rsquo;s-eye forms part of the same atmosphere.</p>

              <p>When Dickens first introduces the dog, he does not identify him as a Bull Terrier. He describes a white shaggy dog whose face is scratched and torn, entering the room cautiously. Bull&rsquo;s-eye is introduced not as a clean, recognisable pedigree dog, but as a damaged animal already physically marked by the world in which he lives.</p>

              <p>This matters because the Bull&rsquo;s-eye most people now picture is different. Later illustrations, theatrical productions and screen adaptations increasingly represented him as a smooth-coated, muscular Bull Terrier. The famous Bull Terrier in the 1968 film <em>Oliver!</em> helped cement that appearance in popular culture, despite Dickens having written the novel before the modern Bull Terrier was fully established.</p>

              <figure style={{ margin: 0, padding: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/history/bullseye/dogssilhouettes-img.jpg" alt="The shaggy dog Dickens described beside the smooth Bull Terrier culture remembers" loading="lazy" style={{ width: "100%", display: "block", borderRadius: "12px 12px 0 0" }} />
                <figcaption className={styles.choreoCaption}>Later culture did not simply remember Bull&rsquo;s-eye. It gave him a clearer and more recognisable breed identity.</figcaption>
              </figure>

              <p>Even Dickens&rsquo;s original illustrator, George Cruikshank, began smoothing the dog&rsquo;s coat and changing his apparent size, despite the description in the novel. The transformation therefore began surprisingly early.</p>

              <p>We cannot know that every later designer made this choice for the same reason. However, the change makes visual sense. A recognisable Bull Terrier offers illustrators and filmmakers a powerful silhouette and an immediate piece of cultural shorthand. Its muscular body, white coat and later reputation allow an audience to read &ldquo;tough dog&rdquo; almost instantly.</p>

              <p>But that process also reveals something important. Bull&rsquo;s-eye did not only become feared because of what he does in the story. Later culture altered his appearance so that his body itself communicated danger.</p>

              <p>The dog became easier to read, but also easier to stereotype.</p>

              <div className={styles.sceneMobile}>
                <QuoteReveal
                  tight
                  blockClass={styles.pullquote}
                  markClass={styles.pullquoteMark}
                  pinned={<p className={styles.pinnedQuoteText} style={{ margin: 0 }}>Dickens wrote a white shaggy dog with a scratched and torn face. Illustrators, then the stage, then the screen gave him a cleaner outline and a breed the novel never named.</p>}
                  quote="Later culture did not simply remember Bull&rsquo;s-eye. It gave him a body that communicated danger on his behalf."
                />
              </div>

              <h2 className={styles.subhead}>Dogs as social signals, then and now</h2>

              <p>In fiction, dogs often tell us something about the people beside them.</p>

              <p>A lapdog may be used to suggest wealth, fussiness or domestic comfort. A sheepdog can suggest rural skill and discipline. A hunting hound may communicate land, class and sport. Bull&rsquo;s-eye communicates something else: street violence, intimidation and the warning that his owner should not be approached.</p>

              <p>He becomes a social signal.</p>

              <p>That does not mean Bull&rsquo;s-eye is merely decoration. Dogs in Dickens often carry emotional and symbolic weight. But Bull&rsquo;s-eye is less an independent character than an extension of Sikes&rsquo;s public identity. He is part of the way readers learn to interpret the man.</p>

              <p>This has a modern parallel in the idea of the <strong>status dog</strong>. A status dog is not a particular breed. It describes the social use of a dog: choosing, displaying or encouraging an animal partly because it projects toughness, control or danger.</p>

              <p>The dog can become part of a public performance, used to make space, intimidate rivals or announce that its owner should not be challenged.</p>

              <p>That does not describe most owners of Bull Terriers, Mastiffs, Rottweilers or Staffordshire Bull Terriers. Most live with these dogs because they value them as companions. The point is not that powerful breeds automatically reveal something sinister about their owners. The point is that people sometimes use a dog&rsquo;s appearance and reputation to send a message.</p>

              <p>Dickens recognised something remarkably similar.</p>

              <p>Sikes is not frightening simply because he owns a dog. He is frightening because Bull&rsquo;s-eye completes the performance of menace.</p>

              <h2 className={styles.subhead}>When the symbol is alive</h2>

              <p>People communicate identity through more than words. Clothing, posture, possessions, vehicles and companions can all be used to present a particular version of the self.</p>

              <p>A dog can become part of that presentation too.</p>

              <p>The crucial difference is that clothing and vehicles are objects. A dog is a living creature with needs, emotions, learned behaviours and a life beyond the message its owner wants to send.</p>

              <figure style={{ margin: 0, padding: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/history/bullseye/funnel.jpg" alt="The signals people use to project identity" loading="lazy" style={{ width: "100%", display: "block", borderRadius: "12px 12px 0 0" }} />
                <figcaption className={styles.choreoCaption}>A dog can be used as a social signal, but unlike clothes or cars, it is a living creature.</figcaption>
              </figure>

              <p>A coat can be taken off. A car can be sold. A dog cannot simply step outside the role that a human being has created for it.</p>

              <p>That is where the moral problem begins.</p>

              <h2 className={styles.subhead}>Victorian London and the modern status dog</h2>

              <p>Victorian London and modern Britain are not the same. Their systems of housing, poverty, policing and organised crime are very different. Any comparison between them must therefore be made carefully.</p>

              <p>What does remain familiar is the human need to project identity in public spaces.</p>

              <p>People use appearance, movement, possessions and associations to communicate confidence, success, belonging or threat. In difficult environments, these signals may become especially important. A person who feels vulnerable may try to appear untouchable. A person who wants control may surround himself with signs of strength.</p>

              <p>Bull&rsquo;s-eye suits Sikes because the dog appears to belong to the same moral weather. The scars, aggression and physical presence seem to confirm everything the reader already fears about the man.</p>

              <p>The comparison with modern status-dog culture is therefore not about blaming a particular class, age group or style of dress. It is about how an animal can be recruited into a human performance of danger.</p>

              <p>The dog becomes a message.</p>

              <p>The problem is that the dog must then live with the consequences of that message.</p>

              <h2 className={styles.subhead}>Weaponised, not a weapon</h2>

              <p>A dog is not a knife, a gun or an object.</p>

              <p>A dog is a living animal with emotional needs, fear responses, learned behaviours and welfare requirements. Calling a dog a weapon too casually risks erasing the animal completely.</p>

              <p>But a dog can be <strong>weaponised</strong>.</p>

              <p>A person can choose a dog because others find its appearance intimidating. A person can encourage reactivity, neglect socialisation or deliberately expose the animal to stressful and violent situations. A person can use a dog&rsquo;s presence to threaten someone without issuing a direct command. In more extreme cases, a person can explicitly direct the dog towards another human being.</p>

              <p>Sikes does exactly that.</p>

              <p>When controlling Oliver, he calls to the dog and commands it to hold him. Bull&rsquo;s-eye is being used to make escape or resistance appear impossible. The threat belongs physically to the dog, but the intention, command and responsibility belong to Sikes.</p>

              <p>The dog carries the visible danger. The man creates and directs it.</p>

              <div className={styles.sceneMobile}>
                <QuoteReveal
                  tight
                  blockClass={styles.pullquote}
                  markClass={styles.pullquoteMark}
                  pinned={<p className={styles.pinnedQuoteText} style={{ margin: 0 }}>Sikes calls the dog and commands it to hold the boy. The threat belongs physically to the animal. The intention, the command and the responsibility do not.</p>}
                  quote="A dog is not a weapon. But a dog can be weaponised."
                />
              </div>

              <div className={`${styles.sceneMobile} ${styles.imageScene}`}>
                <WipeSequence
                  hold={1}
                  sceneVh={600}
                  captionMode="stack"
                  alt="Where Sikes and Bull's-eye overlap in the reader's mind"
                  images={[
                    "/history/bullseye/venn1.jpg",
                    "/history/bullseye/venn2.jpg",
                    "/history/bullseye/venn3.jpg",
                    "/history/bullseye/venn4.jpg",
                    "/history/bullseye/venn5.jpg",
                    "/history/bullseye/venn6.jpg",
                    "/history/bullseye/venn7.jpg",
                    "/history/bullseye/venn8.jpg",
                  ]}
                  captions={[
                    { fromProgress: 0.00, tone: "white", text: "Sikes creates the conditions." },
                    { fromProgress: 0.38, tone: "white", text: "Bull\u2019s-eye carries their visible consequences." },
                    { fromProgress: 0.72, tone: "white", text: "The public sees danger." },
                  ]}
                />
              </div>

              <p>The diagram should not imply that Sikes and Bull&rsquo;s-eye share equal moral responsibility. Its purpose is to show how they merge into one public image, even though the power between them is profoundly unequal.</p>

              <p>Bull&rsquo;s-eye does not design robberies. He does not control the household. He does not abuse Nancy. He does not create the world he inhabits.</p>

              <p>Sikes does.</p>

              <p>Yet because the dog stands beside him, readers absorb them into a single image of violence.</p>

              <p>The animal becomes part of the man&rsquo;s weaponry without ceasing to be an animal.</p>

              <h2 className={styles.subhead}>How dogs pay for their owner&rsquo;s choices</h2>

              <p>Bull&rsquo;s-eye does not live in a kind world.</p>

              <p>He belongs to a brutal owner. He is kicked, cursed and dragged through an environment of fear, crime and aggression. Dickens states plainly that a command to the dog was accompanied with a kick. The violence is not merely something Bull&rsquo;s-eye witnesses. It is directed at him.</p>

              <p>A dog living around violence may become fearful, defensive, reactive or aggressive. A dog repeatedly used to create threat may learn that threat is normal. A dog denied safe social experiences may struggle to behave like the stable companion the public expects it to be.</p>

              <p>Behaviour is shaped by a combination of inheritance, experience, health, environment and human management. Ownership is not the only influence, but it is the influence for which people carry responsibility.</p>

              <div className={styles.sidebarCard}>
                <div style={{ padding: "16px 20px 4px" }}>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "54px", lineHeight: 0.9, textAlign: "center", letterSpacing: "0.12em", color: "var(--yellow-header)", textTransform: "uppercase", margin: 0 }}>What shapes a dog&rsquo;s behaviour?</p>
                </div>
                <div style={{ padding: "12px 25px 20px" }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "1.04rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--navy)", background: "var(--yellow)", borderRadius: 999, padding: "8px 20px", display: "inline-block" }}>Inherited traits</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "1.04rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--navy)", background: "var(--yellow)", borderRadius: 999, padding: "8px 20px", display: "inline-block" }}>Early experiences</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "1.04rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--navy)", background: "var(--yellow)", borderRadius: 999, padding: "8px 20px", display: "inline-block" }}>Socialisation</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "1.04rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--navy)", background: "var(--yellow)", borderRadius: 999, padding: "8px 20px", display: "inline-block" }}>Training and learning</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "1.04rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--navy)", background: "var(--yellow)", borderRadius: 999, padding: "8px 20px", display: "inline-block" }}>Physical health and pain</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "1.04rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--navy)", background: "var(--yellow)", borderRadius: 999, padding: "8px 20px", display: "inline-block" }}>Fear and stress</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "1.04rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--navy)", background: "var(--yellow)", borderRadius: 999, padding: "8px 20px", display: "inline-block" }}>Living conditions</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "1.04rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--navy)", background: "var(--yellow)", borderRadius: 999, padding: "8px 20px", display: "inline-block" }}>Human management</span>
                  </div>
                </div>
              </div>

              <p>The public eventually sees the result and says: <strong>bad dog</strong>.</p>

              <p>That judgement may be necessary in the immediate moment. If a dog is attacking or threatening someone, the danger is real and must be dealt with. Recognising the human causes behind behaviour does not make an unsafe animal magically safe.</p>

              <p>But once the immediate danger has passed, another question remains: how did the dog reach that point?</p>

              <p>Bull&rsquo;s-eye&rsquo;s frightening reputation belongs partly to what he does. But the conditions that shaped him belong overwhelmingly to Sikes.</p>

              <p>He is the owner&rsquo;s shadow.</p>

              <div className={styles.sceneMobile}>
                <QuoteReveal
                  tight
                  blockClass={styles.pullquote}
                  markClass={styles.pullquoteMark}
                  pinned={<p className={styles.pinnedQuoteText} style={{ margin: 0 }}>A dog living around violence may become fearful, defensive or reactive. A dog repeatedly used to create threat may learn that threat is normal.</p>}
                  quote="The public sees the result and says: bad dog. The conditions that produced it belong to somebody else."
                />
              </div>

              <h2 className={styles.subhead}>The dog Dickens wrote became a Bull Terrier later</h2>

              <p>There is a further irony in Bull&rsquo;s-eye&rsquo;s cultural history.</p>

              <p><em>Oliver Twist</em> was published between 1837 and 1839. The recognisable Bull Terrier was developed and standardised later, particularly through the work of James Hinks during the 1850s and 1860s. The breed therefore developed after Dickens had already created Bull&rsquo;s-eye.</p>

              <div className={styles.timelineScene}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "54px", lineHeight: 0.9, textAlign: "center", letterSpacing: "0.12em", color: "var(--yellow-header)", textTransform: "uppercase", margin: "0 0 18px" }}>How the image changed</p>
                <div className={styles.tlBody}>
                  <div className={styles.tlTrack} />
                  {BE_TIMELINE.map(({ era, name, context, end }) => (
                    <div key={era + name} className={styles.tlItem} style={{ display: "flex", gap: 14 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 16, flexShrink: 0 }}>
                        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#fff", marginTop: 4, flexShrink: 0 }} />
                        {!end && <div style={{ width: 2, flex: 1, minHeight: 48 }} />}
                      </div>
                      <div style={{ paddingBottom: end ? 0 : 28 }}>
                        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 700, color: "#fff", letterSpacing: "0.05em", marginBottom: 3, textTransform: "uppercase" }}>{era}</p>
                        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 600, color: "#fff", marginBottom: 4 }}>{name}</p>
                        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 500, color: "#fff", lineHeight: 1.3 }}>{context}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p>This means Bull&rsquo;s-eye has undergone two connected transformations.</p>

              <p>Within the story, Sikes turns a dog into a symbol of human menace. Outside the story, later culture reshapes that dog into a breed already capable of signalling toughness.</p>

              <p>The process did not necessarily begin as a deliberate attack on Bull Terriers. Adaptations need clear, quickly understood visuals. A distinctive white Bull Terrier looks memorable on stage, in illustrations and on screen. It creates a stronger silhouette than a vague shaggy mongrel and allows the audience to identify the dog instantly.</p>

              <p>But repeated adaptations accumulate.</p>

              <p>Once enough productions use the same breed, the creative decision begins to look like historical fact. The adaptation replaces the text. The chosen dog acquires the character&rsquo;s reputation, and the breed becomes burdened by a role Dickens did not specifically give it.</p>

              <p>Bull&rsquo;s-eye did not begin as a Bull Terrier.</p>

              <p>Culture made him one.</p>

              <h2 className={styles.subhead}>What Bull Terriers are really like</h2>

              <p>The modern Bull Terrier has often suffered from its visual power.</p>

              <p>Its muscular body, distinctive head and historical relationship with bull-and-terrier dogs make it easy to cast as threatening. Fiction, advertising and popular imagery can reduce the breed to toughness alone.</p>

              <p>But real Bull Terriers are not literary symbols.</p>

              <p>They are energetic, strong-willed and often comical dogs. They require responsible ownership, suitable training, socialisation and an understanding of their physical strength. Their determination is real, but determination is not wickedness.</p>

              <p>The same physical qualities that make a Bull Terrier appear intimidating can also make it athletic, playful and absurdly entertaining. In another story, the same dog can be a family companion, an advertising character or a clown.</p>

              <p>The dog that played Bull&rsquo;s-eye in the 1968 film demonstrates the difference between role and reality. According to the family who owned him, Butch was an affectionate, clever and food-motivated dog who was well liked on set. He performed the appearance of menace while apparently being very different from the character he represented.</p>

              <p>Bull&rsquo;s-eye should not be read as evidence against Bull Terriers. He is evidence of how an animal can be framed, first by its owner, then by an author, and finally by generations of visual culture.</p>

              <h2 className={styles.subhead}>Why repeated bad-dog portrayals affect real breeds</h2>

              <p>Fiction can outlive its original purpose.</p>

              <p>A reader may forget most of the plot of <em>Oliver Twist</em> but retain one visual association: violent man, frightening dog, Bull Terrier.</p>

              <p>One novel does not single-handedly determine a breed&rsquo;s reputation. Culture rarely works so simply. The effect comes through accumulation.</p>

              <p>When powerful dogs repeatedly appear beside criminals, villains and violent men, audiences learn to read their bodies as warnings. The animal may be judged before it behaves. Its silhouette begins to carry a story of its own.</p>

              <p>The same process occurred inside <em>Oliver Twist</em>. Readers saw Sikes and Bull&rsquo;s-eye together and learned to interpret them as a single threat.</p>

              <p>Later adaptations intensified that process by replacing Dickens&rsquo;s uncertain shaggy dog with a recognisable breed. The frightening fictional role did not disappear when the curtain came down or the film ended. It followed the breed away from the story.</p>

              <div className={styles.sceneMobile}>
                <QuoteReveal
                  tight
                  blockClass={styles.pullquote}
                  markClass={styles.pullquoteMark}
                  pinned={<p className={styles.pinnedQuoteText} style={{ margin: 0 }}>A person meeting a real Bull Terrier may feel they already know what it represents. What they know has come from fiction, adaptation and repetition rather than from the animal in front of them.</p>}
                  quote="The story arrives before the dog."
                />
              </div>

              <p>A person encountering a real Bull Terrier may therefore feel that they already know what it represents. But what they know may come from fiction, adaptation and repetition rather than from the behaviour of the animal in front of them.</p>

              <p>That is the danger of turning a breed into a narrative shortcut.</p>

              <h2 className={styles.subhead}>A dog used to say something about a person</h2>

              <p>Bull&rsquo;s-eye exposes a difficult truth: people sometimes use dogs to say things about themselves.</p>

              <p>A dog can communicate gentleness, respectability, wealth, rural identity, discipline or companionship. In Sikes&rsquo;s case, Bull&rsquo;s-eye communicates that nobody should come close.</p>

              <p>But Bull&rsquo;s-eye is not naturally identical to Sikes.</p>

              <p>The diagram shows where the two figures merge in the reader&rsquo;s mind, but their responsibilities remain different. Sikes possesses power, makes choices and gives commands. Bull&rsquo;s-eye receives abuse, inhabits the environment Sikes creates and displays the damage.</p>

              <p>The danger is shared visually. The responsibility is not.</p>

              <p>That is why the essay should not end by condemning Bull&rsquo;s-eye or the breed later used to represent him. It should end by questioning the human desire to turn a living animal into an emblem of threat.</p>

              <p>Bull&rsquo;s-eye is remembered as a bad dog because he walks beside a bad man.</p>

              <p>Later culture made that message even stronger by giving him the body of a recognisable Bull Terrier. The adaptation made him visually clearer, but it also transferred his fictional reputation onto real dogs that had nothing to do with Sikes.</p>

              <p>The true lesson is not that Bull Terriers are dangerous. It is that any powerful dog can be morally disfigured by the story a human attaches to it.</p>

              <p>And when that happens, the dog does not merely reflect the owner&rsquo;s shadow.</p>

              <p>It has to live inside it.</p>

            </div>
          </article>

          <aside className={styles.sidebar}>
            {runningCosts[SLUG] && <div className={styles.sidebarCard}><RunningCostCard config={runningCosts[SLUG]} /></div>}
            {suitabilityScores[SLUG] && <div className={styles.sidebarCard}><SuitabilityRadar score={suitabilityScores[SLUG]} breedName="Bull Terrier" /></div>}
            {trainingDifficulty[SLUG] && <div className={styles.sidebarCard}><TrainingCard data={trainingDifficulty[SLUG]} /></div>}
            {groomingNeeds[SLUG] && <div className={styles.sidebarCard}><GroomingCard data={groomingNeeds[SLUG]} /></div>}
            {exerciseNeeds[SLUG] && <div className={styles.sidebarCard}><ExerciseCard data={exerciseNeeds[SLUG]} /></div>}
          </aside>
        </div>

        <div className={`${styles.verdict} ${styles.verdictBad}`}><strong>The verdict:</strong> A bad dog made by a bad man. Bull's-eye is not morally corrupt in the way Sikes is morally corrupt. He is an animal shaped by his owner's world and used to carry his owner's threat. The breed pays a price it did nothing to earn.</div>
      </main>
      <Footer />
    </>
  );
}
