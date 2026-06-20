"use client";

import { useEffect, useRef, useState } from "react";
import { breeds } from "../../data/breeds";
import { getLineage, type LineageNode } from "../../data/lineage";
import LineageMap from "./LineageMap";
import styles from "./PackPit.module.css";

const RADIUS: Record<string, number> = { small: 47.19, medium: 56.1, large: 66, giant: 67.2 }; // giant -20%, small +10% to tighten the spread
const PALETTE = ["#1497d6", "#2bb4ee", "#0c5b92", "#0a3a57"];

// a child's share is the sum of its leaf values (leaves total 100 across the tree)
function sumLeaves(n: LineageNode): number {
  return n.children && n.children.length ? n.children.reduce((s, c) => s + sumLeaves(c), 0) : n.value ?? 0;
}

export default function PackPit() {
  const stageRef = useRef<HTMLDivElement>(null);
  const shakeRef = useRef<() => void>(() => {});
  const motionRef = useRef<() => void>(() => {});
  const [activeBreed, setActiveBreed] = useState<{ name: string; image: string; x: number; y: number; angle: number } | null>(null);
  const lineageOpenRef = useRef(false);
  useEffect(() => { lineageOpenRef.current = !!activeBreed; }, [activeBreed]);

  useEffect(() => {
    let disposed = false;
    let dispose = () => {};

    (async () => {
      const mod: any = await import("matter-js");
      const Matter = mod.default || mod;
      if (disposed || !stageRef.current) return;
      const stage = stageRef.current;

      const BREEDS = breeds.map((b) => ({ name: b.name, size: b.sizeBand as string, img: b.image }));
      const FAMILY: Record<string, { name: string; share: number }[]> = {};
      for (const b of breeds) {
        const lin = getLineage(b.name);
        if (lin && lin.children) FAMILY[b.name] = lin.children.map((c) => ({ name: c.name, share: Math.round(sumLeaves(c)) }));
      }
      const IMG: Record<string, HTMLImageElement> = {};
      const getImg = (name: string, src: string) => {
        if (!IMG[name]) { const im = new Image(); im.src = src; IMG[name] = im; }
        return IMG[name];
      };

      // Toys tip in ahead of the pack. Their size is pinned to a fixed unit (the
      // original giant card half) so changing the card bands never resizes them.
      // Each body matches its SVG aspect ratio; `aspect` is a starting guess that
      // gets corrected from the loaded image.
      const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
      const SCALE = isMobile ? 0.67 : 1; // mobile shrinks cards and toys uniformly by a third
      const BIG = 84 * SCALE;
      const ball = { key: "__ball", label: "Tennis ball", src: "/tennis-ball.svg", shape: "ball", width: BIG * 2.5 * (isMobile ? 0.9 : 1), aspect: 1 };
      const bone = { key: "__bone", label: "Bone", src: "/big-bone.svg", shape: "bone", width: BIG * 5.5 * (isMobile ? 0.9 : 1), aspect: 2.05 };
      const bowl = { key: "__bowl", label: "Dog bowl", src: "/dog-bowl.svg", shape: "bowl", width: BIG * 9.38 * (isMobile ? 0.85 : 1), aspect: 3.22, angle: (80 * Math.PI) / 180 };
      const slipper = { key: "__slipper", label: "Slipper", src: "/slipper-edit.svg", shape: "slipper", width: BIG * (isMobile ? 6.65 : 8.31), aspect: 2.745 };
      const logo = { key: "__logo", label: "Pedigree Chums", src: "/PC-logo.svg", shape: "logo", width: BIG * 6.8, aspect: 150 / 64 };
      const BALLS = isMobile ? [ball, ball] : [ball, ball, ball];
      const HEAVY = [bone, slipper];

      const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Query, Body, Events } = Matter;

      const engine = Engine.create();
      engine.gravity.y = 1;
      const render = Render.create({
        element: stage, engine,
        options: { width: stage.clientWidth, height: stage.clientHeight, background: "transparent", wireframes: false, pixelRatio: 1 },
      });
      Render.run(render);
      const runner = Runner.create();
      Runner.run(runner, engine);

      let walls: any[] = [];
      function buildWalls(w: number, h: number) {
        if (walls.length) Composite.remove(engine.world, walls);
        const t = 200;
        walls = [
          Bodies.rectangle(w / 2, h + t / 2 - 2, w + t * 2, t, { isStatic: true, restitution: 0.4, render: { visible: false } }),
          Bodies.rectangle(-t / 2 + 2, h / 2, t, h * 3, { isStatic: true, restitution: 0.5, render: { visible: false } }),
          Bodies.rectangle(w + t / 2 - 2, h / 2, t, h * 3, { isStatic: true, restitution: 0.5, render: { visible: false } }),
        ];
        Composite.add(engine.world, walls);
      }
      buildWalls(stage.clientWidth, stage.clientHeight);

      const dyn = () => Composite.allBodies(engine.world).filter((b: any) => !b.isStatic);

      function makeBall(breed: any, i: number, w: number) {
        const s = ((RADIUS[breed.size] || 32) + (Math.random() * 4 - 2)) * SCALE;
        const cr = Math.max(7, s * 0.22);
        const color = PALETTE[i % PALETTE.length];
        const b = Bodies.rectangle(40 + Math.random() * (w - 80), -120 - Math.random() * 600, 2 * s, 2 * s, {
          chamfer: { radius: cr }, restitution: 0.32, friction: 0.28, frictionAir: 0.012, density: 0.001, render: { visible: false },
        });
        b.plugin = { name: breed.name, half: s, corner: cr, color, family: FAMILY[breed.name] || null, img: getImg(breed.name, breed.img), ping: 0 };
        return b;
      }

      function makeProp(prop: any, w: number) {
        const img = getImg(prop.key, prop.src);
        const x = 80 + Math.random() * (w - 160), y = -260 - Math.random() * 240;
        if (prop.shape === "ball") {
          const r = prop.width / 2;
          const b: any = Bodies.circle(x, y, r, { restitution: 0.85, friction: 0.18, frictionAir: 0.006, density: 0.0006, render: { visible: false } });
          b.plugin = { name: prop.label, half: r, w: prop.width, h: prop.width, color: "#c7e65a", img, prop: "ball", family: null, ping: 0 };
          return b;
        }
        if (prop.shape === "bone") {
          // A bone is two lobed ends joined by a thin shaft, so a plain box collider
          // leaves big empty corners. Build the collider from a central bar plus four
          // end lobes (proportions read off the 400.2 x 195 viewBox) so objects meet
          // the bone where the vector actually is.
          const bw = prop.width, bh = prop.width / prop.aspect, k = bw / 400.2;
          const R = 56 * k, dx = 143.5 * k, dy = 40.7 * k, barW = 287 * k, barH = 92 * k;
          const po = { restitution: 0.3, friction: 0.3, density: 0.0008, render: { visible: false } };
          const parts = [
            Bodies.rectangle(x, y, barW, barH, po),
            Bodies.circle(x - dx, y - dy, R, po),
            Bodies.circle(x - dx, y + dy, R, po),
            Bodies.circle(x + dx, y - dy, R, po),
            Bodies.circle(x + dx, y + dy, R, po),
          ];
          const b: any = Body.create({ parts, frictionAir: 0.012, render: { visible: false } });
          b.plugin = { name: prop.label, half: Math.min(bw, bh) / 2, w: bw, h: bh, color: "#f6ecd6", img, prop: "bone", family: null, ping: 0 };
          return b;
        }
        if (prop.shape === "slipper" || prop.shape === "bowl") {
          // Same idea as the bone: trace the silhouette with a few primitives so
          // objects meet the actual shape, not the empty corners of a box. The
          // collider centre lands off the art box, so plugin.ox/oy nudges the
          // drawn image back over it.
          const bw = prop.width, bh = prop.width / prop.aspect;
          const po = { restitution: 0.3, friction: 0.3, density: 0.0008, render: { visible: false } };
          const VB = prop.shape === "slipper" ? { w: 1110.4, h: 411.3 } : { w: 1031.7, h: 316.8 };
          const k = bw / VB.w, cx0 = VB.w / 2, cy0 = VB.h / 2;
          const R = (vx: number, vy: number, w: number, h: number) =>
            Bodies.rectangle(x + (vx - cx0) * k, y + (vy - cy0) * k, w * k, h * k, po);
          const C = (vx: number, vy: number, r: number) =>
            Bodies.circle(x + (vx - cx0) * k, y + (vy - cy0) * k, r * k, po);
          const parts =
            prop.shape === "slipper"
              ? [R(557, 315, 1075, 170), C(300, 205, 200), C(560, 230, 180), C(810, 280, 120)] // sole bar, toe, instep, heel back
              : [R(549, 78, 760, 150), R(513, 222, 1010, 150)]; // narrow top, wider bottom of the tray
          const b: any = Body.create({ parts, frictionAir: 0.012, render: { visible: false } });
          const ox = x - b.position.x, oy = y - b.position.y; // box centre relative to the collider centroid (at angle 0)
          if (prop.angle) Body.setAngle(b, prop.angle);
          b.plugin = { name: prop.label, half: Math.min(bw, bh) / 2, w: bw, h: bh, color: "#bfe3f7", img, prop: prop.shape, family: null, ping: 0, ox, oy };
          return b;
        }
        const ar = img.complete && img.naturalWidth ? img.naturalWidth / img.naturalHeight : prop.aspect;
        const bw = prop.width, bh = prop.width / ar;
        const b: any = Bodies.rectangle(x, y, bw, bh, { angle: prop.angle || 0, chamfer: { radius: Math.min(bw, bh) * 0.18 }, restitution: 0.3, friction: 0.3, frictionAir: 0.012, density: 0.0008, render: { visible: false } });
        b.plugin = { name: prop.label, half: Math.min(bw, bh) / 2, w: bw, h: bh, color: prop.shape === "bone" ? "#f6ecd6" : "#bfe3f7", img, prop: prop.shape, family: null, ping: 0 };
        // once the SVG loads, reshape the body to its true ratio so the art fills it
        if (!(img.complete && img.naturalWidth)) {
          img.addEventListener("load", () => {
            const a = img.naturalWidth / img.naturalHeight, newH = prop.width / a;
            if (Math.abs(newH - b.plugin.h) > 1) {
              Body.scale(b, 1, newH / b.plugin.h);
              b.plugin.h = newH; b.plugin.half = Math.min(b.plugin.w, newH) / 2;
            }
          }, { once: true });
        }
        return b;
      }

      // The logo sits fixed in the pit on load. It is a static sensor, so falling
      // dogs and toys pass through it but the first touch knocks it loose: it goes
      // dynamic and, still a sensor, falls straight through the floor and pile and
      // off the bottom of the screen, where it is removed.
      let logoBody: any = null;
      function makeLogo(w: number, h: number) {
        const img = getImg(logo.key, logo.src);
        const ar = img.complete && img.naturalWidth ? img.naturalWidth / img.naturalHeight : logo.aspect;
        const bw = logo.width, bh = logo.width / ar;
        const b: any = Bodies.rectangle(w / 2, h * 0.2 + 100, bw, bh, { isStatic: true, isSensor: false, render: { visible: false } });
        b.plugin = { name: logo.label, half: Math.min(bw, bh) / 2, w: bw, h: bh, color: "#ffffff", img, prop: "logo", logo: true, family: null, ping: 0 };
        if (!(img.complete && img.naturalWidth)) {
          img.addEventListener("load", () => {
            const a = img.naturalWidth / img.naturalHeight, newH = logo.width / a;
            if (Math.abs(newH - b.plugin.h) > 1) { Body.scale(b, 1, newH / b.plugin.h); b.plugin.h = newH; b.plugin.half = Math.min(b.plugin.w, newH) / 2; }
          }, { once: true });
        }
        return b;
      }
      const LOGO_HITS_TO_FALL = 5;
      const LOGO_SINK = BIG * 0.7; // how far each hit pushes it down before it finally goes
      const LOGO_W = BIG * 6.8;    // matches logo.width
      const LOGO_TILT = Math.asin(Math.min(1, LOGO_SINK / LOGO_W)); // tilt that drops the free edge 3x the pinned edge
      let logoHits = 0;
      const onCollide = (ev: any) => {
        if (!logoBody || !logoBody.isStatic) return;
        for (const pair of ev.pairs) {
          const lg = pair.bodyA.plugin?.logo ? pair.bodyA : pair.bodyB.plugin?.logo ? pair.bodyB : null;
          if (!lg) continue;
          const other = lg === pair.bodyA ? pair.bodyB : pair.bodyA;
          if (!other || other.isStatic) continue;
          logoHits++; // count every hit, including repeat knocks from the same object
          if (logoHits >= LOGO_HITS_TO_FALL) { lg.isSensor = false; Body.setStatic(lg, false); break; } // the straw that breaks it: now a normal solid body
          Body.translate(lg, { x: 0, y: LOGO_SINK }); // shove the centre down a notch
          Body.rotate(lg, LOGO_TILT); // and tip it so one side sinks while the other stays almost pinned
        }
      };
      let dropTimer: any = null;
      let waveTimers: any[] = [];
      function dropAll() {
        const ex = dyn();
        if (ex.length) Composite.remove(engine.world, ex);
        if (dropTimer) clearInterval(dropTimer);
        waveTimers.forEach(clearTimeout); waveTimers = [];
        const w = stage.clientWidth;
        const addProps = (list: any[]) => list.forEach((p) => Composite.add(engine.world, makeProp(p, w)));
        // Drop the pack in, optionally landing the bowl midway through.
        const dropDogs = (delay: number, withBowl: boolean) => {
          const order = [...BREEDS.keys()].sort(() => Math.random() - 0.5);
          const bowlAt = Math.floor(order.length / 2);
          let k = 0;
          waveTimers.push(setTimeout(() => {
            if (disposed) return;
            dropTimer = setInterval(() => {
              if (k >= order.length) { clearInterval(dropTimer); return; }
              if (withBowl && k === bowlAt) Composite.add(engine.world, makeProp(bowl, w));
              Composite.add(engine.world, makeBall(BREEDS[order[k]], order[k], w));
              k++;
            }, 70);
          }, delay));
        };
        if (isMobile) {
          // mobile: bowl first, then the two tennis balls, then the bone, then the pack
          addProps([bowl]);
          waveTimers.push(setTimeout(() => { if (!disposed) addProps(BALLS); }, 700));
          waveTimers.push(setTimeout(() => { if (!disposed) addProps(HEAVY); }, 1400));
          dropDogs(2100, false);
        } else {
          // desktop: tennis balls, then bone, then the pack with the bowl midway through
          addProps(BALLS);
          waveTimers.push(setTimeout(() => { if (!disposed) addProps(HEAVY); }, 1000));
          dropDogs(2000, true);
        }
      }

      const mouse = Mouse.create(render.canvas);
      const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, render: { visible: false } } });
      Composite.add(engine.world, mc);
      render.mouse = mouse;
      // matter binds the wheel to the canvas and cancels it, which eats page
      // scroll when the cursor is over the pit. Unhook it; dragging is unaffected.
      mouse.element.removeEventListener("mousewheel", (mouse as any).mousewheel);
      mouse.element.removeEventListener("DOMMouseScroll", (mouse as any).mousewheel);

      let pointer: any = null;
      const localPoint = (e: MouseEvent) => { const r = render.canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
      const onMove = (e: MouseEvent) => { pointer = localPoint(e); };
      const onLeave = () => { pointer = null; };
      const onDbl = (e: MouseEvent) => {
        const hit = Query.point(dyn(), localPoint(e))[0];
        if (!hit) return;
        const ang = Math.random() * Math.PI * 2, speed = 20 + Math.random() * 8;
        Body.setVelocity(hit, { x: Math.cos(ang) * speed, y: -Math.abs(Math.sin(ang) * speed) - 10 });
        Body.setAngularVelocity(hit, (Math.random() - 0.5) * 0.7);
        hit.plugin.ping = performance.now();
      };
      let downAt: { x: number; y: number } | null = null;
      const onDown = (e: MouseEvent) => { downAt = localPoint(e); };
      const openLineageAt = (up: { x: number; y: number }) => {
        const hit = Query.point(dyn(), up)[0];
        if (!hit || hit.plugin.prop) return false; // dogs only, not the toys
        const r = render.canvas.getBoundingClientRect();
        setActiveBreed({
          name: hit.plugin.name,
          image: hit.plugin.img?.src || "",
          x: r.left + hit.position.x,
          y: r.top + hit.position.y,
          angle: hit.angle,
        });
        return true;
      };
      const onClick = (e: MouseEvent) => {
        const up = localPoint(e);
        // ignore drags: only a near-stationary click opens the lineage
        if (downAt && Math.hypot(up.x - downAt.x, up.y - downAt.y) > 6) return;
        openLineageAt(up);
      };
      // Touch: Matter's drag constraint swallows the synthesised click, so taps
      // are handled directly here.
      let touchDown: { x: number; y: number } | null = null;
      const touchLocal = (t: Touch) => { const r = render.canvas.getBoundingClientRect(); return { x: t.clientX - r.left, y: t.clientY - r.top }; };
      const onTouchStart = (e: TouchEvent) => { motionRef.current(); if (e.touches.length === 1) touchDown = touchLocal(e.touches[0]); };
      const onTouchEnd = (e: TouchEvent) => {
        const start = touchDown; touchDown = null;
        if (!start || e.changedTouches.length !== 1) return;
        const up = touchLocal(e.changedTouches[0]);
        if (Math.hypot(up.x - start.x, up.y - start.y) > 10) return; // a drag, not a tap
        if (openLineageAt(up)) e.preventDefault(); // opened: stop the ghost click reaching the overlay
      };
      render.canvas.addEventListener("mousemove", onMove);
      render.canvas.addEventListener("mouseleave", onLeave);
      render.canvas.addEventListener("dblclick", onDbl);
      render.canvas.addEventListener("mousedown", onDown);
      render.canvas.addEventListener("click", onClick);
      render.canvas.addEventListener("touchstart", onTouchStart, { passive: true });
      render.canvas.addEventListener("touchend", onTouchEnd, { passive: false });

      function rrect(ctx: any, x: number, y: number, w: number, h: number, r: number) {
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); return; }
        ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
      }
      function pill(ctx: any, x: number, y: number, w: number, h: number) {
        const r = h / 2; ctx.beginPath();
        if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
        ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
      }
      function wrapName(name: string) {
        if (name.length <= 15) return [name];
        const words = name.split(" ");
        if (words.length < 2) return [name];
        let best = 1, bd = 1e9;
        for (let k = 1; k < words.length; k++) {
          const d = Math.abs(words.slice(0, k).join(" ").length - words.slice(k).join(" ").length);
          if (d <= bd) { bd = d; best = k; }
        }
        return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
      }
      function drawBall(ctx: any, b: any, alpha: number, hovered: boolean) {
        const p = b.position, s = b.plugin.half, cr = b.plugin.corner, img = b.plugin.img;
        ctx.save(); ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y); ctx.rotate(b.angle);
        if (b.plugin.prop) {
          // shaped colliders sit off-centre from the art box, so nudge the image
          // back over the silhouette (defaults to 0 for the simple shapes)
          ctx.translate(b.plugin.ox || 0, b.plugin.oy || 0);
          const pw = b.plugin.w, ph = b.plugin.h;
          if (hovered) { ctx.shadowColor = "rgba(10,58,87,0.4)"; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2; }
          if (img && img.complete && img.naturalWidth) {
            const ir = img.naturalWidth / img.naturalHeight, br = pw / ph;
            const dw = ir > br ? pw : ph * ir, dh = ir > br ? pw / ir : ph;
            ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
          } else if (b.plugin.prop === "ball") {
            ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fillStyle = b.plugin.color; ctx.fill();
            ctx.lineWidth = 3; ctx.strokeStyle = "rgba(10,58,87,0.45)"; ctx.stroke();
            ctx.beginPath(); ctx.arc(-s * 1.1, 0, s * 1.45, -0.7, 0.7); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.stroke();
          } else {
            rrect(ctx, -pw / 2, -ph / 2, pw, ph, ph * 0.45); ctx.fillStyle = b.plugin.color; ctx.fill();
            ctx.lineWidth = 3; ctx.strokeStyle = "rgba(10,58,87,0.4)"; ctx.stroke();
          }
          ctx.restore(); return;
        }
        if (hovered) { ctx.shadowColor = "rgba(10,58,87,0.45)"; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2; }
        rrect(ctx, -s, -s, 2 * s, 2 * s, cr); ctx.fillStyle = b.plugin.color; ctx.fill();
        ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
        if (img && img.complete && img.naturalWidth) {
          ctx.save(); rrect(ctx, -s, -s, 2 * s, 2 * s, cr); ctx.clip();
          const d = 2 * s * 1.04; ctx.drawImage(img, -d / 2, -d / 2, d, d); ctx.restore();
        }
        rrect(ctx, -s, -s, 2 * s, 2 * s, cr); ctx.lineWidth = 3; ctx.strokeStyle = hovered ? "#ffd23e" : "rgba(255,255,255,0.85)"; ctx.stroke();
        ctx.restore();
      }
      function drawFamily(ctx: any, b: any, t: number) {
        const fam = b.plugin.family, p = b.position, R = b.plugin.half, n = fam.length, ease = t * t * (3 - 2 * t);
        for (let i = 0; i < n; i++) {
          const a = -Math.PI / 2 + (i - (n - 1) / 2) * (Math.PI * 1.5 / Math.max(n, 2));
          const dist = R + 16 + 54 * ease;
          const sx = p.x + Math.cos(a) * dist, sy = p.y + Math.sin(a) * dist;
          const sr = Math.max(12, 4.3 * Math.sqrt(fam[i].share)) * (0.4 + 0.6 * ease);
          ctx.save(); ctx.globalAlpha = ease;
          ctx.strokeStyle = "rgba(255,210,62,0.9)"; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(sx, sy); ctx.stroke();
          ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fillStyle = "#ffd23e"; ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = "rgba(10,58,87,0.4)"; ctx.stroke();
          ctx.fillStyle = "#0a3a57"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = "800 11px Montserrat,sans-serif";
          ctx.fillText(fam[i].share + "%", sx, sy);
          ctx.font = "700 12px Montserrat,sans-serif"; ctx.fillStyle = "#fff"; ctx.shadowColor = "rgba(10,58,87,0.45)"; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2;
          const nm = wrapName(fam[i].name), ny = sy + sr + 12;
          for (let li = 0; li < nm.length; li++) ctx.fillText(nm[li], sx, ny + li * 13);
          ctx.restore();
        }
      }

      let hoverBody: any = null, hoverStart = 0;
      const DIM_MIN = 0.5;   // how far the rest of the pack dims behind the hovered chum
      const DIM_TIME = 0.5;  // seconds to ease in and out of that dim, so it never flashes
      let dimLevel = 1, lastFrame = 0;
      const onAfter = () => {
        const ctx = render.context, now = performance.now(), bodies = dyn();
        // the resting logo is static (excluded from dyn()), so draw it here until it
        // dislodges; once dynamic it falls with everything else and is drawn via dyn()
        if (logoBody && logoBody.isStatic) drawBall(ctx, logoBody, 1, false);
        if (lineageOpenRef.current) { for (const b of bodies) drawBall(ctx, b, 1, false); return; }
        const hov = pointer ? (Query.point(bodies, pointer).find((b: any) => !b.plugin?.logo) ?? null) : null;
        if (hov !== hoverBody) { hoverBody = hov; hoverStart = now; }
        const spotlight = hoverBody && hoverBody.plugin.family;
        // ease the dim toward its target rather than snapping, so sweeping across
        // a shaken pack never flashes
        const dimTarget = spotlight ? DIM_MIN : 1;
        const frameDt = lastFrame ? Math.min(0.05, (now - lastFrame) / 1000) : 0; lastFrame = now;
        const step = frameDt / DIM_TIME;
        dimLevel = dimLevel < dimTarget ? Math.min(dimTarget, dimLevel + step) : Math.max(dimTarget, dimLevel - step);

        bodies.forEach((b: any) => { if (b === hoverBody) return; drawBall(ctx, b, dimLevel, false); });
        if (hoverBody && hoverBody.plugin.family) { const tt = Math.min(1, (now - hoverStart) / 240); drawFamily(ctx, hoverBody, tt); }
        if (hoverBody) drawBall(ctx, hoverBody, 1, true);

        bodies.forEach((b: any) => {
          if (!b.plugin.ping) return;
          const dt = (now - b.plugin.ping) / 360;
          if (dt >= 1) { b.plugin.ping = 0; return; }
          ctx.save(); ctx.globalAlpha = (1 - dt) * (b !== hoverBody ? dimLevel : 1);
          ctx.strokeStyle = "#ffd23e"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(b.position.x, b.position.y, b.plugin.half + dt * 26, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        });

        if (hoverBody) {
          const hp = hoverBody.position;
          ctx.save(); ctx.font = "800 14px Montserrat,sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          const w = ctx.measureText(hoverBody.plugin.name).width + 20; const ly = hp.y + hoverBody.plugin.half + 18;
          ctx.fillStyle = "rgba(10,58,87,0.92)"; pill(ctx, hp.x - w / 2, ly - 13, w, 26); ctx.fill();
          ctx.fillStyle = "#fff"; ctx.fillText(hoverBody.plugin.name, hp.x, ly); ctx.restore();
        }
      };
      Events.on(render, "afterRender", onAfter);

      function fit() {
        const w = stage.clientWidth, h = stage.clientHeight;
        render.canvas.width = w; render.canvas.height = h;
        render.options.width = w; render.options.height = h;
        render.bounds.min.x = 0; render.bounds.min.y = 0; render.bounds.max.x = w; render.bounds.max.y = h;
        buildWalls(w, h);
      }
      const ro = new ResizeObserver(() => fit());
      ro.observe(stage);

      shakeRef.current = () => {
        dyn().forEach((b: any) => {
          Body.setVelocity(b, { x: (Math.random() - 0.5) * 18, y: -8 - Math.random() * 14 });
          Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.5);
        });
      };

      // mobile: let the phone's own motion drive the pit. tilting steers gravity so the
      // pack rolls to the low side, and a sharp shake kicks everything like the button.
      let lastAx = 0, lastAy = 0, lastAz = 0, lastShake = 0;
      const onMotion = (e: any) => {
        if (disposed) return;
        const a = e.accelerationIncludingGravity; if (!a) return;
        const ax = a.x || 0, ay = a.y || 0, az = a.z || 0;
        const delta = Math.abs(ax - lastAx) + Math.abs(ay - lastAy) + Math.abs(az - lastAz);
        lastAx = ax; lastAy = ay; lastAz = az;
        const t = performance.now();
        if (delta > 32 && t - lastShake > 600) { lastShake = t; shakeRef.current(); }
      };
      const onOrient = (e: any) => {
        if (disposed) return;
        const tx = Math.max(-1.2, Math.min(1.2, (e.gamma || 0) / 45)); // left/right tilt, full pull near 45deg
        engine.gravity.x += (tx - engine.gravity.x) * 0.25; // ease toward it so it never jitters
      };
      let motionOn = false, motionAsking = false;
      const askPerm = (E: any) => (E && typeof E.requestPermission === "function") ? E.requestPermission().catch(() => "denied") : Promise.resolve("granted");
      const lockPortrait = () => {
        const so: any = (screen as any).orientation;
        if (so && typeof so.lock === "function") so.lock("portrait").catch(() => {}); // works on Android / installed PWA; iOS Safari ignores it
      };
      const enableMotion = () => {
        lockPortrait(); // attempt the lock on the same gesture
        if (motionOn || motionAsking) return;
        motionAsking = true;
        Promise.all([askPerm((window as any).DeviceMotionEvent), askPerm((window as any).DeviceOrientationEvent)]).then(([m, o]: any[]) => {
          motionAsking = false;
          if (m === "granted") { window.addEventListener("devicemotion", onMotion); motionOn = true; }
          if (o === "granted") { window.addEventListener("deviceorientation", onOrient); motionOn = true; }
        }).catch(() => { motionAsking = false; });
      };
      if (isMobile) { motionRef.current = enableMotion; enableMotion(); } // Android grants now; iOS waits for a tap

      if (!isMobile) {
        logoBody = makeLogo(stage.clientWidth, stage.clientHeight);
        Composite.add(engine.world, logoBody);
        Events.on(engine, "collisionStart", onCollide);
      }

      dropAll();

      dispose = () => {
        if (dropTimer) clearInterval(dropTimer);
        waveTimers.forEach(clearTimeout);
        ro.disconnect();
        render.canvas.removeEventListener("mousemove", onMove);
        render.canvas.removeEventListener("mouseleave", onLeave);
        render.canvas.removeEventListener("dblclick", onDbl);
        render.canvas.removeEventListener("mousedown", onDown);
        render.canvas.removeEventListener("click", onClick);
        render.canvas.removeEventListener("touchstart", onTouchStart);
        render.canvas.removeEventListener("touchend", onTouchEnd);
        window.removeEventListener("devicemotion", onMotion);
        window.removeEventListener("deviceorientation", onOrient);
        motionRef.current = () => {};
        Events.off(render, "afterRender", onAfter);
        Events.off(engine, "collisionStart", onCollide);
        Render.stop(render);
        Runner.stop(runner);
        Composite.clear(engine.world, false);
        Engine.clear(engine);
        if (render.canvas && render.canvas.parentNode) render.canvas.parentNode.removeChild(render.canvas);
        render.textures = {};
        shakeRef.current = () => {};
      };
    })();

    return () => { disposed = true; dispose(); };
  }, []);

  return (
    <section
      className={`${styles.stage}${activeBreed ? " " + styles.dimmed : ""}`}
      ref={stageRef}
      aria-label="The Pack Pit: tip out all the chums and play"
    >
      <div className={styles.controls}>
        <button type="button" className={styles.shake} onClick={() => { motionRef.current(); shakeRef.current(); }} aria-label="Shake the pit">
          <span className={styles.shakeIcon} aria-hidden="true" />
          <span className={styles.shakeText}>Shake</span>
        </button>
      </div>
      {activeBreed && <LineageMap breed={activeBreed} onClose={() => setActiveBreed(null)} />}
      <div className={styles.rotateGuard} aria-hidden="true">
        <div className={styles.rotateInner}>
          <span className={styles.rotatePhone} />
          <p>Turn your phone upright<br />to keep playing</p>
        </div>
      </div>
    </section>
  );
}
