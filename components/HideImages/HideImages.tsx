"use client";

// Task 7. When data-pc-hide-images is set on <html>, draw an opaque contrast
// block over every content image, video, inline SVG and background-image
// element inside #pc-site, carrying its accessible name (alt / aria-label /
// <title>) as visible text. The media itself is already hidden before paint by
// contrast-schemes.css, so nothing flashes and no layout shifts: the blocks are
// absolutely positioned in document coordinates in a zero-size root, so they
// scroll with the page and never affect layout. Removing the attribute restores
// everything in one action.

import { useEffect } from "react";

const HIDE_ATTR = "data-pc-hide-images";
const SCHEME_ATTR = "data-pc-contrast-scheme";
// Header icons are kept visible (the menu button must stay usable), so their
// blocks are not drawn either.
const KEEP = ".pc-nav";

export default function HideImages() {
  useEffect(() => {
    let root: HTMLDivElement | null = null;
    let raf = 0;
    let domObs: MutationObserver | null = null;

    const active = () => document.documentElement.hasAttribute(HIDE_ATTR);

    function blockColours() {
      const cs = getComputedStyle(document.documentElement);
      return {
        bg: cs.getPropertyValue("--pc-hb-bg").trim() || "#1a1a1a",
        text: cs.getPropertyValue("--pc-hb-text").trim() || "#ffffff",
      };
    }

    function accessibleName(el: Element): string {
      if (el instanceof HTMLImageElement) return (el.getAttribute("alt") || "").trim();
      const label = el.getAttribute("aria-label");
      if (label) return label.trim();
      const title = el.querySelector(":scope > title");
      if (title && title.textContent) return title.textContent.trim();
      return "";
    }

    // A raster <img> is anything not served as SVG. SVGs stay visible (inline
    // <svg> is never collected; an <img> whose source is a .svg is skipped).
    const isSvgImg = (e: Element) =>
      e instanceof HTMLImageElement && /\.svg(\?|$)/i.test(e.getAttribute("src") || "");

    function targets(): Element[] {
      const site = document.getElementById("pc-site");
      if (!site) return [];
      const set = new Set<Element>();
      // Raster images only. Inline SVG is never collected and SVG-sourced <img>
      // is skipped, so both kinds of SVG stay visible. Video also stays visible
      // (it is not raster), so it is not collected either.
      site.querySelectorAll("img").forEach((e) => { if (!isSvgImg(e)) set.add(e); });
      // Raster background-image content (hero panels etc), excluding the paw
      // texture, the gradient, and any SVG background (SVGs stay visible).
      site.querySelectorAll("*").forEach((e) => {
        if (e.id === "pc-hide-root" || (root && root.contains(e))) return;
        const bg = getComputedStyle(e).backgroundImage;
        if (bg && bg !== "none" && bg.indexOf("url(") !== -1 && bg.indexOf("paw-pattern") === -1 && bg.indexOf("gradient") === -1 && bg.toLowerCase().indexOf(".svg") === -1) {
          const r = e.getBoundingClientRect();
          if (r.width > 24 && r.height > 24) set.add(e);
        }
      });
      return Array.from(set).filter((e) => !e.closest(KEEP));
    }

    function teardown() {
      if (root) { root.remove(); root = null; }
    }

    function build() {
      teardown();
      if (!active()) return;
      root = document.createElement("div");
      root.id = "pc-hide-root";
      document.body.appendChild(root);
      const { bg, text } = blockColours();
      for (const el of targets()) {
        const r = el.getBoundingClientRect();
        if (r.width < 8 || r.height < 8) continue;
        const o = document.createElement("div");
        o.className = "pc-hide-overlay";
        o.style.left = r.left + window.scrollX + "px";
        o.style.top = r.top + window.scrollY + "px";
        o.style.width = r.width + "px";
        o.style.height = r.height + "px";
        o.style.background = bg;
        o.style.color = text;
        o.style.borderColor = text;
        // The block inherits the replaced element's own corner radius, read from
        // that element (not a wrapper): a rounded image becomes a rounded block,
        // a square image a square block.
        o.style.borderRadius = getComputedStyle(el).borderRadius;
        o.style.fontSize = Math.max(10, Math.min(20, Math.min(r.width, r.height) / 6)) + "px";
        const name = accessibleName(el);
        if (name) {
          const span = document.createElement("span");
          span.textContent = name;
          o.appendChild(span);
        }
        root.appendChild(o);
      }
    }

    function schedule() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(build);
    }

    const attrObs = new MutationObserver(schedule);
    attrObs.observe(document.documentElement, { attributes: true, attributeFilter: [HIDE_ATTR, SCHEME_ATTR] });

    // Re-draw when the DOM changes (lazy images, client navigation). Ignore
    // mutations that are only our own overlays, or building loops forever.
    domObs = new MutationObserver((muts) => {
      if (root && muts.every((m) => root!.contains(m.target) || m.target === root)) return;
      schedule();
    });
    domObs.observe(document.body, { childList: true, subtree: true });

    const ro = new ResizeObserver(schedule);
    ro.observe(document.body);
    window.addEventListener("resize", schedule);

    build();

    return () => {
      attrObs.disconnect();
      domObs?.disconnect();
      ro.disconnect();
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(raf);
      teardown();
    };
  }, []);

  return null;
}
