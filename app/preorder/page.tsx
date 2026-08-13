import type { Metadata } from "next";
import Footer from "../../components/Footer/Footer";
import PreorderContent from "./PreorderContent";

export const metadata: Metadata = {
  title: "Pre-order",
  description:
    "Pre-order Pedigree Chums™: The Dog Bingo Game at the pre-release price.",
};

// Hero up top with the Stripe checkout card overlapping it from the right, then
// the FAQ ladder and the chum card slider (see PreorderContent), with the footer
// below.
export default function PreorderPage() {
  return (
    <>
      <PreorderContent />
      <Footer />
    </>
  );
}
