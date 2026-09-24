import { getLineage, type LineageNode } from "./lineage";
import { resolveLineageName } from "./lineageNames";
import { isEchoName } from "./lineageShape";

/* THE CHUMS WITH AN INTRO CLIP, by slug, played full screen on a phone before the
   game (owner, 24 September 2026). The Labrador was the trial; thirteen more
   joined the same day. A chum not listed here goes straight into its game. The
   file names are the owner's own, kept verbatim so a file and its line cannot
   drift apart. */
export const INTRO_VIDEOS: Record<string, string> = {
  "basset-hound": "/bassetcardjump_low-res.mp4",
  beagle: "/beagle-cardjump_low-res.mp4",
  "bichon-frise": "/bichon-cardjump_low-res.mp4",
  "border-terrier": "/border-terrier-cardjump_low-res.mp4",
  boxer: "/boxer-cardjump_1_low-res.mp4",
  "bull-terrier": "/bull-terrier-cardjump_low-res.mp4",
  bulldog: "/bulldog-cardjump_low-res.mp4",
  cockapoo: "/cockapoo-cardjump_low-res.mp4",
  "french-bulldog": "/french-bulldog-cardjump_low-res.mp4",
  labrador: "/labcardjump_low-res.mp4",
  "miniature-schnauzer": "/miniature-schnauzercardjump_low-res.mp4",
  "staffordshire-bull-terrier": "/staffy-cardjump_low-res.mp4",
  "west-highland-terrier": "/westie-cardjump_low-res.mp4",
  "yorkshire-terrier": "/yorkie-cardjump_low-res.mp4",
};

/* HOW MANY CIRCLES A CHUM'S LEVEL DROPS, counted the way the pit counts them:
   every circle in the tree, the chum itself and hidden echo copies excluded
   (BreedTree's circleCount). Used to order the homepage play slider, smallest
   level first (owner, 24 September 2026). Server side only: the lineage data is
   large and must not be shipped to a phone for a sort. */
export function chumCircleCount(name: string): number {
  const lin = getLineage(resolveLineageName(name));
  if (!lin) return 0;
  let n = 0;
  const walk = (x: LineageNode, parent: LineageNode | null, depth: number) => {
    if (depth > 0 && !(parent && isEchoName(x.name, parent.name))) n++;
    for (const c of x.children ?? []) walk(c, x, depth + 1);
  };
  walk(lin, null, 0);
  return n;
}

/* THE CHUMS WITH A FULL FILM ON VIMEO (owner, 24 September 2026), by slug. The
   homepage play slider adds a Watch video row to these. Border Collie is listed
   but has no intro clip, so it is not on the slider yet; it will show the row the
   day it gets one. */
export const CHUM_VIMEO: Record<string, string> = {
  labrador: "1218972477",
  "staffordshire-bull-terrier": "1221597339",
  "border-collie": "1218974120",
  "french-bulldog": "1229938542",
};

/* A Vimeo film's length in whole seconds, from Vimeo's public oEmbed endpoint,
   asked on the server and cached for a day. Null if Vimeo does not answer, in
   which case the slider leaves the seconds circle out rather than guess. */
export async function vimeoSeconds(id: string): Promise<number | null> {
  try {
    const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${id}`)}`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const d = (await res.json()) as { duration?: number };
    return typeof d.duration === "number" && d.duration > 0 ? Math.round(d.duration) : null;
  } catch {
    return null;
  }
}

