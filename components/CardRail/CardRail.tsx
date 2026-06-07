"use client";
import { useRef, useCallback } from "react";
import Image from "next/image";
import { cards } from "../../content/cards";
import styles from "./CardRail.module.css";

export default function CardRail() {
  const railRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, startX: 0, startScroll: 0, moved: false });

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const el = railRef.current;
    if (!el) return;
    drag.current = {
      down: true,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: false,
    };
    el.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const el = railRef.current;
    if (!el || !drag.current.down) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    el.scrollLeft = drag.current.startScroll - dx;
  }, []);

  const endDrag = useCallback((e: React.PointerEvent) => {
    const el = railRef.current;
    if (el && el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
    drag.current.down = false;
  }, []);

  // Vertical wheel scrolls the rail horizontally while hovering it.
  const onWheel = useCallback((e: React.WheelEvent) => {
    const el = railRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
    }
  }, []);

  return (
    <section className={`${styles.section} paw-bg`}>
      <div className={styles.head}>
        <h2 className="display">
          Meet the <span className="display-yellow">Pack</span>
        </h2>
        <p className={styles.sub}>
          Hand-illustrated cards for 54 breeds. Drag, swipe or scroll to see them all.
        </p>
      </div>

      <div
        ref={railRef}
        className={styles.rail}
        role="list"
        aria-label="Breed cards"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={onWheel}
      >
        {cards.map((src, i) => (
          <div className={styles.item} role="listitem" key={src}>
            <Image
              src={src}
              alt={`Breed card ${i + 1}`}
              width={300}
              height={430}
              className={styles.card}
              sizes="(max-width: 700px) 64vw, 300px"
              draggable={false}
            />
          </div>
        ))}
      </div>

      <p className={styles.hint}>Drag or scroll to see all 54 &rarr;</p>
    </section>
  );
}
