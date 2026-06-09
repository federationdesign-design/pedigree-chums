import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import styles from "./privacy.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy | Pedigree Chums",
  description:
    "How Pedigree Chums collects, uses and protects your personal data when you sign up for our launch offers.",
};

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main className={styles.wrap}>
        <article className={styles.card}>
          <h1 className={styles.title}>
            Privacy <span>Policy</span>
          </h1>
          <p className={styles.updated}>Last updated: June 2026</p>

          <p>
            This policy explains how Pedigree Chums (referred to as we, us or our
            in this policy) collects, uses and protects your personal data when you
            use this website and sign up for our launch offers. Pedigree Chums is a
            trading name of Taylor James Stephens Ltd, registered in England and
            Wales. We are the data controller responsible for your personal data.
          </p>

          <h2>What we collect</h2>
          <p>When you complete our sign-up form we collect:</p>
          <ul>
            <li>your email address</li>
            <li>whether you have asked us to reserve a pack for you</li>
          </ul>
          <p>
            We do not ask for or store any other personal information through this
            form.
          </p>

          <h2>How we use your data</h2>
          <p>We use your email address to:</p>
          <ul>
            <li>send you a discount code ahead of our pre-release launch</li>
            <li>let you know when packs go on general sale</li>
            <li>
              contact you about a pack reservation, if you asked us to reserve one
            </li>
          </ul>
          <p>
            Our lawful basis for this is your consent, which you give by ticking the
            consent box and submitting the form.
          </p>

          <h2>Who we share it with</h2>
          <p>
            We use trusted third-party providers to deliver our emails and manage
            our mailing list. They act as our data processors and only handle your
            data on our instructions:
          </p>
          <ul>
            <li>Resend, which sends our emails</li>
            <li>MailerLite, which stores and manages our mailing list</li>
          </ul>
          <p>We do not sell your personal data to anyone.</p>

          <h2>How long we keep it</h2>
          <p>
            We keep your email address for as long as you remain subscribed to our
            launch updates. If you unsubscribe or ask us to delete your data, we
            will remove it from our active lists promptly.
          </p>

          <h2>Your rights</h2>
          <p>Under UK data protection law you have the right to:</p>
          <ul>
            <li>access the personal data we hold about you</li>
            <li>ask us to correct it if it is wrong</li>
            <li>ask us to delete it</li>
            <li>object to or restrict how we use it</li>
            <li>withdraw your consent at any time</li>
            <li>ask for a copy of your data in a portable format</li>
          </ul>
          <p>
            To exercise any of these, contact us using the details below. You also
            have the right to complain to the Information Commissioner&apos;s Office
            (ICO) at{" "}
            <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">
              ico.org.uk
            </a>
            .
          </p>

          <h2>Unsubscribing</h2>
          <p>
            Every marketing email we send includes an unsubscribe link. You can opt
            out at any time and we will stop sending you marketing emails.
          </p>

          <h2>Cookies and analytics</h2>
          <p>
            If you accept cookies, we use Google Analytics to understand how the
            site is used. This site also embeds a video from Vimeo, which may set
            its own cookies. We do not use advertising cookies. For the full
            detail, see our <Link href="/cookies">Cookie Policy</Link>.
          </p>

          <h2>Changes to this policy</h2>
          <p>
            We may update this policy from time to time. Any changes will be posted
            on this page with a revised date at the top.
          </p>

          <h2>Contact us</h2>
          <p>
            If you have any questions about this policy or your data, email us at{" "}
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
