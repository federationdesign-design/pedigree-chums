import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import ChumCalculator from "./ChumCalculator";

export const metadata: Metadata = {
  title: "Chum Calculator | Find Your Perfect Dog | Pedigree Chums™",
  description: "Answer a few quick questions about your lifestyle and budget and we'll match you with your ideal dog from all 54 breeds in the pack.",
};

export default function ChumCalculatorPage() {
  return (
    <>
      <Nav />
      <ChumCalculator />
      <Footer />
    </>
  );
}
