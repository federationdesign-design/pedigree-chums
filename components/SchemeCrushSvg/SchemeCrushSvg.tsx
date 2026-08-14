"use client";

// Crush gap follow-up. The monochrome media crush (contrast-schemes.css) only
// reaches raster <img>/<video>/<iframe>. Inline content SVGs (the breed page's
// charts, the influence bars, and the SVG-wrapped portrait) keep their colour in
// a scheme. This marks the CONTENT svgs so the same crush filter reaches them,
// while leaving UI-icon svgs alone.
//
// The rule, chosen from a size sweep of every route (.scratch/svg-sizes.mjs):
//   min-dimension >= 96px AND (a non-greyscale fill/stroke OR an embedded <image>)
// Size alone does not separate the two: the largest UI icon is a 165px carousel
// chevron on /dogs-at-work, bigger than the smallest content svg (the 110px
// influence bars). So the colour test carries the split. currentColor icons
// resolve to the scheme foreground (greyscale) once a scheme is active, so they
// read as mono here and are skipped; hard-coded colour survives and is caught.
// The 96px floor keeps small colour icons (e.g. the 48px argos glyphs) out.
//
// CSS cannot test size or resolved colour, so this runs a scheme-only DOM pass
// that marks matches with data-pc-crush; contrast-schemes.css applies the filter.
// One-step restore when the scheme clears. Modelled on SchemeStrokes.
//
// The header/footer chrome (.pc-nav, .pc-footer) is excluded: its logos and icons
// are already handled by the chrome rules (logos swap, icons kept flat).

import { useEffect } from "react";

const SCHEME_ATTR = "data-pc-contrast-scheme";
const MARK = "data-pc-crush";
const MIN_SIZE = 96;

export default function SchemeCrushSvg() {
  useEffect(() => {
    let raf = 0;

    const active = () => !!document.documentElement.getAttribute(SCHEME_ATTR);

    const restore = () => {
      document.querySelectorAll("[" + MARK + "]").forEach((el) => el.removeAttribute(MARK));
    };

    // A colour is anything whose resolved fill/stroke is not greyscale (R=G=B)
    // and not fully transparent. Icons drawn with currentColor resolve to the
    // scheme foreground here (black or white), so they read as greyscale.
    const nonGrey = (paint: string) => {
      const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(paint);
      if (!m) return false;
      const a = m[4] === undefined ? 1 : parseFloat(m[4]);
      if (a === 0) return false;
      return !(m[1] === m[2] && m[2] === m[3]);
    };

    const hasColour = (svg: SVGElement) => {
      if (svg.querySelector("image")) return true;
      for (const n of [svg, ...Array.from(svg.querySelectorAll("*"))]) {
        const cs = getComputedStyle(n);
        if (nonGrey(cs.fill) || nonGrey(cs.stroke)) return true;
      }
      return false;
    };

    const apply = () => {
      restore();
      if (!active()) return;
      const site = document.getElementById("pc-site");
      if (!site) return;
      const mark: SVGElement[] = [];
      for (const svg of Array.from(site.querySelectorAll<SVGElement>("svg"))) {
        // outermost svg only; the filter cascades to nested content
        if (svg.parentElement && svg.parentElement.closest("svg")) continue;
        if (svg.closest(".pc-nav, .pc-footer")) continue;
        const r = svg.getBoundingClientRect();
        if (Math.min(r.width, r.height) < MIN_SIZE) continue;
        if (!hasColour(svg)) continue;
        mark.push(svg);
      }
      mark.forEach((el) => el.setAttribute(MARK, ""));
    };

    const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(apply); };

    const attrObs = new MutationObserver(schedule);
    attrObs.observe(document.documentElement, { attributes: true, attributeFilter: [SCHEME_ATTR] });

    // Re-run on DOM changes (client navigation, lazy content). childList only, so
    // our own attribute writes never retrigger it.
    const domObs = new MutationObserver(schedule);
    domObs.observe(document.body, { childList: true, subtree: true });

    apply();

    return () => { attrObs.disconnect(); domObs.disconnect(); cancelAnimationFrame(raf); restore(); };
  }, []);

  return null;
}
