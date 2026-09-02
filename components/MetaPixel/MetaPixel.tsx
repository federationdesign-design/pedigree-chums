"use client";
import { useState, useEffect } from "react";
import Script from "next/script";
import { trackingAllowed } from "../../lib/track";

/* 2 September 2026: 1072172202055733 -> 2152250512379098, supplied by the social
   media manager as the correct dataset. The old ID was recorded as confirmed in
   Events Manager on 1 September, so if events go quiet after this, that earlier
   confirmation is the thing to re-check first.
   ONE PLACE ONLY. Every event in the site routes through this component and
   lib/track.ts, so there is no second copy to keep in step. */
const PIXEL_ID = "2152250512379098";

// Meta Pixel (marketing), gated on cookie consent AND on the production host.
// The tag is only injected once the visitor has accepted cookies via the banner,
// and it reacts to the "pc:consent" event, so accepting starts it without a page
// reload. Gates on the v2 consent key, so anyone who accepted under the old
// notice (which did not mention marketing) re-consents before the pixel fires.
//
// No <noscript> fallback on purpose (Steve, 28 Aug 2026): that beacon fires
// without JavaScript and so cannot be consent-gated, which would fire a marketing
// tracker with no consent. The tiny no-JS audience is not worth that breach.
export default function MetaPixel() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    // trackingAllowed() carries BOTH gates now, consent and production host.
    // Previews used to load the pixel and report into the same dataset.
    const sync = () => setAllowed(trackingAllowed());
    // rAF keeps the state update out of the effect body and the first paint
    // pixel-free (no hydration mismatch).
    const raf = requestAnimationFrame(sync);
    window.addEventListener("pc:consent", sync);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pc:consent", sync);
    };
  }, []);

  if (!allowed) return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PIXEL_ID}');
fbq('track', 'PageView');`}
    </Script>
  );
}
