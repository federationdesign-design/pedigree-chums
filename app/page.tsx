import Nav from "../components/Nav/Nav";
import Hero from "../components/Hero/Hero";
import PitchPanel from "../components/PitchPanel/PitchPanel";
import PhotoSplit from "../components/PhotoSplit/PhotoSplit";
import PopHeading from "../components/PopHeading/PopHeading";
import Footer from "../components/Footer/Footer";
import ComicStrip from "../components/ComicStrip/ComicStrip";

export default function Home() {
  return (
    <>
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
            <li className="point">Families on outings</li>
            <li className="point">Tourists in dog-friendly cities</li>
            <li className="point">Pet owners and walkers</li>
            <li className="point">Schools and educators</li>
            <li className="point">Gifting and presents</li>
            <li className="point">Great as a stocking filler</li>
          </ul>
        </PhotoSplit>

        <ComicStrip />
      </main>
      <Footer />
    </>
  );
}
