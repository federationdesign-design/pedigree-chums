import type { Metadata } from "next";
import { SITE_URL } from "../../lib/site";
import Footer from "../../components/Footer/Footer";
import PreorderContent from "./PreorderContent";

export const metadata: Metadata = {
  title: "Pre-order",
  description:
    "Pre-order Pedigree Chums™: The Dog Bingo Game at the pre-release price.",
};

// The pre-order price, in GBP. This is the ONE machine-readable copy, used by the
// Product structured data below. The same figure appears as display copy in three
// other places, which must be changed together if the price ever changes:
//   components/Offer/OfferLauncher.tsx  (the launcher button)
//   components/Offer/OfferCta.tsx       (the inline CTA button)
//   components/FAQ/FAQ.tsx              (the "how much does it cost" FAQ answer)
// The price rises to the £9.99 retail figure on 1 October 2026, so the offer
// below is valid until 2026-09-30, the last day the £6.99 holds. Update this
// constant and priceValidUntil together when that happens.
export const PREORDER_PRICE_GBP = "6.99";

// Product structured data for the pre-order. The name is the product itself (not
// the page <title>), the image is the real pack shot (public/product-img.jpg, the
// box beside a card), and price/currency/validity/availability come from the
// constant above and the page copy. No Review or AggregateRating: there is no
// honest ratings source, and inventing one risks a manual penalty.
const PRODUCT_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Pedigree Chums™: The Dog Bingo Game",
  description: metadata.description,
  image: `${SITE_URL}/product-img.jpg`,
  brand: { "@type": "Brand", name: "Pedigree Chums™" },
  offers: {
    "@type": "Offer",
    price: PREORDER_PRICE_GBP,
    priceCurrency: "GBP",
    priceValidUntil: "2026-09-30",
    availability: "https://schema.org/PreOrder",
    url: `${SITE_URL}/preorder`,
  },
};

// Hero up top with the Stripe checkout card overlapping it from the right, then
// the FAQ ladder and the chum card slider (see PreorderContent), with the footer
// below.
export default function PreorderPage() {
  return (
    <>
      {/* Product structured data. Native <script>, escaped per the Next.js
          JSON-LD guide (JSON-LD is data, not executable code). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(PRODUCT_JSONLD).replace(/</g, "\\u003c"),
        }}
      />
      <PreorderContent />
      <Footer />
    </>
  );
}
