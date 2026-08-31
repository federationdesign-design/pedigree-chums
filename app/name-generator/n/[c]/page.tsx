import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../../../../components/Nav/Nav";
import Footer from "../../../../components/Footer/Footer";
import { decodeSharedName } from "../../shareLink";
import ShareLinkButton from "../../ShareLinkButton";

/* NG-SHARE-1, 29 Aug 2026. The landing page for a shared name.

   Someone shares a name, the recipient opens the link, and lands on the exact
   card that was shared with a button to go and make their own. Before this, a
   share carried only the bare homepage URL.

   Deliberately noindex: every share mints a unique URL, so left open this route
   would put thousands of near-identical machine-generated pages in front of
   Google, which is textbook thin content and would cost the site more than it
   earned. Agreed with Steve 29 Aug 2026. If that is ever reversed, the sitemap
   needs to change too.

   Server component on purpose. Nothing here is interactive except one link, so
   there is no reason to ship the generator's client bundle to a visitor who has
   not asked for it. */

const CARD_IMAGE: Record<string, string> = {
  "Afghan Hound": "/afghan-card.jpg",
  "Basset Hound": "/basset-card.jpg",
  "Beagle": "/beagle-card.jpg",
  "Bichon Frise": "/bichon-card.jpg",
  "Bloodhound": "/bloodhound-card.jpg",
  "Border Collie": "/collie-card.jpg",
  "Border Terrier": "/border-terrier-card.jpg",
  "Boston Terrier": "/boston-card.jpg",
  "Boxer": "/boxer-card.jpg",
  "Bull Terrier": "/bull-terrier-card.jpg",
  "Bulldog": "/bulldog-card.jpg",
  "Cavalier King Charles Spaniel": "/cavalier-card.jpg",
  "Cavachon": "/cavachon-card.jpg",
  "Cavapoo": "/cavapoo-card.jpg",
  "Chihuahua": "/chihuahua-card.jpg",
  "Cocker Spaniel": "/cocker-card.jpg",
  "Cockapoo": "/cockapoo-card.jpg",
  "Corgi": "/corgi-card.jpg",
  "Dachshund": "/dachshund-card.jpg",
  "Dalmatian": "/dalmation-card.jpg",
  "Doberman Pinscher": "/doberman-card.jpg",
  "French Bulldog": "/french-bulldog-card.jpg",
  "German Shepherd": "/german-sheperd-card.jpg",
  "Golden Retriever": "/golden-retriever-card.jpg",
  "Goldendoodle": "/goldendoodle-card.jpg",
  "Great Dane": "/great-dane-card.jpg",
  "Greyhound": "/greyhound-card.jpg",
  "Irish Setter": "/setter-card.jpg",
  "Irish Wolfhound": "/irish-wolfhound-card.jpg",
  "Italian Greyhound": "/italian-card.jpg",
  "Jack Russell Terrier": "/jack-russel-card.jpg",
  "Jackapoo": "/jackapoo-card.jpg",
  "Labrador": "/lab-card.jpg",
  "Labradoodle": "/labradoodle-card.jpg",
  "Lurcher": "/lurcher-card.jpg",
  "Maltese": "/maltese-card.jpg",
  "Maltipoo": "/maltipoo-card.jpg",
  "Mastiff": "/mastiff-card.jpg",
  "Miniature Schnauzer": "/scnauzer-card.jpg",
  "Old English Sheepdog": "/old-english-card.jpg",
  "Papillon": "/papillion-card.jpg",
  "Pomeranian": "/pomeranian-card.jpg",
  "Poodle": "/poodle-card.jpg",
  "Pug": "/pug-card.jpg",
  "Rottweiler": "/rottweiler-card.jpg",
  "Saint Bernard": "/st-bernard-card.jpg",
  "Shih Tzu": "/shuh-tzu-card.jpg",
  "Siberian Husky": "/husky-card.jpg",
  "Springer Spaniel": "/springer-card.jpg",
  "Staffordshire Bull Terrier": "/staffy-card.jpg",
  "Weimaraner": "/weinaraner-card.jpg",
  "West Highland Terrier": "/west-highland-card.jpg",
  "Whippet": "/whippet-card.jpg",
  "Yorkshire Terrier": "/yorkshire-card.jpg"
};

type Props = { params: Promise<{ c: string }> };

