import type { Metadata } from "next";
import { headers } from "next/headers";
import Nav from "../../../components/Nav/Nav";
// D77 full replacement: /chums renders the CHUMS2 experience for all viewports. The old
// BreedClient / BreedMobile are now unimported on this route (kept on disk for a later
// cleanup round). Desktop -> Chums2Client; mobile -> Chums2Mobile (stage 1). The chums2
// noindex does NOT travel: it lives in /chums2's generateMetadata, not the component, so
// /chums keeps its own indexable title below.
import Chums2Client from "../../chums2/[slug]/Chums2Client";
import Chums2Mobile from "../../chums2/[slug]/Chums2Mobile";
import { breeds } from "../../../data/breeds";
import { getLineage } from "../../../data/lineage";
import { resolveLineageName } from "../../../data/lineageNames";
import breedInfo from "../../../data/breed-info.json";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

// Per-breed <title> so each of the 54 breed pages is uniquely named (WCAG 2.4.2),
// e.g. "Irish Wolfhound | Pedigree Chums™ The Dog Bingo Game". The site suffix is
// supplied by the root layout's title template.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const breed = breeds.find((b) => b.slug === slug);
  return { title: breed ? breed.name : "Chum Not Found" };
}

function isMobileUA(ua: string): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua);
}

export default async function BreedPage({ params }: Props) {
  const { slug } = await params;
  const breed = breeds.find((b) => b.slug === slug);
  if (!breed) return <h1 style={{color:"white",background:"#0a3a57",padding:40}}>Not found: {slug}</h1>;

  const info = (breedInfo as Record<string, {
    subtitle: string;
    temperament: string[];
    pros: string[];
    cons: string[];
  }>)[breed.name] ?? { subtitle: "", temperament: [], pros: [], cons: [] };

  let lineage = null;
  try { lineage = getLineage(resolveLineageName(breed.name)) ?? null; } catch {}

  const headersList = await headers();
  const ua = headersList.get("user-agent") ?? "";
  const mobile = isMobileUA(ua);

  // The same viewport split as the old page, now feeding the chums2 components. ?diag/
  // ?audit are dropped on this route (audit is retired; the diag isolation rig stays on
  // /chums2). data-pc-chums2 + its scoped globals key off the COMPONENT (set by Chums2
  // Client's mount effect), so they apply when mounted from here too.
  return (
    <>
      <Nav showLogo />
      {mobile ? (
        <Chums2Mobile
          name={breed.name}
          slug={breed.slug}
          image={breed.image}
          info={info}
          lineage={lineage}
          character={breed.character}
        />
      ) : (
        <Chums2Client
          name={breed.name}
          slug={breed.slug}
          image={breed.image}
          info={info}
          lineage={lineage}
          character={breed.character}
        />
      )}
    </>
  );
}
