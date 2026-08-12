"use client";

import { useEffect, useRef } from "react";
import styles from "./TimeTunnel.module.css";

// Stage 1 of the time-tunnel transition: the receding rings and the shapes
// flying past, ported from prototypes/time-tunnel.html (approved as-is). It plays
// once for ~1.2s over the arriving pit, then fades out and calls onDone, which is
// what removes it and reveals the pit. The card dive (stage 2) and the rings
// clearing outward (stage 3) come later; this is rings + motes only.
//
// Canvas 2D only, NO CSS 3D: the depth is the 500/z perspective, not a transform,
// so nothing here can disturb the SVG stacking in the pit underneath. RAF id is
// held in a ref and cancelled on cleanup; reduced motion skips the tunnel and
// hands straight over.
const BG = "#0a3a57";
const COLORS = ["#00e2ff", "#008eff", "#ffed60"]; // two blues (matched to the pit gradient) and yellow

const RINGS = 40;
const SPACING = 100;
const MAXZ = RINGS * SPACING;
const TUNNEL_MS = 2000; // the tunnel run length; the card dive and bg both scale off this
const CLEAR_MS = 700; // the resolve window: rings rush outward and the canvas fades over this
const CLEAR_SPEED = 60; // rings rush the camera this fast while clearing (vs the ring ramp while travelling)

// Ring travel speed: its OWN dials, independent of the background dials below (tune
// one without touching the other). The rings used to travel at a flat speed and
// then jump straight to CLEAR_SPEED at the resolve, which read as a slow run that
// lurched at the very end. Instead the per-frame speed now ramps from
// RING_SPEED_START up to RING_SPEED_END across the TUNNEL_MS run, so the tunnel
// builds gradually and hands off into the clear with no jump. RING_ACCEL curves the
// ramp: 1 = linear even build, >1 = eases in (calmer start, quicker finish).
const RING_SPEED_START = 4;
const RING_SPEED_END = 32;
const RING_ACCEL = 1.25;

// Background timing: its OWN dials, independent of the ring-speed dials above.
// BG_HOLD_MS is how long the background stays flat navy; the shift from navy to the
// pit gradient then runs over BG_SHIFT_MS, curved by BG_SHIFT_EASE (1 = linear,
// >1 = eases in so navy holds visually and then warms sharply at the very end).
// The shift MUST finish by TUNNEL_MS (keep BG_HOLD_MS + BG_SHIFT_MS === TUNNEL_MS):
// the canvas has to already be the pit gradient before the clear-fade, or the fade
// reveals a navy/blue mismatch. Defaults hold navy for the first 80% and warm over
// the last 20%, and the ease keeps it reading navy until deep into that window.
const BG_HOLD_MS = 1600;
const BG_SHIFT_MS = 400;
const BG_SHIFT_EASE = 1.8;

// Shapes flying past, on the same perspective as the rings.
const MOTE_COUNT = 10; // fewer objects flying past
const MOTE_SPEED = 26;
const MOTE_ZNEAR = 60;
const MOTE_ZFAR = 3000;
const MOTE_SIZE = 11;
const MOTE_COLORS = ["#00e2ff", "#008eff", "#ffed60"]; // matched to the new ring colours

// Vanishing-point sway: a slow automatic bend so the tunnel reads as a bending
// passage. The prototype's pointer-follow makes no sense during a page
// transition, so the app uses the sine version only.
const SWAY_AMOUNT = 0.05;
const SWAY_PERIOD = 6000;