/* Per-name title and description. Without this the link previews the site-wide
   default, so a shared dog reads as "The ultimate on-the-go dog spotting game"
   with no mention of the name. The OG image itself comes next. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { c } = await params;
  const data = decodeSharedName(c);
  if (!data) {
    return { title: "Shared name", robots: { index: false, follow: true } };
  }
  const shown = data.k ? `${data.k} (${data.f})` : data.f;
  return {
    title: shown,
    description: data.b
      ? `A ${data.b} named ${shown}. Make your own dog name at Pedigree Chums.`
      : `${shown}. Make your own dog name at Pedigree Chums.`,
    robots: { index: false, follow: true },
    openGraph: {
      title: shown,
      description: data.b ? `A ${data.b}, named by somebody at Pedigree Chums.` : "Named at Pedigree Chums.",
    },
  };
}

export default async function SharedNamePage({ params }: Props) {
  const { c } = await params;
  const data = decodeSharedName(c);

  if (!data) {
    return (
      <>
        <Nav />
        <main style={{ padding: "clamp(120px,16vw,200px) clamp(16px,5vw,48px) 80px", textAlign: "center" }}>
          <h1 className="display" style={{ fontSize: "clamp(2rem,7vw,3.5rem)", color: "#ffffff", marginBottom: 16 }}>
            <span className="display-yellow">That link</span><br />did not work
          </h1>
          <p style={{ color: "#ffffff", fontFamily: "var(--font-body)", fontSize: "1.05rem", fontWeight: 600, marginBottom: 28 }}>
            It may have been cut short somewhere along the way. You can still make your own.
          </p>
          <Link href="/name-generator" style={startBtn}>Start a new name</Link>
        </main>
        <Footer />
      </>
    );
  }

  const cardImg = data.b ? CARD_IMAGE[data.b] ?? null : null;

  return (
    <>
      <Nav />
      <main style={{ padding: "clamp(100px,14vw,160px) clamp(16px,5vw,48px) 60px", maxWidth: 760, margin: "0 auto" }}>
        <p style={{ textAlign: "center", color: "#ffffff", fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14, opacity: 0.9 }}>
          Somebody named a dog
        </p>

        {/* Same card as the generator's reveal card, minus the three action
            buttons, which have nothing to act on here. */}
        <div style={{ position: "relative", background: "linear-gradient(to top right, #00e2ff, #008eff)", borderRadius: 40, padding: "clamp(24px,4vw,40px)", boxShadow: "0 18px 40px rgba(10,58,87,0.28)", marginBottom: 28 }}>
          {/* The generator positions this card absolutely and then hides it on
              desktop (page.tsx line 2663). Copying the positioning without the
              hiding rule put it straight over the name and the reasoning. Here it
              sits in the flow above the name instead, so it cannot overlap at any
              width and it stays visible on desktop, which is the point of a shared
              card. Fixed 30 Aug 2026. */}
          {cardImg && (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cardImg} alt={data.b} style={{ width: "clamp(150px,34vw,240px)", height: "auto", borderRadius: 14, display: "block", transform: "rotate(2deg)", filter: "drop-shadow(0 8px 24px rgba(10,58,87,0.28))" }} />
            </div>
          )}

          {data.b && (
            <div style={{ marginBottom: 16, textAlign: "center" }}>
              <span style={{ fontFamily: "var(--font-body), sans-serif", fontWeight: 800, fontSize: "clamp(0.82rem,2.5vw,1.17rem)", color: "var(--navy)", letterSpacing: "0.01em", lineHeight: 1 }}>({data.b})</span>
            </div>
          )}

          {data.k ? (
            <>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem,8vw,3.2rem)", color: "#fff", lineHeight: 1, letterSpacing: "0.01em", textAlign: "center", textShadow: "0 2px 12px rgba(10,58,87,0.3)", marginTop: 8, marginBottom: 10 }}>
                {data.k}
              </div>
              <div style={{ fontSize: "clamp(0.85rem,2.5vw,1.05rem)", color: "var(--navy)", fontFamily: "var(--font-body)", fontWeight: 700, textAlign: "center", marginBottom: 16, letterSpacing: "0.01em" }}>
                {data.f}
              </div>
            </>
          ) : (
            <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem,5vw,2.4rem)", color: "#fff", lineHeight: 1.1, letterSpacing: "0.01em", textAlign: "center", textShadow: "0 2px 12px rgba(10,58,87,0.3)", marginTop: 8, marginBottom: 16 }}>
              {data.f}
            </div>
          )}

        </div>

        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
          <Link href="/name-generator" style={startBtn}>Start a new name</Link>
          <ShareLinkButton label="Share this name" />
        </div>
      </main>
      <Footer />
    </>
  );
}

const startBtn: React.CSSProperties = {
  display: "inline-block",
  background: "var(--ng-lemon, #ffed00)",
  color: "var(--navy)",
  fontFamily: "var(--font-display,'Luckiest Guy',cursive)",
  fontSize: "1.3rem",
  letterSpacing: "0.04em",
  textDecoration: "none",
  borderRadius: 999,
  padding: "18px 44px",
  boxShadow: "0 6px 0 rgba(10,58,87,0.35)",
};
