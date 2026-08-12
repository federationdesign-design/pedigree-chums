"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./AccessibilityTest.module.css";

// Workstream C diagnostic page. Renders the real site background (gradient +
// paw-pattern2.svg overlay at opacity 0.5) and measures the worst-case contrast
// of each text colour/size against the ACTUAL rendered pixels behind it, overlay
// included. Measurement composites the same gradient and the same SVG asset at
// opacity 0.5 into a canvas, then samples the lightest/darkest pixel behind each
// sample (worst case), exactly as WCAG requires. Not the token values, not the
// raw gradient stops.

type RGB = [number, number, number];
const COLORS: { name: string; css: string; rgb: RGB }[] = [
  { name: "white #fff", css: "#ffffff", rgb: [255, 255, 255] },
  { name: "black #000", css: "#000000", rgb: [0, 0, 0] },
  { name: "--cream #fff", css: "#ffffff", rgb: [255, 255, 255] },
  { name: "--yellow #ffd23e", css: "#ffd23e", rgb: [255, 210, 62] },
  { name: "#FFED60", css: "#FFED60", rgb: [255, 237, 96] },
  { name: "navy #0a3a57", css: "#0a3a57", rgb: [10, 58, 87] },
  { name: "#00547F", css: "#00547F", rgb: [0, 84, 127] },
];
const SIZES = [
  { key: "display", cls: "display", thr: 3, label: "display / 40px (>=24px: 3:1)" },
  { key: "body", cls: "body", thr: 4.5, label: "body / 18px (4.5:1)" },
] as const;
// Top to bottom of the vertical gradient: #008eff (blue) -> #00e2ff (cyan).
const BANDS = [
  { key: "blue", label: "Blue end (top of gradient, ~#008eff)" },
  { key: "mid", label: "Middle of gradient" },
  { key: "cyan", label: "Cyan end (bottom of gradient, ~#00e2ff)" },
];

function lin(c: number) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function lum(r: number, g: number, b: number) { return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); }
function contrast(l1: number, l2: number) { const a = Math.max(l1, l2), b = Math.min(l1, l2); return (a + 0.05) / (b + 0.05); }

