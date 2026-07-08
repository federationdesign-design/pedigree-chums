import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import HomeClient from "./HomeClient";
import PopHeading from "../../components/PopHeading/PopHeading";
import StepCards from "../../components/StepCards/StepCards";
import Footer from "../../components/Footer/Footer";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: "Pedigree Chums | The Dog Bingo Game",
  description:
    "Find your favourite dog breed and discover their family tree, history and personality. 54 illustrated breed cards for the on-the-go dog spotting game.",
};

export default function HomePage() {
  return (
    <div className={styles.page}>
      <Nav />
      <HomeClient />

      {/* Video + 54 cards section */}
      <section className={styles.videoSection}>
        <div className={styles.videoCol}>
          <iframe
            src="https://player.vimeo.com/video/1199216471?autoplay=0&loop=1&muted=1&controls=1&title=0&byline=0&portrait=0"
            title="Pedigree Chums"
            allow="autoplay; fullscreen; picture-in-picture"
            frameBorder="0"
            className={styles.videoFrame}
          />
        </div>
        <div className={styles.textCol}>
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
        </div>
      </section>

      <StepCards />

      <Footer />
    </div>
  );
}
