import Image from "next/image";
import styles from "./PhotoSplit.module.css";

type Props = {
  photo: string;
  alt: string;
  reverse?: boolean;
  card?: string;
  children: React.ReactNode;
};

export default function PhotoSplit({ photo, alt, reverse = false, card, children }: Props) {
  return (
    <section className={`${styles.split} ${reverse ? styles.reverse : ""} paw-bg`}>
      <div className={styles.photoCol}>
        <div className={styles.photoWrap}>
          <Image
            src={photo}
            alt={alt}
            width={520}
            height={520}
            className={styles.photo}
            sizes="(max-width: 900px) 80vw, 480px"
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
