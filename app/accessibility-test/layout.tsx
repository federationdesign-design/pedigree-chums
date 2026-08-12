import type { Metadata } from "next";

// Diagnostic-only page (Workstream C). Noindex and not linked from anywhere.
// The page itself is a client component (it measures rendered pixels), so the
// title/robots live here on the segment layout.
export const metadata: Metadata = {
  title: "Contrast Test",
  robots: "noindex",
};

export default function AccessibilityTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
