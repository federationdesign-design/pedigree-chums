import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import AboutSplit from "../../components/AboutSplit/AboutSplit";
import PopHeading from "../../components/PopHeading/PopHeading";

export const metadata: Metadata = {
  title: "About — Pedigree Chums | The Dog Bingo Game",
  description:
    "How Pedigree Chums works: the on-the-go dog spotting game. Spot real dogs, match your cards, and learn breed facts as you play — on walks, day trips and car rides.",
};

export default function About() {
  return (
    <>
      <Nav />
      <main>
        {/* Intro — sits below the fixed transparent nav */}
        <section
          style={{
            padding: "clamp(120px, 18vw, 190px) clamp(18px, 4vw, 48px) clamp(20px, 4vw, 40px)",
            textAlign: "center",
          }}
        >
          <PopHeading className="display">
            About <span className="display-yellow">the game</span>
          </PopHeading>
          <p
            className="lead"
            style={{ maxWidth: "60ch", margin: "12px auto 0" }}
          >
            Pedigree Chums is the on-the-go dog spotting game. Here&apos;s how it
            works.
          </p>
        </section>

        {/* 1 — Designer doodle pack */}
        <AboutSplit
          photo="/about-cockapoo.png"
          alt="Designer crossbreed cards: Labradoodle, Goldendoodle, Maltipoo and Cockapoo"
         
        >
          <PopHeading className="display">
            Cockapoo&apos;s <span className="display-yellow">a plenty!</span>
          </PopHeading>
          <p className="lead">
            The deck includes the new designer doggy pack of Labradoodles,
            Goldendoodles, Puggles and Cavapoos, along with a classic and still
            popular Lurcher.
          </p>
        </AboutSplit>

        {/* 2 — Where to play */}
        <AboutSplit
          photo="/about-corgi.png"
          alt="A Corgi running in the park"
         
          reverse
        >
          <PopHeading className="display">
            Where to <span className="display-yellow">play?</span>
          </PopHeading>
          <p className="lead">
            This is an &lsquo;on the go&rsquo; game — ideal for family walks, the
            beach, the local park, picnics and day trips. Even car rides. Just
            deal each player a few cards and you&apos;re already playing Pedigree
            Chums.
          </p>
        </AboutSplit>

        {/* 3 — The aim */}
        <AboutSplit
          photo="/about-lab.png"
          alt="A Labrador wearing sunglasses at a party"
         
        >
          <PopHeading className="display">
            The <span className="display-yellow">aim</span>
          </PopHeading>
          <p className="lead">
            Match the dog breeds on your cards with dogs you see with your own
            eyes. Each card has a cute illustration of the pedigree chum, along
            with the breed&apos;s characteristics, traits, sizes, weights, colours
            and a tell-tale feature.
          </p>
        </AboutSplit>

        {/* 4 — Is it difficult */}
        <AboutSplit
          photo="/about-golden.png"
          alt="A Golden Retriever on a walk"
         
          reverse
        >
          <PopHeading className="display">
            Is it <span className="display-yellow">difficult?</span>
          </PopHeading>
          <p className="lead">
            It&apos;s super easy if you find a place with plenty of pooches —
            harder if you play somewhere with a low paw footfall. Identifying
            them is easy once you know what to look for, and luckily each card
            has tips for spotting every breed.
          </p>
        </AboutSplit>

        {/* 5 — How long does it take */}
        <AboutSplit
          photo="/about-cockapoo.png"
          alt="A Cockapoo riding along in a car"
         
        >
          <PopHeading className="display">
            How long does it <span className="display-yellow">take to play?</span>
          </PopHeading>
          <p className="lead">
            As long as you want! The length of your walk, picnic or holiday —
            even a car journey to the dentist will do.
          </p>
          <p className="lead">
            There&apos;s no strict run time. If you&apos;re in a hurry, one option
            is to play the &lsquo;first pooch past the post&rsquo; game mode,
            which is ideal for a quick game.
          </p>
        </AboutSplit>

        {/* 6 — Is it complicated to explain */}
        <AboutSplit
          photo="/about-french.png"
          alt="A woman laughing while holding a French Bulldog"
         
          reverse
        >
          <PopHeading className="display">
            Is it complicated to <span className="display-yellow">explain?</span>
          </PopHeading>
          <p className="lead">
            No, it&apos;s very simple. Good vision helps, as sometimes the dogs are
            a distance away. It&apos;s not hard to explain either — each card has
            an illustration of the dog.
          </p>
        </AboutSplit>

        {/* 7 — Is it educational */}
        <AboutSplit
          photo="/about-beagle.png"
          alt="A Beagle wearing glasses at a desk"
         
        >
          <PopHeading className="display">
            Is it <span className="display-yellow">educational?</span>
          </PopHeading>
          <p className="lead">
            Every card contains stats and an interesting fact about the breed, so
            yes — there&apos;s fun knowledge to pick up as you play. Memories get
            tested too, as you try to remember which chums you have and their
            defining characteristics.
          </p>
        </AboutSplit>
      </main>
      <Footer />
    </>
  );
}
