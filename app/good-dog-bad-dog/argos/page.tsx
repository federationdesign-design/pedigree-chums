import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../../../components/Nav/Nav";
import Footer from "../../../components/Footer/Footer";
import styles from "../good-dog-bad-dog.module.css";
import CaptionedCarousel from "../../../components/CaptionedCarousel/CaptionedCarousel";
import DogPoll from "../../../components/DogPoll/DogPoll";
import ReadingProgress from "../../../components/ReadingProgress/ReadingProgress";
import ScrollVideo from "../../../components/ScrollVideo/ScrollVideo";
import { QuoteBuild, StatueBulletsChoreo, HomerCrossfade, GatedVideo } from "../../../components/ArgosChoreo/ArgosChoreo";

export const metadata: Metadata = {
  title: "Argos: Homer's Dog in The Odyssey — Loyalty, Home and the Nolan Film",
  description:
    "The dog from Homer's Odyssey who waited twenty years for his master to return. What Argos tells us about loyalty, home, scent and what we owe the dogs who love us.",
  robots: "index, follow",
  openGraph: {
    title: "Argos: The Dog Who Knew His Master",
    description:
      "He simply lifts his head, recognises the man he has waited for, wags his tail, and dies. Nearly three thousand years later, that is enough.",
    url: "https://pedigree-chums.co.uk/good-dog-bad-dog/argos",
    siteName: "Pedigree Chums",
    images: [
      {
        url: "https://pedigree-chums.co.uk/og/argos-og.jpg",
        width: 1200,
        height: 630,
        alt: "Argos: The Dog Who Knew His Master — Pedigree Chums Good Dog Bad Dog",
      },
    ],
    locale: "en_GB",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Argos: The Dog Who Knew His Master",
    description:
      "He simply lifts his head, recognises the man he has waited for, wags his tail, and dies. Nearly three thousand years later, that is enough.",
    images: ["https://pedigree-chums.co.uk/og/argos-og.jpg"],
  },
};

type TimelineEntry = { era: string; name: string; context: string; highlight: boolean; end: boolean; isBreed?: boolean; slug?: string };

const TIMELINE: TimelineEntry[] = [
                  {
                    era: "3000–1200 BCE",
                    name: "Ancient Near Eastern Molosser",
                    context: "Era of the Egyptian pharaohs. Tutankhamun reigns c.1341 BCE. The Trojan War c.1200 BCE.",
                    highlight: false, end: false,
                  },
                  {
                    era: "1600–1100 BCE",
                    name: "Mycenaean / Aegean Molosser",
                    context: "Mycenaean Greece at its height. These dogs guard palaces at Tiryns and Mycenae.",
                    highlight: false, end: false,
                  },
                  {
                    era: "800–300 BCE",
                    name: "Greek Molossian Type",
                    context: "Pythagoras born c.570 BCE. Confucius teaching in China c.500 BCE. Plato writing c.390 BCE.",
                    highlight: false, end: false,
                  },
                  {
                    era: "c. 8th century BCE",
                    name: "Argos — Odysseus' Dog",
                    context: "Homer composing The Odyssey. The founding of Rome c.753 BCE.",
                    highlight: true, end: false,
                  },
                  {
                    era: "247–183 BCE",
                    name: "Molossian spreads west",
                    context: "Hannibal of Carthage uses war dogs crossing the Alps. The breed reaches North Africa and Iberia.",
                    highlight: false, end: false,
                  },
                  {
                    era: "221 BCE",
                    name: "Qin Dynasty unifies China",
                    context: "The Silk Road opens. Molosser-type dogs travel trade routes into Central Asia.",
                    highlight: false, end: false,
                  },
                  {
                    era: "100 BCE–400 CE",
                    name: "Roman Molosser in Britain",
                    context: "Julius Caesar invades Britain 55 BCE. Roman legions bring Molossian dogs. The breed roots across northern Europe.",
                    highlight: false, end: false,
                  },
                  {
                    era: "1324–1325 CE",
                    name: "Mansa Musa’s pilgrimage",
                    context: "The Mali emperor’s journey to Mecca introduces West African courts to Mediterranean sighthound types.",
                    highlight: false, end: false,
                  },
                  {
                    era: "Modern · UK",
                    name: "Greyhound",
                    context: "Descended via the Laconian Hound. The fastest dog breed in existence. One of our 54 Chums.",
                    highlight: false, end: false, isBreed: true, slug: "greyhound",
                  },
                  {
                    era: "Modern · UK",
                    name: "Whippet",
                    context: "Descended via the Laconian Hound and later refined in northern England for racing.",
                    highlight: false, end: false, isBreed: true, slug: "whippet",
                  },
                  {
                    era: "Modern · UK",
                    name: "English Mastiff",
                    context: "Descended via the Molossian Hound. One of the heaviest dog breeds in the world. One of our 54 Chums.",
                    highlight: false, end: true, isBreed: true, slug: "mastiff",
                  },
];

function NolanFilmCard() {
  return (
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 4px" }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "27px", textAlign: "center", letterSpacing: "0.12em", color: "var(--yellow)", textTransform: "uppercase", margin: "0 0 2px" }}>The Odyssey</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 600, color: "#fff" }}>Christopher Nolan · Universal · 2026</p>
              </div>
              <div style={{ padding: "12px 20px 4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[1,2,3,4,5].map(i => (
                      <svg key={i} width="48" height="48" viewBox="0 0 24 24" fill="var(--yellow)" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    ))}
                  </div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>5 / 5</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                  {([
                    { label: "Runtime", value: <>173 <span style={{ fontSize: "75%" }}>min</span></> },
                    { label: "Released", value: "July 26" },
                    { label: "US rating", value: "R" },
                  ] as { label: string; value: React.ReactNode }[]).map(({ label, value }) => (
                    <div key={label} style={{ textAlign: "center" }}>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--yellow)", marginBottom: 3 }}>{label}</p>
                      <p style={{ fontFamily: "var(--font-display)", fontSize: "1.7rem", color: "#fff", lineHeight: 1 }}>{value}</p>
                    </div>
                  ))}
                </div>
                <div style={{ background: "#ef4444", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "1.05rem", fontWeight: 700, color: "#fff", marginBottom: 4 }}>Not suitable for children</p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "1.05rem", fontWeight: 500, color: "#fff", lineHeight: 1.3 }}>Rated R (US) and 15 (UK) for strong violence. Nearly three hours with intense action, mythological horror and mature themes throughout.</p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["Matt Damon", "Tom Holland", "Anne Hathaway", "Robert Pattinson", "Zendaya", "Charlize Theron"].map(name => (
                    <span key={name} style={{ fontFamily: "var(--font-body)", fontSize: "0.52rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--navy)", background: "var(--yellow)", borderRadius: 999, padding: "4px 10px", display: "inline-block" }}>{name}</span>
                  ))}
                </div>
              </div>
              <div style={{ height: 16 }} />
            </div>
  );
}

function LivingDescendantCard({ showImage = false }: { showImage?: boolean }) {
  return (
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 4px" }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "27px", textAlign: "center", letterSpacing: "0.12em", color: "var(--yellow)", textTransform: "uppercase", margin: 0 }}>Living Descendant</p>
              </div>
              {showImage && (
              <div style={{ overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/history/greek-harehound.jpg"
                  alt="Greek Harehound (Hellinikos Ichnilatis)"
                  style={{ width: "100%", display: "block", maxHeight: 220, objectFit: "cover" }}
                />
              </div>
              )}
              <div style={{ padding: "14px 20px 16px" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 700, color: "#fff", marginBottom: 6 }}>Greek Harehound</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 500, color: "#fff", lineHeight: 1.3, marginBottom: 8 }}>(<em>Hellenikos Ichnilatis</em>) — the only FCI-recognised Greek breed today, believed to descend directly from the ancient Laconian hunting dogs of the classical period. Its genetics have remained largely unchanged for thousands of years due to isolation in the Greek mountains.</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 500, color: "var(--yellow)", opacity: 0.8 }}>Image: Wikimedia Commons / CC BY-SA 3.0</p>
              </div>
            </div>
  );
}

