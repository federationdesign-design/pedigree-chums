import type { Metadata } from "next";
import Footer from "../../components/Footer/Footer";
import PreorderPrototype from "./PreorderPrototype";

export const metadata: Metadata = {
  title: "Pre-order",
  description:
    "Pre-order Pedigree Chums™: The Dog Bingo Game at the pre-release price.",
};

// THROWAWAY layout prototype (preorder branch only): hero up top with the
// Stripe checkout card poking up into it from the right. See PreorderPrototype
// for the ?ov overlap-rule switch and ?ovv value knob. The footer sits below
// the in-flow checkout, so it shifts down as the iframe grows.
export default function PreorderPage() {
  return (
    <>
      <PreorderPrototype />
      <Footer />
    </>
  );
}
