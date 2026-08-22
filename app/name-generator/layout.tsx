import type { Metadata } from "next";
// Global (non-module) override sheet for the article text toggle. The page is
// built from inline styles + global class names (pcm-*), which a CSS module cannot
// reach, so the overrides live in a plain stylesheet imported here on the route
// layout (the canonical home for global CSS). Every rule is scoped to this page's
// .pcm-* classes and the toggle attribute, so it does not leak to other routes.
import "./textinvert.css";

// The page itself is a client component ("use client"), which cannot export
// metadata, so the route's <title> is set here on the segment layout instead.
// The site suffix comes from the root layout's title template (WCAG 2.4.2).
export const metadata: Metadata = {
  title: "Name Generator",
  description:
    "Give your dog a one-in-a-million name. Choose a breed, answer a few playful questions, then run a knockout round to crown the winner and share the result.",
};

export default function NameGeneratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
