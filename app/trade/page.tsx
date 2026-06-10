import type { Metadata } from "next";
import Image from "next/image";
import PopHeading from "../../components/PopHeading/PopHeading";
import CardRail from "../../components/CardRail/CardRail";
import Triangles, { type Tri } from "../../components/Parallax/Triangles";
import TradeHero from "./TradeHero";
import TradeEnquiryForm from "./TradeEnquiryForm";
import styles from "./trade.module.css";

// Keep the trade page out of search and fully separate from the consumer site.
export const metadata: Metadata = {
  title: "Pedigree Chums — Trade & Wholesale",
  description:
    "Wholesale the on-the-go dog spotting game. 54 hand-illustrated breed cards, made in the UK. Founding stockist enquiries now open.",
  robots: { index: false, follow: false },
};

// Company / legal line for the footer. Update once the dedicated Pedigree Chums
// company is formed (currently the brand trades under another entity).
const COMPANY_LEGAL = "Pedigree Chums";
const CONTACT_EMAIL = "hello@pedigreechums.co.uk";
const CONTACT_PHONE = "+44 (0) 7507 235 380";
const DISPATCH_WINDOW = "your launch window"; // e.g. "Autumn 2026" once known

const whyTris: Tri[] = [
  { size: 56, top: "12%", left: "7%", speed: 0.16, spin: 0.22 },
  { size: 40, top: "24%", right: "10%", speed: 0.26, spin: -0.3 },
  { size: 70, bottom: "14%", left: "44%", speed: 0.16, spin: 0.18 },
];
const pitchTris: Tri[] = [
  { size: 64, top: "16%", left: "12%", speed: 0.18, spin: 0.24 },
  { size: 42, bottom: "22%", right: "14%", speed: 0.28, spin: -0.34 },
  { size: 80, bottom: "12%", left: "40%", speed: 0.14, spin: 0.16 },
];
const sustainTris: Tri[] = [
  { size: 52, top: "18%", right: "8%", speed: 0.2, spin: -0.26 },
  { size: 68, bottom: "16%", left: "10%", speed: 0.15, spin: 0.2 },
];

