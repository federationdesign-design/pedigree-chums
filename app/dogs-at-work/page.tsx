import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import styles from "./dogs-at-work.module.css";

export const metadata: Metadata = {
  title: "Dogs at Work | Pedigree Chums™",
  description:
    "Britain's working dogs are an invisible workforce -- felt emotionally, but rarely counted economically. A series on the dogs that help Britain function, and the question behind every wagging tail: if dogs give us this much, what do we owe them back?",
  robots: "noindex",
};

const ARTICLES = [
  {
    slug: "the-dogs-teaching-medicine-how-to-smell-disease",
    tag: "Medical",
    breed: "Bio-detection dogs",
    title: "The Dogs Teaching Medicine How to Smell Disease",
    summary:
      "In 2025, two dogs called Bumper and Peanut sniffed out Parkinson's disease in a double-blind trial with up to 98% specificity. They are not replacing doctors. They may be doing something stranger: proving disease has a smell, so the machines of the future know what to look for. The dog doesn't become the machine. The dog invents it.",
    image: "/Bumper-and-peatnut.jpg",
  },
  {
    slug: "the-colleague-who-never-clocks-off",
    tag: "Medical",
    breed: "Medical alert dogs",
    title: "The Colleague Who Never Clocks Off",
    summary:
      "A medical alert dog learns one person so completely it can warn them their own body is about to go wrong -- often before they know themselves. That's not a pet. That's a colleague. Even if the only wages are dinner and the occasional stolen sausage.",
    image: "/never-clocking-off.jpg",
  },
  {
    slug: "the-electronic-nose",
    tag: "Medical",
    breed: "The machine the dogs built",
    title: "The Electronic Nose: The Machine That May Owe Dogs a Biscuit",
    summary:
      "In Milton Keynes, scientists are building an electronic nose to sniff out prostate cancer -- trained on data the dogs gathered first. The dog wrote the manual for its own replacement, and it could not care less. It just wants its biscuit. This is the last piece of the medical trilogy.",
  },
];

const COMING = [
  { tag: "Public service", name: "Police & Border Force dogs", desc: "Tracking, searching, and the noses that screen a border before anyone opens a suitcase." },
  { tag: "Rural", name: "Sheepdogs", desc: "One of the oldest and most economically important dog jobs in Britain -- a farm worker with four legs." },
  { tag: "Emergency", name: "Search & rescue dogs", desc: "Air-scenting and trailing dogs that find missing people when time is running out." },
  { tag: "Science", name: "Conservation detection dogs", desc: "Finding newts, invasive species and tree disease that humans simply cannot see." },
  { tag: "Wildcard", name: "Water-leak detection dogs", desc: "Yes, really -- dogs that sniff out leaks in the water network. Almost nobody knows they exist." },
  { tag: "Independence", name: "Assistance & guide dogs", desc: "The clearest economic case of all: a life lived independently, measured in more than sentiment." },
];

