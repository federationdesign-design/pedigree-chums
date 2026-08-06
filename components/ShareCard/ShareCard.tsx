"use client";

import { useEffect, useRef, useState } from "react";
import { buildBoard } from "../../data/dogLeaderboard";
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
 * THE CARD IS PAINTED ONTO SUPPLIED ARTWORK, /myscorecard-empty.jpg, which
 * carries the logo, MY SCORE, the paw pattern and the rounded corners. Only the
 * five live pieces are drawn: the score, the LEVEL label, the level name, the
 * chum rate panel and its value.
 *
 * It began drawn entirely in code and was replaced when the designed card
 * arrived. The positions are not estimates: the filled card was diffed against
 * its own empty version, so every block sits where the artwork put it.
 */

const W = 1080;
const H = 1345; // the artwork's own size
const CARD_BG = "/sharescreen-empty.jpg";
const SHARE_BTN = "/sharethisbutton.png";
// Measured off the supplied design, not estimated. Rows sit on an even 69px
// pitch, names left at 144, scores right at 859, and the button sits over the
// lower rows exactly as the artwork composites it.
const ROW_BASELINES = [761, 830, 899, 968];
const ROW_LEFT = 144;
const ROW_RIGHT = 859;
const BTN = { x: 241, y: 867, w: 587, h: 317 };
// The separator rules were taken out of the artwork, so they are drawn here.
// Measured off the original: x 155 to 911, 2px, and sitting a consistent 21px
// below each baseline, which matches the even 69px row pitch. Three of them, not
// four: nothing separates the last row from the url bar.
const RULE = { x0: 155, x1: 911, h: 2, drop: 21 };

// Brand tokens, hard-coded because a canvas cannot read a CSS variable.
const NAVY = "#0a3a57";
const CREAM = "#fff8e6";
const BLUE_SKY = "#5cc4ee";
const YELLOW = "#ffd23e";
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
  // The captions are behind the button now. The screen is the thing being
  // posted, so it has to read as the finished card first; the picker is a second
  // step rather than a list sitting under it.
  const [picking, setPicking] = useState(false);
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
        // The background carries the logo, MY SCORE and the paw pattern, so it
        // is drawn first and everything else lands on top of it. It is painted
        // once without it too, so a failed image leaves a readable card rather
        // than a blank one.
        draw(null, null);
        // Two images, and the card is redrawn as each arrives rather than
        // waiting on both: a missing one leaves a readable card instead of a
        // blank one.
        let bgImg: HTMLImageElement | null = null;
        let btnImg: HTMLImageElement | null = null;
        const bg = new window.Image();
        bg.onload = () => { bgImg = bg; if (!dead) draw(bgImg, btnImg); };
        bg.src = CARD_BG;
        const btn = new window.Image();
        btn.onload = () => { btnImg = btn; if (!dead) draw(bgImg, btnImg); };
        btn.src = SHARE_BTN;
      });
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, rate, chums, level, topChum?.image]);

  function draw(bg: HTMLImageElement | null, btn: HTMLImageElement | null) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const BODY = "Montserrat, system-ui, sans-serif";

    if (bg) {
      ctx.drawImage(bg, 0, 0, W, H);
    } else {
      ctx.fillStyle = BLUE_DEEP;
      ctx.fillRect(0, 0, W, H);
    }

    // The SAME rows the on-screen table shows. buildBoard is the one source, so
    // the card can never disagree with the board the player just read.
    const rows = buildBoard(score, "YOU", 3);
    ctx.textBaseline = "alphabetic";
    rows.slice(0, ROW_BASELINES.length).forEach((entry, i2) => {
      const y = ROW_BASELINES[i2];
      ctx.fillStyle = entry.isDog ? NAVY : YELLOW;
      const nm = entry.name.toUpperCase();
      const ns = fitText(ctx, nm, 460, 40, BODY, "700");
      ctx.font = `700 ${ns}px ${BODY}`;
      ctx.textAlign = "left";
      ctx.fillText(nm, ROW_LEFT, y);
      ctx.font = `700 40px ${BODY}`;
      ctx.textAlign = "right";
      ctx.fillText(entry.score.toLocaleString(), ROW_RIGHT, y);
    });

    // the separators, under every row but the last
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ROW_BASELINES.slice(0, -1).forEach((y) => {
      ctx.fillRect(RULE.x0, y + RULE.drop, RULE.x1 - RULE.x0, RULE.h);
    });

    // The button is part of the picture, because the picture is what gets
    // posted. The tap is taken by an HTML button laid over this same box.
    if (btn) ctx.drawImage(btn, BTN.x, BTN.y, BTN.w, BTN.h);
    ctx.textAlign = "center";
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
        {/* The button is drawn INTO the card, because the card is what gets
            posted. This takes the tap, sized as a percentage of the canvas so it
            tracks the artwork at any display size. */}
        <div className={css.cardWrap}>
          <canvas ref={canvasRef} width={W} height={H} className={css.canvas} />
          {/* The button is drawn INTO the card, because the card is what gets
              posted. This takes the tap, sized as a percentage of the canvas so
              it tracks the artwork at any display size. */}
          <button
            type="button"
            className={css.shareThis}
            onClick={() => setPicking((o) => !o)}
            aria-expanded={picking}
            aria-label="Share this"
            title="Share this"
          />

          {picking && (
            <>
              {/* A tap anywhere else closes it, the way the name generator's
                  popout does. */}
              <div className={css.backdrop} onClick={() => setPicking(false)} />
              <div role="menu" className={css.menu}>
                <p className={css.menuTitle}>Pick a caption to share</p>
                <div className={css.menuScroll}>
                  {captionsFor(rate).map((fn, i) => (
                    <button
                      key={i}
                      type="button"
                      role="menuitem"
                      className={css.caption}
                      disabled={busy}
                      onClick={() => { setPicking(false); shareWith(fn(props)); }}
                    >
                      <span className={css.captionText}>{fn(props)}</span>
                      <span className={css.captionTags}>{TAG}</span>
                    </button>
                  ))}
                </div>
                <span className={css.menuTail} aria-hidden="true" />
              </div>
            </>
          )}
        </div>

        {note && <p className={css.note}>{note}</p>}
      </div>
    </div>
  );
}
