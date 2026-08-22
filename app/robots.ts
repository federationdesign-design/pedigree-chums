import type { MetadataRoute } from "next";

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL || "https://pedigree-chums.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      /* The API routes return JSON or errors and are not pages. Nothing links
         to them, but there is no reason to spend a crawler's time on the
         checkout, the webhook or the sync endpoint. */
      disallow: ["/api/"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
