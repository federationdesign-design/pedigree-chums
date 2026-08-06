"use client";

import { useEffect, useRef, useState } from "react";
import css from "./ShareCard.module.css";

/**
 * The mini pit's share view. Designed and signed off on 31 July, built here.
 *
 * AN OVERLAY, NOT A ROUTE, and that was the decision rather than an accident.
 * The game over screen holds live state: the score, this round's chum rate, the
 * run average and topChum with its picture. A route change loses all of it
 * unless it is pushed through the URL or into a store, which is real work and a
 * real bug surface. A genuine URL was priced separately and rejected: nobody
 * deep-links to their own game over screen.
 *
 * THE CARD IS DRAWN ENTIRELY IN CODE. No background jpg, so there is no asset to
 * ship, nothing to wait on, it stays crisp at any size and it can never fall
 * back to a broken image. 1080 x 1350, four by five portrait, which is the
 * biggest footprint on an Instagram feed and crops square safely.
 */

const W = 1080;
const H = 1350;

// Brand tokens, hard-coded because a canvas cannot read a CSS variable.
const NAVY = "#0a3a57";
const CREAM = "#fff8e6";
const YELLOW = "#ffd23e";
const BLUE_SKY = "#5cc4ee";
const BLUE_DEEP = "#0b78bd";

const TAG = "#PedigreeChums #DogsOfBritain pedigreechums.co.uk";

export type ShareCardProps = {
  score: number;
  /** whole number, no percent sign: the captions add their own */
  rate: number;
  chums: number;
  level: string;
  topChum?: { name: string; image: string; count: number } | null;
  onClose: () => void;
};

/**
 * Three sets, picked by how the round went. Steve's own copy, shipped as
 * written, casual spelling and all.
 *
 * The thresholds are the only invented part. HIGH is his: over 79. The line
 * between doing well and doing badly was not specified, so it sits at 40 and is
 * one number to move.
 */
const RATE_HIGH = 79; // above this, the bragging set
const RATE_OK = 40; // at or above this, the positive set; below it, the rueful one

type Caption = (p: ShareCardProps) => string;

const POSITIVE: Caption[] = [
  (p) => `I got ${p.score.toLocaleString()} and collected ${p.chums} dogs. Beat that.`,
  (p) => `I don't really know what went on but I got a chum rate of ${p.rate}%`,
  (p) => `I like dogs, I know because I scored ${p.score.toLocaleString()}. BTW my chum rate was ${p.rate}%`,
  (p) => `Turns out the sausage dog's granny is a ${p.level}. Points for me.`,
  (p) => `${p.rate}% chum rate. I am basically a professional dog spotter now.`,
];

const NEGATIVE: Caption[] = [
  (p) => `I am bad at this! got ${p.score.toLocaleString()} and collected ${p.chums} dogs. Beat that if you can`,
  (p) => `I don't really know what went on but I got a chum rate of ${p.rate}%`,
  (p) => `I like dogs, but clicking them is not for me, I scored ${p.score.toLocaleString()}. BTW my chum rate was ${p.rate}%`,
  (p) => `Turns out the sausage dog's granny is a ${p.level}. Points for me.`,
  (p) => `${p.rate}% chum rate. I have to up them rookie numbers`,
];

const HIGH: Caption[] = [
  (p) => `${p.rate}% chum rate. Im popular with dogs`,
  (p) => `I am good at this! got ${p.score.toLocaleString()} and collected ${p.chums} chums. Beat that if you can`,
  (p) => `whats a chum rate... im not sure but I got ${p.rate}%`,
  (p) => `I clicked some dogs and the game ended. I had ${p.rate}% chum rate.`,
];

