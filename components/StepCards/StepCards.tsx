"use client";
import { useEffect, useRef } from "react";
import styles from "./StepCards.module.css";

const STEPS = [
  { n: 1, caption: "DEAL 3-6 CHUMS EACH",  img: "/step1-redue.jpg", video: "/step1-video-animation.mp4" },
  { n: 2, caption: "HEAD OUTSIDE",          img: "/step2-redue.jpg", video: "/step2-video-animation.mp4" },
  { n: 3, caption: "SPOT REAL DOGS",        img: "/step3-redue.jpg", video: "/step3-video-animation.mp4" },
  { n: 4, caption: "MATCH TO YOUR CHUM",    img: "/step4-redue.jpg", video: null },
  { n: 5, caption: "FIND MORE CHUMS",       img: "/step5-redue.jpg", video: null },
  { n: 6, caption: "MOST CHUMS WINS",       img: "/step6-redue.jpg", video: null },
];

export default function StepCards() {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  // Autoplay the step videos while they're on screen.
  useEffect(() => {
    const videos = videoRefs.current.filter(Boolean) as HTMLVideoElement[];
    if (!videos.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const v = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            v.play().catch(() => {});
          } else {
            v.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    videos.forEach((v) => observer.observe(v));
    return () => observer.disconnect();
  }, []);

  // Sticky pin: the section freezes centred in the viewport while the page's
  // vertical scroll is translated into horizontal movement of the card rail,
  // then releases once every card has passed. Works on desktop and touch alike.
  useEffect(() => {
    const section = sectionRef.current;
    const pin = pinRef.current;
    const rail = railRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!section || !pin || !rail) return;

    let distance = 0; // px of horizontal overflow == px of scroll spent pinned
    let raf = 0;

    // The site sets `overflow-x: hidden` on <html>/<body> to stop sideways
    // scroll, but that turns the root into a clip/scroll container and breaks
    // `position: sticky`. `overflow-x: clip` prevents sideways scroll WITHOUT
    // that side effect. We can't set it in CSS (the build downlevels clip ->
    // hidden for its browser targets), so apply it at runtime where modern
    // browsers honour it. Harmless on browsers that don't support clip.
    const root = document.documentElement;
    const body = document.body;
    const prevRootOX = root.style.overflowX;
    const prevBodyOX = body.style.overflowX;
    if (CSS?.supports?.("overflow-x", "clip")) {
      root.style.overflowX = "clip";
      body.style.overflowX = "clip";
    }

    const update = () => {
      if (distance <= 0) {
        rail.style.transform = "none";
        if (track) track.style.opacity = "0";
        return;
      }
      const rect = section.getBoundingClientRect();
      const scrolled = Math.min(Math.max(-rect.top, 0), distance);
      rail.style.transform = `translate3d(${-scrolled}px, 0, 0)`;
      if (track && thumb) {
        track.style.opacity = "1";
        const w = Math.min(1, pin.clientWidth / rail.offsetWidth);
        thumb.style.width = `${w * 100}%`;
        thumb.style.left = `${(scrolled / distance) * (1 - w) * 100}%`;
      }
    };

    // Measure the horizontal overflow and set up the tall spacer that gives the
    // pin something to scroll through. Reference the section width (always the
    // full viewport width) so the measurement doesn't depend on the pin's own
    // box, which can read wide mid-layout. Re-run on resize / when media loads.
    const layout = () => {
      const refWidth = section.clientWidth || pin.clientWidth;
      distance = Math.max(0, rail.offsetWidth - refWidth);

      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (distance > 0) {
        pin.style.height = `${vh}px`;
        section.style.height = `${vh + distance}px`;
      } else {
        // Everything fits: no pin, natural height, cards simply centred.
        pin.style.height = "";
        section.style.height = "";
      }
      update();
    };

    const onScroll = () => {
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          update();
        });
    };

    // Run now, again after paint, and once web fonts settle — card widths use vw
    // basis (font-independent) but this guards against measuring mid-layout.
    layout();
    requestAnimationFrame(() => requestAnimationFrame(layout));
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(layout).catch(() => {});
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", layout);
    const ro = new ResizeObserver(layout);
    ro.observe(rail);
    ro.observe(section);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", layout);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
      root.style.overflowX = prevRootOX;
      body.style.overflowX = prevBodyOX;
    };
  }, []);

  // Yellow scrollbar: reflects progress, and dragging it scrolls the page so the
  // pin advances (since the pin is driven by page-scroll position).
  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!section || !track || !thumb) return;

    let dragging = false;
    const scrollToProgress = (clientX: number) => {
      const rect = track.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (clientX - rect.left) / (rect.width || 1)));
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const distance = Math.max(0, section.offsetHeight - vh);
      const sectionTopAbs = window.scrollY + section.getBoundingClientRect().top;
      window.scrollTo({ top: sectionTopAbs + p * distance });
    };
    const onDown = (e: PointerEvent) => {
      dragging = true;
      thumb.setPointerCapture(e.pointerId);
      e.preventDefault();
      scrollToProgress(e.clientX);
    };
    const onMove = (e: PointerEvent) => {
      if (dragging) scrollToProgress(e.clientX);
    };
    const onUp = () => {
      dragging = false;
    };

    thumb.addEventListener("pointerdown", onDown);
    thumb.addEventListener("pointermove", onMove);
    thumb.addEventListener("pointerup", onUp);
    thumb.addEventListener("pointercancel", onUp);
    return () => {
      thumb.removeEventListener("pointerdown", onDown);
      thumb.removeEventListener("pointermove", onMove);
      thumb.removeEventListener("pointerup", onUp);
      thumb.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return (
    <section ref={sectionRef} className={styles.section}>
      <div ref={pinRef} className={styles.pin}>
        <div ref={railRef} className={styles.row}>
          {STEPS.map((s, i) => (
            <div key={s.n} data-card className={styles.card}>
              <div className={styles.badge}>{s.n}</div>
              <div className={styles.media}>
                {s.video ? (
                  <video
                    ref={(el) => { videoRefs.current[i] = el; }}
                    src={s.video}
                    muted
                    playsInline
                    loop={false}
                    onEnded={(e) => {
                      const v = e.currentTarget;
                      v.pause();
                      v.currentTime = Math.max(0, v.duration - 0.05);
                    }}
                    className={styles.img}
                    poster={s.img}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.img} alt={`Step ${s.n}`} className={styles.img} />
                )}
              </div>
              <div className={styles.caption}>{s.caption}</div>
            </div>
          ))}
        </div>

        <div ref={trackRef} className={styles.scrollbar} aria-hidden="true">
          <div ref={thumbRef} className={styles.thumb} />
        </div>
      </div>
    </section>
  );
}