// The yellow card diving in from the clicked card (stage 2): a plain yellow
// rounded-rectangle stand-in that tumbles and shrinks into the vanishing point,
// as the approved prototype. It lands just before the tunnel finishes.
const CARD_FILL = "#ffd23e";
const CARD_EDGE = "#0a3a57";
const CARD_GREEN = "#22c55e"; // the card's green button (globals #22c55e)
const CARD_LINK = "#0b78bd"; // the small blue link icon
const CARD_RADIUS = 22; // matches the flip card's --radius-card (globals.css)
const CARD_MS = TUNNEL_MS - 200; // lands 200ms before the tunnel ends; scales with it
const CARD_SPINS = 1.5;
const CARD_SPIN_EASE = 1.6; // spin accel: >1 tightens near the end
const CARD_TRAVEL_EASE = 1.4; // >1 accelerates the card into the vanishing point
const CARD_FALLBACK_W = 160;
const CARD_FALLBACK_H = 200;

// Background transition: the tunnel starts flat navy and warms to the pit's own
// start-screen gradient by the end of the run, so the reveal has no seam. That
// gradient is the LineageModal overlay's: linear-gradient(to top right, #00e2ff,
// #008eff). createLinearGradient(0,H, W,0) is exactly "to top right"; each stop is
// lerped from navy to its target over the run.
const PIT_A = "#00e2ff"; // gradient start, bottom-left (bright cyan)
const PIT_B = "#008eff"; // gradient end, top-right (deeper azure)
const hexToRgb = (h: string): [number, number, number] => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const NAVY_RGB = hexToRgb(BG);
const PIT_A_RGB = hexToRgb(PIT_A);
const PIT_B_RGB = hexToRgb(PIT_B);
const mix = (a: [number, number, number], b: [number, number, number], t: number) =>
  `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)}, ${Math.round(a[1] + (b[1] - a[1]) * t)}, ${Math.round(a[2] + (b[2] - a[2]) * t)})`;

function starPath(): Path2D {
  const p = new Path2D();
  const spikes = 5, outer = 1, inner = 0.45;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = -Math.PI / 2 + (i * Math.PI) / spikes;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i) p.lineTo(x, y); else p.moveTo(x, y);
  }
  p.closePath();
  return p;
}
function bonePath(): Path2D {
  const p = new Path2D();
  const ex = 0.7, ey = 0.32, lobe = 0.42;
  p.moveTo(-ex + lobe, -ey); p.arc(-ex, -ey, lobe, 0, Math.PI * 2);
  p.moveTo(-ex + lobe, ey); p.arc(-ex, ey, lobe, 0, Math.PI * 2);
  p.moveTo(ex + lobe, -ey); p.arc(ex, -ey, lobe, 0, Math.PI * 2);
  p.moveTo(ex + lobe, ey); p.arc(ex, ey, lobe, 0, Math.PI * 2);
  p.rect(-ex, -0.3, ex * 2, 0.6);
  return p;
}

type Mote = { z: number; ang: number; rad: number; shape: number; color: string; spin0: number; spinRate: number; age: number };
type Rect = { x: number; y: number; w: number; h: number };

