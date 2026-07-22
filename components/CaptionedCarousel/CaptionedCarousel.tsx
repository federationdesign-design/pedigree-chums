import * as React from "react";
import styles from "./CaptionedCarousel.module.css";

export type CarouselSlide = {
  src: string;
  alt: string;
  caption: string;
  credit?: string;
};

/*
  Captioned image carousel for article scenes.
  Native horizontal snap scroll (no JS): the next slide peeks in from the
  right as the swipe affordance. Each slide carries its own caption below
  the image, with an optional smaller credit line.
*/
export default function CaptionedCarousel({ slides, title }: { slides: CarouselSlide[]; title?: string }) {
  return (
    <div className={styles.wrap}>
      {title && <p className={styles.title}>{title}</p>}
      <div className={styles.track}>
        {slides.map((slide, i) => (
          <figure key={slide.src} className={styles.slide}>
            <div className={styles.imgBox}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={slide.src} alt={slide.alt} loading="lazy" />
              <span className={styles.count}>{i + 1} / {slides.length}</span>
            </div>
            <figcaption className={styles.caption}>
              {slide.caption}
              {slide.credit && <span className={styles.credit}>{slide.credit}</span>}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
