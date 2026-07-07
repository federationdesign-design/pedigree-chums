import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { breeds } from "../../../data/breeds";

type Props = { params: { slug: string } };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const breed = breeds.find((b) => b.slug === params.slug);
  return { title: breed ? `${breed.name} — Pedigree Chums` : "Not found" };
}

export default function BreedPage({ params }: Props) {
  const breed = breeds.find((b) => b.slug === params.slug);
  if (!breed) return notFound();
  return <h1 style={{ color: "white", background: "#0a3a57", minHeight: "100vh", padding: 40 }}>{breed.name}</h1>;
}
