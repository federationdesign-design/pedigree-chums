"use client";
import { use } from "react";
import { breeds } from "../../../data/breeds";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export default function BreedPage({ params }: Props) {
  const { slug } = use(params);
  const breed = breeds.find((b) => b.slug === slug);
  if (!breed) return <h1 style={{color:"white",background:"#0a3a57",padding:40}}>Not found: {slug}</h1>;
  return <h1 style={{color:"white",background:"#0a3a57",minHeight:"100vh",padding:40}}>{breed.name} — page works</h1>;
}
