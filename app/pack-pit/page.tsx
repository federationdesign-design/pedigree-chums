import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import PackPit from "../../components/PackPit/PackPit";

export const metadata: Metadata = {
  title: "The Pack Pit: Play With the Whole Pack",
  description:
    "Tip out all 54 dogs from the Pedigree Chums pack and play. Drag them around, ping them off the walls, and hover a chum to see the breeds it came from.",
};

export default function PackPitPage() {
  return (
    <>
      <Nav />
      <main>
        <PackPit />
      </main>
    </>
  );
}
