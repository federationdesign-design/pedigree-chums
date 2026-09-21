"use client";

import { useEffect, useState } from "react";

/* ?schemediag=1 ON A CHUM PAGE, 21 September 2026. A TEST HOOK, remove once used.

   WHY IT EXISTS. With an accessibility scheme on, the circle diagram draws bigger and
   cropped, and two readings of the stylesheet have not found why. Rather than guess a
   third time, this prints what the browser actually has for the diagram, so the same
   page can be read in the default colours and in a scheme and the two compared.

   It reads, every 700ms: the diagram stage's box, its svg's box and viewBox, the first
   group's transform (the diagram's own zoom and pan), the content's drawn extent, and for
   the svg and each ancestor up to the canvas: overflow, filter, clip-path, transform, and
   whether a scheme script has marked it. Read only; it changes nothing on the page. */
export default function SchemeDiag() {
  const [lines, setLines] = useState<string[]>([]);
  useEffect(() => {
    const read = () => {
      const out: string[] = [];
      out.push(`scheme: ${document.documentElement.getAttribute("data-pc-contrast-scheme") ?? "none"}`);
      const stage = document.querySelector('[data-region="diagram"]') as HTMLElement | null;
      if (!stage) { setLines([...out, "no diagram stage"]); return; }
      const r = (el: Element) => { const b = el.getBoundingClientRect(); return `${Math.round(b.width)}x${Math.round(b.height)} @${Math.round(b.left)},${Math.round(b.top)}`; };
      out.push(`stage ${r(stage)}`);
      const svg = stage.querySelector("svg");
      if (svg) {
        out.push(`svg ${r(svg)} viewBox=${svg.getAttribute("viewBox")} w=${svg.getAttribute("width")} h=${svg.getAttribute("height")}`);
        const g = svg.querySelector("g");
        out.push(`g0 transform=${g?.getAttribute("transform") ?? "-"} style.transform=${g ? getComputedStyle(g).transform : "-"}`);
        try { const bb = (svg as SVGSVGElement).getBBox(); out.push(`content bbox ${Math.round(bb.width)}x${Math.round(bb.height)} @${Math.round(bb.x)},${Math.round(bb.y)}`); } catch { out.push("content bbox n/a"); }
        const circles = svg.querySelectorAll("circle");
        const big = [...circles].map((c) => Number(c.getAttribute("r") || 0)).sort((a, b) => b - a)[0];
        out.push(`circles ${circles.length}, largest r=${big?.toFixed?.(1) ?? "-"}`);
      }
      let el: Element | null = svg ?? stage;
      let depth = 0;
      while (el && depth < 7) {
        const cs = getComputedStyle(el);
        const tag = el.tagName.toLowerCase() + (el.getAttribute("data-region") ? `[${el.getAttribute("data-region")}]` : "") + (el.hasAttribute("data-canvas") ? "[canvas]" : "");
        const marks = ["data-pc-crush", "data-pc-stroke", "data-pc-cover", "data-pc-crushbg"].filter((m) => el!.hasAttribute(m)).join(",");
        out.push(`${depth} ${tag} ov=${cs.overflow} filt=${cs.filter} clip=${cs.clipPath} tf=${cs.transform} ${marks ? "MARK:" + marks : ""}`);
        if (el.hasAttribute("data-canvas")) break;
        el = el.parentElement;
        depth++;
      }
      setLines(out);
    };
    read();
    const t = window.setInterval(read, 700);
    return () => window.clearInterval(t);
  }, []);
  return (
    <pre style={{ position: "fixed", right: 8, bottom: 8, zIndex: 400, maxWidth: 720, whiteSpace: "pre-wrap", font: "11px/1.35 ui-monospace, Menlo, monospace", background: "#fff", color: "#000", border: "2px solid #000", padding: 8, margin: 0, pointerEvents: "none" }}>
      {lines.join("\n")}
    </pre>
  );
}
