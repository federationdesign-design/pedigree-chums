import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "ChumSpot Challenge — Pedigree Chums",
  description: "Spot a dog. Match the card. Share your ChumSpot. Win Best in Show and an exclusive Limited Edition Chum Figurine.",
};

const TERMS = [
  {
    num: "1",
    title: "The promoter",
    body: "The promoter of the ChumSpot Challenge is [FULL LEGAL BUSINESS NAME], trading as Pedigree Chums, [BUSINESS POSTAL ADDRESS]. Competition enquiries should be sent to [COMPETITION EMAIL ADDRESS]. In these terms, \"we\", \"us\", \"our\" and \"the promoter\" refer to the business identified above.",
  },
  {
    num: "2",
    title: "Competition dates",
    body: "The ChumSpot Challenge begins on [OVERALL START DATE] and ends at 23:59 UK time on [OVERALL FINAL CLOSING DATE]. The competition is divided into monthly rounds. Each monthly round opens at 00:00 on the first calendar day of the month and closes at 23:59 on the final calendar day of that month. All times are UK local time (GMT or BST as applicable). An entry received after a monthly closing time may be considered during the following monthly round, provided the overall competition is still open. Entries received after the overall final closing date will not be accepted.",
  },
  {
    num: "3",
    title: "Eligibility",
    body: "Open to UK residents aged 18 or over. A young person aged 14–17 may take part only through a parent or legal guardian, who must submit the entry from their own account, agree to these terms, and accept the prize if the entry wins. Entries from accounts belonging to someone under 18 will not be accepted. People under 14 may not participate. Employees of the promoter, judges and their immediate families may not enter.",
  },
  {
    num: "4",
    title: "How to enter",
    body: "1. Spot a dog matching a breed in the Pedigree Chums pack. 2. Take an original photo or video with the matching card. 3. Post publicly on Instagram or TikTok during the relevant competition period. 4. Tag @pedigree_chums. 5. Include both #ChumSpot and #DogSpotting. 6. Keep the post publicly viewable until the winner is selected. Multiple entries are permitted but each must be a separate post with an original photo or video.",
  },
  {
    num: "5",
    title: "Photographing dogs safely",
    body: "The wellbeing of the dog must always come first. Always ask the owner's permission before photographing. Do not approach, touch or feed a dog without permission. Do not interrupt working, assistance or service dogs. Do not encourage unsafe behaviour or enter private property without permission. An entry may be rejected if we reasonably believe it involved unsafe or irresponsible behaviour.",
  },
  {
    num: "6",
    title: "People appearing in an entry",
    body: "You must have permission from every recognisable person appearing in your entry. Where a person is under 18, permission must come from their parent or legal guardian before posting. Do not include personal information such as home addresses, school names, phone numbers or anything that unnecessarily identifies a child's location. By submitting, you confirm all necessary permissions have been obtained.",
  },
  {
    num: "7",
    title: "Entry standards",
    body: "Entries must be your own original work. They must not infringe another person's rights, contain unlawful or offensive material, promote cruelty to animals, or contain content unsuitable for a family audience. Only use music, audio or images you are entitled to use. We may reject or disqualify any entry that does not comply with these terms.",
  },
  {
    num: "8",
    title: "Judging process",
    body: "The ChumSpot Challenge is a judged competition, not a random draw. A panel including at least one independent member will score entries on: Charm and personality (30%), Creativity and originality (30%), Dog-and-card match (20%), Clarity and storytelling (20%). The highest-scoring eligible entry wins. In the event of a tie, the creativity criterion is reassessed. The judges' decision is final.",
  },
  {
    num: "9",
    title: "Winner contact",
    body: "Judging normally takes place within 10 working days of the monthly closing date. The provisional winner will be contacted by direct message from @pedigree_chums. We will never ask a winner to pay a fee, provide payment-card details, or contact any account other than our official one. The winner must respond within 14 days with their name, eligibility confirmation, and a valid UK delivery address.",
  },
  {
    num: "10",
    title: "Winner announcement",
    body: "The winner may be announced on the Pedigree Chums website and social channels. We may publish the winner's surname, county, social-media username and winning entry. Winners may ask us to limit what we publish. We will not publicly identify a young person aged 14–17 without express agreement from their parent or guardian.",
  },
  {
    num: "11",
    title: "The prize",
    body: "One exclusive Limited Edition Chum Figurine, 3D printed to order and delivered free to one UK address. The prize has no cash alternative and is non-transferable, non-refundable and not exchangeable. Minor variations in colour, dimensions and finish may occur. If the advertised prize becomes unavailable, we may provide a reasonable alternative of equal or greater value.",
  },
  {
    num: "12",
    title: "Prize delivery",
    body: "The prize will be delivered free to one valid UK postal address, normally within 30 days of the winner being confirmed and supplying delivery information. The winner is responsible for providing a correct address. We are not responsible for delivery failures caused by incorrect information or circumstances outside our reasonable control.",
  },
  {
    num: "13",
    title: "Permission to use entries",
    body: "Entrants retain ownership of their content. By entering, you grant Pedigree Chums a non-exclusive, royalty-free licence to reproduce, display, edit and share your entry to administer and promote the competition, celebrate winners and promote future rounds. This licence applies worldwide for 24 months from submission. We will credit your account when reasonably practical when reposting.",
  },
  {
    num: "14",
    title: "Personal information and privacy",
    body: "We use personal information to verify eligibility, contact winners, administer the competition and arrange prize delivery. We collect only what is reasonably required. Delivery addresses are normally requested only from winners. We will not add you to a marketing list without your agreement. Further information is in the Pedigree Chums Privacy Policy at [PRIVACY POLICY LINK].",
  },
  {
    num: "15",
    title: "Disqualification",
    body: "We may disqualify entries where we reasonably believe the entry does not comply with these terms, required information is false, the competition has been manipulated, content was copied without permission, automated accounts were used, or the entry involved unsafe behaviour. Disqualification will not be based solely on our opinion of an entrant.",
  },
  {
    num: "16",
    title: "Changes or cancellation",
    body: "We intend to run and award the competition as described. We may suspend, amend or cancel a monthly round only where circumstances genuinely outside our reasonable control make this necessary. We will not change a closing date simply to avoid awarding a prize. Where a change is unavoidable, we will act fairly and publish an update on this page.",
  },
  {
    num: "17",
    title: "Responsibility",
    body: "We are responsible for administering the competition fairly and providing the prize as described. To the extent permitted by law, we are not responsible for platform outages, entries lost because of incorrect tags or privacy settings, or events outside our reasonable control. Nothing in these terms excludes liability where doing so would be unlawful.",
  },
  {
    num: "18",
    title: "Instagram and TikTok disclaimer",
    body: "This competition is not sponsored, endorsed, administered by or associated with Instagram or TikTok. Questions and complaints must be directed to the promoter, not the platforms. To the extent permitted by law, each entrant releases Instagram and TikTok from claims arising from administration of this competition. Entrants must also comply with each platform's own rules.",
  },
  {
    num: "19",
    title: "Acceptance of these terms",
    body: "Submitting an entry constitutes acceptance of these competition terms. Where a young person aged 14–17 participates, submission by their parent or guardian confirms that the adult has read and accepted these terms, given permission for the young person to participate, and agrees to act as the official entrant and prize recipient.",
  },
];

