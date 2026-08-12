import type { Metadata } from "next";
import Footer from "../../components/Footer/Footer";
import DiscountCapture from "./DiscountCapture";
import styles from "./discountCode.module.css";

export const metadata: Metadata = {
  title: "Get your discount code",
  description:
    "Join the pre-launch list and we will email your discount code the day before launch.",
};

// The join-the-list path: email capture for a launch-day code. Kept separate
// from /preorder (buy now) so a payment form and an email box never compete on
// one page.
export default function DiscountCodePage() {
  return (
    <>
      <main className={styles.page}>
        <DiscountCapture />
      </main>
      <Footer />
    </>
  );
}
