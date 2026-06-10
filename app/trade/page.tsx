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
            <ul className={styles.trustStrip} aria-label="At a glance">
              <li className={styles.pill}>Made in the UK</li>
              <li className={styles.pill}>FSC recycled card</li>
              <li className={styles.pill}>Low MOQ + 48-unit trial</li>
              <li className={styles.pill}>Free POS on 1,000+</li>
              <li className={styles.pill}>Samples available now</li>
            </ul>
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
        <section className={`${styles.section} ${styles.relative}`}>
          <Triangles items={whyTris} z={0} />
          <PopHeading className="display">Why it sells</PopHeading>
          <div className={styles.grid}>
            <div className={styles.benefitCard}>
              <h3 className={styles.benefitTitle}>Impulse price point</h3>
              <p>Sits by the till at an under-a-tenner RRP — an easy add-on buy.</p>
            </div>
            <div className={styles.benefitCard}>
              <h3 className={styles.benefitTitle}>~60% retail margin</h3>
              <p>£4.00 wholesale to a £9.99 suggested RRP. Healthy on every pack.</p>
            </div>
            <div className={styles.benefitCard}>
              <h3 className={styles.benefitTitle}>Multi-market appeal</h3>
              <p>Gift shops, attractions, garden centres, pet shops, tourist spots.</p>
            </div>
            <div className={styles.benefitCard}>
              <h3 className={styles.benefitTitle}>Low return risk</h3>
              <p>No setup, endlessly replayable, nothing to go wrong on the shelf.</p>
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
          <PopHeading className="display">The product</PopHeading>
          <div className={styles.specCard}>
            <table className={styles.specTable}>
              <tbody>
                <tr>
                  <th scope="row">Cards</th>
                  <td>54 illustrated breeds &amp; crossbreeds (40 breeds + 12 designer crossbreeds)</td>
                </tr>
                <tr>
                  <th scope="row">Format</th>
                  <td>Pocket-size deck, durable card</td>
                </tr>
                <tr>
                  <th scope="row">Materials</th>
                  <td>FSC-certified recycled stock, printed in the UK, fully biodegradable</td>
                </tr>
                <tr>
                  <th scope="row">Barcode</th>
                  <td>EAN-13 (registering with GS1)</td>
                </tr>
                <tr>
                  <th scope="row">Pack dimensions</th>
                  <td>Available on request</td>
                </tr>
                <tr>
                  <th scope="row">Case quantity</th>
                  <td>Available on request</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* PRICING — pitch band */}
        <section className={styles.pitch} id="pricing">
          <div className={styles.pitchGlow} aria-hidden="true">
            <span className={`${styles.glowCircle} ${styles.glowTop}`} />
            <span className={`${styles.glowCircle} ${styles.glowBottom}`} />
          </div>
          <div className={styles.pitchInner}>
            <PopHeading className="display">Trade pricing &amp; terms</PopHeading>
            <div className={styles.priceCard}>
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
              <ul className="points">
                <li className="point">Minimum order: 1,000 units</li>
                <li className="point">Volume discounts on 2,000 / 5,000 / 10,000 — see the full price list</li>
                <li className="point">Free standing POS display unit on orders of 1,000+</li>
                <li className="point">48-unit trial available to test sell-through first</li>
                <li className="point">Pro-forma for first orders · UK dispatch · no VAT currently applicable</li>
              </ul>
              <a href="#enquire" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnInline}`}>
                Request the full price list
              </a>
            </div>
          </div>
        </section>

        {/* SUSTAINABILITY */}
        <section className={`${styles.section} ${styles.relative}`}>
          <Triangles items={sustainTris} z={0} />
          <PopHeading className="display">Made responsibly</PopHeading>
          <ul className="points">
            <li className="point">Printed in the UK — low carbon footprint</li>
            <li className="point">FSC-certified recycled card stock</li>
            <li className="point">Fully biodegradable, no plastic coatings</li>
            <li className="point">Recyclable packaging</li>
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
