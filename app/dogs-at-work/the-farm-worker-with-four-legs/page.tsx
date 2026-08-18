import type { Metadata } from "next";
import * as React from "react";
import Link from "next/link";
import Nav from "../../../components/Nav/Nav";
import Footer from "../../../components/Footer/Footer";
import styles from "../dogs-at-work.module.css";
import ArticleTextToggle from "../../../components/ArticleTextToggle/ArticleTextToggle";
import Payslip from "../../../components/Payslip/Payslip";
import SidebarCard from "../../../components/DogsAtWork/SidebarCard";
import sidebar from "../../../components/DogsAtWork/SidebarCard.module.css";
import MobileArticleBody, { type ArticleCard } from "../../../components/DogsAtWork/MobileArticleBody";
import { PAYSLIPS } from "../data/payslips";

export const metadata: Metadata = {
  title: "The Farm Worker With Four Legs | Dogs at Work",
  description:
    "To the shepherd it is labour saved. To the sheepdog it is the best game ever invented: find the sheep, get behind them, bring them home. Nobody has told it otherwise.",
};

// Article 4 body, transcribed verbatim from the supplied copy
// (docs/dogs-at-work/reference/sheepdogs_article_copy.md), above the working-notes
// divider and minus the superseded in-copy payslip. Two sections that the copy
// embeds in the body flow, "What the dog thinks it's doing" and "The honest
// version", are lifted into the sidebar per brief v3.0 section 15 (they are
// sidebar modules in the series grammar, as on articles 1 to 3), so the body ends
// on the required closing beat, "And this, of course, is a job". Headings are
// stored sentence-cased; the .subhead rule uppercases them, as on the other
// articles.
const BODY: (string | { h: string; id: string })[] = [
  "High on a British hillside, one farmer may be responsible for hundreds of sheep spread across acres of ground that would take a human an age to cross. Then somebody opens a gate, gives a whistle, and a black-and-white dog disappears over the hill.",
  "A few minutes later, the sheep start coming back.",
  "To us, that is agricultural labour. To the sheepdog, it is considerably more exciting. Find the sheep. Get around them. Bring them to the human. Do not let that particularly determined ewe ruin everything.",
  "For generations, farmers have bred working sheepdogs for intelligence, stamina, responsiveness and the ability to control livestock across difficult country. The International Sheep Dog Society still describes sheepdog trials as practical demonstrations of the skills dogs use during everyday work on farms and hills.",
  "And unlike plenty of jobs humans have invented, this is one where the employee often appears absolutely furious about being told to stop.",

  { h: "One dog. A very large field.", id: "large-field" },
  "The simplest way to understand the value of a sheepdog is to imagine doing the same job without one.",
  "Sheep do not necessarily live conveniently beside the gate. On upland farms they may be scattered over steep hills, valleys and rough ground. A shepherd on foot would have to cover that distance personally, repeatedly, while somehow persuading an entire flock to travel in the same direction.",
  "A trained sheepdog can range out, locate the animals, get behind them and begin moving them towards the shepherd.",
  "That does not mean the farmer presses SHEEP HOME and waits.",
  "The dog and handler work as a team. The shepherd reads the livestock and the ground. The dog supplies speed, positioning and pressure at exactly the places a human cannot physically be.",
  "It is less like owning a remote-controlled dog and more like working with a very fast colleague who has opinions.",

  { h: "What the dog is actually doing", id: "actually-doing" },
  "A good sheepdog controls movement.",
  "It uses position, speed, posture and pressure to influence where the flock goes. Border Collies are especially famous for their low, concentrated approach and intense attention to livestock, but the fundamental job is not simply chasing sheep.",
  "Chasing would be disastrous.",
  "The dog has to learn how close it can work without panicking the flock, when to push forward, when to give ground and how to move around the sheep so they travel towards the required point.",
  "That distinction matters. The National Sheep Association warns that uncontrolled dogs chasing sheep can cause extreme stress, injury and even death. A working sheepdog is therefore doing almost the opposite of an uncontrolled pet dog. Its instinct has been shaped and trained into controlled movement.",
  "The same basic animal that could scatter a flock has been taught to organise one.",
  "That is quite an upgrade.",

  { h: "The outrun, the fetch and the drive", id: "outrun" },
  "A sheepdog's work can be broken into jobs within the job.",
  "First comes the outrun. The dog leaves the shepherd and travels wide around the flock rather than charging straight towards it.",
  "Then comes the lift, when the dog makes contact with the sheep and starts them moving.",
  "Next is the fetch, bringing the flock towards the handler.",
  "The dog may then be asked to drive the sheep away or across the handler's position, steer them through gates, separate selected animals or hold them in one place.",
  "These are the same kinds of practical skills tested in organised sheepdog trials. The ISDS says trials are designed to reflect as closely as possible the conditions and work encountered in everyday shepherding.",
  "Which means competitive sheepdogging is essentially the unusual sport where the obstacle course is based on somebody else's Monday morning.",

  { h: "A language made of whistles", id: "whistles" },
  "One of the strangest things about watching an experienced shepherd and sheepdog is how little apparent conversation takes place.",
  "The handler may be hundreds of metres away.",
  "There is no lead.",
  "There may not even be a shouted word.",
  "Instead, different whistle commands can tell the dog to move clockwise or anticlockwise, stop, lie down, walk forward, slow down or return.",
  "The exact commands vary between handlers, but the principle is extraordinary: humans and dogs have developed a working language capable of directing another species across open countryside.",
  "The sheep do not get a vote in this communication system.",

  { h: "Built by the job", id: "built-by-job" },
  "The modern Border Collie did not appear because somebody wanted a handsome black-and-white dog.",
  "Working ability came first.",
  "The Royal Kennel Club describes the Border Collie as a naturally active and intelligent herding specialist whose roots lie in the border regions of Britain, where dogs proved themselves working sheep across hills and mountains.",
  "The International Sheep Dog Society still places working ability at the centre of its breeding system. Its stud book allows breeders to examine parentage and identify dogs with proven working or trialling ability when making breeding decisions.",
  "So speed, stamina, trainability, concentration and the desire to control moving livestock were not happy accidents.",
  "Humans kept choosing dogs that were better at the job.",
  "Then bred those dogs to other dogs that were better at the job.",
  "Repeat that for generations and eventually you get an animal capable of staring at six hundred kilograms of sheep and apparently thinking:",
  "Yes. I can organise this.",

  { h: "The dog that saves legs", id: "saves-legs" },
  "There is an economic story hidden inside all this running.",
  "Every journey the dog makes is potentially a journey the shepherd does not have to make.",
  "Every flock gathered efficiently saves human time.",
  "Every animal moved safely reduces the labour required to manage livestock.",
  "On difficult upland ground, that difference becomes enormous.",
  "This is why describing a sheepdog simply as a pet that lives on a farm misses the point. A genuinely working sheepdog is part of the farm's labour system.",
  "The machine comparison is tempting, but it is also where the comparison falls apart.",
  "Machines do not decide that the sheep on the left is about to break away.",
  "Machines do not learn the temperament of a flock.",
  "And very few tractors become visibly offended when somebody else gets sent to collect the sheep.",

  { h: "Not every collie needs a farm", id: "not-every-collie" },
  "The abilities that make a brilliant sheepdog can create challenges when the same dog lives an entirely different life.",
  "A dog bred to notice movement, react quickly, solve problems and work for long periods does not automatically stop possessing those tendencies because its address is now a semi-detached house.",
  "That does not mean every Border Collie needs sheep.",
  "It means dogs need suitable outlets for the brains and behaviours humans spent generations building into them.",
  "Training, scent work, agility, games, retrieving and other structured activities can all give active dogs something meaningful to do.",
  "The sheep are optional.",
  "The need for a life containing more intellectual stimulation than watching somebody unload the dishwasher generally is not.",

  { h: "And this, of course, is a job", id: "is-a-job" },
  "The sheepdog does not understand agricultural productivity.",
  "It has never seen the farm accounts.",
  "It is not concerned about labour efficiency.",
  "It does not know that a farmer might otherwise spend considerably more time walking over hills, moving gates and attempting to be in several places at once.",
  "The dog knows there are animals to gather, a handler giving instructions and another chance to do the thing generations of its ancestors were selected to enjoy.",
  "We get the time.",
  "We get the livestock where it needs to be.",
  "We get a working partnership capable of operating across terrain where machinery and people struggle.",
  "The dog gets the sheep.",
  "That may be one of the most successful employment negotiations in British history.",
  "And it captures the argument running through this entire series: dogs bring us abilities we do not possess, or save us enormous amounts of time and effort using abilities they do possess. Quite often, the extraordinary part is that they would really rather be doing it than sitting at home.",
];