function captionsFor(rate: number): Caption[] {
  if (rate > RATE_HIGH) return HIGH;
  if (rate >= RATE_OK) return POSITIVE;
  return NEGATIVE;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/** Shrink a string until it fits, rather than letting it run off the card. */
function fitText(ctx: CanvasRenderingContext2D, text: string, max: number, size: number, font: string, weight = ""): number {
  let s = size;
  for (let i = 0; i < 40; i++) {
    ctx.font = `${weight} ${s}px ${font}`.trim();
    if (ctx.measureText(text).width <= max) break;
    s -= 2;
    if (s <= 12) break;
  }
  return s;
}

export default function ShareCard(props: ShareCardProps) {
  const { score, rate, chums, level, topChum, onClose } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    // THE FONT HAS TO BE LOADED BEFORE THE FIRST STROKE. The older GameOver card
    // draws without waiting, so on some devices it renders in a fallback face
    // and nobody notices until it is in someone's feed. This is the pattern from
    // KnockoutRound, which does it correctly.
    const luckiestGuy = new FontFace(
      "Luckiest Guy",
      "url(https://fonts.gstatic.com/s/luckiestguy/v22/_gP_1RrxsjcxVyin9l9n_j2RStC3yts.woff2)"
    );
    let dead = false;
    luckiestGuy
      .load()
      .then((f) => document.fonts.add(f))
      .catch(() => {})
      .finally(() => {
        if (dead) return;
        // The portrait is optional, so the card draws either way: it is painted
        // in an onload and again immediately, rather than the draw waiting on an
        // image that may never arrive.
        draw(null);
        if (topChum?.image) {
          const img = new window.Image();
          img.onload = () => { if (!dead) draw(img); };
          img.src = topChum.image;
        }
      });
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, rate, chums, level, topChum?.image]);

  function draw(portrait: HTMLImageElement | null) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const DISP = "Luckiest Guy, system-ui, sans-serif";
    const BODY = "Montserrat, system-ui, sans-serif";

    ctx.fillStyle = NAVY;
    ctx.fillRect(0, 0, W, H);

    // yellow top rule
    ctx.fillStyle = YELLOW;
    ctx.fillRect(0, 0, W, 20);

    // eyebrow, and the level opposite it
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = BLUE_SKY;
    ctx.font = `700 30px ${BODY}`;
    ctx.textAlign = "left";
    ctx.fillText("PEDIGREE CHUMS", 72, 116);
    ctx.textAlign = "right";
    ctx.fillStyle = YELLOW;
    const lvl = level.toUpperCase();
    const lvlSize = fitText(ctx, lvl, 560, 30, BODY, "700");
    ctx.font = `700 ${lvlSize}px ${BODY}`;
    ctx.fillText(lvl, W - 72, 116);

    // FINAL SCORE
    ctx.textAlign = "center";
    ctx.fillStyle = BLUE_SKY;
    ctx.font = `700 40px ${BODY}`;
    ctx.fillText("FINAL SCORE", W / 2, 300);

    // the score, the thing people actually share
    const scoreTxt = score.toLocaleString();
    const scoreSize = fitText(ctx, scoreTxt, W - 160, 210, DISP);
    ctx.font = `${scoreSize}px ${DISP}`;
    ctx.fillStyle = CREAM;
    ctx.fillText(scoreTxt, W / 2, 480);

    // two stat blocks
    const bw = 456, bh = 190, by = 560;
    const blocks: [number, string, string][] = [
      [72, "CHUM RATE", `${rate}%`],
      [W - 72 - bw, "CHUMS FOUND", String(chums)],
    ];
    for (const [bx, label, value] of blocks) {
      ctx.fillStyle = BLUE_DEEP;
      roundRect(ctx, bx, by, bw, bh, 28);
      ctx.fill();
      ctx.fillStyle = BLUE_SKY;
      ctx.font = `700 28px ${BODY}`;
      ctx.fillText(label, bx + bw / 2, by + 62);
      ctx.fillStyle = CREAM;
      const vs = fitText(ctx, value, bw - 60, 92, DISP);
      ctx.font = `${vs}px ${DISP}`;
      ctx.fillText(value, bx + bw / 2, by + 152);
    }

    // the most-caught dog
    if (topChum) {
      const cx = W / 2, cy = 1000, r = 132;
      if (portrait) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();
        // cover, not stretch
        const s = Math.max((r * 2) / portrait.width, (r * 2) / portrait.height);
        const dw = portrait.width * s, dh = portrait.height * s;
        ctx.drawImage(portrait, cx - dw / 2, cy - dh / 2, dw, dh);
        ctx.restore();
      } else {
        ctx.fillStyle = BLUE_DEEP;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = YELLOW;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = BLUE_SKY;
      ctx.font = `700 26px ${BODY}`;
      ctx.fillText("MOST CAUGHT", cx, cy + r + 60);
      ctx.fillStyle = CREAM;
      const nm = topChum.name.toUpperCase();
      const ns = fitText(ctx, nm, W - 200, 58, DISP);
      ctx.font = `${ns}px ${DISP}`;
      ctx.fillText(nm, cx, cy + r + 130);
    }

    // footer
    ctx.fillStyle = YELLOW;
    ctx.fillRect(0, H - 74, W, 74);
    ctx.fillStyle = NAVY;
    ctx.font = `700 34px ${BODY}`;
    ctx.textBaseline = "middle";
    ctx.fillText("pedigreechums.co.uk", W / 2, H - 74 / 2 + 2);
    ctx.textBaseline = "alphabetic";
  }

  async function shareWith(caption: string) {
    if (busy) return;
    setBusy(true);
    setNote(null);
    const text = `${caption}\n\n${TAG}`;
    try {
      const canvas = canvasRef.current;
      const blob = canvas
        ? await new Promise<Blob | null>((res) => canvas.toBlob((b) => res(b), "image/png"))
        : null;
      const file = blob ? new File([blob], "pedigree-chums-score.png", { type: "image/png" }) : null;
      if (file && navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text });
      } else if (navigator.share) {
        await navigator.share({ text });
      } else {
        // DESKTOP. canShare with files fails on most desktop browsers, so the
        // card is downloaded and the caption copied, which is the same fallback
        // the name generator uses.
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "pedigree-chums-score.png";
          a.click();
          URL.revokeObjectURL(url);
        }
        await navigator.clipboard?.writeText(text);
        setNote("Card saved and caption copied");
        window.setTimeout(() => setNote(null), 3000);
      }
    } catch {
      /* the player cancelled the share sheet, which is not an error */
    }
    setBusy(false);
  }

  return (
    <div className={css.wrap} role="dialog" aria-label="Share your score">
      <button type="button" className={css.back} onClick={onClose} aria-label="Back">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M17 4 L7 12 L17 20 Z" fill="currentColor" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        </svg>
      </button>

      <div className={css.inner}>
        <canvas ref={canvasRef} width={W} height={H} className={css.canvas} />

        <div className={css.picker}>
          <p className={css.pickerTitle}>Pick a caption</p>
          {captionsFor(rate).map((fn, i) => (
            <button key={i} type="button" className={css.caption} disabled={busy} onClick={() => shareWith(fn(props))}>
              {fn(props)}
            </button>
          ))}
          {note && <p className={css.note}>{note}</p>}
        </div>
      </div>
    </div>
  );
}
