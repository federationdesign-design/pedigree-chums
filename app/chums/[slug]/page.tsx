"use client";
import { use } from "react";
import Footer from "../../../components/Footer/Footer";
import Nav from "../../../components/Nav/Nav";
import BreedClient from "./BreedClient";
import { breeds } from "../../../data/breeds";
import { getLineage } from "../../../data/lineage";
import { resolveLineageName } from "../../../data/lineageNames";
import breedInfo from "../../../data/breed-info.json";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export default function BreedPage({ params }: Props) {
  const { slug } = use(params);
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
  return (
    <>
      <Nav showLogo />
      <BreedClient
        name={breed.name}
        slug={breed.slug}
        image={breed.image}
        info={info}
        lineage={lineage}
      />
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, display: "none" }} id="breed-footer"></div><div style={{ width: "100vw", marginLeft: "calc(-1 * ((100vw - 100%) / 2))", boxSizing: "border-box" }}><Footer /></div>
    </>
  );
}
