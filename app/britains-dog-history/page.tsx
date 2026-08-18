import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import PopHeading from "../../components/PopHeading/PopHeading";
import Triangles, { type Tri } from "../../components/Parallax/Triangles";
import ParallaxShape from "../../components/Parallax/ParallaxShape";
import Announce from "../../components/Announce/Announce";
import BreedStrip from "./BreedStrip";
import HistoryCarousel from "../britains-dog-history-2/HistoryCarousel";
import styles from "./history.module.css";
import HistorySection from "../../components/HistorySection/HistorySection";
import { SECTIONS } from "../../data/historySections";

const pageTriangles: Tri[] = [
  { size: 34, top: "5%", left: "4%", speed: 0.16, spin: 0.22 },
  { size: 28, top: "13%", right: "5%", speed: 0.24, spin: -0.3 },
  { size: 44, top: "25%", left: "3%", speed: 0.14, spin: 0.18 },
  { size: 30, top: "34%", right: "4%", speed: 0.26, spin: -0.34 },
  { size: 38, top: "45%", left: "5%", speed: 0.18, spin: 0.2 },
  { size: 26, top: "54%", right: "3%", speed: 0.3, spin: -0.4 },
  { size: 42, top: "65%", left: "4%", speed: 0.15, spin: 0.16 },
  { size: 30, top: "73%", right: "5%", speed: 0.22, spin: -0.28 },
  { size: 36, top: "85%", left: "3%", speed: 0.17, spin: 0.2 },
  { size: 28, top: "92%", right: "4%", speed: 0.25, spin: -0.32 },
];

const heroTriangles: Tri[] = [
  { size: 70, top: "14%", left: "16%", speed: 0.12, spin: 0.2 },
  { size: 44, top: "30%", right: "22%", speed: 0.22, spin: -0.32 },
  { size: 92, bottom: "16%", left: "42%", speed: 0.16, spin: 0.14 },
];

const OG_TITLE = "Britain's Dog History | Pedigree Chums\u2122";
const OG_DESC =
  "How Britain became a nation of dog lovers: from working dogs and war mascots to Greyfriars Bobby, Crufts and the Victorian pet boom, right up to today's designer crossbreeds.";

export const metadata: Metadata = {
  title: "Britain's Dog History",
  description: OG_DESC,
  // Its own share card. Without this the page inherited the site-wide /og.png
  // from the root layout, so anyone posting the game got the generic homepage
  // image. Both blocks are set: openGraph covers Facebook, LinkedIn, WhatsApp
  // and Slack, twitter is read by X and a few others, and neither falls back to
  // the other.
  openGraph: {
    title: OG_TITLE,
    description: OG_DESC,
    type: "website",
    url: "/britains-dog-history",
    images: [
      {
        url: "/minipit-OG.jpg",
        width: 1200,
        height: 630,
        alt: "Britain's Dog History, a Pedigree Chums\u2122 game",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: OG_DESC,
    images: ["/minipit-OG.jpg"],
  },
};


export default function HistoryPage() {
  return (
    <>
      <Nav />
      <main className={styles.page}>
        {/* Desktop layout (v1): floating glow panels and breed strips. Hidden
            on phones, where the carousel below takes over. Only two viewports
            meet at the 721px seam, so nothing renders between them. */}
        <div className={styles.desktopView}>
        <section className={styles.hero} aria-label="Britain's dog history">
          <div className={styles.heroImg} aria-hidden="true" />
          <div className={styles.heroTint} aria-hidden="true" />
          <Announce />
          <ParallaxShape className={styles.heroBadge} speed={0.2} />
          <div className={styles.heroTris}>
            <Triangles items={heroTriangles} z={2} />
          </div>
        </section>

        <section className={styles.intro}>
          {/* as="h1": the desktop view's visible top heading, so it is the h1.
              The mobile carousel (.mobileView, HistoryCarousel) carries its own
              h1, and display:none removes that one from the accessibility tree on
              desktop, so a desktop screen reader would otherwise meet an h2 with
              no h1 above it. Two h1s therefore exist in the source, exactly one
              exposed per breakpoint, which is correct. The duplication is a
              symptom of this page's two-view-tree architecture and resolves once
              it moves to a single layout. */}
          <PopHeading as="h1" className={`display ${styles.title}`}>
            Britain&apos;s dog <span className="display-yellow">history</span>
          </PopHeading>
          <p className={styles.lead}>
            We are a nation of dog lovers now, but it was not always so. For
            much of history Britain&apos;s dogs were worked hard, taxed, banned
            from the streets and even maimed under harsh forest laws. This is the
            story of how they went from tools and outcasts to the treasured
            companions ruling our sofas today.
          </p>
        </section>

        <div className={styles.sections}>
          <Triangles items={pageTriangles} z={3} />
          {SECTIONS.filter((s) => s.title !== "Dogs in the armed forces").map((s, i) => {
            return (
              <div key={i} id={s.anchor}>
                <div className={styles.panelOuter}>
                {i < 2 && (
                  <ParallaxShape
                    className={`${styles.yellowCircle} ${i % 2 ? styles.circleLeft : ""}`}
                    speed={0.25}
                  />
                )}
                <HistorySection section={s} />
              </div>
              {s.era && <BreedStrip era={s.era} />}
              </div>
            );
          })}
        </div>

        <section className={styles.sourceNote}>
          <p>
            Sources: RVC VetCompass, PDSA, UK Pet Food, the Royal Collection Trust,
            Historic UK, the Kennel Club / Crufts and Guinness World Records. Some
            historical tales are popular legend, and population figures are estimates
            that vary by source.
          </p>
        </section>
        </div>

        {/* Mobile layout (v2): the horizontal carousel, the same component the
            /britains-dog-history-2 route renders. Hidden above 720px. */}
        <div className={styles.mobileView}>
          <HistoryCarousel />
        </div>
      </main>
      {/* Footer holder: taken out of the layout under 721px so the carousel's
          100dvh wrap is the only thing below the fixed Nav. Otherwise the footer
          adds height, the document becomes a second vertical scroller, and a
          drag inside the dog run chains out to it. */}
      <div className={styles.footerHolder}>
        <Footer />
      </div>
    </>
  );
}
