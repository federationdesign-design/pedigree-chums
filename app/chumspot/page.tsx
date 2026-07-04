"use client";
import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Spot your Chum Photo Competition — Pedigree Chums",
  description: "Spot a dog. Match the card. Share your ChumSpot. Win a 3D printed Chum figurine.",
};

const TERMS = [
  {
    num: "1",
    title: "The promoter",
    body: "The promoter of the Spot your Chum Photo Competition is Taylor James Stephens Ltd, trading as Pedigree Chums. Competition enquiries should be sent to hello@Pedigree-Chums.co.uk. In these terms, \"we\", \"us\", \"our\" and \"the promoter\" refer to the business identified above.",
  },
  {
    num: "2",
    title: "Competition dates",
    body: "The Spot your Chum Photo Competition is an ongoing monthly competition. Each monthly round opens at 00:00 on the first calendar day of the month and closes at 23:59 on the final calendar day of that month. The competition is divided into monthly rounds. Each monthly round opens at 00:00 on the first calendar day of the month and closes at 23:59 on the final calendar day of that month. All times are UK local time (GMT or BST as applicable). An entry received after a monthly closing time may be considered during the following monthly round, provided the overall competition is still open. Entries received after the overall final closing date will not be accepted.",
  },
  {
    num: "3",
    title: "Eligibility",
    body: "Open to UK residents aged 18 or over. A young person aged 14–17 may take part only through a parent or legal guardian, who must submit the entry from their own account, agree to these terms, and accept the prize if the entry wins. Entries from accounts belonging to someone under 18 will not be accepted. People under 14 may not participate. Employees of the promoter, judges and their immediate families may not enter.",
  },
  {
    num: "4",
    title: "How to enter",
    body: "1. Spot a dog matching a breed in the Pedigree Chums pack. | 2. Take an original photo with the matching card. | 3. Post publicly on Instagram or TikTok during the relevant period. | 4. Tag @pedigree_chums. | 5. Include both #ChumSpot and #DogSpotting. | 6. Keep the post publicly viewable until the winner is selected. Multiple entries are permitted — each must be a separate post featuring an original photo.",
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
    body: "We choose our favourite each month — and our criteria change to keep things fresh. That said, the safest way to get noticed is simple: a good quality image, a clear view of the card, a clear view of the dog, and something fun. Make us smile. The judges' decision is final.",
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
  {
    num: "20",
    title: "Figurine selection",
    body: "The winner cannot choose which Chum figurine they receive. The figurine design is selected by Pedigree Chums at the time of fulfilment. Only certain Chum characters have currently been modelled for 3D printing. If the specific character cannot be produced for any reason, a reasonable alternative figurine of equal or greater value will be provided.",
  },
];

export default function ChumSpot() {
  return (
    <>
      <Nav />
      <main className={styles.main}>

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className={styles.hero}>
          <video
            className={styles.heroVid}
            src="/comp-hero-vid.mp4"
            autoPlay
            muted
            playsInline
            onEnded={(e) => { const v = e.currentTarget; v.pause(); }}
          />
          <div className={styles.heroAgeNote}>
              Open to UK residents aged 18 or over. Young people aged 14&ndash;17 may participate through a parent or legal guardian, who must submit the entry from their own account.
            </div>
          <div className={styles.heroInner}>
            <p className={styles.eyebrow}>Monthly Competition</p>
            <h1 className={styles.heroTitle}>Spot your Chum<br />Photo Competition</h1>
            <p className={styles.heroSub}>
              Spot a dog. Match the card. Share your ChumSpot.<br />
              Win a 3D Chum*
            </p>
            <div className={styles.ctaPills}>
              <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className={styles.ctaPrimary}>Enter on Instagram</a>
              <a href="https://www.tiktok.com" target="_blank" rel="noopener noreferrer" className={styles.ctaSecondary}>Enter on TikTok</a>
            </div>
            <p className={styles.closingDate}>
              Current monthly round closes at 23:59 on <strong>{new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString("en-GB", {day:"numeric", month:"long", year:"numeric"})}</strong>.
            </p>
          </div>
        </section>

        {/* ── What it is ───────────────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.inner}>
            <p className={styles.lead} style={{textAlign:"center"}}>
              Have you spotted a dog that matches one of the breeds in your Pedigree Chums pack?
            </p>
            <p style={{textAlign:"center"}}>
              Take a photo with the matching card, share it on Instagram or TikTok,
              and enter the <strong>Spot your Chum Photo Competition</strong>.
            </p>
            <p style={{textAlign:"center"}}>
              Every month, we&rsquo;ll choose our favourite entry as <strong>Best in Show</strong>.
              The winner receives an exclusive Limited Edition Chum Figurine, 3D printed to order
              and delivered free anywhere in the United Kingdom.
            </p>
          </div>
        </section>

        {/* ── How to enter ─────────────────────────────────────── */}
        <section className={styles.howSection}>
          <div className={styles.inner}>
            <h2 className={styles.sectionTitle}>How to enter</h2>
            <div className={styles.steps}>
              <div className={styles.step}>
                <h3 className={styles.stepTitle}>1. Spot</h3>
                <p>Find a dog that matches a breed featured in your Pedigree Chums pack.</p>
              </div>
              <div className={styles.step}>
                <h3 className={styles.stepTitle}>2. Snap</h3>
                <p>Ask the dog&rsquo;s owner or handler for permission, then take a photo showing the dog with the matching card.</p>
              </div>
              <div className={styles.step}>
                <h3 className={styles.stepTitle}>3. Post</h3>
                <p>Share your photo publicly on Instagram or TikTok.</p>
              </div>
              <div className={styles.step}>
                <h3 className={styles.stepTitle}>4. Tag</h3>
                <p>Tag @pedigree_chums + include both hashtags: #ChumSpot and #DogSpotting. Your post must stay public.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Prize ────────────────────────────────────────────── */}
        <section className={styles.prizeSection}>
          <div className={styles.inner}>
            <h2 className={styles.sectionTitle}>The prize</h2>
            <div className={styles.prizeCols}>
              <div>
                <video
                  className={styles.prizeVideo}
                  src="/lab-animation.mp4"
                  poster="/lab-animation-1stframe.jpg"
                  autoPlay
                  muted
                  playsInline
                  onEnded={(e) => { const v = e.currentTarget; v.pause(); }}
                />
              </div>
              <div>
                <p>One winner will be selected during each monthly round. The winner receives:</p>
                <ul className={styles.prizeList}>
                  <li>One exclusive 3D printed Chum Figurine*</li>
                  <li>Free delivery to one UK address</li>
                  <li>The title of Spot your Chum winner</li>
                  <li>The opportunity to be featured on the Pedigree Chums website and social channels</li>
                </ul>
                <p style={{fontSize:"0.78rem",marginTop:"16px",opacity:1}}>* The figurine design is selected by Pedigree Chums. Only certain Chum characters have currently been modelled for 3D printing. The winner cannot choose which figurine they receive.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── What + Ready: two columns ────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.inner}>
            <div className={styles.whatReadyCols}>
              <div>
                <h2 className={styles.sectionTitle}>What are we looking for?</h2>
                <p>You do not need professional equipment.</p>
                <p>We&rsquo;re looking for ChumSpots that capture the fun, charm and personality of dog spotting.</p>
                <p>Make us smile, surprise us or show us a particularly brilliant ChumSpot.</p>
              </div>
              <div style={{textAlign:"center"}}>
                <h2 className={styles.sectionTitle}>Ready to join the pack?</h2>
                <p>Spot your next Chum, share your entry and remember both hashtags:</p>
                <p className={styles.hashtags}>#ChumSpot &nbsp; #DogSpotting</p>
                <div className={styles.ctaPills}>
                  <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className={styles.ctaPrimary}>Enter on Instagram</a>
                  <a href="https://www.tiktok.com" target="_blank" rel="noopener noreferrer" className={styles.ctaSecondary}>Enter on TikTok</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Full Terms ───────────────────────────────────────── */}
        <section className={styles.termsSection}>
          <div className={styles.inner}>
            <h2 className={styles.termsSectionTitle}>Spot your Chum: <span style={{color:"#ffffff"}}>Full Competition Terms</span></h2>
            <div className={styles.termsGrid}>
              {TERMS.map((t, i) => (
                <div key={t.num} className={`${styles.termCard} ${i % 2 === 0 ? styles.termCardYellow : styles.termCardWhite}`}>
                  <span className={styles.termNum}>{t.num}</span>
                  <h3 className={styles.termTitle}>{t.title}</h3>
                  {t.body.includes(" | ") ? (
                    <ol className={styles.termList}>
                      {t.body.split(" | ").map((item, j) => (
                        <li key={j} className={styles.termBody}>{item}</li>
                      ))}
                    </ol>
                  ) : (
                    <p className={styles.termBody}>{t.body}</p>
                  )}
                </div>
              ))}
            </div>
            <p className={styles.contactNote}>
              Questions about the Spot your Chum competition can be sent to <strong><a href="mailto:hello@Pedigree-Chums.co.uk" style={{color:"#ffffff"}}>hello@Pedigree-Chums.co.uk</a></strong>.
              Please do not send bank details, card details or other unnecessary financial information.
            </p>
          </div>
        </section>

      </main>
    </>
  );
}
