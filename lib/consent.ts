// Single source of truth for the cookie-consent storage key. Every reader and
// writer imports this: the CookieBanner (writes), the PackPit and BreedTree
// prompt gates (reads), the Analytics/GA loader, the Hidden Games event gate and
// the Meta Pixel. One place means a future bump cannot leave a reader on the old
// key and split the consent state.
//
// v2 (28 Aug 2026): bumped from "pc-cookie-consent" when the Meta Pixel
// (marketing) was added, so anyone who accepted under the old notice (which did
// not mention marketing) re-consents under the new disclosure rather than being
// silently migrated. The old key is left orphaned and unread.
export const CONSENT_KEY = "pc-cookie-consent-v2";
