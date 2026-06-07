import Image from "next/image";
import styles from "./PhotoSplit.module.css";

type Props = {
  photo: string;
  alt: string;
  label?: string;
  reverse?: boolean;
  children: React.ReactNode;
};

export default function PhotoSplit({ photo, alt, label, reverse = false, children }: Props) {
  return (
    <section className={`${styles.split} ${reverse ? styles.reverse : ""} paw-bg`}>
      <div className={styles.photoCol}>
        <span className={styles.disc} aria-hidden="true" />
        <div className={styles.blob}>
          <Image
            src={photo}
            alt={alt}
            fill
            sizes="(max-width: 900px) 80vw, 440px"
            style={{ objectFit: "cover" }}
          />
        </div>
        {label && <span className={styles.label}>{label}</span>}
      </div>
      <div className={styles.contentCol}>{children}</div>
    </section>
  );
}
