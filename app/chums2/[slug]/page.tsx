import type { Metadata } from "next";
import Nav from "../../../components/Nav/Nav";
import Chums2Client from "./Chums2Client";
import { breeds } from "../../../data/breeds";
import { getLineage } from "../../../data/lineage";
import { resolveLineageName } from "../../../data/lineageNames";
import breedInfo from "../../../data/breed-info.json";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ diag?: string; audit?: string }> };

export const dynamic = "force-dynamic";

// Per-breed <title>, same pattern as the live /chums page.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const breed = breeds.find((b) => b.slug === slug);
  return {
    title: breed ? breed.name : "Chum Not Found",
    // V2 is a working draft alongside the live /chums page. It must not be
    // indexed while both exist, or the two compete for the same queries.
    // Precedent: app/britains-dog-history-2/page.tsx. (Decision D2.)
    robots: "noindex",
  };
}

export default async function Chum2Page({ params, searchParams }: Props) {
  const { slug } = await params;
  // ?diag=1 isolation rig (D46): read on the server so the client renders the diagram
  // -only view from the first paint (no hydration flip), and so the shared <Nav> can
  // simply be left out rather than hidden after mount.
  const { diag: diagParam, audit: auditParam } = await searchParams;
  const diag = diagParam === "1";
  // ?audit=1 (TEMPORARY, REMOVE BEFORE COMMIT once the gutter fit lands): dev-only
  // on-screen gutter measurement. Read on the server like diag, passed as a prop.
  const audit = auditParam === "1";
  const breed = breeds.find((b) => b.slug === slug);
  if (!breed) return <h1 style={{ color: "white", background: "#0a3a57", padding: 40 }}>Not found: {slug}</h1>;

  const info = (breedInfo as Record<string, {
    subtitle: string;
    temperament: string[];
    pros: string[];
    cons: string[];
  }>)[breed.name] ?? { subtitle: "", temperament: [], pros: [], cons: [] };

  let lineage = null;
  try { lineage = getLineage(resolveLineageName(breed.name)) ?? null; } catch {}

  // Desktop only (brief: mobile comes later, do not touch BreedMobile). No UA
  // branch: the desktop client renders for every UA on /chums2. (Decision D1.)
  return (
    <>
      {/* ?diag=1 (D46): drop the shared nav entirely so the isolation rig is only the
          diagram. Normal route keeps the nav. */}
      {!diag && <Nav showLogo />}
      <Chums2Client
        name={breed.name}
        slug={breed.slug}
        image={breed.image}
        info={info}
        lineage={lineage}
        character={breed.character}
        diag={diag}
        audit={audit}
      />
    </>
  );
}