export default function TimeTunnel({ onDone, onResolve, fromRect }: { onDone?: () => void; onResolve?: () => void; fromRect?: Rect }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Keep the latest callbacks without re-running the tunnel effect below. Updated
  // in an effect, never during render, so they do not trip the refs rule. onResolve
  // fires once when the run ends and the clear begins: the pit grows its ring and
  // drops the dogs off that signal.
  const doneRef = useRef(onDone);
  useEffect(() => { doneRef.current = onDone; }, [onDone]);
  const onResolveRef = useRef(onResolve);
  useEffect(() => { onResolveRef.current = onResolve; }, [onResolve]);
  // The clicked card's viewport rect: where the card dives from. Captured at mount
  // and stable for the transition, so it is read from a ref when the loop starts
  // rather than added to the effect's deps.
  const rectRef = useRef(fromRect);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) { doneRef.current?.(); return; }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { doneRef.current?.(); return; } // no tunnel: hand straight over

    const SHAPES = [starPath(), bonePath()]; // bone and star only, the paw dropped
    const dpr = window.devicePixelRatio || 1;
    let W = 0, H = 0, cx = 0, cy = 0, vx = 0;
    const resize = () => {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = W / 2; cy = H / 2; vx = cx;
    };
    resize();
    window.addEventListener("resize", resize);

    const rings = Array.from({ length: RINGS }, (_, i) => ({ z: (i + 1) * SPACING, c: COLORS[i % 3] }));
    const motes: Mote[] = [];
    const seedMote = (m: Mote, z: number) => {
      m.z = z;
      m.ang = Math.random() * Math.PI * 2;
      m.rad = 20 + Math.random() * 220;
      m.shape = (Math.random() * SHAPES.length) | 0;
      m.color = MOTE_COLORS[(Math.random() * MOTE_COLORS.length) | 0];
      m.spin0 = Math.random() * Math.PI * 2;
      m.spinRate = (Math.random() - 0.5) * 0.06;
      m.age = 0;
    };
    for (let i = 0; i < MOTE_COUNT; i++) {
      const m = {} as Mote;
      seedMote(m, MOTE_ZNEAR + Math.random() * (MOTE_ZFAR - MOTE_ZNEAR));
      motes.push(m);
    }

    const drawRings = () => {
      const diag = Math.hypot(W, H);
      for (const r of rings) {
        if (r.z <= 0) continue; // gone past the camera while clearing
        const persp = 500 / r.z;
        const radius = persp * 200;
        if (radius > diag * 1.6) continue; // grown off screen while clearing
        ctx.beginPath();
        ctx.arc(vx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = r.c;
        ctx.lineWidth = 3 * persp;
        ctx.stroke();
      }
    };
    const drawMotes = () => {
      for (const m of motes) {
        const persp = 500 / m.z;
        const s = persp * MOTE_SIZE;
        if (s < 0.4) continue;
        const sx = vx + Math.cos(m.ang) * m.rad * persp;
        const sy = cy + Math.sin(m.ang) * m.rad * persp;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(m.spin0 + m.spinRate * m.age);
        ctx.scale(s, s);
        ctx.fillStyle = m.color;
        ctx.fill(SHAPES[m.shape]);
        ctx.restore();
      }
    };

    // The card dives from the clicked card's centre (or the screen centre if the
    // rect is missing) into the vanishing point, shrinking to nothing as it lands.
    const rect = rectRef.current;
    const fx = rect ? rect.x + rect.w / 2 : cx;
    const fy = rect ? rect.y + rect.h / 2 : cy;
    const cardW0 = rect ? rect.w : CARD_FALLBACK_W;
    const cardH0 = rect ? rect.h : CARD_FALLBACK_H;
    const drawCard = (now: number, startTs: number) => {
      const p = Math.min(1, (now - startTs) / CARD_MS);
      if (p >= 1) return; // landed on the vanishing point, gone
      const ease = Math.pow(p, CARD_TRAVEL_EASE);
      const px = fx + (vx - fx) * ease;
      const py = fy + (cy - fy) * ease;
      const w = cardW0 * (1 - p), h = cardH0 * (1 - p);
      const spin = CARD_SPINS * 2 * Math.PI * Math.pow(p, CARD_SPIN_EASE);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(spin);
      ctx.fillStyle = CARD_FILL;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, Math.min(CARD_RADIUS * (1 - p), Math.min(w, h) / 2));
      ctx.fill();
      ctx.lineWidth = 4 * (1 - p);
      ctx.strokeStyle = CARD_EDGE;
      ctx.stroke();
      // Match the real card layout, top to bottom: a green button with two white
      // text bars, three navy description lines, then a small blue link icon. Not
      // legible, just recognisable. All rides the card transform, so it tumbles.
      const bw = w * 0.8, bh = h * 0.15;
      const bcy = -h * 0.3; // green button near the TOP
      ctx.fillStyle = CARD_GREEN;
      ctx.beginPath();
      ctx.roundRect(-bw / 2, bcy - bh / 2, bw, bh, Math.min(bh * 0.3, bh / 2));
      ctx.fill();
      const barW = bw * 0.6, barH = bh * 0.14;
      ctx.fillStyle = "#ffffff";
      for (const dy of [-bh * 0.2, bh * 0.2]) {
        ctx.beginPath();
        ctx.roundRect(-barW / 2, bcy + dy - barH / 2, barW, barH, barH / 2);
        ctx.fill();
      }
      // three navy description lines below the button (the last one shorter)
      const lineH = h * 0.045;
      const lineW = [w * 0.8, w * 0.8, w * 0.55];
      const lineY = [-h * 0.06, h * 0.04, h * 0.14];
      ctx.fillStyle = CARD_EDGE;
      for (let li = 0; li < 3; li++) {
        ctx.beginPath();
        ctx.roundRect(-w * 0.4, lineY[li] - lineH / 2, lineW[li], lineH, lineH / 2);
        ctx.fill();
      }
      // small blue link icon below the description
      const iconW = w * 0.16, iconH = h * 0.07;
      ctx.fillStyle = CARD_LINK;
      ctx.beginPath();
      ctx.roundRect(-w * 0.4, h * 0.3 - iconH / 2, iconW, iconH, Math.min(iconH * 0.35, iconH / 2));
      ctx.fill();
      ctx.restore();
    };

    let start: number | null = null;
    let raf = 0;
    let resolved = false;
    const loop = (now: number) => {
      if (start === null) start = now;
      const t = now - start;
      const running = t < TUNNEL_MS;
      vx = cx + Math.sin((now / SWAY_PERIOD) * 2 * Math.PI) * SWAY_AMOUNT * W;
      // Background: navy held, then warming to the pit gradient late in the run and
      // held there. The linear window is eased in (BG_SHIFT_EASE) so navy keeps
      // reading through most of the shift and only warms sharply near TUNNEL_MS,
      // where it must land so the clear-fade reveals a matching gradient (no seam).
      const bgLinear = Math.max(0, Math.min(1, (t - BG_HOLD_MS) / BG_SHIFT_MS)); // 0 until BG_HOLD, ramps over BG_SHIFT
      const bgP = Math.pow(bgLinear, BG_SHIFT_EASE);
      const bg = ctx.createLinearGradient(0, H, W, 0); // bottom-left to top-right = "to top right"
      bg.addColorStop(0, mix(NAVY_RGB, PIT_A_RGB, bgP));
      bg.addColorStop(1, mix(NAVY_RGB, PIT_B_RGB, bgP));
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      if (running) {
        // Travel: rings recede and recycle, motes fly, the card dives in. The ring
        // speed ramps from RING_SPEED_START to RING_SPEED_END across the run so the
        // tunnel builds gradually instead of running flat then lurching at the clear.
        const ringRamp = Math.pow(Math.min(1, t / TUNNEL_MS), RING_ACCEL);
        const ringSpeed = RING_SPEED_START + (RING_SPEED_END - RING_SPEED_START) * ringRamp;
        for (const r of rings) { r.z -= ringSpeed; if (r.z <= 0) r.z += MAXZ; }
        for (const m of motes) { m.z -= MOTE_SPEED; m.age++; if (m.z <= MOTE_ZNEAR) seedMote(m, MOTE_ZFAR); }
        drawRings();
        drawMotes();
        drawCard(now, start);
      } else {
        // Resolve: fire the signal once (the pit grows its cluster ring and drops
        // the dogs off it), rush the rings outward past the camera, and fade the
        // canvas so the pit shows through. The bg is already the pit gradient, so
        // the fade reveals an identical background and there is no seam.
        if (!resolved) { resolved = true; canvas.style.transition = "none"; onResolveRef.current?.(); }
        for (const r of rings) { r.z -= CLEAR_SPEED; }
        drawRings();
        canvas.style.opacity = String(Math.max(0, 1 - (t - TUNNEL_MS) / CLEAR_MS));
      }
      if (t < TUNNEL_MS + CLEAR_MS) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = 0;
        doneRef.current?.();
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.tunnel} aria-hidden="true" />;
}