export default function ChumSpot() {
  return (
    <>
      <Nav />
      <main className={styles.main}>

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <p className={styles.eyebrow}>Monthly Competition</p>
            <h1 className={styles.heroTitle}>ChumSpot<br />Challenge</h1>
            <p className={styles.heroSub}>
              Spot a dog. Match the card. Share your ChumSpot.<br />
              Win Best in Show.
            </p>
            <div className={styles.ctaPills}>
              <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className={styles.ctaPrimary}>Enter on Instagram</a>
              <a href="https://www.tiktok.com" target="_blank" rel="noopener noreferrer" className={styles.ctaSecondary}>Enter on TikTok</a>
            </div>
            <p className={styles.closingDate}>
              Current monthly round closes at 23:59 on <strong>[CURRENT CLOSING DATE]</strong>.
            </p>
          </div>
        </section>

        {/* ── What it is ───────────────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.inner}>
            <p className={styles.lead}>
              Have you spotted a dog that matches one of the breeds in your Pedigree Chums pack?
            </p>
            <p>
              Take a photo or video with the matching card, share it on Instagram or TikTok,
              and enter the <strong>ChumSpot Challenge</strong>.
            </p>
            <p>
              Every month, we&rsquo;ll choose our favourite entry as <strong>Best in Show</strong>.
              The winner receives an exclusive Limited Edition Chum Figurine, 3D printed to order
              and delivered free anywhere in the United Kingdom.
            </p>
            <p className={styles.ageNote}>
              Open to UK residents aged 18 or over. Young people aged 14–17 may participate through
              a parent or legal guardian, who must submit the entry from their own account.
            </p>
          </div>
        </section>

        {/* ── How to enter ─────────────────────────────────────── */}
        <section className={styles.howSection}>
          <div className={styles.inner}>
            <h2 className={styles.sectionTitle}>How to enter</h2>
            <div className={styles.steps}>
              {[
                ["1. Spot", "Find a dog that matches a breed featured in your Pedigree Chums pack."],
                ["2. Snap", "Ask the dog\u2019s owner or handler for permission, then take a photo or video showing the dog with the matching card."],
                ["3. Post", "Share your photo or video publicly on Instagram or TikTok."],
                ["4. Tag", "Tag our official account @pedigree_chums and include both hashtags: #ChumSpot and #DogSpotting. Your post must stay public until the winner is selected."],
              ].map(([title, body]) => (
                <div key={title} className={styles.step}>
                  <h3 className={styles.stepTitle}>{title}</h3>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Prize ────────────────────────────────────────────── */}
        <section className={styles.prizeSection}>
          <div className={styles.inner}>
            <h2 className={styles.sectionTitle}>The prize</h2>
            <p>One <strong>Best in Show</strong> winner will be selected during each monthly round. The winner receives:</p>
            <ul className={styles.prizeList}>
              <li>One exclusive Limited Edition Chum Figurine</li>
              <li>3D printed to order</li>
              <li>Free delivery to one UK address</li>
              <li>The title of ChumSpot Best in Show</li>
              <li>The opportunity to be featured on the Pedigree Chums website and social channels</li>
            </ul>
          </div>
        </section>

        {/* ── Judging criteria ─────────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.inner}>
            <h2 className={styles.sectionTitle}>What are we looking for?</h2>
            <p>You do not need professional equipment. We&rsquo;re looking for ChumSpots that capture the fun, charm and personality of dog spotting. Eligible entries will be judged on:</p>
            <div className={styles.criteria}>
              {[
                ["Charm and personality", "30%"],
                ["Creativity and originality", "30%"],
                ["The dog-and-card match", "20%"],
                ["Clarity and storytelling", "20%"],
              ].map(([label, pct]) => (
                <div key={label} className={styles.criterion}>
                  <span className={styles.criterionPct}>{pct}</span>
                  <span className={styles.criterionLabel}>{label}</span>
                </div>
              ))}
            </div>
            <p>Make us smile, surprise us or show us a particularly brilliant ChumSpot.</p>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <section className={styles.ctaSection}>
          <div className={styles.inner} style={{textAlign:"center"}}>
            <h2 className={styles.sectionTitle}>Ready to join the pack?</h2>
            <p>Spot your next Chum, share your entry and remember both hashtags:</p>
            <p className={styles.hashtags}>#ChumSpot &nbsp; #DogSpotting</p>
            <div className={styles.ctaPills}>
              <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className={styles.ctaPrimary}>Enter on Instagram</a>
              <a href="https://www.tiktok.com" target="_blank" rel="noopener noreferrer" className={styles.ctaSecondary}>Enter on TikTok</a>
            </div>
          </div>
        </section>

        {/* ── Full Terms ───────────────────────────────────────── */}
        <section className={styles.termsSection}>
          <div className={styles.inner}>
            <h2 className={styles.termsSectionTitle}>ChumSpot Challenge: Full Competition Terms</h2>
            <div className={styles.termsGrid}>
              {TERMS.map((t, i) => (
                <div key={t.num} className={`${styles.termCard} ${i % 2 === 0 ? styles.termCardYellow : styles.termCardWhite}`}>
                  <span className={styles.termNum}>{t.num}</span>
                  <h3 className={styles.termTitle}>{t.title}</h3>
                  <p className={styles.termBody}>{t.body}</p>
                </div>
              ))}
            </div>
            <p className={styles.contactNote}>
              Questions about the ChumSpot Challenge can be sent to <strong>[COMPETITION EMAIL ADDRESS]</strong>.
              Please do not send bank details, card details or other unnecessary financial information.
            </p>
          </div>
        </section>

      </main>
    </>
  );
}
