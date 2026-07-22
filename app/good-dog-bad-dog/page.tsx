import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import styles from "./good-dog-bad-dog.module.css";

export const metadata: Metadata = {
  title: "Good Dog, Bad Dog | Pedigree Chums™",
  description: "A series of essays exploring how dogs are portrayed in stories, legends and popular culture -- and what those portrayals really say about the breeds behind the image.",
  robots: "noindex",
};

const ESSAYS = [
  {
    slug: "bulls-eye",
    tag: "Bad dog", tagStyle: "tagBad",
    breed: "Bull Terrier",
    title: "Bull's-eye: The Dog as the Owner's Shadow",
    summary: "Bull's-eye belongs to Bill Sikes, one of Dickens's most violent characters. He is not simply a bad dog -- he is a dog made to carry a bad man's reputation.",
    image: "/bulls-eye-img.jpg",
  },
  {
    slug: "gelert",
    tag: "Good dog", tagStyle: "tagGood",
    breed: "Irish Wolfhound",
    title: "Gelert: The Dog Who Couldn't Explain Himself",
    summary: "Llywelyn the Great returns from the hunt to find his hound covered in blood and the cradle empty. A legend about what happens when a powerful dog cannot defend itself against the story told about it.",
    image: "/gelert-painting.jpg",
  },
  {
    slug: "hound-of-the-baskervilles",
    tag: "Bad dog", tagStyle: "tagBad",
    breed: "Bloodhound / Mastiff",
    title: "The Hound of the Baskervilles: How a Dog Was Made into a Monster",
    summary: "The hound is eventually revealed to be a real animal -- kept, coated in phosphorus and deliberately released by a human murderer. The dog supplies the teeth. The human supplies the motive.",
    image: "/hound-of-the-baskervilles.jpg",
  },
  {
    slug: "lassie",
    tag: "Good dog", tagStyle: "tagGood",
    breed: "Rough Collie",
    title: "Lassie: The Burden of Being the Perfect Dog",
    summary: "Lassie never makes a mistake. She is not a dog. She is a heroic design. And that is where the real breed pays the price.",
    image: "/lassie-img.jpg",
  },
  {
    slug: "argos",
    tag: "Good dog", tagStyle: "tagGood",
    breed: "Ancient Greek Hunting Hound",
    title: "Argos: The Dog Who Knew His Master",
    summary: "Before Lassie, before Greyfriars Bobby, there was Argos. Homer's dog from The Odyssey waited twenty years for his master to return.",
    image: "/history/Argos-hero.jpg",
  },
  {
    slug: "greyfriars-bobby",
    tag: "Good dog", tagStyle: "tagGood",
    breed: "Skye Terrier",
    title: "Greyfriars Bobby: Loyalty, Legend and the Making of a National Dog",
    summary: "A small terrier lived near Greyfriars Kirkyard for fourteen years after his master's death. An essay on what happens when a real dog is gradually transformed into the perfect good dog.",
    image: "/greyfryers-bobby.jpg",
  },
];

