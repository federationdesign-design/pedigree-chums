import type { ReactElement } from "react";

// The Dogs at Work forward chevron: a single stroked SVG path, no fill, coloured
// by `currentColor` so the parent sets it. Extracted verbatim from WorkDeck so the
// press carousel reuses the exact same asset rather than a look-alike glyph. It
// points right (the "next" direction); mirror it in CSS for a "previous" control.
export default function WorkChevron(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M8 4l8 8-8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
