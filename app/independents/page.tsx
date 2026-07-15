import type { Metadata } from "next";
import Image from "next/image";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import PopHeading from "../../components/PopHeading/PopHeading";
import CardRail from "../../components/CardRail/CardRail";
import Triangles, { type Tri } from "../../components/Parallax/Triangles";
import TradeHero from "../trade/TradeHero";
import SocialFeed from "../../components/SocialFeed/SocialFeed";
import TradeEnquiryForm from "../trade/TradeEnquiryForm";
import styles from "../trade/trade.module.css";
import TradeHowToPlay from "../trade/TradeHowToPlay";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.pedigreechums.co.uk"),
  title: "Pedigree Chums\u2122 \u2014 Independent Stockists",
  description:
    "Stock the on-the-go dog spotting game in your independent shop. Low minimum order, free CDU, made in the UK.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Pedigree Chums\u2122 \u2014 Independent Stockists",
    description:
      "Stock the on-the-go dog spotting game in your independent shop. Low minimum order, free CDU, made in the UK.",
    type: "website",
    url: "/independents",
  },
};

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

export default function IndependentsPage() {
  return (
    <>
      <Nav tradeLinks />

      <main>
        <TradeHero />

        <section className={`${styles.pitch} ${styles.pitchFirst}`}>
          <div className={styles.pitchGlow} aria-hidden="true">
            <span className={`${styles.glowCircle} ${styles.glowTop}`} />
            <span className={`${styles.glowCircle} ${styles.glowBottom}`} />
          </div>
          <div className={styles.pitchInner}>
            <Triangles items={pitchTris} z={0} />
            <div className={styles.pitchSplit}>
              <div className={styles.pitchCopy}>
                <p className={styles.eyebrow}>Independent stockists — enquiries open</p>
                <h1 className="display">
                  Stock the on-the-go <span className="display-yellow">dog spotting</span> game
                </h1>
                <p className={styles.heroSub}>
                  A pocket-size, made-in-UK card game for the dog-mad nation. Low
                  minimum order, free counter display unit with every order, first
                  production run shipping {DISPATCH_WINDOW}.
                </p>
                <div className={styles.heroCtas}>
                  <a href="#enquire" className={`${styles.btn} ${styles.btnPrimary}`}>
                    Become a stockist
                  </a>
                  <a href="#pricing" className={`${styles.btn} ${styles.btnGhost}`}>
                    See pricing
                  </a>
                </div>
                <ul className={styles.bullets} aria-label="At a glance">
                  <li className={styles.bullet}>Made in the UK</li>
                  <li className={styles.bullet}>FSC recycled card</li>
                  <li className={styles.bullet}>Start from just 80 units</li>
                  <li className={styles.bullet}>Free CDU with every order</li>
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

        <section className={styles.imageBand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/actual-cards.jpg"
            alt="A selection of the Pedigree Chums breed cards"
            className={styles.imageBandImg}
          />
        </section>

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

        <section className={styles.comicSection}>
          <div className={styles.center}>
            <PopHeading className="display">How it plays</PopHeading>
          </div>
          <div className={styles.comicSteps}>
            {/* Step 1 -- video */}
            <video src="/step1-video-animation.mp4" autoPlay muted playsInline className={styles.comicStep} aria-label="How to play, step 1" />
            {/* Step 2 -- video */}
            <video src="/step2-video-animation.mp4" autoPlay muted playsInline className={styles.comicStep} aria-label="How to play, step 2" />
            {/* Step 3 -- video */}
            <video src="/step3-video-animationv3.mp4" autoPlay muted playsInline className={styles.comicStep} aria-label="How to play, step 3" />
            {/* Step 4 -- image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/step4-redue.jpg" alt="How to play, step 4" className={styles.comicStep} />
            {/* Step 5 -- image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/step5-redue.jpg" alt="How to play, step 5" className={styles.comicStep} />
            {/* Step 6 -- video */}
            <video src="/step6-video-animation.mp4" autoPlay muted playsInline className={styles.comicStep} aria-label="How to play, step 6" />
          </div>
        </section>

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
                <h3 className={styles.tileTitle}>~55% retail margin</h3>
                <p className={styles.tileBody}>£4.45 wholesale against a £9.99 suggested RRP — a strong margin on a very small slice of counter or shelf space.</p>
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
                  Counter display unit <span className="display-yellow">included</span>
                </h3>
                <ul className={styles.bullets}>
                  <li className={styles.bullet}>A fully branded counter display unit (CDU) included free with every order — no minimum threshold.</li>
                  <li className={styles.bullet}>Holds the packs upright at the till, turning a small footprint into an eye-catching impulse buy.</li>
                  <li className={styles.bullet}>Arrives ready to fill and place — no assembly required.</li>
                  <li className={styles.bullet}>Further point-of-sale material available on request.</li>
                </ul>
              </div>
              <div className={styles.posDiagram}>
                <Image src="/CDU-POS.jpg" alt="Counter display unit" width={520} height={420} style={{ width: "100%", height: "auto" }} />
              </div>
            </div>
          </div>
        </section>

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
                  <th scope="row">Pack size</th>
                  <td>9.3 cm tall &times; 6.7 cm wide &times; 2.1 cm deep</td>
                </tr>
                <tr>
                  <th scope="row">Barcode</th>
                  <td>EAN-13 (registering with GS1)</td>
                </tr>
                <tr>
                  <th scope="row">Case quantity</th>
                  <td>80 per box</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.pitch} id="pricing">
          <div className={styles.pitchGlow} aria-hidden="true">
            <span className={`${styles.glowCircle} ${styles.glowTop}`} />
            <span className={`${styles.glowCircle} ${styles.glowBottom}`} />
          </div>
          <div className={styles.pitchInner}>
            <PopHeading className={`display ${styles.bigTitle} ${styles.titleCenter}`}>Pricing &amp; terms</PopHeading>
            <div className={styles.priceHeadline}>
              <div className={styles.priceFig}>
                <span className={styles.priceVal}>£4.45</span>
                <span className={styles.priceLabel}>wholesale / unit</span>
              </div>
              <div className={styles.priceFig}>
                <span className={styles.priceVal}>£9.99</span>
                <span className={styles.priceLabel}>suggested RRP</span>
              </div>
              <div className={styles.priceFig}>
                <span className={styles.priceVal}>~55%</span>
                <span className={styles.priceLabel}>retailer margin</span>
              </div>
            </div>
            <div className={styles.specCard}>
              <table className={styles.dataTable}>
                <tbody>
                  <tr>
                    <th scope="row">Starter order</th>
                    <td>80 units at £4.50 per unit (£360.00)</td>
                  </tr>
                  <tr>
                    <th scope="row">Standard minimum</th>
                    <td>210 units at £4.45 per unit (£934.50)</td>
                  </tr>
                  <tr>
                    <th scope="row">CDU</th>
                    <td>Free counter display unit included with every order</td>
                  </tr>
                  <tr>
                    <th scope="row">Terms</th>
                    <td>Pro-forma for first orders · UK dispatch · all prices ex VAT · VAT invoices issued on all orders</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className={styles.priceCtaRow}>
              <a href="#enquire" className={`${styles.btn} ${styles.btnPrimary}`}>
                Request a sample pack
              </a>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <PopHeading className={`display ${styles.bigTitle} ${styles.titleCenter}`}>
            See it <span className="display-yellow">in action</span>
          </PopHeading>
          <p className={styles.feedSub}>
            Real games, real dogs, real chaos — straight from our feed.
          </p>
          <SocialFeed />
        </section>

        <section className={styles.section}>
          <div className={styles.finalGrid}>
            <div className={`${styles.gridCard} ${styles.cardGradient}`}>
              <h3 className="display">Made responsibly</h3>
              <ul className={styles.bullets}>
                <li className={styles.bullet}>Printed in the UK — low carbon footprint</li>
                <li className={styles.bullet}>FSC-certified recycled card stock</li>
                <li className={styles.bullet}>Fully biodegradable, no plastic coatings</li>
                <li className={styles.bullet}>Recyclable packaging</li>
              </ul>
            </div>

            <div className={`${styles.gridCard} ${styles.cardYellow}`}>
              <h3 className="display">Start small. Grow fast.</h3>
              <p>
                Begin with 80 units — one full case — at £4.50 per unit (£360.00 total).
                Your CDU arrives with the order, ready to place by the till.
              </p>
              <p>
                When you&apos;re ready to reorder, the standard rate drops to
                <strong> £4.45 per unit</strong> from 210 units. Sample packs are
                available now so you can see and play it before you commit.
              </p>
            </div>

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

            <div className={`${styles.gridCard} ${styles.cardGradient}`} id="enquire">
              <h3 className="display">Become a stockist</h3>
              <p>
                Tell us a little about your shop and we&apos;ll send a sample pack
                and full pricing details.
              </p>
              <TradeEnquiryForm />
            </div>
          </div>
        </section>
      </main>

      <Footer tradeLinks />
    </>
  );
}
