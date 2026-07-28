"use client";
/**
 * The pit's blast effects, lifted out of PackPit so both pits draw the same
 * thing for ever. Nothing here is retuned: it is the main pit's code, with its
 * own arrays, behind a factory so each pit gets an independent set.
 *
 * Every routine is tuned in MAIN PIT PIXELS. A caller draws in that space by
 * setting the canvas transform so one unit is one pit pixel, which is exactly
 * the space Matter bodies already live in, in both pits.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

type Spark = { x: number; y: number; vx: number; vy: number; r: number; born: number; life: number; col: string };
type Burst = { x: number; y: number; s: number; born: number; life: number; colour?: string; rot?: number };

/**
 * `scale` shrinks the constants that are flat pixel counts rather than fractions
 * of a size the caller passes in: spark spread, speed, radius and gravity, and
 * the starburst's stroke and tips. 1 is the main pit, untouched. The mini pit
 * runs smaller because its furniture is smaller, so a main-pit-sized blast
 * swamps it.
 */
export function createPitEffects(scale = 1) {
  const bursts: Burst[] = [];
  const burstAt = (x: number, y: number, s: number) =>
    bursts.push({ x, y, s, born: performance.now(), life: 420, colour: "#ff2d78", rot: 0 });
  const explodeAt = (x: number, y: number, s: number) => {
    const born = performance.now();
    bursts.push({ x, y, s, born, life: 520, colour: "#e23a0e", rot: 0 });
    bursts.push({ x, y, s, born, life: 520, colour: "#ff7a1a", rot: 11 });
    bursts.push({ x, y, s, born, life: 520, colour: "#ffc62e", rot: 22 });
  };
  const TAUb = Math.PI * 2;
  const _bolt1 = new Image(); _bolt1.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjEyNTAuNjMgMTM5MS42NyAxMzQyLjU4IDIxMTIuMjUiPgo8cGF0aCBmaWxsPSIjMjExODE2IiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0gMjE4MC40MCwyMDQ4LjA5IEwgMjMyMy45MiwyMDA5LjAyIEwgMjA0Ni4zNiwyMzk0Ljk4IEwgMjA4NS45NywyNDQ4Ljc0IEwgMjIwNi4wOCwyNDA4LjYxIEwgMTQzNy4yMiwzMjM4Ljg5IEwgMTY4Mi45OSwyNjMzLjMxIEwgMTY0Mi43NywyNTkwLjQ3IEwgMTUxNS44NCwyNjMyLjg2IEwgMTUxNS43NCwyNjMyLjg5IEwgMTUxNS43NSwyNjMyLjg4IEwgMTcyNC4wMSwyMjQwLjg5IEwgMTY4NS42MCwyMTkzLjY4IEwgMTU1My43NSwyMjMyLjExIEwgMTU1My43NCwyMjMyLjExIEwgMTU1My43NSwyMjMyLjA5IEwgMTg4MC4yOSwxNjA0LjE5IEwgMTg4MC4zNywxNjA0LjE4IEwgMjQ1MC4yMiwxNTA0LjMzIEwgMjQ1MC4zMiwxNTA0LjMxIEwgMjQ1MC4yNSwxNTA0LjQyIEwgMjE0My4wNiwxOTk3LjkyIFogTSAyMzU2Ljk0LDE1NjcuMzYgTCAxOTEwLjY0LDE2NDUuNTkgTCAxNjQ0LjA5LDIxNTguMTIgTCAxNzQ4LjA0LDIxMjcuODggTCAxODUyLjM5LDIwOTcuNTEgTCAxODAxLjQwLDIxOTMuNDQgTCAxNjEwLjMzLDI1NTMuMDEgTCAxNjk0LjkwLDI1MjQuNzUgTCAxNzg5LjQ4LDI0OTMuMjAgTCAxNzUyLjA2LDI1ODUuNDUgTCAxNTc0LjEzLDMwMjMuODkgTCAyMDUxLjM1LDI1MDguNTMgTCAxOTk3LjcwLDI1MjYuNDQgTCAxODYzLjIwLDI1NzEuMzAgTCAxOTQ1Ljk1LDI0NTYuMjAgTCAyMjExLjQ1LDIwODcuMDMgTCAyMTA5LjgxLDIxMTQuNzUgTCAxOTk3LjA3LDIxNDUuNDkgTCAyMDU4LjgzLDIwNDYuMjYgWiAiLz4KPHBhdGggZmlsbD0iI2ZmZmZmZiIgZmlsbC1ydWxlPSJub256ZXJvIiBkPSJNIDIzNTYuOTQsMTU2Ny4zNiBMIDE5MTAuNjQsMTY0NS41OSBMIDE2NDQuMDksMjE1OC4xMiBMIDE3NDguMDQsMjEyNy44OCBMIDE4NTIuMzksMjA5Ny41MSBMIDE4MDEuNDAsMjE5My40NCBMIDE2MTAuMzMsMjU1My4wMSBMIDE2OTQuOTAsMjUyNC43NSBMIDE3ODkuNDgsMjQ5My4yMCBMIDE3NTIuMDYsMjU4NS40NSBMIDE1NzQuMTMsMzAyMy44OSBMIDIwNTEuMzUsMjUwOC41MyBMIDE5OTcuNzAsMjUyNi40NCBMIDE4NjMuMjAsMjU3MS4zMCBMIDE5NDUuOTUsMjQ1Ni4yMCBMIDIyMTEuNDUsMjA4Ny4wMyBMIDIxMDkuODEsMjExNC43NSBMIDE5OTcuMDcsMjE0NS40OSBMIDIwNTguODMsMjA0Ni4yNiBaICIvPgo8cGF0aCBmaWxsPSIjZjlkZTA2IiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0gMjI4Mi4yMTA5MzggMTU4MC41IEwgMTk0OS43NSAyMTU4LjQyMTg3NSBMIDIxNjAuNjI4OTA2IDIxMDAuODc4OTA2IEwgMTgxOC4wNTA3ODEgMjU5Mi43NjE3MTkgTCAxODYzLjIzODI4MSAyNTcxLjMwMDc4MSBMIDE5OTMuMzkwNjI1IDI1MjcuODc4OTA2IEwgMTU5MC4yMzA0NjkgMjk4NC4yMzA0NjkgTCAxNzUyLjA1ODU5NCAyNTg1LjQ0OTIxOSBMIDE3ODkuNDgwNDY5IDI0OTMuMTk5MjE5IEwgMTY5NC44OTg0MzggMjUyNC43NSBMIDE2MTAuMzI4MTI1IDI1NTMuMDExNzE5IEwgMTgwMS4zOTg0MzggMjE5My40NDE0MDYgTCAxODUyLjM5MDYyNSAyMDk3LjUxMTcxOSBMIDE3NDguMDM5MDYyIDIxMjcuODc4OTA2IEwgMTY0NC4wODk4NDQgMjE1OC4xMjEwOTQgTCAxOTEwLjY0MDYyNSAxNjQ1LjU4OTg0NCBMIDIyODIuMjEwOTM4IDE1ODAuNSAiLz4KPC9zdmc+";
  const _bolt2 = new Image(); _bolt2.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjIzNzQuOTIgMTQ2MS4xMCAxMjY1LjM0IDE3NDUuODUiPgo8cGF0aCBmaWxsPSIjMjExODE2IiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0gMzQ5MS42NywxNTc2Ljc1IEwgMzE0My44OCwyMDkyLjQ2IEwgMzE4NC44OCwyMTQ1LjAxIEwgMzMyOC4yMiwyMDkzLjA3IEwgMjU2MC4wNSwyOTM5LjQ3IEwgMjgwNy44MSwyMzIzLjc3IEwgMjc2Ny41OCwyMjgxLjAyIEwgMjY0MC4yNSwyMzIzLjUyIEwgMjY0MC4yMywyMzIzLjUzIEwgMjk2My4xOSwxNjkwLjAxIEwgMjk2My4yMCwxNjg5Ljk4IEwgMjk2My40MSwxNjg5Ljk0IEwgMzQ5MS42OCwxNTc2LjczIFogTSAzMDQ1LjY2LDIxNTUuOTMgTCAzMzg5LjkxLDE2NDUuNDcgTCAyOTk0LjI5LDE3MzAuMjUgTCAyNzMyLjEwLDIyNDQuNjAgTCAyODE5LjMzLDIyMTUuNDUgTCAyOTEzLjQ1LDIxODQuMDIgTCAyODc2LjQ0LDIyNzUuOTggTCAyNjk4LjIyLDI3MTguOTEgTCAzMTY5Ljk5LDIxOTkuMTQgTCAzMDk5LjM2LDIyMjQuNzQgTCAyOTY2Ljg5LDIyNzIuNzcgWiAiLz4KPHBhdGggZmlsbD0iI2ZmZmZmZiIgZmlsbC1ydWxlPSJub256ZXJvIiBkPSJNIDMwNDUuNjYsMjE1NS45MyBMIDMzODkuOTEsMTY0NS40NyBMIDI5OTQuMjksMTczMC4yNSBMIDI3MzIuMTAsMjI0NC42MCBMIDI4MTkuMzMsMjIxNS40NSBMIDI5MTMuNDUsMjE4NC4wMiBMIDI4NzYuNDQsMjI3NS45OCBMIDI2OTguMjIsMjcxOC45MSBMIDMxNjkuOTksMjE5OS4xNCBMIDMwOTkuMzYsMjIyNC43NCBMIDI5NjYuODksMjI3Mi43NyBaICIvPgo8cGF0aCBmaWxsPSIjZjJlMDE1IiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0gMzMxOS40NDE0MDYgMTY2MC41ODk4NDQgTCAyOTE4Ljk0MTQwNiAyMjkwLjEyODkwNiBMIDI5NjYuODkwNjI1IDIyNzIuNzY5NTMxIEwgMzA1OC44Mzk4NDQgMjIzOS40NDkyMTkgTCAzMDk5LjM1OTM3NSAyMjI0LjczODI4MSBMIDMxMjUuMjEwOTM4IDIyMTUuMzcxMDk0IEwgMjcxOS4xMjg5MDYgMjY2Ni45ODgyODEgTCAyODc2LjQ0MTQwNiAyMjc1Ljk4MDQ2OSBMIDI5MTMuNDQ5MjE5IDIxODQuMDE5NTMxIEwgMjgxOS4zMjgxMjUgMjIxNS40NDkyMTkgTCAyNzMyLjEwMTU2MiAyMjQ0LjYwMTU2MiBMIDI5OTQuMjg5MDYyIDE3MzAuMjUgTCAzMzE5LjQ0MTQwNiAxNjYwLjU4OTg0NCAiLz4KPC9zdmc+";
  const boltImgs = [_bolt1, _bolt2];
  const boltAR = [0.6356, 0.7248];
  const boomWords = ["EXTINCT", "DONE", "POOF", "GONE"];
  const rndb = (a: number, b: number) => a + Math.random() * (b - a);
  const eob = (t: number) => 1 - Math.pow(1 - t, 3);
  const clampb = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
  const jaggedB = () => {
    const n = 11 + Math.floor(Math.random() * 5); const tips: number[] = []; let a = rndb(0, 0.3);
    for (let i = 0; i < n; i++) { a += (TAUb / n) * rndb(0.55, 1.45); tips.push(a); }
    const pts: { a: number; r: number }[] = [];
    for (let i = 0; i < tips.length; i++) { const tipA = tips[i]; pts.push({ a: tipA, r: rndb(0.55, 1.15) }); const nextA = i + 1 < tips.length ? tips[i + 1] : tips[0] + TAUb; pts.push({ a: tipA + (nextA - tipA) * rndb(0.3, 0.7), r: rndb(0.28, 0.5) }); }
    return pts;
  };
  const pathForB = (pts: { a: number; r: number }[], S: number, scale: number, rot: number) => {
    const pa = new Path2D();
    pts.forEach((pt, i) => { const a = pt.a + rot, x = Math.cos(a) * pt.r * S * scale, y = Math.sin(a) * pt.r * S * scale; if (i) pa.lineTo(x, y); else pa.moveTo(x, y); });
    pa.closePath(); return pa;
  };
  const star5B = (c: any, sz: number) => { c.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * TAUb - Math.PI / 2, r = i % 2 ? sz * 0.45 : sz, x = Math.cos(a) * r, y = Math.sin(a) * r; if (i) c.lineTo(x, y); else c.moveTo(x, y); } c.closePath(); };
  const star4B = (c: any, cx: number, cy: number, len: number, wid: number) => { c.beginPath(); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2, tx = cx + Math.cos(a) * len, ty = cy + Math.sin(a) * len, px = cx + Math.cos(a + Math.PI / 2) * wid, py = cy + Math.sin(a + Math.PI / 2) * wid, qx = cx + Math.cos(a - Math.PI / 2) * wid, qy = cy + Math.sin(a - Math.PI / 2) * wid; c.moveTo(cx, cy); c.lineTo(px, py); c.lineTo(tx, ty); c.lineTo(qx, qy); c.closePath(); } c.fill(); };
  const makeCfB = () => { const a: any[] = []; for (let i = 0; i < 12; i++) { const type = Math.random() < 0.55 ? "star" : "bolt"; a.push({ type, ang: rndb(0, TAUb), sp: rndb(1.4, 2.7), rot: rndb(0, TAUb), spin: rndb(-7, 7), col: Math.random() < 0.5 ? "#e23a0e" : "#ffd23e", sz: type === "bolt" ? rndb(0.22, 0.42) : rndb(0.1, 0.2), delay: rndb(0, 0.14), bolt: Math.floor(Math.random() * 2) }); } return a; };
  const makeSmB = () => { const a: any[] = []; for (let i = 0; i < 6; i++) { a.push({ ang: rndb(0, TAUb), sp: rndb(0.5, 1.3), r: rndb(0.32, 0.55), g: Math.floor(rndb(0, 2)), delay: rndb(0, 0.16), puff: [[0, 0], [rndb(-0.5, 0.5), rndb(-0.4, 0.2)], [rndb(-0.4, 0.6), rndb(-0.1, 0.5)]] }); } return a; };
  const GREYB = ["#b9b9b9", "#9a9a9a"];
  // ---- fuse fizz: sparks that catch and build as a bomb's five-second fuse burns down ----
  const fuseSparks: Spark[] = [];
  const FUSE_COLS = ["#ffd23e", "#fff8e6", "#ff7a1a"];
  const FUSE_LIGHT_AT = 2; // the fuse stays dark on hit 1 and catches from hit 2
  const emitFuseSparks = (x: number, y: number, intensity: number) => {
    const n = 1 + Math.floor(intensity * 5); // attempts per frame, more as it climbs
    for (let i = 0; i < n; i++) {
      if (Math.random() > 0.18 + intensity * 0.78) continue; // sparse and faint at low intensity, near-constant at full
      const a = -Math.PI / 2 + (Math.random() - 0.5) * (0.7 + intensity * 1.7); // tighter spit when low, wider spray when high
      const sp = 0.7 + Math.random() * (1.0 + intensity * 2.8); // slower drips low, faster shower high
      fuseSparks.push({ x: x + (Math.random() - 0.5) * (4 + intensity * 7) * scale, y: y + (Math.random() - 0.5) * (4 + intensity * 7) * scale, vx: Math.cos(a) * sp * scale, vy: Math.sin(a) * sp * scale, r: (1 + Math.random() * (0.8 + intensity * 2.6)) * scale, born: performance.now(), life: 220 + Math.random() * 280, col: FUSE_COLS[Math.floor(Math.random() * FUSE_COLS.length)] });
    }
  };
  const drawFuseSparks = (ctx: any, now: number) => {
    for (let i = fuseSparks.length - 1; i >= 0; i--) {
      const s = fuseSparks[i], t = (now - s.born) / s.life;
      if (t >= 1) { fuseSparks.splice(i, 1); continue; }
      s.x += s.vx; s.y += s.vy; s.vy += 0.05 * scale; s.vx *= 0.97;
      ctx.save(); ctx.globalAlpha = 1 - t; ctx.fillStyle = s.col;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r * (1 - t * 0.5), 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  };
  const booms: any[] = [];
  const pushBoom = (x: number, y: number, S: number) => { booms.push({ x, y, born: performance.now(), S, b0: jaggedB(), b1: jaggedB(), b2: jaggedB(), r0: rndb(0, TAUb), r1: rndb(0, TAUb), r2: rndb(0, TAUb), cf: makeCfB(), sm: makeSmB(), brot: rndb(-0.12, 0.12), word: boomWords[Math.floor(rndb(0, boomWords.length))] }); };
  const drawBooms = (ctx: any, now: number) => {
    for (let i = booms.length - 1; i >= 0; i--) {
      const b = booms[i], t = (now - b.born) / 1150; if (t >= 1) { booms.splice(i, 1); continue; } const S = b.S;
      for (const sp of b.sm) { const lt = clampb((t - 0.42 - sp.delay) / (0.58 - sp.delay), 0, 1); if (lt <= 0 || lt >= 1) continue; const dist = sp.sp * S * lt, cx = b.x + Math.cos(sp.ang) * dist, cy = b.y + Math.sin(sp.ang) * dist - S * 0.8 * lt, r = sp.r * S * (0.5 + lt * 1.2), al = (lt < 0.2 ? lt / 0.2 : 1) * (1 - lt) * 0.55; ctx.save(); ctx.globalAlpha = al; ctx.fillStyle = GREYB[sp.g]; for (const p of sp.puff) { ctx.beginPath(); ctx.arc(cx + p[0] * r, cy + p[1] * r, r * 0.72, 0, TAUb); ctx.fill(); } ctx.restore(); }
      const ft = clampb(t / 0.1, 0, 1);
      if (ft < 1) { ctx.save(); ctx.globalAlpha = 1 - ft; ctx.fillStyle = "#fff8e6"; star4B(ctx, b.x, b.y, S * (1.6 + ft * 0.6), S * 0.12); ctx.restore(); }
      const cct = clampb(t / 0.4, 0, 1);
      if (cct < 1) { ctx.save(); ctx.globalAlpha = (1 - cct) * 0.85; ctx.fillStyle = "#fff8e6"; ctx.beginPath(); ctx.arc(b.x, b.y, S * (0.4 + cct * 0.5), 0, TAUb); ctx.fill(); ctx.restore(); }
      let psc; if (t < 0.16) psc = eob(t / 0.16) * 1.12; else if (t < 0.27) psc = 1.12 - 0.12 * ((t - 0.16) / 0.11); else psc = 1;
      const bfade = clampb(t < 0.66 ? 1 : 1 - (t - 0.66) / 0.15, 0, 1);
      const layers: [string, string, number, number, number][] = [["b0", "#e23a0e", 1.12, b.r0, -1.4], ["b1", "#ff7a1a", 0.92, b.r1, 1.1], ["b2", "#ffd23e", 0.7, b.r2, -0.85]];
      ctx.save(); ctx.translate(b.x, b.y); ctx.globalAlpha = bfade;
      for (const L of layers) { const pa = pathForB(b[L[0]], S, L[2] * psc, L[3] + t * L[4]); ctx.fillStyle = L[1]; ctx.fill(pa); ctx.lineJoin = "round"; ctx.lineWidth = S * 0.017; ctx.strokeStyle = "#211816"; ctx.stroke(pa); }
      ctx.restore();
      for (const c of b.cf) { const lt = clampb((t - 0.07 - c.delay) / (0.9 - c.delay), 0, 1); if (lt <= 0 || lt >= 1) continue; const tr = eob(lt), d = S * 0.5 + c.sp * S * tr, cx = b.x + Math.cos(c.ang) * d, cy = b.y + Math.sin(c.ang) * d - S * 0.12 * tr, sz = c.sz * S, al = clampb(lt < 0.12 ? lt / 0.12 : lt < 0.66 ? 1 : 1 - (lt - 0.66) / 0.17, 0, 1); ctx.save(); ctx.globalAlpha = al; ctx.translate(cx, cy); ctx.rotate(c.rot + lt * c.spin); if (c.type === "star") { ctx.fillStyle = c.col; ctx.lineJoin = "round"; star5B(ctx, sz); ctx.fill(); ctx.lineWidth = sz * 0.053; ctx.strokeStyle = "#211816"; ctx.stroke(); } else { const im = boltImgs[c.bolt]; if (im.complete && im.naturalWidth) { const h = sz * 1.05, w = h * boltAR[c.bolt]; ctx.drawImage(im, -w / 2, -h / 2, w, h); } } ctx.restore(); }
      if (b.word) { const lt = clampb((t - 0.05) / 0.6, 0, 1); if (lt < 1) { let sc; if (lt < 0.28) sc = eob(lt / 0.28) * 1.15; else sc = 1.15 - 0.15 * ((lt - 0.28) / 0.72); const al = clampb(lt < 0.72 ? 1 : 1 - (lt - 0.72) / 0.14, 0, 1); ctx.save(); ctx.globalAlpha = al; ctx.translate(b.x, b.y - S * 0.02); ctx.rotate(b.brot); ctx.scale(sc, sc); ctx.font = "400 " + Math.round(S * 0.7) + 'px "Luckiest Guy", system-ui, sans-serif'; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#ffffff"; ctx.fillText(b.word, 0, 0); ctx.restore(); } }
    }
  };
  function drawBursts(ctx: any, now: number) {
    for (let i = bursts.length - 1; i >= 0; i--) {
      const bu = bursts[i], t = (now - bu.born) / bu.life;
      if (t >= 1) { bursts.splice(i, 1); continue; }
      const reach = bu.s * (0.35 + t * 0.85), inner = bu.s * (0.12 + t * 0.4);
      ctx.save(); ctx.globalAlpha = (1 - t); ctx.translate(bu.x, bu.y);
      ctx.rotate((t * 5 + (bu.rot || 0)) * Math.PI / 180); // rotate over the pop, plus this layer's fixed offset
      ctx.strokeStyle = bu.colour || "#ff2d78"; ctx.lineWidth = 2.4 * scale; ctx.lineCap = "round";
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
        ctx.lineTo(Math.cos(a) * reach, Math.sin(a) * reach);
        ctx.stroke();
      }
      ctx.fillStyle = bu.colour || "#ff2d78";
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 + 0.3, rr = reach * 1.05, sx = Math.cos(a) * rr, sy = Math.sin(a) * rr, sz = (3 * (1 - t) + 1.5) * scale;
        ctx.beginPath();
        for (let p = 0; p < 5; p++) {
          const aa = a + (p / 5) * Math.PI * 2;
          const px = sx + Math.cos(aa) * sz, py = sy + Math.sin(aa) * sz;
          // identical to the main pit's ternary, written as a statement only so
          // the new file lands with a clean lint sheet
          if (p === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
  }
  return {
    /** a single pink starburst, the press pop */
    burstAt,
    /** three starbursts at once, red then orange then yellow: a detonation */
    explodeAt,
    /** a starburst with every field chosen by the caller, for the odd one-off */
    pushBurst: (b: Burst) => { bursts.push(b); },
    /** the pop-art comic blast. S is the blast size in pit pixels */
    pushBoom,
    /** fuse fizz. intensity climbs 0..1 as the fuse burns down */
    emitFuseSparks,
    /** draw everything alive this frame */
    draw(ctx: any, now: number) {
      drawFuseSparks(ctx, now);
      drawBursts(ctx, now);
      drawBooms(ctx, now);
    },
    /** true when nothing is left to draw, so a caller can idle its loop */
    idle() { return !bursts.length && !booms.length && !fuseSparks.length; },
    FUSE_LIGHT_AT,
  };
}
