"use client";

// G01 "Off Exploring". Awards on the first completed route change of the visit,
// from wherever the visitor started (BRIEF 2.1). Mounted once in the root
// layout, beside the counter. The layout is a Server Component, so this watcher
// is the required client child.
//
// Detection is usePathname() with a [pathname] effect. The App Router has no
// router.events: a failed or cancelled navigation never updates the pathname
// and is invisible, so only completed navigations are observable. That is the
// required behaviour, not a limitation.
//
// It awards nothing on the initial load. The mount pathname is remembered, and
// the first pathname that differs from it triggers the single report. Renders
// nothing.

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { reportHiddenGame } from "../../lib/hiddenGames/browserEngine";
import { shouldAwardOnRouteChange } from "../../lib/hiddenGames/routeWatch";

export default function RouteWatcher() {
  const pathname = usePathname();
  const initialPath = useRef(pathname);
  const awarded = useRef(false);

  useEffect(() => {
    if (shouldAwardOnRouteChange(initialPath.current, pathname, awarded.current)) {
      awarded.current = true;
      reportHiddenGame("G01");
    }
  }, [pathname]);

  return null;
}
