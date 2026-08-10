// The Dogs at Work data model. One record pairs one blue panel with one
// article. Steve adds articles five through twelve by adding entries here,
// each with its own paired panel; nothing else needs an agent. See brief
// v3.0 sections 6 and 8.

// The six families. "Rural and Traditional" is the full family name; its pill
// reads "Rural" for length (section 11). The pill label is derived, not stored.
export type Family =
  | "Medical"
  | "Security"
  | "Emergency"
  | "People"
  | "Rural and Traditional"
  | "Science";

export type PublicationState = "live" | "draft";

// The pill label shown on the card and panel. It equals the family name for
// five of the six; "Rural and Traditional" reads "Rural" for length (section
// 11). The pill label, not the full family name, is what the 12-character
// family budget governs.
export const FAMILY_PILL_LABEL: Record<Family, string> = {
  Medical: "Medical",
  Security: "Security",
  Emergency: "Emergency",
  People: "People",
  "Rural and Traditional": "Rural",
  Science: "Science",
};

// A small square image sitting inline with a section's heading. Panel 1 uses
// them (one per section); panels 2 to 4 have none. Both fields are optional: a
// thumbnail with no `src` is PENDING (Steve still owes the image), and renders
// as reserved, invisible space rather than a broken image, so the layout does
// not shift when the real image lands. `alt` is required once `src` is set.
export interface PanelThumbnail {
  src?: string;
  alt?: string;
}

// A blue panel section. It carries a subheading (bold lead-in), then prose
// (body), bulleted content (bullets), or both, and optionally a thumbnail that
// sits beside its heading. Panel 4 uses bullets, so the component supports both
// prose and bullets. Structure lives here; styling is uniform in the CSS, so
// panels 5 to 12 need no code, only data.
export interface PanelSection {
  subheading?: string;
  body?: string;
  bullets?: string[];
  thumbnail?: PanelThumbnail;
}

// The blue panel expands the persistent introduction. It is section-level
// argument, not a description of the article it is paired with.
export interface BluePanel {
  sections: PanelSection[];
}

// The article, as shown on the bottom panel and the index card: the same
// content, re-presented (section 11).
export interface Article {
  family: Family;
  subLabel: string;
  headline: string;
  dek: string;
  image: string;
  imageAlt: string;
  ctaLabel: string;
  href: string;
}

// One slide is one explicit pair. The pairing is editorial, never inferred
// from array order, so inserting a slide cannot reshuffle the panels.
export interface Slide {
  id: string;
  order: number;
  published: PublicationState;
  panel: BluePanel;
  article: Article;
}
