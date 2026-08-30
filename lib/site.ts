// Single source of truth for the site's absolute base URL.
//
// Structured data (JSON-LD) needs absolute URLs for @id, image and breadcrumb
// items, so it cannot rely on Next's metadataBase (which only resolves the
// Metadata API's relative URLs). This mirrors the same resolution used inline in
// app/layout.tsx and app/sitemap.ts: the live domain in production, the Vercel
// fallback otherwise. The "#organization" node id built from this must match the
// one emitted in app/layout.tsx so Article publisher references resolve to it.
export const SITE_URL =
  /* Fallback is the live domain, not a vercel.app host. NG-SHARE-3, 31 Aug 2026.

     It used to be "https://pedigree-chums.vercel.app". That host is behind the
     project's Vercel Authentication (ssoProtection, all_except_custom_domains),
     so anything built on it that a machine has to fetch fails: the podium
     OpenGraph image came back half drawn because Satori was served an SSO login
     page instead of a jpg, and the JSON-LD image and @id values on the editorial
     pages pointed at a host Google cannot reach.

     NEXT_PUBLIC_SITE_URL still wins when it is set, so nothing changes for
     anyone who sets it. The reason it is not required: the dashboard would not
     let the variable be typed as Config, and NEXT_PUBLIC_ values are inlined at
     build time while sensitive ones are withheld from the build, so a
     mis-typed variable would have silently produced an empty string. The domain
     is not a secret and is not going to change, so the constant is the safer
     default. next.config.ts already 301s that vercel.app host here. */
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.pedigreechums.co.uk";