function EditorsNoteCard() {
  return (
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 4px" }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "27px", textAlign: "center", letterSpacing: "0.12em", color: "var(--yellow)", textTransform: "uppercase", margin: "0 0 8px" }}>Editor&apos;s Note</p>
              </div>
              <div style={{ padding: "0 20px 16px" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 500, color: "#fff", lineHeight: 1.3, fontStyle: "italic" }}>This piece was written before the release of Christopher Nolan&apos;s <em>The Odyssey</em>. It reflects the conversation around the Argos scene in the weeks leading up to the film, and should be read in that context.</p>
              </div>
            </div>
  );
}

function ArgosIdentityCard() {
  return (
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 4px" }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "27px", textAlign: "center", letterSpacing: "0.12em", color: "var(--yellow)", textTransform: "uppercase", margin: "0 0 4px" }}>ARGOS</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 600, color: "#fff" }}>The Dog of Odysseus</p>
              </div>
              <div style={{ padding: "10px 20px 16px" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 500, color: "#fff", lineHeight: 1.3 }}>In Homer&apos;s <em>Odyssey</em>, Argos is Odysseus&apos; old hunting dog who recognises his master after 20 years away. The details below are a realistic interpretation of how Argos may have looked, based on archaeological evidence and ancient art.</p>
              </div>
            </div>
  );
}

function InContextCard() {
  return (
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 4px" }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "27px", textAlign: "center", letterSpacing: "0.12em", color: "var(--yellow)", textTransform: "uppercase", margin: 0 }}>In Context</p>
              </div>
              <div style={{ padding: "10px 20px 16px" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "1rem", fontWeight: 500, color: "#fff", lineHeight: 1.3, fontStyle: "italic" }}>&ldquo;Argos in <em>The Odyssey</em> is old, neglected and lying in refuse when Odysseus returns. He once hunted beside his master, but in his absence, no one cared for him.&rdquo;</p>
              </div>
            </div>
  );
}

function BookFactsCard() {
  return (
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 12px" }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "27px", textAlign: "center", letterSpacing: "0.12em", color: "var(--yellow)", textTransform: "uppercase", margin: "0 0 2px" }}>The Odyssey</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 600, color: "#fff" }}>Homer · c. 700 BCE &mdash; The Book</p>
              </div>
              <div style={{ padding: "0 20px 4px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                {([
                  { label: "Books", value: "24" },
                  { label: "Lines", value: "12,109" },
                  { label: "Read time*", value: <>30 <span style={{ fontSize: "75%" }}>hrs</span></> },
                ] as { label: string; value: React.ReactNode }[]).map(({ label, value }) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--yellow)", marginBottom: 4 }}>{label}</p>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "#fff", lineHeight: 1 }}>{value}</p>
                  </div>
                ))}
              </div>
              <div style={{ padding: "12px 20px 16px" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 500, color: "#fff", lineHeight: 1.3 }}>*The often-cited 9-hour figure assumes mechanical reading at 250 wpm. In practice, The Odyssey demands real concentration and a considered read. Reader beware!</p>
              </div>
            </div>
  );
}

function AboutHomerCard() {
  return (
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 4px" }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "27px", textAlign: "center", letterSpacing: "0.12em", color: "var(--yellow)", textTransform: "uppercase", margin: 0 }}>About Homer</p>
              </div>
              <div style={{ overflow: "hidden", position: "relative" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/history/homer-bust.jpeg"
                  alt="Bust of Homer, Farnese collection, Naples"
                  style={{ width: "100%", display: "block" }}
                />
                <p style={{ position: "absolute", left: 12, right: 12, bottom: 8, fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 600, color: "var(--navy)", margin: 0 }}>Image: Bust of Homer, Farnese collection, Naples. Wikimedia Commons / CC BY-SA 4.0</p>
              </div>
              <div style={{ padding: "14px 20px 16px" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 700, color: "#fff", marginBottom: 4 }}>Homer</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 700, color: "var(--yellow)", marginBottom: 12 }}>c. 800–700 BCE · Ionia (western coast of modern Turkey)</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 500, color: "#fff", lineHeight: 1.3, marginBottom: 10 }}>Homer is one of the great mysteries of literature. Almost nothing is known about him with certainty — not where he was born, not when he lived, not even whether he was one person or many. Some scholars believe the epics were composed by a single genius; others think they were assembled over generations of oral tradition.</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 500, color: "#fff", lineHeight: 1.3, marginBottom: 14 }}>Ancient tradition held that he was blind — a detail derived from a character in the Odyssey itself, a blind bard called Demodokos who sings of the Trojan War. He most likely came from Ionia and composed in an archaic Greek that became the model for all subsequent epic poetry.</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--yellow)", marginBottom: 12 }}>Major Works</p>
                {[
                  {
                    title: "The Iliad",
                    detail: "c. 750 BCE · 24 books · 15,693 lines",
                    desc: "The Trojan War — the wrath of Achilles, the siege of Troy, the death of Hector. Where the Odyssey is about homecoming, the Iliad is about what war costs.",
                  },
                  {
                    title: "The Odyssey",
                    detail: "c. 700 BCE · 24 books · 12,109 lines",
                    desc: "The journey home. Ten years of storms, monsters and gods. The poem that contains Argos.",
                  },

                ].map(({ title, detail, desc }) => (
                  <div key={title} style={{ marginBottom: 14 }}>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 700, color: "#fff", marginBottom: 2 }}>{title}</p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", fontWeight: 700, color: "var(--yellow)", marginBottom: 4, letterSpacing: "0.04em" }}>{detail}</p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 500, color: "#fff", lineHeight: 1.3 }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
  );
}

function WhatWeKnowCard() {
  return (
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 4px" }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "27px", textAlign: "center", letterSpacing: "0.12em", color: "var(--yellow)", textTransform: "uppercase", margin: 0 }}>What We Know</p>
              </div>
              <div style={{ padding: "10px 20px 4px" }}>
                {[
                  { label: "Source", value: "The Odyssey, Homer, Book 17" },
                  { label: "Approx. date", value: "Story set c.1200 BC" },
                  { label: "Age at death", value: "Twenty years — almost certainly mythic for a large hunting dog. Aristotle noted this was exceptional and recorded that critics praised Homer for giving Argos exactly this lifespan." },
                  { label: "Most probable type", value: "The Laconian Hound (Spartan Hound) — the premier hunting dog of ancient Greece. Lean, fast, agile and prized across the Mediterranean for its scenting ability and stamina." },
                ].map(({ label, value }) => (
                  <div key={label} style={{ marginBottom: 14 }}>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--yellow)", marginBottom: 4 }}>{label}</p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 500, color: "#fff", lineHeight: 1.3 }}>{value}</p>
                  </div>
                ))}
              </div>
              <div style={{ padding: "4px 20px 8px" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--yellow)", marginBottom: 10 }}>Modern chum descendants</p>
                {[
                  { breed: "Greyhound", via: "via Laconian Hound", slug: "greyhound", linked: true },
                  { breed: "Whippet", via: "via Laconian Hound", slug: "whippet", linked: true },
                  { breed: "English Mastiff", via: "via Molossian Hound", slug: "mastiff", linked: true },
                ].map(({ breed, via, slug, linked }) => (
                  <div key={breed} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8 }}>
                    {linked && slug ? (
                      <a href={"/chums/" + slug} style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 700, color: "var(--yellow)", textDecoration: "underline", textUnderlineOffset: "3px" }}>{breed}</a>
                    ) : (
                      <span style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 600, color: "#fff" }}>{breed}</span>
                    )}
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", fontWeight: 500, color: "#fff", textAlign: "right", flexShrink: 0 }}>{via}</span>
                  </div>
                ))}
              </div>
              <div style={{ height: 8 }} />
            </div>
  );
}

