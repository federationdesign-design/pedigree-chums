"use client";

// Rules A and B (general, replacing the per-page hero fixes: /home, /about, and
// the five .heroImg pages were each fixed by hand before this). Both rules need a
// fact the monochrome sweep hides at scheme time -- an element's AUTHOR background
// -- so they read backgrounds from the stylesheets (CSSOM), which the sweep's
// computed !important overrides do not touch, then mark matches for
// contrast-schemes.css to act on. Modelled on SchemeStrokes; one-step restore.
//
// Rule A (data-pc-cover): an absolutely or fixed positioned element that covers a
// media element's centre, paints above it, and has NO background of its own (no
// author background image, no opaque author background colour) is a pure overlay
// the sweep would fill and use to hide the media. Marked, it goes transparent.
// Skipping own-background elements is what stops it stripping the hero photo
// containers (they carry the photo as their background: that is Rule B's job).
//
// Rule B (data-pc-crushbg): an element whose author background image is a PHOTO
// (jpg/png/webp/avif) with text rendered over it is a backdrop, not decoration, so
// it is kept (excluded from the strip in the sweep selector) and crushed rather
// than stripped. Elements that CONTAIN a media tag are skipped, so a video/image
// inside is not crushed twice (0.55 x 0.55).
//
// Scans #pc-site and every data-pc-reach root (the body-level overlays).

import { useEffect } from "react";

