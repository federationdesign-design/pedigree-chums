"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import styles from "./DomesdayMap.module.css";
import { GB } from "../SeaLevelMap/SeaLevelMap";
import { DOMESDAY_B64, DOMESDAY_COUNT, DOMESDAY_SHARES } from "../../data/domesday1086";

/* Who held England in 1086: every Domesday place as a dot, coloured by the
   tenant-in-chief who held most of it. Medieval era page, added 22 Sept 2026 at
   the owner's request. Data and licence notes: data/domesday1086.ts. Copy flagged
   for owner review.

   Drawn on a canvas (about 13,000 dots is too many DOM nodes for SVG). Same
   projection as the Ancient sea map: x = (lon + 11) * 20, y = (61 - lat) * 33,
   windowed to England. */

type Holder = 0 | 1 | 2;
type Filter = "all" | Holder;

const VIEW = { x: 88, y: 168, w: 178, h: 204 };
const LON0 = -6.5;
const LAT0 = 49.8;
const STEP = 0.005;

let cache: { x: number; y: number; c: Holder }[] | null = null;
const points = () => {
  if (!cache) {
    const bin = atob(DOMESDAY_B64);
    cache = [];
    for (let i = 0; i + 2 < bin.length; i += 3) {
      const v = (bin.charCodeAt(i) << 16) | (bin.charCodeAt(i + 1) << 8) | bin.charCodeAt(i + 2);
      const lon = LON0 + (v >> 13) * STEP;
      const lat = LAT0 + ((v >> 2) & 2047) * STEP;
      cache.push({ x: (lon + 11) * 20, y: (61 - lat) * 33, c: (v & 3) as Holder });
    }
  }
  return cache;
};

const HOLDERS: { id: Holder; label: string; share: number; colour: string }[] = [
  { id: 0, label: "The king", share: DOMESDAY_SHARES.king, colour: "#ffed00" },
  { id: 1, label: "The church", share: DOMESDAY_SHARES.church, colour: "#ffffff" },
  { id: 2, label: "The barons", share: DOMESDAY_SHARES.barons, colour: "var(--navy)" },
];

const cssColour = (c: string) => {
  if (!c.startsWith("var(")) return c;
  const v = getComputedStyle(document.documentElement).getPropertyValue(c.slice(4, -1)).trim();
  return v || "#0a3a57";
};

/* ACCESSIBILITY SCHEMES (22 Sept 2026, owner request). The site's contrast schemes
   (app/contrast-schemes.css, SchemeShapes) flatten colour to black and white, which
   made the share bar one solid block and the church's white dots vanish on white.
   So in a scheme this component draws its own monochrome encoding, told apart by
   SHAPE and PATTERN as well as tone:
     king   = solid foreground
     church = hollow ring on the map; diagonal hatch in the bar
     barons = mid grey (#767676 on white, #9e9e9e on black; both above 4.5:1)
   The bar and the marks are inline SVG with class names the SchemeShapes pass does
   not match (no "bar", "dot", "fill" etc.), so it leaves them alone. */
type Scheme = "black-on-white" | "white-on-black" | null;
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
const useScheme = (): Scheme => useSyncExternalStore(subscribeScheme, readScheme, () => null);

type Palette = { fg: string; land: string; fills: [string, string, string]; churchRing: boolean; churchHatch: boolean; edge: string };
const paletteFor = (scheme: Scheme): Palette => {
  if (scheme === "black-on-white")
    return { fg: "#000000", land: "rgba(0, 0, 0, 0.07)", fills: ["#000000", "#ffffff", "#767676"], churchRing: true, churchHatch: true, edge: "#000000" };
  if (scheme === "white-on-black")
    return { fg: "#ffffff", land: "rgba(255, 255, 255, 0.14)", fills: ["#ffffff", "#000000", "#9e9e9e"], churchRing: true, churchHatch: true, edge: "#ffffff" };
  return { fg: "#ffffff", land: "rgba(255, 255, 255, 0.16)", fills: ["#ffed00", "#ffffff", "#0a3a57"], churchRing: false, churchHatch: false, edge: "#ffffff" };
};

/* A holder's map marker, for the buttons. */
function HolderMark({ id, pal }: { id: Holder; pal: Palette }) {
  const ring = id === 1 && pal.churchRing;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className={styles.mark}>
      <circle cx="8" cy="8" r="6" fill={ring ? "none" : pal.fills[id]} stroke={ring ? pal.fg : pal.edge} strokeWidth={ring ? 2.5 : 1.5} />
    </svg>
  );
}

/* A holder's bar pattern, for the key under the bar. */
function HolderKey({ id, pal, hatchId }: { id: Holder; pal: Palette; hatchId: string }) {
  const hatch = id === 1 && pal.churchHatch;
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true" className={styles.mark}>
      <rect x="0.75" y="0.75" width="16.5" height="12.5" rx="3" fill={hatch ? `url(#${hatchId})` : pal.fills[id]} stroke={pal.edge} strokeWidth="1.5" />
    </svg>
  );
}

