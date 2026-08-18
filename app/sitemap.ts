import type { MetadataRoute } from "next";

// Live, indexable routes only. Add a page here when it goes live: a page that is
// crawlable but unlisted is found by luck rather than by design. Set
// NEXT_PUBLIC_SITE_URL in Vercel to the canonical domain (especially once a
// custom domain is live); it falls back to the Vercel URL otherwise.
const BASE =
  process.env.NEXT_PUBLIC_SITE_URL || "https://pedigree-chums.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    /* DOGS AT WORK. The hub and all six articles, listed so they can be found
       rather than only crawled. The deck navigates in JavaScript, so without
       these the articles have no reliable path in from the hub. */
    { url: `${BASE}/dogs-at-work`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/dogs-at-work/the-dogs-teaching-medicine-how-to-smell-disease`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/dogs-at-work/the-colleague-who-never-clocks-off`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/dogs-at-work/the-electronic-nose`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/dogs-at-work/the-dog-that-finds-you-when-nobody-else-can`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/dogs-at-work/the-dog-that-gives-you-your-world-back`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/dogs-at-work/the-farm-worker-with-four-legs`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/cookies`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