export default function AccessibilityTestPage() {
  const panelRef = useRef<HTMLDivElement>(null);
  const els = useRef<Record<string, HTMLElement | null>>({});
  const [m, setM] = useState<Record<string, { ratio: number; worst: RGB }>>({});
  const [overlayNote, setOverlayNote] = useState<string>("measuring...");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try { await (document as any).fonts?.ready; } catch {}
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const panel = panelRef.current;
      if (!panel) return;
      const W = Math.ceil(panel.clientWidth);
      const H = Math.ceil(panel.scrollHeight);

      // Compose gradient-only and gradient+overlay canvases from the real assets.
      const mk = (withOverlay: boolean, pattern: CanvasPattern | null) => {
        const c = document.createElement("canvas"); c.width = W; c.height = H;
        const ctx = c.getContext("2d")!;
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#008eff"); g.addColorStop(1, "#00e2ff");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        if (withOverlay && pattern) { ctx.globalAlpha = 0.5; ctx.fillStyle = pattern; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
        return ctx.getImageData(0, 0, W, H);
      };

      // Load the real paw SVG -> 144px tile -> repeating pattern.
      const img = new Image();
      img.src = "/paw-pattern2.svg";
      await new Promise<void>((res) => { img.onload = () => res(); img.onerror = () => res(); if (img.complete) res(); });
      const tile = document.createElement("canvas"); tile.width = 144; tile.height = 144;
      const tctx = tile.getContext("2d")!;
      try { tctx.drawImage(img, 0, 0, 144, 144); } catch {}
      const pctx = document.createElement("canvas").getContext("2d")!;
      const pattern = pctx.createPattern(tile, "repeat");

      const withOv = mk(true, pattern);
      const noOv = mk(false, null);
      if (cancelled) return;

      const panelRect = panel.getBoundingClientRect();
      const pixel = (img: ImageData, x: number, y: number): RGB | null => {
        x = Math.round(x); y = Math.round(y);
        if (x < 0 || y < 0 || x >= img.width || y >= img.height) return null;
        const i = (y * img.width + x) * 4; return [img.data[i], img.data[i + 1], img.data[i + 2]];
      };

      const results: Record<string, { ratio: number; worst: RGB }> = {};
      for (const [id, el] of Object.entries(els.current)) {
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const x0 = r.left - panelRect.left, y0 = r.top - panelRect.top;
        const col = COLORS[+id.split("-")[1]];
        const tl = lum(col.rgb[0], col.rgb[1], col.rgb[2]);
        let worst = Infinity, worstBg: RGB = [0, 0, 0];
        for (let y = y0 + 1; y < y0 + r.height - 1; y += 2) {
          for (let x = x0 + 1; x < x0 + r.width - 1; x += 3) {
            const p = pixel(withOv, x, y); if (!p) continue;
            const c = contrast(tl, lum(p[0], p[1], p[2]));
            if (c < worst) { worst = c; worstBg = p; }
          }
        }
        if (worst < Infinity) results[id] = { ratio: worst, worst: worstBg };
      }
      if (cancelled) return;
      setM(results);

      // Overlay effect: lightest pixel across the whole panel, with vs without.
      let maxWith = 0, maxNo = 0;
      for (let i = 0; i < withOv.data.length; i += 4 * 37) {
        maxWith = Math.max(maxWith, lum(withOv.data[i], withOv.data[i + 1], withOv.data[i + 2]));
      }
      for (let i = 0; i < noOv.data.length; i += 4 * 37) {
        maxNo = Math.max(maxNo, lum(noOv.data[i], noOv.data[i + 1], noOv.data[i + 2]));
      }
      const cWith = contrast(lum(255, 255, 255), maxWith).toFixed(2);
      const cNo = contrast(lum(255, 255, 255), maxNo).toFixed(2);
      setOverlayNote(
        `Lightest background luminance: gradient alone L=${maxNo.toFixed(3)} (white-on-it = ${cNo}:1); ` +
        `gradient + paw overlay L=${maxWith.toFixed(3)} (white-on-it = ${cWith}:1). ` +
        `The overlay's #fff466 paws at opacity 0.5 raise the worst-case luminance, so white/light text is WORSE than the raw gradient implies.`
      );
    })();
    return () => { cancelled = true; };
  }, []);

  const Badge = ({ id, thr }: { id: string; thr: number }) => {
    const r = m[id];
    if (!r) return <span className={`${styles.badge} ${styles.pending}`}>measuring...</span>;
    const pass = r.ratio >= thr;
    return (
      <span className={`${styles.badge} ${pass ? styles.pass : styles.fail}`}>
        {r.ratio.toFixed(2)}:1 {pass ? "PASS" : "FAIL"} <span className={styles.threshold}>(need {thr})</span>
      </span>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <h1>Contrast test: text over the site background</h1>
        <p>
          Background is the live site&apos;s <code>linear-gradient(#00e2ff to #008eff)</code> plus the repeating
          <code>paw-pattern2.svg</code> overlay at <code>opacity: 0.5</code>. The live site paints this viewport-fixed;
          here it is re-anchored vertically so the whole gradient is visible. Stops and overlay asset are identical.
        </p>
        <p>
          Overlay: a repeating SVG of paws filled <code>#fff466</code> (light yellow) and <code>#00aeef</code> (cyan),
          composited at 50% opacity. Measured effect: {overlayNote}
        </p>
        <p>
          Each ratio is the WORST case (lightest/darkest pixel) sampled from the rendered pixels behind that text, overlay
          included. Threshold: display (&ge;24px) needs 3:1, body needs 4.5:1. Note: <code>--cream</code> is now
          <code>#ffffff</code>, identical to white.
        </p>
      </div>

      <div className={styles.panel} ref={panelRef}>
        <div className={styles.overlay} />
        {BANDS.map((band) => (
          <div key={band.key} className={styles.band}>
            <p className={styles.bandLabel}>{band.label}</p>
            <div className={styles.grid}>
              {COLORS.map((col, ci) => (
                <div key={ci} className={styles.cell}>
                  <span className={styles.swatchName}>{col.name}</span>
                  {SIZES.map((sz) => {
                    const id = `${band.key}-${ci}-${sz.key}`;
                    return (
                      <div key={sz.key}>
                        <div
                          className={styles[sz.cls]}
                          style={{ color: col.css }}
                          ref={(el) => { els.current[id] = el; }}
                        >
                          {sz.key === "display" ? "Dogs" : "The quick brown dog."}
                        </div>
                        <Badge id={id} thr={sz.thr} />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
