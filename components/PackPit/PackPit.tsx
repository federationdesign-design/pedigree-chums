"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { breeds, breedCard } from "../../data/breeds";
import { getLineage, type LineageNode } from "../../data/lineage";
import { bust } from "../../data/imgVersion";
import LineageMap from "./LineageMap";
import HowToPlay from "../HowToPlay/HowToPlay";
import GameOver from "../GameOver/GameOver";
import { startCheckout } from "../Offer/startCheckout";
import styles from "./PackPit.module.css";

// Score milestones: crossing one fires a centre-screen celebration with confetti.
// Score milestones: every 5,000 (5k, 10k, 15k ...). Crossing one fires a
// centre-screen celebration with confetti. Labels escalate then hold at the top.
const MS_STEP = 5000;
const MS_LABELS = ["Yapp Yapp Yapp", "Bark Bark Bark", "Woof Woof Woof", "Yapp Bark Woof", "Hoooowwwwllllllll", "Are you done?", "maybe enter the site now?"];

const RADIUS: Record<string, number> = { small: 57.5, medium: 62.5, large: 72.5, giant: 82.5 };
const PALETTE = ["#1497d6", "#2bb4ee", "#0c5b92", "#0a3a57"];

// a child's share is the sum of its leaf values (leaves total 100 across the tree)
function sumLeaves(n: LineageNode): number {
  return n.children && n.children.length ? n.children.reduce((s, c) => s + sumLeaves(c), 0) : n.value ?? 0;
}

