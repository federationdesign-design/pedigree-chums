import { use } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Nav from "../../../components/Nav/Nav";
import BreedClient from "./BreedClient";
import { breeds } from "../../../data/breeds";
import { getLineage } from "../../../data/lineage";
import { resolveLineageName } from "../../../data/lineageNames";
import breedInfo from "../../../data/breed-info.json";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = use(params);
  const breed = breeds.find((b) => b.slug === slug);
  if (!breed) return {};
  const info = (breedInfo as Record<string, { subtitle: string }>)[breed.name];
  return {
    title: `${breed.name} — Pedigree Chums`,
    description: info?.subtitle
      ? `${breed.name}: ${info.subtitle}. Discover the family tree, temperament, and history.`
      : `Discover the ${breed.name} on Pedigree Chums — family tree, temperament, pros and cons.`,
  };
}

export default function BreedPage({ params }: Props) {
  const { slug } = use(params);
  const breed = breeds.find((b) => b.slug === slug);
  if (!breed) return notFound();

  const info = (breedInfo as Record<string, {
    subtitle: string;
    temperament: string[];
    pros: string[];
    cons: string[];
  }>)[breed.name] ?? {
    subtitle: "",
    temperament: [],
    pros: [],
    cons: [],
  };

  const lineageName = resolveLineageName(breed.name);
  const lineage = getLineage(lineageName) ?? null;

  return (
    <>
      <Nav />
      <BreedClient
        name={breed.name}
        slug={breed.slug}
        image={breed.image}
        info={info}
        lineage={lineage}
      />
    </>
  );
}
