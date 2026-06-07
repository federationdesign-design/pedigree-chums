import Nav from "../components/Nav/Nav";
import Hero from "../components/Hero/Hero";
import CardRail from "../components/CardRail/CardRail";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <CardRail />
      </main>
    </>
  );
}
