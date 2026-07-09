import { headers } from "next/headers";
import Nav from "../../../components/Nav/Nav";
import BreedClient from "./BreedClient";
import BreedMobile from "./BreedMobile";
import { breeds } from "../../../data/breeds";
import { getLineage } from "../../../data/lineage";
import { resolveLineageName } from "../../../data/lineageNames";
import breedInfo from "../../../data/breed-info.json";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

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

  const breedProps = {
    size: breed.size,
    weight: breed.weight,
    coatLength: breed.coatLength,
    coatColour: breed.coatColour,
    lookFor: breed.lookFor,
    character: breed.character,
  };

  return (
    <>
      <Nav showLogo />
      {mobile ? (
        <BreedMobile
          name={breed.name}
          slug={breed.slug}
          image={breed.image}
          info={info}
          lineage={lineage}
          breed={breedProps}
        />
      ) : (
        <BreedClient
          name={breed.name}
          slug={breed.slug}
          image={breed.image}
          info={info}
          lineage={lineage}
        />
      )}
    </>
  );
}
