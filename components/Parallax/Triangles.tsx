import ParallaxShape from "./ParallaxShape";
import styles from "./Triangles.module.css";

export type Tri = {
  size: number;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  speed: number; // parallax drift
  spin: number; // degrees per pixel (negative = anti-clockwise)
};

export default function Triangles({ items, z = 0 }: { items: Tri[]; z?: number }) {
  return (
    <>
      {items.map((t, i) => (
        <ParallaxShape
          key={i}
          className={styles.tri}
          speed={t.speed}
          spin
          spinFactor={t.spin}
          style={{
            width: t.size,
            height: t.size,
            top: t.top,
            left: t.left,
            right: t.right,
            bottom: t.bottom,
            zIndex: z,
          }}
        />
      ))}
    </>
  );
}