export default function DomesdayMap() {
  const [filter, setFilter] = useState<Filter>("all");
  const scheme = useScheme();
  const pal = paletteFor(scheme);
  const hatchId = "domesday-church-hatch";
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const draw = () => {
      const w = wrap.clientWidth;
      if (!w) return;
      const h = Math.round((w * VIEW.h) / VIEW.w);
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const k = (w / VIEW.w) * dpr;
      ctx.setTransform(k, 0, 0, k, -VIEW.x * k, -VIEW.y * k);
      ctx.clearRect(VIEW.x, VIEW.y, VIEW.w, VIEW.h);

      /* Faint Britain outline behind the dots. */
      ctx.beginPath();
      GB.forEach(([lo, la], i) => {
        const x = (lo + 11) * 20;
        const y = (61 - la) * 33;
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = pal.land;
      ctx.fill();

      const r = Math.max(0.55, 1.9 / (k / dpr));
      const colours = scheme ? pal.fills : HOLDERS.map((h2) => cssColour(h2.colour));
      /* Faded groups first, highlighted group last, so it sits on top. */
      const order: Holder[] = filter === "all" ? [2, 1, 0] : ([2, 1, 0] as Holder[]).filter((c) => c !== filter).concat(filter);
      for (const c of order) {
        ctx.globalAlpha = filter === "all" || filter === c ? 1 : 0.14;
        const ring = c === 1 && pal.churchRing;
        ctx.beginPath();
        for (const p of points()) {
          if (p.c !== c) continue;
          ctx.moveTo(p.x + r, p.y);
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        }
        if (ring) {
          /* Scheme: the church as hollow rings, so it reads without colour. */
          ctx.strokeStyle = pal.fg;
          ctx.lineWidth = r * 0.55;
          ctx.stroke();
        } else {
          ctx.fillStyle = colours[c];
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [filter, scheme]); // eslint-disable-line react-hooks/exhaustive-deps

  const shown = filter === "all" ? null : HOLDERS[filter];

  return (
    <section className={styles.panel} aria-labelledby="domesday-title">
      <div className={styles.layout}>
        <div className={styles.side}>
          <h2 id="domesday-title" className={`display ${styles.title}`}>
            Who Held <span className="display-yellow">England</span> in 1086?
          </h2>
          <p className={styles.intro}>
            William the Conqueror&apos;s Domesday Book recorded who held almost every village in England. Each dot is a place in the book, coloured by who held most of it. Tap a button to see whose land was whose.
          </p>

          <div className={styles.buttons} role="group" aria-label="Show land held by">
            {/* "All three", not "Everyone": ordinary people held no land in their own
                right, so "Everyone" misled (owner, 22 Sept 2026). */}
            <button type="button" className={styles.btn} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
              All three
            </button>
            {HOLDERS.map((h) => (
              <button key={h.id} type="button" className={styles.btn} aria-pressed={filter === h.id} onClick={() => setFilter(h.id)}>
                <HolderMark id={h.id} pal={pal} />
                {h.label}
              </button>
            ))}
          </div>

          <div className={styles.shareBlock}>
            <span className={styles.shareLabel}>Share of England&apos;s wealth in 1086</span>
            <div className={styles.shareGraphic} style={{ borderColor: pal.edge }} aria-hidden="true">
              <svg width="100%" height="100%" className={styles.shareSvg}>
                <defs>
                  <pattern id={hatchId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="6" height="6" fill={pal.fills[1]} />
                    <rect width="2.5" height="6" fill={pal.fg} />
                  </pattern>
                </defs>
                {HOLDERS.map((h, i) => {
                  const x = HOLDERS.slice(0, i).reduce((a, b) => a + b.share, 0);
                  const hatch = h.id === 1 && pal.churchHatch;
                  return (
                    <rect
                      key={h.id}
                      x={`${x}%`}
                      y="0"
                      width={`${h.share}%`}
                      height="100%"
                      fill={hatch ? `url(#${hatchId})` : scheme ? pal.fills[h.id] : h.colour}
                      opacity={filter === "all" || filter === h.id ? 1 : 0.3}
                    />
                  );
                })}
              </svg>
            </div>
            <ul className={styles.shareList}>
              {HOLDERS.map((h) => (
                <li key={h.id}>
                  <HolderKey id={h.id} pal={pal} hatchId={hatchId} />
                  <span className={styles.shareValue}>{h.share}%</span> {h.label.toLowerCase()}
                </li>
              ))}
            </ul>
          </div>

          <p className={styles.caption} aria-live="polite">
            {shown
              ? `${shown.label} held about ${shown.share}% of England's recorded wealth.`
              : `${DOMESDAY_COUNT.toLocaleString("en-GB")} places from the Domesday Book.`}
          </p>
        </div>

        <div className={styles.mapCol}>
          <div ref={wrapRef} className={styles.mapWrap}>
            <canvas
              ref={canvasRef}
              className={styles.canvas}
              role="img"
              aria-label={`Map of ${DOMESDAY_COUNT.toLocaleString("en-GB")} Domesday places. The king held about ${DOMESDAY_SHARES.king}%, the church about ${DOMESDAY_SHARES.church}% and the barons about ${DOMESDAY_SHARES.barons}% of recorded wealth.`}
            />
          </div>
          <p className={styles.note}>
            Each place is coloured by whoever held most of its value. The far north of England was not surveyed. Data: Professor J.J.N. Palmer and George Slater, University of Hull, via{" "}
            <a href="https://opendomesday.org/about/" target="_blank" rel="noopener noreferrer">
              Open Domesday
            </a>{" "}
            (CC BY-NC-SA).
          </p>
        </div>
      </div>
    </section>
  );
}
