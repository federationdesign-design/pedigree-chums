import Nav from "../components/Nav/Nav";
import Hero from "../components/Hero/Hero";
import PitchPanel from "../components/PitchPanel/PitchPanel";
import PhotoSplit from "../components/PhotoSplit/PhotoSplit";
import Footer from "../components/Footer/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />

        <PitchPanel />

        <PhotoSplit
          photo="/spaniel.png"
          alt="A Cocker Spaniel being spotted on a walk"
          reverse
          card="/card.jpg"
        >
          <h2 className="display">
            54 Unique <span className="display-yellow">Dog Cards</span>
          </h2>
          <ul className="points">
            <li className="point">40 of the most popular UK dog breeds</li>
            <li className="point">Plus 10 designer crossbreeds (Labradoodle, Cavapoo, and more)</li>
          </ul>
          <p className="lead">Each card includes:</p>
          <ul className="points">
            <li className="point">Breed facts: traits, colours, size and tell-tale identifiers</li>
            <li className="point">Cute yet accurate illustrations</li>
            <li className="point">Quick-reference stats</li>
          </ul>
        </PhotoSplit>

        <PhotoSplit photo="/corgi.png" alt="A Corgi being spotted in the park" large>
          <h2 className="display">
            Who <span className="display-yellow">It's For</span>
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
      </main>
      <Footer />
    </>
  );
}
