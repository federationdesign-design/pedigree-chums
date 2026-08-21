import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
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
      {/* showLogo: keep the logo visible from the top (not hidden-until-scroll like
          the article pages), so the brand shows on this commerce page and the Pick a
          Chum chip does not newly hide at the top. Nav is position:fixed, so it adds
          no flow space and does not shift the hero or the checkout lift below. */}
      <Nav showLogo />
      <PreorderContent />
      <Footer />
    </>
  );
}
