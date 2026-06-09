import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import styles from "./cookies.module.css";

export const metadata: Metadata = {
  title: "Cookie Policy | Pedigree Chums",
  description:
    "How Pedigree Chums uses cookies and similar storage, and how you can control them.",
};

export default function CookiesPage() {
  return (
    <>
      <Nav />
      <main className={styles.wrap}>
        <article className={styles.card}>
          <h1 className={styles.title}>
            Cookie <span>Policy</span>
          </h1>
          <p className={styles.updated}>Last updated: June 2026</p>

          <p>
            This policy explains how Pedigree Chums (a trading name of Taylor
            James Stephens Ltd) uses cookies and similar browser storage on this
            website, and how you can control them.
          </p>

          <h2>What cookies are</h2>
          <p>
            Cookies are small text files that a website stores in your browser.
            They are widely used to make websites work, to remember your choices
            and to gather information about how a site is used. Similar
            technologies, such as your browser local storage, do much the same
            job and are covered by this policy too.
          </p>

          <h2>The cookies we use</h2>
          <p>We keep this to a minimum. At the moment we use:</p>
          <ul>
            <li>
              <strong>Essential storage.</strong> When you choose Accept or
              Decline on our cookie notice, we save that choice in your browser
              so we do not ask you again. This is needed for the site to respect
              your preference and cannot be turned off.
            </li>
            <li>
              <strong>Vimeo (third party).</strong> Our product video is embedded
              from Vimeo. When the video loads, Vimeo may set its own cookies to
              play the video and measure playback performance. These are set by
              Vimeo, not by us, and are covered by Vimeo&apos;s own privacy and
              cookie policies.
            </li>
          </ul>
          <p>
            We do not currently use analytics or advertising cookies. If we add
            analytics in future, we will update this policy and only load them
            for visitors who have accepted cookies.
          </p>

          <h2>Managing cookies</h2>
          <p>
            You can accept or decline non-essential cookies using the notice that
            appears when you first visit. To change your choice later, clear this
            site&apos;s data in your browser and the notice will appear again.
          </p>
          <p>
            You can also control or delete cookies through your browser settings,
            including blocking them or removing ones already stored. Note that
            blocking some cookies may affect how parts of this or other sites
            work, such as embedded video.
          </p>

          <h2>Changes to this policy</h2>
          <p>
            We may update this policy from time to time. Any changes will be
            posted on this page with a revised date at the top.
          </p>

          <h2>More information</h2>
          <p>
            For how we handle your personal data, see our{" "}
            <Link href="/privacy">Privacy Policy</Link>. If you have any
            questions, email us at{" "}
            <a href="mailto:enquiries@pedigreechums.co.uk">
              enquiries@pedigreechums.co.uk
            </a>
            .
          </p>
        </article>
      </main>
      <Footer />
    </>
  );
}
