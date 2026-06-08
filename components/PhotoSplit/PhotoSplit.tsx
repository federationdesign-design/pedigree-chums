import Image from "next/image";
import ParallaxShape from "../Parallax/ParallaxShape";
import styles from "./PhotoSplit.module.css";

type Props = {
  photo: string;
  alt: string;
  reverse?: boolean;
  card?: string;
  large?: boolean;
  xl?: boolean;
  circle?: boolean;
  children: React.ReactNode;
};

export default function PhotoSplit({
  photo,
  alt,
  reverse = false,
  card,
  large = false,
  xl = false,
  circle = false,
  children,
}: Props) {
  return (
    <section
      className={`${styles.split} ${reverse ? styles.reverse : ""} ${large ? styles.large : ""} ${xl ? styles.xl : ""} paw-bg`}
    >
      <div className={styles.photoCol}>
        <div className={styles.photoWrap}>
          {circle && <ParallaxShape className={styles.photoCircle} speed={0.18} />}
          <Image
            src={photo}
            alt={alt}
            width={620}
            height={620}
            className={styles.photo}
            sizes="(max-width: 900px) 84vw, 800px"
          />
          {card && (
            <Image
              src={card}
              alt=""
              width={300}
              height={430}
              className={styles.card}
              sizes="(max-width: 900px) 40vw, 230px"
            />
          )}
        </div>
      </div>
      <div className={styles.contentCol}>{children}</div>
    </section>
  );
}