export default function DogsAtWorkPage() {
  return (
    <>
      <Nav showLogo />
      <main className={styles.page}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>An essay series</p>
          <h1 className={styles.title}>
            Dogs at<br />
            <span className={styles.titleAccent}>Work</span>
          </h1>
          <p className={styles.intro}>
            Working dogs do not know they have jobs. To a sheepdog, moving livestock is instinct,
            training and the best game in the world. To a detection dog, finding the scent is a puzzle
            with a reward at the end. To a medical alert dog, noticing that their human smells wrong is
            not a shift pattern. It is just what they do.
          </p>
          <p className={styles.intro}>
            It only becomes work when humans benefit from it. This series looks at the dogs that help
            Britain function -- the noses at the border, the paws on the hills, the search dogs in the
            woods, the assistance dogs beside their people, and the bio-detection dogs helping scientists
            ask whether disease has a smell.
          </p>
          <p className={styles.intro}>
            They are paid in food, shelter, praise, tennis balls, head strokes and the occasional stolen
            sausage. But their value is measured in time, safety, independence, science and trust. This is
            about that hidden workforce, and the question behind every wagging tail:
            <strong> if dogs give us this much, what do we owe them back?</strong>
          </p>
        </header>

        <section className={styles.grid}>
          {ARTICLES.map((a) => (
            <article key={a.slug} className={styles.card}>
              {/* Owner review: the hero image joins the desktop card, matching
                  Good Dog, Bad Dog. The data already carried it. */}
              <div className={styles.cardImgWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={(a as { image: string }).image} alt="" className={styles.cardImg} loading="lazy" />
              </div>
              <div className={styles.cardBody}>
              <div className={styles.cardMeta}>
                <span className={`${styles.tag} ${styles.tagGood}`}>{a.tag}</span>
                <span className={styles.cardBreed}>{a.breed}</span>
              </div>
              <h2 className={styles.cardTitle}>{a.title}</h2>
              <p className={styles.cardSummary}>{a.summary}</p>
              <Link href={`/dogs-at-work/${a.slug}`} className={styles.readMore}>
                Read the essay →
              </Link>
              </div>
            </article>
          ))}
        </section>

        <section className={styles.coming}>
          <h2 className={styles.comingTitle}>Coming to the workforce</h2>
          <div className={styles.comingGrid}>
            {COMING.map((c) => (
              <div key={c.name} className={styles.comingCard}>
                <span className={styles.comingTag}>{c.tag}</span>
                <p className={styles.comingName}>{c.name}</p>
                <p className={styles.comingDesc}>{c.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Mobile carousel (mirrors Good Dog Bad Dog) ── */}
        <div className={styles.mobileCarouselWrap} id="carousel-wrap">
          <div className={styles.mobileCarousel} id="mobile-carousel">

            {/* Slide 0: intro */}
            <div className={styles.mobileSlide}>
              <div className={styles.mobileIntroSlide}>
                <p className={styles.eyebrow}>An essay series</p>
                <h1 className={styles.mobileIntroTitle}>
                  Dogs at<br />
                  <span className={styles.titleAccent}>Work</span>
                </h1>
                <p className={styles.mobileIntroText}>
                  Working dogs do not know they have jobs. To a sheepdog, moving livestock is
                  instinct, training and the best game in the world. To a medical alert dog,
                  noticing that their human smells wrong is not a shift pattern. It is just what
                  they do.
                </p>
                <p className={styles.mobileIntroText}>
                  It only becomes work when humans benefit from it. They are paid in food, praise
                  and the occasional stolen sausage, but their value is measured in time, safety,
                  independence and trust.
                </p>
                <button type="button" id="intro-next-btn" className={styles.mobileIntroBtn}>Go to first dog</button>
              </div>
            </div>

            {/* Article slides */}
            {ARTICLES.map((a, i) => (
              <div key={a.slug} className={styles.mobileSlide}>
                {/* Top 60%: image, or a navy panel where artwork is still to come */}
                <div className={styles.mobileSlideImg}>
                  {"image" in a ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={(a as { image: string }).image}
                      alt={a.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  ) : (
                    <div className={styles.mobileSlideImgFallback} />
                  )}
                  <div className={styles.mobileSlideCount}>{i + 1} / {ARTICLES.length}</div>
                  <div className={styles.mobileSlideTagOverlay}>
                    <span className={`${styles.mobileSlideTagPill} ${styles.tagGood}`}>{a.tag}</span>
                    <span className={styles.mobileSlideBreed}>{a.breed}</span>
                  </div>
                </div>
                {/* Bottom 40%: info */}
                <div className={styles.mobileSlideInfo}>
                  <h2 className={styles.mobileSlideTitle}>
                    <span className={styles.mobileSlideTitleWhite}>{a.title.slice(0, a.title.indexOf(":") + 1)}</span>
                    {a.title.slice(a.title.indexOf(":") + 1)}
                  </h2>
                  <p className={styles.mobileSlideSummary}>{a.summary}</p>
                  <Link href={`/dogs-at-work/${a.slug}`} className={styles.mobileSlideBtn}>
                    Learn more
                  </Link>
                </div>
              </div>
            ))}

          </div>

          {/* Yellow progress bar */}
          <div className={styles.mobileProgress} id="mobile-progress" />
        </div>

        {/* Carousel script -- identical to Good Dog Bad Dog, including the fix
            that releases scroll snapping around the programmatic scroll. */}
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
            var c = document.getElementById('mobile-carousel');
            if (!c) return;
            var count = c.children.length;
            if (idx < 0) idx = 0;
            if (idx > count - 1) idx = count - 1;
            var from = c.scrollLeft;
            var target = idx * c.clientWidth;
            /* Mandatory snap blocks programmatic smooth scrolling on iOS Safari. */
            c.style.scrollSnapType = 'none';
            c.scrollTo({ left: target, behavior: 'smooth' });
            setTimeout(function(){
              if (Math.abs(c.scrollLeft - from) < 2) c.scrollLeft = target;
            }, 400);
            setTimeout(function(){ c.style.scrollSnapType = ''; }, 700);
          }

          document.addEventListener('click', function(e){
            var t = e.target;
            if (t && t.closest && t.closest('#intro-next-btn')) goTo(1);
          });

          /* Continuous vertical drag -> horizontal movement. */
          var GAIN = 1.6;
          var startX = 0, startY = 0, startLeft = 0, lastY = 0, lastT = 0, vel = 0;
          var axis = null;

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
              if (adx < 6 && ady < 6) return;
              axis = ady > adx ? 'v' : 'h';
              if (axis === 'v') carousel.style.scrollSnapType = 'none';
            }
            if (axis !== 'v') return;
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
