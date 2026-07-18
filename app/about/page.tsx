import type { Metadata } from "next";
import { Suspense } from "react";
import Nav from "../../components/Nav/Nav";
import AboutClient from "./AboutClient";
import Hero from "../../components/Hero/Hero";
import PitchPanel from "../../components/PitchPanel/PitchPanel";
import PhotoSplit from "../../components/PhotoSplit/PhotoSplit";
import PopHeading from "../../components/PopHeading/PopHeading";
import Footer from "../../components/Footer/Footer";
import StepCards from "../../components/StepCards/StepCards";
import SocialFeed from "../../components/SocialFeed/SocialFeed";
import styles from "../page.module.css";

export const metadata: Metadata = {
  title: "About - Pedigree Chums™ | The Dog Bingo Game",
  description:
    "What Pedigree Chums™ is: the on-the-go dog spotting game. 54 illustrated breed cards with traits, stats and tell-tale features, plus who it's for and how to play.",
};

export default function About() {
  return (
    <>
      <Suspense><AboutClient /></Suspense>
      <Nav />
      <main>
        <Hero />

        <PitchPanel />

        <PhotoSplit
          photo="/how-to-play-img-resting.png"
          hoverPhoto="/how-to-play-img-hover.png"
          alt="A Cocker Spaniel being spotted on a walk"
          reverse
          xl
          circle
        >
          <PopHeading className="display">
            54 Unique <span className="display-yellow">Dog Cards</span>
          </PopHeading>
          <p className="lead">Each card includes:</p>
          <ul className="points">
            <li className="point">Breed traits and temperament</li>
            <li className="point">Coat colours and markings</li>
            <li className="point">Size and build</li>
            <li className="point">Tell-tale identifiers</li>
            <li className="point">Cute yet accurate illustrations</li>
            <li className="point">Quick-reference stats</li>
          </ul>
        </PhotoSplit>

        <PhotoSplit photo="/corgi.png" alt="A Corgi being spotted in the park" large>
          <h2 className="display">
            Who <span className="display-yellow">It&apos;s For</span>
          </h2>
          <ul className="points">
            <li className="point">Dog loving Families</li>
            <li className="point">Pooch mad Tourists</li>
            <li className="point">Visits to the local park</li>
            <li className="point">Trips in the car or on the train</li>
            <li className="point">Pet owners and walkers</li>
            <li className="point">Schools and educators</li>
            <li className="point">Great for Gifting</li>
            <li className="point">Great as a stocking filler</li>
          </ul>
        </PhotoSplit>

        <section style={{ padding: "48px 0 0" }}>
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <PopHeading className="display">How it plays</PopHeading>
          </div>
          <StepCards />
        </section>

        <section className={styles.feedSection}>
          <PopHeading className={`display ${styles.feedTitle}`}>
            See it <span className="display-yellow">in action</span>
          </PopHeading>
          <p className={styles.feedSub}>
            Real games, real dogs, real chaos - straight from our feed.
          </p>
          <SocialFeed />
        </section>
      </main>
      <Footer />
    </>
  );
}