function LikelyOriginsCard() {
  return (
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 4px" }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "27px", textAlign: "center", letterSpacing: "0.12em", color: "var(--yellow)", textTransform: "uppercase", margin: 0 }}>Likely Origins</p>
              </div>
              <div style={{ padding: "10px 20px 16px" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 500, color: "#fff", lineHeight: 1.3, marginBottom: 8 }}>Argos would not be a modern breed but a type of ancient working dog common across the Mediterranean — most likely descended from <strong>Molossian / Molosser type dogs</strong>: powerful, loyal hunting and guard animals used by the Greeks and earlier by the Mycenaeans.</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 500, color: "#fff", lineHeight: 1.3 }}>Larger, strong-boned, with short coats and great endurance.</p>
              </div>
            </div>
  );
}

function BuildAppearanceCard() {
  return (
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 4px" }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "27px", textAlign: "center", letterSpacing: "0.12em", color: "var(--yellow)", textTransform: "uppercase", margin: 0 }}>Build & Appearance</p>
              </div>
              <div style={{ padding: "10px 20px 16px" }}>
                {[
                  "Broad head, powerful jaw, drop ears, thick neck",
                  "Powerful, muscular and deep-chested",
                  "Built for endurance, strength and protection",
                  "Short, dense coat suited to heat and outdoor life",
                  "Likely brindle, grey, fawn or dark-coated",
                  "Worn, scarred and aged after years of neglect",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start", paddingLeft: 16, paddingRight: 20 }}>
                    <span style={{ color: "var(--yellow)", fontSize: "0.8rem", marginTop: 2, flexShrink: 0, fontWeight: 600 }}>▸</span>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 600, color: "#fff", lineHeight: 1.5, margin: 0, hyphens: "none" as const, overflowWrap: "normal" as const }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>
  );
}

const RESEARCH_NOTE = "The physical description and lineage above are historical reconstructions based on archaeological finds, ancient art and written accounts. Argos is a literary character, but his depiction is grounded in the types of dogs that likely existed in Homer\u2019s world.";

function EstimatedSizeCard() {
  return (
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 12px" }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "27px", textAlign: "center", letterSpacing: "0.12em", color: "var(--yellow)", textTransform: "uppercase", margin: 0 }}>Estimated Size</p>
              </div>
              <div style={{ padding: "0 20px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { label: "Full height", value: "75–90 cm", sub: "ear to ground" },
                  { label: "Full length", value: "110–130 cm", sub: "nose to tail base" },
                  { label: "Weight", value: "45–65 kg", sub: "" },
                ].map(({ label, value, sub }) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--yellow)", marginBottom: 4 }}>{label}</p>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "#fff", lineHeight: 1, marginBottom: 2 }}>{value}</p>
                    {sub && <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", fontWeight: 500, color: "#fff" }}>{sub}</p>}
                  </div>
                ))}
              </div>
            </div>
  );
}

function SizeBuildCard() {
  return (
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 12px" }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "27px", textAlign: "center", letterSpacing: "0.12em", color: "var(--yellow)", textTransform: "uppercase", margin: 0 }}>Size & Build</p>
              </div>
              <div style={{ padding: "0 20px 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[
                  { label: "Height", value: "90 cm" },
                  { label: "Length", value: "130 cm" },
                  { label: "Weight", value: "65 kg" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--yellow)", marginBottom: 4 }}>{label}</p>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "#fff", lineHeight: 1 }}>{value}</p>
                  </div>
                ))}
              </div>
              <div style={{ padding: "0 20px 16px" }}>
                {[
                  "Broad head, powerful jaw, drop ears, thick neck",
                  "Powerful, muscular and deep-chested",
                  "Built for endurance, strength and protection",
                  "Short, dense coat suited to heat and outdoor life",
                  "Likely brindle, grey, fawn or dark-coated",
                  "Worn, scarred and aged after years of neglect",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                    <span style={{ color: "var(--yellow)", fontSize: "0.9rem", marginTop: 2, flexShrink: 0, fontWeight: 600 }}>▸</span>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "1.12rem", fontWeight: 600, color: "#fff", lineHeight: 1.5, margin: 0, textAlign: "left" }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>
  );
}

