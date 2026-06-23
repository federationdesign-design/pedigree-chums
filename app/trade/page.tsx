import type { Metadata } from "next";
import Image from "next/image";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import PopHeading from "../../components/PopHeading/PopHeading";
import CardRail from "../../components/CardRail/CardRail";
import Triangles, { type Tri } from "../../components/Parallax/Triangles";
import TradeHero from "./TradeHero";
import SocialFeed from "../../components/SocialFeed/SocialFeed";
import TradeEnquiryForm from "./TradeEnquiryForm";
import styles from "./trade.module.css";

// Keep the trade page out of search and fully separate from the consumer site.
export const metadata: Metadata = {
  metadataBase: new URL("https://www.pedigreechums.co.uk"),
  title: "Pedigree Chums — Trade & Wholesale",
  description:
    "Wholesale the on-the-go dog spotting game. 54 uniquely illustrated cards, made in the UK. Founding stockist enquiries now open.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Pedigree Chums — Trade & Wholesale",
    description:
      "Wholesale the on-the-go dog spotting game. 54 uniquely illustrated cards, made in the UK. Founding stockist enquiries now open.",
    type: "website",
    url: "/trade",
  },
};

// Dispatch window shown in the hero. Update once known (e.g. "Autumn 2026").
const DISPATCH_WINDOW = "your launch window";

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