export default function PackPit() {
  const stageRef = useRef<HTMLDivElement>(null);
  const shakeRef = useRef<() => void>(() => {});
  const runnerRef = useRef<any>(null);
  const engineRef = useRef<any>(null);
  const renderRef = useRef<any>(null);
  const slowmoRef = useRef<() => void>(() => {});
  const slowmoActiveRef = useRef(false);
  const [slowmo, setSlowmo] = useState(false);
  const motionRef = useRef<() => void>(() => {});
  const shakeBtnRef = useRef<HTMLButtonElement>(null);
  const flashShakeRef = useRef<() => void>(() => {});
  const [activeBreed, setActiveBreed] = useState<{ name: string; image: string; x: number; y: number; angle: number } | null>(null);
  const [collected, setCollected] = useState(0); // chums chosen; each my-chum removal bumps this
  const collectedRef = useRef(0); // ref mirror for use in physics closures
  const [collectedChums, setCollectedChums] = useState<string[]>([]);
  const collectedChumsRef = useRef<string[]>([]); // ref mirror for use in physics closures // breed name of each chum collected, for the shelf
  const [shelfOpen, setShelfOpen] = useState(false); // the collection shelf overlay, opened from the tally
  const [dockOpen, setDockOpen] = useState(false); // My Chums dock, fanned up from tally chip
  const [dockHover, setDockHover] = useState<number | null>(null); // which card is magnified
  const [dockFlipped, setDockFlipped] = useState<Set<number>>(new Set()); // which cards are flipped
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0); // ref mirror for use in physics closures // running total of every flashed number, shown above the shake button
  const [scorePulse, setScorePulse] = useState(false);
  const [britainMsg, setBritainMsg] = useState<number | null>(null);
  const britainTimer = useRef<any>(null);
  const showBritainMsg = (idx: number) => {
    if (britainTimer.current) clearTimeout(britainTimer.current);
    setBritainMsg(idx);
    // no auto-dismiss -- tap 2 on the flag closes it
  };
  const prevScoreRef = useRef(0);
  useEffect(() => { if (score !== prevScoreRef.current) { prevScoreRef.current = score; setScorePulse(true); setTimeout(() => setScorePulse(false), 400); } }, [score]);
  const [milestone, setMilestone] = useState<{ value: number; label: string; id: number } | null>(null); // current celebration
  const msLast = useRef(0); // highest milestone already celebrated
  const msTimer = useRef<number | null>(null);
  const pendingMs = useRef<{ value: number; label: string } | null>(null); // a milestone crossed while the card overlay is open, held until it closes
  const cookiesOpenRef = useRef(false); // the cookies banner is up, tracked via its own window events
  useEffect(() => {
    const open = () => { cookiesOpenRef.current = true; };
    const shut = () => { cookiesOpenRef.current = false; };
    window.addEventListener("pc:open-cookies", open);
    window.addEventListener("pc:cookies-accepted", shut);
    window.addEventListener("pc:cookies-rejected", shut);
    return () => {
      window.removeEventListener("pc:open-cookies", open);
      window.removeEventListener("pc:cookies-accepted", shut);
      window.removeEventListener("pc:cookies-rejected", shut);
    };
  }, []);
  // a milestone must wait for the family tree, the pre-order form (a modal dialog
  // in the DOM) and the cookies banner to clear before it pops over the pit
  const anyOverlayOpen = () => !!activeBreed || howToPlay || shelfOpen || cookiesOpenRef.current
    || (typeof document !== "undefined" && !!document.querySelector('[role="dialog"][aria-modal="true"]'));
  const msBlocked = anyOverlayOpen;
  useEffect(() => {
    const reached = Math.floor(score / MS_STEP) * MS_STEP; // highest 5k mark at or below the score
    if (reached >= MS_STEP && reached > msLast.current) {
      msLast.current = reached;
      const label = MS_LABELS[Math.min(reached / MS_STEP - 1, MS_LABELS.length - 1)];
      if (msBlocked()) {
        pendingMs.current = { value: reached, label }; // hold it: something is on screen, don't cover it (keep the highest)
      } else {
        setMilestone({ value: reached, label, id: performance.now() });
      }
    }
  }, [score, activeBreed]);
  // release a held milestone the moment every blocker is clear; the offer modal has
  // no close event, so poll briefly rather than wait on a dependency
  useEffect(() => {
    if (!pendingMs.current) return;
    const tryFlush = () => {
      if (!pendingMs.current) return true;
      if (msBlocked()) return false;
      const held = pendingMs.current;
      pendingMs.current = null;
      setMilestone({ value: held.value, label: held.label, id: performance.now() });
      return true;
    };
    if (tryFlush()) return;
    const iv = window.setInterval(() => { if (tryFlush()) window.clearInterval(iv); }, 400);
    return () => window.clearInterval(iv);
  }, [activeBreed, score]);
  useEffect(() => {
    if (!milestone) return;
    if (msTimer.current) window.clearTimeout(msTimer.current);
    msTimer.current = window.setTimeout(() => setMilestone(null), 2600); // clears after the pop-out finishes
    return () => { if (msTimer.current) window.clearTimeout(msTimer.current); };
  }, [milestone]);
  const [howToPlay, setHowToPlay] = useState(false); // how-to-play strip, opened by the pit panel
  // Start false if cookies already accepted/rejected in a previous session
  const cookieBannerOpenRef = useRef(typeof window !== "undefined" && !localStorage.getItem("pc-cookies") ? true : false);
  const [howToPlayStep, setHowToPlayStep] = useState<number | null>(null); // which step card was tapped (0-4); null = show intro
  const [gameOver, setGameOver] = useState(false);
  // true only when the game-over trigger fired because all 54 were collected
  // (rather than the pit filling up) -- passed to GameOver for the celebration variant

  useEffect(() => { if (!howToPlay) window.dispatchEvent(new Event("pc:close-howtoplay")); }, [howToPlay]);
  useEffect(() => {
    // Preload HowToPlay videos immediately on pit mount
    [1,2,3,6].forEach((n) => {
      const vsrc = n === 3 ? "/step3-video-animationv3.mp4" : n === 6 ? "/step6-video-animation.mp4" : `/step${n}-video-animation.mp4`;
      const v = document.createElement("video");
      v.src = vsrc; v.preload = "auto"; v.muted = true;
    });
    // Preload pit square images AND card artwork so game over screen shows them instantly
    breeds.forEach((b) => { if (b.image) { const img = new Image(); img.src = b.image; } });
    Object.values(breedCard).forEach((src) => { const img = new Image(); img.src = src; });
    const open = () => { setHowToPlay(true); };
    window.addEventListener("pc:open-howtoplay", open);
    return () => window.removeEventListener("pc:open-howtoplay", open);
  }, []);
  useEffect(() => {
    // overlay-opened/closed handled by the overlayOpen effect below -- no duplicate listener needed
    return () => {};
  }, []);
  const lineageOpenRef = useRef(false);
  const removeBreedRef = useRef<(name: string) => void>(() => {});
  const scatterRef = useRef<(data: { circles: { x: number; y: number; r: number; share: number; name: string }[]; rods: { x1: number; y1: number; x2: number; y2: number; lit: boolean }[]; pills: { x: number; y: number; w: number; name: string }[] }) => void>(() => {});
  useEffect(() => { lineageOpenRef.current = !!activeBreed; }, [activeBreed]);
  useEffect(() => { collectedRef.current = collected; }, [collected]);
  useEffect(() => { collectedChumsRef.current = collectedChums; }, [collectedChums]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  // Fire pending game over as soon as all overlays close
  useEffect(() => {
    if (!activeBreed && !howToPlay && !shelfOpen && !cookiesOpenRef.current && pendingGameOver.current && !gameOver) {
      pendingGameOver.current = false;
      gameOverRef.current = true;
      // Show GAME OVER flash before navigating
      const stageEl = document.querySelector(".stage") as HTMLElement | null;
      if (stageEl) {
        const flash = document.createElement("div");
        flash.style.cssText = "position:absolute;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;font-family:var(--font-display,'Luckiest Guy',system-ui);font-size:clamp(5rem,18vw,12rem);color:#fff;pointer-events:none;text-shadow:0 4px 40px rgba(0,0,0,0.6)";
        flash.textContent = "GAME OVER";
        stageEl.appendChild(flash);
      }
      window.setTimeout(() => {
        const canvas = document.querySelector(".stage > canvas") as HTMLElement | null;
        if (canvas) canvas.style.pointerEvents = "none";
        try {
          sessionStorage.setItem("pc-gameover-score", String(scoreRef.current));
          sessionStorage.setItem("pc-gameover-chums", String(collectedRef.current));
          const breedImgMap = Object.fromEntries(breeds.map((b: any) => [b.name, breedCard[b.slug] || b.image || ""]));
          sessionStorage.setItem("pc-gameover-breeds", JSON.stringify(collectedChumsRef.current.map((n: string) => ({ name: n, img: breedImgMap[n] || "" }))));
        } catch {}
        window.location.href = "/about?gameover=1";
      }, 1800);
    }
  }, [activeBreed, howToPlay, shelfOpen, gameOver]);

  // Auto slow motion at zero drain cost when any overlay is open
  const autoSlowmoRef = useRef(false);
  useEffect(() => {
    // ALL overlays fully pause the pit -- no slowmo, no ambiguity
    // Pit runs continuously -- no pause on overlay open
    void howToPlay; void activeBreed; void shelfOpen; void britainMsg;
  }, [activeBreed, shelfOpen, howToPlay, britainMsg]);

  // When Learn completes, auto-open the first chum's lineage after a short delay
  useEffect(() => {
    const onPackComplete = (e: Event) => {
      const name = (e as CustomEvent).detail?.name;
      if (!name || activeBreed) return;
      const breed = breeds.find((b) => b.name === name);
      if (!breed) return;
      // position roughly centre-screen since the card is now in a frame
      const cx = typeof window !== "undefined" ? window.innerWidth / 2 : 400;
      const cy = typeof window !== "undefined" ? window.innerHeight / 2 : 300;
      setActiveBreed({ name: breed.name, image: breed.image || "", x: cx, y: cy, angle: 0 });
    };
    window.addEventListener("pc:pack-complete", onPackComplete as EventListener);
    return () => window.removeEventListener("pc:pack-complete", onPackComplete as EventListener);
  }, [activeBreed]);

  // Score-based reward/penalty scaling
  // Pre-order reward: more score earned = more valuable (you showed up and played)
  const preorderReward = (s: number) => s < 500 ? 50 : s < 2000 ? 150 : s < 5000 ? 350 : 750;
  // Auto penalty: more score earned = steeper cost (you had more opportunity to earn it yourself)
  const autoPenalty = (s: number) => s < 500 ? -500 : s < 2000 ? -1000 : s < 5000 ? -2500 : -5000;

  // Score drain: -1 per second while score > 0, paused whenever the LineageMap overlay is open.
  const drainRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (drainRef.current) clearInterval(drainRef.current);
    drainRef.current = setInterval(() => {
      if (lineageOpenRef.current) return; // paused while family-tree overlay is open
      if (gameOverRef.current) return; // score frozen on game over
      const drain = slowmoActiveRef.current ? 4 : 1; // 4x drain in slow motion
      setScore((s: number) => Math.max(0, s - drain));
    }, 1000);
    return () => { if (drainRef.current) clearInterval(drainRef.current); };
  }, []); // runs once; lineageOpenRef is checked inside the interval callback

  // Game over detection: physics loop watches newly added bodies.
  // If a body spawns and is still in the top 10% of the pit after 3s, the pit is full.
  // Cannot fire before 30s to avoid triggering during the opening cascade.
  const gameOverRef = useRef(false);
  const pendingGameOver = useRef(false); // queued game over, fires when all overlays close
  useEffect(() => {
    const startTime = Date.now();
    const onResult = (e: Event) => {
      if (gameOverRef.current) return;
      if (Date.now() - startTime < 30000) return; // 30s minimum
      const stuck = (e as CustomEvent).detail?.stuck ?? false;
      if (stuck) {
        gameOverRef.current = true;
        if (drainRef.current) { clearInterval(drainRef.current); drainRef.current = null; } // stop drain on game over
        // Wait for activity to settle before showing game over -- check every 500ms
        // until average body speed drops below threshold, then wait an extra 1.5s
        const checkQuiet = () => {
          const eng = engineRef.current;
          if (!eng) { if (runnerRef.current) (runnerRef.current as any).enabled = false; pendingGameOver.current = true; return; }
          const all = (eng.world.bodies as any[]).filter((b: any) => !b.isStatic);
          const avgSpeed = all.length ? all.reduce((s: number, b: any) => s + Math.hypot(b.velocity.x, b.velocity.y), 0) / all.length : 0;
          if (avgSpeed < 2) {
            if (runnerRef.current) (runnerRef.current as any).enabled = false;
            pendingGameOver.current = true;
          } else {
            window.setTimeout(checkQuiet, 500);
          }
        };
        window.setTimeout(checkQuiet, 1000);
      }
    };
    window.addEventListener("pc:gameover-result", onResult as EventListener);
    return () => {
      window.removeEventListener("pc:gameover-result", onResult as EventListener);
    };
  }, []);

  useEffect(() => {
    let disposed = false;
    let dispose = () => {};

    (async () => {
      const mod: any = await import("matter-js");
      const Matter = mod.default || mod;
      if (disposed || !stageRef.current) return;
      const stage = stageRef.current;

      const BREEDS = breeds.map((b) => ({ name: b.name, size: b.sizeBand as string, img: b.image }));
      const PACK_NAMES = new Set(breeds.map((b) => b.name)); // the 54 pack dogs, to flag chum pills that should survive
      const FAMILY: Record<string, { name: string; share: number }[]> = {};
      for (const b of breeds) {
        const lin = getLineage(b.name);
        if (lin && lin.children) FAMILY[b.name] = lin.children.map((c) => ({ name: c.name, share: Math.round(sumLeaves(c)) }));
      }
      const IMG: Record<string, HTMLImageElement> = {};
      const getImg = (name: string, src: string) => {
        if (!IMG[name]) { const im = new Image(); im.src = bust(src); IMG[name] = im; }
        return IMG[name];
      };

      // Toys tip in ahead of the pack. Their size is pinned to a fixed unit (the
      // original giant card half) so changing the card bands never resizes them.
      // Each body matches its SVG aspect ratio; `aspect` is a starting guess that
      // gets corrected from the loaded image.
      const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
      const SCALE = isMobile ? 0.67 : 1; // mobile shrinks cards and toys uniformly by a third
      const BIG = 84 * SCALE;
      const pctFont = (typeof window !== "undefined" ? getComputedStyle(document.documentElement).getPropertyValue("--font-pct").trim() : "") || "Montserrat"; // Open Sans for the % figures
      const ball = { key: "__ball", label: "Tennis ball", src: "/tennis-ball.svg", shape: "ball", width: BIG * 2.25 * (isMobile ? 0.9 : 1), aspect: 1 };
      const bone = { key: "__bone", label: "Bone", src: "/big-bone.svg", shape: "bone", width: BIG * 4.95 * (isMobile ? 0.9 : 1), aspect: 2.05 };
      const bowl = { key: "__bowl", label: "Dog bowl", src: "/dog-bowl-2.svg", shape: "bowl", width: BIG * 9.38 * (isMobile ? 0.85 : 1), aspect: 3.22, angle: (80 * Math.PI) / 180 };
      const slipper = { key: "__slipper", label: "Slipper", src: "/slipper-edit2.svg", shape: "slipper", width: BIG * (isMobile ? 6.65 : 8.31), aspect: 2.721 };

      const logo = { key: "__logo", label: "Pedigree Chums", src: "/PC-logo.svg", shape: "logo", width: BIG * 6.8, aspect: 150 / 64 };
      const BALLS = isMobile ? [ball] : [ball, ball, ball];
      const HEAVY = [bone, slipper];

      const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Query, Body, Events, Constraint } = Matter;

      // Pre-build slipper compound body AFTER Body is available - avoids freeze on drop
      const slipperW = BIG * (isMobile ? 6.65 : 8.31), slipperH = slipperW / 2.721;
      const _sk = slipperW / 1108.5, _scx = 1108.5 / 2, _scy = 407.4 / 2;
      const _spo = { restitution: 0.3, friction: 0.3, density: 0.0008, render: { visible: false } };
      const _sR = (vx: number, vy: number, w: number, h: number) => Bodies.rectangle((vx-_scx)*_sk, (vy-_scy)*_sk, w*_sk, h*_sk, _spo);
      const _sRA = (vx: number, vy: number, w: number, h: number, deg: number) => Bodies.rectangle((vx-_scx)*_sk, (vy-_scy)*_sk, w*_sk, h*_sk, { ..._spo, angle: deg*Math.PI/180 });
      const _sC = (vx: number, vy: number, r: number) => Bodies.circle((vx-_scx)*_sk, (vy-_scy)*_sk, r*_sk, _spo);
      const _slipperBody: any = Body.create({ parts: [
        _sR(554, 363, 1107, 84),
        _sC(546, 241, 154),
        _sC(124, 333, 97),
        _sRA(370, 143, 380, 70, -18.7),
        _sR(891, 336, 349, 64),
      ], frictionAir: 0.012, render: { visible: false } });
      const slipperImg = getImg(slipper.key, slipper.src);
      // ox/oy compensate for compound body centroid offset (centroid is ~27px left, 58px below VB centre)
      // ox/oy: centroid is ~27px left and ~1.5px above image centre - nearly zero correction needed
      _slipperBody.plugin = { name: slipper.label, half: Math.min(slipperW, slipperH)/2, w: slipperW, h: slipperH, color:"#bfe3f7", img: slipperImg, prop:"slipper", family:null, ping:0, ox: slipperW * 0.039, oy: -(slipperH * 0.006) };

      // Pre-build bowl compound body at init (avoids freeze on creation)
      // VB: 1031.7 x 316.8 - floor + bump + two angled walls
      const bowlW = bowl.width, bowlH = bowlW / bowl.aspect;
      const _bk = bowlW / 1031.7, _bcx = 1031.7 / 2, _bcy = 316.8 / 2;
      const _bpo = { restitution: 0.3, friction: 0.3, density: 0.006, render: { visible: false } };
      const _bR = (vx: number, vy: number, w: number, h: number) => Bodies.rectangle((vx-_bcx)*_bk, (vy-_bcy)*_bk, w*_bk, h*_bk, _bpo);
      const _bowlBody: any = Body.create({ parts: [
        _bR(515, 295, 820, 30),   // floor
        _bR(515, 265, 120, 80),   // centre bump
        Bodies.rectangle((90-_bcx)*_bk, (150-_bcy)*_bk, 18*_bk, 230*_bk, { ..._bpo, angle: 0.349 }),  // left wall
        Bodies.rectangle((940-_bcx)*_bk, (150-_bcy)*_bk, 18*_bk, 230*_bk, { ..._bpo, angle: -0.349 }), // right wall
      ], frictionAir: 0.012, render: { visible: false } });
      const bowlImg = getImg(bowl.key, bowl.src);
      _bowlBody.plugin = { name: bowl.label, half: Math.min(bowlW, bowlH)/2, w: bowlW, h: bowlH, color:"#bfe3f7", img: bowlImg, prop:"bowl", family:null, ping:0, ox:0, oy:0, isBowl:true, bowlScored: new Set() };

      const engine = Engine.create();
      engineRef.current = engine;
      engine.gravity.y = 1;
      const render = Render.create({
        element: stage, engine,
        options: { width: stage.clientWidth, height: stage.clientHeight, background: "transparent", wireframes: false, pixelRatio: 1 },
      });
      renderRef.current = render;
      Render.run(render);
      const runner = Runner.create();
      runnerRef.current = runner;
      slowmoRef.current = () => { if (engine.timing.timeScale === 1) { engine.timing.timeScale = 0.25; slowmoActiveRef.current = true; } else { engine.timing.timeScale = 1; slowmoActiveRef.current = false; } };
      Runner.run(runner, engine);

      let walls: any[] = [];
      function buildWalls(w: number, h: number) {
        if (walls.length) Composite.remove(engine.world, walls);
        const t = 600; // thick walls prevent tunnelling at high velocity
        const ceilY = -800; // higher ceiling -- gives bowl and objects more room to fall in
        const sideTop = ceilY - t, sideBot = h * 2;
        const sideH = sideBot - sideTop, sideC = (sideTop + sideBot) / 2;
        walls = [
          Bodies.rectangle(w / 2, h + t / 2 - 2, w + t * 2, t, { isStatic: true, restitution: 0.4, render: { visible: false } }), // floor
          Bodies.rectangle(-t / 2 + 2, sideC, t, sideH, { isStatic: true, restitution: 0.5, render: { visible: false } }),
          Bodies.rectangle(w + t / 2 - 2, sideC, t, sideH, { isStatic: true, restitution: 0.5, render: { visible: false } }),
          Bodies.rectangle(w / 2, ceilY - t / 2, w + t * 2, t, { isStatic: true, restitution: 0.2, render: { visible: false } }), // ceiling -- low restitution kills upward energy
        ];
        Composite.add(engine.world, walls);
      }
      buildWalls(stage.clientWidth, stage.clientHeight);

      const dyn = () => Composite.allBodies(engine.world).filter((b: any) => !b.isStatic);

      function makeBall(breed: any, i: number, w: number) {
        const s = ((RADIUS[breed.size] || 32) + (Math.random() * 4 - 2)) * SCALE;
        const cr = Math.max(7, s * 0.22);
        const color = PALETTE[i % PALETTE.length];
        const b = Bodies.rectangle(40 + Math.random() * (w - 80), -20 - Math.random() * 500, 2 * s, 2 * s, {
          chamfer: { radius: cr }, restitution: 0.32, friction: 0.28, frictionAir: 0.012, density: 0.001, render: { visible: false },
        });
        b.plugin = { name: breed.name, half: s, corner: cr, color, family: FAMILY[breed.name] || null, img: getImg(breed.name, breed.img), ping: 0, seq: i + 1 };
        return b;
      }

      function makeProp(prop: any, w: number) {
        const img = getImg(prop.key, prop.src);
        // Bowl spawns low and centred -- it's very wide and gets caught on ceiling otherwise
        const x = prop.shape === "bowl" ? w / 2 + (Math.random() - 0.5) * w * 0.3 : 80 + Math.random() * (w - 160);
        const y = (prop.shape === "bowl" || prop.shape === "slipper") ? -400 : -60 - Math.random() * 60;
        if (prop.shape === "ball") {
          const r = prop.width / 2;
          const b: any = Bodies.circle(x, y, r, { restitution: 0.97, friction: 0.05, frictionAir: 0.003, density: 0.0006, render: { visible: false } }); // patch_bits_v1: super bouncy
          b.plugin = { name: prop.label, half: r, w: prop.width, h: prop.width, color: "#c7e65a", img, prop: "ball", family: null, ping: 0 };
          return b;
        }
        if (prop.shape === "bone") {
          // Bone compound body: two end lobes + connecting shaft
          // VB: 205x100, aspect 2.05
          const bw = prop.width, bh = prop.width / prop.aspect;
          const _bk = bw / 205, _bcx = 102.5, _bcy = 50;
          const _bpo = { restitution: 0.3, friction: 0.3, density: 0.0008, render: { visible: false } };
          const _bC = (vx: number, vy: number, r: number) => Bodies.circle((vx-_bcx)*_bk, (vy-_bcy)*_bk, r*_bk, _bpo);
          const _bR = (vx: number, vy: number, w: number, h: number) => Bodies.rectangle((vx-_bcx)*_bk, (vy-_bcy)*_bk, w*_bk, h*_bk, _bpo);
          const b: any = Body.create({ parts: [
            _bC(25, 50, 38),    // left lobe
            _bC(180, 50, 38),   // right lobe
            _bR(102, 50, 130, 28), // shaft
          ], frictionAir: 0.012, render: { visible: false } });
          Body.setPosition(b, { x, y });
          b.collisionFilter = { ...(b.collisionFilter || {}), group: FUSE_GROUP };
          b.plugin = { name: prop.label, half: Math.min(bw, bh) / 2, w: bw, h: bh, color: "#f6ecd6", img, prop: "bone", family: null, ping: 0 };
          return b;
        }
        if (prop.shape === "slipper" || prop.shape === "bowl") {
          const bw = prop.width, bh = prop.width / prop.aspect;
          const po = { restitution: 0.3, friction: 0.3, density: 0.0008, render: { visible: false } };
          const VB = prop.shape === "slipper" ? { w: 1108.5, h: 407.4 } : { w: 1031.7, h: 316.8 };
          const po2 = prop.shape === "bowl" ? { restitution: 0.3, friction: 0.3, density: 0.006, render: { visible: false } } : po;
          const k = bw / VB.w, cx0 = VB.w / 2, cy0 = VB.h / 2;
          const R = (vx: number, vy: number, w: number, h: number, opts = po) =>
            Bodies.rectangle((vx - cx0) * k, (vy - cy0) * k, w * k, h * k, opts);
          const RA = (vx: number, vy: number, w: number, h: number, deg: number, opts = po) =>
            Bodies.rectangle((vx - cx0) * k, (vy - cy0) * k, w * k, h * k, { ...opts, angle: deg * Math.PI / 180 });
          const C = (vx: number, vy: number, r: number) =>
            Bodies.circle((vx - cx0) * k, (vy - cy0) * k, r * k, po);
          let b: any;
          if (prop.shape === "slipper") {
            // Use pre-built body - position it at drop point
            b = _slipperBody;
            Body.setPosition(b, { x, y });
            Body.setVelocity(b, { x: 0, y: 0 });
            Body.setAngularVelocity(b, 0);
          } else {
            // Bowl: use pre-built compound body
            b = _bowlBody;
            Body.setPosition(b, { x, y });
            Body.setVelocity(b, { x: 0, y: 0 });
            Body.setAngularVelocity(b, 0);
            b.plugin.bowlScored = new Set(); // reset scored set each drop
          }
          if (prop.angle) Body.setAngle(b, prop.angle);
          b.plugin = { name: prop.label, half: Math.min(bw, bh) / 2, w: bw, h: bh, color: "#bfe3f7", img, prop: prop.shape, family: null, ping: 0, ox: 0, oy: 0, isBowl: prop.shape === "bowl", bowlScored: new Set() };
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

      // The logo sits fixed in the pit on load. It is a solid static body, so the
      // pouring pack and toys bounce off it. Each strike sinks and tilts it a notch,
      // and on the fifth hit it finally gives: it goes dynamic and drops onto the
      // pile to rest with everything else. Desktop only.
      const LOGO_LOGO_CAT = 0x0008;
      const FUSE_GROUP = -3; // logo + bones share this negative group so they pass through each other (to fuse) // collision category for the logo body, so dropped pieces can ignore it
      let logoBody: any = null;
      function makeLogo(w: number, h: number) {
        const img = getImg(logo.key, logo.src);
        const ar = img.complete && img.naturalWidth ? img.naturalWidth / img.naturalHeight : logo.aspect;
        const bw = logo.width, bh = logo.width / ar;
        // collider shrunk to artwork bounds: dumbbell sits in ~85% width, ~70% height of bounding box
        const b: any = Bodies.rectangle(w / 2, h * 0.2 + 100, bw * 0.85, bh * 0.7, { isStatic: true, isSensor: false, collisionFilter: { category: LOGO_LOGO_CAT, group: FUSE_GROUP }, render: { visible: false } });
        b.plugin = { name: logo.label, half: Math.min(bw, bh) / 2, w: bw, h: bh, color: "#ffffff", img, prop: "logo", logo: true, family: null, ping: 0, popAlpha: 0, popStart: performance.now(), logoFading: true };
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
      const LOGO_TILT = Math.asin(Math.min(1, LOGO_SINK / LOGO_W)); // tilt that drops the free edge
      // Swap-and-drop: each hit swaps the logo art to the next backdrop (one
      // element removed) and drops that element into the pit as its own body.
      const LOGO_STAGES = [
        { bgKey: "__logoS1", bg: "/PC-logo-2nd-hit.svg", dropKey: "__logoD1", drop: "/why-dot-for-logofall.svg", ar: 19.7 / 19.6, size: BIG * 0.45 },
        { bgKey: "__logoS2", bg: "/PC-logo-3rd-hit.svg", dropKey: "__logoD2", drop: "/yellow-dot-for-logofall.svg", ar: 19.7 / 19.6, size: BIG * 0.45 },
        { bgKey: "__logoS3", bg: "/PC-logo-4th-hit.svg", dropKey: "__logoD3", drop: "/shouts-for-logofall.svg", ar: 69 / 71.4, size: BIG * 0.8 },
        { bgKey: "__logoS4", bg: "/PC-logo-5th-hit.svg", dropKey: "__logoD4", drop: "/poofs-for-logofall.svg", ar: 50.6 / 64.5, size: BIG * 0.75 },
        { bgKey: "__logoS5", bg: "/PC-logo-6th-hit.svg", dropKey: "__logoD5", drop: "/tagline-dot-for-logofall.svg", ar: 174.1 / 23.9, size: BIG * 2.0 },
      ];
      LOGO_STAGES.forEach((st) => { getImg(st.bgKey, st.bg); const di = getImg(st.dropKey, st.drop); if (di && (di as any).decode) (di as any).decode().catch(() => {}); }); // preload + force-decode so pieces (esp. shouts) paint the instant they spawn
      // Spawn one removed logo element as a tumbling pit body, near the logo centre.
      const SHOUT_HANG_MS = 350;  // how long the shouts piece hangs before releasing (min for a visible swing)
      const SHOUT_SWING_DEG = 3;  // pendulum arc of the hang
      // Each hit drops a specific set of elements at named spots on the logo.
      // Positions are fractions of the logo half-extents from its centre:
      //   x: -1 = left edge, +1 = right edge;  y: -1 = top, +1 = bottom.
      const LOGO_PIECE_CAT = 0x0010; // collision category for logo pieces
      const HALF_W = LOGO_W / 2, HALF_H = (LOGO_W / (150 / 64)) / 2;
      const spawnPiece = (st: { dropKey: string; drop: string; ar: number; size: number }, x: number, y: number, scale: number, angleDeg: number, hang: boolean) => {
        const pw = st.size * scale, ph = (st.size / st.ar) * scale;
        const b: any = Bodies.rectangle(x, y, pw, ph, {
          angle: (angleDeg * Math.PI) / 180,
          chamfer: { radius: Math.min(pw, ph) * 0.18 }, restitution: 0.45, friction: 0.4, frictionAir: 0.01, density: 0.0009,
          collisionFilter: { category: LOGO_PIECE_CAT, mask: ~LOGO_PIECE_CAT & ~LOGO_LOGO_CAT }, // ignore the logo and each other
          render: { visible: false },
        });
        b.plugin = { name: "Logo piece", label: "", half: Math.min(pw, ph) / 2, w: pw, h: ph, color: "#ffd23e", img: getImg(st.dropKey, st.drop), prop: "logopiece", knockPiece: true, family: null, ping: 0 };
        Composite.add(engine.world, b); // falls straight under gravity: no velocity, no spin
        if (hang) {
          const hinge = Constraint.create({
            pointA: { x: x + pw / 2, y: y - ph / 2 }, bodyB: b, pointB: { x: pw / 2, y: -ph / 2 },
            length: 0, stiffness: 1, render: { visible: false },
          });
          Composite.add(engine.world, hinge);
          Body.setAngularVelocity(b, (SHOUT_SWING_DEG * Math.PI / 180) * 0.4);
          window.setTimeout(() => { if (!disposed) Composite.remove(engine.world, hinge); }, SHOUT_HANG_MS);
        }
      };
      // half-extent fractions: place a piece at (fx, fy) of the logo box, plus an
      // out-dent in px. The offset is rotated by the logo's current angle so the
      // spot tracks the logo as it sinks and tilts.
      const at = (cx: number, cy: number, fx: number, fy: number, outX = 0, outY = 0) => {
        const ox = fx * HALF_W + outX, oy = fy * HALF_H + outY;
        const a = logoBody ? logoBody.angle : 0;
        const ca = Math.cos(a), sa = Math.sin(a);
        return { x: cx + ox * ca - oy * sa, y: cy + ox * sa + oy * ca };
      };
      const dropLogoPiece = (st: { dropKey: string; drop: string; ar: number; size: number }, cx: number, cy: number, hitIndex: number) => {
        if (hitIndex === 0) {
          // 7 white dots at their true spots on the logo (fractions of the logo box,
          // -1..+1 from centre). Approximate by design; tracks the logo's tilt via at().
          const s = 0.5;
          const spots: [number, number, number][] = [
            [0.6, -0.9,    1],    // ~80% across, ~5% down
            [-0.94, -0.76, 1],    // ~3% across, ~12% down
            [-0.7, -0.4,   1],    // ~15% across, ~30% down
            [0.56, -0.3,   1],    // ~78% across, ~35% down
            [-0.74, 0.1,   1],    // ~13% across, ~55% down
            [-0.74, 0.7,   1],    // ~13% across, ~85% down
            [0.6, 0.84,    0.6],  // ~80% across, ~92% down -- 40% smaller (patch_dots_v1)
          ];
          spots.forEach(([fx, fy, sc]) => { const p = at(cx, cy, fx, fy); spawnPiece(st, p.x, p.y, s * sc, 0, false); });
        } else if (hitIndex === 1) {
          // 3 yellow dots, half size: bottom-left, top-right, bottom-right
          const s = 0.5;
          const spots = [[-0.7, 0.7], [0.7, -0.7], [0.7, 0.7]];
          spots.forEach(([fx, fy]) => { const p = at(cx, cy, fx, fy); spawnPiece(st, p.x, p.y, s, 0, false); });
        } else if (hitIndex === 2) {
          // 8 shouts: a dyad at each corner, the pair splayed ~33 degrees apart; each hangs
          const corners: [number, number, number][] = [
            [-0.8, -0.8, 225], [0.8, -0.8, 315], [0.8, 0.8, 45], [-0.8, 0.8, 135], // base angle points outward from centre
          ];
          corners.forEach(([fx, fy, base]) => {
            const p = at(cx, cy, fx, fy);
            spawnPiece(st, p.x, p.y, 1, base - 16.5, true); // one half of the dyad
            spawnPiece(st, p.x, p.y, 1, base + 16.5, true); // the other, 33 degrees apart
          });
        } else if (hitIndex === 3) {
          // 4 poofs: 1 per side, 100px out from the central axis
          const OUT = 100;
          const sides = [
            at(cx, cy, 0, -1, 0, -OUT), // top
            at(cx, cy, 0, 1, 0, OUT),   // bottom
            at(cx, cy, -1, 0, -OUT, 0), // left
            at(cx, cy, 1, 0, OUT, 0),   // right
          ];
          sides.forEach((p) => spawnPiece(st, p.x, p.y, 1, 0, false));
        } else {
          // tagline: single, centred below
          spawnPiece(st, cx, cy + HALF_H * 0.2, 1, 0, false);
        }
      };
      let logoHits = 0;
      const onCollide = (ev: any) => {
        if (!logoBody || !logoBody.isStatic) return;
        for (const pair of ev.pairs) {
          const lg = pair.bodyA.plugin?.logo ? pair.bodyA : pair.bodyB.plugin?.logo ? pair.bodyB : null;
          if (!lg) continue;
          const other = lg === pair.bodyA ? pair.bodyB : pair.bodyA;
          if (!other || other.isStatic) continue;
          if (other.plugin?.prop === "logopiece") continue; // a falling logo piece must not count as a hit
          logoHits++; // count every hit, including repeat knocks from the same object
          const st = LOGO_STAGES[Math.min(logoHits, LOGO_STAGES.length) - 1]; // this hit's backdrop + dropped piece
          if (st) { lg.plugin.img = getImg(st.bgKey, st.bg); dropLogoPiece(st, lg.position.x, lg.position.y, logoHits - 1); } // swap art, drop the removed element
          if (logoHits >= LOGO_HITS_TO_FALL) { lg.isSensor = false; Body.setStatic(lg, false); break; } // the straw that breaks it
          Body.translate(lg, { x: 0, y: LOGO_SINK }); // shove the centre down a notch
          Body.rotate(lg, LOGO_TILT); // and tip it so one side sinks while the other stays almost pinned
        }
      };
      // The hamburger menu starts fixed in the top-right corner, just like the logo.
      // Objects pouring past knock it loose a notch at a time, and once it has taken
      // enough hits it gives way, drops into the pit and behaves like any other object,
      // still opening the site menu on a tap. Lives on both platforms (it is the only
      // way into the menu from the pit).
      let menuBody: any = null;
      const MENU_SZ = BIG * 1.2;
      function makeMenuFixed(w: number) {
        const x = w - MENU_SZ / 2 - 20, y = MENU_SZ / 2 + 20; // tucked into the top-right corner
        const b: any = Bodies.rectangle(x, y, MENU_SZ, MENU_SZ, { isStatic: true, isSensor: false, chamfer: { radius: MENU_SZ * 0.3 }, restitution: 0.25, friction: 0.4, frictionAir: 0.012, density: 0.0011, render: { visible: false } });
        b.plugin = { name: "Menu", label: "Menu", half: MENU_SZ / 2, w: MENU_SZ, h: MENU_SZ, color: "#ffd23e", kind: "menu", menuFixed: true, family: null, ping: 0 };
        return b;
      }
      const MENU_HITS_TO_FALL = 5;
      const MENU_SINK = BIG * 0.5; // how far each hit nudges it down before it finally drops
      const MENU_TILT = Math.asin(Math.min(1, MENU_SINK / MENU_SZ)); // tip it as it loosens
      let menuHits = 0;
      const onMenuCollide = (ev: any) => {
        if (!menuBody || !menuBody.isStatic) return;
        for (const pair of ev.pairs) {
          const mn = pair.bodyA.plugin?.menuFixed ? pair.bodyA : pair.bodyB.plugin?.menuFixed ? pair.bodyB : null;
          if (!mn) continue;
          const other = mn === pair.bodyA ? pair.bodyB : pair.bodyA;
          if (!other || other.isStatic) continue;
          menuHits++; // count every knock, including repeat nudges from the same object
          if (menuHits >= MENU_HITS_TO_FALL) { mn.plugin.menuFixed = false; Body.setStatic(mn, false); break; } // it finally gives and falls into the pit
          Body.translate(mn, { x: 0, y: MENU_SINK }); // shove it down a notch
          Body.rotate(mn, MENU_TILT); // and tip it as one corner loosens
        }
      };
      // The reserve "button" is a pit object: a yellow rounded box the visitor can
      // fling around, and a tap opens the reservation popup.
      // The reserve / pre-order "buttons" are pit objects: small yellow rounded
      // boxes the visitor can fling around, and a tap fires the relevant action.
      function makeButton(kind: string, label: string, w: number) {
        const grow = kind === "cookieaccept" ? 1.33 : 1; // the Accept button is 33% larger than the rest
        const rw = BIG * 2.6 * grow, rh = BIG * 1.0 * grow;
        const x = 80 + Math.random() * (w - 160), y = -260 - Math.random() * 200;
        const b: any = Bodies.rectangle(x, y, rw, rh, { chamfer: { radius: rh * 0.34 }, restitution: 0.25, friction: 0.4, frictionAir: 0.012, density: 0.0011, render: { visible: false } });
        const tone = kind === "cookieaccept" ? "#4ade80" : kind === "cookiereject" ? "#d64545" : "#ffd23e"; // green accept, red reject, matching the breed tags
        b.plugin = { name: label, label, half: Math.min(rw, rh) / 2, w: rw, h: rh, color: tone, kind, family: null, ping: 0 };
        return b;
      }
      // A single hamburger menu also rides in with the pour as an ordinary pit object:
      // square so the icon sits right, draggable and tumbling like the rest, and a tap
      // opens the site menu. Separate from the fixed top-right one (no menuFixed flag).
      function makeMenuObj(w: number) {
        const sz = BIG * 1.2;
        const x = sz / 2 + 24 + Math.random() * 40, y = -260 - Math.random() * 200; // drops in from the left edge
        const b: any = Bodies.rectangle(x, y, sz, sz, { chamfer: { radius: sz * 0.3 }, restitution: 0.25, friction: 0.4, frictionAir: 0.012, density: 0.0011, render: { visible: false } });
        b.plugin = { name: "Menu", label: "Menu", half: sz / 2, w: sz, h: sz, color: "#ffd23e", kind: "menu", family: null, ping: 0 };
        return b;
      }

      // entersite.svg and howtoplay.svg ride in as draggable panels. A tap on the
      // first jumps to the about page, a tap on the second opens the how-to-play
      // strip over the pit the way the family tree opens.
      const enterPanel = { key: "__entersite", label: "Enter site", src: "/entersite.svg", width: BIG * 3.0, aspect: 86.9 / 45.9, kind: "entersite" };
      // PC-logo-6th-hit collider: dumbbell shape traced from 595.3x356.5 viewBox
      // Left circle ~cx105,cy178,r105; right circle ~cx490,cy178,r105; bar ~cx297,cy178,w400,h120 at ~8deg
      // Pre-build logo dumbbell body (2 circles + bar) at init to avoid freeze on creation
      // VB: 595.3x356.5. Left circle cx105,cy178,r105; right cx490,cy178,r105; bar cx297,cy178,w400,h120 at 8deg
      const _lpo = { restitution: 0.45, friction: 0.3, density: 0.0009, render: { visible: false } };
      const _lW = BIG * 6.8, _lH = _lW / (150 / 64);
      const _lk = _lW / 595.3, _lcx = 595.3 / 2, _lcy = 356.5 / 2;
      const _lC = (vx: number, vy: number, r: number) => Bodies.circle((vx - _lcx) * _lk, (vy - _lcy) * _lk, r * _lk, _lpo);
      const _lR = (vx: number, vy: number, w: number, h: number, a = 0) => Bodies.rectangle((vx - _lcx) * _lk, (vy - _lcy) * _lk, w * _lk, h * _lk, { ..._lpo, angle: a });
      const _logoColliderBody: any = Body.create({ parts: [
        _lC(105, 178, 105),
        _lC(490, 178, 105),
        _lR(297, 178, 400, 120, 0.14),
      ], frictionAir: 0.012, render: { visible: false } });

      const makeLogoCollider = (x: number, y: number, bw: number, bh: number) => {
        Body.setPosition(_logoColliderBody, { x, y });
        Body.setVelocity(_logoColliderBody, { x: 0, y: 0 });
        Body.setAngularVelocity(_logoColliderBody, 0);
        return _logoColliderBody;
      };
      const howPanel = { key: "__howtoplay", label: "How to play", src: "/howtoplay.svg", width: BIG * 3.0, aspect: 134.8 / 74.5, kind: "howtoplay" };
      function makePanel(cfg: { key: string; label: string; src: string; width: number; aspect: number; kind: string }, w: number, side?: "left" | "right") {
        const bw = cfg.width, bh = cfg.width / cfg.aspect;
        const margin = bw / 2 + 24; // keep the whole panel on screen at the edge
        const x = side === "left" ? margin + Math.random() * 40
                : side === "right" ? w - margin - Math.random() * 40
                : 80 + Math.random() * (w - 160);
        const y = -280 - Math.random() * 220;
        const b: any = Bodies.rectangle(x, y, bw, bh, { chamfer: { radius: bh * 0.16 }, restitution: 0.3, friction: 0.4, frictionAir: 0.012, density: 0.0009, render: { visible: false } });
        b.plugin = { name: cfg.label, label: cfg.label, half: Math.min(bw, bh) / 2, w: bw, h: bh, color: "#ffffff", img: getImg(cfg.key, cfg.src), prop: "panel", kind: cfg.kind, family: null, ping: 0 };
        return b;
      }
      // Arrows: fired in from off-screen sides with spin, bounce off walls
      function makeArrow(w: number) {
        const ar = 704.2 / 720;
        const bw = BIG * 1.1, bh = bw / ar;
        const x = w + bw, y = -180 - Math.random() * 120;
        const b: any = Bodies.rectangle(x, y, bw, bh, {
          angle: 0.3, chamfer: { radius: bh * 0.12 }, restitution: 0.3,
          friction: 0.3, frictionAir: 0.008, density: 0.0008, render: { visible: false },
        });
        b.plugin = { name: "Green arrow", half: Math.min(bw, bh) / 2, w: bw, h: bh, color: "#ffffff", img: getImg("__arrow_green_pit", "/green-arrow-short.svg"), prop: "panel", kind: "arrow-green", family: null, ping: 0 };
        Body.setVelocity(b, { x: -(7 + Math.random() * 4), y: 2 + Math.random() * 3 });
        Body.setAngularVelocity(b, 0.18 + Math.random() * 0.14);
        return b;
      }
      // The cookie-policy object: an SVG that pours in with the rest, starts upside
      // down (180 degrees), opens the cookie notice on tap, and buzzes its neighbours
      // every 20 seconds. It is the site's main cookie message on the home page.
      let cookiesBody: any = null;
      let acceptBody: any = null; // the Accept button squeezed out of the cookie on tap
      let rejectBody: any = null; // the Reject button squeezed out alongside it
      function makeCookies(w: number) {
        const bw = BIG * 3.0, bh = bw; // square to start; reshaped to the art's ratio on load
        const x = 80 + Math.random() * (w - 160), y = -300 - Math.random() * 220;
        const b: any = Bodies.rectangle(x, y, bw, bh, { angle: Math.PI, chamfer: { radius: bh * 0.16 }, restitution: 0.3, friction: 0.4, frictionAir: 0.012, density: 0.0009, render: { visible: false } });
        const img = getImg("__cookies", "/cookies-policy.svg");
        b.plugin = { name: "Cookie policy", label: "Cookie policy", half: Math.min(bw, bh) / 2, w: bw, h: bh, color: "#ffffff", img, prop: "panel", kind: "cookies", family: null, ping: 0 };
        const fit = () => { const a = img.naturalWidth / img.naturalHeight, newH = bw / a; if (Math.abs(newH - b.plugin.h) > 1) { Body.scale(b, 1, newH / b.plugin.h); b.plugin.h = newH; b.plugin.half = Math.min(b.plugin.w, newH) / 2; } };
        if (img.complete && img.naturalWidth) fit(); else img.addEventListener("load", fit, { once: true });
        cookiesBody = b;
        return b;
      }
      let dropTimer: any = null;
      let waveTimers: any[] = [];
      let buzzTimer: any = null;
      const dropped = new Set<number>(); // every breed index ever spawned, including collected ones --
                                          // shared between dropAll's pair-drop and the refill check below
      function dropAll() {
        const ex = dyn();
        if (ex.length) Composite.remove(engine.world, ex);
        if (dropTimer) clearInterval(dropTimer);
        waveTimers.forEach(clearTimeout); waveTimers = [];
        const w = stage.clientWidth;
        // Pick one name randomly from a pair (alternates each load)
        const pickName = (a: string, b: string) => Math.random() < 0.5 ? a : b;
        // Drop a specific named breed card, mark it as dropped
        const dropCardNamed = (name: string, droppedSet: Set<number>) => {
          const idx = BREEDS.findIndex((br: any) => br.name === name);
          if (idx === -1 || droppedSet.has(idx)) return;
          droppedSet.add(idx);
          Composite.add(engine.world, makeBall(BREEDS[idx], idx, w));
        };
        const addProps = (list: any[]) => list.forEach((p) => Composite.add(engine.world, makeProp(p, w)));
        // tennis balls only; the pre-order button now drops on its own beat (desktop)
        const dropBalls = () => {
          BALLS.forEach((bp, i) => {
            Composite.add(engine.world, makeProp(bp, w));
            if (i === 0 && isMobile) Composite.add(engine.world, makeButton("preorder", "Pre-order", w)); // mobile keeps pre-order with the 1st ball
          });
        };
        // scripted desktop pour helpers
        // Simple pair drop -- 2 random dogs every 4 seconds
        const pairOrder = [...BREEDS.keys()].sort(() => Math.random() - 0.5);


        waveTimers.push(setTimeout(() => { if (!disposed) dropBalls(); }, 700));                                    // 0:00.7  tennis balls
        waveTimers.push(setTimeout(() => { if (!disposed) Composite.add(engine.world, makeCookies(w)); }, 2000));    // 0:02.0  cookies
        waveTimers.push(setTimeout(() => { if (!disposed) Composite.add(engine.world, makeButton("reserve", "Discount code", w)); }, 4000)); // 0:04.0  discount
        waveTimers.push(setTimeout(() => { if (!disposed) Composite.add(engine.world, makeButton("preorder", "Pre-order", w)); }, 6000));     // 0:06.0  pre-order

        // ── EASY PAIRS (pairs 1-6) ───────────────────────────────────────────
        // Pair logic: pick one randomly, loser joins reject pool for pool drops
        const easyPairs: [string,string][] = [
          ["Chihuahua","Labrador"],
          ["Pug","Border Collie"],
          ["Pomeranian","Maltese"],
          ["Dachshund","Cocker Spaniel"],
          ["Corgi","Saint Bernard"],
          ["Yorkshire Terrier","Poodle"],
        ];
        const easyRejects: string[] = [];
        easyPairs.forEach(([a,b]) => {
          const winner = Math.random() < 0.5 ? a : b;
          easyRejects.push(winner === a ? b : a);
        });
        // Shuffle rejects for pool drops
        for (let i = easyRejects.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [easyRejects[i], easyRejects[j]] = [easyRejects[j], easyRejects[i]];
        }

        waveTimers.push(setTimeout(() => { if (!disposed) dropCardNamed(easyPairs[0].find(n=>!easyRejects.includes(n))??easyPairs[0][0], dropped); }, 8000));   // 0:08.0  pair 1
        waveTimers.push(setTimeout(() => { if (!disposed) { Composite.add(engine.world, makePanel(howPanel, w, "right")); Composite.add(engine.world, makePanel(enterPanel, w, "left")); Composite.add(engine.world, makeArrow(w)); } }, 9000)); // 0:09.0  panels+arrow
        waveTimers.push(setTimeout(() => { if (!disposed) dropCardNamed(easyPairs[1].find(n=>!easyRejects.includes(n))??easyPairs[1][0], dropped); }, 11000));    // 0:11.0  pair 2
        waveTimers.push(setTimeout(() => { if (!disposed) dropCardNamed(easyPairs[2].find(n=>!easyRejects.includes(n))??easyPairs[2][0], dropped); }, 14000));    // 0:14.0  pair 3
        waveTimers.push(setTimeout(() => { if (!disposed) Composite.add(engine.world, makeMenuObj(w)); }, 16000));                                                 // 0:16.0  hamburger menu
        waveTimers.push(setTimeout(() => { if (!disposed) dropCardNamed(easyPairs[3].find(n=>!easyRejects.includes(n))??easyPairs[3][0], dropped); }, 18000));   // 0:18.0  pair 4
        waveTimers.push(setTimeout(() => { // 0:12.0 union jack
          if (!disposed) {
            const ujImg = getImg("__uk_icon", "/uk-icon.jpg");
            const ujR = BIG * 0.6;
            const ujB: any = Bodies.circle(w * 0.7, -ujR, ujR, { restitution: 0.5, friction: 0.3, frictionAir: 0.004, density: 0.006, render: { visible: false } });
            ujB.plugin = { name: "Made in Britain", kind: "unionjack", half: ujR, color: "#ffffff", img: ujImg, family: null, ping: 0, hits: 0, maxHits: 8, popped: false };
            Body.setVelocity(ujB, { x: (Math.random() - 0.5) * 3, y: 3 });
            Composite.add(engine.world, ujB);
          }
        }, 20000));
        waveTimers.push(setTimeout(() => { if (!disposed) dropCardNamed(easyPairs[4].find(n=>!easyRejects.includes(n))??easyPairs[4][0], dropped); }, 23000));   // 0:23.0  pair 5
        waveTimers.push(setTimeout(() => { if (!disposed) dropCardNamed(easyPairs[5].find(n=>!easyRejects.includes(n))??easyPairs[5][0], dropped); }, 27000));   // 0:27.0  pair 6
        waveTimers.push(setTimeout(() => { if (!disposed) addProps([slipper]); }, 31000));                                                                         // 0:31.0  slipper

        // ── POOL 1 (easy rejects, 3 drops of 2) ─────────────────────────────
        waveTimers.push(setTimeout(() => { if (!disposed) { dropCardNamed(easyRejects[0], dropped); dropCardNamed(easyRejects[1], dropped); } }, 35000));  // 0:35.0 pool1-A
        waveTimers.push(setTimeout(() => { if (!disposed) addProps([bone]); }, 40000));                                                                     // 0:40.0  bone
        waveTimers.push(setTimeout(() => { if (!disposed) { dropCardNamed(easyRejects[2], dropped); dropCardNamed(easyRejects[3], dropped); } }, 41000));  // 0:41.0 pool1-B
        waveTimers.push(setTimeout(() => { if (!disposed) { dropCardNamed(easyRejects[4], dropped); dropCardNamed(easyRejects[5], dropped); } }, 47000));  // 0:47.0 pool1-C

        // ── MEDIUM PAIRS (pairs 7-12) ────────────────────────────────────────
        const medPairs: [string,string][] = [
          ["French Bulldog","Golden Retriever"],
          ["Basset Hound","Beagle"],
          ["Cavapoo","Staffordshire Bull Terrier"],
          ["Great Dane","Cockapoo"],
          ["Boston Terrier","Bulldog"],
          ["West Highland Terrier","Cavachon"],
        ];
        const medRejects: string[] = [];
        medPairs.forEach(([a,b]) => {
          const winner = Math.random() < 0.5 ? a : b;
          medRejects.push(winner === a ? b : a);
        });
        for (let i = medRejects.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [medRejects[i], medRejects[j]] = [medRejects[j], medRejects[i]];
        }

        waveTimers.push(setTimeout(() => { if (!disposed) dropCardNamed(medPairs[0].find(n=>!medRejects.includes(n))??medPairs[0][0], dropped); }, 60000));   // 1:00.0  pair 7
        waveTimers.push(setTimeout(() => { if (!disposed) dropCardNamed(medPairs[1].find(n=>!medRejects.includes(n))??medPairs[1][0], dropped); }, 65000));   // 1:05.0  pair 8
        waveTimers.push(setTimeout(() => { if (!disposed) dropCardNamed(medPairs[2].find(n=>!medRejects.includes(n))??medPairs[2][0], dropped); }, 71000));   // 1:11.0  pair 9
        waveTimers.push(setTimeout(() => { if (!disposed) dropCardNamed(medPairs[3].find(n=>!medRejects.includes(n))??medPairs[3][0], dropped); }, 75000));   // 1:15.0  pair 10
        waveTimers.push(setTimeout(() => { if (!disposed) dropCardNamed(medPairs[4].find(n=>!medRejects.includes(n))??medPairs[4][0], dropped); }, 81000));   // 1:21.0  pair 11
        waveTimers.push(setTimeout(() => { if (!disposed) Composite.add(engine.world, makeProp(bowl, w)); }, 120000));  // 2:00.0  bowl
        waveTimers.push(setTimeout(() => { if (!disposed) dropCardNamed(medPairs[5].find(n=>!medRejects.includes(n))??medPairs[5][0], dropped); }, 86000));   // 1:26.0  pair 12

        // ── POOL 2 (medium rejects, 3 drops of 2) ───────────────────────────
        waveTimers.push(setTimeout(() => { if (!disposed) { dropCardNamed(medRejects[0], dropped); dropCardNamed(medRejects[1], dropped); } }, 92000));   // 1:32.0 pool2-A
        waveTimers.push(setTimeout(() => { if (!disposed) { dropCardNamed(medRejects[2], dropped); dropCardNamed(medRejects[3], dropped); } }, 98000));   // 1:38.0 pool2-B
        waveTimers.push(setTimeout(() => { if (!disposed) { dropCardNamed(medRejects[4], dropped); dropCardNamed(medRejects[5], dropped); } }, 104000));  // 1:44.0 pool2-C

        // ── HARD PAIRS (pairs 13-17) ─────────────────────────────────────────
        const hardPairs: [string,string][] = [
          ["Cockapoo","Shih Tzu"],
          ["Siberian Husky","Maltese"],
          ["Springer Spaniel","Rottweiler"],
          ["German Shepherd","Doberman Pinscher"],
          ["Irish Wolfhound","Labradoodle"],
        ];
        const hardRejects: string[] = [];
        hardPairs.forEach(([a,b]) => {
          const winner = Math.random() < 0.5 ? a : b;
          hardRejects.push(winner === a ? b : a);
        });
        for (let i = hardRejects.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [hardRejects[i], hardRejects[j]] = [hardRejects[j], hardRejects[i]];
        }

        waveTimers.push(setTimeout(() => { if (!disposed) dropCardNamed(hardPairs[0].find(n=>!hardRejects.includes(n))??hardPairs[0][0], dropped); }, 110000));  // 1:50.0  pair 13
        waveTimers.push(setTimeout(() => { if (!disposed) dropCardNamed(hardPairs[1].find(n=>!hardRejects.includes(n))??hardPairs[1][0], dropped); }, 116000));  // 1:56.0  pair 14
        waveTimers.push(setTimeout(() => { if (!disposed) dropCardNamed(hardPairs[2].find(n=>!hardRejects.includes(n))??hardPairs[2][0], dropped); }, 122000));  // 2:02.0  pair 15
        waveTimers.push(setTimeout(() => { if (!disposed) dropCardNamed(hardPairs[3].find(n=>!hardRejects.includes(n))??hardPairs[3][0], dropped); }, 128000));  // 2:08.0  pair 16
        waveTimers.push(setTimeout(() => { if (!disposed) dropCardNamed(hardPairs[4].find(n=>!hardRejects.includes(n))??hardPairs[4][0], dropped); }, 134000));  // 2:14.0  pair 17

        // ── POOL 3 (hard rejects, drops of 2/2/1) ───────────────────────────
        waveTimers.push(setTimeout(() => { if (!disposed) { dropCardNamed(hardRejects[0], dropped); dropCardNamed(hardRejects[1], dropped); } }, 140000));  // 2:20.0 pool3-A
        waveTimers.push(setTimeout(() => { if (!disposed) { dropCardNamed(hardRejects[2], dropped); dropCardNamed(hardRejects[3], dropped); } }, 146000));  // 2:26.0 pool3-B
        waveTimers.push(setTimeout(() => { if (!disposed) dropCardNamed(hardRejects[4], dropped); }, 152000));  // 2:32.0 pool3-C


        // pairOrder loop removed - replaced by tiered easy/medium/hard drop system above

        waveTimers.push(setTimeout(() => {
          if (!disposed) {
            // Only drop breeds never scheduled -- dropped set tracks everything ever queued
            BREEDS.forEach((b: any, idx: number) => {
              if (!dropped.has(idx)) {
                dropped.add(idx);
                waveTimers.push(setTimeout(() => {
                  if (!disposed) Composite.add(engine.world, makeBall(b, idx, w));
                }, Math.random() * 5000));
              }
            });
          }
        }, 180000));  // 3:00.0  remaining flood
      }
      const mouse = Mouse.create(render.canvas);
      const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, render: { visible: false } } });
      const LOCKED_CAT = 0x0004; // reserved category (unused since fuse mechanic removed)
      const FUSE_MAGNET_RADIUS = 40;
      const FUSE_SNAP_DIST = 12;
      const FUSE_PULL = 0.00005;
      const isBone = (b: any) => b?.plugin?.prop === "bone";
      const nearestBone = (to: any) => {
        let best: any = null, bestD = Infinity;
        for (const b of getBodies()) {
          if (!isBone(b)) continue;
          const dx = b.position.x - to.position.x, dy = b.position.y - to.position.y, d = Math.hypot(dx, dy);
          if (d < bestD) { bestD = d; best = b; }
        }
        return best;
      };
      const onFuseMagnet = () => {
        if (!logoBody || logoBody.isStatic) return;
        const held = mc.body;
        if (!held) return;
        let logo: any = null, bone: any = null;
        if (held === logoBody) { logo = logoBody; bone = nearestBone(logoBody); }
        else if (isBone(held)) { logo = logoBody; bone = held; }
        if (!logo || !bone) return;
        const other = held === logoBody ? bone : logo;
        const tx = held.position.x - other.position.x, ty = held.position.y - other.position.y;
        const dist = Math.hypot(tx, ty);
        if (dist > FUSE_MAGNET_RADIUS || dist < 1) return;
        const closeness = (FUSE_MAGNET_RADIUS - dist);
        const f = FUSE_PULL * closeness;
        Body.applyForce(other, other.position, { x: (tx / dist) * f * other.mass, y: (ty / dist) * f * other.mass });
        if (!fused && dist <= FUSE_SNAP_DIST) {
          fused = true;
          const jx = logo.position.x, jy = logo.position.y;
          Body.setPosition(bone, { x: jx, y: jy });
          Body.setVelocity(bone, { x: 0, y: 0 });
          Body.setAngularVelocity(bone, 0);
          const t0 = performance.now();
          const R = Math.max(logo.plugin?.half || 60, bone.plugin?.half || 60);
          for (let i = 0; i < 9; i++) {
            const a = (i / 9) * Math.PI * 2, r = (i === 0 ? 0 : R * (0.25 + Math.random() * 0.5));
            gooBlobs.push({ x: jx + Math.cos(a) * r, y: jy + Math.sin(a) * r, s: R * (0.5 + Math.random() * 0.5), born: t0 + i * 12, life: 620 });
          }
          numAt(jx, jy, 2000);
          Composite.remove(engine.world, logoBody);
          logoBody = null;
        }
      };
      // pill magnet: each breed name pill gently attracts its matching dog card
      const PILL_MAGNET_RADIUS = 200;
      const PILL_PULL = 0.00008;
      // Shared body cache -- refreshed once per tick, used by all beforeUpdate handlers
      let _cachedBodies: any[] = [];
      let _cacheTime = -1;
      const getBodies = () => {
        const t = engine.timing.timestamp;
        if (t !== _cacheTime) { _cachedBodies = Composite.allBodies(engine.world); _cacheTime = t; }
        return _cachedBodies;
      };

      Events.on(engine, "beforeUpdate", () => {
        const all = getBodies();
        const pills = all.filter((b: any) => b.plugin?.kind === "pill" && !b.plugin.gone);
        for (const pill of pills) {
          if (pill.plugin.stuck) continue; // already latched to its card, skip magnet
          const card = all.find((b: any) => !b.plugin?.kind && !b.plugin?.prop && !b.isStatic && b.plugin?.name === pill.plugin.name);
          if (!card) continue;
          const dx = card.position.x - pill.position.x;
          const dy = card.position.y - pill.position.y;
          const dist = Math.hypot(dx, dy);
          if (dist > PILL_MAGNET_RADIUS || dist < 1) continue;
          const closeness = PILL_MAGNET_RADIUS - dist;
          const f = PILL_PULL * closeness;
          Body.applyForce(pill, pill.position, { x: (dx / dist) * f, y: (dy / dist) * f });
        }
      });
      // pill-stick: when a breed-name pill touches its matching dog card, latch it on
      Events.on(engine, "collisionStart", (ev: any) => {
        for (const pair of ev.pairs) {
          const pill = pair.bodyA.plugin?.kind === "pill" ? pair.bodyA : pair.bodyB.plugin?.kind === "pill" ? pair.bodyB : null;
          if (!pill || pill.plugin.gone || pill.plugin.stuck) continue;
          const card = pill === pair.bodyA ? pair.bodyB : pair.bodyA;
          if (!card?.plugin || card.plugin.kind || card.plugin.prop || card.isStatic) continue;
          if (card.plugin.name !== pill.plugin.name) continue;
          // matching pair -- snap and latch
          pill.plugin.stuck = true;
          pill.plugin.chum = true; // treat as chum: survive bomb, no decay
          Body.setVelocity(pill, { x: 0, y: 0 });
          Body.setAngularVelocity(pill, 0);
          const constraint = Constraint.create({
            bodyA: card,
            bodyB: pill,
            pointA: { x: 0, y: -(card.plugin.half || 40) - (pill.plugin.half || 13) - 2 },
            pointB: { x: 0, y: 0 },
            length: 0,
            stiffness: 1,
            damping: 1,
            render: { visible: false },
          });
          Composite.add(engine.world, constraint);
          burstAt(pill.position.x, pill.position.y, 10);
          numAt(pill.position.x, pill.position.y, 50); // small bonus for the match
        }
      });
      // --------------------------------------------------------------------
      mc.collisionFilter.mask = 0xffffffff & ~0x0002 & ~LOCKED_CAT; // inert circles and locked bowl/bone cannot be grabbed
      let pressedBomb: any = null; // the bomb currently being pressed/held, for the click-vs-hold fuse
      Composite.add(engine.world, mc);
      render.mouse = mouse;
      // matter binds the wheel to the canvas and cancels it, which eats page
      // scroll when the cursor is over the pit. Unhook it; dragging is unaffected.
      mouse.element.removeEventListener("mousewheel", (mouse as any).mousewheel);
      mouse.element.removeEventListener("DOMMouseScroll", (mouse as any).mousewheel);

      // Tennis ball escape: if the user flings a ball out the top with upward velocity,
      // it's gone for good and scores 250 pts. Physics-ejected balls (no recent drag) return normally.
      const userThrownBalls = new Set<number>(); // body IDs of balls the user has thrown upward
      let lastDraggedBall: any = null;
      Events.on(mc, "enddrag", (ev: any) => {
        const b = ev.body;
        if (!b || b.plugin?.prop !== "ball") return;
        // only count it as thrown if released with meaningful upward velocity
        if (b.velocity.y < -4) lastDraggedBall = b;
        else lastDraggedBall = null;
      });
      Events.on(engine, "afterUpdate", () => {
        if (!lastDraggedBall) return;
        const b = lastDraggedBall;
        if (!getBodies().includes(b)) { lastDraggedBall = null; return; }
        // if still moving upward and exits top of canvas, remove permanently
        if (b.position.y < -b.plugin.half) {
          userThrownBalls.add(b.id);
          lastDraggedBall = null;
          poof(b.position.x, 0, b.plugin.half * 1.5);
          numAt(b.position.x, 20, 250);
          setScore((s) => s + 500);
          Composite.remove(engine.world, b);
        }
      });

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
        if (hit.plugin.prop) burstAt(hit.position.x, hit.position.y, Math.max(34, hit.plugin.half * 0.5)); // props get the pink starburst, like the % circles
        else hit.plugin.ping = performance.now();
      };
      let downAt: { x: number; y: number } | null = null;
      let lastStepTapTime = 0, lastStepTapId = -1; // double-tap tracking for step cards
      const onDown = (e: MouseEvent) => { const p = localPoint(e); downAt = p; pressPct(p); };
      // a consent choice clears every cookie object from the pit (the policy SVGs and both buttons)
      const clearCookieObjects = (keepReject = false) => {
        for (const b of Composite.allBodies(engine.world)) {
          if (b.plugin?.kind === "cookies") { poof(b.position.x, b.position.y, b.plugin.half || 40); Composite.remove(engine.world, b); }
        }
        cookiesBody = null;
        if (acceptBody) { Composite.remove(engine.world, acceptBody); acceptBody = null; }
        if (rejectBody) {
          if (keepReject) {
            // leave reject in pit as a small inert object, gone on first hit
            rejectBody.plugin.inert = true;
            rejectBody.plugin.hits = 0;
            rejectBody.plugin.maxHits = 1;
            rejectBody.plugin.kind = "cookiereject-inert";
            // shrink it down to a small puck
            Body.scale(rejectBody, 0.35, 0.35);
            rejectBody.plugin.w *= 0.35; rejectBody.plugin.h *= 0.35; rejectBody.plugin.half *= 0.35;
            rejectBody = null; // stop tracking -- it will poof naturally on hits
          } else {
            Composite.remove(engine.world, rejectBody); rejectBody = null;
          }
        }
      };
      const tapButton = (pt: { x: number; y: number }) => {
        if (menuBody && menuBody.isStatic && Query.point([menuBody], pt).length) { window.dispatchEvent(new Event("pc:open-menu")); return true; } // tap the fixed menu before it dislodges
        const hit = Query.point(dyn(), pt)[0];
        if (!hit) return false;
        if (hit.plugin?.kind === "menu") { window.dispatchEvent(new Event("pc:open-menu")); return true; }
        if (hit.plugin?.kind === "reserve") { if (!hit.plugin.scored) { hit.plugin.scored = true; const rv = preorderReward(score); numAt(hit.position.x, hit.position.y, rv); } window.dispatchEvent(new Event("pc:open-offer")); return true; }
        if (hit.plugin?.kind === "cookies") {
          window.dispatchEvent(new Event("pc:open-cookies"));
          hit.plugin.inert = true; // the tapped cookie settles and stops buzzing
          if (!acceptBody && cookiesBody) { // squeeze an Accept and a Reject button out of the cookie
            const cx = cookiesBody.position.x, cy = cookiesBody.position.y, now0 = performance.now();
            // Reject is added first so the Accept button, added last, renders in front of it
            const rb: any = makeButton("cookiereject", "Reject", stage.clientWidth);
            Body.setPosition(rb, { x: cx, y: cy });
            Body.setVelocity(rb, { x: 2 + Math.random() * 4, y: -9 }); // pops up and to the right
            Body.setAngularVelocity(rb, (Math.random() - 0.5) * 0.4);
            rejectBody = rb;
            Composite.add(engine.world, rb);
            const ab: any = makeButton("cookieaccept", "Accept", stage.clientWidth);
            Body.setPosition(ab, { x: cx, y: cy });
            Body.setVelocity(ab, { x: -2 - Math.random() * 4, y: -9 });
            Body.setAngularVelocity(ab, (Math.random() - 0.5) * 0.4);
            ab.plugin.bornAt = now0; ab.plugin.lastOne = 0;
            acceptBody = ab;
            Composite.add(engine.world, ab);
          }
          return true;
        }
if (hit.plugin?.kind === "cookieaccept") { cookieBannerOpenRef.current = false;
          window.dispatchEvent(new Event("pc:cookies-accepted"));
          const ax = hit.position.x, ay = hit.position.y, asz = (hit.plugin.half || 40) * 1.7, bt = performance.now();
          bursts.push({ x: ax, y: ay, s: asz, born: bt, life: 480, colour: "#ff2d78", rot: 0 });
          bursts.push({ x: ax, y: ay, s: asz * 0.66, born: bt, life: 480, colour: "#ffd23e", rot: 18 });
          numAt(ax, ay, 2000);
          Composite.remove(engine.world, hit); acceptBody = null;
          clearCookieObjects(true);
          return true;
        }
        if (hit.plugin?.kind === "cookiereject") { cookieBannerOpenRef.current = false;
          window.dispatchEvent(new Event("pc:cookies-rejected"));
          const rx = hit.position.x, ry = hit.position.y, rsz = (hit.plugin.half || 40) * 1.6, bt = performance.now();
          bursts.push({ x: rx, y: ry, s: rsz, born: bt, life: 460, colour: "#0c5b92", rot: 0 });
          bursts.push({ x: rx, y: ry, s: rsz * 0.66, born: bt, life: 460, colour: "#9a9a9a", rot: 18 });
          clearCookieObjects();
          return true;
        }
        if (hit.plugin?.kind === "rod" || hit.plugin?.kind === "pill") {
          const p = hit.plugin;
          if (!p.gone) {
            p.hits = (p.hits || 0) + 1;
            if (p.hits >= (p.maxHits || 3) && !p.chum && !p.stuck) { p.gone = true; poof(hit.position.x, hit.position.y, p.half || 12); Composite.remove(engine.world, hit); } // a chum pill or a stuck pill never expires
          }
          return true;
        }
        if (hit.plugin?.kind === "unionjack" && !hit.plugin.popped) {
          hit.plugin.hits = (hit.plugin.hits || 0) + 1;
          numAt(hit.position.x, hit.position.y, 200);
          burstAt(hit.position.x, hit.position.y, hit.plugin.half * 0.8);
          // any tap opens the popup; the green tick button closes it and poofs the flag
          showBritainMsg(0);
          return true;
        }
        if (hit.plugin?.kind === "preorder") { startCheckout().catch(() => window.dispatchEvent(new Event("pc:open-offer"))); return true; }
        if (hit.plugin?.kind === "entersite") {
            try {
              sessionStorage.setItem("pc-gameover-score", String(scoreRef.current));
              sessionStorage.setItem("pc-gameover-chums", String(collectedRef.current));
              const breedImgMap = Object.fromEntries(breeds.map((b: any) => [b.name, breedCard[b.slug] || b.image || ""]));
              sessionStorage.setItem("pc-gameover-breeds", JSON.stringify(collectedChumsRef.current.map((n: string) => ({ name: n, img: breedImgMap[n] || "" }))));
            } catch {}
            window.location.href = "/about?gameover=1"; return true; }
        if (hit.plugin?.kind === "howtoplay") { if (!hit.plugin.scored) { hit.plugin.scored = true; numAt(hit.position.x, hit.position.y, 2000); } window.dispatchEvent(new Event("pc:open-howtoplay")); return true; }
        if (hit.plugin?.prop === "logopiece" && !hit.plugin.knockPiece) {
          // HTP step cards tapped in the pit -- open in sequential order only
          const HTP_NAMES = ["Deal the cards","Head outside","Spot real dogs","Match to your chum","Find more chums","Most chums wins"];
          const stepIdx = HTP_NAMES.indexOf(hit.plugin.name);
          if (stepIdx !== -1) {
            // If already zoomed, dismiss it
            if (hit.plugin.zoomed) {
              // Already zoomed -- check if they tapped the "Got it" button
              const btn = hit.plugin.zoomBtnBounds;
              if (btn && Math.abs(pt.x - btn.cx) < btn.w / 2 && Math.abs(pt.y - btn.cy) < btn.h / 2) {
                // "Got it!" tapped -- collect this step card same as a dog card
                hit.plugin.zoomed = false;
                hit.plugin.opened = true;
                const rect = render.canvas.getBoundingClientRect();
                hit.plugin.pop = performance.now();
                hit.plugin.flyFrom = { x: hit.position.x, y: hit.position.y };
                hit.plugin.flyTo = { x: 60 - rect.left, y: window.innerHeight - 60 - rect.top };
                hit.plugin.flyA0 = hit.angle;
                hit.plugin.flySpin = (Math.random() < 0.5 ? -1 : 1) * Math.PI * 1.2;
                hit.isSensor = true;
                numAt(hit.position.x, hit.position.y, 500);
                burstAt(hit.position.x, hit.position.y, Math.max(40, hit.plugin.half));
              }
              // Tapped the card but not the button -- do nothing (keep it open)
              return true;
            }
            // Dismiss any other zoomed step card first
            dyn().forEach((b: any) => { if (b.plugin?.kind === "stepcard" && b.plugin?.zoomed) b.plugin.zoomed = false; });
            // Single tap opens -- same as dogs
            hit.plugin.zoomed = true;
            hit.plugin.opened = true;
            hit.plugin.zoomedAt = performance.now();
            hit.plugin.zoomedFrom = { x: hit.position.x, y: hit.position.y };
            return true;
          }
        }
        return false;
      };
      // little white numbers that flash up on a hit or tap (% circles, cards, buttons)
      const numbers: any[] = [];
      const numAt = (x: number, y: number, val: number, size = 15, score = true, col?: string) => { numbers.push({ x, y, val, born: performance.now(), life: 650, size, col }); if (score && !gameOverRef.current) setScore((s) => s + val); };
      // the shake button flashes 75 from its own position and adds it to the running total
      flashShakeRef.current = () => {
        const btn = shakeBtnRef.current; if (!btn) return;
        const cr = render.canvas.getBoundingClientRect(), br = btn.getBoundingClientRect();
        numAt(br.left + br.width / 2 - cr.left, br.top + br.height / 2 - cr.top, 5);
      };
      const openLineageAt = (up: { x: number; y: number }) => {
        const hit = Query.point(dyn(), up)[0];
        if (!hit || hit.plugin.prop || hit.plugin.kind === "pct" || hit.plugin.kind === "reserve" || hit.plugin.kind === "preorder" || hit.plugin.kind === "menu" || hit.plugin.kind === "cookieaccept" || hit.plugin.kind === "cookiereject" || hit.plugin.kind === "rod" || hit.plugin.kind === "pill") return false; // dogs only, not the toys, fallen circles or the buttons
        if (hit.plugin.pop) return false; // already flying away -- don't re-open
        if (!hit.plugin.prop && hit.plugin.kind !== "pct" && hit.plugin.kind !== "reserve" && hit.plugin.kind !== "preorder" && hit.plugin.kind !== "menu" && hit.plugin.kind !== "cookieaccept" && hit.plugin.kind !== "cookiereject" && hit.plugin.kind !== "rod" && hit.plugin.kind !== "pill" && !hit.plugin.collected) {
          hit.plugin.collected = true;                                              // only the first collect of a card scores
          numAt(hit.position.x, hit.position.y, 100);                               // first collect scores 100
          burstAt(hit.position.x, hit.position.y, Math.max(40, hit.plugin.half));   // pink starburst on first collect
        }
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
        // Dismiss zoomed step card on tap anywhere outside it
        const anyZoomed = dyn().find((b: any) => b.plugin?.kind === "stepcard" && b.plugin?.zoomed);
        if (anyZoomed) {
          const hitZoomed = Query.point(dyn(), up).find((b: any) => b.plugin?.kind === "stepcard" && b.plugin?.zoomed);
          if (!hitZoomed) { anyZoomed.plugin.zoomed = false; return; }
        }
        if (tapButton(up)) return;
        openLineageAt(up);
      };
      // Touch: Matter's drag constraint swallows the synthesised click, so taps
      // are handled directly here.
      let touchDown: { x: number; y: number } | null = null;
      const touchLocal = (t: Touch) => { const r = render.canvas.getBoundingClientRect(); return { x: t.clientX - r.left, y: t.clientY - r.top }; };
      const onTouchStart = (e: TouchEvent) => { motionRef.current(); if (e.touches.length === 1) { touchDown = touchLocal(e.touches[0]); pressPct(touchDown); } };
      const onTouchEnd = (e: TouchEvent) => {
        const start = touchDown; touchDown = null;
        releaseHeldPct();
        if (!start || e.changedTouches.length !== 1) return;
        const up = touchLocal(e.changedTouches[0]);
        if (Math.hypot(up.x - start.x, up.y - start.y) > 10) return; // a drag, not a tap
        // Dismiss zoomed step card on tap outside it (touch)
        const anyZoomedT = dyn().find((b: any) => b.plugin?.kind === "stepcard" && b.plugin?.zoomed);
        if (anyZoomedT) {
          const hitZoomedT = Query.point(dyn(), up).find((b: any) => b.plugin?.kind === "stepcard" && b.plugin?.zoomed);
          if (!hitZoomedT) { anyZoomedT.plugin.zoomed = false; e.preventDefault(); return; }
        }
        if (tapButton(up)) { e.preventDefault(); return; }
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
        if (b.plugin.pop) {
          const k = b.plugin.popScale ?? 1;
          ctx.scale(k, k);
          ctx.globalAlpha = alpha * (b.plugin.popAlpha ?? 1);
        }
        if (b.plugin.kind === "rod") {
          const w = b.plugin.w, h = b.plugin.h;
          rrect(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fillStyle = b.plugin.color; ctx.fill();
          ctx.restore(); return;
        }
        if (b.plugin.kind === "pill") {
          const w = b.plugin.w, h = b.plugin.h;
          rrect(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fillStyle = "#0a3a57"; ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,0.85)"; rrect(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.stroke();
          ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          let fs = 12; ctx.font = `700 ${fs}px Montserrat, system-ui, sans-serif`;
          const maxw = w * 0.86, tw = ctx.measureText(b.plugin.label).width;
          if (tw > maxw) { fs = Math.max(7, Math.floor((fs * maxw) / tw)); ctx.font = `700 ${fs}px Montserrat, system-ui, sans-serif`; }
          ctx.fillText(b.plugin.label, 0, 1);
          ctx.restore(); return;
        }
        if (b.plugin.kind === "pct") {
          ctx.rotate(-b.angle); // keep the % upright and the hop vertical regardless of spin
          const rr = b.plugin.half, now2 = performance.now();
          if (b.plugin.jump) {
            const jt = (now2 - b.plugin.jump) / 300;
            if (jt < 1) ctx.translate(0, -Math.sin(jt * Math.PI) * 14 * (1 - jt)); else b.plugin.jump = 0;
          }
          if (b.plugin.bomb) {
            const hh = b.plugin.hits || 0;
            const held = b.plugin.heldSince && !b.plugin.popped ? Math.min(1, (now2 - b.plugin.heldSince) / 5000) : 0;
            const inten = Math.max(hh, held * 5); // a held bomb ramps smoothly 0..5 over its five-second fuse; clicks step it by whole hits
            if (inten > 0 && !b.plugin.bursting) { // it rattles harder the longer it is held, furious by the fifth second
              const amp = 0.06 * inten, sp = Math.max(6, 28 - inten * 5);
              ctx.rotate(Math.sin(now2 / sp) * amp);
              ctx.translate(Math.sin(now2 / (sp * 0.6)) * inten * 0.95, 0);
            }
            if (b.plugin.bursting) {
              const bt = (now2 - b.plugin.bursting) / 180; // quick squash then ~20% overshoot, then detonateBomb removes it
              const bsc = bt < 0.35 ? 1 - 0.1 * (bt / 0.35) : 0.9 + 0.3 * Math.min(1, (bt - 0.35) / 0.65);
              ctx.scale(bsc, bsc);
            }
            const bi = b.plugin.bombImg;
            if (bi && bi.complete && bi.naturalWidth) {
              const ar = bi.naturalWidth / bi.naturalHeight, box = rr * 2.4;
              const bw = ar >= 1 ? box : box * ar, bh = ar >= 1 ? box / ar : box;
              ctx.drawImage(bi, -bw / 2, -bh / 2, bw, bh);
            } else {
              ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.fillStyle = "#111111"; ctx.fill();
              ctx.lineWidth = 3; ctx.strokeStyle = "#000000"; ctx.stroke();
              // Draw a fuse so it reads as bomb even without SVG
              ctx.beginPath(); ctx.moveTo(0, -rr); ctx.lineTo(rr * 0.3, -rr * 1.4); ctx.strokeStyle = "#888888"; ctx.lineWidth = 2; ctx.stroke();
            }
            ctx.restore(); return;
          }
          ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2);
          ctx.fillStyle = b.plugin.inert ? "#0c5b92" : "#ffd23e"; ctx.fill();
          ctx.lineWidth = 3; ctx.strokeStyle = "#0a3a57"; ctx.stroke();
          if (!b.plugin.inert) {
            ctx.fillStyle = "#0a3a57"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.font = `800 ${Math.max(12, rr * 0.7)}px Montserrat, system-ui, sans-serif`;
            const jx = b.plugin.repelOn ? (Math.random() - 0.5) * 3.2 : 0;
            const jy = b.plugin.repelOn ? (Math.random() - 0.5) * 3.2 : 0;
            ctx.fillText(b.plugin.share + "%", jx, jy);
          }
          if (b.plugin.repelOn) {
            const pulse = 1 + 0.18 * Math.sin(now2 / 90);
            ctx.globalAlpha = 0.5; ctx.lineWidth = 3; ctx.strokeStyle = "#1497d6";
            ctx.beginPath(); ctx.arc(0, 0, rr * 1.28 * pulse, 0, Math.PI * 2); ctx.stroke();
          }
          ctx.restore(); return;
        }
        if (b.plugin.kind === "unionjack") {
          const rr = b.plugin.half;
          ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff"; ctx.fill();
          const ujImg = b.plugin.img;
          if (ujImg && ujImg.complete && ujImg.naturalWidth) {
            ctx.save();
            ctx.beginPath(); ctx.arc(0, 0, rr - 2, 0, Math.PI * 2); ctx.clip();
            ctx.drawImage(ujImg, -rr, -rr, rr * 2, rr * 2);
            ctx.restore();
          }
          ctx.restore(); return;
        }
        if (b.plugin.kind === "unionjack") {
          const rr = b.plugin.half;
          ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff"; ctx.fill();
          const ujImg = b.plugin.img;
          if (ujImg && ujImg.complete && ujImg.naturalWidth) {
            ctx.save();
            ctx.beginPath(); ctx.arc(0, 0, rr - 2, 0, Math.PI * 2); ctx.clip();
            ctx.drawImage(ujImg, -rr, -rr, rr * 2, rr * 2);
            ctx.restore();
          }
          ctx.restore(); return;
        }
        if (b.plugin.kind === "menu") {
          const sz = b.plugin.w, rad = sz * 0.3;
          if (hovered) { ctx.shadowColor = "rgba(10,58,87,0.4)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3; }
          rrect(ctx, -sz / 2, -sz / 2, sz, sz, rad); ctx.fillStyle = b.plugin.color; ctx.fill();
          ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
          rrect(ctx, -sz / 2, -sz / 2, sz, sz, rad); ctx.lineWidth = 5; ctx.strokeStyle = hovered ? "rgba(10,58,87,0.55)" : "#0a3a57"; ctx.stroke();
          const barW = sz * 0.5, barH = Math.max(4, sz * 0.1), gap = sz * 0.22;
          ctx.fillStyle = "#0a3a57";
          for (let i = -1; i <= 1; i++) { rrect(ctx, -barW / 2, i * gap - barH / 2, barW, barH, barH / 2); ctx.fill(); }
          ctx.restore(); return;
        }
        if (b.plugin.kind === "reserve" || b.plugin.kind === "preorder" || b.plugin.kind === "cookieaccept" || b.plugin.kind === "cookiereject") {
          const rw = b.plugin.w, rh = b.plugin.h, rad = rh * 0.34;
          if (hovered) { ctx.shadowColor = "rgba(10,58,87,0.4)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3; }
          rrect(ctx, -rw / 2, -rh / 2, rw, rh, rad); ctx.fillStyle = b.plugin.color; ctx.fill();
          ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
          rrect(ctx, -rw / 2, -rh / 2, rw, rh, rad); ctx.lineWidth = 5; ctx.strokeStyle = hovered ? "rgba(10,58,87,0.55)" : "#0a3a57"; ctx.stroke();
          ctx.fillStyle = b.plugin.kind === "cookiereject" ? "#ffffff" : "#0a3a57"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          let fs = Math.round(rh * 0.5);
          ctx.font = `${fs}px "Luckiest Guy", system-ui, sans-serif`;
          const maxw = rw * 0.84, tw = ctx.measureText(b.plugin.label).width;
          if (tw > maxw) { fs = Math.max(8, Math.floor((fs * maxw) / tw)); ctx.font = `${fs}px "Luckiest Guy", system-ui, sans-serif`; }
          ctx.fillText(b.plugin.label, 0, rh * 0.05);
          ctx.restore(); return;
        }
        if (b.plugin.prop) {
          // shaped colliders sit off-centre from the art box, so nudge the image
          // back over the silhouette (defaults to 0 for the simple shapes)
          ctx.translate(b.plugin.ox || 0, b.plugin.oy || 0);
          const pw = b.plugin.w, ph = b.plugin.h;
          // Instructions card: same visual style as HowToPlay step cards in pit
          if (b.plugin.isInstructions) {
            const BORDER = Math.round(pw * 0.03), FOOTER = Math.round(ph * 0.18), RADIUS = pw * 0.1;
            rrect(ctx, -pw / 2, -ph / 2, pw, ph, RADIUS);
            ctx.fillStyle = (hovered && !b.plugin.isInstructions) ? "#3cb24a" : "#ffed00";
            ctx.fill();
            const illoH = ph - FOOTER - BORDER * 2, illoW = pw - BORDER * 2;
            if (img && img.complete && img.naturalWidth) {
              const imgAr = img.naturalWidth / img.naturalHeight, illoAr = illoW / illoH;
              const sliceW = imgAr > illoAr ? illoH * imgAr : illoW;
              const sliceH = imgAr > illoAr ? illoH : illoW / imgAr;
              rrect(ctx, -pw / 2 + BORDER, -ph / 2 + BORDER, illoW, illoH, RADIUS * 0.7);
              ctx.save(); ctx.clip();
              ctx.drawImage(img, -pw / 2 + BORDER - (sliceW - illoW) / 2, -ph / 2 + BORDER - (sliceH - illoH) / 2, sliceW, sliceH);
              ctx.restore();
            }
            const caption = b.plugin.label || b.plugin.name;
            const maxFontSize = Math.max(10, Math.round(FOOTER * 0.35));
            ctx.fillStyle = "#0a3a57"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.font = `400 ${maxFontSize}px "Luckiest Guy", system-ui, sans-serif`;
            const maxTw = pw * 0.86, tw = ctx.measureText(caption).width;
            let fs = maxFontSize;
            if (tw > maxTw) { fs = Math.max(6, Math.floor(maxFontSize * maxTw / tw)); ctx.font = `400 ${fs}px "Luckiest Guy", system-ui, sans-serif`; }
            const words = caption.split(" "); let line1 = "", line2 = "";
            for (const w2 of words) {
              if (ctx.measureText(line1 + " " + w2).width < maxTw) line1 = (line1 ? line1 + " " : "") + w2;
              else line2 = (line2 ? line2 + " " : "") + w2;
            }
            const footerY = ph / 2 - FOOTER / 2;
            if (line2) { ctx.fillText(line1, 0, footerY - fs * 0.6); ctx.fillText(line2, 0, footerY + fs * 0.6); }
            else ctx.fillText(line1, 0, footerY);
            ctx.restore(); return;
          }
          if (hovered && b.plugin.prop !== "logopiece") { ctx.shadowColor = "rgba(10,58,87,0.4)"; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2; }
          if (img && img.complete && (img.naturalWidth || b.plugin.prop === "logopiece")) {
            // Logo fades in over 600ms
            if (b.plugin.logoFading) {
              const elapsed = performance.now() - (b.plugin.popStart || 0);
              b.plugin.popAlpha = Math.min(1, elapsed / 600);
              if (b.plugin.popAlpha >= 1) b.plugin.logoFading = false;
              ctx.globalAlpha *= b.plugin.popAlpha;
            }
            const iw = img.naturalWidth || pw, ih = img.naturalHeight || ph;
            const ir = iw / ih, br = pw / ph;
            const dw = ir > br ? pw : ph * ir, dh = ir > br ? pw / ir : ph;
            const dox = b.plugin.ox || 0, doy = b.plugin.oy || 0;

            // Blue circle from HTP overlay -- draw as filled circle with image
            if (b.plugin.kind === "htpcircle") {
              const r = b.plugin.half;
              ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
              ctx.fillStyle = "#009fe0"; ctx.fill();
              ctx.lineWidth = Math.max(2, r * 0.08);
              ctx.strokeStyle = "#0a3a57"; ctx.stroke();
              if (img && img.complete && img.naturalWidth) {
                ctx.drawImage(img, -r * 0.7, -r * 0.7, r * 1.4, r * 1.4);
              }
              ctx.restore(); return;
            }

            // Yellow number from HTP overlay
            if (b.plugin.kind === "htplogopiece") {
              if (img && img.naturalWidth && img.naturalHeight) {
                const ar = img.naturalWidth / img.naturalHeight;
                // Draw at natural aspect ratio centred on body
                const drawW = Math.max(pw, ph * ar);
                const drawH = drawW / ar;
                ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
              } else if (img) {
                ctx.drawImage(img, -pw / 2, -ph / 2, pw, ph);
              }
              ctx.restore(); return;
            }
            if (b.plugin.kind === "htpnumber") {
              const r = b.plugin.half;
              if (img && img.complete && img.naturalWidth) {
                // Preserve natural aspect ratio -- number SVGs are tall portrait
                const ar = img.naturalWidth / img.naturalHeight;
                const dw = ar >= 1 ? r * 2 : r * 2 * ar;
                const dh = ar >= 1 ? r * 2 / ar : r * 2;
                ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
              } else {
                ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.fillStyle = "#ffed00"; ctx.fill();
              }
              ctx.restore(); return;
            }

            // Step card: draw in place, zoom to centre when tapped (like dog cards)
            if (b.plugin.kind === "stepcard") {
              // Advance cycle for step 5
              if (b.plugin.cycleImgs) {
                const now5 = performance.now();
                if (now5 > b.plugin.cycleAt) {
                  b.plugin.cycleIdx = (b.plugin.cycleIdx + 1) % b.plugin.cycleImgs.length;
                  b.plugin.img = b.plugin.cycleImgs[b.plugin.cycleIdx];
                  b.plugin.cycleAt = now5 + 3000;
                }
              }

              if (b.plugin.zoomed) {
                // ── Zoomed state: fly from pit position to screen centre ──────
                ctx.restore();
                ctx.save();
                const CX = render.canvas.width / 2, CY = render.canvas.height / 2;
                const ZW = Math.min(render.canvas.width * 0.55, 300);
                const ZH = ZW / (b.plugin.w / b.plugin.h);
                const ZBORDER = Math.round(ZW * 0.04);
                const ZFOOTER = Math.round(ZH * 0.16);
                const ZRADIUS = ZW * 0.07;
                // Animate from pit position to screen centre over 350ms
                const ANIM_DUR = 350;
                const rawT = b.plugin.zoomedAt ? Math.min(1, (performance.now() - b.plugin.zoomedAt) / ANIM_DUR) : 1;
                // Ease out cubic: fast start, gentle landing
                const easedT = 1 - Math.pow(1 - rawT, 3);
                const fromX = b.plugin.zoomedFrom?.x ?? CX;
                const fromY = b.plugin.zoomedFrom?.y ?? CY;
                const destX = CX, destY = CY - ZH * 0.15;
                const drawX = fromX + (destX - fromX) * easedT;
                const drawY = fromY + (destY - fromY) * easedT;
                // Also scale from 1× (pit size) to full zoom size
                const fromScale = b.plugin.w / ZW;
                const scale = fromScale + (1 - fromScale) * easedT;
                ctx.translate(drawX, drawY);
                ctx.scale(scale, scale);

                // Drop shadow
                ctx.shadowColor = "rgba(0,0,0,0.55)";
                ctx.shadowBlur = 32;
                ctx.shadowOffsetY = 6;

                // Card body
                rrect(ctx, -ZW / 2, -ZH / 2, ZW, ZH, ZRADIUS);
                ctx.fillStyle = "#ffed00"; ctx.fill();
                ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

                // Image
                const zIlloH = ZH - ZFOOTER - ZBORDER * 2;
                const zIlloW = ZW - ZBORDER * 2;
                if (img && img.complete && img.naturalWidth) {
                  const iar = img.naturalWidth / img.naturalHeight, iar2 = zIlloW / zIlloH;
                  const sw = iar > iar2 ? zIlloH * iar : zIlloW, sh = iar > iar2 ? zIlloH : zIlloW / iar;
                  rrect(ctx, -ZW / 2 + ZBORDER, -ZH / 2 + ZBORDER, zIlloW, zIlloH, ZRADIUS * 0.7);
                  ctx.save(); ctx.clip();
                  ctx.drawImage(img, -ZW / 2 + ZBORDER - (sw - zIlloW) / 2, -ZH / 2 + ZBORDER - (sh - zIlloH) / 2, sw, sh);
                  ctx.restore();
                }

                // Caption
                ctx.fillStyle = "#0a3a57"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
                const zfs = Math.max(12, Math.round(ZFOOTER * 0.38));
                ctx.font = `600 ${zfs}px "Luckiest Guy", system-ui, sans-serif`;
                ctx.fillText(b.plugin.name || "", 0, ZH / 2 - ZFOOTER / 2);

                // Numbered badge
                const zbR = Math.max(14, ZW * 0.09);
                ctx.beginPath(); ctx.arc(-ZW / 2 + zbR * 0.7, -ZH / 2 + zbR * 0.7, zbR, 0, Math.PI * 2);
                ctx.fillStyle = "#1497d6"; ctx.fill();
                ctx.lineWidth = 2; ctx.strokeStyle = "#0a3a57"; ctx.stroke();
                ctx.fillStyle = "#ffed00"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
                ctx.font = `900 ${Math.round(zbR * 0.85)}px "Luckiest Guy", system-ui, sans-serif`;
                ctx.fillText(String(b.plugin.seq || ""), -ZW / 2 + zbR * 0.7, -ZH / 2 + zbR * 0.7 + Math.round(zbR * 0.05));

                // "Got it!" collect button -- same green as the Collect button on dog cards
                const btnW = ZW * 0.72, btnH = 44, btnY = ZH / 2 + 18;
                const btnRadius = btnH / 2;
                // Only register button hit area once animation is complete
                if (rawT >= 1) b.plugin.zoomBtnBounds = { cx: CX, cy: CY - ZH * 0.15 + btnY * scale, w: btnW, h: btnH };
                // Button shadow
                ctx.shadowColor = "rgba(10,58,87,0.4)";
                ctx.shadowBlur = 8; ctx.shadowOffsetY = 4;
                rrect(ctx, -btnW / 2, btnY - btnH / 2, btnW, btnH, btnRadius);
                ctx.fillStyle = "#3cb24a"; ctx.fill();
                ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
                ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
                ctx.font = `700 16px "Luckiest Guy", system-ui, sans-serif`;
                ctx.fillText("GOT IT!", 0, btnY);

                ctx.restore();
                return;
              }

              // ── Normal (small) state ───────────────────────────────────────
              const BORDER = Math.round(pw * 0.03), FOOTER = Math.round(ph * 0.18), RADIUS = pw * 0.1;
              rrect(ctx, -pw / 2, -ph / 2, pw, ph, RADIUS);
              ctx.fillStyle = (hovered && !b.plugin.isInstructions) ? "#3cb24a" : "#ffed00";
              ctx.fill();

              // Image
              const illoH = ph - FOOTER - BORDER * 2, illoW = pw - BORDER * 2;
              if (img && img.complete && img.naturalWidth) {
                const imgAr = img.naturalWidth / img.naturalHeight, illoAr = illoW / illoH;
                const sliceW = imgAr > illoAr ? illoH * imgAr : illoW;
                const sliceH = imgAr > illoAr ? illoH : illoW / imgAr;
                rrect(ctx, -pw / 2 + BORDER, -ph / 2 + BORDER, illoW, illoH, RADIUS * 0.7);
                ctx.save(); ctx.clip();
                ctx.drawImage(img, -pw / 2 + BORDER - (sliceW - illoW) / 2, -ph / 2 + BORDER - (sliceH - illoH) / 2, sliceW, sliceH);
                ctx.restore();
              }

              // Caption
              const caption = b.plugin.name || "";
              const maxFontSize = Math.max(10, Math.round(FOOTER * 0.35));
              ctx.fillStyle = "#0a3a57"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
              ctx.font = `400 ${maxFontSize}px "Luckiest Guy", system-ui, sans-serif`;
              const maxTw = pw * 0.86, tw = ctx.measureText(caption).width;
              let fs = maxFontSize;
              if (tw > maxTw) { fs = Math.max(6, Math.floor(maxFontSize * maxTw / tw)); ctx.font = `400 ${fs}px "Luckiest Guy", system-ui, sans-serif`; }
              const words = caption.split(" "); let line1 = "", line2 = "";
              for (const w2 of words) {
                if (ctx.measureText(line1 + " " + w2).width < maxTw) line1 = (line1 ? line1 + " " : "") + w2;
                else line2 = (line2 ? line2 + " " : "") + w2;
              }
              const footerY = ph / 2 - FOOTER / 2;
              if (line2) { ctx.fillText(line1, 0, footerY - fs * 0.6); ctx.fillText(line2, 0, footerY + fs * 0.6); }
              else ctx.fillText(line1, 0, footerY);

              // Numbered badge (once, not three times)
              if (b.plugin.seq) {
                const bR = Math.max(14, pw * 0.14), bx = -pw / 2 + bR * 0.6, by = -ph / 2 + bR * 0.6;
                ctx.beginPath(); ctx.arc(bx, by, bR, 0, Math.PI * 2);
                ctx.fillStyle = "#1497d6"; ctx.fill();
                ctx.lineWidth = Math.max(2, bR * 0.15); ctx.strokeStyle = "#0a3a57"; ctx.stroke();
                ctx.fillStyle = "#ffed00"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
                const bfs = Math.max(9, Math.round(bR * 0.85));
                ctx.font = `900 ${bfs}px "Luckiest Guy", system-ui, sans-serif`;
                ctx.fillText(String(b.plugin.seq), bx, by + bfs * 0.06);
              }
              ctx.restore(); return;
            }
            // fuse cross-fade: ohyea -> plain bone over 1.5s after 1s hold
            if (b.plugin.fuseAt) {
              const ft = (performance.now() - b.plugin.fuseAt) / 1000; // seconds since fuse
              if (ft < 1) {
                // hold ohyea at full alpha
                ctx.drawImage(imgOhYea, -dw / 2 + dox, -dh / 2 + doy, dw, dh);
              } else if (ft < 2.5) {
                // cross-fade: ohyea fades out, plain bone fades in
                const fade = (ft - 1) / 1.5; // 0->1 over 1.5s
                ctx.globalAlpha = (ctx.globalAlpha ?? 1) * (1 - fade);
                ctx.drawImage(imgOhYea, -dw / 2 + dox, -dh / 2 + doy, dw, dh);
                ctx.globalAlpha = (ctx.globalAlpha ?? 1) / (1 - fade) * fade;
                ctx.drawImage(imgBone, -dw / 2 + dox, -dh / 2 + doy, dw, dh);
                ctx.globalAlpha = (ctx.globalAlpha ?? 1) / fade;
              } else {
                // fade done: lock to plain bone
                b.plugin.img = imgBone; delete b.plugin.fuseAt;
                ctx.drawImage(imgBone, -dw / 2 + dox, -dh / 2 + doy, dw, dh);
              }
            } else {
              ctx.drawImage(img, -dw / 2 + dox, -dh / 2 + doy, dw, dh);
            }
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
        // Instructions card: portrait rectangle matching overlay card exactly
        if (b.plugin.isInstructions) {
          const pw = s * 2;
          const ph = Math.round(pw * 1.36); // portrait -- same ratio as overlay
          const BORDER = Math.round(pw * 0.03), FOOTER = Math.round(ph * 0.18), RADIUS = cr;
          rrect(ctx, -pw / 2, -ph / 2, pw, ph, RADIUS);
          ctx.fillStyle = "#ffed00"; // no green hover on instructional cards
          ctx.fill();
          const illoH = ph - FOOTER - BORDER * 2, illoW = pw - BORDER * 2;
          if (img && img.complete && img.naturalWidth) {
            const imgAr = img.naturalWidth / img.naturalHeight, illoAr = illoW / illoH;
            const sliceW = imgAr > illoAr ? illoH * imgAr : illoW;
            const sliceH = imgAr > illoAr ? illoH : illoW / imgAr;
            rrect(ctx, -pw / 2 + BORDER, -ph / 2 + BORDER, illoW, illoH, RADIUS * 0.7);
            ctx.save(); ctx.clip();
            ctx.drawImage(img, -pw / 2 + BORDER - (sliceW - illoW) / 2, -ph / 2 + BORDER - (sliceH - illoH) / 2, sliceW, sliceH);
            ctx.restore();
          }
          const caption = b.plugin.label || b.plugin.name;
          const maxFontSize = Math.max(10, Math.round(FOOTER * 0.35));
          ctx.fillStyle = "#0a3a57"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.font = `400 ${maxFontSize}px "Luckiest Guy", system-ui, sans-serif`;
          const maxTw = pw * 0.86;
          let tw2 = ctx.measureText(caption).width, fs2 = maxFontSize;
          if (tw2 > maxTw) { fs2 = Math.max(6, Math.floor(maxFontSize * maxTw / tw2)); ctx.font = `400 ${fs2}px "Luckiest Guy", system-ui, sans-serif`; }
          const words2 = caption.split(" "); let line1 = "", line2 = "";
          for (const w3 of words2) {
            if (ctx.measureText(line1 + " " + w3).width < maxTw) line1 = (line1 ? line1 + " " : "") + w3;
            else line2 = (line2 ? line2 + " " : "") + w3;
          }
          const footerY = ph / 2 - FOOTER / 2;
          if (line2) { ctx.fillText(line1, 0, footerY - fs2 * 0.6); ctx.fillText(line2, 0, footerY + fs2 * 0.6); }
          else ctx.fillText(line1, 0, footerY);
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
      const particles: any[] = [];
      const poof = (x: number, y: number, s: number) => {
        for (let i = 0; i < 16; i++) {
          const a = Math.random() * Math.PI * 2, sp = 0.4 + Math.random() * 2.2;
          particles.push({
            x: x + (Math.random() - 0.5) * s, y: y + (Math.random() - 0.5) * s,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1,
            r: 3 + Math.random() * 6, born: performance.now(), life: 420 + Math.random() * 340,
          });
        }
      };
      // understated three-ball pop fired at the point two dragged objects connect
      const whackAt = (x: number, y: number) => {
        for (let i = 0; i < 3; i++) {
          const a = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 1.6;
          particles.push({
            x, y,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.6,
            r: 3 + Math.random() * 3, born: performance.now(), life: 280 + Math.random() * 200,
          });
        }
      };
      function drawParticles(ctx: any, now: number) {
        for (let i = particles.length - 1; i >= 0; i--) {
          const pt = particles[i], t = (now - pt.born) / pt.life;
          if (t >= 1) { particles.splice(i, 1); continue; }
          pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.03; pt.vx *= 0.98;
          ctx.save(); ctx.globalAlpha = (1 - t) * 0.6;
          ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r * (1 + t * 1.4), 0, Math.PI * 2);
          ctx.fillStyle = pt.colour || "#eaf6ff"; ctx.fill();
          ctx.lineWidth = 1.5; ctx.strokeStyle = pt.stroke || "rgba(20,151,214,0.5)"; ctx.stroke();
          ctx.restore();
        }
      }
      // a quick pink starburst, fired only when a circle is pressed while still active
      const bursts: any[] = [];
      const gooBlobs: any[] = []; // soft white blobs for the gooey logo+bone fuse
      let fused = false;          // the logo+bone fuse fires once
      // arrow-autofuse: when the logo and a LANDED bone come within 500px, a yellow
      // arrow pops out between them and super-magnetism eases the pair together to
      // fuse, then the arrow pops away. Automatic, no dragging. Separate from the
      // drag-driven onFuseMagnet above, so both can coexist.
      let arrowBody: any = null;          // the live arrow, null when none
      let arrowFusing = false;            // the ease-together is running
      const ARROW_RANGE = 500;            // px, centre-to-centre, to trigger
      const ARROW_EASE = 0.18;            // position-ease per frame (super-magnet)
      const spawnArrow = (mx: number, my: number) => {
        const img = getImg("__arrowmid", "/arrow-yellow-mid.svg");
        const half = BIG * 1.1;
        const b: any = Bodies.circle(mx, my, half, { isStatic: true, isSensor: true, render: { visible: false } });
        b.plugin = { name: "Fuse", half, w: half * 2, h: half * 2, color: "#ffd23e", img, prop: "arrowmid", kind: "arrowmid", family: null, ping: 0, pop: true, popScale: 0.01, popAlpha: 0, born: performance.now() };
        Composite.add(engine.world, b);
        return b;
      };
      const easePop = (b: any, now: number, into: boolean) => {
        // pop in (0->1) over 220ms, or pop away (1->0) over 200ms
        const t = Math.min(1, (now - (b.plugin.popStart || b.plugin.born)) / (into ? 220 : 200));
        const k = into ? t : 1 - t;
        b.plugin.popScale = 0.01 + k * 0.99;
        b.plugin.popAlpha = k;
        return t >= 1;
      };
      const onArrowFuse = () => {
        if (disposed || fused) { if (arrowBody) { Composite.remove(engine.world, arrowBody); arrowBody = null; } return; }
        if (!logoBody) return;
        const bone = nearestBone(logoBody);
        const now = performance.now();
        if (!arrowBody) {
          if (!bone) return;
          // bone must have LANDED: low vertical speed (settled on the pile)
          const landed = Math.abs(bone.velocity.y) < 0.5 && Math.abs(bone.velocity.x) < 0.8;
          const dx = bone.position.x - logoBody.position.x, dy = bone.position.y - logoBody.position.y;
          const dist = Math.hypot(dx, dy);
          if (landed && dist <= ARROW_RANGE) {
            const mx = (bone.position.x + logoBody.position.x) / 2, my = (bone.position.y + logoBody.position.y) / 2;
            arrowBody = spawnArrow(mx, my);
            arrowBody.plugin.popStart = now;
            arrowFusing = false;
          }
          return;
        }
        // an arrow is live: finish the pop-in, then ease the pair together
        if (!arrowFusing) {
          const popped = easePop(arrowBody, now, true);
          if (popped) arrowFusing = true;
        }
        if (arrowFusing && bone && logoBody) {
          // scissor attraction: applyForce pulls bone and logo toward each other
          // objects between them get pushed aside naturally by physics
          const dx2 = logoBody.position.x - bone.position.x, dy2 = logoBody.position.y - bone.position.y;
          const dist2 = Math.hypot(dx2, dy2) || 1;
          const pull = Math.min(0.08, dist2 * 0.00015) * bone.mass;
          Body.applyForce(bone, bone.position, { x: (dx2 / dist2) * pull, y: (dy2 / dist2) * pull });
          if (!logoBody.isStatic) {
            const pullL = Math.min(0.08, dist2 * 0.00015) * logoBody.mass;
            Body.applyForce(logoBody, logoBody.position, { x: -(dx2 / dist2) * pullL, y: -(dy2 / dist2) * pullL });
          }
          const mx = (bone.position.x + logoBody.position.x) / 2, my = (bone.position.y + logoBody.position.y) / 2;
          Body.setPosition(arrowBody, { x: mx, y: my });
          const d = Math.hypot(bone.position.x - logoBody.position.x, bone.position.y - logoBody.position.y);
          if (d <= FUSE_SNAP_DIST && !fused) {
            // reuse the existing fuse: snap the bone onto the logo, goo, score, remove logo
            fused = true;
            const jx = logoBody.position.x, jy = logoBody.position.y;
            Body.setPosition(bone, { x: jx, y: jy });
            Body.setVelocity(bone, { x: 0, y: 0 }); Body.setAngularVelocity(bone, 0);
            const t0 = performance.now();
            const R = Math.max(logoBody.plugin?.half || 60, bone.plugin?.half || 60);
            for (let i = 0; i < 9; i++) {
              const a = (i / 9) * Math.PI * 2, r = (i === 0 ? 0 : R * (0.25 + Math.random() * 0.5));
              gooBlobs.push({ x: jx + Math.cos(a) * r, y: jy + Math.sin(a) * r, s: R * (0.5 + Math.random() * 0.5), born: t0 + i * 12, life: 620 });
            }
            numAt(jx, jy, 2000);
            // fuse celebration: starbursts + delayed bursts
            explodeAt(jx, jy, R * 0.3);
            setTimeout(() => { burstAt(jx, jy, R * 0.2); }, 200);
            bone.plugin.img = imgOhYea; // ohyea SVG on fuse
            bone.plugin.fuseAt = performance.now(); // drives the cross-fade
            Composite.remove(engine.world, logoBody); logoBody = null;
            // pop the arrow away
            arrowBody.plugin.popStart = now; arrowBody.plugin.popping = true;
          }
        }
        if (arrowBody && arrowBody.plugin.popping) {
          const gone = easePop(arrowBody, now, false);
          if (gone) { Composite.remove(engine.world, arrowBody); arrowBody = null; }
        }
      };
      Events.on(engine, "beforeUpdate", onFuseMagnet);
      // Events.on(engine, "beforeUpdate", onArrowFuse); // auto-fuse arrow disabled
      const burstAt = (x: number, y: number, s: number) => bursts.push({ x, y, s, born: performance.now(), life: 420, colour: "#ff2d78", rot: 0 });
      // An explosion is three starbursts at once, red then yellow then white, each
      // turned 11 degrees further than the last, so a detonation reads far harder
      // than a single press. Strength scales with the circle's percentage figure.
      const explodeAt = (x: number, y: number, s: number) => {
        const born = performance.now();
        bursts.push({ x, y, s, born, life: 520, colour: "#e23a0e", rot: 0 });  // outer red-orange
        bursts.push({ x, y, s, born, life: 520, colour: "#ff7a1a", rot: 11 }); // mid orange
        bursts.push({ x, y, s, born, life: 520, colour: "#ffc62e", rot: 22 }); // inner yellow
      };
      // Three different grey balls thrown out with the blast, like smoke and debris.
      const greyPop = (x: number, y: number) => {
        const greys: [string, string][] = [["#9a9a9a", "rgba(70,70,70,0.5)"], ["#c4c4c4", "rgba(90,90,90,0.5)"], ["#6f6f6f", "rgba(40,40,40,0.5)"]];
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI * 2 + Math.random() * 0.8, sp = 1.2 + Math.random() * 1.5;
          particles.push({
            x, y,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.2,
            r: 8 + Math.random() * 6, born: performance.now(), life: 540 + Math.random() * 320,
            colour: greys[i][0], stroke: greys[i][1],
          });
        }
      };
      const blastSize = (b: any) => (b.plugin?.half || 21) * (1 + (b.plugin?.share || 0) / 25); // a bigger % figure = a bigger boom
      // ---- pop-art comic blast fired on bomb detonation: flash and sparkle, three irregular jagged bursts with black keylines, flung 5-point stars and the two lightning bolts, smoke behind, then the comic word ----
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
      const fuseSparks: any[] = [];
      const FUSE_COLS = ["#ffd23e", "#fff8e6", "#ff7a1a"];
      const FUSE_LIGHT_AT = 2; // the fuse stays dark on hit 1 and catches from hit 2
      const emitFuseSparks = (x: number, y: number, intensity: number) => {
        const n = 1 + Math.floor(intensity * 5); // attempts per frame, more as it climbs
        for (let i = 0; i < n; i++) {
          if (Math.random() > 0.18 + intensity * 0.78) continue; // sparse and faint at low intensity, near-constant at full
          const a = -Math.PI / 2 + (Math.random() - 0.5) * (0.7 + intensity * 1.7); // tighter spit when low, wider spray when high
          const sp = 0.7 + Math.random() * (1.0 + intensity * 2.8); // slower drips low, faster shower high
          fuseSparks.push({ x: x + (Math.random() - 0.5) * (4 + intensity * 7), y: y + (Math.random() - 0.5) * (4 + intensity * 7), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 1 + Math.random() * (0.8 + intensity * 2.6), born: performance.now(), life: 220 + Math.random() * 280, col: FUSE_COLS[Math.floor(Math.random() * FUSE_COLS.length)] });
        }
      };
      const drawFuseSparks = (ctx: any, now: number) => {
        for (let i = fuseSparks.length - 1; i >= 0; i--) {
          const s = fuseSparks[i], t = (now - s.born) / s.life;
          if (t >= 1) { fuseSparks.splice(i, 1); continue; }
          s.x += s.vx; s.y += s.vy; s.vy += 0.05; s.vx *= 0.97;
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
          ctx.strokeStyle = bu.colour || "#ff2d78"; ctx.lineWidth = 2.4; ctx.lineCap = "round";
          for (let k = 0; k < 12; k++) {
            const a = (k / 12) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
            ctx.lineTo(Math.cos(a) * reach, Math.sin(a) * reach);
            ctx.stroke();
          }
          ctx.fillStyle = bu.colour || "#ff2d78";
          for (let k = 0; k < 5; k++) {
            const a = (k / 5) * Math.PI * 2 + 0.3, rr = reach * 1.05, sx = Math.cos(a) * rr, sy = Math.sin(a) * rr, sz = 3 * (1 - t) + 1.5;
            ctx.beginPath();
            for (let p = 0; p < 5; p++) {
              const aa = a + (p / 5) * Math.PI * 2;
              const px = sx + Math.cos(aa) * sz, py = sy + Math.sin(aa) * sz;
              p === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.closePath(); ctx.fill();
          }
          ctx.restore();
        }
      }
      // little white numbers that flash up on a hit or tap
      function drawNumbers(ctx: any, now: number) {
        for (let i = numbers.length - 1; i >= 0; i--) {
          const n = numbers[i], t = (now - n.born) / n.life;
          if (t >= 1) { numbers.splice(i, 1); continue; }
          ctx.save(); ctx.globalAlpha = 1 - t;
          ctx.fillStyle = n.col || "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.font = `400 ${n.size || 15}px ${pctFont}, system-ui, sans-serif`;
          ctx.fillText(String(n.val), n.x, n.y - 22 - t * 34);
          ctx.restore();
        }
      }
      // The paw pattern flashes on each time a square dog strikes the floor, so it
      // strobes on and off through the pour and whenever the pit is shaken, then
      // settles off once the cards stop landing.
      let patternOn = false;
      let patternUntil = 0;
      let lastFillCheck = 0;
      let fillWarned90 = false, fillWarned95 = false, fillWarned99 = false;
      let dangerTimer: ReturnType<typeof setTimeout> | null = null;
      let countdownEl: HTMLDivElement | null = null;
      let countdownTick: ReturnType<typeof setInterval> | null = null;
      let graceUntil = 0; // 2.5s grace after cancellation - prevents flicker
      let throbIntervalOuter: ReturnType<typeof setInterval> | null = null; // hoisted for cleanup
      const DANGER_SECONDS = 4000; // 4s to clear before game over
      let lastPulse = 0;
      const PATTERN_FLASH = 220; // ms a single impact keeps the pattern lit
      const onFloorHit = (ev: any) => {
        const floor = walls[0];
        for (const pair of ev.pairs) {
          const other = pair.bodyA === floor ? pair.bodyB : pair.bodyB === floor ? pair.bodyA : null;
          if (!other) continue;
          if (other.plugin?.prop || other.plugin?.kind || other.plugin?.logo) continue; // dog cards only
          patternUntil = performance.now() + PATTERN_FLASH;
          break;
        }
      };
      Events.on(engine, "collisionStart", onFloorHit);
      // while the user drags an object, every fresh contact with another object scores
      // 1 from the contact point and fires the small whack pop
      const onWhack = (ev: any) => {
        const held = mc.body; if (!held) return;
        for (const pair of ev.pairs) {
          const other = pair.bodyA === held ? pair.bodyB : pair.bodyB === held ? pair.bodyA : null;
          if (!other || other.isStatic) continue; // ignore walls and pairs that do not involve the held object
          const sup = pair.collision && pair.collision.supports && pair.collision.supports[0];
          const cx = sup ? sup.x : (held.position.x + other.position.x) / 2;
          const cy = sup ? sup.y : (held.position.y + other.position.y) / 2;
          numAt(cx, cy, 1); // each hit scores 1 into the running total
          whackAt(cx, cy);
        }
      };
      Events.on(engine, "collisionStart", onWhack);
      const onAfter = () => {
        const ctx = render.context, now = performance.now(), bodies = dyn();
        // gooey fuse blobs: soft white radial gradients that swell then fade, so
        // overlapping blobs melt together into a gooey join
        for (let i = gooBlobs.length - 1; i >= 0; i--) {
          const g = gooBlobs[i], gt = (now - g.born) / g.life;
          if (gt < 0) continue;            // staggered start
          if (gt >= 1) { gooBlobs.splice(i, 1); continue; }
          const swell = 0.6 + Math.sin(Math.min(gt, 1) * Math.PI) * 0.8; // swell out then in
          const rad = g.s * swell, al = (1 - gt) * 0.9;
          const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, rad);
          grad.addColorStop(0, "rgba(255,255,255," + al + ")");
          grad.addColorStop(0.6, "rgba(255,255,255," + (al * 0.7) + ")");
          grad.addColorStop(1, "rgba(255,255,255,0)");
          ctx.save();
          ctx.globalCompositeOperation = "lighter"; // overlapping blobs reinforce, reads gooey
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(g.x, g.y, rad, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        // holding the bomb burns its five-hit fuse: one hit per whole second held, the fifth detonates
        if (pressedBomb && pressedBomb.plugin?.bomb && !pressedBomb.plugin.popped && pressedBomb.plugin.heldSince) {
          const sec = Math.floor((now - pressedBomb.plugin.heldSince) / 1000);
          while ((pressedBomb.plugin.heldHits || 0) < sec && pressedBomb && !pressedBomb.plugin.popped) {
            pressedBomb.plugin.clickPending = false; // a sustained hold, not a quick click
            pressedBomb.plugin.heldHits = (pressedBomb.plugin.heldHits || 0) + 1;
            hitBomb(pressedBomb); // one hit per second; the fifth detonates
            if (typeof navigator !== "undefined" && navigator.vibrate && pressedBomb && !pressedBomb.plugin.popped) navigator.vibrate(14 + (pressedBomb.plugin.heldHits || 0) * 12); // a rattle in the hand that grows as the fuse burns down
          }
        }
        // the fuse lights from the first hit and keeps fizzing on the bomb between clicks,
        // brighter and more frantic per hit, sparking from the wick at the top-right
        for (const fb of bodies) {
          if (!fb.plugin?.bomb || fb.plugin.popped) continue;
          const fhits = fb.plugin.hits || 0;
          if (fhits < FUSE_LIGHT_AT) continue; // hit 1 does not light the fuse
          // graduated climb: small at hit 2, stepping up through 3 and 4 to a high
          // finish, easing toward each hit's target so it reads as building pressure
          const fTarget = [0, 0, 0.16, 0.4, 0.68, 1][Math.min(fhits, 5)];
          fb.plugin.fuseCur = (fb.plugin.fuseCur || 0) + (fTarget - (fb.plugin.fuseCur || 0)) * 0.05; // ease up to each stage
          const fInt = fb.plugin.fuseCur;
          if (fInt < 0.03) continue; // not yet visibly lit
          const frr = fb.plugin.half || 21, fbi = fb.plugin.bombImg;
          let fox = frr * 0.85, foy = -frr * 1.0; // fallback wick spot if the sprite has not loaded
          if (fbi && fbi.naturalWidth) {
            const far = fbi.naturalWidth / fbi.naturalHeight, fbox = frr * 2.4;
            const fbw = far >= 1 ? fbox : fbox * far, fbh = far >= 1 ? fbox / far : fbox;
            fox = fbw * 0.34; foy = -fbh * 0.4; // the wick tip at the top-right of the sprite
          }
          const fRattle = fhits >= 3 ? fInt * 3 : 0; // from hit 3 the emit point shakes with the bomb, harder as it climbs
          const fjx = fRattle ? (Math.random() - 0.5) * fRattle : 0;
          const fjy = fRattle ? (Math.random() - 0.5) * fRattle : 0;
          emitFuseSparks(fb.position.x + fox + 5 + fjx, fb.position.y + foy + fjy, fInt); // origin nudged 5px right, plus the rattle
        }
        // advance any pop-out removals (a card hidden via the lineage remove button
        // briefly swells then shrinks to nothing, then leaves the world)
        const popped: any[] = [];
        for (const b of bodies) {
          if (!b.plugin.pop) continue;
          const t = (now - b.plugin.pop) / 620; // a touch longer than before, so it lingers
          if (t >= 1) { if (b.plugin.flyTo) poof(b.plugin.flyTo.x, b.plugin.flyTo.y, b.plugin.half || 30); popped.push(b); continue; }
          if (b.plugin.flyTo) {
            // curved fall: x eases out toward the tally while y accelerates down,
            // so the card arcs in rather than dropping dead straight
            const ex = 1 - (1 - t) * (1 - t), ey = t * t;
            const f = b.plugin.flyFrom, g = b.plugin.flyTo;
            Body.setPosition(b, { x: f.x + (g.x - f.x) * ex, y: f.y + (g.y - f.y) * ey });
            Body.setVelocity(b, { x: 0, y: 0 }); // keep gravity from fighting the scripted arc
            Body.setAngle(b, b.plugin.flyA0 + b.plugin.flySpin * t);
            b.plugin.popScale = 1.05 - Math.max(0, (t - 0.55) / 0.45) * 0.8; // shrink into the tally near the end
            b.plugin.popAlpha = t < 0.66 ? 1 : 1 - (t - 0.66) / 0.34;        // fade only in the final stretch
          } else {
            b.plugin.popScale = t < 0.22 ? 1 + (t / 0.22) * 0.12 : 1.12 * (1 - (t - 0.22) / 0.78);
            b.plugin.popAlpha = 1 - t;
          }
        }
        if (popped.length) Composite.remove(engine.world, popped);
        if (lineageOpenRef.current) { for (const b of bodies) drawBall(ctx, b, 1, false); drawParticles(ctx, now); drawFuseSparks(ctx, now); drawBursts(ctx, now); drawBooms(ctx, now); drawNumbers(ctx, now); return; }
        // pattern stays lit while any dog card rests on the floor, with the impact
        // window below still covering the strobe of cards bouncing during the pour
        const floorTop = walls[0].bounds.min.y;
        let onFloor = false;
        for (const b of bodies) {
          if (b.plugin?.prop || b.plugin?.kind || b.plugin?.logo) continue; // dog cards only
          if (b.bounds.max.y >= floorTop - 4) { onFloor = true; break; }
        }
        const wantPattern = onFloor || now < patternUntil;
        if (wantPattern !== patternOn) { patternOn = wantPattern; stage.classList.toggle(styles.showPattern, wantPattern); }

        // Game over: 10+ settled dog cards in spawn zone = pit is genuinely full
        const SPAWN_ZONE = 120; // 120px from top - reachable when pit is genuinely full
        const DANGER_COUNT = 7; // settled cards needed to trigger
        let throbInterval: ReturnType<typeof setInterval> | null = null;
        let throbHigh = true;
        const setThrob = (iv: ReturnType<typeof setInterval> | null) => { throbInterval = iv; throbIntervalOuter = iv; };
        const scheduleIdleCheck = () => {
          setTimeout(() => {
            if (disposed || gameOverRef.current) return;
            // Count settled objects genuinely in the spawn zone
            // Exclude: moving fast, moving upward, or outside pit walls
            const pitW = stage.clientWidth;
            let settledInZone = 0;
            for (const b of Composite.allBodies(engine.world)) {
              if (b.isStatic || !(b as any).plugin) continue;
              const spd = Math.hypot(b.velocity.x, b.velocity.y);
              if (spd > 2) continue; // must be settled
              if (b.velocity.y < -0.5) continue; // moving upward - flying out
              const plug = (b as any).plugin;
              const bx = b.position.x;
              if (bx < 0 || bx > pitW) continue; // outside pit walls
              const top = b.position.y - (plug.half ?? 40);
              if (top < SPAWN_ZONE) settledInZone++;
            }
            // Pattern opacity curve: 0-4 cards in zone = 0%, 5=10%, 6=25%, 7=50%, 8=75%, 9+=100%
            const opacityMap: number[] = [0, 0.14, 0.28, 0.42, 0.56, 0.70, 0.84, 1.0];
            const targetOpacity = opacityMap[Math.min(settledInZone, opacityMap.length - 1)];
            if (!throbInterval) {
              stage.style.setProperty("--fill-opacity", targetOpacity.toFixed(2));
            }
            if (settledInZone >= DANGER_COUNT) {
              // Start throb at 90% opacity
              // throb removed - steady max opacity when danger
              if (!dangerTimer && !countdownEl && performance.now() > graceUntil && !anyOverlayOpen()) {
                // Sequential: 3 (2s) → 2 (2s) → 1 (2s) → GAME OVER → navigate
                countdownEl = document.createElement("div");
                countdownEl.style.cssText = "position:absolute;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;font-family:var(--font-display,'Luckiest Guy',system-ui);font-size:clamp(5rem,18vw,12rem);color:#fff;pointer-events:none;text-shadow:0 4px 40px rgba(0,0,0,0.6)";
                stage.appendChild(countdownEl);
                const countdown = countdownEl;
                const steps = ["10","9","8","7","6","5","4","3","2","1","0"];
                let step = 0;
                countdown.textContent = steps[step];
                const tick = setInterval(() => {
                  step++;
                  if (step < steps.length) {
                    countdown.textContent = steps[step];
                    if (step === steps.length - 1) {
                      // "0" — hold 1.5s, then show GAME OVER, freeze, navigate
                      clearInterval(tick);
                      countdownTick = null;
                      window.setTimeout(() => {
                        countdown.textContent = "GAME OVER";
                        if (runnerRef.current) (runnerRef.current as any).enabled = false;
                        window.setTimeout(() => {
                          if (throbInterval) { clearInterval(throbInterval); setThrob(null); }
                          stage.style.setProperty("--fill-opacity", "0");
                          countdown.remove(); countdownEl = null;
                          gameOverRef.current = true;
                          try {
                            sessionStorage.setItem("pc-gameover-score", String(scoreRef.current));
                            sessionStorage.setItem("pc-gameover-chums", String(collectedRef.current));
                            const breedImgMap = Object.fromEntries(breeds.map((b: any) => [b.name, breedCard[b.slug] || b.image || ""]));
                            sessionStorage.setItem("pc-gameover-breeds", JSON.stringify(collectedChumsRef.current.map((n: string) => ({ name: n, img: breedImgMap[n] || "" }))));
                          } catch {}
                          window.location.href = "/about?gameover=1";
                        }, 800);
                      }, 1500);
                    }
                  } else {
                    clearInterval(tick);
                  }
                }, 1000);
                countdownTick = tick;
                dangerTimer = setTimeout(() => {}, 0); // mark as started
              }
            } else {
              // Cancel if below threshold - even during countdown (one item removed stops it)
              if (dangerTimer) {
                clearTimeout(dangerTimer); dangerTimer = null;
                if (countdownTick) { clearInterval(countdownTick); countdownTick = null; }
                if (countdownEl) { countdownEl.remove(); countdownEl = null; }
                graceUntil = performance.now() + 2500; // 2.5s grace before countdown can restart
              }
              stage.style.setProperty("--fill-opacity", targetOpacity.toFixed(2));
            }
            setTimeout(scheduleIdleCheck, 3000);
          }, 0);
        };
        setTimeout(scheduleIdleCheck, 5000); // start checking after 5s
        // Bone proximity: slow to 50% when two bones are within 100px of each other
        // Restores to normal when they move apart (or if user has set slow motion)
        if (!slowmoActiveRef.current) {
          const bones = bodies.filter((b: any) => b.plugin?.prop === "bone" && !b.isStatic);
          let bonesNear = false;
          for (let i = 0; i < bones.length && !bonesNear; i++) {
            for (let j = i + 1; j < bones.length && !bonesNear; j++) {
              const dx = bones[i].position.x - bones[j].position.x;
              const dy = bones[i].position.y - bones[j].position.y;
              if (Math.hypot(dx, dy) < 100) bonesNear = true;
            }
          }
          if (bonesNear && engine.timing.timeScale === 1) engine.timing.timeScale = 0.5;
          else if (!bonesNear && engine.timing.timeScale === 0.5) engine.timing.timeScale = 1;
        }
        const fillLevel = (stage as any).__fillLevel ?? 0;
        const pulseInterval = fillLevel < 0.25 ? 10000 : fillLevel < 0.5 ? 5000 : fillLevel < 0.75 ? 2000 : 1000;
        if (fillLevel > 0.1 && now - lastPulse > pulseInterval) {
          lastPulse = now;
          stage.classList.add(styles.patternPulse);
          setTimeout(() => stage.classList.remove(styles.patternPulse), 500);
        }
        const hov = pointer ? (Query.point(bodies, pointer).find((b: any) => !b.plugin?.logo) ?? null) : null;
        if (hov !== hoverBody) { hoverBody = hov; hoverStart = now; }
        const zoomedCard = bodies.find((b: any) => b.plugin?.kind === "stepcard" && b.plugin?.zoomed);
        const spotlight = (hoverBody && hoverBody.plugin.family) || !!zoomedCard;
        // ease the dim toward its target rather than snapping, so sweeping across
        // a shaken pack never flashes
        const dimTarget = spotlight ? DIM_MIN : 1;
        const frameDt = lastFrame ? Math.min(0.05, (now - lastFrame) / 1000) : 0; lastFrame = now;
        const step = frameDt / DIM_TIME;
        dimLevel = dimLevel < dimTarget ? Math.min(dimTarget, dimLevel + step) : Math.max(dimTarget, dimLevel - step);

        if (logoBody && logoBody.isStatic) drawBall(ctx, logoBody, 1, false); // fixed logo, drawn until it dislodges; after that dyn() draws it
        if (menuBody && menuBody.isStatic) drawBall(ctx, menuBody, 1, false); // fixed menu in the top-right, drawn until it dislodges; after that dyn() draws it
        // Locked bowl draws first (behind everything), then rest sorted by Y
        // Locked bowl and its fused bone draw first (furthest back), then rest sorted by Y
        const lockedBowl = bodies.find((b: any) => b.plugin?.lockedBowl);
        const fusedBone = bodies.find((b: any) => b.plugin?.fusedToBowl);
        if (lockedBowl) drawBall(ctx, lockedBowl, dimLevel, false);
        if (fusedBone) drawBall(ctx, fusedBone, dimLevel, false);
        [...bodies].sort((a: any, b: any) => a.position.y - b.position.y).forEach((b: any) => {
          if (b === hoverBody || b === lockedBowl || b === fusedBone) return;
          drawBall(ctx, b, dimLevel, false);
        });;
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
          const label = hoverBody.plugin.label || hoverBody.plugin.name;
          const w = ctx.measureText(label).width + 20; const ly = hp.y + hoverBody.plugin.half + 18;
          ctx.fillStyle = "rgba(10,58,87,0.92)"; pill(ctx, hp.x - w / 2, ly - 13, w, 26); ctx.fill();
          ctx.fillStyle = "#fff"; ctx.fillText(label, hp.x, ly); ctx.restore();
        }
        drawParticles(ctx, now);
        drawFuseSparks(ctx, now);
        drawBursts(ctx, now);
        drawBooms(ctx, now);
        drawNumbers(ctx, now);
      };
      removeBreedRef.current = (name: string) => {
        const INSTR = new Set(["Deal the cards","Head outside","Spot real dogs","Match to your chum","Find more chums","Most chums wins"]);
        if (INSTR.has(name)) {
          // Remove card from pit without fly animation
          const all = dyn().filter((b: any) => b.plugin?.name === name && !b.plugin.prop && !b.plugin.logo && b.plugin.kind !== "pct");
          all.forEach((b: any) => { poof(b.position.x, b.position.y, b.plugin.half || 30); Composite.remove(engine.world, b); });
          return;
        }
        const all = dyn().filter((b: any) => b.plugin?.name === name && !b.plugin.prop && !b.plugin.logo && b.plugin.kind !== "pct");
        const target = all.find((b: any) => !b.plugin.pop);
        if (target) {
          const rect = render.canvas.getBoundingClientRect();
          target.plugin.pop = performance.now();
          target.plugin.flyFrom = { x: target.position.x, y: target.position.y };
          target.plugin.flyTo = { x: 60 - rect.left, y: window.innerHeight - 60 - rect.top };
          target.plugin.flyA0 = target.angle;
          target.plugin.flySpin = (Math.random() < 0.5 ? -1 : 1) * Math.PI * 1.4;
          target.isSensor = true;
          poof(target.position.x, target.position.y, target.plugin.half || 30);
          // Mark any duplicate bodies with the same name so they can't be re-opened
          all.forEach((b: any) => { if (b !== target) { b.plugin.pop = performance.now(); b.isSensor = true; } });
        }
      };

      scatterRef.current = (data) => {
        if (!data) return;
        const circles = data.circles || [], rods = data.rods || [], pills = data.pills || [];
        const rect = render.canvas.getBoundingClientRect();
        for (const c of circles) {
          const r = Math.max(14, c.r);
          const b: any = Bodies.circle(c.x - rect.left, c.y - rect.top, r, {
            restitution: 0.4, friction: 0.25, frictionAir: 0.004, density: 0.006, render: { visible: false },
          });
          const isBomb = Math.random() < 1 / 20; // ~1 in 20 (was 1/35) for better chain reactions
          b.plugin = { name: c.name, kind: "pct", share: c.share, half: r, color: "#ffd23e", img: null, family: null, ping: 0, charges: 20, repelOn: false, repelStart: 0, inert: false, bomb: isBomb, hits: 0, popped: false, bombImg: isBomb ? getImg("__bomb", "/bomb.svg") : null };
          Body.setVelocity(b, { x: (Math.random() - 0.5) * 3, y: 3 });
          Composite.add(engine.world, b);
        }
        // the connecting rods tip in as thin tumbling bars: yellow if their branch was open, white if not
        for (const rd of rods) {
          const mx = (rd.x1 + rd.x2) / 2 - rect.left, my = (rd.y1 + rd.y2) / 2 - rect.top;
          const dx = rd.x2 - rd.x1, dy = rd.y2 - rd.y1, len = Math.max(24, Math.hypot(dx, dy)), th = 8;
          const b: any = Bodies.rectangle(mx, my, len, th, { angle: Math.atan2(dy, dx), chamfer: { radius: th / 2 }, restitution: 0.4, friction: 0.3, frictionAir: 0.006, density: 0.004, render: { visible: false } });
          b.plugin = { name: "", kind: "rod", w: len, h: th, half: th / 2, color: rd.lit ? "#ffd23e" : "rgba(255,255,255,0.72)", img: null, family: null, ping: 0, hits: 0, maxHits: 2, gone: false };
          Body.setVelocity(b, { x: (Math.random() - 0.5) * 3, y: 2.6 });
          Composite.add(engine.world, b);
        }
        // the blue name pills drop in too, each still carrying its breed name
        for (const pl of pills) {
          const px = pl.x - rect.left, py = pl.y - rect.top, pw = Math.max(44, pl.w), ph = 26;
          const b: any = Bodies.rectangle(px, py, pw, ph, { chamfer: { radius: ph / 2 }, restitution: 0.35, friction: 0.4, frictionAir: 0.008, density: 0.0012, render: { visible: false } });
          b.plugin = { name: pl.name, kind: "pill", w: pw, h: ph, half: Math.min(pw, ph) / 2, color: "#0a3a57", label: pl.name, img: null, family: null, ping: 0, hits: 0, maxHits: 3, gone: false, chum: PACK_NAMES.has(pl.name) }; // a pack dog: this pill never expires and the bomb ignores it
          Body.setVelocity(b, { x: (Math.random() - 0.5) * 3, y: 2.4 });
          Composite.add(engine.world, b);
        }
      };

      // Bowl settling: when bowl reaches the floor upright and slow, snap to centre and pin
      let bowlLocked = false;
      Events.on(engine, "afterUpdate", () => {
        if (bowlLocked) return;
        const bowlB = getBodies().find((b: any) => b.plugin?.isBowl && !b.isStatic);
        if (!bowlB) return;
        const pitW = render.canvas.width;
        const floorY = walls[0] ? walls[0].bounds.min.y : render.canvas.height;
        const a = ((bowlB.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const upright = a < 0.4 || a > Math.PI * 2 - 0.4;
        const slow = Math.hypot(bowlB.velocity.x, bowlB.velocity.y) < 3;
        const nearFloor = bowlB.bounds.max.y > floorY - 20;
        if (!upright || !slow || !nearFloor) return;
        bowlLocked = true;
        const cx = pitW / 2;
        const cy = floorY - bowlB.plugin.h * 0.32;
        Body.setPosition(bowlB, { x: cx, y: cy });
        Body.setAngle(bowlB, 0);
        Body.setVelocity(bowlB, { x: 0, y: 0 });
        Body.setAngularVelocity(bowlB, 0);
        const pinL = Constraint.create({ pointA: { x: cx - bowlB.plugin.w * 0.3, y: floorY - 5 }, bodyB: bowlB, pointB: { x: -bowlB.plugin.w * 0.3, y: bowlB.plugin.h * 0.35 }, stiffness: 1, length: 0, render: { visible: false } });
        const pinR = Constraint.create({ pointA: { x: cx + bowlB.plugin.w * 0.3, y: floorY - 5 }, bodyB: bowlB, pointB: { x: bowlB.plugin.w * 0.3, y: bowlB.plugin.h * 0.35 }, stiffness: 1, length: 0, render: { visible: false } });
        const pinC = Constraint.create({ pointA: { x: cx, y: floorY - 5 }, bodyB: bowlB, pointB: { x: 0, y: bowlB.plugin.h * 0.35 }, stiffness: 1, length: 0, render: { visible: false } });
        Composite.add(engine.world, [pinL, pinR, pinC]);
        // Make bowl a sensor -- no contact forces, stops wobble from other objects
        // bowl stays in default category so mouse constraint can grab it
        Body.set(bowlB, { frictionAir: 0.99, density: 10, gravityScale: 0, inertia: Infinity, inverseInertia: 0 });
        bowlB.plugin.lockedBowl = true; // flag for draw order
        burstAt(cx, cy, bowlB.plugin.half * 0.3);
        numAt(cx, cy, 250);
      });

      // bone+bowl magnetism -- much weaker than bone+logo, only when bowl is upright
      let bowlFused = true; // bowl+bone fuse abandoned
      const BOWL_MAGNET_RADIUS = 350;
      const BOWL_MAGNET_PULL = 0.000008; // ~6x weaker than bone+logo FUSE_PULL
      const BOWL_SNAP_DIST = 180;
      Events.on(engine, "beforeUpdate", () => {
        if (bowlFused) return;
        const all = getBodies();
        const bowlBody = all.find((b: any) => b.plugin?.isBowl && !b.isStatic);
        const boneBody = all.find((b: any) => b.plugin?.prop === "bone" && !b.isStatic);
        if (!bowlBody || !boneBody) return;
        // Only activate when bowl is roughly upright (open side up)
        const a = ((bowlBody.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const upright = a < 0.5 || a > Math.PI * 2 - 0.5;
        if (!upright) return;
        const dx = boneBody.position.x - bowlBody.position.x;
        const dy = boneBody.position.y - bowlBody.position.y;
        const dist = Math.hypot(dx, dy);
        if (dist > BOWL_MAGNET_RADIUS || dist < 1) return;
        // Gentle pull -- only pull the bone toward the bowl, not vice versa
        const closeness = BOWL_MAGNET_RADIUS - dist;
        const f = BOWL_MAGNET_PULL * closeness;
        Body.applyForce(boneBody, boneBody.position, { x: -(dx / dist) * f * boneBody.mass, y: -(dy / dist) * f * boneBody.mass });
        // Snap and fuse when close enough
        if (dist <= BOWL_SNAP_DIST) {
          bowlFused = true;
          // Join them with a rigid constraint
          const joint = Constraint.create({
            bodyA: bowlBody, bodyB: boneBody,
            pointA: { x: 0, y: -bowlBody.plugin.h * 0.15 },
            pointB: { x: 0, y: 0 },
            stiffness: 1, damping: 1, length: 0,
            render: { visible: false },
          });
          // Also increase bone air friction to damp oscillation
          boneBody.collisionFilter = { ...boneBody.collisionFilter, category: LOCKED_CAT };
          Body.set(boneBody, { frictionAir: 0.99, density: 10, gravityScale: 0, inertia: Infinity, inverseInertia: 0 });
          Body.setVelocity(boneBody, { x: 0, y: 0 });
          Body.setAngularVelocity(boneBody, 0);
          Composite.add(engine.world, joint);
          // Goo erupts from bowl rim upward and around the bone
          const jx = bowlBody.position.x;
          // jy at bowl rim -- top edge of bowl
          const jy = bowlBody.position.y - bowlBody.plugin.h * 0.45;
          const boneX = boneBody.position.x, boneY = boneBody.position.y;
          const R2 = Math.max(120, bowlBody.plugin.w * 0.35);
          const t0 = performance.now();
          // Ring of blobs at bowl rim level
          for (let i = 0; i < 16; i++) {
            const ang = (i / 16) * Math.PI * 2;
            const r = R2 * (0.4 + Math.random() * 0.6);
            // Bias upward -- blobs above rim go further out, below go less far
            const yBias = Math.sin(ang) < 0 ? 1.4 : 0.6;
            gooBlobs.push({
              x: jx + Math.cos(ang) * r,
              y: jy + Math.sin(ang) * r * yBias,
              s: R2 * (0.4 + Math.random() * 0.7),
              born: t0 + i * 10, life: 900
            });
          }
          // Extra blobs around the bone itself
          for (let i = 0; i < 8; i++) {
            const ang = (i / 8) * Math.PI * 2, r = 60 + Math.random() * 80;
            gooBlobs.push({ x: boneX + Math.cos(ang) * r, y: boneY + Math.sin(ang) * r, s: 50 + Math.random() * 60, born: t0 + 80 + i * 15, life: 700 });
          }
          // Sparks from rim
          emitFuseSparks(jx, jy, 2.0);
          emitFuseSparks(jx - R2 * 0.3, jy, 1.8);
          emitFuseSparks(jx + R2 * 0.3, jy, 1.8);
          emitFuseSparks(boneX, boneY, 1.5);
          numAt(jx, jy, 1000);
          burstAt(jx, jy, R2 * 0.6);
          burstAt(jx, jy - R2 * 0.4, R2 * 0.4);
          burstAt(boneX, boneY, 60);
        }
      });

      // Damp (never teleport) the locked bowl and fused bone every frame.
      // A hard position snap mid-simulation is what was injecting energy into
      // anything resting on the bone -- Matter's solver sees a body that moved
      // impossibly fast and reacts by flinging contacting bodies. Zeroing
      // velocity is enough since both bodies are now true static-weight props;
      // we only correct position if it has drifted by more than a few px,
      // and even then via velocity nudging rather than Body.setPosition.
      Events.on(engine, "afterUpdate", () => {
        const all2 = getBodies();
        const lb = all2.find((b: any) => b.plugin?.lockedBowl);
        if (lb) {
          Body.setVelocity(lb, { x: 0, y: 0 });
          Body.setAngularVelocity(lb, 0);
        }
        const fb2 = all2.find((b: any) => b.plugin?.prop === "bone" && b.plugin?.fusedToBowl);
        if (fb2 && lb) {
          Body.setVelocity(fb2, { x: 0, y: 0 });
          Body.setAngularVelocity(fb2, 0);
        }
      });

      // bowl scoring: bone=500, ball=100, pin in place
      Events.on(engine, "collisionStart", (ev: any) => {
        for (const pair of ev.pairs) {
          const bowl2 = pair.bodyA.plugin?.isBowl ? pair.bodyA : pair.bodyB.plugin?.isBowl ? pair.bodyB : null;
          if (!bowl2) continue;
          const obj = bowl2 === pair.bodyA ? pair.bodyB : pair.bodyA;
          if (!obj?.plugin) continue;
          if (bowl2.plugin.bowlScored.has(obj.id)) continue;
          const isBoneObj = obj.plugin.prop === "bone";
          const isBallObj = obj.plugin.prop === "ball";
          if (!isBoneObj && !isBallObj) continue;
          const a = ((bowl2.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          if (a > 0.5 && a < Math.PI * 2 - 0.5) continue; // only when roughly upright
          bowl2.plugin.bowlScored.add(obj.id);
          const pts = isBoneObj ? 500 : 100;
          numAt(obj.position.x, obj.position.y, pts);
          burstAt(obj.position.x, obj.position.y, 20);
          Body.setStatic(obj, true);
        }
      });
      Events.on(render, "afterRender", onAfter);

      // The fallen percentage circles double as negative-magnet buttons. Pressing
      // one shoves nearby objects away; the percentage sets the strength (higher
      // percent = weaker). Each circle has 5 presses, and a single hold lasts at
      // most 5s before it auto-releases. After the fifth it goes inert and blue.
      const REPEL = 0.05;      // master strength dial for the held force
      const KICK = 6;          // instant outward shove on press
      const repelRange = (b: any) => Math.max(140, b.plugin.half * 5);
      const repelFactor = (b: any) => Math.max(0.12, 1 - b.plugin.share / 100);
      const releasePct = (b: any) => {
        if (!b.plugin?.repelOn) return;
        b.plugin.repelOn = false;
        b.plugin.charges = (b.plugin.charges ?? 20) - 1;
        if (b.plugin.charges <= 0) {
          b.plugin.inert = true;
          poof(b.position.x, b.position.y, b.plugin.half || 21); // smoke poof only on the final fifth hit
          b.collisionFilter = { category: 0x0002, mask: 0xffffffff, group: 0 }; // no longer grabbable
          if (mc.body === b) { mc.constraint.bodyB = null; mc.body = null; } // let go if currently held
        }
      };
      const releaseHeldPct = () => {
        for (const b of Composite.allBodies(engine.world)) if (b.plugin?.repelOn) releasePct(b);
        // a bomb released under a second after pressing counts as a single click hit
        if (pressedBomb && !pressedBomb.plugin.popped && pressedBomb.plugin.clickPending) hitBomb(pressedBomb);
        if (pressedBomb) { pressedBomb.plugin.heldSince = 0; pressedBomb.plugin.heldHits = 0; pressedBomb.plugin.clickPending = false; }
        pressedBomb = null;
      };
      // A bomb takes five hits like a % circle, but the fifth detonates instead of
      // going inert: every other % circle (yellow or inert blue) bursts out of the
      // pit in a chain, nearest first, one after the next rather than all at once.
      const detonateBomb = (bomb: any) => {
        if (bomb.plugin.popped) return; // a user hit and an object hit could both land on the fifth/tenth
        bomb.plugin.popped = true;
        // Anticipation: before it vanishes the bomb squashes a touch then snaps ~20% bigger,
        // so it reads as a burst rather than just blinking out. drawBall animates plugin.bursting;
        // after the short window below the blast fires and the bomb is removed.
        bomb.plugin.bursting = performance.now();
        const wasHeld = pressedBomb === bomb;
        if (mc.body === bomb) { mc.constraint.bodyB = null; mc.body = null; }
        if (pressedBomb === bomb) pressedBomb = null; // stop the hold loop and the fuse fizz at once
        const bx = bomb.position.x, by = bomb.position.y, bsz = blastSize(bomb);
        // Strobe the paw pattern on bomb detonation: 4 quick flashes then one long
        if (stageRef.current) {
          const el = stageRef.current;
          const strobeDelays = [0, 80, 160, 240, 380];
          const strobeDurs  = [60, 60, 60, 60, 400];
          strobeDelays.forEach((d, i) => {
            window.setTimeout(() => { el.classList.add(styles.patternStrobe); }, d);
            window.setTimeout(() => { el.classList.remove(styles.patternStrobe); }, d + strobeDurs[i]);
          });
        }
        window.setTimeout(() => {
          if (disposed) return;
          pushBoom(bx, by, bsz * 2.2); // pop-art comic blast
          numAt(bx, by, 250);
          if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(wasHeld ? [25, 20, 200] : [20, 15, 120]);
          Composite.remove(engine.world, bomb);
          // Only circles caught in a contact chain
          // touching the bomb, then those touching them, and so on. Anything cut off by
          // a gap, or by a non-circle object wedged between, is spared.
          const rad = (o: any) => o.plugin?.half || 21;
          const touch = (a: any, b: any) =>
            Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y) <= rad(a) + rad(b) + 10;
          const pool = dyn().filter((o: any) => {
            const k = o.plugin?.kind;
            if (k === "pct") return !o.plugin.bomb && !o.plugin.popped; // yellow and blue % circles
            if (k === "rod") return !o.plugin.gone && !o.plugin.popped; // connecting rods join the chain
            if (k === "pill") return !o.plugin.gone && !o.plugin.popped && !o.plugin.chum; // name pills join too, but a chum pill is spared the blast
            return false;
          });
          const chain: any[] = [];
          let frontier = pool.filter((o: any) => touch(o, bomb));
          frontier.forEach((o: any) => { o.plugin.popped = true; }); // claim now so nothing double-pops mid-chain
          while (frontier.length) {
            chain.push(...frontier);
            const prev = frontier;
            frontier = pool.filter((o: any) => !o.plugin.popped && prev.some((f: any) => touch(f, o)));
            frontier.forEach((o: any) => { o.plugin.popped = true; });
          }
          chain.forEach((o: any, i: number) => {
            const rankVal = o.plugin?.kind === "pct" ? 12 : 0; // flat +12 per circle; rods and pills score nothing
            window.setTimeout(() => {
              if (disposed) return;
              explodeAt(o.position.x, o.position.y, blastSize(o));
              poof(o.position.x, o.position.y, o.plugin.half || 21);
              if (rankVal) numAt(o.position.x, o.position.y, rankVal); // doubling chain bonus, circles only
              if (mc.body === o) { mc.constraint.bodyB = null; mc.body = null; }
              Composite.remove(engine.world, o);
            }, 25 * (i + 1));
          });
          // Shockwave + bomb-triggers-bomb:
          // Direct contact -> instant detonate other bomb
          // Near blast (2.5x) -> deal 2 hits (big bombs survive, small ones go)
          // Far blast (5.5x) -> deal 1 hit (only pre-ignited bombs affected)
          const claimed = new Set<any>(chain);
          const SHOVE_RADIUS = bsz * 5.5;
          const SHOVE_FORCE = 0.9 * (bomb.plugin.half || 21);
          for (const o of dyn()) {
            if (o === bomb || claimed.has(o) || o.isStatic) continue;
            const dx = o.position.x - bx, dy = o.position.y - by;
            const dist = Math.hypot(dx, dy) || 1;
            // Bomb-triggers-bomb tiers
            if (o.plugin?.bomb && !o.plugin.popped) {
              const rad = (o.plugin.half || 21) + (bomb.plugin.half || 21);
              if (dist <= rad + 5) {
                // Direct contact: instant detonate
                window.setTimeout(() => { if (!o.plugin.popped) detonateBomb(o); }, 80);
              } else if (dist <= bsz * 2.5) {
                // Near: 2 hits
                window.setTimeout(() => { if (!o.plugin.popped) { hitBomb(o); if (!o.plugin.popped) hitBomb(o); } }, 120);
              } else if (dist <= bsz * 5.5 && (o.plugin.hits || 0) >= 1) {
                // Far: 1 hit, only ignited bombs
                window.setTimeout(() => { if (!o.plugin.popped) hitBomb(o); }, 160);
              }
              continue; // bomb bodies skip the shove
            }
            if (o.plugin?.kind === "pct") continue; // circles untouched by shove
            if (dist > SHOVE_RADIUS) continue;
            const falloff = 1 - dist / SHOVE_RADIUS;
            // Shockwave force multipliers per object type
            const isDog = !o.plugin?.prop && !o.plugin?.kind && (o.plugin?.half || 0) > 20;
            const isBowl = o.plugin?.prop === "bowl";
            const isBoneP = o.plugin?.prop === "bone";
            const isSlipper = o.plugin?.prop === "slipper";
            const isRodPill = o.plugin?.kind === "rod" || o.plugin?.kind === "pill";
            const forceMult = isBowl ? 0.03 : isBoneP ? 0.05 : isSlipper ? 0.07 : isDog ? 0.10 : isRodPill ? 0.80 : 0.15;
            const mag = SHOVE_FORCE * falloff * falloff * (o.mass || 1) * forceMult;
            Body.applyForce(o, o.position, { x: (dx / dist) * mag, y: (dy / dist) * mag - mag * 0.25 });
            Body.setAngularVelocity(o, (Math.random() - 0.5) * 0.6 * (falloff + 0.2));
            // Immediately clamp ALL bodies after force application
            const spd = Math.hypot(o.velocity.x, o.velocity.y);
            if (spd > 40) { const sc = 40 / spd; Body.setVelocity(o, { x: o.velocity.x * sc, y: o.velocity.y * sc }); }
            if (o.velocity.y < -20) Body.setVelocity(o, { x: o.velocity.x, y: -20 });
          }
        }, 180);
      };
      const hitBomb = (bomb: any) => {
        if (bomb.plugin.popped) return;
        bomb.plugin.hits = (bomb.plugin.hits || 0) + 1;
        bomb.plugin.jump = performance.now();
        burstAt(bomb.position.x, bomb.position.y, (bomb.plugin.half || 21) * 1.1);
        numAt(bomb.position.x, bomb.position.y, 10); // +10 for each user hit on the bomb
        // hit threshold scales with bomb size: small=3, medium=5, large=8
        const hitsNeeded = (bomb.plugin.half || 21) < 20 ? 3 : (bomb.plugin.half || 21) > 30 ? 8 : 5;
        if (bomb.plugin.hits >= hitsNeeded) detonateBomb(bomb);
      };
      // A bomb also takes knocks from the pit itself, but each object knock is worth
      // very little next to a user hit: five hundred knocks set it off, scoring 2 each.
      const onBombHit = (ev: any) => {
        for (const pair of ev.pairs) {
          const bb = pair.bodyA.plugin?.bomb ? pair.bodyA : pair.bodyB.plugin?.bomb ? pair.bodyB : null;
          if (!bb || bb.plugin.popped) continue;
          const other = bb === pair.bodyA ? pair.bodyB : pair.bodyA;
          if (!other || other.isStatic) continue; // the walls, floor and ceiling do not count
          if (!bb.plugin.hits || bb.plugin.hits < 1) continue; // forcefield: ignore until user ignites
          bb.plugin.objHits = (bb.plugin.objHits || 0) + 1;
          setScore((s) => s + 2);
          if (bb.plugin.objHits >= 100) detonateBomb(bb);
        }
      };
      Events.on(engine, "collisionStart", onBombHit);

      // A % circle goes inert after five hits total. Those used to be cursor presses
      // only; now a solid knock from another pit object spends a charge too. A speed
      // threshold and a short cooldown keep gentle resting contacts from counting.
      const onPctHit = (ev: any) => {
        const now = performance.now();
        for (const pair of ev.pairs) {
          for (const c of [pair.bodyA, pair.bodyB] as any[]) {
            const p = c.plugin;
            if (!p) continue;
            const other = c === pair.bodyA ? pair.bodyB : pair.bodyA;
            if (!other || other.isStatic) continue; // walls, floor, ceiling do not count
            const rv = Math.hypot(c.velocity.x - other.velocity.x, c.velocity.y - other.velocity.y);
            if (p.kind === "pct" && !p.inert && !p.bomb && !p.repelOn) {
              if (rv < 5) continue; // a real knock, not a nudge
              if (p.lastObjHit && now - p.lastObjHit < 600) continue; // one charge per knock, not per frame
              p.lastObjHit = now;
              p.charges = (p.charges ?? 20) - 1;
              if (p.charges <= 0) {
                p.inert = true;
                poof(c.position.x, c.position.y, p.half || 21);
                c.collisionFilter = { category: 0x0002, mask: 0xffffffff, group: 0 };
                if (mc.body === c) { mc.constraint.bodyB = null; mc.body = null; }
              }
            } else if ((p.kind === "rod" || p.kind === "pill") && !p.gone) {
              // detritus: rods pop after 2 knocks, pills after 3, then vanish
              if (rv < 4) continue;
              if (p.lastObjHit && now - p.lastObjHit < 450) continue;
              p.lastObjHit = now;
              p.hits = (p.hits || 0) + 1;
              if (p.hits >= (p.maxHits || 3) && !p.chum && !p.stuck) { p.gone = true; poof(c.position.x, c.position.y, p.half || 12); Composite.remove(engine.world, c); } // a chum pill or a stuck pill never expires
            }
          }
        }
      };
      Events.on(engine, "collisionStart", onPctHit);
      // A yellow circle knocked loose by a user-flung toy (or the dragged body) scores as it
      // tumbles: every fresh yellow circle it strikes flashes +1 at each (two points a hit),
      // so a good scatter racks up points. Only direct knock-ons score, no runaway cascade.
      const KNOCK_WINDOW = 1600; // ms a knocked circle stays live and scores its onward hits
      const isUserObj = (b: any) => !!b && ((b.plugin?.prop && !b.plugin.logo) || b === mc.body);
      const liveCircle = (b: any) => b.plugin?.kind === "pct" && !b.plugin.inert && !b.plugin.popped && !b.plugin.bomb && !b.isStatic;
      const onKnockScore = (ev: any) => {
        const now = performance.now();
        for (const pair of ev.pairs) {
          const A: any = pair.bodyA, B: any = pair.bodyB;
          const aP = liveCircle(A), bP = liveCircle(B);
          if (isUserObj(A) && bP) B.plugin.knockAt = now; // a toy knocks a circle: it goes live (the activation itself does not score)
          if (isUserObj(B) && aP) A.plugin.knockAt = now;
          if (aP && bP) {
            const aLive = A.plugin.knockAt && now - A.plugin.knockAt < KNOCK_WINDOW;
            const bLive = B.plugin.knockAt && now - B.plugin.knockAt < KNOCK_WINDOW;
            if (aLive || bLive) { numAt(A.position.x, A.position.y, 1); numAt(B.position.x, B.position.y, 1); } // +1 emanates from each
          }
        }
      };
      Events.on(engine, "collisionStart", onKnockScore);
      // Logo pieces (shouts, poofs, white + yellow circles) score +1 each time they
      // are knocked, and pop out after 100 hits. Collisions are frequent, so they
      // are designed to rack up fast and expire.
      const onLogoPieceHit = (ev: any) => {
        for (const pair of ev.pairs) {
          for (const b of [pair.bodyA, pair.bodyB] as any[]) {
            // logo knock-off pieces poof after 10 hits
            if (b?.plugin?.knockPiece && !b.isStatic) {
              b.plugin.hits = (b.plugin.hits || 0) + 1;
              numAt(b.position.x, b.position.y, 1);
              if (b.plugin.hits >= 10) { poof(b.position.x, b.position.y, b.plugin.half || 14); Composite.remove(engine.world, b); }
            }
            // inert reject button poofs after 20 hits
            if (b?.plugin?.kind === "cookiereject-inert" && !b.isStatic) {
              b.plugin.hits = (b.plugin.hits || 0) + 1;
              numAt(b.position.x, b.position.y, 1);
              if (b.plugin.hits >= 20) { poof(b.position.x, b.position.y, b.plugin.half || 30); Composite.remove(engine.world, b); }
            }
          }
        }
      };
      Events.on(engine, "collisionStart", onLogoPieceHit);
      const pressPct = (pt: { x: number; y: number }) => {
        const hit = Query.point(dyn(), pt).find((b: any) => b.plugin?.kind === "pct" && !b.plugin.inert && !b.plugin.repelOn && !b.plugin.popped);
        if (!hit) return;
        if (hit.plugin.bomb) {
          // a press arms the fuse: a quick release lands as one click hit, a sustained
          // hold ticks one hit per whole second (handled in the render loop / on release)
          pressedBomb = hit;
          hit.plugin.heldSince = performance.now();
          hit.plugin.heldHits = 0;
          hit.plugin.clickPending = true;
          return;
        }
        hit.plugin.repelOn = true;
        hit.plugin.repelStart = performance.now();
        hit.plugin.jump = performance.now();           // electrocuted jolt (render-side)
        burstAt(hit.position.x, hit.position.y, 28);    // starburst, 33% bigger than a 5% circle radius, active presses only
        numAt(hit.position.x, hit.position.y, hit.plugin.share); // flash the % figure on each hit
        // instant outward kick so the push reads immediately
        const f = repelFactor(hit), R = repelRange(hit);
        for (const o of dyn()) {
          if (o === hit || o.plugin?.repelOn) continue;
          const dx = o.position.x - hit.position.x, dy = o.position.y - hit.position.y;
          const d = Math.hypot(dx, dy);
          if (d > 0.1 && d < R) {
            const s = f * KICK * (1 - d / R);
            Body.setVelocity(o, { x: o.velocity.x + (dx / d) * s, y: o.velocity.y + (dy / d) * s });
          }
        }
      };
      Events.on(engine, "beforeUpdate", () => {
        const now = performance.now();
        const all = getBodies();
        for (const b of all) {
          if (!b.plugin?.repelOn) continue;
          if (now - b.plugin.repelStart > 5000) { releasePct(b); continue; } // auto-release after 5s
          const f = repelFactor(b), R = repelRange(b);
          for (const o of all) {
            if (o === b || o.isStatic || o.plugin?.repelOn) continue;
            const dx = o.position.x - b.position.x, dy = o.position.y - b.position.y;
            const d = Math.hypot(dx, dy);
            if (d > 0.1 && d < R) {
              const mag = f * REPEL * (1 - d / R) * o.mass;
              Body.applyForce(o, o.position, { x: (dx / d) * mag, y: (dy / d) * mag });
            }
          }
        }
      });
      // green arrow compass: arrowhead (bottom-left) always faces how-to-play
      const GREEN_BASE_ANGLE = 2.3450; // offset from SVG centre to arrowhead tip
      let greenSettledSince: number | null = null;
      let greenLastHop = 0;
      const GREEN_SETTLE_MS = 2000;
      const GREEN_HOP_EVERY = 3000;
      Events.on(engine, "beforeUpdate", () => {
        const all = getBodies();
        const gArrow = all.find((b: any) => b.plugin?.kind === "arrow-green");
        const howTo = all.find((b: any) => b.plugin?.kind === "howtoplay");
        const enterS = all.find((b: any) => b.plugin?.kind === "entersite");
        if (!gArrow) return;
        // dual-north: track whichever target is closer
        const targets = [howTo, enterS].filter(Boolean);
        if (!targets.length) return;
        const target = targets.reduce((nearest: any, t: any) => {
          const d = Math.hypot(t.position.x - gArrow.position.x, t.position.y - gArrow.position.y);
          const dn = Math.hypot(nearest.position.x - gArrow.position.x, nearest.position.y - gArrow.position.y);
          return d < dn ? t : nearest;
        });
        const dx = target.position.x - gArrow.position.x;
        const dy = target.position.y - gArrow.position.y;
        const targetAngle = Math.atan2(dy, dx) - GREEN_BASE_ANGLE;
        if (!gArrow.plugin.hoppingUntil || performance.now() > gArrow.plugin.hoppingUntil) { Body.setAngle(gArrow, targetAngle);
  Body.setAngularVelocity(gArrow, 0); }
        // hop when settled
        const spd = Math.hypot(gArrow.velocity.x, gArrow.velocity.y);
        const now2 = performance.now();
        if (spd > 1.5) { greenSettledSince = null; return; }
        if (!greenSettledSince) greenSettledSince = now2;
        if (now2 - greenSettledSince < GREEN_SETTLE_MS) return;
        // arrow hop removed - no autonomous movement
      });
      // bone drag-me hint: swap SVG when bone is within 300px of logo
      const DRAGME_RANGE = 300;
      const imgBone = getImg("__bone", "/big-bone.svg");
      const imgDragMe = getImg("__bone_dragme", "/big-bone-dragme.svg");
      const imgOhYea = getImg("__bone_ohyea", "/big-bone-ohyea.svg");
      Events.on(engine, "beforeUpdate", () => {
        const allB = getBodies();
        const bones = allB.filter((b: any) => b.plugin?.prop === "bone");
        if (!logoBody || fused) {
          // revert all bones to plain SVG when logo is gone or fused
          bones.forEach((b: any) => { b.plugin.img = imgBone; });
          return;
        }
        const bone = nearestBone(logoBody);
        if (!bone) return;
        const dist = Math.hypot(bone.position.x - logoBody.position.x, bone.position.y - logoBody.position.y);
        bones.forEach((b: any) => { b.plugin.img = (b === bone && dist <= DRAGME_RANGE) ? imgDragMe : imgBone; });
      });
      window.addEventListener("mouseup", releaseHeldPct);
      // How-it-works pieces: when the popup closes it sends each piece's on-screen
      // rect; we drop a body at that spot that falls straight down, +500 each.
      const onHowToPlayDrop = (ev: any) => {
        const pieces = ev?.detail?.pieces;
        if (!Array.isArray(pieces) || !stageRef.current) return;
        const sr = stageRef.current.getBoundingClientRect();
        // Spawn one Instructions card per step card, at each step card's screen position.
        // Each card uses the step's image and links to its lineage entry by name.
        const INSTR_META: { name: string; label: string; img: string }[] = [
          { name: "Deal the cards",    label: "DEAL THE CARDS",    img: "/step1-redue.jpg" },
          { name: "Head outside",      label: "HEAD OUTSIDE",      img: "/step2-redue.jpg" },
          { name: "Spot real dogs",    label: "SPOT REAL DOGS",    img: "/step3-redue.jpg" },
          { name: "Match to your chum",label: "MATCH YOUR CHUM",   img: "/step4-redue.jpg" },
          { name: "Find more chums",   label: "FIND MORE CHUMS",   img: "/step5-redue.jpg" },
          { name: "Most chums wins",   label: "MOST CHUMS WINS",   img: "/step6-redue.jpg" },
        ];
        const stepPieces = pieces.filter((pc: any) => pc.kind === "stepcard");
        // Remove old HowToPlay step cards from the pit -- they're replaced by instruction cards
        Composite.allBodies(engine.world)
          .filter((b: any) => b.plugin?.kind === "stepcard")
          .forEach((b: any) => { Composite.remove(engine.world, b); });

        stepPieces.forEach((pc: any, idx: number) => {
          const meta = INSTR_META[idx];
          if (!meta) return;
          const alreadyExists = Composite.allBodies(engine.world).find((b: any) => b.plugin?.name === meta.name && b.plugin?.isInstructions);
          if (alreadyExists) return;
          const instrImg = getImg("__instr_" + idx, meta.img);
          // Match LineageMap portrait dimensions: IW=170, IH=round(170*1.36)=231
          const instrW = Math.round(128 * 1.33) * SCALE; // 170 on desktop
          const instrH = Math.round(instrW * 1.36); // 231 on desktop
          const cr = Math.max(7, instrW * 0.1);
          const icx = pc.x + pc.w / 2 - sr.left;
          const icy = pc.y + pc.h / 2 - sr.top;
          const instrB: any = Bodies.rectangle(icx, icy, instrW, instrH, {
            chamfer: { radius: cr }, restitution: 0.32, friction: 0.28, frictionAir: 0.012, density: 0.001, render: { visible: false },
          });
          instrB.plugin = { name: meta.name, label: meta.label, half: Math.min(instrW, instrH) / 2, w: instrW, h: instrH, corner: cr, color: "#ffed00", family: null, img: instrImg, ping: 0, seq: idx + 1, isInstructions: true };
          Body.setVelocity(instrB, { x: (Math.random() - 0.5) * 2, y: 3 });
          Composite.add(engine.world, instrB);
        });
        const HTP_NAMES = ["Deal the cards","Head outside","Spot real dogs","Match to your chum","Find more chums","Most chums wins"];
        const MAX_CARD = BIG * 2.2; // cap cards to a sensible pit size regardless of overlay dimensions
        let stepcardIdx = 0;
        pieces.forEach((pc: { src: string; x: number; y: number; w: number; h: number; kind?: string }) => {
          const cx = pc.x + pc.w / 2 - sr.left, cy = pc.y + pc.h / 2 - sr.top;
          let pw = Math.max(20, pc.w), ph = Math.max(20, pc.h);
          // Scale step cards down if they're coming from a large overlay
          if (pc.kind === "stepcard" && pw > MAX_CARD) {
            const scale = MAX_CARD / pw;
            pw = MAX_CARD; ph = ph * scale;
          }
          let b: any;
          if (pc.kind === "circle") {
            // Scale circle to match card size proportionally
            const r = Math.min(pw / 2, MAX_CARD * 0.24); // 33% bigger than before
            b = Bodies.circle(cx, cy, r, { restitution: 0.5, friction: 0.3, frictionAir: 0.006, density: 0.0007, render: { visible: false } });
            b.plugin = { name: "How to play", label: "", half: r, w: r * 2, h: r * 2, color: "#009fe0", img: getImg("htp:blue-circle", "/blue-circle.svg"), prop: "logopiece", family: null, ping: 0, kind: "htpcircle" };
          } else if (pc.kind === "number") {
            // Yellow number SVG -- small circle body
            const r = Math.min(pw / 2, MAX_CARD * 0.08); // 33% smaller than before
            b = Bodies.circle(cx, cy, r, { restitution: 0.6, friction: 0.2, frictionAir: 0.005, density: 0.0005, render: { visible: false } });
            b.plugin = { name: "How to play number", label: "", half: r, w: r * 2, h: r * 2, color: "#ffed00", img: getImg("htp:" + pc.src, pc.src), prop: "logopiece", family: null, ping: 0, kind: "htpnumber" };
          } else if (pc.kind === "stepcard") {
            // Step cards are now replaced by instruction cards -- skip
            return;
            // eslint-disable-next-line no-unreachable
            b = Bodies.rectangle(cx, cy, pw, ph, { chamfer: { radius: Math.min(pw, ph) * 0.12 }, restitution: 0.3, friction: 0.4, frictionAir: 0.012, density: 0.0009, render: { visible: false } });
            const name = HTP_NAMES[stepcardIdx++] || "How it works";
            const isStep5 = pc.src.includes("step5-redue");
            b.plugin = {
              name, label: "", half: Math.min(pw, ph) / 2, w: pw, h: ph,
              color: "#ffffff", img: getImg("htp:" + pc.src, pc.src),
              prop: "logopiece", family: null, ping: 0, kind: "stepcard",
              ...(isStep5 ? {
                cycleImgs: [
                  getImg("htp:/step5-redue.jpg", "/step5-redue.jpg"),
                  getImg("htp:/step5-redue-slide1.jpg", "/step5-redue-slide1.jpg"),
                  getImg("htp:/step5-redue-slide2.jpg", "/step5-redue-slide2.jpg"),
                ],
                cycleIdx: 0,
                cycleAt: performance.now() + 3000,
              } : {}),
            };
          } else {
            // Logo / triangles -- rectangle body preserving natural image size
            const isLogo = pc.src.includes("dogbingo");
            const bw = isLogo ? Math.min(pw, 120) : Math.min(pw, 48);
            const bh = isLogo ? Math.round(bw * 0.65) : bw; // dogbingo ~3:2, triangles square
            b = Bodies.rectangle(cx, cy, bw, bh, { chamfer: { radius: 6 }, restitution: 0.5, friction: 0.3, frictionAir: 0.01, density: 0.0005, render: { visible: false } });
            b.plugin = { name: "How to play", label: "", half: Math.min(bw, bh) / 2, w: bw, h: bh, color: "#ffed00", img: getImg("htp:" + pc.src, pc.src), prop: "logopiece", family: null, ping: 0, kind: "htplogopiece" };
          }
          Composite.add(engine.world, b);
          setScore((s) => s + 500);
        });
      };
      window.addEventListener("pc:howtoplay-drop", onHowToPlayDrop as EventListener);
      // poof the howtoplay object when the overlay closes
      const onHowToPlayClose = () => {
        const all = Composite.allBodies(engine.world);
        const howTo = all.find((b: any) => b.plugin?.kind === "howtoplay");
        if (howTo) { poof(howTo.position.x, howTo.position.y, howTo.plugin.half || 30); Composite.remove(engine.world, howTo); }
      };
      window.addEventListener("pc:close-howtoplay", onHowToPlayClose);
      // poof the specific HTP step card when the user closes the lightbox after viewing it
      const HTP_STEP_NAMES = ["Deal the cards","Head outside","Spot real dogs","Match to your chum","Find more chums","Most chums wins"];
      // onHtpStepViewed removed -- step cards now zoom in place rather than launching StepMap
      const onOfferSuccess = () => {
        const reserve = Composite.allBodies(engine.world).find((b: any) => b.plugin?.kind === "reserve");
        if (reserve) { const ov = preorderReward(score) * 4; numAt(reserve.position.x, reserve.position.y, ov); poof(reserve.position.x, reserve.position.y, reserve.plugin.half || 20); Composite.remove(engine.world, reserve); }
      };
      // poof the union jack when the tick button is pressed on the popup
      const onBritainDismiss = () => {
        const all = Composite.allBodies(engine.world);
        const uj = all.find((b: any) => b.plugin?.kind === "unionjack" && !b.plugin.popped);
        if (uj) { uj.plugin.popped = true; poof(uj.position.x, uj.position.y, uj.plugin.half); Composite.remove(engine.world, uj); }
      };
      window.addEventListener("pc:britain-dismiss", onBritainDismiss);
      // Game over: tag each new body with its spawn time.
      // Game over: only dog breed cards count (no props, logo, buttons, pills)
      // Fires when the average resting Y of dog cards is above 35% of pit height
      // meaning the pile is stacked more than a third of the way up.
      const isDogCard = (b: any) =>
        !b.isStatic &&
        b.plugin &&
        !b.plugin.prop &&       // excludes balls, bones, bowls, logoPieces
        !b.plugin.logo &&       // excludes logo panels
        !b.plugin.kind &&       // excludes menu, buttons, cookies, htpX, stepcard etc
        b.plugin.half > 20;     // excludes tiny scraps

      const spawnTimes = new Map<number, number>(); // kept but only used for dog cards now
      const onAfterAdd = (event: any) => {
        const bodies = event.object?.bodies || (event.object ? [event.object] : []);
        const now = performance.now();
        for (const b of bodies) {
          if (isDogCard(b)) spawnTimes.set(b.id, now);
        }
      };
      let lastFullCheck = 0;
      const startTime = performance.now();
      const MIN_GAME_MS = 120_000; // never trigger game over before 120s
      // Auto game-over at exactly 120s if pit is meaningfully full
      const autoGameOverTimer = window.setTimeout(() => {
        if (disposed || gameOverRef.current) return;
        const pitH = render.canvas.height;
        const allDogs = Composite.allBodies(engine.world).filter(isDogCard);
        if (allDogs.length < 3) return; // barely any dogs -- don't trigger
        const settled = allDogs.filter((b: any) => Math.hypot(b.velocity.x, b.velocity.y) < 1.5);
        const avgY = settled.length > 0 ? settled.reduce((s: number, b: any) => s + b.position.y, 0) / settled.length : pitH;
        if (avgY < pitH * 0.50) { // more lenient threshold at the forced check
          window.dispatchEvent(new CustomEvent("pc:gameover-result", { detail: { stuck: true } }));
        }
      }, MIN_GAME_MS);
      const MAX_SPEED = 40; // cap velocity to prevent ceiling tunnelling
      const onAfterUpdateGO = () => {
        // Clamp extreme velocities -- prevents fast bodies tunnelling through walls
        Composite.allBodies(engine.world).forEach((b: any) => {
          if (b.isStatic || b.plugin?.pop) return;
          const spd = Math.hypot(b.velocity.x, b.velocity.y);
          if (spd > MAX_SPEED) {
            const scale = MAX_SPEED / spd;
            Body.setVelocity(b, { x: b.velocity.x * scale, y: b.velocity.y * scale });
          }
          // Extra: clamp extreme upward velocity specifically (ceiling escapes)
          if (b.velocity.y < -30) Body.setVelocity(b, { x: b.velocity.x, y: -30 });
        });
        const now = performance.now();
        if (now - lastFullCheck < 10000) return; // check every 10s only
        lastFullCheck = now;
        if (now - startTime < MIN_GAME_MS) return; // never trigger before 120s
        const pitH = render.canvas.height;
        const allDogs = Composite.allBodies(engine.world).filter(isDogCard);
        if (allDogs.length < 10) return; // need at least 6 dog cards in pit before checking
        // Only count settled dogs (low velocity)
        const settled = allDogs.filter((b: any) => Math.hypot(b.velocity.x, b.velocity.y) < 1.5);
        if (settled.length < 8) return; // need 5 settled
        // Average Y of settled dogs -- lower Y = higher up in pit
        const avgY = settled.reduce((s: number, b: any) => s + b.position.y, 0) / settled.length;
        // If average resting position is in the top 40% of the pit, it is full
        if (avgY < pitH * 0.25) {
          window.dispatchEvent(new CustomEvent("pc:gameover-result", { detail: { stuck: true } }));
        }
        // Refill: if fewer than 8 dog cards in pit and not all breeds have ever
        // been dropped, drop 3 more. Must check `dropped` (every breed index ever
        // spawned, including ones already collected and removed) -- not just what's
        // physically in the world right now, or a collected breed looks "undrawn"
        // the instant its body leaves the world and gets spawned a second time.
        if (allDogs.length < 8) {
          const undrawn = BREEDS.filter((b: any, i: number) => !dropped.has(i));
          const toAdd = undrawn.sort(() => Math.random() - 0.5).slice(0, 3);
          toAdd.forEach((b: any, i: number) => {
            const idx = BREEDS.indexOf(b);
            dropped.add(idx);
            window.setTimeout(() => {
              if (!disposed) Composite.add(engine.world, makeBall(b, idx, stage.clientWidth));
            }, i * 800);
          });
        }
      };
      Events.on(engine.world, "afterAdd", onAfterAdd);
      Events.on(engine, "afterUpdate", onAfterUpdateGO);
      window.addEventListener("pc:offer-success", onOfferSuccess);


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

      // Logo drops on both desktop and mobile -- wait for image to load to avoid white flash
      logoBody = makeLogo(stage.clientWidth, stage.clientHeight);
      const logoImg = logoBody.plugin.img;
      const addLogo = () => {
        if (disposed) return;
        Composite.add(engine.world, logoBody);
        Events.on(engine, "collisionStart", onCollide);
      };
      if (logoImg.complete && logoImg.naturalWidth) {
        addLogo();
      } else {
        logoImg.addEventListener("load", addLogo, { once: true });
      }

      // The menu is the only way into the site menu from the pit, so it loads on
      // both desktop and mobile (unlike the desktop-only logo).
      menuBody = makeMenuFixed(stage.clientWidth);
      Composite.add(engine.world, menuBody);
      Events.on(engine, "collisionStart", onMenuCollide);

      // Inert (blue) % circles bind to each other like atoms: the first time two
      // touch, weld a fixed-length link between them, so clusters build up.
      const bonded = new Set<string>();
      const onInertBond = (ev: any) => {
        for (const pair of ev.pairs) {
          const a: any = pair.bodyA, b: any = pair.bodyB;
          if (a.plugin?.kind === "pct" && a.plugin.inert && b.plugin?.kind === "pct" && b.plugin.inert) {
            const key = a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;
            if (bonded.has(key)) continue;
            bonded.add(key);
            Composite.add(engine.world, Constraint.create({ bodyA: a, bodyB: b, length: a.plugin.half + b.plugin.half, stiffness: 0.45, damping: 0.2, render: { visible: false } }));
          }
        }
      };
      Events.on(engine, "collisionStart", onInertBond);

      dropAll();

      // The cookie behaves like a kettle. It sits quiet, then a tremor rises to a
      // steady simmer by ~15s and just holds there (no runaway bouncing off the
      // sides), until one intense burst at ~30s flings its neighbours and it settles
      // buzzTimer removed - cookies no longer buzz, repel or nag

      dispose = () => {
        if (dropTimer) clearInterval(dropTimer);
        if (buzzTimer) clearInterval(buzzTimer);
        waveTimers.forEach(clearTimeout);
        ro.disconnect();
        render.canvas.removeEventListener("mousemove", onMove);
        render.canvas.removeEventListener("mouseleave", onLeave);
        render.canvas.removeEventListener("dblclick", onDbl);
        render.canvas.removeEventListener("mousedown", onDown);
        window.removeEventListener("mouseup", releaseHeldPct);
        window.removeEventListener("pc:howtoplay-drop", onHowToPlayDrop as EventListener);
        window.removeEventListener("pc:britain-dismiss", onBritainDismiss);
        Events.off(engine.world, "afterAdd", onAfterAdd);
        Events.off(engine, "afterUpdate", onAfterUpdateGO);
        render.canvas.removeEventListener("click", onClick);
        render.canvas.removeEventListener("touchstart", onTouchStart);
        render.canvas.removeEventListener("touchend", onTouchEnd);
        window.removeEventListener("devicemotion", onMotion);
        window.removeEventListener("deviceorientation", onOrient);
        motionRef.current = () => {};
        Events.off(render, "afterRender", onAfter);
        Events.off(engine, "collisionStart", onFloorHit);
        Events.off(engine, "collisionStart", onCollide);
        Events.off(engine, "collisionStart", onMenuCollide);
        Events.off(engine, "collisionStart", onInertBond);
        Events.off(engine, "collisionStart", onPctHit);
        Events.off(engine, "collisionStart", onKnockScore);
        Render.stop(render);
        Runner.stop(runner);
        if (dangerTimer) clearTimeout(dangerTimer);
        if (throbIntervalOuter) clearInterval(throbIntervalOuter);
        Composite.clear(engine.world, false);
        Engine.clear(engine);
        if (render.canvas && render.canvas.parentNode) render.canvas.parentNode.removeChild(render.canvas);
        render.textures = {};
        shakeRef.current = () => {};
        removeBreedRef.current = () => {};
        scatterRef.current = () => {};
      };
    })();

    return () => { disposed = true; dispose(); };
  }, []);

  return (
    <section
      className={`${styles.stage}${activeBreed || howToPlay ? " " + styles.dimmed : ""}`}
      ref={stageRef}
      aria-label="The Pack Pit: tip out all the chums and play"
    >
      <div className={styles.pattern} aria-hidden="true" />
      <img className={styles.floor} src={bust("/floor-shortened-svg.svg")} alt="" aria-hidden="true" />
      <div className={styles.controls}>
        <div className={styles.scoreTotal + (scorePulse ? " " + styles.scorePulse : "")} aria-label={`Score: ${score.toLocaleString("en-GB")}`}>{score.toLocaleString("en-GB")}</div>
      </div>
      {!activeBreed && !howToPlay && !gameOver && (
        <button
          type="button"
          className={`${styles.slowmo}${slowmo ? " " + styles.slowmoActive : ""}`}
          onClick={() => { slowmoRef.current(); setSlowmo((s) => !s); }}
          aria-label={slowmo ? "Normal speed" : "Slow motion"}
        >
          <img src="/svg-snail-icon.svg" width="52" height="52" alt="" aria-hidden="true" style={{ display: "block" }} />
        </button>
      )}

      <button ref={shakeBtnRef} type="button" className={styles.shake} onClick={(e) => { motionRef.current(); shakeRef.current(); flashShakeRef.current(); const el = e.currentTarget; el.classList.add(styles.shakeFlash); setTimeout(() => el.classList.remove(styles.shakeFlash), 300); }} aria-label="Shake the pit">
        <span className={styles.shakeIcon} aria-hidden="true" />
        <span className={styles.shakeText}>Shake</span>
      </button>

      {activeBreed && <LineageMap breed={activeBreed} onClose={() => setActiveBreed(null)} onRemove={(name) => { removeBreedRef.current(name); if (!["Deal the cards","Head outside","Spot real dogs","Match to your chum","Find more chums","Most chums wins"].includes(name)) { setCollected((c) => { const next = c + 1; if (next >= 54) { pendingGameOver.current = true; }; return next; }); setCollectedChums((cs) => [...cs, name]); } }} onScatter={(c) => scatterRef.current(c)} onScore={(v) => setScore((s) => s + v)} currentScore={score}  />}
      <HowToPlay open={howToPlay} onClose={() => { setHowToPlay(false); }} />
      {milestone && (
        <div className={styles.milestone} key={milestone.id} aria-hidden="true">
          {Array.from({ length: 30 }).map((_, i) => {
            const ang = (i / 30) * Math.PI * 2 + (i % 3) * 0.35;
            const dist = 150 + ((i * 53) % 120);
            const dx = Math.cos(ang) * dist;
            const dy = Math.sin(ang) * dist + 50; // a touch of gravity in the splash
            const colors = ["#1497d6", "#2bb4ee", "#ffd23e", "#fff8e6", "#ff5d97", "#ffffff"];
            const st = {
              background: colors[i % colors.length],
              borderRadius: i % 4 === 0 ? "50%" : "2px",
              animationDelay: `${(i % 6) * 0.03}s`,
              "--dx": `${dx.toFixed(0)}px`,
              "--dy": `${dy.toFixed(0)}px`,
              "--rot": `${(i % 2 ? 1 : -1) * (180 + ((i * 47) % 360))}deg`,
            } as CSSProperties;
            return <span key={i} className={styles.milestoneConf} style={st} />;
          })}
          <div className={styles.milestoneCard}>
            <span className={styles.milestoneLabel}>{milestone.label}</span>
            <span className={styles.milestoneValue}>{milestone.value.toLocaleString("en-GB")}</span>
          </div>
        </div>
      )}
      {collected > 0 && (
        <div className={styles.tally} key={collected} aria-live="polite" aria-label={`${collected} chums collected`}>
          <button type="button" className={styles.tallyChip} aria-label="Chums collected">
            <svg className={styles.tallyBurst} viewBox="-60 -60 120 120" aria-hidden="true">
              {Array.from({ length: 16 }).map((_, i) => {
                const a = (i / 16) * Math.PI * 2, r1 = 24, r2 = i % 2 === 0 ? 52 : 38;
                return <line key={i} x1={Math.cos(a) * r1} y1={Math.sin(a) * r1} x2={Math.cos(a) * r2} y2={Math.sin(a) * r2} stroke="#ff2d78" strokeWidth={3.5} strokeLinecap="round" />;
              })}
              {Array.from({ length: 5 }).map((_, i) => {
                const a = (i / 5) * Math.PI * 2 + 0.4, rr = 46;
                return <circle key={`s${i}`} cx={Math.cos(a) * rr} cy={Math.sin(a) * rr} r={4.5} fill="#ff5d97" />;
              })}
            </svg>
            <span className={styles.tallyNum}>{collected}</span>
            <span className={styles.tallyPlusOne} aria-hidden="true">+1</span>
          </button>
        </div>
      )}
      {dockOpen && collectedChums.length > 0 && (() => {
        const dockBreeds = [...collectedChums].reverse().map((name, i) => {
          const b = breeds.find((x) => x.name === name);
          return { name, img: b ? b.image : "", idx: i };
        });
        return (
          <div className={styles.chumDock} onClick={() => setDockOpen(false)}>
            <div className={styles.chumDockInner} onClick={(e) => e.stopPropagation()}>
              {dockBreeds.map((c, i) => {
                const isHov = dockHover === i;
                const isFlipped = dockFlipped.has(i);
                const offset = i * 48;
                const scale = isHov ? 1.5 : 1;
                const lift = isHov ? -60 : 0;
                return (
                  <div
                    key={c.idx}
                    className={`${styles.chumDockCard} ${isFlipped ? styles.chumDockCardFlipped : ""}`}
                    style={{ transform: `translateX(${offset}px) translateY(${lift}px) scale(${scale})`, zIndex: isHov ? 10 : i, transition: "transform 0.3s cubic-bezier(0.22,1,0.36,1)", marginRight: "-24px" }}
                    onMouseEnter={() => setDockHover(i)}
                    onMouseLeave={() => setDockHover(null)}
                    onClick={(e) => { e.stopPropagation(); setDockFlipped((s) => { const x = new Set(s); x.has(i) ? x.delete(i) : x.add(i); return x; }); }}
                  >
                    <div className={styles.chumDockFront}>
                      {c.img ? <img src={bust(c.img)} alt={c.name} /> : <div style={{ width: "100%", height: "100%", background: "#0a3a57" }} />}
                    </div>
                    <div className={styles.chumDockBack}>
                      <span>{c.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
      {britainMsg !== null && (() => {
        // find the union jack body so the tick button can poof it
        const ujBody = typeof window !== "undefined"
          ? (() => { try { const all = (window as any).__matter_world_bodies; return all ? all.find((b: any) => b.plugin?.kind === "unionjack" && !b.plugin.popped) : null; } catch { return null; } })()
          : null;
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <div style={{ position: "relative", pointerEvents: "auto", maxWidth: "clamp(320px,45vw,680px)", width: "90%", padding: "clamp(24px,3vw,48px) clamp(28px,4vw,56px) clamp(36px,5vw,64px)", borderRadius: "24px", background: "rgba(255,255,255,0.12)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "2px solid rgba(255,255,255,0.35)", boxShadow: "0 16px 48px rgba(10,58,87,0.28)", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-display,'Luckiest Guy',system-ui)", fontSize: "clamp(20px,3.4vw,44px)", color: "#ffffff", margin: "0 0 clamp(12px,2vw,24px)", textShadow: "0 3px 0 rgba(10,58,87,0.5), 0 0 20px rgba(255,255,255,0.15)", letterSpacing: "0.02em" }}>Designed &amp; Printed in Britain</p>
              <p style={{ fontFamily: "Montserrat,sans-serif", fontSize: "clamp(13px,1.6vw,20px)", fontWeight: 600, color: "#ffffff", margin: "0 0 clamp(8px,1.2vw,16px)", lineHeight: 1.6, opacity: 0.92 }}>Every card in the Pedigree Chums deck is printed right here in Britain, using sustainable inks on premium card stock.</p>
              <p style={{ fontFamily: "Montserrat,sans-serif", fontSize: "clamp(13px,1.6vw,20px)", fontWeight: 600, color: "#ffffff", margin: "0", lineHeight: 1.6, opacity: 0.92 }}>Conceived, illustrated and crafted by a British creative team with a passion for dogs.</p>
              <button
                onClick={() => {
                  setBritainMsg(null);
                  // poof the flag via a custom event that PackPit physics loop can hear
                  window.dispatchEvent(new Event("pc:britain-dismiss"));
                }}
                style={{ position: "absolute", bottom: 0, left: "50%", transform: "translate(-50%, 50%)", width: "clamp(52px,6vw,72px)", height: "clamp(52px,6vw,72px)", borderRadius: "50%", border: "4px solid rgba(255,255,255,0.5)", background: "radial-gradient(circle at 38% 35%, #6ee86e, #22b422 55%, #157a15)", boxShadow: "0 4px 16px rgba(10,58,87,0.35), inset 0 2px 4px rgba(255,255,255,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "clamp(22px,3vw,36px)", lineHeight: 1 }}
                aria-label="Got it"
              >
                &#10003;
              </button>
            </div>
          </div>
        );
      })()}
      {shelfOpen && (() => {
        const counts = new Map<string, number>();
        for (const n of collectedChums) counts.set(n, (counts.get(n) || 0) + 1);
        const uniq = [...counts.entries()].map(([name, count]) => {
          const b = breeds.find((x) => x.name === name);
          const cartoon = b ? b.image : "";
          const card = b && breedCard[b.slug] ? breedCard[b.slug] : null; // the real physical card, when we have art for it
          return { name, count, img: card ?? cartoon, isCard: !!card };
        });
        const PER_ROW = 4; // four chums to a shelf (portrait cards need the room)
        const rows: typeof uniq[] = [];
        for (let i = 0; i < uniq.length; i += PER_ROW) rows.push(uniq.slice(i, i + PER_ROW));
        return (
          <div className={styles.shelf} onClick={() => setShelfOpen(false)}>
            <div className={styles.shelfPanel} onClick={(e) => e.stopPropagation()}>
              <button type="button" className={styles.shelfClose} onClick={() => setShelfOpen(false)} aria-label="Close">&times;</button>
              <h2 className={styles.shelfTitle}>Your Pack</h2>
              {uniq.length === 0 ? (
                <p className={styles.shelfEmpty}>No chums collected yet. Open a dog’s family tree and pick your chum.</p>
              ) : (
                <div className={styles.shelfRows}>
                  {rows.map((row, ri) => (
                    <div className={styles.shelfRow} key={ri}>
                      <div className={styles.shelfCards}>
                        {row.map((c) => (
                          <div className={`${styles.shelfCard} ${c.isCard ? styles.shelfCardReal : styles.shelfCardCartoon}`} key={c.name}>
                            {c.img ? <img src={bust(c.img)} alt={c.name} /> : null}
                            {c.count > 1 ? <span className={styles.shelfBadge}>×{c.count}</span> : null}
                          </div>
                        ))}
                      </div>
                      <img className={styles.shelfLedge} src="/shelve-test.svg" alt="" aria-hidden="true" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {false && <GameOver  // moved to about page
        chums={collected}
        score={score}
        allCollected={collected >= 54}
        collectedBreeds={collectedChums.map((name) => {
          const b = breeds.find((x) => x.name === name);
          const card = b ? breedCard[b.slug] : undefined;
          return { name, img: card ?? (b ? b.image : "") };
        })}
      />}
      <div className={styles.rotateGuard} aria-hidden="true">
        <div className={styles.rotateInner}>
          <span className={styles.rotatePhone} />
          <p>Turn your phone upright<br />to keep playing</p>
        </div>
      </div>
    </section>
  );
}