export default function GoodDogBadDogPage() {
  return (
    <>
      <Nav showLogo />
      <main className={styles.page}>

        {/* ── Desktop: header + grid ── */}
        <header className={styles.hero}>
          <p className={styles.eyebrow}>An essay series</p>
          <h1 className={styles.title}>
            Good Dog,<br />
            <span className={styles.titleAccent}>Bad Dog</span>
          </h1>
          <p className={styles.intro}>
            Fictional dogs are rarely just dogs. They get cast as heroes, monsters,
            loyal companions and dangerous outsiders. Their size, breed and appearance
            become shorthand for the role the story needs them to play.
          </p>
          <p className={styles.intro}>
            This series looks at some of the most famous dog stories and legends and asks what effect this has had on our conceptions of the actual breeds and the effect of that portrayal.
          </p>
        </header>

        <section className={styles.grid}>
          {ESSAYS.map((essay) => (
            <article key={essay.slug} className={styles.card}>
              <div className={styles.cardMeta}>
                <span className={`${styles.tag} ${styles[essay.tagStyle as keyof typeof styles]}`}>{essay.tag}</span>
                <span className={styles.cardBreed}>{essay.breed}</span>
              </div>
              <h2 className={styles.cardTitle}>{essay.title}</h2>
              <p className={styles.cardSummary}>{essay.summary}</p>
              <Link href={`/good-dog-bad-dog/${essay.slug}`} className={styles.readMore}>
                Read the essay →
              </Link>
            </article>
          ))}
        </section>

        {/* ── Mobile carousel ── */}
        <div className={styles.mobileCarouselWrap} id="carousel-wrap">
          <div className={styles.mobileCarousel} id="mobile-carousel">

            {/* Slide 0: intro */}
            <div className={styles.mobileSlide}>
              <div className={styles.mobileIntroSlide}>
                <p className={styles.eyebrow}>An essay series</p>
                <h1 className={styles.mobileIntroTitle}>
                  Good Dog,<br />
                  <span className={styles.titleAccent}>Bad Dog</span>
                </h1>
                <p className={styles.mobileIntroText}>
                  Fictional dogs are rarely just dogs. They get cast as heroes, monsters,
                  loyal companions and dangerous outsiders. Their size, breed and appearance
                  become shorthand for the role the story needs them to play.
                </p>
                <p className={styles.mobileIntroText}>
                  This series looks at some of the most famous dog stories and legends and asks what effect this has had on our conceptions of the actual breeds and the effect of that portrayal.
                </p>
                <button type="button" id="intro-next-btn" className={styles.mobileIntroBtn}>Go to first dog</button>
              </div>
            </div>

            {/* Essay slides */}
            {ESSAYS.map((essay, i) => (
              <div key={essay.slug} className={styles.mobileSlide}>
                {/* Top 60%: image */}
                <div className={styles.mobileSlideImg}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={essay.image}
                    alt={essay.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                  <div className={styles.mobileSlideCount}>{i + 1} / {ESSAYS.length}</div>
                  <div className={styles.mobileSlideTagOverlay}>
                    <span className={`${styles.mobileSlideTagPill} ${styles[essay.tagStyle as keyof typeof styles]}`}>{essay.tag}</span>
                    <span className={styles.mobileSlideBreed}>{essay.breed}</span>
                  </div>
                </div>
                {/* Bottom 40%: info */}
                <div className={styles.mobileSlideInfo}>
                  <h2 className={styles.mobileSlideTitle}>
                    <span className={styles.mobileSlideTitleWhite}>{essay.title.slice(0, essay.title.indexOf(":") + 1)}</span>
                    {essay.title.slice(essay.title.indexOf(":") + 1)}
                  </h2>
                  <p className={styles.mobileSlideSummary}>{essay.summary}</p>
                  <Link href={`/good-dog-bad-dog/${essay.slug}`} className={styles.mobileSlideBtn}>
                    Learn more
                  </Link>
                </div>
              </div>
            ))}

          </div>

          {/* Yellow progress bar */}
          <div className={styles.mobileProgress} id="mobile-progress" />
        </div>

        {/* Carousel script -- progress bar, intro button, vertical-flick advance.
            No preventDefault, no scroll hijack: touch-action pan-x in CSS lets the
            browser own horizontal panning; vertical flicks are read passively. */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){
          var carousel = document.getElementById('mobile-carousel');
          var bar = document.getElementById('mobile-progress');
          if(!carousel || !bar) return;
          function update() {
            var max = carousel.scrollWidth - carousel.clientWidth;
            bar.style.width = (max > 0 ? (carousel.scrollLeft / max) * 100 : 0) + '%';
          }
          carousel.addEventListener('scroll', update, { passive: true });
          update();

          function goTo(idx) {
            var count = carousel.children.length;
            if (idx < 0) idx = 0;
            if (idx > count - 1) idx = count - 1;
            carousel.scrollTo({ left: idx * carousel.clientWidth, behavior: 'smooth' });
          }

          var btn = document.getElementById('intro-next-btn');
          if (btn) btn.addEventListener('click', function(){ goTo(1); });

          /* Continuous vertical drag -> horizontal movement.
             touch-action: pan-x means the browser has no default action for
             vertical touches, so passive listeners are safe: no preventDefault,
             no interference with native horizontal swiping. */
          var GAIN = 1.6;           /* px of horizontal travel per px of vertical drag */
          var startX = 0, startY = 0, startLeft = 0, lastY = 0, lastT = 0, vel = 0;
          var axis = null;          /* null | 'v' | 'h' */

          carousel.addEventListener('touchstart', function(e){
            if (e.touches.length !== 1) return;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startLeft = carousel.scrollLeft;
            lastY = startY; lastT = Date.now(); vel = 0;
            axis = null;
          }, { passive: true });

          carousel.addEventListener('touchmove', function(e){
            var t = e.touches[0];
            if (!axis) {
              var adx = Math.abs(t.clientX - startX);
              var ady = Math.abs(t.clientY - startY);
              if (adx < 6 && ady < 6) return;           /* not decided yet */
              axis = ady > adx ? 'v' : 'h';
              if (axis === 'v') carousel.style.scrollSnapType = 'none';
            }
            if (axis !== 'v') return;                    /* horizontal: native handles it */
            var now = Date.now();
            if (now > lastT) vel = (lastY - t.clientY) / (now - lastT);
            lastY = t.clientY; lastT = now;
            carousel.scrollLeft = startLeft + (startY - t.clientY) * GAIN;
          }, { passive: true });

          carousel.addEventListener('touchend', function(){
            if (axis !== 'v') return;
            axis = null;
            var w = carousel.clientWidth;
            var idx;
            if (Math.abs(vel) > 0.35) {
              /* decisive flick at release: continue one slide in that direction */
              idx = (vel > 0 ? Math.ceil : Math.floor)(carousel.scrollLeft / w);
            } else {
              idx = Math.round(carousel.scrollLeft / w);
            }
            var count = carousel.children.length;
            if (idx < 0) idx = 0;
            if (idx > count - 1) idx = count - 1;
            carousel.scrollTo({ left: idx * w, behavior: 'smooth' });
            setTimeout(function(){ carousel.style.scrollSnapType = ''; }, 450);
          }, { passive: true });
        })();` }} />

      </main>
      <Footer />
    </>
  );
}
