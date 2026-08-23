"use client";

import { useEffect, useRef, useState } from "react";

// Shared "magnifier enlarge" for ancestor tiles, extracted VERBATIM from the
// mini pit learn layer (components/PackPit/LineageMap.tsx: the zoom overlay and
// the info/description panel) so the mini pit and /chums2 render the exact same
// markup and behaviour. The enlarged image grows in place from the tile with a
// navy description panel (yellow name) beside it: no dimmed backdrop, no X, and
// a 2 second auto-close once the pointer leaves it (draggable while open).
//
// The host owns which tile is open and passes the tile's resolved on-screen
// rect as `anchor` (top-left px + size); the drag offset and the 2s timer live
// here. The inline styles are intentionally verbatim from the shipped overlay,
// so this component keeps them inline rather than moving to a CSS module.

export type TileZoomOpen = {
  img: string;         // final image URL (host applies any cache-busting)
  name: string;
  description: string;
  anchor: { x: number; y: number; size: number };
};

export default function TileZoom({ open, onClose, persist = false, borderColor }: {
  open: TileZoomOpen | null;
  onClose: () => void;
  // persist (chums2, 2026-08-23): disable the 2s auto-close, so the enlarged image
  // stays until the host closes it (outside click / opening another). The mini pit
  // passes nothing, so it KEEPS its 2s release. See chums2 popout-persistence item.
  persist?: boolean;
  // borderColor (chums2, 2026-08-23): the enlarged image border colour, set to the
  // ancestor's tile-outline status colour (green/orange/red). Defaults to the mini
  // pit's blue, so the pit is unchanged.
  borderColor?: string;
}) {
  const [zoomOff, setZoomOff] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  // The panel hides on its own mouse-leave while the enlarged image stays (this
  // is the mini pit's `setInfoHover(null)` behaviour); the image alone arms the
  // 2s close (its `magnifyRelease`).
  const [panelHidden, setPanelHidden] = useState(false);
  const zoomDrag = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number } | null>(null);
  const zoomTimer = useRef<number | null>(null);

  const clearTimer = () => { if (zoomTimer.current) { window.clearTimeout(zoomTimer.current); zoomTimer.current = null; } };
  // stays big 2s, then closes (mirrors LineageMap magnifyRelease)
  const armRelease = () => { if (persist) return; clearTimer(); zoomTimer.current = window.setTimeout(() => { zoomTimer.current = null; onClose(); }, 2000); };

  // Clear the timer on unmount. The drag offset / panel visibility reset per tile
  // by the host giving this a `key` (a new tile remounts it), so no reset effect
  // is needed here.
  useEffect(() => () => clearTimer(), []);

  if (!open) return null;
  const { img, name, description, anchor } = open;
  const zoomSize = anchor.size * 3;
  const imgLeft = anchor.x + zoomOff.x;
  const imgTop = anchor.y + zoomOff.y;

  const PANEL_W = 219, EDGE = 8;
  const vw = typeof window === "undefined" ? 1024 : window.innerWidth;
  const vh = typeof window === "undefined" ? 768 : window.innerHeight;
  const rightLeft = imgLeft + zoomSize + 10;
  const fitsRight = rightLeft + PANEL_W <= vw - EDGE;
  const panelLeft = fitsRight ? rightLeft : Math.max(EDGE, Math.min(vw - EDGE - PANEL_W, imgLeft));
  const topRaw = fitsRight ? imgTop : imgTop + zoomSize + 14;
  const panelTop = Math.max(EDGE, Math.min(topRaw, vh - 120));

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={encodeURI(img)}
        alt={name}
        draggable={false}
        // persist hosts close the image on an OUTSIDE click; a click ON it must not
        // count as outside. The pit (no persist) is unchanged (undefined handler).
        onClick={persist ? (e) => e.stopPropagation() : undefined}
        onMouseEnter={clearTimer}
        onMouseLeave={() => { if (!zoomDrag.current) armRelease(); }}
        onPointerDown={(e) => { e.stopPropagation(); try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* no capture */ } zoomDrag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: zoomOff.x, oy: zoomOff.y }; clearTimer(); }}
        onPointerMove={(e) => { const d = zoomDrag.current; if (!d || e.pointerId !== d.id) return; setZoomOff({ x: d.ox + (e.clientX - d.sx), y: d.oy + (e.clientY - d.sy) }); }}
        onPointerUp={(e) => { const d = zoomDrag.current; if (d && e.pointerId === d.id) { try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch { /* no capture */ } zoomDrag.current = null; armRelease(); } }}
        onPointerCancel={() => { zoomDrag.current = null; armRelease(); }}
        style={{ position: "fixed", left: imgLeft, top: imgTop, width: zoomSize, height: zoomSize, zIndex: 120, objectFit: "cover", borderRadius: 18, border: `5px solid ${borderColor ?? "var(--blue-deep)"}`, boxShadow: "0 10px 30px rgba(0,0,0,0.45)", cursor: "grab", touchAction: "none", userSelect: "none" }}
      />
      {!panelHidden && (
        <div
          onMouseLeave={() => setPanelHidden(true)}
          onClick={persist ? (e) => e.stopPropagation() : undefined}
          style={{ position: "fixed", left: panelLeft, top: panelTop, maxWidth: PANEL_W, zIndex: 100, pointerEvents: "auto", background: "rgba(10, 58, 87, 0.92)", color: "#ffffff", font: "500 11px/1.4 Montserrat, system-ui, sans-serif", padding: "7px 10px", borderRadius: "8px", boxShadow: "0 4px 12px rgba(10, 58, 87, 0.35)" }}
        >
          <div style={{ fontFamily: "'Luckiest Guy', system-ui", fontSize: "13px", marginBottom: "4px", color: "var(--yellow, #ffd23e)" }}>{name}</div>
          {description}
        </div>
      )}
    </>
  );
}
