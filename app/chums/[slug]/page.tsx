import { breeds } from "../../../data/breeds";

type Props = { params: { slug: string } };

export const dynamic = "force-dynamic";

export default function BreedPage({ params }: Props) {
  const breed = breeds.find((b) => b.slug === params.slug);
  return (
    <div style={{ color: "white", background: "#0a3a57", minHeight: "100vh", padding: 40 }}>
      <h1>Slug: {params.slug}</h1>
      <h2>Breed found: {breed ? breed.name : "NOT FOUND"}</h2>
      <h2>Total breeds: {breeds.length}</h2>
      <h2>First 3 slugs: {breeds.slice(0,3).map(b => b.slug).join(", ")}</h2>
    </div>
  );
}
