// A tiny self-contained confetti burst -- no external dependency. The name generator previously loaded
// canvas-confetti from a CDN via a <script> with no SRI, which is not appropriate on a children's site;
// this is a few dozen lines we own, drawn on a throwaway full-screen canvas that removes itself when the
// last particle falls. It exposes the small slice of the canvas-confetti API the site actually used
// (particleCount / spread / startVelocity / origin / colors), so both callers swap to it unchanged.
//
// prefers-reduced-motion is honoured at the CALL SITE (this function only draws). Colours default to the
// site's own palette tokens (see app/globals.css), not the old hard-coded hex.

export type ParticleShape = 'square' | 'star' | 'bone';

export interface ConfettiOptions {
  particleCount?: number;
  spread?: number; // width of the launch cone, in degrees
  startVelocity?: number;
  origin?: { x?: number; y?: number }; // fractions of the viewport (0..1); default centre
  colors?: string[];
  shapes?: ParticleShape[]; // which shapes to draw (default: a single square flake). The win animation passes ['star','bone'] for the stars-and-bones burst.
}

// Site palette: sky blue, deep blue, yellow, navy, white (globals.css --blue-sky / --blue-deep / --yellow
// / --navy / --cream). Read once as concrete hex so the canvas fill is fast and SSR-safe.
const SITE_COLORS = ['#5cc4ee', '#0b78bd', '#ffd23e', '#0a3a57', '#ffffff'];

interface Particle { x: number; y: number; vx: number; vy: number; size: number; rot: number; vr: number; color: string; life: number; shape: ParticleShape; }

// A five-point star, centred at (0,0) with outer radius r (the fill colour is already set by the caller).
function drawStar(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45; // alternate outer point and inner valley
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const px = Math.cos(a) * rad, py = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}
// A dog bone: a bar with a round knob at each of its four corners, centred at (0,0) and scaled to s.
function drawBone(ctx: CanvasRenderingContext2D, s: number): void {
  const bar = s * 1.15, bh = s * 0.42, kn = s * 0.36;
  ctx.beginPath();
  ctx.rect(-bar / 2, -bh / 2, bar, bh);
  ctx.fill();
  for (const dx of [-bar / 2, bar / 2]) {
    for (const dy of [-bh / 2, bh / 2]) {
      ctx.beginPath();
      ctx.arc(dx, dy, kn, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function fireConfetti(opts: ConfettiOptions = {}): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const count = opts.particleCount ?? 120;
  const spread = ((opts.spread ?? 90) * Math.PI) / 180;
  const speed = opts.startVelocity ?? 42;
  const ox = (opts.origin?.x ?? 0.5) * window.innerWidth;
  const oy = (opts.origin?.y ?? 0.5) * window.innerHeight;
  const colors = opts.colors && opts.colors.length ? opts.colors : SITE_COLORS;
  const shapes: ParticleShape[] = opts.shapes && opts.shapes.length ? opts.shapes : ['square'];

  const canvas = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483647';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) { canvas.remove(); return; }
  ctx.scale(dpr, dpr);

  const up = -Math.PI / 2; // launch upward, then gravity pulls it down
  const particles: Particle[] = Array.from({ length: count }, () => {
    const angle = up + (Math.random() - 0.5) * spread;
    const v = speed * (0.5 + Math.random() * 0.8) * 0.16;
    return {
      x: ox, y: oy,
      vx: Math.cos(angle) * v, vy: Math.sin(angle) * v,
      size: 6 + Math.random() * 6,
      rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.35,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    };
  });

  const gravity = 0.42, drag = 0.987, fade = 0.0085;
  const tick = () => {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    let alive = false;
    for (const p of particles) {
      if (p.life <= 0) continue;
      alive = true;
      p.vx *= drag; p.vy = p.vy * drag + gravity;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= fade;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.shape === 'star') drawStar(ctx, p.size);
      else if (p.shape === 'bone') drawBone(ctx, p.size);
      else ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
    if (alive) requestAnimationFrame(tick);
    else canvas.remove();
  };
  requestAnimationFrame(tick);
}
