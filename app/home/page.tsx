import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import HomeClient from "./HomeClient";
import PhotoSplit from "../../components/PhotoSplit/PhotoSplit";
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

      <StepCards />

      <Footer />
    </div>
  );
}
