import Image from "next/image";
import styles from "./AboutSplit.module.css";

type Props = {
  photo: string;
  alt: string;
  reverse?: boolean;
  children: React.ReactNode;
};

// A clean text/image row for the About page. Unlike the homepage PhotoSplit,
// this has no corgi/spaniel-specific lifts and gives the copy a roomy column
// so long single-word headings never overflow.
export default function AboutSplit({ photo, alt, reverse = false, children }: Props) {
  return (
    <section className={`${styles.split} ${reverse ? styles.reverse : ""} paw-bg`}>
      <div className={styles.photoCol}>
        <div className={styles.photoWrap}>
          <Image
            src={photo}
            alt={alt}
            width={640}
            height={640}
            className={styles.photo}
            sizes="(max-width: 900px) 84vw, 600px"
          />
        </div>
      </div>
      <div className={styles.contentCol}>{children}</div>
    </section>
  );
}
