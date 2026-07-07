import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import HomeClient from "./HomeClient";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: "Pedigree Chums | The Dog Bingo Game",
  description:
    "Find your favourite dog breed and discover their family tree, history and personality. 54 illustrated breed cards for the on-the-go dog spotting game.",
};

export default function HomePage() {
  return (
    <div className={styles.page}>
      <Nav />
      <HomeClient />
    </div>
  );
}
