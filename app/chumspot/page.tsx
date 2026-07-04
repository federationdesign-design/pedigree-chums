import type { Metadata } from "next";
import ChumSpotClient from "./ChumSpotClient";

export const metadata: Metadata = {
  title: "Spot your Chum Photo Competition — Pedigree Chums",
  description: "Spot a dog. Match the card. Share your ChumSpot. Win a 3D printed Chum figurine.",
};

export default function ChumSpotPage() {
  return <ChumSpotClient />;
}
