import type { MetadataRoute } from "next";

// Live, indexable routes only. The inner pages (about, order, contact) are not
// built yet, so they are deliberately left out until they exist. Set
// NEXT_PUBLIC_SITE_URL in Vercel to the canonical domain (especially once a
// custom domain is live); it falls back to the Vercel URL otherwise.
const BASE =
  process.env.NEXT_PUBLIC_SITE_URL || "https://pedigree-chums.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/cookies`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
