import type { Metadata } from "next";

// The page itself is a client component ("use client"), which cannot export
// metadata, so the route's <title> is set here on the segment layout instead.
// The site suffix comes from the root layout's title template (WCAG 2.4.2).
export const metadata: Metadata = {
  title: "Prelude Preview",
};

export default function PreludePreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
