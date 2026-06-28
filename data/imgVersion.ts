// Bump this whenever you replace image files in place (same filename, new
// picture). Browsers and Vercel's CDN cache images by their full URL, so a
// replaced file keeps serving the old cached version until the URL changes.
// Adding ?v=<this> makes every image a fresh URL, forcing a clean refetch.
export const IMG_VERSION = 3;

// Append the version query to a site-relative image path. Idempotent, and it
// leaves data URLs and already-versioned URLs untouched.
export function bust(url: string): string {
  if (!url || url.startsWith("data:") || url.includes(`v=${IMG_VERSION}`)) return url;
  return url.includes("?") ? `${url}&v=${IMG_VERSION}` : `${url}?v=${IMG_VERSION}`;
}