export default function ArgosPage() {
  return (
    <>
      <Nav showLogo />
      <main className={styles.essayPage}>

        <ReadingProgress />

        {/* ── Hero ── */}
        <div className={`${styles.essayHero} ${styles.heroScene}`}>
          <img src="/history/Argos-hero.jpg" alt="Argos — The Dog Who Knew His Master" className={styles.essayHeroImg} />
          <div className={styles.essayHeroTint} />
          <div className={styles.essayHeroContent}>
            <h1 className={styles.essayHeroTitle}>
              <span className={styles.essayHeroTitleWhite}>Argos:</span> The Dog Who Knew His Master
            </h1>
            <div className={styles.essayHeroMeta}>
              <span className={`${styles.tag} ${styles.tagGood}`}>Good dog</span>
              <span className={`${styles.tag} ${styles.tagLit}`}>Homer</span>
              <span className={`${styles.tag} ${styles.tagLit}`}>The Odyssey</span>
              <span className={styles.tagBreed}>Ancient Greek Hunting Hound</span>
            </div>
            <a href="#article-start" id="hero-arrow" className={styles.heroArrow} aria-label="Read the essay">
              <svg width="36" height="21" viewBox="0 0 36 21" fill="none" aria-hidden="true">
                <path d="M3 3l15 15L33 3" stroke="#ffd23e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <Link href="/good-dog-bad-dog" className={styles.backLink}>← Back to Good Dog, Bad Dog</Link>
          </div>
        </div>


        {/* ── Two-column layout ── */}
        <div className={styles.essayLayout} id="article-start">
          <Link href="/good-dog-bad-dog" className={styles.backLinkArticle}><span className={styles.backArrow}>←</span> Back to Good Dog, Bad Dog</Link>
          <article className={styles.essay}>
            <div className={styles.essayBody}>

              <div className={styles.sceneMobile}>
                <p className={styles.editorsNoteTitle}>Editor&apos;s Note</p>
                <p className={styles.editorsNoteText}>This piece was written before the release of Christopher Nolan&apos;s <em>The Odyssey</em>. It reflects the conversation around the Argos scene in the weeks leading up to the film, and should be read in that context.</p>
              </div>

              <p>Before Lassie ran for help, before Greyfriars Bobby waited by a grave, before the internet discovered videos of dogs greeting soldiers home from war, there was Argos.</p>

              <p>He appears only briefly in <em>The Odyssey</em>. He does not fight a monster. He does not save a child. He does not lead anyone out of danger. He simply lifts his head, recognises the man he has waited for, wags his tail, and dies.</p>

              <p>And somehow, nearly three thousand years later, that is enough.</p>

              <p>Now that Christopher Nolan has brought <em>The Odyssey</em> back into cinemas, Argos has returned too. Nolan has described <em>The Odyssey</em> as &quot;the ultimate dog movie&quot;, and has linked his own recent experience of becoming a dog owner to the importance of Argos in the story. In Homer, Argos is a tiny scene. In emotional terms, he is enormous.</p>

              <div className={styles.sceneMobile}>
                <NolanFilmCard />
              </div>

              <p>That may be because Argos is not just a loyal dog. He is something more complicated. He is the dog as memory. The dog as home. The dog as witness. The dog as proof that someone can be changed by war, time, disguise and suffering, and still be known by the creature who loved him before all of it.</p>

              <h2 className={styles.subhead}>The oldest dog reunion in literature</h2>

              <p>The Argos scene comes late in <em>The Odyssey</em>, when Odysseus has finally returned to Ithaca after twenty years away. Ten years were spent at Troy. Another ten were spent trying to get home.</p>

              <p>But when he arrives, he cannot simply walk through the door and announce himself. His palace has been overrun by suitors who want to marry his wife, consume his wealth and take his place. Odysseus returns disguised as a beggar. His survival depends on being unrecognised.</p>

              <p className={styles.heavyLine}>Then he sees the dog.</p>

              <div className={`${styles.sceneMobile} ${styles.parallaxScene} ${styles.videoPinScene}`} data-scrub-scene id="menuflash-scene">
                <div className={styles.parallaxImgWrap}>
                  <ScrollVideo src="/menuflash-argos-opt.mp4" className={styles.parallaxVideo} />
                  <div className={styles.videoCard} id="menu-card">
                    <ArgosIdentityCard />
                  </div>
                </div>
              </div>

              <div className={styles.desktopOnly}>
              <p>Argos is lying outside, old, filthy and neglected. He had once been a fine hunting dog, raised by Odysseus himself, but Odysseus left for Troy before he ever properly hunted with him. In the old days, the young men took Argos out to hunt wild goats, deer and hares. Now he lies on a dung heap, covered in fleas, ignored by the household that should have cared for him.</p>

              <blockquote className={styles.pullquote}><span className={styles.pullquoteMark}>“</span>Humans recognise status. Dogs recognise presence.</blockquote>
              </div>

              <div className={styles.sceneMobile}>
                <QuoteBuild
                  pinned={<p style={{ margin: 0 }}>Argos is lying outside, old, filthy and neglected. He had once been a fine hunting dog, raised by Odysseus himself, but Odysseus left for Troy before he ever properly hunted with him. In the old days, the young men took Argos out to hunt wild goats, deer and hares. Now he lies on a dung heap, covered in fleas, ignored by the household that should have cared for him.</p>}
                  quote="Humans recognise status. Dogs recognise presence."
                />
              </div>

              <div className={styles.sceneMobile}>
                <SizeBuildCard />
              </div>

              <div className={styles.desktopOnly}>
              <ul className={styles.essayBullets}>
                <li>But Argos recognises Odysseus.</li>
                <li>The humans see a beggar.</li>
                <li>The dog knows his master.</li>
                <li>That is the whole power of the scene.</li>
              </ul>
              </div>

              <div className={styles.sceneMobile}>
                <StatueBulletsChoreo
                  slides={[
                    { src: "/history/odyssusand-argos-statue-2.jpg", alt: "Odysseus and Argos statue", caption: "Nolan is the only one to reimagine this moment" },
                    { src: "/history/odyssusand-argos-statue-1.jpg", alt: "Odysseus and Argos statue, second view", caption: "Odysseus and Argos: the reunion in stone." },
                  ]}
                  bullets={[
                    "But Argos recognises Odysseus.",
                    "The humans see a beggar.",
                    "The dog knows his master.",
                    "That is the whole power of the scene.",
                  ]}
                />
              </div>

              <p>Odysseus notices. He wipes away a tear, but he cannot go to Argos openly. He cannot kneel beside him, call his name, or comfort him without risking his disguise. Argos has enough strength left to recognise him, but not enough to reach him. Then, as Odysseus goes inside, Argos dies.</p>

              <p>It is a brutal little scene because it withholds the reunion we want. Homer does not give us the big embrace. He gives us recognition without comfort.</p>

              <h2 className={styles.subhead}>Why we need Odysseus to go to him</h2>

              <p>Around the time Nolan&apos;s film was announced, something interesting happened online. Fans were discussing the Argos scene before the film was even released. One Reddit thread asked whether Nolan would include the moment, with users remembering it as one of the most emotional parts of the poem. One comment put the modern demand bluntly: &quot;Pet.The.Dog Nolan.&quot;</p>

              <p>That reaction tells us something real.</p>

              <p>Modern audiences do not just want Argos to recognise Odysseus. They want Odysseus to recognise Argos back. They want the reunion to be mutual. They want the dog&apos;s loyalty to be answered with something visible: a hand on the head, a moment beside him, acknowledgement.</p>

              <p>In Homer, Odysseus&apos;s restraint makes sense. He is in disguise, in danger, inside a plan that cannot unravel. The scene is painful precisely because he loves Argos and cannot act on it. An ancient audience may have been more prepared to admire that restraint: Odysseus endures the pain, keeps his disguise and remains faithful to the larger task.</p>

              <div className={styles.desktopOnly}>
              <blockquote className={styles.pullquote}><span className={styles.pullquoteMark}>“</span>The people demanding that Argos be petted are not doing something new. They are doing what audiences have always done: asking an old story to speak to the feelings of the present.</blockquote>
              </div>

              <div className={styles.sceneMobile}>
                <QuoteBuild
                  pinned={
                    <figure style={{ margin: 0 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/history/jurrisicbark-shialebuff.jpg" alt="Jurassic Bark" loading="lazy" />
                      <figcaption className={styles.choreoCaption}>Jurassic Bark: every good show or story will use this as a trope, some more successfully than others</figcaption>
                    </figure>
                  }
                  quote="The people demanding that Argos be petted are not doing something new. They are doing what audiences have always done: asking an old story to speak to the feelings of the present."
                />
              </div>

              <p>Modern audiences do something different. We do not only watch Odysseus. We become him. We enter the scene emotionally, and once we have done that, walking past the dog feels almost impossible.</p>

              <p>Psychologists often describe this kind of absorption as narrative transportation: the process by which people become mentally and emotionally drawn into a story world. It is why we wince when a character is hurt, why fictional grief can produce real tears, and why the death of a dog on screen can feel almost personally unfair.</p>

              <div className={styles.sceneMobile}>
                <DogPoll
                  title="What do you think?"
                  question="Should he change the story so Argos gets head strokes?"
                  options={[
                    { label: "Yes, I love schmaltz", pct: 96, resultLabel: "Pet the dog", color: "green" },
                    { label: "No, stay true", pct: 4, resultLabel: "People with hearts of stone", color: "red" },
                  ]}
                  footnote="*Poll results independently verified by a panel of very good boys."
                />
              </div>

              <div className={styles.sceneMobile}>
                <InContextCard />
              </div>

              <p>That instinct has become much more visible in the age of social media. Audiences no longer wait silently for a story to happen to them. They talk back. They speculate, demand, dread and rewrite in real time. The Reddit users asking Nolan to pet the dog are doing what audiences have always done, only louder: asking an old story to answer a modern emotional need.</p>


              <p>Part of why that need is so strong is that the dog&apos;s position in our lives has changed so completely. Over the last century, and dramatically over the last few decades, the dog has moved from the yard to the house, from the house to the sofa, from the sofa to the bedroom. Dogs now have beds chosen for their joint health, food chosen for their digestion, coats chosen for cold mornings. We arrange our holidays around them. We grieve them publicly, with the same language we use for people, because the loss genuinely feels like the same kind of thing.</p>

              <p>The old contract &mdash; I keep you, you serve me &mdash; has been replaced by something closer to mutual love, and that love now feels like a moral obligation. When Odysseus walks past Argos without stopping, modern audiences feel it not as a tactical necessity but as a failure. That is the distance between Homer&apos;s world and ours.</p>

              <p>Which puts Nolan in an interesting position.</p>

              <p>He is adapting an ancient scene built on restraint for a modern audience that craves emotional acknowledgement. If Nolan allows Odysseus to acknowledge Argos more directly than Homer does, that is not simply sentimentality. It is cultural translation. Homer&apos;s Argos belongs to a world of hunting dogs, households, duty and restraint. Nolan&apos;s Argos belongs to an audience that sees an old dog and thinks: he should be comforted.</p>

              <p>And early discussion of the film suggests that Argos has not been treated as a disposable detail. Coverage of Nolan&apos;s adaptation notes that Argos appears in the film, and viewers have already singled out the dog scene as one of the moments that affected them most.</p>

              <p>Both versions can be true. But they tell us different things about dogs, and about ourselves.</p>

              <div className={`${styles.sceneMobile} ${styles.carouselScene}`}>
                <CaptionedCarousel
                  slides={[
                    {
                      src: "/history/odysseus-dog-argos-in-death.webp",
                      alt: "The death of Argos",
                      caption: "Argos maybe did not die of a broken heart, but he may have been holding on to life for his master",
                    },
                    {
                      src: "/history/nolans-king-odyssus.webp",
                      alt: "Nolan's Odysseus",
                      caption: "Odysseus probably has PTSD, as his core ideology of family, loyalty and legacy has been destroyed",
                    },
                    {
                      src: "/history/nolans-king-odyssus-painting-remake.jpg",
                      alt: "Odysseus painting remake",
                      caption: "When he fails to get the acknowledgment he needed, and with his colossal old age, he dies",
                    },
                    {
                      src: "/history/odyssusand-argos-painting-remake.jpg",
                      alt: "Odysseus and Argos painting remake",
                      caption: "A tale as old as time; a dog&apos;s love for their human. The original story, remade and remade",
                    },
                  ]}
                />
              </div>

              <p>There is an old literary argument, often associated with Roland Barthes, that once a work is released, it no longer belongs entirely to its author. Meaning is made and remade by readers. Homer has been dead for nearly three thousand years, and <em>The Odyssey</em> has belonged to singers, translators, teachers, readers, filmmakers and audiences ever since. The people demanding that Argos be petted are not doing something entirely new. They are doing what audiences have always done: asking an old story to speak to the feelings of the present.</p>

              <h2 className={styles.subhead}>How Homer wrote the most realistic dog in ancient literature</h2>

              <p>We cannot prove that Homer, or whoever shaped this part of the poem, was a dog owner in the modern sense. But it is very hard to read the Argos scene and not feel that it was written by someone who had watched dogs closely.</p>

              <p>Argos does not make a grand gesture. He does not speak. He does not perform some impossible feat. He does small, dog-like things. He lifts his head. He pricks his ears. He wags his tail. He recognises.</p>

              <p>That restraint is why the scene still works. The poem understands something every dog owner knows: a dog&apos;s recognition goes deeper than sight. Dogs read the world differently from us. They notice changes in posture, rhythm, emotional atmosphere and routine. They know when you are about to leave before you pick up your keys. They understand the difference between a playful voice and a tense one. And they live in a world thick with scent: identity, presence, absence, age, stress and memory that no costume can entirely erase.</p>

              <div className={`${styles.sceneMobile} ${styles.imageScene}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/history/agros-on-coins.png" alt="Argos depicted on ancient coins" loading="lazy" />
                <p className={styles.imageCaption}>Republican denarius serratus minted in 82 BC by the moneyer Gaius Mamilius Limetanus - a depiction of Odysseus and Argos, www.harneycoins.com</p>
              </div>

              <div className={styles.sceneMobile}>
                <BookFactsCard />
              </div>

              <p>A person changed by twenty years of war and sea-crossing can put on different clothes. But to a dog, identity is not only visual. Scent, movement, voice and old association may survive a disguise in ways human recognition cannot.</p>

              <p>Odysseus&apos;s appearance has changed. His status has changed. His clothes are false.</p>

              <p>Humans recognise status. Dogs recognise presence.</p>

              <p>That is why the returning soldier videos hit so hard online. A person comes home from deployment, changed by distance and time and experience. The dog does not understand war or politics. But it understands return, sometimes before the person is fully through the door.</p>

              <p>Argos does that in ancient form. He does not need Odysseus to explain. He does not need proof. He knows.</p>

              <div className={styles.sceneMobile}>
                <HomerCrossfade
                  header={
                    <>
                      <div style={{ padding: "16px 20px 4px" }}>
                        <p style={{ fontFamily: "var(--font-display)", fontSize: "27px", textAlign: "center", letterSpacing: "0.12em", color: "var(--yellow)", textTransform: "uppercase", margin: 0 }}>About Homer</p>
                      </div>
                      <div style={{ overflow: "hidden", position: "relative" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/history/homer-bust.jpeg" alt="Bust of Homer, Farnese collection, Naples" style={{ width: "100%", display: "block" }} />
                        <p style={{ position: "absolute", left: 12, right: 12, bottom: 8, fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 600, color: "var(--navy)", margin: 0 }}>Image: Bust of Homer, Farnese collection, Naples. Wikimedia Commons / CC BY-SA 4.0</p>
                      </div>
                      <div style={{ padding: "14px 20px 0" }}>
                        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 700, color: "#fff", marginBottom: 4 }}>Homer</p>
                        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 700, color: "var(--yellow)", marginBottom: 0 }}>c. 800–700 BCE · Ionia (western coast of modern Turkey)</p>
                      </div>
                    </>
                  }
                  history={
                    <>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 500, color: "#fff", lineHeight: 1.3, marginBottom: 10 }}>Homer is one of the great mysteries of literature. Almost nothing is known about him with certainty — not where he was born, not when he lived, not even whether he was one person or many. Some scholars believe the epics were composed by a single genius; others think they were assembled over generations of oral tradition.</p>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 500, color: "#fff", lineHeight: 1.3, marginBottom: 0 }}>Ancient tradition held that he was blind — a detail derived from a character in the Odyssey itself, a blind bard called Demodokos who sings of the Trojan War. He most likely came from Ionia and composed in an archaic Greek that became the model for all subsequent epic poetry.</p>
                    </>
                  }
                  works={
                    <>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--yellow)", marginBottom: 12 }}>Major Works</p>
                      {[
                        { title: "The Iliad", detail: "c. 750 BCE · 24 books · 15,693 lines", desc: "The Trojan War — the wrath of Achilles, the siege of Troy, the death of Hector. Where the Odyssey is about homecoming, the Iliad is about what war costs." },
                        { title: "The Odyssey", detail: "c. 700 BCE · 24 books · 12,109 lines", desc: "The journey home. Ten years of storms, monsters and gods. The poem that contains Argos." },
                      ].map(({ title, detail, desc }) => (
                        <div key={title} style={{ marginBottom: 14 }}>
                          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 700, color: "#fff", marginBottom: 2 }}>{title}</p>
                          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", fontWeight: 700, color: "var(--yellow)", marginBottom: 4, letterSpacing: "0.04em" }}>{detail}</p>
                          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 500, color: "#fff", lineHeight: 1.3 }}>{desc}</p>
                        </div>
                      ))}
                    </>
                  }
                />
              </div>

              <div className={styles.sceneMobile}>
                <LikelyOriginsCard />
              </div>

              <div className={`${styles.sceneMobile} ${styles.overlapNext}`} id="wwk-scene">
                <WhatWeKnowCard />
              </div>

              <div className={`${styles.sceneMobile} ${styles.parallaxScene} ${styles.tightBottom} ${styles.driftScene}`} id="harehound-scene">
                <div className={styles.parallaxImgWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/history/Greek-Harehound-photo.jpg" alt="Greek Harehound (Hellinikos Ichnilatis)" loading="lazy" id="hound-img" className={styles.driftImg} />
                </div>
                <div className={styles.parallaxContent}>
                  <LivingDescendantCard />
                </div>
              </div>

              <div className={`${styles.sceneMobile} ${styles.timelineScene} ${styles.tightTop}`} id="tl-scene">
                <p style={{ fontFamily: "var(--font-display)", fontSize: "27px", textAlign: "center", letterSpacing: "0.12em", color: "var(--yellow)", textTransform: "uppercase", margin: "0 0 18px" }}>Ancestral Lineage</p>
                <div className={styles.tlBody} id="tl-body">
                  <div className={styles.tlTrack} />
                  <div className={styles.tlFill} id="tl-fill" />
                {TIMELINE.map(({ era, name, context, highlight, end, isBreed, slug }) => (
                  <div key={"tl-" + era + name} data-tl-item className={styles.tlItem} style={{ display: "flex", gap: 14 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 16, flexShrink: 0 }}>
                      <div style={{
                        width: highlight ? 14 : isBreed ? 12 : 11,
                        height: highlight ? 14 : isBreed ? 12 : 11,
                        borderRadius: "50%",
                        background: isBreed ? "#22c55e" : highlight ? "var(--yellow)" : "#fff",
                        marginTop: 4,
                        flexShrink: 0,
                        boxShadow: highlight ? "0 0 0 3px rgba(255,210,62,0.3)" : "none",
                      }} />
                      {!end && <div style={{ width: 2, flex: 1, minHeight: 48 }} />}
                    </div>
                    <div style={{ paddingBottom: end ? 0 : 28 }}>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 700, color: "#fff", letterSpacing: "0.05em", marginBottom: 3, textTransform: "uppercase" }}>{era}</p>
                      {isBreed && slug ? (
                        <a href={"/chums/" + slug} style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 700, color: "#22c55e", textDecoration: "underline", textUnderlineOffset: "3px", display: "block", marginBottom: 4 }}>{name}</a>
                      ) : (
                        <p style={{ fontFamily: "var(--font-body)", fontSize: highlight ? "1rem" : "0.95rem", fontWeight: highlight ? 700 : 600, color: highlight ? "var(--yellow)" : "#fff", marginBottom: 4 }}>{name}</p>
                      )}
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 500, color: "#fff", lineHeight: 1.3 }}>{context}</p>
                    </div>
                  </div>
                ))}
                </div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 500, color: "#fff", lineHeight: 1.3, fontStyle: "italic", opacity: 0.85, margin: "20px 0 0", paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.2)" }}>{RESEARCH_NOTE}</p>
              </div>

              <GatedVideo>
              <figure style={{ margin: "0 0 32px", padding: 0 }}>
                <div id="smellofhome-video-wrap" style={{ width: "100%", position: "relative" }}>
                  <video
                    id="smellofhome-video"
                    src="/smellofhome-montage.mp4"
                    muted
                    playsInline
                    style={{ width: "100%", display: "block", borderRadius: "12px 12px 0 0" }}
                  />
                </div>
                <figcaption style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "1rem",
                  fontWeight: 600,
                  fontStyle: "italic",
                  color: "var(--yellow)",
                  background: "var(--navy)",
                  padding: "14px 20px",
                  borderRadius: "0 0 12px 12px",
                  lineHeight: 1.4,
                }}>
                  The dog doesn&apos;t live in the home. The dog is the home.
                </figcaption>
              </figure>
              </GatedVideo>

              <h2 className={styles.subhead}>The smell of home</h2>

              <p>Ask someone what home smells like and they will almost always be able to tell you. Not think about it. Tell you. Immediately, from somewhere that bypasses conscious thought entirely.</p>

              <p>For many people, that smell includes a dog.</p>

              <p>Not everyone welcomes this. There are people who notice dog smell the moment they step through a front door. To them it is intrusion: animal, persistent, worked into curtains, carpets and cushions.</p>

              <p>But for people who grew up with dogs, that same smell does something completely different. It opens a door. Not a metaphorical door, but a specific one, in a specific house, at a specific age. The smell of dog is the smell of Saturday mornings, school holidays, wet paws by the back door, warm fur, old blankets and a particular kind of safety that belongs almost entirely to childhood.</p>

              <p>People press their face into the fur of an old dog and inhale, not because the dog smells good exactly, but because the dog smells like home.</p>

              <p>This is not just sentimentality. It is biology.</p>

              <p>Smell has an unusually direct relationship with memory and emotion. Research into odour-evoked autobiographical memory, often called the Proust phenomenon, has shown that smells can trigger unusually vivid and emotional memories. Scientific reviews also describe the close relationship between olfaction and brain regions involved in memory and emotion, including the amygdala and hippocampus. A smell does not merely remind you of a memory. Sometimes it returns you to one, whole and unannounced, with the feeling already attached before you have had time to prepare.</p>

              <blockquote className={styles.pullquote}><span className={styles.pullquoteMark}>“</span>People press their face into the fur of an old dog and inhale, not because the dog smells good exactly, but because the dog smells like home.</blockquote>

              <p>That matters here because dogs live in scent in a way humans barely do. Dogs experience paths, people and homes through layers of smell: identity, time, stress, illness, direction, absence and presence. A path is not just a path. It is a recent history of who has passed, when, in what condition and in what direction.</p>

              <p>Argos belongs to that world.</p>

              <p>It is tempting to imagine him knowing Odysseus before Odysseus is fully visible. Whether through scent, movement, voice, or some mixture of all three, the dog recognises what the humans miss. The scent of his master, however changed by twenty years of sea, war and foreign places, would have meant something to him that no disguise could fully hide.</p>

              <p>That is the smell of home, arriving after twenty years. And for Argos, it is enough.</p>

              <h2 className={styles.subhead}>The dog as home</h2>

              <p>Argos is not just a dog at the house. In a way, Argos is the house.</p>

              <div className={`${styles.sceneMobile} ${styles.imageScene}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/dogsinthehome.jpg" alt="Dogs in the home" loading="lazy" />
              </div>

              <p>For people who grow up with dogs, home is not only a place. It is a set of sounds and sensations. Paws in the hallway. A bowl on the kitchen floor. The soft weight of a dog settling beside you. Wet paws by the back door. A dog bed tucked into a corner.</p>

              <p>Dogs alter the atmosphere of a home in a physical, audible, smellable way. They greet. They wait. They follow. They occupy the ordinary routes through the house. They are often the most consistent presence in a family: the one who is always there when everyone else leaves.</p>

              <p>A house with a dog in it has a quality of aliveness that a house without one lacks. Not noise exactly, though there is noise. Not mess exactly, though there is mess. Something more like the sense that the house is inhabited rather than merely occupied. Something in it is paying attention.</p>

              <p>Argos is all of that, compressed into a single moment. He is the physical proof that this was once a real home, with a man who raised a dog, knew his name and expected to return to him. That home has been hollowed out by twenty years of absence and occupation. The suitors have filled the palace, but they have not made it home. Argos, neglected and nearly gone, is still part of the old household. He is what remains of what Odysseus left behind.</p>

              <h2 className={styles.subhead}>A good household, and what it owes</h2>

              <p>Argos&apos;s condition when Odysseus finds him is not accidental. The neglect is a moral signal.</p>

              <p>He had once been a fine hunting dog. He had been raised well, by a man who valued him. Now he lies on dung, covered in fleas, outside the house that should have been his. The suitors eat at the tables. The suitors drink the wine. The suitors consume what belongs to others. Argos gets nothing.</p>

              <p>But there is something else worth sitting with here.</p>

              <p>Odysseus raised Argos. The bond was his. Without Odysseus, perhaps nobody felt that particular responsibility. The dog belonged to him, and in his absence, the dog seems to have belonged to nobody. Not the suitors, who had no reason to care. Perhaps not even the servants, who had their own survival to manage.</p>

              <p>This is what happens when the person who defines a household disappears. Things fall through the gap. Not always the large things. Penelope kept the estate, kept the suitors at bay, kept the kingdom waiting. But the small, specific things held together by one person&apos;s presence can quietly collapse. The dog your father raised. The garden he tended. The obligations that were his and only his, which nobody else thought to carry because they had not been the one to begin them.</p>

              <p>We see versions of this in every era. When the person who holds the centre of a household is absent, through death, distance or circumstance, certain threads go unmet. Not always out of malice. Sometimes out of the gap between what was his and what is anyone else&apos;s.</p>

              <p>Argos, lying in the dirt outside a palace that should have been his home, is its quietest proof. In a good household, you care for what belongs to it. This one did not. Argos shows that.</p>

              <h2 className={styles.subhead}>Dog loyalty is only half the story</h2>

              <p>That brings us to the more uncomfortable question: is this only a story about a dog&apos;s loyalty to a man, or is it also about what a man owes a dog?</p>

              <p>For most of history, humans have celebrated dogs for what they give us: loyalty, protection, service, companionship. The good dog is usually the dog who waits, obeys, returns, forgives, recognises. Argos is the archetype of all of it.</p>

              <p>But Argos also asks what we owe back.</p>

              <p>Odysseus has a reason for not going to him. He is inside a dangerous plan. Homer&apos;s version is true to that situation. It is also, for modern readers, painfully unsatisfying.</p>

              <p>Because the modern dog owner wants to say: go to him. Forget the suitors for one second. Sit with the dog.</p>

              <p>That reaction is not weakness. It is evidence of how completely our understanding of the bond has changed. To us, a dog is owed comfort. Especially an old dog. Especially at the end. We believe now, almost instinctively, that an elderly dog belongs somewhere warm, on a blanket, by the fire, beside the person it loves.</p>

              <p>That belief is relatively recent in the long history of dogs and people. For most of that history, dogs lived and died in conditions we would now find distressing, not always out of cruelty, but because the emotional contract was different. The dog was valued first for what it did, not for what it felt.</p>

              <p>What Argos quietly demands, for modern readers, is a question the ancient world never quite asked in the same way: what do we owe, in return, for that kind of love?</p>

              <h2 className={styles.subhead}>Why Argos couldn&apos;t really have lived twenty years &mdash; and why it matters</h2>

              <p>There is one more problem with Argos that is easy to overlook because the story is so moving.</p>

              <p>He waits twenty years.</p>

              <p>For a small terrier or toy breed, reaching eighteen or nineteen is rare but not impossible. For a large hunting dog, especially in the ancient world without modern veterinary care, pain relief, parasite control or senior diets, twenty years is almost certainly mythic. Argos would not have been a pampered senior dog carefully managed through his final years. He was a neglected working hound lying outside.</p>

              <p>Homer gives Argos twenty years because myth often measures goodness in impossible numbers. The longer the dog waits, the greater the loyalty appears. Argos becomes a good dog not only because he recognises Odysseus, but because he has survived impossibly long in order to do it.</p>

              <blockquote className={styles.pullquote}><span className={styles.pullquoteMark}>“</span>A dog does not have to live twenty years to prove loyalty. The goodness is not in the length of the life. It is in the bond.</blockquote>

              <p>Yet real dogs do not need impossible longevity to be good.</p>

              <p>A dog does not have to live twenty years to prove loyalty. It does not even have to live ten. A dog can be good for three years, five years, seven years, one afternoon. The goodness is not in the length of the life. It is in the bond.</p>

              <p>Argos&apos;s twenty years belong to myth. Real dogs prove themselves in smaller, daily ways: waiting at the door, learning our routines, forgiving our absences, greeting us as though we have returned from war when we have only been to Tesco.</p>

              <p>That is the everyday version of Argos. Less epic, perhaps, but no less true.</p>

              <h2 className={styles.subhead}>Did Argos die of a broken heart? The answer is more surprising</h2>

              <p>It is tempting to say yes. It feels right. The dog has waited twenty years, sees Odysseus, and dies.</p>

              <p>But the better answer is more subtle.</p>

              <p>Argos does not die because Odysseus fails to love him. Odysseus does love him. That is why he hides his tears. Argos does not die because the reunion goes wrong. He dies because the waiting is over.</p>

              <p>His final task is recognition.</p>

              <p>Once he has seen Odysseus, once he has known him, once he has confirmed that the man beneath the disguise is still the man who left, Argos can go. In a story full of monsters, storms, gods, violence and tricks, the dog&apos;s gift is simple.</p>

              <p>He knows who has come home. That is not a broken heart. That is a completed one.</p>

              <h2 className={styles.subhead}>Why Argos still matters</h2>

              <p>Argos is famous because he waits. But that is only the surface of the story.</p>

              <p>He matters because he recognises what humans miss. He matters because he turns a palace back into a home. He matters because his neglected body shows the damage done by Odysseus&apos;s absence. He matters because he asks whether loyalty should travel both ways. He matters because his impossible age reminds us that myth often makes dogs prove goodness by suffering too long. He matters because he shows, quietly and without judgement, what falls apart when the person who holds something together is gone.</p>

              <p>And now, with Nolan returning Argos to the screen, the scene belongs to another generation of dog lovers entirely. People are not waiting for the Argos scene because he is a plot point. They are waiting because they know what an old dog means.</p>

              <p>That says everything.</p>

              <p>Argos appears for a moment, but he carries the whole idea of home. He is the dog at the door. The smell in the hallway. The one who knows your step. The first to greet you. The first to miss you. The one who remembers who you were before the world got to you.</p>

              <p>Homer may have written an epic about war, gods, monsters and kings. But in Argos, he also wrote one of the oldest truths about dogs.</p>

              <p>A dog does not need you to look like yourself. A dog does not need your status restored. A dog does not need the world to know who you are.</p>


            </div>
          </article>

          {/* ── Custom Argos sidebar ── */}
          <aside className={styles.sidebar}>

            {/* Card 1: Editor's note */}
            <div className={styles.sidebarOnly}><EditorsNoteCard /></div>

            {/* Card 2: Identity */}
            <div className={styles.sidebarOnly}><ArgosIdentityCard /></div>

            {/* Card 3: The Odyssey book facts */}
            <div className={styles.sidebarOnly}><BookFactsCard /></div>

            {/* Card 4: Nolan film */}
            <div className={styles.sidebarOnly}><NolanFilmCard /></div>

            {/* Card 5: About Homer */}
            <div className={styles.sidebarOnly}><AboutHomerCard /></div>

            {/* Card 6: Likely Origins */}
            <div className={styles.sidebarOnly}><LikelyOriginsCard /></div>

            {/* Card 7: Estimated Size */}
            <div className={styles.sidebarOnly}><EstimatedSizeCard /></div>

            {/* Card 8: Build & Appearance */}
            <div className={styles.sidebarOnly}><BuildAppearanceCard /></div>

            {/* Card 9: In Context */}
            <div className={styles.sidebarOnly}><InContextCard /></div>

            {/* Card 10: Ancestral Lineage -- extended and enriched */}
            <div className={styles.sidebarOnly}>
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 4px" }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "27px", textAlign: "center", letterSpacing: "0.12em", color: "var(--yellow)", textTransform: "uppercase", margin: 0 }}>Ancestral Lineage</p>
              </div>
              <div style={{ padding: "10px 20px 16px" }}>
                {TIMELINE.map(({ era, name, context, highlight, end, isBreed, slug }, i) => (
                  <div key={era + name} style={{ display: "flex", gap: 14 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 16, flexShrink: 0 }}>
                      <div style={{
                        width: highlight ? 14 : isBreed ? 12 : 11,
                        height: highlight ? 14 : isBreed ? 12 : 11,
                        borderRadius: "50%",
                        background: isBreed ? "#22c55e" : highlight ? "var(--yellow)" : "#fff",
                        marginTop: 4,
                        flexShrink: 0,
                        boxShadow: highlight ? "0 0 0 3px rgba(255,210,62,0.3)" : "none",
                      }} />
                      {!end && <div style={{ width: 2, flex: 1, background: "rgba(255,255,255,0.3)", minHeight: 64 }} />}
                    </div>
                    <div style={{ paddingBottom: end ? 0 : 36 }}>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 700, color: "#fff", letterSpacing: "0.05em", marginBottom: 3, textTransform: "uppercase" }}>{era}</p>
                      {isBreed && slug ? (
                        <a href={"/chums/" + slug} style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 700, color: "#22c55e", textDecoration: "underline", textUnderlineOffset: "3px", display: "block", marginBottom: 4 }}>{name}</a>
                      ) : (
                        <p style={{ fontFamily: "var(--font-body)", fontSize: highlight ? "1rem" : "0.95rem", fontWeight: highlight ? 700 : 600, color: highlight ? "var(--yellow)" : "#fff", marginBottom: 4 }}>{name}</p>
                      )}
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 500, color: "#fff", lineHeight: 1.3 }}>{context}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </div>

            {/* Card 11: Research note */}
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", fontWeight: 500, color: "#fff", lineHeight: 1.3, fontStyle: "italic" }}>{RESEARCH_NOTE}</p>
              </div>
            </div>

            {/* Card 12: What We Know */}
            <div className={styles.sidebarOnly}><WhatWeKnowCard /></div>

            {/* Card 13: Living Descendant */}
            <div className={styles.sidebarOnly}><LivingDescendantCard showImage /></div>

            {/* Card 14: Penelope's Dream */}
            <div className={styles.sidebarOnly}>
            <div className={styles.sidebarCard}>
              <div style={{ padding: "16px 20px 4px" }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "27px", textAlign: "center", letterSpacing: "0.12em", color: "var(--yellow)", textTransform: "uppercase", margin: 0 }}>Penelope&apos;s Dream</p>
              </div>
              <div style={{ padding: "12px 20px 16px" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 500, color: "#fff", lineHeight: 1.3, marginBottom: 10 }}>While Argos waited outside, Penelope was inside the palace doing something that tends to get overlooked: she kept a flock of twenty geese. She fed them, watched them, and told the disguised Odysseus, &ldquo;I love to watch them.&rdquo;</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 500, color: "#fff", lineHeight: 1.3, marginBottom: 10 }}>The night before Odysseus&apos;s return, she dreamed that an eagle descended and killed all twenty geese. She wept in the dream — grieving the geese even after being told it meant good news, that the eagle was Odysseus and the geese were the suitors.</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 500, color: "#fff", lineHeight: 1.3, marginBottom: 14 }}>Scholars have argued the geese represent the twenty years of waiting itself. Their death in the dream is the moment the holding-together finally breaks open. But Penelope wept for them as creatures, not symbols. She loved watching them.</p>
                <div style={{ borderLeft: "3px solid var(--yellow)", paddingLeft: 14 }}>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "1rem", fontWeight: 500, color: "#fff", lineHeight: 1.3, fontStyle: "italic" }}>Argos and Penelope&apos;s geese are not the same thing, but they belong to the same household of feeling. In a poem full of gods and violence, they are the small, living things that make a home a home.</p>
                </div>
              </div>
            </div>
            </div>



          </aside>
        </div>

        {/* ── Verdict -- full bleed ── */}
        <div className={styles.verdict}>
          <strong>The verdict:</strong> A dog knows. And sometimes, after twenty years of storms and blood and distance, that is what finally makes a man home.
        </div>
        <script dangerouslySetInnerHTML={{ __html: `(function(){
          var scene = document.getElementById('tl-scene');
          if (!scene || !('IntersectionObserver' in window)) return;
          scene.className += ' tl-js';
          var items = scene.querySelectorAll('[data-tl-item]');
          var tlBody = document.getElementById('tl-body');
          var fill = document.getElementById('tl-fill');
          var wwk = document.getElementById('wwk-scene');
          var hound = document.getElementById('harehound-scene');
          var tick = false;
          function update() {
            tick = false;
            var vh = window.innerHeight;
            /* entries fade continuously: alpha 0 at the bottom edge of the
               viewport, fully solid by halfway up -- both scroll directions */
            items.forEach(function(el){
              var t = el.getBoundingClientRect().top;
              var o = (vh - t) / (vh * 0.5);
              if (o < 0) o = 0;
              if (o > 1) o = 1;
              el.style.opacity = o;
            });
            /* the yellow spine grows with scroll progress through the timeline */
            if (tlBody && fill) {
              var r = tlBody.getBoundingClientRect();
              var pct = (vh * 0.62 - r.top) / r.height;
              if (pct < 0) pct = 0;
              if (pct > 1) pct = 1;
              fill.style.height = (pct * 100) + '%';
            }
            /* Argos identity card pops in the moment the video pins */
            var mfScene = document.getElementById('menuflash-scene');
            var mfCard = document.getElementById('menu-card');
            if (mfScene && mfCard) {
              if (mfScene.getBoundingClientRect().top <= 0) {
                if (mfCard.className.indexOf('mf-show') < 0) mfCard.className += ' mf-show';
              }
            }
            /* What We Know nudges gently down onto the harehound image */
            if (hound) {
              var hr = hound.getBoundingClientRect();
              /* card nudge: paced by the scene entering the viewport */
              var np = (vh - hr.top) / vh;
              if (np < 0) np = 0;
              if (np > 1) np = 1;
              if (wwk) wwk.style.transform = 'translateY(' + (np * 10) + 'px)';
              /* image drift: paced by the PIN window only, so the pan happens
                 while the reader is actually looking at the pinned image */
              var pin = (hr.height > vh) ? (-hr.top) / (hr.height - vh) : 0;
              if (pin < 0) pin = 0;
              if (pin > 1) pin = 1;
              var hi = document.getElementById('hound-img');
              if (hi) hi.style.transform = 'translateY(' + (-(12 + pin * 20)) + '%)';
            }
          }
          window.addEventListener('scroll', function(){
            if (!tick) { tick = true; requestAnimationFrame(update); }
          }, { passive: true });
          update();
        })();` }} />
      </main>
      <Footer />
    </>
  );
}
