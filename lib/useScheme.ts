"use client";

import { useSyncExternalStore } from "react";

/* The site's accessibility schemes, read by the components that have to draw
   themselves in one colour (owner, 22 September 2026). Extracted from
   SeaLevelMap and DomesdayMap, which each carried their own copy, so the maps
   cannot drift apart.

   Why the maps care: contrast-schemes.css crushes any coloured inline SVG to
   grey (via SchemeCrushSvg's data-pc-crush), which flattens a map's categories
   into one tone. A map that paints itself black, white or with pattern fills has
   no colour for that pass to find, so it is left alone and stays readable. */

export type Scheme = "black-on-white" | "white-on-black" | null;

const SCHEME_ATTR = "data-pc-contrast-scheme";

const readScheme = (): Scheme => {
  const v = document.documentElement.getAttribute(SCHEME_ATTR);
  return v === "black-on-white" || v === "white-on-black" ? v : null;
};

const subscribeScheme = (cb: () => void) => {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: [SCHEME_ATTR] });
  return () => obs.disconnect();
};

export const useScheme = (): Scheme => useSyncExternalStore(subscribeScheme, readScheme, () => null);

/* The scheme's ink, and its paper. */
export const schemeFg = (s: Scheme) => (s === "white-on-black" ? "#ffffff" : "#000000");
export const schemeBg = (s: Scheme) => (s === "white-on-black" ? "#000000" : "#ffffff");
