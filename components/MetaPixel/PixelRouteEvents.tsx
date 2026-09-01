"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { track } from "../../lib/track";

/* THE BUG THIS FIXES, and it is the important one.

   The pixel's base code fires PageView exactly ONCE, when the <Script> runs.
   This is a Next App Router site, so moving between pages is a client-side
   navigation: no reload, no script re-run, no PageView. Only a hard load or an
   external arrival was ever counted.

   So anyone who landed on the home page and then TAPPED THROUGH to /findpug was
   invisible to Meta. Given the competition is linked from the nav, the home
   page and the chumspot page, that is likely most of its traffic.

   The first pathname is skipped on purpose: the base code has already sent a
   PageView for it, and sending a second would double-count every entry.

   Mounted once in the root layout, next to the pixel itself. */
export default function PixelRouteEvents() {
  const pathname = usePathname();
  const seenFirst = useRef(false);

  useEffect(() => {
    if (!seenFirst.current) {
      seenFirst.current = true;
      return;
    }
    track("PageView");
  }, [pathname]);

  return null;
}
