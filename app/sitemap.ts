import type { MetadataRoute } from "next";
import { breeds } from "../data/breeds";
import { ERA_PAGES } from "./britains-dog-history/[era]/eraConfig";

/* EVERY LIVE PAGE, BUILT FROM THE DATA RATHER THAN TYPED OUT.

   The chum pages and the era pages are generated from the same lists the routes
   themselves use, so adding a breed or an era puts it in the sitemap with no
   second edit. A page that is crawlable but unlisted is found by luck.

   Set NEXT_PUBLIC_SITE_URL in Vercel to the canonical domain; it falls back to
   the Vercel URL otherwise. */
const BASE =
  // Live domain, not a vercel.app host. See lib/site.ts, NG-SHARE-3.
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.pedigreechums.co.uk";

// Pages that are deliberately absent, and why:
//   /pc-admin              the data viewer, noindexed
//   /preorder/success      payment return pages, reachable only after a
//   /preorder/cancelled    transaction and meaningless out of that context
//   /accessibility-test    a test harness
//   /prelude-preview       a design review page, not linked from anywhere
//   /britains-dog-history-2  not on its live URL yet
const PAGES: [path: string, freq: "weekly" | "monthly" | "yearly", priority: number][] = [
  /* /home is the homepage in everything but address: `/` is the splash screen
     and carries almost no readable content. So /home takes the top priority. */
  ["/home", "weekly", 1],
  ["/", "weekly", 0.8],
  ["/about", "monthly", 0.7],
  ["/preorder", "monthly", 0.8],

  /* /chums is out of the sitemap until it is built: the route currently renders
     a one-line placeholder, and a stub in the sitemap is worse than an omission.
     The 54 /chums/<slug> detail pages below are unaffected. Restore this when the
     index page has real content. */
  ["/know-your-chums", "monthly", 0.7],
  ["/chumspot", "monthly", 0.6],
  ["/findpug", "monthly", 0.6],
  ["/chum-calculator", "monthly", 0.6],
  ["/name-generator", "monthly", 0.7],
  ["/hot-dogs", "monthly", 0.6],
  ["/smarter-than-the-test", "monthly", 0.6],

  ["/britains-dog-history", "monthly", 0.8],

  ["/dogs-at-work", "monthly", 0.8],
  ["/dogs-at-work/the-dogs-teaching-medicine-how-to-smell-disease", "monthly", 0.7],
  ["/dogs-at-work/the-colleague-who-never-clocks-off", "monthly", 0.7],
  ["/dogs-at-work/the-electronic-nose", "monthly", 0.7],
  ["/dogs-at-work/the-dog-that-finds-you-when-nobody-else-can", "monthly", 0.7],
  ["/dogs-at-work/the-dog-that-gives-you-your-world-back", "monthly", 0.7],
  ["/dogs-at-work/the-farm-worker-with-four-legs", "monthly", 0.7],

  ["/good-dog-bad-dog", "monthly", 0.8],
  ["/good-dog-bad-dog/argos", "monthly", 0.7],
  ["/good-dog-bad-dog/anubis", "monthly", 0.7],
  ["/good-dog-bad-dog/bulls-eye", "monthly", 0.7],
  ["/good-dog-bad-dog/gelert", "monthly", 0.7],
  ["/good-dog-bad-dog/greyfriars-bobby", "monthly", 0.7],
  ["/good-dog-bad-dog/hound-of-the-baskervilles", "monthly", 0.7],
  ["/good-dog-bad-dog/lassie", "monthly", 0.7],

  ["/toy-safety", "yearly", 0.3],
  ["/evidence-register", "yearly", 0.3],
  ["/independents", "monthly", 0.4],
  ["/trade", "monthly", 0.4],
  ["/whats-your-superpower", "monthly", 0.5],

  ["/privacy", "yearly", 0.3],
  ["/cookies", "yearly", 0.3],
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const fixed = PAGES.map(([path, changeFrequency, priority]) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
  // One page per era, from the list the route generates its own params from.
  const eras = ERA_PAGES.map((e) => ({
    url: `${BASE}/britains-dog-history/${e.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  // One page per chum. The biggest single block, and the long tail of the site.
  const chums = breeds.map((b) => ({
    url: `${BASE}/chums/${b.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  return [...fixed, ...eras, ...chums];
}
