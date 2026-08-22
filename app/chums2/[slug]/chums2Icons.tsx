import type { ReactElement } from "react";

// Custom rail glyphs for cards the shared CardDock ICONS map does not cover.
// Stroke-based, yellow via currentColor (the rail sets colour + stroke), so they
// invert to navy on hover exactly like the CardDock glyphs. (Decision D8.)

// Intro write-up: an open book.
export const INTRO_GLYPH: ReactElement = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 6.5C10.5 5 8 4.3 4 4.5v13c4-0.2 6.5 0.5 8 2 1.5-1.5 4-2.2 8-2v-13c-4-0.2-6.5 0.5-8 2Z" />
    <path d="M12 6.5v13" />
  </svg>
);

// Health conditions: a medical cross inside a rounded shield.
export const HEALTH_GLYPH: ReactElement = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3c3 2 5 2 7 2 0 6-1 11-7 15-6-4-7-9-7-15 2 0 4 0 7-2Z" />
    <path d="M12 8v6M9 11h6" />
  </svg>
);

// Historical influence: a percentage bar chart (distinct from the family tree,
// which keeps the CardDock tree glyph).
export const INFLUENCE_GLYPH: ReactElement = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </svg>
);

// Circular lineage diagram: concentric circles (Decision D6).
export const DIAGRAM_GLYPH: ReactElement = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);
