import { CONSENT_KEY } from "./consent";

/* One place that decides whether a marketing event may fire, and one place that
   sends it. Both the Meta Pixel loader and every individual event go through
   here, so a future change to the rules cannot leave one caller on the old ones.

   TWO GATES, BOTH MUST PASS.

   1. CONSENT. The same v2 key the cookie banner writes and the pixel loader
      reads. No consent, no event, ever.
   2. HOST. Production only. The pixel is installed on the site's code, so every
      Vercel PREVIEW deployment fires it too: Events Manager already shows a
      second domain, pedigree-chums-<hash>-federati..., alongside the real one.
      That is marketing data from a URL no customer will ever see, mixed into
      the same dataset. Previews are now silent.

      The consequence, and it is deliberate: the pixel can no longer be tested
      on a preview build. Steve reviews on production only, so nothing is lost. */
/* BOTH the www host and the bare apex. Events Manager only lists the www one,
   which suggests the apex redirects, but a single-host check would silently
   stop tracking every visitor if that redirect ever changed, and a tracking
   gate that fails quietly is the worst kind. */
export const TRACKING_HOSTS = ["www.pedigreechums.co.uk", "pedigreechums.co.uk"];

export function trackingAllowed(): boolean {
  if (typeof window === "undefined") return false;
  if (!TRACKING_HOSTS.includes(window.location.hostname)) return false;
  try {
    return localStorage.getItem(CONSENT_KEY) === "accepted";
  } catch {
    return false; // private mode
  }
}

type Fbq = (...args: unknown[]) => void;
const getFbq = () => (window as unknown as { fbq?: Fbq }).fbq;

/* THE RACE THIS SOLVES. A page's own event fires from a mount effect, but the
   pixel's base code is injected by a <Script> with afterInteractive, so on a
   first load the event can easily run before fbq exists and simply vanish. The
   /findpug arrival is exactly that case: it is the first thing on the page.

   So an event that arrives too early is held and retried, rather than dropped.
   Capped, because a visitor who never consents must not leave a timer running
   for the whole session. */
const RETRY_MS = 250;
const RETRY_MAX = 40; // 10 seconds

export function track(event: string, params?: Record<string, unknown>, attempt = 0): void {
  if (!trackingAllowed()) return;
  const fbq = getFbq();
  if (typeof fbq === "function") {
    fbq("track", event, params);
    return;
  }
  if (attempt >= RETRY_MAX) return;
  window.setTimeout(() => track(event, params, attempt + 1), RETRY_MS);
}
