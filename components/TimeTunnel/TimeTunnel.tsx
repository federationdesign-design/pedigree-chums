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
const COLORS = ["#5cc4ee", "#0b78bd", "#ffd23e"]; // sky, deep blue, yellow

const RINGS = 40;
const SPACING = 100;
const SPEED = 4;
const MAXZ = RINGS * SPACING;
const TUNNEL_MS = 1200; // the ~1.2s handover window
const FADE_MS = 260; // the fade-out before it hands over

// Shapes flying past, on the same perspective as the rings.
const MOTE_COUNT = 18;
const MOTE_SPEED = 26;
const MOTE_ZNEAR = 60;
const MOTE_ZFAR = 3000;
const MOTE_SIZE = 11;
const MOTE_COLORS = ["#5cc4ee", "#ffd23e", "#fff8e6"]; // sky, yellow, cream on navy

// Vanishing-point sway: a slow automatic bend so the tunnel reads as a bending
// passage. The prototype's pointer-follow makes no sense during a page
// transition, so the app uses the sine version only.
const SWAY_AMOUNT = 0.05;
const SWAY_PERIOD = 6000;

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
function pawPath(): Path2D {
  const p = new Path2D();
  p.moveTo(0.55, 0.35); p.ellipse(0, 0.35, 0.55, 0.45, 0, 0, Math.PI * 2);
  const toes: [number, number, number][] = [[-0.55, -0.35, 0.26], [-0.2, -0.6, 0.28], [0.2, -0.6, 0.28], [0.55, -0.35, 0.26]];
  for (const [tx, ty, tr] of toes) { p.moveTo(tx + tr, ty); p.arc(tx, ty, tr, 0, Math.PI * 2); }
  return p;
}

type Mote = { z: number; ang: number; rad: number; shape: number; color: string; spin0: number; spinRate: number; age: number };

export default function TimeTunnel({ onDone }: { onDone?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Keep the latest onDone without re-running the tunnel effect below. Updated in
  // an effect, never during render, so it does not trip the refs rule.
  const doneRef = useRef(onDone);
  useEffect(() => { doneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) { doneRef.current?.(); return; }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { doneRef.current?.(); return; } // no tunnel: hand straight over

    const SHAPES = [starPath(), bonePath(), pawPath()];
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
      for (const r of rings) {
        const persp = 500 / r.z;
        const radius = persp * 200;
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

    let start: number | null = null;
    let raf = 0;
    let fadeTimer = 0;
    const loop = (now: number) => {
      if (start === null) start = now;
      const running = now - start < TUNNEL_MS;
      for (const r of rings) { r.z -= SPEED; if (r.z <= 0) r.z += MAXZ; }
      for (const m of motes) { m.z -= MOTE_SPEED; m.age++; if (m.z <= MOTE_ZNEAR) seedMote(m, MOTE_ZFAR); }
      vx = cx + Math.sin((now / SWAY_PERIOD) * 2 * Math.PI) * SWAY_AMOUNT * W;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
      drawRings();
      drawMotes();
      if (running) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = 0;
        canvas.style.opacity = "0"; // CSS transitions this; then we hand over
        fadeTimer = window.setTimeout(() => doneRef.current?.(), FADE_MS);
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (fadeTimer) clearTimeout(fadeTimer);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.tunnel} aria-hidden="true" />;
}
