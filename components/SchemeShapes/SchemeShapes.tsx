"use client";

// Root fix for non-text SHAPES in a scheme. The monochrome sweep flattens every
// background to the scheme background, so anything drawn as a background-coloured
// shape (rating dots, bar fills and tracks, icon bars, thin dividers) collapses
// and its state or presence is lost. CSS cannot recover it: the distinction lives
// in the original colour or the class the sweep overrode.
//
// This pass runs whenever a scheme is active and remaps small or thin shapes only
// (so it can never repaint a large panel). State is read two ways:
//   - inline background: opaque -> foreground solid ("on"); faint/low-alpha ->
//     background + foreground ring ("off")
//   - otherwise by class convention: empty/track/wrap -> hollow; everything else
//     (filled, fill, icon bars, dividers) -> foreground solid
// It is general: any indicator built this way, now or later, is handled without
// per-component CSS. One-step restore when the scheme clears.

import { useEffect } from "react";

const SCHEME_ATTR = "data-pc-contrast-scheme";
const SHAPE_SEL = [
  "[style*='background']", "[class*='dot']", "[class*='Dot']", "[class*='bar']",
  "[class*='Bar']", "[class*='Fill']", "[class*='fill']", "[class*='Empty']",
  "[class*='empty']", "[class*='pip']", "[class*='tick']", "[class*='rule']",
  "[class*='Line']", "[class*='divider']", "[class*='indicator']", "[class*='meter']",
].map((s) => "#pc-site " + s).join(",");

export default function SchemeShapes() {
  useEffect(() => {
    let raf = 0;
    let domObs: MutationObserver | null = null;

    const colours = () => {
      const s = document.documentElement.getAttribute(SCHEME_ATTR);
      if (s === "black-on-white") return { fg: "#000000", bg: "#ffffff" };
      if (s === "white-on-black") return { fg: "#ffffff", bg: "#000000" };
      return null;
    };
    const alphaOf = (c: string) => { const m = String(c).match(/[\d.]+/g); return m && m.length >= 4 ? +m[3] : (c && c !== "transparent" ? 1 : 0); };

    const candidate = (el: HTMLElement) => {
      if (Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent!.trim())) return false;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return false; // keep hairline rules (1px dividers)
      const min = Math.min(r.width, r.height), max = Math.max(r.width, r.height);
      return min <= 24 || max / min >= 4; // a dot, a chip, or an elongated bar/line
    };

    const restore = () => {
      document.querySelectorAll<HTMLElement>("[data-pc-shape]").forEach((el) => {
        el.style.cssText = el.getAttribute("data-pc-shape") || "";
        el.removeAttribute("data-pc-shape");
      });
    };

    const apply = () => {
      restore();
      const c = colours();
      if (!c) return;
      const site = document.getElementById("pc-site");
      if (!site) return;
      const seen = new Set<HTMLElement>();
      for (const el of Array.from(site.querySelectorAll<HTMLElement>(SHAPE_SEL))) {
        if (seen.has(el) || !candidate(el)) continue;
        seen.add(el);
        const inlineBg = el.style.backgroundColor;
        const cls = el.getAttribute("class") || "";
        let hollow: boolean;
        if (inlineBg) hollow = alphaOf(inlineBg) < 0.5;
        else if (/line|rule|divider|separator/i.test(cls)) hollow = false; // decorative rules are solid, not tracks
        else hollow = /empty|track|wrap|inactive|(^|[^a-z])off([^a-z]|$)/i.test(cls);
        el.setAttribute("data-pc-shape", el.style.cssText);
        if (hollow) {
          el.style.setProperty("background-color", c.bg, "important");
          el.style.setProperty("box-shadow", "inset 0 0 0 1.5px " + c.fg, "important");
        } else {
          el.style.setProperty("background-color", c.fg, "important");
          el.style.setProperty("box-shadow", "none", "important");
        }
      }
    };

    const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(apply); };
    const attrObs = new MutationObserver(schedule);
    attrObs.observe(document.documentElement, { attributes: true, attributeFilter: [SCHEME_ATTR] });
    domObs = new MutationObserver((muts) => {
      if (muts.every((m) => (m.target as HTMLElement).hasAttribute?.("data-pc-shape"))) return;
      schedule();
    });
    domObs.observe(document.body, { childList: true, subtree: true });
    apply();

    return () => { attrObs.disconnect(); domObs?.disconnect(); cancelAnimationFrame(raf); restore(); };
  }, []);

  return null;
}
