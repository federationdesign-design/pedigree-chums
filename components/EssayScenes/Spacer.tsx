import styles from "../../app/good-dog-bad-dog/good-dog-bad-dog.module.css";

/*
  Spacer -- a deliberate, visible exception to the automatic rhythm.

  The essay body spaces its own children, so you should almost never need
  this. Reach for it only where a specific gap has to differ from the
  system, and the fact that it is explicit in the markup is the point:
  an unusual gap should be something you can see and point at, not a
  mystery margin hidden in a stylesheet.
*/
export function Spacer({ size = "m" }: { size?: "xs" | "s" | "m" | "l" | "xl" }) {
  return (
    <div
      className={styles.spacer}
      aria-hidden="true"
      style={{ height: `var(--gap-${size})` }}
    />
  );
}
