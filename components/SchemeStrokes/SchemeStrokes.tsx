"use client";

// Item 6 (seven-changes redesign). In a scheme, any container with rounded
// corners gets a stroke so its boundary stays visible once the monochrome sweep
// has flattened its fill to the page colour. The rule is exactly: computed
// border-radius greater than zero gets a foreground outline; body text and
// headings (radius 0) do not. CSS selectors cannot test border-radius, so this
// runs a scheme-only DOM pass that marks the matching elements with
// data-pc-stroke; contrast-schemes.css paints the outline. One-step restore when
// the scheme clears. Modelled on SchemeShapes.
//
// The header chrome (.pc-nav: hamburger, toolbar) is excluded: it already takes
// a per-scheme stroke from the header rules, and a second outline would fight
// those. The portalled menus and hide-images blocks live outside #pc-site, so
// they are out of scope here (the accessibility menu strokes its own boxes).

import { useEffect } from "react";

const SCHEME_ATTR = "data-pc-contrast-scheme";
const MARK = "data-pc-stroke";

export default function SchemeStrokes() {
  useEffect(() => {
    let raf = 0;

    const active = () => !!document.documentElement.getAttribute(SCHEME_ATTR);

    const restore = () => {
      document.querySelectorAll("[" + MARK + "]").forEach((el) => el.removeAttribute(MARK));
    };

    const rounded = (cs: CSSStyleDeclaration) =>
      parseFloat(cs.borderTopLeftRadius) > 0 ||
      parseFloat(cs.borderTopRightRadius) > 0 ||
      parseFloat(cs.borderBottomLeftRadius) > 0 ||
      parseFloat(cs.borderBottomRightRadius) > 0;

    const apply = () => {
      restore();
      if (!active()) return;
      const site = document.getElementById("pc-site");
      if (!site) return;
      // Single read pass (getComputedStyle + rect), then a single write pass, so
      // no layout thrash. Only runs while a scheme is active.
      const mark: HTMLElement[] = [];
      for (const el of Array.from(site.querySelectorAll<HTMLElement>("*"))) {
        if (el.closest(".pc-nav")) continue; // header chrome already stroked
        const cs = getComputedStyle(el);
        if (!rounded(cs)) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 4 || r.height < 4) continue;
        mark.push(el);
      }
      mark.forEach((el) => el.setAttribute(MARK, ""));
    };

    const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(apply); };

    const attrObs = new MutationObserver(schedule);
    attrObs.observe(document.documentElement, { attributes: true, attributeFilter: [SCHEME_ATTR] });

    // Re-run when the DOM structure changes (client navigation, lazy content).
    // Observes childList only, so our own attribute writes never retrigger it.
    const domObs = new MutationObserver(schedule);
    domObs.observe(document.body, { childList: true, subtree: true });

    apply();

    return () => { attrObs.disconnect(); domObs.disconnect(); cancelAnimationFrame(raf); restore(); };
  }, []);

  return null;
}
