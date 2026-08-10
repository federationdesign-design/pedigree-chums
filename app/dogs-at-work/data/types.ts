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

// A small square image beside a supporting point. Panel 1 only carries these
// (three of them); panels 2 to 4 have none. Optional by design: a panel
// without thumbnails is valid and must not fail validation.
export interface PanelThumbnail {
  src: string;
  alt: string;
}

// A blue panel section. It carries a subheading (bold lead-in), and then
// prose (body), bulleted content (bullets), or both. Panel 4 is the only one
// that uses bullets, so the component supports both forms.
export interface PanelSection {
  subheading?: string;
  body?: string;
  bullets?: string[];
}

// The blue panel expands the persistent introduction. It is section-level
// argument, not a description of the article it is paired with.
export interface BluePanel {
  sections: PanelSection[];
  thumbnails?: PanelThumbnail[];
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
