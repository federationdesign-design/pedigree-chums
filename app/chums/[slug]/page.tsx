import { use } from "react";
import { breeds } from "../../../data/breeds";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export default function BreedPage({ params }: Props) {
  const { slug } = use(params);
  const breed = breeds.find((b) => b.slug === slug);
  return (
    <div style={{ color: "white", background: "#0a3a57", minHeight: "100vh", padding: 40 }}>
      <h1>Slug: {slug}</h1>
      <h2>Breed found: {breed ? breed.name : "NOT FOUND"}</h2>
      <h2>Total breeds: {breeds.length}</h2>
    </div>
  );
}