const SCHEME_ATTR = "data-pc-contrast-scheme";
const COVER = "data-pc-cover";
const CRUSHBG = "data-pc-crushbg";
const PHOTO = /\.(jpg|jpeg|png|webp|avif)(\?|#|$)/i;

type BgRule = { sel: string; hasImage: boolean; photo: boolean; opaqueColor: boolean };

export default function SchemeLayers() {
  useEffect(() => {
    let raf = 0;
    let bgRules: BgRule[] | null = null;

    const active = () => !!document.documentElement.getAttribute(SCHEME_ATTR);
    const restore = () => {
      document
        .querySelectorAll("[" + COVER + "],[" + CRUSHBG + "]")
        .forEach((el) => { el.removeAttribute(COVER); el.removeAttribute(CRUSHBG); });
    };

    // Author background rules from the CSSOM, parsed once (sheets do not change).
    // Pseudo rules are skipped so a :hover / ::before background never counts as
    // the element's own background.
    const collectBg = (): BgRule[] => {
      const out: BgRule[] = [];
      for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRuleList;
        try { rules = sheet.cssRules; } catch { continue; }
        const walk = (list: CSSRuleList) => {
          for (const r of Array.from(list) as unknown as CSSStyleRule[]) {
            // Process this rule if it is a style rule. NB: a CSSStyleRule exposes a
            // truthy but empty .cssRules (CSS Nesting), so process first, then only
            // recurse into non-empty lists -- otherwise every rule is skipped.
            // Skip the scheme's own machinery: the sweep sets background-color to
            // #fff/#000, which is NOT an author background. Reading it would make
            // hasAuthorBg true for everything the sweep fills.
            if (
              r.style && r.selectorText &&
              !/::|:hover|:focus|:active|:visited/.test(r.selectorText) &&
              !/data-pc-/.test(r.selectorText)
            ) {
              const bi = (r.style.backgroundImage || "") + " " + (r.style.background || "");
              const urlM = /url\((['"]?)([^'")]+)\1\)/.exec(bi);
              const hasImage = !!urlM && !/gradient/.test(bi);
              const photo = !!(urlM && PHOTO.test(urlM[2]));
              const bc = (r.style.backgroundColor || "").toLowerCase();
              const opaqueColor =
                !!bc &&
                !["transparent", "initial", "inherit", "unset", "currentcolor"].includes(bc) &&
                !/rgba\([^)]*,\s*0(\.0+)?\s*\)/.test(bc);
              if (hasImage || opaqueColor) out.push({ sel: r.selectorText, hasImage, photo, opaqueColor });
            }
            const nested = (r as unknown as { cssRules?: CSSRuleList }).cssRules;
            if (nested && nested.length) walk(nested);
            const imp = (r as unknown as { styleSheet?: CSSStyleSheet }).styleSheet;
            if (imp) { try { if (imp.cssRules && imp.cssRules.length) walk(imp.cssRules); } catch { /* cross-origin */ } }
          }
        };
        walk(rules);
      }
      return out;
    };

    const matchesAny = (el: Element, pred: (b: BgRule) => boolean) => {
      for (const b of bgRules as BgRule[]) {
        if (!pred(b)) continue;
        try { if (el.matches(b.sel)) return true; } catch { /* bad selector */ }
      }
      return false;
    };
    const hasAuthorBg = (el: Element) => matchesAny(el, (b) => b.hasImage || b.opaqueColor);
    const hasPhotoBg = (el: Element) => matchesAny(el, (b) => b.photo);

    const rect = (el: Element) => el.getBoundingClientRect();
    const isMediaTag = (el: Element) => ["IMG", "VIDEO", "IFRAME", "CANVAS"].includes(el.tagName);
    const paintsAbove = (el: Element, m: Element) => {
      const ze = parseInt(getComputedStyle(el).zIndex) || 0;
      const zm = parseInt(getComputedStyle(m).zIndex) || 0;
      if (ze !== zm) return ze > zm;
      return !!(el.compareDocumentPosition(m) & Node.DOCUMENT_POSITION_PRECEDING);
    };
    const directText = (el: Element) => {
      for (const n of Array.from(el.childNodes)) {
        if (n.nodeType === 3 && (n.textContent || "").trim().length > 1) return true;
      }
      return false;
    };
    const hasTextOver = (el: Element, all: Element[]) => {
      if (directText(el)) return true;
      for (const d of Array.from(el.querySelectorAll("*"))) {
        if (directText(d)) { const r = rect(d); if (r.width > 4 && r.height > 4) return true; }
      }
      const rc = rect(el);
      for (const t of all) {
        if (t === el || el.contains(t) || t.contains(el) || !directText(t)) continue;
        const tb = rect(t);
        if (tb.width < 8 || tb.height < 8) continue;
        const ox = Math.max(0, Math.min(rc.right, tb.right) - Math.max(rc.left, tb.left));
        const oy = Math.max(0, Math.min(rc.bottom, tb.bottom) - Math.max(rc.top, tb.top));
        if (ox > 4 && oy > 4 && paintsAbove(t, el)) return true;
      }
      return false;
    };

    const scopes = () => {
      const list: Element[] = [];
      const site = document.getElementById("pc-site");
      if (site) list.push(site);
      document.querySelectorAll("[data-pc-reach]").forEach((e) => list.push(e));
      return list;
    };

    const apply = () => {
      restore();
      if (!active()) return;
      if (!bgRules) bgRules = collectBg();
      for (const scope of scopes()) {
        const all = Array.from(scope.querySelectorAll<HTMLElement>("*"));
        const media = all
          .filter((el) => isMediaTag(el) || hasPhotoBg(el))
          .map((el) => ({ el, r: rect(el) }))
          .filter((m) => m.r.width > 24 && m.r.height > 24);

        for (const el of all) {
          if (el.closest(".pc-nav, .pc-footer")) continue;
          const r = rect(el);
          if (r.width < 24 || r.height < 24) continue;

          // Rule B: photo backdrop behind text, not wrapping a media tag.
          if (hasPhotoBg(el) && !el.querySelector("img,video,iframe,canvas") && hasTextOver(el, all)) {
            el.setAttribute(CRUSHBG, "");
          }

          // Rule A: absolute/fixed overlay over media, with no background of its own.
          const cs = getComputedStyle(el);
          if ((cs.position === "absolute" || cs.position === "fixed") && !hasAuthorBg(el)) {
            const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
            for (const m of media) {
              if (m.el === el || el.contains(m.el) || m.el.contains(el)) continue;
              if (cx >= m.r.left && cx <= m.r.right && cy >= m.r.top && cy <= m.r.bottom && paintsAbove(el, m.el)) {
                el.setAttribute(COVER, "");
                break;
              }
            }
          }
        }
      }
    };

    const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(apply); };
    const attrObs = new MutationObserver(schedule);
    attrObs.observe(document.documentElement, { attributes: true, attributeFilter: [SCHEME_ATTR] });
    const domObs = new MutationObserver(schedule);
    domObs.observe(document.body, { childList: true, subtree: true });
    apply();

    return () => { attrObs.disconnect(); domObs.disconnect(); cancelAnimationFrame(raf); restore(); };
  }, []);

  return null;
}