export default function TradePage() {
  return (
    <>
      {/* Trade-only header: logo only, non-linking, no menu, no doorway back
          into the consumer site. */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Image
            src="/dogbingo.svg"
            alt="Pedigree Chums"
            width={150}
            height={64}
            priority
            className={styles.logo}
          />
          <span className={styles.headerTag}>Trade &amp; Wholesale</span>
        </div>
      </header>

      <main>
        {/* HERO — full-bleed video, same treatment as B2C */}
        <TradeHero />

        {/* PITCH BAND 1 — value intro on the dark-blue diagonal gradient */}
        <section className={styles.pitch}>
          <div className={styles.pitchGlow} aria-hidden="true">
            <span className={`${styles.glowCircle} ${styles.glowTop}`} />
            <span className={`${styles.glowCircle} ${styles.glowBottom}`} />
          </div>
          <div className={styles.pitchInner}>
            <Triangles items={pitchTris} z={0} />
            <div className={styles.pitchSplit}>
              <div className={styles.pitchCopy}>
                <p className={styles.eyebrow}>Founding stockists — enquiries open</p>
                <h1 className="display">
                  Stock the on-the-go <span className="display-yellow">dog spotting</span> game
                </h1>
                <p className={styles.heroSub}>
                  A pocket-size, made-in-UK card game for the dog-mad nation. Played
                  and proven; first production run shipping {DISPATCH_WINDOW}.
                </p>
                <div className={styles.heroCtas}>
                  <a href="#enquire" className={`${styles.btn} ${styles.btnPrimary}`}>
                    Become a founding stockist
                  </a>
                  <a href="#pricing" className={`${styles.btn} ${styles.btnGhost}`}>
                    See trade pricing
                  </a>
                </div>
                <ul className={styles.bullets} aria-label="At a glance">
                  <li className={styles.bullet}>Made in the UK</li>
                  <li className={styles.bullet}>FSC recycled card</li>
                  <li className={styles.bullet}>Low MOQ + 48-unit trial</li>
                  <li className={styles.bullet}>Free POS on 1,000+</li>
                </ul>
              </div>
              <div className={styles.pitchMedia}>
                <video
                  className={styles.pitchVideo}
                  src="/spaniel.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  aria-label="A spaniel being spotted on a dog walk"
                />
              </div>
            </div>
          </div>
        </section>

        {/* MEET THE PACK — the real horizontal card rail */}
        <section className={styles.railSection}>
          <div className={styles.center}>
            <PopHeading className="display">Meet the pack</PopHeading>
            <p className={styles.bodyCenter}>
              54 hand-illustrated breeds and crossbreeds — 40 of the UK&apos;s most
              popular dogs plus 12 designer crossbreeds.
            </p>
          </div>
          <CardRail />
        </section>

        {/* WHY IT SELLS */}
        {/* WHY IT SELLS — image tiles + POS block inside a pitch panel (deck style) */}
        <section className={styles.pitch}>
          <div className={styles.pitchGlow} aria-hidden="true">
            <span className={`${styles.glowCircle} ${styles.glowTop}`} />
            <span className={`${styles.glowCircle} ${styles.glowBottom}`} />
          </div>
          <div className={styles.pitchInner}>
            <Triangles items={whyTris} z={0} />
            <PopHeading className="display">
              Why it <span className="display-yellow">sells</span>
            </PopHeading>
            <div className={styles.tileRow}>
              <div className={styles.tile}>
                <div className={styles.tileImg}>
                  <Image src="/trade-img1.png" alt="An impulse buy at the till" fill sizes="(max-width: 980px) 45vw, 240px" style={{ objectFit: "cover" }} />
                </div>
                <h3 className={styles.tileTitle}>Impulse price point</h3>
                <p className={styles.tileBody}>Sits by the till at an under-a-tenner RRP — an easy add-on buy.</p>
              </div>
              <div className={styles.tile}>
                <div className={styles.tileImg}>
                  <Image src="/trade-img2.png" alt="Healthy retail margin" fill sizes="(max-width: 980px) 45vw, 240px" style={{ objectFit: "cover" }} />
                </div>
                <h3 className={styles.tileTitle}>~60% retail margin</h3>
                <p className={styles.tileBody}>£4.00 wholesale to a £9.99 suggested RRP. Healthy on every pack.</p>
              </div>
              <div className={styles.tile}>
                <div className={styles.tileImg}>
                  <Image src="/trade-img3.png" alt="Multi-market appeal" fill sizes="(max-width: 980px) 45vw, 240px" style={{ objectFit: "cover" }} />
                </div>
                <h3 className={styles.tileTitle}>Multi-market appeal</h3>
                <p className={styles.tileBody}>Gift shops, attractions, garden centres, pet shops, tourist spots.</p>
              </div>
              <div className={styles.tile}>
                <div className={styles.tileImg}>
                  <Image src="/trade-img4.png" alt="Low return risk" fill sizes="(max-width: 980px) 45vw, 240px" style={{ objectFit: "cover" }} />
                </div>
                <h3 className={styles.tileTitle}>Low return risk</h3>
                <p className={styles.tileBody}>No setup, endlessly replayable, nothing to go wrong on the shelf.</p>
              </div>
            </div>

            <div className={styles.posBlock}>
              <div className={styles.posCopy}>
                <h3 className="display">
                  Display units <span className="display-yellow">available</span>
                </h3>
                <p className={styles.body}>
                  A free standing POS display unit is included with orders of 1,000+,
                  with further point-of-sale material available on larger orders.
                </p>
              </div>
              <div className={styles.posDiagram}>
                <Image src="/stand-diagram.png" alt="Free standing point-of-sale display unit" width={520} height={420} style={{ width: "100%", height: "auto" }} />
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT PLAYS — the instructional comic strip */}
        <section className={styles.comicSection}>
          <div className={styles.center}>
            <PopHeading className="display">How it plays</PopHeading>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/stacked-comicstrip.png"
            alt="How to play, step by step"
            className={styles.comicDesktop}
          />
          <div className={styles.comicSteps}>
            {["/step1.png", "/step2.png", "/step3.png", "/step4.png", "/step5.png"].map(
              (src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt={`How to play, step ${i + 1}`} className={styles.comicStep} />
              )
            )}
          </div>
        </section>

        {/* PRODUCT SPEC */}
        <section className={styles.section} id="product">
          <PopHeading className={`display ${styles.bigTitle} ${styles.titleCenter}`}>The product</PopHeading>
          <div className={styles.specCard}>
            <table className={styles.dataTable}>
              <tbody>
                <tr>
                  <th scope="row">Cards</th>
                  <td>54 illustrated breeds &amp; crossbreeds (40 breeds + 12 designer crossbreeds)</td>
                </tr>
                <tr>
                  <th scope="row">Card size</th>
                  <td>6.4 &times; 8.9 cm, 0.9 mm thick</td>
                </tr>
                <tr>
                  <th scope="row">Material</th>
                  <td>FSC-certified recycled cardboard, printed in the UK, fully biodegradable</td>
                </tr>
                <tr>
                  <th scope="row">Pack size &amp; weight</th>
                  <td>Available on request</td>
                </tr>
                <tr>
                  <th scope="row">Barcode</th>
                  <td>EAN-13 (registering with GS1)</td>
                </tr>
                <tr>
                  <th scope="row">Case quantity</th>
                  <td>Available on request</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* CARD ART — full-width image band */}
        <section className={styles.imageBand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/actual-cards.jpg"
            alt="A selection of the Pedigree Chums breed cards"
            className={styles.imageBandImg}
          />
        </section>

        {/* PRICING — pitch band */}
        <section className={styles.pitch} id="pricing">
          <div className={styles.pitchGlow} aria-hidden="true">
            <span className={`${styles.glowCircle} ${styles.glowTop}`} />
            <span className={`${styles.glowCircle} ${styles.glowBottom}`} />
          </div>
          <div className={styles.pitchInner}>
            <PopHeading className={`display ${styles.bigTitle} ${styles.titleCenter}`}>Trade pricing &amp; terms</PopHeading>
            <div className={styles.priceHeadline}>
              <div className={styles.priceFig}>
                <span className={styles.priceVal}>£4.00</span>
                <span className={styles.priceLabel}>wholesale / unit</span>
              </div>
              <div className={styles.priceFig}>
                <span className={styles.priceVal}>£9.99</span>
                <span className={styles.priceLabel}>suggested RRP</span>
              </div>
              <div className={styles.priceFig}>
                <span className={styles.priceVal}>~60%</span>
                <span className={styles.priceLabel}>retailer margin</span>
              </div>
            </div>
            <div className={styles.specCard}>
              <table className={styles.dataTable}>
                <tbody>
                  <tr>
                    <th scope="row">Minimum order</th>
                    <td>1,000 units</td>
                  </tr>
                  <tr>
                    <th scope="row">Volume discounts</th>
                    <td>2,000 / 5,000 / 10,000 — full price list on request</td>
                  </tr>
                  <tr>
                    <th scope="row">POS display</th>
                    <td>Free standing unit included on orders of 1,000+</td>
                  </tr>
                  <tr>
                    <th scope="row">Trial</th>
                    <td>48-unit trial available to test sell-through first</td>
                  </tr>
                  <tr>
                    <th scope="row">Terms</th>
                    <td>Pro-forma for first orders · UK dispatch · no VAT currently applicable</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className={styles.priceCtaRow}>
              <a href="#enquire" className={`${styles.btn} ${styles.btnPrimary}`}>
                Request the full price list
              </a>
            </div>
          </div>
        </section>

        {/* SUSTAINABILITY */}
        <section className={`${styles.section} ${styles.relative}`}>
          <Triangles items={sustainTris} z={0} />
          <PopHeading className="display">Made responsibly</PopHeading>
          <ul className={styles.bullets}>
            <li className={styles.bullet}>Printed in the UK — low carbon footprint</li>
            <li className={styles.bullet}>FSC-certified recycled card stock</li>
            <li className={styles.bullet}>Fully biodegradable, no plastic coatings</li>
            <li className={styles.bullet}>Recyclable packaging</li>
          </ul>
          <p className={styles.bodyMuted}>
            A genuine fit for eco-conscious retailers, museum and attraction shops,
            and ethical gift ranges.
          </p>
        </section>

        {/* TRIAL CALLOUT */}
        <section className={styles.section}>
          <div className={styles.callout}>
            <h3 className="display">Not ready for 1,000? Try 48.</h3>
            <p>
              A 48-unit trial pack lets you test it on your shelf before committing
              to a full run, with a quick turnaround. Sample packs available now to
              see and play before you decide.
            </p>
          </div>
        </section>

        {/* GROWING RANGE */}
        <section className={styles.section}>
          <PopHeading className="display">A growing range</PopHeading>
          <p className={styles.body}>
            Soft toys, bandanas, keyrings, greeting cards and more are in the
            pipeline — a brand to grow with, not a one-off line.
          </p>
        </section>

        {/* ENQUIRE — pitch band with the form */}
        <section className={styles.pitch} id="enquire">
          <div className={styles.pitchGlow} aria-hidden="true">
            <span className={`${styles.glowCircle} ${styles.glowTop}`} />
            <span className={`${styles.glowCircle} ${styles.glowBottom}`} />
          </div>
          <div className={styles.pitchInner}>
            <PopHeading className="display">Become a founding stockist</PopHeading>
            <p className={styles.body}>
              Tell us a little about your shop and we&apos;ll send the full trade
              price list and next steps.
            </p>
            <TradeEnquiryForm />
          </div>
        </section>
      </main>

      {/* Minimal trade footer: contact + legal only, no consumer links. */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p className={styles.footerContact}>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <span aria-hidden="true"> · </span>
            <a href={`tel:${CONTACT_PHONE.replace(/[^+\d]/g, "")}`}>{CONTACT_PHONE}</a>
          </p>
          <p className={styles.footerLegal}>
            {COMPANY_LEGAL} — The Dog Bingo Game. Registered in England and Wales.
            &copy; {new Date().getFullYear()}.
          </p>
        </div>
      </footer>
    </>
  );
}