// "Built for the job": the five attributes named in the sidebar spec. No
// descriptors or figures are supplied, so none are invented; the module lists
// the five traits, each grounded in the body copy.
const ATTRIBUTES = ["Intelligence", "Stamina", "Responsiveness", "Speed", "Stock sense"];

// Sidebar cards as an explicit list. Desktop renders them in the sticky sidebar
// in this order; mobile renders each above the H2 named in pairWith (or in the
// tail bucket). Pairing is by heading id, never array order.
const CARDS: ArticleCard[] = [
  {
    id: "dog-thinks",
    pairWith: "is-a-job",
    node: (
      <SidebarCard title="What the dog thinks it's doing">
        <p className={sidebar.text}>
          <strong>What humans think:</strong> a highly trained agricultural working dog is gathering and controlling livestock while reducing labour requirements.
        </p>
        <p className={sidebar.text}>
          <strong>What the dog thinks:</strong> there are sheep over there. They should be over here. I have several thoughts about this.
        </p>
      </SidebarCard>
    ),
  },
  {
    id: "built-for-the-job",
    pairWith: "built-by-job",
    node: (
      <SidebarCard title="Built for the job">
        <div className={sidebar.attrList}>
          {ATTRIBUTES.map((a) => (
            <div key={a} className={sidebar.attrRow}>
              <span className={sidebar.attrName}>{a}</span>
            </div>
          ))}
        </div>
      </SidebarCard>
    ),
  },
  {
    id: "from-work-to-sport",
    pairWith: "outrun",
    node: (
      <SidebarCard title="From work to sport">
        <p className={sidebar.text}>
          Sheepdog trials turn the real jobs of gathering, fetching, driving and penning sheep into a competitive course, rather than teaching dogs artificial tricks. The dogs are willing participants because the tasks use the same herding instincts, concentration and partnership with their handler that generations of working sheepdogs were bred to enjoy. To us it is a competition; to the dog, it is another chance to work sheep.
        </p>
      </SidebarCard>
    ),
  },
  {
    id: "sources",
    pairWith: "tail",
    node: (
      <SidebarCard title="Sources">
        <p className={sidebar.sources}>
          International Sheep Dog Society<br />
          Royal Kennel Club<br />
          National Sheep Association
        </p>
      </SidebarCard>
    ),
  },
];

