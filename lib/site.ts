// Single source of truth for the site's absolute base URL.
//
// Structured data (JSON-LD) needs absolute URLs for @id, image and breadcrumb
// items, so it cannot rely on Next's metadataBase (which only resolves the
// Metadata API's relative URLs). This mirrors the same resolution used inline in
// app/layout.tsx and app/sitemap.ts: the live domain in production, the Vercel
// fallback otherwise. The "#organization" node id built from this must match the
// one emitted in app/layout.tsx so Article publisher references resolve to it.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://pedigree-chums.vercel.app";
