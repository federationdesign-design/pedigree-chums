// Bump this whenever you replace image files in place (same filename, new
// picture). Browsers and Vercel's CDN cache images by their full URL, so a
// replaced file keeps serving the old cached version until the URL changes.
// Adding ?v=<this> makes every image a fresh URL, forcing a clean refetch.
/* 3 -> 4, 20 September 2026: the Old European water dog's artwork was replaced
   in place when the Barbet merged into it, so one picture now has to stand for
   England's Great Water Dog, Germany's Pudelhund and France's Barbet. Same
   filename, new picture, which is exactly the case this constant exists for. */
/* 4 -> 5, 20 September 2026: original-water-spaniel.jpg replaced in place. It
   was an IRISH Water Spaniel, identifiable by its topknot, its bare rat tail and
   its smooth face, and it was standing in for the generic British water spaniel
   in nine nodes plus the English Water Spaniel. The 16 September one-picture-
   per-dog pass put it there on a majority count of 23 nodes to 2; the majority
   was the wrong dog. The new picture is the English type: liver and white, white
   legs, neck and belly, tight wig-like curls, smooth face, long feathered ears
   and a short curled tail. */
export const IMG_VERSION = 5;

// Append the version query to a site-relative image path. Idempotent, and it
// leaves data URLs and already-versioned URLs untouched.
export function bust(url: string): string {
  if (!url || url.startsWith("data:") || url.includes(`v=${IMG_VERSION}`)) return url;
  return url.includes("?") ? `${url}&v=${IMG_VERSION}` : `${url}?v=${IMG_VERSION}`;
}