export default function TradePage() {
  return (
    <>
      {/* Shared site header — identical to the homepage (scroll-reveal logo,
          transparent bar, no button). */}
      <Nav />

      <main>
        {/* HERO — full-bleed video, same treatment as B2C */}
        <TradeHero />

        {/* PITCH BAND 1 — value intro on the dark-blue diagonal gradient */}
        <section className={`${styles.pitch} ${styles.pitchFirst}`}>
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
                  <li className={styles.bullet}>Low MOQ + 250-unit starter order</li>
                  <li className={styles.bullet}>Free POS on 1,000+</li>
                </ul>
              </div>
              <div className={styles.pitchMedia}>
                <video
                  className={styles.pitchVideo}
                  src="/spaniel.mp4"
                  autoPlay
                  muted
                  playsInline
                  aria-label="A spaniel being spotted on a dog walk"
                />
              </div>
            </div>
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

        {/* MEET THE PACK — the real horizontal card rail */}
        <section className={styles.railSection}>
          <div className={styles.railTitle}>
            <PopHeading className={`display ${styles.bigTitle}`}>
              <span className="display-yellow">Meet the</span> pack
            </PopHeading>
          </div>
          <div className={styles.railSub}>
            <p className={styles.bodyCenter}>
              54 uniquely illustrated cards — 40 of the UK&apos;s most popular
              breeds plus 12 designer crossbreeds.
            </p>
          </div>
          <CardRail />
        </section>

        {/* HOW IT PLAYS — the instructional comic strip, directly below the rail */}
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

        {/* WHY IT SELLS — image tiles + POS block inside a pitch panel (deck style) */}
        <section className={styles.pitch}>
          <div className={styles.pitchGlow} aria-hidden="true">
            <span className={`${styles.glowCircle} ${styles.glowTop}`} />
            <span className={`${styles.glowCircle} ${styles.glowBottom}`} />
          </div>
          <div className={styles.pitchInner}>
            <Triangles items={whyTris} z={0} />
            <PopHeading className={`display ${styles.titleCenter}`}>
              Why it <span className="display-yellow">sells</span>
            </PopHeading>
            <div className={styles.tileRow}>
              <div className={styles.tile}>
                <div className={styles.tileImg}>
                  <Image src="/trade-img1.png" alt="An impulse buy at the till" fill sizes="(max-width: 980px) 45vw, 240px" style={{ objectFit: "contain" }} />
                </div>
                <h3 className={styles.tileTitle}>Impulse price point</h3>
                <p className={styles.tileBody}>Priced to sit by the till at an under-a-tenner RRP — the kind of low-commitment, grab-it-on-the-way-out buy that drives add-on sales without a customer thinking twice.</p>
              </div>
              <div className={styles.tile}>
                <div className={styles.tileImg}>
                  <Image src="/trade-img2.png" alt="Healthy retail margin" fill sizes="(max-width: 980px) 45vw, 240px" style={{ objectFit: "contain" }} />
                </div>
                <h3 className={styles.tileTitle}>~60% retail margin</h3>
                <p className={styles.tileBody}>£4.00 wholesale against a £9.99 suggested RRP leaves a healthy margin on every single pack — strong returns from a very small slice of shelf or counter space.</p>
              </div>
              <div className={styles.tile}>
                <div className={styles.tileImg}>
                  <Image src="/trade-img3.png" alt="Multi-market appeal" fill sizes="(max-width: 980px) 45vw, 240px" style={{ objectFit: "contain" }} />
                </div>
                <h3 className={styles.tileTitle}>Multi-market appeal</h3>
                <p className={styles.tileBody}>It isn&apos;t tied to one kind of shop. Gift shops, museums and attractions, garden centres, pet shops, farm shops and tourist spots all have the dog-loving, impulse-buying customers it&apos;s made for.</p>
              </div>
              <div className={styles.tile}>
                <div className={styles.tileImg}>
                  <Image src="/trade-img4.png" alt="Low return risk" fill sizes="(max-width: 980px) 45vw, 240px" style={{ objectFit: "contain" }} />
                </div>
                <h3 className={styles.tileTitle}>Low return risk</h3>
                <p className={styles.tileBody}>No batteries, no setup, nothing to break or go out of date. It&apos;s endlessly replayable and sits happily on the shelf, so there&apos;s very little that can go wrong once you&apos;ve stocked it.</p>
              </div>
            </div>

            <div className={styles.posBlock}>
              <div className={styles.posCopy}>
                <h3 className={`display ${styles.titleCenter}`}>
                  Display units <span className="display-yellow">available</span>
                </h3>
                <ul className={styles.bullets}>
                  <li className={styles.bullet}>A free standing POS display unit included with every order of 1,000 units or more.</li>
                  <li className={styles.bullet}>Holds the packs upright and fully branded, turning a small footprint into an eye-catching feature by the till.</li>
                  <li className={styles.bullet}>Further point-of-sale material — shelf-talkers, posters and more — available on larger orders.</li>
                  <li className={styles.bullet}>Custom or co-branded display options can be discussed for bigger commitments.</li>
                </ul>
              </div>
              <div className={styles.posDiagram}>
                <Image src="/stand-diagram.png" alt="Free standing point-of-sale display unit" width={520} height={420} style={{ width: "100%", height: "auto", filter: "invert(1)", mixBlendMode: "screen" }} />
              </div>
            </div>
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
                  <td>54 uniquely illustrated cards (40 breeds + 12 designer crossbreeds)</td>
                </tr>
                <tr>
                  <th scope="row">Card size</th>
                  <td>6.4 &times; 8.9 cm, 0.15 mm thick</td>
                </tr>
                <tr>
                  <th scope="row">Material</th>
                  <td>FSC-certified recycled cardboard, printed in the UK, fully biodegradable</td>
                </tr>
                <tr>
                  <th scope="row">Pack size &amp; weight</th>
                  <td>6.4 cm tall &times; 8.9 cm wide, 0.9 mm thick</td>
                </tr>
                <tr>
                  <th scope="row">Barcode</th>
                  <td>EAN-13 (registering with GS1)</td>
                </tr>
                <tr>
                  <th scope="row">Case quantity</th>
                  <td>256 per box</td>
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
                    <td>250-unit starter at £5.00/unit; £250 credited if you order 1,000+ within 60 days</td>
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

        {/* SOCIAL PROOF — live TikTok feed */}
        <section className={styles.section}>
          <PopHeading className={`display ${styles.bigTitle} ${styles.titleCenter}`}>
            See it <span className="display-yellow">in action</span>
          </PopHeading>
          <p className={styles.feedSub}>
            Real games, real dogs, real chaos — straight from our feed.
          </p>
          <SocialFeed />
        </section>

        {/* FINAL 2x2 GRID — four cards, each a different fill */}
        <section className={styles.section}>
          <div className={styles.finalGrid}>
            {/* Made responsibly — blue gradient */}
            <div className={`${styles.gridCard} ${styles.cardGradient}`}>
              <h3 className="display">Made responsibly</h3>
              <ul className={styles.bullets}>
                <li className={styles.bullet}>Printed in the UK — low carbon footprint</li>
                <li className={styles.bullet}>FSC-certified recycled card stock</li>
                <li className={styles.bullet}>Fully biodegradable, no plastic coatings</li>
                <li className={styles.bullet}>Recyclable packaging</li>
              </ul>
            </div>

            {/* Trial — yellow */}
            <div className={`${styles.gridCard} ${styles.cardYellow}`}>
              <h3 className="display">Not ready for 1,000? Try 250.</h3>
              <p>
                A 250-unit starter order lets you test it on your shelf before
                committing to a full run — bought upfront at £5.00 per unit
                (250 units = £1,250).
              </p>
              <p>
                Go on to place a 1,000+ order within 60 days and we credit
                <strong> £250 against it</strong> — bringing your starter units
                down to the full £4.00 wholesale price. Sample packs are available
                now to see and play before you decide.
              </p>
            </div>

            {/* Growing range — white */}
            <div className={`${styles.gridCard} ${styles.cardWhite}`}>
              <h3 className="display">A growing range</h3>
              <p>
                Soft toys, bandanas, keyrings, greeting cards and more are in the
                pipeline — a brand to grow with, not a one-off line.
              </p>
              <video
                className={styles.rangeVideo}
                src="/expanded-range.mp4"
                autoPlay
                muted
                playsInline
                aria-label="The growing Pedigree Chums range"
              />
            </div>

            {/* Become a founding stockist — blue gradient, with the form */}
            <div className={`${styles.gridCard} ${styles.cardGradient}`} id="enquire">
              <h3 className="display">Become a founding stockist</h3>
              <p>
                Tell us a little about your shop and we&apos;ll send the full trade
                price list and next steps.
              </p>
              <TradeEnquiryForm />
            </div>
          </div>
        </section>
      </main>

      {/* Shared site footer — identical to the homepage. */}
      <Footer toySafety />
    </>
  );
}
