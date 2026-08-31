import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../../../../components/Nav/Nav";
import Footer from "../../../../components/Footer/Footer";
import { decodeSharedPodium, type PodiumEntry } from "../../shareLink";
import ShareLinkButton from "../../ShareLinkButton";
import { podiumArtFor } from "../../podiumArt";

/* NG-SHARE-2, 30 Aug 2026. Landing page for a shared knockout podium.

   This is the share that matters. The single-name route at ../../n is the
   reveal card; this one is the result of the whole knockout, which is what
   people actually want to pass round.

   noindex, same reasoning as the single-name route: every share mints a unique
   URL, and thousands of near-identical machine-generated pages would cost the
   site more than they earned. If that is ever reversed the sitemap changes too.

   Server component. Nothing here is interactive except two links, so a
   recipient does not download the knockout bundle. */

const MEDALS = ["1st", "2nd", "3rd"];

type Props = { params: Promise<{ c: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { c } = await params;
  const data = decodeSharedPodium(c);
  if (!data) return { title: "Shared podium", robots: { index: false, follow: true } };
  const winner = data.places[0];
  const shown = winner.k ? `${winner.k} (${winner.f})` : winner.f;
  return {
    title: `${shown} wins`,
    description: data.b
      ? `A ${data.b} called ${shown} won the knockout. Name your own dog at Pedigree Chums.`
      : `${shown} won the knockout. Name your own dog at Pedigree Chums.`,
    robots: { index: false, follow: true },
  };
}

export default async function SharedPodiumPage({ params }: Props) {
  const { c } = await params;
  const data = decodeSharedPodium(c);

  if (!data) {
    return (
      <>
        <Nav />
        <main style={{ padding: "clamp(120px,16vw,200px) clamp(16px,5vw,48px) 80px", textAlign: "center" }}>
          <h1 className="display" style={{ fontSize: "clamp(2rem,7vw,3.5rem)", color: "#ffffff", marginBottom: 16 }}>
            <span className="display-yellow">That link</span><br />did not work
          </h1>
          <p style={{ color: "#ffffff", fontFamily: "var(--font-body)", fontSize: "1.05rem", fontWeight: 600, marginBottom: 28 }}>
            It may have been cut short somewhere along the way. You can still run your own knockout.
          </p>
          <Link href="/name-generator" style={startBtn}>Start a new name</Link>
        </main>
        <Footer />
      </>
    );
  }

  // Falls back to /name-podium.jpg exactly as the knockout canvas does, which is
  // what covers Weimaraner, Dalmatian and Poodle until their art exists.
  const art = (data.b && podiumArtFor(data.b)) || "/name-podium.jpg";

  return (
    <>
      <Nav />
      <main style={{ padding: "clamp(100px,14vw,160px) clamp(16px,5vw,48px) 60px", maxWidth: 760, margin: "0 auto" }}>
        <p style={{ textAlign: "center", color: "#ffffff", fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14, opacity: 0.9 }}>
          {data.b ? `Somebody named a ${data.b}` : "Somebody named a dog"}
        </p>

        <div style={{ background: "linear-gradient(to top right, #00e2ff, #008eff)", borderRadius: 40, padding: "clamp(24px,4vw,40px)", boxShadow: "0 18px 40px rgba(10,58,87,0.28)", marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={art} alt="" style={{ width: "clamp(200px,52vw,380px)", height: "auto", borderRadius: 18, display: "block", filter: "drop-shadow(0 8px 24px rgba(10,58,87,0.28))" }} />
          </div>

          {data.places.map((p: PodiumEntry, i: number) => (
            <div key={p.f + i} style={{ textAlign: "center", marginBottom: i === 0 ? 22 : 14 }}>
              <div style={{ fontFamily: "var(--font-body)", fontWeight: 800, fontSize: i === 0 ? "1rem" : "0.82rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--navy)", marginBottom: 4, opacity: i === 0 ? 1 : 0.75 }}>
                {MEDALS[i]}
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: i === 0 ? "clamp(2rem,8vw,3.2rem)" : "clamp(1.2rem,4vw,1.8rem)", color: "#fff", lineHeight: 1, letterSpacing: "0.01em", textShadow: "0 2px 12px rgba(10,58,87,0.3)" }}>
                {p.k || p.f}
              </div>
              {p.k && (
                <div style={{ fontSize: i === 0 ? "clamp(0.85rem,2.5vw,1.05rem)" : "0.8rem", color: "var(--navy)", fontFamily: "var(--font-body)", fontWeight: 700, marginTop: 6, letterSpacing: "0.01em" }}>
                  {p.f}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
          <Link href="/name-generator" style={startBtn}>Start a new name</Link>
          <ShareLinkButton label="Share this podium" />
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