export default function SheepdogsPage() {
  return (
    <>
      <Nav showLogo />
      <main className={styles.essayPage}>
        <div className={styles.essayHero}>
          <img
            src="/sheepdogs_job.jpg"
            alt="a black and white Border Collie sitting in long grass in a field"
            className={styles.essayHeroImg}
          />
          <div className={styles.essayHeroTint} />
          <div className={styles.essayHeroContent}>
            <Link href="/dogs-at-work" className={styles.backLink}>← Back to Dogs at Work</Link>
            <div className={styles.essayHeroMeta}>
              <span className={`${styles.tag} ${styles.tagRural}`}>Rural</span>
              <span className={styles.tagBreed}>Sheepdogs</span>
            </div>
            <h1 className={styles.essayHeroTitle}>The Farm Worker With Four Legs</h1>
          </div>
        </div>

        <ArticleTextToggle />

        <div className={styles.essayLayout}>
          <article className={styles.essay}>
            <div className={styles.essayBody}>
              {BODY.map((b, i) =>
                typeof b === "string"
                  ? <p key={i}>{b}</p>
                  : <h2 key={i} id={b.id} className={styles.subhead}>{b.h}</h2>
              )}
            </div>
          </article>

          <aside className={styles.sidebar}>
            {/* The payslip (brief v3.0 section 13 + Appendix C). Uses the section
                13 article-4 values, not the earlier "Woolly Personnel Manager"
                draft printed inside the supplied copy. */}
            <Payslip data={PAYSLIPS["the-farm-worker-with-four-legs"]} className={styles.payslipOverlay} />

            {CARDS.map((c) => (
              <React.Fragment key={c.id}>{c.node}</React.Fragment>
            ))}
          </aside>
        </div>

        {/* Mobile: single interleaved column. Payslip in the after-hero slot, then
            each card above its paired H2 (see MobileArticleBody). Desktop uses the
            two-column layout above; only one is visible at a time. */}
        <div className={styles.articleMobile}>
          <div className={styles.mobilePayslip}>
            <Payslip data={PAYSLIPS["the-farm-worker-with-four-legs"]} />
          </div>
          <MobileArticleBody
            body={BODY}
            cards={CARDS}
            bodyClassName={styles.essayBody}
            subheadClassName={styles.subhead}
            slotClassName={styles.mobileCardSlot}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
